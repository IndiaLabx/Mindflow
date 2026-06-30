import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Filter, Plus, Trash2, Search, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useFetchQuestionsCountByFilter, usePerformBulkUpdate } from '../hooks/useAdminBulkUpdate';
import { useNotification } from '../../../hooks/useNotification';

const FIELDS = [
    { value: 'subject', label: 'Subject' },
    { value: 'topic', label: 'Topic' },
    { value: 'subTopic', label: 'Sub-Topic' },
    { value: 'examName', label: 'Exam Name' },
    { value: 'examYear', label: 'Exam Year' },
    { value: 'examDateShift', label: 'Exam Date/Shift' },
    { value: 'difficulty', label: 'Difficulty' },
    { value: 'questionType', label: 'Question Type' },
];

const OPERATORS = [
    { value: 'eq', label: 'Equals (=)' },
    { value: 'neq', label: 'Not Equals (!=)' },
    { value: 'ilike', label: 'Contains (Case Insensitive)' },
    { value: 'is', label: 'Is (e.g., null)' },
];

interface FilterCondition {
    id: string;
    field: string;
    operator: string;
    value: string;
}

export const AdminBulkUpdate: React.FC = () => {
    const { showToast } = useNotification();
    const fetchCountMutation = useFetchQuestionsCountByFilter();
    const bulkUpdateMutation = usePerformBulkUpdate();

    // Target Update State
    const [targetField, setTargetField] = useState('subject');
    const [targetValue, setTargetValue] = useState('');

    // Filters State
    const [filters, setFilters] = useState<FilterCondition[]>([
        { id: Date.now().toString(), field: 'subject', operator: 'eq', value: '' }
    ]);

    // Process State
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [affectedRows, setAffectedRows] = useState<number | null>(null);

    const addFilter = () => {
        setFilters([...filters, { id: Date.now().toString(), field: 'subject', operator: 'eq', value: '' }]);
    };

    const removeFilter = (id: string) => {
        setFilters(filters.filter(f => f.id !== id));
        setAffectedRows(null);
    };

    const updateFilter = (id: string, key: keyof FilterCondition, val: string) => {
        setFilters(filters.map(f => f.id === id ? { ...f, [key]: val } : f));
        setAffectedRows(null);
    };

    const buildQuery = (queryBuilder: any) => {
        let q = queryBuilder;
        filters.forEach(filter => {
            if (filter.field && filter.value !== undefined) {
                switch (filter.operator) {
                    case 'eq': q = q.eq(filter.field, filter.value); break;
                    case 'neq': q = q.neq(filter.field, filter.value); break;
                    case 'ilike': q = q.ilike(filter.field, `%${filter.value}%`); break;
                    case 'is':
                         if (filter.value.toLowerCase() === 'null') {
                             q = q.is(filter.field, null);
                         } else {
                             q = q.is(filter.field, filter.value);
                         }
                         break;
                }
            }
        });
        return q;
    };

    const handlePreview = async () => {
        setIsPreviewLoading(true);
        setAffectedRows(null);
        try {
            const count = await fetchCountMutation.mutateAsync(filters);
            setAffectedRows(count);
        } catch (error: any) {
            console.error("Preview error", error);
            showToast({ variant: 'error', message: error.message || 'Failed to fetch preview' });
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!targetField) {
            showToast({ variant: 'error', message: 'Target field is required' });
            return;
        }

        const confirmed = window.confirm(`Are you sure you want to update ${affectedRows} rows?`);
        if (!confirmed) return;

        setIsUpdating(true);
        try {
            const data = await bulkUpdateMutation.mutateAsync({ filters, targetField, targetValue });
            showToast({ variant: 'success', message: `Successfully updated ${data.length} rows` });
            setAffectedRows(null);

            // clear target val
            setTargetValue('');
        } catch (error: any) {
            console.error("Update error", error);
            showToast({ variant: 'error', message: error.message || 'Failed to update' });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Database className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">1. What to Update</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Target Field</label>
                        <select
                            value={targetField}
                            onChange={(e) => {
                                setTargetField(e.target.value);
                                setAffectedRows(null);
                            }}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
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
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Filter className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">2. Where Conditions (Granular Filters)</h2>
                    </div>
                    <button
                        onClick={addFilter}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
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
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
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
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
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
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
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
                                <Search className="w-5 h-5 text-blue-400" />
                                <div>
                                    <p className="font-medium">Preview Changes</p>
                                    <p className="text-sm opacity-80">Click preview to see how many questions will be affected.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 text-emerald-400">
                                <CheckCircle className="w-6 h-6" />
                                <div>
                                    <p className="font-bold text-lg">{affectedRows} Questions Found</p>
                                    <p className="text-sm text-slate-300">Ready to update their <span className="font-mono text-emerald-300">{targetField}</span> to <span className="font-mono text-emerald-300">"{targetValue}"</span>.</p>
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
                            className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        </div>
    );
};
