import React, { useState, useEffect, useCallback } from 'react';
import Board from './components/Board';
import Timer from './components/Timer';
import { generateSudoku, checkSolution } from './utils/sudoku';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { supabase } from './lib/supabaseClient';

export type BoardState = (number | null)[][];
export type InitialBoardState = (number | null)[][];

const DIFFICULTIES = {
  Easy: 45,
  Medium: 35,
  Hard: 25,
};
type Difficulty = keyof typeof DIFFICULTIES;

type Conflict = { row: number; col: number };

const App: React.FC = () => {
  const [initialBoard, setInitialBoard] = useState<InitialBoardState>([]);
  const [board, setBoard] = useState<BoardState>([]);
  const [selectedCell, setSelectedCell] = useState<Conflict | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const { width, height } = useWindowSize();
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [lastPlacedCell, setLastPlacedCell] = useState<Conflict | null>(null);
  const [completedUnits, setCompletedUnits] = useState<{ rows: number[], cols: number[], blocks: number[] }>({ rows: [], cols: [], blocks: [] });

  const updateAllConflicts = useCallback((currentBoard: BoardState) => {
    const allConflicts = new Set<string>();
    if (!currentBoard.length) return;

    const addConflict = (r: number, c: number) => allConflicts.add(`${r},${c}`);

    for (let i = 0; i < 9; i++) {
      const rowSeen = new Map<number, number[]>();
      const colSeen = new Map<number, number[]>();
      const blockSeen = new Map<number, {r: number, c: number}[]>();
      
      const startRow = Math.floor(i / 3) * 3;
      const startCol = (i % 3) * 3;

      for (let j = 0; j < 9; j++) {
        const rowNum = currentBoard[i][j];
        if (rowNum !== null) {
          if (!rowSeen.has(rowNum)) rowSeen.set(rowNum, []);
          rowSeen.get(rowNum)!.push(j);
        }
        
        const colNum = currentBoard[j][i];
        if (colNum !== null) {
          if (!colSeen.has(colNum)) colSeen.set(colNum, []);
          colSeen.get(colNum)!.push(j);
        }
        
        const r = startRow + Math.floor(j / 3);
        const c = startCol + (j % 3);
        const blockNum = currentBoard[r][c];
        if (blockNum !== null) {
          if (!blockSeen.has(blockNum)) blockSeen.set(blockNum, []);
          blockSeen.get(blockNum)!.push({r, c});
        }
      }

      for (const cols of rowSeen.values()) if (cols.length > 1) cols.forEach(c => addConflict(i, c));
      for (const rows of colSeen.values()) if (rows.length > 1) rows.forEach(r => addConflict(r, i));
      for (const cells of blockSeen.values()) if (cells.length > 1) cells.forEach(cell => addConflict(cell.r, cell.c));
    }

    const newConflicts = Array.from(allConflicts).map(str => {
      const [row, col] = str.split(',').map(Number);
      return { row, col };
    });
    setConflicts(newConflicts);
  }, []);

  const startNewGame = useCallback((level: Difficulty) => {
    const numCells = DIFFICULTIES[level];
    const { puzzle } = generateSudoku(numCells);
    setInitialBoard(JSON.parse(JSON.stringify(puzzle)));
    setBoard(puzzle);
    setIsSolved(false);
    setTime(0);
    setIsRunning(true);
    setSelectedCell(null);
    setDifficulty(level);
    setLastPlacedCell(null);
    updateAllConflicts(puzzle);
  }, [updateAllConflicts]);

  useEffect(() => {
    startNewGame(difficulty);
  }, []);

  useEffect(() => {
    if(!board.length) return;

    const newCompleted = { rows: [] as number[], cols: [] as number[], blocks: [] as number[] };
    const checkUnit = (unit: (number | null)[]) => {
      const nums = unit.filter(n => n !== null);
      return nums.length === 9 && new Set(nums).size === 9;
    };

    for (let i = 0; i < 9; i++) {
      if (checkUnit(board[i])) newCompleted.rows.push(i);
      const col = board.map(row => row[i]);
      if (checkUnit(col)) newCompleted.cols.push(i);
      const block = [];
      const startRow = Math.floor(i / 3) * 3;
      const startCol = (i % 3) * 3;
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) block.push(board[startRow + r][startCol + c]);
      if (checkUnit(block)) newCompleted.blocks.push(i);
    }
    setCompletedUnits(newCompleted);
    updateAllConflicts(board);
  }, [board, updateAllConflicts]);


  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && !isSolved) {
      interval = setInterval(() => setTime(prevTime => prevTime + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, isSolved]);

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
      setLastPlacedCell(selectedCell);

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
      setLastPlacedCell(selectedCell);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedCell) {
        const num = parseInt(event.key);
        if (num >= 1 && num <= 9) handleNumberInput(num);
        if (event.key === 'Backspace' || event.key === 'Delete') handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, board]);

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

  return (
    // ★★★ 背景アニメーション用のクラスを追加 ★★★
    <div className="min-h-screen text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center font-sans p-4 animated-gradient">
      {isSolved && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
      <header className="text-center mb-6">
        <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500 drop-shadow-sm">
          数独(SUDOKU)
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">A modern Sudoku game built with React</p>
      </header>

      <div className="flex gap-4 mb-6">
        {(Object.keys(DIFFICULTIES) as Difficulty[]).map((level) => (
          <button
            key={level}
            onClick={() => startNewGame(level)}
            // ★★★ ボタンのスタイルを更新 ★★★
            className={`px-5 py-2 text-lg font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-opacity-70 ${difficulty === level ? 'bg-purple-600 text-white focus:ring-purple-500' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 focus:ring-slate-400'}`}
          >
            {level}
          </button>
        ))}
      </div>

      <main className="flex flex-col lg:flex-row items-center gap-8">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-4 px-2">
             <Timer time={time} />
             <button 
                onClick={() => startNewGame(difficulty)}
                // ★★★ ボタンのスタイルを更新 ★★★
                className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:bg-purple-700 hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-70"
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
            conflicts={conflicts}
            lastPlacedCell={lastPlacedCell}
            completedUnits={completedUnits}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleNumberInput(num)}
                // ★★★ ボタンのスタイルを更新 ★★★
                className="w-16 h-16 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm text-2xl font-bold rounded-lg shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {num}
              </button>
            ))}
          </div>
           <button
              onClick={handleDelete}
              // ★★★ ボタンのスタイルを更新 ★★★
              className="w-full h-16 bg-red-500/90 backdrop-blur-sm text-white text-xl font-bold rounded-lg shadow-md hover:shadow-lg hover:bg-red-600 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Delete
            </button>
        </div>
      </main>
      
      {isSolved && (
        <div className="mt-8 p-6 bg-green-100/80 dark:bg-green-900/80 backdrop-blur-sm border border-green-300 dark:border-green-700 rounded-xl text-center shadow-lg animate-fade-in">
          <h2 className="text-3xl font-bold text-green-700 dark:text-green-300">Congratulations!</h2>
          <p className="text-green-600 dark:text-green-400 mt-2 text-lg">You solved the puzzle in {Math.floor(time / 60)}m {time % 60}s.</p>
        </div>
      )}
    </div>
  );
};

export default App;