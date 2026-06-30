import { supabase } from './supabase';
import { db, SynonymInteraction, OWSInteraction, IdiomInteraction, AIChatConversation, AIChatMessage, getChatConversations, getChatMessages } from './db';
import { fetchQuestionsByIds } from '../features/quiz/services/questionService';
import { Question, SavedQuiz, QuizHistoryRecord } from '../features/quiz/types';

/**
 * Service responsible for synchronizing local IndexedDB data with the Supabase backend.
 */
import { useSyncStore } from '../features/quiz/stores/useSyncStore';

let isSyncing = false;
let lastSyncedUserIdForFullSync: string | null = null;

export const syncService = {
  /** Returns the current sync status */
  getIsSyncing: () => isSyncing,

  pushAIChatConversation: async (userId: string, conv: AIChatConversation) => {
    const { error } = await supabase.from('ai_chat_conversations').upsert({
      id: conv.id,
      user_id: userId,
      title: conv.title,
      created_at: conv.created_at,
      updated_at: conv.updated_at
    }, { onConflict: 'id' });
    if (error) console.error('Error pushing chat conversation:', error);
  },

  pushAIChatMessage: async (msg: AIChatMessage) => {
    const { error } = await supabase.from('ai_chat_messages').upsert({
      id: msg.id,
      conversation_id: msg.conversation_id,
      role: msg.role,
      content: msg.content,
      created_at: msg.created_at
    }, { onConflict: 'id' });
    if (error) console.error('Error pushing chat message:', error);
  },

  syncAIChats: async (userId: string) => {
    try {
      // 1. Fetch Local Data
      const localConvs = await getChatConversations();

      // 2. Push to Supabase
      for (const conv of localConvs) {
        await syncService.pushAIChatConversation(userId, conv);
        const msgs = await getChatMessages(conv.id);
        for (const msg of msgs) {
            await syncService.pushAIChatMessage(msg);
        }
      }
    } catch (err) {
      console.error('Error syncing AI Chats:', err);
    }
  },

  /**
   * Pushes a single saved quiz to Supabase.
   */
  pushSavedQuiz: async (userId: string, quiz: SavedQuiz) => {
    // Strip questions from payload to save space
    const { activeQuestions, ...stateWithoutQuestions } = quiz.state;

    const { error } = await supabase.from('saved_quizzes').upsert({
      id: quiz.id,
      user_id: userId,
      name: quiz.name,
      created_at: quiz.createdAt,
      filters: quiz.filters,
      mode: quiz.mode,
      state: stateWithoutQuestions,
    });

    if (error) {
      console.error('Error pushing saved quiz:', error);
      return false;
    }

    // Insert into junction table
    const bridgeRecords = quiz.questions.map((q, index) => ({
      quiz_id: quiz.id,
      question_id: q.id,
      user_id: userId,
      sort_order: index
    }));

    if (bridgeRecords.length > 0) {
      const { error: bridgeError } = await supabase.from('bridge_saved_quiz_questions').upsert(bridgeRecords, { onConflict: 'quiz_id, question_id' });
      if (bridgeError) {
        console.error('Error pushing bridge questions:', bridgeError);
      }
    }
  },

  /**
   * Pushes a single quiz history record to Supabase, along with per-question attempts.
   */
  pushQuizHistory: async (userId: string, history: QuizHistoryRecord, attempts?: any[]) => {
    const { error: historyError } = await supabase.from('quiz_history').upsert({
      id: history.id,
      quiz_id: history.quiz_id,
      user_id: userId,
      date: history.date,
      total_questions: history.totalQuestions,
      total_correct: history.totalCorrect,
      total_incorrect: history.totalIncorrect,
      total_skipped: history.totalSkipped,
      total_time_spent: history.totalTimeSpent,
      overall_accuracy: history.overallAccuracy,
      difficulty: history.difficulty,
      subject_stats: history.subjectStats,
    });
    if (historyError) {
      console.error('Error pushing quiz history:', historyError);
      return;
    }

    if (attempts && attempts.length > 0) {
      // question_attempts table no longer exists. Use user_answers or quiz_attempts if needed in the future.
      // const { error: attemptsError } = await supabase.from('question_attempts').insert(
        // attempts.map(a => ({
        //   user_id: userId,
        //   quiz_history_id: history.id,
        //   quiz_id: history.quiz_id,
        //   question_id: a.questionId,
        //   is_correct: a.isCorrect,
        //   time_taken: a.timeTaken,
        //   subject: a.subject,
        //   topic: a.topic
        // }))
      // );
      // if (attemptsError) console.error('Error pushing question attempts:', attemptsError);
    }
  },


  /**
   * Deletes all quiz history and associated question attempts for a user from Supabase.
   */
  deleteUserQuizHistory: async (userId: string) => {
    // Note: question_attempts no longer exists.
    // const { error: attemptsError } = await supabase.from('question_attempts').delete().eq('user_id', userId);
    // if (attemptsError) {
    //   console.error('Error deleting question attempts:', attemptsError);
    // }

    const { error: historyError } = await supabase.from('quiz_history').delete().eq('user_id', userId);
    if (historyError) {
      console.error('Error deleting quiz history:', historyError);
    }
  },

  /**
   * Pushes a single bookmark to Supabase.
   */
  pushBookmark: async (userId: string, question: Question) => {
    const { error } = await supabase.from('user_bookmarks').upsert({
      user_id: userId,
      question_id: question.id,
    }, { onConflict: 'user_id, question_id' });

    if (error) console.error('Error pushing bookmark:', error);
  },

  /**
   * Removes a bookmark from Supabase.
   */

  /**
   * Pushes a synonym interaction to Supabase.
   */

  pushSynonymInteraction: async (userId: string, interaction: SynonymInteraction) => {
    const { error } = await supabase.from('user_synonym_interactions').upsert({
      user_id: userId,
      word_id: interaction.wordId,
      mastery_level: interaction.masteryLevel,
      daily_challenge_score: interaction.dailyChallengeScore,
      gamification_score: interaction.gamificationScore,
      viewed_explanation: interaction.viewedExplanation,
      viewed_word_family: interaction.viewedWordFamily,
      last_interacted_at: interaction.lastInteractedAt,
      status: (interaction as any).status || null,
      is_read: (interaction as any).is_read || false,
      next_review_at: (interaction as any).next_review_at || null,
      swipe_velocity: (interaction as any).swipe_velocity || null,
    }, { onConflict: 'user_id, word_id' });

    if (error) console.error('Error pushing synonym interaction:', error);
  },


    /**
   * Pushes an OWS interaction to Supabase.
   */
  pushOWSInteraction: async (userId: string, interaction: OWSInteraction) => {
    const { error } = await supabase.from('user_ows_interactions').upsert({
      user_id: userId,
      word_id: interaction.wordId,
      is_read: interaction.known_ows,
      updated_at: interaction.lastInteractedAt,
    }, { onConflict: 'user_id, word_id' });

    if (error) console.error('Error pushing OWS interaction:', error);
  },

    /**
   * Pushes an Idiom interaction to Supabase.
   */
  pushIdiomInteraction: async (userId: string, interaction: IdiomInteraction) => {
    const { error } = await supabase.from('user_idiom_interactions').upsert({
      user_id: userId,
      idiom_id: interaction.idiomId,
      is_read: interaction.known_ows,
      updated_at: interaction.lastInteractedAt,
    }, { onConflict: 'user_id, idiom_id' });

    if (error) console.error('Error pushing Idiom interaction:', error);
  },

  removeBookmark: async (userId: string, questionId: string) => {
    const { error } = await supabase.from('user_bookmarks')
      .delete()
      .match({ user_id: userId, question_id: questionId });

    if (error) console.error('Error removing bookmark from Supabase:', error);
  },

  /**
   * Deletes a saved quiz from Supabase.
   */
  deleteSavedQuiz: async (userId: string, quizId: string) => {
    const { error } = await supabase.from('saved_quizzes')
      .update({ deleted_at: new Date().toISOString() })
      .match({ id: quizId, user_id: userId });

    if (error) console.error('Error soft-deleting saved quiz from Supabase:', error);
  },

  /**
   * Runs an initial bidirectional sync after login.
   * Pulls remote data down and pushes any local-only data up.
   */

  /**
   * Processes the offline event queue from Zustand and dispatches them to Supabase.
   */
  processEventQueue: async (userId: string) => {
    const { queue, removeEvents } = useSyncStore.getState();
    if (queue.length === 0) return;

    const processedIds: string[] = [];

    for (const event of queue) {
      try {
        switch (event.type) {
          case 'flashcard_reviewed':
            // The payload is assumed to be a SynonymInteraction or similar
            await syncService.pushSynonymInteraction(userId, event.payload);
            break;


          case 'bookmark_toggled':
            if (event.payload.isBookmarked) {
               await syncService.pushBookmark(userId, event.payload.question);
            } else {
               await syncService.removeBookmark(userId, event.payload.questionId);
            }
            break;
        }
        processedIds.push(event.id);
      } catch (err) {
        console.error('Failed to sync event:', event, err);
        // Break early if network fails, keep remaining in queue
        break;
      }
    }

    if (processedIds.length > 0) {
      removeEvents(processedIds);
    }
  },


  syncOnLogin: async (userId: string, isSignup: boolean = false) => {
    // If a full sync has already completed for this user in this session, skip the blocking UI sync
    // but still flush any offline queue silently
    if (lastSyncedUserIdForFullSync === userId && !isSignup) {
       await syncService.processEventQueue(userId);
       return;
    }
    if (isSyncing) return;
    isSyncing = true;
    window.dispatchEvent(new Event('mindflow-sync-start'));

    await syncService.processEventQueue(userId);

    try {
      // 1. Pull from Supabase
      const [
        { data: remoteQuizzesData },
        { data: remoteHistory },
        { data: remoteBookmarks },
        { data: remoteSynonyms },
        { data: remoteOWS },
        { data: remoteIdioms }
      ] = await Promise.all([
        supabase.from('saved_quizzes').select('*, bridge_saved_quiz_questions(question_id, sort_order)').eq('user_id', userId).is('deleted_at', null),
        supabase.from('quiz_history').select('*').eq('user_id', userId),
        supabase.from('user_bookmarks').select('question_id').eq('user_id', userId),
        supabase.from('user_synonym_interactions').select('*').eq('user_id', userId),
        supabase.from('user_ows_interactions').select('*').eq('user_id', userId),
        supabase.from('user_idiom_interactions').select('*').eq('user_id', userId)
      ]);

      let remoteQuizzes = remoteQuizzesData || [];
      if (remoteQuizzes.length > 0) {
        // Collect all distinct question IDs needed across all quizzes
        const allQuestionIds = new Set<string>();
        remoteQuizzes.forEach(rq => {
            const bridgeData = rq.bridge_saved_quiz_questions || [];
            bridgeData.forEach((bq: any) => allQuestionIds.add(bq.question_id));
        });

        // Fetch the actual question data
        const idArray = Array.from(allQuestionIds);
        const fetchedQuestions = await fetchQuestionsByIds(idArray);
        const questionsMap = new Map(fetchedQuestions.map(q => [q.id, q]));

        // Reconstruct full questions and state.activeQuestions for each remote quiz
        remoteQuizzes = remoteQuizzes.map(rq => {
             let questions: Question[] = [];
             const bridgeData = rq.bridge_saved_quiz_questions || [];
             bridgeData.sort((a: any, b: any) => a.sort_order - b.sort_order);
             bridgeData.forEach((bq: any) => {
                 const q = questionsMap.get(bq.question_id);
                 if (q) questions.push(q);
             });

             const fullQuiz = {
                 ...rq,
                 questions: questions,
                 state: {
                     ...(rq.state || {}),
                     activeQuestions: questions
                 }
             };
             delete fullQuiz.bridge_saved_quiz_questions;
             return fullQuiz;
        });
      }

      // 2. Fetch local data
      const localQuizzes: any[] = [];
      const localHistory: any[] = [];
      const localBookmarks = await db.getAllBookmarks();
      const localSynonyms = await db.getAllSynonymInteractions();
      const localOWS = await db.getAllOWSInteractions();
      const localIdioms = await db.getAllIdiomInteractions();

      if (isSignup) {
        // --- NEW SIGNUP FLOW ---
        // 3. Push all Local Data up to the Server to merge guest progress
        const remoteQuizIds = new Set((remoteQuizzes || []).map(q => q.id));
        const remoteHistoryIds = new Set((remoteHistory || []).map(h => h.id));
        const remoteBookmarkIds = new Set((remoteBookmarks || []).map(b => b.question_id));
        const remoteSynonymIds = new Set((remoteSynonyms || []).map((s: any) => s.word_id));
        const remoteOWSIds = new Set((remoteOWS || []).map(o => o.word_id));
        const remoteIdiomIds = new Set((remoteIdioms || []).map(i => i.idiom_id));

        for (const quiz of localQuizzes) {
          if (!remoteQuizIds.has(quiz.id)) {
            await syncService.pushSavedQuiz(userId, quiz);
          }
        }
        for (const hist of localHistory) {
          if (!remoteHistoryIds.has(hist.id)) {
            await syncService.pushQuizHistory(userId, hist);
          }
        }
        for (const bm of localBookmarks) {
          if (!remoteBookmarkIds.has(bm.id)) {
            await syncService.pushBookmark(userId, bm);
          }
        }
        for (const syn of localSynonyms) {
          if (!remoteSynonymIds.has(syn.wordId)) {
            await syncService.pushSynonymInteraction(userId, syn);
          }
        }
        for (const ows of localOWS) {
          if (!remoteOWSIds.has(ows.wordId)) {
            await syncService.pushOWSInteraction(userId, ows);
          }
        }
        for (const idiom of localIdioms) {
          if (!remoteIdiomIds.has(idiom.idiomId)) {
            await syncService.pushIdiomInteraction(userId, idiom);
          }
        }

        // After merging up, clear local to prep for a fresh pull
        await db.clearAllUserData();
      } else {
        // --- EXISTING LOGIN FLOW ---
        // 3. Clear local IndexedDB immediately to avoid mixing guest data into existing account
        await db.clearAllUserData();
      }

      // 4. Pull fresh data from Server to Local (Hydration)
      if (remoteQuizzes) {
        for (const remote of remoteQuizzes) {

        }
      }

      if (remoteHistory) {
        for (const remote of remoteHistory) {
          await db.saveQuizHistory({
            id: remote.id,
            date: remote.date,
            totalQuestions: remote.total_questions,
            totalCorrect: remote.total_correct,
            totalIncorrect: remote.total_incorrect,
            totalSkipped: remote.total_skipped,
            totalTimeSpent: remote.total_time_spent,
            overallAccuracy: remote.overall_accuracy,
            difficulty: remote.difficulty,
            subjectStats: remote.subject_stats
          });
        }
      }

      // 5. Hydrate missing remote bookmarks
      if (remoteSynonyms) {
        for (const remote of remoteSynonyms) {
          await db.saveSynonymInteraction({
            wordId: (remote as any).word_id,
            wordString: '', // Missing string data from backend, relies on UI hydrating it later
            masteryLevel: (remote as any).mastery_level,
            dailyChallengeScore: (remote as any).daily_challenge_score,
            gamificationScore: (remote as any).gamification_score,
            viewedExplanation: (remote as any).viewed_explanation,
            viewedWordFamily: (remote as any).viewed_word_family,
            lastInteractedAt: (remote as any).last_interacted_at
          });
        }
      }

      if (remoteOWS && remoteOWS.length > 0) {
        for (const remote of remoteOWS) {
           await db.saveOWSInteraction({
              wordId: remote.word_id,
              known_ows: remote.is_read,
              lastInteractedAt: remote.updated_at
           });
        }
      }

      if (remoteIdioms && remoteIdioms.length > 0) {
        for (const remote of remoteIdioms) {
           await db.saveIdiomInteraction({
              idiomId: remote.idiom_id,
              known_ows: remote.is_read,
              lastInteractedAt: remote.updated_at
           });
        }
      }

      if (remoteBookmarks && remoteBookmarks.length > 0) {
        const localBookmarkIds = new Set(localBookmarks.map(b => b.id));
        const missingBookmarkIds = remoteBookmarks
          .map(b => b.question_id)
          .filter(id => !localBookmarkIds.has(id));

        if (missingBookmarkIds.length > 0) {
          // Fetch the full question objects for bookmarks since local DB needs the full object
          const fullQuestions = await fetchQuestionsByIds(missingBookmarkIds);
          for (const q of fullQuestions) {
            await db.saveBookmark(q);
          }
        }
      }

    } catch (error) {
      console.error('Error during initial sync:', error);
    } finally {
      isSyncing = false;
      lastSyncedUserIdForFullSync = userId;
      // Dispatch event to notify UI components that sync has completed
      window.dispatchEvent(new Event('mindflow-sync-complete'));
    }
  }
};
