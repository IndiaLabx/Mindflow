import { useMutation } from '@tanstack/react-query';
import { fetchIdiomsCountByFilter, performIdiomBulkUpdate } from '../api/adminIdiomsApi';

export const useFetchIdiomsCountByFilter = () => {
    return useMutation({
        mutationFn: fetchIdiomsCountByFilter
    });
};

export const usePerformIdiomBulkUpdate = () => {
    return useMutation({
        mutationFn: performIdiomBulkUpdate
    });
};
