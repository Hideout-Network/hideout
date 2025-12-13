import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Reply } from "lucide-react";
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
  reply_to_id?: number;
  reply_to_username?: string;
  reply_to_message?: string;
}

interface ReplyingTo {
  id: number;
  username: string;
  message: string;
}

export const GlobalChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState("");
  const [isSettingUsername, setIsSettingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
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
      // Fetch latest 100 messages by ordering descending then reversing
      const { data, error } = await supabase
        .from("global_chat")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      // Reverse to show oldest first in the UI
      setMessages((data || []).reverse());
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
    if (!newMessage.trim() || !username) return;
    
    if (!supabase) {
      toast.error("Chat service unavailable");
      return;
    }

    // Validate message locally
    const validation = validateMessage(newMessage);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setIsLoading(true);

    try {
      console.log("Sending message:", { username, message: newMessage.trim(), replyingTo });
      
      const messageData: any = {
        username,
        message: newMessage.trim(),
        source: "website",
      };

      // Add reply data if replying
      if (replyingTo) {
        messageData.reply_to_id = replyingTo.id;
        messageData.reply_to_username = replyingTo.username;
        messageData.reply_to_message = replyingTo.message.substring(0, 100); // Limit reply preview
      }

      const { data, error } = await supabase.from("global_chat").insert(messageData).select();

      if (error) {
        console.error("Error sending message:", error);
        toast.error(`Failed to send: ${error.message}`);
        return;
      }

      console.log("Message sent successfully:", data);
      // Record successfully sent message for spam detection
      setLastMessage(newMessage.trim());
      setNewMessage("");
      setReplyingTo(null); // Clear reply state
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = (msg: ChatMessage) => {
    setReplyingTo({
      id: msg.id,
      username: msg.username,
      message: msg.message,
    });
  };

  const cancelReply = () => {
    setReplyingTo(null);
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

  const isOwnMessage = (msgUsername: string) => {
    return msgUsername.toLowerCase() === username.toLowerCase();
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 rounded-full w-14 h-14 shadow-lg z-[9999]"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {isOpen && (
        <div className="fixed bottom-20 left-4 w-[28rem] md:w-[32rem] max-w-[calc(100vw-2rem)] h-[calc(100vh-6rem)] max-h-[600px] bg-background border border-border rounded-lg shadow-xl flex flex-col z-[9999]">
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
                    messages.map((msg) => {
                      const isOwn = isOwnMessage(msg.username);
                      const isHighlighted = replyingTo?.id === msg.id;
                      
                      return (
                        <div 
                          key={msg.id} 
                          className={`text-sm relative group ${isOwn ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}
                          onMouseEnter={() => setHoveredMessageId(msg.id)}
                          onMouseLeave={() => setHoveredMessageId(null)}
                        >
                          {/* Reply reference */}
                          {msg.reply_to_username && msg.reply_to_message && (
                            <div className={`text-xs text-muted-foreground mb-1 flex items-center gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <Reply className="w-3 h-3" />
                              <span>replied to <span className="font-semibold">{msg.reply_to_username}</span>:</span>
                              <span className="truncate max-w-[150px] opacity-70">{msg.reply_to_message}</span>
                            </div>
                          )}
                          
                          <div 
                            className={`relative max-w-[85%] min-w-[80px] px-3 py-2 rounded-lg transition-colors ${
                              isHighlighted 
                                ? 'bg-primary/20 ring-2 ring-primary' 
                                : isOwn 
                                  ? 'bg-primary' 
                                  : 'bg-muted'
                            }`}
                          >
                            <div className={`flex items-center gap-1 flex-wrap ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <span className={`font-semibold whitespace-nowrap ${isOwn ? 'text-primary-foreground' : 'text-foreground'}`}>
                                {msg.username}
                              </span>
                              {getSourceBadge(msg.source)}
                              <span className={`text-xs whitespace-nowrap ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {formatTime(msg.created_at)}
                              </span>
                            </div>
                            <p className={`break-words ${isOwn ? 'text-primary-foreground text-right' : 'text-foreground/90'}`}>
                              {msg.message}
                            </p>
                            
                            {/* Reply button on hover */}
                            {hoveredMessageId === msg.id && (
                              <button
                                onClick={() => handleReply(msg)}
                                className={`absolute top-1/2 -translate-y-1/2 p-1 rounded hover:bg-background/20 transition-colors ${
                                  isOwn ? '-left-8' : '-right-8'
                                }`}
                                title="Reply"
                              >
                                <Reply className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border">
                {/* Reply indicator */}
                {replyingTo && (
                  <div className="flex items-center justify-between mb-2 px-2 py-1.5 bg-muted rounded-lg text-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Reply className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">Replying to</span>
                      <span className="font-semibold text-foreground">{replyingTo.username}</span>
                      <span className="text-muted-foreground truncate">{replyingTo.message}</span>
                    </div>
                    <button
                      onClick={cancelReply}
                      className="p-1 hover:bg-background rounded transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={replyingTo ? `Reply to ${replyingTo.username}...` : "Type a message..."}
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
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                  Chatting as <span className="font-semibold">{username}</span>
                  <button
                    onClick={() => {
                      setTempUsername(username);
                      setUsername("");
                      setIsSettingUsername(true);
                    }}
                    className="text-primary hover:underline"
                  >
                    Change
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};