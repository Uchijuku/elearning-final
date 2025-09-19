// src/components/quiz/QuizPlayer.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { collection, getDocs, setDoc, doc, serverTimestamp, addDoc, query, where, updateDoc, getDoc } from "firebase/firestore";
import { db } from '../../firebase';
import { quizConfig } from '../../quizConfig';

import CategorySelectionScreen from './CategorySelectionScreen.jsx';
import QuestionScreen from './QuestionScreen.jsx';
import FeedbackScreen from './FeedbackScreen.jsx';
import ResultScreen from './ResultScreen.jsx';
import LoadingScreen from './LoadingScreen.jsx';
import HomeButton from './HomeButton.jsx';

const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const getEmojiForCategory = (categoryName) => {
    if (typeof categoryName !== 'string') return '📚';
    const name = categoryName.toLowerCase();
    if (name.includes('地理') || name.includes('世界')) return '🌍';
    if (name.includes('歴史') || name.includes('時代')) return '📜';
    if (name.includes('公民')) return '🏛️';
    if (name.includes('生物') || name.includes('植物')) return '🌿';
    if (name.includes('化学') || name.includes('原子')) return '🧪';
    if (name.includes('物理') || name.includes('電気') || name.includes('エネルギー')) return '💡';
    if (name.includes('地学') || name.includes('天体') || name.includes('宇宙')) return '🔭';
    if (name.includes('評論')) return '✍️';
    if (name.includes('小説')) return '📖';
    if (name.includes('成語') || name.includes('漢字') || name.includes('語彙')) return '🀄';
    if (name.includes('古文')) return '📜';
    return '📚';
};

const getSortKeyFromQuestion = (q, source) => {
    const categoryName = q[source];
    if (typeof categoryName !== 'string') return 9999;
    const match = categoryName.match(/^(\d+)\./);
    if (match && match[1]) { return parseInt(match[1], 10); }
    if (typeof q.questionId !== 'string') { return 9999; }
    const idParts = q.questionId.split('-');
    if (idParts.length > 1) {
        let major = parseInt(idParts[1], 10) || 0;
        let minor = parseInt(idParts[2], 10) || 0;
        return major * 100 + minor;
    }
    return 9999;
};

const QuizPlayer = ({ user }) => {
    const { softKey } = useParams();
    const [searchParams] = useSearchParams();
    const isReviewMode = searchParams.get('mode') === 'review';
    const settings = useMemo(() => quizConfig[softKey] || null, [softKey]);

    const [page, setPage] = useState('loading');
    const [allQuestions, setAllQuestions] = useState([]);
    const [encouragementMessages, setEncouragementMessages] = useState([]);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [initialQuestionCount, setInitialQuestionCount] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState({ cat1: null, cat2: null });
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [questionStats, setQuestionStats] = useState({});
    const [sessionCorrectCount, setSessionCorrectCount] = useState(0);
    const [answeredInSession, setAnsweredInSession] = useState(new Set());
    const [isMistakeReviewMode, setIsMistakeReviewMode] = useState(false);

    useEffect(() => {
        document.body.style.backgroundColor = isReviewMode ? '#f5f3ff' : '';
        return () => { document.body.style.backgroundColor = ''; };
    }, [isReviewMode]);

    useEffect(() => {
        if (settings) {
            document.title = settings.title.replace('\n', ' ');
        }
    }, [settings]);

    useEffect(() => {
        if (user && settings && allQuestions.length === 0) {
            setPage('data_loading');
            const fetchData = async () => {
                try {
                    let fetchedData;
                    if (isReviewMode) {
                        const statusQuery = query(
                            collection(db, "userQuestionStatus"),
                            where("userId", "==", user.uid),
                            where("isBookmarked", "==", true),
                            where("subject", "==", settings.subject)
                        );
                        const statusSnapshot = await getDocs(statusQuery);
                        const bookmarkedQuestionIds = statusSnapshot.docs.map(d => d.data().questionId);
                        if (bookmarkedQuestionIds.length === 0) {
                            alert("この教科に「苦手」とチェックした問題はありません。");
                            window.location.href = '/';
                            return;
                        }
                        const questionChunks = [];
                        for (let i = 0; i < bookmarkedQuestionIds.length; i += 30) {
                            questionChunks.push(bookmarkedQuestionIds.slice(i, i + 30));
                        }
                        let fetchedQuestions = [];
                        for (const chunk of questionChunks) {
                            if (chunk.length > 0) {
                                const questionsQuery = query(collection(db, "questions"), where("questionId", "in", chunk));
                                const questionsSnapshot = await getDocs(questionsQuery);
                                fetchedQuestions = [...fetchedQuestions, ...questionsSnapshot.docs.map(doc => doc.data())];
                            }
                        }
                        fetchedData = fetchedQuestions;
                    } else {
                        const questionsQuery = query(collection(db, "questions"), where("subject", "==", settings.subject));
                        const questionsSnapshot = await getDocs(questionsQuery);
                        fetchedData = questionsSnapshot.docs.map(doc => doc.data());
                    }
                    
                    const encouragementsSnapshot = await getDocs(collection(db, "encouragements"));
                    setEncouragementMessages(encouragementsSnapshot.docs.map(doc => doc.data().message));
                    setAllQuestions(fetchedData);
                } catch (error) { console.error("データ取得エラー:", error); setPage('error'); }
            };
            fetchData();
        }
    }, [user, settings, isReviewMode, allQuestions.length]);

    useEffect(() => {
        if (allQuestions.length > 0 && page === 'data_loading') {
            if (isReviewMode) {
                startQuiz('すべて');
            } else {
                setPage('category');
            }
        }
    }, [allQuestions, isReviewMode, page]);
    
    const categories1 = useMemo(() => {
        if (!settings || !settings.categorySource || !allQuestions) return [];
        const source = settings.categorySource;
        const categoryMap = new Map();
        allQuestions.forEach(q => {
            const categoryName = q[source];
            if (!categoryName) return;
            const sortKey = getSortKeyFromQuestion(q, source);
            if (!categoryMap.has(categoryName) || sortKey < categoryMap.get(categoryName).sortKey) {
                categoryMap.set(categoryName, { name: categoryName, sortKey: sortKey });
            }
        });
        const sortedCategories = [...categoryMap.values()].sort((a, b) => a.sortKey - b.sortKey);
        return sortedCategories.map(cat => cat.name);
    }, [allQuestions, settings]);

    const categories2 = useMemo(() => {
        if (!selectedCategory.cat1 || !settings || !allQuestions) return [];
        const source = settings.categorySource;
        const subCategorySource = 'category2';
        const filtered = allQuestions.filter(q => q[source] === selectedCategory.cat1);
        const categoryMap = new Map();
        filtered.forEach(q => {
            const categoryName = q[subCategorySource];
            if (!categoryName) return;
            const sortKey = getSortKeyFromQuestion(q, subCategorySource);
            if (!categoryMap.has(categoryName) || sortKey < categoryMap.get(categoryName).sortKey) {
                categoryMap.set(categoryName, { name: categoryName, sortKey: sortKey });
            }
        });
        const sortedCategories = [...categoryMap.values()].sort((a, b) => a.sortKey - b.sortKey);
        return sortedCategories.map(cat => cat.name);
    }, [allQuestions, selectedCategory.cat1, settings]);

    const startQuiz = async (cat1 = null, cat2 = null, questions = null) => {
        let questionsForQuiz = [];
        const source = settings.categorySource;
        const subCategorySource = 'category2';
        if (questions) {
            questionsForQuiz = questions;
            setIsMistakeReviewMode(true);
        } else {
            setIsMistakeReviewMode(false);
            if (allQuestions.length === 0) return;
            if (settings.categoryStyle === 'start_only') {
                questionsForQuiz = allQuestions;
            } else if (cat1 === 'すべて') {
                questionsForQuiz = allQuestions;
            } else if (cat2 === 'すべて') {
                questionsForQuiz = allQuestions.filter(q => q[source] === cat1);
            } else if (cat2) {
                questionsForQuiz = allQuestions.filter(q => q[source] === cat1 && q[subCategorySource] === cat2);
            } else {
                questionsForQuiz = allQuestions.filter(q => q[source] === cat1);
            }
        }
        if(questionsForQuiz.length === 0) {
            alert('この範囲に該当する問題がありません。');
            setIsPopupOpen(false);
            setPage('category');
            return;
        }
        setPage('data_loading');
        if (!isMistakeReviewMode) {
            const questionIds = questionsForQuiz.map(q => q.questionId);
            const stats = {};
            questionIds.forEach(id => { stats[id] = { correct: 0, incorrect: 0 }; });
            try {
                if (questionIds.length > 0) {
                    const chunks = [];
                    for (let i = 0; i < questionIds.length; i += 30) {
                        chunks.push(questionIds.slice(i, i + 30));
                    }
                    for (const chunk of chunks) {
                         if (chunk.length > 0) {
                            const statsQuery = query(collection(db, "studyRecords"), where("userId", "==", user.uid), where("questionId", "in", chunk));
                            const querySnapshot = await getDocs(statsQuery);
                            querySnapshot.forEach(doc => {
                                const record = doc.data();
                                if (stats[record.questionId]) {
                                    if (record.isCorrect) {
                                        stats[record.questionId].correct++;
                                    } else {
                                        stats[record.questionId].incorrect++;
                                    }
                                }
                            });
                        }
                    }
                }
                setQuestionStats(stats);
            } catch (error) {
                console.error("成績データの取得エラー:", error);
                setQuestionStats(stats);
            }
        } else {
            setQuestionStats({});
        }
        const shuffledQuestions = shuffleArray(questionsForQuiz);
        setQuizQuestions(shuffledQuestions);
        setInitialQuestionCount(shuffledQuestions.length);
        setSelectedCategory({ cat1, cat2 });
        setUserAnswers([]);
        if (!isMistakeReviewMode) {
            setSessionCorrectCount(0);
            setAnsweredInSession(new Set());
        }
        setPage('question');
    };

    const handleAnswer = async (answer) => {
        const currentQuestion = quizQuestions[0];
        const isCorrect = answer === currentQuestion.correctAnswer;
        if (!isMistakeReviewMode) {
            const isFirstAttemptInSession = !answeredInSession.has(currentQuestion.questionId);
            if (isCorrect && isFirstAttemptInSession) {
                setSessionCorrectCount(prevCount => prevCount + 1);
            }
            setAnsweredInSession(prevSet => new Set(prevSet).add(currentQuestion.questionId));
        }
        if (!isMistakeReviewMode) {
            addDoc(collection(db, 'studyRecords'), {
                userId: user.uid,
                userName: user.name,
                userEmail: user.email,
                questionId: currentQuestion.questionId,
                subject: settings.subject,
                isCorrect,
                answeredAt: serverTimestamp()
            }).catch(error => console.error("学習記録の保存エラー:", error));
            const statusDocRef = doc(db, "userQuestionStatus", `${user.uid}_${currentQuestion.questionId}`);
            try {
                const docSnap = await getDoc(statusDocRef);
                const dataToSet = {
                    userId: user.uid,
                    questionId: currentQuestion.questionId,
                    subject: settings.subject,
                    isCorrect: isCorrect,
                    lastAnswered: serverTimestamp()
                };
                if (!docSnap.exists()) {
                    dataToSet.isBookmarked = false;
                }
                await setDoc(statusDocRef, dataToSet, { merge: true });
            } catch (error) { console.error("Status update error:", error); }
        }
        setQuestionStats(prevStats => {
            const newStats = { ...prevStats };
            const stat = newStats[currentQuestion.questionId] || { correct: 0, incorrect: 0 };
            if (isCorrect) {
                stat.correct++;
            } else {
                stat.incorrect++;
            }
            newStats[currentQuestion.questionId] = stat;
            return newStats;
        });
        setUserAnswers(prev => [...prev, { ...currentQuestion, userAnswer: answer, isCorrect }]);
        setPage('feedback');
    };

    const goToNext = () => {
        const remainingQuestions = [...quizQuestions];
        remainingQuestions.shift();
        setQuizQuestions(remainingQuestions);
        if (remainingQuestions.length > 0) {
            setPage('question');
        } else {
            if (isMistakeReviewMode) {
                alert("間違った問題のやり直しが終わりました。");
                setIsMistakeReviewMode(false);
                backToCategory();
            } else {
                setPage('result');
            }
        }
    };
    
    const backToCategory = () => {
        setIsPopupOpen(false);
        setPage('category');
        setSelectedCategory({ cat1: null, cat2: null });
    };

    if (!settings) return <LoadingScreen text="設定を読み込み中..." />;
    if (!user) return <div className="p-4 text-center h-screen flex flex-col justify-center"><p className="text-red-500 font-bold mb-4">ログイン情報がありません</p><Link to="/" className="bg-blue-500 text-white font-bold py-2 px-4 rounded-full">ホームへ戻る</Link></div>;
    if (page === 'error') return <div className="p-4 text-center h-screen flex flex-col justify-center"><p className="text-red-500 font-bold mb-4">エラーが発生しました</p><button onClick={() => window.location.reload()} className="bg-gray-500 text-white font-bold py-2 px-4 rounded-full">リロード</button></div>;

    switch (page) {
        case 'category': return (
            <div className="w-full h-screen p-3 pt-0 flex flex-col">
                <HomeButton />
                <CategorySelectionScreen {...{settings, categories1, getEmojiForCategory, startQuiz, setSelectedCategory, selectedCategory, isPopupOpen, setIsPopupOpen, categories2, softKey, isReviewMode}} />
            </div>
        );
        case 'question': return (
            <div className="w-full h-screen p-3 pt-0 flex flex-col">
                <HomeButton />
                <QuestionScreen {...{settings, quizQuestions, initialQuestionCount, handleAnswer, isReviewMode, softKey, questionStats, shuffleArray}} />
            </div>
        );
        case 'feedback': return (
            <div className="w-full h-screen p-3 pt-0 flex flex-col">
                <HomeButton />
                <FeedbackScreen {...{settings, userAnswers, encouragementMessages, goToNext, backToCategory, isReviewMode, softKey, user, db, doc, setDoc, serverTimestamp, getDoc, updateDoc}} />
            </div>
        );
        case 'result': return (
            <div className="w-full h-screen p-3 pt-0 flex flex-col">
                <HomeButton />
                <ResultScreen {...{settings, userAnswers, initialQuestionCount, sessionCorrectCount, encouragementMessages, startQuiz, backToCategory, selectedCategory, isReviewMode, softKey, shuffleArray}} />
            </div>
        );
        default: return (
            <div className="w-full h-screen p-3 pt-0 flex flex-col">
                <LoadingScreen text="クイズを準備中..." />
            </div>
        );
    }
};

export default QuizPlayer;