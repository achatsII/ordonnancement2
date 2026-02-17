import { FactoryConfig } from '@/types/factory';
import { Cpu, Users, Wrench } from 'lucide-react';

export default function FactoryAssetList({ config, onEditMachine, onEditOperator }: {
    config: FactoryConfig;
    onEditMachine?: (machine: any) => void;
    onEditOperator?: (operator: any) => void;
}) {
    const { machines, operators } = config;

    return (
        <div className="mt-4 space-y-6">
            {/* Machines Section */}
            {(machines.length > 0) && (
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                        <Cpu size={14} className="text-blue-500" />
                        Machines
                    </h4>
                    <div className="space-y-2">
                        {machines.map((machine, idx) => (
                            <div
                                key={idx}
                                onClick={() => onEditMachine?.(machine)}
                                className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-start gap-3 cursor-pointer hover:border-blue-300 transition-all"
                            >
                                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                    <Cpu size={16} />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-700 text-sm">{machine.name}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {machine.capabilities.map((cap, i) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded">
                                                {cap}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Operators Section */}
            {(operators.length > 0) && (
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                        <Users size={14} className="text-emerald-500" />
                        Operators
                    </h4>
                    <div className="space-y-2">
                        {operators.map((op, idx) => (
                            <div
                                key={idx}
                                onClick={() => onEditOperator?.(op)}
                                className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-start gap-3 cursor-pointer hover:border-emerald-300 transition-all"
                            >
                                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                                    <Users size={16} />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-700 text-sm">{op.name}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {op.skills.map((skill, i) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {machines.length === 0 && operators.length === 0 && (
                <div className="text-center mt-10 text-slate-400 text-sm p-4">
                    <p>No assets detected yet.</p>
                    <p className="mt-2 text-xs opacity-70">
                        Try saying: <br /><i>"We have 3 CNC machines and 2 operators."</i>
                    </p>
                </div>
            )}
        </div>
    )
}
