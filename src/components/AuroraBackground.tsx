import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Softer, low-contrast animated aurora style background (no harsh lines)
export function AuroraBackground(){
  const canvasRef = useRef<HTMLCanvasElement|null>(null);
  const blobsRef = useRef<BlobShape[]>([]);

  useEffect(()=>{
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    function resize(){
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // init blobs
    blobsRef.current = Array.from({length:6}, (_,i)=> createBlob(i));

    let frame: number; let t=0;
    function draw(){
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0,0,w,h);

      // gradient wash base
      const base = ctx.createLinearGradient(0,0,w,h);
      base.addColorStop(0,'#050b16');
      base.addColorStop(1,'#0b1324');
      ctx.fillStyle = base; ctx.fillRect(0,0,w,h);

      ctx.globalCompositeOperation = 'lighter';
      for(const blob of blobsRef.current){
        blob.x += Math.sin((t+blob.offset)*0.001 + blob.speed)*0.25;
        blob.y += Math.cos((t+blob.offset)*0.001 + blob.speed)*0.25;
        blob.phase += blob.speed*0.008;

        const r = blob.baseR + Math.sin(blob.phase)*blob.varR;
        const g = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, r);
        g.addColorStop(0, `hsla(${blob.hue}, 80%, 65%, 0.18)`);
        g.addColorStop(0.55, `hsla(${blob.hue+20}, 70%, 55%, 0.08)`);
        g.addColorStop(1, 'hsla(0,0%,0%,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(blob.x, blob.y, r, 0, Math.PI*2); ctx.fill();
        // slow hue shift
        blob.hue = (blob.hue + blob.hueShift) % 360;
      }
      ctx.globalCompositeOperation = 'source-over';

      t += 16.6;
      frame = requestAnimationFrame(draw);
    }
    draw();

    return ()=> { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); };
  },[]);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      <motion.div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(255,255,255,0.04),transparent_60%)]" initial={{opacity:0}} animate={{opacity:1}} transition={{duration:2}} />
      <div className="absolute inset-0 backdrop-blur-[2px]" />
    </div>
  );
}

interface BlobShape { x:number; y:number; baseR:number; varR:number; phase:number; hue:number; hueShift:number; offset:number; speed:number; }
function createBlob(i:number): BlobShape {
  const w = window.innerWidth; const h = window.innerHeight;
  return {
    x: Math.random()*w,
    y: Math.random()*h,
    baseR: 300 + Math.random()*200,
    varR: 60 + Math.random()*80,
    phase: Math.random()*Math.PI*2,
    hue: 180 + i*25 + Math.random()*20,
    hueShift: (Math.random()*0.15)+0.05,
    offset: Math.random()*5000,
    speed: 0.5 + Math.random()*0.5,
  };
}
