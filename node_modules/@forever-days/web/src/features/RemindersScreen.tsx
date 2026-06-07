import React, { useState, useEffect } from 'react';
import { useRelationship } from '../core/RelationshipContext';
import { ReminderService } from '@forever-days/core';
import type { Reminder } from '@forever-days/core';
import { Bell, Clock, Trash2, Send, Plus, ToggleLeft, ToggleRight } from 'lucide-react';

export const RemindersScreen: React.FC = () => {
  const { coupleId, isDemoMode, user } = useRelationship();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  
  // New Reminder Form
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newRepeat, setNewRepeat] = useState<'once' | 'daily' | 'weekly' | 'monthly'>('daily');

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

  // Trigger web desktop alert
  const triggerInstantNotification = (title: string, body: string) => {
    if (!('Notification' in window)) {
      alert(`[Báo thức]: ${title}\n${body}`);
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    } else {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body });
        } else {
          alert(`[Báo thức]: ${title}\n${body}`);
        }
      });
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
                        onClick={() => triggerInstantNotification(`Thử: ${item.title}`, item.message)}
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
