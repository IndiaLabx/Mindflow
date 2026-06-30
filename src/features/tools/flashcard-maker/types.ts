
export type Orientation = 'landscape' | 'portrait';
export type CardTemplate = 'idiom' | 'ows';

export interface FlashcardData {
  id?: string; // Optional ID/Number for the card
  template: CardTemplate;
  idiom: string; // Serves as 'Word' for OWS
  partOfSpeech?: string; // Specific to OWS
  meaningEng: string;
  meaningHindi: string;
  usage: string;
  etymology: string;
  mnemonic: string; // Serves as 'Note' for OWS
  image?: string; // DataURL
  orientation: Orientation;
}

export const INITIAL_FLASHCARD_DATA: FlashcardData = {
  id: "1",
  template: 'idiom',
  idiom: "Break the ice",
  partOfSpeech: "",
  meaningEng: "To do or say something to relieve tension or get conversation going in a strained situation.",
  meaningHindi: "चुप्पी तोड़ना / बातचीत शुरू करना",
  usage: "Someone suggested playing a party game to break the ice.",
  etymology: "From the time when special ships (icebreakers) were used to break up ice in harbors so trade ships could pass through.",
  mnemonic: "Imagine a giant hammer smashing an ice wall between two awkward people.",
  image: "",
  orientation: 'landscape' // Default, overridden in App.tsx based on screen size
};

export interface EditorProps {
  data: FlashcardData;
  onChange: (data: FlashcardData) => void;

  // Deck Management
  deck: FlashcardData[]; // Full access to deck for batching
  deckSize: number;
  currentDeckIndex: number;
  onNavigateDeck: (direction: 'prev' | 'next') => void;
  onImportBatch: (items: FlashcardData[]) => void;
}

export interface PreviewProps {
  data: FlashcardData;
}