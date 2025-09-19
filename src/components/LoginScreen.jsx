import React from 'react';

function LoginScreen({ onLogin }) {
  return (
    <div className="max-w-lg w-full h-dvh mx-auto p-8 text-center flex flex-col items-center justify-center overflow-hidden">
      <h1 className="text-3xl font-bold text-[#EA7A5B] mb-8">内田塾 eラーニング</h1>
      <button
        onClick={onLogin}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center space-x-3 transition-colors"
      >
        <span>Googleでログイン</span>
      </button>
    </div>
  );
}

export default LoginScreen;