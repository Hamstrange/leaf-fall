// src/CameraController.js
import * as THREE from 'three';

export class CameraController {
    constructor(camera, rendererDomElement, center = new THREE.Vector3(0, 10, 0), distance = 70) {
        this.camera = camera;
        this.center = center;
        this.distance = distance;
        
        this.isMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.phi = 0;
        this.theta = 0;
        
        this.initAngles();
        this.attachEvents(rendererDomElement);
    }
    
    initAngles() {
        const dir = new THREE.Vector3().subVectors(this.camera.position, this.center);
        this.distance = dir.length();
        this.phi = Math.atan2(dir.z, dir.x);
        this.theta = Math.acos(dir.y / this.distance);
    }
    
    attachEvents(domElement) {
        domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));
        domElement.style.userSelect = 'none';
    }
    
    onMouseDown(e) {
        if (e.button === 0) {
            this.isMouseDown = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            e.target.style.cursor = 'grabbing';
        }
    }
    
    onMouseMove(e) {
        if (!this.isMouseDown) return;
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.phi += dx * 0.01;
        this.theta += dy * 0.01;
        this.theta = Math.max(0.1, Math.min(Math.PI - 0.1, this.theta));
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        
        const x = this.center.x + this.distance * Math.sin(this.theta) * Math.cos(this.phi);
        const y = this.center.y + this.distance * Math.cos(this.theta);
        const z = this.center.z + this.distance * Math.sin(this.theta) * Math.sin(this.phi);
        this.camera.position.set(x, y, z);
        this.camera.lookAt(this.center);
    }
    
    onMouseUp(e) {
        if (e.button === 0) {
            this.isMouseDown = false;
            e.target.style.cursor = 'default';
        }
    }
}