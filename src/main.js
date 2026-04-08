// src/main.js
import * as THREE from 'three';
import { LeafField } from './LeafField.js';
import { CameraController } from './CameraController.js';
import { SceneManager } from './SceneManager.js';
import { GUIManager } from './GUIManager.js';

// Инициализация сцены
const sceneManager = new SceneManager();
sceneManager.setSkybox('Public/textures/skybox/panorama.png');

// Создание поля листьев
const leafField = new LeafField(16, sceneManager.getScene(), sceneManager.getRenderer());

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
    sceneManager.getRenderer().render(sceneManager.getScene(), sceneManager.getCamera());
}
animate();

// Обработка изменения размера окна
window.addEventListener('resize', () => sceneManager.onWindowResize());