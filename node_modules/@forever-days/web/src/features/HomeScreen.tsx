import React, { useState, useEffect, useMemo } from 'react';
import { useRelationship } from '../core/RelationshipContext';
import { HeartbeatConnector } from '../components/HeartbeatConnector';
import { LogOut, Edit3, Calendar, Copy, Check, Smile, RotateCw, Heart, Clock, Cake } from 'lucide-react';
import { UserStatusService, MilestoneService, supabase } from '@forever-days/core';
import confetti from 'canvas-confetti';

export const HomeScreen: React.FC = () => {
  const {
    user, partner, anniversaryDate, isPaired, isDemoMode,
    pairingCode, updateAnniversary, generatePairCode, connectWithCode,
    signOut, error, clearError, coupleId
  } = useRelationship();

  const [isGenerating, setIsGenerating] = useState(false);
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customMilestones, setCustomMilestones] = useState<any[]>([]);

  // Status State
  const [userEmoji, setUserEmoji] = useState('😊');
  const [userStatusText, setUserStatusText] = useState('Đang rất nhớ đối phương');
  const [partnerEmoji, setPartnerEmoji] = useState('🥰');
  const [partnerStatusText, setPartnerStatusText] = useState('Cảm thấy hạnh phúc');
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);

  // Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [modalEmoji, setModalEmoji] = useState('😊');
  const [modalText, setModalText] = useState('');
  const [isAnniversaryModalOpen, setIsAnniversaryModalOpen] = useState(false);
  const [anniversaryInput, setAnniversaryInput] = useState('');

  const statusService = new UserStatusService();

  const moodEmojis = [
    '😊', '🥰', '😍', '😘', '🥳', '😎', '😜', '😇',
    '🥺', '😢', '😭', '😡', '🤬', '😱', '😴', '🥱',
    '😷', '🤔', '🙄', '💖', '🍿', '🎮', '☕', '🥤'
  ];

  const loadStatuses = async () => {
    if (isDemoMode) {
      setUserEmoji(localStorage.getItem('demo_user_emoji') || '😊');
      setUserStatusText(localStorage.getItem('demo_user_status') || 'Đang rất nhớ đối phương');
      setPartnerEmoji(localStorage.getItem('demo_partner_emoji') || '🥰');
      setPartnerStatusText(localStorage.getItem('demo_partner_status') || 'Cảm thấy hạnh phúc');
      return;
    }
    if (!user) return;

    setIsLoadingStatuses(true);
    try {
      const uStat = await statusService.fetchStatus(user.id);
      if (uStat) {
        setUserEmoji(uStat.emoji);
        setUserStatusText(uStat.statusText);
      }
      if (partner) {
        const pStat = await statusService.fetchStatus(partner.id);
        if (pStat) {
          setPartnerEmoji(pStat.emoji);
          setPartnerStatusText(pStat.statusText);
        }
      }
    } catch {}
    setIsLoadingStatuses(false);
  };

  useEffect(() => {
    loadStatuses();
  }, [user, partner, isDemoMode]);

  useEffect(() => {
    const fetchCustom = async () => {
      if (isDemoMode) {
        const saved = localStorage.getItem('custom_milestones');
        if (saved) {
          try {
            setCustomMilestones(JSON.parse(saved));
          } catch {}
        }
        return;
      }
      if (!user || !coupleId) return;
      const milestoneService = new MilestoneService();
      try {
        const list = await milestoneService.fetchMilestones(coupleId);
        setCustomMilestones(list);
      } catch {}
    };
    fetchCustom();
  }, [user, coupleId, isDemoMode]);

  useEffect(() => {
    if (isDemoMode || !user) return;

    const channel = supabase
      .channel('web_user_statuses_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_statuses' },
        (payload) => {
          const newStatus = payload.new as any;
          if (newStatus) {
            if (newStatus.user_id === user.id) {
              setUserEmoji(newStatus.emoji || '😊');
              setUserStatusText(newStatus.status_text || 'Đang ổn định');
            } else if (partner && newStatus.user_id === partner.id) {
              setPartnerEmoji(newStatus.emoji || '😊');
              setPartnerStatusText(newStatus.status_text || 'Đang ổn định');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, partner, isDemoMode]);

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    await generatePairCode();
    setIsGenerating(false);
  };

  const handleConnect = async () => {
    if (!partnerCodeInput.trim()) return;
    setIsConnecting(true);
    clearError();
    await connectWithCode(partnerCodeInput.trim().toUpperCase());
    setIsConnecting(false);
  };

  const copyCode = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenStatusModal = () => {
    setModalEmoji(userEmoji);
    setModalText(userStatusText);
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    const finalEmoji = modalEmoji || '😊';
    const finalText = modalText.trim() || 'Đang ổn định';

    if (isDemoMode) {
      localStorage.setItem('demo_user_emoji', finalEmoji);
      localStorage.setItem('demo_user_status', finalText);
    } else if (user) {
      await statusService.updateStatus(user.id, finalEmoji, finalText);
    }

    setUserEmoji(finalEmoji);
    setUserStatusText(finalText);
    setIsStatusModalOpen(false);
  };

  const handleOpenAnniversaryModal = () => {
    setAnniversaryInput(anniversaryDate || new Date().toISOString().split('T')[0]);
    setIsAnniversaryModalOpen(true);
  };

  const handleSaveAnniversary = async () => {
    if (anniversaryInput) {
      await updateAnniversary(anniversaryInput);
      setIsAnniversaryModalOpen(false);
    }
  };

  // Calculate days since anniversary
  const calculateDays = () => {
    if (!anniversaryDate) return 0;
    const ann = new Date(anniversaryDate);
    ann.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - ann.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysCount = calculateDays();

  // Helper to format date
  const formatDateString = (dateStr: string | null) => {
    if (!dateStr) return 'Chưa chọn';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const nearestEvent = useMemo(() => {
    const list: { title: string; targetDate: string; daysRemaining: number; type: 'birthday' | 'milestone' | 'anniversary' | 'custom' }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toLocalYYYYMMDD = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const calculateDaysRemaining = (targetDateStr: string) => {
      const target = new Date(targetDateStr);
      target.setHours(0, 0, 0, 0);
      const diffTime = target.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    if (user?.dob) {
      const dob = new Date(user.dob);
      let nextBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      if (nextBday.getTime() < today.getTime()) {
        nextBday.setFullYear(today.getFullYear() + 1);
      }
      const dateStr = toLocalYYYYMMDD(nextBday);
      list.push({
        title: `Sinh nhật của bạn`,
        targetDate: dateStr,
        daysRemaining: calculateDaysRemaining(dateStr),
        type: 'birthday',
      });
    }

    if (partner?.dob) {
      const dob = new Date(partner.dob);
      let nextBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      if (nextBday.getTime() < today.getTime()) {
        nextBday.setFullYear(today.getFullYear() + 1);
      }
      const dateStr = toLocalYYYYMMDD(nextBday);
      list.push({
        title: `Sinh nhật ${partner.nickname}`,
        targetDate: dateStr,
        daysRemaining: calculateDaysRemaining(dateStr),
        type: 'birthday',
      });
    }

    if (anniversaryDate) {
      const anniversary = new Date(anniversaryDate);
      anniversary.setHours(0, 0, 0, 0);

      for (let d = 100; d <= 10000; d += 100) {
        const target = new Date(anniversary);
        target.setDate(anniversary.getDate() + d);
        if (target.getTime() >= today.getTime()) {
          const dateStr = toLocalYYYYMMDD(target);
          list.push({
            title: `${d} Ngày Yêu Nhau`,
            targetDate: dateStr,
            daysRemaining: calculateDaysRemaining(dateStr),
            type: 'milestone',
          });
          break;
        }
      }

      for (let y = 1; y <= 30; y++) {
        const target = new Date(anniversary);
        target.setFullYear(anniversary.getFullYear() + y);
        if (target.getTime() >= today.getTime()) {
          const dateStr = toLocalYYYYMMDD(target);
          list.push({
            title: `Kỷ Niệm ${y} Năm Yêu Nhau`,
            targetDate: dateStr,
            daysRemaining: calculateDaysRemaining(dateStr),
            type: 'anniversary',
          });
          break;
        }
      }

      let valentineYear = today.getFullYear();
      let valentine = new Date(valentineYear, 1, 14);
      if (valentine.getTime() < today.getTime()) {
        valentine.setFullYear(valentineYear + 1);
      }
      const valDateStr = toLocalYYYYMMDD(valentine);
      list.push({
        title: 'Ngày Lễ Tình Nhân 💝',
        targetDate: valDateStr,
        daysRemaining: calculateDaysRemaining(valDateStr),
        type: 'anniversary',
      });
    }

    customMilestones.forEach(m => {
      const target = new Date(m.targetDate);
      target.setHours(0, 0, 0, 0);
      if (target.getTime() >= today.getTime()) {
        list.push({
          title: m.title,
          targetDate: m.targetDate,
          daysRemaining: calculateDaysRemaining(m.targetDate),
          type: 'custom',
        });
      }
    });

    const upcoming = list
      .filter(item => item.daysRemaining >= 0)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    return upcoming.length > 0 ? upcoming[0] : null;
  }, [user, partner, anniversaryDate, customMilestones]);

  useEffect(() => {
    if (nearestEvent && nearestEvent.daysRemaining === 0) {
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ff8a9f', '#ff6584', '#d83a5c']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ff8a9f', '#ff6584', '#d83a5c']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [nearestEvent]);

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-coral/15 to-secondary-mint/5 p-6 border-b-[2.2px] border-border-color text-center flex justify-between items-center">
        <div className="text-left">
          <span className="text-xs font-bold text-text-secondary">Hôm nay yêu</span>
          <h2 className="text-xl font-black text-text-primary -mt-0.5">
            Bên nhau trọn đời
          </h2>
        </div>
        <button
          onClick={signOut}
          className="bg-text-primary text-bg-card font-extrabold text-xs border-[2.2px] border-border-color rounded-full px-3 py-2 cursor-pointer transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] select-none inline-flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
        </button>
      </div>

      <div className="p-5 pb-[92px] w-full flex flex-col flex-1">
        {/* Pairing Dashboard if Unpaired */}
        {!isPaired && !isDemoMode && (
          <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 mb-4 shadow-neo transition-all duration-200">
            <div className="flex items-center mb-4 gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-coral/15 flex items-center justify-center text-primary-coral">
                <Smile className="m-auto" />
              </div>
              <div>
                <h4 className="font-extrabold text-[15px]">Chưa kết nối với ai cả!</h4>
                <p className="text-[11px] text-text-secondary">Hãy ghép đôi với nửa kia để bắt đầu!</p>
              </div>
            </div>

            <div className="my-4">
              <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Mã ghép đôi của bạn</label>
              <div className="flex gap-2">
                <div
                  className={`bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 font-black text-[18px] w-full outline-none flex items-center justify-center tracking-[3px] font-mono ${
                    pairingCode ? 'text-primary-coral' : 'text-text-secondary'
                  }`}
                >
                  {pairingCode || 'CHƯA TẠO MÃ'}
                </div>

                {!pairingCode ? (
                  <button
                    onClick={handleGenerateCode}
                    disabled={isGenerating}
                    className="bg-primary-coral text-border-color font-extrabold text-[15px] border-[2.2px] border-border-color rounded-full px-5 py-2.5 cursor-pointer shadow-neo whitespace-nowrap inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
                  >
                    {isGenerating ? 'Đang tạo...' : 'Tạo mã'}
                  </button>
                ) : (
                  <button
                    onClick={copyCode}
                    className="bg-text-primary text-bg-card font-extrabold text-[15px] border-[2.2px] border-border-color rounded-full px-3.5 py-2.5 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
                  >
                    {copied ? <Check size={18} color="green" /> : <Copy size={18} />}
                  </button>
                )}
              </div>
            </div>

            <div className="my-5 border-t-2 border-dashed border-border-color" />

            <div>
              <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Nhập mã của nửa kia</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ví dụ: LOVE99"
                  value={partnerCodeInput}
                  onChange={e => setPartnerCodeInput(e.target.value)}
                  className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral uppercase tracking-[2px]"
                />
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="bg-primary-coral text-border-color font-extrabold text-[15px] border-[2.2px] border-border-color rounded-full px-5 py-2.5 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
                >
                  {isConnecting ? 'Kết nối...' : 'Kết nối'}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-warning-coral text-xs font-bold mt-3.5 text-center">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Home Screen Widgets */}
        {(isPaired || isDemoMode) && (
          <>
            {/* Heartbeat Connector */}
            <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl mb-6 shadow-neo overflow-hidden p-0">
              <HeartbeatConnector
                days={daysCount}
                user1Avatar={user?.avatarUrl || ''}
                user2Avatar={partner?.avatarUrl || ''}
                user1Name={user?.nickname || 'Bạn'}
                user2Name={partner?.nickname || 'Nửa kia'}
                user1Dob={user?.dob || ''}
                user2Dob={partner?.dob || ''}
                isCelebrationDay={nearestEvent?.daysRemaining === 0}
              />
            </div>

            {/* Upcoming Event Card */}
            {nearestEvent && (() => {
              const getDayOfWeekName = (date: Date) => {
                const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
                return days[date.getDay()];
              };

              const formatDateWithDayOfWeek = (dateStr: string) => {
                const date = new Date(dateStr);
                const dayName = getDayOfWeekName(date);
                const dateFormatted = date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
                return `${dayName}, ${dateFormatted}`;
              };

              const EventIcon = nearestEvent.type === 'birthday' ? Cake : Clock;

              return (
                <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 mb-6 shadow-neo flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary-coral/5 to-transparent">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-coral/15 flex items-center justify-center text-primary-coral shrink-0 border-[1.8px] border-border-color">
                      <EventIcon size={22} />
                    </div>
                    <div>
                      <span className="block font-extrabold text-[11px] text-text-secondary uppercase tracking-wider">Sự kiện sắp tới gần nhất</span>
                      <h4 className="text-[16px] font-black text-text-primary mt-0.5">{nearestEvent.title}</h4>
                      <p className="text-[12px] text-text-secondary mt-0.5">{formatDateWithDayOfWeek(nearestEvent.targetDate)}</p>
                    </div>
                  </div>
                  <div className="bg-primary-coral/15 border-[1.8px] border-border-color px-4 py-2 rounded-xl text-center shadow-sm shrink-0">
                    <span className="block text-[10px] font-extrabold text-text-secondary uppercase">Còn lại</span>
                    <span className="text-[16px] font-black text-primary-coral">{nearestEvent.daysRemaining} ngày</span>
                  </div>
                </div>
              );
            })()}

            {/* Responsive grid for widgets on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Anniversary Setting Widget */}
              <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 shadow-neo flex justify-between items-center h-full min-h-[160px]">
                <div>
                  <span className="block font-extrabold text-[11px] text-text-secondary mb-1.5 uppercase tracking-wider">Ngày bắt đầu yêu</span>
                  <div className="font-extrabold text-[17px] flex items-center gap-1.5 mt-0.5">
                    <Calendar size={18} className="text-primary-coral" />
                    {formatDateString(anniversaryDate)}
                  </div>
                </div>
                <button
                  onClick={handleOpenAnniversaryModal}
                  className="bg-text-primary text-bg-card font-extrabold text-[13px] border-[2.2px] border-border-color rounded-full px-3.5 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
                >
                  <Edit3 size={14} /> Thay đổi
                </button>
              </div>

              {/* Daily Mood Status Card */}
              <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 shadow-neo h-full min-h-[160px]">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[15px] font-extrabold flex items-center gap-1.5">
                    Tâm trạng hôm nay <Heart size={16} className="text-primary-coral" fill="currentColor" />
                  </h4>
                  <button
                    onClick={loadStatuses}
                    disabled={isLoadingStatuses}
                    className={`text-text-secondary hover:text-primary-coral transition-colors p-1 rounded-full hover:bg-bg-primary ${
                      isLoadingStatuses ? 'animate-spin' : ''
                    }`}
                    title="Cập nhật trạng thái"
                  >
                    <RotateCw size={15} />
                  </button>
                </div>
                {isLoadingStatuses ? (
                  <div className="text-center py-5">Đang tải trạng thái...</div>
                ) : (
                  <div className="flex gap-3">
                    {/* My Status */}
                    <div
                      onClick={handleOpenStatusModal}
                      className="flex-1 p-4 bg-bg-primary border-[2.2px] border-border-color rounded-[20px] text-center cursor-pointer shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)]"
                    >
                      <span className="text-[11px] text-text-secondary font-extrabold flex items-center justify-center gap-1">
                        Của bạn <Edit3 size={10} className="text-primary-coral" />
                      </span>
                      <div className="text-[32px] my-2">{userEmoji}</div>
                      <div className="text-[11px] font-bold text-text-primary line-clamp-1">{userStatusText}</div>
                    </div>

                    {/* Partner Status */}
                    <div className="flex-1 p-4 bg-bg-primary border-[2.2px] border-border-color rounded-[20px] text-center">
                      <span className="text-[11px] text-text-secondary font-extrabold">
                        {partner?.nickname || 'Nửa kia'}
                      </span>
                      <div className="text-[32px] my-2">{partnerEmoji}</div>
                      <div className="text-[11px] font-bold text-text-primary line-clamp-1">{partnerStatusText}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mood Edit Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-5">
          <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-6 mb-4 shadow-neo w-full max-w-[380px]">
            <h3 className="text-lg font-extrabold mb-5 text-text-primary">Cập nhật tâm trạng</h3>

            <div className="flex flex-col items-center mb-5">
              <div className="w-20 h-20 rounded-full border-[2.2px] border-border-color bg-bg-primary flex items-center justify-center text-[42px] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)]">
                {modalEmoji}
              </div>
            </div>

            <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Chọn một biểu tượng:</label>
            <div className="grid grid-cols-6 gap-2 max-h-[120px] overflow-y-auto p-1.5 border-[2.2px] border-border-color rounded-xl bg-bg-primary mb-4">
              {moodEmojis.map(emoji => (
                <div
                  key={emoji}
                  onClick={() => setModalEmoji(emoji)}
                  className={`text-[22px] text-center cursor-pointer rounded-lg py-1 border transition-all ${
                    modalEmoji === emoji ? 'border-primary-coral bg-primary-coral/15' : 'border-transparent'
                  }`}
                >
                  {emoji}
                </div>
              ))}
            </div>

            <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Trạng thái ngắn</label>
            <input
              type="text"
              maxLength={50}
              placeholder="Hôm nay bạn thế nào..."
              value={modalText}
              onChange={e => setModalText(e.target.value)}
              className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral mb-6"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="bg-text-primary text-bg-card font-extrabold text-[13px] border-[2.2px] border-border-color rounded-xl px-4 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateStatus}
                className="bg-primary-coral text-border-color font-extrabold text-[13px] border-[2.2px] border-border-color rounded-xl px-4 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Anniversary Edit Modal */}
      {isAnniversaryModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-5">
          <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-6 mb-4 shadow-neo w-full max-w-[380px]">
            <h3 className="text-lg font-extrabold mb-5 text-text-primary">Chọn ngày kỷ niệm</h3>

            <div className="mb-5">
              <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Ngày bắt đầu yêu nhau</label>
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={anniversaryInput}
                onChange={e => setAnniversaryInput(e.target.value)}
                className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAnniversaryModalOpen(false)}
                className="bg-text-primary text-bg-card font-extrabold text-[13px] border-[2.2px] border-border-color rounded-xl px-4 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveAnniversary}
                className="bg-primary-coral text-border-color font-extrabold text-[13px] border-[2.2px] border-border-color rounded-xl px-4 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
              >
                Lưu ngày
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default HomeScreen;
