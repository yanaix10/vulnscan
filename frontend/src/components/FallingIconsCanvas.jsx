import React, { useEffect, useRef } from "react";

const GLYPHS = [
  "🛡️", "⚠️", "🔒", "☠️", "⚡", "🔑", "🌐", "🔍", 
  "SQL'", "<xss>", "CVE", "403", "ROOT", "0xEF", "{...}", "/>", "CSRF", "SSRF"
];

export function FallingIconsCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Create particles
    const particleCount = Math.floor(width / 35);
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.6 + Math.random() * 1.4,
        text: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        fontSize: Math.floor(11 + Math.random() * 14),
        opacity: 0.05 + Math.random() * 0.25,
        fadeSpeed: 0.002 + Math.random() * 0.004,
        fadeDir: Math.random() > 0.5 ? 1 : -1,
        color: Math.random() > 0.4 ? "rgba(239, 68, 68, " : "rgba(185, 28, 28, ",
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Dark gradient overlay
      const gradient = ctx.createRadialGradient(
        width / 2, height / 3, 50,
        width / 2, height / 2, Math.max(width, height) * 0.8
      );
      gradient.addColorStop(0, "rgba(153, 27, 27, 0.08)");
      gradient.addColorStop(0.5, "rgba(12, 14, 20, 0.4)");
      gradient.addColorStop(1, "rgba(7, 8, 12, 0.95)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw and update particles
      particles.forEach((p) => {
        // Update opacity
        p.opacity += p.fadeSpeed * p.fadeDir;
        if (p.opacity > 0.3) {
          p.opacity = 0.3;
          p.fadeDir = -1;
        } else if (p.opacity < 0.03) {
          p.opacity = 0.03;
          p.fadeDir = 1;
        }

        // Draw glyph
        ctx.font = `${p.fontSize}px monospace`;
        ctx.fillStyle = `${p.color}${p.opacity})`;
        ctx.fillText(p.text, p.x, p.y);

        // Move down
        p.y += p.speed;
        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
          p.text = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
