// Route table (owned by the head). Navbar reads it; App renders it. Pages are lazy-loaded default exports.
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import {
  Brain, Cpu, Dna, FileText, FlaskConical, Gamepad2, GitCompare, Globe, HeartHandshake, House, IndianRupee,
  LayoutDashboard, Link2, Lock, MessageSquareWarning, Network, QrCode, Radar, ScanLine, Siren, SlidersHorizontal,
  Terminal, Trophy, Users, Workflow, type LucideIcon,
} from 'lucide-react';

/** primary = top navigation (spec order), more = "More" menu, hidden = reachable by link/button only. */
export type NavGroup = 'primary' | 'more' | 'hidden';

export interface AppRoute {
  path: string;
  label: string;
  group: NavGroup;
  icon: LucideIcon;
  component: LazyExoticComponent<ComponentType>;
}

export const ROUTES: AppRoute[] = [
  { path: '/', label: 'Home', group: 'primary', icon: House, component: lazy(() => import('./pages/Landing')) },
  { path: '/live', label: 'Live Protection', group: 'primary', icon: Radar, component: lazy(() => import('./pages/LiveProtection')) },
  { path: '/qr', label: 'Scan QR', group: 'primary', icon: ScanLine, component: lazy(() => import('./pages/QrShield')) },
  { path: '/message', label: 'Analyze Message', group: 'primary', icon: MessageSquareWarning, component: lazy(() => import('./pages/MessageShield')) },
  { path: '/url', label: 'Analyze URL', group: 'primary', icon: Link2, component: lazy(() => import('./pages/UrlShield')) },
  { path: '/payment', label: 'Payment Risk', group: 'primary', icon: IndianRupee, component: lazy(() => import('./pages/PaymentAnalyzer')) },
  { path: '/lab', label: 'Scam Lab', group: 'primary', icon: FlaskConical, component: lazy(() => import('./pages/ScamLab')) },
  { path: '/threat-intel', label: 'Threat Intelligence', group: 'primary', icon: Globe, component: lazy(() => import('./pages/ThreatIntel')) },
  { path: '/privacy', label: 'Privacy', group: 'primary', icon: Lock, component: lazy(() => import('./pages/PrivacyCenter')) },
  { path: '/simulation', label: 'Live Attack Simulation', group: 'more', icon: Siren, component: lazy(() => import('./pages/LiveSimulation')) },
  { path: '/dna', label: 'Scam DNA', group: 'more', icon: Dna, component: lazy(() => import('./pages/ScamDna')) },
  { path: '/attack-chain', label: 'Attack Chain', group: 'more', icon: Workflow, component: lazy(() => import('./pages/AttackChain')) },
  { path: '/explain', label: 'Risk Explanation', group: 'more', icon: Brain, component: lazy(() => import('./pages/RiskExplanation')) },
  { path: '/what-if', label: 'What-If Simulator', group: 'more', icon: SlidersHorizontal, component: lazy(() => import('./pages/WhatIf')) },
  { path: '/counterfactual', label: 'Counterfactual AI', group: 'more', icon: GitCompare, component: lazy(() => import('./pages/Counterfactual')) },
  { path: '/signals', label: 'Signals Connected', group: 'more', icon: Network, component: lazy(() => import('./pages/SignalsConnected')) },
  { path: '/trusted', label: 'Trusted Contact', group: 'more', icon: Users, component: lazy(() => import('./pages/TrustedContact')) },
  { path: '/elder', label: 'Elder Mode', group: 'more', icon: HeartHandshake, component: lazy(() => import('./pages/ElderMode')) },
  { path: '/report', label: 'Incident Report', group: 'more', icon: FileText, component: lazy(() => import('./pages/IncidentReport')) },
  { path: '/dashboard', label: 'Safety Dashboard', group: 'more', icon: LayoutDashboard, component: lazy(() => import('./pages/Dashboard')) },
  { path: '/qr-generator', label: 'QR Generator', group: 'more', icon: QrCode, component: lazy(() => import('./pages/QrGenerator')) },
  { path: '/demo-control', label: 'Demo Control Center', group: 'more', icon: Gamepad2, component: lazy(() => import('./pages/DemoControl')) },
  { path: '/technology', label: 'About / Technology', group: 'more', icon: Cpu, component: lazy(() => import('./pages/Technology')) },
  { path: '/judge', label: 'Judge Mode', group: 'hidden', icon: Trophy, component: lazy(() => import('./pages/JudgeMode')) },
  { path: '/technical', label: 'Technical View', group: 'hidden', icon: Terminal, component: lazy(() => import('./pages/TechnicalView')) },
];

export const routeByPath = (path: string): AppRoute | undefined => ROUTES.find((r) => r.path === path);
