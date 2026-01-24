import { useState, useEffect } from 'react';
import { MessageCircle, Send, X, Instagram, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Telegram icon component
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

export function ContactSupportWidget() {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLinks, setSocialLinks] = useState({
    instagram_url: '',
    telegram_url: '',
  });
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });

  useEffect(() => {
    const fetchSocialLinks = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['instagram_url', 'telegram_url']);

      if (data) {
        const linksObj: Record<string, string> = {};
        data.forEach(item => {
          linksObj[item.key] = item.value || '';
        });
        setSocialLinks(prev => ({ ...prev, ...linksObj }));
      }
    };

    fetchSocialLinks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to send a message');
      return;
    }

    if (!formData.subject || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        subject: formData.subject,
        message: formData.message,
        status: 'open',
        priority: 'normal',
      });

      if (error) throw error;

      toast.success('Message sent! We\'ll get back to you soon.');
      setFormData({ subject: '', message: '' });
      setIsOpen(false);
    } catch (error: any) {
      toast.error('Failed to send message: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-accent hover:bg-accent/90"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </Button>
      </motion.div>

      {/* Contact Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96"
          >
            <Card className="shadow-2xl border-2">
              <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/10 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageCircle className="h-5 w-5 text-accent" />
                  Need Help?
                </CardTitle>
                <CardDescription>
                  Confused about courses? Message us directly!
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Quick Social Links */}
                <div className="flex gap-2">
                  {socialLinks.instagram_url && (
                    <a
                      href={socialLinks.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full gap-2 hover:bg-pink-500/10 hover:border-pink-500">
                        <Instagram className="h-4 w-4 text-pink-500" />
                        Instagram
                      </Button>
                    </a>
                  )}
                  {socialLinks.telegram_url && (
                    <a
                      href={socialLinks.telegram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full gap-2 hover:bg-blue-500/10 hover:border-blue-500">
                        <TelegramIcon className="h-4 w-4 text-blue-500" />
                        Telegram
                      </Button>
                    </a>
                  )}
                </div>

                {(!socialLinks.instagram_url && !socialLinks.telegram_url) && (
                  <p className="text-xs text-muted-foreground text-center">
                    Social links coming soon!
                  </p>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      or send a message
                    </span>
                  </div>
                </div>

                {/* Contact Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="What do you need help with?"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Describe your question or concern..."
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={loading || !user}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {user ? 'Send Message' : 'Login to Send'}
                  </Button>
                </form>

                {!user && (
                  <p className="text-xs text-muted-foreground text-center">
                    Please <a href="/auth" className="text-accent underline">login</a> to send us a message
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
