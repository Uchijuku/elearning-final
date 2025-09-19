import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase.js';
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore';
import './Dashboard.css';

import { 
  SubjectModalKokugo, 
  SubjectModalEigo, 
  SubjectModalShakai, 
  SubjectModalRika 
} from './quiz/SubjectModals';

function Dashboard({ user, onLogout, openModal }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ weekCount: 0, streakDays: 0 });
  const [ranking, setRanking] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubjectModal, setActiveSubjectModal] = useState(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        let streak = 0;
        const allRecordsQuery = query(collection(db, "studyRecords"), where("userEmail", "==", user.email));
        const allRecordsSnapshot = await getDocs(allRecordsQuery);
        if (allRecordsSnapshot.docs.length > 0) {
          const formatDate = (date) => date.toISOString().split('T')[0];
          const solveDates = new Set(allRecordsSnapshot.docs.map(d => d.data().answeredAt.toDate()).map(formatDate));
          let checkDate = new Date();
          if (!solveDates.has(formatDate(checkDate))) { checkDate.setDate(checkDate.getDate() - 1); }
          while (solveDates.has(formatDate(checkDate))) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
        }
        const now = new Date();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
        const weekRecordsQuery = query(collection(db, "studyRecords"), where("userEmail", "==", user.email), where("isCorrect", "==", true), where("answeredAt", ">=", startOfWeek));
        const weekRecordsSnapshot = await getDocs(weekRecordsQuery);
        const weekCorrectCount = weekRecordsSnapshot.size;
        setStats({ weekCount: weekCorrectCount, streakDays: streak });
        const rankingDocRef = doc(db, "rankings", "weekly");
        const rankingDocSnap = await getDoc(rankingDocRef);
        if (rankingDocSnap.exists()) {
          const weeklyRankingData = rankingDocSnap.data().scores || [];
          setRanking(weeklyRankingData.slice(0, 3));
        } else {
          setRanking([]);
        }
      } catch (error) {
        console.error("Dashboard data fetching failed:", error);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, "assignments"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assignmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssignments(assignmentsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };
  const todayStr = getTodayString();
  const todayCount = (user?.today_date === todayStr) ? (user.today_correctAnswers || 0) : 0;
  
  if (loading) {
      return <div style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif", display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 'bold' }}>データを読み込んでいます...</div>;
  }
  
  return (
    <div className="container">
      <header>
        <div className="header-title">内田塾 塾生</div>
        <div className="user-info">
          <span className="user-name">{user.name}</span>
          <button onClick={onLogout} className="logout-button">(ログアウト)</button>
        </div>
      </header>

      <nav className="main-nav">
        <button className="nav-button" onClick={() => openModal('calendar')}><i className="fa-solid fa-calendar-days"></i>カレンダー</button>
        <button className="nav-button" onClick={() => openModal('timetable')}><i className="fa-solid fa-table-list"></i>時間割</button>
      </nav>

      <main>
        <div className="main-grid">
          <div className="grid-card points-card">
            <div>
                <div className="label">全正解数</div>
                <div className="total-count">{user?.totalCorrectAnswers || 0}</div>
            </div>
            <div className="sub-stats">
                <div>過去7日間<span>{stats.weekCount}</span></div>
                <div>今日<span>{todayCount}</span></div>
            </div>
          </div>
          <div className="grid-card assignment-card">
            <h3>1年 課題</h3>
            <ul>{assignments.filter(a => a.grade === '1').map(task => <li key={task.id}>{task.title}<span>(~{task.dueDate})</span></li>)}</ul>
          </div>
          <div className="grid-card streak-card">
            <div>
                <span className="streak-label">連続</span>
                <span className="streak-days">{stats.streakDays}</span>
                <span className="streak-label">日目</span>
                <span className="fire">🔥</span>
            </div>
          </div>
          <div className="grid-card assignment-card">
            <h3>2年 課題</h3>
            <ul>{assignments.filter(a => a.grade === '2').map(task => <li key={task.id}>{task.title}<span>(~{task.dueDate})</span></li>)}</ul>
          </div>
          <div className="grid-card ranking-card">
            <h3>🏆 過去7日間 TOP3</h3>
            <ol>
                {ranking.map((player, index) => (
                <li key={index}>
                    <span className="rank">{index + 1}</span>
                    <span className="name">{player.name}</span>
                    <span className="score">{player.score}</span>
                </li>
                ))}
            </ol>
          </div>
          <div className="grid-card assignment-card">
            <h3>3年 課題</h3>
            <ul>{assignments.filter(a => a.grade === '3').map(task => <li key={task.id}>{task.title}<span>(~{task.dueDate})</span></li>)}</ul>
          </div>
        </div>
        
        <section className="subjects-grid">
          <button className="subject-button" onClick={() => setActiveSubjectModal('kokugo')}>
            <div className="icon-wrapper subject-japanese"><i className="fa-solid fa-book-open"></i></div>
            国語
          </button>
          <button className="subject-button" onClick={() => setActiveSubjectModal('eigo')}>
            <div className="icon-wrapper subject-english">A文</div>
            英語
          </button>
          <button className="subject-button" onClick={() => setActiveSubjectModal('shakai')}>
            <div className="icon-wrapper subject-social"><i className="fa-solid fa-earth-asia"></i></div>
            社会
          </button>
          <button className="subject-button" onClick={() => setActiveSubjectModal('rika')}>
            <div className="icon-wrapper subject-science"><i className="fa-solid fa-flask"></i></div>
            理科
          </button>
          <button className="subject-button disabled">
            <div className="icon-wrapper subject-math"><i className="fa-solid fa-calculator"></i></div>
            数学
          </button>
          <button className="subject-button" onClick={() => openModal('stampbook')}>
            <div className="icon-wrapper subject-results"><i className="fa-solid fa-award"></i></div>
            実績
          </button>
        </section>
      </main>

      {activeSubjectModal === 'kokugo' && <SubjectModalKokugo onClose={() => setActiveSubjectModal(null)} />}
      {activeSubjectModal === 'eigo' && <SubjectModalEigo onClose={() => setActiveSubjectModal(null)} />}
      {activeSubjectModal === 'shakai' && <SubjectModalShakai onClose={() => setActiveSubjectModal(null)} />}
      {activeSubjectModal === 'rika' && <SubjectModalRika onClose={() => setActiveSubjectModal(null)} />}
    </div>
  );
}

export default Dashboard;