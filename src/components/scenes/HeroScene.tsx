"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { mulberry32, pointer, scrollState } from "@/lib/scrollState";

const CYAN = new THREE.Color("#e8d1a7");
const BLUE = new THREE.Color("#c98a4b");
const VIOLET = new THREE.Color("#b8531f");
const BEAM_TIME = 1.1;
const GAP_TIME = 0.3;
const CURVE_POINTS = 48;

type Chip = { id: number; pos: [number, number, number] };

function Network({ count, reduced }: { count: number; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { camera, size } = useThree();
  const [chips, setChips] = useState<Chip[]>([]);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const data = useMemo(() => {
    const r = mulberry32(21);
    const shoppers: THREE.Vector3[] = [];
    const stores: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const f = count > 1 ? i / (count - 1) : 0.5;
      shoppers.push(new THREE.Vector3(-4.9 + r() * 0.9, -0.2 + r() * 2.4, (f - 0.5) * 6.2));
      stores.push(new THREE.Vector3(3.9 + r() * 1.3, -1.45, (r() - 0.5) * 6.2));
    }
    const order = Array.from({ length: count }, (_, i) => i).sort(() => r() - 0.5);
    const beams = shoppers.map((s, i) => {
      const e = stores[i];
      const mid = s.clone().add(e).multiplyScalar(0.5).add(new THREE.Vector3(0, 2.4, 0));
      const curve = new THREE.QuadraticBezierCurve3(s, mid, e);
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(CURVE_POINTS - 1));
      geo.setDrawRange(0, 0);
      const mat = new THREE.LineBasicMaterial({ color: VIOLET, transparent: true, opacity: 0.95, toneMapped: false });
      return { curve, line: new THREE.Line(geo, mat), geo, mat };
    });
    const pinMats = stores.map(() => new THREE.MeshStandardMaterial({ color: BLUE, emissive: BLUE, emissiveIntensity: 0.9 }));
    const avatarMats = shoppers.map(() => new THREE.MeshStandardMaterial({ color: VIOLET, emissive: VIOLET, emissiveIntensity: 0.9 }));
    const mapGeo = new THREE.PlaneGeometry(15, 8.5, 40, 22);
    const pos = mapGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, Math.sin(x * 0.7) * Math.cos(y * 0.9) * 0.16 + Math.sin(x * 0.25 + y * 0.4) * 0.12);
    }
    return { shoppers, stores, order, beams, pinMats, avatarMats, mapGeo };
  }, [count]);

  const sim = useRef({ step: 0, t: 0, hold: 0, linked: [] as boolean[], pulse: [] as number[] });
  const photon = useRef<THREE.Mesh>(null);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const avatars = useRef<(THREE.Group | null)[]>([]);

  useEffect(() => {
    sim.current = { step: 0, t: 0, hold: 0, linked: Array(count).fill(false), pulse: Array(count).fill(-1) };
    return () => {
      data.beams.forEach((b) => {
        b.geo.dispose();
        b.mat.dispose();
      });
      data.pinMats.forEach((m) => m.dispose());
      data.avatarMats.forEach((m) => m.dispose());
      data.mapGeo.dispose();
    };
  }, [count, data]);

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const t = clock.elapsedTime;
    const s = sim.current;

    // Parallax + slow sway
    const g = group.current;
    if (g) {
      const px = reduced ? 0 : pointer.x;
      const py = reduced ? 0 : pointer.y;
      const ty = (reduced ? 0 : Math.sin(t * 0.18) * 0.28) + px * 0.22;
      const tx = -0.12 - py * 0.1;
      g.rotation.y += (ty - g.rotation.y) * Math.min(1, dt * 2);
      g.rotation.x += (tx - g.rotation.x) * Math.min(1, dt * 2);
    }

    // Camera pushes through the network on scroll
    const p = scrollState.hero;
    const e = p * p * (3 - 2 * p);
    const aspect = size.width / size.height;
    const narrow = Math.max(0, 1 - aspect);
    if (g) {
      g.scale.setScalar(THREE.MathUtils.clamp(aspect * 1.25, 0.5, 1));
      g.position.y = -0.9 - narrow * 2.6;
    }
    camera.position.z = THREE.MathUtils.lerp(10.5 + narrow * 10, 0.2, e);
    camera.position.y = THREE.MathUtils.lerp(1.4, 0.2, e);
    camera.lookAt(0, THREE.MathUtils.lerp(-0.3, 0, e), 0);

    // Shoppers bob
    avatars.current.forEach((a, i) => {
      if (a) a.position.y = data.shoppers[i].y + Math.sin(t * 1.1 + i * 1.7) * 0.07;
    });

    // Link state machine
    const n = count;
    if (s.step < n) {
      s.t += dt;
      const idx = data.order[s.step];
      const b = data.beams[idx];
      const prog = Math.min(s.t / BEAM_TIME, 1);
      b.geo.setDrawRange(0, Math.max(2, Math.floor(prog * CURVE_POINTS)));
      data.avatarMats[idx].emissiveIntensity = 2.2;
      if (photon.current) {
        photon.current.visible = true;
        photon.current.position.copy(b.curve.getPoint(prog));
      }
      if (prog >= 1) {
        s.linked[idx] = true;
        s.pulse[idx] = 0;
        b.mat.color.copy(CYAN);
        data.avatarMats[idx].emissiveIntensity = 0.9;
        const pos = data.stores[idx];
        const id = performance.now() + idx;
        setChips((c) => [...c.slice(-2), { id, pos: [pos.x, pos.y + 1.0, pos.z] }]);
        window.setTimeout(() => mounted.current && setChips((c) => c.filter((x) => x.id !== id)), 2400);
        s.t = -GAP_TIME;
        s.step += 1;
        if (photon.current) photon.current.visible = false;
      }
    } else {
      s.hold += dt;
      if (s.hold > 3.2) {
        s.step = 0;
        s.t = 0;
        s.hold = 0;
        s.linked.fill(false);
        data.beams.forEach((b) => {
          b.geo.setDrawRange(0, 0);
          b.mat.color.copy(VIOLET);
        });
      }
    }

    // Pins: colour + pulse ring
    data.pinMats.forEach((m, i) => {
      const target = s.linked[i] ? CYAN : BLUE;
      m.color.lerp(target, dt * 6);
      m.emissive.lerp(target, dt * 6);
      m.emissiveIntensity = s.linked[i] ? 1.6 + Math.sin(t * 3 + i) * 0.4 : 0.9;
      const ring = rings.current[i];
      if (ring) {
        if (s.pulse[i] >= 0 && s.pulse[i] < 1.1) {
          s.pulse[i] += dt;
          const k = s.pulse[i] / 1.1;
          ring.visible = true;
          ring.scale.setScalar(1 + k * 7);
          (ring.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.9;
        } else ring.visible = false;
      }
    });
  });

  return (
    <group ref={group} position={[0, -0.9, 0]}>
      {/* stylised wireframe map */}
      <mesh geometry={data.mapGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.75, 0]}>
        <meshBasicMaterial color="#c98a4b" wireframe transparent opacity={0.26} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.78, 0]}>
        <planeGeometry args={[15, 8.5]} />
        <meshBasicMaterial color="#2b1a0f" transparent opacity={0.55} />
      </mesh>

      {/* shoppers */}
      {data.shoppers.map((p, i) => (
        <group key={i} ref={(el) => void (avatars.current[i] = el)} position={p}>
          <mesh material={data.avatarMats[i]} position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.12, 20, 20]} />
          </mesh>
          <mesh material={data.avatarMats[i]} position={[0, -0.02, 0]} scale={[1, 0.8, 0.8]}>
            <sphereGeometry args={[0.2, 20, 20]} />
          </mesh>
        </group>
      ))}

      {/* store pins */}
      {data.stores.map((p, i) => (
        <group key={i} position={p}>
          <mesh material={data.pinMats[i]} position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.14, 20, 20]} />
          </mesh>
          <mesh material={data.pinMats[i]} position={[0, 0.1, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.1, 0.32, 14]} />
          </mesh>
          <mesh ref={(el) => void (rings.current[i] = el)} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} visible={false}>
            <ringGeometry args={[0.12, 0.17, 40]} />
            <meshBasicMaterial color="#e8d1a7" transparent opacity={0} toneMapped={false} depthWrite={false} />
          </mesh>
        </group>
      ))}

      {/* beams */}
      {data.beams.map((b, i) => (
        <primitive key={i} object={b.line} />
      ))}
      <mesh ref={photon} visible={false}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>

      {chips.map((c) => (
        <Html key={c.id} position={c.pos} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
          <div className="chip-pop">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e8d1a7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="17" rx="3" />
              <path d="M3 9h18M8 2v4M16 2v4" />
            </svg>
            Scheduled ✓
          </div>
        </Html>
      ))}
    </group>
  );
}

export default function HeroScene({ low, reduced }: { low: boolean; reduced: boolean }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 5, 6]} intensity={40} color="#b8531f" />
      <pointLight position={[6, 2, 2]} intensity={25} color="#e8d1a7" />
      <Network count={low ? 7 : 12} reduced={reduced} />
      {!low && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={1} luminanceThreshold={0.3} mipmapBlur />
        </EffectComposer>
      )}
    </>
  );
}
