import React, { useState } from 'react';

interface PlayerNameModalProps {
  onSave: (name: string) => void;
  onClose: () => void;
}

const PlayerNameModal: React.FC<PlayerNameModalProps> = ({ onSave, onClose }) => {
  const [name, setName] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
    } else {
      // Optionally, show an error message
      alert('Please enter a name.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-sm mx-4">
        <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">Congratulations!</h2>
        <p className="mb-4 text-slate-600 dark:text-slate-400">Enter your name to save your score on the daily leaderboard.</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player Name"
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">Save Score</button>
        </div>
      </div>
    </div>
  );
};

export default PlayerNameModal;
