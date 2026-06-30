import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useNotification } from '../../../hooks/useNotification';
import { useFlashcardStore } from '../../quiz/stores/useFlashcardStore';

type VocabType = 'idiom' | 'ows' | 'synonym';

interface EditVocabParams {
    id: string;
    type: VocabType;
    updates: Record<string, any>;
}

export const useAdminEditVocab = () => {
    const { showToast } = useNotification();
    const updateCard = useFlashcardStore((state) => state.updateCard);

    return useMutation({
        mutationFn: async ({ id, type, updates }: EditVocabParams) => {
            const { data, error } = await supabase
                .from(type)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                throw new Error(error.message || `Failed to update ${type}`);
            }

            return { id, type, data };
        },
        onSuccess: (result) => {
            showToast({
                title: 'Success',
                message: `Successfully updated ${result.type}`,
                variant: 'success'
            });

            // Map db schema back to app model
            if (updateCard) {
                updateCard(result.id, result.type === 'idiom' ? 'idioms' : result.type === 'ows' ? 'ows' : 'synonyms', result.data);
            }
        },
        onError: (error: any) => {
            console.error('Update error:', error);
            showToast({
                title: 'Error',
                message: error.message || 'Failed to update item',
                variant: 'error'
            });
        }
    });
};
