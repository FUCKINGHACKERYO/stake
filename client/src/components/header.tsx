import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Coins, User, Menu, Plus } from "lucide-react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { data: balance } = useQuery({
    queryKey: ["/api/user/balance"],
  });

  return (
    <header className="sticky top-0 z-50 bg-stake-dark/90 backdrop-blur-lg border-b border-stake-neutral/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-stake-accent to-green-400 rounded-lg flex items-center justify-center">
                <Coins className="w-5 h-5 text-stake-dark font-bold" />
              </div>
              <span className="text-2xl font-bold text-white">Stake</span>
            </div>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-stake-accent font-medium hover:text-green-400 transition-colors">
                Casino
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                Sports
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                Originals
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                Promotions
              </a>
            </nav>
          </div>
          
          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Balance Display */}
            <div className="hidden sm:flex items-center space-x-3 bg-stake-secondary/50 rounded-lg px-4 py-2">
              <div className="text-right">
                <div className="text-xs text-gray-400">Balance</div>
                <div className="text-sm font-semibold text-stake-accent">
                  ${balance?.balance || "0.00"}
                </div>
              </div>
              <Button size="sm" className="bg-stake-accent text-stake-dark hover:bg-green-400">
                <Plus className="w-4 h-4 mr-1" />
                Deposit
              </Button>
            </div>
            
            {/* User Menu */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="bg-stake-secondary hover:bg-stake-neutral">
                <User className="w-4 h-4 text-gray-300" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden bg-stake-secondary hover:bg-stake-neutral"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu className="w-4 h-4 text-gray-300" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
