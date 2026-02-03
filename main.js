import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true; // Habilita VR
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

// Sistema de partículas
const count = 15000;
const geometry = new THREE.BufferGeometry();
const posArray = new Float32Array(count * 3);
const targets = new Float32Array(count * 3);

for(let i=0; i<count*3; i++) posArray[i] = (Math.random()-0.5)*10;
geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const material = new THREE.PointsMaterial({ size: 0.015, color: 0x00ffcc, blending: THREE.AdditiveBlending });
const points = new THREE.Points(geometry, material);
points.position.set(0, 1.5, -2); // Posición inicial frente al usuario en VR
scene.add(points);

function setTemplate(shape) {
    for (let i = 0; i < count; i++) {
        let x, y, z;
        const i3 = i * 3;
        if (shape === 'SOL') {
            const r = Math.random() > 0.8 ? 0.9 : 0.6;
            const theta = Math.random() * Math.PI * 2, phi = Math.acos(2 * Math.random() - 1);
            x = Math.sin(phi) * Math.cos(theta) * r;
            y = Math.sin(phi) * Math.sin(theta) * r;
            z = Math.cos(phi) * r;
        } else if (shape === 'LETRA') {
            x = (Math.random() - 0.5) * 3;
            y = (i < count * 0.5) ? 0.4 : -0.4; // Simula dos líneas de texto
            z = (Math.random() - 0.5) * 0.1;
        } else if (shape === 'TUBO') {
            const a = Math.random() * Math.PI * 2;
            x = Math.cos(a) * 0.4; z = Math.sin(a) * 0.4; y = (Math.random() - 0.5) * 2;
        } else {
            x = (Math.random()-0.5); y = (Math.random()-0.5); z = (Math.random()-0.5);
        }
        targets[i3] = x; targets[i3+1] = y; targets[i3+2] = z;
    }
}
setTemplate('SOL');

renderer.setAnimationLoop(() => {
    const pos = geometry.attributes.position;
    for (let i = 0; i < count * 3; i++) {
        pos.array[i] += (targets[i] - pos.array[i]) * 0.05;
    }
    pos.needsUpdate = true;
    points.rotation.y += 0.002;
    renderer.render(scene, camera);
});

document.getElementById('template').addEventListener('change', (e) => setTemplate(e.target.value));