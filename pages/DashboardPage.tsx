
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, BrainCircuit, PenSquare, Clapperboard, Image, Mic, BarChart3, BookOpen, Search, Headphones, Award, Trophy, Star, Gamepad2, MessageCircle, MapPin, ScanSearch, Film, BrainCog, Flame } from 'lucide-react';
import Card from '../components/Card';
import { getXp, getStreak } from '../utils/gamification';

interface Tool {
    name: string;
    description: string;
    path: string;
    icon: React.ReactNode;
    color: string;
}

const tools: Tool[] = [
    { name: 'Initial Assessment', description: 'Test your knowledge to find your starting point.', path: '/assessment', icon: <Zap />, color: 'text-gold' },
    { name: 'AI Quiz Master', description: 'Generate and take quizzes on any topic.', path: '/quiz', icon: <BookOpen />, color: 'text-blue-accent' },
    { name: 'AI Chatbot', description: 'Get quick answers from a conversational AI.', path: '/chatbot', icon: <MessageCircle />, color: 'text-green-400' },
    { name: 'Mind Map Generator', description: 'Visualize complex ideas and connect concepts.', path: '/mindmap', icon: <BrainCircuit />, color: 'text-teal-accent' },
    { name: 'Game Zone', description: 'Play fun games to sharpen your skills.', path: '/gamezone', icon: <Gamepad2 />, color: 'text-pink-accent' },
    { name: 'Leaderboard', description: 'See how you rank against other learners.', path: '/leaderboard', icon: <Trophy />, color: 'text-gold' },
    { name: 'Learning Journal', description: 'Reflect on your progress and solidify knowledge.', path: '/journal', icon: <PenSquare />, color: 'text-pink-accent' },
    { name: 'Image Tools', description: 'Generate or edit visuals for your study materials.', path: '/image', icon: <Image />, color: 'text-green-400' },
    { name: 'Audio Tools', description: 'Turn notes into audio or transcribe speech.', path: '/audio', icon: <Mic />, color: 'text-purple-400' },
    { name: 'Video Tools', description: 'Summarize videos or create your own.', path: '/video', icon: <Clapperboard />, color: 'text-red-400' },
    { name: 'AI Research Agent', description: 'Get answers from real-time Google Search results.', path: '/research', icon: <Search />, color: 'text-orange-400' },
    { name: 'Location Scout', description: 'Find places and get info with Google Maps data.', path: '/location-scout', icon: <MapPin />, color: 'text-red-400' },
    { name: 'Image Analyzer', description: 'Upload an image to understand its content.', path: '/image-analysis', icon: <ScanSearch />, color: 'text-teal-accent'},
    { name: 'Video Analyzer', description: 'Analyze short video clips for key information.', path: '/video-analysis', icon: <Film />, color: 'text-blue-accent'},
    { name: 'Complex Problem Solver', description: 'Use advanced AI reasoning for tough questions.', path: '/complex-solver', icon: <BrainCog />, color: 'text-gold' },
    { name: 'AI Conversational Tutor', description: 'Practice concepts by talking with an AI tutor.', path: '/tutor', icon: <Headphones />, color: 'text-indigo-400' },
];

const ToolCard: React.FC<{ tool: Tool }> = ({ tool }) => (
    <Link to={tool.path}>
        <Card className="h-full flex flex-col group">
            <div className={`mb-4 ${tool.color}`}>{React.cloneElement(tool.icon as React.ReactElement, { size: 40 })}</div>
            <h3 className="text-xl font-bold text-soft-white mb-2 group-hover:text-gold transition-colors">{tool.name}</h3>
            <p className="text-gray-400 flex-grow">{tool.description}</p>
        </Card>
    </Link>
);

const Badge: React.FC<{ icon: React.ReactNode, name: string }> = ({ icon, name }) => (
    <div className="flex flex-col items-center text-center space-y-2 p-4 bg-slate-700 rounded-lg">
        <div className="text-gold">{icon}</div>
        <span className="font-semibold text-sm">{name}</span>
    </div>
);


const DashboardPage: React.FC = () => {
    const [xp, setXp] = useState(0);
    const [streak, setStreak] = useState(0);

    useEffect(() => {
        const updateStats = () => {
            setXp(getXp());
            setStreak(getStreak().streak);
        };
        updateStats();
        
        // Listen for storage changes to update stats if changed in another tab/component
        window.addEventListener('storage', updateStats);
        return () => {
            window.removeEventListener('storage', updateStats);
        };
    }, []);

    const XP_PER_LEVEL = 250;
    const level = Math.floor(xp / XP_PER_LEVEL) + 1;
    const xpInCurrentLevel = xp % XP_PER_LEVEL;
    const progressPercentage = (xpInCurrentLevel / XP_PER_LEVEL) * 100;

    return (
        <div className="container mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold text-gold mb-2">Welcome Back, Learner!</h1>
            <p className="text-gray-400 mb-12">Your journey to mastery continues here. Choose a tool to get started.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {tools.sort((a,b) => a.name.localeCompare(b.name)).map(tool => (
                    <ToolCard key={tool.name} tool={tool} />
                ))}
            </div>

             <div className="mt-16">
                <h2 className="text-3xl font-bold text-gold mb-6">Your Gamified Stats</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card>
                         <h3 className="text-xl font-bold mb-2">Daily Streak</h3>
                         <div className="flex items-center space-x-3">
                             <Flame size={40} className={` ${streak > 0 ? 'text-orange-500' : 'text-slate-500'}`}/>
                             <p className="text-4xl font-bold text-gold">{streak} {streak === 1 ? 'Day' : 'Days'}</p>
                         </div>
                         <p className="text-gray-400 mt-2">{streak > 0 ? "Keep the flame alive!" : "Complete an activity to start a streak!"}</p>
                    </Card>
                    <Card>
                        <h3 className="text-xl font-bold mb-2">Experience Points</h3>
                        <p className="text-4xl font-bold text-gold">{xp} XP</p>
                        <p className="text-gray-400 mt-2">Level {level}</p>
                        <div className="w-full bg-slate-700 rounded-full h-2.5 mt-3" title={`${xpInCurrentLevel} / ${XP_PER_LEVEL} XP to next level`}>
                            <div className="bg-gold h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                    </Card>
                    <Card>
                        <h3 className="text-xl font-bold mb-4">Badges Earned</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Badge icon={<Trophy size={32} />} name="Quiz Master" />
                            <Badge icon={<Star size={32} />} name="First Journal" />
                            <Badge icon={<Award size={32} />} name="Mind Mapper" />
                            <Badge icon={<Zap size={32} />} name="Quick Learner" />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
