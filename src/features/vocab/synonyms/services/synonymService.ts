import { supabase } from '../../../../lib/supabase';
import { SynonymWord } from '../../../../features/quiz/types';

let synonymCache: SynonymWord[] | null = null;
let fetchPromise: Promise<SynonymWord[]> | null = null;

export const fetchAllSynonyms = async (): Promise<SynonymWord[]> => {
    if (synonymCache) {
        return synonymCache;
    }

    // Use a promise to prevent concurrent identical fetches
    if (fetchPromise) {
        return fetchPromise;
    }

    fetchPromise = (async () => {
        let allData: any[] = [];
        let from = 0;
        const limit = 1000;
        let hasMore = true;

        try {
            while (hasMore) {
                const { data, error } = await supabase
                    .from('synonym')
                    .select('*')
                    .range(from, from + limit - 1);

                if (error) throw error;

                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                    from += limit;
                    if (data.length < limit) hasMore = false;
                } else {
                    hasMore = false;
                }
            }

            const parsedData = allData.map(item => ({
                ...item,
                hindiMeaning: item.meaning_hi || item.hindiMeaning,
                image_url: item.image_url || undefined,
                synonyms: typeof item.synonyms === 'string' ? JSON.parse(item.synonyms) : item.synonyms,
                antonyms: typeof item.antonyms === 'string' ? JSON.parse(item.antonyms) : item.antonyms,
                confusable_with: typeof item.confusable_with === 'string' ? JSON.parse(item.confusable_with) : item.confusable_with
            })) as SynonymWord[];

            synonymCache = parsedData;
            return parsedData;
        } catch (e) {
            console.error("Failed to fetch all synonyms", e);
            return [];
        } finally {
            fetchPromise = null;
        }
    })();

    return fetchPromise;
};
