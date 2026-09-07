import { useLayoutEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";

export type Placement = {
  pos: [number, number, number];
  rotY?: number;
  scale?: [number, number, number];
};

const dummy = new THREE.Object3D();

/** Instanced batch — one draw call for many identical objects. */
export function Batch({
  items,
  children,
  castShadow,
  geometry,
}: {
  items: Placement[];
  children: ReactNode;
  castShadow?: boolean;
  geometry?: THREE.BufferGeometry;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    items.forEach((it, i) => {
      dummy.position.set(it.pos[0], it.pos[1], it.pos[2]);
      dummy.rotation.set(0, it.rotY ?? 0, 0);
      const sc = it.scale ?? [1, 1, 1];
      dummy.scale.set(sc[0], sc[1], sc[2]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.count = items.length;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);

  if (items.length === 0) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[geometry ?? (undefined as unknown as THREE.BufferGeometry), undefined as unknown as THREE.Material, items.length]}
      castShadow={castShadow ?? false}
      frustumCulled
    >
      {children}
    </instancedMesh>
  );
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
