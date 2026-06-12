import { useEffect, useRef } from "react";
import type { RecorderService } from "../services/recorderService";

export function AudioVisualizer({ recorder }: { recorder?: RecorderService }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fix blurriness on high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const renderLoop = () => {
      animationRef.current = requestAnimationFrame(renderLoop);
      
      ctx.clearRect(0, 0, width, height);

      if (!recorder || recorder.getState() !== "recording") {
        // Draw a flat breathing line
        const breathe = (Math.sin(Date.now() / 500) + 1) / 2; // 0 to 1
        ctx.fillStyle = `rgba(255, 122, 24, ${0.3 + 0.3 * breathe})`;
        ctx.beginPath();
        ctx.roundRect(0, height / 2 - 2, width, 4, 2);
        ctx.fill();
        return;
      }

      const data = recorder.getFrequencyData();
      if (!data) return;

      const barWidth = 2;
      const gap = 2;
      // How many bars can we fit on ONE side of the middle?
      const sideBars = Math.floor((width / 2) / (barWidth + gap));
      
      // Step to sample from frequency data (we only care about the lower half of frequencies usually)
      const step = Math.max(1, Math.floor((data.length * 0.6) / sideBars));
      
      const middleX = width / 2;

      for (let i = 0; i < sideBars; i++) {
        const dataIndex = i * step;
        const value = data[dataIndex] || 0;
        
        const percent = value / 255;
        // Ease the percentage for smoother visual
        const easedPercent = percent * percent; 
        const barHeight = Math.max(2, easedPercent * height);

        const xOffset = i * (barWidth + gap);
        const yOffset = (height - barHeight) / 2;

        ctx.fillStyle = "rgba(255, 122, 24, 0.9)";
        
        // Draw right side
        ctx.beginPath();
        ctx.roundRect(middleX + xOffset, yOffset, barWidth, barHeight, 1);
        ctx.fill();
        
        // Draw left side (mirrored)
        if (i > 0) { // Avoid drawing middle line twice if gap was 0, but here gap is 2, so it's fine, but still looks cleaner
          ctx.beginPath();
          ctx.roundRect(middleX - xOffset - barWidth, yOffset, barWidth, barHeight, 1);
          ctx.fill();
        }
      }
    };

    renderLoop();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [recorder]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ width: "80px", height: "24px", display: "block" }}
    />
  );
}
