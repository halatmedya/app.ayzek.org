import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Float, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useEffect, useRef, useState, useCallback } from 'react';

import ayzekPng from '../../assets/ayzek.png';

interface LogoStageProps { src?: string; intensity?: number; }

function ImagePlane({ src }: { src: string }) {
  const texture = useLoader(THREE.TextureLoader, src);
  texture.anisotropy = 8;
  return (
    <group>
      <mesh>
        <circleGeometry args={[2, 64]} />
        <meshPhysicalMaterial
          map={texture}
          transparent
          roughness={0.35}
          metalness={0.15}
          clearcoat={0.6}
          clearcoatRoughness={0.1}
        />
      </mesh>
      <mesh position={[0,0,-0.12]}>
        <circleGeometry args={[2,64]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
    </group>
  );
}

function DraggableLogo({ src }: { src: string }) {
  const group = useRef<THREE.Group>(null);
  const isDragging = useRef(false);
  const start = useRef<{x:number,y:number, rx:number, ry:number}>({x:0,y:0,rx:0,ry:0});
  const velocity = useRef<{vx:number, vy:number}>({vx:0, vy:0});
  const lastPos = useRef<{x:number,y:number}>({x:0,y:0});
  const [hover, setHover] = useState(false);

  const onDown = useCallback((e: any) => {
    isDragging.current = true;
    const ev = e.pointer || e.nativeEvent;
    start.current.x = ev.clientX; start.current.y = ev.clientY;
    start.current.rx = group.current?.rotation.y || 0; start.current.ry = group.current?.rotation.x || 0;
    lastPos.current = {x: ev.clientX, y: ev.clientY};
    velocity.current = {vx:0, vy:0};
  }, []);
  const onMove = useCallback((e: any) => {
    if(!isDragging.current) return;
    const ev = e.pointer || e.nativeEvent;
    const dx = ev.clientX - start.current.x; const dy = ev.clientY - start.current.y;
    if(group.current){
      group.current.rotation.y = start.current.rx + dx * 0.01;
      group.current.rotation.x = start.current.ry + dy * 0.01;
    }
    velocity.current.vx = ev.clientX - lastPos.current.x;
    velocity.current.vy = ev.clientY - lastPos.current.y;
    lastPos.current = {x: ev.clientX, y: ev.clientY};
  }, []);
  const onUp = useCallback(()=> { isDragging.current = false; }, []);
  useEffect(()=> { window.addEventListener('pointerup', onUp); return ()=> window.removeEventListener('pointerup', onUp); }, [onUp]);
  useFrame((state)=> {
    if(!isDragging.current && group.current){
      velocity.current.vx *= 0.94; velocity.current.vy *= 0.94;
      group.current.rotation.y += velocity.current.vx * 0.002;
      group.current.rotation.x += velocity.current.vy * 0.002;
      group.current.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, group.current.rotation.x));
      const t = state.clock.getElapsedTime();
      group.current.position.y = Math.sin(t*1.2)*0.25;
    }
  });
  return (
    <group ref={group} onPointerDown={onDown} onPointerMove={onMove} onPointerOver={()=> setHover(true)} onPointerOut={()=> setHover(false)} scale={hover?1.08:1}>
      <group rotation={[0.2,-0.6,0]}>
        <ImagePlane src={src} />
      </group>
      <mesh position={[0,0,-0.35]}>
        <ringGeometry args={[2.2,2.6,64]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

export function LogoStage({ src=ayzekPng, intensity=1 }: LogoStageProps){
  return (
    <div className="relative w-full h-[360px] rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-800/40 border border-slate-700/40 backdrop-blur-xl">
      <Canvas camera={{position:[0,0,7], fov:42}} dpr={[1,1.7]} shadows>
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.55*intensity} />
        <directionalLight position={[6,8,4]} intensity={0.9*intensity} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <pointLight position={[-5,-3,-4]} intensity={0.5*intensity} color="#38bdf8" />
        <Float speed={2} rotationIntensity={0.4} floatIntensity={0}>
          <DraggableLogo src={src} />
        </Float>
        <Environment preset="city" />
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,-3,0]} receiveShadow>
          <circleGeometry args={[20,64]} />
          <shadowMaterial transparent opacity={0.18} />
        </mesh>
      </Canvas>
      <div className="absolute top-2 left-3 text-xs tracking-wider text-cyan-300/70 font-semibold pointer-events-none">LOGO 3D</div>
      <div className="absolute bottom-2 right-3 text-[10px] text-slate-500 pointer-events-none">Sürükleyerek döndür</div>
    </div>
  );
}
