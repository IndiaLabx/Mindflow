import { useMutation } from '@tanstack/react-query';
import { fetchOwsByV1Ids, fetchOwsByWords, insertOws, fetchOwsByWordOrId, updateOws } from '../api/adminOwsApi';

export const useFetchOwsByV1Ids = () => {
    return useMutation({
        mutationFn: fetchOwsByV1Ids
    });
};

export const useFetchOwsByWords = () => {
    return useMutation({
        mutationFn: fetchOwsByWords
    });
};

export const useInsertOws = () => {
    return useMutation({
        mutationFn: insertOws
    });
};

export const useFetchOwsByWordOrId = () => {
    return useMutation({
        mutationFn: fetchOwsByWordOrId
    });
};

export const useUpdateOws = () => {
    return useMutation({
        mutationFn: updateOws
    });
};
