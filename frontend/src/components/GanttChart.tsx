'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

export interface GanttTask {
    id: string;
    name: string;
    machine: string;
    start: Date;
    end: Date;
    color?: string;
    isDraggable?: boolean;
}

interface GanttChartProps {
    tasks: GanttTask[];
    mode?: 'production' | 'whatif';
    zoomLevel?: number;
    viewMode?: 'hour' | 'day' | 'week';
    onTaskMove?: (taskId: string, newStart: Date, newEnd: Date) => void;
    onRequestWhatIf?: () => void;
    // New Props for Visualization
    availabilities?: { resourceId: string; start: Date; end: Date; type: 'off' | 'maintenance' }[];
    setupGaps?: { machine: string; start: Date; end: Date; label?: string }[];
}

export default function GanttChart({
    tasks,
    mode = 'production',
    zoomLevel = 1,
    viewMode = 'day',
    onTaskMove,
    onRequestWhatIf,
    availabilities = [],
    setupGaps = []
}: GanttChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    // Drag State
    const [dragState, setDragState] = useState<{
        taskId: string;
        startX: number;
        startY: number;
        currentX: number;
        currentY: number;
        originalStart: Date;
        originalMachine: string;
    } | null>(null);

    // Group tasks by machine
    const machines = Array.from(new Set(tasks.map(t => t.machine))).sort();

    // Calculate time range with BUFFER
    const allTimes = tasks.flatMap(t => [t.start.getTime(), t.end.getTime()]);
    // Add 1 hour buffer before and 2 hours after
    const minTime = Math.min(...allTimes) - 3600000;
    const maxTime = Math.max(...allTimes) + 7200000;
    const timeRange = maxTime - minTime;

    // Calculate pixel width based on zoom and view mode
    const basePixelsPerHour = viewMode === 'hour' ? 100 : viewMode === 'day' ? 30 : 10;
    const pixelsPerMs = (basePixelsPerHour * zoomLevel) / (1000 * 60 * 60);

    const totalWidth = Math.max(timeRange * pixelsPerMs, 1000);

    const getTaskPosition = (task: GanttTask) => {
        const left = (task.start.getTime() - minTime) * pixelsPerMs;
        const width = (task.end.getTime() - task.start.getTime()) * pixelsPerMs;
        return { left, width };
    };

    // Global Mouse Events for Dragging
    useEffect(() => {
        if (!dragState) return;

        const handleMouseMove = (e: MouseEvent) => {
            setDragState(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!dragState) return;

            const { taskId, startX, currentX, currentY, startY, originalStart, originalMachine } = dragState;
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;
            const hasMoved = Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5;

            // Calculate changes
            const timeDeltaMs = (deltaX / pixelsPerMs);
            const newStart = new Date(originalStart.getTime() + timeDeltaMs);
            const task = tasks.find(t => t.id === taskId);
            const durationMs = task ? task.end.getTime() - task.start.getTime() : 0;
            const newEnd = new Date(newStart.getTime() + durationMs);

            // Calculate Machine Change (Vertical)
            // Row height is h-20 (80px in Tailwind default, or explicit 5rem)
            // We need to find which row we are hovering.
            // This is simplified; robust implementation requires finding the element.
            // For now, we'll stick to Time Dragging as requested first, or try simple machine index offset.
            // Ideally, we detect the standard row height.
            const rowHeight = 80; // px (h-20)
            const rowChange = Math.round(deltaY / rowHeight);

            let newMachine = originalMachine;
            if (rowChange !== 0) {
                const currentMachineIdx = machines.indexOf(originalMachine);
                const newMachineIdx = Math.max(0, Math.min(machines.length - 1, currentMachineIdx + rowChange));
                newMachine = machines[newMachineIdx];
            }

            if (hasMoved) {
                // Trigger Move
                // If in Production, this should trigger "Request What-If" + Move?
                // Or just "Request What-If" and let parent simplify?
                // User wants: "Enter simulation when I DROP".

                if (mode !== 'whatif' && onRequestWhatIf) {
                    onRequestWhatIf();
                    // We also want to apply the move. But if we just switched mode, the move might be lost?
                    // Ideally SchedulePage handles this: "If production, switch to what-if, THEN apply this move".
                    onTaskMove?.(taskId, newStart, newEnd);
                } else {
                    onTaskMove?.(taskId, newStart, newEnd);
                }
            } else {
                // It was just a click
                // Potential for "Select" or "Show Info" here
            }

            setDragState(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragState, onTaskMove, pixelsPerMs, machines, mode, onRequestWhatIf, tasks]);

    const handleTaskDragStart = (taskId: string, e: React.MouseEvent) => {
        // Prevent default browser drag
        e.preventDefault();
        e.stopPropagation();

        const task = tasks.find(t => t.id === taskId);
        if (!task?.isDraggable) return;

        setDragState({
            taskId,
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY,
            originalStart: task.start,
            originalMachine: task.machine
        });
    };

    const handleTaskDragEnd = () => {
        setDragState(null);
    };

    // Render Time Header (Numbers)
    const renderTimeGridHeader = () => {
        const hours = [];
        const startDate = new Date(minTime);
        startDate.setMinutes(0, 0, 0);

        let step = viewMode === 'hour' ? 0.5 : viewMode === 'day' ? 0.5 : 24;
        const stepMs = step * 60 * 60 * 1000;

        for (let time = startDate.getTime(); time <= maxTime; time += stepMs) {
            const pos = (time - minTime) * pixelsPerMs;
            const date = new Date(time);
            const isHour = date.getMinutes() === 0;

            if (pos < 0) continue; // Skip if before start

            hours.push(
                <div
                    key={time}
                    className="absolute top-0 bottom-0 select-none pointer-events-none"
                    style={{ left: pos }}
                >
                    <div className={`mt-4 transform -translate-x-1/2 text-[10px] font-semibold tracking-tight
                        ${isHour ? 'text-slate-600' : 'text-slate-400 font-medium'}
                    `}>
                        {date.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                    {/* Small tick mark */}
                    <div className={`mx-auto w-[1px] ${isHour ? 'h-3 bg-slate-300' : 'h-2 bg-slate-200'} mt-1`}></div>
                </div>
            );
        }
        return hours;
    };

    // Render Grid Lines (Background)
    const renderGridLines = () => {
        const lines = [];
        const startDate = new Date(minTime);
        startDate.setMinutes(0, 0, 0);

        let step = viewMode === 'hour' ? 0.5 : viewMode === 'day' ? 0.5 : 24;
        const stepMs = step * 60 * 60 * 1000;

        for (let time = startDate.getTime(); time <= maxTime; time += stepMs) {
            const pos = (time - minTime) * pixelsPerMs;
            if (pos < 0) continue;
            lines.push(
                <div
                    key={`line-${time}`}
                    className="absolute top-0 bottom-0 border-l border-slate-100 border-dashed"
                    style={{ left: pos }}
                />
            );
        }
        return lines;
    };


    return (
        <div className="h-full flex flex-col bg-slate-50/50 rounded-2xl">
            {/* Gantt Chart Container */}
            <div ref={containerRef} className="overflow-x-auto overflow-y-auto h-full scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                <div className="relative min-w-full" style={{ width: Math.max(totalWidth, 1000) }}>

                    {/* Sticky Header (Time Scale) */}
                    <div className="sticky top-0 z-20 flex h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
                        {/* Corner (Machine Header) */}
                        <div className="sticky left-0 z-30 w-[240px] flex-shrink-0 bg-white/95 backdrop-blur-md border-r border-slate-200 flex items-center px-6 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
                            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
                                <Clock size={14} />
                                <span>Machines</span>
                            </div>
                        </div>

                        {/* Time Grid Header */}
                        <div className="relative flex-1">
                            {renderTimeGridHeader()}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="relative">
                        {/* Background Grid Lines */}
                        <div className="absolute inset-0 pointer-events-none z-0">
                            {renderGridLines()}
                        </div>

                        {/* Machine Rows */}
                        {machines.map((machine, idx) => {
                            const machineTasks = tasks.filter(t => t.machine === machine);
                            const isOdd = idx % 2 !== 0;

                            return (
                                <div
                                    key={machine}
                                    className={`relative h-20 flex border-b border-slate-100 group transition-colors hover:bg-indigo-50/10 ${isOdd ? 'bg-slate-50/30' : 'bg-white'}`}
                                >
                                    {/* Sticky Machine Label */}
                                    <div className="sticky left-0 z-10 w-[240px] flex-shrink-0 flex items-center justify-between px-6 border-r border-slate-200 bg-inherit shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] group-hover:bg-white transition-colors">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-slate-700 truncate w-[180px]" title={machine}>
                                                {machine}
                                            </span>
                                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mt-0.5">
                                                {machineTasks.length} Tâches
                                            </span>
                                        </div>
                                        {/* Status Dot (Fake for now) */}
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                    </div>

                                    {/* Task Lane */}
                                    <div className="relative flex-1 h-full">
                                        {machineTasks.map(task => {
                                            const { left, width } = getTaskPosition(task);
                                            const isDragging = dragState?.taskId === task.id;
                                            const durationMinutes = Math.round((task.end.getTime() - task.start.getTime()) / 60000);

                                            // Apply Drag Offset
                                            let styleLeft = left;
                                            let styleTop = 0; // Relative to lane center

                                            if (isDragging) {
                                                const deltaX = dragState.currentX - dragState.startX;
                                                styleLeft += deltaX;
                                                // Note: Vertical drag is visual-only for now unless we move the DOM element to another container, 
                                                // which is complex with React lists. 
                                                // For now, let's keep it horizontal visual feedback, 
                                                // but if we implemented vertical logic (rowChange), we could augment layout.
                                                // Simple Transform prefer:
                                            }

                                            return (
                                                <div
                                                    key={task.id}
                                                    className={`absolute top-1/2 -translate-y-1/2 h-12 rounded-xl shadow-sm border border-white/20 flex flex-col justify-center px-3 text-white transition-all overflow-hidden group/task
                                                        ${task.isDraggable ? 'cursor-move hover:shadow-lg hover:scale-[1.02] hover:z-20' : ''}
                                                        ${isDragging ? 'shadow-2xl ring-4 ring-indigo-400 ring-opacity-50 z-50 scale-105 cursor-grabbing' : ''}
                                                    `}
                                                    style={{
                                                        left: `${styleLeft}px`,
                                                        width: `${Math.max(width, 4)}px`,
                                                        backgroundColor: task.color || '#6366f1',
                                                        backgroundImage: 'linear-gradient(to bottom right, rgba(255,255,255,0.15), rgba(0,0,0,0.05))',
                                                        boxShadow: isDragging ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : undefined,
                                                        cursor: isDragging ? 'grabbing' : 'grab'
                                                    }}
                                                    onMouseDown={(e) => handleTaskDragStart(task.id, e)}
                                                    title={`${task.name} (${durationMinutes}m)`}
                                                >
                                                    {/* Task Content */}
                                                    <span className="font-bold text-xs truncate drop-shadow-sm">
                                                        {task.name}
                                                    </span>
                                                    <span className="text-[10px] opacity-90 truncate font-medium tracking-wide">
                                                        {durationMinutes} min
                                                    </span>
                                                </div>
                                            );
                                        })}

                                        {/* Setup Gaps (Amber Bridges) */}
                                        {setupGaps
                                            .filter(g => g.machine === machine)
                                            .map((gap, gIdx) => {
                                                const { left, width } = getTaskPosition({ start: gap.start, end: gap.end } as any);
                                                return (
                                                    <div
                                                        key={`gap-${gIdx}`}
                                                        className="absolute top-1/2 -translate-y-1/2 h-6 flex items-center justify-center bg-amber-100 border border-amber-300 rounded-md z-0 opacity-80"
                                                        style={{ left, width: Math.max(width, 2) }}
                                                        title={`Setup: ${gap.label || 'Configuration'}`}
                                                    >
                                                        <div className="w-full h-[1px] bg-amber-400 absolute top-1/2 left-0 right-0"></div>
                                                        {width > 20 && <span className="text-[9px] text-amber-700 bg-amber-50 px-1 relative z-10 font-mono">SETUP</span>}
                                                    </div>
                                                );
                                            })
                                        }

                                        {/* Availability Masks (Grey Zones) */}
                                        {availabilities
                                            .filter(a => a.resourceId === machine)
                                            .map((avail, aIdx) => {
                                                const { left, width } = getTaskPosition({ start: avail.start, end: avail.end } as any);
                                                return (
                                                    <div
                                                        key={`avail-${aIdx}`}
                                                        className="absolute top-0 bottom-0 bg-slate-100/50 border-x border-slate-200 z-20 pointer-events-none flex items-center justify-center opacity-70"
                                                        style={{
                                                            left,
                                                            width,
                                                            backgroundImage: "linear-gradient(45deg, #e2e8f0 25%, transparent 25%, transparent 50%, #e2e8f0 50%, #e2e8f0 75%, transparent 75%, transparent)",
                                                            backgroundSize: "10px 10px"
                                                        }}
                                                    >
                                                        {width > 50 && <span className="text-[10px] text-slate-400 font-bold uppercase -rotate-90">Closed</span>}
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {tasks.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <p className="text-sm">Aucune tâche à afficher</p>
                </div>
            )}
        </div>
    );
}
