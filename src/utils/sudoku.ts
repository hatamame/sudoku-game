// Seeded pseudo-random number generator (PRNG)
const createPrng = (seed: number) => {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
};

const createEmptyBoard = (): (number | null)[][] => Array(9).fill(null).map(() => Array(9).fill(null));

const isValid = (board: (number | null)[][], row: number, col: number, num: number): boolean => {
    for (let x = 0; x < 9; x++) {
        if (board[row][x] === num) return false;
    }
    for (let x = 0; x < 9; x++) {
        if (board[x][col] === num) return false;
    }
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i + startRow][j + startCol] === num) return false;
        }
    }
    return true;
};

// Modified to accept a PRNG
const solveSudoku = (board: (number | null)[][], prng: () => number): boolean => {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === null) {
                const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                // Shuffle numbers using the provided PRNG
                for (let i = nums.length - 1; i > 0; i--) {
                    const j = Math.floor(prng() * (i + 1));
                    [nums[i], nums[j]] = [nums[j], nums[i]];
                }

                for (const num of nums) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;
                        if (solveSudoku(board, prng)) {
                            return true;
                        }
                        board[row][col] = null;
                    }
                }
                return false;
            }
        }
    }
    return true;
};

// Modified to accept an optional PRNG
export const generateSudoku = (difficulty: number = 40, prng: () => number = Math.random): { puzzle: (number | null)[][], solution: number[][] } => {
    const solution = createEmptyBoard();
    solveSudoku(solution, prng);

    const puzzle = JSON.parse(JSON.stringify(solution));

    let attempts = 81 - difficulty;
    while (attempts > 0) {
        let row = Math.floor(prng() * 9);
        let col = Math.floor(prng() * 9);

        if (puzzle[row][col] !== null) {
            // Ensure the puzzle is still solvable after removing a number
            
            puzzle[row][col] = null;
            
            // A simple check for solvability could be implemented here, 
            // but for now we assume removing cells doesn't break unique solvability.
            // A more robust implementation would check for a unique solution.
            
            attempts--;
        }
    }

    return { puzzle, solution: solution as number[][] };
};

// New function for daily puzzles
export const generateDailySudoku = (date: Date): { puzzle: (number | null)[][], solution: number[][] } => {
    // Create a numeric seed from the date (e.g., YYYYMMDD)
    const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    const prng = createPrng(seed);
    
    // Daily challenge has a fixed difficulty, e.g., Medium
    const difficulty = 35; 
    
    return generateSudoku(difficulty, prng);
};


export const checkSolution = (board: (number | null)[][]): boolean => {
    if (!board || board.length !== 9 || !board[0] || board[0].length !== 9) {
        return false;
    }

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === null) return false;
        }
    }

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const num = board[row][col]!;
            board[row][col] = null;
            if (!isValid(board, row, col, num)) {
                board[row][col] = num;
                return false;
            }
            board[row][col] = num;
        }
    }

    return true;
};