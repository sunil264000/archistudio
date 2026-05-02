import { User } from 'lucide-react';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  gender?: 'male' | 'female' | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function UserAvatar({ src, name, gender, size = 'md', className = '' }: UserAvatarProps) {
  // Define fallback images based on gender (Using the generated IDs)
  const fallbackImages = {
    male: "https://archistudio.shop/avatars/pro_male_1.png", // We will link these in the build
    female: "https://archistudio.shop/avatars/pro_female_1.png"
  };

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-xl",
    xl: "h-24 w-24 text-2xl"
  };

  const getFallback = () => {
    if (gender === 'male') return fallbackImages.male;
    if (gender === 'female') return fallbackImages.female;
    return null;
  };

  const avatarSrc = src || getFallback();

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-muted/60 border border-border/40 shrink-0 flex items-center justify-center ${className}`}>
      {avatarSrc ? (
        <img 
          src={avatarSrc} 
          alt={name || 'User'} 
          className="w-full h-full object-cover transition-opacity duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = ''; // Clear src on error to show initials
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-display font-bold text-muted-foreground bg-gradient-to-br from-muted to-muted/30">
          {(name || '?').slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  );
}
