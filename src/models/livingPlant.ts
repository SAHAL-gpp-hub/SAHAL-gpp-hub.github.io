import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ModelInstance } from '../types.ts';
import { applyCohesionPass, normalizeModelBounds } from '../scene/cohesion.ts';
import { createContactShadowMesh } from '../scene/contactShadow.ts';

export async function createLivingPlantModel(loader: GLTFLoader): Promise<ModelInstance> {
  const root = new THREE.Group();
  root.name = 'LivingPlant';

  const plantGltf = await loader.loadAsync('/models/potted_plant.glb');
  const plant = plantGltf.scene;
  applyCohesionPass(plant);

  // Normalize plant bounds FIRST so its pot is grounded at y=0 and height is 2.1
  normalizeModelBounds(plant, 2.1);
  root.add(plant);

  // Procedural ESP32 IoT Board clipped to the pot rim
  const esp32Group = new THREE.Group();
  esp32Group.name = 'ESP32Board';

  // PCB Board (matte dark green)
  const pcbGeo = new THREE.BoxGeometry(0.24, 0.025, 0.36);
  const pcbMat = new THREE.MeshStandardMaterial({
    color: 0x14281a,
    roughness: 0.45,
    metalness: 0.25
  });
  const pcbMesh = new THREE.Mesh(pcbGeo, pcbMat);
  esp32Group.add(pcbMesh);

  // ESP32 SoC shield chip
  const chipGeo = new THREE.BoxGeometry(0.14, 0.02, 0.16);
  const chipMat = new THREE.MeshStandardMaterial({
    color: 0x222630,
    roughness: 0.25,
    metalness: 0.85
  });
  const chipMesh = new THREE.Mesh(chipGeo, chipMat);
  chipMesh.position.set(0, 0.015, -0.05);
  esp32Group.add(chipMesh);

  // Blinking Status LED (emissive #7ddc8a)
  const ledGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.022, 12);
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x7ddc8a,
    emissive: 0x7ddc8a,
    emissiveIntensity: 1.8,
    roughness: 0.2
  });
  const ledMesh = new THREE.Mesh(ledGeo, ledMat);
  ledMesh.position.set(0.06, 0.018, 0.1);
  esp32Group.add(ledMesh);

  const ledLight = new THREE.PointLight(0x7ddc8a, 1.2, 1.0);
  ledLight.position.set(0.06, 0.06, 0.1);
  esp32Group.add(ledLight);

  // Two Soil Probes extending from the board down into the pot soil
  const probeGeo = new THREE.CylinderGeometry(0.008, 0.006, 0.24, 8);
  const probeMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Gold plated probe prongs
    roughness: 0.25,
    metalness: 0.9
  });

  const probe1 = new THREE.Mesh(probeGeo, probeMat);
  probe1.position.set(-0.04, -0.12, 0);
  esp32Group.add(probe1);

  const probe2 = new THREE.Mesh(probeGeo, probeMat);
  probe2.position.set(0.04, -0.12, 0);
  esp32Group.add(probe2);

  // Mount ESP32 neatly on the rim of the pot with probes into soil
  esp32Group.position.set(0.28, 0.45, 0.18);
  esp32Group.rotation.set(-0.15, 0.35, 0.2);
  root.add(esp32Group);

  // Delicate Water Droplet hovering gracefully over the leaf canopy
  const dropletGroup = new THREE.Group();
  const dropSphereGeo = new THREE.SphereGeometry(0.06, 24, 24);
  const dropMat = new THREE.MeshPhysicalMaterial({
    color: 0x7ddc8a,
    emissive: 0x2a5936,
    emissiveIntensity: 0.35,
    roughness: 0.05,
    metalness: 0.05,
    transmission: 0.85,
    transparent: true,
    opacity: 0.9
  });
  const dropMesh = new THREE.Mesh(dropSphereGeo, dropMat);
  dropMesh.scale.set(1.0, 1.35, 1.0);
  dropletGroup.add(dropMesh);

  const dropLight = new THREE.PointLight(0x7ddc8a, 0.8, 0.8);
  dropletGroup.add(dropLight);

  dropletGroup.position.set(0.15, 1.85, 0.15);
  root.add(dropletGroup);

  // Contact shadow
  const contactShadow = createContactShadowMesh(2.6, 0.85);
  root.add(contactShadow);

  const baseDropY = dropletGroup.position.y;

  return {
    group: root,
    update: (_delta: number, elapsed: number, reducedMotion: boolean) => {
      if (reducedMotion) {
        ledLight.intensity = 0.8;
        ledMat.emissiveIntensity = 1.0;
        plant.rotation.set(0, 0, 0);
        dropletGroup.scale.setScalar(1.0);
        dropletGroup.position.y = baseDropY;
        return;
      }

      // Blinking ESP32 LED (periodic IoT status heartbeat)
      const blinkCycle = (elapsed * 2.2) % 2.0;
      const isLedOn = blinkCycle < 0.18 || (blinkCycle > 0.32 && blinkCycle < 0.5);
      const intensity = isLedOn ? 1.6 : 0.05;
      ledLight.intensity = intensity;
      ledMat.emissiveIntensity = isLedOn ? 2.2 : 0.08;

      // Pulsing water droplet
      const pulse = 1.0 + Math.sin(elapsed * 2.8) * 0.12;
      dropletGroup.scale.set(pulse, pulse * 1.25, pulse);
      dropletGroup.position.y = baseDropY + Math.sin(elapsed * 1.8) * 0.03;

      // Subtle leaves swaying
      plant.rotation.z = Math.sin(elapsed * 1.4) * 0.025;
      plant.rotation.x = Math.cos(elapsed * 1.2) * 0.015;
    }
  };
}
