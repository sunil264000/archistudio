import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AnimatedBackground } from "@/components/layout/AnimatedBackground";
import { Button } from "@/components/ui/button";
import { Home, BookOpen, Library, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      <AnimatedBackground intensity="light" />
      
      <main className="pt-32 pb-24 flex items-center justify-center min-h-[80vh]">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-lg mx-auto space-y-8"
          >
            {/* Large 404 */}
            <div className="relative">
              <h1 className="text-[120px] sm:text-[160px] font-black leading-none bg-gradient-to-b from-accent/40 to-accent/5 bg-clip-text text-transparent select-none">
                404
              </h1>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-accent/10 blur-2xl" />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold">Page not found</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                The page you're looking for doesn't exist or has been moved. Let's get you back on track.
              </p>
            </div>

            {/* Suggested Links */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/">
                  <Home className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link to="/courses">
                  <BookOpen className="h-4 w-4" />
                  Browse Courses
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link to="/ebooks">
                  <Library className="h-4 w-4" />
                  eBooks
                </Link>
              </Button>
            </div>

            {/* Go back */}
            <Button 
              variant="ghost" 
              className="gap-2 text-muted-foreground"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Go back to previous page
            </Button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
