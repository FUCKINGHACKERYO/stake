import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import EnhancedPlinkoGame from "@/components/games/enhanced-plinko";
import EnhancedCrashGame from "@/components/games/enhanced-crash";
import SlotGame from "@/components/games/slot-game";
import DiceGame from "@/components/games/dice-game";
import MinesGame from "@/components/games/mines-game";
import PlinkoGame from "@/components/games/plinko-game";
import CrashGame from "@/components/games/crash-game";
import type { Game } from "@/types/game";

interface GameLauncherProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function GameLauncher({ game, isOpen, onClose }: GameLauncherProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!game) return null;

  const renderGameComponent = () => {
    switch (game.subcategory) {
      case "plinko":
        return <EnhancedPlinkoGame gameId={game.id} />;
      case "crash":
        return <EnhancedCrashGame gameId={game.id} />;
      case "dice":
        return <DiceGame gameId={game.id} />;
      case "mines":
        return <MinesGame gameId={game.id} />;
      case "limbo":
        return <LimboGame gameId={game.id} />;
      case "video_slots":
        return <SlotGame gameId={game.id} gameName={game.name} />;
      default:
        return <DefaultGame game={game} />;
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`bg-stake-dark border-stake-neutral ${
          isFullscreen ? 'max-w-full w-full h-full m-0 rounded-none' : 'max-w-7xl w-full max-h-[90vh]'
        }`}
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-2xl font-bold text-white flex items-center">
            {game.name}
            <span className="ml-3 text-sm text-gray-400 font-normal">
              by {game.provider}
            </span>
          </DialogTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-gray-400 hover:text-white"
            >
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          {renderGameComponent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Limbo Game Component
function LimboGame({ gameId }: { gameId: number }) {
  const [betAmount, setBetAmount] = useState("1.00");
  const [target, setTarget] = useState("2.00");
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-stake-secondary rounded-xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-stake-dark rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Limbo</h2>
            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-stake-accent mb-4">
                {lastResult ? `${lastResult.toFixed(2)}x` : "?.??x"}
              </div>
              <div className="text-lg text-gray-400">
                Target: {target}x
              </div>
            </div>
            <div className="bg-stake-neutral rounded-lg h-40 flex items-center justify-center">
              <div className="text-center">
                <div className="text-white">
                  {isPlaying ? "Calculating result..." : "Ready to play"}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-stake-dark rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Bet Controls</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300">Bet Amount</label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="w-full mt-1 p-2 bg-stake-neutral text-white rounded"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Target Multiplier</label>
                <input
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full mt-1 p-2 bg-stake-neutral text-white rounded"
                />
              </div>
              <Button className="w-full bg-stake-accent hover:bg-green-400 text-stake-dark">
                Bet
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Default Game Component for unsupported games
function DefaultGame({ game }: { game: Game }) {
  return (
    <div className="max-w-6xl mx-auto p-6 bg-stake-secondary rounded-xl">
      <div className="text-center py-12">
        <h2 className="text-3xl font-bold text-white mb-4">{game.name}</h2>
        <p className="text-gray-400 mb-6">{game.description}</p>
        <div className="bg-stake-dark rounded-xl p-8 max-w-md mx-auto">
          <div className="mb-4">
            <div className="text-sm text-gray-400">Provider</div>
            <div className="text-white font-semibold">{game.provider}</div>
          </div>
          <div className="mb-4">
            <div className="text-sm text-gray-400">RTP</div>
            <div className="text-white font-semibold">{game.rtp}%</div>
          </div>
          <div className="mb-4">
            <div className="text-sm text-gray-400">Volatility</div>
            <div className="text-white font-semibold capitalize">{game.volatility}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-sm text-gray-400">Min Bet</div>
              <div className="text-white font-semibold">${game.minBet}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Max Bet</div>
              <div className="text-white font-semibold">${game.maxBet}</div>
            </div>
          </div>
          <Button className="w-full bg-stake-accent hover:bg-green-400 text-stake-dark">
            Play Now
          </Button>
        </div>
      </div>
    </div>
  );
}