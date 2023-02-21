import { Color } from 'three';
import { IfcViewerAPI } from 'web-ifc-viewer';
import { IFCLoader } from 'web-ifc-three';
import { IFCWALLSTANDARDCASE } from 'web-ifc';

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(0xffffff) });

// Create grid and axes
viewer.grid.setGrid();
viewer.axes.setAxes();

const input = document.getElementById("file-input");
const ifcLoader = new IFCLoader();

input.addEventListener(
    "change",
    async (changed) => {
        const ifcURL = URL.createObjectURL(changed.target.files[0]);
        loadIFC(ifcURL);
    },
    false
);

async function loadIFC(url) {
    const model = await viewer.IFC.loadIfcUrl(url);
    // Add dropped shadow and post-processing efect
    await viewer.shadowDropper.renderShadow(model.modelID);
    viewer.context.renderer.postProduction.active = true;
};

// window.ondblclick = async () => await viewer.IFC.selector.pickIfcItem();
window.ondblclick = async () => {
    const result = await viewer.IFC.selector.highlightIfcItem(true, true);
    // if (!result) return;
    if (!result) {
        viewer.IFC.selector.unHighlightIfcItems();
        return;
    }
    // ***** NEED TO UNDERSTAND WHAT IS HAPPENING HERE *****
    const { modelID, id } = result; // HOW DOES THIS WORK?
    const props = await viewer.IFC.getProperties(modelID, id, true, false);
    // createPropertiesMenu(props);
    console.log(props);
};

window.onmousemove = async () => await viewer.IFC.selector.prePickIfcItem();

