import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Dice6, Bomb, Gem, Rocket } from "lucide-react";

interface BetData {
  id: string;
  username: string;
  game: string;
  amount: number;
  multiplier: number;
  profit: number;
  timestamp: Date;
  isWin: boolean;
}

export default function LiveBettingFeed() {
  const [liveBets, setLiveBets] = useState<BetData[]>([]);

  const { data: recentSessions } = useQuery({
    queryKey: ["/api/live/sessions"],
    refetchInterval: 5000,
  });

  useEffect(() => {
    // Simulate live betting feed
    const generateRandomBet = (): BetData => {
      const games = ["Plinko", "Crash", "Dice", "Mines", "Limbo"];
      const usernames = [
        "CryptoKing", "LuckyPlayer", "HighRoller", "DiamondHands", "MoonShot",
        "BigWinner", "SlotMaster", "CrashLord", "DiceKing", "GemHunter",
        "StakePro", "CasinoAce", "BetMaster", "FortuneSeeker", "WinStreak"
      ];
      
      const game = games[Math.floor(Math.random() * games.length)];
      const amount = Math.random() * 1000 + 1;
      const isWin = Math.random() > 0.4;
      const multiplier = isWin ? Math.random() * 50 + 1 : 0;
      const profit = isWin ? amount * multiplier - amount : -amount;
      
      return {
        id: Date.now().toString() + Math.random(),
        username: usernames[Math.floor(Math.random() * usernames.length)],
        game,
        amount,
        multiplier,
        profit,
        timestamp: new Date(),
        isWin
      };
    };

    const interval = setInterval(() => {
      const newBet = generateRandomBet();
      setLiveBets(prev => [newBet, ...prev.slice(0, 49)]); // Keep last 50 bets
    }, 2000 + Math.random() * 3000); // Random interval 2-5 seconds

    // Initial bets
    const initialBets = Array.from({ length: 20 }, () => {
      const bet = generateRandomBet();
      bet.timestamp = new Date(Date.now() - Math.random() * 600000); // Random time in last 10 minutes
      return bet;
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    setLiveBets(initialBets);

    return () => clearInterval(interval);
  }, []);

  const getGameIcon = (game: string) => {
    switch (game) {
      case "Plinko":
        return <Gem className="w-4 h-4 text-purple-400" />;
      case "Crash":
        return <Rocket className="w-4 h-4 text-orange-400" />;
      case "Dice":
        return <Dice6 className="w-4 h-4 text-blue-400" />;
      case "Mines":
        return <Bomb className="w-4 h-4 text-red-400" />;
      case "Limbo":
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      default:
        return <Dice6 className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="w-80 bg-stake-secondary rounded-xl h-96">
      <div className="p-4 border-b border-stake-neutral">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Live Bets</h3>
          <Badge variant="outline" className="text-xs">
            {liveBets.length}
          </Badge>
        </div>
      </div>

      <ScrollArea className="h-80 p-4">
        <div className="space-y-3">
          {liveBets.map((bet) => (
            <div 
              key={bet.id}
              className="flex items-center justify-between p-3 bg-stake-dark rounded-lg hover:bg-stake-neutral transition-colors"
            >
              <div className="flex items-center space-x-3">
                {getGameIcon(bet.game)}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-400">
                      {bet.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {bet.game}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatAmount(bet.amount)} • {formatTime(bet.timestamp)}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-sm font-semibold ${
                  bet.isWin ? 'text-green-400' : 'text-red-400'
                }`}>
                  {bet.isWin ? '+' : ''}{formatAmount(bet.profit)}
                </div>
                <div className="text-xs text-gray-400">
                  {bet.multiplier > 0 ? `${bet.multiplier.toFixed(2)}x` : '0x'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}