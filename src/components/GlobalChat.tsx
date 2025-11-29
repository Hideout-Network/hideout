import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { EmojiPicker } from "./EmojiPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type ChatMessage = {
  id: number;
  username: string;
  message: string;
  created_at: string;
};

export const GlobalChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState<string | null>(null);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Check if Supabase is configured
  const isChatEnabled = supabase !== null;

  useEffect(() => {
    const saved = localStorage.getItem('hideout_chat_username');
    if (saved) {
      setUsername(saved);
    }
  }, []);

  useEffect(() => {
    if (isOpen && isChatEnabled) {
      if (!username) {
        setShowUsernameDialog(true);
      } else {
        fetchMessages();
        subscribeToMessages();
      }
    }
  }, [isOpen, username, isChatEnabled]);

  const fetchMessages = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await (supabase as any)
        .from('global_chat')
        .select('*')
        .order('id', { ascending: true })
        .limit(100);

      if (!error && data) {
        setMessages(data as ChatMessage[]);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const subscribeToMessages = () => {
    if (!supabase) return;
    const channel = supabase
      .channel('global_chat_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'global_chat'
        },
        async (payload) => {
          const newMsg: ChatMessage = {
            id: payload.new.id,
            username: payload.new.username,
            message: payload.new.message,
            created_at: payload.new.created_at,
          };

          setMessages(prev => {
            const updated = [...prev, newMsg];
            return updated.slice(-100);
          });
          
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSetUsername = () => {
    const cleanUsername = tempUsername.trim().slice(0, 20);
    if (!cleanUsername) {
      toast.error("Please enter a name");
      return;
    }
    
    const slurs = ['nigger', 'nigga', 'n1gger', 'n1gga', 'retard', 'r3tard', 'faggot', 'f4ggot', 'chink', 'ch1nk', 'kike', 'k1ke', 'tranny', 'tr4nny'];
    const lowerUsername = cleanUsername.toLowerCase();
    for (const slur of slurs) {
      if (lowerUsername.includes(slur)) {
        toast.error("Name contains prohibited language");
        return;
      }
    }

    setUsername(cleanUsername);
    localStorage.setItem('hideout_chat_username', cleanUsername);
    setShowUsernameDialog(false);
    setTempUsername("");
    
    // Reload page after setting username
    window.location.reload();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !newMessage.trim() || !username) return;

    const content = newMessage.trim().slice(0, 500);

    const slurs = ['nigger', 'nigga', 'n1gger', 'n1gga', 'retard', 'r3tard', 'faggot', 'f4ggot', 'chink', 'ch1nk', 'kike', 'k1ke', 'tranny', 'tr4nny'];
    const lowerContent = content.toLowerCase();
    
    for (const slur of slurs) {
      if (lowerContent.includes(slur)) {
        toast.error("Your message contains prohibited language");
        return;
      }
    }

    const urlPattern = /(https?:\/\/|www\.)/i;
    if (urlPattern.test(content)) {
      toast.error("Sharing links is not allowed");
      return;
    }

    try {
      const { error: insertError } = await (supabase as any)
        .from('global_chat')
        .insert({ username, message: content });

      if (!insertError) {
        setNewMessage("");
        setTimeout(scrollToBottom, 100);
        return;
      }
      console.error('Insert error:', insertError);
      toast.error("Failed to send message");
    } catch (err: any) {
      console.error('Chat error:', err);
      toast.error("Failed to send message");
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
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
        <div className="fixed bottom-20 left-4 w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-background border border-border rounded-lg shadow-xl flex flex-col z-50">
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

          {!isChatEnabled ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div className="space-y-4">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Chat Disabled</h4>
                  <p className="text-sm text-muted-foreground">
                    To enable chat, go to the GitHub repo for more help.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 p-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm text-primary">
                        {msg.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{msg.message}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </ScrollArea>

              <form onSubmit={sendMessage} className="p-4 border-t border-border flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  maxLength={500}
                  className="flex-1"
                />
                <EmojiPicker onEmojiSelect={(emoji) => setNewMessage(prev => prev + emoji)} />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      )}

      <Dialog open={showUsernameDialog} onOpenChange={(open) => {
        setShowUsernameDialog(open);
        if (!open) {
          setIsOpen(false); // Close chat if dialog is dismissed without entering name
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Your Name</DialogTitle>
            <DialogDescription>
              Enter a name to use in the chat
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Name</Label>
              <Input
                id="username"
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSetUsername();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSetUsername}>
              Start Chatting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
