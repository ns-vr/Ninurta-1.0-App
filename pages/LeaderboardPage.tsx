
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Star } from 'lucide-react';
import Card from '../components/Card';
import { xpLeaderboard, quizLeaderboard } from '../utils/leaderboardData';

interface LeaderboardEntry {
    rank: number;
    name: string;
    score: number;
    isUser?: boolean;
}

const LeaderboardTable: React.FC<{ title: string; data: LeaderboardEntry[]; unit: string; icon: React.ReactNode }> = ({ title, data, unit, icon }) => (
    <Card>
        <h2 className="text-2xl font-bold text-gold mb-4 flex items-center">
            {icon}
            <span className="ml-2">{title}</span>
        </h2>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-slate-600">
                        <th className="p-3">Rank</th>
                        <th className="p-3">Learner</th>
                        <th className="p-3 text-right">Score</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((entry) => (
                        <tr key={entry.rank} className={`border-b border-slate-700 last:border-b-0 ${entry.isUser ? 'bg-royal-purple/30' : ''}`}>
                            <td className="p-3 font-bold text-lg">
                                {entry.rank === 1 && '🥇'}
                                {entry.rank === 2 && '🥈'}
                                {entry.rank === 3 && '🥉'}
                                {entry.rank > 3 && `#${entry.rank}`}
                            </td>
                            <td className="p-3 font-semibold">{entry.name} {entry.isUser && '(You)'}</td>
                            <td className="p-3 text-right font-bold text-gold">{entry.score.toLocaleString()} {unit}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
);

const LeaderboardPage: React.FC = () => {
    return (
        <div className="container mx-auto px-6 py-12">
            <Link to="/dashboard" className="mb-8 inline-flex items-center space-x-2 text-gold hover:text-yellow-300">
                <ArrowLeft />
                <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-4xl font-bold mb-8 text-center">Leaderboards</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <LeaderboardTable 
                    title="Top XP Earners" 
                    data={xpLeaderboard} 
                    unit="XP" 
                    icon={<Trophy className="text-yellow-400" />} 
                />
                <LeaderboardTable 
                    title="Quiz High Scores" 
                    data={quizLeaderboard} 
                    unit="Pts" 
                    icon={<Star className="text-blue-400" />}
                />
            </div>
        </div>
    );
};

export default LeaderboardPage;
