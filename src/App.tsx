import React, { useState, useEffect, useCallback } from 'react';
import { ThemeToggle } from './components/ThemeToggle';
import Board from './components/Board';
import Timer from './components/Timer';
import { generateSudoku, generateDailySudoku } from './utils/sudoku';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { supabase } from './lib/supabaseClient';
import Leaderboard from './components/Leaderboard';
import PlayerNameModal from './components/PlayerNameModal';


export interface CellState {
  value: number | null;
  notes: Set<number>;
  isInitial: boolean;
}
export type BoardState = CellState[][];

const DIFFICULTIES = {
  Easy: 45,
  Medium: 35,
  Hard: 25,
};
type Difficulty = keyof typeof DIFFICULTIES;
type GameMode = 'difficulty' | 'daily';

type Conflict = { row: number; col: number };

const App: React.FC = () => {
  const [board, setBoard] = useState<BoardState>([]);
  const [selectedCell, setSelectedCell] = useState<Conflict | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const { width, height } = useWindowSize();
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [gameMode, setGameMode] = useState<GameMode>('difficulty');
  const [isNoteMode, setIsNoteMode] = useState(false); // メモモードのState

  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [lastPlacedCell, setLastPlacedCell] = useState<Conflict | null>(null);
  const [completedUnits, setCompletedUnits] = useState<{ rows: number[], cols: number[], blocks: number[] }>({ rows: [], cols: [], blocks: [] });

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);

  const updateAllConflicts = useCallback((currentBoard: BoardState) => {
    const newConflicts: Conflict[] = [];
    if (!currentBoard.length) return;

    // Helper to get value from CellState
    const getValue = (r: number, c: number) => currentBoard[r][c].value;

    // Check rows and columns
    for (let i = 0; i < 9; i++) {
      const rowCounts = new Map<number, number[]>();
      const colCounts = new Map<number, number[]>();
      for (let j = 0; j < 9; j++) {
        // Row check
        const rowValue = getValue(i, j);
        if (rowValue !== null) {
          if (!rowCounts.has(rowValue)) rowCounts.set(rowValue, []);
          rowCounts.get(rowValue)!.push(j);
        }
        // Column check
        const colValue = getValue(j, i);
        if (colValue !== null) {
          if (!colCounts.has(colValue)) colCounts.set(colValue, []);
          colCounts.get(colValue)!.push(j);
        }
      }
      rowCounts.forEach((cols) => {
        if (cols.length > 1) {
          cols.forEach(col => newConflicts.push({ row: i, col }));
        }
      });
      colCounts.forEach((rows) => {
        if (rows.length > 1) {
          rows.forEach(row => newConflicts.push({ row, col: i }));
        }
      });
    }

    // Check 3x3 blocks
    for (let blockRow = 0; blockRow < 3; blockRow++) {
      for (let blockCol = 0; blockCol < 3; blockCol++) {
        const blockCounts = new Map<number, { r: number, c: number }[]>();
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const row = blockRow * 3 + i;
            const col = blockCol * 3 + j;
            const value = getValue(row, col);
            if (value !== null) {
              if (!blockCounts.has(value)) blockCounts.set(value, []);
              blockCounts.get(value)!.push({ r: row, c: col });
            }
          }
        }
        blockCounts.forEach((cells) => {
          if (cells.length > 1) {
            cells.forEach(cell => newConflicts.push({ row: cell.r, col: cell.c }));
          }
        });
      }
    }

    setConflicts(newConflicts);
  }, []);

  const startNewGame = useCallback((mode: GameMode, level: Difficulty = 'Medium') => {
    setGameMode(mode);
    let puzzle: (number | null)[][];

    if (mode === 'daily') {
      const daily = generateDailySudoku(new Date());
      puzzle = daily.puzzle;
    } else {
      const numCells = DIFFICULTIES[level];
      const newPuzzle = generateSudoku(numCells);
      puzzle = newPuzzle.puzzle;
      setDifficulty(level);
    }

    const newBoard = puzzle.map(row =>
      row.map(value => ({
        value,
        notes: new Set<number>(),
        isInitial: value !== null,
      }))
    );

    setBoard(newBoard);
    setIsSolved(false);
    setTime(0);
    setIsRunning(true);
    setSelectedCell(null);
    setLastPlacedCell(null);
    // updateAllConflicts will be fixed later
    // updateAllConflicts(newBoard);
  }, []);

  useEffect(() => {
    startNewGame('difficulty', 'Medium');
  }, [startNewGame]);

  useEffect(() => {
    if (!board.length) return;

    const newCompleted = { rows: [] as number[], cols: [] as number[], blocks: [] as number[] };
    const checkUnit = (unit: CellState[]) => {
      const nums = unit.filter(cell => cell.value !== null).map(cell => cell.value);
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

    const allCellsFilled = board.every(row => row.every(cell => cell.value !== null));
    if (allCellsFilled && conflicts.length === 0) {
      setIsSolved(true);
      setIsRunning(false);
    } else {
      setIsSolved(false);
    }
  }, [board, updateAllConflicts, conflicts]);


  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && !isSolved) {
      interval = setInterval(() => setTime(prevTime => prevTime + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, isSolved]);

  const handleCellSelect = useCallback((row: number, col: number) => {
    if (!isSolved) {
      setSelectedCell({ row, col });
    }
  }, [isSolved]);

  const handleNumberInput = useCallback((num: number) => {
    if (!selectedCell || isSolved) return;
    const { row, col } = selectedCell;
    if (board[row][col].isInitial) return;

    const newBoard = board.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
    const cell = newBoard[row][col];

    if (isNoteMode) {
      if (cell.value === null) { // Can only add notes to empty cells
        const currentNotes = cell.notes;
        if (currentNotes.has(num)) {
          currentNotes.delete(num);
        } else {
          currentNotes.add(num);
        }
      }
    } else {
      cell.value = cell.value === num ? null : num;
      cell.notes.clear();
    }

    setBoard(newBoard);
    setLastPlacedCell(selectedCell);
  }, [selectedCell, isSolved, board, isNoteMode]);

  const handleDelete = useCallback(() => {
    if (!selectedCell || isSolved) return;
    const { row, col } = selectedCell;
    if (board[row][col].isInitial) return;

    const newBoard = board.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
    const cell = newBoard[row][col];

    if (cell.value !== null) {
      cell.value = null;
    } else {
      cell.notes.clear();
    }

    setBoard(newBoard);
    setLastPlacedCell(selectedCell);
  }, [selectedCell, isSolved, board]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedCell) {
        const num = parseInt(event.key);
        if (num >= 1 && num <= 9) handleNumberInput(num);
        if (event.key === 'Backspace' || event.key === 'Delete') handleDelete();
        if (event.key.toLowerCase() === 'n') {
          setIsNoteMode(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, handleNumberInput, handleDelete, setIsNoteMode]);

  const handleSaveDailyScore = async (playerName: string) => {
    if (gameMode === 'daily' && isSolved) {
      const { data, error } = await supabase
        .from('daily_scores')
        .insert([{ player_name: playerName, score_time: time, created_at: new Date().toISOString() }]);

      if (error) {
        console.error('Error saving daily score:', error);
      } else {
        console.log('Daily score saved:', data);
      }
      setShowNameModal(false);
    }
  };

  useEffect(() => {
    if (isSolved && gameMode === 'daily') {
      setShowNameModal(true);
    }
  }, [isSolved, gameMode]);

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center font-sans p-4 animated-gradient">
      {isSolved && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
      {showNameModal && <PlayerNameModal onSave={handleSaveDailyScore} onClose={() => setShowNameModal(false)} />}

      <header className="w-full max-w-4xl mx-auto mb-6 p-4">
        <div className="flex justify-between items-center">
          <div className="w-24">
            <button onClick={() => setShowLeaderboard(true)} className="px-3 py-2 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700">
              Ranking
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500 drop-shadow-sm">
              数独(SUDOKU)
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">数独(SUDOKU)</p>
          </div>
          <div className="w-24 flex justify-end">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex gap-4 mb-6">
        {(Object.keys(DIFFICULTIES) as Difficulty[]).map((level) => (
          <button
            key={level}
            onClick={() => startNewGame('difficulty', level)}
            className={`px-5 py-2 text-lg font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-opacity-70 ${gameMode === 'difficulty' && difficulty === level ? 'bg-purple-600 text-white focus:ring-purple-500' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 focus:ring-slate-400'}`}
          >
            {level}
          </button>
        ))}
        <button
          onClick={() => startNewGame('daily')}
          className={`px-5 py-2 text-lg font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-opacity-70 ${gameMode === 'daily' ? 'bg-amber-500 text-white focus:ring-amber-400' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 focus:ring-slate-400'}`}
        >
          Daily Challenge
        </button>
      </div>

      <main className="flex flex-col lg:flex-row items-center gap-8">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-4 px-2">
            <Timer time={time} />
            <button
              onClick={() => startNewGame(gameMode, difficulty)}
              className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:bg-purple-700 hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-70"
            >
              New Game
            </button>
          </div>
          <Board
            board={board}
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
                className="w-16 h-16 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm text-2xl font-bold rounded-lg shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {num}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsNoteMode(!isNoteMode)}
            className={`w-full h-16 text-white text-xl font-bold rounded-lg shadow-md transition-all duration-200 ${isNoteMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-600 hover:bg-slate-700'}`}>
            {isNoteMode ? 'ノートモード(On)' : 'ノートモード(Off)'}
            <span className="block text-xs font-normal">(Nキー)</span>
          </button>
          <button
            onClick={handleDelete}
            className="w-full h-16 bg-red-500/90 backdrop-blur-sm text-white text-xl font-bold rounded-lg shadow-md hover:shadow-lg hover:bg-red-600 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            削除
          </button>
        </div>
      </main>

      {isSolved && gameMode === 'difficulty' && (
        <div className="mt-8 p-6 bg-green-100/80 dark:bg-green-900/80 backdrop-blur-sm border border-green-300 dark:border-green-700 rounded-xl text-center shadow-lg animate-fade-in">
          <h2 className="text-3xl font-bold text-green-700 dark:text-green-300">おめでとうございます!</h2>
          <p className="text-green-600 dark:text-green-400 mt-2 text-lg">あなたはパズルを {Math.floor(time / 60)}m {time % 60}s.で解きました</p>
        </div>
      )}
    </div>
  );
};

export default App;
