import { db } from '../../../../lib/db';
import { supabase } from '../../../../lib/supabase';
import { InitialFilters } from '../../../../types/models';
import { SynonymWord } from '../../../../features/quiz/types';

export async function fetchSynonymMetadata() {
  let allData: any[] = [];

  // Single fetch to bypass waterfall
  const { data, error } = await supabase
    .from("synonym")
    .select("id, word, exam_name, exam_year, difficulty");

  if (error) {
    console.error("Error fetching Synonym metadata:", error);
  } else if (data) {
    allData = data;
  }

  // Fetch user interactions for read status and spatial engine
  const { data: userData } = await supabase.auth.getUser();
  let userInteractions: Record<string, any> = {};

  if (userData?.user) {
    const { data: interactions, error: intError } = await supabase
      .from("user_synonym_interactions")
      .select("word_id, is_read, status, next_review_at")
      .eq("user_id", userData.user.id);

    if (!intError && interactions) {
      interactions.forEach((int) => {
        userInteractions[String(int.word_id)] = int;
      });
    }

    try {
      if (typeof window !== 'undefined') {
        const localQueueStr = localStorage.getItem('synonyms_swipe_queue');
        if (localQueueStr) {
          const localQueue = JSON.parse(localQueueStr);
          localQueue.forEach((item: any) => {
            const id = String(item.word_id);
            if (!userInteractions[id]) userInteractions[id] = {};
            if (item.status !== undefined) userInteractions[id].status = item.status;
            if (item.is_read !== undefined) userInteractions[id].is_read = item.is_read;
            if (item.next_review !== undefined) userInteractions[id].next_review_at = item.next_review;
          });
        }
      }
    } catch (e) {
      console.error('Failed to merge local queue for Synonyms', e);
    }
  }

  return allData.map((row) => {
    const rowId = String(row.id); // Use standard db id
    const interaction = userInteractions[rowId];

    const phrase = row.word || row.phrase || row.alphabet || "";
    const sourceName = row.exam_name || row.examName || row.source_pdf || row.sourceName || "Unknown";
    const examYear = row.exam_year || row.examYear || "";
    const difficulty = row.difficulty || row.difficulty || "Medium";
    const isRead = row.is_read || row.isRead || (row.knownStatus === 'known');

    return {
      id: rowId, // Return word_id for spatial mapping
      alphabet: phrase ? phrase.charAt(0).toUpperCase() : (row.alphabet || ""),
      examName: sourceName,
      examYear: String(examYear),
      difficulty: difficulty,
      knownStatus: (interaction?.is_read ?? isRead) ? "known" : "unknown",
      status: interaction?.status ?? row.status,
      next_review_at: interaction?.next_review_at ?? row.next_review_at,
    };
  });
}

export async function getFilteredSynonyms(
  filters: InitialFilters,
  selectedAlphabets: string[],
  sessionMode?: 'basic' | 'review',
  finalMatchingIds?: string[]
): Promise<SynonymWord[]> {
  let allData: any[] = [];
  let start = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    let query = supabase.from("synonym").select("*");

    // Hybrid fetching
    if (finalMatchingIds && finalMatchingIds.length > 0 && finalMatchingIds.length <= 1000) {
      query = query.in("id", finalMatchingIds);
    } else {
      if (filters.examName && filters.examName.length > 0) {
        query = query.in("exam_name", filters.examName);
      }
      if (filters.examYear && filters.examYear.length > 0) {
        query = query.in("exam_year", filters.examYear.map(Number));
      }
      if (filters.difficulty && filters.difficulty.length > 0) {
        query = query.in("difficulty", filters.difficulty);
      }
      if (selectedAlphabets && selectedAlphabets.length > 0) {
      const orCondition = selectedAlphabets.map(letter => `word.ilike.${letter}%`).join(",");
      query = query.or(orCondition);
    }
    }

    const { data, error } = await query
      .range(start, start + limit - 1)
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching Synonym data:", error);
      break;
    }

    if (data && data.length > 0) {
      allData = [...allData, ...data];
      start += limit;
      if (data.length < limit) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  let parsedData = allData.map((row) => ({
    id: String(row.id),
    word: row.word || "",
    pos: row.pos || "",
    meaning: row.meaning || "",
    hindiMeaning: row.meaning_hi || "",
    synonyms: typeof row.synonyms === 'string' ? JSON.parse(row.synonyms) : row.synonyms || [],
    antonyms: typeof row.antonyms === 'string' ? JSON.parse(row.antonyms) : row.antonyms || [],
    theme: row.theme || "",
    cluster_id: row.cluster_id || "",
    repetition_raw: row.repetition_raw || "",
    importance_score: row.importance_score || 0,
    lifetime_frequency: row.lifetime_frequency || 0,
    recent_trend: row.recent_trend || 0,
    confusable_with: typeof row.confusable_with === 'string' ? JSON.parse(row.confusable_with) : row.confusable_with || [],
    usage_sentences: typeof row.usage_sentences === 'string' ? JSON.parse(row.usage_sentences) : row.usage_sentences || [],
    exam_name: row.exam_name || "",
    exam_year: row.exam_year || 0,
    difficulty: row.difficulty || "Medium"
  })) as unknown as SynonymWord[];

  // THE SIEVE (Deck Mode Filter & Known Status Filter)
  const { data: userData } = await supabase.auth.getUser();

  const hasDeckFilter = sessionMode === 'review' && filters.reviewModeStatus && filters.reviewModeStatus.length > 0;
  const hasKnownFilter = filters.knownStatus && filters.knownStatus.length > 0;

  if (userData?.user && (hasDeckFilter || hasKnownFilter)) {
    const { data: interactions } = await supabase
      .from("user_synonym_interactions")
      .select("word_id, status, next_review_at, is_read")
      .eq("user_id", userData.user.id);

    const interactMap = new Map();
    if (interactions)
      interactions.forEach((i) => interactMap.set(String(i.word_id), i));

    try {
      if (typeof window !== 'undefined') {
        const localQueueStr = localStorage.getItem('synonyms_swipe_queue');
        if (localQueueStr) {
          const localQueue = JSON.parse(localQueueStr);
          localQueue.forEach((item: any) => {
            const id = String(item.word_id);
            let current = interactMap.get(id) || {};
            if (item.status !== undefined) current.status = item.status;
            if (item.is_read !== undefined) current.is_read = item.is_read;
            if (item.next_review !== undefined) current.next_review_at = item.next_review;
            interactMap.set(id, current);
          });
        }
      }
    } catch (e) {
      console.error('Failed to merge local queue for Synonyms filter', e);
    }

    const mode = hasDeckFilter ? filters.reviewModeStatus![0] : null;

    parsedData = parsedData.filter((card) => {
      // interactMap is keyed by word_id / id
      const userState = interactMap.get(card.id) || interactMap.get(card.word);

      let matchesDeck = true;
      if (mode) {
        if (mode === "Unseen") {
          matchesDeck = !userState || !userState.status;
        } else if (mode === "Mastered") {
          matchesDeck = userState?.status === "mastered";
        } else if (mode === "Review") {
          matchesDeck = userState?.status === "review";
        } else if (mode === "Clueless") {
          matchesDeck = userState?.status === "clueless";
        } else if (mode === "Tricky") {
          matchesDeck = userState?.status === "tricky";
        }
      }

      let matchesKnown = true;
      if (hasKnownFilter) {
        const isKnown = userState?.is_read === true;
        const statusStr = isKnown ? "known" : "unknown";
        matchesKnown = filters.knownStatus!.includes(
          statusStr as "known" | "unknown",
        );
      }

      return matchesDeck && matchesKnown;
    });
  }

  return parsedData;
}
