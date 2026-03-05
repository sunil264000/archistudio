import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json().catch(() => ({}))
    const limit = body.limit || 10
    const forceRefresh = body.forceRefresh || false

    const query = supabase.from('ebooks').select('id, title')
    
    if (!forceRefresh) {
      query.is('cover_image_url', null)
    }
    
    const { data: ebooks, error } = await query.limit(limit)

    if (error) throw error
    if (!ebooks || ebooks.length === 0) {
      return new Response(JSON.stringify({ message: 'All ebooks already have covers', updated: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Found ${ebooks.length} ebooks to process`)

    let updated = 0
    const results: { id: string; title: string; coverUrl: string | null; source?: string; error?: string }[] = []

    for (const ebook of ebooks) {
      try {
        // Clean up title for better search
        const searchTitle = ebook.title
          .replace(/\+/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/\([^)]*\)/g, '')
          .replace(/free$/i, '')
          .replace(/preview\s*\d*/i, '')
          .replace(/v\d+/i, '')
          .replace(/vol\s*\d+/i, '')
          .replace(/THE\s+/g, '')
          .replace(/by\s+\w+\s*$/i, '')
          .trim()

        console.log(`Searching for: "${searchTitle}"`)

        let coverUrl: string | null = null
        let source = ''

        // Strategy 1: Open Library (higher quality covers)
        try {
          const olQuery = encodeURIComponent(searchTitle)
          const olResponse = await fetch(
            `https://openlibrary.org/search.json?q=${olQuery}&limit=3&fields=key,title,cover_i`
          )
          if (olResponse.ok) {
            const olData = await olResponse.json()
            if (olData.docs) {
              for (const doc of olData.docs) {
                if (doc.cover_i) {
                  // Open Library provides high-quality covers: S, M, L sizes
                  coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
                  source = 'openlibrary'
                  break
                }
              }
            }
          }
        } catch (e) {
          console.log(`Open Library failed for "${searchTitle}":`, e)
        }

        // Strategy 2: Google Books API (fallback)
        if (!coverUrl) {
          try {
            const query = encodeURIComponent(searchTitle)
            const response = await fetch(
              `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=3&printType=books`
            )
            if (response.ok) {
              const data = await response.json()
              if (data.items) {
                for (const item of data.items) {
                  const imageLinks = item.volumeInfo?.imageLinks
                  if (imageLinks) {
                    // Build highest quality URL
                    const baseUrl = imageLinks.thumbnail || imageLinks.smallThumbnail
                    if (baseUrl) {
                      const improvedCoverUrl = baseUrl
                        .replace('http://', 'https://')
                        .replace('&edge=curl', '')
                        .replace(/zoom=\d/, 'zoom=3')
                        .replace(/&w=\d+/, '');

                      coverUrl = improvedCoverUrl.includes('zoom=')
                        ? improvedCoverUrl
                        : `${improvedCoverUrl}&zoom=3`;
                      source = 'google_books'
                      break
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.log(`Google Books failed for "${searchTitle}":`, e)
          }
        }

        if (coverUrl) {
          const { error: updateError } = await supabase
            .from('ebooks')
            .update({ cover_image_url: coverUrl })
            .eq('id', ebook.id)

          if (updateError) {
            console.error(`Failed to update ebook ${ebook.id}:`, updateError)
            results.push({ id: ebook.id, title: ebook.title, coverUrl, source, error: updateError.message })
          } else {
            updated++
            console.log(`✓ Updated cover for: "${ebook.title}" (${source})`)
            results.push({ id: ebook.id, title: ebook.title, coverUrl, source })
          }
        } else {
          console.log(`✗ No cover found for: "${ebook.title}"`)
          results.push({ id: ebook.id, title: ebook.title, coverUrl: null, error: 'No cover found' })
        }

        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (err) {
        console.error(`Error processing ebook "${ebook.title}":`, err)
        results.push({ id: ebook.id, title: ebook.title, coverUrl: null, error: String(err) })
      }
    }

    return new Response(
      JSON.stringify({ message: `Updated ${updated} of ${ebooks.length} ebooks`, updated, total: ebooks.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
