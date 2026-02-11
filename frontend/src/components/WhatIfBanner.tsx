'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface WhatIfBannerProps {
    scenarioName: string;
    isSimulating?: boolean;
    hasChanges?: boolean;
    onCancel: () => void;
    onViewImpact: () => void;
    onSave: () => void;
}

export default function WhatIfBanner({
    scenarioName,
    onCancel,
    onViewImpact,
    onSave
}: WhatIfBannerProps) {
    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
            <div className="container mx-auto px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="animate-pulse">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">🔮 MODE WHAT-IF - Scénario de simulation</h3>
                        <p className="text-xs opacity-90">{scenarioName}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-1.5 text-sm font-semibold text-orange-600 bg-white rounded-lg hover:bg-orange-50 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onViewImpact}
                        className="px-4 py-1.5 text-sm font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        Voir Impact
                    </button>
                    <button
                        onClick={onSave}
                        className="px-4 py-1.5 text-sm font-semibold bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-1"
                    >
                        💾 Sauvegarder
                    </button>
                </div>
            </div>
        </div>
    );
}
