import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ModelInstance } from '../types.ts';
import { applyCohesionPass, normalizeModelBounds } from '../scene/cohesion.ts';
import { createContactShadowMesh } from '../scene/contactShadow.ts';

function poseCharacterNatural(model: THREE.Object3D, isTyping = false): void {
  const upperL = model.getObjectByName('UpperArmL');
  const lowerL = model.getObjectByName('LowerArmL');
  const upperR = model.getObjectByName('UpperArmR');
  const lowerR = model.getObjectByName('LowerArmR');
  const head = model.getObjectByName('Head');

  if (isTyping) {
    // Developer working/typing at workstation desk
    if (upperL && upperR && lowerL && lowerR) {
      // Rotate upper arms down along sides
      upperL.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), 1.18);
      upperR.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), -1.18);

      // Angle upper arms slightly forward towards desk
      upperL.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -0.45);
      upperR.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -0.45);

      // Bend forearms forward towards keyboard
      lowerL.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), -0.92);
      lowerR.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), 0.92);

      // Angle hands symmetrically inward over the keyboard
      lowerL.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -0.55);
      lowerR.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -0.55);
    }
    if (head) {
      head.rotation.x = 0.22;
      head.rotation.y = 0.05;
    }
  } else {
    // Technical lead standing naturally, reviewing screen telemetry
    if (upperL && upperR && lowerL && lowerR) {
      // Natural relaxed arm hang
      upperL.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), 1.25);
      upperR.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), -1.25);

      upperL.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -0.15);
      upperR.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -0.15);

      lowerL.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), -0.25);
      lowerR.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), 0.25);
    }
    if (head) {
      head.rotation.x = 0.12;
      head.rotation.y = -0.32;
    }
  }
}

function createModernOfficeDesk(): THREE.Group {
  const desk = new THREE.Group();

  // Modern Desk Surface
  const topGeo = new THREE.BoxGeometry(1.6, 0.05, 0.85);
  const topMat = new THREE.MeshStandardMaterial({
    color: 0x1c2132,
    roughness: 0.45,
    metalness: 0.2
  });
  const top = new THREE.Mesh(topGeo, topMat);
  top.position.y = 0.72;
  desk.add(top);

  // Slim metallic legs
  const legGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.72, 12);
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x2e354a,
    roughness: 0.35,
    metalness: 0.65
  });

  const legPositions = [
    [-0.72, 0.36, -0.36],
    [0.72, 0.36, -0.36],
    [-0.72, 0.36, 0.36],
    [0.72, 0.36, 0.36]
  ];

  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, y, z);
    desk.add(leg);
  });

  // Dual Ultra-wide Monitors
  const standMat = new THREE.MeshStandardMaterial({ color: 0x181c28, roughness: 0.3, metalness: 0.8 });

  // Monitor 1: Primary Simulation Dashboard
  const m1Group = new THREE.Group();
  const m1Frame = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.42, 0.02), standMat);
  m1Group.add(m1Frame);

  const canvas1 = document.createElement('canvas');
  canvas1.width = 256;
  canvas1.height = 160;
  const ctx1 = canvas1.getContext('2d')!;
  ctx1.fillStyle = '#0a1020';
  ctx1.fillRect(0, 0, 256, 160);
  ctx1.fillStyle = '#5ee0ff';
  ctx1.font = 'bold 14px monospace';
  ctx1.fillText('> SIMOFFICE 3D CLUSTER', 16, 28);
  ctx1.fillStyle = 'rgba(94, 224, 255, 0.4)';
  ctx1.fillRect(16, 38, 224, 2);
  // Graph lines
  ctx1.strokeStyle = '#5ee0ff';
  ctx1.lineWidth = 2.5;
  ctx1.beginPath();
  ctx1.moveTo(16, 120);
  ctx1.lineTo(60, 85);
  ctx1.lineTo(110, 105);
  ctx1.lineTo(160, 55);
  ctx1.lineTo(210, 75);
  ctx1.stroke();
  const screen1Tex = new THREE.CanvasTexture(canvas1);
  const screen1Mat = new THREE.MeshBasicMaterial({ map: screen1Tex, side: THREE.DoubleSide });
  const screen1 = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.38), screen1Mat);
  screen1.position.z = 0.012;
  m1Group.add(screen1);

  // Stand pole & base
  const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.22), standMat);
  pole1.position.set(0, -0.21, -0.04);
  m1Group.add(pole1);
  const base1 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.012, 16), standMat);
  base1.position.set(0, -0.32, -0.04);
  m1Group.add(base1);

  m1Group.position.set(-0.2, 1.05, 0.12);
  desk.add(m1Group);

  // Monitor 2: Secondary Terminal
  const m2Group = m1Group.clone();
  m2Group.position.set(0.48, 1.05, 0.08);
  m2Group.rotation.y = -0.25;
  desk.add(m2Group);

  // Keyboard and Mouse
  const kbGeo = new THREE.BoxGeometry(0.38, 0.012, 0.14);
  const kbMat = new THREE.MeshStandardMaterial({ color: 0x141824, roughness: 0.6 });
  const kb = new THREE.Mesh(kbGeo, kbMat);
  kb.position.set(-0.15, 0.75, 0.26);
  desk.add(kb);

  const mouseGeo = new THREE.BoxGeometry(0.05, 0.012, 0.08);
  const mouse = new THREE.Mesh(mouseGeo, kbMat);
  mouse.position.set(0.18, 0.75, 0.26);
  desk.add(mouse);

  return desk;
}

export async function createSimOfficeModel(loader: GLTFLoader): Promise<ModelInstance> {
  const root = new THREE.Group();
  root.name = 'SimOffice';

  const [chairGltf, char1Gltf, char2Gltf] = await Promise.all([
    loader.loadAsync('/models/office_chair.glb'),
    loader.loadAsync('/models/character_casual1.glb'),
    loader.loadAsync('/models/character_suit.glb')
  ]);

  const chair = chairGltf.scene;
  const char1 = char1Gltf.scene;
  const char2 = char2Gltf.scene;

  applyCohesionPass(chair);
  applyCohesionPass(char1);
  applyCohesionPass(char2);

  // Naturally pose both characters with arms folded down
  poseCharacterNatural(char1, true); // Developer typing
  poseCharacterNatural(char2, false); // Lead reviewing

  const sceneGroup = new THREE.Group();

  // Solid Platform Slab
  const slabGeo = new THREE.CylinderGeometry(1.4, 1.45, 0.06, 36);
  const slabMat = new THREE.MeshStandardMaterial({
    color: 0x121626,
    roughness: 0.55,
    metalness: 0.2
  });
  const slabMesh = new THREE.Mesh(slabGeo, slabMat);
  slabMesh.position.y = 0.03;
  sceneGroup.add(slabMesh);

  // Accent rim on platform edge
  const rimGeo = new THREE.TorusGeometry(1.42, 0.012, 12, 48);
  const rimMat = new THREE.MeshBasicMaterial({ color: 0x5ee0ff });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = 0.06;
  sceneGroup.add(rimMesh);

  // Modern Office Workstation Desk
  const desk = createModernOfficeDesk();
  desk.position.set(0.05, 0.06, -0.05);
  sceneGroup.add(desk);

  // Office Chair - neatly arranged beside workstation
  chair.scale.set(0.42, 0.42, 0.42);
  chair.position.set(-0.56, 0.06, 0.22);
  chair.rotation.y = Math.PI * 0.85;
  sceneGroup.add(chair);

  // Character 1 (Developer working and typing at workstation desk)
  char1.scale.set(0.68, 0.68, 0.68);
  char1.position.set(-0.12, 0.06, 0.44);
  char1.rotation.y = Math.PI;
  sceneGroup.add(char1);

  // Character 2 (Lead standing on the right reviewing the monitors)
  char2.scale.set(0.68, 0.68, 0.68);
  char2.position.set(0.72, 0.06, 0.15);
  char2.rotation.y = -Math.PI * 0.45;
  sceneGroup.add(char2);

  // Ambient monitor screen glow
  const monitorGlow = new THREE.PointLight(0x5ee0ff, 1.2, 2.6);
  monitorGlow.position.set(0.05, 1.15, 0.25);
  sceneGroup.add(monitorGlow);

  // Turn scene group slightly to cinematic 3/4 angle
  sceneGroup.rotation.y = Math.PI * 0.12;

  // Normalize bounds
  normalizeModelBounds(sceneGroup, 2.2);
  root.add(sceneGroup);

  // Ground contact shadow
  const contactShadow = createContactShadowMesh(3.4, 0.85);
  root.add(contactShadow);

  const initialChar1Y = char1.position.y;
  const initialChar2Y = char2.position.y;

  return {
    group: root,
    update: (_delta: number, elapsed: number, reducedMotion: boolean) => {
      if (reducedMotion) {
        char1.position.y = initialChar1Y;
        char2.position.y = initialChar2Y;
        monitorGlow.intensity = 0.8;
        return;
      }

      // Subtle breathing / bobbing animation on characters
      char1.position.y = initialChar1Y + Math.sin(elapsed * 2.2) * 0.012;
      char2.position.y = initialChar2Y + Math.sin(elapsed * 2.0 + 1.2) * 0.012;

      // Monitor screen accent pulse
      monitorGlow.intensity = 1.0 + Math.sin(elapsed * 3.2) * 0.2;
    }
  };
}
