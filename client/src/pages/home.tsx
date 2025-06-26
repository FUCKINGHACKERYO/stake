import { useState } from "react";
import Header from "@/components/header";
import Hero from "@/components/hero";
import GameCategories from "@/components/game-categories";
import GamesGrid from "@/components/games-grid";
import Footer from "@/components/footer";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("all");

  return (
    <div className="min-h-screen bg-stake-dark text-white">
      <Header />
      <Hero />
      <GameCategories 
        activeCategory={activeCategory} 
        onCategoryChange={setActiveCategory} 
      />
      <GamesGrid activeCategory={activeCategory} />
      <Footer />
    </div>
  );
}
