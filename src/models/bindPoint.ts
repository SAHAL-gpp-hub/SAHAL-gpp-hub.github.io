import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ModelInstance } from '../types.ts';
import { applyCohesionPass, normalizeModelBounds } from '../scene/cohesion.ts';
import { createContactShadowMesh } from '../scene/contactShadow.ts';

function createDuplexSheet(): THREE.Group {
  const sheetGroup = new THREE.Group();
  const width = 0.32;
  const height = 0.44;

  // Front face canvas (white with clean document print lines)
  const frontCanvas = document.createElement('canvas');
  frontCanvas.width = 160;
  frontCanvas.height = 220;
  const fCtx = frontCanvas.getContext('2d')!;
  fCtx.fillStyle = '#f8fafd';
  fCtx.fillRect(0, 0, 160, 220);
  fCtx.fillStyle = '#4b5563';
  // Mock printed text lines
  for (let y = 26; y < 190; y += 13) {
    const lineWidth = y % 26 === 0 ? 70 : 125;
    fCtx.fillRect(18, y, lineWidth, 4);
  }
  const frontTex = new THREE.CanvasTexture(frontCanvas);

  // Back face canvas (duplex tinted side in #8f8bff with geometry blueprint diagram)
  const backCanvas = document.createElement('canvas');
  backCanvas.width = 160;
  backCanvas.height = 220;
  const bCtx = backCanvas.getContext('2d')!;
  bCtx.fillStyle = '#eeefff';
  bCtx.fillRect(0, 0, 160, 220);
  bCtx.strokeStyle = '#8f8bff';
  bCtx.lineWidth = 3;
  bCtx.strokeRect(16, 20, 128, 178);
  bCtx.fillStyle = '#8f8bff';
  bCtx.fillRect(24, 32, 50, 5);
  // Duplex watermark indicator
  bCtx.fillStyle = 'rgba(143, 139, 255, 0.5)';
  bCtx.font = 'bold 18px sans-serif';
  bCtx.fillText('DUPLEX', 38, 120);
  const backTex = new THREE.CanvasTexture(backCanvas);

  // Geometry
  const geo = new THREE.PlaneGeometry(width, height);

  // Front mesh (facing +Z)
  const frontMat = new THREE.MeshStandardMaterial({
    map: frontTex,
    roughness: 0.65,
    metalness: 0.05,
    side: THREE.FrontSide
  });
  const frontMesh = new THREE.Mesh(geo, frontMat);
  sheetGroup.add(frontMesh);

  // Back mesh (facing -Z, rotated 180 around Y)
  const backMat = new THREE.MeshStandardMaterial({
    map: backTex,
    roughness: 0.65,
    metalness: 0.05,
    side: THREE.FrontSide
  });
  const backMesh = new THREE.Mesh(geo, backMat);
  backMesh.rotation.y = Math.PI;
  sheetGroup.add(backMesh);

  return sheetGroup;
}

export async function createBindPointModel(loader: GLTFLoader): Promise<ModelInstance> {
  const root = new THREE.Group();
  root.name = 'BindPoint';

  const printerGltf = await loader.loadAsync('/models/printer.glb');
  const printer = printerGltf.scene;
  applyCohesionPass(printer);

  // Upgrade printer materials: clean sleek matte slate casing
  printer.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.geometry.deleteAttribute('color'); // Remove muddy vertex colors
      mesh.material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x3a4258),
        roughness: 0.45,
        metalness: 0.35
      });
    }
  });

  // Normalize printer bounds FIRST
  normalizeModelBounds(printer, 2.1);
  root.add(printer);

  // Paper path animation: 2 duplex sheets in staggered phases
  const sheets: { group: THREE.Group; progress: number }[] = [];
  const numSheets = 2;

  for (let i = 0; i < numSheets; i++) {
    const sheet = createDuplexSheet();
    root.add(sheet);
    sheets.push({
      group: sheet,
      progress: i / numSheets
    });
  }

  // Accent light in printer output slot
  const trayLight = new THREE.PointLight(0x8f8bff, 1.4, 2.2);
  trayLight.position.set(0, 0.95, 0.35);
  root.add(trayLight);

  // Contact shadow
  const contactShadow = createContactShadowMesh(3.0, 0.85);
  root.add(contactShadow);

  return {
    group: root,
    update: (delta: number, _elapsed: number, reducedMotion: boolean) => {
      if (reducedMotion) {
        sheets.forEach((s, idx) => {
          s.group.position.set(0, 0.88 + idx * 0.015, 0.35);
          s.group.rotation.set(-Math.PI * 0.35, 0, 0);
        });
        return;
      }

      // Animate duplex sheets emerging and flipping cleanly
      sheets.forEach((s) => {
        s.progress = (s.progress + delta * 0.32) % 1.0;
        const p = s.progress;

        // Path: exits from slot, glides forward, flips over, lands into output tray
        const x = 0;
        const y = 0.95 + Math.sin(p * Math.PI) * 0.28;
        const z = -0.05 + p * 0.72;

        s.group.position.set(x, y, z);

        // Duplex flip animation: rotates smoothly around X axis from -0.25 rad to 180 deg
        const flipRotation = -Math.PI * 0.25 + p * Math.PI;
        s.group.rotation.x = flipRotation;
        s.group.rotation.y = Math.sin(p * Math.PI * 2) * 0.04;
      });
    }
  };
}
