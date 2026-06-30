import { Question, InitialFilters, Idiom, OneWord } from '../../../types/models';
import { SynonymWord } from './index';

/**
 * Represents the various distinct screens or states of the application.
 */
export type QuizStatus =
  | 'intro'              // Landing Page
  | 'idle'               // Dashboard
  | 'config'             // General Quiz Configuration
  | 'quiz'               // Active Quiz Session (Question View)
  | 'flashcards'         // Active Idiom Flashcard Session
  | 'flashcards-complete'// Idiom Flashcard Summary
  | 'finalizing'       // RPC finalization in flight
  | 'finalize_failed'  // Finalization failed, retryable
  | 'result'             // Quiz Result Summary
  | 'english-home'       // English Subject Home
  | 'idioms-config'      // Idioms Configuration
  | 'ows-config'         // One Word Substitution Configuration
  | 'synonyms-config'    // Synonyms Configuration
  | 'ows-flashcards'     // Active OWS Flashcard Session
  | 'synonym-flashcards' // Active Synonym Flashcard Session
  | 'synonym-flashcards-complete'
  | 'profile'            // User Profile Screen
  | 'login';             // Auth Screen (if applicable)

/**
 * Modes of the quiz operation.
 * - 'learning': Interactive, immediate feedback, untimed or per-question timer.
 * - 'mock': Exam simulation, global timer, no immediate feedback.
 */
export type QuizMode = 'learning' | 'mock' | 'god';

/**
 * Strictly persistent state that gets saved to the Supabase database.
 * Does not include heavy runtime objects like full question data.
 */
export interface QuizPersistentState {
  quizName?: string;
  isToolbarExpanded?: boolean;
  last_updated?: number;
  currentQuestionIndex: number;
  score: number;
  answers: Record<string, string>;
  timeTaken: Record<string, number>;
  remainingTimes: Record<string, number>;
  quizTimeRemaining: number;
  bookmarks: string[];
  markedForReview: string[];
  hiddenOptions: Record<string, string[]>;
  isPaused?: boolean;
  syncStatus?: SyncStatus;
  quizId?: string;
  status: QuizStatus;
  mode: QuizMode;
}

/**
 * The runtime state used in-memory by Zustand and the UI.
 * Extends persistent state with heavy data arrays and metadata.
 */
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'sync_failed' | 'offline_pending';

export interface QuizRuntimeState extends QuizPersistentState {
  activeQuestions: Question[];
  filters?: InitialFilters;
}

/**
 * Alias for backward compatibility.
 */
export type QuizState = QuizRuntimeState;

/**
 * Discriminated Union of all possible actions for the Quiz Reducer.
 */
export type QuizAction =
  | { type: 'ENTER_HOME' }
  | { type: 'ENTER_CONFIG' }
  | { type: 'ENTER_ENGLISH_HOME' }
  | { type: 'ENTER_VOCAB_HOME' }
  | { type: 'ENTER_IDIOMS_CONFIG' }
  | { type: 'ENTER_OWS_CONFIG' }
  | { type: 'ENTER_SYNONYMS_CONFIG' }
  | { type: 'ENTER_PROFILE' }
  | { type: 'ENTER_LOGIN' }
  | { type: 'GO_TO_INTRO' }
  | { type: 'START_QUIZ'; payload: { questions: Question[]; filters: InitialFilters; mode: QuizMode } }
  | { type: 'START_FLASHCARDS'; payload: { idioms: Idiom[]; filters: InitialFilters } }
  | { type: 'START_OWS_FLASHCARDS'; payload: { data: OneWord[]; filters: InitialFilters } }
  | { type: 'START_SYNONYM_FLASHCARDS'; payload: { data: SynonymWord[]; filters: InitialFilters } }
  | { type: 'ANSWER_QUESTION'; payload: { questionId: string; answer: string; timeTaken: number } }
  | { type: 'LOG_TIME_SPENT'; payload: { questionId: string; timeTaken: number } }
  | { type: 'SAVE_TIMER'; payload: { questionId: string; time: number } }
  | { type: 'SYNC_GLOBAL_TIMER'; payload: { time: number } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREV_QUESTION' }
  | { type: 'JUMP_TO_QUESTION'; payload: { index: number } }
  | { type: 'TOGGLE_BOOKMARK'; payload: { questionId: string } }
  | { type: 'TOGGLE_REVIEW'; payload: { questionId: string } }
  | { type: 'USE_50_50'; payload: { questionId: string; hiddenOptions: string[] } }
  | { type: 'PAUSE_QUIZ'; payload: { questionId?: string; remainingTime?: number } }
  | { type: 'RESUME_QUIZ' }
  | { type: 'FINISH_QUIZ' }
  | { type: 'SUBMIT_SESSION_RESULTS'; payload: { answers: Record<string, string>; timeTaken: Record<string, number>; score: number; bookmarks: string[] } }
  | { type: 'FINISH_FLASHCARDS' }
  | { type: 'RESTART_QUIZ' }
  | { type: 'LOAD_SAVED_QUIZ'; payload: QuizRuntimeState }
  | { type: 'GO_HOME' };
