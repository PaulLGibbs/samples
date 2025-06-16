import { LitElement, html, css } from "lit";

export class DrawExtent extends LitElement {
  static get properties() {
    return {
      view: { attribute: false }
    };
  }

  constructor() {
    super();
    this.view = null;
    this.inputJson = "";
    this.error = "";
    this.drawing = false;
    this.graphic = null;
    this.sketch = null;
    this.graphicsLayer = null;
    this.GraphicClass = null;
    this.ExtentClass = null;
    this._initialized = false;
  }
  static get styles() {
    return css`
      :host {
        display: block;
        box-sizing: border-box;
        color: black;
        background: white;
        border-radius: 8px;
        border: 1px solid #ccc;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        padding: 12px 18px 16px 18px;
        font-size: 14px;
        user-select: text;
        max-width: 600px;
        min-width: 320px;
      }
      textarea {
        width: 100%;
        margin-bottom: 10px;
        height: 100px;
        font-family: monospace;
        white-space: pre;
        overflow-wrap: normal;
      }
      calcite-button {
        margin-right: 6px;
        margin-bottom: 6px;
      }
      .error {
        color: #d42a2a;
        font-size: 14px;
        margin: 8px 0;
      }
      calcite-label {
        display: block;
        margin-bottom: 10px;
        --calcite-label-margin-bottom: 10px;
      }
    `;
  }
  async _initSketchAndLayer() {
    // Always use the current visible view, and only if this component is inside that view's DOM
    const mapElement = document.querySelector("arcgis-map");
    const sceneElement = document.querySelector("arcgis-scene");
    let currentView = null;
    let isInMap = false;
    let isInScene = false;
    let parent = this.parentElement;
    while (parent) {
      
      if (parent === mapElement) isInMap = true;
      if (parent === sceneElement) isInScene = true;
      parent = parent.parentElement;
    }
    if (isInMap && mapElement && mapElement.style.display !== "none" && mapElement.view) {
      currentView = mapElement.view;
    } else if (isInScene && sceneElement && sceneElement.style.display !== "none" && sceneElement.view) {
      currentView = sceneElement.view;
    } else {
      // Not in a visible view, do not initialize
      return;
    }
    if (!currentView || this._initialized) return;
    // Defensive: ensure currentView.map exists before proceeding
    if (!currentView.map) {
      // Defensive: ensure currentView.watch is a function before using it
      if (typeof currentView.watch !== "function") {
        // View is not ready or not a valid view instance
        return;
      }
      // Wait for the map to be ready before initializing
      const handle = currentView.watch("map", async (mapVal) => {
        if (mapVal) {
          handle.remove();
          await this._initSketchAndLayer();
        }
      });
      return;
    }
    this.view = currentView;
    this._initialized = true;
    try {
      const [GraphicsLayer, Sketch, Graphic, Extent] = await Promise.all([
        import("@arcgis/core/layers/GraphicsLayer"),
        import("@arcgis/core/widgets/Sketch"),
        import("@arcgis/core/Graphic"),
        import("@arcgis/core/geometry/Extent")
      ]);
      this.GraphicClass = Graphic.default;
      this.ExtentClass = Extent.default;
      this.graphicsLayer = new GraphicsLayer.default();
      this.view.map.add(this.graphicsLayer);
      this.sketch = new Sketch.default({
        view: this.view,
        layer: this.graphicsLayer,
        creationMode: "single",
        availableCreateTools: ["rectangle"],
        visibleElements: {
          createTools: {
            point: false,
            polyline: false,
            polygon: false,
            circle: false
          }
        }
      });
      this.sketch.on("create", this._handleSketchCreate.bind(this));
      this.sketch.visible = false;
      this.view.ui.add(this.sketch, "top-right");
    } catch (error) {
      console.error("Error initializing sketch widget:", error);
      this.error = "Failed to initialize drawing tools";
    }
  }

  async firstUpdated() {
    // Always re-initialize for the current visible view
    this._initialized = false;
    await this._initSketchAndLayer();
  }

  async _handleSketchCreate(evt) {
    if (evt.state === "complete") {
      this.clearGraphics();
      // Remove from Sketch widget's layer (edit mode) if present
      if (this.sketch && this.sketch.layer && evt.graphic && this.sketch.layer.graphics.includes(evt.graphic)) {
        this.sketch.layer.remove(evt.graphic);
      }
      this.sketch.visible = false;
      // Always add a static graphic (never in edit mode)
      if (this.graphicsLayer && evt.graphic && evt.graphic.geometry) {
        try {
          const [Graphic] = await Promise.all([
            import("@arcgis/core/Graphic"),
          ]);
          const staticGraphic = new Graphic.default({
            geometry: evt.graphic.geometry.clone(),
            symbol: evt.graphic.symbol,
            popupTemplate: {
              title: "Drawn Extent",
              content: `<pre>${JSON.stringify(evt.graphic.geometry.toJSON(), null, 2)}</pre>`
            }
          });
          this.graphicsLayer.add(staticGraphic);
          this.graphic = staticGraphic;
        } catch (error) {
          console.error("Error creating graphic:", error);
          this.error = "Failed to create extent graphic";
        }
      }
      // Zoom to the drawn extent
      if (this.graphic && this.graphic.geometry && this.view) {
        try {
          if (this.view.type === "3d" && this.graphic.geometry.extent) {
            const extent = this.graphic.geometry.extent;
            await this.view.goTo({
              target: extent,
              tilt: 0,
              heading: 0
            });
          } else {
            await this.view.goTo(this.graphic.geometry);
          }
        } catch (error) {
          console.error("Error navigating to extent:", error);
        }
      }
      this.dispatchExtent();
      this.drawing = false;
      this.requestUpdate();
      // Always open popup for the static graphic and exit edit mode
      if (this.view && this.graphic) {
        // Robust popup location for both 2D and 3D
        let popupLocation = null;
        if (this.graphic.geometry.type === "extent") {
          // Use center for extent
          popupLocation = this.graphic.geometry.center;
        } else if (this.graphic.geometry.type === "polygon" && this.graphic.geometry.centroid) {
          popupLocation = this.graphic.geometry.centroid;
        } else if (this.graphic.geometry.type === "point") {
          popupLocation = this.graphic.geometry;
        } else if (this.graphic.geometry.extent && this.graphic.geometry.extent.center) {
          popupLocation = this.graphic.geometry.extent.center;
        }
        if (!popupLocation && this.graphic.geometry.center) {
          popupLocation = this.graphic.geometry.center;
        }
        if (!popupLocation) {
          popupLocation = this.graphic.geometry;
        }
        if (this.view.popup && typeof this.view.popup.open === "function") {
          this.view.popup.open({
            features: [this.graphic],
            location: popupLocation
          });
        } else if (typeof this.view.openPopup === "function") {
          this.view.openPopup({
            features: [this.graphic],
            location: popupLocation
          });
        }
      }
    }
  }
  async updated(changedProperties) {
    if (changedProperties.has("view")) {
      // Clean up everything from previous view
      if (changedProperties.get("view")) {
        const oldView = changedProperties.get("view");
        if (this.graphicsLayer && oldView && oldView.map && oldView.map.layers.includes(this.graphicsLayer)) {
          oldView.map.remove(this.graphicsLayer);
        }
        if (this.sketch && oldView && oldView.ui && oldView.ui._components && Array.from(oldView.ui._components).includes(this.sketch)) {
          oldView.ui.remove(this.sketch);
        }
      }
      this.clearGraphics();
      this.GraphicClass = null;
      this.ExtentClass = null;
      this._initialized = false;
      this.drawing = false;
      // Instead of calling this.firstUpdated(), directly await _initSketchAndLayer
      if (this.view) {
        await this._initSketchAndLayer();
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.drawing = false; // <-- Reset drawing flag on attach
    this._onViewReady = (evt) => {
      // Always prefer the visible view
      const mapElement = document.querySelector("arcgis-map");
      const sceneElement = document.querySelector("arcgis-scene");
      let newView = null;
      if (mapElement && mapElement.style.display !== "none" && mapElement.view) {
        newView = mapElement.view;
      } else if (sceneElement && sceneElement.style.display !== "none" && sceneElement.view) {
        newView = sceneElement.view;
      }
      if (this.view !== newView) {
        this.view = newView;
        this.firstUpdated();
      }
      this.requestUpdate();
    };
    // Remove any previous listeners to avoid duplicates
    const mapElement = document.querySelector("arcgis-map");
    const sceneElement = document.querySelector("arcgis-scene");
    if (mapElement) {
      mapElement.removeEventListener("arcgisViewReadyChange", this._onViewReady);
      mapElement.addEventListener("arcgisViewReadyChange", this._onViewReady);
    }
    if (sceneElement) {
      sceneElement.removeEventListener("arcgisViewReadyChange", this._onViewReady);
      sceneElement.addEventListener("arcgisViewReadyChange", this._onViewReady);
    }
    // If already ready, trigger immediately
    setTimeout(() => this._onViewReady(), 0);

    // --- MutationObserver for display changes ---
    this._displayObserver = new MutationObserver(() => {
      this.requestUpdate();
      // Re-initialize when shown in expand
      if (this.offsetParent !== null) {
        this._initialized = false;
        this.firstUpdated();
      }
    });
    if (mapElement) {
      this._displayObserver.observe(mapElement, { attributes: true, attributeFilter: ["style"] });
    }
    if (sceneElement) {
      this._displayObserver.observe(sceneElement, { attributes: true, attributeFilter: ["style"] });
    }
    // Also observe slot changes (for arcgis-expand)
    this._resizeObserver = new window.ResizeObserver(() => {
      if (this.offsetParent !== null) {
        this._initialized = false;
        this.firstUpdated();
      }
    });
    this._resizeObserver.observe(this);
  }

  disconnectedCallback() {
    // Clean up Sketch and GraphicsLayer from the view and DOM
    const mapElement = document.querySelector("arcgis-map");
    const sceneElement = document.querySelector("arcgis-scene");
    if (mapElement) mapElement.removeEventListener("arcgisViewReadyChange", this._onViewReady);
    if (sceneElement) sceneElement.removeEventListener("arcgisViewReadyChange", this._onViewReady);
    if (this.sketch && this.view && this.view.ui) {
      try {
        this.view.ui.remove(this.sketch);
      } catch (e) {}
    }
    if (this.graphicsLayer && this.view && this.view.map) {
      try {
        this.view.map.remove(this.graphicsLayer);
      } catch (e) {}
    }
    if (this._displayObserver) {
      this._displayObserver.disconnect();
      this._displayObserver = null;
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    this.sketch = null;
    this.graphicsLayer = null;
    this.graphic = null;
    this.drawing = false; // <-- Reset drawing flag on detach
    this.view = null;
    super.disconnectedCallback();
  }

  clearGraphics() {
    if (this.graphicsLayer) {
      this.graphicsLayer.removeAll();
    }
    this.graphic = null;
    this.inputJson = "";
    this.error = "";
    this.requestUpdate();
  }

  get activeViewType() {
    // Returns '2d', '3d', or null
    const mapElement = document.querySelector("arcgis-map");
    const sceneElement = document.querySelector("arcgis-scene");
    if (mapElement && mapElement.style.display !== "none" && mapElement.view) {
      return "2d";
    } else if (sceneElement && sceneElement.style.display !== "none" && sceneElement.view) {
      return "3d";
    }
    return null;
  }

  async handleDraw(type) {
    console.log("handleDraw called with type:", type);
    this.error = "";
    this.drawing = true;
    this.requestUpdate();
    // Defensive: always ensure initialization is complete and for the correct view
    const currentViewType = this.activeViewType;
    if (!this.view || this.view.type !== currentViewType) {
      this._initialized = false;
      await this._initSketchAndLayer();
    }
    // Defensive: ensure graphicsLayer is present in the map
    if (this.graphicsLayer && this.view && this.view.map && !this.view.map.layers.includes(this.graphicsLayer)) {
      try { this.view.map.add(this.graphicsLayer); } catch (e) { console.warn("Failed to add graphicsLayer:", e); }
    }
    // Defensive: ensure Sketch is attached to the correct view UI
    if (this.sketch && this.view) {
      if (!this.view.ui._components || !Array.from(this.view.ui._components).includes(this.sketch)) {
        try { this.view.ui.add(this.sketch, "top-right"); } catch (e) { console.warn("Failed to add Sketch to UI:", e); }
      }
      this.sketch.visible = true;
      if (type === "2d" && this.view.type === "2d") {
        console.log("Creating rectangle in 2D view");
        this.sketch.create("rectangle");
      } else if (type === "3d" && this.view.type === "3d") {
        this.sketch.create("polygon");
      }
    } else {
      this.error = "Sketch or view not initialized.";
      this.drawing = false;
      this.requestUpdate();
    }
  }  handleInput(e) {
    // For calcite-textarea, always use e.target.value
    this.inputJson = e.target.value;
    this.requestUpdate();
  }
  async handlePasteExtent() {
    this.error = "";
    // Defensive: always ensure initialization is complete before proceeding
    if (!this.graphicsLayer || !this.GraphicClass || !this.ExtentClass) {
      await this._initSketchAndLayer();
    }
    // Defensive: if still not ready, show error
    if (!this.graphicsLayer || !this.GraphicClass || !this.ExtentClass) {
      this.error = "Required modules not loaded yet. Please try again.";
      this.requestUpdate();
      return;
    }
    if (this.graphicsLayer) {
      this.graphicsLayer.removeAll();
    }
    this.graphic = null;
    // Ensure graphicsLayer is initialized
    if (!this.graphicsLayer) {
      if (this.view && this.GraphicClass && this.ExtentClass) {
        const [GraphicsLayer] = await Promise.all([
          import("@arcgis/core/layers/GraphicsLayer"),
        ]);
        this.graphicsLayer = new GraphicsLayer.default();
        this.view.map.add(this.graphicsLayer);
      } else {
        this.error = "Graphics layer not initialized.";
        this.requestUpdate();
        return;
      }
    }
    // Make sure we have input to work with
    if (!this.inputJson || this.inputJson.trim() === "") {
      this.error = "Please provide JSON for the extent";
      this.requestUpdate();
      return;
    }
    // Validate the JSON input
    let extentObj;
    try {
      let inputText = this.inputJson.trim();
      extentObj = JSON.parse(inputText);
      
      console.log("Parsed extent object:", extentObj);
      
      // Validate that it has all required properties
      if (
        typeof extentObj.xmin !== "number" ||
        typeof extentObj.ymin !== "number" ||
        typeof extentObj.xmax !== "number" ||
        typeof extentObj.ymax !== "number" ||
        !extentObj.spatialReference
      ) {
        throw new Error("Invalid extent JSON. Required properties: xmin, ymin, xmax, ymax, spatialReference");
      }
    } catch (err) {
      console.error("JSON parse error:", err);
      this.error = `Invalid extent JSON: ${err.message}`;
      this.requestUpdate();
      return;
    }
    try {
      // Using the already loaded classes from firstUpdated
      if (!this.ExtentClass || !this.GraphicClass) {
        throw new Error("Required modules not loaded yet. Please try again.");
      }
      // Ensure the spatialReference is an object, not just a number
      let sr = extentObj.spatialReference;
      if (typeof sr === "number") {
        sr = { wkid: sr };
      }
      const extent = new this.ExtentClass({
        xmin: extentObj.xmin,
        ymin: extentObj.ymin,
        xmax: extentObj.xmax,
        ymax: extentObj.ymax,
        spatialReference: sr
      });
      // Remove all graphics before adding new one
      if (this.graphicsLayer) {
        this.graphicsLayer.removeAll();
      }
      this.graphic = new this.GraphicClass({
        geometry: extent,
        symbol: {
          type: "simple-fill",
          color: [0, 0, 0, 0.1],
          outline: { color: [0, 0, 0, 1], width: 2 }
        },
        popupTemplate: {
          title: "Extent from JSON",
          content: `<pre>${JSON.stringify(extent.toJSON(), null, 2)}</pre>`
        }
      });
      this.graphicsLayer.add(this.graphic);
      // Wait for the graphic to be added before opening popup
      await new Promise(resolve => setTimeout(resolve, 100));
      // Zoom to the extent
      if (this.view) {
        await this.view.goTo(extent);
        // Open popup (support both MapView and SceneView)
        let popupLocation = extent.center ? extent.center : extent;
        if (this.view.popup && typeof this.view.popup.open === "function") {
          this.view.popup.open({
            features: [this.graphic],
            location: popupLocation
          });
        } else if (typeof this.view.openPopup === "function") {
          this.view.openPopup({
            features: [this.graphic],
            location: popupLocation
          });
        }
      }
      this.dispatchExtent();
      this.requestUpdate();
      this.drawing = false;
      this.error = "";
    } catch (error) {
      console.error("Error creating extent:", error);
      this.error = "Failed to create extent from JSON";
      this.requestUpdate();
    }
  }

  dispatchExtent() {
    if (!this.graphic) return;
    
    this.dispatchEvent(new CustomEvent("extent-drawn", {
      detail: { extent: this.graphic.geometry.toJSON() },
      bubbles: true,
      composed: true
    }));
  }  render() {
    const activeType = this.activeViewType;
    return html`
      <calcite-panel heading="Draw an Extent" style="background: white;">
        <calcite-label>
          Paste extent JSON or draw on map
          <textarea
            class="extent-textarea"
            placeholder="Paste extent JSON here"
            .value=${this.inputJson}
            @input=${this.handleInput}
            rows="4"
          ></textarea>
        </calcite-label>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
          <calcite-button appearance="outline" @click=${this.handlePasteExtent} icon-start="import">
            Apply JSON
          </calcite-button>
          ${activeType === "2d" ? html`
            <calcite-button 
              appearance="solid" 
              @click=${() => this.handleDraw("2d")} 
              ?disabled=${this.drawing}
              icon-start="${this.drawing ? 'spinner' : 'draw'}"
            >
              Draw on Map
            </calcite-button>
          ` : ""}
          ${activeType === "3d" ? html`
            <calcite-button 
              appearance="solid" 
              @click=${() => this.handleDraw("3d")} 
              ?disabled=${this.drawing}
              icon-start="${this.drawing ? 'spinner' : 'draw'}"
            >
              Draw on Scene
            </calcite-button>
          ` : ""}
          <calcite-button 
            appearance="outline" 
            kind="danger" 
            @click=${this.clearGraphics}
            icon-start="trash"
          >
            Clear
          </calcite-button>
        </div>
        ${this.error ? html`<calcite-notice kind="danger" expanded style="margin-top: 8px;">
          <div slot="message">${this.error}</div>
        </calcite-notice>` : ""}
        <calcite-notice kind="info" expanded style="margin-top: 8px;">
          <div slot="message">
            Draw on the map or paste extent JSON to visualize and zoom to an area.
          </div>
        </calcite-notice>
      </calcite-panel>
    `;
  }
}

customElements.define("draw-extent", DrawExtent);
