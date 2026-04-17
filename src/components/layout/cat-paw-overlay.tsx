"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const PAW_COLORS = [
  "#fa520f",
  "#ff8db0",
  "#ffa110",
  "#ffd900",
  "#fb6424",
  "#ffb3c6",
];

type Vec = { x: number; y: number };

function subscribeMotionCapability(cb: () => void) {
  const mm1 = window.matchMedia("(pointer: fine)");
  const mm2 = window.matchMedia("(prefers-reduced-motion: reduce)");
  mm1.addEventListener("change", cb);
  mm2.addEventListener("change", cb);
  return () => {
    mm1.removeEventListener("change", cb);
    mm2.removeEventListener("change", cb);
  };
}

function getMotionCapability() {
  return (
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function CatPawOverlay() {
  const pawRef = useRef<SVGSVGElement>(null);
  const clawsRef = useRef<SVGGElement>(null);
  const target = useRef<Vec>({ x: -400, y: -400 });
  const pos = useRef<Vec>({ x: -400, y: -400 });
  const lastMoveAt = useRef<number>(0);
  const lastPos = useRef<Vec>({ x: 0, y: 0 });
  const rotation = useRef<number>(0);
  const swipeUntil = useRef<number>(0);
  const idleSince = useRef<number>(0);
  const [color, setColor] = useState<string>(PAW_COLORS[0]);
  const enabled = useSyncExternalStore(
    subscribeMotionCapability,
    getMotionCapability,
    () => false,
  );

  useEffect(() => {
    if (!enabled) return;

    const pickColor = () =>
      setColor(PAW_COLORS[Math.floor(Math.random() * PAW_COLORS.length)]);

    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      const dt = Math.max(8, now - lastMoveAt.current);
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      const v = Math.hypot(dx, dy) / dt;

      if (v > 1.6 && now - swipeUntil.current > 500) {
        swipeUntil.current = now + 420;
        pickColor();
      }

      target.current.x = e.clientX;
      target.current.y = e.clientY;
      lastPos.current = { x: e.clientX, y: e.clientY };
      lastMoveAt.current = now;
      idleSince.current = now;
    };

    const onLeave = () => {
      target.current.x = -400;
      target.current.y = -400;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    idleSince.current = performance.now();

    let raf = 0;
    const tick = () => {
      const paw = pawRef.current;
      const claws = clawsRef.current;
      if (!paw) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const now = performance.now();
      const damp = 0.13;
      const dx = target.current.x - pos.current.x;
      const dy = target.current.y - pos.current.y;
      pos.current.x += dx * damp;
      pos.current.y += dy * damp;

      if (Math.hypot(dx, dy) > 2) {
        const tgtRot = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        let delta = tgtRot - rotation.current;
        while (delta > 180) delta -= 360;
        while (delta < -180) delta += 360;
        rotation.current += delta * 0.08;
      }

      // Idle pounce: after 2.5s idle near a spot, do playful swipe
      if (
        now - idleSince.current > 2500 &&
        now - swipeUntil.current > 1800 &&
        target.current.x > 0
      ) {
        swipeUntil.current = now + 420;
        pickColor();
        idleSince.current = now;
      }

      const swiping = now < swipeUntil.current;
      const phase = swiping ? 1 - (swipeUntil.current - now) / 420 : 0;
      const pulse = swiping ? Math.sin(phase * Math.PI) : 0;
      const lunge = pulse * 22;
      const scale = 1 + pulse * 0.18;

      const rad = ((rotation.current - 90) * Math.PI) / 180;
      const lx = pos.current.x + Math.cos(rad) * lunge;
      const ly = pos.current.y + Math.sin(rad) * lunge;

      paw.style.transform = `translate3d(${lx - 75}px, ${ly - 75}px, 0) rotate(${rotation.current}deg) scale(${scale})`;

      if (claws) {
        const extend = pulse;
        claws.style.transform = `translateY(${-extend * 8}px) scaleY(${1 + extend * 0.9})`;
        claws.style.opacity = String(0.85 + extend * 0.15);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <svg
        ref={pawRef}
        width="150"
        height="150"
        viewBox="0 0 150 150"
        className="absolute left-0 top-0 will-change-transform"
        style={{
          color,
          transformOrigin: "75px 90px",
          filter: "drop-shadow(0 6px 14px rgba(127, 99, 21, 0.25))",
        }}
      >
        <defs>
          <radialGradient id="pawPad" cx="50%" cy="55%" r="60%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.82" />
          </radialGradient>
          <radialGradient id="pawShine" cx="35%" cy="30%" r="40%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g ref={clawsRef} style={{ transformOrigin: "75px 90px", transformBox: "fill-box" }}>
          <path
            d="M34 56 Q30 46 28 38"
            stroke="#1f1f1f"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M56 34 Q54 22 52 14"
            stroke="#1f1f1f"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M94 34 Q96 22 98 14"
            stroke="#1f1f1f"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M116 56 Q120 46 122 38"
            stroke="#1f1f1f"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        <ellipse cx="75" cy="100" rx="34" ry="28" fill="url(#pawPad)" />
        <ellipse cx="42" cy="68" rx="12.5" ry="14.5" fill="url(#pawPad)" />
        <ellipse cx="62" cy="46" rx="11.5" ry="13.5" fill="url(#pawPad)" />
        <ellipse cx="88" cy="46" rx="11.5" ry="13.5" fill="url(#pawPad)" />
        <ellipse cx="108" cy="68" rx="12.5" ry="14.5" fill="url(#pawPad)" />

        <ellipse cx="65" cy="92" rx="18" ry="12" fill="#1f1f1f" opacity="0.22" />

        <ellipse cx="68" cy="92" rx="10" ry="6" fill="url(#pawShine)" />
        <ellipse cx="38" cy="62" rx="4" ry="5" fill="url(#pawShine)" />
        <ellipse cx="58" cy="40" rx="4" ry="5" fill="url(#pawShine)" />
        <ellipse cx="84" cy="40" rx="4" ry="5" fill="url(#pawShine)" />
        <ellipse cx="104" cy="62" rx="4" ry="5" fill="url(#pawShine)" />

        <g opacity="0.4">
          <path d="M55 100 Q58 108 55 114" stroke="#1f1f1f" strokeWidth="1" fill="none" strokeLinecap="round" />
          <path d="M75 102 Q75 112 75 118" stroke="#1f1f1f" strokeWidth="1" fill="none" strokeLinecap="round" />
          <path d="M95 100 Q92 108 95 114" stroke="#1f1f1f" strokeWidth="1" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

export function GlassOverlay() {
  return (
    <div
      aria-hidden
      className="glass-overlay pointer-events-none fixed inset-0"
      style={{ zIndex: 1 }}
    />
  );
}
