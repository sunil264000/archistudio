import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileImage, Lightbulb, Briefcase, Send, Loader2, Bot, User, Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MENTOR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-design-mentor`;

const MODES = [
  { id: 'sheet-critique', label: 'Sheet Critique', icon: FileImage, placeholder: 'Describe your sheet layout, or paste details about what you need critiqued...' },
  { id: 'concept-generator', label: 'Concept Generator', icon: Lightbulb, placeholder: 'Enter your design brief, e.g. "community library for a rural village"...' },
  { id: 'portfolio-review', label: 'Portfolio Review', icon: Briefcase, placeholder: 'Describe your portfolio structure, projects included, target audience...' },
];

export function AIMentorPanel() {
  const [mode, setMode] = useState('sheet-critique');
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    'sheet-critique': [],
    'concept-generator': [],
    'portfolio-review': [],
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { session } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, mode]);

  const currentMessages = messages[mode] || [];
  const currentMode = MODES.find(m => m.id === mode)!;

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    if (!session?.access_token) {
      toast({ title: 'Login required', description: 'Please log in to use the AI mentor.', variant: 'destructive' });
      return;
    }

    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMessages = [...currentMessages, userMsg];
    setMessages(prev => ({ ...prev, [mode]: newMessages }));
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
        body: JSON.stringify({
          mode,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
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

      setMessages(prev => ({ ...prev, [mode]: [...newMessages, { role: 'assistant', content: '' }] }));

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
                const modeMessages = [...(prev[mode] || [])];
                modeMessages[modeMessages.length - 1] = { role: 'assistant', content: assistantContent };
                return { ...prev, [mode]: modeMessages };
              });
            }
          } catch { /* incomplete JSON */ }
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
      setMessages(prev => ({
        ...prev,
        [mode]: (prev[mode] || []).filter(m => m.content !== ''),
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          AI Design Mentor
        </CardTitle>
        <CardDescription>Get expert feedback on sheets, concepts, and portfolios</CardDescription>
      </CardHeader>

      <Tabs value={mode} onValueChange={setMode} className="flex-1 flex flex-col min-h-0 px-6">
        <TabsList className="w-full">
          {MODES.map(m => (
            <TabsTrigger key={m.id} value={m.id} className="flex-1 gap-1.5 text-xs">
              <m.icon className="h-3.5 w-3.5" /> {m.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {MODES.map(m => (
          <TabsContent key={m.id} value={m.id} className="flex-1 flex flex-col min-h-0 mt-3">
            <ScrollArea className="flex-1 min-h-0" ref={m.id === mode ? scrollRef : undefined}>
              <div className="space-y-4 pr-2">
                {(messages[m.id] || []).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <m.icon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Start a {m.label.toLowerCase()} session</p>
                    <p className="text-xs mt-1">Describe what you need help with</p>
                  </div>
                )}
                {(messages[m.id] || []).map((msg, i) => (
                  <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="h-7 w-7 rounded-full shrink-0 mt-0.5 flex items-center justify-center bg-primary">
                        <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    )}
                    <div className="max-w-[85%]">
                      {msg.role === 'assistant' ? (
                        <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 bg-muted">
                          {msg.content ? (
                            <div className="prose prose-sm max-w-none text-foreground prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:text-foreground prose-headings:my-2">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <div className="flex gap-1 py-0.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm bg-primary text-primary-foreground">
                          {msg.content}
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="h-7 w-7 rounded-full shrink-0 mt-0.5 flex items-center justify-center bg-accent">
                        <User className="h-3.5 w-3.5 text-accent-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>

      <CardContent className="pt-3 pb-4">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex gap-2 items-end"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentMode.placeholder}
            disabled={isLoading}
            className="flex-1 min-h-[60px] max-h-[120px] text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="h-10 w-10 shrink-0">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
