export interface ProjectItem {
  id: string;
  name: string;
  accent: string;
  description: string;
  tags: string[];
  url: string;
}

export interface ModelInstance {
  group: import('three').Group;
  update: (delta: number, elapsed: number, reducedMotion: boolean) => void;
  dispose?: () => void;
}
