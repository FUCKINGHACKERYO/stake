import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Flame, Coins, Video, Club, Star } from "lucide-react";

const categories = [
  { id: "all", label: "Popular", icon: Flame },
  { id: "slots", label: "Slots", icon: Coins },
  { id: "live", label: "Live Casino", icon: Video },
  { id: "table", label: "Table Games", icon: Club },
  { id: "originals", label: "Stake Originals", icon: Star },
];

interface GameCategoriesProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function GameCategories({ activeCategory, onCategoryChange }: GameCategoriesProps) {
  return (
    <section className="py-8 bg-stake-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-4 justify-center">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            
            return (
              <Button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`px-6 py-3 font-medium transition-colors ${
                  isActive
                    ? "bg-stake-accent text-stake-dark hover:bg-green-400"
                    : "bg-stake-secondary hover:bg-stake-neutral text-white"
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {category.label}
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
