import React, { useState, useEffect } from 'react';
import { RelationshipProvider, useRelationship } from './core/RelationshipContext';
import { supabase } from '@forever-days/core';
import { AuthScreen } from './features/AuthScreen';
import { HomeScreen } from './features/HomeScreen';
import { MilestonesScreen } from './features/MilestonesScreen';
import { RemindersScreen } from './features/RemindersScreen';
import { CosmosScreen } from './features/CosmosScreen';
import { ProfileScreen } from './features/ProfileScreen';
import { NotFoundScreen } from './features/NotFoundScreen';
import { UpdatePasswordScreen } from './features/UpdatePasswordScreen';
import { Heart, Calendar, Bell, User, Sparkles } from 'lucide-react';

type TabType = 'home' | 'milestones' | 'reminders' | 'cosmos' | 'profile' | 'not-found';

const getTabFromPath = (path: string): TabType => {
  const cleanPath = path.replace(/^\//, '').toLowerCase();
  if (cleanPath === '' || cleanPath === 'home' || cleanPath.startsWith('?')) return 'home';
  if (cleanPath === 'cot-moc' || cleanPath === 'milestones') return 'milestones';
  if (cleanPath === 'nhac-nho' || cleanPath === 'reminders') return 'reminders';
  if (cleanPath === 'vu-tru' || cleanPath === 'cosmos') return 'cosmos';
  if (cleanPath === 'ho-so' || cleanPath === 'profile') return 'profile';
  return 'not-found';
};

const getPathFromTab = (tab: TabType): string => {
  if (tab === 'home') return '/';
  if (tab === 'milestones') return '/cot-moc';
  if (tab === 'reminders') return '/nhac-nho';
  if (tab === 'cosmos') return '/vu-tru';
  if (tab === 'profile') return '/ho-so';
  return `/${tab}`;
};

const AppContent: React.FC = () => {
  const { user, isDemoMode, isLoading, coupleId, partner, isRecoveringPassword } = useRelationship();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const currentPath = window.location.pathname;
    if (currentPath === '/') {
      const saved = localStorage.getItem('fd_active_tab') as TabType | null;
      return (saved && ['home', 'milestones', 'reminders', 'cosmos', 'profile'].includes(saved)) ? saved : 'home';
    }
    return getTabFromPath(currentPath);
  });

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    localStorage.setItem('fd_active_tab', tab);
    const targetPath = getPathFromTab(tab);
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath + window.location.search);
    }
  };

  // Synchronize initial URL and listen to back/forward navigation
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath === '/') {
      const saved = localStorage.getItem('fd_active_tab') as TabType | null;
      if (saved && saved !== 'home' && ['home', 'milestones', 'reminders', 'cosmos', 'profile'].includes(saved)) {
        window.history.replaceState(null, '', `${getPathFromTab(saved)}${window.location.search}`);
      }
    }

    const handlePopState = () => {
      const tabFromPath = getTabFromPath(window.location.pathname);
      setActiveTab(tabFromPath);
      localStorage.setItem('fd_active_tab', tabFromPath);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Listen to signal channel globally
  useEffect(() => {
    if (isDemoMode || !coupleId || !user?.id) return;

    const triggerGlobalNotification = (title: string, body: string) => {
      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.right = '24px';
      toast.style.backgroundColor = '#FF6F61';
      toast.style.color = '#3D2F3D';
      toast.style.border = '2.2px solid #3D2F3D';
      toast.style.padding = '14px 20px';
      toast.style.borderRadius = '16px';
      toast.style.boxShadow = '4px 4px 0px #3D2F3D';
      toast.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      toast.style.fontWeight = '800';
      toast.style.fontSize = '12px';
      toast.style.zIndex = '9999';
      toast.style.transition = 'all 0.3s ease';
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
      toast.style.display = 'flex';
      toast.style.flexDirection = 'column-reverse';
      toast.style.gap = '4px';

      toast.innerHTML = `
        <div style="font-weight: 800; font-size: 13px;">🔔 ${title}</div>
        <div style="font-weight: 500; font-size: 11px; margin-top: 4px; opacity: 0.9;">${body}</div>
      `;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
      }, 50);

      setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        toast.style.opacity = '0';
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 300);
      }, 4500);
    };

    const channel = supabase.channel(`couple_signals_${coupleId}`)
      .on('broadcast', { event: 'signal' }, ({ payload }) => {
        if (payload.senderId !== user.id) {
          const senderName = partner?.nickname || 'Nửa kia';
          const title = payload.type === 'love' ? 'Tín hiệu yêu thương! 💕' : 'Ai đó đang chọc bạn! 🤪';
          const body = payload.type === 'love'
            ? `${senderName} đang nhớ bạn rất nhiều! 🥰`
            : `${senderName} vừa chọc ghẹo bạn một cái! 🤪`;

          triggerGlobalNotification(title, body);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, user?.id, partner, isDemoMode]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div
          className="pulse-animation"
          style={{
            width: '60px',
            height: '60px',
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='M50,22 C12,-5 -12,42 50,88 C112,42 88,-5 50,22 Z' fill='%23ff6584' /></svg>")`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="text-text-secondary font-extrabold text-sm">
          Đang tải dữ liệu tình yêu...
        </div>
      </div>
    );
  }

  // If recovering password, show UpdatePasswordScreen
  if (isRecoveringPassword) {
    return <UpdatePasswordScreen />;
  }

  // If not logged in and not in demo mode, show Auth Screen
  if (!user && !isDemoMode) {
    return <AuthScreen />;
  }

  // Tab contents rendering
  const renderTabContent = () => {
    switch (activeTab) {
      case 'milestones':
        return <MilestonesScreen />;
      case 'reminders':
        return <RemindersScreen />;
      case 'cosmos':
        return <CosmosScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'not-found':
        return <NotFoundScreen />;
      case 'home':
      default:
        return <HomeScreen />;
    }
  };

  const getTabItemClass = (tab: TabType) => {
    const base = "flex flex-col items-center justify-center cursor-pointer flex-1 h-full transition-all duration-200 font-bold text-[10px] gap-1 no-underline [&>svg]:w-[22px] [&>svg]:h-[22px] hover:[&>svg]:scale-110";
    const activeState = activeTab === tab ? "text-primary-coral" : "text-text-secondary";
    return `${base} ${activeState}`;
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-screen">
      {/* Sidebar Navigation (Visible on Desktop) */}
      <div className="hidden md:flex flex-col w-[280px] min-h-screen sticky top-0 bg-bg-card border-r-[2.2px] border-border-color p-6 justify-between shrink-0">
        <div className="flex flex-col gap-6">
          {/* Logo / Brand header */}
          <div className="py-2">
            <h1 className="text-2xl font-black text-primary-coral tracking-[-1px]">
              ForeverDays
            </h1>
            <p className="text-text-secondary font-bold text-[11px] mt-0.5">
              Ghi dấu tình yêu từng ngày
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={() => handleTabChange('home')}
              className={`flex items-center gap-3.5 px-4.5 py-3 rounded-xl border-[2.2px] font-extrabold text-[13px] transition-all cursor-pointer shadow-none hover:translate-x-[2px] hover:translate-y-[2px] ${
                activeTab === 'home'
                  ? 'bg-primary-coral text-border-color border-border-color shadow-neo-hover'
                  : 'bg-bg-primary text-text-primary border-transparent hover:border-border-color'
              }`}
            >
              <Heart size={18} fill={activeTab === 'home' ? '#ff6584' : 'none'} className="shrink-0" />
              <span>Trang chủ</span>
            </button>

            <button
              onClick={() => handleTabChange('milestones')}
              className={`flex items-center gap-3.5 px-4.5 py-3 rounded-xl border-[2.2px] font-extrabold text-[13px] transition-all cursor-pointer shadow-none hover:translate-x-[2px] hover:translate-y-[2px] ${
                activeTab === 'milestones'
                  ? 'bg-primary-coral text-border-color border-border-color shadow-neo-hover'
                  : 'bg-bg-primary text-text-primary border-transparent hover:border-border-color'
              }`}
            >
              <Calendar size={18} fill={activeTab === 'milestones' ? '#ff6584' : 'none'} className="shrink-0" />
              <span>Cột mốc kỷ niệm</span>
            </button>

            <button
              onClick={() => handleTabChange('cosmos')}
              className={`flex items-center gap-3.5 px-4.5 py-3 rounded-xl border-[2.2px] font-extrabold text-[13px] transition-all cursor-pointer shadow-none hover:translate-x-[2px] hover:translate-y-[2px] ${
                activeTab === 'cosmos'
                  ? 'bg-primary-coral text-border-color border-border-color shadow-neo-hover'
                  : 'bg-bg-primary text-text-primary border-transparent hover:border-border-color'
              }`}
            >
              <Sparkles size={18} fill={activeTab === 'cosmos' ? '#ff6584' : 'none'} className="shrink-0" />
              <span>Góc Vũ Trụ</span>
            </button>

            <button
              onClick={() => handleTabChange('reminders')}
              className={`flex items-center gap-3.5 px-4.5 py-3 rounded-xl border-[2.2px] font-extrabold text-[13px] transition-all cursor-pointer shadow-none hover:translate-x-[2px] hover:translate-y-[2px] ${
                activeTab === 'reminders'
                  ? 'bg-primary-coral text-border-color border-border-color shadow-neo-hover'
                  : 'bg-bg-primary text-text-primary border-transparent hover:border-border-color'
              }`}
            >
              <Bell size={18} fill={activeTab === 'reminders' ? '#ff6584' : 'none'} className="shrink-0" />
              <span>Nhắc nhở cặp đôi</span>
            </button>

            <button
              onClick={() => handleTabChange('profile')}
              className={`flex items-center gap-3.5 px-4.5 py-3 rounded-xl border-[2.2px] font-extrabold text-[13px] transition-all cursor-pointer shadow-none hover:translate-x-[2px] hover:translate-y-[2px] ${
                activeTab === 'profile'
                  ? 'bg-primary-coral text-border-color border-border-color shadow-neo-hover'
                  : 'bg-bg-primary text-text-primary border-transparent hover:border-border-color'
              }`}
            >
              <User size={18} fill={activeTab === 'profile' ? '#ff6584' : 'none'} className="shrink-0" />
              <span>Hồ sơ & Sở thích</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="text-[10px] text-text-secondary font-bold border-t border-dashed border-border-color pt-4">
          Phiên bản Web Dashboard
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 pb-[72px] md:pb-0 overflow-y-auto">
        <div className="flex-1">
          {renderTabContent()}
        </div>
        
        {/* Footer */}
        <footer className="bg-bg-card border-t-[2.2px] border-border-color p-6 mt-auto text-center font-bold text-text-secondary text-xs flex flex-col items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="uppercase tracking-wider text-[10px]">Hợp tác & Feedback</span>
            <a href="mailto:devprojectlabvn@gmail.com" className="text-primary-coral font-extrabold hover:underline">
              devprojectlabvn@gmail.com
            </a>
          </div>
          <div className="w-[120px] border-t-2 border-dashed border-border-color/10" />
          <div className="flex flex-col gap-0.5">
            <span>© 2026 Góc Vũ Trụ</span>
            <span>
              Crafted with ❤️ by <strong className="text-text-primary">Family Love Studio</strong>
            </span>
          </div>
        </footer>
      </div>

      {/* Bottom Navigation Tab Bar (Visible on Mobile) */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[72px] bg-bg-card border-t-[2.2px] border-border-color border-x-0 md:border-x-[2.2px] border-x-border-color flex justify-around items-center pb-[env(safe-area-inset-bottom)] z-50 md:hidden">
        <div
          onClick={() => handleTabChange('home')}
          className={getTabItemClass('home')}
        >
          <Heart fill={activeTab === 'home' ? '#ff6584' : 'none'} />
          <span>Trang chủ</span>
        </div>

        <div
          onClick={() => handleTabChange('milestones')}
          className={getTabItemClass('milestones')}
        >
          <Calendar fill={activeTab === 'milestones' ? '#ff6584' : 'none'} />
          <span>Cột mốc</span>
        </div>

        <div
          onClick={() => handleTabChange('cosmos')}
          className={getTabItemClass('cosmos')}
        >
          <Sparkles fill={activeTab === 'cosmos' ? '#ff6584' : 'none'} />
          <span>Vũ Trụ</span>
        </div>

        <div
          onClick={() => handleTabChange('reminders')}
          className={getTabItemClass('reminders')}
        >
          <Bell fill={activeTab === 'reminders' ? '#ff6584' : 'none'} />
          <span>Nhắc nhở</span>
        </div>

        <div
          onClick={() => handleTabChange('profile')}
          className={getTabItemClass('profile')}
        >
          <User fill={activeTab === 'profile' ? '#ff6584' : 'none'} />
          <span>Hồ sơ</span>
        </div>
      </nav>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <RelationshipProvider>
      <AppContent />
    </RelationshipProvider>
  );
};

export default App;
