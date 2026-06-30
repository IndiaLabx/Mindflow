import { supabase } from '../../../lib/supabase';


type ReportStatus = 'pending' | 'being_reviewed' | 'resolved' | 'ignored';

export interface ReportPayload {
  target_id: string;
  target_type?: 'user' | 'post' | 'reel';
  reporter_id: string;
  reason: string;
  custom_note?: string;
  evidence_data: any;
}

export const submitReport = async (payload: ReportPayload) => {
  const { data, error } = await supabase
    .from('reports')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const fetchMyReports = async (reporterId: string) => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('reporter_id', reporterId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const fetchAllReports = async () => {
    const { data, error } = await supabase
        .from('reports')
        .select('*, reporter:profiles!reports_reporter_id_fkey(full_name, username)')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export const updateReportStatus = async (reportId: string, status: ReportStatus, adminConclusion: string | null) => {
    const { data, error } = await supabase
        .from('reports')
        .update({ status, admin_conclusion: adminConclusion })
        .eq('id', reportId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export const deleteContentByAdmin = async (targetId: string, targetType: 'post' | 'reel') => {
    const { error } = await supabase.rpc('delete_content_by_admin', {
        p_target_id: targetId,
        p_target_type: targetType
    });
    if (error) throw error;
};

export const restoreContentByAdmin = async (targetId: string, targetType: 'post' | 'reel') => {
    const { error } = await supabase.rpc('restore_content_by_admin', {
        p_target_id: targetId,
        p_target_type: targetType
    });
    if (error) throw error;
};
