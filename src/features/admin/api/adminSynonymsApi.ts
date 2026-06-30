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

export const fetchSynonymsCountByFilter = async (filters: any[]) => {
    let query: any = supabase.from('synonym').select('*', { count: 'exact', head: true });
    query = buildQuery(query, filters);
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
};

export const performSynonymBulkUpdate = async ({ filters, targetField, targetValue }: { filters: any[], targetField: string, targetValue: string }) => {
    const updatePayload = { [targetField]: targetValue };
    let query: any = supabase.from('synonym').update(updatePayload);
    query = buildQuery(query, filters);

    const { data, error } = await query.select('id');
    if (error) throw error;
    return data;
};

// Upload Synonym Queries
export const fetchSynonymsByWords = async (words: string[]) => {
    const { data, error } = await supabase.from('synonym').select('word').in('word', words);
    if (error) throw error;
    return data;
};

export const insertSynonyms = async (payload: any[]) => {
    const { error } = await supabase.from('synonym').insert(payload);
    if (error) throw error;
    return true;
};

export const fetchSynonymByWordOrId = async (searchParam: string) => {
    // Check if it's a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchParam);

    let query = supabase.from('synonym').select('*');
    if (isUUID) {
         query = query.eq('id', searchParam);
    } else {
         query = query.eq('word', searchParam);
    }

    const { data, error } = await query.single();
    if (error) throw error;
    return data;
};

export const updateSynonym = async (payload: any) => {
    if (!payload.id) {
         throw new Error("Synonym ID is required for update.");
    }
    const { error } = await supabase.from('synonym').update(payload).eq('id', payload.id);
    if (error) throw error;
    return true;
};
