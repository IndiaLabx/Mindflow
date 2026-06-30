import { supabase } from '../../../lib/supabase';

export const deleteStudyMaterial = async (materialId: string, fileUrl: string): Promise<boolean> => {
    try {
        // 1. Extract file path from URL
        // Example URL: https://[project_id].supabase.co/storage/v1/object/public/study_materials/Class%2010/Science/123-abc.pdf
        const bucketPath = 'study_materials/';
        const bucketIndex = fileUrl.indexOf(bucketPath);

        let filePath = '';
        if (bucketIndex !== -1) {
            filePath = fileUrl.substring(bucketIndex + bucketPath.length);
            // remove query params if any
            filePath = filePath.split('?')[0];
            // URL decode the path components
            filePath = decodeURIComponent(filePath);
        }

        // 2. Delete file from storage if we could extract a path
        if (filePath) {
            const { error: storageError } = await supabase.storage
                .from('study_materials')
                .remove([filePath]);

            if (storageError) {
                console.error("Storage delete error:", storageError);
                // Don't throw here, proceed to delete DB record anyway to prevent orphans
            }
        }

        // 3. Delete from database
        const { error: dbError } = await supabase
            .from('study_materials')
            .delete()
            .eq('id', materialId);

        if (dbError) throw dbError;

        return true;
    } catch (error) {
        console.error("Delete material error:", error);
        throw error;
    }
};
