import { useState, useRef, useEffect, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ChevronDown, Plus, Key, ExternalLink, Image, FileText, Code, X, Brain } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePageTitle } from "@/hooks/use-page-title";
import { toast } from "sonner";
import openaiLogo from "@/images/openailogo.svg";
import qwenLogo from "@/images/qwenlogo.svg";
import metaLogo from "@/images/metalogo.svg";
import moonshotLogo from "@/images/moonshotlogo.webp";

import katex from 'katex';
import 'katex/dist/katex.min.css';

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  thoughts?: string;
  image?: string;
}

interface ApiKey {
  name: string;
  key: string;
}

interface Model {
  id: string;
  name: string;
  logo: string;
  supportsVision?: boolean;
}

const WELCOME_MESSAGES = [
  "What's on your mind today?",
  "What's the next step?",
  "How can I help you?",
  "What would you like to create?",
  "What are you working on?",
  "Got any questions?",
  "What can I do for you?",
  "Ready when you are.",
  "Let's build something.",
  "What's your next idea?",
];

const MODELS: Model[] = [
  // Auto - Automatically selects best model (no icon, no vision indicator)
  { id: "auto", name: "Auto", logo: "", supportsVision: false },
  // GPT OSS Models
  { id: "openai/gpt-oss-120b", name: "GPT OSS 120B", logo: openaiLogo },
  { id: "openai/gpt-oss-20b", name: "GPT OSS 20B", logo: openaiLogo },
  // Kimi
  { id: "moonshotai/kimi-k2-instruct-0905", name: "Kimi K2", logo: moonshotLogo },
  // Llama Models
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout", logo: metaLogo, supportsVision: true },
  { id: "meta-llama/llama-4-maverick-17b-128e-instruct", name: "Llama 4 Maverick", logo: metaLogo, supportsVision: true },
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", logo: metaLogo },
  // Qwen
  { id: "qwen/qwen3-32b", name: "Qwen 3 32B", logo: qwenLogo },
];

// Auto model selection logic
const selectAutoModel = (hasImage: boolean, messageLength: number): Model => {
  // If image is attached, use a vision model
  if (hasImage) {
    return MODELS.find(m => m.id === "meta-llama/llama-4-scout-17b-16e-instruct")!;
  }
  // For long/complex prompts (>500 chars), use the best model
  if (messageLength > 500) {
    return MODELS.find(m => m.id === "openai/gpt-oss-120b")!;
  }
  // Default to a good balanced model
  return MODELS.find(m => m.id === "openai/gpt-oss-20b")!;
};

// Parse <think> tags from content
const parseThinkTags = (content: string): { thoughts: string | null; response: string } => {
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  if (thinkMatch) {
    const thoughts = thinkMatch[1].trim();
    const response = content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    return { thoughts, response };
  }
  return { thoughts: null, response: content };
};

// Render LaTeX math
const renderMath = (latex: string, displayMode: boolean): React.ReactNode => {
  try {
    const html = katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      trust: true,
    });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <code className="text-destructive">{latex}</code>;
  }
};

// Enhanced markdown renderer
const renderMarkdown = (text: string, enabled: boolean): React.ReactNode => {
  if (!enabled) return text;
  
  const elements: React.ReactNode[] = [];
  let keyCounter = 0;
  
  // Handle block math $$...$$ and \[...\] first
  let processed = text;
  
  // Replace $$...$$ with placeholders
  const blockMathMatches: { placeholder: string; latex: string }[] = [];
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => {
    const placeholder = `__BLOCK_MATH_${blockMathMatches.length}__`;
    blockMathMatches.push({ placeholder, latex: latex.trim() });
    return placeholder;
  });
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_, latex) => {
    const placeholder = `__BLOCK_MATH_${blockMathMatches.length}__`;
    blockMathMatches.push({ placeholder, latex: latex.trim() });
    return placeholder;
  });
  
  // Split by lines
  const lines = processed.split('\n');
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = '';
  let tableRows: string[][] = [];
  let inTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const key = keyCounter++;
    
    // Check for block math placeholders
    const blockMathMatch = line.match(/__BLOCK_MATH_(\d+)__/);
    if (blockMathMatch && line.trim() === blockMathMatch[0]) {
      const idx = parseInt(blockMathMatch[1]);
      elements.push(
        <div key={key} className="my-4 overflow-x-auto flex justify-center">
          {renderMath(blockMathMatches[idx].latex, true)}
        </div>
      );
      continue;
    }
    
    // Code block toggle
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
        codeBlockContent = [];
      } else {
        elements.push(
          <pre key={key} className="bg-muted rounded-lg p-3 my-2 overflow-x-auto">
            <code className="text-sm font-mono">{codeBlockContent.join('\n')}</code>
          </pre>
        );
        inCodeBlock = false;
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }
    
    // Table detection
    if (line.includes('|') && line.trim().startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (cells.length > 0) {
        // Check if separator row
        if (cells.every(c => /^[-:]+$/.test(c))) {
          continue; // Skip separator row
        }
        tableRows.push(cells);
        inTable = true;
        
        // Check if next line is not a table row
        const nextLine = lines[i + 1];
        if (!nextLine || !nextLine.includes('|') || !nextLine.trim().startsWith('|')) {
          // Render table
          elements.push(
            <div key={key} className="my-3 overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {tableRows[0]?.map((cell, ci) => (
                      <th key={ci} className="px-3 py-2 text-left font-semibold">{renderInlineMarkdown(cell, blockMathMatches)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.slice(1).map((row, ri) => (
                    <tr key={ri} className="border-b border-border/50">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2">{renderInlineMarkdown(cell, blockMathMatches)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          tableRows = [];
          inTable = false;
        }
        continue;
      }
    }
    
    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      elements.push(<hr key={key} className="my-4 border-border" />);
      continue;
    }
    
    // Headers (up to 10 levels)
    const headerMatch = line.match(/^(#{1,10}) (.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const content = headerMatch[2];
      const sizes: Record<number, string> = {
        1: 'text-2xl font-bold mt-4 mb-2',
        2: 'text-xl font-semibold mt-4 mb-2',
        3: 'text-lg font-semibold mt-3 mb-1',
        4: 'text-base font-semibold mt-3 mb-1',
        5: 'text-sm font-semibold mt-2 mb-1',
        6: 'text-sm font-medium mt-2 mb-1',
        7: 'text-xs font-semibold mt-2 mb-1',
        8: 'text-xs font-medium mt-2 mb-1',
        9: 'text-xs font-normal mt-1 mb-1',
        10: 'text-xs font-normal mt-1 mb-1 opacity-80',
      };
      const Tag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
      elements.push(<Tag key={key} className={sizes[level]}>{renderInlineMarkdown(content, blockMathMatches)}</Tag>);
      continue;
    }
    
    // Unordered list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(<li key={key} className="ml-4 list-disc">{renderInlineMarkdown(line.slice(2), blockMathMatches)}</li>);
      continue;
    }
    
    // Ordered list
    const orderedMatch = line.match(/^(\d+)\. (.*)$/);
    if (orderedMatch) {
      elements.push(<li key={key} className="ml-4 list-decimal">{renderInlineMarkdown(orderedMatch[2], blockMathMatches)}</li>);
      continue;
    }
    
    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={key} className="border-l-4 border-primary/50 pl-3 italic text-muted-foreground my-2">
          {renderInlineMarkdown(line.slice(2), blockMathMatches)}
        </blockquote>
      );
      continue;
    }
    
    // Empty line
    if (line.trim() === '') {
      elements.push(<br key={key} />);
      continue;
    }
    
    // Regular paragraph
    elements.push(<p key={key} className="my-1">{renderInlineMarkdown(line, blockMathMatches)}</p>);
  }
  
  return elements;
};

// Inline markdown (bold, italic, code, strikethrough, inline math)
const renderInlineMarkdown = (text: string, blockMathMatches: { placeholder: string; latex: string }[] = []): React.ReactNode => {
  // First restore any block math placeholders in inline context
  let processed = text;
  for (const match of blockMathMatches) {
    if (processed.includes(match.placeholder)) {
      processed = processed.replace(match.placeholder, `$${match.latex}$`);
    }
  }
  
  // Handle inline math $...$ and \(...\)
  const parts: React.ReactNode[] = [];
  // Split by inline math patterns
  const regex = /(\$[^$\n]+\$|\\\([^)]+\\\))/g;
  let lastIndex = 0;
  let match;
  let keyIdx = 0;
  
  while ((match = regex.exec(processed)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(...renderTextFormatting(processed.slice(lastIndex, match.index), keyIdx));
      keyIdx += 100;
    }
    
    // Render math
    let latex = match[0];
    if (latex.startsWith('$') && latex.endsWith('$')) {
      latex = latex.slice(1, -1);
    } else if (latex.startsWith('\\(') && latex.endsWith('\\)')) {
      latex = latex.slice(2, -2);
    }
    parts.push(<span key={`math-${keyIdx++}`}>{renderMath(latex, false)}</span>);
    lastIndex = regex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < processed.length) {
    parts.push(...renderTextFormatting(processed.slice(lastIndex), keyIdx));
  }
  
  return parts.length > 0 ? parts : processed;
};

// Text formatting (bold, italic, code, strikethrough)
const renderTextFormatting = (text: string, startKey: number): React.ReactNode[] => {
  const parts = text.split(/(\*\*.*?\*\*|__.*?__|(?<!\*)\*(?!\*).*?(?<!\*)\*(?!\*)|(?<!_)_(?!_).*?(?<!_)_(?!_)|`[^`]+`|~~.*?~~)/g);
  return parts.filter(p => p).map((p, j) => {
    const key = `fmt-${startKey}-${j}`;
    if ((p.startsWith('**') && p.endsWith('**')) || (p.startsWith('__') && p.endsWith('__'))) {
      return <strong key={key}>{p.slice(2, -2)}</strong>;
    }
    if ((p.startsWith('*') && p.endsWith('*') && p.length > 2) || 
        (p.startsWith('_') && p.endsWith('_') && p.length > 2)) {
      return <em key={key}>{p.slice(1, -1)}</em>;
    }
    if (p.startsWith('`') && p.endsWith('`')) {
      return <code key={key} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{p.slice(1, -1)}</code>;
    }
    if (p.startsWith('~~') && p.endsWith('~~')) {
      return <del key={key}>{p.slice(2, -2)}</del>;
    }
    return <span key={key}>{p}</span>;
  });
};

const AI = () => {
  usePageTitle("AI");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [activeKeyIndex, setActiveKeyIndex] = useState<number>(0);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [markdownEnabled, setMarkdownEnabled] = useState<Record<number, boolean>>({});
  const [showMemoryDialog, setShowMemoryDialog] = useState(false);
  const [memory, setMemory] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [welcomeMessage] = useState(() => 
    WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)]
  );

  // Load memory from localStorage
  useEffect(() => {
    const savedMemory = localStorage.getItem("ai_memory");
    if (savedMemory) {
      setMemory(savedMemory);
    }
  }, []);

  const handleSaveMemory = () => {
    localStorage.setItem("ai_memory", memory);
    setShowMemoryDialog(false);
    toast.success("Memory saved");
  };

  // Load API keys from localStorage and check for env variable
  useEffect(() => {
    const keys: ApiKey[] = [];
    
    // Check for env variable first
    const envKey = import.meta.env.VITE_GROQ_API_KEY;
    if (envKey) {
      keys.push({ name: "Default", key: envKey });
    }
    
    // Load saved keys from localStorage
    const savedKeys = localStorage.getItem("groq_api_keys");
    if (savedKeys) {
      try {
        const decoded = atob(savedKeys);
        const savedKeysList = JSON.parse(decoded) as ApiKey[];
        keys.push(...savedKeysList);
      } catch (e) {
        console.error("Failed to load API keys:", e);
      }
    }
    
    setApiKeys(keys);
    
    const savedActiveIndex = localStorage.getItem("groq_active_key_index");
    if (savedActiveIndex) {
      const idx = parseInt(savedActiveIndex, 10);
      setActiveKeyIndex(Math.min(idx, keys.length - 1));
    }
  }, []);

  // Initialize markdown enabled state for all messages
  useEffect(() => {
    setMarkdownEnabled(prev => {
      const newState = { ...prev };
      messages.forEach((_, i) => {
        if (newState[i] === undefined) {
          newState[i] = true; // Enable by default
        }
      });
      return newState;
    });
  }, [messages]);

  // Save API keys to localStorage (excluding Default env key)
  const saveApiKeys = (keys: ApiKey[], activeIndex: number) => {
    const keysToSave = keys.filter(k => k.name !== "Default" || !import.meta.env.VITE_GROQ_API_KEY);
    const encoded = btoa(JSON.stringify(keysToSave));
    localStorage.setItem("groq_api_keys", encoded);
    localStorage.setItem("groq_active_key_index", activeIndex.toString());
  };

  // Delete an API key
  const handleDeleteKey = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const keyToDelete = apiKeys[index];
    
    // Don't allow deleting the Default key
    if (keyToDelete.name === "Default" && import.meta.env.VITE_GROQ_API_KEY) {
      toast.error("Cannot delete the default API key");
      return;
    }
    
    const newKeys = apiKeys.filter((_, i) => i !== index);
    setApiKeys(newKeys);
    
    // Adjust active index if needed
    let newActiveIndex = activeKeyIndex;
    if (index === activeKeyIndex) {
      newActiveIndex = 0;
    } else if (index < activeKeyIndex) {
      newActiveIndex = activeKeyIndex - 1;
    }
    setActiveKeyIndex(newActiveIndex);
    saveApiKeys(newKeys, newActiveIndex);
    toast.success(`Deleted API key "${keyToDelete.name}"`);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages, isLoading]);

  // Handle paste for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setPendingImage(event.target?.result as string);
              toast.success("Image added to message");
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };
    
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const handleAddApiKey = () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) {
      toast.error("Please enter both a name and API key");
      return;
    }
    const newKeys = [...apiKeys, { name: newKeyName.trim(), key: newKeyValue.trim() }];
    setApiKeys(newKeys);
    setActiveKeyIndex(newKeys.length - 1);
    saveApiKeys(newKeys, newKeys.length - 1);
    setNewKeyName("");
    setNewKeyValue("");
    setShowApiKeyDialog(false);
    toast.success("API key added successfully");
  };

  const handleSelectKey = (index: number) => {
    setActiveKeyIndex(index);
    localStorage.setItem("groq_active_key_index", index.toString());
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPendingImage(event.target?.result as string);
        toast.success("Image added to message");
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !pendingImage) return;
    
    // Determine which model to actually use
    let modelToUse = selectedModel;
    if (selectedModel.id === "auto") {
      modelToUse = selectAutoModel(!!pendingImage, input.length);
    }
    
    // Check if trying to send image with non-vision model
    if (pendingImage && !modelToUse.supportsVision) {
      toast.error("This model doesn't support images. Please use a vision model like Llama 4 Scout or Llama 4 Maverick.");
      return;
    }
    
    // Check if API key exists
    if (apiKeys.length === 0 || !apiKeys[activeKeyIndex]) {
      toast.error(
        <div className="space-y-2">
          <p>No API key configured.</p>
          <p className="text-sm text-muted-foreground">
            Get your free API key from{" "}
            <a 
              href="https://console.groq.com/keys"
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              console.groq.com
            </a>
          </p>
        </div>,
        { duration: 5000 }
      );
      return;
    }

    const userMessage = input.trim();
    const imageToSend = pendingImage;
    setInput("");
    setPendingImage(null);
    setMessages(prev => [...prev, { role: "user", content: userMessage, image: imageToSend || undefined }]);
    setIsLoading(true);

    try {
      // Build messages array for API
      // For non-vision models, convert array content to string (strip images)
      const apiMessages = messages
        .filter(m => m.role !== "system") // Filter out system messages like "Switched to..."
        .map(m => {
          if (m.image && modelToUse.supportsVision) {
            // Vision model: include image in array format
            return {
              role: m.role,
              content: [
                { type: "text", text: m.content },
                { type: "image_url", image_url: { url: m.image } }
              ]
            };
          }
          // Non-vision model or no image: use string content
          return { role: m.role, content: m.content };
        });

      // Add current message
      if (imageToSend && modelToUse.supportsVision) {
        apiMessages.push({
          role: "user",
          content: [
            { type: "text", text: userMessage },
            { type: "image_url", image_url: { url: imageToSend } }
          ]
        });
      } else {
        apiMessages.push({ role: "user", content: userMessage });
      }

      // Build system message with memory if available
      const systemMessages: any[] = [];
      if (memory.trim()) {
        systemMessages.push({ role: "system", content: memory.trim() });
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKeys[activeKeyIndex].key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelToUse.id,
          messages: [...systemMessages, ...apiMessages],
          max_tokens: 4096,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to get response");
      }

      const data = await response.json();
      const rawContent = data.choices[0]?.message?.content || "No response";
      const { thoughts, response: assistantMessage } = parseThinkTags(rawContent);
      
      setMessages(prev => [...prev, { role: "assistant", content: assistantMessage, thoughts: thoughts || undefined }]);
    } catch (error) {
      console.error("AI error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to get response");
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const [expandedThoughts, setExpandedThoughts] = useState<number[]>([]);

  const handleModelSwitch = (model: Model) => {
    if (model.id !== selectedModel.id) {
      setSelectedModel(model);
      setMessages(prev => [...prev, { role: "system", content: `Switched to ${model.name}` }]);
    }
  };

  const toggleThoughts = (index: number) => {
    setExpandedThoughts(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const toggleMarkdown = (index: number) => {
    setMarkdownEnabled(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 flex flex-col pt-24 pb-32 px-4 max-w-4xl mx-auto w-full">
        {messages.length > 0 && (
          /* Chat Messages */
          <ScrollArea ref={scrollRef} className="flex-1 pr-4">
            <div className="space-y-4 pb-4">
              {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : message.role === "system" ? "justify-center" : "justify-start"}`}
              >
                {message.role === "system" ? (
                  <div className="text-xs text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                    {message.content}
                  </div>
                ) : (
                  <div className="max-w-[80%]">
                    <div
                      className={`rounded-2xl px-4 py-3 relative ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card/50 backdrop-blur-md border border-border/50 text-foreground"
                      }`}
                    >
                      {/* Markdown toggle button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleMarkdown(index)}
                        className="absolute top-1 right-1 h-6 w-6 opacity-50 hover:opacity-100"
                        title={markdownEnabled[index] ? "Show raw text" : "Show formatted text"}
                      >
                        {markdownEnabled[index] ? <FileText className="w-3 h-3" /> : <Code className="w-3 h-3" />}
                      </Button>
                      
                      {/* Thoughts at top */}
                      {message.thoughts && (
                        <div className="mb-2 pb-2 border-b border-border/30">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleThoughts(index)}
                            className="text-xs text-muted-foreground gap-1 p-0 h-auto"
                          >
                            <ChevronDown className={`w-3 h-3 transition-transform ${expandedThoughts.includes(index) ? 'rotate-180' : ''}`} />
                            Thoughts
                          </Button>
                          {expandedThoughts.includes(index) && (
                            <div className="mt-1 p-2 bg-muted/30 rounded-lg text-xs text-muted-foreground whitespace-pre-wrap">
                              {message.thoughts}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Image if present */}
                      {message.image && (
                        <img 
                          src={message.image} 
                          alt="Uploaded" 
                          className="max-w-full max-h-48 rounded-lg mb-2"
                        />
                      )}
                      
                      <p className="whitespace-pre-wrap text-sm leading-relaxed pr-6">
                        {renderMarkdown(message.content, markdownEnabled[index] ?? true)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}
      </main>

      {/* Input Area - Centered when no messages, fixed at bottom when conversation exists */}
      <div className={`${messages.length === 0 
        ? "absolute inset-0 flex flex-col items-center justify-center px-4" 
        : "fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4"}`}>
        {/* Welcome message above input */}
        {messages.length === 0 && (
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground/80 text-center mb-8 animate-fade-in">
            {welcomeMessage}
          </h1>
        )}
        <div className={`bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-3 ${messages.length === 0 ? "w-full max-w-2xl" : "w-full"}`}>
          {/* Image preview */}
          {pendingImage && (
            <div className="mb-2 relative inline-block">
              <img src={pendingImage} alt="Pending" className="max-h-20 rounded-lg" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-5 w-5"
                onClick={() => setPendingImage(null)}
              >
                ×
              </Button>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
            {/* Left side controls */}
            <div className="flex items-center gap-2">
              {/* API Key Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                    <Key className="w-4 h-4" />
                    {apiKeys.length > 0 && apiKeys[activeKeyIndex] 
                      ? apiKeys[activeKeyIndex].name 
                      : "API Key"}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {apiKeys.map((key, index) => {
                    const isDefault = key.name === "Default" && import.meta.env.VITE_GROQ_API_KEY;
                    return (
                      <DropdownMenuItem
                        key={index}
                        onClick={() => handleSelectKey(index)}
                        className={`${index === activeKeyIndex ? "bg-accent" : ""} flex items-center justify-between`}
                      >
                        <span>{key.name}</span>
                        {!isDefault && (
                          <button
                            onClick={(e) => handleDeleteKey(index, e)}
                            className="ml-2 p-1 hover:bg-destructive/20 rounded transition-colors"
                          >
                            <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                  {apiKeys.length > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem onClick={() => setShowApiKeyDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Import API Key
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a 
                      href="https://console.groq.com/keys"
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Get API Key
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Upload Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                    <Plus className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <Image className="w-4 h-4 mr-2" />
                    Upload Image
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Memory Button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setShowMemoryDialog(true)}
              >
                <Brain className="w-4 h-4" />
                Memory
              </Button>

              {/* Model Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 max-w-[180px]">
                    {selectedModel.logo && (
                      <img src={selectedModel.logo} alt={selectedModel.name} className="w-4 h-4 object-contain flex-shrink-0" />
                    )}
                    <span className="truncate">{selectedModel.name}</span>
                    <ChevronDown className="w-3 h-3 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
                  {MODELS.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => handleModelSwitch(model)}
                      className={`${selectedModel.id === model.id ? "bg-accent" : ""} justify-between`}
                    >
                      <div className="flex items-center gap-2">
                        {model.logo && (
                          <img src={model.logo} alt={model.name} className="w-4 h-4 object-contain flex-shrink-0" />
                        )}
                        <span>{model.name}</span>
                      </div>
                      {model.supportsVision && (
                        <span className="text-xs text-muted-foreground ml-3">Vision</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Send Button */}
              <Button
                onClick={sendMessage}
                disabled={isLoading || (!input.trim() && !pendingImage)}
                size="sm"
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* API Key Dialog */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import API Key</DialogTitle>
            <DialogDescription>
              Add your Groq API key. Don't have one?{" "}
              <a 
                href="https://console.groq.com/keys"
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Get it free from Groq
              </a>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., My Groq Key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyValue">API Key</Label>
              <Input
                id="keyValue"
                type="password"
                value={newKeyValue}
                onChange={(e) => setNewKeyValue(e.target.value)}
                placeholder="gsk_..."
              />
            </div>
            <Button onClick={handleAddApiKey} className="w-full">
              Add API Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Memory Dialog */}
      <Dialog open={showMemoryDialog} onOpenChange={setShowMemoryDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Memory</DialogTitle>
            <DialogDescription>
              Add custom instructions that the AI will remember for all conversations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Textarea
              value={memory}
              onChange={(e) => setMemory(e.target.value)}
              placeholder="e.g., Always give me answers only, no explanation"
              className="min-h-[200px] resize-none"
            />
            <Button onClick={handleSaveMemory} className="w-full">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AI;
