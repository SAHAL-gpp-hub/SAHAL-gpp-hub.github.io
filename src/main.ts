import './style.css';
import { PROJECTS } from './projectsData.ts';
import { PortfolioStage } from './scene/stage.ts';
import { setupCreditsModal } from './ui/creditsModal.ts';

class PortfolioApp {
  private stage: PortfolioStage;
  private activeIndex = 0;
  private projectButtons: HTMLButtonElement[] = [];
  private isSwitching = false;

  constructor() {
    const stageContainer = document.getElementById('stage-container');
    if (!stageContainer) throw new Error('Stage container not found');

    this.stage = new PortfolioStage(stageContainer);

    this.renderProjectList();
    this.setupKeyboardNavigation();
    setupCreditsModal();

    // Initialize with first project
    this.selectProject(0, true);
  }

  private renderProjectList(): void {
    const listEl = document.getElementById('project-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    this.projectButtons = [];

    PROJECTS.forEach((proj, idx) => {
      const li = document.createElement('li');
      li.className = 'project-item';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'project-btn';
      btn.id = `project-btn-${proj.id}`;
      btn.textContent = proj.name;
      btn.setAttribute('aria-current', idx === 0 ? 'true' : 'false');
      btn.style.setProperty('--project-accent', proj.accent);

      btn.addEventListener('click', () => {
        if (this.activeIndex === idx && !this.isSwitching) return;
        this.selectProject(idx);
      });

      li.appendChild(btn);
      listEl.appendChild(li);
      this.projectButtons.push(btn);
    });
  }

  private async selectProject(index: number, isInitial = false): Promise<void> {
    if (index < 0 || index >= PROJECTS.length) return;
    this.activeIndex = index;
    const project = PROJECTS[index];

    // 1. Update CSS accent color via custom property
    document.documentElement.style.setProperty('--accent-color', project.accent);

    // 2. Update aria-current & buttons state
    this.projectButtons.forEach((btn, idx) => {
      const isActive = idx === index;
      btn.setAttribute('aria-current', isActive ? 'true' : 'false');
      if (isActive) {
        btn.style.setProperty('--load-progress', '0.1');
      } else {
        btn.style.removeProperty('--load-progress');
      }
    });

    // 3. Update detail panel
    this.updateDetailPanel(project);

    // 4. Switch 3D model with progress reporting for loading indicator
    this.isSwitching = true;
    const activeBtn = this.projectButtons[index];

    try {
      const modelManager = this.stage.getModelManager();
      if (isInitial) {
        await modelManager.preloadFirst(project.id, (p) => {
          activeBtn.style.setProperty('--load-progress', p.toFixed(2));
        });
        await modelManager.switchProject(project.id);
      } else {
        await modelManager.switchProject(project.id, (p) => {
          activeBtn.style.setProperty('--load-progress', p.toFixed(2));
        });
      }
      activeBtn.style.setProperty('--load-progress', '1');
    } catch (err) {
      console.error(`Failed to load 3D model for ${project.id}:`, err);
    } finally {
      this.isSwitching = false;
    }
  }

  private updateDetailPanel(project: (typeof PROJECTS)[0]): void {
    const descEl = document.getElementById('detail-desc');
    const tagsEl = document.getElementById('detail-tags');
    const linkEl = document.getElementById('detail-link') as HTMLAnchorElement | null;
    const panelEl = document.getElementById('project-detail');

    if (descEl) descEl.textContent = project.description;

    if (tagsEl) {
      tagsEl.innerHTML = '';
      project.tags.forEach((tag) => {
        const span = document.createElement('span');
        span.className = 'detail-tag';
        span.textContent = tag;
        tagsEl.appendChild(span);
      });
    }

    if (linkEl) {
      linkEl.href = project.url;
      linkEl.setAttribute('aria-label', `View ${project.name} repository on GitHub`);
    }

    if (panelEl) {
      panelEl.style.borderColor = `color-mix(in srgb, ${project.accent} 25%, rgba(139, 144, 171, 0.18))`;
    }
  }

  private setupKeyboardNavigation(): void {
    window.addEventListener('keydown', (e) => {
      // Don't intercept arrows if user is inside a dialog or typing in an input
      if (document.querySelector('dialog[open]')) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (this.activeIndex + 1) % PROJECTS.length;
        this.selectProject(nextIndex);
        this.projectButtons[nextIndex]?.focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (this.activeIndex - 1 + PROJECTS.length) % PROJECTS.length;
        this.selectProject(prevIndex);
        this.projectButtons[prevIndex]?.focus();
      }
    });
  }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  new PortfolioApp();
});
