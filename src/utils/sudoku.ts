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

const solveSudoku = (board: (number | null)[][]): boolean => {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === null) {
                const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                for (let i = nums.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [nums[i], nums[j]] = [nums[j], nums[i]];
                }

                for (const num of nums) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;
                        if (solveSudoku(board)) {
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

export const generateSudoku = (difficulty: number = 40): { puzzle: (number | null)[][], solution: number[][] } => {
    const solution = createEmptyBoard();
    solveSudoku(solution);

    const puzzle = JSON.parse(JSON.stringify(solution));

    let attempts = 81 - difficulty;
    while (attempts > 0) {
        let row = Math.floor(Math.random() * 9);
        let col = Math.floor(Math.random() * 9);

        if (puzzle[row][col] !== null) {
            puzzle[row][col] = null;
            attempts--;
        }
    }

    return { puzzle, solution: solution as number[][] };
};

export const checkSolution = (board: (number | null)[][]): boolean => {
    // ★★★ 修正点 ★★★
    // ボードが初期化されていない、または不正な形式の場合はfalseを返す
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
