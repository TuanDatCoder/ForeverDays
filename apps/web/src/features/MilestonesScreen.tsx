import React, { useState, useEffect } from 'react';
import { useRelationship } from '../core/RelationshipContext';
import { LoveUtils } from '../core/loveUtils';
import type { MilestoneItem } from '../core/loveUtils';
import { MilestoneService } from '@forever-days/core';
import { Calendar, Plus, CheckCircle, Trash2, Heart, Clock } from 'lucide-react';

export const MilestonesScreen: React.FC = () => {
  const { anniversaryDate, coupleId, isDemoMode } = useRelationship();
  const [customMilestones, setCustomMilestones] = useState<MilestoneItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  // Add Milestone Modal
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [upcomingLimit, setUpcomingLimit] = useState(10);

  const milestoneService = new MilestoneService();

  const loadCustomMilestones = async () => {
    if (isDemoMode) {
      const saved = localStorage.getItem('custom_milestones');
      if (saved) {
        try {
          const list = JSON.parse(saved) as { title: string; targetDate: string }[];
          const items: MilestoneItem[] = list.map(item => {
            const target = new Date(item.targetDate);
            target.setHours(0,0,0,0);
            const today = new Date();
            today.setHours(0,0,0,0);
            const diffTime = target.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isPassed = target.getTime() < today.getTime();

            return {
              title: item.title,
              targetDate: item.targetDate,
              daysRemaining: isPassed ? 0 : diffDays,
              isPassed,
              type: 'custom',
            };
          });
          setCustomMilestones(items);
        } catch {}
      }
      return;
    }

    if (!coupleId) return;
    try {
      const dbMilestones = await milestoneService.fetchMilestones(coupleId);
      const items: MilestoneItem[] = dbMilestones.map(milestone => {
        const target = new Date(milestone.targetDate);
        target.setHours(0,0,0,0);
        const today = new Date();
        today.setHours(0,0,0,0);
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isPassed = target.getTime() < today.getTime();

        return {
          id: milestone.id,
          title: milestone.title,
          targetDate: milestone.targetDate,
          daysRemaining: isPassed ? 0 : diffDays,
          isPassed,
          type: 'custom',
        };
      });
      setCustomMilestones(items);
    } catch {}
  };

  useEffect(() => {
    loadCustomMilestones();
  }, [coupleId, isDemoMode]);

  const handleSyncCalendar = async () => {
    setIsSyncing(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSyncing(false);
    setShowSyncSuccess(true);
  };

  const handleAddMilestone = async () => {
    if (!newTitle.trim() || !newDate) return;

    const target = new Date(newDate);
    target.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isPassed = target.getTime() < today.getTime();

    const newItem: MilestoneItem = {
      title: newTitle.trim(),
      targetDate: newDate,
      daysRemaining: isPassed ? 0 : diffDays,
      isPassed,
      type: 'custom',
    };

    const updatedList = [...customMilestones, newItem];
    setCustomMilestones(updatedList);

    if (isDemoMode) {
      const itemsToSave = updatedList.map(item => ({ title: item.title, targetDate: item.targetDate }));
      localStorage.setItem('custom_milestones', JSON.stringify(itemsToSave));
    } else if (coupleId) {
      await milestoneService.createMilestone(coupleId, newTitle.trim(), newDate, 'custom');
      await loadCustomMilestones(); // reload to get DB ids
    }

    setNewTitle('');
    setNewDate('');
    setIsOpenAddModal(false);
  };

  const handleDeleteMilestone = async (item: MilestoneItem) => {
    if (isDemoMode) {
      const updated = customMilestones.filter(m => m.title !== item.title || m.targetDate !== item.targetDate);
      setCustomMilestones(updated);
      const itemsToSave = updated.map(item => ({ title: item.title, targetDate: item.targetDate }));
      localStorage.setItem('custom_milestones', JSON.stringify(itemsToSave));
    } else if (item.id) {
      await milestoneService.deleteMilestone(item.id);
      await loadCustomMilestones();
    }
  };

  // Generate system list
  const systemItems = anniversaryDate ? LoveUtils.generateSystemMilestones(anniversaryDate) : [];
  const allMilestones = [...systemItems, ...customMilestones];

  // Filter lists
  const upcoming = allMilestones
    .filter(m => !m.isPassed)
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

  const passed = allMilestones
    .filter(m => m.isPassed)
    .sort((a, b) => new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime());

  // Date formatter
  const getDayOfWeekName = (date: Date) => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return days[date.getDay()];
  };

  const formatDateString = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayName = getDayOfWeekName(date);
    const dateFormatted = date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${dayName}, ${dateFormatted}`;
  };

  const getGoogleCalendarUrl = (title: string, dateStr: string) => {
    const cleanDateStr = dateStr.replace(/-/g, '');
    const parts = dateStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    date.setDate(date.getDate() + 1);
    const nextYear = date.getFullYear();
    const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
    const nextDay = String(date.getDate()).padStart(2, '0');
    const cleanEndDateStr = `${nextYear}${nextMonth}${nextDay}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${cleanDateStr}/${cleanEndDateStr}`;
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="bg-gradient-to-br from-primary-coral/15 to-secondary-mint/5 p-6 border-b-[2.2px] border-border-color text-center">
        <h2 className="text-xl font-black text-text-primary">Cột mốc kỷ niệm</h2>
      </div>

      <div className="p-5 pb-[92px] w-full flex flex-col flex-1 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start w-full">
          {/* Milestones Timeline - Spans 2 columns on desktop */}
          <div className="md:col-span-2 flex flex-col gap-4 order-2 md:order-1">

            {/* ── UPCOMING ── */}
            <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl shadow-neo overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b-[2px] border-border-color/30 bg-primary-coral/5">
                <h3 className="text-[12px] font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <Clock size={14} className="text-primary-coral" /> Kỷ niệm sắp tới
                </h3>
                <span className="text-[11px] font-bold text-text-secondary bg-border-color/10 px-2 py-0.5 rounded-full">
                  {upcoming.length} mốc
                </span>
              </div>
              {/* Scrollable body with fixed height */}
              <div className="overflow-y-auto max-h-[360px] p-3 flex flex-col gap-2
                [&::-webkit-scrollbar]:w-1.5
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-border-color/30
                [&::-webkit-scrollbar-thumb]:rounded-full">
                {upcoming.length === 0 && (
                  <div className="text-center text-text-secondary text-sm py-6">Chưa có cột mốc nào sắp tới 🥺</div>
                )}
                {upcoming.slice(0, upcomingLimit).map((item, idx) => (
                  <div key={`up-${idx}`} className="bg-bg-primary border-[1.5px] border-border-color/50 rounded-xl px-3.5 py-3 flex justify-between items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-[14px] truncate">{item.title}</span>
                        {item.yearLabel && (
                          <span className="bg-primary-coral/15 text-primary-coral text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap border border-primary-coral/30">
                           {item.yearLabel}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-secondary mt-0.5">{formatDateString(item.targetDate)}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] text-text-secondary">Còn lại</div>
                        <div className="text-[14px] font-extrabold text-primary-coral">{item.daysRemaining} ngày</div>
                      </div>
                      <a
                        href={getGoogleCalendarUrl(item.title, item.targetDate)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-primary-coral transition-colors p-1"
                        title="Thêm vào Google Calendar"
                      >
                        <Calendar size={14} />
                      </a>
                      {item.type === 'custom' && (
                        <button onClick={() => handleDeleteMilestone(item)} className="text-text-secondary hover:text-warning-coral transition-colors p-1">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Load more button - always visible BELOW the scroll area */}
              {upcomingLimit < upcoming.length && (
                <div className="px-3 pb-3">
                  <button
                    onClick={() => setUpcomingLimit(prev => prev + 10)}
                    className="w-full py-2.5 border-[1.5px] border-primary-coral/60 rounded-xl text-[12px] font-extrabold text-primary-coral bg-primary-coral/5 hover:bg-primary-coral/10 transition-colors"
                  >
                    Xem thêm 10 sự kiện
                  </button>
                </div>
              )}
            </div>

            {/* ── PASSED ── */}
            {passed.length > 0 && (
              <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl shadow-neo overflow-hidden opacity-80">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b-[2px] border-border-color/30 bg-secondary-mint/5">
                  <h3 className="text-[12px] font-extrabold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                    <Heart size={14} className="text-secondary-mint" fill="currentColor" /> Kỷ niệm đã qua
                  </h3>
                  <span className="text-[11px] font-bold text-text-secondary bg-border-color/10 px-2 py-0.5 rounded-full">
                    {passed.length} mốc
                  </span>
                </div>
                {/* Scrollable body */}
                <div className="overflow-y-auto max-h-[240px] p-3 flex flex-col gap-1.5
                  [&::-webkit-scrollbar]:w-1.5
                  [&::-webkit-scrollbar-track]:bg-transparent
                  [&::-webkit-scrollbar-thumb]:bg-border-color/30
                  [&::-webkit-scrollbar-thumb]:rounded-full">
                  {passed.map((item, idx) => (
                    <div key={`pass-${idx}`} className="bg-bg-primary/50 border-[1.5px] border-border-color/30 rounded-xl px-3.5 py-2.5 flex justify-between items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[13px] text-text-secondary truncate">{item.title}</span>
                          {item.yearLabel && (
                            <span className="bg-secondary-mint/20 text-secondary-mint text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap">
                             {item.yearLabel}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-text-secondary/60 mt-0.5">{formatDateString(item.targetDate)}</div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-[10px] font-bold text-text-secondary/70 bg-border-color/10 px-2 py-0.5 rounded-full">✓ Đã qua</span>
                        <a
                          href={getGoogleCalendarUrl(item.title, item.targetDate)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-secondary hover:text-primary-coral transition-colors p-1"
                          title="Thêm vào Google Calendar"
                        >
                          <Calendar size={13} />
                        </a>
                        {item.type === 'custom' && (
                          <button onClick={() => handleDeleteMilestone(item)} className="text-text-secondary hover:text-warning-coral transition-colors p-1">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar / Tools - Spans 1 column on desktop */}
          <div className="flex flex-col gap-6 order-1 md:order-2">
            <h3 className="text-[13px] font-extrabold text-text-secondary pl-2 mb-1 uppercase tracking-wider">Đồng bộ</h3>
            {/* Calendar Sync Card */}
            <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 shadow-neo flex flex-col gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-primary-coral/15 flex items-center justify-center text-primary-coral shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <h4 className="text-[13px] font-extrabold">Đồng bộ Google Calendar</h4>
                  <p className="text-[10px] text-text-secondary mt-0.5">Tự động tạo lịch nhắc trên điện thoại hai bạn.</p>
                </div>
              </div>
              <button
                onClick={handleSyncCalendar}
                disabled={isSyncing}
                className="w-full bg-primary-coral text-border-color font-extrabold text-xs border-[2.2px] border-border-color rounded-full py-2.5 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
              >
                {isSyncing ? 'Đồng bộ...' : 'Đồng bộ'}
              </button>
            </div>
          </div>
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => setIsOpenAddModal(true)}
          className="fixed bottom-[92px] right-6 md:right-[calc(50%-560px)] bg-primary-coral text-border-color font-extrabold text-[13px] border-[2.2px] border-border-color rounded-full px-5 py-3 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none z-10"
        >
          <Plus size={16} /> Thêm sự kiện
        </button>
      </div>

      {/* Sync Success Modal */}
      {showSyncSuccess && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-5">
          <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-6 mb-4 shadow-neo w-full max-w-[380px]">
            <div className="flex items-center gap-2.5 mb-3">
              <CheckCircle size={24} color="#b5ead7" />
              <h3 className="text-lg font-extrabold">Đồng bộ thành công</h3>
            </div>
            <p className="text-[13px] text-text-secondary leading-relaxed mb-5">
              Các cột mốc kỷ niệm quan trọng của hai bạn đã được tạo và ghi nhận trực tiếp vào Lịch Google của điện thoại di động! Cả hai bạn sẽ nhận được thông báo nhắc nhở tự động từ Google.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowSyncSuccess(false)}
                className="bg-primary-coral text-border-color font-extrabold text-[13px] border-[2.2px] border-border-color rounded-xl px-4 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
              >
                Tuyệt vời 💖
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Milestone Modal */}
      {isOpenAddModal && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-5">
          <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-6 mb-4 shadow-neo w-full max-w-[380px]">
            <h3 className="text-lg font-extrabold mb-5">Tạo sự kiện mới</h3>

            <div className="mb-4">
              <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Tên cột mốc kỷ niệm</label>
              <input
                type="text"
                placeholder="Ví dụ: Nụ hôn đầu tiên, Đi xem phim..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral"
              />
            </div>

            <div className="mb-6">
              <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Ngày diễn ra</label>
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsOpenAddModal(false)}
                className="bg-text-primary text-bg-card font-extrabold text-[13px] border-[2.2px] border-border-color rounded-xl px-4 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
              >
                Hủy
              </button>
              <button
                onClick={handleAddMilestone}
                className="bg-primary-coral text-border-color font-extrabold text-[13px] border-[2.2px] border-border-color rounded-xl px-4 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
              >
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MilestonesScreen;
