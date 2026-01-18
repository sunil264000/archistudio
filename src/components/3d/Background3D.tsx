import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import { useRef, useMemo, Suspense } from 'react';
import * as THREE from 'three';

function FloatingCube({ position, scale, speed }: { position: [number, number, number]; scale: number; speed: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * speed * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.2;
    }
  });

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#4a4a4a"
          transparent
          opacity={0.15}
          wireframe
        />
      </mesh>
    </Float>
  );
}

function FloatingSphere({ position, scale, speed }: { position: [number, number, number]; scale: number; speed: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color="#c45a32"
        transparent
        opacity={0.1}
        wireframe
      />
    </mesh>
  );
}

function GridPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
      <planeGeometry args={[100, 100, 50, 50]} />
      <meshBasicMaterial
        color="#333333"
        transparent
        opacity={0.05}
        wireframe
      />
    </mesh>
  );
}

function ArchitecturalLines() {
  const linesRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.z = state.clock.elapsedTime * 0.02;
    }
  });

  const lines = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < 20; i++) {
      positions.push([
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10 - 5
      ]);
    }
    return positions;
  }, []);

  return (
    <group ref={linesRef}>
      {lines.map((pos, i) => (
        <Float key={i} speed={0.5 + i * 0.1} rotationIntensity={0.2}>
          <mesh position={pos} rotation={[0, 0, Math.PI / 4 * i]}>
            <boxGeometry args={[0.02, 2 + Math.random() * 3, 0.02]} />
            <meshBasicMaterial color="#666666" transparent opacity={0.2} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function Scene() {
  const cubes = useMemo(() => [
    { position: [-8, 3, -5] as [number, number, number], scale: 1.5, speed: 0.5 },
    { position: [7, -2, -8] as [number, number, number], scale: 2, speed: 0.3 },
    { position: [-5, -4, -6] as [number, number, number], scale: 1, speed: 0.7 },
    { position: [10, 4, -10] as [number, number, number], scale: 2.5, speed: 0.2 },
    { position: [0, 6, -12] as [number, number, number], scale: 1.8, speed: 0.4 },
    { position: [-12, 0, -8] as [number, number, number], scale: 1.2, speed: 0.6 },
  ], []);

  const spheres = useMemo(() => [
    { position: [5, 2, -6] as [number, number, number], scale: 0.8, speed: 0.4 },
    { position: [-4, 5, -10] as [number, number, number], scale: 1.2, speed: 0.6 },
    { position: [8, -3, -12] as [number, number, number], scale: 0.6, speed: 0.8 },
  ], []);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <pointLight position={[-10, -10, -10]} intensity={0.2} color="#c45a32" />
      
      <Stars
        radius={50}
        depth={50}
        count={1000}
        factor={2}
        saturation={0}
        fade
        speed={0.5}
      />
      
      <GridPlane />
      <ArchitecturalLines />
      
      {cubes.map((cube, i) => (
        <FloatingCube key={`cube-${i}`} {...cube} />
      ))}
      
      {spheres.map((sphere, i) => (
        <FloatingSphere key={`sphere-${i}`} {...sphere} />
      ))}
    </>
  );
}

interface Background3DProps {
  className?: string;
  intensity?: 'light' | 'medium' | 'full';
}

export function Background3D({ className = '', intensity = 'medium' }: Background3DProps) {
  const opacity = intensity === 'light' ? 0.3 : intensity === 'medium' ? 0.5 : 0.8;
  
  return (
    <div 
      className={`absolute inset-0 ${className}`}
      style={{ opacity, pointerEvents: 'none' }}
    >
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ pointerEvents: 'none' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}