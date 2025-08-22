import React from 'react';

interface CellProps {
  value: number | null;
  isInitial: boolean;
  isSelected: boolean;
  isRelated: boolean;
  onClick: () => void;
  isSolved: boolean;
  rowIndex: number;
  colIndex: number;
  isConflict: boolean;
  isCompleted: boolean;
  isRecentlyPlaced: boolean;
}

const Cell: React.FC<CellProps> = ({ value, isInitial, isSelected, isRelated, onClick, isSolved, rowIndex, colIndex, isConflict, isCompleted, isRecentlyPlaced }) => {
  const baseClasses = "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center text-xl md:text-2xl font-bold transition-all duration-300 cursor-pointer relative";
  
  let cellClasses = baseClasses;

  // ★★★ スタイリングの優先順位を修正 ★★★
  if (isSolved) {
    cellClasses += " bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 cursor-default";
  } else if (isConflict && isSelected) {
    // ★★★ 新しいスタイル：重複かつ選択されている場合 ★★★
    cellClasses += " bg-red-200 dark:bg-red-800/70 text-red-900 dark:text-red-100 animate-pulse-border";
  } else if (isConflict) {
    cellClasses += " bg-red-200 dark:bg-red-800/70 text-red-900 dark:text-red-100";
  } else if (isSelected) {
    cellClasses += " bg-purple-200 dark:bg-purple-800/70 animate-glow";
  } else if (isCompleted) {
    cellClasses += " bg-green-100 dark:bg-green-800/50";
  } else if (isRelated) {
    cellClasses += " bg-slate-200 dark:bg-slate-700";
  } else {
    cellClasses += " bg-white/70 dark:bg-slate-800/60";
  }

  if (isInitial) {
    cellClasses += " text-slate-900 dark:text-slate-100";
  } else {
    cellClasses += " text-cyan-600 dark:text-cyan-400";
  }

  if (isRecentlyPlaced) {
    cellClasses += " animate-pop";
  }

  let borderClasses = "";
  if (colIndex === 2 || colIndex === 5) borderClasses += " border-r-2 border-slate-400 dark:border-slate-500";
  if (rowIndex === 2 || rowIndex === 5) borderClasses += " border-b-2 border-slate-400 dark:border-slate-500";

  return (
    <div className={`${cellClasses} ${borderClasses}`} onClick={onClick}>
      {value}
    </div>
  );
};

export default Cell;
