import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Bot, Send, Loader2, User, Sparkles, X, MessageSquare, FileImage, Lightbulb, Briefcase, Minimize2, Maximize2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MENTOR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-design-mentor`;

const QUICK_PROMPTS = [
  { label: 'Critique my sheet', icon: FileImage, prompt: 'I want to get my architecture presentation sheet critiqued. Here\'s what I have:', mode: 'sheet-critique' },
  { label: 'Generate concept', icon: Lightbulb, prompt: 'Help me develop an architectural concept for:', mode: 'concept-generator' },
  { label: 'Review portfolio', icon: Briefcase, prompt: 'I need feedback on my architecture portfolio:', mode: 'portfolio-review' },
];

export function FloatingAIMentor() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('concept-generator');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { session, user } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (overrideInput?: string) => {
    const text = overrideInput || input.trim();
    if (!text || isLoading) return;
    if (!session?.access_token) {
      toast.error('Please log in to use the AI mentor');
      return;
    }

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const response = await fetch(MENTOR_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ mode, messages: newMessages }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed' }));
        throw new Error(error.error || 'Failed to get response');
      }
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch { /* partial JSON */ }
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
      setMessages(prev => prev.filter(m => m.content !== ''));
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 group"
              size="icon"
            >
              <Sparkles className="h-6 w-6 text-primary-foreground group-hover:scale-110 transition-transform" />
            </Button>
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed z-50 ${
              expanded
                ? 'inset-4 sm:inset-8'
                : 'bottom-6 right-6 w-[380px] sm:w-[420px] h-[560px]'
            } flex flex-col rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-display font-bold text-foreground">AI Design Mentor</h3>
                  <p className="text-[10px] text-muted-foreground">Architecture expert · Always available</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
                  {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Mode selector */}
            <div className="flex gap-1.5 px-3 py-2 border-b border-border/30 bg-muted/20 overflow-x-auto no-scrollbar">
              {[
                { id: 'concept-generator', label: 'Concepts', icon: Lightbulb },
                { id: 'sheet-critique', label: 'Critique', icon: FileImage },
                { id: 'portfolio-review', label: 'Portfolio', icon: Briefcase },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${
                    mode === m.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <m.icon className="h-3 w-3" />
                  {m.label}
                </button>
              ))}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
              <div className="p-3 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">Architecture AI Mentor</h4>
                    <p className="text-xs text-muted-foreground mb-4 max-w-[240px] mx-auto">
                      Get expert critiques, generate concepts, and review your portfolio
                    </p>
                    <div className="space-y-2">
                      {QUICK_PROMPTS.map(qp => (
                        <button
                          key={qp.label}
                          onClick={() => {
                            setMode(qp.mode);
                            setInput(qp.prompt);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 transition-colors text-left"
                        >
                          <qp.icon className="h-4 w-4 text-accent shrink-0" />
                          <span className="text-xs text-foreground">{qp.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="h-6 w-6 rounded-full shrink-0 mt-0.5 flex items-center justify-center bg-primary">
                        <Bot className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    <div className={`max-w-[85%] ${
                      msg.role === 'user'
                        ? 'rounded-2xl rounded-tr-sm px-3 py-2 text-sm bg-primary text-primary-foreground'
                        : 'rounded-2xl rounded-tl-sm px-3 py-2 bg-muted'
                    }`}>
                      {msg.role === 'assistant' ? (
                        msg.content ? (
                          <div className="prose prose-sm max-w-none text-foreground prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:text-foreground prose-headings:my-2 text-xs">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="flex gap-1 py-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                          </div>
                        )
                      ) : (
                        <span className="text-xs">{msg.content}</span>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="h-6 w-6 rounded-full shrink-0 mt-0.5 flex items-center justify-center bg-accent">
                        <User className="h-3 w-3 text-accent-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t border-border/30">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about architecture..."
                  disabled={isLoading}
                  className="flex-1 min-h-[44px] max-h-[100px] text-xs resize-none bg-muted/30 border-border/30"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="h-[44px] w-[44px] shrink-0 rounded-xl">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
              <p className="text-[9px] text-muted-foreground/50 mt-1.5 text-center">
                AI may make mistakes · 20 messages/day
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
