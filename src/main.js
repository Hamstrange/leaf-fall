import * as THREE from 'three';
import { LeafField } from './LeafField.js';
import GUI from 'three/addons/libs/lil-gui.module.min.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(30, 20, 50);
camera.lookAt(0, 10, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Панорама
function addSkybox(scene) {
    const loader = new THREE.TextureLoader();
    const texture = loader.load('Public/textures/skybox/panorama.png');
    texture.mapping = THREE.EquirectangularRefractionMapping;
    scene.background = texture;
}
addSkybox(scene);

// Создаём поле листьев
const leafField = new LeafField(16, scene, renderer);

// GUI
const gui = new GUI({ title: 'Параметры' });
gui.domElement.style.position = 'absolute';
gui.domElement.style.top = '10px';
gui.domElement.style.right = '10px';

const params = leafField.params;
gui.add(params, 'gravity', -20, 0).onChange(v => leafField.updateGravity(v));
gui.add(params, 'damping', 0.9, 1).onChange(v => leafField.updateDamping(v));
gui.add(params, 'drag', 0, 20).onChange(v => leafField.updateDrag(v));
gui.add(params, 'threshold', -30, 0).onChange(v => leafField.updateThreshold(v));
gui.add(params, 'minResetY', 0, 30).onChange(v => leafField.updateMinResetY(v));
gui.add(params, 'maxResetY', 0, 30).onChange(v => leafField.updateMaxResetY(v));
gui.add(params, 'startAngle', 0, 360).onChange(v => leafField.updateStartAngle(v));
gui.add(params, 'targetAngle', 0, 360).onChange(v => leafField.updateTargetAngle(v));
gui.add(params, 'elasticity', 0, 0.2).onChange(v => leafField.updateElasticity(v));
gui.add(params, 'momentFactor', 0, 0.1).onChange(v => leafField.updateMomentFactor(v));
gui.add(params, 'torqueFactor', 0, 1).onChange(v => leafField.updateTorqueFactor(v));
gui.add(params, 'angularDamping', 0.9, 1).onChange(v => leafField.updateAngularDamping(v));
gui.add(params, 'velTorqueFactor', 0, 100).onChange(v => leafField.updateVelTorqueFactor(v));
gui.add(params, 'speedThreshold', 0, 5).onChange(v => leafField.updateSpeedThreshold(v));

// Управление камерой (как у вас)
let isMouseDown = false;
let lastMouseX = 0, lastMouseY = 0;
let cameraPhi = 0, cameraTheta = 0;
let cameraDistance = 70;
const center = new THREE.Vector3(0, 10, 0);

(function initCameraAngles() {
    const dir = new THREE.Vector3().subVectors(camera.position, center);
    cameraDistance = dir.length();
    cameraPhi = Math.atan2(dir.z, dir.x);
    cameraTheta = Math.acos(dir.y / cameraDistance);
})();

renderer.domElement.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        isMouseDown = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        renderer.domElement.style.cursor = 'grabbing';
    }
});

window.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    cameraPhi += dx * 0.01;
    cameraTheta += dy * 0.01;
    cameraTheta = Math.max(0.1, Math.min(Math.PI - 0.1, cameraTheta));
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    const x = center.x + cameraDistance * Math.sin(cameraTheta) * Math.cos(cameraPhi);
    const y = center.y + cameraDistance * Math.cos(cameraTheta);
    const z = center.z + cameraDistance * Math.sin(cameraTheta) * Math.sin(cameraPhi);
    camera.position.set(x, y, z);
    camera.lookAt(center);
});

window.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
        isMouseDown = false;
        renderer.domElement.style.cursor = 'default';
    }
});

// Анимация
const clock = new THREE.Clock();
let time = 0;

function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.1);
    time += delta;

    leafField.update(delta, time);
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});