import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-stake-dark via-stake-secondary to-stake-neutral py-16 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        {/* Abstract gaming pattern background */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-stake-accent rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-green-400 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-stake-accent/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            The World's Leading
          </span>
          <br />
          <span className="bg-gradient-to-r from-stake-accent to-green-400 bg-clip-text text-transparent">
            Crypto Casino
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Experience the thrill of online gambling with cryptocurrency. Join millions of players worldwide.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="bg-stake-accent hover:bg-green-400 text-stake-dark px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all"
          >
            Start Playing Now
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="border-2 border-stake-accent text-stake-accent hover:bg-stake-accent hover:text-stake-dark px-8 py-4 text-lg font-semibold transition-all"
          >
            Explore Games
          </Button>
        </div>
      </div>
    </section>
  );
}
