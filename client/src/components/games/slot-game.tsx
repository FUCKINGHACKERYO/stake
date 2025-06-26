import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Zap, Crown, Star, Play, Pause, Volume2, VolumeX } from "lucide-react";

interface SlotGameProps {
  gameId: number;
  gameName: string;
}

interface SlotReel {
  symbols: string[];
  position: number;
  isSpinning: boolean;
  speed: number;
}

interface WinLine {
  line: number;
  symbols: string[];
  multiplier: number;
  payout: number;
}

export default function SlotGame({ gameId, gameName }: SlotGameProps) {
  const [betAmount, setBetAmount] = useState("1.00");
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState<SlotReel[]>([]);
  const [winLines, setWinLines] = useState<WinLine[]>([]);
  const [totalWin, setTotalWin] = useState(0);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [autoSpins, setAutoSpins] = useState(10);
  const [currentAutoSpin, setCurrentAutoSpin] = useState(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [totalProfit, setTotalProfit] = useState(0);
  const [gameStats, setGameStats] = useState({
    totalSpins: 0,
    totalWins: 0,
    biggestWin: 0,
    winFrequency: 0
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioRef = useRef<HTMLAudioElement>();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: balance } = useQuery<{ balance: string; currency?: string }>({
    queryKey: ["/api/user/balance"],
  });

  // Slot symbols based on game type
  const getGameSymbols = useCallback(() => {
    const symbolSets: { [key: string]: string[] } = {
      "Gates of Olympus": ["⚡", "🔱", "👑", "💎", "🏛️", "⚜️", "💰", "🎭", "🌟"],
      "Sweet Bonanza": ["🍭", "🍌", "🍇", "🍎", "🍑", "💎", "🍯", "🧁", "🌈"],
      default: ["🍒", "🍋", "🍊", "🔔", "⭐", "💎", "7️⃣", "🎰", "💰"]
    };
    return symbolSets[gameName] || symbolSets.default;
  }, [gameName]);

  // Initialize reels
  useEffect(() => {
    const symbols = getGameSymbols();
    const initialReels: SlotReel[] = Array(5).fill(0).map(() => ({
      symbols: Array(100).fill(0).map(() => symbols[Math.floor(Math.random() * symbols.length)]),
      position: 0,
      isSpinning: false,
      speed: 0
    }));
    setReels(initialReels);
  }, [getGameSymbols]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 400;

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = '#0f0f0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw reel backgrounds
      const reelWidth = canvas.width / 5;
      const symbolHeight = canvas.height / 3;

      reels.forEach((reel, reelIndex) => {
        const x = reelIndex * reelWidth;
        
        // Reel background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x + 2, 0, reelWidth - 4, canvas.height);
        
        // Draw visible symbols (3 per reel)
        for (let i = 0; i < 3; i++) {
          const symbolIndex = Math.floor(reel.position + i) % reel.symbols.length;
          const symbol = reel.symbols[symbolIndex];
          const y = i * symbolHeight + (reel.position % 1) * symbolHeight;
          
          // Symbol background
          ctx.fillStyle = winLines.some(line => 
            line.symbols.includes(symbol) && reelIndex < line.symbols.length
          ) ? '#00d4aa' : '#2a2a2a';
          ctx.fillRect(x + 5, y + 5, reelWidth - 10, symbolHeight - 10);
          
          // Symbol
          ctx.font = 'bold 48px Arial';
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(symbol, x + reelWidth / 2, y + symbolHeight / 2);
        }

        // Reel separator
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + reelWidth, 0);
        ctx.lineTo(x + reelWidth, canvas.height);
        ctx.stroke();
      });

      // Draw paylines
      ctx.strokeStyle = '#00d4aa';
      ctx.lineWidth = 3;
      winLines.forEach((winLine, index) => {
        ctx.beginPath();
        ctx.moveTo(10, symbolHeight * (index % 3) + symbolHeight / 2);
        ctx.lineTo(canvas.width - 10, symbolHeight * (index % 3) + symbolHeight / 2);
        ctx.stroke();
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [reels, winLines]);

  // Spin animation
  const spinReels = useCallback(() => {
    setReels(prevReels => 
      prevReels.map((reel, index) => ({
        ...reel,
        isSpinning: true,
        speed: 20 + Math.random() * 10
      }))
    );

    // Stop reels progressively
    reels.forEach((_, index) => {
      setTimeout(() => {
        setReels(prevReels => 
          prevReels.map((reel, reelIndex) => 
            reelIndex === index ? {
              ...reel,
              isSpinning: false,
              speed: 0,
              position: Math.floor(Math.random() * reel.symbols.length)
            } : reel
          )
        );
      }, 1000 + index * 200);
    });
  }, [reels]);

  // Update reel positions during spin
  useEffect(() => {
    if (!reels.some(reel => reel.isSpinning)) return;

    const interval = setInterval(() => {
      setReels(prevReels => 
        prevReels.map(reel => 
          reel.isSpinning ? {
            ...reel,
            position: (reel.position + reel.speed * 0.1) % reel.symbols.length
          } : reel
        )
      );
    }, 16);

    return () => clearInterval(interval);
  }, [reels]);

  // Check for wins
  const checkWins = useCallback(() => {
    if (reels.some(reel => reel.isSpinning)) return;

    const visibleSymbols = reels.map(reel => {
      const pos = Math.floor(reel.position);
      return [
        reel.symbols[pos % reel.symbols.length],
        reel.symbols[(pos + 1) % reel.symbols.length],
        reel.symbols[(pos + 2) % reel.symbols.length]
      ];
    });

    const newWinLines: WinLine[] = [];
    let totalWinAmount = 0;

    // Check horizontal paylines
    for (let line = 0; line < 3; line++) {
      const lineSymbols = visibleSymbols.map(reel => reel[line]);
      const firstSymbol = lineSymbols[0];
      
      // Count consecutive matching symbols from left
      let matchCount = 1;
      for (let i = 1; i < lineSymbols.length; i++) {
        if (lineSymbols[i] === firstSymbol) {
          matchCount++;
        } else {
          break;
        }
      }

      // Win conditions (3+ matching symbols)
      if (matchCount >= 3) {
        const multiplier = getSymbolMultiplier(firstSymbol, matchCount);
        const payout = parseFloat(betAmount) * multiplier;
        
        newWinLines.push({
          line,
          symbols: lineSymbols.slice(0, matchCount),
          multiplier,
          payout
        });
        
        totalWinAmount += payout;
      }
    }

    setWinLines(newWinLines);
    setTotalWin(totalWinAmount);
    
    if (totalWinAmount > 0) {
      setTotalProfit(prev => prev + totalWinAmount - parseFloat(betAmount));
      setGameStats(prev => ({
        ...prev,
        totalWins: prev.totalWins + 1,
        biggestWin: Math.max(prev.biggestWin, totalWinAmount),
        winFrequency: ((prev.totalWins + 1) / (prev.totalSpins + 1)) * 100
      }));

      toast({
        title: "Win!",
        description: `You won $${totalWinAmount.toFixed(2)} on ${newWinLines.length} line${newWinLines.length > 1 ? 's' : ''}!`,
        className: "bg-green-500"
      });

      if (isSoundEnabled) {
        // Play win sound
        playWinSound(totalWinAmount);
      }
    } else {
      setTotalProfit(prev => prev - parseFloat(betAmount));
    }

    setGameStats(prev => ({
      ...prev,
      totalSpins: prev.totalSpins + 1,
      winFrequency: (prev.totalWins / (prev.totalSpins + 1)) * 100
    }));

    setIsSpinning(false);
  }, [reels, betAmount, isSoundEnabled, toast]);

  // Get symbol multiplier
  const getSymbolMultiplier = (symbol: string, count: number) => {
    const multipliers: { [key: string]: number[] } = {
      "💎": [0, 0, 5, 25, 100],
      "👑": [0, 0, 4, 20, 80],
      "⚡": [0, 0, 3, 15, 60],
      "🔱": [0, 0, 3, 15, 60],
      "🍭": [0, 0, 4, 20, 80],
      "7️⃣": [0, 0, 5, 25, 100],
      "🎰": [0, 0, 3, 12, 50],
      "default": [0, 0, 2, 8, 30]
    };
    
    const symbolMultipliers = multipliers[symbol] || multipliers.default;
    return symbolMultipliers[count] || 0;
  };

  // Play win sounds
  const playWinSound = (winAmount: number) => {
    // In a real implementation, you would play actual audio files
    if (winAmount >= parseFloat(betAmount) * 50) {
      console.log("Big win sound!");
    } else if (winAmount >= parseFloat(betAmount) * 10) {
      console.log("Medium win sound!");
    } else {
      console.log("Small win sound!");
    }
  };

  // Check wins when reels stop
  useEffect(() => {
    if (!reels.some(reel => reel.isSpinning)) {
      const timer = setTimeout(checkWins, 500);
      return () => clearTimeout(timer);
    }
  }, [reels, checkWins]);

  const spinMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/bet/place", {
        method: "POST",
        body: JSON.stringify({
          gameId,
          betAmount,
          gameData: { gameType: "slot", gameName }
        }),
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
    },
    onError: (error: any) => {
      toast({
        title: "Spin Failed",
        description: error.message || "Failed to place bet",
        variant: "destructive"
      });
      setIsSpinning(false);
    }
  });

  const handleSpin = () => {
    if (isSpinning) return;
    
    const currentBalance = parseFloat(balance?.balance || "0");
    const bet = parseFloat(betAmount);
    
    if (bet > currentBalance) {
      toast({
        title: "Insufficient Balance",
        description: "Not enough funds to place this bet",
        variant: "destructive"
      });
      return;
    }

    setIsSpinning(true);
    setWinLines([]);
    setTotalWin(0);
    
    spinReels();
    spinMutation.mutate();
  };

  const startAutoSpin = () => {
    if (isAutoMode) {
      setIsAutoMode(false);
      return;
    }
    
    setIsAutoMode(true);
    setCurrentAutoSpin(0);
  };

  // Auto spin logic
  useEffect(() => {
    if (isAutoMode && !isSpinning && currentAutoSpin < autoSpins) {
      const timer = setTimeout(() => {
        handleSpin();
        setCurrentAutoSpin(prev => prev + 1);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    if (currentAutoSpin >= autoSpins) {
      setIsAutoMode(false);
    }
  }, [isAutoMode, isSpinning, currentAutoSpin, autoSpins]);

  return (
    <div className="min-h-screen bg-stake-dark text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Crown className="w-8 h-8 text-yellow-500" />
            <div>
              <h1 className="text-3xl font-bold">{gameName}</h1>
              <p className="text-gray-400">Spin the reels and win big!</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="px-3 py-1">
              <Zap className="w-4 h-4 mr-2" />
              96.50% RTP
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              Balance: ${balance?.balance || "0.00"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-3">
            <Card className="bg-stake-secondary border-stake-neutral">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <span>Slot Machine</span>
                    {totalWin > 0 && (
                      <Badge className="bg-green-500">
                        Win: ${totalWin.toFixed(2)}
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                    >
                      {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    className="w-full border-2 border-yellow-500 rounded-lg"
                    style={{ background: 'linear-gradient(45deg, #1a1a1a 0%, #2a2a2a 100%)' }}
                  />
                  
                  {/* Spin Button Overlay */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <Button
                      onClick={handleSpin}
                      disabled={isSpinning || spinMutation.isPending}
                      size="lg"
                      className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xl px-8 py-4"
                    >
                      {isSpinning ? "SPINNING..." : "SPIN"}
                    </Button>
                  </div>
                </div>

                {/* Win Display */}
                {winLines.length > 0 && (
                  <div className="mt-4 p-4 bg-green-500 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold">🎉 WINNER! 🎉</div>
                      <div className="text-lg">
                        {winLines.length} winning line{winLines.length > 1 ? 's' : ''} - ${totalWin.toFixed(2)}
                      </div>
                      <div className="flex justify-center space-x-4 mt-2">
                        {winLines.map((line, index) => (
                          <div key={index} className="text-sm">
                            Line {line.line + 1}: {line.symbols.join(' ')} = {line.multiplier}x
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Bet Controls */}
            <Card className="bg-stake-secondary border-stake-neutral">
              <CardHeader>
                <CardTitle>Bet Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bet-amount">Bet Amount ($)</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      id="bet-amount"
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      min="0.01"
                      step="0.01"
                      disabled={isSpinning}
                      className="bg-stake-dark border-stake-neutral"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))}
                      disabled={isSpinning}
                      className="px-3"
                    >
                      1/2
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))}
                      disabled={isSpinning}
                      className="px-3"
                    >
                      2x
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleSpin}
                  disabled={isSpinning || spinMutation.isPending}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold"
                  size="lg"
                >
                  {isSpinning ? "Spinning..." : `Spin - $${betAmount}`}
                </Button>
              </CardContent>
            </Card>

            {/* Auto Spin */}
            <Card className="bg-stake-secondary border-stake-neutral">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Auto Spin</span>
                  <Switch
                    checked={isAutoMode}
                    onCheckedChange={startAutoSpin}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Number of Spins</Label>
                  <Input
                    type="number"
                    value={autoSpins}
                    onChange={(e) => setAutoSpins(parseInt(e.target.value) || 10)}
                    min="1"
                    max="100"
                    disabled={isAutoMode}
                    className="bg-stake-dark border-stake-neutral mt-1"
                  />
                </div>
                
                {isAutoMode && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{currentAutoSpin} / {autoSpins}</span>
                    </div>
                    <Progress value={(currentAutoSpin / autoSpins) * 100} className="h-2" />
                  </div>
                )}

                <Button
                  onClick={startAutoSpin}
                  variant={isAutoMode ? "destructive" : "default"}
                  className="w-full"
                  disabled={isSpinning}
                >
                  {isAutoMode ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Stop Auto
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Auto
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Game Statistics */}
            <Card className="bg-stake-secondary border-stake-neutral">
              <CardHeader>
                <CardTitle>Game Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Profit:</span>
                  <span className={`font-semibold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${totalProfit.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Spins:</span>
                  <span>{gameStats.totalSpins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Wins:</span>
                  <span>{gameStats.totalWins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Win Frequency:</span>
                  <span>{gameStats.winFrequency.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Biggest Win:</span>
                  <span className="text-yellow-400 font-semibold">
                    ${gameStats.biggestWin.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}