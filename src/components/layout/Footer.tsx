import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Instagram, Facebook, Twitter, Youtube, Linkedin } from 'lucide-react';

interface SocialLinks {
  instagram_url: string;
  facebook_url: string;
  twitter_url: string;
  youtube_url: string;
  linkedin_url: string;
}

export function Footer() {
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram_url: '',
    facebook_url: '',
    twitter_url: '',
    youtube_url: '',
    linkedin_url: '',
  });

  useEffect(() => {
    const fetchSocialLinks = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['instagram_url', 'facebook_url', 'twitter_url', 'youtube_url', 'linkedin_url']);

      if (data) {
        const links: Partial<SocialLinks> = {};
        data.forEach(item => {
          links[item.key as keyof SocialLinks] = item.value || '';
        });
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

  const activeSocials = socialIcons.filter(
    s => socialLinks[s.key as keyof SocialLinks]
  );

  return (
    <footer className="border-t border-border bg-secondary/20">
      <div className="container-wide py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="font-display font-bold text-xl mb-4">Archistudio</div>
            <p className="text-sm text-muted-foreground mb-4">
              Practical architecture education for the real world.
            </p>
            
            {/* Social Links */}
            {activeSocials.length > 0 && (
              <div className="flex gap-3">
                {activeSocials.map(social => (
                  <a
                    key={social.key}
                    href={socialLinks[social.key as keyof SocialLinks]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-muted hover:bg-accent hover:text-accent-foreground transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Courses */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
              Courses
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/courses" className="text-muted-foreground hover:text-foreground transition-colors">
                  All Courses
                </Link>
              </li>
              <li>
                <Link to="/courses?level=beginner" className="text-muted-foreground hover:text-foreground transition-colors">
                  Beginner Track
                </Link>
              </li>
              <li>
                <Link to="/courses?level=advanced" className="text-muted-foreground hover:text-foreground transition-colors">
                  Advanced Track
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
              Company
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
              Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/refunds" className="text-muted-foreground hover:text-foreground transition-colors">
                  Refunds & Cancellations
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Archistudio. All rights reserved.
          </div>
          <div className="text-sm text-muted-foreground">
            Made for architects who want to build, not just design.
          </div>
        </div>
      </div>
    </footer>
  );
}
