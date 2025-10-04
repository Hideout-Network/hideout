import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 px-4 sm:px-6 pb-12 max-w-4xl mx-auto">
        <Card className="p-8 bg-card border-border">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-foreground">Privacy Policy</h1>
            <p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>

            <div className="space-y-6 text-foreground">
              <section>
                <h2 className="text-2xl font-bold mb-3">1. Information We Collect</h2>
                <p className="mb-2">We collect minimal information necessary to provide our service:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Username (chosen by you during signup)</li>
                  <li>Password (encrypted and hashed for security)</li>
                  <li>Last activity timestamp (to enforce inactive account deletion)</li>
                  <li>Game favorites (optional, stored only if you use this feature)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">2. How We Use Your Information</h2>
                <p className="mb-2">Your information is used solely for:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Account authentication and access control</li>
                  <li>Storing your game preferences and favorites</li>
                  <li>Identifying and deleting inactive accounts (after 2 weeks of inactivity)</li>
                  <li>Service improvement and maintenance</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">3. Data Security</h2>
                <p className="mb-2">We take security seriously:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Passwords are encrypted using industry-standard hashing (SHA-256)</li>
                  <li>We never store your password in plain text</li>
                  <li>Data is stored securely using Supabase infrastructure</li>
                  <li>We cannot recover your password if you lose it</li>
                </ul>
                <p className="mt-3 text-yellow-500 font-medium">
                  ⚠️ You are responsible for keeping your password safe. We cannot help you recover a lost password.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">4. Data Sharing</h2>
                <p>We do NOT:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Share your personal information with third parties</li>
                  <li>Sell your data to advertisers or marketers</li>
                  <li>Use your information for purposes other than providing the service</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">5. Data Retention and Deletion</h2>
                <p className="mb-2">Your data is retained as follows:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li className="font-medium text-yellow-500">Accounts inactive for 2 weeks are automatically and permanently deleted</li>
                  <li>You can manually delete your account at any time from the Account page</li>
                  <li>When an account is deleted, all associated data (username, password hash, favorites) is permanently removed</li>
                  <li>Deleted data cannot be recovered</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">6. Cookies and Local Storage</h2>
                <p className="mb-2">We use browser storage to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Keep you logged in (if you choose "Remember me")</li>
                  <li>Store your session information locally on your device</li>
                  <li>You can clear this data anytime by logging out or clearing your browser data</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">7. Your Rights</h2>
                <p className="mb-2">You have the right to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Access your account information at any time</li>
                  <li>Delete your account and all associated data</li>
                  <li>Request information about the data we store about you</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">8. Children's Privacy</h2>
                <p>Our service is not directed to children under 13. We do not knowingly collect information from children under 13.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">9. Changes to This Policy</h2>
                <p>We may update this privacy policy from time to time. Continued use of the service after changes constitutes acceptance of the updated policy.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">10. Contact Us</h2>
                <p>For privacy-related questions or concerns, contact us at: <a href="mailto:hideout-network-buisness@hotmail.com" className="text-primary hover:underline">hideout-network-buisness@hotmail.com</a></p>
              </section>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Privacy;