// Cleaned, deduplicated, and categorized courses with AI-generated descriptions

// Course thumbnail images by category
import coronaRenderingImg from '@/assets/courses/corona-rendering.jpg';
import dsMaxImg from '@/assets/courses/3ds-max.jpg';
import revitBimImg from '@/assets/courses/revit-bim.jpg';
import sketchupImg from '@/assets/courses/sketchup.jpg';
import autocadImg from '@/assets/courses/autocad.jpg';
import visualizationImg from '@/assets/courses/visualization.jpg';
import rhinoImg from '@/assets/courses/rhino.jpg';
import fundamentalsImg from '@/assets/courses/fundamentals.jpg';
import interiorDesignImg from '@/assets/courses/interior-design.jpg';
import postProductionImg from '@/assets/courses/post-production.jpg';

// Category to image mapping
export const categoryImages: Record<string, string> = {
  'corona-vray': coronaRenderingImg,
  '3ds-max': dsMaxImg,
  'revit-bim': revitBimImg,
  'sketchup': sketchupImg,
  'autocad': autocadImg,
  'visualization': visualizationImg,
  'rhino': rhinoImg,
  'fundamentals': fundamentalsImg,
  'interior-design': interiorDesignImg,
  'post-production': postProductionImg,
};

export interface Course {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  subcategory: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  durationHours: number;
  totalLessons: number;
  priceUsd?: number; // Optional - not displayed in UI
  priceInr: number;
  thumbnail: string;
  isFeatured: boolean;
  isPublished: boolean;
  tags: string[];
  resource_link?: string | null;
}

export const courseCategories = [
  {
    id: 'corona-vray',
    name: 'Corona & V-Ray Rendering',
    description: 'Master photorealistic rendering with Corona and V-Ray engines',
    icon: '🎨',
  },
  {
    id: '3ds-max',
    name: '3ds Max',
    description: '3D modeling, animation, and visualization with 3ds Max',
    icon: '🏠',
  },
  {
    id: 'revit-bim',
    name: 'Revit & BIM',
    description: 'Building Information Modeling and Revit workflows',
    icon: '🏗️',
  },
  {
    id: 'sketchup',
    name: 'SketchUp & V-Ray',
    description: '3D design and visualization with SketchUp',
    icon: '✏️',
  },
  {
    id: 'autocad',
    name: 'AutoCAD & Drafting',
    description: 'Technical drawing and drafting mastery',
    icon: '📐',
  },
  {
    id: 'visualization',
    name: 'Visualization Tools',
    description: 'Lumion, Twinmotion, D5 Render, and Enscape',
    icon: '🖼️',
  },
  {
    id: 'rhino',
    name: 'Rhino 3D',
    description: 'Advanced 3D modeling with Rhino',
    icon: '🦏',
  },
  {
    id: 'fundamentals',
    name: 'Design Fundamentals',
    description: 'Sketching, portfolio, and design principles',
    icon: '📚',
  },
  {
    id: 'interior-design',
    name: 'Interior Design',
    description: 'Complete interior design workflows and techniques',
    icon: '🛋️',
  },
  {
    id: 'post-production',
    name: 'Post-Production',
    description: 'Photoshop, After Effects, and presentation skills',
    icon: '🎬',
  },
];


export const courses: Course[] = []; // Migrated to DB
