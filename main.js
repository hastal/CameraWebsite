import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


/* =========================================================
   CAMERA DATABASE
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

        model: "models/baked.glb"
    },

    {
        number: "ARCHIVE No. 002",
        name: "Camera Two",
        year: "YEAR · 20XX",

        manufacturer: "Manufacturer",
        type: "Camera type",
        format: "35 mm",
        origin: "Country",

        model: "models/baked1.glb"
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
   THREE.JS SETUP
   ========================================================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0xC2C2C2);


const camera = new THREE.PerspectiveCamera(
    75,
    viewer.clientWidth / viewer.clientHeight,
    0.1,
    1000
);


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
   MODEL LOADER
   ========================================================= */

const loader = new GLTFLoader();

let currentCameraIndex = 0;

let currentModel = null;


/* =========================================================
   DISPOSE OLD MODEL
   ========================================================= */

function disposeModel(model) {

    scene.remove(model);

    model.traverse((object) => {

        if (!object.isMesh) {
            return;
        }


        /* Remove geometry from GPU memory */

        if (object.geometry) {
            object.geometry.dispose();
        }


        /* Some meshes can have multiple materials */

        const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];


        materials.forEach((material) => {

            if (!material) {
                return;
            }


            /* Dispose every texture used by the material */

            for (const property in material) {

                const value = material[property];

                if (value && value.isTexture) {
                    value.dispose();
                }

            }


            /* Dispose the material itself */

            material.dispose();

        });

    });

}


/* =========================================================
   LOAD CAMERA
   ========================================================= */

function loadCamera(index) {

    const cameraData = cameras[index];


    /* ---------- UPDATE TEXT ---------- */

    cameraNumber.textContent = cameraData.number;

    cameraName.textContent = cameraData.name;

    cameraYear.textContent = cameraData.year;

    cameraManufacturer.textContent = cameraData.manufacturer;

    cameraType.textContent = cameraData.type;

    cameraFormat.textContent = cameraData.format;

    cameraOrigin.textContent = cameraData.origin;



    /* ---------- REMOVE OLD MODEL ---------- */

    if (currentModel) {

        disposeModel(currentModel);

        currentModel = null;

    }



    /* ---------- LOAD NEW MODEL ---------- */

    loader.load(

        `${import.meta.env.BASE_URL}${cameraData.model}`,

        function (gltf) {

            const model = gltf.scene;

            currentModel = model;

            scene.add(model);



            /* Use baked/emissive texture */

            model.traverse((object) => {

                if (object.isMesh) {

                    const materials = Array.isArray(object.material)
                        ? object.material
                        : [object.material];

                    materials.forEach((material) => {

                        if (material.emissive) {

                            material.emissive.set(0xffffff);

                            material.emissiveIntensity = 1;

                            material.needsUpdate = true;

                        }

                    });

                }

            });



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

            camera.position.set(
                0,
                0,
                maxDimension * 2
            );



            /* Reset rotation target */

            controls.target.set(0, 0, 0);

            controls.update();

        },


        undefined,


        function (error) {

            console.error(
                "Error loading camera:",
                error
            );

        }

    );

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
   LOAD FIRST CAMERA
   ========================================================= */

loadCamera(currentCameraIndex);