# MindFlow Quiz

MindFlow is an intelligent, adaptive learning platform designed to help students master complex subjects through interactive quizzes and flashcards. Built with **React**, **Vite**, **Supabase**, and **Google Gemini AI**, it offers a modern, app-like experience on the web.

## 🚀 Features

*   **Adaptive Quizzes:** Create custom quizzes filtered by Subject, Topic, Difficulty, and Exam Source.
*   **AI-Powered Tutor:** Get instant, detailed explanations for any question using the "Ask AI Tutor" feature (powered by Google Gemini).
*   **Dual Modes:**
    *   **Learning Mode:** Immediate feedback, explanations, and text-to-speech support.
    *   **Mock Mode:** Timed exam simulation without hints.
*   **Flashcards:** Interactive 3D flashcards for Idioms and One-Word Substitutions.
*   **Progress Tracking:** Detailed analytics, score breakdowns, and history of saved quizzes.
*   **PWA Support:** Installable as a native-like app on mobile and desktop.
*   **Text-to-Speech:** Native Hindi and English audio support for questions.

## 🛠️ Tech Stack

*   **Frontend:** React 19, TypeScript, Vite
*   **Styling:** Tailwind CSS
*   **State Management:** React Context + useReducer
*   **Backend / Database:** Supabase (PostgreSQL, Auth)
*   **AI:** Google Gemini API (Flash 2.0 / 2.5)
*   **Deployment:** GitHub Pages

## 📦 Setup & Installation

Follow these steps to run the project locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/mindflow-quiz.git
    cd mindflow-quiz
    ```

2.  **Install dependencies:**
    ```bash
    npm install --legacy-peer-deps
    ```
    *Note: `--legacy-peer-deps` is required due to some React 19 peer dependency conflicts with specific libraries.*

3.  **Environment Configuration:**
    Create a `.env` file in the root directory (or use your build environment secrets). You need the following keys:

    ```env
    # Supabase Configuration
    SUPABASE_URL=your_supabase_project_url
    SUPABASE_ANON_KEY=your_supabase_anon_key

    # Google Gemini AI Key
    API_KEY=your_google_ai_studio_key
    # OR
    GEMINI_API_KEY=your_google_ai_studio_key
    ```

    *Note: The vite config is set up to look for either `API_KEY` or `GEMINI_API_KEY` and expose it as `process.env.GOOGLE_AI_KEY`.*

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    The app will start at `http://localhost:3000`.

## 🏗️ Project Structure

The project follows a feature-based architecture within `src/`:

*   **`src/components/`**: Shared UI components (Buttons, Cards, Modals).
*   **`src/features/`**: Core business logic modules.
    *   **`auth/`**: Authentication pages, context, and guards.
    *   **`quiz/`**: The main quiz engine.
        *   `components/`: Visual elements (Question Display, Options, Results).
        *   `hooks/`: Logic for timers, speech, and state management.
        *   `stores/`: The central Reducer for quiz state.
        *   `learning/` & `mock/`: Specific session orchestrators.
    *   **`flashcards/`**: Logic for Idiom flashcards.
    *   **`ows/`**: Logic for One Word Substitution flashcards.
*   **`src/hooks/`**: Global custom hooks (e.g., `usePWAInstall`, `useMediaQuery`).
*   **`src/lib/`**: External service clients (Supabase, IndexedDB wrapper).
*   **`src/types/`**: TypeScript definitions and data models.
*   **`src/layouts/`**: Main application shell.
*   **`src/routes/`**: Routing configuration.

## 📝 Usage

1.  **Landing:** Click "Start" to enter the dashboard.
2.  **Dashboard:** Choose "Create Quiz" to configure a new session or "English Zone" for vocabulary.
3.  **Quiz Config:** Select filters (e.g., Subject: History, Difficulty: Hard) and click "Create Quiz".
4.  **Quiz Session:** Answer questions. Use the "Ask AI Tutor" button for help in Learning Mode.
5.  **Result:** View your detailed performance breakdown and review answers.

## 🚢 Deployment

The project is configured for deployment to **GitHub Pages**.

1.  Push changes to the `main` branch.
2.  The GitHub Action defined in `.github/workflows/deploy.yml` will automatically build and deploy the app.
3.  Ensure your Repository Secrets (`API_KEY`, `SUPABASE_URL`, etc.) are set in GitHub Settings.

## 📄 License

[MIT License](LICENSE)
