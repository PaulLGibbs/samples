import "./styles.css";



// Individual imports for each component
import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-legend";
import "@arcgis/map-components/components/arcgis-search";
import "@arcgis/map-components/components/arcgis-expand";
import "@arcgis/map-components/components/arcgis-placement";

import "./extent-expand.js";

const mapElement = document.querySelector("arcgis-map");
mapElement.addEventListener("arcgisViewReadyChange", (event) => {
  console.log("MapView ready", event);

});
