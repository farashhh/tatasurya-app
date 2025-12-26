import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, Stars, Line } from "@react-three/drei";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import GalaxyBackground from "../components/GalaxyBackground.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

function Sun() {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.2;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.5, 32, 32]} />
      <meshStandardMaterial emissive={"#ffd166"} emissiveIntensity={1.2} color={"#ff9f1c"} />
    </mesh>
  );
}

function OrbitRing({ radius }) {
  const points = useMemo(() => {
    const pts = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(t) * radius, 0, Math.sin(t) * radius));
    }
    return pts;
  }, [radius]);

  return <Line points={points} color="white" transparent opacity={0.15} lineWidth={1} />;
}

function Planet({ planet, orbitRadius, size, speed, onSelect }) {
  const group = useRef();
  const angle = useRef(Math.random() * Math.PI * 2);
  const spin = useRef((Math.random() * 0.6 + 0.2) * (planet.order % 2 === 0 ? 1 : -1));

  useFrame((_, delta) => {
    angle.current += delta * speed;
    const x = Math.cos(angle.current) * orbitRadius;
    const z = Math.sin(angle.current) * orbitRadius;
    if (group.current) {
      group.current.position.set(x, 0, z);
      group.current.rotation.y += delta * spin.current;
    }
  });

  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation();
        if (!group.current) return;
        const p = group.current.position;
        onSelect(planet, [p.x, p.y, p.z]);
      }}
    >
      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={planet.color || "#888"}
          emissive={planet.color || "#888"}
          emissiveIntensity={0.15}
          roughness={0.65}
          metalness={0.1}
        />
      </mesh>

      <Html distanceFactor={10}>
        <div className="pointer-events-none select-none text-xs font-bold text-white/80 bg-black/30 border border-white/10 rounded-full px-2 py-1 backdrop-blur">
          {planet.name}
        </div>
      </Html>
    </group>
  );
}

function CameraFocus({ focus }) {
  const { camera } = useThree();
  useFrame((_, delta) => {
    // Smoothly move camera a bit toward focus (if any)
    if (!focus) return;
    const target = new THREE.Vector3(focus[0] + 6, 4, focus[2] + 6);
    camera.position.lerp(target, 1 - Math.exp(-delta * 2.5));
    camera.lookAt(focus[0], 0, focus[2]);
  });
  return null;
}

function Scene({ planets, onSelect, focus }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 0, 0]} intensity={2.2} distance={60} />
      <Stars radius={80} depth={50} count={1500} factor={4} saturation={0} fade speed={1} />
      <Sun />

      {planets.map((p) => {
        const orbitRadius = 2 + Math.log(p.distanceAU + 1) * 5;
        const size = 0.25 + Math.log(p.radius + 1) * 0.65;
        const speed = 0.55 / Math.pow(orbitRadius, 0.75);

        return (
          <group key={p.id}>
            <OrbitRing radius={orbitRadius} />
            <Planet
              planet={p}
              orbitRadius={orbitRadius}
              size={size}
              speed={speed}
              onSelect={onSelect}
            />
          </group>
        );
      })}

      <OrbitControls enablePan enableZoom enableRotate />

      <CameraFocus focus={focus} />
    </>
  );
}

export default function Explore3D() {
  const navigate = useNavigate();
  const [planets, setPlanets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null);
  const [focus, setFocus] = useState(null);

  const [toast, setToast] = useState("");

  useEffect(() => {
    api.get("/planets")
      .then((res) => setPlanets(res.data.planets || []))
      .finally(() => setLoading(false));
  }, []);

  function onSelect(planet, pos) {
    setSelected(planet);
    setFocus(pos);
  }

  async function markVisited() {
    if (!selected) return;
    try {
      await api.post("/progress/visit", { planetId: selected.id });
      setToast(`✅ ${selected.name} ditandai sebagai dikunjungi (+5 poin)`);
      setTimeout(() => setToast(""), 2500);
    } catch (e) {
      setToast(e?.response?.data?.error || "Gagal menyimpan progres");
      setTimeout(() => setToast(""), 2500);
    }
  }

  return (
    <GalaxyBackground>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex items-start gap-6">
          <div className="flex-1 glass rounded-3xl overflow-hidden border border-white/10">
            <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
              <div className="font-black">Eksplorasi 3D</div>
              <div className="badge">Orbit Dinamis</div>
              <div className="badge">Efek Cahaya</div>
              <div className="flex-1" />
              <button
                className="btn-secondary"
                onClick={() => {
                  setSelected(null);
                  setFocus(null);
                }}
              >
                Reset Fokus
              </button>
            </div>

            <div className="h-[70vh]">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <LoadingSpinner label="Memuat planet..." />
                </div>
              ) : (
                <Canvas camera={{ position: [10, 7, 12], fov: 55 }} onPointerMissed={() => setSelected(null)}>
                  <Scene planets={planets} onSelect={onSelect} focus={focus} />
                </Canvas>
              )}
            </div>
          </div>

          <div className="w-full lg:w-[360px] space-y-4">
            <div className="glass rounded-3xl p-5 border border-white/10">
              <div className="font-black text-lg">Panel Planet</div>
              <div className="text-white/60 text-sm mt-1">
                Klik salah satu planet pada scene 3D untuk melihat detail singkat.
              </div>

              {selected ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7), ${selected.color || "#888"} 55%, rgba(0,0,0,0.7))`,
                      }}
                    />
                    <div className="min-w-0">
                      <div className="font-bold">{selected.name}</div>
                      <div className="text-xs text-white/60 truncate">{selected.summary}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass rounded-2xl p-3">
                      <div className="text-xs text-white/60">Urutan</div>
                      <div className="font-black">{selected.order}</div>
                    </div>
                    <div className="glass rounded-2xl p-3">
                      <div className="text-xs text-white/60">Jarak (AU)</div>
                      <div className="font-black">{selected.distanceAU}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button className="btn-primary" onClick={() => navigate(`/knowledge/${selected.id}`)}>
                      📚 Pelajari
                    </button>
                    <button className="btn-secondary" onClick={() => navigate(`/quiz/${selected.id}`)}>
                      🧠 Kuis
                    </button>
                    <button className="btn-secondary" onClick={markVisited}>
                      ✅ Kunjungi
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-white/60 text-sm">
                  Belum ada planet terpilih.
                </div>
              )}
            </div>

            <div className="glass rounded-3xl p-5 border border-white/10">
              <div className="font-black text-lg">Petunjuk</div>
              <ul className="mt-2 text-sm text-white/70 space-y-2 list-disc pl-5">
                <li>Scroll untuk zoom, drag untuk rotasi kamera.</li>
                <li>Tekan <b>Reset Fokus</b> untuk kembali ke pandangan awal.</li>
                <li>Tombol <b>Kunjungi</b> akan menyimpan progres planet yang sudah dieksplor.</li>
              </ul>
            </div>

            {toast && (
              <div className="glass rounded-2xl p-4 border border-white/10">
                <div className="text-sm">{toast}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </GalaxyBackground>
  );
}
