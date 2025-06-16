import { LitElement, html, css } from "lit";
import "@esri/calcite-components/dist/components/calcite-button";

class PrintScreenshotTool extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 1100;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
      padding: 8px 12px;
    }
    calcite-button {
      margin: 0 4px 0 0;
    }
    .screenshot-img {
      max-width: 320px;
      max-height: 180px;
      margin-top: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      display: block;
    }
    .screenshot-cursor { cursor: crosshair !important; }
  `;

  static properties = {
    view: { attribute: false },
    screenshotUrl: { state: true },
    error: { state: true },
    printing: { state: true },
    takingScreenshot: { state: true },
    selectingArea: { state: true },
    area: { state: true },
  };

  constructor() {
    super();
    this.view = null;
    this.screenshotUrl = "";
    this.error = "";
    this.printing = false;
    this.takingScreenshot = false;
    this._maskDiv = null;
    this._dragHandler = null;
    this._area = null;
    this._screenshotMode = false;
  }

  connectedCallback() {
    super.connectedCallback();
    // Try to auto-detect the current view
    setTimeout(() => {
      const mapElement = document.querySelector("arcgis-map");
      const sceneElement = document.querySelector("arcgis-scene");
      if (mapElement && mapElement.style.display !== "none" && mapElement.view) {
        this.view = mapElement.view;
      } else if (sceneElement && sceneElement.style.display !== "none" && sceneElement.view) {
        this.view = sceneElement.view;
      }
      this._setupMaskDiv();
    }, 500);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._removeMaskDiv();
    if (this._dragHandler) {
      this._dragHandler.remove();
      this._dragHandler = null;
    }
  }

  _setupMaskDiv() {
    if (this._maskDiv) return;
    this._maskDiv = document.createElement("div");
    this._maskDiv.style.position = "absolute";
    this._maskDiv.style.background = "rgba(255, 51, 0, 0.1)";
    this._maskDiv.style.border = "2px dashed rgb(255, 51, 0)";
    this._maskDiv.style.pointerEvents = "none";
    this._maskDiv.style.display = "none";
    this._maskDiv.style.zIndex = "9999";
    this._maskDiv.className = "screenshot-mask hide";
    if (this.view && this.view.container) {
      this.view.container.appendChild(this._maskDiv);
    }
  }

  _removeMaskDiv() {
    if (this._maskDiv) {
      if (this._maskDiv.parentNode) this._maskDiv.parentNode.removeChild(this._maskDiv);
      this._maskDiv = null;
    }
  }

  async handleScreenshot() {
    this.error = "";
    this.screenshotUrl = "";
    // Always get the visible SceneView for 3d
    let sceneView = null;
    const sceneEl = Array.from(document.querySelectorAll("arcgis-scene"))
      .find(el => el.style.display !== "none" && el.view && el.view.type === "3d");
    if (sceneEl) {
      sceneView = sceneEl.view;
    }
    if (!sceneView && this.view && this.view.type === "3d") {
      sceneView = this.view;
    }
    if (!this.view && sceneView) this.view = sceneView;
    if (!this.view) {
      this.error = "Map or Scene view not ready";
      return;
    }
    // 3D: take full screenshot immediately
    if (sceneView && sceneView.type === "3d") {
      this.takingScreenshot = true;
      try {
        if (this._maskDiv) this._maskDiv.style.display = "none"; // Hide mask before screenshot
        const screenshot = await sceneView.takeScreenshot({
          format: "png",
          quality: 100
        });
        this.screenshotUrl = screenshot.dataUrl;
      } catch (err) {
        this.error = err.message || "Screenshot failed";
      } finally {
        this.takingScreenshot = false;
      }
    } else {
      // 2D: take full screenshot
      this.takingScreenshot = true;
      try {
        if (this._maskDiv) this._maskDiv.style.display = "none"; // Hide mask before screenshot
        const screenshot = await this.view.takeScreenshot({
          format: "png",
          quality: 100,
          area: null,
          width: 800,
          height: 450
        });
        this.screenshotUrl = screenshot.dataUrl;
      } catch (err) {
        this.error = err.message || "Screenshot failed";
      } finally {
        this.takingScreenshot = false;
      }
    }
  }

  async _takeSceneScreenshot(area) {
    this.takingScreenshot = true;
    let screenshot = null;
    try {
      // Wait for the view to finish rendering
      await this._waitForSceneViewReady();
      // Force a render by calling goTo (no-op)
      if (this.view && this.view.camera) await this.view.goTo(this.view.camera, { animate: false });
      // Ensure area is within bounds and at least 2x2
      const safeArea = {
        x: Math.max(0, Math.min(area.x, this.view.width - 2)),
        y: Math.max(0, Math.min(area.y, this.view.height - 2)),
        width: Math.max(2, Math.min(area.width, this.view.width - area.x)),
        height: Math.max(2, Math.min(area.height, this.view.height - area.y)),
      };
      screenshot = await this.view.takeScreenshot({
        area: safeArea,
        format: "png",
        quality: 100
      });
      // If screenshot is blank/white, fallback to full view
      if (screenshot && screenshot.dataUrl && screenshot.dataUrl.match(/^data:image\/png;base64,iVBORw0KGgoAAAANSUhEUg/)) {
        // Check for all white pixels (quick check: PNG header only)
        // If still white, try full screenshot
        if (safeArea.width !== this.view.width || safeArea.height !== this.view.height) {
          screenshot = await this.view.takeScreenshot({
            format: "png",
            quality: 100
          });
        }
      }
      this.screenshotUrl = screenshot.dataUrl;
      return true;
    } catch (err) {
      this.error = err.message || "Screenshot failed";
      return false;
    } finally {
      this.takingScreenshot = false;
    }
  }

  async _waitForSceneViewReady() {
    // Wait until view.updating and view.rendering are both false
    if (!this.view) return;
    // Wait for the view to be ready
    if (typeof this.view.when === "function") await this.view.when();
    // Wait for rendering/updating to finish
    while (this.view.updating || this.view.rendering) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  _setMaskPosition(area) {
    if (!this._maskDiv) return;
    if (area) {
      this._maskDiv.classList.remove("hide");
      this._maskDiv.style.display = "block";
      this._maskDiv.style.left = `${area.x}px`;
      this._maskDiv.style.top = `${area.y}px`;
      this._maskDiv.style.width = `${area.width}px`;
      this._maskDiv.style.height = `${area.height}px`;
    } else {
      this._maskDiv.classList.add("hide");
      this._maskDiv.style.display = "none";
    }
  }

  handleDownload() {
    if (!this.screenshotUrl) return;
    const a = document.createElement("a");
    a.href = this.screenshotUrl;
    a.download = "map-screenshot.png";
    a.click();
  }

  handlePrint() {
    if (!this.screenshotUrl) return;
    const win = window.open();
    win.document.write(`<img src='${this.screenshotUrl}' style='max-width:100vw;max-height:100vh;'>`);
    win.document.close();
    win.focus();
    win.print();
  }

  render() {
    return html`
      <style>
        .screenshot-cursor { cursor: crosshair !important; }
      </style>
      <calcite-button
        icon-start="print"
        scale="m"
        appearance="solid"
        @click="${this.handlePrint}"
        ?disabled="${!this.screenshotUrl}"
        style="margin-right:8px;"
      >Print</calcite-button>
      <calcite-button
        icon-start="camera"
        scale="m"
        appearance="outline"
        @click="${this.handleScreenshot}"
        ?loading="${this.takingScreenshot || this._screenshotMode}"
      >Screenshot</calcite-button>
      <calcite-button
        icon-start="download"
        scale="m"
        appearance="outline"
        @click="${this.handleDownload}"
        ?disabled="${!this.screenshotUrl}"
      >Download</calcite-button>
      ${this.screenshotUrl
        ? html`<img class="screenshot-img" src="${this.screenshotUrl}" alt="Screenshot preview">`
        : ""}
      ${this.error
        ? html`<div style="color:#b00; font-size:13px; margin-top:6px;">${this.error}</div>`
        : ""}
      ${this._screenshotMode && this.view && this.view.type === "3d"
        ? html`<div style="margin-top:8px;color:#555;font-size:13px;">Drag on the scene to select screenshot area</div>`
        : ""}
    `;
  }
}

customElements.define("print-screenshot-tool", PrintScreenshotTool);
