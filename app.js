import { Color } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { IFCLoader } from "web-ifc-three";

const container = document.getElementById("viewer-container");
const viewer = new IfcViewerAPI({
  container,
  backgroundColor: new Color(0xffffff),
});

// GLOBALS
let currentObj = {};
const alljson = [];

// Create grid and axes
viewer.grid.setGrid();
viewer.axes.setAxes();

const ifcLoader = new IFCLoader();

// LOAD IFC
async function loadIFC(url) {
  const model = await viewer.IFC.loadIfcUrl(url);
  await viewer.shadowDropper.renderShadow(model.modelID);
  viewer.context.renderer.postProduction.active = true;
}

// ELEMENT MOUSEOVER
window.onmousemove = async () => await viewer.IFC.selector.prePickIfcItem();

// ELEMENT SELECTION
window.ondblclick = async () => {
  const result = await viewer.IFC.selector.highlightIfcItem(true, true);
  // if (!result) return;
  if (!result) {
    viewer.IFC.selector.unHighlightIfcItems();
    return;
  }
  const { modelID, id } = result;
  const props = await viewer.IFC.getProperties(modelID, id, true, false);
  currentObj = props;
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
