import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Zap, Target, TrendingUp, Play, Pause, RotateCcw } from "lucide-react";

interface PlinkoGameProps {
  gameId: number;
}

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  multiplier: number;
  betAmount: number;
  isActive: boolean;
  trail: { x: number; y: number }[];
}

interface Peg {
  x: number;
  y: number;
  radius: number;
}

export default function EnhancedPlinkoGame({ gameId }: PlinkoGameProps) {
  const [betAmount, setBetAmount] = useState("1.00");
  const [rows, setRows] = useState(16);
  const [risk, setRisk] = useState("low");
  const [balls, setBalls] = useState<Ball[]>([]);
  const [pegs, setPegs] = useState<Peg[]>([]);
  const [multipliers, setMultipliers] = useState<number[]>([]);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [autoBets, setAutoBets] = useState(10);
  const [currentAutoBet, setCurrentAutoBet] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<{ multiplier: number; payout: number } | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const ballIdRef = useRef(0);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: balance } = useQuery<{ balance: string; currency?: string }>({
    queryKey: ["/api/user/balance"],
  });

  // Get risk-based multipliers (authentic Stake.com values)
  const getRiskMultipliers = useCallback((riskLevel: string, rowCount: number) => {
    const multiplierMap: { [key: string]: { [key: number]: number[] } } = {
      low: {
        8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
        12: [8.4, 3, 1.6, 1.1, 1, 0.3, 1, 1.1, 1.6, 3, 8.4],
        16: [16, 9, 2, 1.4, 1.1, 1, 0.5, 0.3, 0.5, 1, 1.1, 1.4, 2, 9, 16]
      },
      medium: {
        8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
        12: [24, 5, 1.8, 1.1, 0.5, 0.3, 0.5, 1.1, 1.8, 5, 24],
        16: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.2, 0.3, 0.6, 1.1, 2, 4, 11, 33]
      },
      high: {
        8: [29, 4, 1.5, 0.2, 0.2, 0.2, 1.5, 4, 29],
        12: [43, 7, 2, 0.4, 0.2, 0.1, 0.2, 0.4, 2, 7, 43],
        16: [58, 15, 7, 2, 0.7, 0.2, 0.1, 0.1, 0.1, 0.2, 0.7, 2, 7, 15, 58]
      }
    };
    return multiplierMap[riskLevel][rowCount] || multiplierMap.low[16];
  }, []);

  // Initialize game board
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 800;

    // Generate pegs
    const newPegs: Peg[] = [];
    const pegRadius = 4;
    const startX = canvas.width / 2;
    const startY = 100;
    const pegSpacing = 35;

    for (let row = 0; row < rows; row++) {
      const pegsInRow = row + 3;
      const rowWidth = (pegsInRow - 1) * pegSpacing;
      const rowStartX = startX - rowWidth / 2;

      for (let col = 0; col < pegsInRow; col++) {
        newPegs.push({
          x: rowStartX + col * pegSpacing,
          y: startY + row * pegSpacing,
          radius: pegRadius
        });
      }
    }

    setPegs(newPegs);
    setMultipliers(getRiskMultipliers(risk, rows));
  }, [rows, risk, getRiskMultipliers]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = '#0f0f0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw pegs with glow effect
      pegs.forEach(peg => {
        const gradient = ctx.createRadialGradient(peg.x, peg.y, 0, peg.x, peg.y, peg.radius * 3);
        gradient.addColorStop(0, '#00d4aa');
        gradient.addColorStop(0.7, '#00a08a');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, peg.radius * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#00d4aa';
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw multiplier slots
      const slotWidth = 45;
      const slotsY = canvas.height - 80;
      const totalSlotsWidth = multipliers.length * slotWidth;
      const slotsStartX = (canvas.width - totalSlotsWidth) / 2;

      multipliers.forEach((multiplier, index) => {
        const x = slotsStartX + index * slotWidth;
        const isHighMultiplier = multiplier >= 10;
        
        // Slot background
        ctx.fillStyle = isHighMultiplier ? '#ff4444' : multiplier >= 2 ? '#ffaa00' : '#444';
        ctx.fillRect(x, slotsY, slotWidth - 2, 60);
        
        // Multiplier text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${multiplier}x`, x + slotWidth / 2, slotsY + 35);
      });

      // Update and draw balls
      setBalls(currentBalls => {
        const updatedBalls = currentBalls.map(ball => {
          if (!ball.isActive) return ball;

          // Physics
          const gravity = 0.3;
          const bounce = 0.7;
          const friction = 0.99;

          ball.vy += gravity;
          ball.x += ball.vx;
          ball.y += ball.vy;

          ball.vx *= friction;

          // Collision with pegs
          pegs.forEach(peg => {
            const dx = ball.x - peg.x;
            const dy = ball.y - peg.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < ball.radius + peg.radius) {
              const angle = Math.atan2(dy, dx);
              const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
              
              ball.vx = Math.cos(angle) * speed * bounce + (Math.random() - 0.5) * 2;
              ball.vy = Math.sin(angle) * speed * bounce;
              
              // Separate from peg
              const overlap = ball.radius + peg.radius - distance;
              ball.x += Math.cos(angle) * overlap;
              ball.y += Math.sin(angle) * overlap;
            }
          });

          // Wall collisions
          if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
            ball.vx = -ball.vx * bounce;
            ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x));
          }

          // Check if ball reached bottom
          if (ball.y > slotsY - 30) {
            const slotIndex = Math.floor((ball.x - slotsStartX) / slotWidth);
            const validIndex = Math.max(0, Math.min(multipliers.length - 1, slotIndex));
            const finalMultiplier = multipliers[validIndex];
            const payout = ball.betAmount * finalMultiplier;
            
            setLastResult({ multiplier: finalMultiplier, payout });
            setTotalProfit(prev => prev + payout - ball.betAmount);
            
            ball.isActive = false;
            
            toast({
              title: `${finalMultiplier}x Multiplier!`,
              description: `Won $${payout.toFixed(2)}`,
              className: finalMultiplier >= 10 ? "bg-red-500" : finalMultiplier >= 2 ? "bg-yellow-500" : "bg-green-500"
            });
          }

          // Update trail
          ball.trail.push({ x: ball.x, y: ball.y });
          if (ball.trail.length > 10) {
            ball.trail.shift();
          }

          return ball;
        });

        // Draw balls and trails
        updatedBalls.forEach(ball => {
          if (!ball.isActive) return;

          // Draw trail
          ball.trail.forEach((point, index) => {
            const alpha = (index + 1) / ball.trail.length;
            ctx.fillStyle = `rgba(0, 212, 170, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, ball.radius * alpha, 0, Math.PI * 2);
            ctx.fill();
          });

          // Draw ball with glow
          const gradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius * 2);
          gradient.addColorStop(0, ball.color);
          gradient.addColorStop(0.7, ball.color);
          gradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius * 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = ball.color;
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
          ctx.fill();
        });

        return updatedBalls.filter(ball => ball.isActive || ball.y > slotsY - 30);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [pegs, multipliers, toast]);

  const placeBetMutation = useMutation({
    mutationFn: async (gameData: any) => {
      const response = await fetch("/api/bet/place", {
        method: "POST",
        body: JSON.stringify({
          gameId,
          betAmount,
          gameData
        }),
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
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

  const dropBall = () => {
    if (isPlaying) return;
    
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

    setIsPlaying(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newBall: Ball = {
      id: ballIdRef.current++,
      x: canvas.width / 2 + (Math.random() - 0.5) * 20,
      y: 50,
      vx: (Math.random() - 0.5) * 2,
      vy: 0,
      radius: 8,
      color: '#00d4aa',
      multiplier: 0,
      betAmount: bet,
      isActive: true,
      trail: []
    };

    setBalls(prev => [...prev, newBall]);
    
    placeBetMutation.mutate({
      rows,
      risk,
      ballId: newBall.id
    });

    setTimeout(() => setIsPlaying(false), 1000);
  };

  const startAutoMode = () => {
    if (isAutoMode) {
      setIsAutoMode(false);
      return;
    }
    
    setIsAutoMode(true);
    setCurrentAutoBet(0);
    
    const autoBetInterval = setInterval(() => {
      setCurrentAutoBet(prev => {
        if (prev >= autoBets - 1 || !isAutoMode) {
          clearInterval(autoBetInterval);
          setIsAutoMode(false);
          return prev;
        }
        
        dropBall();
        return prev + 1;
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-stake-dark text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Target className="w-8 h-8 text-stake-accent" />
            <div>
              <h1 className="text-3xl font-bold">Plinko</h1>
              <p className="text-gray-400">Drop the ball and watch it bounce to fortune!</p>
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
                    <span>Game Board</span>
                    {lastResult && (
                      <Badge 
                        className={`ml-4 ${
                          lastResult.multiplier >= 10 ? 'bg-red-500' : 
                          lastResult.multiplier >= 2 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                      >
                        Last: {lastResult.multiplier}x (${lastResult.payout.toFixed(2)})
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className={`font-semibold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${totalProfit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <canvas
                    ref={canvasRef}
                    className="border border-stake-neutral rounded-lg"
                    style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)' }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Bet Controls */}
            <Card className="bg-stake-secondary border-stake-neutral">
              <CardHeader>
                <CardTitle>Bet Amount</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bet-amount">Amount ($)</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      id="bet-amount"
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      min="0.01"
                      step="0.01"
                      className="bg-stake-dark border-stake-neutral"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))}
                      className="px-3"
                    >
                      1/2
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))}
                      className="px-3"
                    >
                      2x
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Risk Level</Label>
                  <Select value={risk} onValueChange={setRisk}>
                    <SelectTrigger className="bg-stake-dark border-stake-neutral mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Rows</Label>
                  <Select value={rows.toString()} onValueChange={(value) => setRows(parseInt(value))}>
                    <SelectTrigger className="bg-stake-dark border-stake-neutral mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">8 Rows</SelectItem>
                      <SelectItem value="12">12 Rows</SelectItem>
                      <SelectItem value="16">16 Rows</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={dropBall}
                  disabled={isPlaying || placeBetMutation.isPending}
                  className="w-full bg-stake-accent hover:bg-green-400 text-stake-dark font-semibold"
                  size="lg"
                >
                  {isPlaying ? "Dropping..." : "Drop Ball"}
                </Button>
              </CardContent>
            </Card>

            {/* Auto Mode */}
            <Card className="bg-stake-secondary border-stake-neutral">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Auto Mode</span>
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
                  disabled={isPlaying}
                  variant={isAutoMode ? "destructive" : "default"}
                  className="w-full"
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
                  <span className="text-gray-400">Balls Dropped:</span>
                  <span>{ballIdRef.current}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Risk:</span>
                  <span className="capitalize">{risk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Multiplier:</span>
                  <span className="text-stake-accent font-semibold">
                    {Math.max(...multipliers)}x
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