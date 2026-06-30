import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Presentation,
  FileJson,
  Save
} from 'lucide-react';

import { ArrowUp, ArrowDown, X, Plus } from 'lucide-react';
import { Button } from '../../../components/Button/Button';
import { fetchQuestionMetadata, fetchQuestionsByIds } from '../../quiz/services/questionService';
import { Question, InitialFilters } from '../../quiz/types';
import { cn } from '../../../utils/cn';
import { useDependentFilters } from '@/features/quiz';
import { useFilterCounts } from '@/features/quiz';

// UI Components
import { FilterGroup } from '../../quiz/components/ui/FilterGroup';
import { MultiSelectDropdown } from '../../quiz/components/ui/MultiSelectDropdown';
import { SegmentedControl } from '../../quiz/components/ui/SegmentedControl';
import { ActiveFiltersBar } from '../../quiz/components/ui/ActiveFiltersBar';
import { GeneratorModal } from './components/GeneratorModal';
import { generatePDF } from './utils/pdfGenerator';
import { generatePowerPoint } from './utils/pptGenerator';
import { SynapticLoader } from '../../../components/ui/SynapticLoader';
import { useNotificationStore } from '../../../stores/useNotificationStore';


export type SortCriterion = 'examName' | 'examYear' | 'examDateShift' | 'subject' | 'topic' | 'difficulty';

export const sortLabels: Record<SortCriterion, string> = {
  examName: 'Exam Name',
  examYear: 'Exam Year',
  examDateShift: 'Exam Shift',
  subject: 'Subject',
  topic: 'Topic',
  difficulty: 'Difficulty',
};

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

export const QuizPdfPptGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<InitialFilters>(emptyFilters);
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>(['examName', 'examDateShift', 'subject']);

  // State for Data Fetching & Sync
  const [metadata, setMetadata] = useState<Question[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [showEmptyError, setShowEmptyError] = useState(false);

  // State for Generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [genType, setGenType] = useState<'PDF' | 'PPT' | 'JSON' | null>(null);
  const [genProgress, setGenProgress] = useState(0);
  const [genDetails, setGenDetails] = useState('');

  // 0. Fetch Metadata on Mount
  const loadMetadata = useCallback(async () => {
    try {
      setIsLoadingMetadata(true);
      setError(null);
      setProgress({ current: 0, total: 0 });

      const data = await fetchQuestionMetadata((current, total) => {
        setProgress({ current, total });
      });

      setMetadata(data);
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

  // 1. Build Classification Map
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

  // 2. Hooks Integration for Filter Logic
  const { availableTopics, availableSubTopics } = useDependentFilters({
    selectedFilters: filters,
    setSelectedFilters: setFilters,
    classificationMap
  });

  // Calculate dynamic counts for all filter options based on current selection
  const filterCounts = useFilterCounts({
    allQuestions: metadata,
    selectedFilters: filters
  });

  // 3. Derived Lists for Dropdown Options
  const allSubjects = useMemo(() => Array.from(classificationMap.keys()).sort(), [classificationMap]);
  const allExamNames = useMemo(() => Array.from(new Set(metadata.map(q => q.sourceInfo.examName))).sort(), [metadata]);
  const allExamYears = useMemo(() => Array.from(new Set(metadata.map(q => String(q.sourceInfo.examYear)))).sort(), [metadata]);
  const allExamShifts = useMemo(() => Array.from(new Set(metadata.map(q => q.sourceInfo.examDateShift || ''))).filter(Boolean).sort(), [metadata]);
  const allTags = useMemo(() => Array.from(new Set(metadata.flatMap(q => q.tags))).sort(), [metadata]);

  // 4. Final Filtered Metadata Calculation
  const filteredMetadata = useMemo(() => {
    return metadata.filter(q => {
      if (filters.subject.length > 0 && !filters.subject.includes(q.subject ?? q.classification?.subject)) return false;
      if (filters.topic.length > 0 && !filters.topic.includes(q.classification.topic)) return false;
      if (filters.subTopic.length > 0 && !filters.subTopic.includes(q.classification.subTopic || '')) return false;
      if (filters.difficulty.length > 0 && !filters.difficulty.includes(q.properties?.difficulty)) return false;
      if (filters.questionType.length > 0 && !filters.questionType.includes(q.properties?.questionType)) return false;
      if (filters.examName.length > 0 && !filters.examName.includes(q.sourceInfo.examName)) return false;
      if (filters.examYear.length > 0 && !filters.examYear.includes(String(q.sourceInfo.examYear))) return false;
      if (filters.examDateShift.length > 0 && !filters.examDateShift.includes(q.sourceInfo.examDateShift || '')) return false;
      if (filters.tags.length > 0 && !filters.tags.some(t => q.tags.includes(t))) return false;
      return true;
    });
  }, [filters, metadata]);

  useEffect(() => {
    if (filteredMetadata.length > 0) {
      setShowEmptyError(false);
    }
  }, [filteredMetadata.length]);

  // --- Handlers ---

  const handleFilterChange = (key: keyof InitialFilters, selected: string[]) => {
    setFilters(prev => ({ ...prev, [key]: selected }));
  };

  const removeFilter = (key: keyof InitialFilters, value?: string) => {
    if (value) {
      setFilters(prev => ({ ...prev, [key]: (prev[key] || []).filter((item: string) => item !== value) }));
    } else {
      setFilters(prev => ({ ...prev, [key]: [] }));
    }
  };

  const handleSegmentToggle = (key: keyof InitialFilters, option: string) => {
    setFilters(prev => {
      const current = prev[key] || [];
      const isSelected = (current as string[]).includes(option);
      return {
        ...prev,
        [key]: isSelected ? [...(current as string[])].filter(i => i !== option) : [...(current as string[]), option as any]
      };
    });
  };


  const sortQuestions = (questions: Question[], criteria: SortCriterion[]) => {
    return [...questions].sort((a, b) => {
      for (const criterion of criteria) {
        let valA, valB;
        if (criterion === 'examName') { valA = a.sourceInfo?.examName; valB = b.sourceInfo?.examName; }
        else if (criterion === 'examYear') { valA = a.sourceInfo?.examYear; valB = b.sourceInfo?.examYear; }
        else if (criterion === 'examDateShift') { valA = a.sourceInfo?.examDateShift; valB = b.sourceInfo?.examDateShift; }
        else if (criterion === 'subject') { valA = a.classification?.subject; valB = b.classification?.subject; }
        else if (criterion === 'topic') { valA = a.classification?.topic; valB = b.classification?.topic; }
        else if (criterion === 'difficulty') { valA = a.properties?.difficulty; valB = b.properties?.difficulty; }

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (valA < valB) return -1;
        if (valA > valB) return 1;
      }
      return 0; // All criteria matched
    });
  };

  const validateAndFetchQuestions = async () => {
    if (filteredMetadata.length === 0) {
      setShowEmptyError(true);
      setTimeout(() => setShowEmptyError(false), 4000);
      return null;
    }

    try {
        const ids = filteredMetadata.map(q => q.id);

        const fullQuestions = await fetchQuestionsByIds(ids);

        // Check for removed duplicates
        if (fullQuestions.length < filteredMetadata.length) {
          const returnedIds = new Set(fullQuestions.map(q => q.v1_id || q.id));
          const missingQuestions = filteredMetadata.filter(q => !returnedIds.has(q.v1_id || q.id));
          if (missingQuestions.length > 0) {
            const missingV1Ids = missingQuestions.map(q => q.v1_id || q.id).join(', ');
            useNotificationStore.getState().showToast({
              title: 'Duplicate Questions Removed',
              message: `${missingQuestions.length} exact duplicate question(s) removed (v1_ids: ${missingV1Ids}).`,
              variant: 'warning',
              duration: 5000,
            });
          }
        }

        return sortQuestions(fullQuestions, sortCriteria);
    } catch (err) {
        console.error("Failed to fetch full questions:", err);
        alert("Failed to fetch full questions. Please check connection.");
        return null;
    }
  };


  const handleAddSortCriterion = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as SortCriterion;
    if (val && !sortCriteria.includes(val)) {
      setSortCriteria([...sortCriteria, val]);
    }
    e.target.value = '';
  };

  const handleRemoveSortCriterion = (criterionToRemove: SortCriterion) => {
    setSortCriteria(sortCriteria.filter(c => c !== criterionToRemove));
  };

  const handleMoveSortCriterion = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sortCriteria.length - 1)) return;
    const newCriteria = [...sortCriteria];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newCriteria[index], newCriteria[targetIndex]] = [newCriteria[targetIndex], newCriteria[index]];
    setSortCriteria(newCriteria);
  };

  const handleCreatePDF = async () => {
    setGenType('PDF');
    setIsGenerating(true);
    setGenProgress(0);
    setGenDetails('Fetching full questions data...');

    const questions = await validateAndFetchQuestions();

    if (questions) {
      try {
        await generatePDF(questions, filters, (progress, details) => {
           setGenProgress(progress);
           setGenDetails(details);
        });
      } catch (err) {
         console.error(err);
         alert("Error generating PDF.");
      }
    }
    setIsGenerating(false);
    setGenType(null);
  };


  const handleCreateJSON = async () => {
    setGenType('JSON');
    setIsGenerating(true);
    setGenProgress(0);
    setGenDetails('Fetching full questions data...');

    const questions = await validateAndFetchQuestions();

    if (questions && questions.length > 0) {
      try {
        setGenProgress(50);
        setGenDetails('Formatting JSON data...');

        // Clone the questions to avoid mutating the original
        const formattedQuestions = JSON.parse(JSON.stringify(questions));

        // Add metadata to the first question only, matching requested format
        formattedQuestions[0] = {
          ...formattedQuestions[0],
          metadata: {
            generatedAt: new Date().toISOString(),
            filters: filters,
            totalQuestions: questions.length
          }
        };

        const jsonString = JSON.stringify(formattedQuestions, null, 2);

        setGenProgress(80);
        setGenDetails('Preparing download...');

        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Construct filename
        let subjectPart = "Mixed-Subjects";
        if (filters.subject.length > 0) {
          subjectPart = filters.subject.join('-').replace(/\s+/g, '');
        }

        const datePart = new Date().toISOString().split('T')[0];
        const filename = `${subjectPart}-${questions.length}-${datePart}.json`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setGenProgress(100);
        setGenDetails('Complete!');
      } catch (err) {
         console.error(err);
         alert("Error generating JSON.");
      }
    }

    setTimeout(() => {
        setIsGenerating(false);
        setGenType(null);
    }, 500); // Small delay to show 100% complete
  };

  const handleCreatePPT = async () => {
    setGenType('PPT');
    setIsGenerating(true);
    setGenProgress(0);
    setGenDetails('Fetching full questions data...');

    const questions = await validateAndFetchQuestions();

    if (questions) {
       try {
         await generatePowerPoint(questions, filters, (progress, details) => {
            setGenProgress(progress);
            setGenDetails(details);
         });
       } catch (err) {
         console.error(err);
         alert("Error generating PPT.");
       }
    }
    setIsGenerating(false);
    setGenType(null);
  };


  // --- Loading State Render ---
  if (isLoadingMetadata) {
    const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-gray-50 dark:bg-gray-900/50 p-8">
        <SynapticLoader size="xl" />
        <div className="text-center space-y-2 max-w-xs w-full">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Syncing Question Bank</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {progress.total > 0
              ? `Indexed ${progress.current.toLocaleString()} of ${progress.total.toLocaleString()} items`
              : 'Connecting to Database...'}
          </p>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-4">
            <div className="h-full bg-indigo-600 transition-all duration-500 ease-out rounded-full" style={{ width: `${percentage}%` }} />
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500 font-medium text-right mt-1">{percentage}%</p>
        </div>
      </div>
    );
  }

  // --- Error State Render ---
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-gray-50 dark:bg-gray-900/50 p-8 text-center animate-fade-in">
        <div className="p-4 bg-red-50 rounded-full">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Connection Error</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">{error}</p>
        <div className="flex gap-4 mt-4">
          <Button variant="outline" onClick={() => navigate('/tools')}>Go Back</Button>
          <Button onClick={loadMetadata}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 min-h-screen flex flex-col">
       <GeneratorModal
          isOpen={isGenerating}
          type={genType}
          progress={genProgress}
          details={genDetails}
       />

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button
            onClick={() => navigate('/tools')}
            className="p-2 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-slate-800 rounded-xl text-gray-600 dark:text-gray-300 transition-colors"
        >
            <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                GK PDF/PPT Generator
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Select questions to generate PDF worksheets or PPT presentations.</p>
        </div>
      </div>

      {/* Scrollable Config Content */}
      <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto w-full flex-1 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
            <div className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium">
                Question Bank Size: <span className="font-bold text-indigo-600">{metadata.length.toLocaleString()}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Classification */}
          <FilterGroup title="Classification" icon={<Layers className="w-5 h-5" />}>
            <MultiSelectDropdown
              label="Subject"
              tooltip="Filter questions by broad academic discipline"
              options={allSubjects}
              selectedOptions={filters.subject}
              onSelectionChange={(sel) => handleFilterChange('subject', sel)}
              placeholder="Select Subjects"
              counts={filterCounts.subject || {}}
            />
            <MultiSelectDropdown
              label="Topic"
              tooltip="Filter by specific topics within the selected subjects"
              options={availableTopics}
              selectedOptions={filters.topic}
              onSelectionChange={(sel) => handleFilterChange('topic', sel)}
              placeholder={availableTopics.length > 0 ? "Select Topics" : "Select Subject First"}
              disabled={availableTopics.length === 0}
              counts={filterCounts.topic || {}}
            />
            <MultiSelectDropdown
              label="Sub-Topic"
              tooltip="Filter by granular sub-topics for precise practice"
              options={availableSubTopics}
              selectedOptions={filters.subTopic}
              onSelectionChange={(sel) => handleFilterChange('subTopic', sel)}
              placeholder={availableSubTopics.length > 0 ? "Select Sub-Topics" : "Select Topic First"}
              disabled={availableSubTopics.length === 0}
              counts={filterCounts.subTopic || {}}
            />
          </FilterGroup>

          {/* Column 2: Properties */}
          <FilterGroup title="Properties" icon={<Settings className="w-5 h-5" />}>
            <SegmentedControl
              label="Difficulty"
              tooltip="Choose question complexity level"
              options={['Easy', 'Medium', 'Hard']}
              selectedOptions={filters.difficulty}
              onOptionToggle={(opt) => handleSegmentToggle('difficulty', opt)}
              counts={filterCounts.difficulty || {}}
            />
            <SegmentedControl
              label="Question Type"
              tooltip="Filter by question format (e.g., Multiple Choice)"
              options={['MCQ']}
              selectedOptions={filters.questionType}
              onOptionToggle={(opt) => handleSegmentToggle('questionType', opt)}
              counts={filterCounts.questionType || {}}
            />
          </FilterGroup>

          {/* Column 3: Source */}
          <FilterGroup title="Source" icon={<FileText className="w-5 h-5" />}>
            <MultiSelectDropdown
              label="Exam Name"
              tooltip="Filter by specific competitive exam source"
              options={allExamNames}
              selectedOptions={filters.examName}
              onSelectionChange={(sel) => handleFilterChange('examName', sel)}
              placeholder="Select Exams"
              counts={filterCounts.examName || {}}
            />
            <MultiSelectDropdown
              label="Exam Year"
              tooltip="Filter questions by the year they appeared"
              options={allExamYears}
              selectedOptions={filters.examYear}
              onSelectionChange={(sel) => handleFilterChange('examYear', sel)}
              placeholder="Select Years"
              counts={filterCounts.examYear || {}}
            />
            <MultiSelectDropdown
              label="Exam Shift"
              tooltip="Filter by specific exam date or shift"
              options={allExamShifts}
              selectedOptions={filters.examDateShift}
              onSelectionChange={(sel) => handleFilterChange('examDateShift', sel)}
              placeholder="Select Shifts"
              counts={filterCounts.examDateShift || {}}
            />
          </FilterGroup>

          {/* Column 4: Tags */}
          <FilterGroup title="Tags" icon={<Tag className="w-5 h-5" />}>
            <MultiSelectDropdown
              label="Search Tags"
              tooltip="Filter using specific keywords or concepts"
              options={allTags}
              selectedOptions={filters.tags}
              onSelectionChange={(sel) => handleFilterChange('tags', sel)}
              placeholder="Filter by Tags"
              counts={filterCounts.tags || {}}
            />
          </FilterGroup>
        </div>


        {/* Active Filters Component */}
        <ActiveFiltersBar
          filters={filters}
          onRemoveFilter={removeFilter}
          onClearAll={() => setFilters(emptyFilters)}
        />

        {/* Sorting Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mt-6">
          <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              Export Sorting Order
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Add Field:</span>
              <select
                onChange={handleAddSortCriterion}
                className="text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 text-gray-700 dark:text-gray-200"
                defaultValue=""
              >
                <option value="" disabled>Select...</option>
                {Object.entries(sortLabels).map(([key, label]) => {
                  if (!sortCriteria.includes(key as SortCriterion)) {
                    return <option key={key} value={key}>{label}</option>;
                  }
                  return null;
                })}
              </select>
            </div>
          </div>
          <div className="p-6">
            {sortCriteria.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No sorting criteria defined. Questions will be ordered as retrieved.</p>
            ) : (
              <div className="space-y-2">
                {sortCriteria.map((criterion, index) => (
                  <div key={criterion} className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-3 rounded-xl hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {sortLabels[criterion]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveSortCriterion(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveSortCriterion(index, 'down')}
                        disabled={index === sortCriteria.length - 1}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1"></div>
                      <button
                        onClick={() => handleRemoveSortCriterion(criterion)}
                        className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 sticky bottom-0 z-10">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-4">
          <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
            <Button variant="outline" onClick={() => setFilters(emptyFilters)} className="flex items-center gap-2 w-full sm:w-auto">
              <RotateCcw className="w-4 h-4" /> Reset Filters
            </Button>

            <div className="relative w-full sm:w-auto flex flex-col sm:flex-row gap-3">
              {showEmptyError && (
                <div className="absolute bottom-full mb-3 right-0 sm:left-auto sm:right-0 w-full sm:w-64 bg-red-50 text-red-600 text-xs font-semibold px-3 py-2 rounded-lg shadow-sm border border-red-100 animate-in fade-in slide-in-from-bottom-2 text-center sm:text-right z-10">
                  No questions match your criteria. <br /> Please adjust filters.
                  <div className="absolute top-full right-8 sm:right-12 border-4 border-transparent border-t-red-100"></div>
                </div>
              )}

              <Button
                size="lg"
                onClick={handleCreatePDF}
                disabled={isGenerating}
                className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 w-full sm:w-auto px-8 py-3 text-base flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Create PDF ({filteredMetadata.length})
              </Button>

              <Button
                size="lg"
                onClick={handleCreateJSON}
                disabled={isGenerating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 w-full sm:w-auto px-8 py-3 text-base flex items-center justify-center gap-2"
              >
                <FileJson className="w-5 h-5" />
                Create JSON ({filteredMetadata.length})
              </Button>

              <Button
                size="lg"
                onClick={handleCreatePPT}
                disabled={isGenerating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 w-full sm:w-auto px-8 py-3 text-base flex items-center justify-center gap-2"
              >
                <Presentation className="w-5 h-5" />
                Create PPT ({filteredMetadata.length})
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
