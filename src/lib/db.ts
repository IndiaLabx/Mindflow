import { Question, InitialFilters, QuizMode, SavedQuiz, QuizHistoryRecord } from '../features/quiz/types';
import { QuizRuntimeState } from '../features/quiz/types/store';

import { supabase } from './supabase';
import { syncService } from './syncService';

export interface SynonymInteraction {
  wordId: string;
  wordString: string;
  masteryLevel: 'new' | 'familiar' | 'mastered';
  dailyChallengeScore?: number;
  gamificationScore?: number;
  viewedExplanation?: boolean;
  viewedWordFamily?: boolean;
  lastInteractedAt: string;
}



export interface IdiomInteraction {
  status?: "mastered" | "tricky" | "review" | "clueless";
  next_review_at?: string;
  swipe_velocity?: number;
  idiomId: string;
  known_ows: boolean;
  lastInteractedAt: string;
}

export interface OWSInteraction {
  wordId: string;
  known_ows: boolean;
  lastInteractedAt: string;
}

const DB_NAME = 'MindFlowDB';
const DB_VERSION = 11;
const STORE_NAME = 'saved_quizzes';
const HISTORY_STORE_NAME = 'quiz_history';
const BOOKMARKS_STORE_NAME = 'global_bookmarks';
const SYNONYM_STORE_NAME = 'synonym_interactions';
const CHAT_CONVERSATIONS_STORE = 'chat_conversations';
const CHAT_MESSAGES_STORE = 'chat_messages';
const ACTIVE_SESSION_STORE = 'active_test_session';
const OWS_STORE_NAME = 'ows_interactions';
const IDIOM_STORE_NAME = 'idiom_interactions';
const IDIOM_METADATA_STORE = 'idiom_metadata_cache';
const QUIZ_METADATA_STORE = 'quiz_metadata_cache';
const SYNC_METADATA_STORE = 'sync_metadata';
const OWS_METADATA_STORE = 'ows_metadata_cache';
const SYNONYM_METADATA_STORE = 'synonym_metadata_cache';

/**
 * Opens a connection to the IndexedDB database.
 *
 * This helper function handles the logic for opening the database and upgrading the schema
 * if necessary. It ensures the object store exists.
 *
 * @returns {Promise<IDBDatabase>} A promise that resolves to the opened IDBDatabase instance.
 */
const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(HISTORY_STORE_NAME)) {
                db.createObjectStore(HISTORY_STORE_NAME, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(BOOKMARKS_STORE_NAME)) {
                db.createObjectStore(BOOKMARKS_STORE_NAME, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(SYNONYM_STORE_NAME)) {
                db.createObjectStore(SYNONYM_STORE_NAME, { keyPath: 'wordId' });
            }
            if (!db.objectStoreNames.contains(CHAT_CONVERSATIONS_STORE)) {
                db.createObjectStore(CHAT_CONVERSATIONS_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(CHAT_MESSAGES_STORE)) {
                const messageStore = db.createObjectStore(CHAT_MESSAGES_STORE, { keyPath: 'id' });
                messageStore.createIndex('conversation_id', 'conversation_id', { unique: false });
            }
            if (!db.objectStoreNames.contains(OWS_STORE_NAME)) {
                db.createObjectStore(OWS_STORE_NAME, { keyPath: 'wordId' });
            }
            if (!db.objectStoreNames.contains(IDIOM_STORE_NAME)) {
                db.createObjectStore(IDIOM_STORE_NAME, { keyPath: 'idiomId' });
            }
            if (!db.objectStoreNames.contains(IDIOM_METADATA_STORE)) {
                db.createObjectStore(IDIOM_METADATA_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(QUIZ_METADATA_STORE)) {
                db.createObjectStore(QUIZ_METADATA_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(SYNC_METADATA_STORE)) {
                db.createObjectStore(SYNC_METADATA_STORE, { keyPath: 'key' });
            }
            if (!db.objectStoreNames.contains(OWS_METADATA_STORE)) {
                db.createObjectStore(OWS_METADATA_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(SYNONYM_METADATA_STORE)) {
                db.createObjectStore(SYNONYM_METADATA_STORE, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
};

/**
 * Database abstraction layer for local storage using IndexedDB.
 *
 * Provides methods to CRUD (Create, Read, Update, Delete) quiz data locally
 * in the user's browser, allowing for offline persistence of quiz sessions.
 */
export const db = {
    /**
     * Clears all user-related data (Quizzes, History, Bookmarks, Synonyms) from IndexedDB.
     */
    clearAllUserData: async (): Promise<void> => {
        await Promise.all([
            db.clearBookmarks(),
            db.clearSynonymInteractions(),
            db.clearOWSInteractions(),
            db.clearIdiomInteractions(),
            db.clearActiveSessions(),
            db.clearHistory(),
            db.clearSavedQuizzes(),
            db.clearChatData()
        ]);
    },

    /**
     * Enterprise: Saves active test session state for offline resilience
     */
    saveActiveSession: async (sessionId: string, state: any): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(ACTIVE_SESSION_STORE, 'readwrite');
            const store = transaction.objectStore(ACTIVE_SESSION_STORE);
            const request = store.put({ sessionId, state, updatedAt: new Date().toISOString() });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Enterprise: Retrieves active test session
     */
    getActiveSession: async (sessionId: string): Promise<any> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(ACTIVE_SESSION_STORE, 'readonly');
            const store = transaction.objectStore(ACTIVE_SESSION_STORE);
            const request = store.get(sessionId);

            request.onsuccess = () => resolve(request.result?.state || null);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Enterprise: Clears active session upon successful submit
     */
    clearActiveSession: async (sessionId: string): Promise<void> => {
         const dbInstance = await openDB();
         return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(ACTIVE_SESSION_STORE, 'readwrite');
            const store = transaction.objectStore(ACTIVE_SESSION_STORE);
            const request = store.delete(sessionId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    /** Background push helper to sync to Supabase if logged in */
    _pushToSupabase: async (type: 'quiz' | 'history' | 'bookmark' | 'synonym_interaction' | 'ows_interaction' | 'idiom_interaction', data: any) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;
            if (type === 'history') await syncService.pushQuizHistory(session.user.id, data);
            else if (type === 'bookmark') await syncService.pushBookmark(session.user.id, data);
            else if (type === 'synonym_interaction') await syncService.pushSynonymInteraction(session.user.id, data);
            else if (type === 'ows_interaction') await syncService.pushOWSInteraction(session.user.id, data);
            else if (type === 'idiom_interaction') await syncService.pushIdiomInteraction(session.user.id, data);
        } catch (e) {
            console.error('Background push error:', e);
        }
    },

    /** Background delete helper to sync deletion to Supabase if logged in */






    /**
     * Retrieves a specific quiz by its ID.
     *
     * @param {string} id - The unique identifier of the quiz to retrieve.
     * @returns {Promise<SavedQuiz | undefined>} A promise that resolves to the quiz object if found, or undefined.
     */
    getQuiz: async (id: string): Promise<SavedQuiz | undefined> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },



    /**
     * Updates the progress state of an existing quiz.
     *
     * @param {string} id - The unique identifier of the quiz to update.
     * @param {QuizRuntimeState} state - The new state object to save.
     * @returns {Promise<void>} A promise that resolves when the update is complete.
     */
    updateQuizProgress: async (id: string, state: QuizRuntimeState): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // First get the quiz
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const quiz = getRequest.result as SavedQuiz;
                if (quiz) {
                    // Update state
                    quiz.state = state;
                    const putRequest = store.put(quiz);
                    putRequest.onsuccess = () => {
                        // db._pushToSupabase('quiz', quiz); // Removed to prevent API spam, handled by debounced sync in useQuiz.ts
                        resolve();
                    };
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    reject(new Error(`Quiz with id ${id} not found`));
                }
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    },

    /**
     * Updates the name of an existing quiz.
     *
     * @param {string} id - The unique identifier of the quiz to rename.
     * @param {string} name - The new name for the quiz.
     * @returns {Promise<void>} A promise that resolves when the name is updated.
     */
    updateQuizName: async (id: string, name: string): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const quiz = getRequest.result as SavedQuiz;
                if (quiz) {
                    quiz.name = name;
                    const putRequest = store.put(quiz);
                    putRequest.onsuccess = () => {
                        db._pushToSupabase('quiz', quiz);
                        resolve();
                    };
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    reject(new Error(`Quiz with id ${id} not found`));
                }
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    },

    /**
     * Saves a quiz history record to the database.
     *
     * @param {QuizHistoryRecord} record - The history record to save.
     * @returns {Promise<void>}
     */
    saveQuizHistory: async (record: QuizHistoryRecord): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(HISTORY_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(HISTORY_STORE_NAME);
            const request = store.put(record);

            request.onsuccess = () => {
                db._pushToSupabase('history', record);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    },



    /**
     * Saves a global bookmark (entire question object).
     *
     * @param {Question} question - The question object to bookmark.
     * @returns {Promise<void>}
     */
    saveBookmark: async (question: Question): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(BOOKMARKS_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(BOOKMARKS_STORE_NAME);
            const request = store.put(question);

            request.onsuccess = () => {
                db._pushToSupabase('bookmark', question);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Removes a question from global bookmarks by its ID.
     *
     * @param {string} id - The ID of the question to remove.
     * @returns {Promise<void>}
     */
    removeBookmark: async (id: string): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(BOOKMARKS_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(BOOKMARKS_STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Retrieves all global bookmarks.
     *
     * @returns {Promise<Question[]>}
     */



    /**
     * Retrieves all global bookmarks.
     *
     * @returns {Promise<Question[]>}
     */
    /**
     * Clears all global bookmarks.
     *
     * @returns {Promise<void>}
     */

    clearActiveSessions: async (): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(ACTIVE_SESSION_STORE, 'readwrite');
            const store = transaction.objectStore(ACTIVE_SESSION_STORE);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    clearHistory: async (): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(HISTORY_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(HISTORY_STORE_NAME);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    clearSavedQuizzes: async (): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    clearChatData: async (): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const tx = dbInstance.transaction([CHAT_CONVERSATIONS_STORE, CHAT_MESSAGES_STORE], 'readwrite');
            tx.objectStore(CHAT_CONVERSATIONS_STORE).clear();
            tx.objectStore(CHAT_MESSAGES_STORE).clear();
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    clearBookmarks: async (): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(BOOKMARKS_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(BOOKMARKS_STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },


    /**
     * Saves a synonym interaction.
     */
    saveSynonymInteraction: async (interaction: SynonymInteraction): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(SYNONYM_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(SYNONYM_STORE_NAME);
            const request = store.put(interaction);

            request.onsuccess = () => {
                db._pushToSupabase('synonym_interaction', interaction);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Retrieves all synonym interactions.
     */
    getAllSynonymInteractions: async (): Promise<SynonymInteraction[]> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(SYNONYM_STORE_NAME, 'readonly');
            const store = transaction.objectStore(SYNONYM_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Clears all synonym interactions.
     */

    clearSynonymInteractionsMode: async (mode: 'basic' | 'review'): Promise<void> => {
        const dbInstance = await openDB();

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                if (mode === 'basic') {
                    await supabase.from('user_synonym_interactions')
                        .update({ is_read: false })
                        .eq('user_id', session.user.id);
                } else {
                    await supabase.from('user_synonym_interactions')
                        .update({ status: null, next_review_at: null, swipe_velocity: null })
                        .eq('user_id', session.user.id);
                }
            }
        } catch (e) {
            console.error('Failed to clear Supabase Synonym interactions', e);
        }

        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(SYNONYM_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(SYNONYM_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const items = request.result;
                items.forEach((item: any) => {
                    if (mode === 'basic') {
                        item.is_read = false;
                    } else {
                        delete item.status;
                        delete item.next_review_at;
                        delete item.swipe_velocity;
                    }
                    store.put(item);
                });
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    },

    clearSynonymInteractions: async (): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(SYNONYM_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(SYNONYM_STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },


    /**
     * Saves an OWS interaction.
     */
    saveOWSInteraction: async (interaction: OWSInteraction): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(OWS_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(OWS_STORE_NAME);
            const request = store.put(interaction);

            request.onsuccess = () => {
                db._pushToSupabase('ows_interaction', interaction);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Retrieves all OWS interactions.
     */
    getAllOWSInteractions: async (): Promise<OWSInteraction[]> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(OWS_STORE_NAME, 'readonly');
            const store = transaction.objectStore(OWS_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Clears all OWS interactions.
     */
    clearOWSInteractionsMode: async (mode: 'basic' | 'review'): Promise<void> => {
        const dbInstance = await openDB();

        // Push to Supabase directly
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                if (mode === 'basic') {
                    // Update known_ows to false
                    await supabase.from('user_ows_interactions')
                        .update({ is_read: false })
                        .eq('user_id', session.user.id);
                } else {
                    // Update status, next_review_at, swipe_velocity to null
                    await supabase.from('user_ows_interactions')
                        .update({ status: null, next_review_at: null, swipe_velocity: null })
                        .eq('user_id', session.user.id);
                }
            }
        } catch (e) {
            console.error('Failed to clear Supabase OWS interactions', e);
        }

        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(OWS_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(OWS_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const items = request.result;
                items.forEach((item: any) => {
                    if (mode === 'basic') {
                        item.known_ows = false;
                    } else {
                        delete item.status;
                        delete item.next_review_at;
                        delete item.swipe_velocity;
                    }
                    store.put(item);
                });
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    },

    clearIdiomInteractionsMode: async (mode: 'basic' | 'review'): Promise<void> => {
        const dbInstance = await openDB();

        // Push to Supabase directly
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                if (mode === 'basic') {
                    await supabase.from('user_idiom_interactions')
                        .update({ is_read: false })
                        .eq('user_id', session.user.id);
                } else {
                    await supabase.from('user_idiom_interactions')
                        .update({ status: null, next_review_at: null, swipe_velocity: null })
                        .eq('user_id', session.user.id);
                }
            }
        } catch (e) {
            console.error('Failed to clear Supabase Idiom interactions', e);
        }

        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(IDIOM_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(IDIOM_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const items = request.result;
                items.forEach((item: any) => {
                    if (mode === 'basic') {
                        item.known_ows = false;
                    } else {
                        delete item.status;
                        delete item.next_review_at;
                        delete item.swipe_velocity;
                    }
                    store.put(item);
                });
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    },

    clearOWSInteractions: async (): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(OWS_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(OWS_STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },


    /**
     * Saves an Idiom interaction.
     */
    saveIdiomInteraction: async (interaction: IdiomInteraction): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(IDIOM_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(IDIOM_STORE_NAME);
            const request = store.put(interaction);

            request.onsuccess = () => {
                db._pushToSupabase('idiom_interaction', interaction);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Retrieves all Idiom interactions.
     */
    getAllIdiomInteractions: async (): Promise<IdiomInteraction[]> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(IDIOM_STORE_NAME, 'readonly');
            const store = transaction.objectStore(IDIOM_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Clears all Idiom interactions.
     */
    clearIdiomInteractions: async (): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(IDIOM_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(IDIOM_STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },


    /**
     * Saves Idiom Metadata to cache.
     */

    /**
     * Saves Quiz Metadata to cache.
     */
    saveQuizMetadataCache: async (metadata: any[]): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(QUIZ_METADATA_STORE, 'readwrite');
            const store = transaction.objectStore(QUIZ_METADATA_STORE);

            metadata.forEach(item => {
                store.put(item);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject((event.target as IDBRequest).error);
        });
    },

    /**
     * Retrieves Quiz Metadata from cache.
     */
    getQuizMetadataCache: async (): Promise<any[]> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(QUIZ_METADATA_STORE, 'readonly');
            const store = transaction.objectStore(QUIZ_METADATA_STORE);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject((event.target as IDBRequest).error);
        });
    },

    getSyncTimestamp: async (key: string): Promise<string | null> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(SYNC_METADATA_STORE, 'readonly');
            const store = transaction.objectStore(SYNC_METADATA_STORE);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result ? request.result.timestamp : null);
            request.onerror = (event) => reject((event.target as IDBRequest).error);
        });
    },

    setSyncTimestamp: async (key: string, timestamp: string): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(SYNC_METADATA_STORE, 'readwrite');
            const store = transaction.objectStore(SYNC_METADATA_STORE);
            const request = store.put({ key, timestamp });

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject((event.target as IDBRequest).error);
        });
    },

    saveIdiomMetadataCache: async (metadata: any[]): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(IDIOM_METADATA_STORE, 'readwrite');
            const store = transaction.objectStore(IDIOM_METADATA_STORE);

            // Clear existing before adding new
            store.clear();

            metadata.forEach(item => {
                store.put(item);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    },

    /**
     * Retrieves Idiom Metadata from cache.
     */

    clearIdiomMetadataCache: async (): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve) => {
            const tx = dbInstance.transaction(IDIOM_METADATA_STORE, 'readwrite');
            tx.objectStore(IDIOM_METADATA_STORE).clear();
            tx.oncomplete = () => resolve();
        });
    },
    clearOwsMetadataCache: async (): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve) => {
            const tx = dbInstance.transaction(OWS_METADATA_STORE, 'readwrite');
            tx.objectStore(OWS_METADATA_STORE).clear();
            tx.oncomplete = () => resolve();
        });
    },
    clearSynonymMetadataCache: async (): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve) => {
            const tx = dbInstance.transaction(SYNONYM_METADATA_STORE, 'readwrite');
            tx.objectStore(SYNONYM_METADATA_STORE).clear();
            tx.oncomplete = () => resolve();
        });
    },

    getIdiomMetadataCache: async (): Promise<any[]> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(IDIOM_METADATA_STORE, 'readonly');
            const store = transaction.objectStore(IDIOM_METADATA_STORE);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },


    /**
     * Saves OWS Metadata to cache.
     */
    saveOwsMetadataCache: async (metadata: any[]): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(OWS_METADATA_STORE, 'readwrite');
            const store = transaction.objectStore(OWS_METADATA_STORE);

            // Clear existing before adding new
            store.clear();

            metadata.forEach(item => {
                store.put(item);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    },

    /**
     * Retrieves OWS Metadata from cache.
     */
    getOwsMetadataCache: async (): Promise<any[]> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(OWS_METADATA_STORE, 'readonly');
            const store = transaction.objectStore(OWS_METADATA_STORE);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },


    /**
     * Saves Synonym Metadata to cache.
     */
    saveSynonymMetadataCache: async (metadata: any[]): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(SYNONYM_METADATA_STORE, 'readwrite');
            const store = transaction.objectStore(SYNONYM_METADATA_STORE);

            // Clear existing before adding new
            store.clear();

            metadata.forEach(item => {
                store.put(item);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    },

    /**
     * Retrieves Synonym Metadata from cache.
     */
    getSynonymMetadataCache: async (): Promise<any[]> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(SYNONYM_METADATA_STORE, 'readonly');
            const store = transaction.objectStore(SYNONYM_METADATA_STORE);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    getAllBookmarks: async (): Promise<Question[]> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(BOOKMARKS_STORE_NAME, 'readonly');
            const store = transaction.objectStore(BOOKMARKS_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
};

// --- AI Chat ---
export interface AIChatConversation {
  id: string; // UUID
  title: string;
  created_at: string; // ISO string
  updated_at: string;
}

export interface AIChatDocument {
  name: string;
  mimeType: string;
  data: string;
  isText: boolean;
}

export interface AIChatMessage {
  id: string; // UUID
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string;
  documents?: AIChatDocument[];
  created_at: string;
}

export const saveChatConversation = async (conversation: AIChatConversation): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CHAT_CONVERSATIONS_STORE], 'readwrite');
        const store = transaction.objectStore(CHAT_CONVERSATIONS_STORE);
        const request = store.put(conversation);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getChatConversations = async (): Promise<AIChatConversation[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CHAT_CONVERSATIONS_STORE], 'readonly');
        const store = transaction.objectStore(CHAT_CONVERSATIONS_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
             // Sort by updated_at descending
             const conversations = (request.result as AIChatConversation[]).sort((a, b) =>
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
             );
             resolve(conversations);
        };
        request.onerror = () => reject(request.error);
    });
};

export const deleteChatConversation = async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CHAT_CONVERSATIONS_STORE, CHAT_MESSAGES_STORE], 'readwrite');

        // Delete conversation
        const convStore = transaction.objectStore(CHAT_CONVERSATIONS_STORE);
        convStore.delete(id);

        // Delete associated messages using the index
        const msgStore = transaction.objectStore(CHAT_MESSAGES_STORE);
        const index = msgStore.index('conversation_id');
        const request = index.openCursor(IDBKeyRange.only(id));

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const saveChatMessage = async (message: AIChatMessage): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CHAT_MESSAGES_STORE], 'readwrite');
        const store = transaction.objectStore(CHAT_MESSAGES_STORE);
        const request = store.put(message);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getChatMessages = async (conversationId: string): Promise<AIChatMessage[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CHAT_MESSAGES_STORE], 'readonly');
        const store = transaction.objectStore(CHAT_MESSAGES_STORE);
        const index = store.index('conversation_id');
        const request = index.getAll(conversationId);

        request.onsuccess = () => {
             // Sort by created_at ascending
             const messages = (request.result as AIChatMessage[]).sort((a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
             );
             resolve(messages);
        };
        request.onerror = () => reject(request.error);
    });
};

export const deleteChatMessagesAfter = async (conversationId: string, timestamp: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CHAT_MESSAGES_STORE], 'readwrite');
        const store = transaction.objectStore(CHAT_MESSAGES_STORE);
        const index = store.index('conversation_id');
        const request = index.openCursor(IDBKeyRange.only(conversationId));

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
                const message = cursor.value as AIChatMessage;
                // Delete if the message was created strictly after the given timestamp
                if (new Date(message.created_at).getTime() >= new Date(timestamp).getTime()) {
                    cursor.delete();
                }
                cursor.continue();
            }
        };

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};
