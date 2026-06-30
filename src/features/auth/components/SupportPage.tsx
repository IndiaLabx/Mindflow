import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, MessageCircle, Share2, Award, ExternalLink, ShieldCheck, FileText, ShieldAlert } from 'lucide-react';

interface SupportPageProps {
  onBack: () => void;
}

const SupportPage: React.FC<SupportPageProps> = ({ onBack }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8 animate-fade-in pb-32 md:pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center mb-6">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 transition-colors" aria-label="Go back">
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 ml-4">Help & Support</h1>
        </div>

        {/* Support Section */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-slate-200/80 shadow-sm p-6 mb-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-bl-full -z-10"></div>

          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center text-sky-600 border border-sky-200">
                  <HelpCircle className="w-5 h-5" />
              </div>
              How can we help you?
          </h2>
          <div className="space-y-4">
            <button className="w-full flex items-center justify-between p-5 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Help Center</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">FAQs and Guides</p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </button>

            <button className="w-full flex items-center justify-between p-5 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-500">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Contact Support</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Get in touch with us</p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </button>

            <button onClick={() => navigate('/settings/my-reports')} className="w-full flex items-center justify-between p-5 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 hover:border-red-300 hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Report History</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Track the status of users and content you've reported.</p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-slate-300 group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>

        {/* Share Achievements */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-lg p-8 relative overflow-hidden group hover:shadow-emerald-500/30 transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 dark:bg-gray-800/10 rounded-bl-full backdrop-blur-sm pointer-events-none"></div>

          <div className="relative z-10 flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-white dark:bg-gray-800/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm border border-white/30">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Share Progress</h2>
              <p className="text-emerald-50 font-medium">Show off your achievements</p>
            </div>
          </div>

          <button onClick={() => window.open('https://wa.me/?text=' + encodeURIComponent('Check out my progress on MindFlow! https://aklabx.github.io/MindFlow/'), '_blank')} className="relative z-10 w-full flex items-center justify-center gap-3 p-4 bg-white dark:bg-gray-800 text-emerald-700 rounded-2xl font-black text-lg shadow-md hover:bg-emerald-50 hover:scale-[1.02] transition-all duration-300">
            <Share2 className="w-5 h-5" />
            Share via WhatsApp
          </button>
        </div>

        {/* Legal & Policies */}
        <div className="pt-8 pb-4">
            <div className="flex items-center justify-center gap-6 text-sm font-bold text-slate-500 dark:text-slate-400">
                <a href="#/privacy-policy" className="flex items-center gap-2 hover:text-indigo-600 dark:text-indigo-400 transition-colors">
                    <ShieldCheck className="w-4 h-4" /> Privacy Policy
                </a>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                <a href="#/about/terms-of-use" className="flex items-center gap-2 hover:text-indigo-600 dark:text-indigo-400 transition-colors">
                    <FileText className="w-4 h-4" /> Terms of Service
                </a>
            </div>
            <p className="text-center text-xs text-slate-400 mt-4 font-medium">© {new Date().getFullYear()} MindFlow. All rights reserved.</p>
        </div>

      </div>
    </div>
  );
};

export default SupportPage;
