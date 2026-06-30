/**
 * @file models.ts
 * @description Defines the core data models and type interfaces for the application.
 */

/**
 * Information about the source of a question (e.g., exam paper).
 */
export interface SourceInfo {
  /** The name of the exam (e.g., "SSC CGL"). */
  examName: string;
  /** The year the exam took place. */
  examYear: number;
  /** The specific shift or date of the exam, if applicable. */
  examDateShift?: string;
}

/**
 * Hierarchical classification of a question's subject matter.
 */
export interface Classification {
  /** The broad subject area (e.g., "History"). */
  subject: string;
  /** The specific topic within the subject (e.g., "Modern History"). */
  topic: string;
  /** An optional sub-topic for finer granularity (e.g., "Gandhian Era"). */
  subTopic?: string;
}

/**
 * Metadata properties defining the characteristics of a question.
 */
export interface Properties {
  /** The difficulty level of the question (e.g., 'Easy', 'Medium', 'Hard'). */
  difficulty: string;
  /** The type of question (e.g., 'MCQ'). */
  questionType: string;
}

/**
 * Detailed explanation for a question's answer.
 */
export interface Explanation {
  /** A brief summary of the answer. */
  summary?: string;
  /** Analysis of why the correct option is correct. */
  analysis_correct?: string;
  /** Analysis of why the incorrect options are wrong. */
  analysis_incorrect?: string;
  /** A concluding statement or takeaway. */
  conclusion?: string;
  /** An interesting fact related to the question. */
  fact?: string;
}

/**
 * Represents a standard quiz question (MCQ).
 */
export interface Question {
  /** Unique identifier for the question. */
  id: string;
  examName?: string;
  examYear?: number;
  examDateShift?: string;
  subject?: string;
  topic?: string;
  subTopic?: string;
  /** The legacy or human-readable ID of the question. */
  v1_id?: string;
  /** Source metadata for the question. */
  sourceInfo: SourceInfo;
  /** Subject classification metadata. */
  classification: Classification;
  /** Array of tags associated with the question. */
  tags: string[];
  /** Difficulty and type properties. */
  properties: Properties;
  /** The text of the question. */
  question: string;
  /** The text of the question in Hindi (optional). */
  question_hi?: string;
  /** List of answer options. */
  options: string[];
  /** List of answer options in Hindi (optional). */
  options_hi?: string[];
  /** The text of the correct answer. */
  correct: string;
  /** Detailed explanation object. */
  explanation: Explanation;
  /** Server-side AI explanation JSON. */
  ask_ai_explanation?: any;
}

// --- Idiom Types ---

/**
 * Content details for an Idiom.
 */
export interface IdiomContent {
  /** Optional image URL for flashcard display */
  image_url?: string;
  /** The idiom phrase itself. */
  phrase: string;
  /** Meanings of the idiom in English and Hindi. */
  meanings: {
    english: string;
    hindi: string;
  };
  /** Example usage sentence. */
  usage: string;
  /** Extra information like mnemonic aids or origin. */
  extras: {
    mnemonic: string;
    origin: string;
  };
}

/**
 * Represents an Idiom entity.
 */
export interface Idiom {
  /** Unique identifier for the idiom. */
  id: string;

  /** Source metadata for the idiom. */
  sourceInfo: {
    pdfName: string;
    examYear: number;
  };
  /** Properties including difficulty and review status. */
  properties: {
    difficulty: string;
    status: string;
    theme?: string;
    importance_score?: number;
    repetition_count?: number;
  };
  /** The core content of the idiom. */
  content: IdiomContent;
}

// --- OWS (One Word Substitution) Types ---

/**
 * Content details for a One Word Substitution.
 */
export interface OWSContent {
  /** Numeric ID (likely legacy or source-specific). */
  id: number;
  /** Optional image URL for flashcard display */
  image_url?: string;
  /** Part of speech (e.g., Noun, Verb). */
  pos: string;
  /** The word being defined. */
  word: string;
  /** Meaning in English. */
  meaning_en: string;
  /** Meaning in Hindi. */
  meaning_hi: string;
  /** List of example sentences. */
  usage_sentences: string[];
  /** Additional notes. */
  note?: string;
  /** Etymological origin. */
  origin?: string;
}

/**
 * Represents a One Word Substitution entity.
 */
export interface OneWord {
  db_id?: string;
  /** Unique identifier for the OWS. */
  id: string;

  /** Source metadata for the OWS. */
  sourceInfo: {
    pdfName: string;
    examYear: number;
  };
  /** Properties including difficulty and status. */
  properties: {
    difficulty: string;
    status: string;
    theme?: string;
    importance_score?: number;
    repetition_count?: number;
  };
  /** The core content of the OWS. */
  content: OWSContent;
}

/**
 * Represents the initial state of filters available for selection.
 * Each property contains a list of available values for that filter category.
 */
export interface InitialFilters {
  subject: string[];
  topic: string[];
  subTopic: string[];
  difficulty: string[];
  questionType: string[];
  examName: string[];
  examYear: string[];
  examDateShift: string[];
  tags: string[];
  hasPhoto?: ('With Photo' | 'Without Photo')[];
  theme?: string[];
    knownStatus?: ('known' | 'unknown')[];
  reviewModeStatus?: ('Unseen' | 'Mastered' | 'Review' | 'Clueless' | 'Tricky')[];
}

// --- Future Proofing for Auth & History ---

/**
 * Represents a user in the system.
 */
export interface User {
  /** Unique user ID. */
  id: string;

  /** User's email address. */
  email: string;
  /** User's display name. */
  name: string;
  /** Optional dictionary of user preferences. */
  preferences?: Record<string, any>;
}

/**
 * Represents a completed quiz attempt by a user.
 */
export interface QuizAttempt {
  /** Unique ID for the attempt. */
  id: string;

  /** ID of the user who took the quiz. */
  userId: string;
  /** Date of the attempt (ISO string). */
  date: string;
  /** The mode in which the quiz was taken ('learning' or 'mock'). */
  mode: 'learning' | 'mock';
  /** The score achieved. */
  score: number;
  /** Total number of questions in the quiz. */
  totalQuestions: number;
  /** Total time spent in seconds. */
  timeSpent: number;
  /** Breakdown of accuracy by subject (Subject -> Accuracy %). */
  subjectBreakdown: Record<string, number>;
}
