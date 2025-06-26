import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Trophy, 
  Clock, 
  TrendingUp, 
  Star,
  Play,
  Timer,
  Target
} from "lucide-react";

interface SportEvent {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds: number;
  awayOdds: number;
  drawOdds?: number;
  startTime: Date;
  isLive: boolean;
  score?: { home: number; away: number };
  status: 'upcoming' | 'live' | 'finished';
}

interface SportsBet {
  eventId: string;
  selection: string;
  odds: number;
  stake: number;
}

export default function SportsBetting() {
  const [selectedSport, setSelectedSport] = useState("football");
  const [betSlip, setBetSlip] = useState<SportsBet[]>([]);
  const [stakeAmount, setStakeAmount] = useState("10.00");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock sports events data
  const [sportsEvents, setSportsEvents] = useState<SportEvent[]>([
    {
      id: "1",
      sport: "football",
      league: "Premier League",
      homeTeam: "Manchester City",
      awayTeam: "Liverpool",
      homeOdds: 2.10,
      awayOdds: 3.40,
      drawOdds: 3.20,
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      isLive: false,
      status: 'upcoming'
    },
    {
      id: "2",
      sport: "football",
      league: "Champions League",
      homeTeam: "Real Madrid",
      awayTeam: "Barcelona",
      homeOdds: 1.85,
      awayOdds: 4.20,
      drawOdds: 3.60,
      startTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      isLive: false,
      status: 'upcoming'
    },
    {
      id: "3",
      sport: "football",
      league: "La Liga",
      homeTeam: "Atletico Madrid",
      awayTeam: "Sevilla",
      homeOdds: 1.65,
      awayOdds: 5.20,
      drawOdds: 4.10,
      startTime: new Date(),
      isLive: true,
      score: { home: 1, away: 0 },
      status: 'live'
    },
    {
      id: "4",
      sport: "basketball",
      league: "NBA",
      homeTeam: "Lakers",
      awayTeam: "Warriors",
      homeOdds: 2.30,
      awayOdds: 1.60,
      startTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
      isLive: false,
      status: 'upcoming'
    },
    {
      id: "5",
      sport: "tennis",
      league: "ATP Masters",
      homeTeam: "Djokovic",
      awayTeam: "Nadal",
      homeOdds: 1.45,
      awayOdds: 2.75,
      startTime: new Date(Date.now() + 1 * 60 * 60 * 1000),
      isLive: false,
      status: 'upcoming'
    }
  ]);

  const { data: balance } = useQuery<{ balance: string; currency?: string }>({
    queryKey: ["/api/user/balance"],
  });

  const placeBetMutation = useMutation({
    mutationFn: async (betData: any) => {
      const response = await fetch("/api/sports/bet", {
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
      setBetSlip([]);
      toast({
        title: "Bet Placed!",
        description: "Your sports bet has been placed successfully",
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

  // Simulate live score updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSportsEvents(prev => prev.map(event => {
        if (event.isLive && Math.random() > 0.9) {
          const scoreChange = Math.random() > 0.5 ? 'home' : 'away';
          return {
            ...event,
            score: {
              home: event.score!.home + (scoreChange === 'home' ? 1 : 0),
              away: event.score!.away + (scoreChange === 'away' ? 1 : 0)
            }
          };
        }
        return event;
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const addToBetSlip = (event: SportEvent, selection: string, odds: number) => {
    const newBet: SportsBet = {
      eventId: event.id,
      selection: `${event.homeTeam} vs ${event.awayTeam} - ${selection}`,
      odds,
      stake: parseFloat(stakeAmount)
    };

    setBetSlip(prev => {
      const existing = prev.find(bet => bet.eventId === event.id);
      if (existing) {
        return prev.map(bet => bet.eventId === event.id ? newBet : bet);
      }
      return [...prev, newBet];
    });
  };

  const removeBet = (eventId: string) => {
    setBetSlip(prev => prev.filter(bet => bet.eventId !== eventId));
  };

  const placeBets = () => {
    if (betSlip.length === 0) return;

    const totalStake = betSlip.reduce((sum, bet) => sum + bet.stake, 0);
    const currentBalance = parseFloat(balance?.balance || "0");

    if (totalStake > currentBalance) {
      toast({
        title: "Insufficient Balance",
        description: "Not enough funds to place these bets",
        variant: "destructive"
      });
      return;
    }

    placeBetMutation.mutate({
      bets: betSlip,
      totalStake
    });
  };

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case "football": return <Target className="w-5 h-5" />;
      case "basketball": return <Trophy className="w-5 h-5" />;
      case "tennis": return <Star className="w-5 h-5" />;
      default: return <Trophy className="w-5 h-5" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredEvents = sportsEvents.filter(event => 
    selectedSport === "all" || event.sport === selectedSport
  );

  return (
    <div className="min-h-screen bg-stake-dark text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Sports Betting</h1>
          <p className="text-gray-400">Bet on your favorite sports with the best odds</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sports Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-stake-secondary rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4">Sports</h3>
              <div className="space-y-2">
                {["all", "football", "basketball", "tennis"].map(sport => (
                  <Button
                    key={sport}
                    onClick={() => setSelectedSport(sport)}
                    variant={selectedSport === sport ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      selectedSport === sport 
                        ? "bg-stake-accent text-stake-dark" 
                        : "text-white hover:bg-stake-neutral"
                    }`}
                  >
                    {getSportIcon(sport)}
                    <span className="ml-2 capitalize">{sport}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Bet Slip */}
            <div className="bg-stake-secondary rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-4">Bet Slip ({betSlip.length})</h3>
              
              {betSlip.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No bets selected</p>
              ) : (
                <div className="space-y-4">
                  {betSlip.map((bet, index) => (
                    <div key={index} className="bg-stake-dark rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium">{bet.selection}</div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeBet(bet.eventId)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          ×
                        </Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stake-accent font-semibold">{bet.odds.toFixed(2)}</span>
                        <Input
                          type="number"
                          value={bet.stake}
                          onChange={(e) => {
                            const newStake = parseFloat(e.target.value) || 0;
                            setBetSlip(prev => prev.map((b, i) => 
                              i === index ? { ...b, stake: newStake } : b
                            ));
                          }}
                          className="w-20 h-8 text-xs"
                          min="0.01"
                          step="0.01"
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        To win: ${(bet.stake * bet.odds).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t border-stake-neutral pt-4">
                    <div className="flex justify-between mb-2">
                      <span>Total Stake:</span>
                      <span className="font-semibold">
                        ${betSlip.reduce((sum, bet) => sum + bet.stake, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between mb-4">
                      <span>Potential Win:</span>
                      <span className="font-semibold text-stake-accent">
                        ${betSlip.reduce((sum, bet) => sum + (bet.stake * bet.odds), 0).toFixed(2)}
                      </span>
                    </div>
                    <Button
                      onClick={placeBets}
                      disabled={placeBetMutation.isPending}
                      className="w-full bg-stake-accent hover:bg-green-400 text-stake-dark"
                    >
                      Place Bets
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Events List */}
          <div className="lg:col-span-3">
            <Tabs value={selectedSport === "all" ? "upcoming" : "upcoming"} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-stake-secondary">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="live">Live</TabsTrigger>
                <TabsTrigger value="popular">Popular</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming" className="mt-6">
                <div className="space-y-4">
                  {filteredEvents.filter(event => event.status === 'upcoming').map(event => (
                    <div key={event.id} className="bg-stake-secondary rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {getSportIcon(event.sport)}
                          <div>
                            <div className="font-semibold">{event.league}</div>
                            <div className="text-sm text-gray-400">
                              {formatDate(event.startTime)} at {formatTime(event.startTime)}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(event.startTime)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <Button
                          onClick={() => addToBetSlip(event, event.homeTeam, event.homeOdds)}
                          className="bg-stake-dark hover:bg-stake-neutral text-white p-4 h-auto flex flex-col"
                        >
                          <div className="font-semibold mb-1">{event.homeTeam}</div>
                          <div className="text-stake-accent font-bold">{event.homeOdds.toFixed(2)}</div>
                        </Button>
                        
                        {event.drawOdds && (
                          <Button
                            onClick={() => addToBetSlip(event, "Draw", event.drawOdds!)}
                            className="bg-stake-dark hover:bg-stake-neutral text-white p-4 h-auto flex flex-col"
                          >
                            <div className="font-semibold mb-1">Draw</div>
                            <div className="text-stake-accent font-bold">{event.drawOdds.toFixed(2)}</div>
                          </Button>
                        )}
                        
                        <Button
                          onClick={() => addToBetSlip(event, event.awayTeam, event.awayOdds)}
                          className="bg-stake-dark hover:bg-stake-neutral text-white p-4 h-auto flex flex-col"
                        >
                          <div className="font-semibold mb-1">{event.awayTeam}</div>
                          <div className="text-stake-accent font-bold">{event.awayOdds.toFixed(2)}</div>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="live" className="mt-6">
                <div className="space-y-4">
                  {filteredEvents.filter(event => event.status === 'live').map(event => (
                    <div key={event.id} className="bg-stake-secondary rounded-xl p-6 border-l-4 border-red-500">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Play className="w-4 h-4 text-red-500" />
                            <span className="text-red-500 font-semibold">LIVE</span>
                          </div>
                          <div>
                            <div className="font-semibold">{event.league}</div>
                            <div className="text-sm text-gray-400">
                              {event.homeTeam} {event.score?.home} - {event.score?.away} {event.awayTeam}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {event.score?.home} - {event.score?.away}
                          </div>
                          <div className="text-xs text-gray-400">75'</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <Button
                          onClick={() => addToBetSlip(event, event.homeTeam, event.homeOdds)}
                          className="bg-stake-dark hover:bg-stake-neutral text-white p-4 h-auto flex flex-col"
                        >
                          <div className="font-semibold mb-1">{event.homeTeam}</div>
                          <div className="text-stake-accent font-bold">{event.homeOdds.toFixed(2)}</div>
                        </Button>
                        
                        {event.drawOdds && (
                          <Button
                            onClick={() => addToBetSlip(event, "Draw", event.drawOdds!)}
                            className="bg-stake-dark hover:bg-stake-neutral text-white p-4 h-auto flex flex-col"
                          >
                            <div className="font-semibold mb-1">Draw</div>
                            <div className="text-stake-accent font-bold">{event.drawOdds.toFixed(2)}</div>
                          </Button>
                        )}
                        
                        <Button
                          onClick={() => addToBetSlip(event, event.awayTeam, event.awayOdds)}
                          className="bg-stake-dark hover:bg-stake-neutral text-white p-4 h-auto flex flex-col"
                        >
                          <div className="font-semibold mb-1">{event.awayTeam}</div>
                          <div className="text-stake-accent font-bold">{event.awayOdds.toFixed(2)}</div>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="popular" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEvents.slice(0, 4).map(event => (
                    <div key={event.id} className="bg-gradient-to-r from-stake-secondary to-stake-neutral rounded-xl p-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-stake-accent" />
                        <span className="text-stake-accent font-semibold">Popular</span>
                      </div>
                      <div className="font-semibold mb-2">{event.homeTeam} vs {event.awayTeam}</div>
                      <div className="text-sm text-gray-400 mb-4">{event.league}</div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => addToBetSlip(event, event.homeTeam, event.homeOdds)}
                          className="bg-stake-dark hover:bg-stake-light"
                        >
                          {event.homeOdds.toFixed(2)}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => addToBetSlip(event, event.awayTeam, event.awayOdds)}
                          className="bg-stake-dark hover:bg-stake-light"
                        >
                          {event.awayOdds.toFixed(2)}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}