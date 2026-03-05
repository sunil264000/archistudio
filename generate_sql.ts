import fs from 'fs';
import { courses, courseCategories } from './src/data/courses';

let sql = `-- Migration Script to insert all hardcoded courses and categories into Supabase

-- 1. Insert Categories
INSERT INTO course_categories (id, name, description, icon) VALUES
`;

const categoryValues = courseCategories.map(c =>
    `  ('${c.id}', '${c.name.replace(/'/g, "''")}', '${c.description.replace(/'/g, "''")}', '${c.icon}')`
).join(',\n');

sql += categoryValues + '\nON CONFLICT (id) DO UPDATE SET\n  name = EXCLUDED.name,\n  description = EXCLUDED.description,\n  icon = EXCLUDED.icon;\n\n';

sql += `-- 2. Insert Courses
INSERT INTO courses (
  id, title, slug, short_description, description, category_id, 
  subcategory, level, duration_hours, total_lessons, 
  price_usd, price_inr, thumbnail_url, is_featured, is_published, tags
) VALUES
`;

const courseValues = courses.map(c => {
    const priceUsd = c.priceUsd ? c.priceUsd : 'NULL';
    const tagsStr = `ARRAY[${c.tags.map(t => `'${t.replace(/'/g, "''")}'`).join(', ')}]::text[]`;
    const isFeatured = c.isFeatured ? 'true' : 'false';
    const isPublished = c.isPublished ? 'true' : 'false';
    // Note: some courses might have a category string that corresponds to the category_id

    return `  (
    '${c.id}', 
    '${c.title.replace(/'/g, "''")}', 
    '${c.slug}', 
    '${c.shortDescription.replace(/'/g, "''")}', 
    '${c.description.replace(/'/g, "''")}', 
    '${c.category}', 
    '${c.subcategory.replace(/'/g, "''")}', 
    '${c.level}', 
    ${c.durationHours}, 
    ${c.totalLessons}, 
    ${priceUsd}, 
    ${c.priceInr}, 
    '${c.thumbnail}', 
    ${isFeatured}, 
    ${isPublished}, 
    ${tagsStr}
  )`;
}).join(',\n');

sql += courseValues + '\nON CONFLICT (id) DO UPDATE SET\n' +
    '  title = EXCLUDED.title,\n' +
    '  slug = EXCLUDED.slug,\n' +
    '  short_description = EXCLUDED.short_description,\n' +
    '  description = EXCLUDED.description,\n' +
    '  category_id = EXCLUDED.category_id,\n' +
    '  subcategory = EXCLUDED.subcategory,\n' +
    '  level = EXCLUDED.level,\n' +
    '  duration_hours = EXCLUDED.duration_hours,\n' +
    '  total_lessons = EXCLUDED.total_lessons,\n' +
    '  price_usd = EXCLUDED.price_usd,\n' +
    '  price_inr = EXCLUDED.price_inr,\n' +
    // Don't overwrite existing thumbnail URLs if they are already replaced in DB
    '  is_featured = EXCLUDED.is_featured,\n' +
    '  is_published = EXCLUDED.is_published,\n' +
    '  tags = EXCLUDED.tags;\n';

fs.writeFileSync('migrate_courses.sql', sql);
console.log('SQL script generated at migrate_courses.sql');
