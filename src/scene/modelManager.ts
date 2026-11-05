import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { ModelInstance } from '../types.ts';
import { createSimOfficeModel } from '../models/simOffice.ts';
import { createLivingPlantModel } from '../models/livingPlant.ts';
import { createBindPointModel } from '../models/bindPoint.ts';
import { createIqraSmsModel } from '../models/iqraSms.ts';
import { createThreatWatchModel } from '../models/threatWatch.ts';

export class ModelManager {
  private loader: GLTFLoader;
  private cache: Map<string, ModelInstance> = new Map();
  private scene: THREE.Object3D;

  private currentInstance: ModelInstance | null = null;
  private currentId: string | null = null;

  // Cross-fade state
  private outgoingInstance: ModelInstance | null = null;
  private crossFadeProgress = 1.0;
  private readonly crossFadeDuration = 0.45; // seconds

  constructor(scene: THREE.Object3D) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.loader.setMeshoptDecoder(MeshoptDecoder);
  }

  public async preloadFirst(projectId: string, onProgress?: (percent: number) => void): Promise<ModelInstance> {
    return this.load(projectId, onProgress);
  }

  public async switchProject(projectId: string, onProgress?: (percent: number) => void): Promise<void> {
    if (this.currentId === projectId) return;

    if (onProgress) onProgress(0.15);
    const nextInstance = await this.load(projectId, onProgress);
    if (onProgress) onProgress(1.0);

    // Prepare cross-fade
    this.outgoingInstance = this.currentInstance;
    this.currentInstance = nextInstance;
    this.currentId = projectId;
    this.crossFadeProgress = 0.0;

    // Ensure new model is in scene
    if (!this.scene.children.includes(nextInstance.group)) {
      this.scene.add(nextInstance.group);
    }
    nextInstance.group.visible = true;
    this.setModelOpacity(nextInstance.group, 0.0);
    nextInstance.group.scale.setScalar(0.96);
  }

  private async load(projectId: string, onProgress?: (percent: number) => void): Promise<ModelInstance> {
    if (this.cache.has(projectId)) {
      if (onProgress) onProgress(1.0);
      return this.cache.get(projectId)!;
    }

    if (onProgress) onProgress(0.3);

    let instance: ModelInstance;
    switch (projectId) {
      case 'simoffice':
        instance = await createSimOfficeModel(this.loader);
        break;
      case 'living-plant':
        instance = await createLivingPlantModel(this.loader);
        break;
      case 'bindPoint':
      case 'bindpoint':
        instance = await createBindPointModel(this.loader);
        break;
      case 'iqra-sms':
        instance = await createIqraSmsModel(this.loader);
        break;
      case 'threatwatch':
        instance = createThreatWatchModel();
        break;
      default:
        throw new Error(`Unknown project ID: ${projectId}`);
    }

    if (onProgress) onProgress(0.9);
    this.cache.set(projectId, instance);
    return instance;
  }

  public update(delta: number, elapsed: number, reducedMotion: boolean): void {
    // Cross-fade animation
    if (this.crossFadeProgress < 1.0) {
      this.crossFadeProgress += delta / this.crossFadeDuration;
      if (this.crossFadeProgress > 1.0) this.crossFadeProgress = 1.0;

      const t = this.crossFadeProgress;
      // Smooth cubic easing
      const ease = t * t * (3 - 2 * t);

      if (this.currentInstance) {
        this.setModelOpacity(this.currentInstance.group, ease);
        const scale = 0.96 + 0.04 * ease;
        this.currentInstance.group.scale.setScalar(scale);
      }

      if (this.outgoingInstance) {
        this.setModelOpacity(this.outgoingInstance.group, 1.0 - ease);
        const scale = 1.0 - 0.04 * ease;
        this.outgoingInstance.group.scale.setScalar(scale);

        if (this.crossFadeProgress >= 1.0) {
          this.scene.remove(this.outgoingInstance.group);
          this.outgoingInstance.group.visible = false;
          this.outgoingInstance = null;
        }
      }
    }

    // Update active instances
    if (this.currentInstance) {
      this.currentInstance.update(delta, elapsed, reducedMotion);
    }
    if (this.outgoingInstance) {
      this.outgoingInstance.update(delta, elapsed, reducedMotion);
    }
  }

  private setModelOpacity(root: THREE.Object3D, opacity: number): void {
    root.traverse((child) => {
      // Handle materials for Mesh, Points, Line, etc.
      if ((child as any).material) {
        const materials = Array.isArray((child as any).material)
          ? (child as any).material
          : [(child as any).material];
        materials.forEach((mat: THREE.Material) => {
          if (mat) {
            mat.transparent = true;
            mat.opacity = opacity;
            if ((mat as THREE.ShaderMaterial).uniforms?.uOpacity) {
              (mat as THREE.ShaderMaterial).uniforms.uOpacity.value = opacity;
            }
          }
        });
      }

      // Handle lights during cross-fade
      if ((child as any).isLight) {
        const light = child as THREE.Light;
        if ((light as any)._baseIntensity === undefined) {
          (light as any)._baseIntensity = light.intensity;
        }
        light.intensity = (light as any)._baseIntensity * opacity;
      }
    });
  }

  public getCurrentId(): string | null {
    return this.currentId;
  }
}
