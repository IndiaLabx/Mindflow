import { useMutation } from '@tanstack/react-query';
import { fetchQuestionsCountByFilter, performBulkUpdate } from '../api/adminApi';

export const useFetchQuestionsCountByFilter = () => {
    return useMutation({
        mutationFn: fetchQuestionsCountByFilter
    });
};

export const usePerformBulkUpdate = () => {
    return useMutation({
        mutationFn: performBulkUpdate
    });
};
