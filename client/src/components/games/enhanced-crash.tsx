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
import { TrendingUp, Zap, AlertTriangle, Play, Pause } from "lucide-react";

interface CrashGameProps {
  gameId: number;
}

interface BetData {
  amount: number;
  autoCashout: number | null;
  isActive: boolean;
  cashedOut: boolean;
  multiplier: number;
  profit: number;
}

interface CrashHistory {
  multiplier: number;
  timestamp: Date;
}

export default function EnhancedCrashGame({ gameId }: CrashGameProps) {
  const [betAmount, setBetAmount] = useState("1.00");
  const [autoCashout, setAutoCashout] = useState("2.00");
  const [useAutoCashout, setUseAutoCashout] = useState(true);
  const [currentBet, setCurrentBet] = useState<BetData | null>(null);
  const [gameState, setGameState] = useState<'waiting' | 'rising' | 'crashed'>('waiting');
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [timeToNextRound, setTimeToNextRound] = useState(0);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [autoBets, setAutoBets] = useState(10);
  const [currentAutoBet, setCurrentAutoBet] = useState(0);
  const [history, setHistory] = useState<CrashHistory[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gameTimerRef = useRef<NodeJS.Timeout>();
  const websocketRef = useRef<WebSocket>();

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
    websocketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'crash_update') {
          setCurrentMultiplier(parseFloat(data.multiplier));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  // Generate realistic crash point using Stake's algorithm
  const generateCrashPoint = useCallback(() => {
    const random = Math.random();
    
    // Stake's crash distribution (approximate)
    if (random < 0.33) return 1 + Math.random() * 0.99; // 1.00x - 1.99x (33%)
    if (random < 0.66) return 2 + Math.random() * 3; // 2.00x - 5.00x (33%)
    if (random < 0.90) return 5 + Math.random() * 15; // 5.00x - 20.00x (24%)
    if (random < 0.99) return 20 + Math.random() * 80; // 20.00x - 100.00x (9%)
    return 100 + Math.random() * 900; // 100.00x - 1000.00x (1%)
  }, []);

  // Game loop
  useEffect(() => {
    const startNewRound = () => {
      const newCrashPoint = generateCrashPoint();
      setCrashPoint(newCrashPoint);
      setGameState('waiting');
      setCurrentMultiplier(1.00);
      setTimeToNextRound(5);

      // Countdown timer
      const countdown = setInterval(() => {
        setTimeToNextRound(prev => {
          if (prev <= 1) {
            clearInterval(countdown);
            setGameState('rising');
            startMultiplierRise(newCrashPoint);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const startMultiplierRise = (crashPoint: number) => {
      const startTime = Date.now();
      const baseSpeed = 0.001;
      
      const rise = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / 1000;
        
        // Exponential growth formula similar to Stake
        const multiplier = Math.min(
          Math.pow(1.0024, elapsed / 10), 
          crashPoint
        );
        
        setCurrentMultiplier(multiplier);

        // Check for auto-cashout
        if (currentBet && !currentBet.cashedOut && useAutoCashout) {
          const autoCashoutValue = parseFloat(autoCashout);
          if (multiplier >= autoCashoutValue) {
            cashOut(true);
          }
        }

        if (multiplier >= crashPoint) {
          setGameState('crashed');
          setHistory(prev => [{ multiplier: crashPoint, timestamp: new Date() }, ...prev.slice(0, 19)]);
          
          // Handle bet loss if not cashed out
          if (currentBet && !currentBet.cashedOut) {
            setCurrentBet(prev => prev ? { ...prev, isActive: false } : null);
            setTotalProfit(prev => prev - parseFloat(betAmount));
            toast({
              title: "Crashed!",
              description: `Crashed at ${crashPoint.toFixed(2)}x`,
              variant: "destructive"
            });
          }

          setTimeout(() => {
            startNewRound();
          }, 3000);
          return;
        }

        animationRef.current = requestAnimationFrame(rise);
      };

      rise();
    };

    startNewRound();

    return () => {
      if (gameTimerRef.current) clearTimeout(gameTimerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [generateCrashPoint, currentBet, useAutoCashout, autoCashout, betAmount, toast]);

  // Canvas visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 400;

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = '#0f0f0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * canvas.width;
        const y = (i / 10) * canvas.height;
        
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      if (gameState === 'rising' || gameState === 'crashed') {
        // Draw multiplier curve
        const points: { x: number; y: number }[] = [];
        const maxMultiplier = Math.max(currentMultiplier, 10);
        
        for (let i = 0; i <= currentMultiplier * 100; i++) {
          const mult = 1 + (i / 100);
          const x = (mult - 1) / (maxMultiplier - 1) * canvas.width;
          const y = canvas.height - (mult - 1) / (maxMultiplier - 1) * canvas.height;
          points.push({ x, y });
        }

        // Draw curve with gradient
        if (points.length > 1) {
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
          gradient.addColorStop(0, '#00d4aa');
          gradient.addColorStop(0.7, '#00ff88');
          gradient.addColorStop(1, gameState === 'crashed' ? '#ff4444' : '#ffaa00');

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.stroke();

          // Draw glow effect
          ctx.shadowColor = gameState === 'crashed' ? '#ff4444' : '#00d4aa';
          ctx.shadowBlur = 20;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Draw crash point if crashed
        if (gameState === 'crashed' && crashPoint) {
          ctx.fillStyle = '#ff4444';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`CRASHED AT ${crashPoint.toFixed(2)}x`, canvas.width / 2, canvas.height / 2);
        }
      }

      // Draw current multiplier
      if (gameState === 'rising') {
        ctx.fillStyle = '#00d4aa';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${currentMultiplier.toFixed(2)}x`, canvas.width / 2, 80);
      }

      // Draw waiting state
      if (gameState === 'waiting') {
        ctx.fillStyle = '#666';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Next round in ${timeToNextRound}s`, canvas.width / 2, canvas.height / 2);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, currentMultiplier, timeToNextRound, crashPoint]);

  const placeBetMutation = useMutation({
    mutationFn: async (gameData: any) => {
      const response = await fetch("/api/bet/crash", {
        method: "POST",
        body: JSON.stringify({
          gameId,
          betAmount,
          autoCashout: useAutoCashout ? parseFloat(autoCashout) : null
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
        title: "Bet Failed",
        description: error.message || "Failed to place bet",
        variant: "destructive"
      });
    }
  });

  const placeBet = () => {
    if (gameState !== 'waiting' || currentBet?.isActive) return;
    
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

    setCurrentBet({
      amount: bet,
      autoCashout: useAutoCashout ? parseFloat(autoCashout) : null,
      isActive: true,
      cashedOut: false,
      multiplier: 1.00,
      profit: 0
    });

    placeBetMutation.mutate({});
  };

  const cashOut = (isAuto = false) => {
    if (!currentBet || !currentBet.isActive || currentBet.cashedOut) return;

    const profit = currentBet.amount * currentMultiplier;
    const netProfit = profit - currentBet.amount;
    
    setCurrentBet(prev => prev ? {
      ...prev,
      cashedOut: true,
      isActive: false,
      multiplier: currentMultiplier,
      profit: netProfit
    } : null);

    setTotalProfit(prev => prev + netProfit);

    toast({
      title: isAuto ? "Auto Cashed Out!" : "Cashed Out!",
      description: `${currentMultiplier.toFixed(2)}x - Won $${profit.toFixed(2)}`,
      className: "bg-green-500"
    });
  };

  const startAutoMode = () => {
    if (isAutoMode) {
      setIsAutoMode(false);
      return;
    }
    
    setIsAutoMode(true);
    setCurrentAutoBet(0);
  };

  // Auto betting logic
  useEffect(() => {
    if (isAutoMode && gameState === 'waiting' && !currentBet?.isActive && currentAutoBet < autoBets) {
      const timer = setTimeout(() => {
        placeBet();
        setCurrentAutoBet(prev => prev + 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    if (currentAutoBet >= autoBets) {
      setIsAutoMode(false);
    }
  }, [isAutoMode, gameState, currentBet, currentAutoBet, autoBets]);

  return (
    <div className="min-h-screen bg-stake-dark text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <TrendingUp className="w-8 h-8 text-stake-accent" />
            <div>
              <h1 className="text-3xl font-bold">Crash</h1>
              <p className="text-gray-400">Watch the multiplier soar, but cash out before it crashes!</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="px-3 py-1">
              <Zap className="w-4 h-4 mr-2" />
              99% RTP
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              Balance: ${balance?.balance || "0.00"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Canvas */}
          <div className="lg:col-span-3">
            <Card className="bg-stake-secondary border-stake-neutral">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <span>Live Graph</span>
                    {currentBet?.isActive && (
                      <Badge className="bg-green-500">
                        Bet Active: ${currentBet.amount.toFixed(2)}
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className={`font-semibold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      Total: ${totalProfit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    className="w-full border border-stake-neutral rounded-lg"
                    style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)' }}
                  />
                  
                  {/* Cash Out Button Overlay */}
                  {currentBet?.isActive && !currentBet.cashedOut && gameState === 'rising' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        onClick={() => cashOut()}
                        size="lg"
                        className="bg-red-500 hover:bg-red-400 text-white font-bold text-xl px-8 py-4 animate-pulse"
                      >
                        CASH OUT ${(currentBet.amount * currentMultiplier).toFixed(2)}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Game History */}
            <Card className="bg-stake-secondary border-stake-neutral mt-6">
              <CardHeader>
                <CardTitle>Recent Crashes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {history.map((crash, index) => (
                    <Badge
                      key={index}
                      className={`${
                        crash.multiplier >= 10 ? 'bg-red-500' : 
                        crash.multiplier >= 2 ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}
                    >
                      {crash.multiplier.toFixed(2)}x
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Bet Controls */}
            <Card className="bg-stake-secondary border-stake-neutral">
              <CardHeader>
                <CardTitle>Place Bet</CardTitle>
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
                      disabled={currentBet?.isActive}
                      className="bg-stake-dark border-stake-neutral"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))}
                      disabled={currentBet?.isActive}
                      className="px-3"
                    >
                      1/2
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))}
                      disabled={currentBet?.isActive}
                      className="px-3"
                    >
                      2x
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={useAutoCashout}
                    onCheckedChange={setUseAutoCashout}
                    disabled={currentBet?.isActive}
                  />
                  <Label>Auto Cash Out</Label>
                </div>

                {useAutoCashout && (
                  <div>
                    <Label htmlFor="auto-cashout">Auto Cash Out at</Label>
                    <Input
                      id="auto-cashout"
                      type="number"
                      value={autoCashout}
                      onChange={(e) => setAutoCashout(e.target.value)}
                      min="1.01"
                      step="0.01"
                      disabled={currentBet?.isActive}
                      className="bg-stake-dark border-stake-neutral mt-1"
                    />
                  </div>
                )}

                <Button
                  onClick={placeBet}
                  disabled={gameState !== 'waiting' || currentBet?.isActive || placeBetMutation.isPending}
                  className="w-full bg-stake-accent hover:bg-green-400 text-stake-dark font-semibold"
                  size="lg"
                >
                  {currentBet?.isActive ? "Bet Placed" : 
                   gameState === 'waiting' ? `Bet $${betAmount}` : 
                   "Round in Progress"}
                </Button>
              </CardContent>
            </Card>

            {/* Auto Mode */}
            <Card className="bg-stake-secondary border-stake-neutral">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Auto Bet</span>
                  <Switch
                    checked={isAutoMode}
                    onCheckedChange={startAutoMode}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Number of Bets</Label>
                  <Input
                    type="number"
                    value={autoBets}
                    onChange={(e) => setAutoBets(parseInt(e.target.value) || 10)}
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
                      <span>{currentAutoBet} / {autoBets}</span>
                    </div>
                    <Progress value={(currentAutoBet / autoBets) * 100} className="h-2" />
                  </div>
                )}

                <Button
                  onClick={startAutoMode}
                  variant={isAutoMode ? "destructive" : "default"}
                  className="w-full"
                  disabled={currentBet?.isActive}
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

            {/* Statistics */}
            <Card className="bg-stake-secondary border-stake-neutral">
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Profit:</span>
                  <span className={`font-semibold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${totalProfit.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Game State:</span>
                  <span className="capitalize">{gameState}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Multiplier:</span>
                  <span className="text-stake-accent font-semibold">
                    {currentMultiplier.toFixed(2)}x
                  </span>
                </div>
                {currentBet && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Potential Win:</span>
                    <span className="text-green-400 font-semibold">
                      ${(currentBet.amount * currentMultiplier).toFixed(2)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}