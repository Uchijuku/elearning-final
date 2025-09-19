// src/components/quiz/LoadingScreen.jsx
import React from 'react';

const LoadingScreen = ({ text }) => (
    <div className="flex justify-center items-center h-full p-4">
        <div className="text-xl font-bold text-gray-600">
            <i className="fas fa-spinner fa-spin mr-2"></i>
            {text}
        </div>
    </div>
);

export default LoadingScreen;