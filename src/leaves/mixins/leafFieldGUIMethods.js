// src/mixins/leafFieldGUIMethods.js

export function addGUIMethods(LeafFieldPrototype) {
    LeafFieldPrototype.updateGravity = function(v) {
        this.params.gravity = v;
        this.velocityVar.material.uniforms.g.value = v;
    };
    LeafFieldPrototype.updateDamping = function(v) {
        this.params.damping = v;
        this.velocityVar.material.uniforms.damping.value = v;
    };
    LeafFieldPrototype.updateDrag = function(v) {
        this.params.drag = v;
        this.velocityVar.material.uniforms.drag.value = v;
        this.angVelVar.material.uniforms.drag.value = v;
        this.hingeVar.material.uniforms.drag.value = v;
    };
    LeafFieldPrototype.updateThreshold = function(v) {
        this.params.threshold = v;
        this.velocityVar.material.uniforms.threshold.value = v;
        this.angVelVar.material.uniforms.threshold.value = v;
        this.positionVar.material.uniforms.threshold.value = v;
        this.rotationVar.material.uniforms.threshold.value = v;
        this.hingeVar.material.uniforms.threshold.value = v;
    };
    LeafFieldPrototype.updateMinResetY = function(v) {
        this.params.minResetY = v;
        this.positionVar.material.uniforms.minResetY.value = v;
    };
    LeafFieldPrototype.updateMaxResetY = function(v) {
        this.params.maxResetY = v;
        this.positionVar.material.uniforms.maxResetY.value = v;
    };
    LeafFieldPrototype.updateStartAngle = function(v) {
        this.params.startAngle = v;
        this.hingeVar.material.uniforms.startAngle.value = v * Math.PI/180;
    };
    LeafFieldPrototype.updateTargetAngle = function(v) {
        this.params.targetAngle = v;
        this.hingeVar.material.uniforms.targetAngle.value = v * Math.PI/180;
    };
    LeafFieldPrototype.updateElasticity = function(v) {
        this.params.elasticity = v;
        this.hingeVar.material.uniforms.elasticity.value = v;
    };
    LeafFieldPrototype.updateMomentFactor = function(v) {
        this.params.momentFactor = v;
        this.hingeVar.material.uniforms.momentFactor.value = v;
    };
    LeafFieldPrototype.updateTorqueFactor = function(v) {
        this.params.torqueFactor = v;
        this.angVelVar.material.uniforms.torqueFactor.value = v;
    };
    LeafFieldPrototype.updateAngularDamping = function(v) {
        this.params.angularDamping = v;
        this.angVelVar.material.uniforms.angularDamping.value = v;
    };
    LeafFieldPrototype.updateVelTorqueFactor = function(v) {
        this.params.velTorqueFactor = v;
        this.angVelVar.material.uniforms.velTorqueFactor.value = v;
    };
    LeafFieldPrototype.updateSpeedThreshold = function(v) {
        this.params.speedThreshold = v;
        this.angVelVar.material.uniforms.speedThreshold.value = v;
    };
    LeafFieldPrototype.updateAmbientColor = function(r, g, b) {
        this.material.uniforms.ambientColor.value.set(r, g, b);
    };
    LeafFieldPrototype.updateLightColor = function(r, g, b) {
        this.material.uniforms.lightColor.value.set(r, g, b);
    };
    LeafFieldPrototype.updateLightDir = function(x, y, z) {
        this.material.uniforms.lightDir.value.set(x, y, z).normalize();
    };
}