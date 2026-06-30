import React, { useEffect, useRef } from 'react';
import { Download } from 'lucide-react';
import { PreviewProps } from '../types';
import { drawCard } from '../utils/canvasDrawing';

export const Preview: React.FC<PreviewProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Wait for fonts to be ready before drawing to ensure correct typography
    document.fonts.ready.then(() => {
      if (canvasRef.current) {
        drawCard(canvasRef.current, data);
      }
    });
  }, [data]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `vintage_flashcard_${data.idiom.replace(/\s+/g, '_').toLowerCase()}.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="h-full bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center p-4 md:p-8 overflow-auto">
      <div className="max-w-full w-full flex flex-col items-center gap-6">
        {/* Canvas Container with Shadow */}
        <div className="relative shadow-2xl rounded-sm overflow-hidden bg-[#F9F1E5]">
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto max-h-[70vh] object-contain"
            style={{
              maxWidth: '100%',
              height: 'auto',
              aspectRatio: data.orientation === 'portrait' ? '800/1200' : '1200/800'
            }}
          />
        </div>

        {/* Action Bar */}
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-8 py-4 bg-[#B8860B] hover:bg-[#9a7009] text-white rounded-xl shadow-lg transition-transform hover:-translate-y-1 font-bold tracking-widest uppercase font-sans"
        >
          <Download className="w-5 h-5" /> Download Artisan Card
        </button>
      </div>
    </div>
  );
};
