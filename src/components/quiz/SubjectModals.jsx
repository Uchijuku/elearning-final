import React from 'react';
import { Link } from 'react-router-dom';

const SubjectModal = ({ title, links, onClose }) => (
  <div 
    className="bg-black bg-opacity-50" // 背景色だけTailwindに任せる
    onClick={onClose}
    // ▼▼▼ 重要なスタイルを直接書き込む ▼▼▼
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}
  >
    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="font-bold text-xl">{title}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
      </div>
      <div className="p-4">
        <ul className="space-y-2">
          {links.map(link => (
            <li key={link.href}>
              <Link to={link.href} className="block w-full text-center bg-blue-500 text-white font-bold py-3 px-4 rounded-lg text-lg hover:bg-blue-600">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

// 以下は変更なし
export const SubjectModalKokugo = ({ onClose }) => {
  const links = [
    { href: '/quiz/nengou', label: '一問一答（年号）' },
    { href: '/quiz/kobun', label: '一問一答（古文）' },
  ];
  return <SubjectModal title="国語" links={links} onClose={onClose} />;
};

export const SubjectModalEigo = ({ onClose }) => {
  const links = [
    { href: '/quiz/eigo', label: '一問一答（英単語）' },
  ];
  return <SubjectModal title="英語" links={links} onClose={onClose} />;
};

export const SubjectModalShakai = ({ onClose }) => {
  const links = [
    { href: '/quiz/chiri', label: '一問一答（地理）' },
    { href: '/quiz/rekishi', label: '一問一答（歴史）' },
  ];
  return <SubjectModal title="社会" links={links} onClose={onClose} />;
};

export const SubjectModalRika = ({ onClose }) => {
  const links = [
    { href: '/quiz/rika1', label: '一問一答（理科第一分野）' },
    { href: '/quiz/rika2', label: '一問一答（理科第二分野）' },
  ];
  return <SubjectModal title="理科" links={links} onClose={onClose} />;
};