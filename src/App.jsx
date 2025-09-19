import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { db, auth, loginWithGoogle } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import QuizPlayer from './components/quiz/QuizPlayer';

const PlaceholderModal = ({ title, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-8 rounded-lg shadow-xl">
      <h2 className="text-xl mb-4">{title}</h2>
      <button onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
        閉じる
      </button>
    </div>
  </div>
);

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [firestoreUser, setFirestoreUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthUser(user);
        const q = query(collection(db, "allowedUsers"), where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setFirestoreUser({ ...userData, docId: querySnapshot.docs[0].id, uid: user.uid });
        } else {
          console.error("This user is not allowed.");
          setFirestoreUser(null);
          signOut(auth);
        }
      } else {
        setAuthUser(null);
        setFirestoreUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const openModal = (modalName) => setActiveModal(modalName);
  const closeModal = () => setActiveModal(null);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">読み込み中...</div>;
  }
  
  const modals = {
    calendar: <PlaceholderModal title="カレンダー" onClose={closeModal} />,
    timetable: <PlaceholderModal title="時間割" onClose={closeModal} />,
    assignments: <PlaceholderModal title="課題" onClose={closeModal} />,
    ranking: <PlaceholderModal title="ランキング" onClose={closeModal} />,
    stampbook: <PlaceholderModal title="実績" onClose={closeModal} />,
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginScreen onLogin={handleLogin} />} />
        <Route 
          path="/" 
          element={
            firestoreUser ? (
              <Dashboard user={firestoreUser} onLogout={handleLogout} openModal={openModal} />
            ) : (
              <LoginScreen onLogin={handleLogin} />
            )
          } 
        />
        <Route 
          path="/quiz/:softKey" 
          element={
            firestoreUser ? (
              <QuizPlayer user={firestoreUser} />
            ) : (
              <LoginScreen onLogin={handleLogin} />
            )
          }
        />
      </Routes>
      
      {activeModal && modals[activeModal]}
    </>
  );
}

export default App;