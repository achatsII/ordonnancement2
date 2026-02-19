import React, { useState } from 'react';
import { Package, CalendarClock, X, Check, Loader2, History } from 'lucide-react';
import { ProductionOrder, Job, HistoryItem } from '@/types/factory';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ExtractedOrdersListProps {
    pendingOrders: ProductionOrder[];
    pendingProducts: Job[];
    onRemoveOrder: (id: string) => void;
    onRemoveProduct: (id: string) => void;
    onSave: () => void;
    isSaving: boolean;
    historyLog?: HistoryItem[];
}

export default function ExtractedOrdersList({
    pendingOrders,
    pendingProducts,
    onRemoveOrder,
    onRemoveProduct,
    onSave,
    isSaving,
    historyLog = []
}: ExtractedOrdersListProps) {
    const { language } = useLanguage();
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    const hasPendingItems = pendingOrders.length > 0 || pendingProducts.length > 0;
    const hasHistory = historyLog.length > 0;

    return (
        <div className="h-full flex flex-col w-96 bg-emerald-50/50 border-l border-emerald-100 shrink-0 overflow-hidden">
            {/* Header / Tabs */}
            <div className="flex border-b border-emerald-100 bg-white/50 backdrop-blur-sm">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={cn(
                        "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 relative",
                        activeTab === 'pending'
                            ? "border-emerald-600 text-emerald-600 bg-emerald-50/50"
                            : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    )}
                >
                    <span className="flex items-center justify-center gap-2">
                        <Package size={14} />
                        {language === 'fr' ? 'En Attente' : 'Pending'}
                    </span>
                    {hasPendingItems && (
                        <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full border border-white" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={cn(
                        "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 relative",
                        activeTab === 'history'
                            ? "border-blue-600 text-blue-600 bg-blue-50/50"
                            : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    )}
                >
                    <span className="flex items-center justify-center gap-2">
                        <History size={14} />
                        {language === 'fr' ? 'Historique' : 'History'}
                    </span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'pending' ? (
                    <>
                        {!hasPendingItems ? (
                            <div className="h-full flex flex-col items-center justify-center text-emerald-400">
                                <CalendarClock size={48} className="mb-4 opacity-30" />
                                <p className="text-center text-sm">
                                    {language === 'fr'
                                        ? "Décrivez vos commandes dans le chat.\nJe les extrairai automatiquement ici."
                                        : "Describe your orders in the chat.\nI'll extract them here automatically."
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Pending Products */}
                                {pendingProducts.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                                            <Package size={12} /> {language === 'fr' ? 'Nouveaux Produits' : 'New Products'} ({pendingProducts.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {pendingProducts.map(product => (
                                                <div key={product.id} className="p-3 bg-white rounded-lg border border-emerald-200 shadow-sm transition-all hover:shadow-md">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-semibold text-slate-700">{product.name}</p>
                                                            <p className="text-xs text-slate-400">{product.operations.length} operations</p>
                                                        </div>
                                                        <button
                                                            onClick={() => onRemoveProduct(product.id)}
                                                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
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
                                                <div key={order.id} className="p-3 bg-white rounded-lg border border-emerald-200 shadow-sm transition-all hover:shadow-md">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={cn(
                                                                    "px-1.5 py-0.5 text-[10px] font-bold rounded uppercase",
                                                                    order.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                                                        order.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                                                                            'bg-slate-100 text-slate-600'
                                                                )}>
                                                                    {order.priority}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                                                                    {order.type.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                            <p className="font-semibold text-slate-700 truncate text-sm">
                                                                {order.type === 'production'
                                                                    ? `${order.quantity}x ${order.product_name}`
                                                                    : order.type === 'color_change'
                                                                        ? `${order.color_change_details?.from_color} → ${order.color_change_details?.to_color}`
                                                                        : order.description || order.type
                                                                }
                                                            </p>
                                                            {order.deadline && (
                                                                <p className="text-[10px] text-slate-400 mt-0.5">📅 {new Date(order.deadline).toLocaleDateString()}</p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => onRemoveOrder(order.id)}
                                                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="h-6"></div> {/* Spacer */}
                            </div>
                        )}
                    </>
                ) : (
                    // HISTORY TAB
                    <div className="space-y-4">
                        {!hasHistory ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                                <History size={32} className="mb-2 opacity-30" />
                                <p className="text-xs">
                                    {language === 'fr' ? 'Aucun historique récent' : 'No recent history'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 relative">
                                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                                {historyLog.map((item, idx) => (
                                    <div key={item.id || idx} className="pl-8 relative group">
                                        <div className={cn(
                                            "absolute left-1.5 top-3 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm z-10",
                                            item.type === 'order' ? "bg-emerald-400" : "bg-blue-400"
                                        )}></div>

                                        <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm group-hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                                                    item.type === 'order' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                                )}>
                                                    {item.type}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-700 leading-tight">
                                                {item.summary}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Save Button (Only visible in Pending tab if items exist) */}
            {activeTab === 'pending' && hasPendingItems && (
                <div className="p-4 bg-white/50 backdrop-blur-sm border-t border-emerald-100 shrink-0">
                    <button
                        onClick={() => onSave()}
                        disabled={isSaving}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 font-bold transition-all transform active:scale-95"
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
                    <p className="text-[10px] text-center text-emerald-600 mt-2 font-medium">
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
