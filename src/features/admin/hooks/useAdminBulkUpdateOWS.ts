import { useMutation } from '@tanstack/react-query';
import { fetchOwsCountByFilter, performOwsBulkUpdate } from '../api/adminOwsApi';

export const useFetchOwsCountByFilter = () => {
    return useMutation({
        mutationFn: fetchOwsCountByFilter
    });
};

export const usePerformOwsBulkUpdate = () => {
    return useMutation({
        mutationFn: performOwsBulkUpdate
    });
};
