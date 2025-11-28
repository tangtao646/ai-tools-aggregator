import React from 'react';
import PageBackground from '../components/common/PageBackground';
import { useI18n } from '../i18n/I18nContext';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';

const PrivacyPolicy = ({ onBack }) => {
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack && typeof onBack === 'function') return onBack();
    try {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        // No previous history — do nothing instead of forcing home
        // Optionally, could navigate('/') as fallback, but user requested not to return home
      }
    } catch (err) {
      console.warn('Back navigation failed', err);
    }
  };

  return (
    <PageBackground>
      <div className="relative min-h-screen w-full py-16 px-4">
        <BackButton onClick={handleBack} />

        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose dark:prose-invert max-w-none space-y-6">
          

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Introduction</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                AI Collection Tools ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we 
                collect, use, disclose, and safeguard your information when you use our platform.
              </p>
              
             <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  We take your privacy seriously and are committed to protecting your personal information. We will <strong>NEVER</strong> sell, 
                  rent, lease, or disclose your personal data to third-party individuals or organizations for marketing purposes or any 
                  unauthorized use. Your data is used solely to provide and improve our service, and we implement strict security measures 
                  to safeguard it from unauthorized access or disclosure.
                </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Account Information:</strong> When you log in via Google or GitHub OAuth, we collect your name, email address, and profile picture.</li>
                <li><strong>Tool Submissions:</strong> Information you provide when submitting AI tools, including tool name, description, website URL, category, pricing details, and contact email.</li>
                <li><strong>Communications:</strong> Any messages or communications you send to us.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Log Data:</strong> IP address, browser type, operating system, referring URLs, and pages visited.</li>
                <li><strong>Cookies and Tracking:</strong> We use cookies and similar technologies to maintain user sessions and preferences.</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our Service.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We collect and use your personal information only for specific, legitimate purposes related to providing our service. 
                Below is a detailed explanation of what information we use and why:
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">3.1 User Authentication and Account Management</h3>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 mb-4">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  <strong>Information Used:</strong> Name, email address, profile picture (from Google/GitHub OAuth)
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  <strong>Purpose:</strong> To identify and authenticate you when you log in, display your profile information, 
                  and manage your account. This allows us to associate your tool submissions with your account and provide a 
                  personalized experience.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">3.2 Tool Submission and Review</h3>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 mb-4">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  <strong>Information Used:</strong> Tool name, description, website URL, category, pricing model, contact email, 
                  logo/screenshots you upload
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  <strong>Purpose:</strong> To process your tool submissions, enable administrators to review submissions for quality 
                  and compliance, display approved tools in our directory, and allow users to contact tool creators if needed. 
                  Your email is used to notify you about submission status (approved/rejected) but is never displayed publicly.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">3.3 Submission History and Management</h3>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 mb-4">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  <strong>Information Used:</strong> Your user ID linked to your submissions, submission timestamps, status updates
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  <strong>Purpose:</strong> To enable you to view your submission history, track the status of your submissions 
                  (pending/approved/rejected), and allow you to edit rejected submissions. This feature helps you manage your 
                  contributions to the platform.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">3.4 User Preferences and Settings</h3>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 mb-4">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  <strong>Information Used:</strong> Language preference, dark mode setting (stored in browser localStorage)
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  <strong>Purpose:</strong> To remember your preferred language and theme settings across sessions, providing a 
                  consistent and personalized user experience. These preferences are stored locally in your browser.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">3.5 Platform Security and Abuse Prevention</h3>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 mb-4">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  <strong>Information Used:</strong> IP addresses, login timestamps, submission edit counts
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  <strong>Purpose:</strong> To detect and prevent fraudulent activity, spam submissions, abuse of the platform, 
                  and unauthorized access. For example, we track edit counts to enforce the 3-edit limit on rejected submissions.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">3.6 Service Improvement and Analytics</h3>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 mb-4">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  <strong>Information Used:</strong> Aggregated usage patterns, feature usage statistics, error logs
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  <strong>Purpose:</strong> To understand how users interact with our platform, identify technical issues, 
                  improve our features, and enhance overall user experience. This data is analyzed in aggregate form and 
                  does not identify individual users.
                </p>
              </div>

              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4 italic">
                <strong>Important:</strong> We only collect and use the minimum amount of information necessary to provide these 
                functions. We do not use your personal information for any purposes other than those listed above without your 
                explicit consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Information Sharing and Disclosure</h2>
              
              <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 mb-4">
                <p className="text-sm text-green-800 dark:text-green-300 font-semibold mb-2">
                  ✓ Your Data Privacy is Protected
                </p>
                <p className="text-sm text-green-800 dark:text-green-300">
                  We do <strong>NOT</strong> sell, rent, lease, or trade your personal information to third-party individuals, 
                  organizations, or companies for any commercial purposes. Your email address, login credentials, and personal 
                  data remain confidential and are never shared with external parties except as explicitly described below.
                </p>
              </div>

              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                We may share your information only in the following limited circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Public Information:</strong> Tool submissions you make (tool name, description, website URL, logo) 
                will be publicly visible on our platform. However, your email address and OAuth login information are 
                <strong> NEVER</strong> displayed publicly.</li>
                <li><strong>Essential Service Providers:</strong> We may share minimal information with trusted service providers 
                who perform essential services on our behalf (such as hosting infrastructure, database management). These providers 
                are contractually obligated to protect your data and use it only for providing services to us.</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or valid 
                legal process, or to protect our rights, property, or safety.</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information 
                may be transferred, but the acquiring party will be required to honor this Privacy Policy.</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
                <strong>We explicitly do NOT:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mt-2">
                <li>Sell or rent your personal information to marketers, advertisers, or data brokers</li>
                <li>Share your email address with third-party tool providers listed on our platform</li>
                <li>Use your data for purposes other than providing our service</li>
                <li>Allow third parties to access your personal information without your knowledge</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Third-Party Authentication (OAuth)</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We use third-party OAuth services (Google and GitHub) for secure user authentication. When you choose to log in 
                through these services, you will be redirected to their official login pages. We <strong>never</strong> see or 
                store your social media passwords.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">5.1 Google OAuth</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                When you log in with Google, we receive only the information you authorize Google to share with us, typically:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300 mb-3">
                <li>Your name</li>
                <li>Your email address</li>
                <li>Your profile picture</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                For more information about how Google handles your data, please review:
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                📄 <a 
                  href="https://policies.google.com/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Google Privacy Policy
                </a>
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">5.2 GitHub OAuth</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                When you log in with GitHub, we receive only the information you authorize GitHub to share with us, typically:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300 mb-3">
                <li>Your GitHub username</li>
                <li>Your public email address</li>
                <li>Your profile picture</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                For more information about how GitHub handles your data, please review:
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                📄 <a 
                  href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  GitHub Privacy Statement
                </a>
              </p>

              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Note:</strong> You can revoke our access to your Google or GitHub account at any time through your 
                  respective account settings on those platforms. Revoking access will prevent you from logging into our service, 
                  but your submitted tools will remain on our platform unless you request deletion.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Data Security</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                We implement appropriate technical and organizational security measures to protect your information, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-3">
                <li>Encryption of data in transit using HTTPS/TLS</li>
                <li>Secure database storage with access controls</li>
                <li>Regular security updates and patches</li>
                <li>Limited access to personal data on a need-to-know basis</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect 
                your personal information using commercially acceptable means, we cannot guarantee its absolute security.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">6.1 Data Breach Notification</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                In the event of a data breach that affects your personal information, we will notify you via email (if provided) 
                within 72 hours of discovering the breach. The notification will include:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mt-2">
                <li>The nature of the breach and the data affected</li>
                <li>The potential consequences and risks</li>
                <li>The measures we have taken to address the breach</li>
                <li>Recommended actions you should take to protect yourself</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Data Retention and Deletion</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">7.1 Retention Period</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                We retain your personal information for as long as necessary to provide you with our Service and as required by applicable law:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Account Data:</strong> Retained while your account is active, plus 30 days after account deletion request</li>
                <li><strong>Tool Submissions:</strong> Approved tools remain public unless you request deletion; rejected submissions 
                are kept for 90 days for review purposes</li>
                <li><strong>Log Data:</strong> Retained for 90 days for security and analytics purposes</li>
                <li><strong>Legal Requirements:</strong> Certain data may be retained longer if required by law (e.g., for tax or legal compliance)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">7.2 Account and Data Deletion Process</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                You have the right to request deletion of your account and personal data at any time. Here's how:
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-3">
                <p className="text-sm text-blue-900 dark:text-blue-200 font-semibold mb-2">How to Delete Your Account:</p>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-blue-800 dark:text-blue-300">
                  <li>Send an email to <a href="mailto:taoge646@gmail.com" className="underline">taoge646@gmail.com</a></li>
                  <li>Use the subject line: "Account Deletion Request"</li>
                  <li>Include your registered email address in the message</li>
                  <li>We will process your request within 7 business days</li>
                  <li>You will receive a confirmation email once deletion is complete</li>
                </ol>
              </div>

              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                <strong>What happens when you delete your account:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Your account information (name, email, profile picture) will be permanently deleted</li>
                <li>Your login access will be immediately revoked</li>
                <li>Your public tool submissions may remain visible on the platform (to maintain directory integrity), 
                but will be marked as submitted by "Anonymous User"</li>
                <li>If you wish to remove your submissions as well, please explicitly request this in your deletion email</li>
                <li>Backup copies will be deleted within 30 days</li>
              </ul>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 italic">
                <strong>Note:</strong> Some data may be retained in our backup systems for up to 30 days after deletion. 
                Data required for legal compliance, security, or fraud prevention may be retained longer as permitted by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Your Rights</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Depending on your location, you may have the following rights regarding your personal information. We respect these 
                rights and will respond to requests within 30 days:
              </p>
              
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                  <p className="text-gray-700 dark:text-gray-300"><strong>Right to Access:</strong> Request a copy of the personal 
                  information we hold about you</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                  <p className="text-gray-700 dark:text-gray-300"><strong>Right to Correction:</strong> Request correction of 
                  inaccurate or incomplete information</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                  <p className="text-gray-700 dark:text-gray-300"><strong>Right to Deletion:</strong> Request deletion of your 
                  personal information (see Section 7.2 for process)</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                  <p className="text-gray-700 dark:text-gray-300"><strong>Right to Data Portability:</strong> Request a copy of 
                  your data in a structured, machine-readable format (JSON or CSV)</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                  <p className="text-gray-700 dark:text-gray-300"><strong>Right to Object:</strong> Object to certain processing 
                  of your personal information</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                  <p className="text-gray-700 dark:text-gray-300"><strong>Right to Withdraw Consent:</strong> Withdraw your consent 
                  to data processing at any time (this will not affect the lawfulness of processing before withdrawal)</p>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                <strong>How to Exercise Your Rights:</strong> Send an email to{' '}
                <a href="mailto:taoge646@gmail.com" className="text-primary hover:underline">taoge646@gmail.com</a>
                {' '}with your request. Please include your registered email address and specify which right(s) you wish to exercise.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to enhance your experience. Below is a detailed breakdown:
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">9.1 Types of Cookies We Use</h3>
              
              <div className="space-y-3 mb-4">
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                  <p className="text-gray-700 dark:text-gray-300 mb-1"><strong>Essential Cookies (Required)</strong></p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Authentication tokens for login sessions. These cannot be disabled.</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Duration: Session or 30 days</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                  <p className="text-gray-700 dark:text-gray-300 mb-1"><strong>Preference Cookies (Optional)</strong></p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Language selection, dark mode setting. Stored in browser localStorage.</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Duration: Persistent</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                  <p className="text-gray-700 dark:text-gray-300 mb-1"><strong>Analytics Cookies (Optional)</strong></p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Basic usage statistics to improve the platform (no third-party analytics currently used).</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Duration: 90 days</p>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                <strong>How to Manage Cookies:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>You can control cookies through your browser settings (Chrome, Firefox, Safari, etc.)</li>
                <li>Disabling essential cookies will prevent you from logging in</li>
                <li>Disabling preference cookies will reset your language and theme settings</li>
                <li>Most browsers allow you to refuse cookies or delete existing ones</li>
              </ul>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 italic">
                Note: We do not use third-party advertising cookies or tracking pixels.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Children's Privacy</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Our Service is not intended for users under the age of 13 (or the applicable age of digital consent in your jurisdiction). 
                We do not knowingly collect personal information from children under 13.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                <strong>If you are a parent or guardian</strong> and believe we have collected information from a child under 13:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Contact us immediately at <a href="mailto:taoge646@gmail.com" className="text-primary hover:underline">taoge646@gmail.com</a></li>
                <li>We will delete the information within 48 hours of verification</li>
                <li>We will take steps to prevent future access by the underage user</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">11. International Data Transfers</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Your information may be transferred to and processed on servers located in different countries. Currently, our 
                infrastructure is primarily hosted in China, but may utilize cloud services that operate globally.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                These countries may have different data protection laws than your country of residence. By using our Service, you 
                acknowledge and consent to such transfers. We will take reasonable steps to ensure that your data receives adequate 
                protection in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, 
                or other factors. When we make changes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>We will update the "Last updated" date at the top of this page</li>
                <li>For material changes, we will notify users via email (if provided) or through a prominent notice on the Service</li>
                <li>We will provide at least 30 days' notice before material changes take effect</li>
                <li>Continued use of the Service after changes constitutes acceptance of the updated Privacy Policy</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
                We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">13. Platform Operator Information</h2>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-5">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  <strong>Platform Name:</strong> AI Collection Tools
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  <strong>Operator Type:</strong> Individual Developer (Non-commercial)
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  <strong>Primary Contact:</strong> <a href="mailto:taoge646@gmail.com" className="text-primary hover:underline">taoge646@gmail.com</a>
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  <strong>General Support:</strong> <a href="mailto:taoge646@gmail.com" className="text-primary hover:underline">taoge646@gmail.com</a>
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  <strong>Operating Region:</strong> China
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 italic">
                  <strong>Disclosure:</strong> This platform is operated by an independent developer as a non-commercial project. 
                  We operate with limited resources and handle data processing personally with strict privacy standards. 
                  While we are not a registered company, we take your privacy seriously and comply with applicable data protection laws.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">14. Contact Us</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 space-y-3">
                <div>
                  <p className="text-blue-900 dark:text-blue-200 font-semibold mb-1">📧 Privacy Matters:</p>
                  <p className="text-blue-800 dark:text-blue-300">
                    <a href="mailto:taoge646@gmail.com" className="underline hover:no-underline">taoge646@gmail.com</a>
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    For data deletion, access requests, or privacy concerns
                  </p>
                </div>
                
                <div>
                  <p className="text-blue-900 dark:text-blue-200 font-semibold mb-1">💬 General Support:</p>
                  <p className="text-blue-800 dark:text-blue-300">
                    <a href="mailto:taoge646@gmail.com" className="underline hover:no-underline">taoge646@gmail.com</a>
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    For general questions or technical support
                  </p>
                </div>
                
                <div>
                  <p className="text-blue-900 dark:text-blue-200 font-semibold mb-1">⏱️ Response Time:</p>
                  <p className="text-blue-800 dark:text-blue-300">
                    We aim to respond within 48-72 hours (weekdays)
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    Urgent privacy matters are prioritized and typically responded to within 24 hours
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">Data Protection Compliance</h3>
              
              <div className="space-y-3 text-sm text-blue-800 dark:text-blue-300">
                <div>
                  <p className="font-semibold mb-1">🇪🇺 GDPR (European Union)</p>
                  <p>If you are located in the European Economic Area (EEA), you have additional rights under the General Data Protection 
                  Regulation (GDPR), including the right to lodge a complaint with your local supervisory authority.</p>
                </div>
                
                <div>
                  <p className="font-semibold mb-1">🇨🇳 PIPL (China)</p>
                  <p>We comply with China's Personal Information Protection Law (个人信息保护法). Chinese users have the right to know, 
                  decide, access, correct, delete, and copy their personal information.</p>
                </div>
                
                <div>
                  <p className="font-semibold mb-1">🌍 Other Jurisdictions</p>
                  <p>We respect privacy rights under applicable local laws. If you have specific regional privacy law questions, 
                  please contact us.</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PageBackground>
  );
};

export default PrivacyPolicy;
