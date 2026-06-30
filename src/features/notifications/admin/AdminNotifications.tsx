import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../auth/context/AuthContext';
import { Megaphone, Send, AlertCircle, CheckCircle2, Edit2, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { AdminEditNotificationModal } from './AdminEditNotificationModal';
import { AppNotification } from '../types';

export const AdminNotifications: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'announcements' | 'tests_quizzes' | 'study_materials' | 'daily_reminders'>('announcements');
  const [targetAudience, setTargetAudience] = useState<'all' | 'competitive' | 'school'>('all');
  const [link, setLink] = useState('');

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Past Notifications State
  const [pastNotifications, setPastNotifications] = useState<AppNotification[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isFetchingList, setIsFetchingList] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const ITEMS_PER_PAGE = 10;

  const fetchPastNotifications = async (page: number) => {
    setIsFetchingList(true);
    try {
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setPastNotifications(data || []);
      if (count !== null) setTotalCount(count);
    } catch (err: any) {
      console.error('Error fetching past notifications:', err);
    } finally {
      setIsFetchingList(false);
    }
  };

  React.useEffect(() => {
    if (user && user.email === 'admin@mindflow.com') {
      fetchPastNotifications(currentPage);
    }
  }, [user, currentPage]);


  if (!user || user.email !== 'admin@mindflow.com') {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Unauthorized Access</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this notification?')) {
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', id);

        if (error) throw error;

        // Re-fetch current page
        fetchPastNotifications(currentPage);
      } catch (err: any) {
        console.error('Error deleting notification:', err);
        alert(err.message || 'Failed to delete notification');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          title,
          message,
          type,
          target_audience: targetAudience,
          link: link || null,
          created_by: user.id
        }]);

      if (error) throw error;

      setStatus('success');
      setTitle('');
      setMessage('');
      setLink('');

      setTimeout(() => setStatus('idle'), 3000);
      if (currentPage === 1) {
        fetchPastNotifications(1);
      } else {
        setCurrentPage(1);
      }
    } catch (err: any) {
      console.error('Error creating notification:', err);
      setStatus('error');
      setErrorMsg(err.message || 'Failed to send notification');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button
        onClick={() => navigate('/dashboard')}
        className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center transition-colors font-semibold uppercase tracking-widest text-xs w-fit mb-4"
      >
        <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
        Back to Dashboard
      </button>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 bg-indigo-50/50 dark:bg-indigo-900/10">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Broadcast Notification</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Send an alert to users (In-app & Push)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {status === 'success' && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p className="font-medium text-sm">Notification sent successfully!</p>
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="font-medium text-sm">{errorMsg}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., New Mock Test Available!"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Details about the notification..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                >
                  <option value="announcements">Announcements</option>
                  <option value="tests_quizzes">Tests & Quizzes</option>
                  <option value="study_materials">Study Materials</option>
                  <option value="daily_reminders">Daily Reminders</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Target Audience</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                >
                  <option value="all">Everyone</option>
                  <option value="competitive">Competitive Mode Users</option>
                  <option value="school">School Mode Users</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Action Link (Optional)</label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="E.g., /tests or https://example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-70"
             aria-label="Submit search">
              {status === 'loading' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Broadcast Now
                </>
              )}
            </button>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
              This will immediately send in-app alerts and push notifications to eligible users.
            </p>
          </div>
        </form>
      </div>

      {/* Past Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/10">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Past Notifications</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">View, modify, or delete previously sent notifications</p>
        </div>

        <div className="p-0">
          {isFetchingList ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : pastNotifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No notifications found.
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {pastNotifications.map((notif) => (
                <div key={notif.id} className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between sm:justify-start sm:gap-3">
                      <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1">{notif.title}</h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{notif.message}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                        {notif.type.replace('_', ' ')}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        Audience: {notif.target_audience}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t border-gray-100 dark:border-gray-700/50 sm:border-0 justify-end">
                    <button
                      onClick={() => {
                        setSelectedNotification(notif);
                        setIsEditModalOpen(true);
                      }}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalCount > ITEMS_PER_PAGE && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isFetchingList}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Page {currentPage} of {Math.ceil(totalCount / ITEMS_PER_PAGE)}
            </span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage >= Math.ceil(totalCount / ITEMS_PER_PAGE) || isFetchingList}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AdminEditNotificationModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedNotification(null);
        }}
        notification={selectedNotification}
        onSuccess={(updatedNotif) => {
          setPastNotifications(prev => prev.map(n => n.id === updatedNotif.id ? updatedNotif : n));
        }}
      />
    </div>
  );
};
