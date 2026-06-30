import { db } from '../../../lib/db';
import { create } from 'zustand';
import { Question } from '../types';
import { useSyncStore } from './useSyncStore';

interface BookmarkState {
  bookmarks: string[];

  // Actions
  toggleBookmark: (question: Question) => void;
  loadBookmarks: (bookmarks: string[]) => void;
  resetStore: () => void;
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [],

  toggleBookmark: (question) => set((state) => {
    const isBookmarked = state.bookmarks.includes(question.id);

    if (isBookmarked) {
      // Remove from global bookmarks db
      db.removeBookmark(question.id);
      useSyncStore.getState().addEvent({
        type: 'bookmark_toggled',
        payload: { questionId: question.id, isBookmarked: false }
      });

      return {
        bookmarks: state.bookmarks.filter(id => id !== question.id)
      };
    } else {
      // Add to global bookmarks db
      db.saveBookmark(question);
      useSyncStore.getState().addEvent({
        type: 'bookmark_toggled',
        payload: { questionId: question.id, question, isBookmarked: true }
      });

      return {
        bookmarks: [...state.bookmarks, question.id]
      };
    }
  }),

  loadBookmarks: (bookmarks) => set({
    bookmarks
  }),

  resetStore: () => set({ bookmarks: [] })
}));
