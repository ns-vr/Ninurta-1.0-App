
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, LiveSession } from '@google/genai';
import { decode, decodeAudioData, createBlob } from '../utils/audioUtils';
import Card from '../components/Card';
import { Mic, MicOff, Bot } from 'lucide-react';

type SessionStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR";

interface Transcription {
    author: 'You' | 'Tutor';
    text: string;
}

const ConversationalTutorPage: React.FC = () => {
    const [status, setStatus] = useState<SessionStatus>("DISCONNECTED");
    const [error, setError] = useState<string | null>(null);
    const [transcriptionHistory, setTranscriptionHistory] = useState<Transcription[]>([]);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');

    const stopSession = useCallback(() => {
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
        if (inputAudioContextRef.current) {
            inputAudioContextRef.current.close();
            inputAudioContextRef.current = null;
        }
        
        for (const source of sourcesRef.current.values()) {
            source.stop();
        }
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;

        setStatus("DISCONNECTED");
        console.log("Session stopped and resources cleaned up.");
    }, []);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopSession();
        };
    }, [stopSession]);


    const startSession = async () => {
        if (status === "CONNECTED" || status === "CONNECTING") return;
        
        setStatus("CONNECTING");
        setError(null);
        setTranscriptionHistory([]);
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextStartTimeRef.current = 0;
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: 'You are a friendly and helpful tutor. Keep your answers concise and conversational.',
                },
                callbacks: {
                    onopen: () => {
                        setStatus("CONNECTED");
                        if (!inputAudioContextRef.current || !mediaStreamRef.current) return;
                        const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle Transcription
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent?.inputTranscription) {
                           currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputTranscriptionRef.current.trim();
                            const fullOutput = currentOutputTranscriptionRef.current.trim();
                             setTranscriptionHistory(prev => {
                                const newHistory = [...prev];
                                if(fullInput) newHistory.push({ author: 'You', text: fullInput });
                                if(fullOutput) newHistory.push({ author: 'Tutor', text: fullOutput });
                                return newHistory;
                            });
                            currentInputTranscriptionRef.current = '';
                            currentOutputTranscriptionRef.current = '';
                        }
                        
                        // Handle Audio
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            const audioContext = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
                            const source = audioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(audioContext.destination);
                            source.addEventListener('ended', () => sourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                         if (message.serverContent?.interrupted) {
                            for (const source of sourcesRef.current.values()) {
                                source.stop();
                            }
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error("Session error:", e);
                        setError("A session error occurred. The connection may have been lost.");
                        setStatus("ERROR");
                        stopSession();
                    },
                    onclose: (e: CloseEvent) => {
                         console.log("Session closed.");
                         setStatus("DISCONNECTED");
                    },
                }
            });

        } catch (err: any) {
            console.error("Failed to start session:", err);
            setError(err.message.includes("Permission denied")
                ? "Microphone permission is required to start the tutor."
                : "Failed to initialize the session. Please check your setup and API key.");
            setStatus("ERROR");
            stopSession();
        }
    };
    
    const getStatusIndicator = () => {
        switch (status) {
            case 'CONNECTED': return <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>;
            case 'CONNECTING': return <div className="w-4 h-4 rounded-full bg-yellow-500 animate-spin"></div>;
            case 'ERROR': return <div className="w-4 h-4 rounded-full bg-red-500"></div>;
            default: return <div className="w-4 h-4 rounded-full bg-gray-500"></div>;
        }
    };
    

    return (
        <div className="container mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold mb-8 text-center">AI Conversational Tutor</h1>
            <Card className="w-full max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gold">Live Session</h2>
                    <div className="flex items-center space-x-3">
                       {getStatusIndicator()}
                       <span className="font-semibold">{status}</span>
                    </div>
                </div>
                 {error && <p className="text-red-400 mb-4 text-center">{error}</p>}

                <div className="bg-slate-900 rounded-lg p-4 h-80 overflow-y-auto mb-6 flex flex-col space-y-4">
                   {transcriptionHistory.length > 0 ? transcriptionHistory.map((item, index) => (
                       <div key={index} className={`flex items-start gap-3 ${item.author === 'You' ? 'justify-end' : ''}`}>
                           {item.author === 'Tutor' && <Bot className="text-blue-accent flex-shrink-0 mt-1" />}
                           <div className={`max-w-md p-3 rounded-lg ${item.author === 'You' ? 'bg-royal-purple' : 'bg-slate-700'}`}>
                               <p>{item.text}</p>
                           </div>
                           {item.author === 'You' && <Mic className="text-gold flex-shrink-0 mt-1" />}
                       </div>
                   )) : <p className="text-gray-500 text-center self-center">Start the session and begin speaking to your AI tutor.</p>}
                </div>

                <div className="flex justify-center">
                    {status !== 'CONNECTED' && status !== 'CONNECTING' ? (
                        <button onClick={startSession} className="flex items-center space-x-2 bg-gold text-midnight-blue font-bold py-3 px-8 rounded-full text-lg hover:bg-yellow-300 transition-colors">
                            <Mic size={24} />
                            <span>Start Session</span>
                        </button>
                    ) : (
                        <button onClick={stopSession} className="flex items-center space-x-2 bg-red-600 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-red-500 transition-colors">
                             <MicOff size={24} />
                            <span>Stop Session</span>
                        </button>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default ConversationalTutorPage;
