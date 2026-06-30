import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Layers,
  Settings,
  FileText,
  Tag,
  RotateCcw,
  Loader2,
  AlertCircle,
  Database,
  BookOpen,
  Timer,
  Check,
  Save,
  Crown
} from 'lucide-react';
import { Button } from '../../../components/Button/Button';
import { fetchQuestionMetadata, fetchQuestionsByIds } from '../services/questionService';
import { Question, InitialFilters, QuizMode, SavedQuiz } from '../types';
import { cn } from '../../../utils/cn';
import { useDependentFilters } from '@/features/quiz';
import { db } from '../../../lib/db';
import { APP_CONFIG } from '../../../constants/config';
import { initialState } from '../stores/useQuizSessionStore';

// UI Components
import { CookingLoader } from './CookingLoader';
import { FilterGroup } from './ui/FilterGroup';
import { MultiSelectDropdown } from './ui/MultiSelectDropdown';
import { SegmentedControl } from './ui/SegmentedControl';
import { QuickStartButtons } from './ui/QuickStartButtons';
import { ActiveFiltersBar } from './ui/ActiveFiltersBar';
import { Accordion } from './ui/Accordion';
import { ScrollableCapsules } from './ui/ScrollableCapsules';
import { ExamBlueprintsHubPage } from '@/pages/ExamBlueprintsHubPage';

// Optimization Hooks
import { useQuestionIndex, filterQuestionsByIndex } from '../hooks/useQuestionIndex';
import { useOptimizedFilterCounts } from '../hooks/useOptimizedFilterCounts';
import { useNotificationStore } from '../../../stores/useNotificationStore';
import { supabase } from '../../../lib/supabase';
import { syncService } from '../../../lib/syncService';

interface QuizConfigProps {
  onStart: (questions: Question[], filters?: InitialFilters, mode?: QuizMode, quizName?: string) => void;
  onBack: () => void;
}

const emptyFilters: InitialFilters = {
  subject: [],
  topic: [],
  subTopic: [],
  difficulty: [],
  questionType: [],
  examName: [],
  examYear: [],
  examDateShift: [],
  tags: [],
};

export const QuizConfig: React.FC<QuizConfigProps> = ({ onStart, onBack }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<QuizMode>((location.state as any)?.initialMode || 'learning');
  const [filters, setFilters] = useState<InitialFilters>(emptyFilters);
  const [quizName, setQuizName] = useState('');

  // State for Data Fetching & Sync
  const [metadata, setMetadata] = useState<Question[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [showEmptyError, setShowEmptyError] = useState(false);

  // 0. Fetch Metadata on Mount
  const loadMetadata = useCallback(async () => {
    try {
      setIsLoadingMetadata(true);
      setError(null);
      setProgress({ current: 0, total: 0 });

      // 1. Instantly load from cache
      const cachedMetadata = await db.getQuizMetadataCache();
      if (cachedMetadata && cachedMetadata.length > 0) {
        setMetadata(cachedMetadata);
        setIsLoadingMetadata(false); // Instantly render UI
      }

      // 2. Fetch delta in the background (or foreground if no cache)
      const data = await fetchQuestionMetadata((current, total) => {
        setProgress({ current, total });
      });

      // 3. Update state
      setMetadata(data);

      if (data.length === 0) {
        console.warn("No questions fetched from database.");
      }
    } catch (err) {
      console.error("Failed to load questions:", err);
      setError("Failed to load question bank. Please check your internet connection.");
    } finally {
      setIsLoadingMetadata(false);
    }
  }, []);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  // 1. Build Indexes (Performance Optimization)
  const questionIndex = useQuestionIndex(metadata);

  // 2. Build Classification Map for dependent dropdowns
  const classificationMap = useMemo(() => {
    const map = new Map<string, Map<string, Set<string>>>();
    metadata.forEach(q => {
      const { subject, topic, subTopic } = q.classification;
      if (!map.has(subject)) map.set(subject, new Map());
      const topicMap = map.get(subject)!;
      if (!topicMap.has(topic)) topicMap.set(topic, new Set());
      if (subTopic) topicMap.get(topic)!.add(subTopic);
    });
    return map;
  }, [metadata]);

  // 3. Hooks Integration for Filter Logic
  const { availableTopics, availableSubTopics } = useDependentFilters({
    selectedFilters: filters,
    setSelectedFilters: setFilters,
    classificationMap
  });

  // Calculate dynamic counts using Set operations
  const filterCounts = useOptimizedFilterCounts({
    allQuestions: metadata,
    selectedFilters: filters,
    index: questionIndex
  });

  // 4. Derived Lists for Dropdown Options
  const allSubjects = useMemo(() => Array.from(classificationMap.keys()).filter(Boolean).sort(), [classificationMap]);
  const allExamNames = useMemo(() => Array.from(new Set(metadata.map(q => q.examName ?? q.sourceInfo?.examName))).filter(Boolean).sort(), [metadata]);
  const allExamYears = useMemo(() => Array.from(new Set(metadata.map(q => String(q.examYear ?? q.sourceInfo?.examYear)))).filter(Boolean).sort(), [metadata]);
  const allExamShifts = useMemo(() => Array.from(new Set(metadata.map(q => (q.examDateShift ?? q.sourceInfo?.examDateShift) || ''))).filter(Boolean).sort(), [metadata]);
  const allTags = useMemo(() => Array.from(new Set(metadata.flatMap(q => q.tags))).filter(Boolean).sort(), [metadata]);

  // 5. Final Filtered Metadata Calculation using O(1) Set Intersections
  const filteredMetadata = useMemo(() => {
    return filterQuestionsByIndex(metadata, questionIndex, filters);
  }, [metadata, questionIndex, filters]);

  // Clear "No questions found" error when filters change
  useEffect(() => {
    if (filteredMetadata.length > 0) {
      setShowEmptyError(false);
    }
  }, [filteredMetadata.length]);

  // --- Handlers ---
    const createQuizWithQuestions = async (questionSubset: Question[], activeFilters: InitialFilters) => {
    try {
      setIsStartingQuiz(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
         useNotificationStore.getState().showToast({ variant: "error", message: "You must be logged in to create a quiz." });
         setIsStartingQuiz(false);
         return;
      }

      const userId = session.user.id;
      const quizId = crypto.randomUUID();
      const finalName = quizName.trim() || `Quiz ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

      // Pass the unhydrated subset of questions (metadata only).
      // QuizSessionGuard will handle fetching the full content in a sliding window later.
      // This prevents the initial payload waterfall for massive exams.
      const newQuiz: SavedQuiz = {
        id: quizId,
        name: finalName,
        createdAt: Date.now(),
        filters: activeFilters,
        mode: mode,
        questions: questionSubset,
        state: {
          ...initialState,
          status: 'quiz',
          mode: mode,
          activeQuestions: questionSubset,
          filters: activeFilters,
          quizId: quizId,
          quizTimeRemaining: mode === 'mock'
            ? Math.max(APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION, questionSubset.length * APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION)
            : 0,
          remainingTimes: mode === 'learning'
            ? questionSubset.reduce((acc, q) => ({ ...acc, [q.id]: APP_CONFIG.TIMERS.LEARNING_MODE_DEFAULT }), {})
            : {}
        }
      };

      // 1. Insert into saved_quizzes
      const { error: quizError } = await supabase.from('saved_quizzes').insert({
        id: newQuiz.id,
        user_id: userId,
        name: newQuiz.name,
        created_at: newQuiz.createdAt,
        filters: newQuiz.filters,
        mode: newQuiz.mode,
        state: newQuiz.state,
      });

      if (quizError) {
        console.error('Error saving quiz to Supabase:', quizError);
        useNotificationStore.getState().showToast({ variant: 'error', message: 'Failed to save quiz to server. Please try again.' });
        setIsStartingQuiz(false);
        return;
      }

      // 2. Insert into bridge_saved_quiz_questions
      const bridgeData = newQuiz.questions.map((q, index) => ({
        quiz_id: newQuiz.id,
        question_id: q.id,
        sort_order: index,
        user_id: userId // Add user_id so RLS allows the insert
      }));

      const { error: bridgeError } = await supabase.from('bridge_saved_quiz_questions').insert(bridgeData);

      if (bridgeError) {
        console.error('Error saving bridge data:', bridgeError);
        useNotificationStore.getState().showToast({ variant: 'error', message: 'Failed to save quiz questions to server. Please try again.' });
        setIsStartingQuiz(false);
        return;
      }

      // navigate to Saved route to fetch newly created quiz directly from the cloud
      navigate('/quiz/library?tab=created');

    } catch (err) {
      console.error("Failed to create quiz:", err);
      useNotificationStore.getState().showToast({ variant: 'error', message: 'Failed to create quiz. Please try again.' });
    } finally {
      setIsStartingQuiz(false);
    }
  };

  const handleCreate = () => {
    if (filteredMetadata.length === 0) {
      setShowEmptyError(true);
      setTimeout(() => setShowEmptyError(false), 4000);
      return;
    }
    createQuizWithQuestions(filteredMetadata, filters);
  };

  const handleQuickStart = useCallback((type: 'Easy' | 'Medium' | 'Hard' | 'Mix') => {
    let quickFilters = emptyFilters;
    if (type !== 'Mix') {
      quickFilters = { ...emptyFilters, difficulty: [type] };
    }

    const subset = type === 'Mix'
      ? metadata
      : metadata.filter(q => (q.properties?.difficulty) === type);

    const shuffled = [...subset].sort(() => 0.5 - Math.random()).slice(0, 25);

    if (shuffled.length === 0) {
      useNotificationStore.getState().showToast({ variant: 'error', message: `No questions found for difficulty: ${type}` });
      return;
    }

    createQuizWithQuestions(shuffled, quickFilters);
  }, [metadata]);

  const handleFilterChange = useCallback((key: keyof InitialFilters, selected: string[]) => {
    setFilters(prev => ({ ...prev, [key]: selected }));
  }, []);

  const removeFilter = useCallback((key: keyof InitialFilters, value?: string) => {
    if (value) {
      setFilters(prev => ({ ...prev, [key]: (prev[key] || []).filter((item: string) => item !== value) }));
    } else {
      setFilters(prev => ({ ...prev, [key]: [] }));
    }
  }, []);

  const handleSegmentToggle = useCallback((key: keyof InitialFilters, option: string) => {
    setFilters(prev => {
      const current = prev[key] || [];
      const isSelected = (current as string[]).includes(option);
      return {
        ...prev,
        [key]: isSelected ? [...(current as string[])].filter(i => i !== option) : [...(current as string[]), option as any]
      };
    });
  }, []);

  // --- Loading State Render ---
  if (isLoadingMetadata) {
    const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
    return (
      <CookingLoader
        progress={percentage}
        syncedItems={progress.current}
        totalItems={progress.total}
      />
    );
  }

  // --- Error State Render ---
  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 bg-white dark:bg-gray-800 md:rounded-3xl w-full max-w-6xl mx-auto md:border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center animate-fade-in">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Connection Error</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">{error}</p>
        <div className="flex gap-4 mt-4">
          <Button variant="outline" onClick={onBack}>Go Back</Button>
          <Button onClick={loadMetadata}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 min-h-screen md:min-h-0 md:h-auto md:rounded-3xl shadow-sm md:border border-gray-200 dark:border-gray-700 flex flex-col max-w-6xl mx-auto animate-fade-in overflow-hidden relative">

      {/* Overlay for "Starting Quiz" blocking interaction */}
      {isStartingQuiz && (
        <div className="fixed inset-0 z-[100] bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
          <Loader2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
          <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100">Creating Your Quiz</h3>
          <p className="text-gray-500 dark:text-gray-400">Saving questions to database...</p>
        </div>
      )}

      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4 cursor-pointer hover:text-indigo-600 dark:text-indigo-400 w-fit" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back</span>
        </div>

        <div className="text-center mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-indigo-900 dark:text-indigo-100 mb-1">Create New Quiz</h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Select from <span className="font-bold text-indigo-600 dark:text-indigo-400">{metadata.length.toLocaleString()}</span> available questions.</p>
        </div>
      </div>

      {/* Scrollable Config Content */}
      <div className="p-6 pb-32 space-y-6 bg-gray-50 dark:bg-gray-900/50 flex-1 overflow-y-auto">

        {/* Header actions (Mode & Quick Start) inline */}
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-3 mb-4 bg-white dark:bg-gray-800 p-1.5 sm:p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative z-20 min-w-0">

          {/* Segmented Control for Mode Switch */}
          <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl flex-1 max-w-[400px] overflow-x-auto hide-scrollbar flex-nowrap min-w-0">
            <button
              onClick={() => setMode('learning')}
              className={cn(
                "shrink-0 flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200",
                mode === 'learning'
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-gray-600"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-transparent"
              )}
            >
              <BookOpen className="w-4 h-4 hidden sm:block" />
              <span>Learning</span>
            </button>
            <button
              onClick={() => setMode('mock')}
              className={cn(
                "shrink-0 flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200",
                mode === 'mock'
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-gray-600"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-transparent"
              )}
            >
              <Timer className="w-4 h-4 hidden sm:block" />
              <span>Mock</span>
            </button>
            <button
              onClick={() => setMode('god')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200",
                mode === 'god'
                  ? "bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm border border-red-200 dark:border-red-900/30"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-transparent"
              )}
            >
              <Crown className="w-4 h-4 hidden sm:block" />
              <span>God Mode</span>
            </button>
          </div>

          {/* Quick Quiz Button */}
          <div className="relative z-50">
            <QuickStartButtons onQuickStart={handleQuickStart} />
          </div>
        </div>



        {mode === 'god' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <ExamBlueprintsHubPage onBack={onBack} onLaunchBlueprint={(bp: any) => navigate(`/blueprints/preview/${bp.id}`)} metadataIndex={questionIndex} />
          </div>
        )}

        <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6", mode === 'god' && "hidden")}>
          <FilterGroup
            title="Classification"
            icon={<Layers className="w-5 h-5" />}
            showClearAll={filters.subject.length > 0 || filters.topic.length > 0 || filters.subTopic.length > 0}
            onClearAll={() => setFilters(prev => ({ ...prev, subject: [], topic: [], subTopic: [] }))}
          >
            <ScrollableCapsules
              label="Subject"
              tooltip="Filter questions by broad academic discipline"
              options={allSubjects}
              selectedOptions={filters.subject}
              onOptionToggle={(opt) => {
                const newSelection = filters.subject.includes(opt)
                  ? filters.subject.filter(item => item !== opt)
                  : [...filters.subject, opt];
                handleFilterChange('subject', newSelection);
              }}
              counts={filterCounts.subject || {}}
              hideZeroCount
              maxRows={3}
            />
            <ScrollableCapsules
              label="Topic"
              tooltip="Filter by specific topics within the selected subjects"
              options={availableTopics}
              selectedOptions={filters.topic}
              onOptionToggle={(opt) => {
                const newSelection = filters.topic.includes(opt)
                  ? filters.topic.filter(item => item !== opt)
                  : [...filters.topic, opt];
                handleFilterChange('topic', newSelection);
              }}
              counts={filterCounts.topic || {}}
              hideZeroCount
              isLoading={filters.subject.length > 0 && availableTopics.length === 0 && isLoadingMetadata}
              emptyMessage={filters.subject.length === 0 ? "Select Subject First" : "No topics available"}
              maxRows={3}
            />
            <ScrollableCapsules
              label="Sub-Topic"
              tooltip="Filter by granular sub-topics for precise practice"
              options={availableSubTopics}
              selectedOptions={filters.subTopic}
              onOptionToggle={(opt) => {
                const newSelection = filters.subTopic.includes(opt)
                  ? filters.subTopic.filter(item => item !== opt)
                  : [...filters.subTopic, opt];
                handleFilterChange('subTopic', newSelection);
              }}
              counts={filterCounts.subTopic || {}}
              hideZeroCount
              isLoading={filters.topic.length > 0 && availableSubTopics.length === 0 && isLoadingMetadata}
              emptyMessage={filters.topic.length === 0 ? "Select Topic First" : "No sub-topics available"}
              maxRows={3}
            />
          </FilterGroup>

          <FilterGroup title="Properties" icon={<Settings className="w-5 h-5" />}>
            <SegmentedControl
              label="Difficulty"
              tooltip="Choose question complexity level"
              options={['Easy', 'Medium', 'Hard']}
              selectedOptions={filters.difficulty}
              onOptionToggle={(opt) => handleSegmentToggle('difficulty', opt)}
              counts={filterCounts.difficulty || {}}
              hideZeroCount
            />
            <SegmentedControl
              label="Question Type"
              tooltip="Filter by question format (e.g., Multiple Choice)"
              options={['MCQ']}
              selectedOptions={filters.questionType}
              onOptionToggle={(opt) => handleSegmentToggle('questionType', opt)}
              counts={filterCounts.questionType || {}}
              hideZeroCount
            />
          </FilterGroup>
        </div>

        {mode !== 'god' && (
          <>
            {/* Progressive Disclosure: Advanced Filters Accordion */}
            <Accordion title="Advanced Filters">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FilterGroup title="Source" icon={<FileText className="w-5 h-5" />}>
                  <MultiSelectDropdown
                    label="Exam Name"
                    options={allExamNames}
                    selectedOptions={filters.examName}
                    onSelectionChange={(sel) => handleFilterChange('examName', sel)}
                    placeholder="Select Exams"
                    counts={filterCounts.examName || {}}
                    hideZeroCount
                  />
                  <MultiSelectDropdown
                    label="Exam Year"
                    options={allExamYears}
                    selectedOptions={filters.examYear}
                    onSelectionChange={(sel) => handleFilterChange('examYear', sel)}
                    placeholder="Select Years"
                    counts={filterCounts.examYear || {}}
                    hideZeroCount
                  />
                  <MultiSelectDropdown
                    label="Exam Shift"
                    options={allExamShifts}
                    selectedOptions={filters.examDateShift}
                    onSelectionChange={(sel) => handleFilterChange('examDateShift', sel)}
                    placeholder="Select Shifts"
                    counts={filterCounts.examDateShift || {}}
                    hideZeroCount
                  />
                </FilterGroup>

                <FilterGroup title="Tags" icon={<Tag className="w-5 h-5" />}>
                  <MultiSelectDropdown
                    label="Search Tags"
                    options={allTags}
                    selectedOptions={filters.tags}
                    onSelectionChange={(sel) => handleFilterChange('tags', sel)}
                    placeholder="Filter by Tags"
                    counts={filterCounts.tags || {}}
                    hideZeroCount
                  />
                </FilterGroup>
              </div>
            </Accordion>

            {/* Active Filters Displayed above sticky footer area */}
            <div className="pb-8">
               <ActiveFiltersBar
                filters={filters}
                onRemoveFilter={removeFilter}
                onClearAll={() => setFilters(emptyFilters)}
              />
            </div>
          </>
        )}
      </div>

      {/* Sticky Action Footer */}
      {mode !== 'god' && (
        <div className="fixed bottom-0 left-0 w-full z-[40] border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 py-3 pb-safe md:px-6 md:py-4 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.1)] dark:shadow-none">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 w-full">
             {/* Quiz Name Input - Compact for footer */}
             <div className="w-full sm:w-64 flex-shrink-0">
              <input
                type="text"
                value={quizName}
                onChange={(e) => setQuizName(e.target.value)}
                placeholder="Quiz Name (Optional)"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setFilters(emptyFilters)} className="flex-shrink-0 h-10 px-3">
                <RotateCcw className="w-4 h-4" />
              </Button>

              <div className="relative w-full">
                {showEmptyError && (
                  <div className="absolute bottom-full mb-2 left-0 w-full bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold px-3 py-2 rounded-lg shadow-md border border-red-100 dark:border-red-900/50 animate-in fade-in slide-in-from-bottom-2 text-center">
                    No questions match your criteria.
                  </div>
                )}
                <Button
                  size="lg"
                  onClick={handleCreate}
                  disabled={isStartingQuiz}
                  className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-lg px-6 flex items-center justify-center gap-2 font-semibold"
                >
                  {isStartingQuiz ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Create Quiz ({filteredMetadata.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
