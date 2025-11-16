
import React, { useState, useCallback } from 'react';
import { generateQuizQuestions } from '../services/geminiService';
import { Question } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/Card';
import { updateStreak } from '../utils/gamification';

type QuizMode = 'test' | 'practice';

const QuizPage: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [mode, setMode] = useState<QuizMode>('practice');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Quiz state
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
    const [score, setScore] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);

    const startQuiz = useCallback(async () => {
        if (!topic.trim()) {
            setError("Please enter a topic.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setQuestions([]);
        setUserAnswers([]);
        setScore(null);
        setCurrentQuestionIndex(0);
        setFeedback(null);
        try {
            const data = await generateQuizQuestions(topic, 10);
            if (data.questions && data.questions.length > 0) {
                setQuestions(data.questions);
                setUserAnswers(new Array(data.questions.length).fill(null));
            } else {
                setError("Could not generate quiz questions for this topic. Please try another one.");
            }
        } catch (err) {
            setError("An error occurred while fetching the quiz. Please check your API key and try again.");
        } finally {
            setIsLoading(false);
        }
    }, [topic]);

    const handleAnswer = (answer: string) => {
        if (score !== null) return; // Quiz is finished

        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = answer;
        setUserAnswers(newAnswers);

        if (mode === 'practice') {
            if (answer === questions[currentQuestionIndex].correctAnswer) {
                setFeedback("Correct! Well done.");
            } else {
                setFeedback(`Not quite. The correct answer is: ${questions[currentQuestionIndex].correctAnswer}`);
            }
        }
    };
    
    const nextQuestion = () => {
        setFeedback(null);
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    }
    
    const finishQuiz = () => {
        let calculatedScore = 0;
        questions.forEach((q, index) => {
            if (q.correctAnswer === userAnswers[index]) {
                calculatedScore++;
            }
        });
        setScore(calculatedScore);
        updateStreak();
    }

    const resetQuiz = () => {
        setQuestions([]);
        setScore(null);
        setTopic('');
    };

    if (isLoading) return <div className="container mx-auto px-6 py-12"><LoadingSpinner message="Generating your quiz..." /></div>;
    if (error) return <div className="container mx-auto px-6 py-12 text-center text-red-400"><p>{error}</p><button onClick={() => setError(null)} className="mt-4 bg-gold text-midnight-blue font-bold py-2 px-6 rounded-lg">Try Again</button></div>;

    if (questions.length === 0) {
        return (
            <div className="container mx-auto px-6 py-12 flex flex-col items-center">
                <h1 className="text-4xl font-bold mb-8 text-center">AI Quiz Master</h1>
                <Card className="w-full max-w-lg text-center">
                    <label htmlFor="topic" className="block text-lg font-semibold mb-2">What do you want to be quizzed on?</label>
                    <input
                        id="topic"
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., 'Photosynthesis' or 'Roman History'"
                        className="w-full bg-slate-700 text-soft-white p-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-gold focus:outline-none"
                    />
                    <div className="my-6">
                        <p className="font-semibold mb-2">Select Mode:</p>
                        <div className="flex justify-center space-x-4">
                            <button onClick={() => setMode('practice')} className={`py-2 px-6 rounded-lg ${mode === 'practice' ? 'bg-royal-purple text-white' : 'bg-slate-700'}`}>Practice</button>
                            <button onClick={() => setMode('test')} className={`py-2 px-6 rounded-lg ${mode === 'test' ? 'bg-royal-purple text-white' : 'bg-slate-700'}`}>Test</button>
                        </div>
                    </div>
                    <button onClick={startQuiz} className="bg-gold text-midnight-blue font-bold py-3 px-8 rounded-lg text-lg hover:bg-yellow-300 transition-colors">Generate Quiz</button>
                </Card>
            </div>
        );
    }

    if (score !== null) {
        return (
             <div className="container mx-auto px-6 py-12 flex flex-col items-center">
                 <h1 className="text-4xl font-bold mb-8 text-center">Quiz Results for "{topic}"</h1>
                 <Card className="w-full max-w-lg text-center">
                    <h2 className="text-3xl font-bold text-gold mb-4">Test Complete!</h2>
                    <p className="text-2xl mb-8">Your Score: <span className="font-bold text-white">{score} / {questions.length}</span></p>
                    <button onClick={resetQuiz} className="bg-gold text-midnight-blue font-bold py-3 px-8 rounded-lg text-lg hover:bg-yellow-300 transition-colors">Take a New Quiz</button>
                 </Card>
             </div>
        )
    }

    const question = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    
    return (
        <div className="container mx-auto px-6 py-12">
            <h1 className="text-3xl font-bold mb-6 text-center">Quiz on: <span className="text-gold">{topic}</span></h1>
            <Card className="w-full max-w-4xl mx-auto">
                <p className="text-sm text-gray-400 mb-2">Question {currentQuestionIndex + 1} of {questions.length}</p>
                <h2 className="text-2xl font-semibold mb-6">{question.questionText}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {question.options.map((option, index) => {
                        let buttonClass = "w-full text-left bg-slate-700 p-4 rounded-lg hover:bg-royal-purple transition-colors duration-200";
                        if (userAnswers[currentQuestionIndex] === option) {
                            buttonClass = "w-full text-left bg-royal-purple text-white p-4 rounded-lg";
                        }
                        if (feedback && option === question.correctAnswer) {
                            buttonClass = "w-full text-left bg-green-600 text-white p-4 rounded-lg";
                        }
                        return (
                            <button key={index} onClick={() => handleAnswer(option)} disabled={!!feedback || !!userAnswers[currentQuestionIndex] && mode === 'test'} className={buttonClass}>
                                {option}
                            </button>
                        );
                    })}
                </div>
                {feedback && (
                    <div className={`mt-6 p-4 rounded-lg ${feedback.startsWith('Correct') ? 'bg-green-800/50 text-green-300' : 'bg-red-800/50 text-red-300'}`}>
                        <p>{feedback}</p>
                    </div>
                )}
                 <div className="mt-8 flex justify-end">
                    {mode === 'practice' && feedback && !isLastQuestion && <button onClick={nextQuestion} className="bg-gold text-midnight-blue font-bold py-2 px-6 rounded-lg">Next Question</button>}
                    {(mode === 'test' || (mode === 'practice' && feedback && isLastQuestion)) && <button onClick={finishQuiz} className="bg-gold text-midnight-blue font-bold py-2 px-6 rounded-lg">Finish Quiz</button>}
                </div>
            </Card>
        </div>
    );
};

export default QuizPage;
