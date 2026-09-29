import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Float, OrbitControls, ContactShadows } from '@react-three/drei';
import type { GLTF } from 'three-stdlib';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import type { RobotMood } from '../../types';

type GLTFResult = GLTF & { scene: THREE.Group };

// Mood -> animation clip name
const MOOD_CLIP: Record<RobotMood, string> = {
  idle: 'Idle',
  wave: 'Wave',
  thinking: 'Walking',
  alert: 'No',
  safe: 'ThumbsUp',
  celebrate: 'Dance',
};

// Mood -> ring colour
const MOOD_RING: Record<RobotMood, string> = {
  idle: '#22d3ee',
  wave: '#22d3ee',
  thinking: '#3b82f6',
  alert: '#ef4444',
  safe: '#22c55e',
  celebrate: '#22c55e',
};

interface RobotModelProps {
  mood: RobotMood;
  interactive: boolean;
}

function RobotModel({ mood, interactive }: RobotModelProps) {
  const { animations, scene } = useGLTF(
    `${import.meta.env.BASE_URL}models/RobotExpressive.glb`,
    false,
    false,
  ) as GLTFResult;

  const groupRef = useRef<THREE.Group>(null!);
  const clonedScene = React.useMemo(() => clone(scene), [scene]);
  const { actions } = useAnimations(animations, groupRef);

  const prevMood = useRef<RobotMood | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ringRef = useRef<THREE.Mesh>(null!);
  const mouseTiltRef = useRef({ x: 0, y: 0 });

  // Mouse parallax when not interactive
  useEffect(() => {
    if (interactive) return;
    const handler = (e: MouseEvent) => {
      mouseTiltRef.current = {
        x: ((e.clientX / window.innerWidth) - 0.5) * 0.3,
        y: ((e.clientY / window.innerHeight) - 0.5) * -0.3,
      };
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, [interactive]);

  useFrame((_state, delta) => {
    if (!interactive && groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        mouseTiltRef.current.x,
        delta * 3,
      );
    }
    if (mood === 'thinking' && groupRef.current) {
      groupRef.current.rotation.y += Math.sin(Date.now() * 0.001) * 0.004;
    }
    if (ringRef.current) {
      const s = 1 + Math.sin(Date.now() * 0.003) * 0.06;
      ringRef.current.scale.setScalar(s);
    }
  });

  // Drive animation based on mood
  useEffect(() => {
    if (!actions) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const clipName = MOOD_CLIP[mood];
    const action = actions[clipName];
    if (!action) return;

    const prev = prevMood.current;
    const prevAction = prev ? actions[MOOD_CLIP[prev]] : null;

    if (mood === 'thinking') {
      action.timeScale = 0.8;
      action.setLoop(THREE.LoopRepeat, Infinity);
    } else if (mood === 'alert') {
      action.timeScale = 1;
      action.setLoop(THREE.LoopRepeat, Infinity);
    } else if (mood === 'wave') {
      action.timeScale = 1;
      action.setLoop(THREE.LoopRepeat, 2);
      action.clampWhenFinished = false;
    } else if (mood === 'safe') {
      action.timeScale = 1;
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    } else if (mood === 'celebrate') {
      action.timeScale = 1;
      action.setLoop(THREE.LoopRepeat, Infinity);
    } else {
      // idle and anything else
      action.timeScale = 1;
      action.setLoop(THREE.LoopRepeat, Infinity);
    }

    action.reset().play();
    if (prevAction && prevAction !== action) {
      prevAction.crossFadeTo(action, 0.35, false);
    }
    prevMood.current = mood;

    // Wave: after 2 repeats cross-fade to Idle
    if (mood === 'wave') {
      const delay = action.getClip().duration * 2 * 1000 + 200;
      timeoutRef.current = setTimeout(() => {
        const idle = actions['Idle'];
        if (idle) {
          idle.setLoop(THREE.LoopRepeat, Infinity);
          idle.reset().play();
          action.crossFadeTo(idle, 0.35, false);
        }
      }, delay);
    }
    // Safe: after once, back to Idle
    if (mood === 'safe') {
      const delay = action.getClip().duration * 1000 + 200;
      timeoutRef.current = setTimeout(() => {
        const idle = actions['Idle'];
        if (idle) {
          idle.setLoop(THREE.LoopRepeat, Infinity);
          idle.reset().play();
          action.crossFadeTo(idle, 0.35, false);
        }
      }, delay);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, actions]);

  const ringColor = MOOD_RING[mood];

  return (
    <>
      <ambientLight intensity={0.6} />
      <hemisphereLight args={['#dbeafe', '#1e3a5f', 0.5]} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
      <pointLight position={[-3, 2, 3]} intensity={0.8} color="#22d3ee" />
      <pointLight position={[3, 1, -3]} intensity={0.5} color={ringColor} />

      {interactive && (
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />
      )}

      <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.4}>
        <group ref={groupRef} dispose={null}>
          <primitive object={clonedScene} />
        </group>
      </Float>

      {mood === 'alert' && (
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.95, 0]}>
          <torusGeometry args={[0.6, 0.04, 8, 32]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
        </mesh>
      )}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.96, 0]}>
        <ringGeometry args={[0.65, 0.9, 48]} />
        <meshStandardMaterial
          color={ringColor}
          emissive={ringColor}
          emissiveIntensity={0.8}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      <ContactShadows position={[0, -0.97, 0]} opacity={0.35} scale={2.5} blur={2} />
    </>
  );
}

useGLTF.preload(`${import.meta.env.BASE_URL}models/RobotExpressive.glb`, false, false);

export interface RobotCanvasProps {
  mood: RobotMood;
  interactive: boolean;
}

export default function RobotCanvas({ mood, interactive }: RobotCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 1, 3.5], fov: 45 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    >
      <RobotModel mood={mood} interactive={interactive} />
    </Canvas>
  );
}
