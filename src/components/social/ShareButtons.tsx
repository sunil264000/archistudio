import { Button } from '@/components/ui/button';
import { Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'icon';
}

export function ShareButtons({ url, title, description, variant = 'outline', size = 'sm' }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description || title);

  const copyLink = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    { label: 'Twitter / X', url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}` },
    { label: 'LinkedIn', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { label: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: 'WhatsApp', url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-1.5">
          <Share2 className="h-3.5 w-3.5" /> Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={copyLink} className="gap-2 cursor-pointer">
          {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
          Copy Link
        </DropdownMenuItem>
        {shareLinks.map((link) => (
          <DropdownMenuItem key={link.label} asChild className="cursor-pointer">
            <a href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
