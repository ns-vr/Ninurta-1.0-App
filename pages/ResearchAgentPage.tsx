
import React, { useState, useCallback } from 'react';
import { performGroundedSearch } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/Card';
import { Link as LucideLink } from 'lucide-react';

const ResearchAgentPage: React.FC = () => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState<GenerateContentResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = useCallback(async () => {
        if (!query.trim()) {
            setError("Please enter a query.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResponse(null);
        try {
            const result = await performGroundedSearch(query);
            setResponse(result);
        } catch (err) {
            setError("An error occurred. Please check your API key and try again.");
        } finally {
            setIsLoading(false);
        }
    }, [query]);

    const sources = response?.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => chunk.web)
        .filter(web => web && web.uri);

    return (
        <div className="container mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold mb-8 text-center">AI Research Agent</h1>
            <Card className="w-full max-w-4xl mx-auto mb-8">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g., 'Latest discoveries in renewable energy'"
                        className="flex-grow w-full bg-slate-700 text-soft-white p-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-gold focus:outline-none"
                    />
                    <button onClick={handleSearch} disabled={isLoading} className="w-full md:w-auto bg-gold text-midnight-blue font-bold py-3 px-8 rounded-lg text-lg hover:bg-yellow-300 transition-colors disabled:bg-gray-500">
                        {isLoading ? 'Searching...' : 'Search'}
                    </button>
                </div>
                {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
            </Card>

            {isLoading && <LoadingSpinner message="Searching the web..." />}
            
            {response && (
                <Card className="w-full max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-4 text-gold">Research Results</h2>
                    <div className="prose prose-invert max-w-none bg-slate-900 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap font-sans">{response.text}</pre>
                    </div>
                    
                    {sources && sources.length > 0 && (
                         <div className="mt-6">
                            <h3 className="text-xl font-bold mb-3 text-gold flex items-center"><LucideLink size={20} className="mr-2"/>Sources</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                {sources.map((source, index) => (
                                    <li key={index}>
                                        <a href={source?.uri} target="_blank" rel="noopener noreferrer" className="text-blue-accent hover:underline">
                                            {source?.title || source?.uri}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};

export default ResearchAgentPage;
