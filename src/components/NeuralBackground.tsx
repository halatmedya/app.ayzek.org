import { useEffect, useRef } from 'react';

interface Node { x:number; y:number; vx:number; vy:number; links:number[]; pulse:number; }

// Config for neural / synaptic animated background (non-interactive)
const CFG = {
  nodes: 110,
  linkDistance: 140,
  speed: 0.18,
  pulseSpeed: 0.008,
  pulseInterval: 2600,
  backgroundFade: 0.20,
};

export function NeuralBackground(){
  const canvasRef = useRef<HTMLCanvasElement|null>(null);
  const nodesRef = useRef<Node[]>([]);
  const lastPulseRef = useRef<number>(0);

  useEffect(()=>{
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    let initialized = false;
    function resize(){
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if(!initialized){
        init();
        initialized = true;
      }
    }

    function init(){
      const w = canvas.width, h = canvas.height;
      nodesRef.current = Array.from({length: CFG.nodes}, ()=> ({
        x: Math.random()*w,
        y: Math.random()*h,
        vx: (Math.random()-0.5)*CFG.speed,
        vy: (Math.random()-0.5)*CFG.speed,
        links: [],
        pulse: Math.random()
      }));
      // build links once (static topology)
      const n = nodesRef.current;
      for (let i=0;i<n.length;i++){
        for (let j=i+1;j<n.length;j++){
          const dx = n[i].x - n[j].x;
          const dy = n[i].y - n[j].y;
          const d = Math.hypot(dx,dy);
          if (d < CFG.linkDistance && n[i].links.length < 8 && n[j].links.length < 8){
            n[i].links.push(j);
            n[j].links.push(i);
          }
        }
      }
    }

    let t = 0;
    function animate(time: number){
      const w = canvas.width, h = canvas.height;
      const n = nodesRef.current;

  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(8,12,28,${CFG.backgroundFade})`;
  ctx.fillRect(0,0,w,h);

      // periodic global pulse trigger
      if (time - lastPulseRef.current > CFG.pulseInterval){
        lastPulseRef.current = time;
        // choose a random node to start a ripple
        if (n.length){
          const start = n[Math.floor(Math.random()*n.length)];
          start.pulse = 0; // restart pulse
        }
      }

      // update + draw links
      ctx.lineWidth = 1;
      for (let i=0;i<n.length;i++){
        const a = n[i];
        a.x += a.vx; a.y += a.vy;
        // bounce
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;

        for (const j of a.links){
          if (j <= i) continue;
          const b = n[j];
          const dx = a.x-b.x; const dy = a.y-b.y; const d = Math.hypot(dx,dy);
          if (d < CFG.linkDistance){
            const strength = 1 - d/CFG.linkDistance;
            const pulseFactor = (Math.sin((a.pulse + t*CFG.pulseSpeed)*Math.PI*2) * 0.5 + 0.5) * 0.4 + 0.2;
            const hue = 190 + strength*90; // cyan -> violet
            ctx.strokeStyle = `hsla(${hue},100%,65%,${strength * pulseFactor})`;
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
          }
        }

        // node glow
        const pulseGlow = (Math.sin((a.pulse + t*CFG.pulseSpeed)*Math.PI*2) * 0.5 + 0.5);
        const radius = 2 + pulseGlow*3;
        const nodeHue = 180 + pulseGlow*100;
        const grad = ctx.createRadialGradient(a.x,a.y,0,a.x,a.y,radius*4);
        grad.addColorStop(0,`hsla(${nodeHue},100%,70%,0.9)`);
        grad.addColorStop(0.6,`hsla(${nodeHue},100%,60%,0.25)`);
        grad.addColorStop(1,'hsla(0,0%,0%,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(a.x,a.y,radius*4,0,Math.PI*2); ctx.fill();

        a.pulse += 0.002; if (a.pulse > 1) a.pulse -= 1;
      }

      t += 1;
      requestAnimationFrame(animate);
    }

    resize();
    animate(0);
    const ro = new ResizeObserver(()=>{
      resize();
    });
    ro.observe(canvas);
    return ()=> { ro.disconnect(); };
  },[]);

  return (
  <div className="absolute inset-0 z-0 pointer-events-none">
  <canvas ref={canvasRef} className="w-full h-full block" style={{display:'block'}} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950/30" />
    </div>
  );
}
