import React, { useState, useCallback, useMemo } from "react";
import { Alert, Button, Text, Heading, Flex, Divider, Icon } from "@hubspot/ui-extensions";
import { hubspot } from "@hubspot/ui-extensions";

hubspot.extend<'crm.record.tab'>(({ context }) => <Extension context={context} />);

const GRID_SIZE = 14;
const MINE_COUNT = 10;

type CellState = {
  isMine: boolean;
  isRevealed: boolean;
  adjacentMines: number;
};

const Extension = ({ context }) => {
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [grid, setGrid] = useState<CellState[][]>([]);

  // Initialize the game grid
  const initializeGrid = useCallback(() => {
    const newGrid: CellState[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE)
          .fill(null)
          .map(() => ({
            isMine: false,
            isRevealed: false,
            adjacentMines: 0,
          }))
      );

    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < MINE_COUNT) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      if (!newGrid[row][col].isMine) {
        newGrid[row][col].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate adjacent mine counts
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (!newGrid[row][col].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const newRow = row + dr;
              const newCol = col + dc;
              if (
                newRow >= 0 &&
                newRow < GRID_SIZE &&
                newCol >= 0 &&
                newCol < GRID_SIZE &&
                newGrid[newRow][newCol].isMine
              ) {
                count++;
              }
            }
          }
          newGrid[row][col].adjacentMines = count;
        }
      }
    }

    return newGrid;
  }, []);

  // Initialize grid on mount
  React.useEffect(() => {
    setGrid(initializeGrid());
    setGameOver(false);
    setGameWon(false);
  }, []);

  // Flood fill to reveal empty cells
  const revealCell = useCallback(
    (row: number, col: number, currentGrid: CellState[][]) => {
      if (
        row < 0 ||
        row >= GRID_SIZE ||
        col < 0 ||
        col >= GRID_SIZE ||
        currentGrid[row][col].isRevealed ||
        currentGrid[row][col].isMine
      ) {
        return;
      }

      currentGrid[row][col].isRevealed = true;

      // If cell has no adjacent mines, reveal neighbors
      if (currentGrid[row][col].adjacentMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            revealCell(row + dr, col + dc, currentGrid);
          }
        }
      }
    },
    []
  );

  // Handle cell click
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (gameOver || gameWon || grid[row][col].isRevealed) {
        return;
      }

      const newGrid = grid.map((r) => r.map((c) => ({ ...c })));

      if (newGrid[row][col].isMine) {
        // Game over - reveal all mines
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (newGrid[r][c].isMine) {
              newGrid[r][c].isRevealed = true;
              
            }
          }
        }
        setGameOver(true);
      } else {
        revealCell(row, col, newGrid);

        // Check win condition
        let revealedCount = 0;
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (newGrid[r][c].isRevealed && !newGrid[r][c].isMine) {
              revealedCount++;
            }
          }
        }

        const totalNonMineCells = GRID_SIZE * GRID_SIZE - MINE_COUNT;
        if (revealedCount === totalNonMineCells) {
          setGameWon(true);
        }
      }

      setGrid(newGrid);
    },
    [grid, gameOver, gameWon, revealCell]
  );

  // Reset game
  const resetGame = useCallback(() => {
    setGrid(initializeGrid());
    setGameOver(false);
    setGameWon(false);
  }, [initializeGrid]);

  // Get button text for a cell
  const getCellText = useCallback((cell: CellState) => {
    if (!cell.isRevealed) {
      return "ㅤ";
    }
    if (cell.isMine) {
      return "💣";
    }
    if (cell.adjacentMines === 0) {
      return "ㅤ";
    }
    return cell.adjacentMines.toString();
  }, []);

  // Get button variant based on cell state
  const getCellVariant = useCallback((cell: CellState) => {
    if (!cell.isRevealed) {
      return "primary" as const;
    }
    if (cell.isMine) {
      return "destructive" as const;
    }
    return "secondary" as const;
  }, []);

  if (grid.length === 0) {
    return <Text>Loading...</Text>;
  }

  return (
    <>
      <Flex direction="column" gap="medium">

        {gameOver && <Alert title="Oh no!" variant="danger">This record has now been deleted. Have a nice day!</Alert>}
        {gameWon && <Alert title="A winner is you!" variant="success">This record is safe for now...</Alert>}

        <Flex direction="column" gap="medium">
          <Button onClick={resetGame} variant="secondary" size="medium">
            <Icon name="robot" size="large" color={gameOver ? "alert" : "success"}/>
          </Button>
        </Flex>

        <Flex direction="column" gap="extra-small">
          {grid.map((row, rowIndex) =>
            <Flex direction="row" gap="extra-small" wrap="nowrap">
            {row.map((cell, colIndex) => (
              <Button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                variant={getCellVariant(cell)}
                size="md"
                disabled={ (!cell.isMine && (cell.isRevealed || gameOver)) || (cell.isMine && gameWon)}
              >
                {getCellText(cell)}
              </Button>
            ))}
            </Flex>
          )}
        </Flex>
      </Flex>
    </>
  );
};
