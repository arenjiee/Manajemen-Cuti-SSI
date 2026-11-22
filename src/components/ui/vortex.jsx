"use client";

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { SceneContainer } from "@/components/ui/vortex-utils/scene-container";
import { useShadcnTheme, useResolvedTheme } from "@/components/ui/vortex-utils/use-shadcn-theme";

function seedVortex(count, arms) {
  const positions = new Float32Array(count * 3);
  const radii = new Float32Array(count);
  const radius = 6;
  for (let i = 0; i < count; i++) {
    const r = Math.pow(Math.random(), 0.6) * radius;
    const arm = i % arms;
    const branch = (arm / arms) * Math.PI * 2;
    const spin = r * 0.5;
    const scatter = (Math.random() - 0.5) * (0.6 + r * 0.08);
    const angle = branch + spin;
    positions[i * 3] = Math.cos(angle) * r + scatter;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 0.6;
    positions[i * 3 + 2] = Math.sin(angle) * r + scatter;
    radii[i] = r / radius;
  }
  return { positions, radii };
}

function Spiral({ count, speed, arms, theme, opacity }) {
  const pointsRef = React.useRef(null);
  const { primaryColor, mutedColor } = useShadcnTheme(theme);
  const mode = useResolvedTheme(theme);
  const isDark = mode === "dark";

  const { positions, radii } = React.useMemo(
    () => seedVortex(count, arms),
    [count, arms],
  );

  const colors = React.useMemo(() => {
    const arr = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      c.copy(primaryColor).lerp(mutedColor, radii[i]);
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    return arr;
  }, [count, radii, primaryColor, mutedColor]);

  useFrame((_, delta) => {
    if (pointsRef.current) pointsRef.current.rotation.y += delta * 0.12 * speed;
  });

  return (
    <points ref={pointsRef} rotation={[0.5, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={isDark ? 0.05 : 0.065}
        sizeAttenuation
        transparent
        opacity={isDark ? opacity : 0.85}
        depthWrite={false}
        blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </points>
  );
}

/**
 * Galaksi spiral dari titik-titik: lengan berputar keluar, memudar dari
 * `--primary` di inti ke `--muted` di tepi. Mandiri dan mengikuti tema.
 *
 * @param {object} props
 * @param {number} [props.count=2200] Jumlah titik.
 * @param {number} [props.speed=1] Pengali kecepatan rotasi.
 * @param {number} [props.arms=3] Jumlah lengan spiral.
 * @param {number} [props.opacity=0.9] Kepekatan titik.
 * @param {string} [props.className]
 * @param {"light"|"dark"|"auto"} [props.theme="auto"]
 * @param {"night"|"dawn"|"auto"} [props.environment="auto"]
 */
export function Vortex({
  count = 2200,
  speed = 1,
  arms = 3,
  opacity = 0.9,
  className,
  theme = "auto",
  environment = "auto",
}) {
  return (
    <SceneContainer
      className={className}
      theme={theme}
      environment={environment}
      camera={[0, 3, 8]}
      fov={45}
    >
      <Spiral
        count={count}
        speed={speed}
        arms={arms}
        theme={theme}
        opacity={opacity}
      />
    </SceneContainer>
  );
}

export default Vortex;
