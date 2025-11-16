
import React, { useState, useEffect, useRef } from 'react';
import { generateCrosswordData } from '../services/geminiService';
import { CrosswordData } from '../types';
import LoadingSpinner from './LoadingSpinner';
import Card from './Card';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { updateStreak } from '../utils/gamification';

interface Props {
    onBack: () => void;
    theme: string;
}

const CrosswordGame: React.FC<Props> = ({ onBack, theme }) => {
    const [topic, setTopic] = useState('');
    const [crossword, setCrossword] = useState<CrosswordData | null>(null);
    const [grid, setGrid] = useState<string[][]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const inputRefs = useRef<Array<Array<HTMLInputElement | null>>>([]);

    useEffect(() => {
        if (crossword) {
            const newGrid = Array(crossword.size).fill(null).map(() => Array(crossword.size).fill(''));
            crossword.clues.forEach(clue => {
                let { row, col } = clue.grid;
                for (let i = 0; i < clue.answer.length; i++) {
                    if (clue.orientation === 'across') {
                        if (newGrid[row][col + i] === '') newGrid[row][col + i] = ' '; // Mark as part of a word
                    } else {
                        if (newGrid[row + i][col] === '') newGrid[row + i][col] = ' '; // Mark as part of a word
                    }
                }
            });
            setGrid(newGrid);
            inputRefs.current = Array(crossword.size).fill(null).map(() => Array(crossword.size).fill(null));
        }
    }, [crossword]);
    
     const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
        const value = e.target.value.toUpperCase();
        const newGrid = [...grid.map(r => [...r])];
        newGrid[row][col] = value;
        setGrid(newGrid);
        setIsCorrect(null);

        if (value && inputRefs.current) {
            // Find next empty cell in the same word
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) {
            setError("Please enter a topic.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setCrossword(null);
        setIsCorrect(null);
        try {
            const data = await generateCrosswordData(topic);
            setCrossword(data);
        } catch (err) {
            setError("Failed to generate crossword. Please try another topic.");
        } finally {
            setIsLoading(false);
        }
    };

    const checkSolution = () => {
        if (!crossword) return;
        let allCorrect = true;
        crossword.clues.forEach(clue => {
            let { row, col } = clue.grid;
            for (let i = 0; i < clue.answer.length; i++) {
                const userChar = clue.orientation === 'across' ? grid[row][col + i] : grid[row + i][col];
                if (userChar.toUpperCase() !== clue.answer[i].toUpperCase()) {
                    allCorrect = false;
                    break;
                }
            }
            if(!allCorrect) return;
        });
        setIsCorrect(allCorrect);
        if (allCorrect) {
            updateStreak();
        }
    };
    
    const Wrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
        <div className={`theme-${theme} bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen`}>
            {children}
        </div>
    );

    if (!crossword && !isLoading) {
        return (
            <Wrapper>
            <div className="container mx-auto px-6 py-12 flex flex-col items-center">
                <button onClick={onBack} className="self-start mb-4 flex items-center space-x-2 text-[var(--color-accent)] hover:opacity-80"><ArrowLeft/><span>Back to Games</span></button>
                <Card className="w-full max-w-lg text-center bg-[var(--bg-card)] text-[var(--text-primary)]">
                    <h2 className="text-3xl font-bold text-[var(--color-accent)] mb-4">AI Crossword</h2>
                    <p className="text-[var(--text-secondary)] mb-8">Enter any topic, and we'll generate a unique crossword puzzle for you!</p>
                    <form onSubmit={handleGenerate}>
                        <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., 'Ancient Egypt'" required className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] p-3 rounded-lg border border-[var(--border-color)] focus:ring-2 focus:ring-[var(--color-accent)] focus:outline-none"/>
                        <button type="submit" className="mt-4 bg-[var(--color-accent)] text-[var(--color-accent-text)] font-bold py-3 px-8 rounded-lg text-lg hover:opacity-90">Generate Puzzle</button>
                    </form>
                    {error && <p className="text-red-400 mt-4">{error}</p>}
                </Card>
            </div>
            </Wrapper>
        );
    }
    
    if (isLoading) return <div className={`fixed inset-0 bg-[var(--bg-primary)] flex items-center justify-center theme-${theme}`}><LoadingSpinner message="Generating your crossword puzzle..." /></div>;
    
    return (
        <Wrapper>
        <div className="container mx-auto px-6 py-12">
             <button onClick={onBack} className="mb-4 flex items-center space-x-2 text-[var(--color-accent)] hover:opacity-80"><ArrowLeft/><span>Back to Games</span></button>
             <h1 className="text-4xl font-bold mb-8 text-center">Crossword: <span className="text-[var(--color-accent)]">{topic}</span></h1>
             <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
                <div className="flex-shrink-0">
                     <div className="grid gap-0.5 bg-[var(--bg-secondary)] p-1 rounded-md" style={{ gridTemplateColumns: `repeat(${crossword?.size}, minmax(0, 1fr))` }}>
                        {grid.map((row, rIdx) => row.map((cell, cIdx) => {
                            const clueNumber = crossword?.clues.find(c => c.grid.row === rIdx && c.grid.col === cIdx)?.position;
                             return (
                                <div key={`${rIdx}-${cIdx}`} className="relative w-8 h-8 md:w-10 md:h-10">
                                {cell !== '' ? (
                                    <>
                                        {clueNumber && <span className="absolute top-0 left-1 text-[10px] text-[var(--text-secondary)]">{clueNumber}</span>}
                                        <input
                                            ref={el => { if(inputRefs.current[rIdx]) inputRefs.current[rIdx][cIdx] = el}}
                                            type="text"
                                            maxLength={1}
                                            value={grid[rIdx][cIdx].trim()}
                                            onChange={(e) => handleInputChange(e, rIdx, cIdx)}
                                            className="w-full h-full text-center text-lg md:text-xl font-bold uppercase bg-[var(--bg-input)] text-[var(--text-primary)] border-none rounded-none focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                                        />
                                    </>
                                ) : <div className="w-full h-full bg-[var(--bg-secondary)]"></div>}
                                </div>
                             );
                        }))}
                    </div>
                    <button onClick={checkSolution} className="mt-4 w-full bg-blue-accent text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2"><CheckCircle/><span>Check Solution</span></button>
                    {isCorrect !== null && (
                        <p className={`mt-2 text-center font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {isCorrect ? "Congratulations! You solved it!" : "Not quite right. Keep trying!"}
                        </p>
                    )}
                </div>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
                     <div>
                        <h3 className="text-2xl font-bold text-[var(--color-accent)] mb-2">Across</h3>
                        <ul className="space-y-1 text-sm list-inside max-h-96 overflow-y-auto">
                            {crossword?.clues.filter(c => c.orientation === 'across').sort((a,b) => a.position - b.position).map(c => <li key={`across-${c.position}`}><strong>{c.position}.</strong> {c.clue}</li>)}
                        </ul>
                     </div>
                     <div>
                        <h3 className="text-2xl font-bold text-[var(--color-accent)] mb-2">Down</h3>
                        <ul className="space-y-1 text-sm list-inside max-h-96 overflow-y-auto">
                             {crossword?.clues.filter(c => c.orientation === 'down').sort((a,b) => a.position - b.position).map(c => <li key={`down-${c.position}`}><strong>{c.position}.</strong> {c.clue}</li>)}
                        </ul>
                     </div>
                </div>
             </div>
        </div>
        </Wrapper>
    );
};

export default CrosswordGame;
