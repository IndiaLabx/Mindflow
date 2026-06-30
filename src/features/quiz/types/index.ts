import { Question, InitialFilters } from '../../../types/models';
import { QuizRuntimeState, QuizPersistentState, QuizMode } from './store';

// Re-export models so existing imports in components don't break
export * from '../../../types/models';
export * from './store';

/**
 * Detailed performance statistics for a specific subject within a quiz.
 */
export interface SubjectStats {
  attempted: number;
  correct: number;
  incorrect: number;
  skipped: number;
  accuracy: number;
}

/**
 * Represents a historical record of a completed quiz session.
 */
export interface QuizHistoryRecord {
  id: string;
  quiz_id?: string;
  date: number;
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalSkipped: number;
  totalTimeSpent: number;
  overallAccuracy: number;
  difficulty: string; // "Mixed", "Easy", etc.
  subjectStats: Record<string, SubjectStats>;
}

/**
 * Represents a saved quiz session in the local database.
 */
export interface SavedQuiz {
  /** Unique ID of the saved quiz. */
  id: string;
  quiz_id?: string;
  /** User-defined name for the quiz. */
  name: string;
  /** Timestamp of creation (ms). */
  createdAt: number;
  /** Filters used to generate this quiz. */
  filters: InitialFilters;
  /** The mode of the quiz (Learning vs Mock). */
  mode: QuizMode;
  /** The list of questions included in this quiz. */
  questions: Question[];
  /** The current progress state of the quiz. */
  state: QuizRuntimeState & { score?: number, timeTaken?: Record<string, number>, bookmarks?: string[] };
}

/**
 * List of keys available for filtering questions.
 * Used for iterating over filter categories in the UI and logic.
 */
export const filterKeys = [
  'subject', 'topic', 'subTopic',
  'difficulty', 'questionType',
  'examName', 'examYear', 'examDateShift',
  'tags'
] as const;

/**
 * Helper function to extract a specific filter value from a Question object.
 *
 * Maps the flat filter keys (e.g., 'subject', 'examName') to the nested properties
 * within the Question data model (e.g., `question.classification.subject`).
 *
 * @param {Question} question - The question object.
 * @param {keyof InitialFilters} key - The filter key to extract.
 * @returns {string | string[] | undefined} The value associated with the key.
 */
export function getQuestionValue(question: Question, key: keyof InitialFilters): string | string[] | undefined {
  switch (key) {
    case 'subject': return question.subject ?? question.classification?.subject;
    case 'topic': return question.topic ?? question.classification?.topic;
    case 'subTopic': return question.subTopic ?? question.classification?.subTopic;
    case 'difficulty': return question.properties?.difficulty;
    case 'questionType': return question.properties?.questionType;
    case 'examName': return question.examName ?? question.sourceInfo?.examName;
    case 'examYear': return String(question.examYear ?? question.sourceInfo?.examYear);
    case 'examDateShift': return question.examDateShift ?? question.sourceInfo?.examDateShift;
    case 'tags': return question.tags;
    default: return undefined;
  }
}

/**
 * Interface for the global Settings Context.
 * Defines the available settings and their toggle functions.
 */
export interface SettingsContextType {
  /** Whether Dark Mode is enabled. */
  isDarkMode: boolean;
  /** Toggles Dark Mode on/off. */
  toggleDarkMode: (event?: React.MouseEvent | React.TouchEvent | Event) => void;
  /** Whether Sound Effects are enabled. */
  isSoundEnabled: boolean;
  /** Toggles Sound Effects on/off. */
  toggleSound: () => void;
  /** Whether Haptic Feedback (vibration) is enabled. */
  isHapticEnabled: boolean;
  /** Toggles Haptic Feedback on/off. */
  toggleHaptics: () => void;
  /** Whether Background Animations (e.g., fireballs) are enabled. */
  areBgAnimationsEnabled: boolean;
  /** Toggles Background Animations on/off. */
  toggleBgAnimations: () => void;
}


export interface Synonym {
  text: string;
  meaning?: string;
  hindiMeaning?: string;
  pos?: string;
  cluster_id: string;
  quiz_id?: string;
}

export interface Antonym {
  text: string;
  meaning?: string;
  hindiMeaning?: string;
  pos?: string;
}

export interface SynonymWord {
  id: string;
  quiz_id?: string;
  word: string;
  image_url?: string;
  pos: string;
  repetition_raw: string;
  importance_score: number;
  lifetime_frequency: number;
  recent_trend: number;
  meaning?: string;
  hindiMeaning?: string;
  theme: string;
  cluster_id: string;
  confusable_with: string[];
  synonyms: Synonym[];
  antonyms: Antonym[];
}
