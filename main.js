import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const viewer = document.getElementById('viewer');

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    75,
    viewer.clientWidth / viewer.clientHeight,
    0.1,
    1000
);

const loader = new GLTFLoader();

loader.load(
    '/models/baked.glb',
    function (gltf) {

        const model = gltf.scene;

        scene.add(model);

model.traverse((object) => {

    if (object.isMesh) {

        object.material.emissive.set(0xffffff);

        object.material.emissiveIntensity = 1;

        object.material.needsUpdate = true;

    }

});

        const box = new THREE.Box3().setFromObject(model);

        const center = box.getCenter(new THREE.Vector3());

        const size = box.getSize(new THREE.Vector3());

        model.position.sub(center);

        const maxDimension = Math.max(
            size.x,
            size.y,
            size.z
        );

        camera.position.z = maxDimension * 2;

    }
);



const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.outputColorSpace = THREE.SRGBColorSpace;



renderer.setSize(viewer.clientWidth, viewer.clientHeight);

viewer.appendChild(renderer.domElement);










const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;

controls.enablePan = false;

controls.minDistance = 2;

controls.maxDistance = 10;


function animate() {


    controls.update();

    renderer.render(scene, camera);

}

renderer.setAnimationLoop(animate);