import React, { useState } from 'react';
import { useRelationship } from '../core/RelationshipContext';
import { Eye, EyeOff } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

export const AuthScreen: React.FC = () => {
  useSEO({
    title: 'ForeverDays - Đăng nhập & Đăng ký',
    description: 'Bắt đầu hành trình ghi dấu tình yêu của bạn với ForeverDays. Kết nối cặp đôi, đếm ngày yêu nhau và tạo góc vũ trụ riêng.',
    keywords: 'đăng nhập foreverdays, tạo tài khoản tình yêu, đếm ngày yêu, app cặp đôi'
  });

  const { register, signIn, resetPassword, startDemoMode, error, isLoading, clearError } = useRelationship();
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!email) return;

    if (isForgotPassword) {
      await resetPassword(email);
    } else if (isRegister) {
      if (!password || !nickname) return;
      await register(email, password, nickname);
    } else {
      if (!password) return;
      await signIn(email, password);
    }
  };

  return (
    <div className="p-5 pb-5 w-full flex flex-col flex-1 justify-center min-h-screen items-center">
      <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-[30px_24px] mb-4 shadow-neo relative overflow-hidden w-full max-w-[420px]">
        {/* Absolute Background Accent Bubble */}
        <div className="absolute -top-10 -right-10 w-[120px] h-[120px] rounded-full bg-primary-coral opacity-15 z-0" />

        <div className="text-center mb-7 relative z-10">
          <h1 className="text-[32px] font-black text-primary-coral tracking-[-1px]">
            ForeverDays
          </h1>
          <p className="text-text-secondary font-bold text-[13px] mt-1">
            Ghi dấu tình yêu • Nhắc nhở từng ngày
          </p>
        </div>

        {error && (
          <div className="bg-warning-coral/10 border-[2.2px] border-warning-coral text-warning-coral text-[13px] font-bold p-3 mb-5 rounded-2xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10">
          {!isForgotPassword && isRegister && (
            <div className="mb-4">
              <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Biệt danh của bạn</label>
              <input
                type="text"
                placeholder="Nhập biệt danh..."
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral"
                required={!isForgotPassword && isRegister}
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Địa chỉ Email</label>
            <input
              type="email"
              placeholder="nhapemail@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral"
              required
            />
          </div>

          {!isForgotPassword && (
            <div className="mb-6">
              <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 pr-12 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral"
                  required={!isForgotPassword}
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
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-coral text-border-color font-extrabold text-base border-[2.2px] border-border-color rounded-xl px-5 py-3.5 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none mb-4"
          >
            {isLoading ? 'Đang xử lý...' : isForgotPassword ? 'Gửi Link Khôi Phục' : isRegister ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'}
          </button>
        </form>

        <div className="text-center mt-2 relative z-10 flex flex-col gap-2">
          {!isForgotPassword && !isRegister && (
            <span
              onClick={() => {
                clearError();
                setIsForgotPassword(true);
              }}
              className="text-text-secondary hover:text-primary-coral font-bold text-[13px] cursor-pointer"
            >
              Quên mật khẩu?
            </span>
          )}
          
          <span
            onClick={() => {
              clearError();
              if (isForgotPassword) {
                setIsForgotPassword(false);
              } else {
                setIsRegister(!isRegister);
              }
            }}
            className="text-primary-coral font-extrabold text-sm cursor-pointer underline"
          >
            {isForgotPassword ? 'Quay lại đăng nhập' : isRegister ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký ngay'}
          </span>
        </div>

        <div className="my-6 border-t-2 border-dashed border-border-color relative" />

        <button
          onClick={startDemoMode}
          className="w-full bg-bg-card text-text-primary font-extrabold text-sm border-[2.2px] border-border-color rounded-xl px-5 py-3 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
        >
          Vào bản thử nghiệm (Demo Mode)
        </button>
      </div>
    </div>
  );
};
export default AuthScreen;
