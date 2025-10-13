import { Navigation } from "@/components/Navigation";
import { GlobalChat } from "@/components/GlobalChat";
import { Card } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <GlobalChat />
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
                  <li>Game and app favorites (optional, stored only if you use this feature)</li>
                  <li>Browser data (tabs, bookmarks, history, settings - synced when logged in)</li>
                  <li>Chat messages (last 100 messages in global chat)</li>
                  <li>Email preferences (newsletter subscription status)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">2. How We Use Your Information</h2>
                <p className="mb-2">Your information is used solely for:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Account authentication and access control</li>
                  <li>Storing your game/app preferences and favorites</li>
                  <li>Syncing browser data across your devices</li>
                  <li>Enabling global chat functionality</li>
                  <li>Sending newsletters (only if opted in)</li>
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
                <p className="mt-3 text-yellow-500 font-medium flex items-center gap-1">
                  <span>⚠</span> You are responsible for keeping your password safe. We cannot help you recover a lost password.
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
                  <li>When an account is deleted, all associated data (username, password, favorites, chat messages, browser data) is permanently removed</li>
                  <li>Chat messages are limited to the last 100 messages system-wide (older messages are automatically deleted)</li>
                  <li>Deleted data cannot be recovered</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">6. Cookies and Local Storage</h2>
                <p className="mb-2">We use browser storage to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Keep you logged in (if you choose "Remember me")</li>
                  <li>Store your session information locally on your device</li>
                  <li>Save browser tabs, bookmarks, history, and settings locally</li>
                  <li>Cache chat messages locally for faster loading</li>
                  <li>Store game and app favorites locally before syncing</li>
                  <li>Sync all data to your account when logged in (encrypted and secure)</li>
                  <li>Persist settings across sessions</li>
                  <li>You can clear this data anytime from Settings or by clearing your browser data</li>
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
                <h2 className="text-2xl font-bold mb-3">10. Third-Party Services</h2>
                <p className="mb-2">Our service may contain links to third-party websites or services:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>We are not responsible for third-party privacy practices</li>
                  <li>Review privacy policies of any third-party sites you visit</li>
                  <li>We do not control or endorse third-party content</li>
                  <li>The Hideout Browser uses a proxy to access external websites - we do not log or monitor your browsing activity</li>
                  <li>Browser history, bookmarks, and settings are stored locally and synced to your account when logged in</li>
                  <li>All user data (favorites, settings, browser data) is saved to both local storage and your account for persistence across devices</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">11. Global Chat</h2>
                <p className="mb-2">Our global chat feature:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Messages are visible to all users using the platform</li>
                  <li>Messages are limited to 500 characters</li>
                  <li>Only the last 100 messages are stored (older messages are automatically deleted)</li>
                  <li>Do not share personal information in chat</li>
                  <li>Messages are public and cannot be edited once sent</li>
                  <li>Users can be identified by their username in chat</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">12. Email Communications</h2>
                <p className="mb-2">We may send emails for:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Newsletters (only if you opt in via Email Settings)</li>
                  <li>Important service updates and announcements</li>
                  <li>Account security notifications</li>
                  <li>You can unsubscribe from newsletters anytime in Email Settings</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">13. Data Breach Notification</h2>
                <p>In the event of a data breach that may compromise your information, we will notify affected users via email or through a prominent notice on our service within a reasonable timeframe as required by law.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">14. International Users</h2>
                <p>If you are accessing our service from outside your jurisdiction, please be aware that your information may be transferred to, stored, and processed in different countries. By using our service, you consent to such transfers.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">15. California Privacy Rights</h2>
                <p>California residents have specific rights under the California Consumer Privacy Act (CCPA) including the right to know what personal information is collected and the right to request deletion of personal information. Contact us to exercise these rights.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">16. Contact Us</h2>
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