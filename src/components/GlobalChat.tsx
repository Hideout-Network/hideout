import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ChatMessage = {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles: {
    username: string;
  };
};

export const GlobalChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUser();
    if (isOpen) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [isOpen]);

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser({ id: authUser.id });
        return;
      }
    } catch {}

    const storedUser = localStorage.getItem('hideout_user') || sessionStorage.getItem('hideout_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('global_chat')
        .select(`
          id,
          user_id,
          message,
          created_at,
          users!global_chat_user_id_fkey (username)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        const formattedData = data.map((msg: any) => ({
          ...msg,
          profiles: { username: msg.users?.username || 'Unknown' }
        }));
        setMessages(formattedData.reverse());
        scrollToBottom();
      } else if (error) {
        console.error('Fetch messages error:', error);
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('global_chat_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'global_chat'
        },
        async (payload) => {
          try {
            const { data: userProfile } = await (supabase as any)
              .from('users')
              .select('username')
              .eq('id', payload.new.user_id)
              .maybeSingle();

            const newMsg: ChatMessage = {
              ...payload.new,
              profiles: userProfile || { username: 'Unknown' }
            } as ChatMessage;

            setMessages(prev => {
              const updated = [...prev, newMsg];
              if (updated.length > 100) {
                // Delete the oldest message from DB
                const oldest = updated[0];
                (supabase as any).from('global_chat').delete().eq('id', oldest.id);
                return updated.slice(1);
              }
              return updated;
            });
            scrollToBottom();
          } catch (err) {
            console.error('Subscribe error:', err);
          }
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Accept either Supabase session or custom user from storage
    const { data: { user: authUser } } = await supabase.auth.getUser();
    let userId: string | null = authUser?.id || null;

    if (!userId) {
      const storedUser = localStorage.getItem('hideout_user') || sessionStorage.getItem('hideout_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          userId = parsed?.id || null;
        } catch {}
      }
    }

    if (!userId) {
      toast.error("Please login to send messages");
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('global_chat')
        .insert([{ user_id: userId, message: newMessage.trim() }]);

      if (error) {
        console.error('Chat error:', error);
        toast.error(error.message || "Failed to send message");
      } else {
        setNewMessage("");
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      toast.error(err?.message || "Failed to send message");
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <>
      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-[9999] w-14 h-14 rounded-full shadow-lg hover:scale-110 transition-transform"
        size="icon"
      >
        <MessageSquare className="w-6 h-6" />
      </Button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed left-0 top-0 h-full w-80 bg-card border-r border-border z-[10000] shadow-2xl flex flex-col animate-slide-in-left">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-card/95 backdrop-blur">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg">Global Chat</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1 p-3 rounded-lg ${
                    msg.user_id === user?.id
                      ? 'bg-primary/10 ml-auto max-w-[85%]'
                      : 'bg-muted max-w-[85%]'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-primary">
                      {msg.profiles?.username || 'Unknown'}
                    </span>
                    <span className="text-muted-foreground">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                  <p className="text-sm break-words">{msg.message}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-border bg-card/95 backdrop-blur">
            {!user ? (
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <a href="/auth" className="text-primary hover:underline">Login</a> to send messages
                </p>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  maxLength={500}
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </form>
        </div>
      )}
    </>
  );
};
