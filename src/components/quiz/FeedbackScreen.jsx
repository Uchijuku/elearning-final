// src/components/quiz/FeedbackScreen.jsx
import React, { useState, useEffect, useMemo } from 'react';

const FeedbackScreen = ({ settings, userAnswers, encouragementMessages, goToNext, backToCategory, isReviewMode, softKey, user, db, doc, setDoc, serverTimestamp, getDoc, updateDoc }) => {
    const lastAnswer = userAnswers[userAnswers.length - 1];
    const randomMessage = useMemo(() => encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)], [encouragementMessages]);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isBookmarkLoading, setIsBookmarkLoading] = useState(true);
    const questionId = lastAnswer.questionId;
    const userId = user.uid;

    useEffect(() => {
        const fetchBookmarkStatus = async () => {
            if (!userId || !questionId) return;
            setIsBookmarkLoading(true);
            try {
                const statusDocRef = doc(db, "userQuestionStatus", `${userId}_${questionId}`);
                const docSnap = await getDoc(statusDocRef);
                if (docSnap.exists()) {
                    setIsBookmarked(!!docSnap.data().isBookmarked);
                } else {
                    setIsBookmarked(false);
                }
            } catch (error) {
                console.error("苦手状態の取得エラー:", error);
                setIsBookmarked(false);
            }
            setIsBookmarkLoading(false);
        };
        fetchBookmarkStatus();
    }, [userId, questionId, db]);

    const handleBookmarkToggle = async () => {
        if (isBookmarkLoading) return;
        const newBookmarkState = !isBookmarked;
        setIsBookmarked(newBookmarkState);
        try {
            const statusDocRef = doc(db, "userQuestionStatus", `${userId}_${questionId}`);
            await setDoc(statusDocRef, {
                userId, questionId, subject: lastAnswer.subject,
                isBookmarked: newBookmarkState, lastUpdated: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("苦手状態の保存エラー:", error);
            setIsBookmarked(!newBookmarkState);
        }
    };

    return (
        <div className={`flex-grow flex flex-col`}>
            <div className={`flex-grow flex flex-col items-center justify-center text-center my-2 rounded-xl`}>
                <h1 className={`font-bold ${lastAnswer.isCorrect ? 'text-green-500 animate-celebrate text-7xl' : 'text-blue-500 text-5xl'}`}>
                    {lastAnswer.isCorrect ? '正解' : 'ナイス ファイト！'}
                </h1>
            </div>
            <div className="flex justify-end mb-2 px-1">
                <label className="flex items-center space-x-2 cursor-pointer p-1 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors border border-gray-200">
                    <input type="checkbox" className="form-checkbox h-5 w-5 text-red-500 rounded-full focus:ring-red-400 border-gray-300" checked={isBookmarked} onChange={handleBookmarkToggle} disabled={isBookmarkLoading} />
                    <span className={`text-sm font-bold pr-2 ${isBookmarked ? 'text-red-500' : 'text-gray-500'}`}>
                        {isBookmarkLoading ? '...' : '苦手'}
                    </span>
                </label>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg shadow my-2 w-full text-center flex-shrink-0">
                <p className="font-bold text-xl text-gray-800">{randomMessage}</p>
            </div>
            <div className={`bg-white p-3 rounded-lg w-full mb-2 text-left space-y-1 shadow flex-shrink-0 relative ${settings?.useExplanation ? 'max-h-32 overflow-y-auto' : ''}`}>
                <p className="font-bold text-gray-800">{lastAnswer.questionText}</p>
                <p className="font-bold text-2xl text-red-500">{lastAnswer.correctAnswer}</p>
                {!lastAnswer.isCorrect && <p className="text-md text-gray-500">あなたの解答: {lastAnswer.userAnswer}</p>}
                {settings?.useExplanation && lastAnswer.explanation && <p className="text-sm text-gray-600 mt-2">【解説】 {lastAnswer.explanation}</p>}
            </div>
            <div className="space-y-2.5 flex-shrink-0">
                <button onClick={goToNext} className="w-full font-bold text-xl h-16 rounded-lg shadow-md bg-green-500 text-white flex items-center justify-center">次へ</button>
            </div>
        </div>
    );
};

export default FeedbackScreen;