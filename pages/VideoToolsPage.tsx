
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { summarizeText, generateVideo, pollVideoOperation } from '../services/geminiService';
import { Operation, VideosGenerateVideosResponse } from '@google/genai';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/Card';
import { Upload } from 'lucide-react';

// Mock window.aistudio for environments where it might not exist
if (typeof window !== 'undefined' && !(window as any).aistudio) {
    (window as any).aistudio = {
        hasSelectedApiKey: () => Promise.resolve(true),
        openSelectKey: () => {
            alert("This is a mock API key selector. In a real environment, a dialog would open. See https://ai.google.dev/gemini-api/docs/billing for more info.");
            return Promise.resolve();
        }
    };
}


const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [image, setImage] = useState<{file: File, preview: string, data: string, mimeType: string} | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("Initializing video generation...");
    const pollingIntervalRef = useRef<number | null>(null);
    
    useEffect(() => {
        const checkApiKey = async () => {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            setApiKeySelected(hasKey);
        };
        checkApiKey();
        
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    const handleApiKeySelect = async () => {
        await (window as any).aistudio.openSelectKey();
        setApiKeySelected(true); // Assume success after opening dialog to avoid race conditions
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Data = (reader.result as string).split(',')[1];
                setImage({
                    file: file,
                    preview: URL.createObjectURL(file),
                    data: base64Data,
                    mimeType: file.type
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateVideo = useCallback(async () => {
        if (!prompt && !image) {
            setError("A text prompt or an image is required.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        const loadingMessages = [
            "Warming up the digital director...",
            "Casting pixels for their roles...",
            "Rendering the first few frames...",
            "Applying special effects...",
            "Finalizing the cinematic masterpiece...",
        ];
        let messageIndex = 0;
        setLoadingMessage(loadingMessages[messageIndex]);
        const messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            setLoadingMessage(loadingMessages[messageIndex]);
        }, 8000);


        try {
            let operation = await generateVideo(prompt, aspectRatio, image ? {data: image.data, mimeType: image.mimeType} : undefined);

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10s
                operation = await pollVideoOperation(operation);
            }

            clearInterval(messageInterval);

            if (operation.response?.generatedVideos?.[0]?.video?.uri) {
                const downloadLink = operation.response.generatedVideos[0].video.uri;
                // In a real scenario, you must append API key. The browser might block this due to CORS.
                // For this demo, we assume the link is publicly accessible or handled server-side.
                const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                const videoBlob = await response.blob();
                setVideoUrl(URL.createObjectURL(videoBlob));

            } else {
                throw new Error("Video generation completed, but no video URI was found.");
            }
        } catch (err: any) {
            clearInterval(messageInterval);
            let errorMessage = "An error occurred during video generation.";
            if (err.message.includes("Requested entity was not found")) {
                errorMessage = "Your API key seems to be invalid. Please select a valid key and try again.";
                setApiKeySelected(false);
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, image, aspectRatio]);
    
    if (!apiKeySelected) {
        return (
            <Card>
                <h3 className="text-xl font-bold text-gold mb-4">API Key Required for Video Generation</h3>
                <p className="text-gray-400 mb-6">Video generation with Veo is a premium feature. Please select your API key to proceed. For more information on billing, visit <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-accent underline">ai.google.dev/gemini-api/docs/billing</a>.</p>
                <button onClick={handleApiKeySelect} className="bg-gold text-midnight-blue font-bold py-2 px-6 rounded-lg">Select API Key</button>
            </Card>
        );
    }

    return (
        <Card>
            <h3 className="text-xl font-bold text-gold mb-4">AI Video Generator</h3>
            <p className="text-gray-400 mb-6">Turn your ideas into short video clips. Describe a scene, or upload an image to animate it.</p>
            <div className="space-y-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'A neon hologram of a cat driving a sports car at top speed'"
                    className="w-full h-24 bg-slate-700 p-3 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-gold"
                />
                 <div className="flex items-center space-x-4">
                     <label htmlFor="image-upload" className="flex items-center space-x-2 cursor-pointer bg-slate-700 hover:bg-slate-600 text-soft-white font-bold py-2 px-4 rounded-lg">
                        <Upload size={20} />
                        <span>Start Image (Optional)</span>
                    </label>
                    <input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')}
                        className="bg-slate-700 text-soft-white p-2 rounded-lg border border-slate-600 focus:ring-2 focus:ring-gold focus:outline-none"
                    >
                        <option value="16:9">16:9 Landscape</option>
                        <option value="9:16">9:16 Portrait</option>
                    </select>
                </div>
                {image && <img src={image.preview} alt="Preview" className="w-24 h-24 rounded-lg object-cover" />}

                <button onClick={handleGenerateVideo} disabled={isLoading} className="w-full bg-gold text-midnight-blue font-bold py-3 px-6 rounded-lg disabled:bg-gray-500">
                    {isLoading ? 'Generating...' : 'Generate Video'}
                </button>
            </div>
            {error && <p className="text-red-400 mt-4">{error}</p>}
            {isLoading && <LoadingSpinner message={loadingMessage} />}
            {videoUrl && (
                <div className="mt-6">
                    <h4 className="text-lg font-semibold mb-2">Your Generated Video:</h4>
                    <video src={videoUrl} controls autoPlay loop className="w-full rounded-lg" />
                </div>
            )}
        </Card>
    );
}

const VideoSummarizer: React.FC = () => {
    const [videoUrl, setVideoUrl] = useState('');
    const [transcript, setTranscript] = useState('');
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSummarize = useCallback(async () => {
        if (!transcript.trim()) {
            setError("Please paste the video transcript to generate a summary.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSummary('');
        try {
            const result = await summarizeText(transcript);
            setSummary(result);
        } catch (err) {
            setError("Failed to generate summary. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [transcript]);
    
    return (
        <Card>
            <h3 className="text-xl font-bold text-gold mb-4">AI Video Summarizer</h3>
            <p className="text-gray-400 mb-6">Enter a video URL to get a concise summary. <strong className="text-yellow-400">Note:</strong> Direct video processing from URLs is not supported on this platform. Please paste the video transcript below to generate a summary.</p>
            
            <label htmlFor="video-url" className="sr-only">Video URL</label>
            <input
                id="video-url"
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-slate-700 p-3 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-gold"
            />

            <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste video transcript here..."
                className="w-full h-40 bg-slate-700 p-3 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-gold mt-4"
            />
            <button onClick={handleSummarize} disabled={isLoading} className="mt-4 w-full bg-blue-accent text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-500">
                {isLoading ? 'Summarizing...' : 'Generate Summary'}
            </button>
             {error && <p className="text-red-400 mt-4">{error}</p>}
            {isLoading && <LoadingSpinner message="Creating your summary..." />}
            {summary && (
                <div className="mt-6">
                    <h4 className="text-lg font-semibold mb-2">Summary:</h4>
                    <div className="bg-slate-900 p-4 rounded-lg whitespace-pre-wrap">{summary}</div>
                </div>
            )}
        </Card>
    );
};


const VideoToolsPage: React.FC = () => {
    return (
        <div className="container mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold mb-8 text-center">Video Tools</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <VideoGenerator />
                <VideoSummarizer />
            </div>
        </div>
    );
};

export default VideoToolsPage;
