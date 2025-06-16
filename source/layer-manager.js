import { LitElement, html, css } from "lit";
import "@esri/calcite-components/dist/components/calcite-button";
import "@esri/calcite-components/dist/components/calcite-input";
import "@esri/calcite-components/dist/components/calcite-list";
import "@esri/calcite-components/dist/components/calcite-list-item";
import "@esri/calcite-components/dist/components/calcite-notice";

class LayerManager extends LitElement {
  static styles = css`
    :host {
      display: block;
      
      left: 50%;
      bottom: 30px;
      transform: translateX(-50%);
      z-index: 40;
      min-width: 350px;
      max-width: 600px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      padding: 12px 18px 16px 18px;
      font-size: 14px;
      user-select: text;
    }
    .layer-list {
      max-height: 220px;
      overflow-y: auto;
      margin-bottom: 10px;
    }
    .layer-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
      border-bottom: 1px solid #eee;
      padding-bottom: 3px;
    }
    .layer-title {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-right: 10px;
    }
    .remove-btn {
      background: #fff;
      color: #e74c3c;
      border: 1px solid #e74c3c;
      border-radius: 4px;
      padding: 2px 10px;
      cursor: pointer;
      font-size: 12px;
      margin-left: 8px;
      transition: background 0.2s, color 0.2s;
    }
    .remove-btn:hover {
      background: #e74c3c;
      color: #fff;
    }
    .extent-btn {
      background: #fff;
      color: #3498db;
      border: 1px solid #3498db;
      border-radius: 4px;
      padding: 2px 10px;
      cursor: pointer;
      font-size: 12px;
      margin-left: 8px;
      transition: background 0.2s, color 0.2s;
    }
    .extent-btn:hover {
      background: #3498db;
      color: #fff;
    }
    .add-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
    }
    input[type="text"] {
      flex: 1;
      padding: 5px 8px;
      font-size: 13px;
      border-radius: 4px;
      border: 1px solid #aaa;
    }
    .add-btn {
      background: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 5px 14px;
      cursor: pointer;
      font-size: 13px;
    }
    .error {
      color: #b00;
      font-size: 12px;
      margin-top: 4px;
    }
    .empty {
      color: #888;
      font-size: 13px;
      text-align: center;
      margin: 12px 0;
    }
  `;

  static properties = {
    view: { attribute: false },
    otherView: { attribute: false },
    layers: { state: true },
    inputUrl: { state: true },
    error: { state: true },
  };

  constructor() {
    super();
    this.view = null;
    this.otherView = null;
    this.layers = [];
    this.inputUrl = "";
    this.error = "";
    this._layersWatcher = null;
    this._otherLayersWatcher = null;
  }

  updated(changedProps) {
    if (changedProps.has("view") && this.view) {
      if (!this.otherView) {
        const globalViews = window.appViews;
        if (globalViews && (globalViews.mapView === this.view || globalViews.sceneView === this.view)) {
          this.otherView = globalViews.mapView === this.view ? globalViews.sceneView : globalViews.mapView;
        }
      }
      this.refreshLayers();
      if (this.view.ui && !this.view.ui.find(w => w === this)) {
        this.view.ui.add(this, "manual");
        this.style.position = "absolute";
        this.style.left = "50%";
        this.style.bottom = "30px";
        this.style.transform = "translateX(-50%)";
      }
      if (this.view.when) {
        this.view.when(() => {
          this.refreshLayers();
        });
      }
      if (this.view.map && this.view.map.layers && !this._layersWatcher) {
        this._layersWatcher = this.view.map.layers.on("change", () => this.refreshLayers());
      }
      setTimeout(() => this.refreshLayers(), 0);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._layersWatcher && this._layersWatcher.remove) this._layersWatcher.remove();
    if (this._otherLayersWatcher && this._otherLayersWatcher.remove) this._otherLayersWatcher.remove();
  }

  refreshLayers() {
    if (!this.view || !this.view.map) {
      this.layers = [];
      return;
    }
    this.layers = this.view.map.layers.toArray();
  }

  async handleAddLayer() {
    this.error = "";
    const url = this.inputUrl.trim();
    if (!url) return;
    let LayerClass;
    // If the url is a FeatureServer layer (ends with /FeatureServer/<layerId>), always use FeatureLayer
    const isFeatureLayerUrl = /\/FeatureServer\/(\d+)(\/?$|\?)/i.test(url);
    try {
      if (isFeatureLayerUrl) {
        LayerClass = (await import("@arcgis/core/layers/FeatureLayer")).default;
      } else {
        let serviceJson = null;
        try {
          const resp = await fetch(url + (url.includes("?") ? "&" : "?") + "f=json");
          if (!resp.ok) throw new Error("Service not found");
          serviceJson = await resp.json();
          if (serviceJson.error) throw new Error(serviceJson.error.message || "Service error");
        } catch (err) {
          this.error = "Could not load service: " + (err && err.message ? err.message : err);
          return;
        }
        if (serviceJson.type === "Feature Layer" || /FeatureServer/i.test(url)) {
          LayerClass = (await import("@arcgis/core/layers/FeatureLayer")).default;
        } else if (serviceJson.type === "Map Service" || /MapServer/i.test(url)) {
          LayerClass = (await import("@arcgis/core/layers/MapImageLayer")).default;
        } else if (serviceJson.type === "Image Service" || /ImageServer/i.test(url)) {
          LayerClass = (await import("@arcgis/core/layers/ImageryLayer")).default;
        } else if (serviceJson.type === "Scene Service" || /SceneServer/i.test(url)) {
          LayerClass = (await import("@arcgis/core/layers/SceneLayer")).default;
        } else if (/VectorTileServer/i.test(url)) {
          LayerClass = (await import("@arcgis/core/layers/VectorTileLayer")).default;
        } else if (/TileServer/i.test(url) || /\/tiles\//i.test(url)) {
          LayerClass = (await import("@arcgis/core/layers/TileLayer")).default;
        } else {
          LayerClass = (await import("@arcgis/core/layers/FeatureLayer")).default;
        }
      }
      const layer = new LayerClass({ url });
      if (this.view && this.view.map) this.view.map.add(layer);
      if (this.otherView && this.otherView.map && !this.otherView.map.layers.find(l => l.url === url)) {
        const otherLayer = new LayerClass({ url });
        this.otherView.map.add(otherLayer);
      }
      if (layer.when) layer.when(() => this.refreshLayers());
      this.inputUrl = "";
    } catch (err) {
      this.error = "Could not add layer: " + (err && err.message ? err.message : err);
    }
  }

  handleInput(e) {
    this.inputUrl = e.target.value;
  }

  handleRemoveLayer(layer) {
    try {
      const url = layer.url;
      if (this.view && this.view.map && url) {
        const match = this.view.map.layers.find(l => l.url === url);
        if (match) this.view.map.layers.remove(match);
      }
      if (this.otherView && this.otherView.map && url) {
        const match = this.otherView.map.layers.find(l => l.url === url);
        if (match) this.otherView.map.layers.remove(match);
      }
      this.refreshLayers();
    } catch (err) {
      this.error = "Could not remove layer: " + (err && err.message ? err.message : err);
    }
  }

  async showLayerExtent(layer) {
    this.error = "";
    if (!layer || !layer.url) return;
    try {
      // Only try to get extent for layers that support queryExtent or have fullExtent
      let extent = null;
      if (typeof layer.queryExtent === "function") {
        const result = await layer.queryExtent();
        extent = result && result.extent ? result.extent : null;
      } else if (layer.fullExtent) {
        extent = layer.fullExtent;
      }
      if (!extent) {
        this.error = "Extent not available for this layer.";
        return;
      }
      // Add a graphic for the extent
      const [Graphic, GraphicsLayer] = await Promise.all([
        import("@arcgis/core/Graphic").then(m => m.default),
        import("@arcgis/core/layers/GraphicsLayer").then(m => m.default)
      ]);
      let graphicsLayer = this.view.map.findLayerById("layer-extent-graphic");
      if (!graphicsLayer) {
        graphicsLayer = new GraphicsLayer({ id: "layer-extent-graphic" });
        this.view.map.add(graphicsLayer);
      }
      graphicsLayer.removeAll();
      const extentGraphic = new Graphic({
        geometry: extent,
        symbol: {
          type: "simple-fill",
          color: [51, 153, 255, 0.08],
          outline: { color: [51, 153, 255, 1], width: 2 }
        },
        popupTemplate: {
          title: "Layer Extent",
          content: `<pre>${JSON.stringify(extent.toJSON(), null, 2)}</pre>`
        }
      });
      graphicsLayer.add(extentGraphic);
      if (this.view.goTo) {
        await this.view.goTo(extent);
      }
      if (this.view.popup && typeof this.view.popup.open === "function") {
        this.view.popup.open({ features: [extentGraphic], location: extent.center });
      }
    } catch (err) {
      this.error = "Could not show extent: " + (err && err.message ? err.message : err);
    }
  }

  render() {
    return html`
      <div class="layer-manager">
        <div class="layer-list">
          ${this.layers.length === 0
            ? html`<div class="empty">No layers available</div>`
            : this.layers.map(
                layer => html`
                  <div class="layer-item">
                    <div class="layer-title">${layer.title || layer.url}</div>
                    <button class="extent-btn" @click="${() => this.showLayerExtent(layer)}">Show Extent</button>
                    <button class="extent-btn" @click="${() => window.open(layer.url, '_blank', 'noopener')}">Show REST Endpoint</button>
                    <calcite-button
                      class="remove-btn"
                      icon-start="trash"
                      size="small"
                      @click="${() => this.handleRemoveLayer(layer)}"
                    >
                      Remove
                    </calcite-button>
                  </div>
                `
              )}
        </div>
        <div class="add-row">
          <calcite-input
            type="text"
            placeholder="Enter layer URL"
            .value="${this.inputUrl}"
            @input="${this.handleInput}"
            scale="s"
          ></calcite-input>
          <calcite-button
            class="add-btn"
            icon-start="plus"
            scale="s"
            @click="${this.handleAddLayer}"
          >
            Add Layer
          </calcite-button>
        </div>
        ${this.error
          ? html`<div class="error">${this.error}</div>`
          : ""}
      </div>
    `;
  }
}

customElements.define("layer-manager", LayerManager);
