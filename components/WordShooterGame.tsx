import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateGameWords } from '../services/geminiService';
import { FallingWord } from '../types';
import { addXp, updateStreak } from '../utils/gamification';
import LoadingSpinner from './LoadingSpinner';
import Card from './Card';
import { Award, RefreshCw } from 'lucide-react';

interface GameProps {
    topic: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    onEndGame: () => void;
    theme: string;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

const WordShooterGame: React.FC<GameProps> = ({ topic, difficulty, onEndGame, theme }) => {
    const [words, setWords] = useState<FallingWord[]>([]);
    const [typedWord, setTypedWord] = useState('');
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [wordList, setWordList] = useState<string[]>([]);
    const [explosions, setExplosions] = useState<{ id: number; x: number; y: number }[]>([]);

    const gameLoopRef = useRef<number>();
    const wordSpawnLoopRef = useRef<number>();
    const inputRef = useRef<HTMLInputElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const difficultySettings = {
        Easy: { speed: 1, spawnRate: 2000 },
        Medium: { speed: 1.5, spawnRate: 1500 },
        Hard: { speed: 2, spawnRate: 1000 },
    };
    const settings = difficultySettings[difficulty];

    useEffect(() => {
        // Create AudioContext. It might be in a suspended state until user interaction.
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Cleanup
        return () => {
            audioContextRef.current?.close().catch(console.error);
        };
    }, []);

    const playSound = useCallback((type: 'correct' | 'incorrect' | 'gameOver') => {
        const ctx = audioContextRef.current;
        if (!ctx) return;
        
        if (ctx.state === 'suspended') {
            ctx.resume().catch(console.error);
        }

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        gainNode.connect(ctx.destination);
        oscillator.connect(gainNode);

        const now = ctx.currentTime;

        switch (type) {
            case 'correct':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(800, now);
                oscillator.frequency.linearRampToValueAtTime(1200, now + 0.1);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;
            case 'incorrect':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(120, now);
                gainNode.gain.setValueAtTime(0.15, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;
            case 'gameOver':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(400, now);
                oscillator.frequency.exponentialRampToValueAtTime(100, now + 1);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1);
                oscillator.start(now);
                oscillator.stop(now + 1);
                break;
        }
    }, []);

    const startGame = useCallback(async () => {
        setIsLoading(true);
        setGameOver(false);
        setScore(0);
        setWords([]);
        setTypedWord('');
        setExplosions([]);
        try {
            const fetchedWords = await generateGameWords(topic, difficulty);
            setWordList(fetchedWords.sort(() => 0.5 - Math.random()));
        } catch (e) {
            console.error(e);
            setWordList(['error', 'loading', 'words']);
        } finally {
            setIsLoading(false);
            // Delay focus to ensure input is visible
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [topic, difficulty]);

    useEffect(() => {
        startGame();
    }, [startGame]);

    const handleGameOver = useCallback(() => {
        setGameOver(true);
        playSound('gameOver');
        if (score > 0) {
            addXp(score);
        }
        updateStreak();
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        if (wordSpawnLoopRef.current) clearInterval(wordSpawnLoopRef.current);
    }, [score, playSound]);

    // Game loops
    useEffect(() => {
        if (isLoading || gameOver) return;

        gameLoopRef.current = window.setInterval(() => {
            setWords(prevWords =>
                prevWords.map(word => {
                    const newY = word.y + settings.speed;
                    if (newY > GAME_HEIGHT) {
                        handleGameOver();
                        return { ...word, y: GAME_HEIGHT + 1 };
                    }
                    return { ...word, y: newY };
                }).filter(word => word.y <= GAME_HEIGHT)
            );
        }, 16); // ~60 FPS

        wordSpawnLoopRef.current = window.setInterval(() => {
            setWordList(currentWordList => {
                if (currentWordList.length === 0) {
                    if(words.length === 0) {
                         handleGameOver();
                    }
                    clearInterval(wordSpawnLoopRef.current!);
                    return [];
                }

                const newWordText = currentWordList[0];
                const newFallingWord: FallingWord = {
                    id: Date.now(),
                    text: newWordText,
                    x: Math.random() * (GAME_WIDTH - (newWordText.length * 12)),
                    y: 0,
                };
                setWords(prev => [...prev, newFallingWord]);
                return currentWordList.slice(1);
            });
        }, settings.spawnRate);

        return () => {
            clearInterval(gameLoopRef.current!);
            clearInterval(wordSpawnLoopRef.current!);
        };
    }, [isLoading, gameOver, settings.speed, settings.spawnRate, handleGameOver, words.length]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase();
        setTypedWord(value);
    
        // Game words don't have spaces, so we check against the value directly.
        const matchingWord = words.find(word => word.text.toLowerCase() === value);
        if (matchingWord) {
            playSound('correct');
            const explosion = { id: matchingWord.id, x: matchingWord.x, y: matchingWord.y };
            setExplosions(prev => [...prev, explosion]);
            setTimeout(() => setExplosions(prev => prev.filter(ex => ex.id !== explosion.id)), 300);
    
            setScore(prev => prev + matchingWord.text.length);
            setWords(prev => prev.filter(word => word.id !== matchingWord.id));
            setTypedWord('');
        } else {
            if (value.length > 0) {
                const isPrefix = words.some(w => w.text.toLowerCase().startsWith(value));
                if (!isPrefix) {
                    playSound('incorrect');
                }
            }
        }
    };

    if (isLoading) {
        return <div className={`fixed inset-0 bg-[var(--bg-primary)] flex items-center justify-center theme-${theme}`}><LoadingSpinner message={`Generating words for topic: ${topic}...`} /></div>
    }

    if (gameOver) {
        return (
            <div className={`container mx-auto px-6 py-12 flex flex-col items-center theme-${theme} bg-[var(--bg-primary)] min-h-screen`}>
                <Card className="w-full max-w-lg text-center bg-[var(--bg-card)] text-[var(--text-primary)]">
                    <Award size={60} className="mx-auto text-[var(--color-accent)] mb-4" />
                    <h2 className="text-3xl font-bold text-[var(--color-accent)] mb-4">
                        {wordList.length === 0 && words.length === 0 ? "You Win!" : "Game Over"}
                    </h2>
                    <p className="text-xl mb-2">Your Score: <span className="font-bold text-[var(--text-primary)]">{score}</span></p>
                    <p className="text-lg text-[var(--color-accent)] mb-6">+{score} XP Earned!</p>
                    <div className="flex justify-center space-x-4">
                        <button onClick={startGame} className="bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity flex items-center space-x-2">
                            <RefreshCw size={18}/><span>Play Again</span>
                        </button>
                        <button onClick={onEndGame} className="bg-[var(--color-accent)] text-[var(--color-accent-text)] font-bold py-3 px-8 rounded-lg text-lg hover:opacity-90 transition-opacity">
                            Return to Zone
                        </button>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className={`container mx-auto px-6 py-12 flex flex-col items-center theme-${theme} bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen`}>
            <h1 className="text-3xl font-bold mb-2">Word Shooter: <span className="text-[var(--color-accent)]">{topic}</span></h1>
            <p className="mb-4 text-[var(--text-secondary)]">Score: {score}</p>
            <div className="relative bg-[var(--bg-secondary)] border-2 border-[var(--border-accent)] rounded-lg overflow-hidden w-full max-w-[800px]" style={{ aspectRatio: '4 / 3' }}>
                {words.map(word => (
                    <div
                        key={word.id}
                        className="absolute text-[var(--text-primary)] font-mono text-lg word-shooter-word"
                        style={{ left: word.x, top: word.y }}
                    >
                        {word.text}
                    </div>
                ))}
                {explosions.map(ex => (
                     <div
                        key={ex.id}
                        className="absolute text-[var(--color-accent)] text-4xl font-extrabold"
                        style={{ left: ex.x, top: ex.y, animation: 'ping 0.3s ease-out' }}
                    >
                       +
                    </div>
                ))}
            </div>
            <input
                ref={inputRef}
                type="text"
                value={typedWord}
                onChange={handleInputChange}
                autoFocus
                className="w-full max-w-md mt-4 bg-[var(--bg-input)] text-[var(--text-primary)] p-3 rounded-lg border border-[var(--border-color)] focus:ring-2 focus:ring-[var(--color-accent)] focus:outline-none text-center text-xl"
                placeholder="Type words here..."
            />
        </div>
    );
};

export default WordShooterGame;