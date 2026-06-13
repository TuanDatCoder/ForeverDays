import React, { useState, useEffect } from 'react';
import { useRelationship } from '../core/RelationshipContext';
import { ReminderService, UserPushTokenService, MOCK_DAILY_WISHES } from '@forever-days/core';
import type { Reminder, DailyWish } from '@forever-days/core';
import { Bell, Clock, Trash2, Send, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

// Hàm tính wish hôm nay
const computeTodayWish = (wishes: DailyWish[]): DailyWish | null => {
  if (wishes.length === 0) return null;
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDate = today.getDate();
  const special = wishes.find(
    w => w.type === 'special' && w.specialMonth === currentMonth && w.specialDay === currentDate
  );
  if (special) return special;
  const daily = wishes.filter(w => w.type === 'daily');
  if (daily.length === 0) return null;
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return daily[dayOfYear % daily.length];
};

export const RemindersScreen: React.FC = () => {
  useSEO({
    title: 'Nhắc Nhở & Lời Chúc | ForeverDays',
    description: 'Không bao giờ quên những ngày quan trọng với hệ thống nhắc nhở và lời chúc mỗi ngày.',
    keywords: 'nhắc nhở tình yêu, lời chúc mỗi ngày, đếm ngày kỷ niệm'
  });

  const { coupleId, isDemoMode, user, partner } = useRelationship();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  
  // New Reminder Form
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newRepeat, setNewRepeat] = useState<'once' | 'daily' | 'weekly' | 'monthly'>('daily');

  // ==============================
  // Cài đặt lời chúc ngọt ngào (Web)
  // ==============================
  const [wishNotifEnabled, setWishNotifEnabled] = useState(() => {
    return localStorage.getItem('wish_notif_enabled') !== 'false';
  });
  const [wishMorningTime, setWishMorningTime] = useState(() => {
    return localStorage.getItem('wish_notif_morning') || '08:00';
  });
  const [wishEveningTime, setWishEveningTime] = useState(() => {
    return localStorage.getItem('wish_notif_evening') || '23:00';
  });
  const [wishEditMorning, setWishEditMorning] = useState(wishMorningTime);
  const [wishEditEvening, setWishEditEvening] = useState(wishEveningTime);
  const [isEditingWishTime, setIsEditingWishTime] = useState(false);

  // Kiểm tra và gửi thông báo web đúng giờ
  useEffect(() => {
    if (!wishNotifEnabled) return;
    const todayWish = computeTodayWish(MOCK_DAILY_WISHES);
    const wishContent = todayWish?.content || 'Chúc em ngày mới tràn ngập niềm vui! ❤️';

    const tryNotify = () => {
      const now = new Date();
      const [mH, mM] = wishMorningTime.split(':').map(Number);
      const [eH, eM] = wishEveningTime.split(':').map(Number);
      const morningMs = (mH * 60 + mM) * 60 * 1000;
      const eveningMs = (eH * 60 + eM) * 60 * 1000;
      const nowMs = (now.getHours() * 60 + now.getMinutes()) * 60 * 1000;

      const todayKey = now.toISOString().split('T')[0];
      const sentMorning = localStorage.getItem(`wish_sent_morning_${todayKey}`);
      const sentEvening = localStorage.getItem(`wish_sent_evening_${todayKey}`);

      // Sáng: có thể gửi trong khoảng ±5 phút so với giờ cài
      if (!sentMorning && Math.abs(nowMs - morningMs) < 5 * 60 * 1000) {
        if (Notification.permission === 'granted') {
          try {
            new Notification('☀️ Lời chúc buổi sáng ngọt ngào!', { body: wishContent, icon: '/favicon.png' });
          } catch (e) {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
              navigator.serviceWorker.ready.then(reg => {
                reg.showNotification('☀️ Lời chúc buổi sáng ngọt ngào!', { body: wishContent, icon: '/favicon.png' }).catch(() => {});
              });
            }
          }
          localStorage.setItem(`wish_sent_morning_${todayKey}`, '1');
        }
      }
      // Tối
      if (!sentEvening && Math.abs(nowMs - eveningMs) < 5 * 60 * 1000) {
        if (Notification.permission === 'granted') {
          try {
            new Notification('🌙 Lời chúc buổi tối dịu dàng!', { body: wishContent, icon: '/favicon.png' });
          } catch (e) {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
              navigator.serviceWorker.ready.then(reg => {
                reg.showNotification('🌙 Lời chúc buổi tối dịu dàng!', { body: wishContent, icon: '/favicon.png' }).catch(() => {});
              });
            }
          }
          localStorage.setItem(`wish_sent_evening_${todayKey}`, '1');
        }
      }
    };

    const interval = setInterval(tryNotify, 60 * 1000); // kiểm tra mỗi phút
    return () => clearInterval(interval);
  }, [wishNotifEnabled, wishMorningTime, wishEveningTime]);

  const handleToggleWishNotif = (enabled: boolean) => {
    setWishNotifEnabled(enabled);
    localStorage.setItem('wish_notif_enabled', String(enabled));
    if (enabled) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission().then(p => {
          if (p === 'granted') {
            alert(`✅ Đã bật lời chúc ngọt ngào! Bạn sẽ nhận lời chúc lúc ${wishMorningTime} và ${wishEveningTime} mỗi ngày 💕`);
          }
        });
      } else {
        alert(`✅ Đã bật lời chúc ngọt ngào! Bạn sẽ nhận lời chúc lúc ${wishMorningTime} và ${wishEveningTime} mỗi ngày 💕`);
      }
    } else {
      alert('Đã tắt thông báo lời chúc ngọt ngào.');
    }
  };

  const handleSaveWishTime = () => {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(wishEditMorning) || !timeRegex.test(wishEditEvening)) {
      alert('Giờ không hợp lệ! Vui lòng nhập đúng định dạng HH:MM');
      return;
    }
    setWishMorningTime(wishEditMorning);
    setWishEveningTime(wishEditEvening);
    localStorage.setItem('wish_notif_morning', wishEditMorning);
    localStorage.setItem('wish_notif_evening', wishEditEvening);
    setIsEditingWishTime(false);
    if (wishNotifEnabled) {
      alert(`✅ Đã cập nhật! Lời chúc sẽ gửi lúc ${wishEditMorning} và ${wishEditEvening} mỗi ngày 💕`);
    }
  };

  const reminderService = new ReminderService();

  const loadReminders = async () => {
    if (isDemoMode) {
      const saved = localStorage.getItem('reminders_list');
      if (saved) {
        try {
          setReminders(JSON.parse(saved) as Reminder[]);
        } catch {}
      } else {
        const defaultReminders: Reminder[] = [
          {
            id: '101',
            coupleId: 'demo-couple-id',
            title: 'Lời chúc buổi sáng ngọt ngào',
            message: 'Chào buổi sáng công chúa của anh! Chúc em có một ngày mới thật vui vẻ nhé! ❤️',
            scheduledTime: '07:00:00',
            repeatInterval: 'daily',
            isActive: true,
            category: 'morning_wish',
          },
          {
            id: '102',
            coupleId: 'demo-couple-id',
            title: 'Nhắc nhở uống nước',
            message: 'Bé yêu ơi, đã đến giờ uống nước rồi đó! Uống một cốc nước lọc nào!',
            scheduledTime: '14:00:00',
            repeatInterval: 'daily',
            isActive: true,
            category: 'water',
          },
          {
            id: '103',
            coupleId: 'demo-couple-id',
            title: 'Lịch hẹn hò cuối tuần',
            message: 'Tối nay chúng ta có hẹn cùng đi xem phim đó nha! Chuẩn bị đồ thôi!',
            scheduledTime: '19:00:00',
            repeatInterval: 'weekly',
            isActive: false,
            category: 'dating',
          },
        ];
        setReminders(defaultReminders);
        localStorage.setItem('reminders_list', JSON.stringify(defaultReminders));
      }
      return;
    }

    if (!coupleId) return;
    try {
      const dbReminders = await reminderService.fetchReminders(coupleId);
      setReminders(dbReminders);
    } catch {}
  };

  useEffect(() => {
    loadReminders();
    // Request notification permissions
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [coupleId, isDemoMode]);

  const saveRemindersToStorage = (list: Reminder[]) => {
    localStorage.setItem('reminders_list', JSON.stringify(list));
  };

  const handleToggle = async (index: number) => {
    const updated = [...reminders];
    updated[index].isActive = !updated[index].isActive;
    setReminders(updated);

    const item = updated[index];
    if (isDemoMode) {
      saveRemindersToStorage(updated);
    } else {
      await reminderService.updateReminder(item);
    }
  };

  const handleDelete = async (index: number) => {
    const item = reminders[index];
    const updated = reminders.filter((_, i) => i !== index);
    setReminders(updated);

    if (isDemoMode) {
      saveRemindersToStorage(updated);
    } else {
      await reminderService.deleteReminder(item.id);
    }
  };

  const handleAddReminder = async () => {
    if (!newTitle.trim() || !newMessage.trim() || !newTime) return;

    // Convert newTime (HH:MM) to HH:MM:ss
    const timeStr = `${newTime}:00`;

    const newReminder: Omit<Reminder, 'id'> = {
      coupleId: coupleId || 'demo-couple-id',
      creatorId: user?.id || 'demo-user-id',
      title: newTitle.trim(),
      message: newMessage.trim(),
      scheduledTime: timeStr,
      repeatInterval: newRepeat,
      isActive: true,
      category: 'custom',
    };

    if (isDemoMode) {
      const createdItem: Reminder = {
        ...newReminder,
        id: String(Date.now()),
      };
      const updated = [...reminders, createdItem];
      setReminders(updated);
      saveRemindersToStorage(updated);
    } else {
      await reminderService.createReminder(newReminder);
      await loadReminders();
    }

    // Reset fields
    setNewTitle('');
    setNewMessage('');
    setNewTime('08:00');
    setNewRepeat('daily');
    setIsOpenAddModal(false);
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
      data: { screen: 'Reminders' },
    };

    try {
      // Sử dụng corsproxy.io để vượt qua lỗi CORS trên Web khi gửi qua expo push service
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

  const handleSendReminderPush = async (itemTitle: string, itemMessage: string) => {
    const title = `Nhắc nhở từ ${user?.nickname || 'nửa kia'}! ⏰`;
    const body = `[${itemTitle}]: ${itemMessage}`;

    if (isDemoMode) {
      alert('Ứng dụng đang ở chế độ Demo! Tính năng gửi thông báo nhắc nhở chỉ hoạt động ở chế độ kết nối cơ sở dữ liệu thật.');
      triggerInstantNotification(title, body);
      return;
    }
    if (!partner?.id) {
      alert('Bạn chưa kết nối với nửa kia! Hãy ghép đôi để sử dụng tính năng này.');
      return;
    }
    try {
      const tokenService = new UserPushTokenService();
      const partnerToken = await tokenService.fetchPushToken(partner.id);

      if (partnerToken) {
        await sendPushNotification(partnerToken, title, body);
        if (partnerToken.startsWith('mock-')) {
          alert(
            `Đã gửi nhắc nhở thành công!\n\n(Do đối phương đang dùng Expo Go giả lập nên sự kiện đã được ghi nhận trên hệ thống nhưng không rung chuông vật lý).`
          );
        } else {
          alert('Đã gửi nhắc nhở thành công đến đối phương! ⏰');
        }
      } else {
        alert(
          'Không tìm thấy mã đăng ký thông báo (Push Token) của đối phương!\n\n' +
          'Lưu ý: Đối phương cần phải đăng nhập vào ứng dụng trên điện thoại ít nhất một lần để đăng ký thiết bị.'
        );
      }
    } catch (err: any) {
      console.error('Lỗi khi gửi nhắc nhở:', err);
      alert('Đã xảy ra lỗi khi gửi nhắc nhở: ' + (err?.message || err));
    }
  };

  // Trigger web desktop alert
  const triggerInstantNotification = (title: string, body: string) => {
    console.log('Nút Thử Ngay đã được bấm!');
    const showFallback = () => {
      // Tự dựng Toast HTML đẹp mắt thay vì dùng alert (tránh bị Chrome chặn alert hàng loạt)
      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.right = '24px';
      toast.style.backgroundColor = '#FF6F61'; // primary-coral color
      toast.style.color = '#3D2F3D'; // text-primary
      toast.style.border = '2.2px solid #3D2F3D';
      toast.style.padding = '14px 20px';
      toast.style.borderRadius = '16px';
      toast.style.boxShadow = '4px 4px 0px #3D2F3D'; // shadow-neo
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
        <div style="font-weight: 800; font-size: 13px;">🔔 [Báo thức]: ${title}</div>
        <div style="font-weight: 500; font-size: 11px; margin-top: 4px; opacity: 0.9;">${body}</div>
      `;
      document.body.appendChild(toast);

      // Animate in
      setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
      }, 50);

      // Animate out and remove
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
        // Fallback cho trình duyệt di động hoặc môi trường ném lỗi Illegal constructor
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
      // Luôn luôn hiển thị Toast trực tiếp trong app để người dùng nhận được phản hồi ngay lập tức
      showFallback();

      if (Notification.permission === 'granted') {
        tryShowNotification();
      } else if (Notification.permission !== 'denied') {
        // Tương thích ngược: Một số trình duyệt cũ (Safari) không trả về Promise cho requestPermission
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

  // Label mappings
  const getRepeatLabel = (interval: string) => {
    switch (interval) {
      case 'once': return 'Một lần';
      case 'weekly': return 'Hàng tuần';
      case 'monthly': return 'Hàng tháng';
      default: return 'Hàng ngày';
    }
  };

  const getCleanTime = (timeStr: string) => {
    // splits HH:mm:ss to HH:mm
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeStr;
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="bg-gradient-to-br from-primary-coral/15 to-secondary-mint/5 p-6 border-b-[2.2px] border-border-color text-center">
        <h2 className="text-xl font-black text-text-primary">Nhắc nhở cặp đôi</h2>
      </div>

      <div className="p-5 pb-[92px] w-full flex flex-col flex-1 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start w-full">
          {/* Reminders List - Spans 2 columns on desktop */}
          <div className="md:col-span-2 flex flex-col gap-4 order-2 md:order-1">
            <h3 className="text-[13px] font-extrabold text-text-secondary pl-2 mb-1 uppercase tracking-wider">Danh sách nhắc nhở</h3>
            {reminders.length === 0 ? (
              <div className="text-center py-10 bg-bg-card border-[2.2px] border-border-color rounded-2xl text-text-secondary font-extrabold text-xs">
                Chưa có nhắc nhở nào được lên lịch.
              </div>
            ) : (
              reminders.map((item, idx) => (
                <div
                  key={item.id}
                  className={`border-[2.2px] rounded-2xl p-5 transition-all duration-200 ${
                    item.isActive 
                      ? 'bg-bg-card border-border-color shadow-neo opacity-100' 
                      : 'bg-[#1d1719]/40 border-[#2e2325]/40 shadow-none opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className={`text-[15px] font-extrabold text-text-primary ${!item.isActive && 'text-text-secondary'}`}>{item.title}</h4>
                    <button
                      onClick={() => handleToggle(idx)}
                      className="bg-transparent border-0 cursor-pointer text-primary-coral flex items-center"
                    >
                      {item.isActive ? <ToggleRight size={36} /> : <ToggleLeft size={36} className="text-text-secondary" />}
                    </button>
                  </div>

                  <p className={`text-[12px] text-text-secondary mt-1 leading-relaxed ${!item.isActive && 'text-text-secondary/60'}`}>
                    {item.message}
                  </p>

                  <div className="flex justify-between items-center mt-3.5 border-t-[1.5px] border-dashed border-border-color pt-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold">
                      <Clock size={14} className="text-secondary-mint" />
                      <span>{getCleanTime(item.scheduledTime)} - {getRepeatLabel(item.repeatInterval)}</span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleSendReminderPush(item.title, item.message)}
                        className="bg-text-primary text-bg-card font-extrabold text-[11px] border-[2.2px] border-border-color rounded-full px-2.5 py-1.5 cursor-pointer transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] select-none inline-flex items-center justify-center gap-1"
                      >
                        <Send size={12} /> Gửi thử
                      </button>
                      <button
                        onClick={() => handleDelete(idx)}
                        className="bg-warning-coral/15 text-warning-coral font-extrabold text-[11px] border-[2.2px] border-border-color rounded-full px-2.5 py-1.5 cursor-pointer transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] select-none inline-flex items-center justify-center gap-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sidebar / Tools - Spans 1 column on desktop */}
          <div className="flex flex-col gap-6 order-1 md:order-2">
            <h3 className="text-[13px] font-extrabold text-text-secondary pl-2 mb-1 uppercase tracking-wider">Công cụ hỗ trợ</h3>

            {/* ============================== */}
            {/* Card: Cài đặt lời chúc ngọt ngào */}
            {/* ============================== */}
            <div className="bg-gradient-to-br from-[#fff0f5] to-[#fff6f7] border-[2.2px] border-border-color rounded-2xl p-5 shadow-neo">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">💌</span>
                <div className="flex-1">
                  <h4 className="text-[13px] font-black text-text-primary">Lời chúc ngọt ngào hàng ngày</h4>
                  <p className="text-[10px] text-text-secondary mt-0.5 leading-snug">Nhận lời chúc yêu thương mỗi sáng & tối qua thông báo trình duyệt</p>
                </div>
                {/* Toggle Switch */}
                <button
                  onClick={() => handleToggleWishNotif(!wishNotifEnabled)}
                  className={`relative inline-flex items-center w-11 h-6 rounded-full border-[2px] border-border-color transition-colors duration-200 flex-shrink-0 ${
                    wishNotifEnabled ? 'bg-primary-coral' : 'bg-text-secondary/30'
                  }`}
                >
                  <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    wishNotifEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
                  }`} />
                </button>
              </div>

              {/* Hiển thị giờ */}
              <div className={`flex items-center gap-2 bg-white border-[1.8px] border-border-color rounded-xl p-3 mb-3 transition-opacity ${
                wishNotifEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'
              }`}>
                <div className="flex-1 text-center">
                  <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest">☀️ Buổi sáng</p>
                  <p className="text-xl font-black text-text-primary mt-0.5">{wishMorningTime}</p>
                </div>
                <div className="w-px h-8 bg-border-color opacity-30" />
                <div className="flex-1 text-center">
                  <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest">🌙 Buổi tối</p>
                  <p className="text-xl font-black text-text-primary mt-0.5">{wishEveningTime}</p>
                </div>
                <button
                  onClick={() => { setWishEditMorning(wishMorningTime); setWishEditEvening(wishEveningTime); setIsEditingWishTime(true); }}
                  className="ml-1 bg-bg-primary border-[1.8px] border-border-color rounded-lg px-2.5 py-1.5 text-[10px] font-black text-text-primary hover:bg-primary-coral/10 transition-colors"
                >
                  ✏️ Sửa
                </button>
              </div>

              {/* Modal chỉnh giờ (Inline) */}
              {isEditingWishTime && (
                <div className="bg-bg-primary border-[2px] border-primary-coral/40 rounded-xl p-4 mb-3 flex flex-col gap-3">
                  <p className="text-[11px] font-black text-text-primary">⏰ Chỉnh giờ gửi lời chúc</p>
                  <div>
                    <label className="block text-[10px] font-black text-text-secondary uppercase mb-1">☀️ Giờ buổi sáng</label>
                    <input
                      type="time"
                      value={wishEditMorning}
                      onChange={e => setWishEditMorning(e.target.value)}
                      className="bg-white border-[2px] border-border-color rounded-lg px-3 py-2 text-sm font-bold w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-text-secondary uppercase mb-1">🌙 Giờ buổi tối</label>
                    <input
                      type="time"
                      value={wishEditEvening}
                      onChange={e => setWishEditEvening(e.target.value)}
                      className="bg-white border-[2px] border-border-color rounded-lg px-3 py-2 text-sm font-bold w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditingWishTime(false)}
                      className="flex-1 py-2 text-xs font-black border-[2px] border-border-color rounded-xl text-text-secondary"
                    >Hủy</button>
                    <button
                      onClick={handleSaveWishTime}
                      className="flex-1 py-2 text-xs font-black bg-primary-coral text-white border-[2px] border-border-color rounded-xl"
                    >Lưu</button>
                  </div>
                </div>
              )}

              <p className="text-[9px] text-text-secondary leading-snug">
                💡 Web sẽ gửi thông báo khi bạn đang mở tab trình duyệt. Hãy bật quyền thông báo trong trình duyệt nhé!
              </p>
            </div>

            {/* Instant Notification Tester */}
            <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 shadow-neo flex flex-col gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-primary-coral/15 flex items-center justify-center text-primary-coral shrink-0">
                  <Bell size={20} />
                </div>
                <div>
                  <h4 className="text-[13px] font-extrabold">Kiểm tra thông báo</h4>
                  <p className="text-[10px] text-text-secondary mt-0.5">Bắn thử thông báo hệ thống lên trình duyệt.</p>
                </div>
              </div>
              <button
                onClick={() => triggerInstantNotification('Chào bé yêu! ❤️', 'Hôm nay bạn đã nói lời yêu thương với đối phương chưa? Hãy gửi lời chúc nhé!')}
                className="w-full bg-primary-coral text-border-color font-extrabold text-xs border-[2.2px] border-border-color rounded-full py-2.5 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
              >
                Thử ngay
              </button>
            </div>
          </div>
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => setIsOpenAddModal(true)}
          className="fixed bottom-[92px] right-6 md:right-[calc(50%-560px)] bg-primary-coral text-border-color font-extrabold text-[13px] border-[2.2px] border-border-color rounded-full px-5 py-3 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none z-10"
        >
          <Plus size={16} /> Lên lịch nhắc
        </button>
      </div>

      {/* Add Reminder Modal */}
      {isOpenAddModal && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-5">
          <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-6 mb-4 shadow-neo w-full max-w-[380px]">
            <h3 className="text-lg font-extrabold mb-5">Lên lịch nhắc nhở mới</h3>

            <div className="mb-3">
              <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Tiêu đề lịch nhắc</label>
              <input
                type="text"
                placeholder="Ví dụ: Chúc ngủ ngon, Nhắc uống nước..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral"
              />
            </div>

            <div className="mb-3">
              <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Lời nhắn gửi</label>
              <input
                type="text"
                placeholder="Nội dung nhắc nhở..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral"
              />
            </div>

            <div className="mb-3">
              <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Giờ báo thức</label>
              <input
                type="time"
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral"
              />
            </div>

            <div className="mb-6">
              <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Tần suất lặp lại</label>
              <select
                value={newRepeat}
                onChange={e => setNewRepeat(e.target.value as any)}
                className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral h-[48px]"
              >
                <option value="once">Một lần</option>
                <option value="daily">Hàng ngày</option>
                <option value="weekly">Hàng tuần</option>
                <option value="monthly">Hàng tháng</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsOpenAddModal(false)}
                className="bg-text-primary text-bg-card font-extrabold text-[13px] border-[2.2px] border-border-color rounded-xl px-4 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
              >
                Hủy
              </button>
              <button
                onClick={handleAddReminder}
                className="bg-primary-coral text-border-color font-extrabold text-[13px] border-[2.2px] border-border-color rounded-xl px-4 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
              >
                Lên lịch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default RemindersScreen;
