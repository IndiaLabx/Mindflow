# Codebase Directory Map

```text
./
├── .github/
│   └── workflows/
│       ├── Debug_Android_apk_build.txt
│       ├── android-build.yml
│       └── deploy.yml
├── .idx/
│   └── dev.nix
├── .jules/
│   └── bolt.md
├── AI SECTION/
│   ├── CHECK.TXT
│   └── SamvadChat.tsx.txt
├── android/
│   ├── app/
│   │   ├── src/
│   │   │   ├── androidTest/
│   │   │   │   └── java/
│   │   │   │       └── com/
│   │   │   │           └── getcapacitor/
│   │   │   │               └── myapp/
│   │   │   │                   └── ExampleInstrumentedTest.java
│   │   │   ├── main/
│   │   │   │   ├── java/
│   │   │   │   │   └── com/
│   │   │   │   │       └── aklabxmindflow/
│   │   │   │   │           └── app/
│   │   │   │   │               └── MainActivity.java
│   │   │   │   ├── res/
│   │   │   │   │   ├── drawable/
│   │   │   │   │   │   ├── ic_launcher_background.xml
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-hdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-ldpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-mdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-night-hdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-night-ldpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-night-mdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-night-xhdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-night-xxhdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-night-xxxhdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-xhdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-xxhdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-xxxhdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-night/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-hdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-ldpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-mdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-night-hdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-night-ldpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-night-mdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-night-xhdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-night-xxhdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-night-xxxhdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-xhdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-xxhdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-xxxhdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-v24/
│   │   │   │   │   │   └── ic_launcher_foreground.xml
│   │   │   │   │   ├── layout/
│   │   │   │   │   │   └── activity_main.xml
│   │   │   │   │   ├── mipmap-anydpi-v26/
│   │   │   │   │   │   ├── ic_launcher.xml
│   │   │   │   │   │   └── ic_launcher_round.xml
│   │   │   │   │   ├── mipmap-hdpi/
│   │   │   │   │   │   ├── ic_launcher.png
│   │   │   │   │   │   ├── ic_launcher_background.png
│   │   │   │   │   │   ├── ic_launcher_foreground.png
│   │   │   │   │   │   └── ic_launcher_round.png
│   │   │   │   │   ├── mipmap-ldpi/
│   │   │   │   │   │   ├── ic_launcher.png
│   │   │   │   │   │   ├── ic_launcher_background.png
│   │   │   │   │   │   ├── ic_launcher_foreground.png
│   │   │   │   │   │   └── ic_launcher_round.png
│   │   │   │   │   ├── mipmap-mdpi/
│   │   │   │   │   │   ├── ic_launcher.png
│   │   │   │   │   │   ├── ic_launcher_background.png
│   │   │   │   │   │   ├── ic_launcher_foreground.png
│   │   │   │   │   │   └── ic_launcher_round.png
│   │   │   │   │   ├── mipmap-xhdpi/
│   │   │   │   │   │   ├── ic_launcher.png
│   │   │   │   │   │   ├── ic_launcher_background.png
│   │   │   │   │   │   ├── ic_launcher_foreground.png
│   │   │   │   │   │   └── ic_launcher_round.png
│   │   │   │   │   ├── mipmap-xxhdpi/
│   │   │   │   │   │   ├── ic_launcher.png
│   │   │   │   │   │   ├── ic_launcher_background.png
│   │   │   │   │   │   ├── ic_launcher_foreground.png
│   │   │   │   │   │   └── ic_launcher_round.png
│   │   │   │   │   ├── mipmap-xxxhdpi/
│   │   │   │   │   │   ├── ic_launcher.png
│   │   │   │   │   │   ├── ic_launcher_background.png
│   │   │   │   │   │   ├── ic_launcher_foreground.png
│   │   │   │   │   │   └── ic_launcher_round.png
│   │   │   │   │   ├── values/
│   │   │   │   │   │   ├── colors.xml
│   │   │   │   │   │   ├── ic_launcher_background.xml
│   │   │   │   │   │   ├── strings.xml
│   │   │   │   │   │   └── styles.xml
│   │   │   │   │   └── xml/
│   │   │   │   │       └── file_paths.xml
│   │   │   │   └── AndroidManifest.xml
│   │   │   └── test/
│   │   │       └── java/
│   │   │           └── com/
│   │   │               └── getcapacitor/
│   │   │                   └── myapp/
│   │   │                       └── ExampleUnitTest.java
│   │   ├── .gitignore
│   │   ├── build.gradle
│   │   ├── capacitor.build.gradle
│   │   └── proguard-rules.pro
│   ├── gradle/
│   │   └── wrapper/
│   │       ├── gradle-wrapper.jar
│   │       └── gradle-wrapper.properties
│   ├── .gitignore
│   ├── build.gradle
│   ├── capacitor.settings.gradle
│   ├── gradle.properties
│   ├── gradlew*
│   ├── gradlew.bat
│   ├── settings.gradle
│   └── variables.gradle
├── docs/
│   ├── audit/
│   │   ├── FINAL_NETWORK_CONSISTENCY_REVIEW.md
│   │   ├── FINAL_RUNTIME_HARDENING_REPORT.md
│   │   ├── MIND_FLOW_RUNTIME_STABILIZATION_SUMMARY.md
│   │   └── SLEEP_COMA_PRODUCTION_READINESS_REPORT.md
│   ├── AI_TUTOR_MANIFESTO.md
│   ├── ANDROID_BUILD.md
│   ├── CTO_REPORT.md
│   ├── DEPLOYMENT.md
│   ├── FULL_SYSTEM_AUDIT_REPORT.md
│   ├── IG_MEMORY.md
│   ├── OAUTH_HASH_ROUTER_GUIDE.md
│   ├── Presence_Avatar_Architecture_Guide.txt
│   ├── REPORT.md
│   ├── ai_tutor_observability.md
│   └── repo_map.json
├── google-play-assets/
│   ├── PLAY_STORE_METADATA.md
│   ├── app-icon-512x512.png
│   └── feature-graphic-1024x500.png
├── providers/
│   └── AppProvider.tsx
├── public/
│   ├── images/
│   │   ├── Temp
│   │   ├── backend-profile.png
│   │   ├── ceo-profile.png
│   │   ├── marketing-profile.png
│   │   └── owner-profile.png
│   ├── googlef2cc72f43f58845a.html
│   ├── mindflow-icon.svg
│   ├── og-image.png
│   ├── robots.txt
│   └── sitemap.xml
├── scripts/
│   ├── data/
│   │   ├── inject_chunk_aa
│   │   ├── inject_chunk_ab
│   │   ├── inject_chunk_ac
│   │   ├── inject_chunk_ad
│   │   └── inject_embeddings.sql
│   ├── backfill_embeddings.cjs
│   ├── fetch_all_questions.cjs
│   ├── generate_injection_sql.cjs
│   ├── inject.cjs
│   └── process_embeddings_repo_only.cjs
├── src/
│   ├── assets/
│   │   ├── aalok.jpg
│   │   └── default-avatar.svg
│   ├── components/
│   │   ├── Background/
│   │   │   └── Fireballs.tsx
│   │   ├── Button/
│   │   │   └── Button.tsx
│   │   ├── common/
│   │   │   ├── InstallPwaModal.tsx
│   │   │   └── PWAUpdateManager.tsx
│   │   ├── debug/
│   │   │   └── HydrationDebugger.tsx
│   │   ├── layout/
│   │   │   └── SidePanel.tsx
│   │   ├── ui/
│   │   │   ├── ErrorState/
│   │   │   │   ├── ErrorState.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Notification/
│   │   │   │   ├── Popup.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   └── ToastContainer.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── DownloadOptionsModal.tsx
│   │   │   ├── DownloadReadyModal.tsx
│   │   │   ├── KeyboardAwareBottomBar.tsx
│   │   │   ├── KeyboardAwareSurface.tsx
│   │   │   ├── MarkdownRenderer.tsx
│   │   │   ├── PresenceAvatar.tsx
│   │   │   ├── PresenceDot.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── ShimmerBlock.tsx
│   │   │   └── SynapticLoader.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── PresenceProvider.tsx
│   │   └── ProtectedRoute.tsx
│   ├── constants/
│   │   └── config.ts
│   ├── features/
│   │   ├── about/
│   │   │   └── components/
│   │   │       ├── AalokProfile.tsx
│   │   │       ├── AboutSVGs.tsx
│   │   │       ├── AboutUs.tsx
│   │   │       ├── DeveloperProfile.tsx
│   │   │       └── TeamMemberProfile.tsx
│   │   ├── admin/
│   │   │   └── components/
│   │   │       ├── AdminBulkUpdate.tsx
│   │   │       ├── AdminReportsQueue.tsx
│   │   │       └── AdminUploadGK.tsx
│   │   ├── ai/
│   │   │   ├── chat/
│   │   │   │   ├── utils/
│   │   │   │   │   └── fileProcessing.ts
│   │   │   │   ├── AIChatPage.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   ├── ChatMessage.tsx
│   │   │   │   ├── index.ts
│   │   │   │   ├── useAIChat.ts
│   │   │   │   └── useQuota.ts
│   │   │   ├── talk/
│   │   │   │   ├── AITalkPage.tsx
│   │   │   │   ├── AITalkSummary.tsx
│   │   │   │   ├── README.md
│   │   │   │   ├── VoiceBlobVisualizer.tsx
│   │   │   │   ├── audio-helpers.ts
│   │   │   │   ├── audio-player.ts
│   │   │   │   ├── audio-recorder.ts
│   │   │   │   └── useLiveAPI.ts
│   │   │   ├── AIHome.tsx
│   │   │   ├── AIHomeSVGs.tsx
│   │   │   └── Icons.tsx
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── AuthPage.tsx
│   │   │   │   ├── AuthPage.tsx.orig
│   │   │   │   ├── AuthPage.tsx.rej
│   │   │   │   ├── ProfilePage.tsx
│   │   │   │   ├── RestoreAccountModal.tsx
│   │   │   │   ├── SettingsPage.tsx
│   │   │   │   ├── SubscriptionPage.tsx
│   │   │   │   └── SupportPage.tsx
│   │   │   ├── context/
│   │   │   │   └── AuthContext.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useProfileStats.ts
│   │   │   ├── utils/
│   │   │   │   └── cropImage.ts
│   │   │   └── AuthGuard.tsx
│   │   ├── community/
│   │   │   ├── api/
│   │   │   │   ├── chatApi.ts
│   │   │   │   ├── communityApi.ts
│   │   │   │   ├── deletionService.ts
│   │   │   │   ├── reportsApi.ts
│   │   │   │   └── uploadMedia.ts
│   │   │   ├── components/
│   │   │   │   ├── reports/
│   │   │   │   │   ├── BlockUserPromptModal.tsx
│   │   │   │   │   └── ReportModal.tsx
│   │   │   │   ├── ChatListSkeleton.tsx
│   │   │   │   ├── CommentSkeleton.tsx
│   │   │   │   ├── CommentThread.tsx
│   │   │   │   ├── ConfirmDeleteModal.tsx
│   │   │   │   ├── CreatePostModal.tsx
│   │   │   │   ├── PostCard.tsx
│   │   │   │   ├── PostCardSkeleton.tsx
│   │   │   │   ├── ReelSkeleton.tsx
│   │   │   │   ├── ReelUploadModal.tsx
│   │   │   │   └── SocialHeader.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useCreatePost.ts
│   │   │   │   ├── useDeletion.ts
│   │   │   │   └── useSocialRealtime.ts
│   │   │   ├── pages/
│   │   │   │   ├── ChatInputBar.tsx
│   │   │   │   ├── ChatIntro.tsx
│   │   │   │   ├── ChatMessageItem.tsx
│   │   │   │   ├── ChatRooms.tsx
│   │   │   │   ├── CommunityFeed.tsx
│   │   │   │   ├── CommunitySearch.tsx
│   │   │   │   ├── PostPage.tsx
│   │   │   │   ├── ReelCommentsPage.tsx
│   │   │   │   ├── ReelsFeed.tsx
│   │   │   │   └── UserProfile.tsx
│   │   │   └── utils/
│   │   │       └── errorTranslation.ts
│   │   ├── flashcards/
│   │   │   ├── components/
│   │   │   │   └── FlashcardSummary.tsx
│   │   │   └── utils/
│   │   │       └── pdfGenerator.ts
│   │   ├── idioms/
│   │   │   ├── components/
│   │   │   │   ├── IdiomCard.tsx
│   │   │   │   ├── IdiomNavigationPanel.tsx
│   │   │   │   └── IdiomSession.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useIdiomFilterCounts.ts
│   │   │   │   └── useIdiomProgress.ts
│   │   │   ├── utils/
│   │   │   │   └── supabaseIdioms.ts
│   │   │   └── IdiomsConfig.tsx
│   │   ├── notifications/
│   │   │   ├── admin/
│   │   │   │   ├── AdminEditNotificationModal.tsx
│   │   │   │   └── AdminNotifications.tsx
│   │   │   ├── components/
│   │   │   │   ├── NotificationBell.tsx
│   │   │   │   └── NotificationSettings.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── index.ts
│   │   │   │   ├── useNotificationPreferences.ts
│   │   │   │   ├── useNotifications.ts
│   │   │   │   └── usePushNotifications.ts
│   │   │   ├── pages/
│   │   │   │   └── NotificationsPage.tsx
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── ows/
│   │   │   ├── components/
│   │   │   │   ├── OWSCard.tsx
│   │   │   │   ├── OWSNavigationPanel.tsx
│   │   │   │   └── OWSSession.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useOWSProgress.ts
│   │   │   │   └── useOwsFilterCounts.ts
│   │   │   ├── utils/
│   │   │   │   ├── pdfGenerator.ts
│   │   │   │   └── supabaseOws.ts
│   │   │   └── OWSConfig.tsx
│   │   ├── quiz/
│   │   │   ├── components/
│   │   │   │   ├── Landing/
│   │   │   │   │   ├── AnimatedLogo.tsx
│   │   │   │   │   ├── CinematicIntro.css
│   │   │   │   │   ├── CinematicIntro.tsx
│   │   │   │   │   ├── DemoCard.tsx
│   │   │   │   │   ├── MobileDemoCard.tsx
│   │   │   │   │   ├── MobileOnboarding.tsx
│   │   │   │   │   ├── Typewriter.tsx
│   │   │   │   │   └── WelcomeIntro.tsx
│   │   │   │   ├── archive/
│   │   │   │   │   ├── AnimatedCounter.tsx
│   │   │   │   │   ├── DonutChart.tsx
│   │   │   │   │   ├── QuizResult.tsx
│   │   │   │   │   └── README.md
│   │   │   │   ├── ui/
│   │   │   │   │   ├── Accordion.tsx
│   │   │   │   │   ├── ActiveFiltersBar.tsx
│   │   │   │   │   ├── ClaymorphismSwitch.css
│   │   │   │   │   ├── ClaymorphismSwitch.tsx
│   │   │   │   │   ├── FilterGroup.tsx
│   │   │   │   │   ├── InstallPWA.tsx
│   │   │   │   │   ├── MultiSelectDropdown.tsx
│   │   │   │   │   ├── QuickStartButtons.tsx
│   │   │   │   │   ├── ScrollableCapsules.tsx
│   │   │   │   │   ├── SegmentedControl.tsx
│   │   │   │   │   ├── SettingsModal.tsx
│   │   │   │   │   └── SettingsToggle.tsx
│   │   │   │   ├── AdminEditMaterialModal.tsx
│   │   │   │   ├── AdminHome.tsx
│   │   │   │   ├── AdminManageMaterials.tsx
│   │   │   │   ├── AdminSVGs.tsx
│   │   │   │   ├── AdminUploadMaterials.tsx
│   │   │   │   ├── AiExplanationButton.tsx
│   │   │   │   ├── AttemptedQuizCard.tsx
│   │   │   │   ├── AttemptedQuizzesList.tsx
│   │   │   │   ├── BlueprintBuilder.tsx
│   │   │   │   ├── BlueprintPreview.tsx
│   │   │   │   ├── BlueprintPreviewWrapper.tsx
│   │   │   │   ├── BookmarksPage.tsx
│   │   │   │   ├── CookingLoader.tsx
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Dashboard.tsx.bak
│   │   │   │   ├── DashboardSVGs.tsx
│   │   │   │   ├── EnglishQuizHome.tsx
│   │   │   │   ├── ExamBlueprintsHub.tsx
│   │   │   │   ├── GodQuizResult.tsx
│   │   │   │   ├── LandingPage.tsx
│   │   │   │   ├── McqsQuizHome.tsx
│   │   │   │   ├── MockQuizResult.tsx
│   │   │   │   ├── PerformanceAnalytics.tsx
│   │   │   │   ├── QuizBottomNav.tsx
│   │   │   │   ├── QuizBreadcrumbs.tsx
│   │   │   │   ├── QuizConfig.tsx
│   │   │   │   ├── QuizExplanation.tsx
│   │   │   │   ├── QuizLibrary.tsx
│   │   │   │   ├── QuizLibraryToolbar.tsx
│   │   │   │   ├── QuizNavigationPanel.tsx
│   │   │   │   ├── QuizOption.test.tsx
│   │   │   │   ├── QuizOption.tsx
│   │   │   │   ├── QuizOverallProgress.tsx
│   │   │   │   ├── QuizProgress.tsx
│   │   │   │   ├── QuizQuestionDisplay.tsx
│   │   │   │   ├── QuizQuestionHeader.tsx
│   │   │   │   ├── QuizResult.tsx
│   │   │   │   ├── QuizReview.tsx
│   │   │   │   ├── QuizSessionGuard.tsx
│   │   │   │   ├── QuizStats.tsx
│   │   │   │   ├── ResultGuard.tsx
│   │   │   │   ├── SavedQuizCard.tsx
│   │   │   │   ├── SavedQuizzesList.tsx
│   │   │   │   └── ShareGatekeeper.tsx
│   │   │   ├── context/
│   │   │   │   └── QuizContext.tsx
│   │   │   ├── data/
│   │   │   │   ├── Synonym data.json
│   │   │   │   ├── idioms.json
│   │   │   │   ├── ows.json
│   │   │   │   ├── questions.ts
│   │   │   │   ├── validate_synonyms_data.js
│   │   │   │   └── validation_report.json
│   │   │   ├── engine/
│   │   │   │   ├── plugins/
│   │   │   │   │   ├── mcqPlugin.ts
│   │   │   │   │   └── synonymPlugin.ts
│   │   │   │   ├── TestEngineController.ts
│   │   │   │   ├── blueprintMath.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── quizEngine.ts
│   │   │   │   ├── quizPlugin.ts
│   │   │   │   └── timerWorker.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useAntiCheat.ts
│   │   │   │   ├── useGodSessionTimer.ts
│   │   │   │   ├── useLearningTimer.ts
│   │   │   │   ├── useMockSessionTimer.ts
│   │   │   │   ├── useMockTimer.ts
│   │   │   │   ├── useOptimizedFilterCounts.ts
│   │   │   │   ├── usePerformanceAnalytics.ts
│   │   │   │   ├── useQuestionIndex.ts
│   │   │   │   ├── useQuiz.ts
│   │   │   │   ├── useQuizSessionTimer.ts
│   │   │   │   ├── useTextToSpeech.test.tsx
│   │   │   │   └── useTextToSpeech.ts
│   │   │   ├── layouts/
│   │   │   │   └── ActiveQuizLayout.tsx
│   │   │   ├── learning/
│   │   │   │   └── LearningSession.tsx
│   │   │   ├── live/
│   │   │   │   ├── LiveQuizRoom.tsx
│   │   │   │   ├── useGenAILive.ts
│   │   │   │   ├── useGenAILive.ts.bak
│   │   │   │   ├── useGenAILive.ts.orig
│   │   │   │   └── useGenAILive.ts.patch
│   │   │   ├── mock/
│   │   │   │   ├── GodModeSession.tsx
│   │   │   │   └── MockSession.tsx
│   │   │   ├── services/
│   │   │   │   ├── analyticsService.ts
│   │   │   │   ├── blueprintService.ts
│   │   │   │   └── questionService.ts
│   │   │   ├── stores/
│   │   │   │   ├── quizReducer.test.ts
│   │   │   │   ├── quizReducer.ts
│   │   │   │   ├── useAnalyticsStore.ts
│   │   │   │   ├── useBookmarkStore.ts
│   │   │   │   ├── useFlashcardStore.ts
│   │   │   │   ├── useQuizSessionStore.ts
│   │   │   │   └── useSyncStore.ts
│   │   │   ├── types/
│   │   │   │   ├── blueprint.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── store.ts
│   │   │   ├── utils/
│   │   │   │   └── adminMaterialUtils.ts
│   │   │   └── QuizLayout.tsx
│   │   ├── school/
│   │   │   ├── SchoolDownloads.tsx
│   │   │   ├── SchoolHome.tsx
│   │   │   └── SchoolSVGs.tsx
│   │   ├── settings/
│   │   │   └── components/
│   │   │       ├── AppPreferencesPage.tsx
│   │   │       ├── DeleteAccountPage.tsx
│   │   │       └── MyReportsPage.tsx
│   │   ├── synonyms/
│   │   │   ├── components/
│   │   │   │   ├── ConnectGame.tsx
│   │   │   │   ├── ImposterGame.tsx
│   │   │   │   ├── SpeedGame.tsx
│   │   │   │   ├── SynonymCard.tsx
│   │   │   │   ├── SynonymClusterList.tsx
│   │   │   │   ├── SynonymFlashcardSession.tsx
│   │   │   │   ├── SynonymNavigationPanel.tsx
│   │   │   │   ├── SynonymPhase1Session.tsx
│   │   │   │   ├── SynonymQuizSession.tsx
│   │   │   │   ├── SynonymQuizSession.tsx.orig
│   │   │   │   ├── SynonymsSVGs.tsx
│   │   │   │   └── WordDetailModal.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useSynonymProgress.ts
│   │   │   │   └── useSynonymsData.ts
│   │   │   ├── services/
│   │   │   │   └── synonymService.ts
│   │   │   ├── utils/
│   │   │   │   └── pdfGenerator.ts
│   │   │   ├── SynapticLoader.tsx
│   │   │   ├── Synonym.html
│   │   │   └── SynonymsConfig.tsx
│   │   └── tools/
│   │       ├── bilingual-pdf-maker/
│   │       │   ├── utils/
│   │       │   │   └── pdfGenerator.ts
│   │       │   └── BilingualPdfMaker.tsx
│   │       ├── flashcard-maker/
│   │       │   ├── components/
│   │       │   │   ├── Editor.tsx
│   │       │   │   └── Preview.tsx
│   │       │   ├── utils/
│   │       │   │   └── canvasDrawing.ts
│   │       │   ├── FlashcardMaker.tsx
│   │       │   └── types.ts
│   │       ├── quiz-pdf-ppt-generator/
│   │       │   ├── components/
│   │       │   │   └── GeneratorModal.tsx
│   │       │   ├── utils/
│   │       │   │   ├── pdfGenerator.ts
│   │       │   │   └── pptGenerator.ts
│   │       │   └── QuizPdfPptGenerator.tsx
│   │       ├── text-exporter/
│   │       │   └── TextExporter.tsx
│   │       ├── ToolsHome.tsx
│   │       └── ToolsSVGs.tsx
│   ├── hooks/
│   │   ├── useAppVisibilityReawakening.ts
│   │   ├── useDependentFilters.ts
│   │   ├── useFilterCounts.ts
│   │   ├── useHardwareBackButton.ts
│   │   ├── useJSONDownloader.spec.ts
│   │   ├── useJSONDownloader.ts
│   │   ├── useLocalStorageState.ts
│   │   ├── useMediaQuery.ts
│   │   ├── useNavSpinner.ts
│   │   ├── useNotification.ts
│   │   ├── usePDFGenerator.ts
│   │   ├── usePWAInstall.ts
│   │   ├── useQuizSounds.ts
│   │   ├── useSound.ts
│   │   └── useTimer.ts
│   ├── layouts/
│   │   └── MainLayout.tsx
│   ├── lib/
│   │   ├── db.ts
│   │   ├── fetchWithTimeout.ts
│   │   ├── haptics.ts
│   │   ├── supabase.ts
│   │   └── syncService.ts
│   ├── pages/
│   │   ├── PrivacyPolicy.tsx
│   │   └── TermsOfUse.tsx
│   ├── providers/
│   │   └── AppProvider.tsx
│   ├── routes/
│   │   ├── AppRoutes.tsx
│   │   └── AppRoutes.tsx.rej
│   ├── stores/
│   │   ├── useDebugStore.ts
│   │   ├── useNotificationStore.ts
│   │   ├── usePresenceStore.ts
│   │   ├── useSettingsStore.ts
│   │   └── useSocialStore.ts
│   ├── types/
│   │   ├── mammoth.d.ts
│   │   └── models.ts
│   ├── utils/
│   │   ├── avatar.ts
│   │   ├── cn.ts
│   │   ├── platform.ts
│   │   └── withTimeout.ts
│   ├── workers/
│   │   └── filterWorker.ts
│   ├── App.tsx
│   ├── assets.d.ts
│   ├── index.css
│   ├── index.tsx
│   └── vite-env.d.ts
├── supabase/
│   ├── functions/
│   │   └── push-notifications/
│   │       ├── deno.json
│   │       └── index.ts
│   └── migrations/
│       ├── 20240101000000_create_chat_message_likes.sql
│       ├── 20240101000000_soft_delete_and_rpc.sql
│       ├── 20240311000000_create_user_synonym_interactions.sql
│       ├── 20240401000000_create_reels_tables.sql
│       ├── 20240401000001_seed_reels_data.sql
│       ├── 20250328_notification_system.sql
│       ├── 20250328_notification_system_fix.sql
│       ├── 20250329000000_deduplicate_idioms.sql
│       ├── 20250329000001_deduplicate_idioms_by_phrase.sql
│       ├── 20250401000000_account_deletion.sql
│       ├── 20250401000001_account_deletion_rpc.sql
│       ├── 20250501000000_community_blocking.sql
│       ├── 20250510000000_create_reporting_system.sql
│       ├── 20250511000000_create_user_active_sessions.sql
│       ├── 20250512000000_add_delete_policy_user_active_sessions.sql
│       ├── 20250512000000_export_user_data_rpc.sql
│       ├── 20260513081332_update_reels_policies_and_feed_rpc.sql
│       ├── 20260516000000_quiz_hard_delete_cron.sql
│       ├── 20260516200010_create_quiz_session_rpc_and_cleanup.sql
│       ├── 20260517000000_clone_shared_quiz_rpc.sql
│       ├── 20260517000001_submit_quiz_session_rpc.sql
│       ├── 20260517000001_update_clone_shared_quiz_rpc.sql
│       ├── 20260517000002_fix_clone_shared_quiz_rpc.sql
│       ├── 20260517094911_cleanup_orphaned_bridge_rows.sql
│       ├── 20260517100000_create_analytics_events.sql
│       ├── 20260517100001_fix_submit_rpc.sql
│       ├── 20260517100002_make_rpc_idempotent.sql
│       ├── 20260517100003_add_relational_status.sql
│       └── 20260517100004_fix_rpc_accuracy_type.sql
├── utils/
│   └── cn.ts
├── verification/
│   ├── mock_engine_error.png
│   ├── synonyms_config_debug_final.png
│   ├── synonyms_config_success.png
│   ├── verify_dropdown_open.py
│   ├── verify_dropdown_render.py
│   ├── verify_dropdown_screenshot.py
│   ├── verify_engine.py
│   ├── verify_engine2.py
│   ├── verify_engine3.py
│   ├── verify_engine4.py
│   └── verify_filter_dropdown.py
├── .gitignore
├── GK_QUIZ_AUDIT_REPORT.md
├── README.md
├── SLEEP_COMA_DIAGNOSTIC_REPORT.md
├── SLEEP_COMA_IMPLEMENTATION_SAFETY_REVIEW.md
├── SLEEP_COMA_RUNTIME_VERIFICATION_ADDENDUM.md
├── SLEEP_COMA_STABILIZATION_PLAN.md
├── VERIFICATION_REPORT.md
├── VERIFICATION_SWEEP_REPORT.md
├── capacitor.config.ts
├── fix-android-immersive.patch
├── fix_duplicate.py
├── fix_polishes.py
├── index.html
├── metadata.json
├── package-lock.json
├── package.json
├── postcss.config.js
├── replace_mcq_card.py
├── tailwind.config.js
├── tree_output.txt
├── tsconfig.json
├── update_secondary_cards.py
├── verify_dashboard.py
└── vite.config.ts

174 directories, 518 files
```
