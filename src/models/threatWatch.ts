import * as THREE from 'three';
import { ModelInstance } from '../types.ts';
import { createContactShadowMesh } from '../scene/contactShadow.ts';

const threatVertexShader = `
  uniform float uTime;
  uniform float uPixelRatio;

  attribute float aIsOutlier;
  attribute float aPhase;
  attribute float aSize;

  varying float vIsOutlier;
  varying float vPhase;

  void main() {
    vIsOutlier = aIsOutlier;
    vPhase = aPhase;

    vec3 pos = position;

    if (aIsOutlier > 0.5) {
      // Outlier pulsing jitter / orbital anomaly drift
      pos.x += sin(uTime * 1.8 + aPhase) * 0.05;
      pos.y += cos(uTime * 2.2 + aPhase) * 0.05;
      pos.z += sin(uTime * 1.5 + aPhase) * 0.05;
    } else {
      // Normal cluster gentle ambient breathing
      pos.y += sin(uTime * 1.0 + aPhase) * 0.02;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float pSize = aSize;
    if (aIsOutlier > 0.5) {
      // Outliers pulse dramatically in size
      pSize *= (1.0 + sin(uTime * 4.0 + aPhase) * 0.4);
    } else {
      pSize *= (1.0 + sin(uTime * 1.2 + aPhase) * 0.15);
    }

    // Size attenuation with distance
    gl_PointSize = pSize * uPixelRatio * (28.0 / -mvPosition.z);
  }
`;

const threatFragmentShader = `
  uniform vec3 uAccentColor;
  uniform vec3 uClusterColor;
  uniform float uTime;

  varying float vIsOutlier;
  varying float vPhase;

  void main() {
    // Circular particle shape
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) {
      discard;
    }

    // Radial softness and glow
    float alpha = smoothstep(0.5, 0.1, dist);

    vec3 color = uClusterColor;
    if (vIsOutlier > 0.5) {
      // Outlier color pulses with high-contrast accent glow
      float pulse = 0.8 + 0.3 * sin(uTime * 5.0 + vPhase);
      color = uAccentColor * pulse;
      alpha = smoothstep(0.5, 0.0, dist) * 0.95;
    } else {
      alpha *= 0.65;
    }

    gl_FragColor = vec4(color, alpha);
  }
`;

export function createThreatWatchModel(): ModelInstance {
  const root = new THREE.Group();
  root.name = 'ThreatWatch';

  const group = new THREE.Group();

  const numClusterPoints = 1200;
  const numOutliers = 3;
  const totalPoints = numClusterPoints + numOutliers;

  const positions = new Float32Array(totalPoints * 3);
  const isOutlier = new Float32Array(totalPoints);
  const phases = new Float32Array(totalPoints);
  const sizes = new Float32Array(totalPoints);

  // 1. Generate Normal Cluster (Standard Gaussian-like distribution)
  for (let i = 0; i < numClusterPoints; i++) {
    const idx = i * 3;
    // Box-Muller transform for normal distribution
    const u1 = Math.max(0.0001, Math.random());
    const u2 = Math.random();
    const radius = Math.sqrt(-2.0 * Math.log(u1)) * 0.52;
    const theta = u2 * Math.PI * 2.0;
    const phi = (Math.random() - 0.5) * Math.PI;

    positions[idx] = radius * Math.cos(theta) * Math.cos(phi);
    positions[idx + 1] = 1.1 + radius * Math.sin(phi);
    positions[idx + 2] = radius * Math.sin(theta) * Math.cos(phi);

    isOutlier[i] = 0.0;
    phases[i] = Math.random() * Math.PI * 2.0;
    sizes[i] = 3.5 + Math.random() * 3.5;
  }

  // 2. Define 3 Prominent Outliers in Project Accent #ff6b81
  const outlierCoords = [
    [1.55, 1.45, 0.75],
    [-1.45, 0.85, 1.1],
    [0.35, 2.05, -1.25]
  ];

  for (let j = 0; j < numOutliers; j++) {
    const pIdx = numClusterPoints + j;
    const idx = pIdx * 3;
    positions[idx] = outlierCoords[j][0];
    positions[idx + 1] = outlierCoords[j][1];
    positions[idx + 2] = outlierCoords[j][2];

    isOutlier[pIdx] = 1.0;
    phases[pIdx] = j * 2.1;
    sizes[pIdx] = 16.0;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aIsOutlier', new THREE.BufferAttribute(isOutlier, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

  const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1.0;

  const shaderMaterial = new THREE.ShaderMaterial({
    vertexShader: threatVertexShader,
    fragmentShader: threatFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uAccentColor: { value: new THREE.Color(0xff6b81) },
      uClusterColor: { value: new THREE.Color(0x62739a) }
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const pointCloud = new THREE.Points(geometry, shaderMaterial);
  group.add(pointCloud);

  // Add 3 vector indicator lines connecting each outlier to cluster center
  const linesGroup = new THREE.Group();
  outlierCoords.forEach((coord) => {
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(coord[0], coord[1], coord[2]),
      new THREE.Vector3(0, 1.1, 0)
    ]);
    const lineMat = new THREE.LineDashedMaterial({
      color: 0xff6b81,
      dashSize: 0.08,
      gapSize: 0.05,
      transparent: true,
      opacity: 0.35
    });
    const lineMesh = new THREE.Line(lineGeo, lineMat);
    lineMesh.computeLineDistances();
    linesGroup.add(lineMesh);

    // Target ring around outlier
    const ringGeo = new THREE.RingGeometry(0.12, 0.14, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff6b81,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(coord[0], coord[1], coord[2]);
    ringMesh.lookAt(0, 1.1, 0);
    linesGroup.add(ringMesh);
  });
  group.add(linesGroup);

  root.add(group);

  // Soft contact shadow
  const contactShadow = createContactShadowMesh(3.2, 0.85);
  root.add(contactShadow);

  return {
    group: root,
    update: (_delta: number, elapsed: number, reducedMotion: boolean) => {
      shaderMaterial.uniforms.uTime.value = elapsed;

      if (reducedMotion) {
        group.rotation.y = 0;
        return;
      }

      // Smooth slow orbit of threat point cloud
      group.rotation.y = elapsed * 0.18;
    },
    dispose: () => {
      geometry.dispose();
      shaderMaterial.dispose();
    }
  };
}
