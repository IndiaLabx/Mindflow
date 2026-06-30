/**
 * Global application configuration constants.
 *
 * This object contains configuration settings used throughout the application,
 * including application name, local storage keys, timer defaults, and pagination settings.
 */
export const APP_CONFIG = {
  /** The name of the application. */
  APP_NAME: 'MindFlow Quiz',

  /**
   * Keys used for storing data in the browser's local storage.
   */
  STORAGE_KEYS: {
    /** Key for storing the current quiz session state. */
    QUIZ_SESSION: 'mindflow_quiz_session_v1',
    /** Key for storing user settings. */
    SETTINGS: 'mindflow_settings_v1',
    /** Key for storing the user's theme preference (e.g., dark mode). */
    THEME: 'darkMode',
    /** Key for storing the OWS navigation batch size preference. */
    OWS_BATCH_SIZE: 'mindflow_ows_batch_size_v1',
    /** Key for storing the Idioms navigation batch size preference. */
    IDIOMS_BATCH_SIZE: 'mindflow_idioms_batch_size_v1',
  },

  /**
   * Default timer configurations for different quiz modes.
   */
  TIMERS: {
    /** Default time in seconds allowed per question in Learning Mode. */
    LEARNING_MODE_DEFAULT: 60,
    /** Default time in seconds allocated per question in Mock Mode to calculate total exam time. */
    MOCK_MODE_DEFAULT_PER_QUESTION: 30,
  },

  /**
   * Pagination configuration.
   */
  PAGINATION: {
    /** Number of items to group together for navigation or batching. */
    BATCH_SIZE: 25,
  }
};
