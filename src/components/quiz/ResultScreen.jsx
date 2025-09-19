// src/components/quiz/ResultScreen.jsx
import React, { useMemo } from 'react';

const ResultScreen = ({ settings, userAnswers, initialQuestionCount, sessionCorrectCount, encouragementMessages, startQuiz, backToCategory, selectedCategory, isReviewMode, softKey }) => {
    const correctCount = sessionCorrectCount;
    const totalQuestions = initialQuestionCount;
    const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions * 100).toFixed(0) : 0;
    
    const { message, emoji } = useMemo(() => {
        if (accuracy == 100) return { message: "完璧", emoji: "🎉" };
        if (accuracy >= 80) return { message: "素晴らしい", emoji: "👍" };
        if (accuracy >= 50) return { message: "いい調子", emoji: "😊" };
        return { message: "ファイト", emoji: "🔥" };
    }, [accuracy]);

    const randomMessage = useMemo(() => encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)], [encouragementMessages]);
    const mistakes = useMemo(() => userAnswers.filter(answer => !answer.isCorrect), [userAnswers]);
    
    const handleMistakeReview = () => {
        if (mistakes.length === 0) {
            alert("間違った問題はありません。完璧です！");
            return;
        }
        startQuiz(null, null, mistakes);
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-lg flex-grow flex flex-col items-center justify-center text-center my-2">
                <h1 className="font-extrabold text-4xl text-gray-800 mb-2">{message} {accuracy == 100 ? <span className="animate-celebrate inline-block">{emoji}</span> : emoji}</h1>
                <p className="font-bold text-gray-800">
                    <span className="text-5xl text-blue-600">{correctCount} / {totalQuestions} 問</span>
                    <span className="text-3xl text-gray-600 ml-2">正解</span>
                </p>
                <p className="text-gray-600 mt-2 font-semibold">
                    (初回正答率: {accuracy}%)
                </p>
                <div className="bg-yellow-100 p-4 rounded-lg shadow my-4 w-full text-center">
                    <p className="font-bold text-xl text-gray-800">{randomMessage}</p>
                </div>
            </div>
            <div className="w-full space-y-2.5 flex-shrink-0">
                <button
                    onClick={handleMistakeReview}
                    className={`w-full font-bold text-xl h-16 rounded-lg shadow-md flex items-center justify-center ${mistakes.length > 0 ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    disabled={mistakes.length === 0}
                >
                    間違った問題やり直し ({mistakes.length}問)
                </button>
                <div className="flex space-x-2.5">
                    <button onClick={() => startQuiz(selectedCategory.cat1, selectedCategory.cat2)} className="w-1/2 font-bold text-xl h-16 rounded-lg shadow-md bg-blue-500 text-white flex items-center justify-center">
                        もう一度
                    </button>
                    <button onClick={backToCategory} className="w-1/2 font-bold text-xl h-16 rounded-lg shadow-md bg-gray-500 text-white flex items-center justify-center">
                        範囲選択へ
                    </button>
                </div>
            </div>
        </>
    );
};

export default ResultScreen;