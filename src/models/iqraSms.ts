import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ModelInstance } from '../types.ts';
import { applyCohesionPass, normalizeModelBounds } from '../scene/cohesion.ts';
import { createContactShadowMesh } from '../scene/contactShadow.ts';

function createReportCardTexture(title: string, badge: string, subtitle: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 190;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = 'rgba(14, 18, 34, 0.96)';
  ctx.fillRect(0, 0, 320, 190);

  // Border in accent #ffc857
  ctx.strokeStyle = '#ffc857';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 308, 178);

  // Top header bar
  ctx.fillStyle = 'rgba(255, 200, 87, 0.16)';
  ctx.fillRect(6, 6, 308, 42);

  // Header text
  ctx.fillStyle = '#ffc857';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(title, 20, 33);

  // Badge mark (e.g. "GRADE A+", "RBAC: FACULTY", "TOP 1%")
  ctx.fillStyle = '#ffc857';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(badge, 20, 96);

  // Subtitle / metric
  ctx.fillStyle = '#eceef7';
  ctx.font = '16px sans-serif';
  ctx.fillText(subtitle, 20, 134);

  // Mock barcode / record ID
  ctx.fillStyle = '#8b90ab';
  ctx.font = '12px monospace';
  ctx.fillText('REC-2026-IQRA-SMS', 20, 162);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export async function createIqraSmsModel(loader: GLTFLoader): Promise<ModelInstance> {
  const root = new THREE.Group();
  root.name = 'IqraSMS';

  const buildingGltf = await loader.loadAsync('/models/school_building.glb');
  const building = buildingGltf.scene;
  applyCohesionPass(building);

  // Normalize building bounds FIRST and rotate to 3/4 architectural depth
  normalizeModelBounds(building, 1.9);
  building.rotation.y = -0.38;
  root.add(building);

  // 3 Orbiting report card planes
  const cardsData = [
    { title: 'ACADEMIC RECORD', badge: 'GRADE A+', sub: 'Term Attendance: 99.2%' },
    { title: 'ERP CREDENTIAL', badge: 'RBAC: FACULTY', sub: 'Permissions: Verified' },
    { title: 'STUDENT REPORT', badge: 'TOP 1%', sub: 'Automated Record Sync' }
  ];

  const cards: { mesh: THREE.Mesh; angleOffset: number; baseHeight: number }[] = [];
  const cardGeo = new THREE.PlaneGeometry(0.56, 0.34);

  const orbitRadius = 0.95;

  cardsData.forEach((data, index) => {
    const tex = createReportCardTexture(data.title, data.badge, data.sub);
    const cardMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.95,
      side: THREE.FrontSide
    });

    const cardMesh = new THREE.Mesh(cardGeo, cardMat);
    const angle = (index * 2 * Math.PI) / 3;
    const baseHeight = 0.72 + index * 0.40;
    cardMesh.position.set(Math.cos(angle) * orbitRadius, baseHeight, Math.sin(angle) * orbitRadius);
    cardMesh.lookAt(0, baseHeight, 4.75);
    root.add(cardMesh);

    cards.push({
      mesh: cardMesh,
      angleOffset: angle,
      baseHeight
    });
  });

  // Soft ambient school accent light
  const campusLight = new THREE.PointLight(0xffc857, 1.2, 3.2);
  campusLight.position.set(0, 1.3, 0);
  root.add(campusLight);

  // Contact shadow
  const contactShadow = createContactShadowMesh(3.2, 0.85);
  root.add(contactShadow);

  return {
    group: root,
    update: (_delta: number, elapsed: number, reducedMotion: boolean) => {
      if (reducedMotion) {
        cards.forEach((card) => {
          const angle = card.angleOffset;
          card.mesh.position.set(
            Math.cos(angle) * orbitRadius,
            card.baseHeight,
            Math.sin(angle) * orbitRadius
          );
          card.mesh.lookAt(0, card.baseHeight, 4.75);
        });
        return;
      }

      // Smooth orbital revolution around school building with cards always facing camera
      cards.forEach((card, idx) => {
        const speed = 0.38;
        const currentAngle = elapsed * speed + card.angleOffset;
        const x = Math.cos(currentAngle) * orbitRadius;
        const z = Math.sin(currentAngle) * orbitRadius;
        const y = card.baseHeight + Math.sin(elapsed * 1.5 + idx) * 0.05;

        card.mesh.position.set(x, y, z);
        card.mesh.lookAt(0, y, 4.75);
      });
    }
  };
}
