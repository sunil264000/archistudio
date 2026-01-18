import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/20">
      <div className="container-wide py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="font-display font-bold text-xl mb-4">Archistudio</div>
            <p className="text-sm text-muted-foreground">
              Practical architecture education for the real world.
            </p>
          </div>

          {/* Courses */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
              Courses
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/courses/beginner" className="text-muted-foreground hover:text-foreground transition-colors">
                  Beginner Track
                </Link>
              </li>
              <li>
                <Link to="/courses/intermediate" className="text-muted-foreground hover:text-foreground transition-colors">
                  Intermediate Track
                </Link>
              </li>
              <li>
                <Link to="/courses/advanced" className="text-muted-foreground hover:text-foreground transition-colors">
                  Advanced Track
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
              Company
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
              Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refund" className="text-muted-foreground hover:text-foreground transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Archistudio. All rights reserved.
          </div>
          <div className="text-sm text-muted-foreground">
            Made for architects who want to build, not just design.
          </div>
        </div>
      </div>
    </footer>
  );
}
