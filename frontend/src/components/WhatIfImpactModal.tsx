'use client';

import React from 'react';
import { ImpactAnalysis } from '@/types/whatif';
import { motion } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface WhatIfImpactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    impact: ImpactAnalysis;
    scenarioName: string;
    isApplying?: boolean;
}

export default function WhatIfImpactModal({
    isOpen,
    onClose,
    onConfirm,
    impact,
    scenarioName
}: WhatIfImpactModalProps) {
    if (!isOpen) return null;

    const { jobImpacts, globalMetrics } = impact;

    const formatHours = (hours: number) => {
        const absHours = Math.abs(hours);
        const sign = hours > 0 ? '+' : hours < 0 ? '-' : '';
        return `${sign}${Math.round(absHours)}h`;
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
                <div
                    className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    📊 Résumé des Modifications
                                </h2>
                                <p className="text-blue-100 text-sm mt-1">{scenarioName}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
                        {/* Global Metrics */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Makespan</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {formatHours(globalMetrics.makespanDelta)}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {globalMetrics.makespanBefore}h → {globalMetrics.makespanAfter}h
                                </p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Utilisation</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {Math.round(globalMetrics.utilizationAfter)}%
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {Math.round(globalMetrics.utilizationBefore)}% → {Math.round(globalMetrics.utilizationAfter)}%
                                </p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Délais Respectés</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {globalMetrics.deadlinesMetAfter}/{jobImpacts.length}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {globalMetrics.deadlinesMetBefore}/{jobImpacts.length} → {globalMetrics.deadlinesMetAfter}/{jobImpacts.length}
                                </p>
                            </div>
                        </div>

                        {/* Job Impacts Table */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Tâche</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Avant</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Après</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Impact</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {jobImpacts.map((job, idx) => {
                                        const StatusIcon =
                                            job.status === 'improved' ? CheckCircle2 :
                                                job.status === 'degraded' ? AlertTriangle :
                                                    Minus;

                                        const statusColor =
                                            job.status === 'improved' ? 'text-green-600' :
                                                job.status === 'degraded' ? 'text-red-600' :
                                                    'text-slate-400';

                                        return (
                                            <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-800">{job.jobName}</td>
                                                <td className="px-4 py-3 text-center text-slate-600 font-mono text-xs">
                                                    {new Date(job.endTimeBefore).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-4 py-3 text-center text-slate-600 font-mono text-xs">
                                                    {new Date(job.endTimeAfter).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <StatusIcon size={16} className={statusColor} />
                                                        <span className={`font-bold text-xs ${statusColor}`}>
                                                            {formatHours(job.deltaHours)}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Warning if deadlines compromised */}
                        {globalMetrics.deadlinesMetAfter < globalMetrics.deadlinesMetBefore && (
                            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                                <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                                <div className="text-sm">
                                    <p className="font-semibold text-amber-800">Attention : Délais compromis</p>
                                    <p className="text-amber-700 mt-1">
                                        Ce scénario entraîne {globalMetrics.deadlinesMetBefore - globalMetrics.deadlinesMetAfter} délais manqué(s) supplémentaire(s).
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-200 p-6 bg-slate-50 flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-slate-700 hover:bg-slate-200 rounded-lg font-semibold transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                        >
                            💾 Confirmer et Sauvegarder
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
}
