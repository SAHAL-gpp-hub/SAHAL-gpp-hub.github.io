import * as THREE from 'three';

export function createContactShadowMesh(size = 3.0, opacity = 0.8): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 124);
    gradient.addColorStop(0, 'rgba(4, 6, 14, 0.95)');
    gradient.addColorStop(0.35, 'rgba(5, 7, 16, 0.65)');
    gradient.addColorStop(0.7, 'rgba(6, 8, 18, 0.25)');
    gradient.addColorStop(1, 'rgba(8, 10, 22, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;

  const geometry = new THREE.PlaneGeometry(size, size);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    depthWrite: false,
    toneMapped: false
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.002;
  mesh.name = 'ContactShadow';

  return mesh;
}
