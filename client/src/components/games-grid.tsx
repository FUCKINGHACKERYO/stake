import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Video, Coins, Dice6, Gem, Rocket, Crown } from "lucide-react";
import GameCard from "./game-card";
import GameLauncher from "./game-launcher";
import LiveChat from "./live-chat";
import LiveBettingFeed from "./live-betting-feed";
import type { Game } from "@/types/game";

interface GamesGridProps {
  activeCategory: string;
}

export default function GamesGrid({ activeCategory }: GamesGridProps) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isGameOpen, setIsGameOpen] = useState(false);

  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const filteredGames = games?.filter(game => 
    activeCategory === "all" || game.category === activeCategory
  ) || [];

  const popularGames = games?.slice(0, 6) || [];
  const originalGames = games?.filter(game => game.category === "originals") || [];
  const liveGames = games?.filter(game => game.category === "live") || [];

  const handleGameClick = (game: Game) => {
    setSelectedGame(game);
    setIsGameOpen(true);
  };

  const closeGame = () => {
    setIsGameOpen(false);
    setSelectedGame(null);
  };

  if (isLoading) {
    return (
      <div className="py-12 bg-stake-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">Loading games...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="py-12 bg-stake-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Popular Games Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">Popular Games</h2>
              <Button variant="ghost" className="text-stake-accent hover:text-green-400">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {popularGames.map((game) => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  onClick={() => handleGameClick(game)}
                />
              ))}
            </div>
          </div>

          {/* Stake Originals Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">
                <Star className="w-8 h-8 text-stake-accent mr-3 inline" />
                Stake Originals
              </h2>
              <Button variant="ghost" className="text-stake-accent hover:text-green-400">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {originalGames.map((game) => (
                <div 
                  key={game.id}
                  className="bg-gradient-to-br from-stake-secondary to-stake-neutral rounded-2xl p-6 hover:from-stake-neutral hover:to-stake-light transition-all duration-300 cursor-pointer group"
                  onClick={() => handleGameClick(game)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-stake-accent rounded-xl flex items-center justify-center">
                      {game.name === "Dice" && <Dice6 className="w-6 h-6 text-stake-dark" />}
                      {game.name === "Plinko" && <Gem className="w-6 h-6 text-white" />}
                      {game.name === "Crash" && <Rocket className="w-6 h-6 text-white" />}
                      {game.name === "Mines" && <Crown className="w-6 h-6 text-white" />}
                    </div>
                    <div className="bg-stake-accent/20 text-stake-accent text-xs px-2 py-1 rounded-full font-medium">
                      {game.isNew ? "NEW" : game.isHot ? "HOT" : "ORIGINAL"}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{game.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{game.description}</p>
                  <Button className="w-full bg-stake-accent hover:bg-green-400 text-stake-dark font-semibold group-hover:scale-105 transform transition-all">
                    Play Now
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Live Casino Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">
                <Video className="w-8 h-8 text-red-500 mr-3 inline" />
                Live Casino
              </h2>
              <Button variant="ghost" className="text-stake-accent hover:text-green-400">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveGames.map((game) => (
                <div 
                  key={game.id}
                  className="bg-stake-secondary rounded-2xl overflow-hidden hover:bg-stake-neutral transition-all duration-300 cursor-pointer group"
                  onClick={() => handleGameClick(game)}
                >
                  <div className="relative aspect-video bg-gradient-to-br from-red-600 to-red-800">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-black/30 rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium flex items-center">
                      <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                      LIVE
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      {Math.floor(Math.random() * 500) + 100} players
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-1">{game.name}</h3>
                    <p className="text-sm text-gray-400">{game.provider}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      {/* Live Features Sidebar */}
      <div className="fixed right-4 top-20 space-y-4 z-40 hidden xl:block">
        <LiveChat />
        <LiveBettingFeed />
      </div>
      
      {/* Game Launcher Modal */}
      <GameLauncher 
        game={selectedGame}
        isOpen={isGameOpen}
        onClose={closeGame}
      />
    </>
  );
}
