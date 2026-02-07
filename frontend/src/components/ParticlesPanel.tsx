import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function ParticlesPanel() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options = useMemo(
    () => ({
      fullScreen: false,
      background: {
        color: "transparent",
      },
      particles: {
        number: { value: 120 },
        color: { value: "#d8ff28" },
        links: {
          enable: true,
          color: "#d3d3d3",
          opacity: 0.6,
          distance: 140,
        },
        move: {
          enable: true,
          speed: 0.6,
        },
        size: {
          value: 2.0,
        },
        opacity: {
          value: 0.35,
        },
      },
      interactivity: {
        events: {
          onClick: {
            enable: true,
            mode: "push",
          },
        },
        modes: {
          push: {
            quantity: 4,
          },
        },
      },
    }),
    []
  );

  if (!init) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "auto",
      }}
    >
      <Particles style={{ width: "100%", height: "100%" }} options={options} />
    </div>
  );
}