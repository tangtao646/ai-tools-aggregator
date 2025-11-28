import React from 'react';
import PageBackground from '../components/common/PageBackground';
import { useI18n } from '../i18n/I18nContext';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';

const TermsOfService = ({ onBack }) => {
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack && typeof onBack === 'function') return onBack();
    try {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        // No previous history — do nothing (avoid navigating to home)
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Terms of Service</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                AI Collection Tools ("we", "our", or "us") operates this AI tools directory platform ("the Service"). 
                By accessing and using the Service, you accept and agree to be bound by the terms and provisions of this agreement. 
                If you do not agree to these Terms of Service, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Description of Service</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We are a platform that allows users to discover, submit, and review AI tools. We provide a directory service 
                where users can browse various AI tools, submit new tools for review, and interact with tool information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. User Accounts</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                To access certain features of the Service, you may be required to create an account through third-party authentication 
                providers (Google, GitHub). When you use these authentication services, you are also subject to their respective 
                privacy policies:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li>
                  <a 
                    href="https://policies.google.com/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Google Privacy Policy
                  </a>
                </li>
                <li>
                  <a 
                    href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    GitHub Privacy Statement
                  </a>
                </li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                By creating an account, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Provide accurate and complete information when creating your account</li>
                <li>Maintain the security of your account</li>
                <li>Not impersonate any person or entity</li>
                <li>Not use the Service for any illegal or unauthorized purpose</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. User Content</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                When you submit AI tools or other content to our Service, you represent and warrant that:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>You have the right to submit such content</li>
                <li>The content does not violate any third-party rights</li>
                <li>The content is accurate and not misleading</li>
                <li>The content does not contain malware, viruses, or harmful code</li>
                <li>The content complies with all applicable laws and regulations</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
                We reserve the right to review, modify, or remove any submitted content at our discretion.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">4.1 Content License</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                You retain all ownership rights to the content you submit. However, by submitting content to the Service, you grant us 
                a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Use, reproduce, and display your submitted content on our platform</li>
                <li>Distribute and make your approved submissions publicly available</li>
                <li>Modify or adapt the content format for display purposes (e.g., resizing images)</li>
                <li>Create backup copies for service operation and disaster recovery</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
                This license continues even if you stop using our Service, but you may request removal of your content by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Intellectual Property</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                The Service and its original content, features, and functionality (excluding user-submitted content) are owned by 
                the platform operator and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">5.1 Copyright Infringement Claims</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                If you believe that content on our platform infringes your intellectual property rights, please contact us with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>A description of the copyrighted work or intellectual property you claim has been infringed</li>
                <li>The URL or location of the allegedly infringing content on our platform</li>
                <li>Your contact information (email address and phone number)</li>
                <li>A statement that you have a good faith belief that the use is not authorized</li>
                <li>A statement of accuracy and that you are authorized to act on behalf of the owner</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
                We will investigate and take appropriate action, including removing infringing content if necessary.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Prohibited Uses and Content</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                You agree not to use the Service:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>In any way that violates any applicable law or regulation</li>
                <li>To transmit any harmful, offensive, or inappropriate content</li>
                <li>To impersonate or attempt to impersonate the Company or other users</li>
                <li>To engage in any automated data collection (scraping, bots, etc.) without permission</li>
                <li>To interfere with or disrupt the Service or servers</li>
              </ul>
              
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4 mb-3 font-semibold">
                Strictly Prohibited Content:
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                The following types of content are strictly prohibited from being submitted to our platform. Any submission containing 
                or promoting such content will be immediately rejected and may result in account termination:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Adult/Sexual Content:</strong> Pornography, sexual services, escort services, or any sexually explicit material</li>
                <li><strong>Gambling:</strong> Online casinos, betting services, lottery systems, or any gambling-related tools</li>
                <li><strong>Illegal Drugs:</strong> Drug trafficking, illegal substance sales, or promotion of controlled substances</li>
                <li><strong>Violence and Gore:</strong> Content promoting violence, graphic gore, torture, or harm to individuals or animals</li>
                <li><strong>Weapons:</strong> Sales or promotion of firearms, explosives, or other dangerous weapons</li>
                <li><strong>Hate Speech:</strong> Content promoting discrimination, racism, xenophobia, homophobia, or hatred against any group</li>
                <li><strong>War and Terrorism:</strong> Content promoting terrorism, war crimes, or violent extremism</li>
                <li><strong>Fraud and Scams:</strong> Ponzi schemes, pyramid schemes, get-rich-quick scams, or fraudulent services</li>
                <li><strong>Illegal Activities:</strong> Hacking tools, piracy, counterfeit goods, or any illegal services</li>
                <li><strong>Child Exploitation:</strong> Any content involving minors in harmful or exploitative situations</li>
                <li><strong>Malware/Viruses:</strong> Tools designed to harm, exploit, or compromise computer systems</li>
                <li><strong>Misinformation:</strong> Tools deliberately designed to spread false information or manipulate public opinion</li>
              </ul>
              
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                This list is not exhaustive. We reserve the right to reject any content that we determine, in our sole discretion, 
                to be harmful, inappropriate, illegal, or in violation of our community standards. Repeated violations will result 
                in permanent account suspension and may be reported to relevant authorities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Submission Review Process</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                All tool submissions are subject to review by our administrators. We reserve the right to approve, reject, or request 
                modifications to any submission. Users may edit rejected submissions up to 3 times. We will provide reasons for rejections 
                when possible.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Disclaimer of Warranties and Liability</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">8.1 Nature of Service</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                <strong>We are a directory and listing platform only.</strong> We collect and display information about AI tools 
                available in the market. We do not develop, own, operate, or maintain any of the third-party AI tools listed on our platform. 
                We currently do not provide any paid services directly through this website.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">8.2 No Endorsement</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                The inclusion of any AI tool in our directory does not constitute an endorsement, recommendation, or guarantee of its 
                quality, safety, legality, or suitability for any purpose. We do not verify the claims made by third-party tool providers.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">8.3 Third-Party Tools and Services</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                All AI tools listed on our platform are third-party services. When you use any listed tool:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li>You are subject to that tool's own terms of service and privacy policy</li>
                <li>Any transactions, payments, or data sharing occur directly between you and the third-party provider</li>
                <li>We have no control over the availability, functionality, or security of third-party tools</li>
                <li>We are not responsible for any content, products, or services provided by third parties</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">8.4 No Liability for Third-Party Actions</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                <strong>We SHALL NOT be held liable for any losses, damages, or claims arising from:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li><strong>Privacy Breaches:</strong> Any unauthorized access to, disclosure of, or loss of your personal data or information 
                caused by third-party AI tools</li>
                <li><strong>Financial Losses:</strong> Any monetary losses, unauthorized charges, fraudulent transactions, or financial damages 
                resulting from using third-party tools or services</li>
                <li><strong>Data Loss:</strong> Loss, corruption, or unauthorized use of your data, files, or content by third-party tools</li>
                <li><strong>Service Interruptions:</strong> Downtime, unavailability, or discontinuation of any third-party AI tools</li>
                <li><strong>Malware or Security Issues:</strong> Viruses, malware, security vulnerabilities, or cyber attacks from third-party tools</li>
                <li><strong>Inaccurate Information:</strong> Incorrect, misleading, or outdated information about listed tools</li>
                <li><strong>Tool Performance:</strong> Poor performance, bugs, errors, or failures of third-party AI tools</li>
                <li><strong>Intellectual Property Issues:</strong> Copyright infringement, trademark violations, or other IP disputes involving third-party tools</li>
                <li><strong>Legal Compliance:</strong> Violations of laws or regulations by third-party tool providers</li>
                <li><strong>Subscription and Billing:</strong> Billing disputes, unexpected charges, or subscription cancellation issues with third-party providers</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">8.5 "AS IS" Service</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or implied, including 
                but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant 
                that the Service will be uninterrupted, secure, or error-free.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">8.6 User Responsibility</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                You acknowledge and agree that:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li>You use any third-party AI tools at your own risk</li>
                <li>You are responsible for evaluating the security, privacy practices, and trustworthiness of any third-party tools</li>
                <li>You should read and understand the terms of service and privacy policies of third-party tools before using them</li>
                <li>You are responsible for backing up your data and taking appropriate security measures</li>
                <li>You should exercise caution when sharing personal information or making payments to third-party services</li>
              </ul>

              <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 mt-4">
                <p className="text-sm text-amber-800 dark:text-amber-300 font-semibold mb-2">
                  ⚠️ IMPORTANT NOTICE
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  By using this platform and clicking on any third-party AI tool links, you acknowledge that you have read this disclaimer 
                  and agree that we are not responsible for any consequences arising from your use of third-party services. 
                  Always verify the legitimacy and security of any service before providing personal information or making payments.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                To the maximum extent permitted by applicable law, in no event shall we, the platform operator, or any affiliated parties 
                be liable for any:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li>Indirect, incidental, special, consequential, or punitive damages</li>
                <li>Loss of profits, revenue, data, or business opportunities</li>
                <li>Personal injury or property damage</li>
                <li>Unauthorized access to or alteration of your transmissions or data</li>
                <li>Damages arising out of or relating to your use of the Service or any third-party tools</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                This limitation applies regardless of the legal theory on which the claim is based, and even if we have been advised 
                of the possibility of such damages. Some jurisdictions do not allow the exclusion of certain warranties or the limitation 
                of liability for incidental or consequential damages, so some of the above limitations may not apply to you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. User Indemnification</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                You agree to indemnify, defend, and hold harmless the platform operator and any affiliated parties from and against 
                any and all claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising from:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Your violation of these Terms of Service</li>
                <li>Your violation of any applicable laws or regulations</li>
                <li>Your submission of content that infringes any third-party rights (including intellectual property, privacy, or publicity rights)</li>
                <li>Any false, misleading, or fraudulent information you provide</li>
                <li>Your negligence or willful misconduct</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">11. Termination</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, 
                for any reason, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-3">
                <li>Breach of these Terms of Service</li>
                <li>Submission of prohibited content</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Extended period of inactivity</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Upon termination, your right to use the Service will immediately cease. However, your previously approved public 
                submissions may remain on the platform unless you request their removal.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">12. Changes to Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                We reserve the right to modify or replace these Terms at any time. We will provide notice of any significant changes 
                by posting the new Terms on this page and updating the "Last updated" date. Continued use of the Service after 
                changes constitutes acceptance of the new Terms.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                For material changes, we will make reasonable efforts to notify users via email (if provided) or through a prominent 
                notice on the Service at least 30 days before the new terms take effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">13. Dispute Resolution</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                In the event of any dispute arising from or relating to these Terms or the Service:
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Informal Resolution:</strong> We encourage you to contact us first to seek an informal resolution</li>
                <li><strong>Mediation:</strong> If informal resolution fails, parties agree to attempt mediation before litigation</li>
                <li><strong>Arbitration/Litigation:</strong> Any unresolved disputes shall be settled through binding arbitration or 
                in a court of competent jurisdiction in accordance with the governing law below</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">14. Governing Law and Jurisdiction</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                These Terms shall be governed by and construed in accordance with the laws of the People's Republic of China, 
                without regard to its conflict of law provisions.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Any legal action or proceeding arising under these Terms will be brought exclusively in the courts located in 
                [Your City/Province], and you irrevocably consent to the personal jurisdiction and venue therein.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">15. Severability</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                If any provision of these Terms is found to be unenforceable or invalid under any applicable law, such unenforceability 
                or invalidity shall not render these Terms unenforceable or invalid as a whole. Such provisions shall be deleted without 
                affecting the remaining provisions herein.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">16. Entire Agreement</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                These Terms of Service, together with our Privacy Policy, constitute the entire agreement between you and us regarding 
                the use of the Service and supersede all prior and contemporaneous understandings, agreements, representations, and 
                warranties, both written and oral.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">17. Platform Operator Information</h2>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  <strong>Platform Name:</strong> AI Collection Tools
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  <strong>Operator:</strong> Independent Developer
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  <strong>Contact Email:</strong> <a href="mailto:taoge646@gmail.com" className="text-primary hover:underline">taoge646@gmail.com</a>
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  <strong>Location:</strong> China
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 italic">
                  Note: This platform is operated by an individual developer and is not affiliated with any company or organization. 
                  All services are provided on a best-effort basis.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">18. Contact Us</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                If you have any questions, concerns, or requests regarding these Terms of Service, please contact us:
              </p>
              <ul className="list-none space-y-2 text-gray-700 dark:text-gray-300">
                <li>📧 <strong>Email:</strong> <a href="mailto:taoge646@gmail.com" className="text-primary hover:underline">taoge646@gmail.com</a></li>
                <li>⏱️ <strong>Response Time:</strong> We aim to respond within 48-72 hours</li>
              </ul>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                For urgent security or privacy concerns, please mark your email subject with "[URGENT]" for priority handling.
              </p>
            </section>
          </div>
        </div>
      </div>
    </PageBackground>
  );
};

export default TermsOfService;
