
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateSpeech } from '../services/geminiService';
import { GoogleGenAI, LiveServerMessage, Modality, LiveSession } from '@google/genai';
import { createBlob } from '../utils/audioUtils';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/Card';
import { Play, Pause, Volume2, Mic, MicOff } from 'lucide-react';

// Helper function to decode base64 string
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper function to decode raw PCM audio data
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const TextToSpeech: React.FC = () => {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);

    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        return () => {
            audioContextRef.current?.close();
            if(audioSourceRef.current) audioSourceRef.current.stop();
        };
    }, []);

    const handleGenerateSpeech = useCallback(async () => {
        if (!text.trim()) {
            setError("Please enter some text to generate speech.");
            return;
        }
        setIsLoading(true);
        setError(null);
        if (audioSourceRef.current) audioSourceRef.current.stop();
        setIsPlaying(false);

        try {
            const base64Audio = await generateSpeech(text);
            const audioBytes = decode(base64Audio);
            
            if (!audioContextRef.current) throw new Error("Audio context not available");

            const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
            audioBufferRef.current = audioBuffer;
            playAudio();

        } catch (err) {
            setError("Failed to generate audio. Please check your API key and try again.");
        } finally {
            setIsLoading(false);
        }
    }, [text]);

    const playAudio = () => {
        if (!audioBufferRef.current || !audioContextRef.current) return;
        
        if (audioSourceRef.current) audioSourceRef.current.stop();

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsPlaying(false);
        source.start();
        
        audioSourceRef.current = source;
        setIsPlaying(true);
    };

    const togglePlayPause = () => {
        if (!audioContextRef.current) return;

        if (isPlaying) {
            audioContextRef.current.suspend().then(() => setIsPlaying(false));
        } else {
            audioContextRef.current.resume().then(() => setIsPlaying(true));
        }
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gold mb-4">Give Your Notes a Voice</h2>
            <p className="text-gray-400 mb-6">Convert any text into a spoken-word audiobook. Perfect for learning on the go.</p>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your study notes or any text here..."
                className="w-full h-48 bg-slate-700 p-3 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-gold resize-none"
            />
            <button onClick={handleGenerateSpeech} disabled={isLoading} className="mt-4 w-full bg-gold text-midnight-blue font-bold py-3 px-6 rounded-lg disabled:bg-gray-500">
                {isLoading ? 'Generating Audio...' : 'Generate and Play'}
            </button>
            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
            
            {isLoading && <LoadingSpinner message="Synthesizing speech..."/>}

            {audioBufferRef.current && !isLoading && (
                <div className="mt-6 p-4 bg-slate-700 rounded-lg flex items-center justify-center space-x-6">
                   <Volume2 size={30} className="text-blue-accent" />
                   <button onClick={togglePlayPause} className="p-3 bg-blue-accent rounded-full text-white">
                       {isPlaying ? <Pause size={24}/> : <Play size={24}/>}
                   </button>
                   <p className="font-semibold">{isPlaying ? 'Playing...' : 'Paused'}</p>
                </div>
            )}
        </div>
    );
};

const AudioTranscriber: React.FC = () => {
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [error, setError] = useState<string | null>(null);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

    const stopTranscription = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setIsTranscribing(false);
    }, []);

    useEffect(() => {
        return () => stopTranscription();
    }, [stopTranscription]);
    

    const startTranscription = async () => {
        setIsTranscribing(true);
        setError(null);
        setTranscription('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: { inputAudioTranscription: {} },
                callbacks: {
                    onopen: () => {
                        if (!audioContextRef.current || !mediaStreamRef.current) return;
                        const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;
                        scriptProcessor.onaudioprocess = (event) => {
                            const inputData = event.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then(s => s.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(audioContextRef.current.destination);
                    },
                    onmessage: (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            setTranscription(prev => prev + message.serverContent.inputTranscription.text);
                        }
                    },
                    onerror: (e) => { setError("A transcription error occurred."); stopTranscription(); },
                    onclose: () => { setIsTranscribing(false); }
                }
            });

        } catch (err) {
            setError("Could not access microphone.");
            setIsTranscribing(false);
        }
    };

    return (
         <div>
            <h2 className="text-2xl font-bold text-gold mb-4">Live Transcriber</h2>
            <p className="text-gray-400 mb-6">Click start and begin speaking. Your words will be transcribed in real-time.</p>
            <div className="w-full h-48 bg-slate-700 p-3 rounded-lg border border-slate-600 overflow-y-auto">
                {transcription || <span className="text-gray-500">Waiting for audio...</span>}
            </div>
             <button 
                onClick={isTranscribing ? stopTranscription : startTranscription}
                className={`mt-4 w-full font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 ${isTranscribing ? 'bg-red-600 text-white' : 'bg-gold text-midnight-blue'}`}
            >
                {isTranscribing ? <><MicOff/><span>Stop Transcribing</span></> : <><Mic/><span>Start Transcribing</span></>}
            </button>
            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
        </div>
    );
};


const AudioToolsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('tts');
     const tabClasses = (tabName: string) => 
        `px-6 py-3 font-semibold rounded-t-lg transition-colors ${activeTab === tabName ? 'bg-slate-800 text-gold' : 'bg-slate-900 text-soft-white hover:bg-slate-700'}`;

    return (
        <div className="container mx-auto px-6 py-12 flex flex-col items-center">
            <h1 className="text-4xl font-bold mb-8 text-center">Audio Tools</h1>
            <div className="w-full max-w-2xl">
                <div className="flex border-b border-slate-700 mb-0">
                    <button onClick={() => setActiveTab('tts')} className={tabClasses('tts')}>Text-to-Speech</button>
                    <button onClick={() => setActiveTab('transcriber')} className={tabClasses('transcriber')}>Transcriber</button>
                </div>
                <Card className="w-full rounded-t-none">
                    {activeTab === 'tts' && <TextToSpeech />}
                    {activeTab === 'transcriber' && <AudioTranscriber />}
                </Card>
            </div>
        </div>
    );
};

export default AudioToolsPage;