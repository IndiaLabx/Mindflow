export type VocabType = 'ows' | 'idiom' | 'synonym';

export interface SavedDeck {
  id: string;
  user_id: string;
  name: string;
  created_at: number;
  filters: any;
  mode: string;
  state: DeckState;
  deleted_at?: string;
  status: 'active' | 'completed' | 'paused';
  completed_at?: string;
  vocab_type: VocabType;
}

export interface DeckState {
  currentQuestionIndex: number;
  answers: Record<string, string>;
  timeSpent: number;
  isPaused: boolean;
  markedForReview: string[];
}

export interface BridgeSavedDeckItem {
  deck_id: string;
  word_id: string;
  user_id: string;
  sort_order: number;
}

export interface UserDeckAnswer {
  id: string;
  attempt_id: string;
  word_id: string;
  user_id: string;
  selected_status: 'mastered' | 'tricky' | 'review' | 'clueless' | 'unseen';
  time_taken_seconds: number;
  marked_for_review: boolean;
  created_at: string;
}

export interface DeckHistory {
  id: string;
  user_id: string;
  date: number;
  total_words: number;
  total_mastered: number;
  total_tricky: number;
  total_review: number;
  total_clueless: number;
  total_skipped: number;
  total_time_spent: number;
  deck_id: string;
  deleted_at?: string;
}
