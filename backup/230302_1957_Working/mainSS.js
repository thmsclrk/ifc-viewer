import { Color } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { IFCLoader } from "web-ifc-three/IFCLoader";
import { IFCWALLSTANDARDCASE } from "web-ifc";
// import { doSomething } from "./modules/module";

const container = document.getElementById("viewer-container");

const viewer = new IfcViewerAPI({
  container,
  backgroundColor: new Color(0x232323),
});

viewer.IFC.applyWebIfcConfig({
  COORDINATE_TO_ORIGIN: true,
});
// Create grid and axes
viewer.grid.setGrid();
viewer.axes.setAxes();

// Initialise tooltips
const tooltipTriggerList = document.querySelectorAll(
  '[data-bs-toggle="tooltip"]'
);
const tooltipList = [...tooltipTriggerList].map(
  (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
);

// GLOBALS
let currentObj = {};
let alljson = [];
let model = {};
let gridOn = true;
let axesOn = true;

// Demonstration IFC Files
const demoIfcFiles = [
  "../build/assets/ifc/01.ifc",
  "../build/assets/ifc/02.ifc",
  "../build/assets/ifc/03.ifc",
  "../build/assets/ifc/04.ifc",
  "../build/assets/ifc/05.ifc",
];

const demoIfcFileElems = [
  "ifc-demo-one",
  "ifc-demo-two",
  "ifc-demo-three",
  "ifc-demo-four",
  "ifc-demo-five",
];

for (let i = 0; i < demoIfcFileElems.length; i++) {
  const demolink = document.getElementById(demoIfcFileElems[i]);
  demolink.addEventListener("click", () => {
    loadIFC(demoIfcFiles[i]);
  });
}

// GRID TOGGLES
const gridToggle = document.getElementById("grid-toggle");
gridToggle.addEventListener("click", () => {
  if (gridOn == true) {
    viewer.grid.dispose();
    gridOn = false;
  } else {
    viewer.grid.setGrid();
    gridOn = true;
  }
});

// AXES TOGGLE
const axesToggle = document.getElementById("axes-toggle");
axesToggle.addEventListener("click", () => {
  if (axesOn == true) {
    viewer.axes.dispose();
    axesOn = false;
  } else {
    viewer.axes.setAxes();
    axesOn = true;
  }
});

function onProgressFunction(onProgress) {
  // console.log(onProgress.loaded / onProgress.total);
  const text = document.getElementById("progress-text");
  const percent = (onProgress.loaded / onProgress.total) * 100;
  const result = Math.trunc(percent);
  text.innerText = result.toString() + "%";
}

// LOAD IFC
async function loadIFC(url) {
  // The below function references 'viewer', then .IFC which is a new .IfcManager
  model = await viewer.IFC.loadIfcUrl(url, true, onProgressFunction);
  // await viewer.shadowDropper.renderShadow(model.modelID);
  // viewer.context.renderer.postProduction.active = true;

  // console.log(progress);
  // CREATES TREE VIEW
  const ifcProject = await viewer.IFC.getSpatialStructure(model.modelID);
  console.log(ifcProject);
  createTreeMenu(ifcProject);

  console.log(model);
}

// ELEMENT MOUSEOVER
window.onmousemove = async () => await viewer.IFC.selector.prePickIfcItem();

// ELEMENT SELECTION
window.onclick = async () => {
  const result = await viewer.IFC.selector.pickIfcItem(true, true);
  if (!result) {
    viewer.IFC.selector.unpickIfcItems();
    return;
  }

  const { modelID, id } = result;
  console.log(result);

  const props = await viewer.IFC.getProperties(modelID, id, true, true);
  // const propos = await viewer.IFC.getProperties()

  currentObj = props;

  // updatepropertyview(props);
  updatepropertyviewTWO(result);

  // console.log(currentObj);
};

// CLEAR MODELS
const button_resetAll = document.getElementById("button-reset-all");
button_resetAll.addEventListener("click", async () => {
  await viewer.dispose();
  viewer = null;
  viewer = new IfcViewerAPI({
    container,
    backgroundColor: new Color(0x232323),
  });

  viewer.IFC.applyWebIfcConfig({
    COORDINATE_TO_ORIGIN: true,
  });
  // Create grid and axes
  viewer.grid.setGrid();
  viewer.axes.setAxes();
});

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

// SELECT ALL WALLS
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

// SELECT ELEMENT BY ID
const selElemIDButton = document.getElementById("sel-elem-ID");
selElemIDButton.addEventListener("click", async () => {
  // console.log(model);
  const elemExpressId = prompt("Please enter the ExpressID of the element: ");
  console.log(elemExpressId);
  await viewer.IFC.selector.pickIfcItemsByID(
    0,
    [parseInt(elemExpressId)],
    true
  );
});

// ISOLATE AREA FOR PROPERTY VIEW
// const propviewer = document.getElementById("ifc-property-menu-root");

// new function
async function updatepropertyviewTWO(selObject) {
  const propviewer = document.getElementById("ifc-property-view");

  removeAllChildren(propviewer);
  const { modelID, id } = selObject;
  const objectProps = await viewer.IFC.getProperties(modelID, id, true, true);
  // console.log(objectProps);
  const objectPsets = objectProps.psets;

  for (let pset of objectPsets) {
    const psetHeaderNode = document.createElement("h6");
    const psetHeaderNodeText = document.createTextNode(pset.Name.value);
    psetHeaderNode.appendChild(psetHeaderNodeText);
    propviewer.appendChild(psetHeaderNode);

    const tableNode = document.createElement("table");
    const tableHeadNode = document.createElement("thead");
    const tableRowNode = document.createElement("tr");
    const thNodeOne = document.createElement("th");
    const thNodeTwo = document.createElement("th");
    const tableBodyNode = document.createElement("tbody");

    // change class of table node
    tableNode.classList.add("table");
    tableNode.classList.add("table-sm");

    // change attributes
    thNodeOne.setAttribute("scope", "col");
    thNodeTwo.setAttribute("scope", "col");

    // add text to th
    // const thNodeOneText = document.createTextNode("Property");
    // const thNodeTwoText = document.createTextNode("Value");
    // thNodeOne.appendChild(thNodeOneText);
    // thNodeTwo.appendChild(thNodeTwoText);

    // append all nodes back
    tableRowNode.appendChild(thNodeOne);
    tableRowNode.appendChild(thNodeTwo);
    tableHeadNode.appendChild(tableRowNode);
    tableNode.appendChild(tableHeadNode);

    for (let psetItem of pset.HasProperties) {
      const tableFieldRowNode = document.createElement("tr");
      const tableFieldNodeOne = document.createElement("td");
      const tableFieldNodeTwo = document.createElement("td");
      const tableFieldNodeOneText = document.createTextNode(
        psetItem.Name.value
      );
      const tableFieldNodeTwoText = document.createTextNode(
        psetItem.NominalValue.value
      );

      tableFieldNodeOne.appendChild(tableFieldNodeOneText);
      tableFieldNodeTwo.appendChild(tableFieldNodeTwoText);

      tableFieldRowNode.appendChild(tableFieldNodeOne);
      tableFieldRowNode.appendChild(tableFieldNodeTwo);

      tableBodyNode.appendChild(tableFieldRowNode);

      tableNode.appendChild(tableBodyNode);
    }
    propviewer.appendChild(tableNode);
  }
}

// NO LONGER NEEDED
async function updatepropertyview(selObject) {
  // Remove children from selected element
  removeAllChildren(propviewer);

  const { modelID, id } = selObject;

  const objectProps = await viewer.IFC.getProperties(modelID, id, true, true);
  console.log(objectProps);
  const objectPsets = objectProps.psets;

  for (let pset of objectPsets) {
    for (let psetvalue of pset.HasProperties) {
      const tableRowNode = document.createElement("tr");
      propviewer.appendChild(tableRowNode);
      addChildElement(tableRowNode, psetvalue.Name.value, "td");
      addChildElement(tableRowNode, psetvalue.NominalValue.value, "td");
      // addChildElement(tableRowNode, psetvalue.Unit, "td");
    }
  }
}

// NO LONGER NEEDED
function addChildElement(parent, textInsertion, nodeType, classDef = null) {
  const parentElem = parent;
  const node = document.createElement(nodeType);
  if (classDef) {
    node.classList.add(classDef);
  }
  const textnode = document.createTextNode(textInsertion);
  node.appendChild(textnode);
  parentElem.appendChild(node);
}

function removeAllChildren(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

// TREE VIEW

const toggler = document.getElementsByClassName("caret");
for (let i = 0; i < toggler.length; i++) {
  toggler[i].onclick = () => {
    toggler[i].parentElement
      .querySelector(".nested")
      .classList.toggle("active");
    toggler[i].classList.toggle("caret-down");
  };
}

// Spatial tree menu

function createTreeMenu(ifcProject) {
  const root = document.getElementById("tree-root");
  // removeAllChildren(root);
  removeAllChildren(root);
  const ifcProjectNode = createNestedChild(root, ifcProject);
  ifcProject.children.forEach((child) => {
    constructTreeMenuNode(ifcProjectNode, child);
  });
}

function nodeToString(node) {
  return `${node.type} - ${node.expressID}`;
}

function constructTreeMenuNode(parent, node) {
  const children = node.children;
  if (children.length === 0) {
    createSimpleChild(parent, node);
    return;
  }
  const nodeElement = createNestedChild(parent, node);
  children.forEach((child) => {
    constructTreeMenuNode(nodeElement, child);
  });
}

function createNestedChild(parent, node) {
  const content = nodeToString(node);
  const root = document.createElement("li");
  createTitle(root, content);
  const childrenContainer = document.createElement("ul");
  childrenContainer.classList.add("nested");
  root.appendChild(childrenContainer);
  parent.appendChild(root);
  return childrenContainer;
}

function createTitle(parent, content) {
  const title = document.createElement("span");
  title.classList.add("caret");
  title.onclick = () => {
    title.parentElement.querySelector(".nested").classList.toggle("active");
    title.classList.toggle("caret-down");
  };
  title.textContent = content;
  parent.appendChild(title);
}

function createSimpleChild(parent, node) {
  const content = nodeToString(node);
  const childNode = document.createElement("li");
  childNode.classList.add("leaf-node");
  childNode.textContent = content;
  parent.appendChild(childNode);

  childNode.onmouseenter = () => {
    viewer.IFC.selector.prepickIfcItemsByID(0, [node.expressID]);
  };

  childNode.onclick = async () => {
    viewer.IFC.selector.pickIfcItemsByID(0, [node.expressID]);
  };
}

// function setupProgressNotification() {
//   const text = document.getElementById("progress-text");=
//   viewer.IFC.setOnProgress((event) => {
//     const percent = (event.loaded / event.total) * 100;
//     const result = Math.trunc(percent);
//     text.innerText = result.toString();
//   });
// }

// setupProgressNotification();
