import { supabase } from '@/lib/supabase';
import { SavedDeck, VocabType, BridgeSavedDeckItem, UserDeckAnswer, DeckHistory } from '../types';

const getTableName = (type: VocabType, tableType: 'saved_decks' | 'bridge' | 'answers' | 'history') => {
  const map = {
    ows: {
      saved_decks: 'saved_ows_decks',
      bridge: 'bridge_saved_ows',
      answers: 'user_ows_deck_answers',
      history: 'ows_deck_history'
    },
    idiom: {
      saved_decks: 'saved_idiom_decks',
      bridge: 'bridge_saved_idioms',
      answers: 'user_idiom_deck_answers',
      history: 'idiom_deck_history'
    },
    synonym: {
      saved_decks: 'saved_synonym_decks',
      bridge: 'bridge_saved_synonyms',
      answers: 'user_synonym_deck_answers',
      history: 'synonym_deck_history'
    }
  };
  return map[type][tableType];
};

export const deckService = {
  // CREATE
  async createDeck(vocabType: VocabType, deck: Omit<SavedDeck, 'vocab_type'>, wordIds: string[]) {
    const deckTable = getTableName(vocabType, 'saved_decks');
    const bridgeTable = getTableName(vocabType, 'bridge');

    const { error: deckError } = await supabase
      .from(deckTable)
      .insert({
        ...deck,
        filters: deck.filters,
        state: deck.state
      });

    if (deckError) throw deckError;

    const bridgeItems = wordIds.map((wordId, index) => ({
      deck_id: deck.id,
      word_id: wordId,
      user_id: deck.user_id,
      sort_order: index
    }));

    const { error: bridgeError } = await supabase
      .from(bridgeTable)
      .insert(bridgeItems);

    if (bridgeError) {
        // Rollback strategy or just throw
        throw bridgeError;
    }

    return deck.id;
  },

  // READ DECKS
  async getUserDecks(vocabType: VocabType, userId: string): Promise<SavedDeck[]> {
    const deckTable = getTableName(vocabType, 'saved_decks');
    const { data, error } = await supabase
      .from(deckTable)
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(d => ({ ...d, vocab_type: vocabType })) as SavedDeck[];
  },

  // UPDATE DECK STATE
  async updateDeckState(vocabType: VocabType, deckId: string, state: any, status?: string) {
    const deckTable = getTableName(vocabType, 'saved_decks');
    const updateData: any = { state };
    if (status) updateData.status = status;

    const { error } = await supabase
      .from(deckTable)
      .update(updateData)
      .eq('id', deckId);

    if (error) throw error;
  },

  // DELETE DECK (Soft Delete)
  async deleteDeck(vocabType: VocabType, deckId: string) {
    const deckTable = getTableName(vocabType, 'saved_decks');
    const { error } = await supabase
      .from(deckTable)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', deckId);

    if (error) throw error;
  },

  // GET DECK WORDS
  async getDeckWords(vocabType: VocabType, deckId: string) {
    const bridgeTable = getTableName(vocabType, 'bridge');
    // We join the actual words table based on vocabType
    let wordTable = vocabType === 'idiom' ? 'idiom' : vocabType;

    const { data, error } = await supabase
      .from(bridgeTable)
      .select(`
        sort_order,
        word:word_id (*)
      `)
      .eq('deck_id', deckId)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return data.map((d: any) => {
      const row = d.word;

      if (vocabType === 'idiom') {
        return {
          id: String(row.id),
          sourceInfo: {
            pdfName: row.source_pdf || 'Unknown',
            examYear: row.exam_year || 0
          },
          properties: {
            difficulty: row.difficulty || 'Medium',
            status: row.status || 'active'
          },
          content: {
            image_url: row.image_url || undefined,
            phrase: row.phrase || '',
            meanings: {
              english: row.meaning_english || '',
              hindi: row.meaning_hindi || ''
            },
            usage: row.usage || '',
            extras: {
              mnemonic: row.mnemonic || '',
              origin: ''
            }
          }
        };
      }

      if (vocabType === 'ows') {
        return {
          id: String(row.id),
          db_id: String(row.id),
          sourceInfo: {
            pdfName: row.source_pdf || "Unknown",
            examYear: row.exam_year || 0,
          },
          properties: {
            difficulty: row.difficulty || "Medium",
            status: row.status || "active",
            theme: row.theme || undefined,
            importance_score: row.importance_score || undefined,
            repetition_count: row.repetition_count || undefined,
          },
          content: {
            id: row.id ? parseInt(String(row.id).replace(/[^0-9]/g, "")) || 0 : 0,
            image_url: row.image_url || undefined,
            pos: row.pos || "",
            word: row.word || "",
            meaning_en: row.meaning_english || "",
            meaning_hi: row.meaning_hindi || "",
            usage_sentences:
              typeof row.usage_sentences === "string"
                ? JSON.parse(row.usage_sentences)
                : row.usage_sentences || [],
            note: "",
            origin: "",
          },
        };
      }

      if (vocabType === 'synonym') {
        return {
          id: row.id,
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
        };
      }

      return row;
    });
  },

  // SAVE DECK ANSWERS
  async saveDeckAnswers(vocabType: VocabType, answers: Omit<UserDeckAnswer, 'id' | 'created_at'>[]) {
    if (!answers.length) return;
    const answersTable = getTableName(vocabType, 'answers');
    const { error } = await supabase
      .from(answersTable)
      .insert(answers);

    if (error) throw error;
  },

  // SAVE DECK HISTORY
  async saveDeckHistory(vocabType: VocabType, history: Omit<DeckHistory, 'deleted_at'>) {
    const historyTable = getTableName(vocabType, 'history');
    const { error } = await supabase
      .from(historyTable)
      .insert(history);

    if (error) throw error;
  }
};
