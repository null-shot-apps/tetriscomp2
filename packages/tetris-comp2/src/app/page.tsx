'use client';

import { useEffect, useState, useCallback } from 'react';

// Tetris piece shapes
const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]]
};

const COLORS = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000'
};

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

type ShapeType = keyof typeof SHAPES;
type Board = number[][];

interface Piece {
  shape: number[][];
  x: number;
  y: number;
  type: ShapeType;
}

export default function TetrisGame() {
  const [board, setBoard] = useState<Board>(() => 
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0))
  );
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const [gameStarted, setGameStarted] = useState(false);

  const createPiece = useCallback((): Piece => {
    const types = Object.keys(SHAPES) as ShapeType[];
    const type = types[Math.floor(Math.random() * types.length)];
    return {
      shape: SHAPES[type],
      x: Math.floor(BOARD_WIDTH / 2) - 1,
      y: 0,
      type
    };
  }, []);

  const checkCollision = useCallback((piece: Piece, offsetX = 0, offsetY = 0): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + offsetX;
          const newY = piece.y + y + offsetY;
          
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return true;
          }
          
          if (newY >= 0 && board[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }, [board]);

  const mergePiece = useCallback((piece: Piece): Board => {
    const newBoard = board.map(row => [...row]);
    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const boardY = piece.y + y;
          const boardX = piece.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = 1;
          }
        }
      });
    });
    return newBoard;
  }, [board]);

  const clearLines = useCallback((newBoard: Board): { board: Board; linesCleared: number } => {
    let linesCleared = 0;
    const clearedBoard = newBoard.filter(row => {
      if (row.every(cell => cell === 1)) {
        linesCleared++;
        return false;
      }
      return true;
    });
    
    while (clearedBoard.length < BOARD_HEIGHT) {
      clearedBoard.unshift(Array(BOARD_WIDTH).fill(0));
    }
    
    return { board: clearedBoard, linesCleared };
  }, []);

  const movePiece = useCallback((dx: number, dy: number) => {
    if (!currentPiece || gameOver) return;
    
    if (!checkCollision(currentPiece, dx, dy)) {
      setCurrentPiece({ ...currentPiece, x: currentPiece.x + dx, y: currentPiece.y + dy });
    } else if (dy > 0) {
      const merged = mergePiece(currentPiece);
      const { board: clearedBoard, linesCleared } = clearLines(merged);
      setBoard(clearedBoard);
      setScore(prev => prev + linesCleared * 100);
      
      const newPiece = createPiece();
      if (checkCollision(newPiece)) {
        setGameOver(true);
      } else {
        setCurrentPiece(newPiece);
      }
    }
  }, [currentPiece, gameOver, isPaused, checkCollision, mergePiece, clearLines, createPiece]);

  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameOver) return;
    
    const rotated = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map(row => row[i]).reverse()
    );
    
    const rotatedPiece = { ...currentPiece, shape: rotated };
    if (!checkCollision(rotatedPiece)) {
      setCurrentPiece(rotatedPiece);
    }
  }, [currentPiece, gameOver, isPaused, checkCollision]);

  const dropPiece = useCallback(() => {
    if (!currentPiece || gameOver) return;
    
    let newY = currentPiece.y;
    while (!checkCollision(currentPiece, 0, newY - currentPiece.y + 1)) {
      newY++;
    }
    
    const droppedPiece = { ...currentPiece, y: newY };
    const merged = mergePiece(droppedPiece);
    const { board: clearedBoard, linesCleared } = clearLines(merged);
    setBoard(clearedBoard);
    setScore(prev => prev + linesCleared * 100 + 10);
    
    const newPiece = createPiece();
    if (checkCollision(newPiece)) {
      setGameOver(true);
    } else {
      setCurrentPiece(newPiece);
    }
  }, [currentPiece, gameOver, isPaused, checkCollision, mergePiece, clearLines, createPiece]);

  const startGame = useCallback(() => {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0)));
    setCurrentPiece(createPiece());
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  }, [createPiece]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          movePiece(0, 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotatePiece();
          break;
        case ' ':
          e.preventDefault();
          dropPiece();
          break;

      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, movePiece, rotatePiece, dropPiece]);

  useEffect(() => {
    if (!gameStarted || gameOver || !currentPiece) return;
    
    const interval = setInterval(() => {
      movePiece(0, 1);
    }, 500);
    
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, currentPiece, movePiece]);

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    if (currentPiece) {
      currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            const boardY = currentPiece.y + y;
            const boardX = currentPiece.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = 2;
            }
          }
        });
      });
    }
    
    return displayBoard;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-5xl font-bold text-white text-center mb-8 drop-shadow-lg">
          Tetris
        </h1>
        
        <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
          {/* Game Board */}
          <div className="relative">
            <div 
              className="grid gap-[1px] bg-gray-800 p-2 rounded-lg shadow-2xl"
              style={{
                gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
                width: 'min(400px, 90vw)',
                aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}`
              }}
            >
              {renderBoard().map((row, y) =>
                row.map((cell, x) => (
                  <div
                    key={`${y}-${x}`}
                    className="aspect-square rounded-sm transition-colors"
                    style={{
                      backgroundColor: cell === 2 && currentPiece
                        ? COLORS[currentPiece.type]
                        : cell === 1
                        ? '#4a5568'
                        : '#1a202c'
                    }}
                  />
                ))
              )}
            </div>
            
            {(gameOver || !gameStarted) && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  {gameOver && (
                    <>
                      <h2 className="text-4xl font-bold text-white mb-4">Game Over!</h2>
                      <p className="text-2xl text-white mb-6">Score: {score}</p>
                    </>
                  )}

                  {!gameStarted && (
                    <h2 className="text-3xl font-bold text-white mb-4">Press Start to Play</h2>
                  )}
                  <button
                    onClick={startGame}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                  >
                    {gameOver ? 'Play Again' : 'Start Game'}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Controls & Info */}
          <div className="text-white space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-2">Score</h3>
              <p className="text-4xl font-bold text-yellow-400">{score}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Controls</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-bold">←/→</span> Move</p>
                <p><span className="font-bold">↑</span> Rotate</p>
                <p><span className="font-bold">↓</span> Soft Drop</p>
                <p><span className="font-bold">Space</span> Hard Drop</p>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}


