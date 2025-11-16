
import React, { useState, useCallback } from 'react';
import { solveComplexProblem } from '../services/geminiService';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { BrainCog } from 'lucide-react';

const ComplexProblemSolverPage: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSolve = useCallback(async () => {
        if (!prompt.trim()) {
            setError("Please enter a problem or question.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResponse(null);
        try {
            const result = await solveComplexProblem(prompt);
            setResponse(result);
        } catch (err) {
            setError("An error occurred while solving the problem. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [prompt]);

    return (
        <div className="container mx-auto px-6 py-12 flex flex-col items-center">
            <h1 className="text-4xl font-bold mb-8 text-center">Complex Problem Solver</h1>
            <Card className="w-full max-w-4xl">
                 <p className="text-gray-400 mb-6 text-center">For your most complex queries. This tool uses Gemini 2.5 Pro with enhanced thinking to provide more thorough and reasoned responses.</p>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe a complex problem, ask a multi-step question, or request a detailed analysis..."
                    className="w-full h-48 bg-slate-700 text-soft-white p-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-gold focus:outline-none"
                />
                <button 
                    onClick={handleSolve} 
                    disabled={isLoading} 
                    className="mt-4 w-full bg-gold text-midnight-blue font-bold py-3 px-8 rounded-lg text-lg hover:bg-yellow-300 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                    <BrainCog size={24} />
                    <span>{isLoading ? 'Thinking...' : 'Solve with Pro'}</span>
                </button>
                 {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
                  <div className="mt-8">
                    {isLoading && <LoadingSpinner message="Engaging advanced reasoning..." />}
                    {response && (
                        <div>
                            <h2 className="text-2xl font-bold text-gold mb-4">Solution</h2>
                            <div className="bg-slate-900 p-4 rounded-lg whitespace-pre-wrap prose prose-invert max-w-none">{response}</div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default ComplexProblemSolverPage;