import React, { useState, useEffect, useCallback } from 'react';
import Board from './components/Board';
import Timer from './components/Timer';
import { generateSudoku, checkSolution } from './utils/sudoku';
import { supabase } from './lib/supabaseClient';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

// 他のコンポーネントでも利用するため、型定義をexportします
export type BoardState = (number | null)[][];
export type InitialBoardState = (number | null)[][];

const App: React.FC = () => {
  const [initialBoard, setInitialBoard] = useState<InitialBoardState>([]);
  const [board, setBoard] = useState<BoardState>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const { width, height } = useWindowSize();

  const startNewGame = useCallback(() => {
    const { puzzle } = generateSudoku(40); // 難易度（初期配置される数字の数）
    setInitialBoard(JSON.parse(JSON.stringify(puzzle)));
    setBoard(puzzle);
    setIsSolved(false);
    setTime(0);
    setIsRunning(true);
    setSelectedCell(null);
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && !isSolved) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isSolved]);

    // クリア判定の useEffect を修正
    useEffect(() => {
      const checkAndSaveScore = async () => {
        if (board.every(row => row.every(cell => cell !== null))) {
          if (checkSolution(board)) {
            setIsSolved(true);
            setIsRunning(false);
  
            // Supabaseにスコアを保存
            const { error } = await supabase
              .from('scores')
              .insert([{ clear_time_seconds: time }]);
  
            if (error) {
              console.error('Error saving score:', error);
            } else {
              console.log('Score saved successfully!');
            }
          }
        }
      };
      checkAndSaveScore();
    }, [board, time]); // board と time が変更されるたびにチェック

  const handleCellSelect = (row: number, col: number) => {
    if (!isSolved) {
      setSelectedCell({ row, col });
    }
  };

  const handleNumberInput = (num: number) => {
    if (selectedCell && initialBoard[selectedCell.row][selectedCell.col] === null && !isSolved) {
      const newBoard = board.map(row => [...row]);
      newBoard[selectedCell.row][selectedCell.col] = num;
      setBoard(newBoard);

      if (checkSolution(newBoard)) {
        setIsSolved(true);
        setIsRunning(false);
      }
    }
  };
  
  const handleDelete = () => {
    if (selectedCell && initialBoard[selectedCell.row][selectedCell.col] === null && !isSolved) {
      const newBoard = board.map(row => [...row]);
      newBoard[selectedCell.row][selectedCell.col] = null;
      setBoard(newBoard);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedCell) {
        const num = parseInt(event.key);
        if (num >= 1 && num <= 9) {
          handleNumberInput(num);
        }
        if (event.key === 'Backspace' || event.key === 'Delete') {
          handleDelete();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCell, board]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center font-sans p-4">
      {isSolved && <Confetti width={width} height={height} recycle={false} />}
      <header className="text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500">
          Sudoku
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">A modern Sudoku game built with React.</p>
      </header>

      <main className="flex flex-col lg:flex-row items-center gap-8">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-4 px-2">
             <Timer time={time} />
             <button 
                onClick={startNewGame}
                className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
             >
               New Game
             </button>
          </div>
          <Board 
            board={board}
            initialBoard={initialBoard}
            onCellSelect={handleCellSelect}
            selectedCell={selectedCell}
            isSolved={isSolved}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleNumberInput(num)}
                className="w-16 h-16 bg-white dark:bg-slate-800 text-2xl font-bold rounded-lg shadow-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {num}
              </button>
            ))}
          </div>
           <button
              onClick={handleDelete}
              className="w-full h-16 bg-red-500 text-white text-xl font-bold rounded-lg shadow-md hover:bg-red-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Delete
            </button>
        </div>
      </main>
      
      {isSolved && (
        <div className="mt-8 p-6 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-xl text-center shadow-lg animate-fade-in">
          <h2 className="text-3xl font-bold text-green-700 dark:text-green-300">Congratulations!</h2>
          <p className="text-green-600 dark:text-green-400 mt-2 text-lg">You solved the puzzle in {Math.floor(time / 60)}m {time % 60}s.</p>
        </div>
      )}
    </div>
  );
};

export default App;
