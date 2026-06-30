
import React, { useState } from 'react';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { FlashcardData, INITIAL_FLASHCARD_DATA } from './types';
import { Layers, Eye, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FlashcardMaker: React.FC = () => {
  const navigate = useNavigate();
  // Initialize state with auto-detected orientation for mobile
  const [data, setData] = useState<FlashcardData>(() => ({
    ...INITIAL_FLASHCARD_DATA,
    orientation: typeof window !== 'undefined' && window.innerWidth < 768 ? 'portrait' : 'landscape'
  }));

  // Deck State for multiple items
  const [deck, setDeck] = useState<FlashcardData[]>([]);
  const [currentDeckIndex, setCurrentDeckIndex] = useState<number>(-1);

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  const handleDataChange = (newData: FlashcardData) => {
    setData(newData);

    // If we are editing a card inside a deck, sync the changes back to the deck
    if (currentDeckIndex >= 0 && deck.length > 0) {
      const newDeck = [...deck];
      newDeck[currentDeckIndex] = newData;
      setDeck(newDeck);
    }
  };

  const handleImportBatch = (items: FlashcardData[]) => {
    if (items.length === 0) return;
    setDeck(items);
    setCurrentDeckIndex(0);
    setData(items[0]);
  };

  const handleNavigateDeck = (direction: 'prev' | 'next') => {
    if (deck.length === 0) return;

    let newIndex = currentDeckIndex;
    if (direction === 'prev') {
      newIndex = Math.max(0, currentDeckIndex - 1);
    } else {
      newIndex = Math.min(deck.length - 1, currentDeckIndex + 1);
    }

    if (newIndex !== currentDeckIndex) {
      setCurrentDeckIndex(newIndex);
      setData(deck[newIndex]);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden font-sans bg-gray-50 dark:bg-gray-900">
        {/* Back Button Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm z-10 px-4 py-3 flex items-center gap-3 pt-[env(safe-area-inset-top,0.75rem)]">
            <button
                onClick={() => navigate('/tools')}
                className="p-2 -ml-2 hover:bg-gray-100 active:bg-gray-200 dark:bg-gray-800 dark:hover:bg-slate-700 dark:active:bg-slate-600 rounded-full text-gray-700 dark:text-gray-200 transition-colors"
                title="Back to Tools"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">Flashcard Image Maker</h1>
        </div>

      {/* Desktop Layout: Split Pane */}
      <div className="hidden md:flex w-full flex-1 overflow-hidden">
        <div className="w-[450px] lg:w-[500px] flex-shrink-0 h-full border-r border-gray-200 dark:border-gray-700">
          <Editor
            data={data}
            onChange={handleDataChange}
            deck={deck}
            deckSize={deck.length}
            currentDeckIndex={currentDeckIndex}
            onNavigateDeck={handleNavigateDeck}
            onImportBatch={handleImportBatch}
          />
        </div>
        <div className="flex-1 h-full bg-gray-100 dark:bg-gray-800 relative">
          <Preview data={data} />
        </div>
      </div>

      {/* Mobile Layout: Tabs */}
      <div className="md:hidden flex flex-col w-full flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'editor' ? (
            <Editor
              data={data}
              onChange={handleDataChange}
              deck={deck}
              deckSize={deck.length}
              currentDeckIndex={currentDeckIndex}
              onNavigateDeck={handleNavigateDeck}
              onImportBatch={handleImportBatch}
            />
          ) : (
            <Preview data={data} />
          )}
        </div>

        {/* Mobile Tab Bar */}
        <div className="h-16 pb-[env(safe-area-inset-bottom)] bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex text-gray-500 dark:text-gray-400 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-10">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors active:bg-gray-100 dark:active:bg-slate-800 ${activeTab === 'editor' ? 'text-indigo-600 dark:text-indigo-400' : 'hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wider">EDITOR</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors active:bg-gray-100 dark:active:bg-slate-800 ${activeTab === 'preview' ? 'text-indigo-600 dark:text-indigo-400' : 'hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <Eye className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wider">PREVIEW</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default FlashcardMaker;
