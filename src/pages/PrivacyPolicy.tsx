import React from 'react';
import { ChevronLeft, Home, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                        aria-label="Go back"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Privacy Policy</h1>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 flex items-center gap-2"
                    aria-label="Back to Home"
                >
                     <Home className="w-5 h-5" />
                     <span className="hidden sm:inline text-sm font-medium">Home</span>
                </button>
            </div>

            <div className="max-w-3xl mx-auto px-4 mt-8 space-y-8">
                <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                            <Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">MindFlow Privacy Policy</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Last updated: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 space-y-6 text-sm md:text-base leading-relaxed">

                        <p>
                            Welcome to MindFlow. Your privacy is critically important to us. This Privacy Policy outlines how we collect, use, and protect your information when you use our application.
                        </p>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">1. Information We Collect</h3>
                            <p>We collect information to provide better services to all our users. The types of information we collect include:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><strong>Account Information:</strong> If you create an account, we collect your email address and basic profile information via our authentication provider (Supabase).</li>
                                <li><strong>Usage Data:</strong> We collect information about how you interact with the app, such as quiz scores, flashcard progress, and time spent on modules.</li>
                                <li><strong>Local Storage & IndexedDB:</strong> MindFlow uses local browser storage (IndexedDB) to save your quiz history, bookmarks, and settings offline to ensure a fast and seamless experience.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">2. How We Use Your Information</h3>
                            <p>We use the information we collect for the following purposes:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>To provide, maintain, and improve the MindFlow application.</li>
                                <li>To personalize your learning experience and track your progress.</li>
                                <li>To power AI-driven features, such as personalized tutoring and chat.</li>
                                <li>To sync your data across devices if you are logged in.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">3. Artificial Intelligence and Third-Party Services</h3>
                            <p>
                                MindFlow integrates with third-party Artificial Intelligence services, specifically the <strong>Google Gemini API</strong>, to provide advanced features like AI Chat and interactive voice sessions.
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>When you use AI features, the text or audio prompts you provide are sent to Google's servers for processing.</li>
                                <li>Please do not share sensitive personal information (like financial details or passwords) in your interactions with the AI.</li>
                                <li>MindFlow also uses Supabase for database management and authentication. Your data is securely stored in accordance with Supabase's privacy and security standards.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">4. Data Security</h3>
                            <p>
                                We implement a variety of security measures to maintain the safety of your personal information. All sensitive data is transmitted via Secure Socket Layer (SSL) technology. However, no method of transmission over the Internet or method of electronic storage is 100% secure.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">5. Data Retention and Deletion</h3>
                            <p>
                                We retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy.
                                You have the right to request the deletion of your account and all associated personal data at any time.
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><strong>How to delete your data:</strong> You can delete your account directly within the MindFlow app by navigating to Settings &gt; Developer &gt; Delete Account, or by contacting us at support@mindflow.com.</li>
                                <li>Upon request, we will securely delete your email, profile information, and learning progress from our active databases within 30 days.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">6. Your Choices</h3>
                            <p>
                                You can choose not to provide certain personal information, though this may limit your ability to use some features of the app. You can clear your local browser storage at any time to remove offline data. If you wish to delete your account and all associated data, please contact support.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">7. Changes to This Privacy Policy</h3>
                            <p>
                                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">8. Contact Us</h3>
                            <p>
                                If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at support@mindflow.com (or via the Support section in the app).
                            </p>
                        </div>

                    </div>
                </section>
            </div>
        </div>
    );
};
