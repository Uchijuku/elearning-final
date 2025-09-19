// src/components/quiz/QuestionScreen.jsx
import React, { useMemo } from 'react';
import LoadingScreen from './LoadingScreen.jsx';

const QuestionScreen = ({ settings, quizQuestions, initialQuestionCount, handleAnswer, isReviewMode, softKey, questionStats, shuffleArray }) => {
    const currentQuestion = quizQuestions[0];
    if (!currentQuestion) return <LoadingScreen text="準備中..." />;
    
    const options = useMemo(() => shuffleArray(
        [currentQuestion.correctAnswer, currentQuestion.option2, currentQuestion.option3, currentQuestion.option4].filter(Boolean)
    ), [currentQuestion, shuffleArray]);
    
    const questionsAnswered = initialQuestionCount - quizQuestions.length;
    const progressPercentage = initialQuestionCount > 0 ? (questionsAnswered / initialQuestionCount) * 100 : 0;
    const stats = questionStats[currentQuestion.questionId] || { correct: 0, incorrect: 0 };
    
    return (
        <>
            <div className="w-full bg-gray-300 rounded-full h-5 flex-shrink-0 relative mb-2">
                <div className="bg-blue-400 h-full rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                <div className="absolute inset-0 flex justify-center items-center">
                    <span className="text-black font-bold text-xs">{questionsAnswered + 1} / {initialQuestionCount} 問</span>
                </div>
            </div>
            <div className={`bg-white rounded-xl shadow-lg p-4 flex-grow flex items-center justify-center relative`}>
                <div className="absolute top-2 left-3 text-sm text-gray-400 font-bold">
                    <span className="text-green-500">◯{stats.correct}</span>
                    <span className="ml-2 text-red-500">×{stats.incorrect}</span>
                </div>
                {settings.questionFormat === 'left_with_number' ? (
                    <div className="w-full">
                        <p className="font-bold text-center text-lg mb-2 text-gray-600">
                            問題{parseInt(currentQuestion.questionId.split('-')[1] || '', 10)}
                        </p>
                        <p className="font-bold text-left text-2xl">
                            {currentQuestion.questionText}
                        </p>
                    </div>
                ) : (
                    <h2 className={`text-gray-800 font-bold w-full text-2xl ${settings.questionFormat === 'center' ? 'text-center' : 'text-left'}`}>
                        {currentQuestion.questionText}
                    </h2>
                )}
            </div>
            <div className="space-y-2.5 flex-shrink-0 mt-2">
                {options.map(option => (
                    <button key={option} onClick={() => handleAnswer(option)} className="w-full font-bold h-16 rounded-lg shadow-md border-2 flex items-center justify-center p-2 bg-white text-gray-800 border-gray-200">
                       <span className="text-xl leading-tight">{option}</span>
                    </button>
                ))}
            </div>
        </>
    );
};

export default QuestionScreen;