import { useState, useEffect } from 'react';
import { SynonymWord } from '../../../../features/quiz/types';
import { fetchAllSynonyms } from '../services/synonymService';

export const useSynonymsData = () => {
    const [data, setData] = useState<SynonymWord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            setIsLoading(true);
            try {
                const fetchedData = await fetchAllSynonyms();
                if (isMounted) {
                    setData(fetchedData);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) setError(err as Error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        loadData();
        return () => { isMounted = false; };
    }, []);

    return { data, isLoading, error };
};