import { useState, useEffect, useRef, useCallback } from 'react';
import { useAstra } from '../hooks/useAstra.jsx';
import { api } from '../services/api';
import { PageHeader } from '../components/PageHeader';
import { MetricCard, StatusBadge } from '../components/MetricCard';

const METRICS = [
  { key: 'heart_rate', label: 'Heart Rate', unit: 'BPM', color: '#38A6E8', range: [50, 100] },
  { key: 'hrv', label: 'HRV', unit: 'ms', color: '#8B7CF6', range: [15, 80] },
  { key: 'blood_oxygen', label: 'SpO2', unit: '%SpO2', color: '#34D399', range: [90, 100] },
  { key: 'body_temp', label: 'Temperature', unit: '°C', color: '#FBBF24', range: [35.5, 38.5] },
  { key: 'sleep_duration', label: 'Sleep', unit: 'hrs', color: '#A99CFF', range: [2, 12] },
  { key: 'activity_level', label: 'Activity', unit: 'idx', color: '#F87171', range: [0, 12] },
  { key: 'exercise_recovery', label: 'Recovery', unit: 'min', color: '#5CC8FF', range: [5, 90] },
];

function DigitalTwinScene({ astronautStatus, metrics }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    import('three').then(({ Scene, PerspectiveCamera, WebGLRenderer, OrthographicCamera,
      BoxGeometry, SphereGeometry, CylinderGeometry, MeshStandardMaterial, Mesh,
      AmbientLight, DirectionalLight, PointLight, Color, Vector3, Group }) => {

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      const scene = new Scene();
      scene.background = new Color('#071426');
      sceneRef.current = scene;

      // Camera
      const camera = new PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0, 1.2, 4.5);
      camera.lookAt(0, 0.8, 0);

      // Renderer
      const renderer = new WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = 1;
      renderer.toneMapping = 1;
      renderer.toneMappingExposure = 1.2;
      mountRef.current.appendChild(renderer.domElement);

      // Lights
      const ambient = new AmbientLight(0x38A6E8, 0.4);
      scene.add(ambient);

      const keyLight = new DirectionalLight(0x5CC8FF, 1.5);
      keyLight.position.set(2, 4, 3);
      keyLight.castShadow = true;
      scene.add(keyLight);

      const fillLight = new DirectionalLight(0x8B7CF6, 0.6);
      fillLight.position.set(-2, 1, 2);
      scene.add(fillLight);

      const rimLight = new DirectionalLight(0xA99CFF, 0.8);
      rimLight.position.set(-1, 2, -4);
      scene.add(rimLight);

      const pointLight = new PointLight(0x38A6E8, 0.5, 10);
      pointLight.position.set(0, 2.5, 0);
      scene.add(pointLight);

      // Environment glow (particle field)
      const starGeo = new SphereGeometry(0.03, 4, 4);
      const starMat = new MeshStandardMaterial({ color: 0x5CC8FF, emissive: 0x38A6E8, emissiveIntensity: 2 });
      const stars = new Group();
      for (let i = 0; i < 80; i++) {
        const star = new Mesh(starGeo, starMat);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 3 + Math.random() * 4;
        star.position.set(
          r * Math.sin(phi) * Math.cos(theta),
          (Math.random() - 0.5) * 5,
          r * Math.sin(phi) * Math.sin(theta)
        );
        star.material = starMat.clone();
        star.material.color.setHSL(0.55 + Math.random() * 0.15, 0.8, 0.6);
        star.material.emissive.setHSL(0.55 + Math.random() * 0.15, 0.8, 0.3);
        stars.add(star);
      }
      scene.add(stars);

      // Ground plane (subtle)
      const groundGeo = new BoxGeometry(6, 0.02, 6);
      const groundMat = new MeshStandardMaterial({
        color: 0x0d1f3d, transparent: true, opacity: 0.6,
        emissive: 0x38A6E8, emissiveIntensity: 0.05,
      });
      const ground = new Mesh(groundGeo, groundMat);
      ground.position.y = -0.55;
      ground.receiveShadow = true;
      scene.add(ground);

      // Astronaut model group
      const astronaut = new Group();

      // Torso
      const torsoGeo = new CylinderGeometry(0.5, 0.4, 1.0, 12);
      const torsoMat = new MeshStandardMaterial({
        color: 0x1a2a4a,
        emissive: 0x38A6E8,
        emissiveIntensity: 0.08,
        roughness: 0.4,
        metalness: 0.6,
      });
      const torso = new Mesh(torsoGeo, torsoMat);
      torso.position.y = 0.0;
      torso.castShadow = true;
      astronaut.add(torso);

      // Chest core (glowing)
      const coreGeo = new SphereGeometry(0.18, 16, 16);
      const coreMat = new MeshStandardMaterial({
        color: 0x38A6E8,
        emissive: 0x38A6E8,
        emissiveIntensity: 2,
        roughness: 0.2,
        metalness: 0.1,
      });
      const core = new Mesh(coreGeo, coreMat);
      core.position.set(0, 0.1, 0.45);
      astronaut.add(core);

      // Head
      const headGeo = new SphereGeometry(0.22, 16, 16);
      const headMat = new MeshStandardMaterial({
        color: 0x2a3a5a,
        emissive: 0x38A6E8,
        emissiveIntensity: 0.05,
        roughness: 0.3,
        metalness: 0.5,
      });
      const head = new Mesh(headGeo, headMat);
      head.position.y = 0.75;
      head.castShadow = true;
      astronaut.add(head);

      // Helmet visor
      const visorGeo = new SphereGeometry(0.18, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const visorMat = new MeshStandardMaterial({
        color: 0x071426,
        emissive: 0x5CC8FF,
        emissiveIntensity: 0.8,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.85,
      });
      const visor = new Mesh(visorGeo, visorMat);
      visor.position.set(0, 0.75, 0.2);
      visor.rotation.x = 0.2;
      astronaut.add(visor);

      // Helmet ring
      const ringGeo = new CylinderGeometry(0.23, 0.23, 0.03, 24);
      const ringMat = new MeshStandardMaterial({
        color: 0x8B7CF6,
        emissive: 0x8B7CF6,
        emissiveIntensity: 0.3,
        roughness: 0.3,
        metalness: 0.7,
      });
      const ring = new Mesh(ringGeo, ringMat);
      ring.position.y = 0.65;
      astronaut.add(ring);

      // Left arm
      const armGeo = new CylinderGeometry(0.08, 0.07, 0.6, 8);
      const armMat = torsoMat.clone();
      const leftArm = new Mesh(armGeo, armMat);
      leftArm.position.set(-0.5, 0.25, 0);
      leftArm.rotation.z = 0.3;
      leftArm.rotation.x = -0.2;
      leftArm.castShadow = true;
      astronaut.add(leftArm);

      // Right arm
      const rightArm = new Mesh(armGeo, armMat);
      rightArm.position.set(0.5, 0.25, 0);
      rightArm.rotation.z = -0.3;
      rightArm.rotation.x = 0.2;
      rightArm.castShadow = true;
      astronaut.add(rightArm);

      // Left leg
      const legGeo = new CylinderGeometry(0.1, 0.08, 0.5, 8);
      const legMat = new MeshStandardMaterial({
        color: 0x1a2a4a,
        roughness: 0.5,
        metalness: 0.4,
      });
      const leftLeg = new Mesh(legGeo, legMat);
      leftLeg.position.set(-0.18, -0.55, 0);
      leftLeg.castShadow = true;
      astronaut.add(leftLeg);

      // Right leg
      const rightLeg = new Mesh(legGeo, legMat);
      rightLeg.position.set(0.18, -0.55, 0);
      rightLeg.castShadow = true;
      astronaut.add(rightLeg);

      // Boots
      const bootGeo = new BoxGeometry(0.14, 0.08, 0.2);
      const bootMat = new MeshStandardMaterial({
        color: 0x8B7CF6,
        emissive: 0x8B7CF6,
        emissiveIntensity: 0.1,
        roughness: 0.3,
        metalness: 0.5,
      });
      const leftBoot = new Mesh(bootGeo, bootMat);
      leftBoot.position.set(-0.18, -0.82, 0.03);
      astronaut.add(leftBoot);
      const rightBoot = new Mesh(bootGeo, bootMat);
      rightBoot.position.set(0.18, -0.82, 0.03);
      astronaut.add(rightBoot);

      // Life support backpack
      const packGeo = new BoxGeometry(0.35, 0.3, 0.15);
      const packMat = new MeshStandardMaterial({
        color: 0x2a3a5a,
        roughness: 0.6,
        metalness: 0.3,
      });
      const pack = new Mesh(packGeo, packMat);
      pack.position.set(0, 0.1, -0.45);
      astronaut.add(pack);

      // Pack tubes
      const tubeGeo = new CylinderGeometry(0.02, 0.02, 0.12, 6);
      const tubeMat = new MeshStandardMaterial({
        color: 0x34D399,
        emissive: 0x34D399,
        emissiveIntensity: 0.5,
      });
      for (let i = 0; i < 3; i++) {
        const tube = new Mesh(tubeGeo, tubeMat);
        tube.position.set(-0.08 + i * 0.08, 0.05 + i * 0.05, -0.5);
        astronaut.add(tube);
      }

      scene.add(astronaut);

      // Health bar ring (around torso)
      const ring2Geo = new CylinderGeometry(0.7, 0.7, 0.02, 32, 1, true);
      const ring2Mat = new MeshStandardMaterial({
        color: 0x38A6E8,
        emissive: 0x38A6E8,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.6,
        side: 2,
      });
      const healthRing = new Mesh(ring2Geo, ring2Mat);
      healthRing.position.y = 0.0;
      healthRing.rotation.x = Math.PI / 2;
      healthRing.scale.y = 0.3;
      scene.add(healthRing);

      // Animate
      let time = 0;
      function render() {
        time += 0.016;
        // Gentle float
        astronaut.position.y = Math.sin(time * 0.8) * 0.05;
        astronaut.rotation.y = Math.sin(time * 0.3) * 0.15;
        // Arm sway
        leftArm.rotation.x = -0.2 + Math.sin(time * 1.2) * 0.08;
        rightArm.rotation.x = 0.2 + Math.sin(time * 1.2 + Math.PI) * 0.08;
        // Stars drift
        stars.rotation.y = time * 0.02;
        // Core pulse based on heart rate
        if (metrics?.heart_rate) {
          const hr = metrics.heart_rate;
          const pulseSpeed = hr / 60 * 2.5;
          const pulse = Math.sin(time * pulseSpeed) * 0.5 + 0.5;
          coreMat.emissiveIntensity = 1 + pulse * 3;
          core.scale.setScalar(1 + pulse * 0.15);
        }
        // Health ring color based on status
        if (astronautStatus === 'normal') {
          ring2Mat.color.setHex(0x34D399);
          ring2Mat.emissive.setHex(0x34D399);
        } else if (astronautStatus === 'watch') {
          ring2Mat.color.setHex(0xFBBF24);
          ring2Mat.emissive.setHex(0xFBBF24);
        } else if (astronautStatus === 'critical') {
          ring2Mat.color.setHex(0xF87171);
          ring2Mat.emissive.setHex(0xF87171);
          ring2Mat.emissiveIntensity = 1.5 + Math.sin(time * 4) * 0.5;
        }
        renderer.render(scene, camera);
        animRef.current = requestAnimationFrame(render);
      }
      render();

      // Resize
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width: w, height: h } = entry.contentRect;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      });
      resizeObserver.observe(mountRef.current);

      return () => {
        cancelAnimationFrame(animRef.current);
        resizeObserver.disconnect();
        renderer.dispose();
        mountRef.current.innerHTML = '';
      };
    });
  }, []);

  return (
    <div ref={mountRef} className="w-full h-full min-h-[320px] rounded-xl overflow-hidden bg-astra-dark" />
  );
}

export function TwinPage() {
  const { currentAstronaut } = useAstra();
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentAstronaut) return;
    setLoading(true);
    api.getMeasurements(currentAstronaut.id, 1).then(m => {
      setLatest(m[0]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [currentAstronaut]);

  const status = !latest ? 'neutral' : (() => {
    if (latest.heart_rate > 90 || latest.heart_rate < 50) return 'critical';
    if (latest.hrv < 20) return 'critical';
    if (latest.blood_oxygen < 92) return 'critical';
    if (latest.sleep_duration < 4) return 'critical';
    const issues = [
      latest.heart_rate > 80 || latest.heart_rate < 60,
      latest.hrv < 30,
      latest.blood_oxygen < 95,
      latest.sleep_duration < 5.5,
      latest.exercise_recovery > 45,
    ];
    if (issues.filter(Boolean).length >= 2) return 'watch';
    return 'normal';
  })();

  return (
    <div>
      <PageHeader route="twin" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Scene */}
        <div className="lg:col-span-2 space-y-4">
          <div className="astra-card p-0 overflow-hidden" style={{ height: '380px' }}>
            <DigitalTwinScene astronautStatus={status} metrics={latest} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusBadge status={status} />
              <span className="text-sm text-astra-gray">
                Live 3D representation • {latest ? 'data from latest telemetry' : 'awaiting data'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-astra-gray">
              <div className="w-2 h-2 rounded-full bg-astra-cyan animate-pulse" />
              <span>3D viewport active</span>
            </div>
          </div>
        </div>

        {/* Health indicators on twin */}
        <div className="space-y-4">
          <div className="astra-card">
            <div className="flex items-center gap-2 mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B7CF6" strokeWidth="2">
                <circle cx="12" cy="7" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              <div className="astra-metric-label">Digital Twin Health Profile</div>
            </div>
            <div className="space-y-3">
              {METRICS.map(m => {
                const val = latest?.[m.key];
                const pct = val !== null && val !== undefined ? Math.min(100, Math.max(0,
                  ((val - m.range[0]) / (m.range[1] - m.range[0])) * 100)) : 0;
                const barColor = !val ? '#94A3B8' :
                  m.key === 'heart_rate' && val > 90 ? '#F87171' :
                  m.key === 'heart_rate' && val < 50 ? '#F87171' :
                  m.key === 'blood_oxygen' && val < 92 ? '#F87171' :
                  '#34D399';
                return (
                  <div key={m.key}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-astra-gray font-medium">{m.label}</span>
                      <span className="font-mono text-astra-white">
                        {val !== null && val !== undefined ? val : '—'}
                        {m.unit}
                      </span>
                    </div>
                    <div className="h-1.5 bg-astra-dark rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: val !== null && val !== undefined ? `${pct}%` : '0%', background: barColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="astra-card">
            <div className="astra-metric-label mb-3">Twin State</div>
            <div className="text-sm text-astra-gray space-y-1">
              <p>The digital twin updates in real-time from telemetry data.</p>
              <p>Health indicators are visualized on the model: heart core pulses with heart rate, status ring reflects overall condition.</p>
              <p className="text-xs text-astra-gray/50 mt-2">
                {status === 'normal' && 'All systems nominal — twin shows stable baseline configuration.'}
                {status === 'watch' && 'Minor deviations detected — twin highlights areas to monitor.'}
                {status === 'critical' && 'Critical alert active — twin flashes red status indicator.'}
                {!latest && 'No telemetry data yet — twin is in standby mode.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
