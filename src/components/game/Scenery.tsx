import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Batch, mulberry32, type Placement } from "./Batch";
import { ROAD_HALF_WIDTH, sampleAt, worldPos, type Route } from "@/game/route";
import { buildingTexture, neonTexture } from "@/game/textures";

const dummy = new THREE.Object3D();

export function Scenery({ route }: { route: Route }) {
  const data = useMemo(() => {
    const rand = mulberry32(route.race.id.length * 7919 + 17);
    const buildings: Placement[][] = [[], [], [], [], []];
    const neon: { pos: [number, number, number]; rotY: number; variant: number }[] = [];
    const mountains: Placement[] = [];
    const rocks: Placement[] = [];
    const palms: Placement[] = [];
    const palmTops: Placement[] = [];
    const trees: Placement[] = [];
    const peds: Placement[] = [];
    const sidewalks: Placement[] = [];
    const oceanSegments: Placement[] = [];
    let coastSide = -1;

    for (let s = 10; s < route.length; s += 26) {
      const p = sampleAt(route, s);
      const env = p.env;

      if (env === "city" || env === "tunnel") {
        for (const side of [-1, 1] as const) {
          // sidewalk strip
          const sw = worldPos(route, s, side * (ROAD_HALF_WIDTH + 3.6));
          sidewalks.push({ pos: [sw.x, sw.y + 0.16, sw.z], rotY: p.heading, scale: [5, 0.32, 26] });

          // two rows of buildings per side, facing the street
          for (let row = 0; row < 2; row++) {
            const dist = ROAD_HALF_WIDTH + 12 + row * 26 + rand() * 8;
            const w = worldPos(route, s + (rand() - 0.5) * 16, side * dist);
            const h = 14 + rand() * (row === 0 ? 46 : 80);
            const wide = 10 + rand() * 12;
            const variant = Math.floor(rand() * 5);
            buildings[variant]!.push({
              pos: [w.x, w.y + h / 2, w.z],
              rotY: p.heading + (rand() - 0.5) * 0.12,
              scale: [wide, h, wide * (0.7 + rand() * 0.6)],
            });
          }
          if (rand() < 0.45) {
            const w = worldPos(route, s + rand() * 10, side * (ROAD_HALF_WIDTH + 9));
            neon.push({
              pos: [w.x, w.y + 6 + rand() * 8, w.z],
              rotY: p.heading + (side < 0 ? Math.PI / 2 : -Math.PI / 2),
              variant: Math.floor(rand() * 5),
            });
          }
          // pedestrians on the sidewalk only — never on the racing lane
          const count = 2 + Math.floor(rand() * 3);
          for (let i = 0; i < count; i++) {
            const w = worldPos(route, s + rand() * 24, side * (ROAD_HALF_WIDTH + 2.6 + rand() * 3));
            peds.push({ pos: [w.x, w.y + 0.9, w.z], rotY: rand() * Math.PI * 2 });
          }
        }
      }

      if (env === "mountain") {
        for (const side of [-1, 1] as const) {
          const dist = ROAD_HALF_WIDTH + 22 + rand() * 26;
          const w = worldPos(route, s + (rand() - 0.5) * 20, side * dist);
          const h = 50 + rand() * 130;
          mountains.push({ pos: [w.x, w.y + h / 2 - 12, w.z], rotY: rand() * 6, scale: [h * 0.9, h, h * 0.9] });
          const r = worldPos(route, s + rand() * 20, side * (ROAD_HALF_WIDTH + 6 + rand() * 5));
          rocks.push({ pos: [r.x, r.y + 1, r.z], rotY: rand() * 6, scale: [2 + rand() * 3, 2 + rand() * 4, 2 + rand() * 3] });
        }
      }

      if (env === "coast") {
        // ocean on one consistent side for the whole coastal stretch
        const w = worldPos(route, s, coastSide * 150);
        oceanSegments.push({ pos: [w.x, w.y - 6, w.z], rotY: p.heading, scale: [260, 1, 60] });
        for (let i = 0; i < 3; i++) {
          const t = worldPos(route, s + i * 8, coastSide * (ROAD_HALF_WIDTH + 5 + rand() * 4));
          palms.push({ pos: [t.x, t.y + 3.5, t.z], rotY: rand() * 6, scale: [1, 1 + rand() * 0.4, 1] });
          palmTops.push({ pos: [t.x, t.y + 7 + rand(), t.z], rotY: rand() * 6 });
        }
        // coastal buildings on the inland side
        for (let row = 0; row < 1; row++) {
          const w2 = worldPos(route, s + rand() * 14, -coastSide * (ROAD_HALF_WIDTH + 16 + rand() * 14));
          const h = 8 + rand() * 22;
          buildings[Math.floor(rand() * 5)]!.push({
            pos: [w2.x, w2.y + h / 2, w2.z],
            rotY: p.heading,
            scale: [10 + rand() * 8, h, 10 + rand() * 6],
          });
        }
      }

      if (env === "suburb" || env === "highway") {
        for (const side of [-1, 1] as const) {
          for (let i = 0; i < 2; i++) {
            const w = worldPos(route, s + rand() * 20, side * (ROAD_HALF_WIDTH + 8 + rand() * 22));
            trees.push({ pos: [w.x, w.y + 3, w.z], rotY: rand() * 6, scale: [1, 1 + rand() * 0.6, 1] });
          }
          if (env === "highway" && rand() < 0.35) {
            const w = worldPos(route, s, side * (ROAD_HALF_WIDTH + 34 + rand() * 20));
            const h = 18 + rand() * 40;
            buildings[Math.floor(rand() * 5)]!.push({
              pos: [w.x, w.y + h / 2, w.z],
              rotY: p.heading,
              scale: [12 + rand() * 10, h, 12 + rand() * 8],
            });
          }
        }
      }
    }

    return { buildings, neon, mountains, rocks, palms, palmTops, trees, peds, sidewalks, oceanSegments, coastSide };
  }, [route]);

  const texes = useMemo(() => [0, 1, 2, 3, 4].map((v) => buildingTexture(v)), []);

  return (
    <group>
      {/* ground plate so the world never looks like an infinite void */}
      <GroundPlate route={route} />

      {data.sidewalks.length > 0 && (
        <Batch items={data.sidewalks}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#39405a" roughness={0.95} />
        </Batch>
      )}

      {data.buildings.map((items, i) => (
        <Batch key={i} items={items} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial map={texes[i]!} emissiveMap={texes[i]!} emissive="#ffffff" emissiveIntensity={0.55} roughness={0.8} />
        </Batch>
      ))}

      {data.neon.map((n, i) => (
        <mesh key={i} position={n.pos} rotation={[0, n.rotY, 0]}>
          <planeGeometry args={[6, 3]} />
          <meshBasicMaterial map={neonTexture(n.variant)} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {data.mountains.length > 0 && (
        <Batch items={data.mountains}>
          <coneGeometry args={[0.6, 1, 6, 1]} />
          <meshStandardMaterial color="#1d2436" roughness={1} flatShading />
        </Batch>
      )}
      {data.rocks.length > 0 && (
        <Batch items={data.rocks}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#2b3245" roughness={1} flatShading />
        </Batch>
      )}

      {data.palms.length > 0 && (
        <>
          <Batch items={data.palms}>
            <cylinderGeometry args={[0.18, 0.28, 7, 6]} />
            <meshStandardMaterial color="#3a2f22" roughness={1} />
          </Batch>
          <Batch items={data.palmTops}>
            <coneGeometry args={[2.6, 1.4, 6, 1]} />
            <meshStandardMaterial color="#1c4a35" roughness={0.9} flatShading />
          </Batch>
        </>
      )}

      {data.trees.length > 0 && (
        <>
          <Batch items={data.trees}>
            <cylinderGeometry args={[0.22, 0.3, 5, 6]} />
            <meshStandardMaterial color="#33291d" roughness={1} />
          </Batch>
          <Batch items={data.trees.map((t) => ({ ...t, pos: [t.pos[0], t.pos[1] + 3.4, t.pos[2]] as [number, number, number] }))}>
            <icosahedronGeometry args={[2.6, 0]} />
            <meshStandardMaterial color="#1b3a2a" roughness={1} flatShading />
          </Batch>
        </>
      )}

      {data.oceanSegments.length > 0 && <Ocean items={data.oceanSegments} />}
      {data.peds.length > 0 && <Pedestrians items={data.peds} />}
      {route.race.moon && <Moon route={route} />}
    </group>
  );
}

function GroundPlate({ route }: { route: Route }) {
  const b = route.bounds;
  const cx = (b.minX + b.maxX) / 2;
  const cz = (b.minZ + b.maxZ) / 2;
  const size = Math.max(b.maxX - b.minX, b.maxZ - b.minZ) + 1400;
  return (
    <mesh position={[cx, -0.6, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color="#141a2a" roughness={1} />
    </mesh>
  );
}

function Ocean({ items }: { items: Placement[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = clock.elapsedTime;
    items.forEach((it, i) => {
      dummy.position.set(it.pos[0], it.pos[1] + Math.sin(t * 0.6 + i) * 0.25, it.pos[2]);
      dummy.rotation.set(0, it.rotY ?? 0, 0);
      const sc = it.scale ?? [1, 1, 1];
      dummy.scale.set(sc[0], sc[1], sc[2]);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={ref}
      args={[undefined as unknown as THREE.BufferGeometry, undefined as unknown as THREE.Material, items.length]}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#0a2b4d" metalness={0.85} roughness={0.15} emissive="#062038" emissiveIntensity={0.4} />
    </instancedMesh>
  );
}

function Pedestrians({ items }: { items: Placement[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = clock.elapsedTime;
    const n = Math.min(items.length, 400);
    for (let i = 0; i < n; i++) {
      const it = items[i]!;
      dummy.position.set(it.pos[0], it.pos[1] + Math.abs(Math.sin(t * 2.4 + i)) * 0.08, it.pos[2]);
      dummy.rotation.set(0, (it.rotY ?? 0) + Math.sin(t * 0.6 + i) * 0.3, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={ref}
      args={[undefined as unknown as THREE.BufferGeometry, undefined as unknown as THREE.Material, items.length]}
    >
      <capsuleGeometry args={[0.22, 0.9, 4, 6]} />
      <meshStandardMaterial color="#8390ad" roughness={0.9} />
    </instancedMesh>
  );
}

function Moon({ route }: { route: Route }) {
  const p = sampleAt(route, route.length * 0.6);
  return (
    <group position={[p.x - 420, 190, p.z + 520]}>
      <mesh>
        <sphereGeometry args={[52, 24, 16]} />
        <meshBasicMaterial color="#f2f0e2" />
      </mesh>
      <mesh>
        <sphereGeometry args={[74, 16, 12]} />
        <meshBasicMaterial color="#cfe0ff" transparent opacity={0.09} />
      </mesh>
    </group>
  );
}
