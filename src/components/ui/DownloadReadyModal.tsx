import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Share, Download, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DownloadReadyModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  blob?: Blob;
  fileType?: 'json' | 'pdf' | 'zip';
}

export const DownloadReadyModal: React.FC<DownloadReadyModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  blob,
  fileType = 'pdf'
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forceDownload, setForceDownload] = useState(false);

  const handleShareOrDownload = useCallback(async () => {
    // 1. Try Native Share if supported, we have a Blob, and we haven't forced fallback
    if (typeof navigator.share === "function" && blob && !forceDownload) {
      setIsSharing(true);
      setError(null);
      try {
        const file = new File([blob], fileName, {
          type: fileType === 'pdf' ? 'application/pdf' :
                fileType === 'json' ? 'application/json' :
                'application/zip'
        });

        // Some browsers don't support sharing certain file types, we can check with canShare
        if (typeof navigator.canShare !== "undefined" && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: fileName,
          });
          setIsSharing(false);
          // Don't close immediately to let them see success or try again if they want
          return;
        } else {
           console.warn('Native sharing of this file type is not supported. Falling back to download.');
        }
      } catch (err: any) {
        // AbortError is typical when user cancels share sheet. Don't show error for that.
        if (err.name !== 'AbortError') {
            console.error('Error sharing file:', err);
            setError('Failed to share file. Click again to download instead.');
            setForceDownload(true);
        }
        setIsSharing(false);
        return; // Pause here to let them read the error
      }
    }

    // 2. Fallback to standard web download
    try {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        onClose(); // Auto close on successful fallback download
    } catch(err) {
        console.error("Download fallback failed", err);
        setError("Failed to download file.");
        setIsSharing(false);
    }
  }, [fileUrl, fileName, blob, fileType, onClose, forceDownload]);

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-[110] p-6 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800">

        <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>

            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Download Ready</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[250px] mx-auto break-all">
                    {fileName}
                </p>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg w-full">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-left">{error}</span>
                </div>
            )}

            <div className="w-full space-y-3 pt-4">
                <button
                    onClick={handleShareOrDownload}
                    disabled={isSharing}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-70"
                >
                    {isSharing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Opening...
                        </>
                    ) : (
                        <>
                            {(typeof navigator.share === 'function' && blob && !forceDownload) ? <Share className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                            {(typeof navigator.share === 'function' && blob && !forceDownload) ? 'Open / Share File' : 'Save File'}
                        </>
                    )}
                </button>

                <button
                    onClick={onClose}
                    disabled={isSharing}
                    className="w-full py-3 px-4 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:bg-gray-800 rounded-xl transition-colors disabled:opacity-50"
                >
                    Close
                </button>
            </div>
        </div>
      </div>
    </>,
    document.body
  );
};
