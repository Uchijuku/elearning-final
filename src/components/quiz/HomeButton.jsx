// src/components/quiz/HomeButton.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const HomeButton = () => {
    return (
        <div className="flex-shrink-0 pt-4 pb-2">
            <Link to="/" className="w-full text-center bg-gray-800 text-white font-bold py-3 px-4 rounded-lg text-lg flex items-center justify-center">
                <i className="fa-solid fa-house mr-2"></i>ホームへ
            </Link>
        </div>
    );
};

export default HomeButton;