

import React from 'react';
import type { View } from '../types';

interface HeaderProps {
  activeView: View;
  setView: (view: View) => void;
}

const NavItem: React.FC<{
  label: string;
  viewName: View;
  activeView: View;
  setView: (view: View) => void;
  Icon: React.ElementType;
}> = ({ label, viewName, activeView, setView, Icon }) => {
  const isActive = activeView === viewName;
  return (
    <button
      onClick={() => setView(viewName)}
      className={`flex flex-col items-center justify-center w-full py-2 px-1 text-xs sm:text-sm transition-colors duration-200 ${
        isActive ? 'text-cyan-400' : 'text-gray-400 hover:text-cyan-300'
      }`}
    >
      <Icon className="w-6 h-6 mb-1" />
      <span>{label}</span>
    </button>
  );
};

const TimerIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);
const ChartBarIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
);
const HistoryIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
    </svg>
);
const CogIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75v.01M12 17.25v.01" />
    </svg>
);


export const Header: React.FC<HeaderProps> = ({ activeView, setView }) => {
  return (
    <header className="bg-gray-800 shadow-lg sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-2">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-wider">Commute Tracker</h1>
        </div>
      </div>
      <nav className="bg-gray-800/50 border-t border-gray-700">
        <div className="container mx-auto flex justify-around">
            <NavItem label="Timer" viewName="main" activeView={activeView} setView={setView} Icon={TimerIcon} />
            <NavItem label="Stats" viewName="stats" activeView={activeView} setView={setView} Icon={ChartBarIcon} />
            <NavItem label="History" viewName="history" activeView={activeView} setView={setView} Icon={HistoryIcon} />
            <NavItem label="Settings" viewName="settings" activeView={activeView} setView={setView} Icon={CogIcon} />
        </div>
      </nav>
    </header>
  );
};