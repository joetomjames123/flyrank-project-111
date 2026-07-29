'use client';

import { useState, useRef, useEffect } from 'react';
import Chat from './components/Chat';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">AI Chat Assistant</h1>
          <p className="text-gray-400">Powered by AI. Ask anything, get helpful answers.</p>
        </header>
        <Chat />
      </div>
    </main>
  );
}