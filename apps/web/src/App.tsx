import React, { useState } from 'react';
import { RelationshipProvider, useRelationship } from './core/RelationshipContext';
import { AuthScreen } from './features/AuthScreen';
import { HomeScreen } from './features/HomeScreen';
import { MilestonesScreen } from './features/MilestonesScreen';
import { RemindersScreen } from './features/RemindersScreen';
import { ProfileScreen } from './features/ProfileScreen';
import { Heart, Calendar, Bell, User } from 'lucide-react';

type TabType = 'home' | 'milestones' | 'reminders' | 'profile';

const AppContent: React.FC = () => {
  const { user, isDemoMode, isLoading } = useRelationship();
  const [activeTab, setActiveTab] = useState<TabType>('home');

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
      case 'profile':
        return <ProfileScreen />;
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
              onClick={() => setActiveTab('home')}
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
              onClick={() => setActiveTab('milestones')}
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
              onClick={() => setActiveTab('reminders')}
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
              onClick={() => setActiveTab('profile')}
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
        {renderTabContent()}
      </div>

      {/* Bottom Navigation Tab Bar (Visible on Mobile) */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[72px] bg-bg-card border-t-[2.2px] border-border-color border-x-0 md:border-x-[2.2px] border-x-border-color flex justify-around items-center pb-[env(safe-area-inset-bottom)] z-50 md:hidden">
        <div
          onClick={() => setActiveTab('home')}
          className={getTabItemClass('home')}
        >
          <Heart fill={activeTab === 'home' ? '#ff6584' : 'none'} />
          <span>Trang chủ</span>
        </div>

        <div
          onClick={() => setActiveTab('milestones')}
          className={getTabItemClass('milestones')}
        >
          <Calendar fill={activeTab === 'milestones' ? '#ff6584' : 'none'} />
          <span>Cột mốc</span>
        </div>

        <div
          onClick={() => setActiveTab('reminders')}
          className={getTabItemClass('reminders')}
        >
          <Bell fill={activeTab === 'reminders' ? '#ff6584' : 'none'} />
          <span>Nhắc nhở</span>
        </div>

        <div
          onClick={() => setActiveTab('profile')}
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
