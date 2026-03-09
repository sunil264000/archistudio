import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Instagram, Facebook, Twitter, Youtube, Linkedin, ArrowUpRight } from 'lucide-react';
import logoMark from '@/assets/logo-mark.png';

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
    <footer className="relative border-t border-border/15">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/15 to-transparent" />
      
      <div className="container-wide py-16 sm:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-5">
            <div className="flex items-center gap-2.5">
              <img src={logoMark} alt="Archistudio" className="h-7 w-7 rounded-md object-cover" />
              <span className="font-display font-bold text-base text-foreground">Archistudio</span>
            </div>
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
                    className="p-2.5 rounded-lg bg-secondary/50 hover:bg-accent hover:text-accent-foreground transition-all duration-300 border border-border/20 hover:border-accent/30 touch-target min-w-[44px] min-h-[44px] flex items-center justify-center"
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
            { title: 'Courses', links: [
              { label: 'All Programs', to: '/courses' },
              { label: 'Beginner Track', to: '/courses?level=beginner' },
              { label: 'Advanced Track', to: '/courses?level=advanced' },
            ]},
            { title: 'Company', links: [
              { label: 'Blog', to: '/blog' },
              { label: 'Contact', to: '/contact' },
              { label: 'Sitemap', to: '/sitemap' },
            ]},
            { title: 'Legal', links: [
              { label: 'Terms & Conditions', to: '/terms' },
              { label: 'Privacy Policy', to: '/privacy' },
            ]},
          ].map((section) => (
            <div key={section.title}>
              <h4 className="font-display text-caption uppercase tracking-[0.14em] text-foreground mb-5 font-semibold">{section.title}</h4>
              <ul className="space-y-3">
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

        <div className="divider-metallic mb-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-safe">
          <div className="text-caption text-muted-foreground">
            © {new Date().getFullYear()} Archistudio. All rights reserved.
          </div>
          <div className="text-caption text-muted-foreground/50">
            For architects who want to build, not just design.
          </div>
        </div>
      </div>
    </footer>
  );
}
