import { Color } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { IfcProperties } from "web-ifc-viewer/dist/components/ifc/ifc-properties";
import { IFCLoader } from "web-ifc-three";
import { IFCWALLSTANDARDCASE } from "web-ifc";

const container = document.getElementById("viewer-container");
const viewer = new IfcViewerAPI({
  container,
  backgroundColor: new Color(0xffffff),
});

// GLOBALS
let currentObj = {};
let alljson = [];
let model = {};

// Create grid and axes
viewer.grid.setGrid();
viewer.axes.setAxes();

// LOAD IFC
async function loadIFC(url) {
  // REMOVED AS NOW DEFINE MODEL OUTSIDE LOAD FUNCTION
  //   const model = await viewer.IFC.loadIfcUrl(url);
  model = await viewer.IFC.loadIfcUrl(url);

  await viewer.shadowDropper.renderShadow(model.modelID);
  viewer.context.renderer.postProduction.active = true;
}

// ELEMENT MOUSEOVER
window.onmousemove = async () => await viewer.IFC.selector.prePickIfcItem();

// ELEMENT SELECTION
window.onclick = async () => {
  //   const result = await viewer.IFC.selector.highlightIfcItem(true, true);
  const result = await viewer.IFC.selector.pickIfcItem(true, true);
  // if (!result) return;
  if (!result) {
    // viewer.IFC.selector.unHighlightIfcItems();
    viewer.IFC.selector.unpickIfcItems();
    return;
  }
  const { modelID, id } = result;
  const props = await viewer.IFC.getProperties(modelID, id, true, false);
  currentObj = props;
  console.log(currentObj);
};

// FILE UPLOAD
const input = document.getElementById("file-input");
input.addEventListener(
  "change",
  async (changed) => {
    const ifcURL = URL.createObjectURL(changed.target.files[0]);
    loadIFC(ifcURL);
  },
  false
);

// JSON DOWNLOAD
const jsonexport = document.getElementById("json-export");
jsonexport.addEventListener("click", () => {
  console.log(alljson);
  downloadData(JSON.stringify(alljson));
});

// DOWNLOAD (COPIED FROM SO)
function downloadData(data, filename = "JSONdata.json", type = "text/plain") {
  var file = new Blob([data], { type: type });
  if (window.navigator.msSaveOrOpenBlob)
    // IE10+
    window.navigator.msSaveOrOpenBlob(file, filename);
  else {
    // Others
    var a = document.createElement("a"),
      url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }
}

// ADD ELEMENT TO EXPORT ARRAY
const addToExportButton = document.getElementById("add-to-export");
addToExportButton.addEventListener("click", () => {
  alljson.push(currentObj);
  console.log("Element added to export");
  console.log(currentObj);
  console.log(alljson);
});

// RESET VIEW
const resetViewButton = document.getElementById("reset-view");
resetViewButton.addEventListener("click", () => {
  viewer.IFC.selector.unHighlightIfcItems();
});

// RESET ALL
const resetButton = document.getElementById("reset");
resetButton.addEventListener("click", () => {
  //   TO DO
});

// SELECT ALL Walls
const selAllWallsButton = document.getElementById("sel-all-walls");
selAllWallsButton.addEventListener("click", async () => {
  //   viewer.IFC.selector.unHighlightIfcItems();
  const objs = await viewer.IFC.getAllItemsOfType(
    model.modelID,
    IFCWALLSTANDARDCASE,
    true,
    false
  );
  console.log(objs);
});

// SELECT ALL ELEMENTS #2
const selAllElementsButton = document.getElementById("sel-all-elements");
selAllElementsButton.addEventListener("click", async () => {
  const objs = await viewer.IFC.IfcProperties.getPropertiesaAsBlobs(
    model.modelID
  );
  console.log(objs);
});

// look to https://github.com/IFCjs/web-ifc-viewer/blob/master/viewer/src/components/ifc/ifc-properties.ts for getPropertiesAsBlobs
