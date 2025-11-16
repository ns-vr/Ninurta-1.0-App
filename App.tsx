
import React from 'react';
import { HashRouter, Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import { Home, Zap, LayoutDashboard } from 'lucide-react';

// Page Components
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import AssessmentPage from './pages/AssessmentPage';
import QuizPage from './pages/QuizPage';
import MindMapPage from './pages/MindMapPage';
import JournalPage from './pages/JournalPage';
import VideoToolsPage from './pages/VideoToolsPage';
import ImageToolsPage from './pages/ImageToolsPage';
import AudioToolsPage from './pages/AudioToolsPage';
import ResearchAgentPage from './pages/ResearchAgentPage';
import ConversationalTutorPage from './pages/ConversationalTutorPage';
import GameZonePage from './pages/GameZonePage';
import ChatbotPage from './pages/ChatbotPage';
import LocationScoutPage from './pages/LocationScoutPage';
import ImageAnalysisPage from './pages/ImageAnalysisPage';
import ComplexProblemSolverPage from './pages/ComplexProblemSolverPage';
import VideoAnalysisPage from './pages/VideoAnalysisPage';
import LeaderboardPage from './pages/LeaderboardPage';

const Header: React.FC = () => {
    const location = useLocation();
    if (location.pathname === '/') {
        return null; // Don't show header on landing page
    }

    return (
        <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50 shadow-lg shadow-royal-purple/10">
            <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
                <Link to="/dashboard" className="text-2xl font-bold text-gold">NINURTA 1.0</Link>
                <div className="flex items-center space-x-6">
                    <NavLink end to="/" className={({ isActive }) => `flex items-center space-x-2 transition-colors duration-200 ${isActive ? 'text-gold' : 'text-soft-white hover:text-gold'}`}><Home size={20} /><span>Home</span></NavLink>
                    <NavLink to="/dashboard" className={({ isActive }) => `flex items-center space-x-2 transition-colors duration-200 ${isActive ? 'text-gold' : 'text-soft-white hover:text-gold'}`}><LayoutDashboard size={20} /><span>Dashboard</span></NavLink>
                    <NavLink to="/assessment" className={({ isActive }) => `flex items-center space-x-2 transition-colors duration-200 ${isActive ? 'text-gold' : 'text-soft-white hover:text-gold'}`}><Zap size={20} /><span>Assessment</span></NavLink>
                </div>
            </nav>
        </header>
    );
};

const App: React.FC = () => {
    return (
        <HashRouter>
            <div className="min-h-screen bg-midnight-blue">
                <Header />
                <main>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/assessment" element={<AssessmentPage />} />
                        <Route path="/quiz" element={<QuizPage />} />
                        <Route path="/mindmap" element={<MindMapPage />} />
                        <Route path="/journal" element={<JournalPage />} />
                        <Route path="/video" element={<VideoToolsPage />} />
                        <Route path="/image" element={<ImageToolsPage />} />
                        <Route path="/audio" element={<AudioToolsPage />} />
                        <Route path="/research" element={<ResearchAgentPage />} />
                        <Route path="/tutor" element={<ConversationalTutorPage />} />
                        <Route path="/gamezone" element={<GameZonePage />} />
                        <Route path="/chatbot" element={<ChatbotPage />} />
                        <Route path="/location-scout" element={<LocationScoutPage />} />
                        <Route path="/image-analysis" element={<ImageAnalysisPage />} />
                        <Route path="/complex-solver" element={<ComplexProblemSolverPage />} />
                        <Route path="/video-analysis" element={<VideoAnalysisPage />} />
                        <Route path="/leaderboard" element={<LeaderboardPage />} />
                    </Routes>
                </main>
            </div>
        </HashRouter>
    );
};

export default App;
