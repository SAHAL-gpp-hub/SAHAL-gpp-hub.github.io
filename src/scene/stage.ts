import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { ModelManager } from './modelManager.ts';

export class PortfolioStage {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private stageGroup: THREE.Group;
  private modelManager: ModelManager;

  // Reduced motion preference
  private reducedMotion = false;

  // Camera intro animation
  private isIntroActive = true;
  private introProgress = 0.0;
  private readonly introDuration = 1.35;
  private introStartPos = new THREE.Vector3(0, 3.2, 7.8);
  private cameraTargetPos = new THREE.Vector3(0, 1.45, 4.4);
  private cameraLookTarget = new THREE.Vector3(0, 0.95, 0);

  // Inertia Drag Controls
  private isDragging = false;
  private prevPointerX = 0;
  private prevPointerY = 0;
  private velocityY = 0;
  private velocityX = 0;
  private targetRotationY = 0;
  private targetRotationX = 0;

  // Performance frame timing metrics
  private frameTimes: number[] = [];
  private lastTime = 0;
  private clock = new THREE.Clock();

  constructor(container: HTMLElement) {
    this.container = container;

    // Detect reduced motion
    this.checkReducedMotion();
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
      this.checkReducedMotion();
    });

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 50);

    if (this.reducedMotion) {
      this.isIntroActive = false;
      this.camera.position.copy(this.cameraTargetPos);
    } else {
      this.camera.position.copy(this.introStartPos);
    }
    this.camera.lookAt(this.cameraLookTarget);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // 4. Lights
    this.setupLights();

    // 5. Stage Pivot Group (for smooth drag rotation)
    this.stageGroup = new THREE.Group();
    this.stageGroup.name = 'StagePivot';
    this.scene.add(this.stageGroup);

    // 6. Model Manager
    this.modelManager = new ModelManager(this.stageGroup);

    // 7. Event listeners
    this.setupEvents();
    this.setupHDRI();

    // 8. Start Render Loop
    this.lastTime = performance.now();
    this.render = this.render.bind(this);
    requestAnimationFrame(this.render);
  }

  private checkReducedMotion(): void {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.reducedMotion) {
      this.isIntroActive = false;
      if (this.camera) {
        this.camera.position.copy(this.cameraTargetPos);
      }
    }
  }

  private setupLights(): void {
    // Shared Hemisphere Light (warm top, midnight ground)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x14182b, 0.9);
    hemiLight.position.set(0, 10, 0);
    this.scene.add(hemiLight);

    // Key Light
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.45);
    keyLight.position.set(5, 8, 5);
    this.scene.add(keyLight);

    // Rim / Fill Light in cool indigo
    const rimLight = new THREE.DirectionalLight(0x7a8eff, 0.85);
    rimLight.position.set(-5, 4, -5);
    this.scene.add(rimLight);
  }

  private setupHDRI(): void {
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load(
      '/hdri/potsdamer_platz_1k.hdr',
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.environment = texture;
        this.scene.environmentIntensity = 0.35;
      },
      undefined,
      (err) => {
        console.warn('HDRI environment fallback:', err);
      }
    );
  }

  private setupEvents(): void {
    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    resizeObserver.observe(this.container);

    // Drag / Touch Controls
    const el = this.renderer.domElement;
    el.style.touchAction = 'none';

    el.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
      this.velocityY = 0;
      this.velocityX = 0;
      el.setPointerCapture(e.pointerId);
    });

    el.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevPointerX;
      const dy = e.clientY - this.prevPointerY;
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;

      const sensitivity = 0.0055;
      this.velocityY = dx * sensitivity;
      this.velocityX = dy * (sensitivity * 0.5);

      this.targetRotationY += this.velocityY;
      this.targetRotationX = Math.max(-0.25, Math.min(0.4, this.targetRotationX + this.velocityX));
    });

    const stopDrag = (e: PointerEvent) => {
      if (this.isDragging) {
        this.isDragging = false;
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    };

    el.addEventListener('pointerup', stopDrag);
    el.addEventListener('pointercancel', stopDrag);
  }

  public handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;

    // Adapt camera framing for mobile vs desktop
    if (width < 860) {
      this.cameraTargetPos.set(0, 1.55, 5.0);
    } else {
      this.cameraTargetPos.set(0, 1.45, 4.75);
    }

    if (!this.isIntroActive) {
      this.camera.position.copy(this.cameraTargetPos);
    }

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public getModelManager(): ModelManager {
    return this.modelManager;
  }

  private render(): void {
    requestAnimationFrame(this.render);

    const now = performance.now();
    const frameDeltaMs = now - this.lastTime;
    this.lastTime = now;

    // Track frame timing (keep rolling 300 frames)
    this.frameTimes.push(frameDeltaMs);
    if (this.frameTimes.length > 300) {
      this.frameTimes.shift();
    }

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    // 1. Intro Animation
    if (this.isIntroActive) {
      this.introProgress += delta / this.introDuration;
      if (this.introProgress >= 1.0) {
        this.introProgress = 1.0;
        this.isIntroActive = false;
        this.camera.position.copy(this.cameraTargetPos);
      } else {
        // Smooth cubic ease-out
        const t = this.introProgress;
        const ease = 1 - Math.pow(1 - t, 3);
        this.camera.position.lerpVectors(this.introStartPos, this.cameraTargetPos, ease);
      }
      this.camera.lookAt(this.cameraLookTarget);
    }

    // 2. Inertia drag rotation (motion answers user action only)
    if (!this.isDragging) {
      // Damping on release velocity
      this.velocityY *= 0.92;
      this.velocityX *= 0.92;
      this.targetRotationY += this.velocityY;
      this.targetRotationX = Math.max(-0.25, Math.min(0.4, this.targetRotationX + this.velocityX));
    }

    // Smoothly apply rotation to stageGroup
    this.stageGroup.rotation.y = THREE.MathUtils.lerp(this.stageGroup.rotation.y, this.targetRotationY, 0.1);
    this.stageGroup.rotation.x = THREE.MathUtils.lerp(this.stageGroup.rotation.x, this.targetRotationX, 0.1);

    // 3. Update active models
    this.modelManager.update(delta, elapsed, this.reducedMotion);

    // 4. Render
    this.renderer.render(this.scene, this.camera);
  }

  public getP95FrameTime(): number {
    if (this.frameTimes.length === 0) return 16.6;
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index];
  }
}
