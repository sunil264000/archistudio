const fs = require('fs');

try {
    const content = fs.readFileSync('src/data/courses.ts', 'utf-8');

    const catMatch = content.match(/export const courseCategories = (\[[\s\S]*?\]);/);
    const courseMatch = content.match(/export const courses: Course\[\] = (\[[\s\S]*?\]);/);

    if (!catMatch || !courseMatch) {
        console.error("Could not find regex matches");
        process.exit(1);
    }

    const code = `
const fs = require('fs');
const categories = ${catMatch[1]};
const courses = ${courseMatch[1]};

let sql = '-- Migration Script to insert all hardcoded courses and categories into Supabase\\n\\n';

sql += '-- 0. Create course_categories table if it does not exist\\n';
sql += 'CREATE TABLE IF NOT EXISTS public.course_categories (\\n';
sql += '  id text PRIMARY KEY,\\n';
sql += '  name text NOT NULL,\\n';
sql += '  description text,\\n';
sql += '  icon text,\\n';
sql += '  created_at timestamp with time zone DEFAULT timezone(''utc''::text, now())\\n';
sql += ');\\n\\n';

sql += '-- 1. Insert Categories\\n';
sql += 'INSERT INTO public.course_categories (id, name, description, icon) VALUES\\n';

const catVals = categories.map(c => 
  \`  ('\${c.id}', '\${c.name.replace(/'/g, "''")}', '\${c.description.replace(/'/g, "''")}', '\${c.icon}')\`
).join(',\\n');

sql += catVals + '\\nON CONFLICT (id) DO UPDATE SET\\n  name = EXCLUDED.name,\\n  description = EXCLUDED.description,\\n  icon = EXCLUDED.icon;\\n\\n';

sql += '-- Ensure columns exist in courses table (just in case they don''t exist yet)\\n';
sql += 'ALTER TABLE public.courses \\n';
sql += 'ADD COLUMN IF NOT EXISTS short_description text,\\n';
sql += 'ADD COLUMN IF NOT EXISTS category_id text,\\n';
sql += 'ADD COLUMN IF NOT EXISTS subcategory text,\\n';
sql += 'ADD COLUMN IF NOT EXISTS level text,\\n';
sql += 'ADD COLUMN IF NOT EXISTS duration_hours numeric,\\n';
sql += 'ADD COLUMN IF NOT EXISTS total_lessons numeric,\\n';
sql += 'ADD COLUMN IF NOT EXISTS price_usd numeric,\\n';
sql += 'ADD COLUMN IF NOT EXISTS tags text[];\\n\\n';

sql += '-- 2. Insert Courses\\n';
sql += 'INSERT INTO public.courses (\\n';
sql += '  id, title, slug, short_description, description, category_id, \\n';
sql += '  subcategory, level, duration_hours, total_lessons, \\n';
sql += '  price_usd, price_inr, thumbnail_url, is_featured, is_published, tags\\n';
sql += ') VALUES\\n';

const courseVals = courses.map(c => {
  const priceUsd = c.priceUsd ? c.priceUsd : 'NULL';
  const tagsStr = \`ARRAY[\${c.tags.map(t => \`'\${t.replace(/'/g, "''")}'\`).join(', ')}]::text[]\`;
  const isFeatured = c.isFeatured ? 'true' : 'false';
  const isPublished = c.isPublished ? 'true' : 'false';
  
  return \`  (
    '\${c.id}', 
    '\${c.title.replace(/'/g, "''")}', 
    '\${c.slug}', 
    '\${c.shortDescription.replace(/'/g, "''")}', 
    '\${c.description.replace(/'/g, "''")}', 
    '\${c.category}', 
    '\${c.subcategory.replace(/'/g, "''")}', 
    '\${c.level}', 
    \${c.durationHours}, 
    \${c.totalLessons}, 
    \${priceUsd}, 
    \${c.priceInr}, 
    '/placeholder.svg', 
    \${isFeatured}, 
    \${isPublished}, 
    \${tagsStr}
  )\`;
}).join(',\\n');

sql += courseVals + '\\nON CONFLICT (id) DO UPDATE SET\\n' +
  '  title = EXCLUDED.title,\\n' +
  '  slug = EXCLUDED.slug,\\n' +
  '  short_description = EXCLUDED.short_description,\\n' +
  '  description = EXCLUDED.description,\\n' +
  '  category_id = EXCLUDED.category_id,\\n' +
  '  subcategory = EXCLUDED.subcategory,\\n' +
  '  level = EXCLUDED.level,\\n' +
  '  duration_hours = EXCLUDED.duration_hours,\\n' +
  '  total_lessons = EXCLUDED.total_lessons,\\n' +
  '  price_usd = EXCLUDED.price_usd,\\n' +
  '  price_inr = EXCLUDED.price_inr,\\n' +
  '  is_featured = EXCLUDED.is_featured,\\n' +
  '  is_published = EXCLUDED.is_published,\\n' +
  '  tags = EXCLUDED.tags;\\n';
  
fs.writeFileSync('C:/Users/kssun/.gemini/antigravity/brain/a99b35b2-707d-44bc-b16d-ce8b23758258/migrate_courses_v2.sql', sql);
console.log("SQL v2 generated successfully!");
`;

    fs.writeFileSync('extractor2.cjs', code);
    console.log("Extractor 2 written");
} catch (e) {
    console.error("err:", e);
}
