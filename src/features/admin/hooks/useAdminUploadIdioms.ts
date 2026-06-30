import { useMutation } from '@tanstack/react-query';
import { fetchIdiomsByV1Ids, fetchIdiomsByPhrases, insertIdioms, fetchIdiomByPhraseOrId, updateIdiom } from '../api/adminIdiomsApi';

export const useFetchIdiomsByV1Ids = () => {
    return useMutation({
        mutationFn: fetchIdiomsByV1Ids
    });
};

export const useFetchIdiomsByPhrases = () => {
    return useMutation({
        mutationFn: fetchIdiomsByPhrases
    });
};

export const useInsertIdioms = () => {
    return useMutation({
        mutationFn: insertIdioms
    });
};

export const useFetchIdiomByPhraseOrId = () => {
    return useMutation({
        mutationFn: fetchIdiomByPhraseOrId
    });
};

export const useUpdateIdiom = () => {
    return useMutation({
        mutationFn: updateIdiom
    });
};
