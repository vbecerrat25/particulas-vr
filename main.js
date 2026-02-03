import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

// 1. ESCENA
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#canvas3d'), antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));

// Cámara alejada para que quepa todo en el celular
camera.position.z = 6;

// 2. PARTÍCULAS
const count = 15000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(count * 3);
const targets = new Float32Array(count * 3);
for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 15;
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({ size: 0.025, color: 0x00ffcc, transparent: true, blending: THREE.AdditiveBlending });
const points = new THREE.Points(geometry, material);
scene.add(points);

// 3. MANDOS VR (Para Oculus)
const controller1 = renderer.xr.getController(0);
scene.add(controller1);
const controllerModelFactory = new XRControllerModelFactory();
const grip1 = renderer.xr.getControllerGrip(0);
grip1.add(controllerModelFactory.createControllerModel(grip1));
scene.add(grip1);

// 4. INTERACCIÓN POR CÁMARA (Para Celular/PC)
let handPos = new THREE.Vector3(-99, -99, 0);
let handActive = false;

const video = document.getElementById('video');
const hands = new window.Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5 });
hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const hand = results.multiHandLandmarks[0][9];
        handPos.x = (hand.x - 0.5) * -12;
        handPos.y = (hand.y - 0.5) * -12;
        handActive = true;
    } else { handActive = false; }
});
const cameraUtils = new window.Camera(video, {
    onFrame: async () => { await hands.send({image: video}); },
    width: 640, height: 480
});
cameraUtils.start().catch(() => {});

// 5. GENERADOR DE FORMAS
function setTemplate(shape) {
    for (let i = 0; i < count; i++) {
        let x, y, z; const i3 = i * 3;
        if (shape === 'SOL') {
            const r = Math.random() > 0.8 ? 1.5 : 1.0;
            const theta = Math.random() * Math.PI * 2, phi = Math.acos(2 * Math.random() - 1);
            x = Math.sin(phi) * Math.cos(theta) * r; y = Math.sin(phi) * Math.sin(theta) * r; z = Math.cos(phi) * r;
        } else if (shape === 'SATURNO') {
            if (i < count * 0.6) {
                const theta = Math.random() * Math.PI * 2, phi = Math.acos(2 * Math.random() - 1);
                x = Math.sin(phi) * Math.cos(theta) * 0.7; y = Math.sin(phi) * Math.sin(theta) * 0.7; z = Math.cos(phi) * 0.7;
            } else {
                const a = Math.random() * Math.PI * 2; const r = 1.1 + Math.random() * 0.6;
                x = Math.cos(a) * r; y = (Math.random()-0.5)*0.1; z = Math.sin(a) * r;
            }
        } else if (shape === 'ESTRELLA') {
            const l = i % 5; const angle = (l / 5) * Math.PI * 2;
            const r = i % 2 === 0 ? 1.8 : 0.7;
            x = Math.cos(angle) * r * Math.random(); y = Math.sin(angle) * r * Math.random(); z = (Math.random()-0.5)*0.3;
        } else if (shape === 'CORAZON') {
            const t = Math.random() * Math.PI * 2;
            x = (16 * Math.pow(Math.sin(t), 3)) / 12;
            y = (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) / 12;
            z = (Math.random()-0.5)*0.3;
        } else if (shape === 'LAPTOP') {
            if (i < count * 0.5) { x = (Math.random()-0.5)*2.5; y = Math.random()*1.8; z = -0.1; }
            else { x = (Math.random()-0.5)*2.5; y = 0; z = Math.random()*1.5; }
        } else if (shape === 'CELULAR') {
            x = (Math.random()-0.5)*1.2; y = (Math.random()-0.5)*2.5; z = (Math.random()-0.5)*0.2;
        } else if (shape === 'LETRA') {
            x = (Math.random()-0.5)*5; y = (i < count * 0.5) ? 0.6 : -0.6; z = (Math.random()-0.5)*0.2;
        } else { // TUBO
            const a = Math.random() * Math.PI * 2;
            x = Math.cos(a)*0.6; z = Math.sin(a)*0.6; y = (Math.random()-0.5)*3.5;
        }
        targets[i3] = x; targets[i3+1] = y; targets[i3+2] = z;
    }
}
setTemplate('SOL');

// 6. BUCLE DE ANIMACIÓN
renderer.setAnimationLoop(() => {
    const pos = geometry.attributes.position;
    const isVR = renderer.xr.isPresenting;

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        let px = pos.array[i3], py = pos.array[i3+1], pz = pos.array[i3+2];
        
        // Interacción (Cámara o VR)
        let dist;
        if (isVR) {
            dist = controller1.position.distanceTo(new THREE.Vector3(px, py + 1.5, pz - 2));
        } else if (handActive) {
            dist = Math.sqrt((px - handPos.x)**2 + (py - handPos.y)**2);
        }

        if (dist < 0.6) { // EFECTO EXPLOSIÓN
            pos.array[i3] += (Math.random()-0.5)*0.2;
            pos.array[i3+1] += (Math.random()-0.5)*0.2;
        } else {
            pos.array[i3] += (targets[i3] - px) * 0.05;
            pos.array[i3+1] += (targets[i3+1] - py) * 0.05;
            pos.array[i3+2] += (targets[i3+2] - pz) * 0.05;
        }
    }
    pos.needsUpdate = true;
    points.rotation.y += 0.002;
    renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
document.getElementById('template').addEventListener('change', (e) => setTemplate(e.target.value));
