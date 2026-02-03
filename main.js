import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// 1. ESCENA Y RENDERER
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    canvas: document.querySelector('#canvas3d'), 
    antialias: true, 
    alpha: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));

// Posición de cámara para que NO se vea cortado
camera.position.z = 5; 

// 2. PARTÍCULAS
const count = 10000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(count * 3);
const targets = new Float32Array(count * 3);
for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 10;
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({ size: 0.03, color: 0x00ffcc, transparent: true, blending: THREE.AdditiveBlending });
const points = new THREE.Points(geometry, material);
scene.add(points);

// 3. LÓGICA DE INTERACCIÓN (Cámara)
let mouseX = 0, mouseY = 0, handActive = false;

const video = document.getElementById('video');
const hands = new window.Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5 });

hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        handActive = true;
        const hand = results.multiHandLandmarks[0][9]; // Centro de la mano
        mouseX = (hand.x - 0.5) * -10;
        mouseY = (hand.y - 0.5) * -10;
    } else {
        handActive = false;
    }
});

const cameraUtils = new window.Camera(video, {
    onFrame: async () => { await hands.send({image: video}); },
    width: 640, height: 480
});
cameraUtils.start().catch(() => console.log("Cámara no disponible (posible VR mode)"));

// 4. FORMAS
function setTemplate(shape) {
    for (let i = 0; i < count; i++) {
        let x, y, z;
        const i3 = i * 3;
        if (shape === 'LETRA') {
            x = (Math.random() - 0.5) * 4;
            y = (i < count * 0.5) ? 0.5 : -0.5;
            z = (Math.random() - 0.5) * 0.2;
        } else if (shape === 'TUBO') {
            const a = Math.random() * Math.PI * 2;
            x = Math.cos(a) * 0.5; z = Math.sin(a) * 0.5; y = (Math.random() - 0.5) * 3;
        } else { // SOL
            const r = 1.2;
            const theta = Math.random() * Math.PI * 2, phi = Math.acos(2 * Math.random() - 1);
            x = Math.sin(phi) * Math.cos(theta) * r;
            y = Math.sin(phi) * Math.sin(theta) * r;
            z = Math.cos(phi) * r;
        }
        targets[i3] = x; targets[i3+1] = y; targets[i3+2] = z;
    }
}
setTemplate('SOL');

// 5. ANIMACIÓN
renderer.setAnimationLoop(() => {
    const pos = geometry.attributes.position;
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const dx = targets[i3] - pos.array[i3];
        const dy = targets[i3+1] - pos.array[i3+1];
        const dz = targets[i3+2] - pos.array[i3+2];
        
        // Si hay mano, las partículas huyen del puntero (Explosión)
        if (handActive) {
            const dist = Math.sqrt((pos.array[i3]-mouseX)**2 + (pos.array[i3+1]-mouseY)**2);
            if (dist < 1.5) {
                pos.array[i3] += (pos.array[i3] - mouseX) * 0.05;
                pos.array[i3+1] += (pos.array[i3+1] - mouseY) * 0.05;
            }
        }
        
        pos.array[i3] += dx * 0.05;
        pos.array[i3+1] += dy * 0.05;
        pos.array[i3+2] += dz * 0.05;
    }
    pos.needsUpdate = true;
    points.rotation.y += 0.003;
    renderer.render(scene, camera);
});

// Ajuste de pantalla
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('template').addEventListener('change', (e) => setTemplate(e.target.value));
