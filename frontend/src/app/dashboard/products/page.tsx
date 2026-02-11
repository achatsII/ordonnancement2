'use client';

import { useEffect, useState } from 'react';
import { gateway } from '@/services/gateway';
import { FactoryConfig, Job, Operation } from '@/types/factory';
import { Package, Plus, Loader2, Trash2, Edit2, X, ChevronDown, ChevronUp, Clock, Cog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PRIORITY_COLORS = {
    urgent: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-amber-100 text-amber-700 border-amber-200',
    normal: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    low: 'bg-slate-100 text-slate-600 border-slate-200'
};

export default function ProductsPage() {
    const [activeConfig, setActiveConfig] = useState<FactoryConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [expandedJob, setExpandedJob] = useState<string | null>(null);

    const [formData, setFormData] = useState<Job>({
        id: '',
        name: '',
        priority: 'normal',
        operations: []
    });

    const [operationForm, setOperationForm] = useState<Partial<Operation>>({
        name: '',
        machine_capability_required: '',
        duration_minutes: 10
    });

    const [configId, setConfigId] = useState<string | null>(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        console.log("=== PRODUCTS: LOAD CONFIG START ===");
        try {
            const result = await gateway.getAllData('active_factory_config');
            console.log("getAllData result:", result);
            console.log("Number of config documents:", result.results?.length || 0);
            
            if (result.results && result.results.length > 0) {
                result.results.forEach((doc: any, idx: number) => {
                    console.log(`Document ${idx}:`, {
                        _id: doc._id,
                        created_at: doc.created_at,
                        machines_count: doc.json_data?.machines?.length || 0,
                        products_count: doc.json_data?.typical_jobs?.length || 0
                    });
                });
                
                const latest = result.results.sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0];
                console.log("Selected latest document ID:", latest._id);
                console.log("Products (typical_jobs):", latest.json_data?.typical_jobs);
                
                setActiveConfig(latest.json_data || latest);
                setConfigId(latest._id);
            } else {
                console.log("No config documents found");
            }
            console.log("=== PRODUCTS: LOAD CONFIG END ===");
        } catch (e) {
            console.error("=== PRODUCTS: LOAD CONFIG ERROR ===", e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNew = () => {
        setFormData({
            id: `product-${Date.now()}`,
            name: '',
            priority: 'normal',
            operations: []
        });
        setEditingJob(null);
        setIsEditing(true);
    };

    const handleEdit = (job: Job) => {
        setFormData({ ...job });
        setEditingJob(job);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            alert('Product name is required');
            return;
        }

        if (formData.operations.length === 0) {
            alert('At least one operation is required');
            return;
        }

        const updatedConfig: FactoryConfig = activeConfig || {
            machines: [],
            operators: [],
            constraints: {
                setup_times: [],
                temporal: [],
                auxiliary_resources: [],
                multi_operator: [],
                batching: [],
                maintenance: []
            },
            typical_jobs: []
        };

        if (editingJob) {
            const idx = updatedConfig.typical_jobs.findIndex(j => j.id === editingJob.id);
            if (idx !== -1) {
                updatedConfig.typical_jobs[idx] = formData;
            }
        } else {
            updatedConfig.typical_jobs.push(formData);
        }

        console.log("=== PRODUCT SAVE ===");
        console.log("Config ID:", configId);
        console.log("Updated config:", JSON.stringify(updatedConfig, null, 2));

        try {
            // Update existing document instead of creating new
            if (configId) {
                console.log("Updating existing document:", configId);
                const result = await gateway.updateData('active_factory_config', configId, updatedConfig);
                console.log("Update result:", result);
            } else {
                console.log("Creating new document");
                const result = await gateway.saveData('active_factory_config', updatedConfig, 'Factory Configuration');
                console.log("Save result:", result);
                if (result.results?.[0]?.inserted_id) {
                    setConfigId(result.results[0].inserted_id);
                }
            }
            setActiveConfig(updatedConfig);
            setIsEditing(false);
            console.log("=== PRODUCT SAVE SUCCESS ===");
        } catch (e) {
            console.error('=== PRODUCT SAVE ERROR ===', e);
            alert('Failed to save product');
        }
    };

    const handleDelete = async (job: Job) => {
        if (!confirm(`Delete product "${job.name}"?`)) return;

        console.log("=== PRODUCT DELETE START ===");
        console.log("Product to delete:", job);
        console.log("Config ID:", configId);

        // Deep clone to avoid mutation issues
        const updatedConfig = JSON.parse(JSON.stringify(activeConfig!));
        console.log("Products before filter:", updatedConfig.typical_jobs);
        
        updatedConfig.typical_jobs = updatedConfig.typical_jobs.filter((j: Job) => j.id !== job.id);
        console.log("Products after filter:", updatedConfig.typical_jobs);

        try {
            // Update existing document instead of creating new
            if (configId) {
                console.log("Updating existing document:", configId);
                const result = await gateway.updateData('active_factory_config', configId, updatedConfig);
                console.log("Update result:", result);
            } else {
                console.log("Creating new document");
                const result = await gateway.saveData('active_factory_config', updatedConfig, 'Factory Configuration');
                console.log("Save result:", result);
            }
            setActiveConfig(updatedConfig);
            console.log("=== PRODUCT DELETE SUCCESS ===");
        } catch (e) {
            console.error('=== PRODUCT DELETE ERROR ===', e);
        }
    };

    const addOperation = () => {
        if (!operationForm.name?.trim() || !operationForm.machine_capability_required?.trim()) {
            alert('Operation name and required capability are mandatory');
            return;
        }

        const newOp: Operation = {
            id: `op-${Date.now()}`,
            name: operationForm.name,
            machine_capability_required: operationForm.machine_capability_required,
            duration_minutes: operationForm.duration_minutes || 10
        };

        setFormData({
            ...formData,
            operations: [...formData.operations, newOp]
        });

        setOperationForm({
            name: '',
            machine_capability_required: '',
            duration_minutes: 10
        });
    };

    const removeOperation = (opId: string) => {
        setFormData({
            ...formData,
            operations: formData.operations.filter(op => op.id !== opId)
        });
    };

    const moveOperation = (index: number, direction: 'up' | 'down') => {
        const newOps = [...formData.operations];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newOps.length) return;
        [newOps[index], newOps[newIndex]] = [newOps[newIndex], newOps[index]];
        setFormData({ ...formData, operations: newOps });
    };

    const jobs = activeConfig?.typical_jobs || [];
    const capabilities = activeConfig?.machines?.flatMap(m => m.capabilities) || [];
    const uniqueCapabilities = [...new Set(capabilities)];

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600">
                        Product Catalog
                    </h2>
                    <p className="text-slate-500 mt-2 text-lg">Define your products and their manufacturing operations.</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                >
                    <Plus size={20} /> Add Product
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center h-64 items-center">
                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                </div>
            ) : jobs.length === 0 ? (
                <div className="bg-white/50 backdrop-blur-xl border border-white/20 rounded-3xl p-12 text-center text-slate-500">
                    <Package size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-xl font-medium">No products defined yet.</p>
                    <p className="mt-2">Add products to create production orders and generate schedules.</p>
                    <button
                        onClick={handleAddNew}
                        className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all"
                    >
                        Create Your First Product
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {jobs.map((job, idx) => (
                        <motion.div
                            key={`job-${job.id}-${idx}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden"
                        >
                            <div 
                                className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                                onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                        <Package size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">{job.name}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${PRIORITY_COLORS[job.priority]}`}>
                                                {job.priority.toUpperCase()}
                                            </span>
                                            <span className="text-sm text-slate-500 flex items-center gap-1">
                                                <Cog size={14} /> {job.operations.length} operations
                                            </span>
                                            <span className="text-sm text-slate-500 flex items-center gap-1">
                                                <Clock size={14} /> {job.operations.reduce((sum, op) => sum + op.duration_minutes, 0)} min total
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEdit(job); }}
                                        className="p-2 bg-slate-100 rounded-full hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(job); }}
                                        className="p-2 bg-slate-100 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    {expandedJob === job.id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                </div>
                            </div>

                            <AnimatePresence>
                                {expandedJob === job.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-slate-100 bg-slate-50/50"
                                    >
                                        <div className="p-6">
                                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Operations Sequence</h4>
                                            <div className="space-y-2">
                                                {job.operations.map((op, i) => (
                                                    <div key={op.id} className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-100">
                                                        <span className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold">
                                                            {i + 1}
                                                        </span>
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-slate-700">{op.name}</p>
                                                            <p className="text-xs text-slate-400">Requires: {op.machine_capability_required}</p>
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-500">{op.duration_minutes} min</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setIsEditing(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-slate-800">
                                    {editingJob ? 'Edit Product' : 'New Product'}
                                </h3>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Product Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="e.g., Déodorant Classique"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Default Priority</label>
                                        <select
                                            value={formData.priority}
                                            onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                                            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        >
                                            <option value="low">Low</option>
                                            <option value="normal">Normal</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Operations */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                                        Manufacturing Operations *
                                    </label>
                                    
                                    {/* Operations List */}
                                    {formData.operations.length > 0 && (
                                        <div className="space-y-2 mb-4">
                                            {formData.operations.map((op, i) => (
                                                <div key={op.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                                    <div className="flex flex-col gap-1">
                                                        <button 
                                                            onClick={() => moveOperation(i, 'up')}
                                                            disabled={i === 0}
                                                            className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                                                        >
                                                            <ChevronUp size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => moveOperation(i, 'down')}
                                                            disabled={i === formData.operations.length - 1}
                                                            className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                                                        >
                                                            <ChevronDown size={14} />
                                                        </button>
                                                    </div>
                                                    <span className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold">
                                                        {i + 1}
                                                    </span>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-slate-700">{op.name}</p>
                                                        <p className="text-xs text-slate-400">Requires: {op.machine_capability_required} • {op.duration_minutes} min</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => removeOperation(op.id)}
                                                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add Operation Form */}
                                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                                        <h4 className="text-sm font-bold text-indigo-800 mb-3">Add Operation</h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            <input
                                                type="text"
                                                value={operationForm.name || ''}
                                                onChange={e => setOperationForm({ ...operationForm, name: e.target.value })}
                                                className="p-2 border border-slate-300 rounded-lg text-sm"
                                                placeholder="Operation name"
                                            />
                                            <select
                                                value={operationForm.machine_capability_required || ''}
                                                onChange={e => setOperationForm({ ...operationForm, machine_capability_required: e.target.value })}
                                                className="p-2 border border-slate-300 rounded-lg text-sm"
                                            >
                                                <option value="">Required capability...</option>
                                                {uniqueCapabilities.map(cap => (
                                                    <option key={cap} value={cap}>{cap}</option>
                                                ))}
                                                <option value="__custom">+ Custom...</option>
                                            </select>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    value={operationForm.duration_minutes || 10}
                                                    onChange={e => setOperationForm({ ...operationForm, duration_minutes: Number(e.target.value) })}
                                                    className="w-20 p-2 border border-slate-300 rounded-lg text-sm"
                                                    placeholder="Min"
                                                />
                                                <button
                                                    onClick={addOperation}
                                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                        {operationForm.machine_capability_required === '__custom' && (
                                            <input
                                                type="text"
                                                className="mt-2 w-full p-2 border border-slate-300 rounded-lg text-sm"
                                                placeholder="Enter custom capability..."
                                                onChange={e => setOperationForm({ ...operationForm, machine_capability_required: e.target.value })}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={handleSave}
                                    disabled={!formData.name || formData.operations.length === 0}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editingJob ? 'Save Changes' : 'Create Product'}
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
