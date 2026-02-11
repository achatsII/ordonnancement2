
import React from 'react';
import { Package, CalendarClock, X, Check, Loader2 } from 'lucide-react';
import { ProductionOrder, Job } from '@/types/factory';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExtractedOrdersListProps {
    pendingOrders: ProductionOrder[];
    pendingProducts: Job[];
    onRemoveOrder: (id: string) => void;
    onRemoveProduct: (id: string) => void;
    onSave: () => void;
    isSaving: boolean;
}

export default function ExtractedOrdersList({
    pendingOrders,
    pendingProducts,
    onRemoveOrder,
    onRemoveProduct,
    onSave,
    isSaving
}: ExtractedOrdersListProps) {
    const { language } = useLanguage();
    const hasPendingItems = pendingOrders.length > 0 || pendingProducts.length > 0;

    return (
        <div className="h-full flex flex-col p-4 overflow-y-auto w-96 bg-emerald-50/50 border-l border-emerald-100 shrink-0">
            <h3 className="font-bold text-emerald-700 mb-4 flex items-center gap-2">
                <Package size={18} /> {language === 'fr' ? 'Commandes Extraites' : 'Extracted Orders'}
            </h3>

            {!hasPendingItems ? (
                <div className="flex-1 flex flex-col items-center justify-center text-emerald-400">
                    <CalendarClock size={48} className="mb-4 opacity-30" />
                    <p className="text-center text-sm">
                        {language === 'fr'
                            ? "Décrivez vos commandes dans le chat.\nJe les extrairai automatiquement ici."
                            : "Describe your orders in the chat.\nI'll extract them here automatically."
                        }
                    </p>
                </div>
            ) : (
                <div className="flex-1 space-y-4 overflow-y-auto">
                    {/* Pending Products */}
                    {pendingProducts.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                                <Package size={12} /> {language === 'fr' ? 'Nouveaux Produits' : 'New Products'} ({pendingProducts.length})
                            </h4>
                            <div className="space-y-2">
                                {pendingProducts.map(product => (
                                    <div key={product.id} className="p-3 bg-white rounded-lg border border-emerald-200 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-slate-700">{product.name}</p>
                                                <p className="text-xs text-slate-400">{product.operations.length} operations</p>
                                            </div>
                                            <button
                                                onClick={() => onRemoveProduct(product.id)}
                                                className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pending Orders */}
                    {pendingOrders.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                                <CalendarClock size={12} /> {language === 'fr' ? 'Commandes' : 'Orders'} ({pendingOrders.length})
                            </h4>
                            <div className="space-y-2">
                                {pendingOrders.map(order => (
                                    <div key={order.id} className="p-3 bg-white rounded-lg border border-emerald-200 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${order.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                                        order.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {order.priority?.toUpperCase()}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 uppercase">
                                                        {order.type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <p className="font-semibold text-slate-700 truncate">
                                                    {order.type === 'production'
                                                        ? `${order.product_name} (x${order.quantity})`
                                                        : order.type === 'color_change'
                                                            ? `${order.color_change_details?.from_color} → ${order.color_change_details?.to_color}`
                                                            : order.type
                                                    }
                                                </p>
                                                {order.deadline && (
                                                    <p className="text-xs text-slate-400">📅 {order.deadline}</p>
                                                )}
                                                {order.client && (
                                                    <p className="text-xs text-slate-400">👤 {order.client}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => onRemoveOrder(order.id)}
                                                className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Save Button */}
            {hasPendingItems && (
                <div className="pt-4 border-t border-emerald-200 mt-4 shrink-0">
                    <button
                        onClick={onSave}
                        disabled={isSaving}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 font-bold transition-all"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                {language === 'fr' ? 'Sauvegarde...' : 'Saving...'}
                            </>
                        ) : (
                            <>
                                <Check size={18} />
                                {language === 'fr' ? 'Sauvegarder tout' : 'Save All'}
                            </>
                        )}
                    </button>
                    <p className="text-xs text-center text-emerald-600 mt-2">
                        {language === 'fr'
                            ? `${pendingProducts.length} produit(s), ${pendingOrders.length} commande(s)`
                            : `${pendingProducts.length} product(s), ${pendingOrders.length} order(s)`
                        }
                    </p>
                </div>
            )}
        </div>
    );
}
