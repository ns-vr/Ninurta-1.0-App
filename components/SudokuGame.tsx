
import React, { useState, useEffect, useCallback } from 'react';
import { generateSudokuPuzzle } from '../services/geminiService';
import { SudokuPuzzle } from '../types';
import LoadingSpinner from './LoadingSpinner';
import Card from './Card';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { updateStreak } from '../utils/gamification';

type Difficulty = 'easy' | 'medium' | 'hard';

interface Props {
    difficulty: Difficulty;
    onEndGame: () => void;
    theme: string;
}

const SudokuGame: React.FC<Props> = ({ difficulty, onEndGame, theme }) => {
    const [puzzleData, setPuzzleData] = useState<SudokuPuzzle | null>(null);
    const [grid, setGrid] = useState<number[][]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    const handleGenerate = useCallback(async (selectedDifficulty: Difficulty) => {
        setIsLoading(true);
        setError(null);
        setPuzzleData(null);
        setIsCorrect(null);
        try {
            const data = await generateSudokuPuzzle(selectedDifficulty);
            setPuzzleData(data);
            setGrid(data.puzzle.map(row => [...row]));
        } catch (err) {
            setError("Failed to generate Sudoku puzzle. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        handleGenerate(difficulty);
    }, [difficulty, handleGenerate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
        const value = e.target.value;
        if (/^[1-9]?$/.test(value)) {
            const newGrid = grid.map(r => [...r]);
            newGrid[row][col] = value === '' ? 0 : parseInt(value, 10);
            setGrid(newGrid);
            setIsCorrect(null);
        }
    };
    
    const checkSolution = () => {
        if (!puzzleData) return;
        const solution = JSON.stringify(puzzleData.solution);
        const userGrid = JSON.stringify(grid);
        const correct = solution === userGrid;
        setIsCorrect(correct);
        if (correct) {
            updateStreak();
        }
    };
    
    const Wrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
        <div className={`theme-${theme} bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen`}>
            {children}
        </div>
    );

    if (isLoading) return <div className={`fixed inset-0 bg-[var(--bg-primary)] flex items-center justify-center theme-${theme}`}><LoadingSpinner message={`Generating ${difficulty} puzzle...`} /></div>;

    if (error) {
        return (
             <Wrapper>
             <div className="container mx-auto px-6 py-12 flex flex-col items-center">
                <Card className="w-full max-w-lg text-center bg-[var(--bg-card)] text-[var(--text-primary)]">
                    <h2 className="text-3xl font-bold text-red-500 mb-4">Error</h2>
                    <p className="text-[var(--text-secondary)] mb-8">{error}</p>
                    <button onClick={onEndGame} className="bg-[var(--color-accent)] text-[var(--color-accent-text)] font-bold py-3 px-8 rounded-lg text-lg hover:opacity-90">Back to Game Zone</button>
                </Card>
            </div>
            </Wrapper>
        );
    }
    
    if (!puzzleData) {
        return (
             <Wrapper>
             <div className="container mx-auto px-6 py-12 flex flex-col items-center">
                <Card className="w-full max-w-lg text-center bg-[var(--bg-card)] text-[var(--text-primary)]">
                    <p className="text-[var(--text-secondary)] mb-8">Something went wrong and the puzzle could not be loaded.</p>
                    <button onClick={onEndGame} className="bg-[var(--color-accent)] text-[var(--color-accent-text)] font-bold py-3 px-8 rounded-lg text-lg hover:opacity-90">Back to Game Zone</button>
                </Card>
            </div>
            </Wrapper>
        )
    }

    return (
        <Wrapper>
        <div className="container mx-auto px-6 py-12 flex flex-col items-center">
             <button onClick={onEndGame} className="self-start mb-4 flex items-center space-x-2 text-[var(--color-accent)] hover:opacity-80"><ArrowLeft/><span>Back to Game Zone</span></button>
             <h1 className="text-4xl font-bold mb-8 text-center capitalize">Sudoku: <span className="text-[var(--color-accent)]">{difficulty}</span></h1>
            <div className="grid grid-cols-9 gap-0 bg-[var(--bg-secondary)] p-1 rounded-md border-2 border-[var(--border-color)]">
                {grid.map((row, rIdx) => row.map((cell, cIdx) => {
                    const isGiven = puzzleData?.puzzle[rIdx][cIdx] !== 0;
                    const isThickRight = (cIdx + 1) % 3 === 0 && cIdx < 8;
                    const isThickBottom = (rIdx + 1) % 3 === 0 && rIdx < 8;
                     return (
                         <input
                            key={`${rIdx}-${cIdx}`}
                            type="number"
                            min="1"
                            max="9"
                            value={cell === 0 ? '' : cell}
                            readOnly={isGiven}
                            onChange={(e) => handleInputChange(e, rIdx, cIdx)}
                            className={`w-10 h-10 md:w-12 md:h-12 text-center text-2xl font-bold border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] z-10
                                ${isGiven ? 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]' : 'bg-[var(--bg-input)] text-[var(--text-primary)]'}
                                ${isThickRight ? 'border-r-2 border-r-slate-500' : ''}
                                ${isThickBottom ? 'border-b-2 border-b-slate-500' : ''}
                            `}
                        />
                     );
                }))}
            </div>
            <button onClick={checkSolution} className="mt-6 bg-blue-accent text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center space-x-2"><CheckCircle/><span>Check Solution</span></button>
            {isCorrect !== null && (
                <p className={`mt-4 text-center font-bold text-xl ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {isCorrect ? "Congratulations! You solved it correctly!" : "There are some mistakes. Keep trying!"}
                </p>
            )}
        </div>
        </Wrapper>
    );
};

export default SudokuGame;
