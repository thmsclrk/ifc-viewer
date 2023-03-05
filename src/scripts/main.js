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
let modelAsJson = [];
let alljson = [];
let model = {};
let guidMap = [];
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

// // PROGRESS BAR NOT USED
// function onProgressFunction(onProgress) {
//   const text = document.getElementById("progress-text");
//   const percent = (onProgress.loaded / onProgress.total) * 100;
//   const result = Math.trunc(percent);
//   text.innerText = result.toString() + "%";
// }

// LOAD IFC
async function loadIFC(url) {
  loadingSpinner(true);

  // model = await viewer.IFC.loadIfcUrl(url, true, onProgressFunction);
  model = await viewer.IFC.loadIfcUrl(url, true);
  const ifcProject = await viewer.IFC.getSpatialStructure(model.modelID);

  // INITIALISATION FUNCTIONS
  // console.log(ifcProject);
  serializeAllProperties(model);
  createTreeMenu(ifcProject);
  elemToString(model.modelID, ifcProject);
  updatePropFilters();

  loadingSpinner(false);
}

// SERIALIZES ALL PROPERTIES
async function serializeAllProperties(model) {
  try {
    modelAsJson = await viewer.IFC.properties.serializeAllProperties(model);
    // console.log(modelAsJson);
  } catch (error) {
    console.log("Unable to serialise all properties.");
    console.log(error);
  }
}

async function elemToString(modelID, elem) {
  const elemprops = await viewer.IFC.getProperties(
    modelID,
    elem.expressID,
    false,
    false
  );

  guidMap.push([elemprops.GlobalId.value, elem.expressID]);
  // console.log(guidMap);
  if (elem.children.length > 0) {
    for (let child of elem.children) {
      elemToString(modelID, child);
    }
  }
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
  const props = await viewer.IFC.getProperties(modelID, id, true, true);

  console.log("Element Selected!", result);
  console.log(props);

  currentObj = props;
  updatepropertyview(result);
  updateNativeProperties(result);
  updateTypeProperties(result);
  updateMaterialProperties(result);
};

// RESET ALL
const button_resetAll = document.getElementById("button-reset-all");
button_resetAll.addEventListener("click", () => {
  // console.log("button clicked");

  viewer.dispose(0);
  clearPanels();
  guidMap = [];

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
  // const propviewer = document.getElementById("ifc-property-view");
  const propviewer = document.getElementsByClassName("ifc-property-view");
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

// SELECT ALL ELEMENTS
const selectAllButton = document.getElementById("button-sel-all");
selectAllButton.addEventListener("click", async () => {
  // console.log(guidMap);
  let elems = [];
  for (let elem of guidMap) {
    elems.push(elem[1]);
  }
  // console.log(elems);
  const pickedItems = await viewer.IFC.selector.pickIfcItemsByID(
    model.modelID,
    elems,
    true
  );
});

// SELECT BY ELEMENT ID
const selElemIDButton = document.getElementById("button-search-element-id");
selElemIDButton.addEventListener("click", async () => {
  const idSearch = document.getElementById("search-element-id");
  const searchTerm = idSearch.value.trim();
  elemSearch(searchTerm, true, true);
});

async function elemSearch(searchTerm, isGuid, toPick = false) {
  // Cannot pick by GUID so will not return
  if (isGuid) {
    try {
      console.log(`Looking for element ${searchTerm}.`);
      for (let item of guidMap) {
        if (item[0] == searchTerm) {
          if (toPick) {
            await pickSelItems(item[1]);
            return;
          } else {
            return item[1];
          }
        }
      }
    } catch (error) {
      console.log("Element not found");
    }
  } else {
    console.log(`Looking for element ${searchTerm}.`);
    for (let item of guidMap) {
      console.log("here");
      if (item[1] == searchTerm) {
        console.log(item[0]);
        return item[0];
      }
    }
  }
}

async function pickSelItems(elemExpressId) {
  await viewer.IFC.selector.pickIfcItemsByID(
    0,
    [parseInt(elemExpressId)],
    true
  );
  // await viewer.IFC.getProperties()
}

// TABLE HELPER FUNCTION, MAKES TABLE FROM LIST OF K:V PAIRS
// ADD CLASS TO TABLE AS REQUIRED FOLLOWING CALL WITH makeTable(propertyList).classList.add("class")
function makeTable(propertyList) {
  const tableNode = document.createElement("table");
  const tableBodyNode = document.createElement("tbody");

  // change class of table node
  tableNode.classList.add("table");
  tableNode.classList.add("table-sm");
  // tableNode.classList.add("propTable"); // USED FOR SEARCH?

  for (let keyValuePair of propertyList) {
    const tableFieldRowNode = document.createElement("tr");
    const tableFieldNodeOne = document.createElement("td");
    const tableFieldNodeTwo = document.createElement("td");
    const tableFieldNodeOneText = document.createTextNode(keyValuePair[0]);
    const tableFieldNodeTwoText = document.createTextNode(keyValuePair[1]);

    tableFieldNodeOne.appendChild(tableFieldNodeOneText);
    tableFieldNodeTwo.appendChild(tableFieldNodeTwoText);
    tableFieldRowNode.appendChild(tableFieldNodeOne);
    tableFieldRowNode.appendChild(tableFieldNodeTwo);
    tableBodyNode.appendChild(tableFieldRowNode);
  }
  tableNode.appendChild(tableBodyNode);
  return tableNode;
}

// UPDATE NATIVE PROPERTIES VIEWER
async function updateNativeProperties(selObject) {
  const propviewer = document.getElementById("props-native-properties");
  removeAllChildren(propviewer);
  try {
    const { modelID, id } = selObject;
    const objectProps = await viewer.IFC.getProperties(modelID, id, true, true);

    let propsList = [];

    delete objectProps.psets;
    delete objectProps.mats;
    delete objectProps.type;

    for (let key in objectProps) {
      // console.log(key);
      let propValue = objectProps[key];
      if (propValue === null || propValue === undefined) propValue = "";
      else if (propValue.value) propValue = propValue.value;

      propsList.push([key, propValue]);
    }

    propviewer.appendChild(makeTable(propsList));
  } catch (error) {
    const errorTextNode = document.createElement("p");
    const errorText = document.createTextNode(
      "No properties found (ref console for error message)."
    );
    errorTextNode.appendChild(errorText);
    propviewer.appendChild(errorTextNode);
    console.log(error);
  }
}

// UPDATE TYPE PROPERTIES VIEWER
async function updateTypeProperties(selObject) {
  const propviewer = document.getElementById("props-type-properties");
  removeAllChildren(propviewer);
  try {
    const { modelID, id } = selObject;
    let objectProps = await viewer.IFC.getProperties(modelID, id, true, true);

    objectProps = objectProps.type[0];

    let propsList = [];

    // delete objectProps.psets;
    // delete objectProps.mats;
    // delete objectProps.type;

    for (let key in objectProps) {
      // console.log(key);
      let propValue = objectProps[key];
      if (propValue === null || propValue === undefined)
        propValue = "undefined";
      else if (propValue.value) propValue = propValue.value;

      propsList.push([key, propValue]);
    }

    propviewer.appendChild(makeTable(propsList));
  } catch (error) {
    const errorTextNode = document.createElement("p");
    const errorText = document.createTextNode(
      "No properties found (ref console for error message)."
    );
    errorTextNode.appendChild(errorText);
    propviewer.appendChild(errorTextNode);
    console.log(error);
  }
}

// UPDATE MATERIAL PROPERTIES VIEWER
async function updateMaterialProperties(selObject) {
  const propviewer = document.getElementById("props-material-properties");
  removeAllChildren(propviewer);
  try {
    const { modelID, id } = selObject;
    let objectProps = await viewer.IFC.getProperties(modelID, id, true, true);

    objectProps = objectProps.mats[0];

    let propsList = [];

    for (let key in objectProps) {
      // console.log(key);
      let propValue = objectProps[key];
      if (propValue === null || propValue === undefined)
        propValue = "undefined";
      else if (propValue.value) propValue = propValue.value;

      propsList.push([key, propValue]);
    }

    propviewer.appendChild(makeTable(propsList));
  } catch (error) {
    const errorTextNode = document.createElement("p");
    const errorText = document.createTextNode(
      "No properties found (ref console for error message)."
    );
    errorTextNode.appendChild(errorText);
    propviewer.appendChild(errorTextNode);
    console.log(error);
  }
}

// UPDATE PSET VIEWER
async function updatepropertyview(selObject) {
  const propviewer = document.getElementById("props-property-sets");
  removeAllChildren(propviewer);

  try {
    const { modelID, id } = selObject;
    const objectProps = await viewer.IFC.getProperties(modelID, id, true, true);
    // console.log(objectProps);
    const objectPsets = objectProps.psets;

    for (let pset of objectPsets) {
      const psetHeaderNode = document.createElement("h6");
      const psetHeaderNodeText = document.createTextNode(pset.Name.value);
      psetHeaderNode.appendChild(psetHeaderNodeText);
      propviewer.appendChild(psetHeaderNode);
      let propList = [];

      for (let psetItem of pset.HasProperties) {
        let keyval = psetItem.Name.value;
        let valval = "";
        try {
          valval = psetItem.NominalValue.value;
        } catch (error) {}

        propList.push([keyval, valval]);
      }
      const table = makeTable(propList);
      table.classList.add("psetPropTable");
      propviewer.appendChild(table);
    }
  } catch (error) {
    const errorTextNode = document.createElement("p");
    const errorText = document.createTextNode("No properties found");
    errorTextNode.appendChild(errorText);
    propviewer.appendChild(errorTextNode);
  }
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
  const tables = document.getElementsByClassName("psetPropTable");
  // console.log(tables);

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

// LOADING SPINNER
function loadingSpinner(tf) {
  const spinner = document.getElementById("loadingSpinner");
  if (tf) {
    spinner.classList.remove("invisible");
    spinner.classList.add("visible");
  } else {
    spinner.classList.remove("visible");
    spinner.classList.add("invisible");
  }
}

// PROPERTY VIEW ON/OFF
const propViewChecks = document.getElementsByClassName("form-check-input");
for (let elem of propViewChecks) {
  elem.addEventListener("click", () => {
    updatePropFilters();
  });
}

function updatePropFilters() {
  let buttons = [];
  let panels = [];

  const nativePropShow = document.getElementById("toggle-native-props");
  const typePropShow = document.getElementById("toggle-type-props");
  const materialPropShow = document.getElementById("toggle-material-props");
  const psetPropShow = document.getElementById("toggle-pset-props");
  const qsetPropShow = document.getElementById("toggle-qset-props");

  buttons.push(
    nativePropShow,
    typePropShow,
    materialPropShow,
    psetPropShow,
    qsetPropShow
  );

  const nativePropPanel = document.getElementById("accordion-native");
  const typePropPanel = document.getElementById("accordion-type");
  const materialPropPanel = document.getElementById("accordion-materials");
  const psetPropPanel = document.getElementById("accordion-psets");
  const qsetPropPanel = document.getElementById("accordion-qsets");

  panels.push(
    nativePropPanel,
    typePropPanel,
    materialPropPanel,
    psetPropPanel,
    qsetPropPanel
  );
  for (let i = 0; i < buttons.length; i++) {
    // console.log("here");
    // panels[i].setAttribute("class", "");
    panels[i].style.display = "none";
    // panels[i].classList.add("form-check-input");
    if (buttons[i].checked) {
      // panels[i].classList.add("invisible");
      panels[i].style.display = "";
    }
  }
}
