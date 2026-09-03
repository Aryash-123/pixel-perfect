import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { getPaint, getWheel, type CarDef } from "@/game/cars";

function bodyGeometry(car: CarDef) {
  const s = car.shape;
  const hl = s.len / 2;
  const shape = new THREE.Shape();
  shape.moveTo(hl, s.noseH * 0.55);
  shape.lineTo(hl * 0.99, s.noseH);
  shape.lineTo(hl * s.hoodEnd + hl * 0.18, s.hoodH);
  shape.lineTo(hl * s.roofFront, s.roofH);
  shape.lineTo(hl * s.roofRear, s.roofH);
  shape.lineTo(-hl * 0.86, s.tailH);
  shape.lineTo(-hl, s.tailH * 0.86);
  shape.lineTo(-hl, 0.22);
  shape.lineTo(-hl * 0.6, 0.16);
  shape.lineTo(hl * 0.6, 0.15);
  shape.lineTo(hl * 0.98, 0.24);
  shape.closePath();

  const depth = s.width - 0.16;
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.06,
    bevelThickness: 0.06,
    bevelSegments: 2,
    steps: 1,
  });
  g.translate(0, 0, -depth / 2);
  g.rotateY(-Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

function glassGeometry(car: CarDef) {
  const s = car.shape;
  const hl = s.len / 2;
  const shape = new THREE.Shape();
  shape.moveTo(hl * s.hoodEnd + hl * 0.2, s.hoodH - 0.02);
  shape.lineTo(hl * s.roofFront, s.roofH + 0.015);
  shape.lineTo(hl * s.roofRear, s.roofH + 0.015);
  shape.lineTo(-hl * 0.84, s.tailH - 0.02);
  shape.lineTo(hl * s.roofRear, s.roofH - 0.22);
  shape.lineTo(hl * s.roofFront + 0.1, s.roofH - 0.22);
  shape.closePath();
  const depth = s.width - 0.34;
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 });
  g.translate(0, 0, -depth / 2);
  g.rotateY(-Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

function Wheel({
  car,
  wheelId,
  position,
  spinRef,
  steer = 0,
}: {
  car: CarDef;
  wheelId: string;
  position: [number, number, number];
  spinRef?: React.RefObject<number>;
  steer?: number;
}) {
  const w = getWheel(wheelId);
  const s = car.shape;
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);

  useFrame(() => {
    if (inner.current && spinRef) inner.current.rotation.x = spinRef.current ?? 0;
    if (group.current) group.current.rotation.y = steer;
  });

  const spokes = useMemo(
    () =>
      Array.from({ length: w.spokes }, (_, i) => ((i / w.spokes) * Math.PI * 2)),
    [w.spokes],
  );

  return (
    <group ref={group} position={position}>
      <group ref={inner}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[s.wheelR, s.wheelR, s.wheelW, 18]} />
          <meshStandardMaterial color="#16171b" roughness={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
          <cylinderGeometry args={[s.wheelR - w.lip, s.wheelR - w.lip, s.wheelW + 0.02, 18]} />
          <meshStandardMaterial color={w.rim} metalness={0.9} roughness={0.25} />
        </mesh>
        {spokes.map((a, i) => (
          <mesh key={i} rotation={[a, 0, Math.PI / 2]} position={[0, 0, 0]}>
            <boxGeometry args={[0.05, s.wheelW + 0.04, (s.wheelR - w.lip) * 1.7]} />
            <meshStandardMaterial color={w.rim} metalness={0.85} roughness={0.3} />
          </mesh>
        ))}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[s.wheelR * 0.55, s.wheelR * 0.55, s.wheelW + 0.05, 14]} />
          <meshStandardMaterial color="#b3252c" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

export type CarMeshProps = {
  car: CarDef;
  paintId: string;
  wheelId: string;
  spinRef?: React.RefObject<number>;
  steer?: number;
  headlights?: boolean;
  simple?: boolean;
};

export function CarMesh({ car, paintId, wheelId, spinRef, steer = 0, headlights = true, simple }: CarMeshProps) {
  const s = car.shape;
  const paint = getPaint(paintId);
  const body = useMemo(() => bodyGeometry(car), [car]);
  const glass = useMemo(() => glassGeometry(car), [car]);
  const hl = s.len / 2;
  const axleF = hl * 0.66;
  const axleR = -hl * 0.68;
  const wx = s.width / 2 - s.wheelW / 2 + s.fenderFlare * 0.4;

  return (
    <group>
      <mesh geometry={body} castShadow position={[0, 0, 0]}>
        <meshStandardMaterial color={paint.hex} metalness={0.65} roughness={0.28} envMapIntensity={1.2} />
      </mesh>
      <mesh geometry={glass}>
        <meshStandardMaterial color="#0a1220" metalness={0.9} roughness={0.08} transparent opacity={0.85} />
      </mesh>

      {/* fender flares */}
      {!simple &&
        ([axleF, axleR] as const).map((z, i) =>
          ([-1, 1] as const).map((sd) => (
            <mesh key={`${i}${sd}`} position={[sd * (s.width / 2 - 0.06), s.wheelR + 0.14, z]}>
              <boxGeometry args={[s.fenderFlare * 2 + 0.1, 0.2, s.wheelR * 2.3]} />
              <meshStandardMaterial color={paint.hex} metalness={0.6} roughness={0.35} />
            </mesh>
          )),
        )}

      {/* side skirts */}
      {([-1, 1] as const).map((sd) => (
        <mesh key={sd} position={[sd * (s.width / 2 - 0.04), 0.19, 0]}>
          <boxGeometry args={[0.1, 0.14, s.len * 0.58]} />
          <meshStandardMaterial color="#12141a" roughness={0.8} />
        </mesh>
      ))}

      {/* front splitter + grille */}
      <mesh position={[0, s.noseH * 0.42, hl - 0.04]}>
        <boxGeometry args={[s.width * 0.78, 0.16, 0.1]} />
        <meshStandardMaterial color="#0d0f14" roughness={0.85} />
      </mesh>

      {/* headlights */}
      {([-1, 1] as const).map((sd) => (
        <mesh key={sd} position={[sd * s.width * 0.31, s.noseH * 0.86, hl - 0.1]}>
          <boxGeometry args={[s.width * 0.26, 0.11, 0.1]} />
          <meshStandardMaterial
            color="#eaf6ff"
            emissive={headlights ? "#cfe8ff" : "#223"}
            emissiveIntensity={headlights ? 2.4 : 0.2}
          />
        </mesh>
      ))}

      {/* taillight bar */}
      <mesh position={[0, s.tailH * 0.82, -hl + 0.03]}>
        <boxGeometry args={[s.width * 0.78, 0.09, 0.06]} />
        <meshStandardMaterial color={car.accent} emissive={car.accent} emissiveIntensity={1.6} />
      </mesh>

      {/* accent underglow strip */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[s.width * 0.9, s.len * 0.8]} />
        <meshBasicMaterial color={car.accent} transparent opacity={0.13} />
      </mesh>

      {/* side intakes */}
      {s.intakes &&
        ([-1, 1] as const).map((sd) => (
          <mesh key={sd} position={[sd * (s.width / 2 - 0.02), s.hoodH * 0.75, -hl * 0.18]} rotation={[0, 0, 0.2]}>
            <boxGeometry args={[0.08, 0.26, s.len * 0.2]} />
            <meshStandardMaterial color="#0b0d12" roughness={0.7} />
          </mesh>
        ))}

      {/* spoiler */}
      {s.spoiler > 0.05 && (
        <>
          <mesh position={[0, s.tailH + s.spoiler, -hl + 0.16]}>
            <boxGeometry args={[s.width * s.spoilerWidthPct, 0.06, 0.34]} />
            <meshStandardMaterial color="#15171d" roughness={0.6} metalness={0.4} />
          </mesh>
          {([-1, 1] as const).map((sd) => (
            <mesh key={sd} position={[sd * s.width * 0.34, s.tailH + s.spoiler / 2, -hl + 0.16]}>
              <boxGeometry args={[0.06, s.spoiler, 0.16]} />
              <meshStandardMaterial color="#15171d" />
            </mesh>
          ))}
        </>
      )}

      {/* rear diffuser */}
      {s.diffuser && (
        <mesh position={[0, 0.18, -hl + 0.06]}>
          <boxGeometry args={[s.width * 0.8, 0.2, 0.24]} />
          <meshStandardMaterial color="#0a0c11" roughness={0.9} />
        </mesh>
      )}

      {/* exhausts */}
      {Array.from({ length: s.exhausts }, (_, i) => {
        const half = s.exhausts / 2;
        const groupSide = i < half ? -1 : 1;
        const inner = (i % half) * 0.13;
        return (
          <mesh
            key={i}
            position={[groupSide * (s.width * 0.26 - inner), 0.28, -hl - 0.02]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.055, 0.055, 0.12, 10]} />
            <meshStandardMaterial color="#8f98a5" metalness={1} roughness={0.3} />
          </mesh>
        );
      })}

      <Wheel car={car} wheelId={wheelId} position={[-wx, s.wheelR, axleF]} spinRef={spinRef} steer={steer} />
      <Wheel car={car} wheelId={wheelId} position={[wx, s.wheelR, axleF]} spinRef={spinRef} steer={steer} />
      <Wheel car={car} wheelId={wheelId} position={[-wx, s.wheelR, axleR]} spinRef={spinRef} />
      <Wheel car={car} wheelId={wheelId} position={[wx, s.wheelR, axleR]} spinRef={spinRef} />
    </group>
  );
}
