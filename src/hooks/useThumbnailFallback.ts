import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Premium gradient-based SVG placeholder generator based on course topic
const generatePlaceholderSvg = (title: string, category: string): string => {
  // Generate consistent color from title
  const hash = title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue1 = hash % 360;
  const hue2 = (hue1 + 45) % 360;
  
  // Get category-specific icon path (SVG path data for sharp, architectural icons)
  const iconPaths: Record<string, { path: string; label: string }> = {
    '3d-visualization': { path: 'M40 28L52 20V36L40 44L28 36V20L40 28ZM40 28V44', label: '3D Viz' },
    'cad': { path: 'M26 22H54M26 30H54M26 38H42M22 18H58V46H22V18Z', label: 'CAD' },
    'bim': { path: 'M28 44V28L40 20L52 28V44H28ZM36 44V36H44V44', label: 'BIM' },
    'rendering': { path: 'M40 20C46.627 20 52 25.373 52 32C52 38.627 46.627 44 40 44C33.373 44 28 38.627 28 32C28 25.373 33.373 20 40 20ZM40 24V32L46 38', label: 'Render' },
    'post-production': { path: 'M24 24H56V44H24V24ZM32 24V20H48V24M30 32H50M30 38H42', label: 'Post-Pro' },
    'interior-design': { path: 'M26 42V26H54V42H26ZM26 34H38V42M42 26V42', label: 'Interior' },
    'fundamentals': { path: 'M40 18L56 28V42L40 52L24 42V28L40 18Z', label: 'Core' },
    'modeling': { path: 'M28 40L40 20L52 40H28ZM34 40L40 28L46 40', label: 'Model' },
  };
  
  const iconData = iconPaths[category] || { path: 'M28 40L40 20L52 40H28Z', label: 'Studio' };
  const shortTitle = title.length > 35 ? title.substring(0, 32) + '…' : title;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <defs>
      <linearGradient id="bg-${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:hsl(${hue1},45%,12%)" />
        <stop offset="50%" style="stop-color:hsl(${hue1},35%,8%)" />
        <stop offset="100%" style="stop-color:hsl(${hue2},40%,14%)" />
      </linearGradient>
      <linearGradient id="accent-${hash}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:hsl(18,70%,50%)" />
        <stop offset="100%" style="stop-color:hsl(30,80%,55%)" />
      </linearGradient>
      <pattern id="dots-${hash}" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="0.8" fill="rgba(255,255,255,0.04)"/>
      </pattern>
    </defs>
    <rect width="640" height="360" fill="url(#bg-${hash})"/>
    <rect width="640" height="360" fill="url(#dots-${hash})"/>
    <rect x="0" y="0" width="640" height="3" fill="url(#accent-${hash})" opacity="0.7"/>
    <g transform="translate(280,100) scale(2.8)" fill="none" stroke="url(#accent-${hash})" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.8">
      <path d="${iconData.path}"/>
    </g>
    <text x="320" y="240" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="17" font-weight="600" fill="rgba(255,255,255,0.88)" letter-spacing="0.02em">${shortTitle}</text>
    <text x="320" y="268" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="500" fill="hsl(18,70%,55%)" letter-spacing="0.12em" text-transform="uppercase">${iconData.label}</text>
    <text x="320" y="330" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="10" fill="rgba(255,255,255,0.25)" letter-spacing="0.15em">ARCHISTUDIO</text>
  </svg>`;
  
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

// Track failed thumbnails to avoid re-trying
const failedThumbnails = new Set<string>();
const loggedErrors = new Set<string>();

/**
 * Log thumbnail error to database for admin visibility
 */
const logThumbnailError = async (courseSlug: string, courseTitle: string, failedUrl: string) => {
  const key = `${courseSlug}-${failedUrl}`;
  if (loggedErrors.has(key)) return;
  loggedErrors.add(key);
  
  try {
    await supabase.from('site_settings').upsert({
      key: `auto_fix_log_thumb_${courseSlug}`,
      value: JSON.stringify({
        type: 'thumbnail_auto_fix',
        course_slug: courseSlug,
        course_title: courseTitle,
        failed_url: failedUrl,
        fixed_with: 'auto_generated_placeholder',
        fixed_at: new Date().toISOString(),
        status: 'resolved',
      }),
      description: `Auto-fix: Thumbnail failed for "${courseTitle}" - replaced with generated placeholder`,
    }, { onConflict: 'key' });
  } catch (e) {
    console.warn('Failed to log thumbnail error:', e);
  }
};

/**
 * Hook that provides smart thumbnail fallback with auto-generated placeholders
 */
export function useThumbnailFallback() {
  const handleThumbnailError = useCallback((
    e: React.SyntheticEvent<HTMLImageElement>,
    courseSlug: string,
    courseTitle: string,
    category: string,
    staticFallback?: string
  ) => {
    const img = e.currentTarget;
    const failedUrl = img.src;
    
    // Prevent infinite error loop
    if (failedThumbnails.has(courseSlug)) {
      img.src = staticFallback || '/placeholder.svg';
      return;
    }
    
    failedThumbnails.add(courseSlug);
    
    // Generate and apply placeholder
    img.src = generatePlaceholderSvg(courseTitle, category);
    
    // Log error for admin
    logThumbnailError(courseSlug, courseTitle, failedUrl);
  }, []);

  return { handleThumbnailError, generatePlaceholderSvg };
}
