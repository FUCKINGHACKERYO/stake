import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bomb, Gem, Minus, Plus, RotateCcw } from "lucide-react";

interface MinesGameProps {
  gameId: number;
}

export default function MinesGame({ gameId }: MinesGameProps) {
  const [betAmount, setBetAmount] = useState("1.00");
  const [minesCount, setMinesCount] = useState(3);
  const [gameActive, setGameActive] = useState(false);
  const [revealedCells, setRevealedCells] = useState<number[]>([]);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [gameEnded, setGameEnded] = useState(false);
  const [hitMine, setHitMine] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: balance } = useQuery<{ balance: string; currency?: string }>({
    queryKey: ["/api/user/balance"],
  });

  const placeBetMutation = useMutation({
    mutationFn: async (betData: any) => {
      const response = await fetch("/api/bet/place", {
        method: "POST",
        body: JSON.stringify(betData),
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.result.gameData.revealed.length > 0) {
        setCurrentMultiplier(data.result.multiplier);
        
        toast({
          title: data.result.isWin ? "Safe!" : "Mine Hit!",
          description: `Current multiplier: ${data.result.multiplier.toFixed(4)}x`,
          variant: data.result.isWin ? "default" : "destructive"
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
    },
    onError: (error: any) => {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to process action",
        variant: "destructive"
      });
    }
  });

  const startGame = () => {
    const bet = parseFloat(betAmount);
    const currentBalance = parseFloat(balance?.balance || "0");
    
    if (bet <= 0) {
      toast({
        title: "Invalid Bet",
        description: "Bet amount must be greater than 0",
        variant: "destructive"
      });
      return;
    }
    
    if (bet > currentBalance) {
      toast({
        title: "Insufficient Balance",
        description: "Not enough funds to place this bet",
        variant: "destructive"
      });
      return;
    }
    
    // Generate mine positions
    const positions: number[] = [];
    while (positions.length < minesCount) {
      const pos = Math.floor(Math.random() * 25);
      if (!positions.includes(pos)) {
        positions.push(pos);
      }
    }
    
    setMinePositions(positions);
    setRevealedCells([]);
    setCurrentMultiplier(1);
    setGameActive(true);
    setGameEnded(false);
    setHitMine(false);
    
    toast({
      title: "Game Started!",
      description: `$${betAmount} bet placed. ${minesCount} mines hidden. Good luck!`,
    });
  };

  const revealCell = (cellIndex: number) => {
    if (!gameActive || revealedCells.includes(cellIndex) || gameEnded) return;
    
    const newRevealed = [...revealedCells, cellIndex];
    setRevealedCells(newRevealed);
    
    if (minePositions.includes(cellIndex)) {
      // Hit a mine
      setHitMine(true);
      setGameEnded(true);
      setGameActive(false);
      
      toast({
        title: "BOOM! 💥",
        description: "You hit a mine! Game over.",
        variant: "destructive"
      });
      
      // Reveal all mines
      setTimeout(() => {
        setRevealedCells(prev => [...prev, ...minePositions]);
      }, 500);
      
      return;
    }
    
    // Calculate new multiplier
    const safeCells = 25 - minesCount;
    const revealedSafeCells = newRevealed.length;
    const newMultiplier = calculateMultiplier(revealedSafeCells, minesCount);
    setCurrentMultiplier(newMultiplier);
    
    placeBetMutation.mutate({
      gameId,
      betAmount,
      gameData: { mines: minesCount, revealed: newRevealed }
    });
  };

  const calculateMultiplier = (revealed: number, mines: number) => {
    if (revealed === 0) return 1;
    
    const safeCells = 25 - mines;
    let multiplier = 1;
    
    for (let i = 1; i <= revealed; i++) {
      multiplier *= (safeCells - i + 1) / (25 - i + 1);
    }
    
    return 1 / multiplier * 0.99; // 1% house edge
  };

  const cashout = () => {
    if (!gameActive || revealedCells.length === 0) return;
    
    const winAmount = parseFloat(betAmount) * currentMultiplier;
    setGameEnded(true);
    setGameActive(false);
    
    toast({
      title: "Cashed Out!",
      description: `Won $${winAmount.toFixed(2)} with ${currentMultiplier.toFixed(4)}x multiplier`,
      variant: "default"
    });
  };

  const adjustBet = (multiplier: number) => {
    const newAmount = Math.max(0.01, parseFloat(betAmount) * multiplier);
    setBetAmount(newAmount.toFixed(2));
  };

  const getCellContent = (cellIndex: number) => {
    if (!revealedCells.includes(cellIndex)) {
      return null; // Hidden cell
    }
    
    if (minePositions.includes(cellIndex)) {
      return <Bomb className="w-6 h-6 text-red-500" />;
    }
    
    return <Gem className="w-6 h-6 text-green-400" />;
  };

  const getCellStyle = (cellIndex: number) => {
    const isRevealed = revealedCells.includes(cellIndex);
    const isMine = minePositions.includes(cellIndex);
    
    if (!isRevealed) {
      return "bg-stake-neutral hover:bg-stake-light cursor-pointer transition-colors";
    }
    
    if (isMine) {
      return "bg-red-600";
    }
    
    return "bg-green-600";
  };

  const resetGame = () => {
    setGameActive(false);
    setRevealedCells([]);
    setMinePositions([]);
    setCurrentMultiplier(1);
    setGameEnded(false);
    setHitMine(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-stake-secondary rounded-xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Game Grid */}
        <div className="lg:col-span-2">
          <div className="bg-stake-dark rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Bomb className="w-8 h-8 mr-3 text-red-500" />
                Mines
              </h2>
              <div className="flex items-center space-x-4">
                {gameActive && (
                  <Badge className="bg-green-600">
                    {currentMultiplier.toFixed(4)}x
                  </Badge>
                )}
                <Badge variant="outline">
                  {minesCount} {minesCount === 1 ? 'Mine' : 'Mines'}
                </Badge>
              </div>
            </div>
            
            {/* Mines Grid */}
            <div className="grid grid-cols-5 gap-2 mb-6 max-w-md mx-auto">
              {Array.from({ length: 25 }, (_, index) => (
                <button
                  key={index}
                  onClick={() => revealCell(index)}
                  disabled={!gameActive || revealedCells.includes(index)}
                  className={`aspect-square rounded-lg border-2 border-stake-light flex items-center justify-center text-2xl font-bold transition-all duration-200 ${getCellStyle(index)}`}
                >
                  {getCellContent(index)}
                </button>
              ))}
            </div>
            
            {/* Game Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-stake-neutral rounded-lg p-3">
                <div className="text-gray-400 text-sm">Revealed</div>
                <div className="text-white font-semibold">{revealedCells.length - (hitMine ? minePositions.length : 0)}</div>
              </div>
              <div className="bg-stake-neutral rounded-lg p-3">
                <div className="text-gray-400 text-sm">Multiplier</div>
                <div className="text-stake-accent font-semibold">{currentMultiplier.toFixed(4)}x</div>
              </div>
              <div className="bg-stake-neutral rounded-lg p-3">
                <div className="text-gray-400 text-sm">Potential Win</div>
                <div className="text-white font-semibold">${(parseFloat(betAmount) * currentMultiplier).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="bg-stake-dark rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Game Controls</h3>
            
            {!gameActive && (
              <>
                {/* Bet Amount */}
                <div className="space-y-2 mb-4">
                  <label className="text-sm text-gray-300">Bet Amount</label>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustBet(0.5)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      min="0.01"
                      step="0.01"
                      className="text-center"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustBet(2)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Mines Count */}
                <div className="space-y-2 mb-6">
                  <label className="text-sm text-gray-300">Number of Mines</label>
                  <Select value={minesCount.toString()} onValueChange={(value) => setMinesCount(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'Mine' : 'Mines'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Balance */}
            <div className="mb-4 p-3 bg-stake-neutral rounded-lg">
              <div className="text-sm text-gray-400">Balance</div>
              <div className="text-lg font-semibold text-stake-accent">
                ${balance?.balance || "0.00"}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {!gameActive && !gameEnded && (
                <Button
                  onClick={startGame}
                  className="w-full bg-stake-accent hover:bg-green-400 text-stake-dark font-semibold py-3"
                >
                  Start Game
                </Button>
              )}
              
              {gameActive && revealedCells.length > 0 && !hitMine && (
                <Button
                  onClick={cashout}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3"
                >
                  Cashout ${(parseFloat(betAmount) * currentMultiplier).toFixed(2)}
                </Button>
              )}
              
              {gameEnded && (
                <Button
                  onClick={resetGame}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Game
                </Button>
              )}
            </div>
          </div>

          {/* Game Info */}
          <div className="bg-stake-dark rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Game Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">RTP:</span>
                <span className="text-white">99%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max Multiplier:</span>
                <span className="text-white">1,000,000x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Min Bet:</span>
                <span className="text-white">$0.01</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max Bet:</span>
                <span className="text-white">$1,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}