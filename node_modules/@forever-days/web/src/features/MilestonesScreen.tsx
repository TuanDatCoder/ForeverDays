import React, { useState, useEffect } from 'react';
import { useRelationship } from '../core/RelationshipContext';
import { LoveUtils } from '../core/loveUtils';
import type { MilestoneItem } from '../core/loveUtils';
import { MilestoneService, CoupleEventService, MilestonePlanService } from '@forever-days/core';
import type { CoupleEvent, MilestonePlan } from '@forever-days/core';
import { Calendar, Plus, CheckCircle, Trash2, Heart, Clock, MapPin, Compass, ChevronDown, ChevronUp, Utensils, Gamepad2 } from 'lucide-react';

export const MilestonesScreen: React.FC = () => {
  const { anniversaryDate, coupleId, isDemoMode } = useRelationship();
  const [customMilestones, setCustomMilestones] = useState<MilestoneItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  // Milestone Plans State
  const [plans, setPlans] = useState<MilestonePlan[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [newPlanCategory, setNewPlanCategory] = useState<'go' | 'eat' | 'play'>('go');
  const [newPlanContent, setNewPlanContent] = useState('');
  const [isAddingPlan, setIsAddingPlan] = useState(false);

  const planService = new MilestonePlanService();

  const getMilestoneKey = (item: MilestoneItem) => item.id || item.title;

  // Add Milestone Modal
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [upcomingLimit, setUpcomingLimit] = useState(10);

  // Daily Events State
  const [coupleEvents, setCoupleEvents] = useState<CoupleEvent[]>([]);
  const [isOpenAddEventModal, setIsOpenAddEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  const milestoneService = new MilestoneService();
  const coupleEventService = new CoupleEventService();

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

  const loadCoupleEvents = async () => {
    if (isDemoMode) {
      const saved = localStorage.getItem('demo_couple_events');
      if (saved) {
        try {
          setCoupleEvents(JSON.parse(saved));
        } catch {}
      } else {
        const mockEvents: CoupleEvent[] = [
          {
            id: 'ev-1',
            coupleId: 'demo-couple-id',
            title: 'Đi ăn tối kỷ niệm',
            eventDate: new Date().toISOString().split('T')[0],
            eventTime: '19:00:00',
            location: 'Nhà hàng Sen Tây Hồ',
            description: 'Ăn lẩu và nướng rất vui vẻ ấm áp!'
          },
          {
            id: 'ev-2',
            coupleId: 'demo-couple-id',
            title: 'Đi xem phim Marvel',
            eventDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            eventTime: '14:30:00',
            location: 'CGV Vincom Nguyễn Chí Thanh',
            description: 'Phim rất hay, hai đứa ăn hết 1 bắp rang lớn.'
          }
        ];
        setCoupleEvents(mockEvents);
        localStorage.setItem('demo_couple_events', JSON.stringify(mockEvents));
      }
      return;
    }

    if (!coupleId) return;
    try {
      const dbEvents = await coupleEventService.fetchEvents(coupleId);
      setCoupleEvents(dbEvents);
    } catch {}
  };

  const loadPlans = async () => {
    if (isDemoMode) {
      const saved = localStorage.getItem('demo_milestone_plans');
      if (saved) {
        try {
          setPlans(JSON.parse(saved));
        } catch {}
      } else {
        const mockPlans: MilestonePlan[] = [
          {
            id: 'plan-1',
            coupleId: 'demo-couple-id',
            milestoneTitle: '100 Ngày Yêu Nhau',
            category: 'eat',
            content: 'Ăn tối lãng mạn tại quán nướng gần hồ',
          },
          {
            id: 'plan-2',
            coupleId: 'demo-couple-id',
            milestoneTitle: '100 Ngày Yêu Nhau',
            category: 'go',
            content: 'Đi dạo quanh hồ Tây',
          },
          {
            id: 'plan-3',
            coupleId: 'demo-couple-id',
            milestoneTitle: '1000 Ngày Yêu Nhau',
            category: 'go',
            content: 'Đi du lịch Đà Lạt cùng nhau',
          },
          {
            id: 'plan-4',
            coupleId: 'demo-couple-id',
            milestoneTitle: '1000 Ngày Yêu Nhau',
            category: 'eat',
            content: 'Ăn lẩu gà lá é',
          },
          {
            id: 'plan-5',
            coupleId: 'demo-couple-id',
            milestoneTitle: '1000 Ngày Yêu Nhau',
            category: 'play',
            content: 'Chơi bắn cung, trượt phao cỏ',
          }
        ];
        setPlans(mockPlans);
        localStorage.setItem('demo_milestone_plans', JSON.stringify(mockPlans));
      }
      return;
    }

    if (!coupleId) return;
    try {
      const dbPlans = await planService.fetchPlans(coupleId);
      setPlans(dbPlans);
    } catch {}
  };

  const handleAddPlan = async (milestoneTitle: string, milestoneId?: string) => {
    if (!newPlanContent.trim()) return;

    setIsAddingPlan(true);
    const content = newPlanContent.trim();
    const category = newPlanCategory;

    if (isDemoMode) {
      const newPlanItem: MilestonePlan = {
        id: `plan-${Date.now()}`,
        coupleId: 'demo-couple-id',
        milestoneId,
        milestoneTitle,
        category,
        content,
      };
      const updatedList = [...plans, newPlanItem];
      setPlans(updatedList);
      localStorage.setItem('demo_milestone_plans', JSON.stringify(updatedList));
    } else if (coupleId) {
      const created = await planService.createPlan(coupleId, milestoneTitle, category, content, milestoneId);
      if (created) {
        setPlans(prev => [...prev, created]);
      } else {
        await loadPlans();
      }
    }

    setNewPlanContent('');
    setIsAddingPlan(false);
  };

  const handleDeletePlan = async (planId: string) => {
    if (isDemoMode) {
      const updatedList = plans.filter(p => p.id !== planId);
      setPlans(updatedList);
      localStorage.setItem('demo_milestone_plans', JSON.stringify(updatedList));
    } else {
      await planService.deletePlan(planId);
      setPlans(prev => prev.filter(p => p.id !== planId));
    }
  };

  useEffect(() => {
    loadCustomMilestones();
    loadCoupleEvents();
    loadPlans();
  }, [coupleId, isDemoMode]);

  const handleAddCoupleEvent = async () => {
    if (!eventTitle.trim() || !eventDate) return;

    setIsAddingEvent(true);
    const newEvent: Omit<CoupleEvent, 'id' | 'createdAt' | 'updatedAt'> = {
      coupleId: coupleId || 'demo-couple-id',
      title: eventTitle.trim(),
      eventDate,
      eventTime: eventTime || undefined,
      location: eventLocation.trim() || undefined,
      description: eventDescription.trim() || undefined,
    };

    if (isDemoMode) {
      const id = `ev-${Date.now()}`;
      const updatedList = [{ id, ...newEvent } as CoupleEvent, ...coupleEvents];
      setCoupleEvents(updatedList);
      localStorage.setItem('demo_couple_events', JSON.stringify(updatedList));
    } else {
      await coupleEventService.createEvent(newEvent);
      await loadCoupleEvents();
    }

    setEventTitle('');
    setEventDate('');
    setEventTime('');
    setEventLocation('');
    setEventDescription('');
    setIsOpenAddEventModal(false);
    setIsAddingEvent(false);
  };

  const handleDeleteCoupleEvent = async (id: string) => {
    if (isDemoMode) {
      const updatedList = coupleEvents.filter(e => e.id !== id);
      setCoupleEvents(updatedList);
      localStorage.setItem('demo_couple_events', JSON.stringify(updatedList));
    } else {
      await coupleEventService.deleteEvent(id);
      await loadCoupleEvents();
    }
  };

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
                {upcoming.slice(0, upcomingLimit).map((item, idx) => {
                  const mKey = getMilestoneKey(item);
                  const isExpanded = expandedKey === mKey;
                  return (
                    <div key={`up-${idx}`} className="bg-bg-primary border-[1.5px] border-border-color/50 rounded-xl p-3.5 flex flex-col gap-2 transition-all duration-200">
                      {/* Main Row Content */}
                      <div className="flex justify-between items-center gap-3">
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
                          <button
                            onClick={() => setExpandedKey(isExpanded ? null : mKey)}
                            className="mt-1 bg-primary-coral/10 hover:bg-primary-coral/20 text-primary-coral text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-primary-coral/20 cursor-pointer inline-flex items-center gap-1 transition-all duration-100"
                          >
                            <Compass size={11} />
                            <span>Kế hoạch ăn chơi</span>
                            {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                          </button>
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

                      {/* Expanded Plan Section */}
                      {isExpanded && (
                        <div className="mt-2 border-t border-dashed border-border-color/30 pt-3">
                          <div className="flex flex-col gap-3">
                            {/* Categorized List */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              {/* Go */}
                              <div className="bg-bg-card border border-border-color/30 rounded-xl p-2.5">
                                <div className="flex items-center gap-1 text-[11px] font-extrabold text-primary-coral mb-2">
                                  <MapPin size={12} />
                                  <span>🚗 Đi đâu</span>
                                </div>
                                <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto">
                                  {plans.filter(p => p.milestoneTitle === item.title && p.category === 'go').length === 0 ? (
                                    <div className="text-[10px] text-text-secondary italic pl-1">Chưa có kế hoạch</div>
                                  ) : (
                                    plans.filter(p => p.milestoneTitle === item.title && p.category === 'go').map(plan => (
                                      <div key={plan.id} className="flex justify-between items-center bg-bg-primary/55 border border-border-color/10 rounded-lg px-2 py-1 text-[11px] gap-1.5">
                                        <span className="truncate flex-1 font-semibold">{plan.content}</span>
                                        <button onClick={() => handleDeletePlan(plan.id!)} className="text-text-secondary hover:text-warning-coral p-0.5 bg-transparent border-0 cursor-pointer">
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>

                              {/* Eat */}
                              <div className="bg-bg-card border border-border-color/30 rounded-xl p-2.5">
                                <div className="flex items-center gap-1 text-[11px] font-extrabold text-secondary-mint mb-2">
                                  <Utensils size={12} />
                                  <span>🍔 Ăn gì</span>
                                </div>
                                <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto">
                                  {plans.filter(p => p.milestoneTitle === item.title && p.category === 'eat').length === 0 ? (
                                    <div className="text-[10px] text-text-secondary italic pl-1">Chưa có kế hoạch</div>
                                  ) : (
                                    plans.filter(p => p.milestoneTitle === item.title && p.category === 'eat').map(plan => (
                                      <div key={plan.id} className="flex justify-between items-center bg-bg-primary/55 border border-border-color/10 rounded-lg px-2 py-1 text-[11px] gap-1.5">
                                        <span className="truncate flex-1 font-semibold">{plan.content}</span>
                                        <button onClick={() => handleDeletePlan(plan.id!)} className="text-text-secondary hover:text-warning-coral p-0.5 bg-transparent border-0 cursor-pointer">
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>

                              {/* Play */}
                              <div className="bg-bg-card border border-border-color/30 rounded-xl p-2.5">
                                <div className="flex items-center gap-1 text-[11px] font-extrabold text-text-primary mb-2">
                                  <Gamepad2 size={12} />
                                  <span>🎮 Chơi gì</span>
                                </div>
                                <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto">
                                  {plans.filter(p => p.milestoneTitle === item.title && p.category === 'play').length === 0 ? (
                                    <div className="text-[10px] text-text-secondary italic pl-1">Chưa có kế hoạch</div>
                                  ) : (
                                    plans.filter(p => p.milestoneTitle === item.title && p.category === 'play').map(plan => (
                                      <div key={plan.id} className="flex justify-between items-center bg-bg-primary/55 border border-border-color/10 rounded-lg px-2 py-1 text-[11px] gap-1.5">
                                        <span className="truncate flex-1 font-semibold">{plan.content}</span>
                                        <button onClick={() => handleDeletePlan(plan.id!)} className="text-text-secondary hover:text-warning-coral p-0.5 bg-transparent border-0 cursor-pointer">
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Adding Form */}
                            <div className="flex gap-2 items-center bg-bg-primary/40 border border-border-color/20 rounded-xl p-2">
                              <select
                                value={newPlanCategory}
                                onChange={e => setNewPlanCategory(e.target.value as any)}
                                className="bg-bg-card border border-border-color/30 rounded-lg text-xs font-bold px-2 py-1.5 outline-none text-text-primary cursor-pointer h-[32px]"
                              >
                                <option value="go">🚗 Đi đâu</option>
                                <option value="eat">🍔 Ăn gì</option>
                                <option value="play">🎮 Chơi gì</option>
                              </select>
                              <input
                                type="text"
                                value={newPlanContent}
                                onChange={e => setNewPlanContent(e.target.value)}
                                placeholder="Nhập nội dung kế hoạch..."
                                className="bg-bg-card border border-border-color/30 rounded-lg text-xs font-semibold px-3 py-1.5 outline-none flex-1 focus:border-primary-coral h-[32px] box-border"
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleAddPlan(item.title, item.id);
                                }}
                              />
                              <button
                                onClick={() => handleAddPlan(item.title, item.id)}
                                disabled={isAddingPlan}
                                className="bg-primary-coral text-border-color border border-border-color font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-100 hover:translate-x-[1px] hover:translate-y-[1px] select-none h-[32px] flex items-center justify-center"
                              >
                                {isAddingPlan ? '...' : '+ Thêm'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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
                  {passed.map((item, idx) => {
                    const mKey = getMilestoneKey(item);
                    const isExpanded = expandedKey === mKey;
                    return (
                      <div key={`pass-${idx}`} className="bg-bg-primary/50 border-[1.5px] border-border-color/30 rounded-xl p-3.5 flex flex-col gap-2 transition-all duration-200">
                        {/* Main Row Content */}
                        <div className="flex justify-between items-center gap-3">
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
                            <button
                              onClick={() => setExpandedKey(isExpanded ? null : mKey)}
                              className="mt-1 bg-secondary-mint/10 hover:bg-secondary-mint/20 text-secondary-mint text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-secondary-mint/20 cursor-pointer inline-flex items-center gap-1 transition-all duration-100"
                            >
                              <Compass size={11} />
                              <span>Lịch sử đã đi/ăn/chơi</span>
                              {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                            </button>
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

                        {/* Expanded Plan Section */}
                        {isExpanded && (
                          <div className="mt-2 border-t border-dashed border-border-color/30 pt-3">
                            <div className="flex flex-col gap-3">
                              {/* Categorized List */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {/* Go */}
                                <div className="bg-bg-card border border-border-color/30 rounded-xl p-2.5">
                                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-primary-coral mb-2">
                                    <MapPin size={12} />
                                    <span>🚗 Đi đâu</span>
                                  </div>
                                  <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto">
                                    {plans.filter(p => p.milestoneTitle === item.title && p.category === 'go').length === 0 ? (
                                      <div className="text-[10px] text-text-secondary italic pl-1">Chưa đi đâu</div>
                                    ) : (
                                      plans.filter(p => p.milestoneTitle === item.title && p.category === 'go').map(plan => (
                                        <div key={plan.id} className="flex justify-between items-center bg-bg-primary/55 border border-border-color/10 rounded-lg px-2 py-1 text-[11px] gap-1.5">
                                          <span className="truncate flex-1 font-semibold text-text-secondary">{plan.content}</span>
                                          <button onClick={() => handleDeletePlan(plan.id!)} className="text-text-secondary hover:text-warning-coral p-0.5 bg-transparent border-0 cursor-pointer">
                                            <Trash2 size={11} />
                                          </button>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>

                                {/* Eat */}
                                <div className="bg-bg-card border border-border-color/30 rounded-xl p-2.5">
                                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-secondary-mint mb-2">
                                    <Utensils size={12} />
                                    <span>🍔 Ăn gì</span>
                                  </div>
                                  <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto">
                                    {plans.filter(p => p.milestoneTitle === item.title && p.category === 'eat').length === 0 ? (
                                      <div className="text-[10px] text-text-secondary italic pl-1">Chưa ăn gì</div>
                                    ) : (
                                      plans.filter(p => p.milestoneTitle === item.title && p.category === 'eat').map(plan => (
                                        <div key={plan.id} className="flex justify-between items-center bg-bg-primary/55 border border-border-color/10 rounded-lg px-2 py-1 text-[11px] gap-1.5">
                                          <span className="truncate flex-1 font-semibold text-text-secondary">{plan.content}</span>
                                          <button onClick={() => handleDeletePlan(plan.id!)} className="text-text-secondary hover:text-warning-coral p-0.5 bg-transparent border-0 cursor-pointer">
                                            <Trash2 size={11} />
                                          </button>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>

                                {/* Play */}
                                <div className="bg-bg-card border border-border-color/30 rounded-xl p-2.5">
                                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-text-primary mb-2">
                                    <Gamepad2 size={12} />
                                    <span>🎮 Chơi gì</span>
                                  </div>
                                  <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto">
                                    {plans.filter(p => p.milestoneTitle === item.title && p.category === 'play').length === 0 ? (
                                      <div className="text-[10px] text-text-secondary italic pl-1">Chưa chơi gì</div>
                                    ) : (
                                      plans.filter(p => p.milestoneTitle === item.title && p.category === 'play').map(plan => (
                                        <div key={plan.id} className="flex justify-between items-center bg-bg-primary/55 border border-border-color/10 rounded-lg px-2 py-1 text-[11px] gap-1.5">
                                          <span className="truncate flex-1 font-semibold text-text-secondary">{plan.content}</span>
                                          <button onClick={() => handleDeletePlan(plan.id!)} className="text-text-secondary hover:text-warning-coral p-0.5 bg-transparent border-0 cursor-pointer">
                                            <Trash2 size={11} />
                                          </button>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Adding Form */}
                              <div className="flex gap-2 items-center bg-bg-primary/40 border border-border-color/20 rounded-xl p-2">
                                <select
                                  value={newPlanCategory}
                                  onChange={e => setNewPlanCategory(e.target.value as any)}
                                  className="bg-bg-card border border-border-color/30 rounded-lg text-xs font-bold px-2 py-1.5 outline-none text-text-primary cursor-pointer h-[32px]"
                                >
                                  <option value="go">🚗 Đi đâu</option>
                                  <option value="eat">🍔 Ăn gì</option>
                                  <option value="play">🎮 Chơi gì</option>
                                </select>
                                <input
                                  type="text"
                                  value={newPlanContent}
                                  onChange={e => setNewPlanContent(e.target.value)}
                                  placeholder="Thêm mục đã đi/ăn/chơi kỷ niệm..."
                                  className="bg-bg-card border border-border-color/30 rounded-lg text-xs font-semibold px-3 py-1.5 outline-none flex-1 focus:border-primary-coral h-[32px] box-border"
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleAddPlan(item.title, item.id);
                                  }}
                                />
                                <button
                                  onClick={() => handleAddPlan(item.title, item.id)}
                                  disabled={isAddingPlan}
                                  className="bg-primary-coral text-border-color border border-border-color font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-100 hover:translate-x-[1px] hover:translate-y-[1px] select-none h-[32px] flex items-center justify-center"
                                >
                                  {isAddingPlan ? '...' : '+ Thêm'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── DAILY EVENTS / JOURNEYS ── */}
            <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl shadow-neo overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b-[2px] border-border-color/30 bg-primary-coral/5">
                <h3 className="text-[12px] font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={14} className="text-primary-coral" /> Hoạt động & Chuyến đi trong ngày
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsOpenAddEventModal(true)}
                    className="bg-primary-coral text-border-color font-extrabold text-[10px] border-[1.5px] border-border-color rounded-full px-2.5 py-1 hover:bg-primary-coral/95 transition-colors cursor-pointer"
                  >
                    + Thêm chuyến đi
                  </button>
                  <span className="text-[11px] font-bold text-text-secondary bg-border-color/10 px-2 py-0.5 rounded-full">
                    {coupleEvents.length} chuyến
                  </span>
                </div>
              </div>
              
              {/* Scrollable list */}
              <div className="overflow-y-auto max-h-[300px] p-3 flex flex-col gap-2
                [&::-webkit-scrollbar]:w-1.5
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-border-color/30
                [&::-webkit-scrollbar-thumb]:rounded-full">
                {coupleEvents.length === 0 && (
                  <div className="text-center text-text-secondary text-sm py-6">Chưa ghi nhận hoạt động nào trong ngày 🥺</div>
                )}
                {coupleEvents.map((item) => (
                  <div key={item.id} className="bg-bg-primary border-[1.5px] border-border-color/50 rounded-xl p-3.5 flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-[14px]">{item.title}</span>
                        {item.eventTime && (
                          <span className="bg-border-color/10 text-text-primary text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap">
                            🕒 {item.eventTime.slice(0, 5)}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-secondary mt-1 flex items-center gap-1">
                        <Calendar size={12} /> {formatDateString(item.eventDate)}
                        {item.location && (
                          <>
                            <span className="text-border-color/40">•</span>
                            <MapPin size={12} className="text-primary-coral" />
                            <span className="truncate max-w-[150px] font-bold text-text-primary">{item.location}</span>
                          </>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-[12px] text-text-secondary mt-2 bg-bg-card border border-border-color/10 p-2 rounded-lg italic">
                          "{item.description}"
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteCoupleEvent(item.id!)}
                      className="text-text-secondary hover:text-warning-coral transition-colors p-1 self-start shrink-0 cursor-pointer bg-transparent border-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
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

      {/* Add Custom Event Modal */}
      {isOpenAddEventModal && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-5">
          <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-6 mb-4 shadow-neo w-full max-w-[380px]">
            <h3 className="text-lg font-extrabold mb-5">Thêm hoạt động mới</h3>

            <div className="mb-3">
              <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Tiêu đề hoạt động</label>
              <input
                type="text"
                placeholder="Ví dụ: Đi ăn tối, Đi xem phim..."
                value={eventTitle}
                onChange={e => setEventTitle(e.target.value)}
                className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Ngày</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-3 py-3 text-text-primary font-bold text-[14px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral"
                  required
                />
              </div>
              <div>
                <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Giờ</label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={e => setEventTime(e.target.value)}
                  className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-3 py-3 text-text-primary font-bold text-[14px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Địa điểm / Vị trí</label>
              <input
                type="text"
                placeholder="Ví dụ: Lotte Cinema..."
                value={eventLocation}
                onChange={e => setEventLocation(e.target.value)}
                className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral"
              />
            </div>

            <div className="mb-5">
              <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Mô tả chi tiết</label>
              <textarea
                placeholder="Chúng ta đã đi cùng nhau rất vui..."
                value={eventDescription}
                onChange={e => setEventDescription(e.target.value)}
                className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral h-[70px] resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsOpenAddEventModal(false)}
                className="bg-text-primary text-bg-card font-extrabold text-[13px] border-[2.2px] border-border-color rounded-xl px-4 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
              >
                Hủy
              </button>
              <button
                onClick={handleAddCoupleEvent}
                disabled={isAddingEvent}
                className="bg-primary-coral text-border-color font-extrabold text-[13px] border-[2.2px] border-border-color rounded-xl px-4 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
              >
                {isAddingEvent ? 'Đang thêm...' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MilestonesScreen;
