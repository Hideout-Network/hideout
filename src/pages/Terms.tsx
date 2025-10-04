import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 px-4 sm:px-6 pb-12 max-w-4xl mx-auto">
        <Card className="p-8 bg-card border-border">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-foreground">Terms of Service</h1>
            <p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>

            <div className="space-y-6 text-foreground">
              <section>
                <h2 className="text-2xl font-bold mb-3">1. Acceptance of Terms</h2>
                <p>By creating an account and using Hideout Network, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">2. Account Security</h2>
                <p className="mb-2"><strong className="text-destructive">IMPORTANT:</strong> You are solely responsible for:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Keeping your password secure and confidential</li>
                  <li>All activities that occur under your account</li>
                  <li>Any loss of access to your account</li>
                </ul>
                <p className="mt-3 text-destructive font-medium">
                  ⚠️ If you lose your password or account access, it is completely your fault and not ours. We cannot and will not recover lost accounts under any circumstances.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">3. Account Deletion Policy</h2>
                <p className="mb-2">To maintain database efficiency:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li className="font-medium text-yellow-500">Accounts inactive for 2 weeks will be automatically and permanently deleted</li>
                  <li>All associated data, including favorites and game progress, will be removed</li>
                  <li>You can manually delete your account at any time from the Account page</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">4. User Conduct</h2>
                <p className="mb-2">You agree to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Use the service legally and responsibly</li>
                  <li>Not share your account credentials with others</li>
                  <li>Not attempt to hack, exploit, or abuse the service</li>
                  <li>Not create multiple accounts to circumvent restrictions</li>
                  <li>Not use offensive or inappropriate usernames</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">5. Service Availability</h2>
                <p>We strive to provide continuous service but do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time without notice.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">6. Limitation of Liability</h2>
                <p className="mb-2">Hideout Network and its operators:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Are not liable for any data loss, including account deletion</li>
                  <li>Are not responsible for lost or forgotten passwords</li>
                  <li>Provide the service "as is" without warranties of any kind</li>
                  <li>Are not liable for any damages arising from use of the service</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">7. Changes to Terms</h2>
                <p>We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">8. Contact</h2>
                <p>For questions or concerns, contact us at: <a href="mailto:hideout-network-buisness@hotmail.com" className="text-primary hover:underline">hideout-network-buisness@hotmail.com</a></p>
              </section>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Terms;