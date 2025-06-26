import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dice6, Minus, Plus, RotateCcw } from "lucide-react";

interface DiceGameProps {
  gameId: number;
}

export default function DiceGame({ gameId }: DiceGameProps) {
  const [betAmount, setBetAmount] = useState("1.00");
  const [target, setTarget] = useState(50);
  const [isOver, setIsOver] = useState(true);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [rollHistory, setRollHistory] = useState<{ roll: number; win: boolean; multiplier: number }[]>([]);
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
      const { roll, target: rollTarget, isOver: rollIsOver } = data.result.gameData;
      const isWin = data.result.isWin;
      const multiplier = data.result.multiplier;
      
      setLastRoll(roll);
      setRollHistory(prev => [
        { roll, win: isWin, multiplier },
        ...prev.slice(0, 9)
      ]);
      
      toast({
        title: isWin ? "You Won!" : "You Lost",
        description: `Rolled ${roll} (${rollIsOver ? 'over' : 'under'} ${rollTarget}) | ${multiplier.toFixed(4)}x | ${isWin ? '+' : ''}$${data.result.winAmount.toFixed(2)}`,
        variant: isWin ? "default" : "destructive"
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
    },
    onError: (error: any) => {
      toast({
        title: "Bet Failed",
        description: error.message || "Failed to place bet",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsRolling(false);
    }
  });

  const handleRoll = () => {
    if (isRolling) return;
    
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
    
    setIsRolling(true);
    setLastRoll(null);
    
    placeBetMutation.mutate({
      gameId,
      betAmount,
      gameData: { target, isOver }
    });
  };

  const adjustBet = (multiplier: number) => {
    const newAmount = Math.max(0.01, parseFloat(betAmount) * multiplier);
    setBetAmount(newAmount.toFixed(2));
  };

  const calculateWinChance = () => {
    return isOver ? 100 - target : target;
  };

  const calculateMultiplier = () => {
    const chance = calculateWinChance();
    return (100 / chance) * 0.99; // 1% house edge
  };

  const calculatePayout = () => {
    return parseFloat(betAmount) * calculateMultiplier();
  };

  const getDiceColor = (roll: number) => {
    if (!lastRoll) return "text-gray-400";
    
    const wasWin = isOver ? roll > target : roll < target;
    return wasWin ? "text-green-400" : "text-red-400";
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-stake-secondary rounded-xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Game Display */}
        <div className="lg:col-span-2">
          <div className="bg-stake-dark rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Dice6 className="w-8 h-8 mr-3 text-stake-accent" />
                Dice
              </h2>
              <Badge variant="outline" className="text-sm">
                Roll #{rollHistory.length + 1}
              </Badge>
            </div>
            
            {/* Dice Display */}
            <div className="text-center mb-8">
              <div className="relative">
                <div className={`text-8xl font-bold mb-4 ${getDiceColor(lastRoll || 0)} transition-all duration-500 ${isRolling ? 'animate-spin' : ''}`}>
                  {isRolling ? (
                    <Dice6 className="w-24 h-24 mx-auto animate-pulse" />
                  ) : lastRoll ? (
                    lastRoll.toString().padStart(2, '0')
                  ) : (
                    '??'
                  )}
                </div>
                
                {lastRoll && (
                  <div className="text-lg text-gray-400">
                    {isOver ? 'Over' : 'Under'} {target} | 
                    {rollHistory[0]?.win ? ' WIN' : ' LOSE'} | 
                    {rollHistory[0]?.multiplier.toFixed(4)}x
                  </div>
                )}
              </div>
            </div>

            {/* Target Visualization */}
            <div className="bg-stake-neutral rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold">Target: {target}</span>
                <span className="text-stake-accent font-semibold">
                  {isOver ? 'Over' : 'Under'}
                </span>
              </div>
              
              {/* Visual slider */}
              <div className="relative h-8 bg-gray-700 rounded-full mb-4">
                <div 
                  className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                    isOver ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ 
                    width: `${isOver ? 100 - target : target}%`,
                    left: isOver ? `${target}%` : '0%'
                  }}
                ></div>
                <div 
                  className="absolute top-0 w-1 h-full bg-white"
                  style={{ left: `${target}%` }}
                ></div>
                {lastRoll && (
                  <div 
                    className={`absolute top-0 w-2 h-full ${getDiceColor(lastRoll)} border-2 border-current rounded transition-all duration-500`}
                    style={{ left: `${lastRoll}%` }}
                  ></div>
                )}
              </div>
              
              <div className="flex justify-between text-xs text-gray-400">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>

            {/* Roll History */}
            <div className="grid grid-cols-5 gap-2">
              {rollHistory.map((roll, index) => (
                <div 
                  key={index}
                  className={`text-center p-2 rounded text-sm font-semibold ${
                    roll.win ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}
                >
                  {roll.roll}
                </div>
              ))}
              {Array.from({ length: 5 - rollHistory.length }).map((_, index) => (
                <div key={`empty-${index}`} className="text-center p-2 rounded text-sm bg-gray-700 text-gray-500">
                  --
                </div>
              ))}
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
                  disabled={isRolling}
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
                  disabled={isRolling}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustBet(2)}
                  disabled={isRolling}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Target */}
            <div className="space-y-2 mb-4">
              <label className="text-sm text-gray-300">Target</label>
              <Input
                type="number"
                value={target}
                onChange={(e) => setTarget(Math.max(1, Math.min(99, parseInt(e.target.value) || 50)))}
                min="1"
                max="99"
                className="text-center"
                disabled={isRolling}
              />
              <Slider
                value={[target]}
                onValueChange={(value) => setTarget(value[0])}
                min={1}
                max={99}
                step={1}
                className="w-full"
                disabled={isRolling}
              />
            </div>

            {/* Over/Under Toggle */}
            <div className="space-y-2 mb-6">
              <label className="text-sm text-gray-300">Prediction</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setIsOver(false)}
                  variant={!isOver ? "default" : "outline"}
                  disabled={isRolling}
                  className={!isOver ? "bg-red-500 hover:bg-red-600" : ""}
                >
                  Under {target}
                </Button>
                <Button
                  onClick={() => setIsOver(true)}
                  variant={isOver ? "default" : "outline"}
                  disabled={isRolling}
                  className={isOver ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  Over {target}
                </Button>
              </div>
            </div>

            {/* Game Stats */}
            <div className="bg-stake-neutral rounded-lg p-3 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Win Chance:</span>
                <span className="text-white">{calculateWinChance().toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Multiplier:</span>
                <span className="text-stake-accent">{calculateMultiplier().toFixed(4)}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Payout:</span>
                <span className="text-white">${calculatePayout().toFixed(2)}</span>
              </div>
            </div>

            {/* Balance */}
            <div className="mb-4 p-3 bg-stake-neutral rounded-lg">
              <div className="text-sm text-gray-400">Balance</div>
              <div className="text-lg font-semibold text-stake-accent">
                ${balance?.balance || "0.00"}
              </div>
            </div>

            {/* Roll Button */}
            <Button
              onClick={handleRoll}
              disabled={isRolling || placeBetMutation.isPending}
              className="w-full bg-stake-accent hover:bg-green-400 text-stake-dark font-semibold py-3"
            >
              {isRolling ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                  Rolling...
                </>
              ) : (
                <>
                  <Dice6 className="w-4 h-4 mr-2" />
                  Roll Dice
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}