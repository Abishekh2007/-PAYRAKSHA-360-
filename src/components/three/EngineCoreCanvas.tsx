import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Float } from '@react-three/drei';
import type { GLTF } from 'three-stdlib';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { levelTheme } from '../../lib/risk';
import type { RiskLevelId } from '../../types';

type GLTFResult = GLTF & { scene: THREE.Group };

interface EngineCoreModelProps {
  level: RiskLevelId | null;
  active: boolean;
}

function EngineCoreModel({ level, active }: EngineCoreModelProps) {
  const { scene, animations } = useGLTF(
    `${import.meta.env.BASE_URL}models/PrimaryIonDrive.glb`,
    false,
    false,
  ) as GLTFResult;

  const groupRef = useRef<THREE.Group>(null!);
  const clonedScene = React.useMemo(() => clone(scene), [scene]);
  const { actions } = useAnimations(animations, groupRef);

  const hex = level ? levelTheme(level).hex : '#3b82f6';

  // Apply emissive tint to materials
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          if (m instanceof THREE.MeshStandardMaterial) {
            const emissive = m.emissive;
            if (emissive && (emissive.r + emissive.g + emissive.b) > 0.01) {
              m.emissive.set(hex);
              m.emissiveIntensity = active ? 2 : 1;
            }
          }
        });
      }
    });
  }, [clonedScene, hex, active]);

  // Pulse emissive intensity while active
  useFrame(() => {
    if (!active) return;
    const t = Date.now() * 0.003;
    const intensity = 1.5 + Math.sin(t) * 0.8;
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          if (m instanceof THREE.MeshStandardMaterial) {
            const emissive = m.emissive;
            if (emissive && (emissive.r + emissive.g + emissive.b) > 0.01) {
              m.emissiveIntensity = intensity;
            }
          }
        });
      }
    });
  });

  // Drive main animation
  useEffect(() => {
    if (!actions) return;
    const action = actions['Main'];
    if (!action) return;
    action.timeScale = active ? 2.5 : 1;
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.reset().play();
  }, [actions, active]);

  // Auto-rotation
  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (active ? 0.8 : 0.25);
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[0, 0, 2]} intensity={active ? 3 : 1.5} color={hex} />
      <pointLight position={[0, 2, -2]} intensity={0.6} color={hex} />

      <Float speed={1.2} rotationIntensity={0} floatIntensity={0.3}>
        <group ref={groupRef} dispose={null}>
          <primitive object={clonedScene} />
        </group>
      </Float>

      <EffectComposer>
        <Bloom mipmapBlur intensity={1.2} luminanceThreshold={0.2} />
      </EffectComposer>
    </>
  );
}

useGLTF.preload(`${import.meta.env.BASE_URL}models/PrimaryIonDrive.glb`, false, false);

export interface EngineCoreCanvasProps {
  level: RiskLevelId | null;
  active: boolean;
}

export default function EngineCoreCanvas({ level, active }: EngineCoreCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 50 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    >
      <EngineCoreModel level={level} active={active} />
    </Canvas>
  );
}
