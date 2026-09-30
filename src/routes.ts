// Route table (owned by the head). Navbar reads it; App renders it. Pages are lazy-loaded default exports.
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import {
  Brain, Cpu, Dna, FileText, FlaskConical, Gamepad2, GitCompare, Globe, HeartHandshake, House, IndianRupee,
  LayoutDashboard, Link2, Lock, MessageSquareWarning, Network, QrCode, Radar, ScanLine, Siren, SlidersHorizontal, Smartphone,
  Store, Terminal, Trophy, Users, Workflow, type LucideIcon,
} from 'lucide-react';

/** primary = top navigation (spec order), more = "More" menu, hidden = reachable by link/button only. */
export type NavGroup = 'primary' | 'more' | 'hidden';

/** SOC sidebar section. `hidden` routes are reachable by link/button only. */
export type NavSection = 'monitor' | 'shields' | 'intel' | 'lab' | 'response' | 'system' | 'hidden';

export interface AppRoute {
  path: string;
  label: string;
  group: NavGroup;
  section: NavSection;
  icon: LucideIcon;
  component: LazyExoticComponent<ComponentType>;
}

/** Sidebar sections in display order (the SOC shell renders one group per entry, routes in ROUTES order). */
export const NAV_SECTIONS: { id: Exclude<NavSection, 'hidden'>; label: string }[] = [
  { id: 'monitor', label: 'MONITOR' },
  { id: 'shields', label: 'SHIELDS' },
  { id: 'intel', label: 'INTELLIGENCE' },
  { id: 'lab', label: 'LAB' },
  { id: 'response', label: 'RESPONSE' },
  { id: 'system', label: 'SYSTEM' },
];

export const ROUTES: AppRoute[] = [
  { path: '/', label: 'Home', group: 'primary', section: 'monitor', icon: House, component: lazy(() => import('./pages/Landing')) },
  { path: '/dashboard', label: 'Command Center', group: 'more', section: 'monitor', icon: LayoutDashboard, component: lazy(() => import('./pages/Dashboard')) },
  { path: '/vendors', label: 'Vendor Payments', group: 'primary', section: 'monitor', icon: Store, component: lazy(() => import('./pages/VendorPayments')) },
  { path: '/link', label: 'Device Link', group: 'more', section: 'monitor', icon: Smartphone, component: lazy(() => import('./pages/DeviceLink')) },
  { path: '/live', label: 'Live Protection', group: 'primary', section: 'monitor', icon: Radar, component: lazy(() => import('./pages/LiveProtection')) },
  { path: '/qr', label: 'Scan QR', group: 'primary', section: 'shields', icon: ScanLine, component: lazy(() => import('./pages/QrShield')) },
  { path: '/message', label: 'Analyze Message', group: 'primary', section: 'shields', icon: MessageSquareWarning, component: lazy(() => import('./pages/MessageShield')) },
  { path: '/url', label: 'Analyze URL', group: 'primary', section: 'shields', icon: Link2, component: lazy(() => import('./pages/UrlShield')) },
  { path: '/payment', label: 'Payment Risk', group: 'primary', section: 'shields', icon: IndianRupee, component: lazy(() => import('./pages/PaymentAnalyzer')) },
  { path: '/lab', label: 'Scam Lab', group: 'primary', section: 'lab', icon: FlaskConical, component: lazy(() => import('./pages/ScamLab')) },
  { path: '/threat-intel', label: 'Threat Intelligence', group: 'primary', section: 'intel', icon: Globe, component: lazy(() => import('./pages/ThreatIntel')) },
  { path: '/privacy', label: 'Privacy', group: 'primary', section: 'system', icon: Lock, component: lazy(() => import('./pages/PrivacyCenter')) },
  { path: '/simulation', label: 'Live Attack Simulation', group: 'more', section: 'monitor', icon: Siren, component: lazy(() => import('./pages/LiveSimulation')) },
  { path: '/dna', label: 'Scam DNA', group: 'more', section: 'intel', icon: Dna, component: lazy(() => import('./pages/ScamDna')) },
  { path: '/attack-chain', label: 'Attack Chain', group: 'more', section: 'intel', icon: Workflow, component: lazy(() => import('./pages/AttackChain')) },
  { path: '/explain', label: 'Risk Explanation', group: 'more', section: 'intel', icon: Brain, component: lazy(() => import('./pages/RiskExplanation')) },
  { path: '/what-if', label: 'What-If Simulator', group: 'more', section: 'lab', icon: SlidersHorizontal, component: lazy(() => import('./pages/WhatIf')) },
  { path: '/counterfactual', label: 'Counterfactual AI', group: 'more', section: 'lab', icon: GitCompare, component: lazy(() => import('./pages/Counterfactual')) },
  { path: '/signals', label: 'Signals Connected', group: 'more', section: 'intel', icon: Network, component: lazy(() => import('./pages/SignalsConnected')) },
  { path: '/trusted', label: 'Trusted Contact', group: 'more', section: 'response', icon: Users, component: lazy(() => import('./pages/TrustedContact')) },
  { path: '/elder', label: 'Elder Mode', group: 'more', section: 'response', icon: HeartHandshake, component: lazy(() => import('./pages/ElderMode')) },
  { path: '/report', label: 'Incident Report', group: 'more', section: 'response', icon: FileText, component: lazy(() => import('./pages/IncidentReport')) },
  { path: '/qr-generator', label: 'QR Generator', group: 'more', section: 'lab', icon: QrCode, component: lazy(() => import('./pages/QrGenerator')) },
  { path: '/demo-control', label: 'Demo Control Center', group: 'more', section: 'system', icon: Gamepad2, component: lazy(() => import('./pages/DemoControl')) },
  { path: '/technology', label: 'About / Technology', group: 'more', section: 'system', icon: Cpu, component: lazy(() => import('./pages/Technology')) },
  { path: '/judge', label: 'Judge Mode', group: 'hidden', section: 'hidden', icon: Trophy, component: lazy(() => import('./pages/JudgeMode')) },
  { path: '/technical', label: 'Technical View', group: 'hidden', section: 'hidden', icon: Terminal, component: lazy(() => import('./pages/TechnicalView')) },
];

export const routeByPath = (path: string): AppRoute | undefined => ROUTES.find((r) => r.path === path);
