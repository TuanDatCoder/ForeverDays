import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRelationship } from '../core/RelationshipContext';
import { HeartbeatConnector } from '../components/HeartbeatConnector';
import { LogOut, Edit3, Calendar, Copy, Check, Smile, RotateCw, Heart, Clock, Cake, Trash2 } from 'lucide-react';
import { UserStatusService, MilestoneService, UserMoodLogService, CoupleCountdownCustomizationService, UserPushTokenService, MilestonePlanService, DailyWishService, MOCK_DAILY_WISHES, supabase } from '@forever-days/core';
import type { UserMoodLog, CoupleCountdownCustomization, MilestonePlan, DailyWish } from '@forever-days/core';
import confetti from 'canvas-confetti';
import { useSEO } from '../hooks/useSEO';

export const HomeScreen: React.FC = () => {
  useSEO({
    title: 'Trang Chủ | ForeverDays',
    description: 'Trang chủ ForeverDays - Ứng dụng đếm ngày yêu và lưu giữ kỷ niệm đặc biệt cho các cặp đôi.',
    keywords: 'trang chủ foreverdays, đếm ngày yêu, kỷ niệm tình yêu'
  });

  const {
    user, partner, anniversaryDate, isPaired, isDemoMode,
    pairingCode, updateAnniversary, generatePairCode, connectWithCode,
    signOut, error, clearError, coupleId
  } = useRelationship();

  const [isGenerating, setIsGenerating] = useState(false);
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSendingTestNotification, setIsSendingTestNotification] = useState(false);
  const [customMilestones, setCustomMilestones] = useState<any[]>([]);
  const [plans, setPlans] = useState<MilestonePlan[]>([]);
  const [wishes, setWishes] = useState<DailyWish[]>([]);

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

  // Mood Log State
  const [moodLogs, setMoodLogs] = useState<UserMoodLog[]>([]);
  const [isOpenAddMoodModal, setIsOpenAddMoodModal] = useState(false);
  const [selectedMoodType, setSelectedMoodType] = useState('😊 Vui vẻ');
  const [moodNote, setMoodNote] = useState('');
  const [moodIsShared, setMoodIsShared] = useState(false);
  const [isAddingMood, setIsAddingMood] = useState(false);

  // Countdown Customization State
  const [themeCustomization, setThemeCustomization] = useState<CoupleCountdownCustomization | null>(null);
  const [isOpenThemeModal, setIsOpenThemeModal] = useState(false);
  const [themeAvatar1, setThemeAvatar1] = useState('');
  const [themeAvatar2, setThemeAvatar2] = useState('');
  const [themeBackground, setThemeBackground] = useState('');
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  const statusService = new UserStatusService();
  const moodLogService = new UserMoodLogService();
  const customizationService = new CoupleCountdownCustomizationService();

  const signalChannelRef = useRef<any>(null);

  const moodEmojis = [
    '😊', '🥰', '😍', '😘', '🥳', '😎', '😜', '😇',
    '🥺', '😢', '😭', '😡', '🤬', '😱', '😴', '🥱',
    '😷', '🤔', '🙄', '💖', '🍿', '🎮', '☕', '🥤'
  ];

  const triggerInstantNotification = (title: string, body: string) => {
    const showFallback = () => {
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
      toast.style.flexDirection = 'col-reverse';
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

    if (!('Notification' in window)) {
      showFallback();
      return;
    }

    const tryShowNotification = () => {
      try {
        new Notification(title, { body, icon: '/favicon.png' });
      } catch (e) {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(title, { body, icon: '/favicon.png' }).catch(() => {
              showFallback();
            });
          }).catch(() => {
            showFallback();
          });
        } else {
          showFallback();
        }
      }
    };

    try {
      showFallback();

      if (Notification.permission === 'granted') {
        tryShowNotification();
      } else if (Notification.permission !== 'denied') {
        const handlePermission = (permission: NotificationPermission) => {
          if (permission === 'granted') {
            tryShowNotification();
          }
        };

        const result = Notification.requestPermission(handlePermission);
        if (result && typeof result.then === 'function') {
          result.then(handlePermission).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Lỗi khi kích hoạt thông báo:', err);
    }
  };

  const sendPushNotification = async (expoPushToken: string, title: string, body: string) => {
    if (expoPushToken.startsWith('mock-')) {
      console.log('Gửi thông báo giả lập (Expo Go) thành công:', { title, body });
      return;
    }
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: title,
      body: body,
      data: { screen: 'Home' },
    };

    try {
      await fetch('https://corsproxy.io/?url=' + encodeURIComponent('https://exp.host/--/api/v2/push/send'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error('Lỗi gửi thông báo:', error);
    }
  };

  // Setup Realtime Broadcast channel for sending only
  useEffect(() => {
    if (isDemoMode || !coupleId || !user?.id) return;

    const channel = supabase.channel(`couple_signals_${coupleId}`);
    channel.subscribe();

    signalChannelRef.current = channel;

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      signalChannelRef.current = null;
    };
  }, [coupleId, user?.id, isDemoMode]);

  const handleSendLoveOrPoke = async (type: 'love' | 'poke') => {
    if (isDemoMode) {
      triggerInstantNotification('Thông báo', 'Ứng dụng đang ở chế độ Demo! Tính năng thông báo đẩy chỉ hoạt động ở chế độ kết nối cơ sở dữ liệu thật.');
      return;
    }
    if (!partner?.id) {
      triggerInstantNotification('Thông báo', 'Bạn chưa kết nối với nửa kia! Hãy ghép đôi để sử dụng tính năng này.');
      return;
    }
    setIsSendingTestNotification(true);
    try {
      // 1. Broadcast real-time signal via Supabase (cho giao diện Web/App đang mở)
      if (signalChannelRef.current) {
        await signalChannelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: { senderId: user?.id, type }
        });
      } else if (coupleId) {
        const channel = supabase.channel(`couple_signals_${coupleId}`);
        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: { senderId: user?.id, type }
            });
            supabase.removeChannel(channel);
          }
        });
      }

      // 2. Gửi Push Notification (cho điện thoại khi tắt app)
      const tokenService = new UserPushTokenService();
      const partnerToken = await tokenService.fetchPushToken(partner.id);
      
      const title = type === 'love' ? 'Tín hiệu yêu thương! 💕' : 'Ai đó đang chọc bạn! 🤪';
      const body = type === 'love' 
        ? `${user?.nickname || 'Nửa kia'} đang nhớ bạn rất nhiều! 🥰` 
        : `${user?.nickname || 'Nửa kia'} vừa chọc ghẹo bạn một cái! 🤪`;

      if (partnerToken) {
        await sendPushNotification(partnerToken, title, body);
        if (partnerToken.startsWith('mock-')) {
          triggerInstantNotification(
            'Tín hiệu gửi đi',
            'Do đối phương đang dùng Expo Go giả lập nên sự kiện đã được ghi nhận trên hệ thống nhưng không rung chuông vật lý.'
          );
        } else {
          triggerInstantNotification('Thành công', type === 'love' ? 'Đã gửi yêu thương thành công đến đối phương! 💕' : 'Đã chọc ghẹo đối phương thành công! 🤪');
        }
      } else {
        triggerInstantNotification('Thành công', type === 'love' ? 'Đã gửi yêu thương thành công đến đối phương! 💕' : 'Đã chọc ghẹo đối phương thành công! 🤪');
      }
    } catch (err: any) {
      console.error('Lỗi khi gửi tín hiệu:', err);
      triggerInstantNotification('Thất bại', 'Đã xảy ra lỗi khi gửi: ' + (err?.message || err));
    } finally {
      setIsSendingTestNotification(false);
    }
  };

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

  const loadThemeAndMoodLogs = async () => {
    if (isDemoMode) {
      // Mood logs from local storage
      const savedMoods = localStorage.getItem('demo_mood_logs');
      if (savedMoods) {
        try {
          setMoodLogs(JSON.parse(savedMoods));
        } catch {}
      } else {
        const defaultMoods: UserMoodLog[] = [
          {
            id: 'm-1',
            userId: 'user-1',
            coupleId: 'demo-couple-id',
            moodType: '😊 Vui vẻ',
            note: 'Hôm nay hai đứa đi uống trà sữa ngon lắm!',
            isShared: true,
            createdAt: new Date().toISOString()
          }
        ];
        setMoodLogs(defaultMoods);
        localStorage.setItem('demo_mood_logs', JSON.stringify(defaultMoods));
      }

      // Custom theme
      const savedTheme = localStorage.getItem('demo_custom_theme');
      if (savedTheme) {
        try {
          const parsed = JSON.parse(savedTheme);
          setThemeCustomization(parsed);
          setThemeAvatar1(parsed.customAvatar1Url || '');
          setThemeAvatar2(parsed.customAvatar2Url || '');
          setThemeBackground(parsed.backgroundUrl || '');
        } catch {}
      }
      return;
    }

    if (!user) return;
    try {
      // 1. Fetch Mood logs
      const myLogs = await moodLogService.fetchMyMoodLogs(user.id);
      let combined = [...myLogs];

      if (partner) {
        const partnerLogs = await moodLogService.fetchPartnerMoodLogs(partner.id);
        combined = [...combined, ...partnerLogs];
      }

      // Sort by created_at descending
      combined.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      setMoodLogs(combined);

      // 2. Fetch Theme customization
      if (coupleId) {
        const theme = await customizationService.fetchCustomization(coupleId);
        if (theme) {
          setThemeCustomization(theme);
          setThemeAvatar1(theme.customAvatar1Url || '');
          setThemeAvatar2(theme.customAvatar2Url || '');
          setThemeBackground(theme.backgroundUrl || '');
        } else {
          setThemeCustomization(null);
          setThemeAvatar1('');
          setThemeAvatar2('');
          setThemeBackground('');
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadStatuses();
    loadThemeAndMoodLogs();
  }, [user, partner, coupleId, isDemoMode]);

  useEffect(() => {
    const fetchCustomAndPlansAndWishes = async () => {
      if (isDemoMode) {
        const saved = localStorage.getItem('custom_milestones');
        if (saved) {
          try {
            setCustomMilestones(JSON.parse(saved));
          } catch {}
        }
        const savedPlans = localStorage.getItem('demo_milestone_plans');
        if (savedPlans) {
          try {
            setPlans(JSON.parse(savedPlans));
          } catch {}
        }
        setWishes(MOCK_DAILY_WISHES);
        return;
      }
      if (!user || !coupleId) return;
      const milestoneService = new MilestoneService();
      const planService = new MilestonePlanService();
      const wishService = new DailyWishService();
      try {
        const list = await milestoneService.fetchMilestones(coupleId);
        setCustomMilestones(list);
        const planList = await planService.fetchPlans(coupleId);
        setPlans(planList);
        const wishList = await wishService.fetchAllWishes();
        setWishes(wishList);
      } catch {}
    };
    fetchCustomAndPlansAndWishes();
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

      // Trigger push notification to partner
      if (partner?.id) {
        try {
          const tokenService = new UserPushTokenService();
          const partnerToken = await tokenService.fetchPushToken(partner.id);
          if (partnerToken) {
            await sendPushNotification(
              partnerToken,
              'Cập nhật trạng thái! 💕',
              `${user?.nickname || 'Người ấy'} đổi trạng thái: ${finalEmoji} ${finalText}`
            );
          }
        } catch (err) {
          console.log('Lỗi gửi push notification:', err);
        }
      }
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

  // Mood Log Actions
  const handleAddMoodLog = async () => {
    if (!moodNote.trim()) return;

    setIsAddingMood(true);
    const newLog: Omit<UserMoodLog, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: user?.id || 'user-1',
      coupleId: coupleId || 'demo-couple-id',
      moodType: selectedMoodType,
      note: moodNote.trim(),
      isShared: moodIsShared,
    };

    try {
      if (isDemoMode) {
        const id = `m-${Date.now()}`;
        const updated = [{ id, createdAt: new Date().toISOString(), ...newLog } as UserMoodLog, ...moodLogs];
        setMoodLogs(updated);
        localStorage.setItem('demo_mood_logs', JSON.stringify(updated));
      } else {
        await moodLogService.createMoodLog(newLog);
        await loadThemeAndMoodLogs();

        // Trigger push notification to partner
        if (partner?.id && moodIsShared) {
          try {
            const tokenService = new UserPushTokenService();
            const partnerToken = await tokenService.fetchPushToken(partner.id);
            if (partnerToken) {
              await sendPushNotification(
                partnerToken,
                'Tâm trạng mới từ nửa kia! ❤️',
                `${user?.nickname || 'Người ấy'} vừa ghi nhận cảm xúc: ${selectedMoodType}`
              );
            }
          } catch (err) {
            console.log('Lỗi gửi push notification:', err);
          }
        }
      }
      setMoodNote('');
      setIsOpenAddMoodModal(false);
    } catch {}
    setIsAddingMood(false);
  };

  const handleDeleteMoodLog = async (id: string) => {
    try {
      if (isDemoMode) {
        const updated = moodLogs.filter(m => m.id !== id);
        setMoodLogs(updated);
        localStorage.setItem('demo_mood_logs', JSON.stringify(updated));
      } else {
        await moodLogService.deleteMoodLog(id);
        await loadThemeAndMoodLogs();
      }
    } catch {}
  };

  const compressImage = (base64Str: string, maxWidth = 180, maxHeight = 180): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
    });
  };

  const handleCustomFileChange = (field: 'avatar1' | 'avatar2' | 'background', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawBase64 = event.target?.result as string;
      const maxWidth = field === 'background' ? 800 : 180;
      const maxHeight = field === 'background' ? 600 : 180;
      const compressedBase64 = await compressImage(rawBase64, maxWidth, maxHeight);
      
      if (field === 'avatar1') {
        setThemeAvatar1(compressedBase64);
      } else if (field === 'avatar2') {
        setThemeAvatar2(compressedBase64);
      } else {
        setThemeBackground(compressedBase64);
      }
    };
    reader.readAsDataURL(file);
  };

  // Custom Theme Actions
  const handleSaveTheme = async () => {
    if (!coupleId && !isDemoMode) return;

    setIsSavingTheme(true);
    const customizationData = {
      coupleId: coupleId || 'demo-couple-id',
      customAvatar1Url: themeAvatar1.trim() || undefined,
      customAvatar2Url: themeAvatar2.trim() || undefined,
      backgroundUrl: themeBackground.trim() || undefined,
    };

    try {
      if (isDemoMode) {
        setThemeCustomization(customizationData as any);
        localStorage.setItem('demo_custom_theme', JSON.stringify(customizationData));
      } else {
        await customizationService.upsertCustomization(customizationData);
        await loadThemeAndMoodLogs();
      }
      setIsOpenThemeModal(false);
    } catch {}
    setIsSavingTheme(false);
  };

  const handleResetTheme = async () => {
    setIsSavingTheme(true);
    try {
      if (isDemoMode) {
        setThemeCustomization(null);
        setThemeAvatar1('');
        setThemeAvatar2('');
        setThemeBackground('');
        localStorage.removeItem('demo_custom_theme');
      } else if (coupleId) {
        await customizationService.upsertCustomization({
          coupleId,
          customAvatar1Url: undefined,
          customAvatar2Url: undefined,
          backgroundUrl: undefined,
        });
        await loadThemeAndMoodLogs();
      }
      setIsOpenThemeModal(false);
    } catch {}
    setIsSavingTheme(false);
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

  const currentWish = useMemo(() => {
    if (wishes.length === 0) return null;

    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-indexed
    const currentDate = today.getDate(); // 1-31

    // 1. Check for special date-matching wishes
    const specialWish = wishes.find(
      w => w.type === 'special' && w.specialMonth === currentMonth && w.specialDay === currentDate
    );
    if (specialWish) return specialWish;

    // 2. Check for birthday wishes
    if (partner?.dob) {
      const partnerDob = new Date(partner.dob);
      if (partnerDob.getMonth() + 1 === currentMonth && partnerDob.getDate() === currentDate) {
        return {
          content: `Chúc mừng sinh nhật ${partner.nickname || 'nửa kia'} ngọt ngào của anh! Mong mọi điều tốt lành nhất sẽ đến với em hôm nay! 🎉🎂❤️`,
          type: 'special'
        } as DailyWish;
      }
    }
    if (user?.dob) {
      const userDob = new Date(user.dob);
      if (userDob.getMonth() + 1 === currentMonth && userDob.getDate() === currentDate) {
        return {
          content: `Hôm nay là sinh nhật của bạn! Chúc bạn tuổi mới ngập tràn niềm vui, tiếng cười và tình yêu bên người ấy! 🎉🎂❤️`,
          type: 'special'
        } as DailyWish;
      }
    }

    // 3. Fallback to daily wishes based on day of year
    const dailyWishes = wishes.filter(w => w.type === 'daily');
    if (dailyWishes.length === 0) return null;

    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    const index = dayOfYear % dailyWishes.length;
    return dailyWishes[index];
  }, [wishes, partner, user]);

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
            <div
              className="bg-bg-card border-[2.2px] border-border-color rounded-2xl mb-6 shadow-neo overflow-hidden p-0 relative"
              style={themeCustomization?.backgroundUrl ? { backgroundImage: `url(${themeCustomization.backgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
              <button
                onClick={() => setIsOpenThemeModal(true)}
                className="absolute top-3 right-3 z-10 bg-bg-card text-text-primary p-2 border-[2px] border-border-color rounded-full cursor-pointer hover:bg-bg-primary transition-all duration-100 active:translate-x-[1px] active:translate-y-[1px] shadow-sm group"
                title="Chỉnh sửa"
              >
                <Edit3 size={15} />
                <span className="absolute right-0 top-full mt-1.5 hidden group-hover:block bg-text-primary text-bg-card text-[10px] font-bold px-2 py-1 rounded border border-border-color shadow-md whitespace-nowrap z-20">
                  Chỉnh sửa
                </span>
              </button>
              <HeartbeatConnector
                days={daysCount}
                user1Avatar={themeCustomization?.customAvatar1Url || user?.avatarUrl || ''}
                user2Avatar={themeCustomization?.customAvatar2Url || partner?.avatarUrl || ''}
                user1Name={user?.nickname || 'Bạn'}
                user2Name={partner?.nickname || 'Nửa kia'}
                user1Dob={user?.dob || ''}
                user2Dob={partner?.dob || ''}
                isCelebrationDay={nearestEvent?.daysRemaining === 0}
              />
              <div className="flex justify-center gap-3 pb-5 -mt-3 relative z-10">
                <button
                  onClick={() => handleSendLoveOrPoke('love')}
                  disabled={isSendingTestNotification}
                  className="bg-bg-card text-text-primary font-black text-[12px] border-[2px] border-border-color rounded-full px-4 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-1.5 transition-all duration-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-neo-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none select-none whitespace-nowrap"
                >
                  ❤️ Nhớ nửa kia
                </button>
                <button
                  onClick={() => handleSendLoveOrPoke('poke')}
                  disabled={isSendingTestNotification}
                  className="bg-bg-card text-text-primary font-black text-[12px] border-[2px] border-border-color rounded-full px-4 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-1.5 transition-all duration-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-neo-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none select-none whitespace-nowrap"
                >
                  🤪 Chọc ghẹo
                </button>
              </div>
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
                <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 mb-6 shadow-neo flex flex-col justify-between items-stretch gap-4 bg-gradient-to-r from-primary-coral/5 to-transparent">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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

                  {/* Plan details list */}
                  {(() => {
                    const eventPlans = plans.filter(p => p.milestoneTitle === nearestEvent.title);
                    if (eventPlans.length > 0) {
                      return (
                        <div className="mt-2 pt-3 border-t border-dashed border-border-color/30">
                          <span className="block font-extrabold text-[10px] text-text-secondary uppercase tracking-wider mb-2">🚗 Kế hoạch cho ngày này:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {['go', 'eat', 'play'].map(cat => {
                              const catPlans = eventPlans.filter(p => p.category === cat);
                              const icon = cat === 'go' ? '🚗' : cat === 'eat' ? '🍔' : '🎮';
                              const label = cat === 'go' ? 'Đi đâu' : cat === 'eat' ? 'Ăn gì' : 'Chơi gì';
                              return (
                                <div key={cat} className="bg-bg-primary/50 border border-border-color/10 rounded-xl p-2.5">
                                  <span className="block text-[10px] font-extrabold text-text-secondary uppercase mb-1">{icon} {label}</span>
                                  <div className="flex flex-col gap-1 text-[11px] font-semibold text-text-primary">
                                    {catPlans.length === 0 ? (
                                      <span className="text-text-secondary/60 italic">Chưa lên kế hoạch</span>
                                    ) : (
                                      catPlans.map(p => <span key={p.id} className="truncate">• {p.content}</span>)
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              );
            })()}

            {/* Lời chúc ngọt ngào hôm nay */}
            {currentWish && (
              <div className={`bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 mb-6 shadow-neo flex flex-col justify-between items-stretch gap-3 relative overflow-hidden bg-gradient-to-r ${currentWish.type === 'special' ? 'from-warning-coral/10 via-primary-coral/5 to-transparent border-warning-coral' : 'from-secondary-mint/10 via-bg-primary/5 to-transparent'}`}>
                {currentWish.type === 'special' && (
                  <div className="absolute top-0 right-0 bg-warning-coral text-bg-card text-[9px] font-black uppercase px-2.5 py-1 rounded-bl-lg border-l-2 border-b-2 border-border-color">
                    Ngày Đặc Biệt ✨
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${currentWish.type === 'special' ? 'bg-warning-coral/20 text-warning-coral' : 'bg-primary-coral/20 text-primary-coral'} flex items-center justify-center shrink-0 border-[1.5px] border-border-color`}>
                    <Heart size={18} fill="currentColor" />
                  </div>
                  <div>
                    <span className="block font-extrabold text-[10px] text-text-secondary uppercase tracking-wider">Lời chúc ngọt ngào hôm nay</span>
                    <p className="text-[13px] font-bold text-text-primary mt-1 leading-relaxed italic">
                      "{currentWish.content}"
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                <div className="flex gap-2">
                  <button
                    onClick={handleOpenAnniversaryModal}
                    className="bg-text-primary text-bg-card font-extrabold text-[13px] border-[2.2px] border-border-color rounded-full px-3.5 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
                  >
                    <Edit3 size={14} /> Thay đổi
                  </button>
                </div>
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

            {/* Mood Log Section */}
            <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 mt-6 shadow-neo">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[15px] font-extrabold flex items-center gap-1.5">
                  Lịch sử cảm xúc <Heart size={16} className="text-primary-coral" fill="currentColor" />
                </h4>
                <button
                  onClick={() => setIsOpenAddMoodModal(true)}
                  className="bg-primary-coral text-border-color font-extrabold text-[13px] border-[2.2px] border-border-color rounded-full px-3.5 py-1.5 cursor-pointer shadow-neo inline-flex items-center justify-center gap-1.5 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
                >
                  <Smile size={14} /> Ghi nhận cảm xúc
                </button>
              </div>

              {moodLogs.length === 0 ? (
                <div className="text-center py-8 text-text-secondary text-xs font-bold border-2 border-dashed border-border-color rounded-xl bg-bg-primary">
                  Chưa có lịch sử cảm xúc nào được lưu.
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {moodLogs.map((log) => {
                    const isOwnLog = log.userId === user?.id || log.userId === 'user-1';
                    const creatorName = isOwnLog ? 'Bạn' : (partner?.nickname || 'Nửa kia');
                    const creatorAvatar = isOwnLog ? (user?.avatarUrl) : (partner?.avatarUrl);

                    return (
                      <div
                        key={log.id}
                        className="bg-bg-primary border-[2px] border-border-color rounded-xl p-3 flex justify-between items-start gap-3 hover:translate-x-[1px] transition-transform duration-100"
                      >
                        <div className="flex gap-2.5 items-start">
                          <div className="w-8 h-8 rounded-full border-[1.5px] border-border-color overflow-hidden shrink-0 bg-white">
                            {creatorAvatar ? (
                              <img src={creatorAvatar} alt={creatorName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary-coral/10 text-xs">
                                {isOwnLog ? '👦' : '👧'}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-xs text-text-primary">{creatorName}</span>
                              <span className="bg-bg-card border border-border-color px-1.5 py-0.5 rounded text-[10px] font-black text-text-secondary">
                                {log.moodType}
                              </span>
                              <span className="text-[9px] text-text-secondary">
                                {new Date(log.createdAt || '').toLocaleDateString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: 'numeric',
                                  month: 'numeric',
                                })}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-text-secondary mt-1">{log.note}</p>
                            {isOwnLog && (
                              <span className="inline-flex items-center gap-1 mt-1 text-[9px] text-text-secondary">
                                {log.isShared ? '🌍 Chia sẻ với đối phương' : '🔒 Chỉ mình bạn'}
                              </span>
                            )}
                          </div>
                        </div>

                        {isOwnLog && (
                          <button
                            onClick={() => handleDeleteMoodLog(log.id)}
                            className="text-text-secondary hover:text-warning-coral p-1 rounded transition-colors"
                            title="Xóa cảm xúc"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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

      {/* Add Mood Log Modal */}
      {isOpenAddMoodModal && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-5">
          <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-6 mb-4 shadow-neo w-full max-w-[420px]">
            <h3 className="text-lg font-extrabold mb-4 text-text-primary">Ghi nhận cảm xúc mới</h3>

            <div className="mb-4">
              <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Chọn tâm trạng:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  '😊 Vui vẻ', '🥰 Hạnh phúc', '😡 Giận dỗi', '🥺 Mè nheo',
                  '😢 Buồn bã', '🥱 Mệt mỏi', '🥳 Hào hứng', '😴 Buồn ngủ'
                ].map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMoodType(mood)}
                    type="button"
                    className={`border-[2px] border-border-color rounded-xl py-2 px-3 text-xs font-bold text-left cursor-pointer transition-all duration-100 ${
                      selectedMoodType === mood ? 'bg-primary-coral/15 border-primary-coral shadow-sm translate-x-[1px]' : 'bg-bg-primary'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Ghi chú chi tiết</label>
              <textarea
                value={moodNote}
                onChange={e => setMoodNote(e.target.value)}
                placeholder="Hôm nay có chuyện gì thế..."
                rows={3}
                className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-xs w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral resize-none"
              />
            </div>

            <div className="mb-6 flex items-center gap-2">
              <input
                type="checkbox"
                id="moodIsShared"
                checked={moodIsShared}
                onChange={e => setMoodIsShared(e.target.checked)}
                className="w-4 h-4 border-2 border-border-color rounded cursor-pointer"
              />
              <label htmlFor="moodIsShared" className="text-xs font-bold text-text-primary cursor-pointer select-none">
                Chia sẻ cảm xúc này cho đối phương thấy
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsOpenAddMoodModal(false)}
                className="bg-text-primary text-bg-card font-extrabold text-[13px] border-[2.2px] border-border-color rounded-xl px-4 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
              >
                Hủy
              </button>
              <button
                onClick={handleAddMoodLog}
                disabled={isAddingMood}
                className="bg-primary-coral text-border-color font-extrabold text-[13px] border-[2.2px] border-border-color rounded-xl px-4 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
              >
                {isAddingMood ? 'Đang lưu...' : 'Lưu cảm xúc'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Theme Customization Modal */}
      {isOpenThemeModal && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-5">
          <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-6 mb-4 shadow-neo w-full max-w-[420px]">
            <h3 className="text-lg font-extrabold mb-4 text-text-primary">Tùy chỉnh giao diện đếm ngày</h3>

            {/* Field 1: Avatar của bạn */}
            <div className="mb-4 bg-bg-primary border-[2px] border-border-color rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-[1.8px] border-border-color overflow-hidden bg-bg-card flex items-center justify-center shrink-0">
                  {themeAvatar1 ? (
                    <img src={themeAvatar1} alt="Avatar 1 Preview" className="w-full h-full object-cover" />
                  ) : user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar 1 Original" className="w-full h-full object-cover opacity-60" />
                  ) : (
                    <span className="text-lg">👦</span>
                  )}
                </div>
                <div>
                  <span className="block font-extrabold text-[11px] text-text-primary uppercase tracking-wider">Avatar của bạn</span>
                  <span className="text-[10px] text-text-secondary font-bold">
                    {themeAvatar1 ? 'Đang dùng ảnh tùy chỉnh' : 'Đang dùng mặc định'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <label className="bg-primary-coral text-border-color font-extrabold text-[10px] border-[1.8px] border-border-color rounded-lg px-2.5 py-1.5 cursor-pointer text-center hover:bg-primary-coral/90 select-none">
                  Chọn ảnh mới
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleCustomFileChange('avatar1', e)}
                    className="hidden"
                  />
                </label>
                {themeAvatar1 && (
                  <button
                    type="button"
                    onClick={() => setThemeAvatar1('')}
                    className="bg-bg-card text-text-primary font-extrabold text-[10px] border-[1.8px] border-border-color rounded-lg px-2.5 py-1.5 cursor-pointer text-center hover:bg-bg-primary select-none"
                  >
                    Dùng ảnh gốc
                  </button>
                )}
              </div>
            </div>

            {/* Field 2: Avatar của đối phương */}
            <div className="mb-4 bg-bg-primary border-[2px] border-border-color rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-[1.8px] border-border-color overflow-hidden bg-bg-card flex items-center justify-center shrink-0">
                  {themeAvatar2 ? (
                    <img src={themeAvatar2} alt="Avatar 2 Preview" className="w-full h-full object-cover" />
                  ) : partner?.avatarUrl ? (
                    <img src={partner.avatarUrl} alt="Avatar 2 Original" className="w-full h-full object-cover opacity-60" />
                  ) : (
                    <span className="text-lg">👧</span>
                  )}
                </div>
                <div>
                  <span className="block font-extrabold text-[11px] text-text-primary uppercase tracking-wider">Avatar đối phương</span>
                  <span className="text-[10px] text-text-secondary font-bold">
                    {themeAvatar2 ? 'Đang dùng ảnh tùy chỉnh' : 'Đang dùng mặc định'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <label className="bg-primary-coral text-border-color font-extrabold text-[10px] border-[1.8px] border-border-color rounded-lg px-2.5 py-1.5 cursor-pointer text-center hover:bg-primary-coral/90 select-none">
                  Chọn ảnh mới
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleCustomFileChange('avatar2', e)}
                    className="hidden"
                  />
                </label>
                {themeAvatar2 && (
                  <button
                    type="button"
                    onClick={() => setThemeAvatar2('')}
                    className="bg-bg-card text-text-primary font-extrabold text-[10px] border-[1.8px] border-border-color rounded-lg px-2.5 py-1.5 cursor-pointer text-center hover:bg-bg-primary select-none"
                  >
                    Dùng ảnh gốc
                  </button>
                )}
              </div>
            </div>

            {/* Field 3: Hình nền */}
            <div className="mb-5 bg-bg-primary border-[2px] border-border-color rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-12 rounded border-[1.8px] border-border-color overflow-hidden bg-bg-card flex items-center justify-center shrink-0">
                  {themeBackground ? (
                    <img src={themeBackground} alt="Background Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-[10px] text-text-secondary text-center p-1 font-bold">Mặc định</div>
                  )}
                </div>
                <div>
                  <span className="block font-extrabold text-[11px] text-text-primary uppercase tracking-wider">Hình nền đếm ngày</span>
                  <span className="text-[10px] text-text-secondary font-bold">
                    {themeBackground ? 'Đang dùng ảnh tùy chỉnh' : 'Đang dùng mặc định'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <label className="bg-primary-coral text-border-color font-extrabold text-[10px] border-[1.8px] border-border-color rounded-lg px-2.5 py-1.5 cursor-pointer text-center hover:bg-primary-coral/90 select-none">
                  Chọn ảnh mới
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleCustomFileChange('background', e)}
                    className="hidden"
                  />
                </label>
                {themeBackground && (
                  <button
                    type="button"
                    onClick={() => setThemeBackground('')}
                    className="bg-bg-card text-text-primary font-extrabold text-[10px] border-[1.8px] border-border-color rounded-lg px-2.5 py-1.5 cursor-pointer text-center hover:bg-bg-primary select-none"
                  >
                    Dùng ảnh gốc
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center gap-2">
              <button
                onClick={handleResetTheme}
                disabled={isSavingTheme}
                type="button"
                className="bg-warning-coral text-border-color font-extrabold text-[12px] border-[2.2px] border-border-color rounded-xl px-3.5 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-1 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
              >
                Đặt lại mặc định
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsOpenThemeModal(false)}
                  className="bg-text-primary text-bg-card font-extrabold text-[12px] border-[2.2px] border-border-color rounded-xl px-3.5 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-1 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveTheme}
                  disabled={isSavingTheme}
                  className="bg-primary-coral text-border-color font-extrabold text-[12px] border-[2.2px] border-border-color rounded-xl px-3.5 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-1 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
                >
                  {isSavingTheme ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default HomeScreen;
