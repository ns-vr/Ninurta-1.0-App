
export interface Question {
    questionText: string;
    options: string[];
    correctAnswer: string;
}

export interface Quiz {
    topic: string;
    questions: Question[];
}

export interface JournalEntry {
    id: string;
    date: string;
    content: string;
}

export interface MindMapNode {
    id: string;
    label: string;
    children?: MindMapNode[];
}

// For future game implementations
export interface CrosswordClue {
  clue: string;
  answer: string;
  position: number;
  orientation: 'across' | 'down';
  grid: { row: number, col: number };
}

export interface CrosswordData {
    size: number;
    clues: CrosswordClue[];
}

export interface SudokuPuzzle {
    puzzle: number[][];
    solution: number[][];
    difficulty: 'easy' | 'medium' | 'hard';
}

// For Word Shooter Game
export interface FallingWord {
    id: number;
    text: string;
    x: number;
    y: number;
}

// For Chatbot
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}