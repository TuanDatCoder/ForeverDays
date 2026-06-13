import React, { useState } from 'react';
import { useRelationship } from '../core/RelationshipContext';
import { Eye, EyeOff } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

export const UpdatePasswordScreen: React.FC = () => {
  useSEO({
    title: 'ForeverDays - Cập nhật mật khẩu',
    description: 'Cập nhật mật khẩu mới cho tài khoản ForeverDays của bạn.',
    keywords: 'cập nhật mật khẩu, đổi mật khẩu foreverdays'
  });

  const { changePassword, finishRecovery, error, isLoading, clearError } = useRelationship();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setLocalError('Mật khẩu xác nhận không khớp!');
      return;
    }

    if (password.length < 6) {
      setLocalError('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    const result = await changePassword(password);
    if (result.success) {
      finishRecovery(); // Quay về màn hình chính
    }
  };

  return (
    <div className="p-5 pb-5 w-full flex flex-col flex-1 justify-center min-h-screen items-center">
      <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-[30px_24px] mb-4 shadow-neo relative overflow-hidden w-full max-w-[420px]">
        {/* Absolute Background Accent Bubble */}
        <div className="absolute -top-10 -right-10 w-[120px] h-[120px] rounded-full bg-primary-coral opacity-15 z-0" />

        <div className="text-center mb-7 relative z-10">
          <h1 className="text-[28px] font-black text-primary-coral tracking-[-1px]">
            Khôi phục mật khẩu
          </h1>
          <p className="text-text-secondary font-bold text-[13px] mt-2">
            Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
          </p>
        </div>

        {(error || localError) && (
          <div className="bg-warning-coral/10 border-[2.2px] border-warning-coral text-warning-coral text-[13px] font-bold p-3 mb-5 rounded-2xl relative z-10">
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10">
          <div className="mb-4">
            <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Mật khẩu mới</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 pr-12 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary-coral transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Xác nhận mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 pr-12 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-coral text-border-color font-extrabold text-base border-[2.2px] border-border-color rounded-xl px-5 py-3.5 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none mb-4"
          >
            {isLoading ? 'Đang xử lý...' : 'Cập Nhật Mật Khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePasswordScreen;
