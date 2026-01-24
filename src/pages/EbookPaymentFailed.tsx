import { useSearchParams, Link } from "react-router-dom";
import { XCircle, RefreshCw, HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const EbookPaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-16">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-destructive/10 rounded-full p-6 w-fit mx-auto mb-6">
            <XCircle className="h-16 w-16 text-destructive" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Payment Cancelled</h1>
          <p className="text-muted-foreground mb-8">
            Your payment was cancelled or could not be completed. Don't worry, no amount has been deducted from your account.
          </p>
          
          <div className="flex flex-col gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link to="/ebooks">
                <RefreshCw className="h-4 w-4" />
                Retry Purchase
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="gap-2">
              <Link to="/contact">
                <HeadphonesIcon className="h-4 w-4" />
                Contact Support
              </Link>
            </Button>
          </div>
          
          {orderId && (
            <p className="text-xs text-muted-foreground mt-8">
              Reference ID: {orderId}
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EbookPaymentFailed;
