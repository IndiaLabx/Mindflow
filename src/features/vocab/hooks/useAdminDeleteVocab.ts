import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useNotification } from '../../../hooks/useNotification';
import { useFlashcardStore } from '../../quiz/stores/useFlashcardStore';

type VocabType = 'idiom' | 'ows' | 'synonym';

interface DeleteVocabParams {
    id: string;
    type: VocabType;
}

export const useAdminDeleteVocab = () => {
    const { showToast } = useNotification();
    const removeCard = useFlashcardStore((state) => state.removeCard);

    return useMutation({
        mutationFn: async ({ id, type }: DeleteVocabParams) => {
            const { error } = await supabase
                .from(type)
                .delete()
                .eq('id', id);

            if (error) {
                throw new Error(error.message || `Failed to delete ${type}`);
            }

            return { id, type };
        },
        onSuccess: (data) => {
            showToast({
                title: 'Success',
                message: `Successfully deleted ${data.type}`,
                variant: 'success'
            });
            // Update local flashcard store to instantly remove it from UI
            removeCard(data.id);
        },
        onError: (error: any) => {
            console.error('Delete error:', error);
            showToast({
                title: 'Error',
                message: error.message || 'Failed to delete item',
                variant: 'error'
            });
        }
    });
};
