// ExtentExpand.ts
import { LitElement, html, css } from "lit";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";

export class ExtentExpand extends LitElement {
  static get properties() {
    return {
      view: { attribute: false },
      extentJson: { type: String },
      scale: { type: Number },
    };
  }

  constructor() {
    super();
    this.view = null;
    this.extentJson = "";
    this.scale = null;
    this.extentHandle = null;
    this.scaleHandle = null;
  }

  static get styles() {
    return css`
      /* ─── HOST (container) ─────────────────────────────────────────── */
      :host {
        display: block;
        width: 100%;
        box-sizing: border-box;
        font-size: 13px;
        color: black; /* default text color for everything */
      }

      /* ─── JSON BOX ──────────────────────────────────────────────────── */
      .extent-json {
        color: black;          /* ensure JSON text is black */
        font-family: monospace;
        font-size: 12px;
        background: #f7f7f7;
        padding: 4px 6px;
        border-radius: 4px;
        margin-bottom: 6px;

        max-height: 200px;
        overflow-y: auto;

        word-break: break-all;
        white-space: pre-wrap;
      }

      /* ─── SCALE TEXT ─────────────────────────────────────────────────── */
      .scale {
        color: black;         /* make “Scale:” label black */
        margin-top: 6px;
      }

      .scale b {
        color: black;         /* bolded scale value in black */
      }

      /* ─── CALCITE BUTTON ─────────────────────────────────────────────── */
      calcite-button {
        font-size: 12px;
        padding: 3px 10px;
        border-radius: 4px;
        margin-top: 4px;
        color: black;         /* ensure button text is black */
      }

      /* ─── OVERRIDE CALCITE-PANEL TEXT (header + body) ──────────────── */
      calcite-panel {
        color: black;         /* make the panel’s header & body text black */
      }
      calcite-panel ::slotted(*) {
        color: black;         /* ensure any slotted content stays black */
      }
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    // Once <arcgis-map> fires "arcgisViewReadyChange", grab the view and start watching.
    const mapElement = document.querySelector("arcgis-map");
    mapElement.addEventListener("arcgisViewReadyChange", () => {
      if (mapElement.view) {
        this.view = mapElement.view;
        this._watchExtentAndScale();
        this._updateExtentAndScale();
      }
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._cleanupWatchers();
  }

  _watchExtentAndScale() {
    if (!this.view) {
      return;
    }
    this.extentHandle = reactiveUtils.watch(
      () => this.view.extent,
      () => {
        this._updateExtentAndScale();
      }
    );
    this.scaleHandle = reactiveUtils.watch(
      () => this.view.scale,
      () => {
        this._updateExtentAndScale();
      }
    );
  }

  _cleanupWatchers() {
    this.extentHandle?.remove?.();
    this.scaleHandle?.remove?.();
    this.extentHandle = null;
    this.scaleHandle = null;
  }

  _updateExtentAndScale() {
    if (!this.view) {
      return;
    }
    const extent = this.view.extent;
    if (extent) {
      const { xmin, ymin, xmax, ymax, spatialReference } = extent;
      this.extentJson = JSON.stringify(
        { xmin, ymin, xmax, ymax, spatialReference },
        null,
        2
      );
    }
    this.scale = this.view.scale;
    this.requestUpdate();
  }

  async copyExtent() {
    try {
      await navigator.clipboard.writeText(this.extentJson);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = this.extentJson;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  }

  render() {
    return html`
      <calcite-panel heading="Current Extent" style="background: white;">
        <div class="extent-json">${this.extentJson}</div>
        <calcite-button scale="s" @click=${this.copyExtent}
          >Copy as JSON</calcite-button
        >
        <div class="scale">
          Scale: <b>${this.scale ? Math.round(this.scale) : "N/A"}</b>
        </div>
      </calcite-panel>
    `;
  }
}

customElements.define("extent-expand", ExtentExpand);
