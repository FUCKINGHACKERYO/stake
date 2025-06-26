import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, Play } from "lucide-react";

interface PlinkoGameProps {
  gameId: number;
}

export default function PlinkoGame({ gameId }: PlinkoGameProps) {
  const [betAmount, setBetAmount] = useState("1.00");
  const [rows, setRows] = useState("16");
  const [risk, setRisk] = useState("low");
  const [isPlaying, setIsPlaying] = useState(false);
  const [ballPath, setBallPath] = useState<number[]>([]);
  const [currentMultiplier, setCurrentMultiplier] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      setCurrentMultiplier(data.result.multiplier);
      setBallPath(data.result.gameData.path);
      animateBall(data.result.gameData.path, data.result.gameData.finalBucket);
      
      toast({
        title: data.message,
        description: `Multiplier: ${data.result.multiplier.toFixed(4)}x | Win: $${data.result.winAmount.toFixed(2)}`,
        variant: data.result.isWin ? "default" : "destructive"
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
      setIsPlaying(false);
    }
  });

  const handleBet = () => {
    if (isPlaying) return;
    
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
    
    setIsPlaying(true);
    setBallPath([]);
    setCurrentMultiplier(null);
    
    placeBetMutation.mutate({
      gameId,
      betAmount,
      gameData: { rows: parseInt(rows), risk }
    });
  };

  const animateBall = (path: number[], finalBucket: number) => {
    setTimeout(() => {
      setIsPlaying(false);
    }, 2000);
  };

  const adjustBet = (multiplier: number) => {
    const newAmount = Math.max(0.01, parseFloat(betAmount) * multiplier);
    setBetAmount(newAmount.toFixed(2));
  };

  const getMultiplierColor = (mult: number) => {
    if (mult >= 100) return "text-yellow-400";
    if (mult >= 10) return "text-orange-400";
    if (mult >= 2) return "text-green-400";
    return "text-gray-400";
  };

  const multipliers = risk === "low" 
    ? [1000, 130, 26, 9, 4, 2, 1.4, 1.1, 1, 1.1, 1.4, 2, 4, 9, 26, 130, 1000]
    : risk === "medium"
    ? [8900, 88, 18, 6, 3, 1.3, 1, 0.5, 0.3, 0.5, 1, 1.3, 3, 6, 18, 88, 8900]
    : [29000, 3900, 130, 26, 10, 5, 2, 1.2, 0.2, 1.2, 2, 5, 10, 26, 130, 3900, 29000];

  return (
    <div className="max-w-6xl mx-auto p-6 bg-stake-secondary rounded-xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2">
          <div className="bg-stake-dark rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Plinko</h2>
              {currentMultiplier && (
                <Badge className={`text-lg font-bold ${getMultiplierColor(currentMultiplier)}`}>
                  {currentMultiplier.toFixed(4)}x
                </Badge>
              )}
            </div>
            
            <div className="bg-stake-neutral rounded-lg p-6 h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="text-white mb-4">
                  {isPlaying ? "Ball is dropping..." : "Ready to play"}
                </div>
                <div className="text-stake-accent">
                  Rows: {rows} | Risk: {risk}
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-17 gap-1">
              {multipliers.map((mult, index) => (
                <div
                  key={index}
                  className={`text-center py-1 px-1 rounded text-xs font-semibold ${getMultiplierColor(mult)} bg-stake-dark`}
                >
                  {mult}x
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-stake-dark rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Bet Controls</h3>
            
            <div className="space-y-2 mb-4">
              <label className="text-sm text-gray-300">Bet Amount</label>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustBet(0.5)}
                  disabled={isPlaying}
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
                  disabled={isPlaying}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustBet(2)}
                  disabled={isPlaying}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <label className="text-sm text-gray-300">Rows</label>
              <Select value={rows} onValueChange={setRows} disabled={isPlaying}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8 Rows</SelectItem>
                  <SelectItem value="12">12 Rows</SelectItem>
                  <SelectItem value="16">16 Rows</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 mb-6">
              <label className="text-sm text-gray-300">Risk</label>
              <Select value={risk} onValueChange={setRisk} disabled={isPlaying}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mb-4 p-3 bg-stake-neutral rounded-lg">
              <div className="text-sm text-gray-400">Balance</div>
              <div className="text-lg font-semibold text-stake-accent">
                ${balance?.balance || "0.00"}
              </div>
            </div>

            <Button
              onClick={handleBet}
              disabled={isPlaying || placeBetMutation.isPending}
              className="w-full bg-stake-accent hover:bg-green-400 text-stake-dark font-semibold py-3"
            >
              {isPlaying ? (
                "Ball Dropping..."
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Drop Ball
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}