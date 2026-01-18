import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function Refunds() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-4">Refund & Cancellation Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 18, 2026</p>

          {/* Quick Summary Cards */}
          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            <Card className="border-success/30 bg-success/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <h3 className="font-semibold">7-Day Refund Window</h3>
                </div>
                <p className="text-sm text-muted-foreground">Full refund within 7 days if less than 20% content accessed</p>
              </CardContent>
            </Card>
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-5 w-5 text-warning" />
                  <h3 className="font-semibold">5-7 Business Days</h3>
                </div>
                <p className="text-sm text-muted-foreground">Refunds processed within 5-7 business days</p>
              </CardContent>
            </Card>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Refund Eligibility</h2>
              <p className="text-muted-foreground mb-4">
                We offer a 7-day money-back guarantee on all individual course purchases, subject to the following conditions:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Refund request must be made within 7 days of purchase</li>
                <li>Less than 20% of the course content must have been accessed</li>
                <li>No course materials (PDFs, project files) have been downloaded</li>
                <li>Certificate of completion has not been issued</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Non-Refundable Items</h2>
              <p className="text-muted-foreground mb-4">The following are NOT eligible for refunds:</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-destructive/5 rounded-lg">
                  <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium">Subscription Plans (All Access)</p>
                    <p className="text-sm text-muted-foreground">Monthly and yearly subscriptions are non-refundable after activation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-destructive/5 rounded-lg">
                  <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium">Promotional/Discounted Purchases</p>
                    <p className="text-sm text-muted-foreground">Courses purchased with discount codes above 50% off</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-destructive/5 rounded-lg">
                  <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium">Completed Courses</p>
                    <p className="text-sm text-muted-foreground">Courses where more than 20% content has been accessed</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. How to Request a Refund</h2>
              <p className="text-muted-foreground mb-4">To request a refund, please follow these steps:</p>
              <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
                <li>Email us at <strong>refunds@archistudio.in</strong> with your order details</li>
                <li>Include your registered email address and order ID</li>
                <li>Provide a brief reason for the refund request</li>
                <li>Our team will review your request within 2 business days</li>
                <li>If approved, refund will be processed within 5-7 business days</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Refund Processing</h2>
              <p className="text-muted-foreground">
                Approved refunds will be credited to the original payment method used during purchase:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li><strong>Credit/Debit Cards:</strong> 5-7 business days</li>
                <li><strong>UPI:</strong> 3-5 business days</li>
                <li><strong>Net Banking:</strong> 5-7 business days</li>
                <li><strong>Wallets:</strong> 1-3 business days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Cancellation Policy</h2>
              <p className="text-muted-foreground mb-4">
                <strong>For Individual Courses:</strong> Once purchased, courses remain accessible for the duration specified (lifetime access for most courses). No cancellation is required.
              </p>
              <p className="text-muted-foreground mb-4">
                <strong>For Subscription Plans:</strong>
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>You may cancel your subscription at any time from your account settings</li>
                <li>Access continues until the end of the current billing period</li>
                <li>No partial refunds for unused subscription time</li>
                <li>Cancelled subscriptions will not auto-renew</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Technical Issues</h2>
              <p className="text-muted-foreground">
                If you experience technical issues accessing course content, please contact our support team at <strong>support@archistudio.in</strong> before requesting a refund. We will work to resolve any technical problems and may extend your access period if needed.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Chargebacks</h2>
              <div className="flex items-start gap-3 p-4 bg-warning/10 rounded-lg border border-warning/30">
                <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                <p className="text-muted-foreground">
                  If you file a chargeback with your bank without contacting us first, your account may be suspended. We encourage you to reach out to our support team to resolve any issues before initiating a chargeback.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
              <p className="text-muted-foreground">
                For refund requests or questions about this policy:<br /><br />
                <strong>Email:</strong> refunds@archistudio.in<br />
                <strong>Phone:</strong> +91 98765 43210<br />
                <strong>Address:</strong> Archistudio Learning Pvt Ltd, 123 Design District, Koramangala, Bangalore 560034, India
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
