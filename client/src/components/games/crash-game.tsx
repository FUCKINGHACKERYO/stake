import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Minus, Plus } from "lucide-react";

interface CrashGameProps {
  gameId: number;
}

export default function CrashGame({ gameId }: CrashGameProps) {
  const [betAmount, setBetAmount] = useState("1.00");
  const [autoCashout, setAutoCashout] = useState("2.00");
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [hasBet, setHasBet] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: balance } = useQuery<{ balance: string; currency?: string }>({
    queryKey: ["/api/user/balance"],
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'crash_update') {
        setCurrentMultiplier(parseFloat(data.multiplier));
        
        // Auto cashout logic
        if (hasBet && !cashedOut && parseFloat(data.multiplier) >= parseFloat(autoCashout)) {
          handleCashout();
        }
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [autoCashout, hasBet, cashedOut]);

  // Game simulation
  useEffect(() => {
    if (gameStatus === 'flying') {
      intervalRef.current = setInterval(() => {
        setCurrentMultiplier(prev => {
          const increment = Math.random() * 0.05 + 0.01;
          const newMultiplier = prev + increment;
          
          // Crash probability increases with multiplier
          const crashChance = Math.min(0.1 + (newMultiplier - 1) * 0.01, 0.95);
          if (Math.random() < crashChance) {
            setGameStatus('crashed');
            setCrashPoint(newMultiplier);
            setTimeout(() => {
              setGameStatus('waiting');
              setCurrentMultiplier(1.00);
              setCrashPoint(null);
              setHasBet(false);
              setCashedOut(false);
            }, 3000);
            return newMultiplier;
          }
          
          return newMultiplier;
        });
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [gameStatus]);

  const placeBetMutation = useMutation({
    mutationFn: async (betData: any) => {
      const response = await fetch("/api/bet/crash", {
        method: "POST",
        body: JSON.stringify(betData),
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      setHasBet(true);
      setCashedOut(false);
      toast({
        title: "Bet Placed!",
        description: `$${betAmount} bet placed. Auto cashout at ${autoCashout}x`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
    },
    onError: (error: any) => {
      toast({
        title: "Bet Failed",
        description: error.message || "Failed to place bet",
        variant: "destructive"
      });
    }
  });

  const handleBet = () => {
    if (gameStatus !== 'waiting' || hasBet) return;
    
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
    
    placeBetMutation.mutate({
      gameId,
      betAmount,
      autoCashout: parseFloat(autoCashout)
    });
  };

  const handleCashout = () => {
    if (!hasBet || cashedOut || gameStatus !== 'flying') return;
    
    setCashedOut(true);
    const winAmount = parseFloat(betAmount) * currentMultiplier;
    
    toast({
      title: "Cashed Out!",
      description: `Won $${winAmount.toFixed(2)} at ${currentMultiplier.toFixed(2)}x`,
      variant: "default"
    });
  };

  const startNewGame = () => {
    if (gameStatus === 'waiting') {
      setGameStatus('flying');
      setCurrentMultiplier(1.00);
    }
  };

  const getMultiplierColor = () => {
    if (gameStatus === 'crashed') return "text-red-500";
    if (currentMultiplier >= 10) return "text-yellow-400";
    if (currentMultiplier >= 2) return "text-green-400";
    return "text-stake-accent";
  };

  const adjustBet = (multiplier: number) => {
    const newAmount = Math.max(0.01, parseFloat(betAmount) * multiplier);
    setBetAmount(newAmount.toFixed(2));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-stake-secondary rounded-xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Game Display */}
        <div className="lg:col-span-2">
          <div className="bg-stake-dark rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Crash</h2>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-sm">
                  Game #{Math.floor(Math.random() * 1000000)}
                </Badge>
                {gameStatus === 'waiting' && (
                  <Button 
                    onClick={startNewGame}
                    size="sm"
                    className="bg-stake-accent text-stake-dark"
                  >
                    Start Game
                  </Button>
                )}
              </div>
            </div>
            
            {/* Multiplier Display */}
            <div className="text-center mb-8">
              <div className={`text-8xl font-bold mb-4 ${getMultiplierColor()}`}>
                {gameStatus === 'crashed' && crashPoint 
                  ? `${crashPoint.toFixed(2)}x` 
                  : `${currentMultiplier.toFixed(2)}x`
                }
              </div>
              
              {gameStatus === 'waiting' && (
                <div className="text-gray-400 text-lg">Waiting for next game...</div>
              )}
              
              {gameStatus === 'flying' && (
                <div className="text-stake-accent text-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Flying...
                </div>
              )}
              
              {gameStatus === 'crashed' && (
                <div className="text-red-500 text-lg font-semibold">
                  CRASHED at {crashPoint?.toFixed(2)}x!
                </div>
              )}
            </div>

            {/* Game Visualization */}
            <div className="bg-stake-neutral rounded-lg h-64 p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-stake-dark to-transparent opacity-50"></div>
              
              {/* Crash line visualization */}
              <div className="relative h-full">
                {gameStatus === 'flying' && (
                  <div 
                    className="absolute bottom-0 left-0 bg-gradient-to-r from-stake-accent to-green-400 h-1 transition-all duration-100"
                    style={{ width: `${Math.min((currentMultiplier - 1) * 20, 100)}%` }}
                  ></div>
                )}
                
                {gameStatus === 'crashed' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-red-500 text-6xl font-bold animate-pulse">
                      💥
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Betting Controls */}
        <div className="space-y-4">
          <div className="bg-stake-dark rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Bet Controls</h3>
            
            {/* Bet Amount */}
            <div className="space-y-2 mb-4">
              <label className="text-sm text-gray-300">Bet Amount</label>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustBet(0.5)}
                  disabled={gameStatus === 'flying' || hasBet}
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
                  disabled={gameStatus === 'flying' || hasBet}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustBet(2)}
                  disabled={gameStatus === 'flying' || hasBet}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Auto Cashout */}
            <div className="space-y-2 mb-6">
              <label className="text-sm text-gray-300">Auto Cashout</label>
              <Input
                type="number"
                value={autoCashout}
                onChange={(e) => setAutoCashout(e.target.value)}
                min="1.01"
                step="0.01"
                className="text-center"
                disabled={gameStatus === 'flying'}
              />
            </div>

            {/* Balance */}
            <div className="mb-6 p-3 bg-stake-neutral rounded-lg">
              <div className="text-sm text-gray-400">Balance</div>
              <div className="text-lg font-semibold text-stake-accent">
                ${balance?.balance || "0.00"}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {!hasBet && gameStatus === 'waiting' && (
                <Button
                  onClick={handleBet}
                  disabled={placeBetMutation.isPending}
                  className="w-full bg-stake-accent hover:bg-green-400 text-stake-dark font-semibold py-3"
                >
                  Place Bet
                </Button>
              )}
              
              {hasBet && gameStatus === 'flying' && !cashedOut && (
                <Button
                  onClick={handleCashout}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3"
                >
                  Cashout at {currentMultiplier.toFixed(2)}x
                </Button>
              )}
              
              {hasBet && (cashedOut || gameStatus === 'crashed') && (
                <Button
                  disabled
                  className="w-full bg-gray-600 text-gray-300 font-semibold py-3"
                >
                  {cashedOut ? "Cashed Out" : "Crashed"}
                </Button>
              )}
            </div>
          </div>

          {/* Game Stats */}
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