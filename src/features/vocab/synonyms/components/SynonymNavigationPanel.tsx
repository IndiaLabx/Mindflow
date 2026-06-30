import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, ChevronRight, Map, ArrowDown, Loader2 } from 'lucide-react';
import { SynonymWord } from '../../../../features/quiz/types';
import { cn } from '../../../../utils/cn';
import { APP_CONFIG } from '../../../../constants/config';
import { usePDFGenerator } from '../../../../hooks/usePDFGenerator';
import { useJSONDownloader } from '../../../../hooks/useJSONDownloader';
import { DownloadOptionsModal } from '../../../../components/ui/DownloadOptionsModal';
import { DownloadReadyModal } from '../../../../components/ui/DownloadReadyModal';
import { DownloadResult } from '../../../../hooks/useJSONDownloader';

interface SynonymNavigationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: SynonymWord[];
  currentIndex: number;
  onJump: (index: number) => void;
}

export const SynonymNavigationPanel: React.FC<SynonymNavigationPanelProps> = ({
  isOpen, onClose, data, currentIndex, onJump
}) => {
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set());

  const { generatePDF, isGenerating: isGeneratingPDF, error: pdfError } = usePDFGenerator(() => import('../utils/pdfGenerator').then(m => m.generateSynonymPDF as any));
  const { downloadJSON, isGenerating: isGeneratingJSON, error: jsonError } = useJSONDownloader<SynonymWord>();

  const [downloadingChunk, setDownloadingChunk] = useState<number | null>(null);

  const [downloadModalState, setDownloadModalState] = useState<{
    chunkIndex: number;
    start: number;
    end: number;
  } | null>(null);

  const [downloadReadyInfo, setDownloadReadyInfo] = useState<(DownloadResult & { type: 'pdf' | 'json' }) | null>(null);

  const [chunkSize, setChunkSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('synonym_batch_size_v1');
      return saved ? parseInt(saved, 10) : 50;
    } catch {
      return 50;
    }
  });

  const batchOptions = [5, 10, 15, 20, 25, 30, 40, 50, 100];

  useEffect(() => {
    localStorage.setItem('synonym_batch_size_v1', chunkSize.toString());
  }, [chunkSize]);

  useEffect(() => {
    if (isOpen) {
      const currentGroup = Math.floor(currentIndex / chunkSize);
      setOpenGroups(new Set([currentGroup]));
    }
  }, [isOpen, currentIndex, chunkSize]);

  if (!isOpen) return null;

  const totalChunks = Math.ceil(data.length / chunkSize);

  const toggleGroup = (index: number) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleDownloadClick = (e: React.MouseEvent, chunkIndex: number, start: number, end: number) => {
    e.stopPropagation();
    if (isGeneratingPDF || isGeneratingJSON) return;
    setDownloadModalState({ chunkIndex, start, end });
  };

  const handleDownloadPDF = async () => {
    if (!downloadModalState) return;
    const { chunkIndex, start, end } = downloadModalState;

    setDownloadingChunk(chunkIndex);
    const chunkData = data.slice(start, end);
    const fileName = `Synonyms_Flashcards_Part_${chunkIndex + 1}_(${start + 1}-${end}).pdf`;

    const result = await generatePDF(chunkData, { fileName });
    setDownloadingChunk(null);
    setDownloadModalState(null);
    if (result) {
      setDownloadReadyInfo({ ...result, type: 'pdf' });
    }
  };

  const handleDownloadJSON = async () => {
    if (!downloadModalState) return;
    const { chunkIndex, start, end } = downloadModalState;

    setDownloadingChunk(chunkIndex);
    const chunkData = data.slice(start, end);
    const fileName = `Synonyms_Flashcards_Part_${chunkIndex + 1}_(${start + 1}-${end}).json`;

    const result = await downloadJSON(chunkData, fileName);
    setDownloadingChunk(null);
    setDownloadModalState(null);
    if (result) {
      setDownloadReadyInfo({ ...result, type: 'json' });
    }
  };

  const handleCloseDownloadReady = () => {
    if (downloadReadyInfo?.url) {
      URL.revokeObjectURL(downloadReadyInfo.url);
    }
    setDownloadReadyInfo(null);
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl z-[70] flex flex-col border-l border-gray-200 dark:border-gray-700 animate-in slide-in-from-right duration-300">
        <div className="p-5 border-b border-blue-100 bg-blue-50 dark:bg-slate-800 dark:border-slate-700 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-slate-700 rounded-lg text-blue-600 dark:text-blue-400">
                <Map className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-blue-900 dark:text-blue-100 leading-tight">Word Map</h2>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">{data.length} items total</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-blue-200/50 dark:hover:bg-slate-600 rounded-full text-blue-800 dark:text-blue-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-lg border border-blue-200 dark:border-slate-600">
            <label htmlFor="batch-size" className="text-xs font-semibold text-blue-800 dark:text-blue-200 pl-1">
              Group Size:
            </label>
            <select
              id="batch-size"
              value={chunkSize}
              onChange={(e) => setChunkSize(parseInt(e.target.value, 10))}
              className="text-sm font-medium text-blue-900 dark:text-blue-100 bg-blue-50 dark:bg-slate-700 border-none rounded focus:ring-2 focus:ring-blue-500 py-1 pl-2 pr-8 cursor-pointer outline-none"
            >
              {batchOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          {(pdfError || jsonError) && (
             <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-600 dark:text-red-400 text-xs rounded">
               Failed to generate download. Please try again.
             </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-slate-900 scrollbar-thin scrollbar-thumb-blue-200 dark:scrollbar-thumb-slate-700">
          {Array.from({ length: totalChunks }).map((_, chunkIndex) => {
            const start = chunkIndex * chunkSize;
            const end = Math.min(start + chunkSize, data.length);
            const isOpen = openGroups.has(chunkIndex);

            const isDownloading = downloadingChunk === chunkIndex;
            const containsCurrent = currentIndex >= start && currentIndex < end;

            return (
              <div key={chunkIndex} className={cn(
                "border rounded-xl overflow-hidden transition-all duration-200",
                containsCurrent ? "border-blue-300 shadow-sm bg-white dark:bg-gray-800" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              )}>
                <div
                  onClick={() => toggleGroup(chunkIndex)}
                  className={cn(
                    "w-full flex items-center justify-between p-3.5 text-sm font-bold transition-colors cursor-pointer",
                    containsCurrent ? "bg-blue-50 dark:bg-slate-800 text-blue-800 dark:text-blue-200" : "hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300"
                  )}
                >
                  <span>Words {start + 1} - {end}</span>
                  <div className="flex items-center gap-2">
                     <button
                        onClick={(e) => handleDownloadClick(e, chunkIndex, start, end)}
                        disabled={isGeneratingPDF || isGeneratingJSON}
                        className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-current transition-colors disabled:opacity-50"
                        title="Download Flashcards"
                     >
                        {isDownloading ? (
                           <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                           <ArrowDown className="w-4 h-4" />
                        )}
                     </button>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-blue-500" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {isOpen && (
                  <div className="p-3 grid grid-cols-5 gap-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-2 fade-in duration-200">
                    {data.slice(start, end).map((item, localIdx) => {
                      const globalIdx = start + localIdx;
                      const isCurrent = globalIdx === currentIndex;

                      return (
                        <button
                          key={item.word}
                          onClick={() => {
                            onJump(globalIdx);
                            onClose();
                          }}
                          title={item.word}
                          className={cn(
                            "aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all relative overflow-hidden",
                            isCurrent
                              ? "bg-blue-500 text-white shadow-md ring-2 ring-blue-300 ring-offset-1 scale-105 z-10"
                              : "bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400 hover:text-blue-900 dark:hover:text-blue-200"
                          )}
                        >
                          {globalIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <DownloadOptionsModal
        isOpen={!!downloadModalState}
        onClose={() => !isGeneratingPDF && !isGeneratingJSON && setDownloadModalState(null)}
        onDownloadPDF={handleDownloadPDF}
        onDownloadJSON={handleDownloadJSON}
        isGeneratingPDF={isGeneratingPDF}
        isGeneratingJSON={isGeneratingJSON}
      />

      <DownloadReadyModal
        isOpen={!!downloadReadyInfo}
        onClose={handleCloseDownloadReady}
        fileUrl={downloadReadyInfo?.url || ''}
        fileName={downloadReadyInfo?.fileName || ''}
        blob={downloadReadyInfo?.blob}
        fileType={downloadReadyInfo?.type}
      />
    </>,
    document.body
  );
};
