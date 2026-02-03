import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

// 1. ESCENA Y CONFIGURACIÓN VR
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#canvas3d'), antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));

// 2. MANDOS PARA OCULUS QUEST
const controller1 = renderer.xr.getController(0);
scene.add(controller1);
const controller2 = renderer.xr.getController(1);
scene.add(controller2);

const controllerModelFactory = new XRControllerModelFactory();
const grip1 = renderer.xr.getControllerGrip(0);
grip1.add(controllerModelFactory.createControllerModel(grip1));
scene.add(grip1);
const grip2 = renderer.xr.getControllerGrip(1);
grip2.add(controllerModelFactory.createControllerModel(grip2));
scene.add(grip2);

// 3. SISTEMA DE PARTÍCULAS
const count = 15000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(count * 3);
const targets = new Float32Array(count * 3);
for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 10;

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const material = new THREE.PointsMaterial({ size: 0.02, color: 0x00ffcc, transparent: true, blending: THREE.AdditiveBlending });
const points = new THREE.Points(geometry, material);

// Posicionamos las partículas frente al usuario en VR (altura de 1.3m y 1.5m adelante)
points.position.set(0, 1.3, -1.5); 
scene.add(points);

// 4. GENERADOR DE TODAS LAS FORMAS
function setTemplate(shape) {
    for (let i = 0; i < count; i++) {
        let x, y, z; const i3 = i * 3;
        const u = Math.random(), v = Math.random();

        if (shape === 'SOL') {
            const r = 0.8; const theta = 2 * Math.PI * u, phi = Math.acos(2 * v - 1);
            x = Math.sin(phi) * Math.cos(theta) * r;
            y = Math.sin(phi) * Math.sin(theta) * r;
            z = Math.cos(phi) * r;
            material.color.set(0xffcc00);
        } else if (shape === 'SATURNO') {
            if (i < count * 0.6) {
                const r = 0.5; const theta = 2 * Math.PI * u, phi = Math.acos(2 * v - 1);
                x = Math.sin(phi) * Math.cos(theta) * r;
                y = Math.sin(phi) * Math.sin(theta) * r;
                z = Math.cos(phi) * r;
            } else {
                const a = Math.random() * Math.PI * 2; const r = 0.8 + Math.random() * 0.4;
                x = Math.cos(a) * r; y = (Math.random() - 0.5) * 0.05; z = Math.sin(a) * r;
            }
            material.color.set(0xd2b48c);
        } else if (shape === 'ESTRELLA') {
            const l = i % 5; const a = (l / 5) * Math.PI * 2;
            const r = i % 2 === 0 ? 1.2 : 0.5;
            x = Math.cos(a) * r * Math.random();
            y = Math.sin(a) * r * Math.random();
            z = (Math.random() - 0.5) * 0.2;
            material.color.set(0xffffff);
        } else if (shape === 'CORAZON') {
            const t = Math.random() * Math.PI * 2;
            x = (16 * Math.pow(Math.sin(t), 3)) / 18;
            y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 18;
            z = (Math.random() - 0.5) * 0.2;
            material.color.set(0xff0055);
        } else if (shape === 'LAPTOP') {
            if (i < count * 0.5) { // Pantalla
                x = (Math.random() - 0.5) * 1.8; y = Math.random() * 1.2; z = -0.05;
            } else { // Teclado
                x = (Math.random() - 0.5) * 1.8; y = 0; z = Math.random() * 1.0;
            }
            material.color.set(0xaaaaaa);
        } else if (shape === 'CELULAR') {
            x = (Math.random() - 0.5) * 0.7;
            y = (Math.random() - 0.5) * 1.4;
            z = (Math.random() - 0.5) * 0.1;
            material.color.set(0x444444);
        } else if (shape === 'LETRA') {
            // "CITEccal Trujillo" simplificado en dos bloques
            x = (Math.random() - 0.5) * 2.5;
            y = (i < count * 0.5) ? 0.3 : -0.3;
            z = (Math.random() - 0.5) * 0.1;
            material.color.set(0x00ffcc);
        } else { // TUBO
            const a = Math.random() * Math.PI * 2;
            x = Math.cos(a) * 0.3; z = Math.sin(a) * 0.3; y = (Math.random() - 0.5) * 2.5;
            material.color.set(0x00ffcc);
        }
        targets[i3] = x; targets[i3+1] = y; targets[i3+2] = z;
    }
}
setTemplate('SOL');

// 5. ANIMACIÓN E INTERACCIÓN VR
renderer.setAnimationLoop(() => {
    const pos = geometry.attributes.position;
    
    // Obtenemos la posición de los mandos
    const m1 = new THREE.Vector3().setFromMatrixPosition(controller1.matrixWorld);
    const m2 = new THREE.Vector3().setFromMatrixPosition(controller2.matrixWorld);

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // Convertimos posición local de partícula a global para comparar con los mandos
        const pGlobal = new THREE.Vector3(pos.array[i3], pos.array[i3+1], pos.array[i3+2]).applyMatrix4(points.matrixWorld);
        
        const d1 = pGlobal.distanceTo(m1);
        const d2 = pGlobal.distanceTo(m2);

        if (d1 < 0.25 || d2 < 0.25) { // EXPLOSIÓN al tocar con mandos
            pos.array[i3] += (Math.random() - 0.5) * 0.5;
            pos.array[i3+1] += (Math.random() - 0.5) * 0.5;
            pos.array[i3+2] += (Math.random() - 0.5) * 0.5;
        } else {
            // Atracción hacia la forma del template
            pos.array[i3] += (targets[i3] - pos.array[i3]) * 0.05;
            pos.array[i3+1] += (targets[i3+1] - pos.array[i3+1]) * 0.05;
            pos.array[i3+2] += (targets[i3+2] - pos.array[i3+2]) * 0.05;
        }
    }
    
    pos.needsUpdate = true;
    points.rotation.y += 0.002;
    renderer.render(scene, camera);
});

// Evento para cambiar de forma
document.getElementById('template').addEventListener('change', (e) => setTemplate(e.target.value));

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
