import { Constraints } from '@/types/factory';
import { Clock, Zap, Package, Users2, AlertTriangle, Layers, Wrench } from 'lucide-react';

export default function ConstraintsList({ constraints, onEditConstraint }: {
    constraints: Constraints;
    onEditConstraint?: (type: string, item: any) => void;
}) {
    // Safety check: specific constraint arrays might be undefined in legacy data
    const hasConstraints =
        (constraints.setup_times?.length || 0) > 0 ||
        (constraints.temporal?.length || 0) > 0 ||
        (constraints.auxiliary_resources?.length || 0) > 0 ||
        (constraints.multi_operator?.length || 0) > 0 ||
        (constraints.batching?.length || 0) > 0 ||
        (constraints.maintenance?.length || 0) > 0;

    if (!hasConstraints) {
        return (
            <div className="text-center p-4 text-slate-400 text-xs">
                <AlertTriangle size={16} className="mx-auto mb-2 opacity-50" />
                <p>No constraints detected yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Setup Times */}
            {constraints.setup_times?.length > 0 && (
                <div className="p-3 bg-orange-50/80 rounded-xl border border-orange-100">
                    <h5 className="text-[10px] font-bold text-orange-600 mb-2 uppercase tracking-widest flex items-center gap-1">
                        <Zap size={12} /> Setup Times
                    </h5>
                    <div className="space-y-1">
                        {constraints.setup_times.map((st, i) => {
                            // Format product names to be more intuitive
                            const formatProduct = (product?: string) => {
                                if (!product || product === 'any_different') {
                                    return <span className="italic text-orange-400">Tout changement</span>;
                                }
                                return product;
                            };

                            return (
                                <div
                                    key={i}
                                    onClick={() => onEditConstraint?.('setup_times', st)}
                                    className="text-xs bg-white p-2 rounded-lg text-slate-700 cursor-pointer hover:bg-orange-100 transition-colors"
                                >
                                    <span className="font-mono text-[10px] text-orange-700">
                                        {formatProduct(st.from_product)} → {formatProduct(st.to_product)}
                                    </span>
                                    <span className="text-slate-500 mx-1">on</span>
                                    <span className="font-semibold">{st.machine}</span>
                                    <span className="text-slate-500 mx-1">:</span>
                                    <span className="font-bold text-orange-600">{st.duration_minutes}min</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Temporal Constraints */}
            {constraints.temporal?.length > 0 && (
                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100">
                    <h5 className="text-[10px] font-bold text-blue-600 mb-2 uppercase tracking-widest flex items-center gap-1">
                        <Clock size={12} /> Time Lags
                    </h5>
                    <div className="space-y-1">
                        {constraints.temporal.map((tc, i) => (
                            <div
                                key={i}
                                onClick={() => onEditConstraint?.('temporal', tc)}
                                className="text-xs bg-white p-2 rounded-lg text-slate-700 cursor-pointer hover:bg-blue-100 transition-colors"
                            >
                                <span className="font-mono text-[10px] text-blue-700 uppercase">
                                    {tc.type === 'min_lag' ? 'MIN' : 'MAX'}
                                </span>
                                <span className="text-slate-500 mx-1">:</span>
                                <span className="font-semibold">{tc.from_operation}</span>
                                <span className="text-slate-500 mx-1">→</span>
                                <span className="font-semibold">{tc.to_operation}</span>
                                <span className="text-slate-500 mx-1">:</span>
                                <span className="font-bold text-blue-600">{tc.duration_minutes}min</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Auxiliary Resources */}
            {constraints.auxiliary_resources?.length > 0 && (
                <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-100">
                    <h5 className="text-[10px] font-bold text-purple-600 mb-2 uppercase tracking-widest flex items-center gap-1">
                        <Package size={12} /> Aux. Resources
                    </h5>
                    <div className="space-y-1">
                        {constraints.auxiliary_resources.map((ar, i) => (
                            <div
                                key={i}
                                onClick={() => onEditConstraint?.('auxiliary_resources', ar)}
                                className="text-xs bg-white p-2 rounded-lg flex justify-between items-center cursor-pointer hover:bg-purple-100 transition-colors"
                            >
                                <span className="font-semibold text-slate-700">{ar.name}</span>
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 font-bold rounded-full">
                                    x{ar.quantity}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Multi-Operator */}
            {constraints.multi_operator?.length > 0 && (
                <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-100">
                    <h5 className="text-[10px] font-bold text-emerald-600 mb-2 uppercase tracking-widest flex items-center gap-1">
                        <Users2 size={12} /> Multi-Operator
                    </h5>
                    <div className="space-y-1">
                        {constraints.multi_operator.map((mo, i) => (
                            <div
                                key={i}
                                onClick={() => onEditConstraint?.('multi_operator', mo)}
                                className="text-xs bg-white p-2 rounded-lg flex justify-between items-center cursor-pointer hover:bg-emerald-100 transition-colors"
                            >
                                <span className="font-semibold text-slate-700">{mo.machine}</span>
                                <span className="text-emerald-600 font-bold">
                                    {mo.required_operators} operators
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Batching */}
            {constraints.batching?.length > 0 && (
                <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100">
                    <h5 className="text-[10px] font-bold text-indigo-600 mb-2 uppercase tracking-widest flex items-center gap-1">
                        <Layers size={12} /> Batching rules
                    </h5>
                    <div className="space-y-1">
                        {constraints.batching.map((b, i) => (
                            <div
                                key={i}
                                onClick={() => onEditConstraint?.('batching', b)}
                                className="text-xs bg-white p-2 rounded-lg flex justify-between items-center cursor-pointer hover:bg-indigo-100 transition-colors"
                            >
                                <span className="font-semibold text-slate-700">{b.machine}</span>
                                <span className="text-indigo-600 font-bold">
                                    {b.min_size}-{b.max_size} units
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Maintenance */}
            {constraints.maintenance?.length > 0 && (
                <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-100">
                    <h5 className="text-[10px] font-bold text-rose-600 mb-2 uppercase tracking-widest flex items-center gap-1">
                        <Wrench size={12} /> Maintenance
                    </h5>
                    <div className="space-y-1">
                        {constraints.maintenance.map((m, i) => (
                            <div
                                key={i}
                                onClick={() => onEditConstraint?.('maintenance', m)}
                                className="text-xs bg-white p-2 rounded-lg flex justify-between items-center cursor-pointer hover:bg-rose-100 transition-colors"
                            >
                                <span className="font-semibold text-slate-700">{m.machine}</span>
                                <div className="text-right">
                                    <span className="block text-rose-600 font-bold">{m.duration_minutes}m</span>
                                    <span className="text-[9px] text-slate-400">every {m.frequency_hours}h</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
