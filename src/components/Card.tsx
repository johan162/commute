
import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg w-full max-w-2xl mx-auto">
      {title && <h2 className="text-xl font-bold p-4 border-b border-gray-700 text-white">{title}</h2>}
      <div className="p-4 md:p-6">
        {children}
      </div>
    </div>
  );
};
