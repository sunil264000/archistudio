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

    const { data: ebooks, error } = await supabase
      .from('ebooks')
      .select('id, title')
      .is('cover_image_url', null)
      .limit(limit)

    if (error) throw error
    if (!ebooks || ebooks.length === 0) {
      return new Response(JSON.stringify({ message: 'All ebooks already have covers', updated: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Found ${ebooks.length} ebooks without covers`)

    let updated = 0
    const results: { id: string; title: string; coverUrl: string | null; error?: string }[] = []

    for (const ebook of ebooks) {
      try {
        // Clean up title for better search results
        const searchTitle = ebook.title
          .replace(/\+/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/\([^)]*\)/g, '')
          .replace(/free$/i, '')
          .replace(/preview\s*\d*/i, '')
          .replace(/v\d+/i, '')
          .replace(/vol\s*\d+/i, '')
          .trim()

        console.log(`Searching for: "${searchTitle}"`)

        // Search Google Books API (no API key required for basic search)
        const query = encodeURIComponent(searchTitle)
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=3&printType=books`
        )

        if (!response.ok) {
          console.error(`Google Books API error for "${searchTitle}": ${response.status}`)
          results.push({ id: ebook.id, title: ebook.title, coverUrl: null, error: `API error: ${response.status}` })
          continue
        }

        const data = await response.json()

        // Find best cover image
        let coverUrl: string | null = null

        if (data.items && data.items.length > 0) {
          for (const item of data.items) {
            const imageLinks = item.volumeInfo?.imageLinks
            if (imageLinks) {
              // Prefer higher quality: extraLarge > large > medium > thumbnail
              coverUrl = imageLinks.extraLarge || imageLinks.large || imageLinks.medium || imageLinks.thumbnail || null
              
              if (coverUrl) {
                // Replace http with https and request higher zoom
                coverUrl = coverUrl.replace('http://', 'https://')
                // Remove edge=curl parameter for cleaner image
                coverUrl = coverUrl.replace('&edge=curl', '')
                // Try to get higher quality by adjusting zoom
                if (coverUrl.includes('zoom=1')) {
                  coverUrl = coverUrl.replace('zoom=1', 'zoom=2')
                }
                break
              }
            }
          }
        }

        if (coverUrl) {
          // Update the ebook record
          const { error: updateError } = await supabase
            .from('ebooks')
            .update({ cover_image_url: coverUrl })
            .eq('id', ebook.id)

          if (updateError) {
            console.error(`Failed to update ebook ${ebook.id}:`, updateError)
            results.push({ id: ebook.id, title: ebook.title, coverUrl, error: updateError.message })
          } else {
            updated++
            console.log(`✓ Updated cover for: "${ebook.title}"`)
            results.push({ id: ebook.id, title: ebook.title, coverUrl })
          }
        } else {
          console.log(`✗ No cover found for: "${ebook.title}"`)
          results.push({ id: ebook.id, title: ebook.title, coverUrl: null, error: 'No cover found' })
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
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
