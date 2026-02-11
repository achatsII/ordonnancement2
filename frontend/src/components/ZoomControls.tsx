'use client';

import React from 'react';
import { Sliders } from 'lucide-react';

interface ZoomControlsProps {
    zoomLevel: number;
    onZoomChange: (level: number) => void;
    viewMode: 'hour' | 'day' | 'week';
    onViewModeChange: (mode: 'hour' | 'day' | 'week') => void;
}

const ZOOM_PRESETS = [
    { label: '1h', hours: 1 },
    { label: '4h', hours: 4 },
    { label: '1d', hours: 24 },
    { label: '1w', hours: 168 },
];

export default function ZoomControls({
    zoomLevel,
    onZoomChange,
    viewMode,
    onViewModeChange
}: ZoomControlsProps) {
    return (
        <div className="flex items-center gap-4 bg-white rounded-lg px-4 py-2 shadow-sm border border-slate-200">
            {/* View Mode Selector */}
            <div className="flex items-center gap-2">
                <Sliders size={16} className="text-slate-400" />
                <div className="flex rounded-lg bg-slate-100 p-1">
                    {(['hour', 'day', 'week'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => onViewModeChange(mode)}
                            className={`px-3 py-1 text-xs font-semibold rounded transition-all ${viewMode === mode
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            {mode === 'hour' ? 'Heure' : mode === 'day' ? 'Jour' : 'Semaine'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Zoom Slider */}
            <div className="flex items-center gap-2 min-w-[200px]">
                <span className="text-xs font-medium text-slate-500">Zoom:</span>
                <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={zoomLevel}
                    onChange={(e) => onZoomChange(Number(e.target.value))}
                    className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
                <span className="text-xs font-mono text-slate-600 min-w-[3ch]">
                    {Math.round(zoomLevel * 100)}%
                </span>
            </div>

            {/* Preset Buttons */}
            <div className="flex gap-1 border-l border-slate-200 pl-3">
                {ZOOM_PRESETS.map((preset) => (
                    <button
                        key={preset.label}
                        onClick={() => {
                            // Adjust zoom based on preset
                            // This is a simplified version - you'd calculate based on hours
                            const baseZoom = preset.hours === 1 ? 2 : preset.hours === 4 ? 1.5 : preset.hours === 24 ? 1 : 0.5;
                            onZoomChange(baseZoom);
                        }}
                        className="px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded transition-colors"
                    >
                        {preset.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
