import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, FileText, Upload, Settings, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateBilingualPdf, PDFOptions } from './utils/pdfGenerator';

const BilingualPdfMaker: React.FC = () => {
    const navigate = useNavigate();

    // File State
    const [file, setFile] = useState<File | null>(null);
    const [questionsData, setQuestionsData] = useState<any[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    // Options State
    const [quizTitle, setQuizTitle] = useState('Quiz Questions');
    const [compilerName, setCompilerName] = useState('Aalok Kumar Sharma @2025-26');
    const [pdfLanguage, setPdfLanguage] = useState<'bilingual' | 'english' | 'hindi'>('bilingual');
    const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
    const [answerKeyLocation, setAnswerKeyLocation] = useState<'end' | 'inline'>('end');
    const [fontMultiplier, setFontMultiplier] = useState(1.0);

    // Process State
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');
    const [isGenerated, setIsGenerated] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const processFile = (selectedFile: File) => {
        if (selectedFile.size > 5 * 1024 * 1024) {
            showStatus('File is too large. Maximum size is 5 MB.', 'error');
            return;
        }
        if (selectedFile.type !== 'application/json' && !selectedFile.name.endsWith('.json')) {
            showStatus('Invalid file type. Please upload a .json file.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (!e.target?.result) throw new Error("Could not read file");
                const data = JSON.parse(e.target.result as string);
                validateQuestionsData(data);
                setQuestionsData(data);
                setFile(selectedFile);
                showStatus('', 'info');
                setIsGenerated(false);
            } catch (err: any) {
                showStatus(err.message || 'Error parsing JSON file.', 'error');
                resetFile();
            }
        };
        reader.readAsText(selectedFile);
    };

    const validateQuestionsData = (data: any) => {
        if (!Array.isArray(data)) throw new Error('JSON data must be an array.');
        if (data.length === 0) throw new Error('JSON array cannot be empty.');
        for (let i = 0; i < data.length; i++) {
            const q = data[i];
            if (!('question' in q && 'options' in q && 'correct' in q)) {
                throw new Error(`Question ${i + 1} is missing a required key (question, options, or correct).`);
            }
            if (!Array.isArray(q.options)) {
                throw new Error(`"options" for question ${i + 1} must be an array.`);
            }
        }
    };

    const resetFile = () => {
        setFile(null);
        setQuestionsData([]);
        setIsGenerated(false);
        setProgress(0);
        showStatus('', 'info');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const showStatus = (msg: string, type: 'info' | 'success' | 'error') => {
        setStatusMessage(msg);
        setStatusType(type);
    };

    const handleGenerate = async () => {
        if (!file || questionsData.length === 0) return;

        setIsGenerating(true);
        setIsGenerated(false);
        setProgress(0);
        showStatus(`🚀 Preparing your PDF with ${questionsData.length} questions...`, 'info');

        const options: PDFOptions = {
            quizTitle,
            compilerName,
            includeAnswerKey,
            answerKeyLocation,
            fontMultiplier,
            pdfLanguage
        };

        try {
            await generateBilingualPdf(questionsData, options, (p, msg) => {
                setProgress(p);
                showStatus(msg, p === 100 ? 'success' : 'info');
                if (p === 100) {
                    setIsGenerating(false);
                    setIsGenerated(true);
                }
            });
        } catch (error: any) {
            showStatus(`Error generating PDF: ${error.message || 'Unknown error'}`, 'error');
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
                <button
                    onClick={() => navigate('/tools')}
                    className="p-2 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-slate-800 rounded-xl text-gray-600 dark:text-gray-300 transition-colors"
                    title="Back to Tools"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-purple-600" />
                        Bilingual PDF Generator
                    </h1>
                    <div className="flex items-center gap-2">
                         <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Create a flawless, professional PDF with Answer Key.</p>
                         <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded-md">v14.5</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6 md:p-10 w-full max-w-3xl mx-auto flex flex-col gap-6">

                {/* Upload Area */}
                <div
                    className={`
                        border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200
                        ${isDragging ? 'border-purple-500 bg-purple-50 scale-[1.02]' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-purple-400 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:bg-slate-800/50'}
                        ${file ? 'border-purple-500 bg-purple-50 border-solid' : ''}
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !file && fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".json"
                        className="hidden text-base"
                    />

                    {!file ? (
                        <>
                            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
                                <Upload className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Upload Questions Data</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Drag & drop your <code>Questions.json</code> file here or click to select.</p>
                        </>
                    ) : (
                        <div className="w-full text-left flex items-start justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-200 shadow-sm">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-purple-600" />
                                    {file.name}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">
                                    <span className="font-semibold">{questionsData.length}</span> questions found
                                </p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); resetFile(); }}
                                className="text-gray-400 dark:text-slate-500 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove file"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Options Panel */}
                {file && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Advanced Options</h2>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Quiz Title</label>
                                    <input
                                        type="text"
                                        value={quizTitle}
                                        onChange={(e) => setQuizTitle(e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Compiler / Author Name</label>
                                    <input
                                        type="text"
                                        value={compilerName}
                                        onChange={(e) => setCompilerName(e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">PDF Language</label>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    {[
                                        { id: 'bilingual', label: 'Bilingual (English + Hindi)' },
                                        { id: 'english', label: 'English Only' },
                                        { id: 'hindi', label: 'Hindi Only' }
                                    ].map(lang => (
                                        <label key={lang.id} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="pdfLanguage"
                                                value={lang.id}
                                                checked={pdfLanguage === lang.id}
                                                onChange={(e) => setPdfLanguage(e.target.value as any)}
                                                className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600"
                                            />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{lang.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                                <label className="flex items-center gap-3 cursor-pointer mb-4">
                                    <input
                                        type="checkbox"
                                        checked={includeAnswerKey}
                                        onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                                        className="w-5 h-5 text-purple-600 rounded border-gray-300 dark:border-gray-600 focus:ring-purple-500"
                                    />
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Include Answer Key</span>
                                </label>

                                {includeAnswerKey && (
                                    <div className="pl-8 space-y-3 animate-in fade-in duration-300">
                                        {[
                                            { id: 'end', label: 'At the end of the document' },
                                            { id: 'inline', label: 'After each question' }
                                        ].map(loc => (
                                            <label key={loc.id} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="answerKeyLocation"
                                                    value={loc.id}
                                                    checked={answerKeyLocation === loc.id}
                                                    onChange={(e) => setAnswerKeyLocation(e.target.value as any)}
                                                    className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600"
                                                />
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{loc.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                                    Adjust Font Size <span className="font-normal text-gray-500 dark:text-gray-400 ml-2">({fontMultiplier.toFixed(1)}x)</span>
                                </label>
                                <input
                                    type="range"
                                    min="0.8" max="1.5" step="0.1"
                                    value={fontMultiplier}
                                    onChange={(e) => setFontMultiplier(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress & Actions */}
                {file && (
                    <div className="flex flex-col items-center gap-4 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                        {isGenerating && (
                            <div className="w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-2 overflow-hidden shadow-inner">
                                <div
                                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-4 rounded-full transition-all duration-300 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                                    style={{ width: `${progress}%` }}
                                >
                                    {progress > 5 && `${progress}%`}
                                </div>
                            </div>
                        )}

                        {statusMessage && (
                            <div className={`
                                flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg w-full justify-center
                                ${statusType === 'error' ? 'text-red-700 bg-red-50' : ''}
                                ${statusType === 'success' ? 'text-green-700 bg-green-50' : ''}
                                ${statusType === 'info' ? 'text-blue-700 bg-blue-50' : ''}
                            `}>
                                {statusType === 'error' && <AlertCircle className="w-5 h-5" />}
                                {statusType === 'success' && <CheckCircle className="w-5 h-5" />}
                                {statusType === 'info' && isGenerating && <Loader className="w-5 h-5 animate-spin" />}
                                {statusMessage}
                            </div>
                        )}

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className={`
                                relative overflow-hidden px-8 py-4 rounded-full font-bold text-lg text-white shadow-lg transition-all duration-300 w-full md:w-auto
                                ${isGenerating ? 'bg-gray-400 cursor-not-allowed scale-95' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-xl hover:-translate-y-1 hover:scale-105 active:scale-95'}
                            `}
                        >
                            {/* "Sparkle" effect CSS equivalent */}
                            {!isGenerating && (
                                <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg] animate-[sparkle_3s_linear_infinite]" />
                            )}

                            {isGenerating ? 'Generating PDF...' : isGenerated ? 'Generate Another PDF' : 'Generate Bilingual PDF'}
                        </button>
                    </div>
                )}
            </div>

            {/* Hidden container for rendering Hindi text as images */}
            <div
                id="hindi-render-snippet"
                className="absolute left-[-9999px] top-0 p-[10px_0] m-0 font-['Noto_Sans_Devanagari',sans-serif] text-black break-words whitespace-normal"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
            ></div>

            {/* Global style for animation */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes sparkle { 0% { left: -75%; } 100% { left: 125%; } }
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&display=swap');
            `}} />
        </div>
    );
};

export default BilingualPdfMaker;
