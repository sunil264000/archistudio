import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

const architectureQuotes = [
  { quote: "Architecture is the learned game, correct and magnificent, of forms assembled in the light.", author: "Le Corbusier" },
  { quote: "Less is more.", author: "Ludwig Mies van der Rohe" },
  { quote: "Architecture should speak of its time and place, but yearn for timelessness.", author: "Frank Gehry" },
  { quote: "God is in the details.", author: "Ludwig Mies van der Rohe" },
  { quote: "A great building must begin with the immeasurable, must go through measurable means when it is being designed, and in the end must be unmeasured.", author: "Louis Kahn" },
  { quote: "Architecture is basically a container of something. I hope they will enjoy not so much the teacup, but the tea.", author: "Yoshio Taniguchi" },
  { quote: "The mother art is architecture. Without an architecture of our own we have no soul of our own civilization.", author: "Frank Lloyd Wright" },
  { quote: "To create, one must first question everything.", author: "Eileen Gray" },
  { quote: "Space and light and order. Those are the things that men need just as much as they need bread or a place to sleep.", author: "Le Corbusier" },
  { quote: "Every great architect is — necessarily — a great poet.", author: "Frank Lloyd Wright" },
  { quote: "I don't design buildings, I design the quality of life for the people who live in them.", author: "Bjarke Ingels" },
  { quote: "Architecture is the thoughtful making of space.", author: "Louis Kahn" },
  { quote: "The details are not the details. They make the design.", author: "Charles Eames" },
  { quote: "Form follows function — that has been misunderstood. Form and function should be one.", author: "Frank Lloyd Wright" },
  { quote: "Architecture is the will of an epoch translated into space.", author: "Ludwig Mies van der Rohe" },
  { quote: "We shape our buildings; thereafter they shape us.", author: "Winston Churchill" },
  { quote: "A house is a machine for living in.", author: "Le Corbusier" },
  { quote: "The sun never knew how great it was until it hit the side of a building.", author: "Louis Kahn" },
  { quote: "Architecture starts when you carefully put two bricks together. There it begins.", author: "Ludwig Mies van der Rohe" },
  { quote: "Good buildings come from good people, and all problems are solved by good design.", author: "Stephen Gardiner" },
  { quote: "In pure architecture the smallest detail should have a meaning or serve a purpose.", author: "Augustus W. N. Pugin" },
  { quote: "Architecture is frozen music.", author: "Johann Wolfgang von Goethe" },
  { quote: "The longer I live, the more beautiful life becomes. If you foolishly ignore beauty, you will soon find yourself without it.", author: "Frank Lloyd Wright" },
  { quote: "Design is not just what it looks like and feels like. Design is how it works.", author: "Steve Jobs" },
  { quote: "Light creates ambience and feel of a place, as well as the expression of a structure.", author: "Le Corbusier" },
  { quote: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { quote: "Architecture is a visual art, and the buildings speak for themselves.", author: "Julia Morgan" },
  { quote: "Each new situation requires a new architecture.", author: "Jean Nouvel" },
  { quote: "I try to give people a different way of looking at their surroundings. That's art to me.", author: "Maya Lin" },
  { quote: "A building is not just a place to be but a way to be.", author: "Frank Lloyd Wright" },
  { quote: "The dialogue between client and architect is about as intimate as any conversation you can have, because when you're talking about building a house, you're talking about dreams.", author: "Robert A.M. Stern" },
  { quote: "You can't make architecture without studying the condition of life in the city.", author: "Rem Koolhaas" },
  { quote: "Great architecture is still the greatest form of art.", author: "Frank Lloyd Wright" },
  { quote: "When I am working on a problem, I never think about beauty. But when I have finished, if the solution is not beautiful, I know it is wrong.", author: "Buckminster Fuller" },
  { quote: "Recognizing the need is the primary condition for design.", author: "Charles Eames" },
  { quote: "Architecture is the art of how to waste space.", author: "Philip Johnson" },
  { quote: "A room is not a room without natural light.", author: "Louis Kahn" },
  { quote: "I believe that architecture is a pragmatic art. To become art it must be built on a foundation of necessity.", author: "I.M. Pei" },
  { quote: "Cities have the capability of providing something for everybody, only because, and only when, they are created by everybody.", author: "Jane Jacobs" },
  { quote: "Proportion is the heart of beauty.", author: "Andrea Palladio" },
  { quote: "All architecture is shelter, all great architecture is the design of space that contains, cuddles, exalts, or stimulates the persons in that space.", author: "Philip Johnson" },
  { quote: "Interior design is a business of trust.", author: "Venus Williams" },
  { quote: "We do not create the work. I believe we, in fact, are discoverers.", author: "Glenn Murcutt" },
  { quote: "I see architecture not as an object but as the art of the threshold.", author: "Peter Zumthor" },
  { quote: "Life is architecture and architecture is the mirror of life.", author: "I.M. Pei" },
  { quote: "An architect should live as little in cities as a painter. Send him to our hills, and let him study there what nature understands by a buttress.", author: "John Ruskin" },
  { quote: "The job of buildings is to improve human relations: architecture must ease them, not make them worse.", author: "Ralph Erskine" },
  { quote: "Material, craftsmanship, and the right tools — these are what define good building.", author: "Tadao Ando" },
  { quote: "To me, the drawn language is a very revealing language: one can see in a few lines whether a man is really an architect.", author: "Eero Saarinen" },
  { quote: "There is hardly anything in the world that some man cannot make a little worse and sell a little cheaper, and the people who consider price only are this man's lawful prey.", author: "John Ruskin" },
  { quote: "Architecture is not an inspirational business, it's a rational procedure to do sensible and hopefully beautiful things.", author: "Harry Seidler" },
  { quote: "Don't build a glass house if you're worried about saving money on heating.", author: "Philip Johnson" },
  { quote: "You have to give the floor the same love as the ceiling.", author: "Rem Koolhaas" },
  { quote: "The road to the future leads us smiling towards the past.", author: "Aldo Rossi" },
  { quote: "Sustainability can't be like some sort of moral sacrifice or political dilemma or a philanthropical cause. It has to be a design challenge.", author: "Bjarke Ingels" },
  { quote: "My buildings don't speak in words but by means of their own spaciousness.", author: "Tadao Ando" },
  { quote: "Think simple as my old master used to say — meaning reduce the whole of its parts into the simplest terms.", author: "Frank Lloyd Wright" },
  { quote: "Organic architecture seeks superior sense of use and a finer sense of comfort, expressed in organic simplicity.", author: "Frank Lloyd Wright" },
  { quote: "No architecture can be truly noble which is not imperfect.", author: "John Ruskin" },
  { quote: "Geometry enlightens the intellect and sets one's mind right.", author: "Ibn Khaldun" },
  { quote: "Build your lot on the edge of a lake and see your soul reflected in nature every morning.", author: "Alvar Aalto" },
  { quote: "What people want, above all, is order.", author: "Stephen Gardiner" },
  { quote: "Beauty perishes in life, but is immortal in art.", author: "Leonardo da Vinci" },
  { quote: "The architecture of a place is really a story about the people who live there.", author: "Kengo Kuma" },
  { quote: "One of the great beauties of architecture is that each time it is like life starting all over again.", author: "Renzo Piano" },
  { quote: "A building has integrity just like a man, and just as seldom.", author: "Ayn Rand" },
  { quote: "If architecture is, as is sometimes said, music frozen in space, then it can also be said that music is architecture dissolved in time.", author: "Iannis Xenakis" },
  { quote: "Space is the breath of art.", author: "Frank Lloyd Wright" },
  { quote: "People ignore design that ignores people.", author: "Frank Chimero" },
  { quote: "Good architecture lets nature in.", author: "Mario Pei" },
  { quote: "Any work of architecture that does not express serenity is a mistake.", author: "Luis Barragán" },
  { quote: "The reality of the building does not consist in the roof and walls, but in the space within to be lived in.", author: "Lao Tzu" },
  { quote: "Color is a power which directly influences the soul.", author: "Wassily Kandinsky" },
  { quote: "True architecture is always objective and is the expression of the inner structure of our time.", author: "Ludwig Mies van der Rohe" },
  { quote: "We are called to be architects of the future, not its victims.", author: "Buckminster Fuller" },
  { quote: "I believe the common denominator of the universe is not harmony, but chaos, hostility and murder.", author: "Werner Herzog" },
];

// Deterministic daily shuffle using a seed based on the date
function getDailyQuote(quotes: typeof architectureQuotes): typeof architectureQuotes[0] {
  const today = new Date();
  // Create a unique seed from date components for pseudo-random feel
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  // Simple hash to spread indices widely
  const hash = ((seed * 2654435761) >>> 0) % quotes.length;
  return quotes[hash];
}

export function WelcomePopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [todayQuote, setTodayQuote] = useState(architectureQuotes[0]);

  useEffect(() => {
    const lastShown = localStorage.getItem('archistudio_welcome_shown');
    const today = new Date().toDateString();

    if (lastShown === today) return;

    setTodayQuote(getDailyQuote(architectureQuotes));

    const timer = setTimeout(() => setIsVisible(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('archistudio_welcome_shown', new Date().toDateString());
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.8, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Top accent bar */}
            <div className="h-1.5 bg-gradient-to-r from-accent via-primary to-accent" />

            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-accent/20"
                  style={{
                    left: `${15 + i * 15}%`,
                    top: `${20 + (i % 3) * 25}%`,
                  }}
                  animate={{
                    y: [-8, 8, -8],
                    opacity: [0.2, 0.5, 0.2],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.3,
                  }}
                />
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-muted/80 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="relative px-6 py-8 text-center">
              {/* Icon */}
              <motion.div
                className="mx-auto w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-7 h-7 text-accent" />
              </motion.div>

              <motion.h2
                className="text-xl font-bold text-foreground mb-1"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                Welcome to Archistudio
              </motion.h2>

              <motion.p
                className="text-sm text-muted-foreground mb-5"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                Today's Architecture Thought
              </motion.p>

              {/* Quote card */}
              <motion.div
                className="relative bg-muted/50 border border-border rounded-xl p-5 mb-6"
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <Quote className="w-5 h-5 text-accent/40 mb-2 mx-auto" />
                <p className="text-foreground font-medium italic leading-relaxed text-[15px]">
                  "{todayQuote.quote}"
                </p>
                <p className="text-accent font-semibold text-sm mt-3">
                  — {todayQuote.author}
                </p>
              </motion.div>

              {/* CTA */}
              <motion.div
                className="flex gap-3"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                <Button
                  onClick={handleClose}
                  variant="default"
                  className="flex-1"
                  size="lg"
                >
                  Explore Courses
                </Button>
                <Button
                  onClick={() => {
                    handleClose();
                    window.location.href = '/contact';
                  }}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  Get in Touch
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
