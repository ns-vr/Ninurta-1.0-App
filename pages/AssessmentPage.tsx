
import React, { useState, useCallback } from 'react';
import { generateQuizQuestions } from '../services/geminiService';
import { Question } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/Card';
import { useNavigate } from 'react-router-dom';

const AssessmentPage: React.FC = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<string[]>([]);
    const [score, setScore] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const startAssessment = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setQuestions([]);
        setUserAnswers([]);
        setScore(null);
        setCurrentQuestionIndex(0);
        try {
            const data = await generateQuizQuestions("General Knowledge", 5);
            if (data.questions && data.questions.length > 0) {
                setQuestions(data.questions);
            } else {
                setError("Could not generate assessment questions. Please try again.");
            }
        } catch (err) {
            setError("An error occurred while fetching the assessment. Please check your API key and try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleAnswer = (answer: string) => {
        const newAnswers = [...userAnswers, answer];
        setUserAnswers(newAnswers);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            // End of quiz
            let calculatedScore = 0;
            questions.forEach((q, index) => {
                if (q.correctAnswer === newAnswers[index]) {
                    calculatedScore++;
                }
            });
            setScore(calculatedScore);
        }
    };
    
    const restartAssessment = () => {
        setQuestions([]);
        setScore(null);
    }

    const renderContent = () => {
        if (isLoading) {
            return <LoadingSpinner message="Generating your assessment..." />;
        }
        if (error) {
            return <div className="text-center text-red-400"><p>{error}</p><button onClick={startAssessment} className="mt-4 bg-gold text-midnight-blue font-bold py-2 px-6 rounded-lg hover:bg-yellow-300 transition-colors">Retry</button></div>;
        }
        if (score !== null) {
            return (
                <Card className="text-center">
                    <h2 className="text-3xl font-bold text-gold mb-4">Assessment Complete!</h2>
                    <p className="text-xl mb-6">You scored <span className="font-bold text-soft-white">{score}</span> out of <span className="font-bold text-soft-white">{questions.length}</span>.</p>
                    <p className="text-gray-400 mb-8">This gives us a baseline to personalize your learning path. Let's start building your knowledge!</p>
                    <div className="flex justify-center space-x-4">
                        <button onClick={restartAssessment} className="bg-slate-700 text-soft-white font-bold py-2 px-6 rounded-lg hover:bg-slate-600 transition-colors">Retake Assessment</button>
                        <button onClick={() => navigate('/dashboard')} className="bg-gold text-midnight-blue font-bold py-2 px-6 rounded-lg hover:bg-yellow-300 transition-colors">Go to Dashboard</button>
                    </div>
                </Card>
            );
        }
        if (questions.length > 0) {
            const question = questions[currentQuestionIndex];
            return (
                <Card>
                    <p className="text-sm text-gray-400 mb-2">Question {currentQuestionIndex + 1} of {questions.length}</p>
                    <h2 className="text-2xl font-semibold mb-6">{question.questionText}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {question.options.map((option, index) => (
                            <button key={index} onClick={() => handleAnswer(option)} className="w-full text-left bg-slate-700 p-4 rounded-lg hover:bg-royal-purple transition-colors duration-200">
                                {option}
                            </button>
                        ))}
                    </div>
                </Card>
            );
        }
        return (
            <Card className="text-center">
                <h2 className="text-3xl font-bold text-gold mb-4">Assess Your Knowledge</h2>
                <p className="text-gray-400 mb-8">Take a quick quiz to help us understand your strengths and weaknesses. This allows Ninurta to create a learning plan tailored just for you.</p>
                <button onClick={startAssessment} className="bg-gold text-midnight-blue font-bold py-3 px-8 rounded-lg text-lg hover:bg-yellow-300 transition-colors">
                    Start Assessment
                </button>
            </Card>
        );
    };

    return (
        <div className="container mx-auto px-6 py-12 flex flex-col items-center">
            <h1 className="text-4xl font-bold mb-8">Initial Assessment</h1>
            <div className="w-full max-w-4xl">
                {renderContent()}
            </div>
        </div>
    );
};

export default AssessmentPage;
