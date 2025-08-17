import { motion } from 'framer-motion';
import { useProgressStore } from '../store/progress';

const SIZE = 420; // enlarged from 300 for better visual impact
const STROKE = 22; // thicker stroke to match larger size

type ProgressKeys = 'daily' | 'monthly' | 'weekly'; // weekly retained in type for store shape but hidden visually
interface RingDef {
  key: ProgressKeys;
  color: string;
  gradient: string;
  label: string;
  index: number;
}

const ringDefs: RingDef[] = [
  {key:'monthly', color:'#6366f1', gradient:'from-indigo-400 via-fuchsia-400 to-pink-400', label:'Aylık', index:0},
  {key:'daily', color:'#10b981', gradient:'from-emerald-400 via-teal-400 to-cyan-400', label:'Günlük', index:1},
];

export function Rings(){
  const { progress } = useProgressStore();

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative" style={{width: SIZE, height: SIZE}}>
  <svg width={SIZE} height={SIZE}>
          {ringDefs.map((r,i)=>{
            const radius = (SIZE/2) - (i* (STROKE + 12)) - STROKE - 8;
            const circumference = 2 * Math.PI * radius;
            const value = progress[r.key as ProgressKeys];
            // Start at 12 o'clock and fill clockwise: default SVG circle starts at 3 o'clock, so we use strokeDashoffset plus a transform rotation.
            const offset = circumference - (value/100) * circumference;
            return (
              <g key={r.key as string}>
                <circle cx={SIZE/2} cy={SIZE/2} r={radius} stroke="#1e293b" strokeWidth={STROKE} fill="none" strokeLinecap="round" transform={`rotate(-90 ${SIZE/2} ${SIZE/2})`} />
                <motion.circle
                  cx={SIZE/2}
                  cy={SIZE/2}
                  r={radius}
                  stroke={r.color}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  initial={{strokeDashoffset: circumference}}
                  animate={{strokeDashoffset: offset}}
                  transition={{duration:1.4, ease:'easeInOut'}}
                  fill="none"
                  className="filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                  transform={`rotate(-90 ${SIZE/2} ${SIZE/2})`}
                />
              </g>
            );
          })}
        </svg>
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 select-none">
          <div className="text-6xl font-extrabold bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(16,185,129,0.25)]">%{progress.daily}</div>
          <div className="text-sm uppercase tracking-widest text-slate-400">Günlük</div>
        </div>
      </div>
  <div className="mt-10 grid grid-cols-2 gap-5 text-center">
        {ringDefs.slice().reverse().map(r=> (
          <div key={r.key as string} className={`group relative px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800/40 ring-1 ring-inset ring-slate-700/40`}> 
            <span className={`bg-gradient-to-r ${r.gradient} bg-clip-text text-transparent`}>{r.label}</span>
            <span className="block mt-1 text-slate-300 font-normal">%{progress[r.key as ProgressKeys]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
