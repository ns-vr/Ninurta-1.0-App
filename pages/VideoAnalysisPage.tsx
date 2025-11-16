
import React, { useState } from 'react';
import { analyzeVideo } from '../services/geminiService';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { Upload, Film } from 'lucide-react';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const VideoAnalysisPage: React.FC = () => {
    const [prompt, setPrompt] = useState('Summarize this video.');
    const [video, setVideo] = useState<{file: File, preview: string, data: string, mimeType: string} | null>(null);
    const [response, setResponse] = useState<string|null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > MAX_FILE_SIZE_BYTES) {
                setError(`File is too large. Please upload a video under ${MAX_FILE_SIZE_MB}MB.`);
                return;
            }
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Data = (reader.result as string).split(',')[1];
                setVideo({
                    file: file,
                    preview: URL.createObjectURL(file),
                    data: base64Data,
                    mimeType: file.type
                });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleAnalyzeVideo = async () => {
        if (!prompt.trim() || !video) {
            setError("Please upload a video and provide a question or prompt.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResponse(null);
        try {
            const result = await analyzeVideo(prompt, {data: video.data, mimeType: video.mimeType});
            setResponse(result);
        } catch (err) {
            setError("Failed to analyze video. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-6 py-12 flex flex-col items-center">
            <h1 className="text-4xl font-bold mb-8 text-center">Video Analyzer</h1>
            <Card className="w-full max-w-4xl">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                     <div>
                        <label htmlFor="video-upload" className="block cursor-pointer bg-slate-700 hover:bg-slate-600 rounded-lg p-4 text-center border-2 border-dashed border-slate-500 h-full flex flex-col justify-center items-center">
                            {video ? <video src={video.preview} controls className="max-h-64 mx-auto rounded-lg"/> : <><Upload size={40} className="mx-auto text-gray-400 mb-2"/> <p>Click to upload a video</p><p className="text-sm text-gray-500">(Max {MAX_FILE_SIZE_MB}MB)</p></>}
                        </label>
                        <input id="video-upload" type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
                     </div>
                     <div className="space-y-4">
                         <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., 'What is happening in this video?'"
                            className="w-full h-36 bg-slate-700 text-soft-white p-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-gold focus:outline-none"
                        />
                         <button onClick={handleAnalyzeVideo} disabled={isLoading || !video} className="w-full bg-gold text-midnight-blue font-bold py-3 px-8 rounded-lg text-lg hover:bg-yellow-300 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                           <Film size={20} /><span>{isLoading ? 'Analyzing...' : 'Analyze Video'}</span>
                        </button>
                     </div>
                </div>
                 {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
                  <div className="mt-8">
                    {isLoading && <LoadingSpinner message="Analyzing your video..." />}
                    {response && (
                        <div>
                            <h2 className="text-2xl font-bold text-gold mb-4">Analysis Result</h2>
                            <div className="bg-slate-900 p-4 rounded-lg whitespace-pre-wrap">{response}</div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default VideoAnalysisPage;