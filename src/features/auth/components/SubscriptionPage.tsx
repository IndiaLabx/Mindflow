import React from 'react';
import { ArrowLeft, CreditCard, Gift, Share2, Award, CheckCircle } from 'lucide-react';

interface SubscriptionPageProps {
  onBack: () => void;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8 animate-fade-in pb-32 md:pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center mb-6">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 transition-colors" aria-label="Go back">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-2xl font-bold text-slate-800 ml-4">Subscription & Rewards</h1>
        </div>

        {/* Current Plan */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-slate-200/80 shadow-lg p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10"></div>

          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-md">
                <CreditCard className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Current Plan</p>
                <h2 className="text-2xl font-black text-slate-800">MindFlow Free</h2>
              </div>
            </div>
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-black bg-slate-100 text-slate-600 border border-slate-200 shadow-sm">
              Active
            </span>
          </div>

          <div className="space-y-3 mb-8">
             <div className="flex items-center gap-3 text-slate-700">
                 <CheckCircle className="w-5 h-5 text-indigo-500" />
                 <span className="font-medium">Access to basic quizzes</span>
             </div>
             <div className="flex items-center gap-3 text-slate-700">
                 <CheckCircle className="w-5 h-5 text-indigo-500" />
                 <span className="font-medium">Standard analytics tracking</span>
             </div>
             <div className="flex items-center gap-3 text-slate-700">
                 <CheckCircle className="w-5 h-5 text-indigo-500" />
                 <span className="font-medium">Community support</span>
             </div>
          </div>

          <button className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-lg rounded-2xl shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all duration-300">
            Upgrade to Pro
          </button>
          <p className="text-center text-xs text-slate-400 mt-4 font-medium">Unlock advanced features, personalized learning paths, and premium support.</p>
        </div>

        {/* Referral & Earn */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-slate-200/80 shadow-sm p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-100">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Referral & Earn</h2>
              <p className="text-sm text-slate-500 font-medium">Invite friends → Get premium features</p>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left w-full sm:w-auto">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Your Invite Code</p>
              <div className="px-6 py-3 bg-white dark:bg-gray-800 border border-slate-200 rounded-xl inline-block shadow-inner">
                 <p className="text-2xl font-black text-indigo-700 tracking-widest font-mono">FLOW24X</p>
              </div>
            </div>
            <button className="w-full sm:w-auto px-6 py-4 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 border border-indigo-100">
              <Share2 className="w-5 h-5" />
              Share Link
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center gap-2 text-center bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <Award className="w-8 h-8 text-amber-500 mb-1" />
                <p className="text-2xl font-black text-amber-700">0</p>
                <p className="text-xs font-bold text-amber-600/70 uppercase tracking-wider">Friends Joined</p>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 text-center bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <Gift className="w-8 h-8 text-blue-500 mb-1" />
                <p className="text-2xl font-black text-blue-700">0</p>
                <p className="text-xs font-bold text-blue-600/70 uppercase tracking-wider">Rewards Earned</p>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
