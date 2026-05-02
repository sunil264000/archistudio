import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Free RSS feeds from top architecture sources
const FEEDS = [
  { url: "https://www.archdaily.com/feed", source: "ArchDaily", category: "architecture" },
  { url: "https://www.dezeen.com/feed/", source: "Dezeen", category: "design" },
  { url: "https://www.designboom.com/feed/", source: "Designboom", category: "design" },
  { url: "https://architizer.com/blog/feed/", source: "Architizer", category: "architecture" },
  { url: "https://www.architecturalrecord.com/rss/articles", source: "Architectural Record", category: "news" },
  { url: "https://www.e-architect.com/feed", source: "e-architect", category: "architecture" }
];

function extractImageFromContent(content: string): string | null {
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return imgMatch ? imgMatch[1] : null;
}

function parseRSSItem(item: string, source: string, category: string) {
  const getTag = (tag: string) => {
    const match = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[(.+?)\\]\\]></${tag}>`, 's'))
      || item.match(new RegExp(`<${tag}[^>]*>(.+?)</${tag}>`, 's'));
    return match ? match[1].trim() : null;
  };

  const title = getTag('title');
  const link = getTag('link');
  const pubDate = getTag('pubDate');
  const description = getTag('description') || '';
  const content = getTag('content:encoded') || description;

  // Try media:content, enclosure, or extract from content
  const mediaMatch = item.match(/url=["']([^"']+\.(jpg|jpeg|png|webp)[^"']*)/i);
  const image = mediaMatch ? mediaMatch[1] : extractImageFromContent(content);

  // Strip HTML from description
  const cleanDesc = description.replace(/<[^>]+>/g, '').substring(0, 200);

  if (!title) return null;

  return {
    title,
    link,
    image,
    description: cleanDesc,
    published_at: pubDate ? new Date(pubDate).toISOString() : null,
    source,
    category,
  };
}

async function fetchFeed(feedConfig: typeof FEEDS[0]) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout per feed

    const response = await fetch(feedConfig.url, {
      headers: { 'User-Agent': 'Archistudio/1.0' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    if (!response.ok) return [];

    const xml = await response.text();
    const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];

    return items.slice(0, 5).map(item => // Reduced from 8 to 5 to handle more feeds
      parseRSSItem(item, feedConfig.source, feedConfig.category)
    ).filter(Boolean);
  } catch (err) {
    console.warn(`Failed to fetch ${feedConfig.source}:`, err instanceof Error ? err.message : err);
    return [];
  }
}


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const results = await Promise.allSettled(FEEDS.map(fetchFeed));
    const articles = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => (r as PromiseFulfilledResult<any[]>).value)
      .sort((a, b) => {
        if (!a.published_at || !b.published_at) return 0;
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      });

    return new Response(JSON.stringify({ articles, count: articles.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=1800" },
    });
  } catch (err) {
    console.error("Feed fetch error:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch feeds", articles: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
