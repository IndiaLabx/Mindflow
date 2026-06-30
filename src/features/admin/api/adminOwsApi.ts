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

export const fetchOwsCountByFilter = async (filters: any[]) => {
    let query: any = supabase.from('ows').select('*', { count: 'exact', head: true });
    query = buildQuery(query, filters);
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
};

export const performOwsBulkUpdate = async ({ filters, targetField, targetValue }: { filters: any[], targetField: string, targetValue: string }) => {
    const updatePayload = { [targetField]: targetValue };
    let query: any = supabase.from('ows').update(updatePayload);
    query = buildQuery(query, filters);

    const { data, error } = await query.select('id');
    if (error) throw error;
    return data;
};

// Upload OWS Queries
export const fetchOwsByV1Ids = async (ids: string[]) => {
    const { data, error } = await supabase.from('ows').select('v1_id').in('v1_id', ids);
    if (error) throw error;
    return data;
};

export const fetchOwsByWords = async (words: string[]) => {
    const { data, error } = await supabase.from('ows').select('word').in('word', words);
    if (error) throw error;
    return data;
};

export const insertOws = async (payload: any[]) => {
    const { error } = await supabase.from('ows').insert(payload);
    if (error) throw error;
    return true;
};

export const fetchOwsByWordOrId = async (searchParam: string) => {
    // Try to find by word first
    let { data, error } = await supabase.from('ows').select('*').eq('word', searchParam).single();
    if (error && error.code === 'PGRST116') {
        // Not found by word, try by v1_id
        const res = await supabase.from('ows').select('*').eq('v1_id', searchParam).single();
        data = res.data;
        error = res.error;
    }

    if (error) throw error;
    return data;
};

export const updateOws = async (payload: any) => {
    if (!payload.id) {
         throw new Error("OWS ID is required for update.");
    }
    const { error } = await supabase.from('ows').update(payload).eq('id', payload.id);
    if (error) throw error;
    return true;
};
