// DEPRECATED: the 3D layer was removed in the SOC redesign. These no-op exports only keep pages compiling
// until each page drops its import; the head deletes this folder once no page imports it. Do not add new uses.
import type { RiskLevelId, RobotMood } from '../../types';

export function supportsWebGL(): boolean {
  return false;
}

export interface GuardianRobotProps {
  mood?: RobotMood;
  className?: string;
  interactive?: boolean;
}

export interface EngineCoreProps {
  level?: RiskLevelId | null;
  active?: boolean;
  className?: string;
}

export interface HeroSceneProps {
  className?: string;
}

export function GuardianRobot(_props: GuardianRobotProps) {
  void _props;
  return null;
}

export function EngineCore(_props: EngineCoreProps) {
  void _props;
  return null;
}

export function HeroScene(_props: HeroSceneProps) {
  void _props;
  return null;
}
