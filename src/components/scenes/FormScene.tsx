"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { pointer } from "@/lib/scrollState";
import { checkTexture } from "@/lib/textures";

const COLORS = ["#c98a4b", "#b8531f", "#e8d1a7"].map((c) => new THREE.Color(c).multiplyScalar(0.9));

/** Slow-orbiting calendar tiles and checkmarks around the form card. */
function Orbit({ count, reduced }: { count: number; reduced: boolean }) {
  const tiles = useRef<THREE.InstancedMesh>(null);
  const checks = useRef<THREE.InstancedMesh>(null);
  const heads = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const map = useMemo(() => checkTexture(), []);
  const { viewport } = useThree();

  useFrame(({ clock }) => {
    const t = reduced ? 0 : clock.elapsedTime;
    const wide = viewport.width > 9;
    const rx = Math.max(3.2, viewport.width * (wide ? 0.36 : 0.45));
    const ry = viewport.height * 0.38;
    const px = reduced ? 0 : pointer.x * 0.4;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + t * 0.12;
      const depth = Math.sin(a);
      dummy.position.set(Math.cos(a) * rx + px, Math.sin(a * 1.0) * ry * 0.9 + Math.sin(t * 0.7 + i) * 0.15, -depth * 2.2 - 1);
      dummy.rotation.set(Math.sin(t * 0.3 + i) * 0.4, a * 0.5 + t * 0.2, Math.cos(t * 0.25 + i) * 0.25);
      const s = 0.8 + (i % 3) * 0.18;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      tiles.current?.setMatrixAt(i, dummy.matrix);
      tiles.current?.setColorAt(i, COLORS[i % 3]);

      // calendar header strip
      dummy.translateY(0.3 / 1);
      dummy.translateZ(0.06);
      dummy.scale.set(s, s * 0.22, s);
      dummy.updateMatrix();
      heads.current?.setMatrixAt(i, dummy.matrix);

      // checkmark on every other tile
      dummy.position.set(Math.cos(a) * rx + px, Math.sin(a) * ry * 0.9 + Math.sin(t * 0.7 + i) * 0.15, -depth * 2.2 - 1);
      dummy.rotation.set(Math.sin(t * 0.3 + i) * 0.4, a * 0.5 + t * 0.2, Math.cos(t * 0.25 + i) * 0.25);
      dummy.scale.setScalar(i % 2 ? 0.0001 : s);
      dummy.updateMatrix();
      dummy.translateY(-0.08);
      dummy.translateZ(0.07);
      dummy.updateMatrix();
      checks.current?.setMatrixAt(i, dummy.matrix);
    }
    [tiles, heads, checks].forEach((r) => {
      if (r.current) r.current.instanceMatrix.needsUpdate = true;
    });
    if (tiles.current?.instanceColor) tiles.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={tiles} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 0.1]} />
        <meshStandardMaterial roughness={0.4} metalness={0.3} emissive="#4a3220" emissiveIntensity={0.6} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 0.04]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.35} />
      </instancedMesh>
      <instancedMesh ref={checks} args={[undefined, undefined, count]} frustumCulled={false}>
        <planeGeometry args={[0.45, 0.45]} />
        <meshBasicMaterial map={map} transparent toneMapped={false} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}

export default function FormScene({ low, reduced }: { low: boolean; reduced: boolean }) {
  return (
    <>
      <ambientLight intensity={0.9} />
      <pointLight position={[0, 2, 6]} intensity={40} color="#ffffff" />
      <pointLight position={[-6, -2, 2]} intensity={30} color="#b8531f" />
      <Orbit count={low ? 8 : 14} reduced={reduced} />
    </>
  );
}
