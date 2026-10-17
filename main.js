
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


/* =========================================================
   CAMERA DATABASE

   ADD NEW MODELS HERE EXACTLY LIKE BEFORE
   ========================================================= */

const cameras = [

    {
        number: "ARCHIVE No. 001",
        name: "Tamron 24-70mm f/2.8",
        year: "YEAR · 2012",

        manufacturer: "Tamron",
        type: "Zoom lens",
        format: "24-70 mm",
        origin: "Japan",

        model: "models/Tamron11.glb"
    },

    {
        number: "ARCHIVE No. 002",
        name: "blender monkey",
        year: "YEAR · 2026",

        manufacturer: "haštálek",
        type: "glb",
        format: "0",
        origin: "Tsechien",

        model: "models/monkey2.glb"
    },

    {
        number: "ARCHIVE No. 004",
        name: "CAMERA NAME",
        year: "YEAR · XXXX",

        manufacturer: "MANUFACTURER",
        type: "CAMERA TYPE",
        format: "FORMAT",
        origin: "COUNTRY",

        model: "models/Tamron12.glb"
    }

];


/* =========================================================
   HTML ELEMENTS
   ========================================================= */

const viewer = document.getElementById('viewer');

const cameraNumber = document.getElementById('camera-number');
const cameraName = document.getElementById('camera-name');
const cameraYear = document.getElementById('camera-year');

const cameraManufacturer = document.getElementById('camera-manufacturer');
const cameraType = document.getElementById('camera-type');
const cameraFormat = document.getElementById('camera-format');
const cameraOrigin = document.getElementById('camera-origin');

const previousButton = document.getElementById('previous-camera');
const nextButton = document.getElementById('next-camera');


/* =========================================================
   LOADING INDICATOR
   ========================================================= */

const loadingLabel = document.createElement('div');

loadingLabel.className = 'viewer-loading';

viewer.parentElement.appendChild(loadingLabel);


function showLoading(percent) {

    loadingLabel.textContent = percent === null
        ? 'LOADING MODEL...'
        : `LOADING MODEL ${percent}%`;

    loadingLabel.classList.add('is-visible');

}


function hideLoading() {

    loadingLabel.classList.remove('is-visible');

}


/* =========================================================
   THREE.JS SETUP
   ========================================================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0xC2C2C2);


/* =========================================================
   LIGHTING FOR PRINCIPLED BSDF MATERIALS

   GLB exports Principled BSDF materials as
   physically based materials in Three.js.

   These lights let their base color, roughness
   and normal maps affect the rendered appearance.
   ========================================================= */

const ambientLight = new THREE.AmbientLight(
    0xffffff,
    1.5
);

scene.add(ambientLight);


const directionalLight = new THREE.DirectionalLight(
    0xffffff,
    3
);

directionalLight.position.set(5, 8, 6);

scene.add(directionalLight);


/* =========================================================
   CAMERA
   ========================================================= */

const camera = new THREE.PerspectiveCamera(
    75,
    viewer.clientWidth / viewer.clientHeight,
    0.1,
    1000
);


/* =========================================================
   RENDERER
   ========================================================= */

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.setSize(
    viewer.clientWidth,
    viewer.clientHeight
);

viewer.appendChild(renderer.domElement);


/* =========================================================
   ORBIT CONTROLS
   ========================================================= */

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping = true;

controls.enablePan = false;

controls.minDistance = 2;

controls.maxDistance = 10;


/* =========================================================
   MODEL LOADER + CACHE

   Previously loaded models are kept in memory
   for faster switching.

   ========================================================= */

const loader = new GLTFLoader();

let currentCameraIndex = 0;

let currentModel = null;

const modelCache = new Map();

let latestRequest = 0;


/* =========================================================
   PREPARE MODEL

   IMPORTANT:
   We no longer force material.emissive to white.

   This allows the GLB's original PBR materials,
   including base color, roughness and normal maps,
   to render as exported from Blender.
   ========================================================= */

function prepareModel(model) {

    /* ---------- CENTER MODEL ---------- */

    const box = new THREE.Box3().setFromObject(model);

    const center = box.getCenter(
        new THREE.Vector3()
    );

    const size = box.getSize(
        new THREE.Vector3()
    );

    model.position.sub(center);


    /* ---------- AUTOMATIC CAMERA DISTANCE ---------- */

    const maxDimension = Math.max(
        size.x,
        size.y,
        size.z
    );

    return {
        model: model,
        distance: maxDimension * 2
    };

}


/* =========================================================
   GET MODEL FROM CACHE OR DOWNLOAD IT
   ========================================================= */

function getModel(index) {

    if (!modelCache.has(index)) {

        const url =
            `${import.meta.env.BASE_URL}${cameras[index].model}`;

        const promise = loader
            .loadAsync(url, (event) => {

                if (
                    index === currentCameraIndex &&
                    event.total > 0
                ) {

                    showLoading(
                        Math.round(
                            event.loaded / event.total * 100
                        )
                    );

                }

            })
            .then((gltf) => prepareModel(gltf.scene))
            .catch((error) => {

                modelCache.delete(index);

                throw error;

            });

        modelCache.set(index, promise);

    }

    return modelCache.get(index);

}


/* =========================================================
   LOAD CAMERA
   ========================================================= */

async function loadCamera(index) {

    const cameraData = cameras[index];

    const thisRequest = ++latestRequest;


    /* ---------- UPDATE TEXT ---------- */

    cameraNumber.textContent = cameraData.number;

    cameraName.textContent = cameraData.name;

    cameraYear.textContent = cameraData.year;

    cameraManufacturer.textContent = cameraData.manufacturer;

    cameraType.textContent = cameraData.type;

    cameraFormat.textContent = cameraData.format;

    cameraOrigin.textContent = cameraData.origin;


    /* ---------- HIDE OLD MODEL ---------- */

    if (currentModel) {

        scene.remove(currentModel);

        currentModel = null;

    }


    showLoading(null);


    /* ---------- LOAD NEW MODEL ---------- */

    try {

        const ready = await getModel(index);

        if (thisRequest !== latestRequest) {
            return;
        }


        currentModel = ready.model;

        scene.add(ready.model);


        /* ---------- RESET CAMERA POSITION ---------- */

        camera.position.set(
            0,
            0,
            ready.distance
        );

        controls.target.set(0, 0, 0);

        controls.update();


        hideLoading();

    } catch (error) {

        if (thisRequest === latestRequest) {

            loadingLabel.textContent =
                'MODEL FAILED TO LOAD';

        }

        console.error(
            'Error loading camera:',
            error
        );

    }

}


/* =========================================================
   PRELOAD OTHER CAMERAS
   ========================================================= */

async function preloadOtherCameras() {

    for (let i = 0; i < cameras.length; i++) {

        if (i === currentCameraIndex) {
            continue;
        }

        try {

            await getModel(i);

        } catch (error) {

            /* Retry when selected later */

        }

    }

}


/* =========================================================
   ARROW BUTTONS
   ========================================================= */

nextButton.addEventListener('click', () => {

    currentCameraIndex++;

    if (currentCameraIndex >= cameras.length) {

        currentCameraIndex = 0;

    }

    loadCamera(currentCameraIndex);

});


previousButton.addEventListener('click', () => {

    currentCameraIndex--;

    if (currentCameraIndex < 0) {

        currentCameraIndex = cameras.length - 1;

    }

    loadCamera(currentCameraIndex);

});


/* =========================================================
   WINDOW RESIZING
   ========================================================= */

window.addEventListener('resize', () => {

    camera.aspect =
        viewer.clientWidth /
        viewer.clientHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        viewer.clientWidth,
        viewer.clientHeight
    );

});


/* =========================================================
   ANIMATION
   ========================================================= */

function animate() {

    controls.update();

    renderer.render(
        scene,
        camera
    );

}

renderer.setAnimationLoop(animate);


/* =========================================================
   LOAD FIRST CAMERA, THEN PRELOAD THE REST
   ========================================================= */

loadCamera(currentCameraIndex).then(preloadOtherCameras);
