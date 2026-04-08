// src/GUIManager.js
import GUI from 'three/addons/libs/lil-gui.module.min.js';

export class GUIManager {
    constructor(leafField) {
        this.gui = new GUI({ title: 'Параметры' });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '10px';
        this.gui.domElement.style.right = '10px';

        const params = leafField.params;
        
        this.gui.add(params, 'gravity', -20, 0).onChange(v => leafField.updateGravity(v));
        this.gui.add(params, 'damping', 0.9, 1).onChange(v => leafField.updateDamping(v));
        this.gui.add(params, 'drag', 0, 20).onChange(v => leafField.updateDrag(v));
        this.gui.add(params, 'threshold', -30, 0).onChange(v => leafField.updateThreshold(v));
        this.gui.add(params, 'minResetY', 0, 30).onChange(v => leafField.updateMinResetY(v));
        this.gui.add(params, 'maxResetY', 0, 30).onChange(v => leafField.updateMaxResetY(v));
        this.gui.add(params, 'startAngle', 0, 360).onChange(v => leafField.updateStartAngle(v));
        this.gui.add(params, 'targetAngle', 0, 360).onChange(v => leafField.updateTargetAngle(v));
        this.gui.add(params, 'elasticity', 0, 0.2).onChange(v => leafField.updateElasticity(v));
        this.gui.add(params, 'momentFactor', 0, 0.1).onChange(v => leafField.updateMomentFactor(v));
        this.gui.add(params, 'torqueFactor', 0, 1).onChange(v => leafField.updateTorqueFactor(v));
        this.gui.add(params, 'angularDamping', 0.9, 1).onChange(v => leafField.updateAngularDamping(v));
        this.gui.add(params, 'velTorqueFactor', 0, 100).onChange(v => leafField.updateVelTorqueFactor(v));
        this.gui.add(params, 'speedThreshold', 0, 5).onChange(v => leafField.updateSpeedThreshold(v));
    }
}