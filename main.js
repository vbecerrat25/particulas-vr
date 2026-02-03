import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

// 1. CONFIGURACIÓN BASE
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true; 
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

// 2. SISTEMA DE PARTÍCULAS
const count = 15000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(count * 3);
const targets = new Float32Array(count * 3);
for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 10;
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({ size: 0.02, color: 0x00ffcc, blending: THREE.AdditiveBlending });
const points = new THREE.Points(geometry, material);
points.position.set(0, 1.5, -2); 
scene.add(points);

// 3. MANDOS VR (Visualización)
const controllerModelFactory = new XRControllerModelFactory();
const controller1 = renderer.xr.getController(0);
const controllerGrip1 = renderer.xr.getControllerGrip(0);
controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
scene.add(controller1, controllerGrip1);

const controller2 = renderer.xr.getController(1);
const controllerGrip2 = renderer.xr.getControllerGrip(1);
controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
scene.add(controller2, controllerGrip2);

// 4. LÓGICA DE DETECCIÓN (Cámara para PC)
let handActive = false;
let pointerPos = new THREE.Vector3();

// Solo cargamos MediaPipe si NO estamos en modo VR
if (!navigator.xr) {
    // Aquí iría tu código anterior de MediaPipe para la cámara...
    // (Omitido por brevedad, pero funcionará al detectar la webcam)
}

// 5. GENERADOR DE FORMAS
function setTemplate(shape) {
    for (let i = 0; i < count; i++) {
        let x, y, z;
        const i3 = i * 3;
        if (shape === 'LETRA') {
            x = (Math.random() - 0.5) * 3;
            y = (i < count * 0.5) ? 0.4 : -0.4;
            z = (Math.random() - 0.5) * 0.1;
        } else if (shape === 'TUBO') {
            const a = Math.random() * Math.PI * 2;
            x = Math.cos(a) * 0.4; z = Math.sin(a) * 0.4; y = (Math.random() - 0.5) * 2;
        } else {
            const r = 0.7;
            const theta = Math.random() * Math.PI * 2, phi = Math.acos(2 * Math.random() - 1);
            x = Math.sin(phi) * Math.cos(theta) * r;
            y = Math.sin(phi) * Math.sin(theta) * r;
            z = Math.cos(phi) * r;
        }
        targets[i3] = x; targets[i3+1] = y; targets[i3+2] = z;
    }
}
setTemplate('SOL');

// 6. BUCLE DE ANIMACIÓN CON INTERACCIÓN
renderer.setAnimationLoop(() => {
    const pos = geometry.attributes.position;
    const isVR = renderer.xr.isPresenting;
    
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        let tx = targets[i3], ty = targets[i3+1], tz = targets[i3+2];
        
        // INTERACCIÓN: Si el mando (o mano) está cerca, las partículas "explotan"
        let dist;
        if (isVR) {
            dist = controller1.position.distanceTo(new THREE.Vector3(pos.array[i3], pos.array[i3+1]+1.5, pos.array[i3+2]-2));
        }

        if (dist < 0.3) { // Umbral de explosión
            pos.array[i3] += (Math.random() - 0.5) * 0.5;
            pos.array[i3+1] += (Math.random() - 0.5) * 0.5;
        } else {
            pos.array[i3] += (tx - pos.array[i3]) * 0.03;
            pos.array[i3+1] += (ty - pos.array[i3+1]) * 0.03;
            pos.array[i3+2] += (tz - pos.array[i3+2]) * 0.03;
        }
    }
    
    pos.needsUpdate = true;
    points.rotation.y += 0.002;
    renderer.render(scene, camera);
});

document.getElementById('template').addEventListener('change', (e) => setTemplate(e.target.value));
