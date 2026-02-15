import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Instagram, Facebook, Twitter, Youtube, Linkedin, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

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

  return (
    <footer className="relative border-t border-border/20 glass">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      
      <div className="container-wide py-16 sm:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 mb-12 motion-stagger">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-5">
            <div className="font-display font-bold text-lg text-foreground">Archistudio</div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Practical architecture education for the real world. Built by architects, for architects.
            </p>
            
            {activeSocials.length > 0 && (
              <div className="flex gap-2">
                {activeSocials.map((social) => (
                  <motion.a
                    key={social.key}
                    href={socialLinks[social.key as keyof SocialLinks]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-secondary/40 hover:bg-accent hover:text-accent-foreground transition-all duration-300 border border-border/30 hover:border-accent/40 touch-target min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label={social.label}
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <social.icon className="h-4 w-4" />
                  </motion.a>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          {[
            { title: 'Studios', links: [
              { label: 'All Programs', to: '/courses' },
              { label: 'Beginner Track', to: '/courses?level=beginner' },
              { label: 'Advanced Track', to: '/courses?level=advanced' },
            ]},
            { title: 'Company', links: [
              { label: 'About Us', to: '/about' },
              { label: 'Blog', to: '/blog' },
              { label: 'Contact', to: '/contact' },
            ]},
            { title: 'Legal', links: [
              { label: 'Terms & Conditions', to: '/terms' },
              { label: 'Contact Us', to: '/contact' },
            ]},
          ].map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-medium tracking-[0.12em] uppercase text-foreground mb-5">{section.title}</h4>
              <ul className="space-y-3 text-sm">
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link 
                      to={link.to} 
                      className="text-muted-foreground hover:text-foreground transition-colors duration-300 inline-flex items-center gap-1 group py-0.5"
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

        <div className="divider-metallic mb-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-safe">
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Archistudio. All rights reserved.
          </div>
          <div className="text-xs text-muted-foreground/60">
            For architects who want to build, not just design.
          </div>
        </div>
      </div>
    </footer>
  );
}
