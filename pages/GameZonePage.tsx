
import React, { useState, useEffect } from 'react';
import { Target, Puzzle, Brain, Rocket, Footprints, Palette } from 'lucide-react';
import Card from '../components/Card';
import WordShooterGame from '../components/WordShooterGame';
import CrosswordGame from '../components/CrosswordGame';
import SudokuGame from '../components/SudokuGame';

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type SudokuDifficulty = 'easy' | 'medium' | 'hard';
type Game = 'word-shooter' | 'crossword' | 'sudoku' | null;
type Theme = 'default' | 'crimson' | 'forest' | 'ocean';

const THEME_STORAGE_KEY = 'ninurta-gamezone-theme';

const themes: { name: Theme; label: string; accentColor: string }[] = [
    { name: 'default', label: 'Default', accentColor: '#FBBF24' },
    { name: 'crimson', label: 'Crimson', accentColor: '#ef4444' },
    { name: 'forest', label: 'Forest', accentColor: '#4ade80' },
    { name: 'ocean', label: 'Ocean', accentColor: '#60a5fa' },
];


const WordShooterSetup: React.FC<{ onStart: (topic: string, difficulty: Difficulty) => void }> = ({ onStart }) => {
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState<Difficulty>('Easy');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (topic.trim()) {
            onStart(topic, difficulty);
        }
    };
    
    return (
        <Card className="w-full max-w-lg text-center bg-[var(--bg-card)] text-[var(--text-primary)]">
            <h2 className="text-3xl font-bold text-[var(--color-accent)] mb-4">Word Shooter</h2>
            <p className="text-[var(--text-secondary)] mb-8">Type the falling words before they hit the bottom. Choose a topic to generate related words!</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="topic" className="block text-lg font-semibold mb-2">Topic</label>
                    <input id="topic" type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., 'Space Exploration'" required className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] p-3 rounded-lg border border-[var(--border-color)] focus:ring-2 focus:ring-[var(--color-accent)] focus:outline-none"/>
                </div>
                <div>
                    <p className="text-lg font-semibold mb-2">Difficulty</p>
                    <div className="flex justify-center space-x-4">
                        {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                            <button key={d} type="button" onClick={() => setDifficulty(d)} className={`py-2 px-6 rounded-lg transition-colors ${difficulty === d ? 'bg-royal-purple text-white' : 'bg-[var(--bg-input)] hover:bg-[var(--bg-secondary)]'}`}>
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
                <button type="submit" className="bg-[var(--color-accent)] text-[var(--color-accent-text)] font-bold py-3 px-8 rounded-lg text-lg hover:opacity-90 transition-opacity">Start Game</button>
            </form>
        </Card>
    );
};

const SudokuSetup: React.FC<{ onStart: (difficulty: SudokuDifficulty) => void }> = ({ onStart }) => {
    return (
        <Card className="w-full max-w-lg text-center bg-[var(--bg-card)] text-[var(--text-primary)]">
            <h2 className="text-3xl font-bold text-[var(--color-accent)] mb-4">Sudoku</h2>
            <p className="text-[var(--text-secondary)] mb-8">Select a difficulty to generate a new puzzle.</p>
            <div className="flex justify-center space-x-4">
                {(['easy', 'medium', 'hard'] as SudokuDifficulty[]).map(d => (
                    <button key={d} type="button" onClick={() => onStart(d)} className="capitalize py-2 px-6 rounded-lg bg-royal-purple text-white hover:bg-purple-500 transition-colors">
                        {d}
                    </button>
                ))}
            </div>
        </Card>
    );
};

const GameCard: React.FC<{ icon: React.ReactNode, title: string, description: string, onClick: () => void, disabled?: boolean }> = ({ icon, title, description, onClick, disabled }) => (
    <div className={`text-center h-full flex flex-col p-6 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:shadow-xl hover:shadow-royal-purple/20 transition-shadow ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} onClick={!disabled ? onClick : undefined}>
        <div className="text-[var(--color-accent)] mx-auto mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-[var(--text-secondary)] flex-grow">{description}</p>
        {disabled && <p className="text-sm font-bold mt-4 text-pink-accent">Coming Soon!</p>}
    </div>
);

const GameZonePage: React.FC = () => {
    const [activeGame, setActiveGame] = useState<Game>(null);
    const [gameConfig, setGameConfig] = useState<{ topic?: string; difficulty?: Difficulty; sudokuDifficulty?: SudokuDifficulty }>({});
    const [theme, setTheme] = useState<Theme>('default');
    const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
    
    useEffect(() => {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
        if (savedTheme && themes.some(t => t.name === savedTheme)) {
            setTheme(savedTheme);
        }
    }, []);
    
    useEffect(() => {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const handleEndGame = () => {
        setActiveGame(null);
        setGameConfig({});
    }

    if (activeGame === 'word-shooter' && gameConfig.topic && gameConfig.difficulty) {
        return <WordShooterGame topic={gameConfig.topic} difficulty={gameConfig.difficulty} onEndGame={handleEndGame} theme={theme} />;
    }
    if (activeGame === 'crossword') {
        return <CrosswordGame onBack={handleEndGame} theme={theme} />;
    }
    if (activeGame === 'sudoku' && gameConfig.sudokuDifficulty) {
        return <SudokuGame difficulty={gameConfig.sudokuDifficulty} onEndGame={handleEndGame} theme={theme}/>;
    }

    return (
        <div className={`theme-${theme} bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen`}>
            <div className="container mx-auto px-6 py-12">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-center">Game Zone</h1>
                    <button onClick={() => setIsCustomizeOpen(!isCustomizeOpen)} className="flex items-center space-x-2 p-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)]">
                        <Palette className="text-[var(--color-accent)]"/>
                        <span>Customize</span>
                    </button>
                </div>

                {isCustomizeOpen && (
                    <Card className="mb-8 bg-[var(--bg-card)]">
                        <h2 className="text-xl font-bold mb-4 text-[var(--color-accent)]">Choose a Theme</h2>
                        <div className="flex flex-wrap gap-4">
                            {themes.map(t => (
                                <button key={t.name} onClick={() => setTheme(t.name)} className={`px-4 py-2 rounded-lg font-semibold border-2 ${theme === t.name ? 'border-[var(--color-accent)]' : 'border-transparent'}`}>
                                    <div className="flex items-center space-x-2">
                                        <span className="w-5 h-5 rounded-full" style={{backgroundColor: t.accentColor}}></span>
                                        <span>{t.label}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </Card>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <GameCard 
                        icon={<Target size={40}/>} 
                        title="Word Shooter" 
                        description="Type the falling words related to any topic before they hit the bottom."
                        onClick={() => setActiveGame('word-shooter')}
                    />
                     <GameCard 
                        icon={<Puzzle size={40}/>} 
                        title="AI Crossword" 
                        description="Generate and solve crossword puzzles on any subject you can imagine."
                        onClick={() => setActiveGame('crossword')}
                    />
                     <GameCard 
                        icon={<Brain size={40}/>} 
                        title="Sudoku" 
                        description="Challenge your logic with classic Sudoku puzzles at various difficulty levels."
                        onClick={() => setActiveGame('sudoku')}
                    />
                     <GameCard 
                        icon={<Rocket size={40}/>} 
                        title="Cosmic Football" 
                        description="A futuristic sports game. (Coming Soon!)"
                        onClick={() => {}}
                        disabled
                    />
                     <GameCard 
                        icon={<Footprints size={40}/>} 
                        title="Endless Runner" 
                        description="Test your reflexes in a fast-paced running challenge. (Coming Soon!)"
                        onClick={() => {}}
                        disabled
                    />
                </div>

                {activeGame === 'word-shooter' && !gameConfig.topic && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className={`relative theme-${theme}`}>
                            <WordShooterSetup onStart={(topic, difficulty) => setGameConfig({ topic, difficulty })}/>
                             <button onClick={handleEndGame} className="absolute -top-2 -right-2 text-white bg-red-600 rounded-full w-8 h-8 flex items-center justify-center text-2xl font-bold">&times;</button>
                        </div>
                    </div>
                )}
                {activeGame === 'sudoku' && !gameConfig.sudokuDifficulty && (
                     <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className={`relative theme-${theme}`}>
                            <SudokuSetup onStart={(difficulty) => setGameConfig({ sudokuDifficulty: difficulty })}/>
                            <button onClick={handleEndGame} className="absolute -top-2 -right-2 text-white bg-red-600 rounded-full w-8 h-8 flex items-center justify-center text-2xl font-bold">&times;</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GameZonePage;
