import React, { useEffect, useState } from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useAuth } from '../../features/auth/context/AuthContext';
import { getCanonicalAvatarUrl } from '../../utils/avatar';
import { X, Copy, Trash2 } from 'lucide-react';

export const HydrationDebugger: React.FC = () => {
  const { isOpen, events, toggleOpen, clearEvents } = useDebugStore();
  const { user, profile } = useAuth();
  const [platform, setPlatform] = useState<string>('Web');
  const [isNative, setIsNative] = useState<boolean>(false);

  useEffect(() => {
    if ((window as any).Capacitor) {
      setIsNative((window as any).Capacitor.isNativePlatform());
      setPlatform((window as any).Capacitor.getPlatform());
    }
  }, []);

  if (!isOpen) return null;

  const canonicalUrl = getCanonicalAvatarUrl(profile, user);
  let resolvedSource = 'Fallback';
  if (canonicalUrl === profile?.avatar_url) resolvedSource = 'Profile';
  else if (canonicalUrl === user?.user_metadata?.avatar_url) resolvedSource = 'Metadata';

  const copyToClipboard = () => {
      const debugData = {
          environment: { isNative, platform },
          auth: { userId: user?.id, metadataAvatar: user?.user_metadata?.avatar_url },
          profile: { profileId: profile?.id, profileAvatar: profile?.avatar_url, exists: !!profile },
          resolution: { canonicalUrl, resolvedSource },
          timeline: events
      };
      navigator.clipboard.writeText(JSON.stringify(debugData, null, 2)).catch(e => console.error("Copy failed", e));
  };

  return (
    <div className="fixed inset-0 z-[100000] bg-black/90 text-green-400 font-mono text-[10px] overflow-y-auto p-4 leading-tight">
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-black/90 py-2 border-b border-green-500/30">
        <h2 className="text-lg font-bold text-white">Hydration Debugger</h2>
        <div className="flex gap-4">
            <button onClick={copyToClipboard} className="p-2 hover:bg-green-500/20 rounded"><Copy size={16} /></button>
            <button onClick={clearEvents} className="p-2 hover:bg-red-500/20 text-red-400 rounded"><Trash2 size={16} /></button>
            <button onClick={toggleOpen} className="p-2 hover:bg-gray-800 rounded text-white"><X size={16} /></button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Environment */}
        <div className="border border-green-500/30 p-2 rounded bg-black/50">
          <h3 className="font-bold text-green-300 border-b border-green-500/30 mb-1 pb-1">Environment</h3>
          <p>isNativePlatform: <span className="text-white">{String(isNative)}</span></p>
          <p>Platform Type: <span className="text-white">{platform}</span></p>
          <p>App Version: <span className="text-white">{import.meta.env.VITE_APP_VERSION || 'unknown'}</span></p>
        </div>

        {/* Auth State */}
        <div className="border border-green-500/30 p-2 rounded bg-black/50">
          <h3 className="font-bold text-green-300 border-b border-green-500/30 mb-1 pb-1">Auth State</h3>
          <p>user.id: <span className="text-white">{user?.id || 'null'}</span></p>
          <p className="truncate">user.metadata.avatar_url: <br/><span className="text-white">{user?.user_metadata?.avatar_url || 'null'}</span></p>
        </div>

        {/* Canonical Profile */}
        <div className="border border-green-500/30 p-2 rounded bg-black/50">
          <h3 className="font-bold text-green-300 border-b border-green-500/30 mb-1 pb-1">Canonical Profile</h3>
          <p>profile exists?: <span className="text-white">{String(!!profile)}</span></p>
          <p>profile.id: <span className="text-white">{profile?.id || 'null'}</span></p>
          <p className="truncate">profile.avatar_url: <br/><span className="text-white">{profile?.avatar_url || 'null'}</span></p>
        </div>

        {/* Avatar Resolution */}
        <div className="border border-green-500/30 p-2 rounded bg-black/50">
          <h3 className="font-bold text-green-300 border-b border-green-500/30 mb-1 pb-1">Avatar Resolution</h3>
          <p>Source Used: <span className="text-yellow-400 font-bold">{resolvedSource}</span></p>
          <p className="truncate break-all">Output:<br/><span className="text-white">{canonicalUrl}</span></p>
        </div>

        {/* Timeline View */}
        <div className="border border-green-500/30 p-2 rounded bg-black/50">
          <h3 className="font-bold text-green-300 border-b border-green-500/30 mb-1 pb-1">Hydration Timeline</h3>
          <div className="space-y-1">
            {events.map((ev) => (
              <div key={ev.id} className="flex flex-col border-b border-green-500/10 pb-1">
                <div className="flex gap-2">
                  <span className="text-gray-500 shrink-0">
                    {new Date(ev.timestamp).toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 })}
                  </span>
                  <span className="text-blue-300">{ev.message}</span>
                </div>
                {ev.metadata && (
                    <span className="text-gray-400 text-[8px] pl-20 truncate break-all">
                        {JSON.stringify(ev.metadata)}
                    </span>
                )}
              </div>
            ))}
            {events.length === 0 && <p className="text-gray-500">No events logged.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
