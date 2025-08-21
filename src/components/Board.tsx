import React from 'react';
import Cell from './Cell';
import type { BoardState, InitialBoardState } from '../App'; // 'import type' に修正

interface BoardProps {
  board: BoardState;
  initialBoard: InitialBoardState;
  onCellSelect: (row: number, col: number) => void;
  selectedCell: { row: number; col: number } | null;
  isSolved: boolean;
}

const Board: React.FC<BoardProps> = ({ board, initialBoard, onCellSelect, selectedCell, isSolved }) => {
  return (
    <div className="grid grid-cols-9 bg-slate-300 dark:bg-slate-600 border-2 border-slate-400 dark:border-slate-500">
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <Cell
            key={`${rowIndex}-${colIndex}`}
            value={cell}
            isInitial={initialBoard[rowIndex][colIndex] !== null}
            isSelected={selectedCell?.row === rowIndex && selectedCell?.col === colIndex}
            isRelated={
              selectedCell !== null &&
              (selectedCell.row === rowIndex ||
               selectedCell.col === colIndex ||
               (Math.floor(selectedCell.row / 3) === Math.floor(rowIndex / 3) &&
                Math.floor(selectedCell.col / 3) === Math.floor(colIndex / 3)))
            }
            onClick={() => onCellSelect(rowIndex, colIndex)}
            isSolved={isSolved}
            rowIndex={rowIndex}
            colIndex={colIndex}
          />
        ))
      )}
    </div>
  );
};

export default Board;
