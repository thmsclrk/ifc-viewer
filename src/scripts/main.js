import { Color } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { IFCWALLSTANDARDCASE } from "web-ifc";

const container = document.getElementById("viewer-container");

let viewer = new IfcViewerAPI({
  container,
  backgroundColor: new Color(0x232323),
});

// VIEWPORT SETTINGS
function setupViewerOptions() {
  viewer.IFC.applyWebIfcConfig({
    COORDINATE_TO_ORIGIN: true,
  });

  viewer.grid.setGrid();
  viewer.axes.setAxes();
}

setupViewerOptions();

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
  "https://raw.githubusercontent.com/IFCjs/test-ifc-files/main/Revit/TESTED_Simple_project_01.ifc",
  "https://raw.githubusercontent.com/IFCjs/test-ifc-files/main/Revit/TESTED_Simple_project_02.ifc",
  "https://raw.githubusercontent.com/IFCjs/test-ifc-files/main/Revit/rac_advanced_sample_project.ifc",
  "https://raw.githubusercontent.com/IFCjs/test-ifc-files/main/Revit/rst_advanced_sample_project.ifc",
  "https://raw.githubusercontent.com/IFCjs/test-ifc-files/main/Revit/rme_advanced_sample_project.ifc",
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

// PROGRESS BAR
function onProgressFunction(onProgress) {
  const text = document.getElementById("progress-text");
  const percent = (onProgress.loaded / onProgress.total) * 100;
  const result = Math.trunc(percent);
  text.innerText = result.toString() + "%";
}

// LOAD IFC
async function loadIFC(url) {
  model = await viewer.IFC.loadIfcUrl(url, true, onProgressFunction);
  const ifcProject = await viewer.IFC.getSpatialStructure(model.modelID);
  console.log(ifcProject);
  createTreeMenu(ifcProject);
  // console.log(model);
}

// ELEMENT MOUSEOVER
window.onmousemove = async () => await viewer.IFC.selector.prePickIfcItem();

// ELEMENT SELECTION
window.ondblclick = async () => {
  const result = await viewer.IFC.selector.pickIfcItem(true, true);
  if (!result) {
    viewer.IFC.selector.unpickIfcItems();
    return;
  }

  const { modelID, id } = result;
  console.log(result);

  const props = await viewer.IFC.getProperties(modelID, id, true, true);

  currentObj = props;
  updatepropertyview(result);
};

// RESET ALL
const button_resetAll = document.getElementById("button-reset-all");
button_resetAll.addEventListener("click", () => {
  console.log("button clicked");

  viewer.dispose(0);
  clearPanels();

  viewer = new IfcViewerAPI({
    container,
    backgroundColor: new Color(0x232323),
  });

  setupViewerOptions();
});

// CLEAR PANELS
function clearPanels() {
  const root = document.getElementById("tree-root");
  removeAllChildren(root);
  const propviewer = document.getElementById("ifc-property-view");
  removeAllChildren(propviewer);
}

// FILE UPLOAD
const input = document.getElementById("button-file-input");
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
  viewer.IFC.selector.unpickIfcItems();
});

// SELECT BY ELEMENT ID
const selElemIDButton = document.getElementById("button-search-element-id");
selElemIDButton.addEventListener("click", async () => {
  elemSearch();
});

function elemSearch() {
  // console.log(model);
  const idSearch = document.getElementById("search-element-id");
  const searchTerm = idSearch.value;
  // console.log(searchTerm);
  try {
    console.log(searchTerm);
    pickSelItems(searchTerm);
  } catch (error) {
    console.log("Element not found");
  }
}

async function pickSelItems(elemExpressId) {
  await viewer.IFC.selector.pickIfcItemsByID(
    0,
    [parseInt(elemExpressId)],
    true
  );
}

// UPDATE PROPERTY VIEWER
async function updatepropertyview(selObject) {
  const propviewer = document.getElementById("ifc-property-view");

  removeAllChildren(propviewer);

  // try {
  const { modelID, id } = selObject;
  const objectProps = await viewer.IFC.getProperties(modelID, id, true, true);
  console.log(objectProps);
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
    tableNode.classList.add("propTable");

    // change attributes
    thNodeOne.setAttribute("scope", "col");
    thNodeTwo.setAttribute("scope", "col");

    // column headings left blank

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

      let tableFieldNodeTwoText = document.createTextNode("");
      try {
        tableFieldNodeTwoText = document.createTextNode(
          psetItem.NominalValue.value
        );
      } catch (error) {}

      tableFieldNodeOne.appendChild(tableFieldNodeOneText);
      tableFieldNodeTwo.appendChild(tableFieldNodeTwoText);

      tableFieldRowNode.appendChild(tableFieldNodeOne);
      tableFieldRowNode.appendChild(tableFieldNodeTwo);

      tableBodyNode.appendChild(tableFieldRowNode);

      tableNode.appendChild(tableBodyNode);
    }
    propviewer.appendChild(tableNode);
  }
  // } catch (error) {
  //   const errorTextNode = document.createElement("p");
  //   const errorText = document.createTextNode("No properties found");
  //   errorTextNode.appendChild(errorText);
  //   propviewer.appendChild(errorTextNode);
  // }
}

// HELPER - ADD CHILD (NOT USED)
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

// PROPERTY SEARCH
const propertySearch = document.getElementById("property-search");
propertySearch.addEventListener("keyup", () => {
  filterTables();
});

// Table Filter
function filterTables() {
  const input = propertySearch;
  const filteredInput = input.value.toUpperCase();
  const tables = document.getElementsByClassName("propTable");
  console.log(tables);

  for (let ptable of tables) {
    const tr = ptable.getElementsByTagName("tr");
    for (let i = 0; i < tr.length; i++) {
      const td = tr[i].getElementsByTagName("td")[0];
      if (td) {
        const txtValue = td.textContent || td.innerText;
        if (txtValue.toUpperCase().indexOf(filteredInput) > -1) {
          tr[i].style.display = "";
        } else {
          tr[i].style.display = "none";
        }
      }
    }
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
    viewer.IFC.selector.prepickIfcItemsByID(0, [parseInt(node.expressID)]);
  };

  childNode.onclick = async () => {
    // console.log(`element ${node.expressID} selected.`);
    // viewer.IFC.selector.pickIfcItemsByID(0, [node.expressID]);
    pickSelItems(node.expressID);
  };
}
