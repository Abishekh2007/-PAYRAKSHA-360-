import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, Float, Stars, Sparkles } from '@react-three/drei';
import type { GLTF } from 'three-stdlib';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

type GLTFResult = GLTF & { scene: THREE.Group };

function HeroModel() {
  // Robot
  const robot = useGLTF(
    `${import.meta.env.BASE_URL}models/RobotExpressive.glb`,
    false,
    false,
  ) as GLTFResult;

  // Engine
  const engine = useGLTF(
    `${import.meta.env.BASE_URL}models/PrimaryIonDrive.glb`,
    false,
    false,
  ) as GLTFResult;

  const robotGroupRef = useRef<THREE.Group>(null!);
  const engineGroupRef = useRef<THREE.Group>(null!);

  const robotScene = React.useMemo(() => clone(robot.scene), [robot.scene]);
  const engineScene = React.useMemo(() => clone(engine.scene), [engine.scene]);

  const { actions: robotActions } = useAnimations(robot.animations, robotGroupRef);
  const { actions: engineActions } = useAnimations(engine.animations, engineGroupRef);

  // Start animations
  useEffect(() => {
    const wa = robotActions?.['Wave'];
    if (wa) {
      wa.setLoop(THREE.LoopRepeat, Infinity);
      wa.reset().play();
    }
  }, [robotActions]);

  useEffect(() => {
    const ma = engineActions?.['Main'];
    if (ma) {
      ma.setLoop(THREE.LoopRepeat, Infinity);
      ma.reset().play();
    }
  }, [engineActions]);

  // Camera sway
  const { camera } = useThree();
  useFrame(() => {
    const t = Date.now() * 0.0004;
    camera.position.x = Math.sin(t) * 0.4;
    camera.position.y = 1 + Math.sin(t * 0.7) * 0.15;
    camera.lookAt(0, 0.5, 0);

    if (engineGroupRef.current) {
      engineGroupRef.current.rotation.y += 0.008;
    }
    // Robot emissive pulse
    const emissive = 0.8 + Math.sin(Date.now() * 0.002) * 0.2;
    engineScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          if (m instanceof THREE.MeshStandardMaterial) {
            if ((m.emissive.r + m.emissive.g + m.emissive.b) > 0.01) {
              m.emissive.set('#3b82f6');
              m.emissiveIntensity = emissive;
            }
          }
        });
      }
    });
  });

  // Fewer particles on small screens
  const particleCount = window.innerWidth < 640 ? 600 : 1500;
  const sparkleCount = window.innerWidth < 640 ? 20 : 40;

  return (
    <>
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#dbeafe', '#1e3a5f', 0.5]} />
      <directionalLight position={[5, 8, 5]} intensity={1} />
      <pointLight position={[0, 0, 3]} intensity={2} color="#22d3ee" />
      <pointLight position={[-3, 2, 0]} intensity={1} color="#3b82f6" />

      <Stars radius={80} depth={40} count={particleCount} factor={4} saturation={0.3} fade />
      <Sparkles count={sparkleCount} scale={[4, 4, 2]} size={2} speed={0.4} color="#22d3ee" />

      {/* Glowing platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]}>
        <cylinderGeometry args={[1.0, 1.0, 0.06, 48]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.5} transparent opacity={0.6} />
      </mesh>

      {/* Robot */}
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.35}>
        <group ref={robotGroupRef} position={[-0.5, -1, 0]} dispose={null}>
          <primitive object={robotScene} />
        </group>
      </Float>

      {/* Engine core floating behind */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5} floatingRange={[0.1, 0.4]}>
        <group ref={engineGroupRef} position={[1.5, 0, -1.5]} scale={0.5} dispose={null}>
          <primitive object={engineScene} />
        </group>
      </Float>

      <EffectComposer>
        <Bloom mipmapBlur intensity={1.5} luminanceThreshold={0.15} />
      </EffectComposer>
    </>
  );
}

useGLTF.preload(`${import.meta.env.BASE_URL}models/RobotExpressive.glb`, false, false);
useGLTF.preload(`${import.meta.env.BASE_URL}models/PrimaryIonDrive.glb`, false, false);

export default function HeroCanvas() {
  // Lower DPR on small screens
  const dpr: [number, number] = window.innerWidth < 640 ? [1, 1.2] : [1, 1.75];
  return (
    <Canvas
      camera={{ position: [0, 1, 4.5], fov: 50 }}
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    >
      <HeroModel />
    </Canvas>
  );
}
