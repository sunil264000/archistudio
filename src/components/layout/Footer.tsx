import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Instagram, Facebook, Twitter, Youtube, Linkedin, ArrowUpRight, Shield, Lock, Zap, ArrowRight } from 'lucide-react';
import logoMark from '@/assets/logo-mark.png';
import { Button } from '@/components/ui/button';

interface SocialLinks {
  instagram_url: string;
  facebook_url: string;
  twitter_url: string;
  youtube_url: string;
  linkedin_url: string;
}

export function Footer() {
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram_url: '', facebook_url: '', twitter_url: '', youtube_url: '', linkedin_url: '',
  });

  useEffect(() => {
    const fetchSocialLinks = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['instagram_url', 'facebook_url', 'twitter_url', 'youtube_url', 'linkedin_url']);

      if (data) {
        const links: Partial<SocialLinks> = {};
        data.forEach(item => { links[item.key as keyof SocialLinks] = item.value || ''; });
        setSocialLinks(prev => ({ ...prev, ...links }));
      }
    };
    fetchSocialLinks();
  }, []);

  const socialIcons = [
    { key: 'instagram_url', icon: Instagram, label: 'Instagram' },
    { key: 'facebook_url', icon: Facebook, label: 'Facebook' },
    { key: 'twitter_url', icon: Twitter, label: 'Twitter' },
    { key: 'youtube_url', icon: Youtube, label: 'YouTube' },
    { key: 'linkedin_url', icon: Linkedin, label: 'LinkedIn' },
  ];

  const activeSocials = socialIcons.filter(s => socialLinks[s.key as keyof SocialLinks]);

  const trustBadges = [
    { icon: Shield, label: 'Secure Payments' },
    { icon: Lock, label: 'SSL Encrypted' },
    { icon: Zap, label: 'Instant Access' },
  ];

  return (
    <footer className="relative border-t border-border/15">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      
      {/* Newsletter CTA */}
      <div className="border-b border-border/15">
        <div className="container-wide py-14 sm:py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
            <div>
              <h3 className="font-display text-xl md:text-2xl font-semibold tracking-tight mb-2">
                Stay in the loop
              </h3>
              <p className="text-sm text-muted-foreground">
                Get architecture insights, new course drops, and Studio Hub updates.
              </p>
            </div>
            <Link to="/auth?mode=signup">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-6 gap-2 shadow-[0_0_20px_hsl(var(--accent)/0.15)]">
                Join Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container-wide py-14 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-5">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img 
                src={logoMark} 
                alt="Archistudio Footer Logo" 
                className="h-7 w-7 rounded-md object-cover transition-transform duration-300 group-hover:scale-110" 
                loading="lazy"
                decoding="async"
              />
              <span className="font-display font-bold text-base text-foreground tracking-tight">Archistudio</span>
            </Link>
            <p className="text-body-sm text-muted-foreground leading-relaxed max-w-xs">
              Practical architecture education for the real world. Built by architects, for architects.
            </p>
            
            {activeSocials.length > 0 && (
              <div className="flex gap-2">
                {activeSocials.map((social) => (
                  <a
                    key={social.key}
                    href={socialLinks[social.key as keyof SocialLinks]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-secondary/50 hover:bg-accent hover:text-accent-foreground transition-all duration-300 border border-border/20 hover:border-accent/30 hover:scale-110 touch-target min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          {[
            { title: 'Learn', links: [
              { label: 'All Courses', to: '/courses' },
              { label: 'Explore', to: '/explore' },
              { label: 'Learning Paths', to: '/roadmaps' },
              { label: 'Learning Map', to: '/learning-map' },
              { label: 'eBooks', to: '/ebooks' },
              { label: 'Resources', to: '/resources' },
            ]},
            { title: 'Community', links: [
              { label: 'Forum', to: '/forum' },
              { label: 'Sheet Reviews', to: '/sheets' },
              { label: 'Competitions', to: '/competitions' },
              { label: 'Daily Challenges', to: '/challenges' },
              { label: 'Internships', to: '/internships' },
              { label: 'Portfolios', to: '/portfolios' },
              { label: 'Leaderboard', to: '/leaderboard' },
            ]},
            { title: 'Discover', links: [
              { label: 'Studio Hub', to: '/studio-hub' },
              { label: 'Case Studies', to: '/case-studies' },
              { label: 'Blog', to: '/blog' },
              { label: 'Sitemap', to: '/sitemap' },
            ]},
            { title: 'Company', links: [
              { label: 'Contact Us', to: '/contact' },
              { label: 'Terms & Conditions', to: '/terms' },
              { label: 'Privacy Policy', to: '/privacy' },
            ]},
          ].map((section) => (
            <div key={section.title}>
              <h4 className="font-display text-caption uppercase tracking-[0.14em] text-foreground mb-5 font-semibold">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link 
                      to={link.to} 
                      className="text-body-sm text-muted-foreground hover:text-foreground transition-colors duration-300 inline-flex items-center gap-1 group py-0.5"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300 hidden sm:block" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          {trustBadges.map((badge) => (
            <div key={badge.label} className="trust-badge">
              <badge.icon className="h-3.5 w-3.5 text-accent" />
              <span>{badge.label}</span>
            </div>
          ))}
        </div>

        <div className="section-divider mb-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-safe">
          <div className="text-caption text-muted-foreground">
            © {new Date().getFullYear()} Archistudio. All rights reserved.
          </div>
          <div className="text-caption text-muted-foreground/50 italic">
            For the architects of tomorrow. Designed for excellence.
          </div>
        </div>
      </div>
    </footer>
  );
}
