'use client';

import { useEffect, useState } from 'react';
import { gateway } from '@/services/gateway';
import { Operator, FactoryConfig } from '@/types/factory';
import { User, Activity, Plus, Loader2, Trash2, Edit2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProductionState } from '@/contexts/ProductionStateContext';

export default function OperatorsPage() {
    const { state: { activeConfig, isLoading: loading }, updateConfig } = useProductionState();
    const [isEditing, setIsEditing] = useState(false);
    const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
    const [configId, setConfigId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Operator>({
        id: '',
        name: '',
        skills: []
    });
    const [skillInput, setSkillInput] = useState('');

    useEffect(() => {
        const fetchId = async () => {
            try {
                const result = await gateway.getAllData('active_factory_config');
                if (result.results && result.results.length > 0) {
                    const latest = result.results.sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )[0];
                    setConfigId(latest._id);
                }
            } catch (e) {
                console.error("Failed to load config ID", e);
            }
        };
        fetchId();
    }, []);

    const handleAddNew = () => {
        setFormData({
            id: `operator-${Date.now()}`,
            name: '',
            skills: []
        });
        setEditingOperator(null);
        setIsEditing(true);
    };

    const handleEdit = (operator: Operator) => {
        setFormData({ ...operator });
        setEditingOperator(operator);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            alert('Operator name is required');
            return;
        }

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

        if (editingOperator) {
            const idx = updatedConfig.operators.findIndex((o: any) => o.id === editingOperator.id);
            if (idx !== -1) {
                updatedConfig.operators[idx] = formData;
            }
        } else {
            updatedConfig.operators.push(formData);
        }

        try {
            await updateConfig(updatedConfig);
            setIsEditing(false);
        } catch (e) {
            console.error('Failed to save operator', e);
            alert('Failed to save operator');
        }
    };

    const handleDelete = async (operator: Operator) => {
        if (!confirm(`Delete operator "${operator.name}"?`)) return;

        const updatedConfig = JSON.parse(JSON.stringify(activeConfig!));
        updatedConfig.operators = updatedConfig.operators.filter((o: Operator) => o.id !== operator.id);

        try {
            await updateConfig(updatedConfig);
        } catch (e) {
            console.error('Failed to delete operator', e);
        }
    };

    const addSkill = () => {
        if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
            setFormData({
                ...formData,
                skills: [...formData.skills, skillInput.trim()]
            });
            setSkillInput('');
        }
    };

    const removeSkill = (skill: string) => {
        setFormData({
            ...formData,
            skills: formData.skills.filter(s => s !== skill)
        });
    };

    const operators = activeConfig?.operators || [];

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600">
                        Human Resources
                    </h2>
                    <p className="text-slate-500 mt-2 text-lg">Manage your production operators and their skill sets.</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                >
                    <Plus size={20} /> Add Operator
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center h-64 items-center">
                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                </div>
            ) : operators.length === 0 ? (
                <div className="bg-white/50 backdrop-blur-xl border border-white/20 rounded-3xl p-12 text-center text-slate-500">
                    <User size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-xl font-medium">No operators defined yet.</p>
                    <p className="mt-2">Click "Add Operator" to define your team.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {operators.map((operator: Operator, idx: number) => (
                        <motion.div
                            key={`operator-${operator.id}-${idx}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group relative bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-slate-200/50 p-6 rounded-3xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                        >
                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button
                                    onClick={() => handleEdit(operator)}
                                    className="p-2 bg-slate-100 rounded-full hover:bg-indigo-50 text-slate-400 hover:text-indigo-600"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(operator)}
                                    className="p-2 bg-slate-100 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4">
                                <User size={28} />
                            </div>

                            <h3 className="text-xl font-bold text-slate-800">{operator.name}</h3>
                            <p className="text-slate-500 text-sm mt-1 mb-4">Production Staff</p>

                            <div className="flex flex-wrap gap-2">
                                {operator.skills.length > 0 ? operator.skills.map((skill: string, i: number) => (
                                    <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
                                        {skill}
                                    </span>
                                )) : (
                                    <span className="text-xs text-slate-400 italic">No specific skills listed</span>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-400">
                                <Activity size={16} className="text-green-500" />
                                <span>Currently Available</span>
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
                                    {editingOperator ? 'Edit Operator' : 'New Operator'}
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
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Operator Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="e.g., Jean Dupont"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Skills / Capabilities</label>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={skillInput}
                                            onChange={e => setSkillInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                            className="flex-1 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="e.g., Welding, CNC, Assembly..."
                                        />
                                        <button
                                            onClick={addSkill}
                                            className="px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.skills.map((skill, i) => (
                                            <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-full border border-indigo-100 flex items-center gap-2">
                                                {skill}
                                                <button onClick={() => removeSkill(skill)} className="hover:text-red-600">
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
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all"
                                >
                                    {editingOperator ? 'Save Changes' : 'Create Operator'}
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
