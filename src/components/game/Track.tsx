import { useMemo } from "react";
import * as THREE from "three";
import { Batch, mulberry32, type Placement } from "./Batch";
import { buildRibbon, buildWall, type CentreFn } from "@/game/ribbon";
import { branchCentre, ROAD_HALF_WIDTH, sampleAt, worldPos, type Route } from "@/game/route";
import { checkerTexture, roadTexture, signTexture } from "@/game/textures";

/** Centreline of the ground route (drifts sideways through every branch). */
export function groundCentre(route: Route): CentreFn {
  return (s) => {
    let offset = 0;
    for (const b of route.race.branches) {
      if (s > b.start && s < b.end) offset += branchCentre(b, s, "ground").offset;
    }
    return { offset, height: 0 };
  };
}

export function Track({ route }: { route: Route }) {
  const roadTex = useMemo(() => {
    const t = roadTexture();
    const c = t.clone();
    c.needsUpdate = true;
    c.wrapS = THREE.ClampToEdgeWrapping;
    c.wrapT = THREE.RepeatWrapping;
    return c;
  }, []);
  const checker = useMemo(() => {
    const t = checkerTexture().clone();
    t.needsUpdate = true;
    t.repeat.set(8, 1);
    return t;
  }, []);

  const centre = useMemo(() => groundCentre(route), [route]);

  const geoms = useMemo(() => {
    const road = buildRibbon(route, { centre, halfWidth: ROAD_HALF_WIDTH });
    const shoulderL = buildRibbon(route, {
      centre: (s) => centre(s),
      halfWidth: ROAD_HALF_WIDTH + 3.2,
      yLift: -0.06,
    });
    const flyovers = route.race.branches.map((b) => ({
      branch: b,
      deck: buildRibbon(route, {
        from: b.start,
        to: b.end,
        halfWidth: ROAD_HALF_WIDTH * 0.75,
        centre: (s) => branchCentre(b, s, "flyover"),
        step: 3,
      }),
      wallL: buildWall(route, {
        from: b.start,
        to: b.end,
        side: -1,
        offset: ROAD_HALF_WIDTH * 0.75,
        height: 1.1,
        centre: (s) => branchCentre(b, s, "flyover"),
        yBase: -0.5,
      }),
      wallR: buildWall(route, {
        from: b.start,
        to: b.end,
        side: 1,
        offset: ROAD_HALF_WIDTH * 0.75,
        height: 1.1,
        centre: (s) => branchCentre(b, s, "flyover"),
        yBase: -0.5,
      }),
    }));
    return { road, shoulderL, flyovers };
  }, [route, centre]);

  /* ---------------- roadside furniture, all placed relative to the route */
  const furniture = useMemo(() => {
    const rand = mulberry32(1337);
    const curbs: Placement[] = [];
    const rails: Placement[] = [];
    const lamps: Placement[] = [];
    const lampHeads: Placement[] = [];
    const pillars: Placement[] = [];
    const reflectors: Placement[] = [];

    for (let s = 6; s < route.length - 6; s += 8) {
      const p = sampleAt(route, s);
      for (const side of [-1, 1] as const) {
        const w = worldPos(route, s, side * (ROAD_HALF_WIDTH + 0.6));
        curbs.push({ pos: [w.x, w.y + 0.12, w.z], rotY: p.heading, scale: [1.2, 0.24, 8] });
        rails.push({ pos: [w.x + 0, w.y + 0.65, w.z], rotY: p.heading, scale: [0.16, 0.5, 7.6] });
      }
      if (s % 24 < 8) {
        for (const side of [-1, 1] as const) {
          const w = worldPos(route, s, side * (ROAD_HALF_WIDTH + 1.6));
          reflectors.push({ pos: [w.x, w.y + 0.4, w.z], rotY: p.heading, scale: [0.12, 0.12, 0.12] });
        }
      }
    }

    let lampSide = 1;
    for (let s = 30; s < route.length - 20; s += 44) {
      const p = sampleAt(route, s);
      const w = worldPos(route, s, lampSide * (ROAD_HALF_WIDTH + 2.4));
      lamps.push({ pos: [w.x, w.y + 4, w.z], rotY: p.heading, scale: [1, 1, 1] });
      lampHeads.push({ pos: [w.x - lampSide * 1.6 * Math.cos(p.heading), w.y + 7.8, w.z + lampSide * 1.6 * Math.sin(p.heading)], rotY: p.heading });
      lampSide *= -1;
    }

    for (const b of route.race.branches) {
      for (let s = b.start + 14; s < b.end - 14; s += 22) {
        const c = branchCentre(b, s, "flyover");
        if (c.height < 1.2) continue;
        const w = worldPos(route, s, 0);
        pillars.push({ pos: [w.x, (w.y + c.height) / 2, w.z], scale: [1.4, c.height + 0.6, 1.4] });
      }
    }

    return { curbs, rails, lamps, lampHeads, pillars, reflectors, rand };
  }, [route]);

  /* -------------------------------------------------- signs and gantries */
  const gantries = useMemo(() => {
    const list: { pos: [number, number, number]; rotY: number; text: string; kind: "info" | "branch" }[] = [];
    for (const sg of route.signs) {
      const w = worldPos(route, sg.s, 0);
      list.push({ pos: [w.x, w.y, w.z], rotY: w.heading, text: sg.text, kind: "info" });
    }
    for (const b of route.race.branches) {
      const w = worldPos(route, Math.max(4, b.start - 90), 0);
      list.push({ pos: [w.x, w.y, w.z], rotY: w.heading, text: `${b.signs[0]} / ${b.signs[1]}`, kind: "branch" });
    }
    return list;
  }, [route]);

  const checkpointArches = useMemo(
    () =>
      route.checkpoints.map((s, i) => {
        const w = worldPos(route, s, 0);
        return { pos: [w.x, w.y, w.z] as [number, number, number], rotY: w.heading, index: i };
      }),
    [route],
  );

  const finish = useMemo(() => {
    const w = worldPos(route, Math.min(route.length - 2, route.length - 6), 0);
    return { pos: [w.x, w.y, w.z] as [number, number, number], rotY: w.heading };
  }, [route]);

  return (
    <group>
      {/* asphalt */}
      <mesh geometry={geoms.shoulderL} receiveShadow>
        <meshStandardMaterial color="#1b2030" roughness={1} />
      </mesh>
      <mesh geometry={geoms.road} receiveShadow>
        <meshStandardMaterial map={roadTex} roughness={0.82} metalness={0.05} />
      </mesh>

      {/* flyover decks */}
      {geoms.flyovers.map((f, i) => (
        <group key={i}>
          <mesh geometry={f.deck} receiveShadow>
            <meshStandardMaterial map={roadTex} roughness={0.8} />
          </mesh>
          <mesh geometry={f.wallL}>
            <meshStandardMaterial color="#2a3145" roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
          <mesh geometry={f.wallR}>
            <meshStandardMaterial color="#2a3145" roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      <Batch items={furniture.pillars}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#333b52" roughness={0.9} />
      </Batch>

      <Batch items={furniture.curbs}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#4b5266" roughness={0.9} />
      </Batch>
      <Batch items={furniture.rails}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#8b93a6" metalness={0.7} roughness={0.4} />
      </Batch>
      <Batch items={furniture.reflectors}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#7fe8ff" emissive="#7fe8ff" emissiveIntensity={2} />
      </Batch>

      {/* street lamps */}
      <Batch items={furniture.lamps}>
        <cylinderGeometry args={[0.14, 0.18, 8, 6]} />
        <meshStandardMaterial color="#3b4358" metalness={0.5} roughness={0.6} />
      </Batch>
      <Batch items={furniture.lampHeads}>
        <boxGeometry args={[3.2, 0.22, 0.7]} />
        <meshStandardMaterial color="#ffe7bd" emissive="#ffdca8" emissiveIntensity={2.6} />
      </Batch>

      {/* overhead gantries */}
      {gantries.map((g, i) => (
        <Gantry key={i} {...g} />
      ))}

      {/* checkpoint arches */}
      {checkpointArches.map((c) => (
        <group key={c.index} position={c.pos} rotation={[0, c.rotY, 0]}>
          {([-1, 1] as const).map((sd) => (
            <mesh key={sd} position={[sd * (ROAD_HALF_WIDTH + 1), 3, 0]}>
              <boxGeometry args={[0.4, 6, 0.4]} />
              <meshStandardMaterial color="#1d2740" emissive="#39d0ff" emissiveIntensity={0.5} />
            </mesh>
          ))}
          <mesh position={[0, 6, 0]}>
            <boxGeometry args={[ROAD_HALF_WIDTH * 2 + 2, 0.4, 0.4]} />
            <meshStandardMaterial color="#39d0ff" emissive="#39d0ff" emissiveIntensity={1.6} />
          </mesh>
          <mesh position={[0, 3, 0]} rotation={[0, 0, 0]}>
            <planeGeometry args={[ROAD_HALF_WIDTH * 2, 6]} />
            <meshBasicMaterial color="#39d0ff" transparent opacity={0.07} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* finish line */}
      <group position={finish.pos} rotation={[0, finish.rotY, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <planeGeometry args={[ROAD_HALF_WIDTH * 2, 3]} />
          <meshBasicMaterial map={checker} />
        </mesh>
        {([-1, 1] as const).map((sd) => (
          <mesh key={sd} position={[sd * (ROAD_HALF_WIDTH + 1.4), 4, 0]}>
            <boxGeometry args={[0.6, 8, 0.6]} />
            <meshStandardMaterial color="#20283c" />
          </mesh>
        ))}
        <mesh position={[0, 7.4, 0]}>
          <boxGeometry args={[ROAD_HALF_WIDTH * 2 + 3, 2.4, 0.3]} />
          <meshStandardMaterial map={signTexture("FINISH", "#12142a", "#ffe9a8")} emissive="#ffffff" emissiveIntensity={0.25} />
        </mesh>
      </group>
    </group>
  );
}

function Gantry({
  pos,
  rotY,
  text,
  kind,
}: {
  pos: [number, number, number];
  rotY: number;
  text: string;
  kind: "info" | "branch";
}) {
  const tex = useMemo(
    () => signTexture(text, kind === "branch" ? "#123a5c" : "#123d22", "#eafff0"),
    [text, kind],
  );
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {([-1, 1] as const).map((sd) => (
        <mesh key={sd} position={[sd * (ROAD_HALF_WIDTH + 1.2), 3.6, 0]}>
          <cylinderGeometry args={[0.2, 0.24, 7.2, 6]} />
          <meshStandardMaterial color="#3d465c" metalness={0.5} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 7.1, 0]}>
        <boxGeometry args={[ROAD_HALF_WIDTH * 2 + 2, 0.3, 0.3]} />
        <meshStandardMaterial color="#3d465c" metalness={0.5} />
      </mesh>
      <mesh position={[0, 6, 0.02]}>
        <boxGeometry args={[ROAD_HALF_WIDTH * 1.2, 1.9, 0.16]} />
        <meshStandardMaterial map={tex} emissive="#ffffff" emissiveIntensity={0.18} />
      </mesh>
    </group>
  );
}
