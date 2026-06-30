
import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import { Upload, FileJson, ClipboardPaste, X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Image as ImageIcon, RectangleHorizontal, RectangleVertical, Package, Loader2 } from 'lucide-react';
// @ts-ignore
import JSZip from 'jszip';
import { EditorProps, FlashcardData, CardTemplate, Orientation } from '../types';
import { drawCard } from '../utils/canvasDrawing';
import { Button } from '../../../../components/Button/Button';
import { DownloadReadyModal } from '../../../../components/ui/DownloadReadyModal';

// Helper to chunk array
const chunkArray = <T,>(array: T[], size: number): T[][] => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

// Helper to map incoming JSON (User format or Standard format) to FlashcardData
const mapRawItemsToFlashcards = (rawItems: any[]): FlashcardData[] => {
  return rawItems.map((item: any, index: number) => {
    const hasNestedContent = item && typeof item === 'object' && 'content' in item;
    const source = hasNestedContent ? item.content : item;

    if (!source) return {
       id: String(index + 1),
       template: 'idiom', idiom: "", meaningEng: "", meaningHindi: "", usage: "", etymology: "", mnemonic: "", image: "", orientation: 'landscape'
    };

    // Try to find ID from source, or item, or fallback to index
    const id = source.id || item.id || source.Id || String(index + 1);

    let template: CardTemplate = item.template || source.template;
    if (!template) {
       if (source.word && source.pos) {
          template = 'ows';
       } else {
          template = 'idiom';
       }
    }

    const idiom = source.word || source.Word || source.phrase || source.Phrase || source.idiom || source.Idiom || "";
    const partOfSpeech = source.pos || source.Pos || "";

    const meaningsObj = source.meanings || source.Meanings || source;
    const meaningEng = source.meaning_en || meaningsObj.english || meaningsObj.English || source.meaningEng || "";
    const meaningHindi = source.meaning_hi || meaningsObj.hindi || meaningsObj.Hindi || source.meaningHindi || "";

    let usage = "";
    if (Array.isArray(source.usage_sentences)) {
      usage = source.usage_sentences.join(" ");
    } else {
      usage = source.usage_sentences || source.usage || source.Usage || "";
    }

    const extrasObj = source.extras || source.Extras || source;
    const etymology = extrasObj.origin || extrasObj.Origin || source.etymology || source.origin || "";
    const mnemonic = source.note || extrasObj.mnemonic || extrasObj.Mnemonic || source.mnemonic || "";

    const image = item.image || source.image || "";

    return {
      id: String(id),
      template,
      idiom,
      partOfSpeech,
      meaningEng,
      meaningHindi,
      usage,
      etymology,
      mnemonic,
      image,
      orientation: item.orientation || 'landscape'
    };
  });
};

export const Editor: React.FC<EditorProps> = ({
  data,
  onChange,
  deck,
  deckSize,
  currentDeckIndex,
  onNavigateDeck,
  onImportBatch
}) => {

  // --- State for Paste Modal ---
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [pasteStatus, setPasteStatus] = useState<{valid: boolean; count: number; message: string} | null>(null);

  // --- State for Batch Export Modal ---
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [processingBatchIndex, setProcessingBatchIndex] = useState<number | null>(null);
  const [batchProgress, setBatchProgress] = useState<{current: number, total: number} | null>(null);
  const [exportOrientation, setExportOrientation] = useState<Orientation>('landscape');

  // --- State for Download Ready Modal ---
  const [downloadReadyInfo, setDownloadReadyInfo] = useState<{url: string, fileName: string, blob: Blob, type: 'json' | 'zip'} | null>(null);
  const batchResolveRef = useRef<(() => void) | null>(null);

  // Sync default export orientation with current view when opening modal
  useEffect(() => {
    if (showBatchModal) {
      setExportOrientation(data.orientation);
    }
  }, [showBatchModal]);

  const batches = useMemo(() => {
    return chunkArray(deck, 500);
  }, [deck]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...data, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const rawItems = Array.isArray(json) ? json : [json];
          const mappedItems = mapRawItemsToFlashcards(rawItems);
          onImportBatch(mappedItems);
          if (jsonInputRef.current) jsonInputRef.current.value = '';

          // If a large batch is imported, suggest opening the Batch Manager
          if (mappedItems.length > 500) {
            setShowBatchModal(true);
          }

        } catch (err) {
          alert("Failed to parse JSON");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleJsonExport = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    setDownloadReadyInfo({
      url,
      fileName: `${data.idiom.replace(/\s+/g, '_').toLowerCase()}_flashcard.json`,
      blob,
      type: 'json'
    });
  };

  const handleCloseDownloadReady = () => {
    if (downloadReadyInfo?.url) {
      URL.revokeObjectURL(downloadReadyInfo.url);
    }
    setDownloadReadyInfo(null);

    // If a batch export is waiting, resolve it to continue
    if (batchResolveRef.current) {
      batchResolveRef.current();
      batchResolveRef.current = null;
    }
  };

  // --- Batch Processing Logic ---
  const processBatch = async (index: number) => {
    if (processingBatchIndex !== null) return;

    setProcessingBatchIndex(index);
    const batchItems = batches[index];
    setBatchProgress({ current: 0, total: batchItems.length });

    try {
      const zip = new JSZip();
      const folderName = `batch_${index + 1}_images`;
      const folder = zip.folder(folderName);

      // Create a dedicated canvas for processing
      const canvas = document.createElement('canvas');

      for (let i = 0; i < batchItems.length; i++) {
        const item = batchItems[i];

        // 1. Yield to Main Thread to allow UI updates
        await new Promise(resolve => setTimeout(resolve, 0));

        // 2. Override orientation with user selection
        const itemToDraw = { ...item, orientation: exportOrientation };

        // 3. Draw to canvas
        await drawCard(canvas, itemToDraw);

        // 4. Convert to Blob
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));

        if (blob && folder) {
          const cleanName = item.idiom.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
          folder.file(`${cleanName}_${i}.png`, blob);
        }

        // 5. Update Progress
        setBatchProgress({ current: i + 1, total: batchItems.length });
      }

      // 6. Generate ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);

      // 7. Download Ready UI (Pause loop until user closes the modal)
      await new Promise<void>(resolve => {
        batchResolveRef.current = resolve;
        setDownloadReadyInfo({
          url,
          fileName: `artisan_batch_${index + 1}_of_${batches.length}_${exportOrientation}.zip`,
          blob: content,
          type: 'zip'
        });
      });

    } catch (err) {
      console.error("Batch processing failed", err);
      alert("Something went wrong during batch processing.");
    } finally {
      setProcessingBatchIndex(null);
      setBatchProgress(null);
    }
  };

  // --- Paste Logic ---
  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPasteContent(text);

    if (!text.trim()) {
      setPasteStatus(null);
      return;
    }

    try {
      const json = JSON.parse(text);
      if (Array.isArray(json)) {
        setPasteStatus({ valid: true, count: json.length, message: `Found ${json.length} items.` });
      } else if (typeof json === 'object' && json !== null) {
        setPasteStatus({ valid: true, count: 1, message: 'Found 1 item.' });
      } else {
        setPasteStatus({ valid: false, count: 0, message: 'Invalid format: Must be Object or Array.' });
      }
    } catch (err) {
      setPasteStatus({ valid: false, count: 0, message: 'Invalid JSON syntax.' });
    }
  };

  const confirmPaste = () => {
    if (!pasteStatus?.valid) return;
    try {
      const json = JSON.parse(pasteContent);
      const rawItems = Array.isArray(json) ? json : [json];
      const mappedItems = mapRawItemsToFlashcards(rawItems);
      onImportBatch(mappedItems);
      setShowPasteModal(false);
      setPasteContent('');
      setPasteStatus(null);

      if (mappedItems.length > 500) setShowBatchModal(true);

    } catch (e) {
      console.error("Import failed", e);
      alert("Error importing data.");
    }
  };

  const isOws = data.template === 'ows';
  const labelWord = isOws ? 'Word' : 'Idiom / Phrase';
  const labelMnemonic = isOws ? 'Note / Extra Info' : 'Mnemonic (Memory Aid)';
  const labelEtymology = isOws ? 'Origin / Etymology' : 'Etymology / Origin';

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 overflow-y-auto relative text-gray-800 dark:text-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white flex items-center gap-2">
            <span className="text-3xl">✒️</span> Flashcard Editor
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Craft your custom flashcard.</p>
        </div>

        {/* Deck Navigation */}
        {deckSize > 1 && (
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 shadow-sm">
             <button onClick={() => onNavigateDeck('prev')} className="p-1 hover:bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-30" disabled={currentDeckIndex === 0}>
               <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
             </button>
             <span className="text-sm font-bold text-gray-900 dark:text-white dark:text-white min-w-[3rem] text-center">
               {currentDeckIndex + 1} / {deckSize}
             </span>
             <button onClick={() => onNavigateDeck('next')} className="p-1 hover:bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-30" disabled={currentDeckIndex === deckSize - 1}>
               <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-200" />
             </button>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="p-6 space-y-6 flex-1">

        {/* Orientation & Template Toggle */}
        <div className="flex gap-4">
           {/* Orientation */}
           <div className="bg-gray-50 dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-700 flex gap-1 flex-1">
             <button
               onClick={() => onChange({ ...data, orientation: 'landscape' })}
               className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-colors text-xs font-bold uppercase tracking-wider ${data.orientation === 'landscape' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700'}`}
             >
               <RectangleHorizontal className="w-4 h-4" /> Land
             </button>
             <button
               onClick={() => onChange({ ...data, orientation: 'portrait' })}
               className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-colors text-xs font-bold uppercase tracking-wider ${data.orientation === 'portrait' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700'}`}
             >
               <RectangleVertical className="w-4 h-4" /> Port
             </button>
           </div>

           {/* Template Selector */}
           <div className="bg-gray-50 dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-700 flex-1">
              <select
                name="template"
                value={data.template}
                onChange={handleInputChange}
                className="w-full h-full bg-transparent outline-none text-gray-900 dark:text-white dark:text-white font-bold text-xs uppercase px-2 text-center cursor-pointer"
              >
                <option value="idiom">Idiom Template</option>
                <option value="ows">One Word (OWS)</option>
              </select>
           </div>
        </div>

        {/* ID and Word/Idiom Input */}
        <div className="flex gap-4">
          <div className="w-20 space-y-2">
             <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</label>
             <input
              type="text"
              name="id"
              value={data.id || ''}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold text-gray-900 dark:text-white dark:text-white text-base"
              placeholder="#"
            />
          </div>
          <div className="flex-1 space-y-2">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{labelWord}</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="idiom"
                value={data.idiom}
                onChange={handleInputChange}
                className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg font-medium placeholder-gray-400"
                placeholder={isOws ? "e.g. Abbreviation" : "e.g. Break the ice"}
              />
            </div>
          </div>
        </div>

        {/* Part of Speech (OWS Only) */}
        {isOws && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-xs font-bold text-teal-600 uppercase tracking-wider">Part of Speech</label>
            <input
              type="text"
              name="partOfSpeech"
              value={data.partOfSpeech || ''}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none italic text-base"
              placeholder="e.g. Noun, Verb"
            />
          </div>
        )}

        {/* Meaning English */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Meaning (English)</label>
          <textarea
            name="meaningEng"
            value={data.meaningEng}
            onChange={handleInputChange}
            rows={3}
            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
          />
        </div>

        {/* Meaning Hindi */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Meaning (Hindi)</label>
          <input
            type="text"
            name="meaningHindi"
            value={data.meaningHindi}
            onChange={handleInputChange}
            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-base"
            placeholder="e.g. चुप्पी तोड़ना"
          />
        </div>

        {/* Usage */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usage Sentence</label>
          <textarea
            name="usage"
            value={data.usage}
            onChange={handleInputChange}
            rows={3}
            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none italic text-lg"
          />
        </div>

        {/* Etymology */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{labelEtymology}</label>
          <textarea
            name="etymology"
            value={data.etymology}
            onChange={handleInputChange}
            rows={2}
            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-base"
          />
        </div>

        {/* Mnemonic / Note */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{labelMnemonic}</label>
          <textarea
            name="mnemonic"
            value={data.mnemonic}
            onChange={handleInputChange}
            rows={2}
            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-base"
          />
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
           <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Illustration (Optional)</label>
           <div className="flex items-center gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:bg-gray-800 transition-colors rounded-lg text-gray-700 dark:text-gray-200"
              >
                <ImageIcon className="w-4 h-4" />
                {data.image ? "Change Image" : "Upload Image"}
              </button>
              {data.image && (
                <button
                  onClick={() => onChange({...data, image: ''})}
                  className="text-red-600 text-sm hover:underline"
                >
                  Remove
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden text-base"
                onChange={handleImageUpload}
              />
           </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex gap-2">
        <button
          onClick={() => jsonInputRef.current?.click()}
          className="flex-1 flex flex-col md:flex-row items-center justify-center gap-2 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:bg-gray-800 transition-colors rounded-lg font-bold text-xs md:text-sm"
        >
          <Upload className="w-4 h-4" /> Import
        </button>
        <input ref={jsonInputRef} type="file" accept=".json" className="hidden text-base" onChange={handleJsonImport} />

        <button
          onClick={() => setShowPasteModal(true)}
          className="flex-1 flex flex-col md:flex-row items-center justify-center gap-2 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:bg-gray-800 transition-colors rounded-lg font-bold text-xs md:text-sm"
        >
          <ClipboardPaste className="w-4 h-4" /> Paste
        </button>

        {/* Batch Export Button - Only show if we have multiple items */}
        {deckSize > 1 && (
          <button
            onClick={() => setShowBatchModal(true)}
            className="flex-1 flex flex-col md:flex-row items-center justify-center gap-2 py-3 border border-amber-500 text-amber-600 hover:bg-amber-50 transition-colors rounded-lg font-bold text-xs md:text-sm"
          >
            <Package className="w-4 h-4" /> Batch
          </button>
        )}

        <button
          onClick={handleJsonExport}
          className="flex-1 flex flex-col md:flex-row items-center justify-center gap-2 py-3 bg-gray-800 text-white hover:bg-gray-900 transition-colors rounded-lg font-bold text-xs md:text-sm"
        >
          <FileJson className="w-4 h-4" /> Export
        </button>
      </div>

      {/* PASTE MODAL */}
      {showPasteModal && (
        <div className="absolute inset-0 z-50 bg-gray-900/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90%]">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 rounded-t-xl">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">Paste JSON Data</h3>
              <button onClick={() => setShowPasteModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 flex-1 flex flex-col gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Paste your JSON object or array of objects below.</p>
              <textarea
                value={pasteContent}
                onChange={handlePasteChange}
                className="w-full flex-1 min-h-[200px] p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-base resize-none focus:ring-2 focus:ring-indigo-500 rounded-lg outline-none"
                placeholder='[{"content": {"word": "Abbreviation", ...}}]'
              />

              {/* Validation Status */}
              <div className={`p-3 rounded-lg border flex items-center gap-2 ${
                !pasteContent ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400' :
                pasteStatus?.valid ? 'bg-green-50 border-green-200 text-green-800' :
                'bg-red-50 border-red-200 text-red-800'
              }`}>
                {!pasteContent ? <div className="w-5 h-5" /> :
                 pasteStatus?.valid ? <CheckCircle className="w-5 h-5" /> :
                 <AlertCircle className="w-5 h-5" />}
                <span className="font-bold text-sm">
                  {pasteStatus ? pasteStatus.message : "Waiting for input..."}
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:bg-gray-700 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPaste}
                disabled={!pasteStatus?.valid}
                className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import {pasteStatus?.valid && pasteStatus.count > 0 ? `(${pasteStatus.count})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH EXPORT MODAL */}
      {showBatchModal && (
        <div className="absolute inset-0 z-50 bg-gray-900/50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90%]">
             <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 rounded-t-xl">
               <div className="flex items-center gap-3">
                 <Package className="w-6 h-6 text-amber-600" />
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">Batch Processor</h3>
               </div>
               <button onClick={() => !processingBatchIndex && setShowBatchModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 disabled:opacity-30" disabled={processingBatchIndex !== null}>
                 <X className="w-6 h-6" />
               </button>
             </div>

             {/* ORIENTATION CONFIGURATION */}
             <div className="px-4 pt-4 pb-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <h4 className="font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-2">Export Configuration</h4>
                <div className="flex gap-4">
                   <button
                     onClick={() => setExportOrientation('landscape')}
                     disabled={processingBatchIndex !== null}
                     className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors text-xs font-bold uppercase tracking-wider ${exportOrientation === 'landscape' ? 'bg-indigo-600 text-white border-indigo-600' : 'text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-900'} disabled:opacity-50`}
                   >
                     <RectangleHorizontal className="w-4 h-4" /> Landscape (1200x800)
                   </button>
                   <button
                     onClick={() => setExportOrientation('portrait')}
                     disabled={processingBatchIndex !== null}
                     className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors text-xs font-bold uppercase tracking-wider ${exportOrientation === 'portrait' ? 'bg-indigo-600 text-white border-indigo-600' : 'text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-900'} disabled:opacity-50`}
                   >
                     <RectangleVertical className="w-4 h-4" /> Portrait (800x1200)
                   </button>
                </div>
             </div>

             <div className="p-4 overflow-y-auto">
               <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                 <strong>Batch Strategy:</strong> Your {deckSize} items have been split into {batches.length} manageable parts to ensure smooth processing.
               </div>

               <div className="space-y-3">
                 {batches.map((batch, index) => {
                    const isProcessing = processingBatchIndex === index;
                    const isOtherProcessing = processingBatchIndex !== null && processingBatchIndex !== index;
                    const startNum = index * 500 + 1;
                    const endNum = Math.min((index + 1) * 500, deckSize);

                    return (
                      <div key={index} className={`p-4 border rounded-lg flex items-center justify-between transition-colors ${
                        isProcessing ? 'bg-white dark:bg-gray-800 border-indigo-500 shadow-md' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                      } ${isOtherProcessing ? 'opacity-50' : ''}`}>

                         <div>
                           <h4 className="font-bold text-gray-900 dark:text-white dark:text-white">Part {index + 1}</h4>
                           <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Items {startNum} - {endNum} ({batch.length} cards)</p>
                         </div>

                         <div className="flex items-center gap-4">
                           {isProcessing && batchProgress && (
                             <div className="flex flex-col items-end">
                               <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                 <Loader2 className="w-4 h-4 animate-spin" />
                                 {batchProgress.current} / {batchProgress.total}
                               </div>
                               <div className="w-24 h-1 bg-gray-200 dark:bg-gray-700 mt-1 rounded-full overflow-hidden">
                                 <div
                                   className="h-full bg-indigo-600 transition-all duration-300"
                                   style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                                 />
                               </div>
                             </div>
                           )}

                           <button
                             onClick={() => processBatch(index)}
                             disabled={processingBatchIndex !== null}
                             className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                               isProcessing
                               ? 'bg-indigo-600 text-white'
                               : 'bg-gray-800 text-white hover:bg-gray-900'
                             } disabled:opacity-50 disabled:cursor-not-allowed`}
                           >
                             {isProcessing ? 'Processing...' : 'Download ZIP'}
                           </button>
                         </div>
                      </div>
                    );
                 })}
               </div>
             </div>

             <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-center text-xs text-gray-500 dark:text-gray-400 rounded-b-xl">
               Files are generated client-side. Large batches may take a few moments.
             </div>
           </div>
        </div>
      )}

      {/* DOWNLOAD READY MODAL */}
      <DownloadReadyModal
        isOpen={!!downloadReadyInfo}
        onClose={handleCloseDownloadReady}
        fileUrl={downloadReadyInfo?.url || ''}
        fileName={downloadReadyInfo?.fileName || ''}
        blob={downloadReadyInfo?.blob}
        fileType={downloadReadyInfo?.type}
      />
    </div>
  );
};
