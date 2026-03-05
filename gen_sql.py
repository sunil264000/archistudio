import re
import json

def parse_ts_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract categories
    cat_match = re.search(r'export const courseCategories = (\[.*?\]);', content, re.DOTALL)
    categories_str = cat_match.group(1)
    
    # Extract courses
    course_match = re.search(r'export const courses: Course\[\] = (\[.*?\]);', content, re.DOTALL)
    courses_str = course_match.group(1)
    
    # We will write a tiny JS script to evaluate just these pure JS strings via node
    js_script = f"""
    const fs = require('fs');
    const categories = {categories_str};
    const courses = {courses_str};
    
    let sql = `-- Migration Script to insert all hardcoded courses and categories into Supabase\\n\\n`;
    sql += `-- 1. Insert Categories\\n`;
    sql += `INSERT INTO course_categories (id, name, description, icon) VALUES\\n`;
    
    const catVals = categories.map(c => 
      `  ('${c.id}', '${c.name.replace(/'/g, "''")}', '${c.description.replace(/'/g, "''")}', '${c.icon}')`
    ).join(',\\n');
    
    sql += catVals + '\\nON CONFLICT (id) DO UPDATE SET\\n  name = EXCLUDED.name,\\n  description = EXCLUDED.description,\\n  icon = EXCLUDED.icon;\\n\\n';
    
    sql += `-- 2. Insert Courses\\n`;
    sql += `INSERT INTO courses (\\n`;
    sql += `  id, title, slug, short_description, description, category_id, \\n`;
    sql += `  subcategory, level, duration_hours, total_lessons, \\n`;
    sql += `  price_usd, price_inr, thumbnail_url, is_featured, is_published, tags\\n`;
    sql += `) VALUES\\n`;
    
    const courseVals = courses.map(c => {{
      const priceUsd = c.priceUsd ? c.priceUsd : 'NULL';
      const tagsStr = `ARRAY[${c.tags.map(t => `'${t.replace(/'/g, "''")}'`).join(', ')}]::text[]`;
      const isFeatured = c.isFeatured ? 'true' : 'false';
      const isPublished = c.isPublished ? 'true' : 'false';
      
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
        '/placeholder.svg', 
        ${isFeatured}, 
        ${isPublished}, 
        ${tagsStr}
      )`;
    }}).join(',\\n');
    
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
      
    fs.writeFileSync(process.argv[2], sql);
    console.log("SQL script built at " + process.argv[2]);
    """
    
    with open('temp_eval.js', 'w', encoding='utf-8') as f:
        f.write(js_script)

if __name__ == '__main__':
    parse_ts_file('src/data/courses.ts')
