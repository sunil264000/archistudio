import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { SEOHead } from '@/components/seo/SEOHead';
import { supabase } from '@/integrations/supabase/client';

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const { toast } = useToast();

  const [contactInfo, setContactInfo] = useState({
    email1: 'support@archistudio.in',
    email2: 'info@archistudio.in',
    phone: '+91 98765 43210',
    address: 'Archistudio Learning Pvt Ltd\n123 Design District, Koramangala\nBangalore, Karnataka 560034\nIndia',
  });

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['contact_email', 'contact_email_2', 'contact_phone', 'contact_address'])
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach(d => { if (d.value) map[d.key] = d.value; });
          setContactInfo(prev => ({
            email1: map.contact_email || prev.email1,
            email2: map.contact_email_2 || prev.email2,
            phone: map.contact_phone || prev.phone,
            address: map.contact_address || prev.address,
          }));
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.from('contact_messages').insert({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      subject: formData.subject,
      message: formData.message,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Message Sent!',
        description: 'We will get back to you within 24 hours.',
      });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <SEOHead 
        title="Contact Us - Get in Touch | Archistudio"
        description="Have questions about our architecture courses? Contact Archistudio support team. We respond within 24 hours."
        url="https://archistudio.shop/contact"
        keywords="contact archistudio, architecture course support, 3ds max course help, autocad training inquiry"
      />
      <Navbar />
      
      {/* Animated Background */}
      <AnimatedBackground intensity="light" />
      
      <main className="pt-24 pb-16 relative">
        <div className="absolute inset-0 dot-grid opacity-10 pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-14">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Contact <span class="text-hero-gradient">Us</span></h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
              Have questions about our courses? We're here to help. Reach out to us and we'll respond within 24 hours.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="card-premium">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <Mail className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Email</h3>
                      <p className="text-muted-foreground text-sm">{contactInfo.email1}</p>
                      <p className="text-muted-foreground text-sm">{contactInfo.email2}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-premium">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <Phone className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Phone</h3>
                      <p className="text-muted-foreground text-sm">{contactInfo.phone}</p>
                      <p className="text-muted-foreground text-sm">Mon-Sat, 10AM-6PM IST</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-premium">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <MapPin className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Address</h3>
                      <p className="text-muted-foreground text-sm whitespace-pre-line">
                        {contactInfo.address}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="lg:col-span-2 card-premium">
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>Fill out the form below and we'll get back to you soon.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-8 gap-2 shadow-[0_0_20px_hsl(var(--accent)/0.15)]">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
