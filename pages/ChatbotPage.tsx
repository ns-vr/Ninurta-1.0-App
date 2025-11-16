import React, { useState, useEffect, useRef } from 'react';
import { startChat } from '../services/geminiService';
import { Chat } from '@google/genai';
import { ChatMessage } from '../types';
import Card from '../components/Card';
import { Send, Bot, User, Trash2 } from 'lucide-react';

const CHAT_HISTORY_KEY = 'ninurta-chat-history';

const ChatbotPage: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load chat history from localStorage on initial render
    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
            if (savedHistory) {
                const parsedHistory = JSON.parse(savedHistory);
                if (Array.isArray(parsedHistory)) {
                    setMessages(parsedHistory);
                }
            }
        } catch (error) {
            console.error("Failed to load chat history from localStorage:", error);
            localStorage.removeItem(CHAT_HISTORY_KEY); // Clear corrupted data
        }
        setChat(startChat('gemini-2.5-flash-lite'));
    }, []);
    
    // Save chat history to localStorage whenever messages change
    useEffect(() => {
        // Don't save the initial empty array.
        if (messages.length > 0) {
            try {
                localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
            } catch (error) {
                console.error("Failed to save chat history to localStorage:", error);
            }
        }
    }, [messages]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !chat || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const responseStream = await chat.sendMessageStream({ message: input });
            let modelResponse = '';
            let firstChunkProcessed = false;
            
            for await (const chunk of responseStream) {
                modelResponse += chunk.text;
                if (!firstChunkProcessed) {
                    // First chunk arrived, replace the loading indicator with a new message
                    setMessages(prev => [...prev, { role: 'model', text: modelResponse }]);
                    firstChunkProcessed = true;
                } else {
                    // Subsequent chunks, update the last message
                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1].text = modelResponse;
                        return newMessages;
                    });
                }
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClearChat = () => {
        setMessages([]);
        localStorage.removeItem(CHAT_HISTORY_KEY);
        setChat(startChat('gemini-2.5-flash-lite')); // Reset chat session
    };
    
    return (
        <div className="container mx-auto px-6 py-12 flex flex-col items-center">
             <div className="w-full max-w-2xl flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">AI Chatbot</h1>
                <button 
                    onClick={handleClearChat} 
                    className="flex items-center space-x-2 text-gray-400 hover:text-gold transition-colors"
                    title="Clear chat history"
                    aria-label="Clear chat history"
                >
                    <Trash2 size={20} />
                    <span>Clear</span>
                </button>
            </div>
            <Card className="w-full max-w-2xl h-[70vh] flex flex-col">
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                         <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                           {msg.role === 'model' && <div className="p-2 bg-blue-accent rounded-full text-white flex-shrink-0"><Bot size={20}/></div>}
                           <div className={`max-w-md p-3 rounded-lg whitespace-pre-wrap ${msg.role === 'user' ? 'bg-royal-purple' : 'bg-slate-700'}`}>
                               <p>{msg.text}</p>
                           </div>
                           {msg.role === 'user' && <div className="p-2 bg-gold rounded-full text-midnight-blue flex-shrink-0"><User size={20}/></div>}
                       </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role === 'user' && (
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-accent rounded-full text-white flex-shrink-0"><Bot size={20}/></div>
                            <div className="max-w-md p-3 rounded-lg bg-slate-700">
                                <div className="flex space-x-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-0"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700 flex items-center gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me anything..."
                        className="flex-grow bg-slate-700 text-soft-white p-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-gold focus:outline-none"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !input.trim()} className="bg-gold text-midnight-blue p-3 rounded-full hover:bg-yellow-300 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                        <Send size={24} />
                    </button>
                </form>
            </Card>
        </div>
    );
};

export default ChatbotPage;
