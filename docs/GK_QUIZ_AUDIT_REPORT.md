# GK Quiz Audit Report: Quiz Creation & Offline State Management

This document outlines the step-by-step technical flow of the GK Quiz application, starting from the moment a user creates a quiz on the filter page, continuing through their attempts, and detailing how the system handles various edge cases (like closing the tab, losing internet connection, or device shutdown).

## 1. Quiz Creation Flow (`src/features/quiz/components/QuizConfig.tsx`)

1. **User Interaction**: The user selects filters (subject, difficulty, tags) and clicks "Create Quiz".
2. **UUID Generation**: A unique `quizId` (`crypto.randomUUID()`) is generated for the new quiz.
3. **Payload Construction**: A `SavedQuiz` object is created containing:
   - `id`: The generated `quizId`.
   - `name`: User-provided name or a default timestamp.
   - `createdAt`: Current timestamp.
   - `questions`: The filtered array of full question objects.
   - `state`: The default starting state of the quiz (from `initialState` in `useQuizSessionStore.ts`), which sets `status` to `'intro'` and initializes empty structures for scores, answers, and timers.
4. **Database Save (Local First)**: The app calls `db.saveQuiz(newQuiz)` which saves this payload directly to the local browser's **IndexedDB** (`saved_quizzes` object store).
   - *Note on Cloud Sync*: At this exact moment of creation, the quiz is *not* immediately pushed to the Supabase cloud database. The `db.saveQuiz` method explicitly removed its eager Supabase push to prevent API spam. Cloud syncing is handled by a background worker (detailed later).
5. **Routing**: The user is navigated to `/quiz/saved` (the "Created Quizzes" page).

## 2. Listing and Starting the Quiz (`src/features/quiz/components/SavedQuizzes.tsx`)

1. **Fetching**: The `SavedQuizzes` component loads all quizzes from the local IndexedDB.
2. **Display State**: The component evaluates if the quiz has been started using `isQuizStarted(quiz)` (checks if `currentQuestionIndex > 0` or if there are any answers).
   - If not started, the UI shows a **"Start"** button.
   - If partially attempted, the UI shows a **"Resume"** button.
3. **Resuming/Starting**: When the user clicks Start/Resume:
   - `loadSavedQuiz` is called via the global `QuizContext`.
   - This hydrates the global `Zustand` store (`useQuizSessionStore`) with the exact `state` saved in IndexedDB, and dynamically injects the `quizId` from the root quiz wrapper into the state object.
   - The user is navigated to the active session URL (e.g., `/quiz/session/learning`).

## 3. During the Quiz Attempt (`src/features/quiz/hooks/useQuiz.ts`)

Once the quiz is running, the app employs a **Dual-Layer Persistence Strategy** orchestrated entirely by React `useEffect` hooks inside `useQuiz.ts`.

### Layer 1: Synchronous LocalStorage (Lightweight Metadata)
Every time the quiz state changes (answering a question, changing tabs, updating timers), a `useEffect` runs:
- It synchronously saves *only* the `status`, `mode`, and `quizId` to `localStorage` (`mindflow_quiz_session`).
- **Why?**: This prevents the UI from blocking/lagging while saving heavy arrays of question data, and acts as a breadcrumb trail so the app knows *which* quiz was running if the page hard-refreshes.

### Layer 2: Asynchronous IndexedDB + Debounced Supabase Sync (The Heavy Lifting)
Whenever the core quiz state changes (answers, time remaining, current question index), another `useEffect` triggers "Persistence Effect 2":
1. **Instant Local DB Commit**: It immediately calls `db.updateQuizProgress(state.quizId, stateToSave)`. Every single click (answer selection, next button) updates the full quiz state inside the browser's IndexedDB.
2. **30-Second Background Cloud Sync**: The effect initializes a `setInterval` that runs every 30 seconds.
   - Every 30 seconds, if `navigator.onLine` is true, it fetches the latest state from IndexedDB.
   - It strips out the heavy `activeQuestions` array to save bandwidth (and to adhere to proper relational database mapping in the cloud).
   - It calls `syncService.pushSavedQuiz`, which executes a Supabase `.upsert()` to the `saved_quizzes` table on the cloud database.

---

## 4. Handling Edge Cases & Disruptions

Based on the architecture detailed above, here is exactly how the codebase handles the requested scenarios:

### 3.1 User clicks 'Pause' and leaves the quiz.
- **What happens:** The `pauseQuiz` action is dispatched to the Zustand store, setting `isPaused: true`.
- **Saving:** The `useEffect` immediately detects the state change and writes the current state (including answers and exact timers) to IndexedDB.
- **Cloud Sync:** The background 30-second timer will eventually push this paused state to Supabase via `syncService.pushSavedQuiz`.
- **Result:** The quiz remains in the "Created Quizzes" list with a "Resume" button. No data is lost.

### 3.2 & 3.3 User closes the tab without pausing (Normal Closure / Force Quit).
- **What happens:** The user clicks the 'X' on the browser tab or the browser crashes.
- **Saving:** Because every single answer click instantly triggers an IndexedDB write (`db.updateQuizProgress`), the last attempted state is already safely secured on the device's hard drive.
- **Safety Net 1 (`beforeunload`):** If closed normally, the app has a `window.addEventListener('beforeunload')` interceptor. Right as the tab closes, it attempts one final synchronous-like flush to IndexedDB and fires off a best-effort `syncToCloud` API call to Supabase. If the browser force crashes, this won't fire, but the instant click-saves mean the user only loses a few seconds at most.
- **Result:** The user can return to the site, go to "Created Quizzes", and click "Resume". They will pick up exactly where they left off (locally).

### 3.4 Mobile phone switches off (Battery Death).
- **What happens:** The device loses power immediately. No browser cleanup events fire.
- **Saving:** Similar to a crash, the local IndexedDB state is as fresh as the very last click.
- **Cloud Sync Note:** If the 30-second background sync had not run yet for their *most recent* click, that specific click is only on the local device, not in Supabase yet.
- **Result:** When the user charges their phone and opens the app, the local IndexedDB data allows them to resume perfectly. If they try to resume on a *different* device (like a laptop), they might be missing up to 30 seconds of progress since it hasn't synced to Supabase yet.

### 3.5 User backgrounds the app and leaves it till the next day.
- **What happens:** The user minimizes the browser or switches tabs.
- **Safety Net 2 (`visibilitychange`):** The app listens for `document.visibilityState === 'hidden'`. The moment the app goes into the background, it instantly writes to IndexedDB and triggers an immediate push to the Supabase cloud.
- **Result:** The data is safely parked in local storage and synced to the cloud. If the mobile OS eventually kills the backgrounded app to save memory, it behaves like scenario 3.3. When the user returns the next day, they resume perfectly.

### 3.6 Internet connection goes off while playing.
- **What happens:** The user continues attempting questions offline.
- **Saving:** The application is entirely local-first. All questions are already in memory, and every answer is instantly saved to the local IndexedDB without requiring network access.
- **Cloud Sync:** The 30-second interval runs, checks `navigator.onLine`, sees it is false, and safely aborts the Supabase push.
- **Result:** The user experiences zero interruption. They can finish the whole quiz offline. When internet is restored, the next 30-second interval (or a page reload via `syncService.syncAll()`) will push the accumulated local IndexedDB progress up to Supabase.

---

## 5. Potential Vulnerabilities / Bugs Identified in the Audit

While the logic is robust for offline support, the audit reveals a few potential gaps in the current implementation:

1. **Start Quiz Initialization Bug**: When the user creates the quiz via `createQuizWithQuestions` inside `QuizConfig.tsx`, the `quizId` is generated, but it is **not** immediately injected into the `initialState` that is saved to IndexedDB. The `quizId` property on the `state` object inside the `SavedQuiz` wrapper remains undefined initially. The app relies on the `loadSavedQuiz` context method (triggered when clicking "Resume") to dynamically patch the `quizId` back into the Zustand store. This disconnect can cause the very first `saveToDb` update cycle inside `useQuiz.ts` to fail or create orphaned records if not handled carefully, as `state.quizId` might be null on the first mount.
2. **Missing Start Metadata Cloud Push**: Because `db.saveQuiz()` disables the Supabase push, a newly created quiz is only stored locally. If a user creates a quiz on their phone, never starts it, and immediately opens their laptop, that newly created quiz will not exist on the laptop. It only syncs to the cloud *after* the user starts it and the 30-second timer kicks in inside the active session.
3. **Cross-Device Sync Conflicts**: While the 30-second sync pushes data to the cloud, there is no real-time subscription listening for incoming changes from the cloud while the quiz list is open. If a user resumes on two devices simultaneously, the last one to run the 30-second sync will blindly overwrite the other's progress in Supabase.
