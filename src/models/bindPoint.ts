import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ModelInstance } from '../types.ts';
import { applyCohesionPass, normalizeModelBounds } from '../scene/cohesion.ts';
import { createContactShadowMesh } from '../scene/contactShadow.ts';

function createDuplexSheet(): THREE.Group {
  const sheetGroup = new THREE.Group();
  const width = 0.38;
  const height = 0.50;

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

  // Upgrade printer materials: distinct casing, trays, and metallic highlights
  printer.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.geometry.deleteAttribute('color'); // Remove muddy vertex colors
      mesh.material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x323c52), // Sleek professional matte tech casing
        roughness: 0.42,
        metalness: 0.25
      });
    }
  });

  const printerGroup = new THREE.Group();

  // Normalize printer bounds FIRST
  normalizeModelBounds(printer, 2.1);
  printerGroup.add(printer);

  // Printer control panel status light
  const panelLight = new THREE.PointLight(0x8f8bff, 1.2, 2.0);
  panelLight.position.set(0.35, 0.92, 0.35);
  printerGroup.add(panelLight);

  // Paper path animation: 2 duplex sheets in staggered phases
  const sheets: { group: THREE.Group; progress: number }[] = [];
  const numSheets = 2;

  for (let i = 0; i < numSheets; i++) {
    const sheet = createDuplexSheet();
    printerGroup.add(sheet);
    sheets.push({
      group: sheet,
      progress: i / numSheets
    });
  }

  // Accent light in printer output slot
  const trayLight = new THREE.PointLight(0x8f8bff, 1.4, 2.2);
  trayLight.position.set(0, 0.92, -0.2);
  printerGroup.add(trayLight);

  // Rotate printer to dynamic 3/4 perspective
  printerGroup.rotation.y = 0.38;
  root.add(printerGroup);

  // Contact shadow
  const contactShadow = createContactShadowMesh(3.0, 0.85);
  root.add(contactShadow);

  return {
    group: root,
    update: (delta: number, _elapsed: number, reducedMotion: boolean) => {
      if (reducedMotion) {
        sheets.forEach((s, idx) => {
          if (idx === 0) {
            s.group.position.set(0, 1.12, 0.32);
            s.group.rotation.set(-Math.PI * 0.22, 0, 0);
          } else {
            s.group.position.set(0, 0.91, -0.42);
            s.group.rotation.set(0.08, 0, 0);
          }
        });
        return;
      }

      // Animate duplex sheets emerging, flipping in mid-air, and landing into tray
      sheets.forEach((s) => {
        s.progress = (s.progress + delta * 0.32) % 1.0;
        const p = s.progress;

        // Elevated path completely above printer casing
        const x = 0;
        const y = 1.06 + Math.sin(p * Math.PI) * 0.34 - p * 0.15;
        const z = 0.35 - p * 0.85;

        s.group.position.set(x, y, z);

        // Duplex flip: rotates from feed angle to 180-deg flip to show duplex tinted back
        const flipRotation = -Math.PI * 0.22 + p * Math.PI * 1.25;
        s.group.rotation.x = flipRotation;
        s.group.rotation.y = Math.sin(p * Math.PI * 2) * 0.04;
      });
    }
  };
}
