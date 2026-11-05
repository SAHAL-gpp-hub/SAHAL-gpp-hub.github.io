import * as THREE from 'three';

export function applyCohesionPass(root: THREE.Object3D): void {
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = false;
      mesh.receiveShadow = false;

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((mat, idx) => {
        if (!mat) return;

        let stdMat: THREE.MeshStandardMaterial;

        if (mat instanceof THREE.MeshStandardMaterial) {
          stdMat = mat;
        } else {
          // Convert non-standard materials to MeshStandardMaterial
          stdMat = new THREE.MeshStandardMaterial({
            color: (mat as any).color ? (mat as any).color.clone() : new THREE.Color(0xdde1f0),
            map: (mat as any).map || null,
            normalMap: (mat as any).normalMap || null,
            roughness: 0.55,
            metalness: 0.15
          });
          if (Array.isArray(mesh.material)) {
            mesh.material[idx] = stdMat;
          } else {
            mesh.material = stdMat;
          }
        }

        // Harmonize roughness and metalness
        stdMat.roughness = Math.max(0.42, Math.min(0.78, stdMat.roughness ?? 0.55));
        stdMat.metalness = Math.max(0.08, Math.min(0.35, stdMat.metalness ?? 0.12));
        stdMat.envMapIntensity = 0.55;

        // Soften overly intense specular highlights
        if (stdMat.color) {
          // Harmonize saturation if too garish
          const hsl = { h: 0, s: 0, l: 0 };
          stdMat.color.getHSL(hsl);
          if (hsl.s > 0.85) {
            hsl.s = 0.72;
            stdMat.color.setHSL(hsl.h, hsl.s, hsl.l);
          }
        }

        stdMat.needsUpdate = true;
      });
    }
  });
}

export function normalizeModelBounds(
  root: THREE.Object3D,
  targetMaxDimension = 2.2,
  groundOffset = 0.0
): { box: THREE.Box3; size: THREE.Vector3; center: THREE.Vector3 } {
  // Reset existing root transform
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.scale.set(1, 1, 1);
  root.updateMatrixWorld(true);

  // Compute current bounding box
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0.0001) {
    const scaleFactor = targetMaxDimension / maxDim;
    root.scale.setScalar(scaleFactor);
    root.updateMatrixWorld(true);
  }

  // Recompute after scaling
  const finalBox = new THREE.Box3().setFromObject(root);
  const finalCenter = new THREE.Vector3();
  finalBox.getCenter(finalCenter);
  finalBox.getSize(size);

  // Shift model so it is centered on X and Z, and the bottom sits at y = groundOffset
  root.position.x = -finalCenter.x;
  root.position.y = -finalBox.min.y + groundOffset;
  root.position.z = -finalCenter.z;
  root.updateMatrixWorld(true);

  return { box: finalBox, size, center: finalCenter };
}
