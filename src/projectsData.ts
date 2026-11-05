import { ProjectItem } from './types.ts';

export const OWNER_INFO = {
  name: 'Sahal Mansiya',
  headline: 'Real data, real hardware, real-time 3D.',
  lead: 'I build interactive 3D in the browser, IoT digital twins and the production backends behind them.',
  location: 'Gujarat, India',
  email: 'manasiyasahal98@gmail.com',
  github: 'https://github.com/SAHAL-gpp-hub',
  linkedin: 'https://www.linkedin.com/in/sahal-mansiya-49abbb374/'
};

export const PROJECTS: ProjectItem[] = [
  {
    id: 'simoffice',
    name: 'SimOffice',
    accent: '#5ee0ff',
    description: 'Browser-based 3D collaborative simulation and cybersecurity training platform.',
    tags: ['Three.js', 'TypeScript', 'Docker'],
    url: 'https://github.com/SAHAL-gpp-hub/SimOffice'
  },
  {
    id: 'living-plant',
    name: 'Living Plant',
    accent: '#7ddc8a',
    description: 'IoT digital twin that connects physical soil sensors to a reactive 3D WebGL model.',
    tags: ['ESP32', 'Three.js', 'Node.js'],
    url: 'https://github.com/SAHAL-gpp-hub/living-plant'
  },
  {
    id: 'bindpoint',
    name: 'BindPoint',
    accent: '#8f8bff',
    description: 'Production print management app with automated duplex geometry analysis and payments.',
    tags: ['React', 'TypeScript', 'Tailwind'],
    url: 'https://github.com/SAHAL-gpp-hub/BindPoint'
  },
  {
    id: 'iqra-sms',
    name: 'Iqra SMS',
    accent: '#ffc857',
    description: 'School management ERP with role-based access control and automated records.',
    tags: ['FastAPI', 'PostgreSQL', 'React'],
    url: 'https://github.com/SAHAL-gpp-hub/sms'
  },
  {
    id: 'threatwatch',
    name: 'ThreatWatch',
    accent: '#ff6b81',
    description: 'Insider threat detection prototype using unsupervised anomaly scoring on activity logs.',
    tags: ['Python', 'Scikit-learn'],
    url: 'https://github.com/SAHAL-gpp-hub/threatwatch-prototype'
  }
];
