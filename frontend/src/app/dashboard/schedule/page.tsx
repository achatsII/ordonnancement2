'use client';

import { useState, useEffect } from 'react';
import { useProductionState } from '@/contexts/ProductionStateContext';
import { gateway } from '@/services/gateway';
import GanttChart, { GanttTask } from '@/components/GanttChart';
import ZoomControls from '@/components/ZoomControls';
import WhatIfBanner from '@/components/WhatIfBanner';
import WhatIfImpactModal from '@/components/WhatIfImpactModal';
// OrderManager imported removed
import { WhatIfScenario, ImpactAnalysis, WhatIfModification } from '@/types/whatif';
import { ProductionOrder } from '@/types/factory';
import { Loader2, RefreshCw, Play, Wand2, Package, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// Premium Palette
const PREMIUM_COLORS = [
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#6366f1', // indigo-500
    '#d946ef', // fuchsia-500
    '#f43f5e', // rose-500
    '#84cc16', // lime-500
];

const getColorForJob = (index: number) => PREMIUM_COLORS[index % PREMIUM_COLORS.length];

export default function SchedulePage() {
    // Global State
    const {
        state: { activeConfig, activeSchedule, activeOrders, isLoading },
        updateSchedule,
        promoteWhatIfToProduction,
        addWhatIfScenario,
        reload
    } = useProductionState();

    // Local UI State
    const [zoomLevel, setZoomLevel] = useState(1);
    const [viewMode, setViewMode] = useState<'hour' | 'day' | 'week'>('hour');
    const [isWhatIfMode, setIsWhatIfMode] = useState(false);
    const [isComputing, setIsComputing] = useState(false);

    // What-If State
    const [currentScenario, setCurrentScenario] = useState<WhatIfScenario | null>(null);
    const [simulatedSchedule, setSimulatedSchedule] = useState<any>(null);
    const [impactAnalysis, setImpactAnalysis] = useState<ImpactAnalysis | null>(null);
    const [showImpactModal, setShowImpactModal] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);

    // Orders update logic moved to Orders Page

    // Removed auto-compute to prevent state issues
    // User should manually click "Re-Optimize" button

    const handleOptimizeInSimulation = async () => {
        if (!activeConfig) {
            toast.error('No configuration loaded');
            return;
        }

        if (activeOrders.length === 0) {
            toast.error('No orders to schedule');
            return;
        }

        setIsComputing(true);
        // Automatically switch to What-If mode if not already
        setIsWhatIfMode(true);

        try {
            console.log("=== COMPUTE OPTIMIZATION SIMULATION START ===");

            // 1. Prepare Data (Same logic as before)
            const jobs: any[] = [];
            for (const order of activeOrders) {
                if (order.type === 'production' && order.product_id) {
                    const productTemplate = activeConfig.typical_jobs?.find(
                        (j: any) => j.id === order.product_id || j.name === order.product_name
                    );
                    if (!productTemplate) continue;
                    const priorityMap: Record<string, number> = { 'low': 1, 'normal': 2, 'high': 3, 'urgent': 4 };

                    jobs.push({
                        id: order.id,
                        name: `${order.product_name || productTemplate.name} (Qty: ${order.quantity || 1})`,
                        priority: priorityMap[order.priority] || 2,
                        color: getColorForJob(jobs.length),
                        dueDate: order.deadline ? new Date(order.deadline).getTime() / 1000 : Date.now() / 1000 + 86400,
                        tasks: productTemplate.operations.map((op: any, idx: number) => {
                            let eligibleMachines = activeConfig.machines
                                .filter((m: any) => m.capabilities?.includes(op.machine_capability_required))
                                .map((m: any) => m.id || m.name);
                            if (eligibleMachines.length === 0) eligibleMachines = activeConfig.machines.map((m: any) => m.id || m.name);
                            return {
                                id: `${order.id}-task-${idx}`,
                                name: op.name,
                                eligibleLines: eligibleMachines,
                                duration: op.duration_minutes,
                                skill: op.machine_capability_required || 'general',
                                order: idx
                            };
                        })
                    });
                }
                // Add color_change and cleaning logic here if needed (omitted for brevity, assume critical production path)
            }

            if (jobs.length === 0) {
                toast.error('No valid jobs to schedule');
                setIsComputing(false);
                return;
            }

            // 2. Compute Optimization
            console.log("Calling Optimization API via Gateway...");
            const solveData = {
                jobs,
                lines: activeConfig.machines,
                operators: activeConfig.operators,
                setupTimes: activeConfig.constraints.setup_times?.map((s: any) => ({
                    lineId: s.machine,
                    fromJobId: s.from_product,
                    toJobId: s.to_product,
                    duration: s.duration_minutes
                })),
                availabilities: activeConfig.constraints.resource_availabilities?.map((a: any) => ({
                    resourceId: a.resource_id,
                    intervals: a.shifts.map((s: any) => ({ start: s.start_minute, end: s.end_minute }))
                }))
            };
            const result = await gateway.solve(solveData);
            console.log("Optimization Result:", result);

            if (result.status === 'success') {
                const newSimulatedSchedule = {
                    ...result,
                    tasks: result.tasks || [],
                    makespan: result.makespan || 0,
                    logs: result.logs || [],
                    updatedAt: new Date().toISOString()
                };

                setSimulatedSchedule(newSimulatedSchedule);

                // 3. Create a transient Scenario
                const optimizationScenario: WhatIfScenario = {
                    id: `scenario-opt-${Date.now()}`,
                    name: 'Full AI Re-Optimization',
                    description: 'Global re-optimization of all tasks based on current orders.',
                    baseScheduleId: (activeSchedule as any)?.id || 'current',
                    modifications: [],
                    simulatedSchedule: newSimulatedSchedule,
                    createdAt: new Date().toISOString(),
                    status: 'simulated'
                };

                setCurrentScenario(optimizationScenario);
                toast.success('Optimization proposal generated in Simulation Mode');
            } else {
                toast.error('Optimization failed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to compute schedule');
        } finally {
            setIsComputing(false);
        }
    };

    // Handle Task Drag & Drop (What-If Trigger)
    const handleTaskMove = async (taskId: string, newStart: Date, newEnd: Date) => {
        if (!isWhatIfMode) return;

        setIsSimulating(true);
        try {
            // 1. Create or Update Scenario
            const modification: WhatIfModification = {
                type: 'task_move',
                description: `Moved task ${taskId} to ${newStart.toLocaleTimeString()}`,
                parameters: {
                    taskId,
                    newStartTime: Math.floor(newStart.getTime() / (1000 * 60)).toString() // minutes
                }
            };

            const updatedScenario: WhatIfScenario = currentScenario ? {
                ...currentScenario,
                modifications: [...currentScenario.modifications, modification]
            } : {
                id: `scenario-${Date.now()}`,
                name: 'Manual Adjustment',
                description: 'Drag and drop adjustments',
                baseScheduleId: (activeSchedule as any)?.id || 'current',
                modifications: [modification],
                createdAt: new Date().toISOString(),
                status: 'draft'
            };

            setCurrentScenario(updatedScenario);

            // 2. Prepare Simulation Request
            // RE-CONSTRUCT JOBS from activeOrders (duplication of logic from handleComputeSchedule)
            // Ideally should be refactored into a helper function, but for now we fix inline.
            const jobs: any[] = [];

            // NOTE: This logic must match handleComputeSchedule transformation!
            if (activeConfig && activeOrders.length > 0) {
                for (const order of activeOrders) {
                    if (order.type === 'production' && order.product_id) {
                        const productTemplate = activeConfig.typical_jobs?.find(
                            (j: any) => j.id === order.product_id || j.name === order.product_name
                        );
                        if (!productTemplate) continue;

                        const priorityMap: Record<string, number> = { 'low': 1, 'normal': 2, 'high': 3, 'urgent': 4 };
                        jobs.push({
                            id: order.id,
                            name: `${order.product_name || productTemplate.name} (Qty: ${order.quantity || 1})`,
                            priority: priorityMap[order.priority] || 2,
                            color: order.color || '#3B82F6',
                            dueDate: order.deadline ? new Date(order.deadline).getTime() / 1000 : Date.now() / 1000 + 86400,
                            tasks: productTemplate.operations.map((op: any, idx: number) => {
                                let eligibleMachines = activeConfig.machines
                                    .filter((m: any) => m.capabilities?.includes(op.machine_capability_required))
                                    .map((m: any) => m.id || m.name);
                                if (eligibleMachines.length === 0) eligibleMachines = activeConfig.machines.map((m: any) => m.id || m.name);

                                return {
                                    id: `${order.id}-task-${idx}`,
                                    name: op.name,
                                    eligibleLines: eligibleMachines,
                                    duration: op.duration_minutes,
                                    skill: op.machine_capability_required || 'general',
                                    order: idx
                                };
                            })
                        });
                    }
                    // Add other types if needed (color_change, etc.) - kept simple for critical fix
                }
            }

            if (!activeConfig) return;

            const solveRequest = {
                ...activeConfig,
                jobs: jobs,
                lines: activeConfig.machines || [],
                operators: activeConfig.operators || [],
                setupTimes: activeConfig.constraints.setup_times?.map((s: any) => ({
                    lineId: s.machine,
                    fromJobId: s.from_product,
                    toJobId: s.to_product,
                    duration: s.duration_minutes
                })),
                availabilities: activeConfig.constraints.resource_availabilities?.map((a: any) => ({
                    resourceId: a.resource_id,
                    intervals: a.shifts.map((s: any) => ({ start: s.start_minute, end: s.end_minute }))
                }))
            };

            // 3. Call Backend Simulation
            const result = await gateway.simulateWhatIf(
                updatedScenario,
                solveRequest,
                activeSchedule?.tasks || []
            );

            if (result.status === 'success') {
                setSimulatedSchedule(result.simulatedSchedule);
                setImpactAnalysis(result.impactAnalysis);

                // Update local scenario with result
                setCurrentScenario({
                    ...updatedScenario,
                    simulatedSchedule: result.simulatedSchedule,
                    impactAnalysis: result.impactAnalysis,
                    status: 'simulated'
                });

                toast.success('Simulation updated');
            } else {
                toast.error('Simulation failed: ' + (result.error || 'Unknown error'));
            }

        } catch (err) {
            console.error("Simulation error", err);
            toast.error("Failed to run simulation");
        } finally {
            setIsSimulating(false);
        }
    };

    const handlePromote = async () => {
        if (!currentScenario || !simulatedSchedule) return;

        try {
            // 1. Add scenario to global state
            const scenarioToSave = {
                ...currentScenario,
                simulatedSchedule,
                impactAnalysis: impactAnalysis || undefined
            };
            addWhatIfScenario(scenarioToSave);

            // 2. Promote it
            await promoteWhatIfToProduction(scenarioToSave.id);

            // 3. Reset UI
            setIsWhatIfMode(false);
            setCurrentScenario(null);
            setSimulatedSchedule(null);
            setImpactAnalysis(null);
            toast.success("Schedule promoted to production!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to promote schedule");
        }
    };

    const handleCancelWhatIf = () => {
        setIsWhatIfMode(false);
        setCurrentScenario(null);
        setSimulatedSchedule(null);
        setImpactAnalysis(null);
    };

    // Prepare Tasks for Gantt
    const displayTasksRaw = (isWhatIfMode && simulatedSchedule)
        ? simulatedSchedule.tasks
        : (activeSchedule?.tasks || []);

    const ganttTasks: GanttTask[] = displayTasksRaw
        .filter((t: any) => {
            const machineId = t.line || t.line_id || t.machine;
            return activeConfig?.machines?.some((m: any) => m.id === machineId || m.name === machineId);
        })
        .map((t: any, index: number) => {
            // Find machine name
            const machineId = t.line || t.line_id || t.machine;
            const machine = activeConfig?.machines?.find((m: any) => m.id === machineId || m.name === machineId);
            const machineName = machine ? machine.name : machineId;

            // Ensure date is valid, fallback to 8:00 AM today + offset
            const baseTime = new Date().setHours(8, 0, 0, 0);
            const startTime = t.start !== undefined ? baseTime + t.start * 60000 : baseTime;
            const endTime = t.duration !== undefined ? startTime + t.duration * 60000 : startTime + 3600000;

            return {
                id: t.id || t.task_id,
                name: t.name || t.task_name,
                machine: machineName,
                start: new Date(startTime),
                end: new Date(endTime),
                color: t.color || getColorForJob(index),
                isDraggable: true, // Always allow "attempt", logic handled in Gantt interactions
                progress: 0
            };
        });

    // Loading Screen
    if (isLoading) {
        return (
            <div className="h-full w-full flex flex-col p-6 space-y-6 animate-pulse">
                {/* Header Skeleton */}
                <div className="h-24 bg-slate-100 rounded-2xl w-full"></div>
                {/* Orders Panel Skeleton */}
                <div className="h-16 bg-slate-100 rounded-2xl w-full"></div>
                {/* Gantt Skeleton */}
                <div className="flex-1 bg-slate-100 rounded-2xl w-full flex flex-col p-4 space-y-4">
                    <div className="h-12 bg-slate-200 rounded-lg w-full"></div>
                    <div className="flex-1 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-4">
                                <div className="w-48 h-20 bg-slate-200 rounded-xl"></div>
                                <div className="flex-1 h-20 bg-slate-200 rounded-xl"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Optimization Loading State
    if (isComputing && !activeSchedule) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-medium">Optimizing schedule...</p>
            </div>
        );
    }

    const hasProducts = (activeConfig?.typical_jobs?.length ?? 0) > 0;
    const hasOrders = activeOrders.length > 0;

    return (
        <div className="p-6 h-full flex flex-col space-y-4 relative">

            {/* Warning Banners */}
            {!hasProducts && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="text-amber-600" size={20} />
                        </div>
                        <div>
                            <p className="font-semibold text-amber-800">No products defined</p>
                            <p className="text-sm text-amber-600">You need to create product templates before adding production orders.</p>
                        </div>
                    </div>
                    <Link
                        href="/dashboard/products"
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-colors"
                    >
                        Create Products
                    </Link>
                </div>
            )}

            {hasProducts && !hasOrders && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Package className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="font-semibold text-blue-800">No production orders</p>
                            <p className="text-sm text-blue-600">Go to "Commandes" to add orders and generate a schedule.</p>
                        </div>
                    </div>
                    <Link
                        href="/dashboard/orders"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                    >
                        Manage Orders
                    </Link>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Play className="text-indigo-600 filling" size={24} />
                        Production Schedule
                    </h1>
                    <p className="text-slate-500 text-sm">
                        {activeConfig ? `${activeConfig.machines.length} Machines • ${activeConfig.operators.length} Operators` : 'No active configuration'}
                        {hasOrders && ` • ${activeOrders.length} Orders`}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/orders"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl font-medium transition-colors"
                    >
                        <Package size={18} />
                        Orders ({activeOrders.length})
                    </Link>

                    {!isWhatIfMode ? (
                        <button
                            onClick={() => setIsWhatIfMode(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl font-medium transition-colors border border-amber-200"
                        >
                            <Wand2 size={18} />
                            Simulation Mode
                        </button>
                    ) : null}

                    <button
                        onClick={handleOptimizeInSimulation}
                        disabled={isComputing || !hasOrders}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium shadow-lg shadow-indigo-200 disabled:opacity-50"
                    >
                        {isComputing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                        Re-Optimize
                    </button>
                </div>
            </div>

            {/* Orders Panel - Removed and moved to dedicated page */}

            {/* What-If Banner */}
            {isWhatIfMode && (
                <WhatIfBanner
                    scenarioName={currentScenario?.name || "New Simulation"}
                    isSimulating={isSimulating}
                    hasChanges={!!currentScenario}
                    onCancel={handleCancelWhatIf}
                    onViewImpact={() => setShowImpactModal(true)}
                    onSave={handlePromote}
                />
            )}

            {/* Main Content (Gantt) */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex gap-4">
                        <div className="text-center">
                            <p className="text-xs text-slate-400 uppercase font-bold">Makespan</p>
                            <p className="text-xl font-bold text-slate-700">
                                {isWhatIfMode && simulatedSchedule ? simulatedSchedule.makespan : (activeSchedule?.makespan || 0)} min
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-slate-400 uppercase font-bold">Tasks</p>
                            <p className="text-xl font-bold text-slate-700">{displayTasksRaw.length}</p>
                        </div>
                    </div>

                    <ZoomControls
                        zoomLevel={zoomLevel}
                        onZoomChange={setZoomLevel}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                    />
                </div>

                <div className="flex-1 p-2 overflow-hidden relative">
                    <GanttChart
                        tasks={ganttTasks}
                        mode={isWhatIfMode ? 'whatif' : 'production'}
                        zoomLevel={zoomLevel}
                        viewMode={viewMode}
                        onTaskMove={handleTaskMove}
                        onRequestWhatIf={() => {
                            if (!isWhatIfMode) {
                                setIsWhatIfMode(true);
                                toast.info("Simulation mode activated. You can now move tasks.");
                            }
                        }}
                        availabilities={activeConfig?.constraints?.resource_availabilities?.flatMap((ra: any) => {
                            // Calc masks (inverted shifts)
                            // Base time is 8:00 AM Today (same as tasks)
                            const baseTime = new Date();
                            baseTime.setHours(8, 0, 0, 0);

                            const masks = [];
                            // Sort shifts
                            const shifts = (ra.shifts || []).sort((a: any, b: any) => a.start_minute - b.start_minute);

                            let lastEnd = 0;
                            // Horizon 24h = 1440 min
                            // If no shifts, machine is CLOSED all day? Or OPEN?
                            // Usually explicit shifts mean "Only work here".
                            // But if empty, we assume 24/7 or handled elsewhere. 
                            // Let's assume if shifts exist, everything else is closed.

                            if (shifts.length > 0) {
                                shifts.forEach((shift: any) => {
                                    if (shift.start_minute > lastEnd) {
                                        masks.push({
                                            resourceId: ra.resource_id,
                                            start: new Date(baseTime.getTime() + lastEnd * 60000),
                                            end: new Date(baseTime.getTime() + shift.start_minute * 60000),
                                            type: 'off' as const
                                        });
                                    }
                                    lastEnd = shift.end_minute;
                                });

                                // Close after last shift
                                if (lastEnd < 1440) {
                                    masks.push({
                                        resourceId: ra.resource_id,
                                        start: new Date(baseTime.getTime() + lastEnd * 60000),
                                        end: new Date(baseTime.getTime() + 1440 * 60000),
                                        type: 'off' as const
                                    });
                                }
                            }
                            return masks;
                        }) || []}
                        setupGaps={(() => {
                            const gaps: any[] = [];
                            if (activeConfig?.constraints?.setup_times) {
                                // We need sorted tasks per machine
                                const tasksByMachine: Record<string, GanttTask[]> = {};
                                ganttTasks.forEach(t => {
                                    if (!tasksByMachine[t.machine]) tasksByMachine[t.machine] = [];
                                    tasksByMachine[t.machine].push(t);
                                });

                                Object.keys(tasksByMachine).forEach(m => {
                                    const mTasks = tasksByMachine[m].sort((a, b) => a.start.getTime() - b.start.getTime());
                                    for (let i = 0; i < mTasks.length - 1; i++) {
                                        const t1 = mTasks[i];
                                        const t2 = mTasks[i + 1];
                                        const gapMin = (t2.start.getTime() - t1.end.getTime()) / 60000;

                                        if (gapMin > 0) {
                                            // Check if match
                                            const rule = activeConfig.constraints.setup_times.find((s: any) =>
                                                (s.machine === m || s.machine === 'all') &&
                                                Math.abs(s.duration_minutes - gapMin) < 2 // 2 min tolerance
                                            );
                                            if (rule) {
                                                gaps.push({
                                                    machine: m,
                                                    start: t1.end,
                                                    end: t2.start,
                                                    label: `${rule.duration_minutes}m`
                                                });
                                            }
                                        }
                                    }
                                });
                            }
                            return gaps;
                        })()}
                    />
                </div>
            </div>

            {/* Impact Analysis Modal */}
            {showImpactModal && impactAnalysis && (
                <WhatIfImpactModal
                    isOpen={showImpactModal}
                    onClose={() => setShowImpactModal(false)}
                    impact={impactAnalysis}
                    onConfirm={handlePromote}
                    scenarioName={currentScenario?.name || "New Simulation"}
                    isApplying={isComputing} // Using compute state for apply loader
                />
            )}
        </div>
    );
}
