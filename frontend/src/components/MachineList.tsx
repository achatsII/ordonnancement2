import { Machine } from '@/types/factory';
import { Cpu } from 'lucide-react';

export default function MachineList({ machines }: { machines: Machine[] }) {
    if (machines.length === 0) return null;

    return (
        <div className="mt-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Detected Assets
            </h4>
            <div className="space-y-3">
                {machines.map((machine, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 hover:border-blue-200 transition-colors">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                            <Cpu size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-800 truncate">{machine.name}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5 ">
                                {machine.capabilities.map((cap, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wide rounded-md">
                                        {cap}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
