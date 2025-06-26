import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Settings, Gift, Crown } from "lucide-react";

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  isVip?: boolean;
  isModerator?: boolean;
  amount?: string;
  multiplier?: string;
}

export default function LiveChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Simulate live chat messages
  useEffect(() => {
    const sampleMessages: ChatMessage[] = [
      {
        id: "1",
        username: "cryptoknight",
        message: "Just hit 150x on Crash! 🚀",
        timestamp: new Date(Date.now() - 300000),
        amount: "$50.00",
        multiplier: "150.25x"
      },
      {
        id: "2",
        username: "stakepro",
        message: "Plinko is on fire today",
        timestamp: new Date(Date.now() - 240000),
        isVip: true
      },
      {
        id: "3",
        username: "moderator",
        message: "Welcome to Stake! Remember to gamble responsibly.",
        timestamp: new Date(Date.now() - 180000),
        isModerator: true
      },
      {
        id: "4",
        username: "luckyplayer",
        message: "Anyone know the best Dice strategy?",
        timestamp: new Date(Date.now() - 120000)
      },
      {
        id: "5",
        username: "highroller",
        message: "Big win on Mines! 💎",
        timestamp: new Date(Date.now() - 60000),
        isVip: true,
        amount: "$500.00",
        multiplier: "24.5x"
      }
    ];

    setMessages(sampleMessages);
    setIsConnected(true);

    // Simulate new messages
    const interval = setInterval(() => {
      const randomMessages = [
        "Nice win!",
        "Crash looking good",
        "GL everyone",
        "Anyone playing Plinko?",
        "What's the max bet on Dice?",
        "VIP rain incoming! 🌧️",
        "Loving the new games",
        "Support is amazing here",
        "Best casino ever!",
        "Who's ready for bonus hunt?"
      ];

      const randomUsers = [
        "player123", "cryptoking", "gambler", "slotlover", "dicemaster", 
        "crashfan", "stakefan", "winner", "lucky7", "bigbet"
      ];

      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        username: randomUsers[Math.floor(Math.random() * randomUsers.length)],
        message: randomMessages[Math.floor(Math.random() * randomMessages.length)],
        timestamp: new Date(),
        isVip: Math.random() > 0.8,
        isModerator: Math.random() > 0.95
      };

      setMessages(prev => [...prev, newMsg].slice(-50)); // Keep last 50 messages
    }, 15000 + Math.random() * 30000); // Random interval 15-45 seconds

    return () => clearInterval(interval);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      username: "You",
      message: newMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserBadge = (msg: ChatMessage) => {
    if (msg.isModerator) {
      return <Badge className="bg-red-600 text-white text-xs">MOD</Badge>;
    }
    if (msg.isVip) {
      return <Badge className="bg-yellow-600 text-white text-xs">VIP</Badge>;
    }
    return null;
  };

  return (
    <div className="w-80 bg-stake-secondary rounded-xl flex flex-col h-96">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-stake-neutral">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <h3 className="font-semibold text-white">Live Chat</h3>
          <Badge variant="outline" className="text-xs">
            {messages.length > 0 ? `${Math.floor(Math.random() * 500) + 100}` : '0'}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
            <Gift className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="group">
              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-1 min-w-0">
                  <span className={`text-sm font-medium truncate ${
                    msg.isModerator ? 'text-red-400' : 
                    msg.isVip ? 'text-yellow-400' : 
                    msg.username === 'You' ? 'text-stake-accent' : 'text-blue-400'
                  }`}>
                    {msg.username}
                  </span>
                  {getUserBadge(msg)}
                </div>
                <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              
              <div className="mt-1">
                <p className="text-sm text-gray-300 break-words">
                  {msg.message}
                </p>
                
                {msg.amount && msg.multiplier && (
                  <div className="mt-1 p-2 bg-stake-dark rounded text-xs">
                    <span className="text-stake-accent font-semibold">
                      {msg.amount} → {msg.multiplier}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-stake-neutral">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-stake-dark border-stake-neutral text-white placeholder-gray-400"
            maxLength={200}
          />
          <Button
            onClick={sendMessage}
            size="sm"
            disabled={!newMessage.trim()}
            className="bg-stake-accent hover:bg-green-400 text-stake-dark"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>{newMessage.length}/200</span>
          <div className="flex items-center space-x-2">
            <Crown className="w-3 h-3" />
            <span>VIP for better rewards</span>
          </div>
        </div>
      </div>
    </div>
  );
}