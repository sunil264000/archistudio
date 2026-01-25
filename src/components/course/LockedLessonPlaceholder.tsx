import { Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  title?: string;
  description?: string | null;
  isLoggedIn: boolean;
  onSignIn: () => void;
  onEnroll: () => void;
};

export function LockedLessonPlaceholder({
  title,
  description,
  isLoggedIn,
  onSignIn,
  onEnroll,
}: Props) {
  return (
    <div className="w-full aspect-video max-w-5xl mx-auto">
      <div className="h-full w-full rounded-lg border bg-card flex items-center justify-center p-6">
        <div className="max-w-lg text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full border bg-muted flex items-center justify-center">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>

          <p className="text-base font-semibold text-foreground">Lesson locked</p>
          {title ? (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{title}</p>
          ) : null}

          {description ? (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{description}</p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Enroll to unlock HD protected streaming and full resources.
            </p>
          )}

          <div className="mt-5 flex flex-col gap-2">
            {!isLoggedIn ? (
              <Button onClick={onSignIn} className="w-full gap-2">
                <LogIn className="h-4 w-4" />
                Sign in to continue
              </Button>
            ) : (
              <Button onClick={onEnroll} className="w-full">
                Enroll to unlock
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
