import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validateMessage, setLastMessage, isUsernameAppropriate } from "@/utils/chatFilter";

interface ChatMessage {
  id: number;
  username: string;
  message: string;
  created_at: string;
  source: string;
}

export const GlobalChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState("");
  const [isSettingUsername, setIsSettingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load username from localStorage
  useEffect(() => {
    const savedUsername = localStorage.getItem("hideout_chat_username");
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  // Fetch messages and subscribe to realtime updates
  useEffect(() => {
    if (!isOpen || !supabase) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("global_chat")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      setMessages(data || []);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel("global_chat_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "global_chat" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSetUsername = () => {
    const trimmed = tempUsername.trim();
    
    const validation = isUsernameAppropriate(trimmed);
    if (!validation.valid) {
      toast.error(validation.reason);
      return;
    }

    localStorage.setItem("hideout_chat_username", trimmed);
    setUsername(trimmed);
    setIsSettingUsername(false);
    setTempUsername("");
    toast.success("Username set!");
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !username || !supabase) return;

    // Validate message locally
    const validation = validateMessage(newMessage);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.from("global_chat").insert({
        username,
        message: newMessage.trim(),
        source: "website",
      });

      if (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
        return;
      }

      // Record successfully sent message for spam detection
      setLastMessage(newMessage.trim());
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    // Parse the UTC timestamp and convert to user's local timezone
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: true 
    });
  };

  const getSourceBadge = (source: string) => {
    if (source === "discord") {
      return (
        <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-[#5865F2] text-white">
          Discord
        </span>
      );
    }
    return null;
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 rounded-full w-14 h-14 shadow-lg z-50"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {isOpen && (
        <div className="fixed bottom-20 left-4 w-96 max-w-[calc(100vw-2rem)] h-[400px] bg-background border border-border rounded-lg shadow-xl flex flex-col z-50">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold">Global Chat</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {!username ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
              {isSettingUsername ? (
                <>
                  <p className="text-sm text-muted-foreground text-center">
                    Choose a username to start chatting
                  </p>
                  <Input
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    placeholder="Enter username..."
                    className="max-w-[200px]"
                    onKeyDown={(e) => e.key === "Enter" && handleSetUsername()}
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsSettingUsername(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSetUsername}>
                      Set Username
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <MessageSquare className="w-12 h-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">
                    Set a username to start chatting
                  </p>
                  <Button onClick={() => setIsSettingUsername(true)}>
                    Set Username
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground">
                      No messages yet. Be the first to say something!
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="text-sm">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="font-semibold text-foreground">
                            {msg.username}
                          </span>
                          {getSourceBadge(msg.source)}
                          <span className="text-xs text-muted-foreground">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                        <p className="text-foreground/90 break-words">
                          {msg.message}
                        </p>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    disabled={isLoading}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={isLoading || !newMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Chatting as <span className="font-semibold">{username}</span>
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
