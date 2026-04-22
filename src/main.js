// src/main.js
import * as THREE from 'three';
import { LeafField } from './leaves/index.js';
import { TerrainManager } from './terrain/index.js';
import { CameraController } from './CameraController.js';
import { SceneManager } from './SceneManager.js';
import { GUIManager } from './GUIManager.js';
import { LightingManager } from './LightingManager.js';

// Инициализация сцены
const sceneManager = new SceneManager();
const scene = sceneManager.getScene();
const renderer = sceneManager.getRenderer();

// Скайбокс
sceneManager.setSkybox('Public/textures/skybox/panorama.png');

// Освещение
const lighting = new LightingManager(scene);
lighting.setupDefaultLights();

// Создание поля листьев
const leafField = new LeafField(16, sceneManager.getScene(), sceneManager.getRenderer());

// Добавляем ландшафт
const terrain = new TerrainManager(sceneManager.getScene(), sceneManager.getRenderer(), {
    width: 800,
    depth: 800,
    segments: 256
});
terrain.init();

// GUI
const guiManager = new GUIManager(leafField);

// Контроллер камеры 
const cameraController = new CameraController(
    sceneManager.getCamera(), 
    sceneManager.getRenderer().domElement, 
    new THREE.Vector3(0, 10, 0), 
    70
);

// Анимация
const clock = new THREE.Clock();
let time = 0;

function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.1);
    time += delta;

    leafField.update(delta, time);
    terrain.update(delta);  

    sceneManager.getRenderer().render(sceneManager.getScene(), sceneManager.getCamera());
}
animate();

// Обработка изменения размера окна
window.addEventListener('resize', () => sceneManager.onWindowResize());