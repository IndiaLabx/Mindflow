import React, { useState } from 'react';
import { ChevronLeft, Loader2, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../auth/context/AuthContext';
import { OwnerSVG } from './AboutSVGs';
import { useNotification } from '../../../stores/useNotificationStore';

export const AalokProfile: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useNotification();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAdminFill = () => {
        setEmail('admin@mindflow.com');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            showToast({ title: 'Success', message: 'Admin logged in successfully', variant: 'success' });
            navigate('/dashboard');
        } catch (error: any) {
            showToast({ title: 'Error', message: error.message || 'Login failed', variant: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-700 relative overflow-hidden bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4 flex items-center shadow-sm -mx-4 sm:-mx-6 lg:-mx-8 px-8 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Aalok's Profile</h1>
            </div>

            <div className="flex-1 flex flex-col space-y-8 relative z-10 animate-fade-in w-full max-w-4xl mx-auto">

                {/* Admin Login Segment (Only show if not logged in or not admin) */}
                {(!user || user.email !== 'admin@mindflow.com') && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-gray-700/50 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full blur-2xl pointer-events-none"></div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <KeyRound className="text-purple-500 w-6 h-6" />
                            Admin Access
                        </h2>

                        <form onSubmit={handleLogin} className="space-y-4 max-w-md">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="flex-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                        placeholder="Enter admin email"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAdminFill}
                                        className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors border border-purple-200 dark:border-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center justify-center shrink-0"
                                        title="Auto-fill Admin Email"
                                     aria-label="Perform action">
                                        <KeyRound className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full group relative flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-white dark:focus:ring-offset-gray-900 transition-all duration-300 shadow-md ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                             aria-label="Submit search">
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <span>Sign In as Admin</span>
                                )}
                            </button>
                        </form>
                    </motion.div>
                )}

                {/* Profile Segment */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[40px] p-6 sm:p-10 shadow-2xl border border-white dark:border-gray-700/50 relative overflow-hidden"
                >
                     <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-bl-full blur-3xl pointer-events-none"></div>
                     <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-tr-full blur-3xl pointer-events-none"></div>

                     <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
                        {/* Avatar */}
                        <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-xl shrink-0 relative group">
                            <img
                                src="./images/owner-profile.png"
                                alt="Aalok Kumar Sharma"
                                className="w-full h-full object-cover bg-gray-200 dark:bg-gray-700 group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Aalok+Kumar+Sharma&background=random&color=fff&size=400`;
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                                <OwnerSVG />
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider rounded-full mb-3 border border-purple-200 dark:border-purple-800">
                                Owner & Visionary
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                                Aalok Kumar Sharma
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 font-medium leading-relaxed">
                                Spearheading the strategic direction and innovative growth of MindFlow. Passionate about leveraging technology to transform education and learning experiences.
                            </p>

                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Focus</p>
                                    <p className="text-gray-900 dark:text-white font-bold">Product Strategy</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Location</p>
                                    <p className="text-gray-900 dark:text-white font-bold">India</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Experience</p>
                                    <p className="text-gray-900 dark:text-white font-bold">10+ Years</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Vision</p>
                                    <p className="text-gray-900 dark:text-white font-bold">Empower Minds</p>
                                </div>
                            </div>
                        </div>
                     </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AalokProfile;
