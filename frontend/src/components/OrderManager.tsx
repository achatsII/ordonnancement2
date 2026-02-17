'use client';

import React, { useState } from 'react';
import { FactoryConfig, ProductionOrder, OrderType } from '@/types/factory';
import { Plus, Trash2, Calendar, Package, Wrench, Droplet, CheckCircle2, Settings } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

interface OrderManagerProps {
    orders: ProductionOrder[];
    activeConfig: FactoryConfig | null;
    onUpdate: (updatedOrders: ProductionOrder[]) => void;
}

const ORDER_TYPE_ICONS: Record<OrderType, React.ReactNode> = {
    production: <Package size={16} />,
    color_change: <Droplet size={16} />,
    cleaning: <Wrench size={16} />,
    preventive_maintenance: <Settings size={16} />,
    tool_change: <Settings size={16} />,
    quality_control: <CheckCircle2 size={16} />
};

export default function OrderManager({ orders, activeConfig, onUpdate }: OrderManagerProps) {
    const { t } = useTranslation('schedule');
    const { t: tCommon } = useTranslation('common');

    const [isAdding, setIsAdding] = useState(false);
    const [newOrder, setNewOrder] = useState<Partial<ProductionOrder>>({
        type: 'production',
        quantity: 100,
        priority: 'normal'
    });

    const products = activeConfig?.typical_jobs || [];
    const machines = activeConfig?.machines || [];

    const resetForm = () => {
        setNewOrder({
            type: 'production',
            quantity: 100,
            priority: 'normal'
        });
        setIsAdding(false);
    };

    const handleAdd = () => {
        const orderType = newOrder.type || 'production';

        // Validation
        if (orderType === 'production' && (!newOrder.product_id || !newOrder.quantity)) {
            alert('Please select a product and quantity');
            return;
        }

        const product = products.find(p => p.id === newOrder.product_id);

        const baseOrder: ProductionOrder = {
            id: `ord-${Date.now()}`,
            type: orderType,
            client: newOrder.client,
            priority: (newOrder.priority as 'low' | 'normal' | 'high' | 'urgent') || 'normal',
            deadline: newOrder.deadline,
            status: 'pending',
            color: product ? '#' + Math.floor(Math.random() * 16777215).toString(16) : '#888'
        };

        // Type-specific fields
        if (orderType === 'production' && newOrder.product_id) {
            baseOrder.product_id = newOrder.product_id;
            baseOrder.product_name = product?.name || 'Unknown';
            baseOrder.quantity = Number(newOrder.quantity);
        } else if (orderType === 'color_change' && newOrder.color_change_details) {
            baseOrder.color_change_details = newOrder.color_change_details;
        } else if (orderType === 'cleaning' && newOrder.cleaning_details) {
            baseOrder.cleaning_details = newOrder.cleaning_details;
        } else if (orderType === 'preventive_maintenance' && newOrder.maintenance_details) {
            baseOrder.maintenance_details = newOrder.maintenance_details;
        } else if (orderType === 'tool_change' && newOrder.tool_change_details) {
            baseOrder.tool_change_details = newOrder.tool_change_details;
        } else if (orderType === 'quality_control' && newOrder.quality_control_details) {
            baseOrder.quality_control_details = newOrder.quality_control_details;
        }

        onUpdate([...orders, baseOrder]);
        resetForm();
    };

    const handleDelete = (id: string) => {
        if (confirm('Remove this order?')) {
            onUpdate(orders.filter(o => o.id !== id));
        }
    };

    const renderTypeSpecificFields = () => {
        const orderType = newOrder.type || 'production';

        switch (orderType) {
            case 'production':
                return (
                    <>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">{t('orders.select_product')}</label>
                            <select
                                className="w-full p-2 text-sm border border-slate-300 rounded-lg"
                                value={newOrder.product_id || ''}
                                onChange={e => setNewOrder({ ...newOrder, product_id: e.target.value })}
                            >
                                <option value="">{t('orders.select_product')}</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">{tCommon('common.quantity')}</label>
                            <input
                                type="number"
                                className="w-full p-2 text-sm border border-slate-300 rounded-lg"
                                value={newOrder.quantity || 100}
                                onChange={e => setNewOrder({ ...newOrder, quantity: Number(e.target.value) })}
                            />
                        </div>
                    </>
                );

            case 'color_change':
                return (
                    <>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Machine</label>
                            <select
                                className="w-full p-2 text-sm border border-slate-300 rounded-lg"
                                value={newOrder.color_change_details?.machine_id || ''}
                                onChange={e => setNewOrder({
                                    ...newOrder,
                                    color_change_details: { ...newOrder.color_change_details!, machine_id: e.target.value }
                                })}
                            >
                                <option value="">Select Machine...</option>
                                {machines.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">From Color</label>
                            <input
                                type="text"
                                className="w-full p-2 text-sm border border-slate-300 rounded-lg"
                                value={newOrder.color_change_details?.from_color || ''}
                                onChange={e => setNewOrder({
                                    ...newOrder,
                                    color_change_details: { ...newOrder.color_change_details!, from_color: e.target.value }
                                })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">To Color</label>
                            <input
                                type="text"
                                className="w-full p-2 text-sm border border-slate-300 rounded-lg"
                                value={newOrder.color_change_details?.to_color || ''}
                                onChange={e => setNewOrder({
                                    ...newOrder,
                                    color_change_details: { ...newOrder.color_change_details!, to_color: e.target.value }
                                })}
                            />
                        </div>
                    </>
                );

            case 'cleaning':
                return (
                    <>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Machine</label>
                            <select
                                className="w-full p-2 text-sm border border-slate-300 rounded-lg"
                                value={newOrder.cleaning_details?.machine_id || ''}
                                onChange={e => setNewOrder({
                                    ...newOrder,
                                    cleaning_details: { ...newOrder.cleaning_details!, machine_id: e.target.value }
                                })}
                            >
                                <option value="">Select Machine...</option>
                                {machines.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">{tCommon('common.duration')} (min)</label>
                            <input
                                type="number"
                                className="w-full p-2 text-sm border border-slate-300 rounded-lg"
                                value={newOrder.cleaning_details?.estimated_duration || 30}
                                onChange={e => setNewOrder({
                                    ...newOrder,
                                    cleaning_details: { ...newOrder.cleaning_details!, estimated_duration: Number(e.target.value) }
                                })}
                            />
                        </div>
                    </>
                );

            case 'preventive_maintenance':
                return (
                    <>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Machine</label>
                            <select
                                className="w-full p-2 text-sm border border-slate-300 rounded-lg"
                                value={newOrder.maintenance_details?.machine_id || ''}
                                onChange={e => setNewOrder({
                                    ...newOrder,
                                    maintenance_details: { ...newOrder.maintenance_details!, machine_id: e.target.value }
                                })}
                            >
                                <option value="">Select Machine...</option>
                                {machines.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">{tCommon('common.type')}</label>
                            <input
                                type="text"
                                placeholder="e.g., Oil change, Filter replacement"
                                className="w-full p-2 text-sm border border-slate-300 rounded-lg"
                                value={newOrder.maintenance_details?.maintenance_type || ''}
                                onChange={e => setNewOrder({
                                    ...newOrder,
                                    maintenance_details: { ...newOrder.maintenance_details!, maintenance_type: e.target.value }
                                })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">{tCommon('common.duration')} (min)</label>
                            <input
                                type="number"
                                className="w-full p-2 text-sm border border-slate-300 rounded-lg"
                                value={newOrder.maintenance_details?.estimated_duration || 60}
                                onChange={e => setNewOrder({
                                    ...newOrder,
                                    maintenance_details: { ...newOrder.maintenance_details!, estimated_duration: Number(e.target.value) }
                                })}
                            />
                        </div>
                    </>
                );

            case 'tool_change':
                return (
                    <>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Machine</label>
                            <select
                                className="w-full p-2 text-sm border border-slate-300 rounded-lg"
                                value={newOrder.tool_change_details?.machine_id || ''}
                                onChange={e => setNewOrder({
                                    ...newOrder,
                                    tool_change_details: { ...newOrder.tool_change_details!, machine_id: e.target.value }
                                })}
                            >
                                <option value="">Select Machine...</option>
                                {machines.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">To Tool</label>
                            <input
                                type="text"
                                className="w-full p-2 text-sm border border-slate-300 rounded-lg"
                                value={newOrder.tool_change_details?.to_tool || ''}
                                onChange={e => setNewOrder({
                                    ...newOrder,
                                    tool_change_details: { ...newOrder.tool_change_details!, to_tool: e.target.value }
                                })}
                            />
                        </div>
                    </>
                );

            case 'quality_control':
                return (
                    <>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Product</label>
                            <select
                                className="w-full p-2 text-sm border border-slate-300 rounded-lg"
                                value={newOrder.quality_control_details?.product_id || ''}
                                onChange={e => setNewOrder({
                                    ...newOrder,
                                    quality_control_details: { ...newOrder.quality_control_details!, product_id: e.target.value }
                                })}
                            >
                                <option value="">Select Product...</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Sample Size</label>
                            <input
                                type="number"
                                className="w-full p-2 text-sm border border-slate-300 rounded-lg"
                                value={newOrder.quality_control_details?.sample_size || 10}
                                onChange={e => setNewOrder({
                                    ...newOrder,
                                    quality_control_details: { ...newOrder.quality_control_details!, sample_size: Number(e.target.value) }
                                })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">{tCommon('common.duration')} (min)</label>
                            <input
                                type="number"
                                className="w-full p-2 text-sm border border-slate-300 rounded-lg"
                                value={newOrder.quality_control_details?.estimated_duration || 30}
                                onChange={e => setNewOrder({
                                    ...newOrder,
                                    quality_control_details: { ...newOrder.quality_control_details!, estimated_duration: Number(e.target.value) }
                                })}
                            />
                        </div>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Package className="text-indigo-600" size={20} />
                        {t('orders.title')}
                    </h3>
                    <p className="text-sm text-slate-500">Define daily production demand</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                >
                    <Plus size={16} /> {t('orders.add_order')}
                </button>
            </div>

            {/* Add Form */}
            {isAdding && (
                <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-indigo-100 animate-in slide-in-from-top-2">
                    <h4 className="text-sm font-bold text-slate-700 mb-3">New Order</h4>

                    {/* Order Type Selector */}
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-slate-500 mb-2">{t('orders.order_type')}</label>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                            {(['production', 'color_change', 'cleaning', 'preventive_maintenance', 'tool_change', 'quality_control'] as OrderType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setNewOrder({ ...newOrder, type })}
                                    className={`p-2 rounded-lg border-2 text-xs font-semibold transition-all flex flex-col items-center gap-1 ${newOrder.type === type
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                        }`}
                                >
                                    {ORDER_TYPE_ICONS[type]}
                                    <span className="text-[10px]">{t('order_types.' + type)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        {renderTypeSpecificFields()}

                        {/* Common Fields */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">{tCommon('common.deadline')}</label>
                            <input
                                type="date"
                                className="w-full p-2 text-sm border border-slate-300 rounded-lg"
                                value={newOrder.deadline || ''}
                                onChange={e => setNewOrder({ ...newOrder, deadline: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">{tCommon('common.priority')}</label>
                            <select
                                className="w-full p-2 text-sm border border-slate-300 rounded-lg"
                                value={newOrder.priority}
                                onChange={e => setNewOrder({ ...newOrder, priority: e.target.value as 'low' | 'normal' | 'high' | 'urgent' })}
                            >
                                <option value="low">{tCommon('priority.low')}</option>
                                <option value="normal">{tCommon('priority.normal')}</option>
                                <option value="high">{tCommon('priority.high')}</option>
                                <option value="urgent">{tCommon('priority.urgent')}</option>
                            </select>
                        </div>
                        <div className="flex gap-2 md:col-span-5">
                            <button onClick={handleAdd} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold">{tCommon('actions.add')}</button>
                            <button onClick={resetForm} className="px-6 py-2 text-slate-500 hover:bg-slate-200 rounded-lg">{tCommon('actions.cancel')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {orders.length === 0 && !isAdding && (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-400 text-sm">{t('orders.no_orders')}</p>
                </div>
            )}

            {/* Table */}
            {orders.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">{tCommon('common.type')}</th>
                                <th className="px-4 py-3">{tCommon('common.description')}</th>
                                <th className="px-4 py-3">{tCommon('common.deadline')}</th>
                                <th className="px-4 py-3">{tCommon('common.priority')}</th>
                                <th className="px-4 py-3 text-right">{tCommon('actions.delete')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => {
                                let description = '';
                                if (order.type === 'production') {
                                    description = `${order.product_name} (x${order.quantity})`;
                                } else if (order.type === 'color_change') {
                                    description = `${order.color_change_details?.from_color} → ${order.color_change_details?.to_color}`;
                                } else if (order.type === 'cleaning') {
                                    description = `Machine: ${machines.find(m => m.id === order.cleaning_details?.machine_id)?.name || order.cleaning_details?.machine_id}`;
                                } else if (order.type === 'preventive_maintenance') {
                                    description = `${order.maintenance_details?.maintenance_type} (${order.maintenance_details?.estimated_duration}min)`;
                                } else if (order.type === 'tool_change') {
                                    description = `Tool: ${order.tool_change_details?.to_tool}`;
                                } else if (order.type === 'quality_control') {
                                    description = `Sample: ${order.quality_control_details?.sample_size}`;
                                }

                                return (
                                    <tr key={order.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {ORDER_TYPE_ICONS[order.type]}
                                                <span className="text-xs font-semibold">{t('order_types.' + order.type)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-800">{description}</td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {order.deadline ? (
                                                <span className="flex items-center gap-1"><Calendar size={12} /> {order.deadline}</span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={order.priority}
                                                onChange={(e) => {
                                                    const newPriority = e.target.value as 'low' | 'normal' | 'high' | 'urgent';
                                                    const updated = orders.map(o =>
                                                        o.id === order.id ? { ...o, priority: newPriority } : o
                                                    );
                                                    onUpdate(updated);
                                                }}
                                                className={`px-2 py-1 rounded-full text-xs font-bold border-none cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 outline-none appearance-none pr-6 bg-no-repeat bg-[center_right_0.5rem] ${order.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                                    order.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                                                        order.priority === 'low' ? 'bg-slate-100 text-slate-600' :
                                                            'bg-emerald-100 text-emerald-700'
                                                    }`}
                                                style={{
                                                    // Cheap way to hide arrow or style it if needed, using unicode arrow for simplicity
                                                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`
                                                }}
                                            >
                                                <option value="low" className="bg-white text-slate-600">LOW</option>
                                                <option value="normal" className="bg-white text-emerald-600">NORMAL</option>
                                                <option value="high" className="bg-white text-amber-600">HIGH</option>
                                                <option value="urgent" className="bg-white text-red-600">URGENT</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDelete(order.id)}
                                                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
