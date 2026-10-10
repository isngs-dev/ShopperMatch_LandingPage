"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { mulberry32, pointer, scrollState } from "@/lib/scrollState";
import { cardTexture, checkTexture, warnTexture } from "@/lib/textures";

const RED = new THREE.Color("#c2501f");
const AMBER = new THREE.Color("#d9a66a");
const CYAN = new THREE.Color("#e8d1a7").multiplyScalar(1.5);
const smooth = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function Cards({ cols, rows, reduced }: { cols: number; rows: number; reduced: boolean }) {
  const count = cols * rows;
  const group = useRef<THREE.Group>(null);
  const cards = useRef<THREE.InstancedMesh>(null);
  const warns = useRef<THREE.InstancedMesh>(null);
  const checks = useRef<THREE.InstancedMesh>(null);
  const wave = useRef<THREE.Mesh>(null);
  const waveMat = useRef<THREE.MeshBasicMaterial>(null);
  const { viewport } = useThree();

  const maps = useMemo(() => ({ card: cardTexture(), warn: warnTexture(), check: checkTexture() }), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);

  const data = useMemo(() => {
    const r = mulberry32(5);
    const maxD = Math.hypot((cols - 1) * 0.55 * 1.2, (rows - 1) * 0.5 * 0.95);
    return Array.from({ length: count }, (_, i) => {
      const c = i % cols;
      const rw = Math.floor(i / cols);
      const gx = (c - (cols - 1) / 2) * 1.2;
      const gy = ((rows - 1) / 2 - rw) * 0.95;
      return {
        grid: new THREE.Vector3(gx, gy, 0),
        chaos: new THREE.Vector3((r() - 0.5) * 15, (r() - 0.5) * 8.5, (r() - 0.5) * 7 - 1),
        rot: new THREE.Vector3((r() - 0.5) * 2, (r() - 0.5) * 2, (r() - 0.5) * 1.6),
        spin: (r() - 0.5) * 0.6,
        speed: 0.4 + r() * 0.8,
        warm: r() > 0.5 ? RED : AMBER,
        dist: Math.hypot(gx, gy),
        maxD,
      };
    });
  }, [count, cols, rows]);

  useLayoutEffect(() => {
    // Instance colours must exist before the first draw
    if (cards.current) cards.current.setColorAt(0, RED);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const p = reduced ? 1 : scrollState.problem;
    const maxD = data[0].maxD;
    const w = clamp01((p - 0.42) / 0.4);
    const radius = w * (maxD + 2.4);
    const cm = cards.current;
    const wm = warns.current;
    const km = checks.current;
    if (!cm || !wm || !km) return;

    for (let i = 0; i < count; i++) {
      const d = data[i];
      const e = smooth(clamp01((radius - d.dist) / 1.8));
      const f = 1 - e;
      dummy.position.set(
        THREE.MathUtils.lerp(d.chaos.x + Math.sin(t * d.speed + i) * 0.3 * f, d.grid.x, e),
        THREE.MathUtils.lerp(d.chaos.y + Math.cos(t * d.speed * 0.8 + i) * 0.3 * f, d.grid.y, e),
        THREE.MathUtils.lerp(d.chaos.z, 0, e),
      );
      dummy.rotation.set(
        d.rot.x * f + Math.sin(t * 0.5 + i) * 0.25 * f,
        d.rot.y * f + t * d.spin * f,
        d.rot.z * f,
      );
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      cm.setMatrixAt(i, dummy.matrix);
      col.copy(d.warm).multiplyScalar(0.85).lerp(CYAN, e);
      cm.setColorAt(i, col);

      dummy.translateX(0.36);
      dummy.translateY(-0.02);
      dummy.translateZ(0.05);
      dummy.scale.setScalar(Math.max(0.0001, f));
      dummy.updateMatrix();
      wm.setMatrixAt(i, dummy.matrix);

      dummy.scale.setScalar(Math.max(0.0001, e));
      dummy.updateMatrix();
      km.setMatrixAt(i, dummy.matrix);
    }
    cm.instanceMatrix.needsUpdate = true;
    if (cm.instanceColor) cm.instanceColor.needsUpdate = true;
    wm.instanceMatrix.needsUpdate = true;
    km.instanceMatrix.needsUpdate = true;

    // AI pulse wave
    if (wave.current && waveMat.current) {
      wave.current.visible = w > 0 && w < 1;
      wave.current.scale.setScalar(Math.max(0.01, radius));
      waveMat.current.opacity = Math.sin(Math.PI * w) * 0.9;
    }

    // Layout: grid sits right on desktop, upper on mobile; tilts as it organises
    const g = group.current;
    if (g) {
      const wide = viewport.width > 9;
      const sc = Math.min(1, viewport.width / (wide ? 15 : 8.5));
      g.scale.setScalar(Math.max(0.3, sc));
      g.position.x = wide ? viewport.width * 0.17 : 0;
      g.position.y = wide ? 0 : viewport.height * 0.14;
      const o = smooth(clamp01((p - 0.6) / 0.4));
      const px = reduced ? 0 : pointer.x;
      const py = reduced ? 0 : pointer.y;
      g.rotation.x += (-0.32 * o - py * 0.08 - g.rotation.x) * 0.06;
      g.rotation.y += (-0.18 * o + px * 0.12 - g.rotation.y) * 0.06;
    }
  });

  return (
    <group ref={group}>
      <instancedMesh ref={cards} args={[undefined, undefined, count]} frustumCulled={false}>
        <planeGeometry args={[1, 0.66]} />
        <meshBasicMaterial map={maps.card} transparent toneMapped={false} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={warns} args={[undefined, undefined, count]} frustumCulled={false}>
        <planeGeometry args={[0.26, 0.26]} />
        <meshBasicMaterial map={maps.warn} transparent toneMapped={false} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={checks} args={[undefined, undefined, count]} frustumCulled={false}>
        <planeGeometry args={[0.28, 0.28]} />
        <meshBasicMaterial map={maps.check} transparent toneMapped={false} depthWrite={false} />
      </instancedMesh>
      <mesh ref={wave} position={[0, 0, 0.3]} visible={false}>
        <ringGeometry args={[0.97, 1, 128]} />
        <meshBasicMaterial ref={waveMat} color="#f4e9d3" transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

export default function ProblemScene({ low, reduced }: { low: boolean; reduced: boolean }) {
  return (
    <>
      <Cards cols={low ? 6 : 8} rows={low ? 4 : 6} reduced={reduced} />
      {!low && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={1} luminanceThreshold={0.55} mipmapBlur />
        </EffectComposer>
      )}
    </>
  );
}
