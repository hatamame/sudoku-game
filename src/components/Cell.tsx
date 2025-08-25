import React from 'react';

interface CellProps {
  value: number | null;
  notes: Set<number>;
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

const Cell: React.FC<CellProps> = ({ value, notes, isInitial, isSelected, isRelated, onClick, isSolved, rowIndex, colIndex, isConflict, isCompleted, isRecentlyPlaced }) => {
  const classes = [
    "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14",
    "flex items-center justify-center",
    "transition-all duration-300 cursor-pointer relative"
  ];

  // Set background and animations
  if (isSolved) {
    classes.push('bg-green-100 dark:bg-green-900 cursor-default');
  } else if (isConflict) {
    classes.push('bg-red-200 dark:bg-red-800/70');
    if (isSelected) {
      classes.push('animate-pulse-border');
    }
  } else if (isSelected) {
    classes.push('bg-purple-200 dark:bg-purple-800/70 animate-glow');
  } else if (isCompleted) {
    classes.push('bg-green-100 dark:bg-green-800/50');
  } else if (isRelated) {
    classes.push('bg-slate-200 dark:bg-slate-700');
  } else {
    classes.push('bg-white/70 dark:bg-slate-800/60');
  }

  // Set text style (color and weight)
  if (value !== null) { // Only apply text styles if there's a main value
    classes.push('text-xl md:text-2xl'); // Main value is larger
    if (isInitial) {
      classes.push('font-bold');
    }

    if (isSolved) {
      classes.push('text-green-700 dark:text-green-300');
    } else if (isConflict) {
      if (isInitial) {
        classes.push('text-red-800 dark:text-red-300'); // Darker red for initial
      } else {
        classes.push('text-red-600 dark:text-red-400'); // Lighter red for player
      }
    } else {
      if (isInitial) {
        classes.push('text-slate-900 dark:text-slate-100');
      } else {
        classes.push('text-cyan-600 dark:text-cyan-400');
      }
    }
  } else { // Notes are smaller
    classes.push('text-xs md:text-sm');
    classes.push('text-slate-500 dark:text-slate-400'); // Notes are always a subtle color
  }

  if (isRecentlyPlaced) {
    classes.push('animate-pop');
  }

  // Add borders
  if (colIndex === 2 || colIndex === 5) classes.push("border-r-2 border-slate-400 dark:border-slate-500");
  if (rowIndex === 2 || rowIndex === 5) classes.push("border-b-2 border-slate-400 dark:border-slate-500");

  return (
    <div className={classes.join(' ')} onClick={onClick}>
      {value !== null ? (
        value
      ) : (
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <div key={num} className="flex items-center justify-center">
              {notes.has(num) ? num : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Cell;
