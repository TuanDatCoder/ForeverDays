import React from 'react';
import { HeartCrack, Home } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

export const NotFoundScreen: React.FC = () => {
  useSEO({
    title: '404 - Không Tìm Thấy Trang | ForeverDays',
    description: 'Trang bạn tìm kiếm không tồn tại hoặc đã bị dời đi. Quay lại trang chủ ForeverDays.',
    keywords: '404, không tìm thấy trang, foreverdays error'
  });

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="relative mb-8">
        <HeartCrack size={120} className="text-border-color" strokeWidth={1} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-coral font-black text-4xl">
          404
        </div>
      </div>
      
      <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-[-0.5px] mb-3">
        Lạc lối giữa ngân hà! 🛸
      </h1>
      
      <p className="text-text-secondary font-bold text-[13px] md:text-sm max-w-[300px] mb-8 leading-relaxed">
        Có vẻ như bạn đã đi lạc khỏi quỹ đạo tình yêu. Trang bạn tìm kiếm không tồn tại hoặc đã bị dời đi nơi khác.
      </p>

      <button
        onClick={handleGoHome}
        className="flex items-center gap-2 bg-primary-coral text-border-color font-extrabold px-6 py-3.5 rounded-xl border-[2.2px] border-border-color shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover transition-all"
      >
        <Home size={18} />
        <span>Về lại Trái Đất (Trang chủ)</span>
      </button>
    </div>
  );
};
