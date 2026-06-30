import { useMutation } from '@tanstack/react-query';
import { fetchQuestionsByIds, insertQuestions, fetchQuestionByV1Id, updateQuestion } from '../api/adminApi';

export const useFetchQuestionsByIds = () => {
    return useMutation({
        mutationFn: fetchQuestionsByIds
    });
};

export const useInsertQuestions = () => {
    return useMutation({
        mutationFn: insertQuestions
    });
};

export const useFetchQuestionByV1Id = () => {
    return useMutation({
        mutationFn: fetchQuestionByV1Id
    });
};

export const useUpdateQuestion = () => {
    return useMutation({
        mutationFn: updateQuestion
    });
};
