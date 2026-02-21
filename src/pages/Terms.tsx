import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Terms & Conditions</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 18, 2026</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground">
                Welcome to Archistudio ("Company", "we", "our", "us"). These Terms and Conditions govern your use of our website located at archistudio.shop and our online courses and services. By accessing or using our services, you agree to be bound by these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Definitions</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>"Service"</strong> refers to the online courses, learning materials, and related services provided by Archistudio.</li>
                <li><strong>"User"</strong> refers to any individual who accesses or uses our Service.</li>
                <li><strong>"Content"</strong> refers to all course materials, videos, documents, and other educational resources.</li>
                <li><strong>"Subscription"</strong> refers to any paid plan that grants access to our courses.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
              <p className="text-muted-foreground">
                To access our courses, you must create an account. You agree to provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Course Access & License</h2>
              <p className="text-muted-foreground mb-4">
                Upon purchase, you are granted a limited, non-exclusive, non-transferable license to access and view the course content for personal, non-commercial use only. You may not:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Share, distribute, or resell course content</li>
                <li>Download, copy, or reproduce course videos without permission</li>
                <li>Use course materials for commercial purposes</li>
                <li>Share login credentials with others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Pricing & Payments</h2>
              <p className="text-muted-foreground">
                All prices are displayed in Indian Rupees (INR). Payments are processed securely through Cashfree payment gateway. We reserve the right to modify pricing at any time. Any price changes will not affect existing purchases.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
              <p className="text-muted-foreground">
                All content, including but not limited to videos, text, graphics, logos, and course materials, is the property of Archistudio and is protected by copyright and intellectual property laws. Unauthorized use may result in legal action.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. User Conduct</h2>
              <p className="text-muted-foreground mb-4">Users agree not to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on the rights of others</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the proper functioning of our Service</li>
                <li>Upload malicious content or viruses</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground">
                Our Service is provided "as is" without warranties of any kind. We do not guarantee that our courses will meet your specific requirements or that access will be uninterrupted. Results from our courses may vary based on individual effort and application.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, Archistudio shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
              <p className="text-muted-foreground">
                For questions about these Terms, please contact us at:<br />
                Email: legal@archistudio.in<br />
                Address: Archistudio Learning Pvt Ltd, 123 Design District, Koramangala, Bangalore 560034, India
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
