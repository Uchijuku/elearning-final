// src/components/quiz/CategorySelectionScreen.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const CategorySelectionScreen = ({ settings, categories1, getEmojiForCategory, startQuiz, setSelectedCategory, selectedCategory, isPopupOpen, setIsPopupOpen, categories2, softKey, isReviewMode }) => {
    if (!settings) return null; // settingsが読み込まれるまで何も表示しない

    if (settings.categoryStyle === 'start_only') {
        return (
            <div className="flex-grow flex flex-col justify-center items-center p-4">
                <h1 className="text-4xl font-extrabold text-center mb-12 text-gray-800" dangerouslySetInnerHTML={{ __html: settings.title.replace('\n', '<br/>') }}></h1>
                <button onClick={() => startQuiz()} className="w-full max-w-xs mx-auto bg-blue-500 text-white font-bold text-3xl py-4 rounded-full shadow-lg">
                    スタート
                </button>
            </div>
        );
    }
    const mainButtons = categories1.map(cat => {
        const hasSubcategories = settings.categoryStyle === 'popup';
        const action = hasSubcategories ? () => { setSelectedCategory({ cat1: cat }); setIsPopupOpen(true); } : () => startQuiz(cat);
        const emoji = getEmojiForCategory(cat);
        return (
            <button key={cat} onClick={action} className="bg-blue-500 text-white font-bold text-2xl rounded-lg shadow-lg flex-grow flex items-center justify-center p-2">
                <span className="text-3xl mr-3">{emoji}</span>
                <span>{cat}</span>
            </button>
        );
    });
    return (
        <div className="flex-grow flex flex-col pt-4">
            <h1 className="text-3xl font-bold text-center mb-6 flex-shrink-0 text-gray-800" dangerouslySetInnerHTML={{ __html: settings.title.replace('\n', '<br/>') }}></h1>
            <div className="space-y-3 flex-grow flex flex-col justify-center">
                {mainButtons}
                <div className="flex items-center space-x-2">
                    <Link to={`/quiz/${softKey}?mode=review`} className="w-1/2 text-center bg-green-600 text-white font-bold text-xl rounded-lg shadow-lg flex-grow flex items-center justify-center py-4">
                        <i className="fa-solid fa-brain mr-2"></i>苦手
                    </Link>
                    <button onClick={() => startQuiz('すべて')} className="w-1/2 text-center bg-gray-700 text-white font-bold text-xl rounded-lg shadow-lg flex-grow flex items-center justify-center py-4">
                        <i className="fa-solid fa-rocket mr-2"></i>すべて
                    </button>
                </div>
            </div>
            {isPopupOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50" onClick={() => setIsPopupOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">{selectedCategory.cat1}</h2>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {categories2.map(cat2 => (<button key={cat2} onClick={() => startQuiz(selectedCategory.cat1, cat2)} className="w-full font-bold py-2 rounded-lg text-base flex items-center justify-center bg-green-500 text-white">{cat2}</button>))}
                        </div>
                        <button onClick={() => startQuiz(selectedCategory.cat1, 'すべて')} className="w-full font-bold py-3 rounded-xl text-xl flex items-center justify-center bg-blue-500 text-white">この範囲のすべて</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategorySelectionScreen;