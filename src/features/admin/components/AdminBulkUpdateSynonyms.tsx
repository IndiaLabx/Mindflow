import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Search, CheckCircle, AlertTriangle, Filter, Loader2 } from 'lucide-react';
import { useNotification } from '../../../hooks/useNotification';
import { useFetchSynonymsCountByFilter, usePerformSynonymBulkUpdate } from '../hooks/useAdminBulkUpdateSynonyms';

interface FilterCondition {
    id: string;
    field: string;
    operator: string;
    value: string;
}

const FIELDS = [
    { value: 'theme', label: 'Theme' },
    { value: 'pos', label: 'Part of Speech' },
    { value: 'cluster_id', label: 'Cluster ID' },
    { value: 'importance_score', label: 'Importance Score' },
    { value: 'lifetime_frequency', label: 'Lifetime Frequency' }
];

const OPERATORS = [
    { value: 'eq', label: 'Equals (=)' },
    { value: 'neq', label: 'Not Equals (!=)' },
    { value: 'ilike', label: 'Contains (Case Insensitive)' },
    { value: 'is', label: 'Is (e.g., NULL)' }
];

export const AdminBulkUpdateSynonyms: React.FC = () => {
    const { showToast } = useNotification();

    // Mutations
    const fetchCountMutation = useFetchSynonymsCountByFilter();
    const bulkUpdateMutation = usePerformSynonymBulkUpdate();

    // State
    const [targetField, setTargetField] = useState(FIELDS[0].value);
    const [targetValue, setTargetValue] = useState('');
    const [filters, setFilters] = useState<FilterCondition[]>([
        { id: '1', field: FIELDS[0].value, operator: 'eq', value: '' }
    ]);
    const [affectedRows, setAffectedRows] = useState<number | null>(null);

    const isPreviewLoading = fetchCountMutation.isPending;
    const isUpdating = bulkUpdateMutation.isPending;

    const addFilter = () => {
        setFilters([...filters, { id: Date.now().toString(), field: FIELDS[0].value, operator: 'eq', value: '' }]);
    };

    const removeFilter = (id: string) => {
        if (filters.length === 1) return;
        setFilters(filters.filter(f => f.id !== id));
        setAffectedRows(null);
    };

    const updateFilter = (id: string, key: keyof FilterCondition, value: string) => {
        setFilters(filters.map(f => f.id === id ? { ...f, [key]: value } : f));
        setAffectedRows(null);
    };

    const handlePreview = async () => {
        try {
            const count = await fetchCountMutation.mutateAsync(filters);
            setAffectedRows(count);
            showToast({ title: "Preview Success", message: `Found ${count} rows matching filters.`, variant: "success" });
        } catch (error: any) {
            console.error("Preview Error:", error);
            showToast({ title: "Preview Failed", message: error.message || "Failed to fetch row count.", variant: "error" });
            setAffectedRows(null);
        }
    };

    const handleUpdate = async () => {
        if (affectedRows === null || affectedRows === 0) {
            showToast({ title: "Action Required", message: "Please preview first and ensure rows > 0.", variant: "warning" });
            return;
        }
        if (!targetValue) {
            showToast({ title: "Action Required", message: "Please provide a target value.", variant: "warning" });
            return;
        }

        const confirmMsg = `WARNING: You are about to update the '${targetField}' field to '${targetValue}' for ${affectedRows} Synonym entries.\n\nThis action cannot be undone. Type 'CONFIRM' to proceed.`;
        const userInput = prompt(confirmMsg);

        if (userInput !== 'CONFIRM') {
            showToast({ title: "Cancelled", message: "Bulk update cancelled.", variant: "info" });
            return;
        }

        try {
            const data = await bulkUpdateMutation.mutateAsync({ filters, targetField, targetValue });
            showToast({ title: "Update Success", message: `Successfully updated ${data.length} Synonym entries.`, variant: "success" });
            setTargetValue('');
            setAffectedRows(null);
        } catch (error: any) {
            console.error("Update Error:", error);
            showToast({ title: "Update Failed", message: error.message || "Failed to update rows.", variant: "error" });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
        >
            <div className="bg-cyan-50/50 dark:bg-cyan-900/10 rounded-2xl p-6 border border-cyan-100 dark:border-cyan-800/50">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-500/20 rounded-xl">
                        <Plus className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">1. Target Action</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">What field do you want to change, and to what value?</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Target Field to Update</label>
                        <select
                            value={targetField}
                            onChange={(e) => setTargetField(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
                        >
                            {FIELDS.map(f => (
                                <option key={f.value} value={f.value}>{f.label} ({f.value})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Value</label>
                        <input
                            type="text"
                            value={targetValue}
                            onChange={(e) => setTargetValue(e.target.value)}
                            placeholder="Enter the new value..."
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Filter className="w-5 h-5 text-teal-500" />
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">2. Where Conditions (Granular Filters)</h2>
                    </div>
                    <button
                        onClick={addFilter}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 text-sm font-medium hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Filter
                    </button>
                </div>

                <div className="space-y-4">
                    <AnimatePresence>
                        {filters.map((filter) => (
                            <motion.div
                                key={filter.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex flex-col md:flex-row gap-3 items-end"
                            >
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Field</label>
                                    <select
                                        value={filter.field}
                                        onChange={(e) => updateFilter(filter.id, 'field', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                                    >
                                        {FIELDS.map(f => (
                                            <option key={f.value} value={f.value}>{f.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-full md:w-48">
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Condition</label>
                                    <select
                                        value={filter.operator}
                                        onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                                    >
                                        {OPERATORS.map(o => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Value</label>
                                    <input
                                        type="text"
                                        value={filter.value}
                                        onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                                        placeholder="Current value..."
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>
                                <button
                                    onClick={() => removeFilter(filter.id)}
                                    disabled={filters.length === 1}
                                    className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {filters.length === 0 && (
                        <div className="text-center py-4 text-sm text-slate-500 dark:text-slate-400">
                            No filters applied. This will update ALL records in the database.
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-800 dark:border-slate-700">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex-1">
                        {affectedRows === null ? (
                            <div className="flex items-center gap-3 text-slate-300">
                                <Search className="w-5 h-5 text-cyan-400" />
                                <div>
                                    <p className="font-medium">Preview Changes</p>
                                    <p className="text-sm opacity-80">Click preview to see how many Synonyms will be affected.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 text-cyan-400">
                                <CheckCircle className="w-6 h-6" />
                                <div>
                                    <p className="font-bold text-lg">{affectedRows} Synonyms Found</p>
                                    <p className="text-sm text-slate-300">Ready to update their <span className="font-mono text-cyan-300">{targetField}</span> to <span className="font-mono text-cyan-300">"{targetValue}"</span>.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={handlePreview}
                            disabled={isPreviewLoading || isUpdating}
                            className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isPreviewLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            Preview
                        </button>

                        <button
                            onClick={handleUpdate}
                            disabled={affectedRows === null || affectedRows === 0 || isUpdating || isPreviewLoading}
                            className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isUpdating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <AlertTriangle className="w-5 h-5" />
                            )}
                            Confirm & Update
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
