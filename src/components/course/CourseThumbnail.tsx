import { useState, useCallback, useRef, useEffect } from 'react';
import { categoryImages } from '@/data/courses';

/** Premium gradient SVG placeholder keyed by course title + category */
function generatePlaceholder(title: string, category: string): string {
  const hash = title.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const h1 = hash % 360;
  const h2 = (h1 + 40) % 360;

  const icons: Record<string, string> = {
    'corona-vray': 'M40 20C46.6 20 52 25.4 52 32C52 38.6 46.6 44 40 44C33.4 44 28 38.6 28 32C28 25.4 33.4 20 40 20ZM40 24V32L46 38',
    '3ds-max': 'M28 44V28L40 20L52 28V44H28ZM36 44V36H44V44',
    'revit-bim': 'M28 44V28L40 20L52 28V44H28ZM36 44V36H44V44',
    'sketchup': 'M26 22H54M26 30H54M26 38H42M22 18H58V46H22V18Z',
    'autocad': 'M26 22H54M26 30H54M26 38H42M22 18H58V46H22V18Z',
    'visualization': 'M40 20C46.6 20 52 25.4 52 32S46.6 44 40 44S28 38.6 28 32S33.4 20 40 20ZM36 28L48 32L36 36Z',
    'rhino': 'M28 40L40 20L52 40H28ZM34 40L40 28L46 40',
    'fundamentals': 'M40 18L56 28V42L40 52L24 42V28L40 18Z',
    'interior-design': 'M26 42V26H54V42H26ZM26 34H38V42M42 26V42',
    'post-production': 'M24 24H56V44H24V24ZM32 24V20H48V24M30 32H50M30 38H42',
  };

  const iconPath = icons[category] || 'M28 40L40 20L52 40H28Z';
  const short = title.length > 30 ? title.substring(0, 28) + '…' : title;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="750" height="422" viewBox="0 0 750 422">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:hsl(${h1},40%,12%)"/>
        <stop offset="100%" style="stop-color:hsl(${h2},35%,18%)"/>
      </linearGradient>
      <linearGradient id="ac" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:hsl(18,70%,50%)"/>
        <stop offset="100%" style="stop-color:hsl(30,80%,55%)"/>
      </linearGradient>
    </defs>
    <rect width="750" height="422" fill="url(#bg)"/>
    <rect x="0" y="0" width="750" height="4" fill="url(#ac)" opacity=".8"/>
    <g transform="translate(335,100) scale(3.5)" fill="none" stroke="url(#ac)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".9">
      <path d="${iconPath}"/>
    </g>
    <text x="375" y="275" text-anchor="middle" font-family="system-ui,sans-serif" font-size="22" font-weight="700" fill="rgba(255,255,255,.9)" letter-spacing=".03em">${short}</text>
    <text x="375" y="305" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="600" fill="hsl(18,70%,55%)" letter-spacing=".15em">${category.toUpperCase().replace(/-/g, ' ')}</text>
    <text x="375" y="400" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="rgba(255,255,255,.25)" letter-spacing=".15em">ARCHISTUDIO</text>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

interface CourseThumbnailProps {
  src: string;
  alt: string;
  slug: string;
  category: string;
  className?: string;
}

export function CourseThumbnail({ src, alt, slug, category, className = '' }: CourseThumbnailProps) {
  // 0 = primary URL, 1 = category image, 2 = generated SVG
  const [stage, setStage] = useState(src ? 0 : 1);
  const errorCountRef = useRef(0);

  // Reset stage if src changes dynamically
  useEffect(() => {
    setStage(src ? 0 : 1);
    errorCountRef.current = 0;
  }, [src]);

  const currentSrc = stage === 0
    ? src
    : stage === 1
      ? (categoryImages[category] || generatePlaceholder(alt, category))
      : generatePlaceholder(alt, category);

  const handleError = useCallback(() => {
    errorCountRef.current += 1;
    // Safety: prevent infinite error loops
    if (errorCountRef.current > 3) return;
    setStage(prev => {
      if (prev === 0) return categoryImages[category] ? 1 : 2;
      return 2; // final fallback
    });
  }, [category]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={stage < 2 ? handleError : undefined}
    />
  );
}
