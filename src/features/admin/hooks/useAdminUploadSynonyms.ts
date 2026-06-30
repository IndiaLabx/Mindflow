import { useMutation } from '@tanstack/react-query';
import { fetchSynonymsByWords, insertSynonyms, fetchSynonymByWordOrId, updateSynonym } from '../api/adminSynonymsApi';

export const useFetchSynonymsByWords = () => {
    return useMutation({
        mutationFn: fetchSynonymsByWords
    });
};

export const useInsertSynonyms = () => {
    return useMutation({
        mutationFn: insertSynonyms
    });
};

export const useFetchSynonymByWordOrId = () => {
    return useMutation({
        mutationFn: fetchSynonymByWordOrId
    });
};

export const useUpdateSynonym = () => {
    return useMutation({
        mutationFn: updateSynonym
    });
};
