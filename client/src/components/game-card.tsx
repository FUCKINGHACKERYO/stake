import { Badge } from "@/components/ui/badge";
import { Coins, Gem, Clover, Dice6, Crown, Rocket, Club } from "lucide-react";
import type { Game } from "@/types/game";

const gameIcons = {
  "Gates of Olympus": Coins,
  "Sweet Bonanza": Gem,
  "Crazy Time": Clover,
  "Plinko": Dice6,
  "Book of Dead": Crown,
  "Crash": Rocket,
  "Dice": Dice6,
  "Mines": Gem,
  "Live Blackjack": Club,
  "Live Roulette": Clover,
  "Live Baccarat": Crown,
} as const;

const gameGradients = {
  "Gates of Olympus": "from-purple-600 to-pink-600",
  "Sweet Bonanza": "from-blue-600 to-cyan-600",
  "Crazy Time": "from-green-600 to-emerald-600",
  "Plinko": "from-red-600 to-orange-600",
  "Book of Dead": "from-indigo-600 to-purple-600",
  "Crash": "from-teal-600 to-green-600",
  "Dice": "from-yellow-600 to-orange-600",
  "Mines": "from-gray-600 to-slate-600",
  "Live Blackjack": "from-red-600 to-red-800",
  "Live Roulette": "from-green-600 to-green-800",
  "Live Baccarat": "from-purple-600 to-purple-800",
} as const;

interface GameCardProps {
  game: Game;
  onClick: () => void;
}

export default function GameCard({ game, onClick }: GameCardProps) {
  const Icon = gameIcons[game.name as keyof typeof gameIcons] || Coins;
  const gradient = gameGradients[game.name as keyof typeof gameGradients] || "from-gray-600 to-slate-600";

  return (
    <div 
      className="group bg-stake-secondary rounded-xl overflow-hidden hover:bg-stake-neutral transition-all duration-300 cursor-pointer transform hover:scale-105"
      onClick={onClick}
    >
      <div className={`aspect-square bg-gradient-to-br ${gradient} relative`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-10 h-10 text-white opacity-80" />
        </div>
        {game.isHot && (
          <Badge className="absolute top-2 right-2 bg-stake-accent text-stake-dark text-xs font-medium">
            HOT
          </Badge>
        )}
        {game.isNew && (
          <Badge className="absolute top-2 right-2 bg-yellow-400 text-stake-dark text-xs font-medium">
            NEW
          </Badge>
        )}
        {game.category === "live" && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium flex items-center">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
            LIVE
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm text-white mb-1">{game.name}</h3>
        <p className="text-xs text-gray-400">{game.provider}</p>
      </div>
    </div>
  );
}
