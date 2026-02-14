import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Gradient-based SVG placeholder generator based on course topic
const generatePlaceholderSvg = (title: string, category: string): string => {
  // Generate consistent color from title
  const hash = title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue1 = hash % 360;
  const hue2 = (hue1 + 40) % 360;
  
  const iconMap: Record<string, string> = {
    '3d-visualization': '🏗️',
    'cad': '📐',
    'bim': '🏢',
    'rendering': '🎨',
    'post-production': '🖥️',
    'interior-design': '🏠',
    'fundamentals': '📚',
    'modeling': '🔷',
  };
  
  const icon = iconMap[category] || '📘';
  const shortTitle = title.length > 30 ? title.substring(0, 27) + '...' : title;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:hsl(${hue1},60%,15%)" />
        <stop offset="100%" style="stop-color:hsl(${hue2},50%,25%)" />
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="640" height="360" fill="url(#bg)"/>
    <rect width="640" height="360" fill="url(#grid)"/>
    <text x="320" y="150" text-anchor="middle" font-size="64">${icon}</text>
    <text x="320" y="210" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="600" fill="rgba(255,255,255,0.9)">${shortTitle}</text>
    <text x="320" y="240" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" fill="rgba(255,255,255,0.5)">Archistudio</text>
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
