'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SolvedTaskResult, Operator } from '@/types/factory';
import { Play, CheckCircle, Clock, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductionState } from '@/contexts/ProductionStateContext';

function StationContent() {
    const searchParams = useSearchParams();
    const opId = searchParams.get('op');
    const { state: { activeConfig, activeSchedule, isLoading: contextLoading } } = useProductionState();

    // Find operator from active config
    const operator = activeConfig?.operators.find((o: Operator) => o.id === opId);

    const [tasks, setTasks] = useState<SolvedTaskResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTask, setActiveTask] = useState<string | null>(null);

    useEffect(() => {
        if (!operator || !activeSchedule) {
            setTasks([]);
            setLoading(false);
            return;
        }

        // Filter tasks for this operator from the active schedule
        const myTasks = activeSchedule.tasks?.filter((t: SolvedTaskResult) =>
            t.operatorName === operator.name
        ) || [];

        myTasks.sort((a: SolvedTaskResult, b: SolvedTaskResult) => a.start - b.start);
        setTasks(myTasks);
        setLoading(false);
    }, [operator, activeSchedule]);

    if (!operator) {
        return <div className="text-white">Operator not found.</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Greeting */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white">Hello, <span className="text-blue-400">{operator.name}</span></h2>
                    <p className="text-slate-400 text-lg">You have {tasks.length} tasks scheduled for today.</p>
                </div>
                <div className="bg-slate-800 px-6 py-2 rounded-2xl border border-slate-700 flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-slate-300 font-medium">Shift Active</span>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <Loader2 className="animate-spin text-blue-500" size={48} />
                </div>
            ) : (
                <div className="space-y-6">
                    {activeTask === null && tasks.length > 0 && (
                        <div className="p-6 bg-blue-900/20 border border-blue-500/50 rounded-3xl flex items-center gap-4">
                            <AlertTriangle className="text-blue-400" size={32} />
                            <div>
                                <p className="text-blue-300 font-bold text-lg">Ready to start?</p>
                                <p className="text-blue-400/80">Select the top task to begin production.</p>
                            </div>
                        </div>
                    )}

                    {tasks.map((task, idx) => {
                        const isNext = idx === 0 && !activeTask;
                        const isActive = activeTask === task.id;
                        const isFuture = !isActive && !isNext;

                        return (
                            <div
                                key={task.id}
                                className={cn(
                                    "relative rounded-3xl overflow-hidden transition-all duration-300",
                                    isActive ? "bg-blue-600 border-4 border-blue-400 shadow-2xl scale-[1.02]" : "bg-slate-800 border border-slate-700 hover:border-slate-600"
                                )}
                            >
                                <div className="p-8 flex items-center gap-8">
                                    {/* Time/Status Indicator */}
                                    <div className="w-24 shrink-0 text-center">
                                        {isActive ? (
                                            <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                                                <Clock className="text-white" size={32} />
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-2xl font-bold text-white">{Math.floor(task.start / 60)}h{task.start % 60 ? `:${task.start % 60}` : ''}</p>
                                                <div className="bg-slate-700 h-1 w-full rounded-full mt-2 mx-auto"></div>
                                                <p className="text-sm text-slate-400 mt-1">{task.duration}m</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="px-3 py-1 bg-slate-900/50 rounded-lg text-xs font-mono text-slate-300 border border-white/10">
                                                {task.jobName}
                                            </span>
                                            <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold text-white uppercase tracking-wider">
                                                {task.line}
                                            </span>
                                        </div>
                                        <h3 className={cn("text-3xl font-bold truncate", isActive ? "text-white" : "text-slate-200")}>
                                            {task.name}
                                        </h3>
                                    </div>

                                    {/* Action Button */}
                                    <div className="shrink-0">
                                        {isActive ? (
                                            <button
                                                onClick={() => setActiveTask(null)}
                                                className="h-20 w-48 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-xl shadow-lg flex items-center justify-center gap-3 transition-colors"
                                            >
                                                <CheckCircle size={28} />
                                                Done
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setActiveTask(task.id)}
                                                className={cn(
                                                    "h-20 w-48 rounded-2xl font-bold text-xl shadow-lg flex items-center justify-center gap-3 transition-colors",
                                                    isNext ? "bg-blue-500 hover:bg-blue-400 text-white" : "bg-slate-700 text-slate-400 cursor-not-allowed"
                                                )}
                                                disabled={!isNext}
                                            >
                                                <Play size={28} />
                                                Start
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {isActive && (
                                    <div className="bg-black/20 p-4 px-8 flex justify-between items-center text-blue-100 text-sm font-medium">
                                        <span>Instructions: Ensure safety guard is active. Check coolant levels.</span>
                                        <span>Started at 08:00 AM</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function OperatorStationPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <StationContent />
        </Suspense>
    )
}
