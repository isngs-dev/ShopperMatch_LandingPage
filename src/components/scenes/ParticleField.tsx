"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { pointer, scrollState, mulberry32 } from "@/lib/scrollState";
import { softDotTexture } from "@/lib/textures";

// One colour per section: hero, problem, features, about, form
const STOPS = ["#c98a4b", "#c2662b", "#b8531f", "#c98a4b", "#e8d1a7"].map((c) => new THREE.Color(c));

type Props = { count: number; reduced: boolean };

/** Persistent particle field: mouse-reactive, colour shifts with scroll position. */
export default function ParticleField({ count, reduced }: Props) {
  const points = useRef<THREE.Points>(null);
  const mat = useRef<THREE.PointsMaterial>(null);
  const tex = useMemo(() => softDotTexture(), []);
  const tmp = useMemo(() => new THREE.Color(), []);

  const { positions } = useMemo(() => {
    const rnd = mulberry32(11);
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (rnd() - 0.5) * 34;
      p[i * 3 + 1] = (rnd() - 0.5) * 22;
      p[i * 3 + 2] = (rnd() - 0.5) * 18 - 2;
    }
    return { positions: p };
  }, [count]);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const pts = points.current;
    if (!pts || !mat.current) return;

    const f = THREE.MathUtils.clamp(scrollState.page, 0, 1) * (STOPS.length - 1);
    const i = Math.min(Math.floor(f), STOPS.length - 2);
    tmp.lerpColors(STOPS[i], STOPS[i + 1], f - i);
    mat.current.color.lerp(tmp, 1 - Math.exp(-dt * 3));

    const px = reduced ? 0 : pointer.x;
    const py = reduced ? 0 : pointer.y;
    pts.rotation.y += ((px * 0.25 + t * 0.012) - pts.rotation.y) * Math.min(1, dt * 1.5);
    pts.rotation.x += (-py * 0.15 - pts.rotation.x) * Math.min(1, dt * 1.5);
    pts.position.y = scrollState.page * 6; // slow parallax with scroll

  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={mat}
        map={tex}
        size={0.11}
        sizeAttenuation
        transparent
        opacity={0.75}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color="#c98a4b"
      />
    </points>
  );
}
