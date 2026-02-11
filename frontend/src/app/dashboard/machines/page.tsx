'use client';

import { useEffect, useState } from 'react';
import { gateway } from '@/services/gateway';
import { Machine, FactoryConfig } from '@/types/factory';
import { Cpu, Activity, Plus, Loader2, Trash2, Edit2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useProductionState } from '@/contexts/ProductionStateContext';

export default function MachinesPage() {
    const { state: { activeConfig, isLoading: loading }, updateConfig } = useProductionState();
    const [isEditing, setIsEditing] = useState(false);
    const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
    const [configId, setConfigId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Machine>({
        id: '',
        name: '',
        capabilities: [],
        description: ''
    });
    const [capabilityInput, setCapabilityInput] = useState('');

    useEffect(() => {
        // Fetch config once to get the document ID for updateData (the context doesn't expose the ID)
        // Note: ProductionStateContext loads the data, but we need the DB _id for gateway.updateData
        const fetchId = async () => {
            try {
                const result = await gateway.getAllData('active_factory_config');
                if (result.results && result.results.length > 0) {
                    const latest = result.results.sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )[0];
                    setConfigId(latest._id);

                    // Optional: Fix machines without IDs (Context doesn't do this)
                    // ... (keeping existing fix logic if needed)
                }
            } catch (e) {
                console.error("Failed to fetch config ID", e);
            }
        };
        fetchId();
    }, []);

    const handleAddNew = () => {
        setFormData({
            id: `machine-${Date.now()}`,
            name: '',
            capabilities: [],
            description: ''
        });
        setEditingMachine(null);
        setIsEditing(true);
    };

    const handleEdit = (machine: Machine) => {
        setFormData({ ...machine });
        setEditingMachine(machine);
        setIsEditing(true);
    };

    const handleSave = async () => {
        console.log("=== MACHINE SAVE START ===");
        if (!formData.name.trim()) {
            alert('Machine name is required');
            return;
        }

        // Deep clone to avoid mutation issues
        const updatedConfig: FactoryConfig = activeConfig
            ? JSON.parse(JSON.stringify(activeConfig))
            : {
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

        console.log("Current config before update:", JSON.stringify(updatedConfig, null, 2));
        console.log("Form data:", formData);
        console.log("Editing machine:", editingMachine);

        if (editingMachine) {
            // Update existing
            const idx = updatedConfig.machines.findIndex(m => m.id === editingMachine.id);
            console.log("Found machine at index:", idx);
            if (idx !== -1) {
                updatedConfig.machines[idx] = formData;
            }
        } else {
            // Add new
            updatedConfig.machines.push(formData);
        }

        console.log("Updated config after change:", JSON.stringify(updatedConfig, null, 2));
        console.log("Config ID for update:", configId);

        try {
            await updateConfig(updatedConfig);
            setIsEditing(false);
            console.log("=== MACHINE SAVE SUCCESS ===");
        } catch (e) {
            console.error('=== MACHINE SAVE ERROR ===', e);
            alert('Failed to save machine');
        }
    };

    const handleDelete = async (machine: Machine) => {
        if (!confirm(`Delete machine "${machine.name}"?`)) return;

        console.log("=== MACHINE DELETE START ===");
        console.log("Machine to delete:", machine);
        console.log("Current activeConfig:", JSON.stringify(activeConfig, null, 2));
        console.log("Config ID:", configId);

        // Deep clone to avoid mutation issues
        const updatedConfig = JSON.parse(JSON.stringify(activeConfig!));
        console.log("Machines before filter:", updatedConfig.machines);

        updatedConfig.machines = updatedConfig.machines.filter((m: Machine) => m.id !== machine.id);
        console.log("Machines after filter:", updatedConfig.machines);
        console.log("Updated config to save:", JSON.stringify(updatedConfig, null, 2));

        try {
            await updateConfig(updatedConfig);
            console.log("=== MACHINE DELETE SUCCESS ===");
        } catch (e) {
            console.error('=== MACHINE DELETE ERROR ===', e);
        }
    };

    const addCapability = () => {
        if (capabilityInput.trim() && !formData.capabilities.includes(capabilityInput.trim())) {
            setFormData({
                ...formData,
                capabilities: [...formData.capabilities, capabilityInput.trim()]
            });
            setCapabilityInput('');
        }
    };

    const removeCapability = (cap: string) => {
        setFormData({
            ...formData,
            capabilities: formData.capabilities.filter(c => c !== cap)
        });
    };

    const machines = activeConfig?.machines || [];

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600">
                        Factory Floor
                    </h2>
                    <p className="text-slate-500 mt-2 text-lg">Manage your production assets and capabilities.</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
                >
                    <Plus size={20} /> Add Machine
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center h-64 items-center">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                </div>
            ) : machines.length === 0 ? (
                <div className="bg-white/50 backdrop-blur-xl border border-white/20 rounded-3xl p-12 text-center text-slate-500">
                    <Cpu size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-xl font-medium">No machines configured yet.</p>
                    <p className="mt-2">Click "Add Machine" to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {machines.map((machine, idx) => (
                        <motion.div
                            key={`machine-${machine.id}-${idx}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group relative bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-slate-200/50 p-6 rounded-3xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                        >
                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button
                                    onClick={() => handleEdit(machine)}
                                    className="p-2 bg-slate-100 rounded-full hover:bg-blue-50 text-slate-400 hover:text-blue-600"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(machine)}
                                    className="p-2 bg-slate-100 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4">
                                <Cpu size={28} />
                            </div>

                            <h3 className="text-xl font-bold text-slate-800">{machine.name}</h3>
                            <p className="text-slate-500 text-sm mt-1 mb-4">{machine.description || "Operational"}</p>

                            <div className="flex flex-wrap gap-2">
                                {machine.capabilities.map((cap, i) => (
                                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                                        {cap}
                                    </span>
                                ))}
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-400">
                                <Activity size={16} className="text-green-500" />
                                <span>Ready for production</span>
                            </div>
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
                            className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-slate-800">
                                    {editingMachine ? 'Edit Machine' : 'New Machine'}
                                </h3>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Machine Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., CNC Machine Alpha"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={3}
                                        placeholder="Optional description..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Capabilities</label>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={capabilityInput}
                                            onChange={e => setCapabilityInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCapability())}
                                            className="flex-1 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Fraisage, Tournage..."
                                        />
                                        <button
                                            onClick={addCapability}
                                            className="px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.capabilities.map((cap, i) => (
                                            <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full border border-blue-100 flex items-center gap-2">
                                                {cap}
                                                <button onClick={() => removeCapability(cap)} className="hover:text-red-600">
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={handleSave}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-all"
                                >
                                    {editingMachine ? 'Save Changes' : 'Create Machine'}
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
