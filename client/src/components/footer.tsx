import { Coins } from "lucide-react";
import { FaTwitter, FaDiscord, FaTelegram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-stake-secondary/50 border-t border-stake-neutral/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-stake-accent to-green-400 rounded-lg flex items-center justify-center">
                <Coins className="w-5 h-5 text-stake-dark font-bold" />
              </div>
              <span className="text-2xl font-bold text-white">Stake</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              The world's leading cryptocurrency casino and sports betting platform.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-stake-accent transition-colors">
                <FaTwitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-stake-accent transition-colors">
                <FaDiscord className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-stake-accent transition-colors">
                <FaTelegram className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Casino</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Slots</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Live Casino</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Table Games</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Stake Originals</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Responsible Gaming</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">About</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Affiliate Program</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-stake-neutral/20 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © 2024 Stake. All rights reserved. | 18+ | Play Responsibly
          </p>
          <div className="flex items-center space-x-4">
            <div className="bg-gray-600 text-white text-xs px-3 py-1 rounded font-medium">18+</div>
            <div className="bg-stake-accent text-stake-dark text-xs px-3 py-1 rounded font-bold">SAFE GAMING</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
