import { supabase } from '@/lib/supabase';

// Helper to build queries dynamically since it's used in multiple places
const buildQuery = (baseQuery: any, filters: any[]) => {
    let query = baseQuery;
    filters.forEach(f => {
        if (!f.field || !f.operator) return;
        if (f.operator === 'eq') query = query.eq(f.field, f.value);
        if (f.operator === 'neq') query = query.neq(f.field, f.value);
        if (f.operator === 'ilike') query = query.ilike(f.field, `%${f.value}%`);
        if (f.operator === 'is') {
            if (f.value.toLowerCase() === 'null') query = query.is(f.field, null);
        }
    });
    return query;
};

export const fetchQuestionsCountByFilter = async (filters: any[]) => {
    let query: any = supabase.from('questions').select('*', { count: 'exact', head: true });
    query = buildQuery(query, filters);
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
};

export const performBulkUpdate = async ({ filters, targetField, targetValue }: { filters: any[], targetField: string, targetValue: string }) => {
    const updatePayload = { [targetField]: targetValue };
    let query: any = supabase.from('questions').update(updatePayload);
    query = buildQuery(query, filters);

    const { data, error } = await query.select('id');
    if (error) throw error;
    return data;
};

// Upload GK Queries
export const fetchQuestionsByIds = async (ids: string[]) => {
    const { data, error } = await supabase.from('questions').select('v1_id').in('v1_id', ids);
    if (error) throw error;
    return data;
};

export const insertQuestions = async (payload: any[]) => {
    const { error } = await supabase.from('questions').insert(payload);
    if (error) throw error;
    return true;
};

export const fetchQuestionByV1Id = async (v1_id: string) => {
    const { data, error } = await supabase.from('questions').select('*').eq('v1_id', v1_id).single();
    if (error) throw error;
    return data;
};

export const updateQuestion = async (payload: any) => {
    const { id, ...updateData } = payload;
    if (!id) throw new Error("Question ID is missing.");

    const { data, error } = await supabase
        .from('questions')
        .update(updateData)
        .eq('id', id)
        .select();

    if (error) throw error;

    if (!data || data.length === 0) {
        throw new Error("No question found to update or permission denied (silent failure).");
    }

    return true;
};
