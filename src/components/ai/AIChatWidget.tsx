import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle, X, Send, Loader2, Bot, User, Minimize2,
  Sparkles, BookOpen, Star, Clock, ArrowRight, Maximize2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  courseCard?: {
    title: string;
    slug: string;
    level: string;
    price: number;
    duration: number;
  };
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const QUICK_REPLIES = [
  'Help me develop my concept',
  'How to zone a cultural centre?',
  'Sheet layout critique tips',
  'Site analysis checklist',
  'Best course for beginners?',
];

function parseCourseCard(content: string): { cleanContent: string; courseCard?: Message['courseCard'] } {
  const cardMatch = content.match(/\[COURSE_CARD:([^\]]+)\]/);
  if (!cardMatch) return { cleanContent: content };
  try {
    const card = JSON.parse(cardMatch[1]);
    const cleanContent = content.replace(/\[COURSE_CARD:[^\]]+\]/, '').trim();
    return { cleanContent, courseCard: card };
  } catch {
    return { cleanContent: content };
  }
}

function CourseCard({ card, onEnroll }: { card: NonNullable<Message['courseCard']>; onEnroll: (slug: string) => void }) {
  const levelColor = card.level === 'beginner' ? 'bg-emerald-100 text-emerald-700' : card.level === 'intermediate' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';
  return (
    <div className="mt-2 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-primary/8 to-accent/8 px-3 py-2 flex items-center gap-2 border-b border-border/50">
        <BookOpen className="h-3.5 w-3.5 text-accent shrink-0" />
        <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">{card.title}</p>
      </div>
      <div className="p-3 space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${levelColor}`}>{card.level}</span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />{card.duration}h
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />4.8
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">₹{card.price.toLocaleString('en-IN')}</span>
          <Button
            size="sm"
            className="h-7 text-xs px-3 bg-accent hover:bg-accent/90 text-accent-foreground gap-1"
            onClick={() => onEnroll(card.slug)}
          >
            View Course <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! 👋 I'm Archi, your course advisor at **Archistudio**. I can help you find the perfect architecture & design course, answer questions about software, pricing, and much more.\n\nWhat are you looking to learn?",
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Detect course context from URL
  const courseContext = (() => {
    const path = location.pathname;
    if (path.startsWith('/learn/') || path.startsWith('/course/') || path.startsWith('/courses/')) {
      const slug = path.split('/').pop();
      return slug || null;
    }
    return null;
  })();

  // Auto-expand when conversation gets going
  const shouldAutoExpand = messages.length > 3;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, isMinimized]);

  // Auto-expand on deeper conversations (desktop only)
  useEffect(() => {
    if (shouldAutoExpand && !isMobile && !isExpanded) {
      setIsExpanded(true);
    }
  }, [shouldAutoExpand, isMobile]);

  const handleEnroll = (slug: string) => {
    navigate(`/courses/${slug}`);
    setIsOpen(false);
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    if (!session?.access_token) {
      toast({
        title: 'Login required',
        description: 'Please log in to use the AI chat.',
        variant: 'destructive',
      });
      return;
    }

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          courseContext: courseContext || undefined,
          currentPage: location.pathname,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
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
                const newMessages = [...prev];
                const { cleanContent, courseCard } = parseCourseCard(assistantContent);
                newMessages[newMessages.length - 1] = { role: 'assistant', content: cleanContent, courseCard };
                return newMessages;
              });
            }
          } catch { /* incomplete JSON */ }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Connection error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
      setMessages(prev => prev.filter(m => m.content !== ''));
    } finally {
      setIsLoading(false);
    }
  };

  // Compute dynamic dimensions
  const panelWidth = isMobile
    ? 'calc(100vw - 1rem)'
    : isExpanded
      ? 'min(520px, calc(100vw - 2rem))'
      : 'min(380px, calc(100vw - 2rem))';

  const panelHeight = isMobile
    ? 'calc(100vh - 5rem)'
    : isExpanded
      ? 'min(680px, calc(100vh - 5rem))'
      : 'min(560px, calc(100vh - 6rem))';

  // Floating button
  if (!isOpen) {
    return (
      <AnimatePresence>
        <motion.button
          key="chat-fab"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={() => setIsOpen(true)}
          title="Chat with Archi — Course Advisor"
          className="fixed bottom-6 right-20 h-12 w-12 rounded-full z-[9998] flex items-center justify-center shadow-lg group"
          style={{
            background: 'hsl(var(--primary))',
            boxShadow: '0 4px 20px hsl(var(--primary) / 0.4)',
          }}
        >
          <MessageCircle className="h-6 w-6 text-primary-foreground" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent flex items-center justify-center">
            <Sparkles className="h-2.5 w-2.5 text-accent-foreground" />
          </span>
        </motion.button>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="chat-panel"
        initial={{ opacity: 0, scale: 0.85, y: 40 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          width: isMinimized ? 288 : panelWidth,
          height: isMinimized ? 'auto' : panelHeight,
        }}
        exit={{ opacity: 0, scale: 0.85, y: 40 }}
        transition={{
          type: 'spring',
          stiffness: 320,
          damping: 30,
          mass: 0.8,
        }}
        className="fixed z-[9998] flex flex-col rounded-2xl overflow-hidden"
        style={{
          bottom: isMobile ? '0.5rem' : '1.5rem',
          right: isMobile ? '0.5rem' : '1rem',
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 24px 64px -12px hsl(220 20% 0% / 0.22), 0 8px 16px -4px hsl(220 20% 0% / 0.1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ background: 'hsl(var(--primary))' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-foreground leading-tight">Archi</p>
              <p className="text-[10px] text-primary-foreground/70 leading-tight">Course Advisor · Online</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isMobile && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                title={isExpanded ? 'Compact view' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            )}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { setIsOpen(false); setIsExpanded(false); }}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
              <div className="p-4 space-y-4">
                {messages.map((message, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i === messages.length - 1 ? 0.05 : 0 }}
                    className={`flex gap-2.5 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div
                        className="h-7 w-7 rounded-full shrink-0 mt-0.5 flex items-center justify-center"
                        style={{ background: 'hsl(var(--primary))' }}
                      >
                        <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    )}

                    <div className={`max-w-[82%] space-y-0`}>
                      {message.role === 'assistant' ? (
                        <div
                          className="rounded-2xl rounded-tl-sm px-3.5 py-2.5"
                          style={{ background: 'hsl(var(--muted))' }}
                        >
                          {message.content ? (
                            <div className="prose prose-sm max-w-none text-foreground prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-foreground prose-headings:text-foreground prose-p:text-sm prose-li:text-sm">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          ) : isLoading && i === messages.length - 1 ? (
                            <div className="flex gap-1 items-center py-0.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div
                          className="rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm"
                          style={{
                            background: 'hsl(var(--primary))',
                            color: 'hsl(var(--primary-foreground))',
                          }}
                        >
                          {message.content}
                        </div>
                      )}

                      {message.courseCard && (
                        <CourseCard card={message.courseCard} onEnroll={handleEnroll} />
                      )}
                    </div>

                    {message.role === 'user' && (
                      <div
                        className="h-7 w-7 rounded-full shrink-0 mt-0.5 flex items-center justify-center"
                        style={{ background: 'hsl(var(--accent))' }}
                      >
                        <User className="h-3.5 w-3.5 text-accent-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>

            {/* Quick replies — only show at start */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    disabled={isLoading}
                    className="text-xs px-3 py-1.5 rounded-full border transition-all hover:border-primary hover:text-primary disabled:opacity-50"
                    style={{
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--muted-foreground))',
                      background: 'hsl(var(--muted))',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div
              className="px-3 py-3 shrink-0"
              style={{ borderTop: '1px solid hsl(var(--border))' }}
            >
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex gap-2 items-center"
              >
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about any course…"
                  disabled={isLoading}
                  className="flex-1 h-10 text-sm rounded-xl border-border bg-muted/50 focus-visible:ring-1 focus-visible:ring-accent"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !input.trim()}
                  className="h-10 w-10 rounded-xl shrink-0"
                  style={{ background: 'hsl(var(--primary))' }}
                >
                  {isLoading
                    ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                    : <Send className="h-4 w-4 text-primary-foreground" />
                  }
                </Button>
              </form>
              <p className="text-[10px] text-center text-muted-foreground mt-1.5">
                Powered by Archistudio AI · <span className="text-accent cursor-pointer" onClick={() => navigate('/courses')}>Browse all courses →</span>
              </p>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
