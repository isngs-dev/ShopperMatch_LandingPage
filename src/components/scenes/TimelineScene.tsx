"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { pointer, scrollState } from "@/lib/scrollState";
import { softDotTexture } from "@/lib/textures";

const TUBULAR = 120;
const RADIAL = 10;
const PARTICLES = 40;

const PTS = [
  [-2.0, -2.5, 0],
  [-0.9, -1.5, 0.9],
  [1.1, -0.9, -0.6],
  [0.5, 0.3, 0.9],
  [-1.2, 1.0, -0.4],
  [0.1, 1.9, 0.5],
  [1.5, 2.5, 0],
].map((p) => new THREE.Vector3(...(p as [number, number, number])));

function Ribbon({ low, reduced }: { low: boolean; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const tube = useRef<THREE.Mesh>(null);
  const parts = useRef<THREE.Points>(null);
  const core = useRef<THREE.Mesh>(null);
  const chipMat = useRef<THREE.MeshStandardMaterial>(null);
  const nodes = useRef<(THREE.Mesh | null)[]>([]);
  const prog = useRef(reduced ? 1 : 0);
  const { viewport } = useThree();

  const curve = useMemo(() => new THREE.CatmullRomCurve3(PTS, false, "catmullrom", 0.5), []);
  const geo = useMemo(() => {
    const g = new THREE.TubeGeometry(curve, TUBULAR, 0.07, RADIAL, false);
    const n = g.attributes.position.count;
    const colors = new Float32Array(n * 3);
    const a = new THREE.Color("#c98a4b");
    const b = new THREE.Color("#b8531f");
    const c = new THREE.Color("#e8d1a7");
    const tmp = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const t = Math.floor(i / (RADIAL + 1)) / TUBULAR;
      (t < 0.55 ? tmp.copy(a).lerp(b, t / 0.55) : tmp.copy(b).lerp(c, (t - 0.55) / 0.45)).multiplyScalar(1.6);
      colors.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [curve]);
  const ghost = useMemo(() => new THREE.TubeGeometry(curve, 120, 0.018, 6, false), [curve]);
  const indexCount = geo.index!.count;
  const dot = useMemo(() => softDotTexture(), []);
  const pPos = useMemo(() => new Float32Array(PARTICLES * 3), []);
  const nodeAt = [0.25, 0.5, 0.75];

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const target = reduced ? 1 : scrollState.about;
    prog.current += (target - prog.current) * Math.min(1, dt * 4);
    const p = prog.current;

    if (tube.current) {
      const cnt = Math.floor((p * indexCount) / 6) * 6;
      tube.current.geometry.setDrawRange(0, Math.max(0, cnt));
    }
    nodeAt.forEach((u, i) => {
      const m = nodes.current[i];
      if (!m) return;
      const on = p >= u;
      const s = on ? 1 + Math.sin(t * 3 + i) * 0.1 : 0.55;
      m.scale.setScalar(s);
      (m.material as THREE.MeshBasicMaterial).color.set(on ? "#f4e9d3" : "#5a3d26");
    });

    // particles flow along the drawn part of the ribbon
    if (parts.current && p > 0.02) {
      for (let i = 0; i < PARTICLES; i++) {
        const u = (((i / PARTICLES + t * 0.1) % 1) * p) as number;
        const pt = curve.getPointAt(Math.min(0.999, u));
        pPos[i * 3] = pt.x;
        pPos[i * 3 + 1] = pt.y;
        pPos[i * 3 + 2] = pt.z;
      }
      (parts.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }

    if (core.current) {
      core.current.rotation.x = t * 0.9;
      core.current.rotation.y = t * 1.3;
      core.current.scale.setScalar(0.25 + p * 0.3 + Math.sin(t * 4) * 0.02 * p);
    }
    if (chipMat.current) chipMat.current.emissiveIntensity = 0.15 + p * 0.9;

    const g = group.current;
    if (g) {
      const sc = Math.min(1, viewport.width / 6.5);
      g.scale.setScalar(Math.max(0.55, sc));
      const px = reduced ? 0 : pointer.x;
      const py = reduced ? 0 : pointer.y;
      g.rotation.y += ((reduced ? 0 : Math.sin(t * 0.25) * 0.35) + px * 0.3 - g.rotation.y) * 0.04;
      g.rotation.x += (-py * 0.12 - g.rotation.x) * 0.04;
    }
  });

  const start = PTS[0];
  const end = PTS[PTS.length - 1];

  return (
    <group ref={group}>
      <mesh geometry={ghost}>
        <meshBasicMaterial color="#c98a4b" transparent opacity={0.22} />
      </mesh>
      <mesh ref={tube} geometry={geo}>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </mesh>

      {nodeAt.map((u, i) => {
        const pt = curve.getPointAt(u);
        return (
          <mesh key={u} position={pt} ref={(el) => void (nodes.current[i] = el)}>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshBasicMaterial color="#5a3d26" toneMapped={false} />
          </mesh>
        );
      })}

      <points ref={parts}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pPos, 3]} />
        </bufferGeometry>
        <pointsMaterial map={dot} size={0.22} transparent depthWrite={false} blending={THREE.AdditiveBlending} color="#f4e9d3" toneMapped={false} />
      </points>

      {/* start: clipboard */}
      <group position={[start.x - 0.55, start.y - 0.35, start.z]} rotation={[0, 0.3, -0.12]}>
        <mesh><boxGeometry args={[0.95, 1.25, 0.1]} /><meshStandardMaterial color="#f4e9d3" emissive="#c98a4b" emissiveIntensity={0.35} roughness={0.5} /></mesh>
        <mesh position={[0, 0.62, 0.08]}><boxGeometry args={[0.42, 0.18, 0.1]} /><meshStandardMaterial color="#c98a4b" emissive="#c98a4b" emissiveIntensity={0.9} /></mesh>
        {[0.25, -0.02, -0.29].map((y, i) => (
          <mesh key={y} position={[i === 2 ? -0.1 : 0, y, 0.07]}><boxGeometry args={[i === 2 ? 0.45 : 0.65, 0.07, 0.03]} /><meshBasicMaterial color="#c98a4b" /></mesh>
        ))}
      </group>

      {/* end: AI chip / neural core */}
      <group position={[end.x + 0.15, end.y + 0.1, end.z]}>
        <mesh>
          <boxGeometry args={[1.15, 1.15, 0.16]} />
          <meshStandardMaterial ref={chipMat} color="#3a1c10" emissive="#b8531f" emissiveIntensity={0.15} metalness={0.5} roughness={0.35} />
        </mesh>
        {Array.from({ length: 8 }).map((_, i) => {
          const side = Math.floor(i / 2);
          const o = i % 2 ? 0.25 : -0.25;
          const pos: [number, number, number] =
            side === 0 ? [o, 0.66, 0] : side === 1 ? [o, -0.66, 0] : side === 2 ? [0.66, o, 0] : [-0.66, o, 0];
          const horiz = side < 2;
          return (
            <mesh key={i} position={pos}>
              <boxGeometry args={horiz ? [0.07, 0.16, 0.05] : [0.16, 0.07, 0.05]} />
              <meshBasicMaterial color="#e8d1a7" />
            </mesh>
          );
        })}
        <mesh ref={core} position={[0, 0, 0.18]}>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial color="#e8d1a7" wireframe toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

export default function TimelineScene({ low, reduced }: { low: boolean; reduced: boolean }) {
  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[3, 3, 5]} intensity={40} color="#ffffff" />
      <Ribbon low={low} reduced={reduced} />
    </>
  );
}
