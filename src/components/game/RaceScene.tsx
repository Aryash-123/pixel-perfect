import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CarMesh } from "./CarMesh";
import { Track } from "./Track";
import { Scenery } from "./Scenery";
import { buildRoute, ROAD_HALF_WIDTH, worldPos, type BranchState, type Route } from "@/game/route";
import { CARS, getCar, PAINTS, type CarDef } from "@/game/cars";
import { hudStore } from "@/game/hudStore";
import { mulberry32 } from "./Batch";

export type RaceResult = {
  position: number;
  racers: number;
  time: number;
  won: boolean;
  reason: string;
  reward: number;
};

type Perf = { topSpeed: number; accel: number; handling: number; braking: number };

type PlayerState = {
  s: number;
  lateral: number;
  speed: number;
  ho: number; // heading offset from road tangent
  branchSel: Record<number, BranchState>;
  spin: number;
  steer: number;
  shake: number;
  cp: number;
  collisions: number;
  hitCd: number;
  time: number;
  started: boolean;
  finished: boolean;
};

type Vehicle = {
  s: number;
  lateral: number;
  speed: number;
  target: number;
  dir: 1 | -1;
  type: number;
  lane: number;
};

type Rival = { s: number; lateral: number; speed: number; car: CarDef; paint: string };

const VEHICLES = [
  { name: "car", len: 4.3, w: 1.8, h: 1.4, color: "#4b5a86", speed: 22 },
  { name: "suv", len: 4.9, w: 2.0, h: 1.9, color: "#3c5648", speed: 20 },
  { name: "taxi", len: 4.5, w: 1.85, h: 1.5, color: "#d8b021", speed: 23 },
  { name: "bus", len: 10.5, w: 2.5, h: 3.2, color: "#8c3a3a", speed: 15 },
  { name: "truck", len: 12, w: 2.55, h: 3.6, color: "#3a4a66", speed: 14 },
  { name: "moto", len: 2.1, w: 0.8, h: 1.3, color: "#c9552b", speed: 26 },
];

export function RaceScene({
  raceId,
  carId,
  paintId,
  wheelId,
  perf,
  onFinish,
}: {
  raceId: string;
  carId: string;
  paintId: string;
  wheelId: string;
  perf: Perf;
  onFinish: (r: RaceResult) => void;
}) {
  const route = useMemo(() => buildRoute(raceId), [raceId]);
  const car = getCar(carId);

  const player = useRef<PlayerState>({
    s: 0,
    lateral: 4,
    speed: 0,
    ho: 0,
    branchSel: {},
    spin: 0,
    steer: 0,
    shake: 0,
    cp: 0,
    collisions: 0,
    hitCd: 0,
    time: 0,
    started: false,
    finished: false,
  });

  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // traffic + rivals live in refs so the React tree never re-renders during a race
  const traffic = useRef<Vehicle[]>([]);
  const rivals = useRef<Rival[]>([]);

  useEffect(() => {
    const rand = mulberry32(99 + raceId.length);
    const count = Math.round(26 * route.race.trafficDensity);
    traffic.current = Array.from({ length: count }, (_, i) => {
      const dir: 1 | -1 = i % 3 === 0 ? -1 : 1;
      const lane = Math.floor(rand() * 3);
      const type = Math.floor(rand() * VEHICLES.length);
      return {
        s: 90 + rand() * (route.length - 160),
        lateral: dir * (2.2 + lane * 3.6),
        speed: VEHICLES[type]!.speed,
        target: VEHICLES[type]!.speed * (0.85 + rand() * 0.3),
        dir,
        type,
        lane,
      };
    });
    rivals.current = Array.from({ length: route.race.rivals }, (_, i) => {
      const c = CARS[(i * 3 + 2) % CARS.length]!;
      return {
        s: 6 + i * 6,
        lateral: -6 + ((i * 4) % 14),
        speed: (perf.topSpeed / 3.6) * (0.62 + route.race.difficulty * 0.018 + i * 0.012),
        car: c,
        paint: PAINTS[(i * 3) % PAINTS.length]!.id,
      };
    });
    hudStore.reset();
    hudStore.set({ racers: route.race.rivals + 1, checkpointTotal: route.checkpoints.length });
  }, [raceId, route, perf.topSpeed]);

  return (
    <Canvas
      shadows={false}
      dpr={[1, 1.6]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 62, near: 0.4, far: 900, position: [0, 6, -12] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
      }}
    >
      <color attach="background" args={[route.race.sky.bottom]} />
      <fog attach="fog" args={[route.race.sky.fog, route.race.sky.fogNear, route.race.sky.fogFar]} />
      <hemisphereLight args={[route.race.sky.top, "#0a0f1e", 0.9]} />
      <directionalLight position={[-140, 190, 220]} intensity={0.85} color="#9fc4ff" />
      <ambientLight intensity={0.25} />
      <SkyDome route={route} />

      <Track route={route} />
      <Scenery route={route} />

      <Traffic route={route} traffic={traffic} player={player} />
      <Rivals route={route} rivals={rivals} player={player} />
      <PlayerCar route={route} car={car} paintId={paintId} wheelId={wheelId} player={player} />
      <RaceLoop
        route={route}
        player={player}
        keys={keys}
        perf={perf}
        traffic={traffic}
        rivals={rivals}
        onFinish={onFinish}
      />
    </Canvas>
  );
}

function SkyDome({ route }: { route: Route }) {
  const tex = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 32;
    cv.height = 256;
    const ctx = cv.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, route.race.sky.top);
    g.addColorStop(0.62, route.race.sky.bottom);
    g.addColorStop(1, route.race.sky.fog);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 256);
    for (let i = 0; i < 220; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.6})`;
      ctx.fillRect(Math.random() * 32, Math.random() * 130, 1, 1);
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [route]);
  const ref = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  useFrame(() => {
    if (ref.current) ref.current.position.set(camera.position.x, 0, camera.position.z);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[820, 24, 16]} />
      <meshBasicMaterial map={tex} side={THREE.BackSide} depthWrite={false} fog={false} />
    </mesh>
  );
}

function PlayerCar({
  route,
  car,
  paintId,
  wheelId,
  player,
}: {
  route: Route;
  car: CarDef;
  paintId: string;
  wheelId: string;
  player: React.RefObject<PlayerState>;
}) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const spin = useRef(0);
  const beam = useRef<THREE.SpotLight>(null);

  useFrame((_, delta) => {
    const p = player.current!;
    const g = group.current;
    if (!g) return;
    const w = worldPos(route, p.s, p.lateral, p.branchSel);
    g.position.set(w.x, w.y + 0.02, w.z);
    g.rotation.y = w.heading + p.ho;
    spin.current += (p.speed / 0.36) * delta;
    if (body.current) {
      // arcade body roll / pitch
      body.current.rotation.z = THREE.MathUtils.lerp(body.current.rotation.z, -p.ho * 0.5, 0.12);
      body.current.rotation.x = THREE.MathUtils.lerp(body.current.rotation.x, 0, 0.08);
    }
    if (beam.current) beam.current.target.position.set(w.x + Math.sin(g.rotation.y) * 30, w.y, w.z + Math.cos(g.rotation.y) * 30);
  });

  return (
    <group ref={group}>
      <group ref={body}>
        <CarMesh car={car} paintId={paintId} wheelId={wheelId} spinRef={spin} steer={player.current?.steer ?? 0} />
      </group>
      <pointLight position={[0, 0.5, 2.4]} intensity={18} distance={26} color="#cfe6ff" />
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 5.6]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.32} />
      </mesh>
    </group>
  );
}

function SimpleVehicle({ type }: { type: number }) {
  const v = VEHICLES[type]!;
  return (
    <group>
      <mesh position={[0, v.h / 2, 0]}>
        <boxGeometry args={[v.w, v.h * 0.62, v.len]} />
        <meshStandardMaterial color={v.color} metalness={0.45} roughness={0.5} />
      </mesh>
      <mesh position={[0, v.h * 0.82, -v.len * 0.05]}>
        <boxGeometry args={[v.w * 0.86, v.h * 0.36, v.len * 0.52]} />
        <meshStandardMaterial color="#0b1220" metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0, v.h * 0.34, v.len / 2]}>
        <boxGeometry args={[v.w * 0.8, 0.14, 0.06]} />
        <meshStandardMaterial color="#fff6df" emissive="#fff0cc" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0, v.h * 0.34, -v.len / 2]}>
        <boxGeometry args={[v.w * 0.8, 0.12, 0.06]} />
        <meshStandardMaterial color="#ff4d4d" emissive="#ff2d2d" emissiveIntensity={1.8} />
      </mesh>
      {[-1, 1].map((sd) =>
        [v.len * 0.32, -v.len * 0.32].map((z, i) => (
          <mesh key={`${sd}${i}`} position={[(sd * v.w) / 2, 0.32, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.32, 0.32, 0.22, 10]} />
            <meshStandardMaterial color="#15171b" />
          </mesh>
        )),
      )}
    </group>
  );
}

function Traffic({
  route,
  traffic,
  player,
}: {
  route: Route;
  traffic: React.RefObject<Vehicle[]>;
  player: React.RefObject<PlayerState>;
}) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const list = traffic.current ?? [];

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const cars = traffic.current ?? [];
    const p = player.current!;
    cars.forEach((v, i) => {
      // simple car-following: slow for the vehicle ahead in the same lane
      let gap = Infinity;
      for (const o of cars) {
        if (o === v || o.dir !== v.dir || Math.abs(o.lateral - v.lateral) > 2) continue;
        const d = (o.s - v.s) * v.dir;
        if (d > 0) gap = Math.min(gap, d);
      }
      const desired = gap < 18 ? v.target * 0.45 : v.target;
      v.speed += (desired - v.speed) * Math.min(1, dt * 1.4);
      v.s += v.speed * v.dir * dt;

      // occasional lane change when the neighbouring lane is clear
      if (gap < 22 && Math.random() < dt * 0.4) {
        const nextLane = v.lane === 0 ? 1 : v.lane === 2 ? 1 : Math.random() < 0.5 ? 0 : 2;
        const targetLat = v.dir * (2.2 + nextLane * 3.6);
        const clear = !cars.some((o) => o !== v && o.dir === v.dir && Math.abs(o.lateral - targetLat) < 2 && Math.abs(o.s - v.s) < 16);
        if (clear) v.lane = nextLane;
      }
      const wantLat = v.dir * (2.2 + v.lane * 3.6);
      v.lateral += (wantLat - v.lateral) * Math.min(1, dt * 1.2);

      // recycle far from the player, never in front of them
      if (v.dir === 1 && (v.s < p.s - 140 || v.s > route.length - 8)) {
        v.s = p.s + 210 + Math.random() * 260;
        if (v.s > route.length - 20) v.s = Math.max(20, p.s - 130);
      }
      if (v.dir === -1 && (v.s < p.s - 60 || v.s > route.length)) {
        v.s = p.s + 240 + Math.random() * 260;
      }

      const g = refs.current[i];
      if (!g) return;
      const visible = Math.abs(v.s - p.s) < 340;
      g.visible = visible;
      if (!visible) return;
      const w = worldPos(route, v.s, v.lateral, {});
      g.position.set(w.x, w.y, w.z);
      g.rotation.y = w.heading + (v.dir === -1 ? Math.PI : 0);
    });
  });

  return (
    <group>
      {list.map((v, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <SimpleVehicle type={v.type} />
        </group>
      ))}
    </group>
  );
}

function Rivals({
  route,
  rivals,
  player,
}: {
  route: Route;
  rivals: React.RefObject<Rival[]>;
  player: React.RefObject<PlayerState>;
}) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const list = rivals.current ?? [];

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = player.current!;
    (rivals.current ?? []).forEach((r, i) => {
      if (!p.started) return;
      const wobble = 1 + Math.sin(state.clock.elapsedTime * 0.6 + i) * 0.06;
      r.s = Math.min(route.length, r.s + r.speed * wobble * dt);
      r.lateral = THREE.MathUtils.lerp(r.lateral, Math.sin(state.clock.elapsedTime * 0.3 + i * 2) * 6, dt);
      const g = refs.current[i];
      if (!g) return;
      const visible = Math.abs(r.s - p.s) < 320;
      g.visible = visible;
      if (!visible) return;
      const w = worldPos(route, r.s, r.lateral, {});
      g.position.set(w.x, w.y, w.z);
      g.rotation.y = w.heading;
    });
  });

  return (
    <group>
      {list.map((r, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <CarMesh car={r.car} paintId={r.paint} wheelId="sport" simple />
        </group>
      ))}
    </group>
  );
}

function RaceLoop({
  route,
  player,
  keys,
  perf,
  traffic,
  rivals,
  onFinish,
}: {
  route: Route;
  player: React.RefObject<PlayerState>;
  keys: React.RefObject<Record<string, boolean>>;
  perf: Perf;
  traffic: React.RefObject<Vehicle[]>;
  rivals: React.RefObject<Rival[]>;
  onFinish: (r: RaceResult) => void;
}) {
  const { camera } = useThree();
  const hudTick = useRef(0);
  const camPos = useRef(new THREE.Vector3());
  const startTimer = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = player.current!;
    const k = keys.current ?? {};
    if (p.finished) return;

    startTimer.current += dt;
    if (!p.started && startTimer.current > 3.2) p.started = true;
    if (p.started) p.time += dt;

    const maxSpeed = perf.topSpeed / 3.6;
    const throttle = (k["KeyW"] || k["ArrowUp"]) && p.started;
    const brake = k["KeyS"] || k["ArrowDown"];
    const hand = k["Space"];
    const steerIn = (k["KeyA"] || k["ArrowLeft"] ? -1 : 0) + (k["KeyD"] || k["ArrowRight"] ? 1 : 0);

    if (throttle) p.speed += (6 + perf.accel * 1.5) * (1 - Math.min(1, p.speed / maxSpeed)) * dt * 1.5;
    else p.speed -= 4 * dt;
    if (brake) {
      if (p.speed > 0.4) p.speed -= (9 + perf.braking * 2.2) * dt;
      else p.speed = Math.max(-9, p.speed - 6 * dt);
    }
    if (hand) p.speed -= 12 * dt;
    p.speed = Math.max(-9, Math.min(maxSpeed, p.speed));

    const grip = Math.min(1, Math.abs(p.speed) / 9 + 0.12);
    const steerRate = (0.9 + perf.handling * 0.11) * (hand ? 1.5 : 1);
    if (steerIn !== 0) p.ho += steerIn * steerRate * dt * grip * Math.sign(p.speed || 1);
    p.ho *= Math.exp(-(steerIn === 0 ? 3.2 : 1.1) * dt);
    p.ho = Math.max(-0.6, Math.min(0.6, p.ho));
    p.steer = THREE.MathUtils.lerp(p.steer, steerIn * 0.42, 0.2);

    p.s += p.speed * Math.cos(p.ho) * dt;
    p.lateral += p.speed * Math.sin(p.ho) * dt;

    /* ---- branch decision: which side of the split the player is on */
    let prompt: string | null = null;
    let choiceLabel: string | null = null;
    route.race.branches.forEach((b, i) => {
      if (p.s > b.start - 160 && p.s < b.start) {
        const flySide = b.groundOffset > 0 ? "LEFT" : "RIGHT";
        const grdSide = b.groundOffset > 0 ? "RIGHT" : "LEFT";
        prompt = `${flySide}: ${b.signs[0]} ↑   •   ${grdSide}: ${b.signs[1]} →`;
      }
      if (p.s >= b.start && p.branchSel[i] === undefined) {
        const onGroundSide = p.lateral * Math.sign(b.groundOffset) > 1.5;
        p.branchSel[i] = onGroundSide ? "ground" : "flyover";
      }
      if (p.s > b.start && p.s < b.end) choiceLabel = p.branchSel[i] === "flyover" ? b.signs[0] : b.signs[1];
      if (p.s > b.end && p.branchSel[i] !== undefined) delete p.branchSel[i];
    });

    /* ---- road boundaries */
    let halfWidth = ROAD_HALF_WIDTH - 1.1;
    for (let i = 0; i < route.race.branches.length; i++) {
      const b = route.race.branches[i]!;
      if (p.s > b.start + 8 && p.s < b.end - 8 && p.branchSel[i] === "flyover") halfWidth = ROAD_HALF_WIDTH * 0.75 - 1.1;
    }
    if (Math.abs(p.lateral) > halfWidth) {
      p.lateral = Math.sign(p.lateral) * halfWidth;
      p.ho *= -0.25;
      p.speed *= 0.9;
      p.shake = 0.35;
      p.collisions += dt;
    }

    /* ---- traffic collisions */
    for (const v of traffic.current ?? []) {
      if (Math.abs(v.s - p.s) < 4.6 && Math.abs(v.lateral - p.lateral) < 2.4) {
        const closing = v.dir === -1 ? 0.35 : 0.6;
        p.speed *= closing;
        p.lateral += Math.sign(p.lateral - v.lateral || 1) * 1.4;
        p.shake = 0.6;
        p.collisions += 1;
      }
    }

    /* ---- checkpoints */
    while (p.cp < route.checkpoints.length && p.s >= route.checkpoints[p.cp]!) p.cp++;

    /* ---- camera: chase, follows elevation and flyovers */
    const behind = worldPos(route, Math.max(0, p.s - 9.5), p.lateral * 0.65, p.branchSel);
    const at = worldPos(route, p.s + 8, p.lateral * 0.4, p.branchSel);
    const speedPull = Math.min(1, p.speed / maxSpeed);
    camPos.current.set(behind.x, behind.y + 3.6 - speedPull * 0.5, behind.z);
    camera.position.lerp(camPos.current, Math.min(1, dt * 6));
    if (p.shake > 0) {
      camera.position.x += (Math.random() - 0.5) * p.shake;
      camera.position.y += (Math.random() - 0.5) * p.shake * 0.5;
      p.shake = Math.max(0, p.shake - dt * 1.6);
    }
    camera.lookAt(at.x, at.y + 1.4, at.z);
    camera.rotation.z += -p.ho * 0.12;
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = THREE.MathUtils.lerp(cam.fov, 62 + speedPull * 12, dt * 3);
    cam.updateProjectionMatrix();

    /* ---- standings */
    const rl = rivals.current ?? [];
    const ahead = rl.filter((r) => r.s > p.s).length;
    const position = ahead + 1;

    /* ---- finish */
    if (p.s >= route.length) {
      p.finished = true;
      const won = position === 1;
      onFinish({
        position,
        racers: rl.length + 1,
        time: p.time,
        won,
        reason: won ? "First across the line" : `Overtaken — finished ${position} of ${rl.length + 1}`,
        reward: won ? route.race.reward : Math.round(route.race.reward * (position <= 3 ? 0.45 : 0.15)),
      });
      return;
    }

    hudTick.current += dt;
    if (hudTick.current > 0.1) {
      hudTick.current = 0;
      hudStore.set({
        speed: Math.abs(p.speed) * 3.6,
        s: p.s,
        progress: p.s / route.length,
        position,
        racers: rl.length + 1,
        time: p.time,
        checkpoint: p.cp,
        checkpointTotal: route.checkpoints.length,
        prompt,
        branchChoice: choiceLabel,
        rivalS: rl.map((r) => r.s),
        trafficS: (traffic.current ?? []).map((v) => [v.s, v.lateral] as [number, number]),
        collisions: Math.round(p.collisions),
      });
    }
  });

  return null;
}
