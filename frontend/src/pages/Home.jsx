import React from 'react';
import TitleHeader from '../components/home/TitleHeader';
import NicknameInput from '../components/home/NicknameInput';
import CreateJoinButtons from '../components/home/CreateJoinButtons';
import '../index.css';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center px-4"
         style={{ backgroundImage: "url('/bg-doodles.png')" }}>
      <div className="flex flex-col items-center space-y-4">
        <TitleHeader />

        <CreateJoinButtons />
      </div>
    </div>
  );
}
