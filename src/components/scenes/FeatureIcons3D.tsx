"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";

const BLUE = "#c98a4b";
const VIOLET = "#b8531f";
const CYAN = "#e8d1a7";

function Mat({ c, e = 0.7, opacity = 1 }: { c: string; e?: number; opacity?: number }) {
  return (
    <meshStandardMaterial
      color={c}
      emissive={c}
      emissiveIntensity={e}
      roughness={0.35}
      metalness={0.25}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
}

const wave = (t: number, s = 1) => (Math.sin(t * s) + 1) / 2;
const smooth = (x: number) => x * x * (3 - 2 * x);

/* 1. two puzzle pieces locking together */
function Match() {
  const a = useRef<THREE.Group>(null);
  const b = useRef<THREE.Group>(null);
  const flash = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const k = smooth(wave(t, 1.5));
    const gap = (1 - k) * 0.95;
    if (a.current) {
      a.current.position.x = -0.42 - gap;
      a.current.rotation.z = (1 - k) * 0.35;
    }
    if (b.current) {
      b.current.position.x = 0.42 + gap;
      b.current.rotation.z = -(1 - k) * 0.35;
    }
    if (flash.current) {
      const f = Math.max(0, (k - 0.9) * 10);
      flash.current.scale.setScalar(0.6 + f * 1.4);
      (flash.current.material as THREE.MeshBasicMaterial).opacity = f * 0.9 * (1 - Math.min(1, f / 1.2));
    }
  });
  return (
    <group>
      <group ref={a}>
        <mesh><boxGeometry args={[0.85, 0.85, 0.45]} /><Mat c={BLUE} /></mesh>
        <mesh position={[0.52, 0, 0]}><sphereGeometry args={[0.21, 24, 24]} /><Mat c={BLUE} /></mesh>
      </group>
      <group ref={b}>
        <mesh><boxGeometry args={[0.85, 0.85, 0.45]} /><Mat c={VIOLET} /></mesh>
        <mesh position={[-0.52, 0, 0]}><sphereGeometry args={[0.21, 24, 24]} /><Mat c={VIOLET} /></mesh>
      </group>
      <mesh ref={flash}>
        <torusGeometry args={[0.5, 0.025, 12, 48]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* 2. paper planes fanning out of a message bubble */
function Outreach() {
  const planes = useRef<(THREE.Mesh | null)[]>([]);
  const angles = [-0.55, 0, 0.55];
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    planes.current.forEach((m, i) => {
      if (!m) return;
      const ph = (t * 0.55 + i / 3) % 1;
      const a = angles[i];
      m.position.set(-0.5 + ph * 2.1, ph * Math.sin(a) * 1.7, 0);
      m.rotation.z = -Math.PI / 2 + a * 0.9;
      m.scale.setScalar(1 - ph * 0.55);
      (m.material as THREE.MeshStandardMaterial).opacity = Math.min(1, (1 - ph) * 2.2);
    });
  });
  return (
    <group>
      <mesh position={[-0.85, -0.15, 0]}>
        <boxGeometry args={[0.8, 0.55, 0.22]} />
        <Mat c={BLUE} />
      </mesh>
      <mesh position={[-1.05, -0.52, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.13, 0.22, 3]} />
        <Mat c={BLUE} />
      </mesh>
      {angles.map((_, i) => (
        <mesh key={i} ref={(el) => void (planes.current[i] = el)}>
          <coneGeometry args={[0.17, 0.52, 3]} />
          <meshStandardMaterial color={i === 1 ? CYAN : VIOLET} emissive={i === 1 ? CYAN : VIOLET} emissiveIntensity={0.9} transparent />
        </mesh>
      ))}
    </group>
  );
}

/* 3. looping arrow orbiting a message */
function FollowUp() {
  const orbit = useRef<THREE.Group>(null);
  const dot = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (orbit.current) orbit.current.rotation.z = -t * 1.5;
    if (dot.current) dot.current.scale.setScalar(1 + Math.sin(t * 5) * 0.2);
  });
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.9, 0.62, 0.25]} />
        <Mat c={VIOLET} />
      </mesh>
      <mesh position={[-0.2, -0.42, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.13, 0.22, 3]} />
        <Mat c={VIOLET} />
      </mesh>
      <mesh ref={dot} position={[0.45, 0.32, 0.15]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <Mat c={CYAN} e={1.4} />
      </mesh>
      <group ref={orbit}>
        <mesh>
          <torusGeometry args={[1.05, 0.045, 12, 64, Math.PI * 1.5]} />
          <Mat c={BLUE} e={1} />
        </mesh>
        <mesh position={[0, -1.05, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.14, 0.3, 14]} />
          <Mat c={CYAN} e={1.2} />
        </mesh>
      </group>
    </group>
  );
}

/* 4. clock morphing into a calendar check */
function RealTime() {
  const clock = useRef<THREE.Group>(null);
  const cal = useRef<THREE.Group>(null);
  const hand = useRef<THREE.Mesh>(null);
  const hand2 = useRef<THREE.Mesh>(null);
  useFrame(({ clock: c }) => {
    const t = c.elapsedTime;
    const k = smooth(Math.min(1, Math.max(0, wave(t, 1.2) * 1.6 - 0.3)));
    if (clock.current) {
      clock.current.scale.setScalar(Math.max(0.001, 1 - k));
      clock.current.rotation.y = k * Math.PI;
    }
    if (cal.current) {
      cal.current.scale.setScalar(Math.max(0.001, k));
      cal.current.rotation.y = (k - 1) * Math.PI;
    }
    if (hand.current) hand.current.rotation.z = -t * 4;
    if (hand2.current) hand2.current.rotation.z = -t * 0.8;
  });
  return (
    <group>
      <group ref={clock}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.9, 0.9, 0.2, 48]} />
          <Mat c={BLUE} e={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.86, 0.04, 12, 48]} />
          <Mat c={CYAN} e={1.2} />
        </mesh>
        <group ref={hand}>
          <mesh position={[0, 0.34, 0.15]}><boxGeometry args={[0.06, 0.7, 0.05]} /><Mat c="#ffffff" e={1} /></mesh>
        </group>
        <group ref={hand2}>
          <mesh position={[0, 0.22, 0.14]}><boxGeometry args={[0.08, 0.44, 0.05]} /><Mat c="#ffffff" e={1} /></mesh>
        </group>
      </group>
      <group ref={cal}>
        <mesh><boxGeometry args={[1.6, 1.4, 0.2]} /><Mat c={VIOLET} e={0.5} /></mesh>
        <mesh position={[0, 0.5, 0.12]}><boxGeometry args={[1.6, 0.36, 0.06]} /><Mat c={BLUE} /></mesh>
        <mesh position={[-0.2, -0.22, 0.14]} rotation={[0, 0, -0.78]}><boxGeometry args={[0.14, 0.4, 0.06]} /><Mat c={CYAN} e={1.6} /></mesh>
        <mesh position={[0.16, -0.12, 0.14]} rotation={[0, 0, 0.78]}><boxGeometry args={[0.14, 0.8, 0.06]} /><Mat c={CYAN} e={1.6} /></mesh>
      </group>
    </group>
  );
}

/* 5. floating mini dashboard with stacked panels */
function Dashboard() {
  const bars = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    bars.current.forEach((b, i) => {
      if (!b) return;
      const h = 0.25 + wave(t * 1.4 + i * 1.3) * 0.55;
      b.scale.y = h;
      b.position.y = -0.3 + h * 0.5 * 0.9;
    });
  });
  return (
    <group rotation={[0.18, -0.5, 0]}>
      <mesh position={[0.5, 0.4, -0.7]}><boxGeometry args={[1.7, 1.1, 0.06]} /><Mat c={CYAN} e={0.5} opacity={0.65} /></mesh>
      <mesh position={[0.25, 0.2, -0.35]}><boxGeometry args={[1.7, 1.1, 0.06]} /><Mat c={VIOLET} e={0.6} opacity={0.8} /></mesh>
      <mesh><boxGeometry args={[1.7, 1.1, 0.06]} /><Mat c="#3a2616" e={0.25} /></mesh>
      {[-0.55, -0.18, 0.19, 0.56].map((x, i) => (
        <mesh key={i} ref={(el) => void (bars.current[i] = el)} position={[x, 0, 0.06]}>
          <boxGeometry args={[0.2, 1, 0.06]} />
          <Mat c={i % 2 ? CYAN : BLUE} e={1.1} />
        </mesh>
      ))}
    </group>
  );
}

/* 6. progress ring filling to 100% with a speed streak */
function Progress() {
  const SEG = 36;
  const inst = useRef<THREE.InstancedMesh>(null);
  const streaks = useRef<(THREE.Mesh | null)[]>([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const c = useMemo(() => new THREE.Color(), []);
  const blue = useMemo(() => new THREE.Color(BLUE), []);
  const cyan = useMemo(() => new THREE.Color(CYAN).multiplyScalar(1.5), []);
  const dim = useMemo(() => new THREE.Color("#5a3d26"), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const fill = Math.min(1, ((t * 0.32) % 1.5) / 1.1);
    const m = inst.current;
    if (!m) return;
    const pop = fill >= 1 ? 1 + Math.sin(t * 12) * 0.05 : 1;
    for (let i = 0; i < SEG; i++) {
      const a = Math.PI / 2 - (i / SEG) * Math.PI * 2;
      const on = i / SEG < fill;
      dummy.position.set(Math.cos(a) * 0.95, Math.sin(a) * 0.95, 0);
      dummy.rotation.set(0, 0, a);
      dummy.scale.set(on ? 1.15 : 0.7, on ? 1 : 0.85, on ? 1 : 0.6).multiplyScalar(pop);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, on ? c.copy(blue).lerp(cyan, i / SEG) : dim);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    streaks.current.forEach((s, i) => {
      if (!s) return;
      const ph = (t * 1.1 + i * 0.37) % 1;
      s.position.x = -2.2 + ph * 4.4;
      s.scale.x = 0.4 + Math.sin(ph * Math.PI) * 0.9;
      (s.material as THREE.MeshBasicMaterial).opacity = Math.sin(ph * Math.PI) * 0.8;
    });
  });
  return (
    <group>
      <instancedMesh ref={inst} args={[undefined, undefined, SEG]}>
        <boxGeometry args={[0.2, 0.09, 0.14]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      {[0.25, -0.05, -0.35].map((y, i) => (
        <mesh key={i} ref={(el) => void (streaks.current[i] = el)} position={[0, y, -0.2]}>
          <boxGeometry args={[1, 0.03, 0.03]} />
          <meshBasicMaterial color="#f4e9d3" transparent toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

const scenes = [Match, Outreach, FollowUp, RealTime, Dashboard, Progress];

export default function FeatureIcon({ index }: { index: number }) {
  const Scene = scenes[index];
  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[3, 3, 4]} intensity={30} color="#ffffff" />
      <pointLight position={[-3, -2, 3]} intensity={20} color="#b8531f" />
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <group scale={0.95}>
          <Scene />
        </group>
      </Float>
    </>
  );
}
