import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ModelInstance } from '../types.ts';
import { applyCohesionPass, normalizeModelBounds } from '../scene/cohesion.ts';
import { createContactShadowMesh } from '../scene/contactShadow.ts';

function createReportCardTexture(title: string, badge: string, subtitle: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = 'rgba(16, 20, 36, 0.94)';
  ctx.fillRect(0, 0, 256, 160);

  // Border in accent #ffc857
  ctx.strokeStyle = '#ffc857';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 244, 148);

  // Top header bar
  ctx.fillStyle = 'rgba(255, 200, 87, 0.18)';
  ctx.fillRect(6, 6, 244, 38);

  // Header text
  ctx.fillStyle = '#ffc857';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(title, 18, 30);

  // Badge mark (e.g. "A+", "100%", "RBAC")
  ctx.fillStyle = '#ffc857';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText(badge, 18, 88);

  // Subtitle / metric
  ctx.fillStyle = '#eceef7';
  ctx.font = '14px sans-serif';
  ctx.fillText(subtitle, 18, 122);

  // Mock barcode / record ID
  ctx.fillStyle = '#8b90ab';
  ctx.font = '11px monospace';
  ctx.fillText('REC-2026-IQRA-SMS', 18, 142);

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

  // Normalize building bounds FIRST
  normalizeModelBounds(building, 2.2);
  root.add(building);

  // 3 Orbiting report card planes
  const cardsData = [
    { title: 'ACADEMIC RECORD', badge: 'GRADE A+', sub: 'Term Attendance: 99.2%' },
    { title: 'ERP CREDENTIAL', badge: 'RBAC: FACULTY', sub: 'Permissions: Verified' },
    { title: 'STUDENT REPORT', badge: 'TOP 1%', sub: 'Automated Record Sync' }
  ];

  const cards: { mesh: THREE.Mesh; angleOffset: number; baseHeight: number }[] = [];
  const cardGeo = new THREE.PlaneGeometry(0.72, 0.45);

  cardsData.forEach((data, index) => {
    const tex = createReportCardTexture(data.title, data.badge, data.sub);
    const cardMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide
    });

    const cardMesh = new THREE.Mesh(cardGeo, cardMat);
    root.add(cardMesh);

    cards.push({
      mesh: cardMesh,
      angleOffset: (index * 2 * Math.PI) / 3,
      baseHeight: 0.65 + index * 0.5
    });
  });

  // Soft ambient school accent light
  const campusLight = new THREE.PointLight(0xffc857, 1.2, 3.2);
  campusLight.position.set(0, 1.3, 0);
  root.add(campusLight);

  // Contact shadow
  const contactShadow = createContactShadowMesh(3.4, 0.85);
  root.add(contactShadow);

  const orbitRadius = 1.95;

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
          card.mesh.rotation.y = -angle + Math.PI / 2;
        });
        return;
      }

      // Smooth orbital revolution around school building in clear perimeter
      cards.forEach((card, idx) => {
        const speed = 0.52;
        const currentAngle = elapsed * speed + card.angleOffset;
        const x = Math.cos(currentAngle) * orbitRadius;
        const z = Math.sin(currentAngle) * orbitRadius;
        const y = card.baseHeight + Math.sin(elapsed * 1.8 + idx) * 0.08;

        card.mesh.position.set(x, y, z);
        card.mesh.rotation.y = -currentAngle + Math.PI / 2;
        card.mesh.rotation.x = Math.sin(elapsed * 1.4 + idx) * 0.05;
      });
    }
  };
}
