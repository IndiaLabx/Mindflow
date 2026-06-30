import { useMutation } from '@tanstack/react-query';
import { fetchSynonymsCountByFilter, performSynonymBulkUpdate } from '../api/adminSynonymsApi';

export const useFetchSynonymsCountByFilter = () => {
    return useMutation({
        mutationFn: fetchSynonymsCountByFilter
    });
};

export const usePerformSynonymBulkUpdate = () => {
    return useMutation({
        mutationFn: performSynonymBulkUpdate
    });
};
