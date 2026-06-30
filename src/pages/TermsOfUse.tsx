import React from 'react';
import { ChevronLeft, Home, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TermsOfUse: React.FC = () => {
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
                    <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Terms of Use</h1>
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
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
                            <FileText className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">MindFlow Terms of Use</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Last updated: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 space-y-6 text-sm md:text-base leading-relaxed">
                        <p>
                            Welcome to MindFlow. By accessing or using our application, you agree to comply with and be bound by the following Terms of Use, which are governed by the laws of India.
                        </p>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">1. Acceptance of Terms</h3>
                            <p>
                                By registering an account or using the app, you acknowledge that you have read, understood, and agree to these terms. If you do not agree with any part of these terms, you must discontinue the use of the app immediately.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">2. User Conduct</h3>
                            <p>
                                You agree to use the application strictly for lawful purposes. You shall not engage in any activity that disrupts, damages, or interferes with the functioning of the app or its servers. Any unauthorized access or attempt to reverse-engineer the app is strictly prohibited.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">3. Intellectual Property Rights</h3>
                            <p>
                                All content, trademarks, logos, and intellectual property associated with MindFlow are the exclusive property of its developers. You may not reproduce, distribute, or create derivative works from our content without explicit written permission.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">4. Limitation of Liability</h3>
                            <p>
                                MindFlow is provided on an "as is" and "as available" basis. While we strive for accuracy, we make no warranties regarding the completeness, reliability, or accuracy of the content. We shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of the app.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">5. Governing Law and Jurisdiction</h3>
                            <p>
                                These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts in India.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
