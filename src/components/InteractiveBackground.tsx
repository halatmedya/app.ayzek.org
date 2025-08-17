import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Particle { x:number; y:number; vx:number; vy:number; r:number; hue:number; }

const CONFIG = {
  maxParticlesBase: 200,
  trails: true,
  hueCycleSpeed: 0.05,
  waveRings: 3,
};

export function InteractiveBackground(){
  const canvasRef = useRef<HTMLCanvasElement|null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouse = useRef({x:0,y:0});

  useEffect(()=>{
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let frame:number;

    function resize(){
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      spawnParticles();
    }
    function spawnParticles(){
      const count = Math.min(CONFIG.maxParticlesBase, Math.floor((canvas.width * canvas.height)/14000));
      particlesRef.current = Array.from({length:count}, ()=> ({
        x: Math.random()*canvas.width,
        y: Math.random()*canvas.height,
        vx: (Math.random()-0.5)*0.3,
        vy: (Math.random()-0.5)*0.3,
        r: 1 + Math.random()*2,
        hue: Math.random()*360
      }));
    }
    let t = 0;
    let globalHue = 190; // start cyan-ish
  function draw(){
      const ps = particlesRef.current;
      if (!CONFIG.trails){
        ctx.clearRect(0,0,canvas.width, canvas.height);
      } else {
        // translucent overlay for trails
        ctx.fillStyle = 'rgba(10,15,30,0.18)';
        ctx.fillRect(0,0,canvas.width, canvas.height);
      }
      // subtle gradient background overlay
  const grad = ctx.createLinearGradient(0,0,canvas.width, canvas.height);
  grad.addColorStop(0,'rgba(8,17,34,0.85)');
  grad.addColorStop(0.5,'rgba(12,25,50,0.75)');
  grad.addColorStop(1,'rgba(6,12,28,0.92)');
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = grad; ctx.fillRect(0,0,canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-over';

      // connect lines near mouse
      for (let i=0;i<ps.length;i++){
        const p = ps[i];
        // attraction to mouse
        const dx = mouse.current.x - p.x;
        const dy = mouse.current.y - p.y;
        const dist = Math.hypot(dx,dy);
        const influence = dist < 160 ? (1 - dist/160) : 0;
        p.vx += (dx/dist || 0)*influence*0.02;
        p.vy += (dy/dist || 0)*influence*0.02;

        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.98; p.vy *= 0.98;

        // subtle drift with sine field
        p.x += Math.sin((p.y + t*0.05)*0.01)*0.15;
        p.y += Math.cos((p.x + t*0.05)*0.01)*0.15;

        // hue evolve
        p.hue = (p.hue + CONFIG.hueCycleSpeed) % 360;

        // wrap
        if (p.x < -50) p.x = canvas.width+50;
        if (p.x > canvas.width+50) p.x = -50;
        if (p.y < -50) p.y = canvas.height+50;
        if (p.y > canvas.height+50) p.y = -50;
      }

  // animated spotlight
      const spotR = 220 + Math.sin(t*0.002)*40;
  const spot = ctx.createRadialGradient(mouse.current.x, mouse.current.y, 0, mouse.current.x, mouse.current.y, spotR);
  spot.addColorStop(0,'rgba(56,189,248,0.35)');
  spot.addColorStop(0.5,'rgba(56,189,248,0.07)');
  spot.addColorStop(1,'rgba(56,189,248,0)');
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = spot; ctx.beginPath(); ctx.arc(mouse.current.x, mouse.current.y, spotR, 0, Math.PI*2); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

      // expanding wave rings from mouse periodically
      for (let w=0; w<CONFIG.waveRings; w++){
        const progress = ((t/1000) + w/CONFIG.waveRings) % 1; // 0..1
        const radius = progress * 420;
        const alpha = 1 - progress;
        ctx.strokeStyle = `hsla(${(globalHue+40)%360},80%,60%,${alpha*0.15})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(mouse.current.x, mouse.current.y, radius, 0, Math.PI*2); ctx.stroke();
      }

  // draw connections
      ctx.lineWidth = 0.7;
  for (let i=0;i<ps.length;i++){
        for (let j=i+1;j<ps.length;j++){
          const a = ps[i]; const b = ps[j];
          const dx = a.x-b.x; const dy=a.y-b.y; const d = Math.hypot(dx,dy);
            if (d<110){
              const alpha = 1 - d/110;
      ctx.strokeStyle = `hsla(${(a.hue+globalHue)%360},100%,65%,${alpha*0.2})`;
              ctx.beginPath();
              ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
            }
        }
      }

      // particles
      for (const p of ps){
        const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*7);
        const colorHue = (p.hue + globalHue) % 360;
        g.addColorStop(0,`hsla(${colorHue},100%,70%,0.9)`);
        g.addColorStop(0.5,`hsla(${colorHue},100%,55%,0.25)`);
        g.addColorStop(1,'hsla(0,0%,0%,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r*7,0,Math.PI*2); ctx.fill();
      }

  t += 16.6;
  globalHue = (globalHue + 0.04) % 360;
  frame = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
    const move = (e:MouseEvent)=> { mouse.current.x = e.clientX; mouse.current.y = e.clientY; };
    window.addEventListener('mousemove', move);
    return ()=> { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); window.removeEventListener('mousemove', move); };
  },[]);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute inset-0 mix-blend-overlay opacity-30 bg-noise" />
      <motion.div
        className="absolute inset-0"
        initial={{opacity:0}}
        animate={{opacity:1}}
        transition={{duration:1.2}}
      />
    </div>
  );
}
