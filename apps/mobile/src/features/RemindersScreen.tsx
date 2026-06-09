import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Switch,
  Platform
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRelationship, demoStorage } from '../core/RelationshipContext';
import { ReminderService, UserPushTokenService, MOCK_DAILY_WISHES } from '@forever-days/core';
import type { Reminder, DailyWish } from '@forever-days/core';

// Cấu hình cách hiển thị thông báo khi app đang mở
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Hàm tính wish hôm nay (giống HomeScreen)
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

const WISH_NOTIF_MORNING_ID = 'wish_daily_morning';
const WISH_NOTIF_EVENING_ID = 'wish_daily_evening';
const STORAGE_KEY_WISH_ENABLED = 'wish_notif_enabled';
const STORAGE_KEY_WISH_MORNING = 'wish_notif_morning';
const STORAGE_KEY_WISH_EVENING = 'wish_notif_evening';

export const RemindersScreen: React.FC = () => {
  const { coupleId, isDemoMode, user, partner } = useRelationship();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);

  // New Reminder Form
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newRepeat, setNewRepeat] = useState<'once' | 'daily' | 'weekly' | 'monthly'>('daily');

  // ==============================
  // Cài đặt lời chúc ngọt ngào
  // ==============================
  const [wishNotifEnabled, setWishNotifEnabled] = useState(true);
  const [wishMorningTime, setWishMorningTime] = useState('08:00');
  const [wishEveningTime, setWishEveningTime] = useState('23:00');
  const [isEditingWishTime, setIsEditingWishTime] = useState(false);
  const [editMorning, setEditMorning] = useState('08:00');
  const [editEvening, setEditEvening] = useState('23:00');
  const [isSchedulingWish, setIsSchedulingWish] = useState(false);

  const reminderService = new ReminderService();

  // Load wish notification settings từ storage
  useEffect(() => {
    const loadWishSettings = async () => {
      try {
        const enabled = demoStorage[STORAGE_KEY_WISH_ENABLED];
        const morning = demoStorage[STORAGE_KEY_WISH_MORNING];
        const evening = demoStorage[STORAGE_KEY_WISH_EVENING];
        if (enabled !== undefined) setWishNotifEnabled(enabled === 'true');
        if (morning) { setWishMorningTime(morning); setEditMorning(morning); }
        if (evening) { setWishEveningTime(evening); setEditEvening(evening); }
      } catch {}
    };
    loadWishSettings();
  }, []);

  // Lên lịch thông báo lời chúc
  const scheduleWishNotifications = async (enabled: boolean, morning: string, evening: string) => {
    setIsSchedulingWish(true);
    try {
      // Xin quyền thông báo
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền bị từ chối', 'Bạn cần cấp quyền thông báo để nhận lời chúc hàng ngày!');
        setIsSchedulingWish(false);
        return;
      }

      // Hủy notifications cũ
      await Notifications.cancelScheduledNotificationAsync(WISH_NOTIF_MORNING_ID).catch(() => {});
      await Notifications.cancelScheduledNotificationAsync(WISH_NOTIF_EVENING_ID).catch(() => {});

      if (!enabled) {
        Alert.alert('Đã tắt', 'Thông báo lời chúc ngọt ngào đã được tắt.');
        setIsSchedulingWish(false);
        return;
      }

      // Lấy nội dung wish hôm nay
      const todayWish = computeTodayWish(MOCK_DAILY_WISHES);
      const wishContent = todayWish?.content || 'Chúc em ngày mới tràn ngập niềm vui! ❤️';

      // Parse giờ buổi sáng
      const [mH, mM] = morning.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        identifier: WISH_NOTIF_MORNING_ID,
        content: {
          title: '☀️ Lời chúc buổi sáng ngọt ngào!',
          body: wishContent,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: isNaN(mH) ? 8 : mH,
          minute: isNaN(mM) ? 0 : mM,
        },
      });

      // Parse giờ buổi tối
      const [eH, eM] = evening.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        identifier: WISH_NOTIF_EVENING_ID,
        content: {
          title: '🌙 Lời chúc buổi tối dịu dàng!',
          body: wishContent,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: isNaN(eH) ? 23 : eH,
          minute: isNaN(eM) ? 0 : eM,
        },
      });

      Alert.alert(
        '✅ Đã lên lịch!',
        `Lời chúc ngọt ngào sẽ được gửi đến bạn lúc ${morning} và ${evening} mỗi ngày! 💕`
      );
    } catch (err: any) {
      Alert.alert('Lỗi', 'Không thể lên lịch thông báo: ' + (err?.message || err));
    } finally {
      setIsSchedulingWish(false);
    }
  };

  const handleToggleWishNotif = async (value: boolean) => {
    setWishNotifEnabled(value);
    demoStorage[STORAGE_KEY_WISH_ENABLED] = String(value);
    await scheduleWishNotifications(value, wishMorningTime, wishEveningTime);
  };

  const handleSaveWishTime = async () => {
    // Validate format HH:MM
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(editMorning) || !timeRegex.test(editEvening)) {
      Alert.alert('Giờ không hợp lệ', 'Vui lòng nhập giờ đúng định dạng HH:MM (ví dụ: 08:00, 23:00)');
      return;
    }
    setWishMorningTime(editMorning);
    setWishEveningTime(editEvening);
    demoStorage[STORAGE_KEY_WISH_MORNING] = editMorning;
    demoStorage[STORAGE_KEY_WISH_EVENING] = editEvening;
    setIsEditingWishTime(false);
    await scheduleWishNotifications(wishNotifEnabled, editMorning, editEvening);
  };

  const loadReminders = async () => {
    if (isDemoMode) {
      const saved = demoStorage['reminders_list'];
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
        demoStorage['reminders_list'] = JSON.stringify(defaultReminders);
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
  }, [coupleId, isDemoMode]);

  const saveRemindersToStorage = (list: Reminder[]) => {
    demoStorage['reminders_list'] = JSON.stringify(list);
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
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
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
      Alert.alert('Chế độ Demo', 'Ứng dụng đang ở chế độ Demo! Tính năng gửi thông báo nhắc nhở chỉ hoạt động ở chế độ kết nối cơ sở dữ liệu thật.');
      triggerInstantNotification(title, body);
      return;
    }
    if (!partner?.id) {
      Alert.alert('Chưa kết nối', 'Bạn chưa kết nối với nửa kia! Hãy ghép đôi để sử dụng tính năng này.');
      return;
    }
    try {
      const tokenService = new UserPushTokenService();
      const partnerToken = await tokenService.fetchPushToken(partner.id);

      if (partnerToken) {
        await sendPushNotification(partnerToken, title, body);
        Alert.alert('Thành công', 'Đã gửi nhắc nhở thành công đến đối phương! ⏰');
      } else {
        Alert.alert(
          'Không tìm thấy Token',
          'Không tìm thấy mã đăng ký thông báo (Push Token) của đối phương!\n\n' +
          'Lưu ý: Đối phương cần phải đăng nhập vào ứng dụng trên điện thoại ít nhất một lần để đăng ký thiết bị.'
        );
      }
    } catch (err: any) {
      console.error('Lỗi khi gửi nhắc nhở:', err);
      Alert.alert('Thất bại', 'Đã xảy ra lỗi khi gửi nhắc nhở: ' + (err?.message || err));
    }
  };

  const triggerInstantNotification = (title: string, body: string) => {
    Alert.alert(` ${title}`, body, [{ text: 'OK' }]);
  };

  const getRepeatLabel = (interval: string) => {
    switch (interval) {
      case 'once': return 'Một lần';
      case 'weekly': return 'Hàng tuần';
      case 'monthly': return 'Hàng tháng';
      default: return 'Hàng ngày';
    }
  };

  const getCleanTime = (timeStr: string) => {
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeStr;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nhắc nhở cặp đôi</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ============================== */}
        {/* Card: Cài đặt lời chúc ngọt ngào */}
        {/* ============================== */}
        <View style={styles.wishCard}>
          <View style={styles.wishCardHeader}>
            <Text style={styles.wishCardIcon}>💌</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.wishCardTitle}>Lời chúc ngọt ngào hàng ngày</Text>
              <Text style={styles.wishCardDesc}>Nhận lời chúc yêu thương mỗi ngày vào buổi sáng và buổi tối</Text>
            </View>
            <Switch
              value={wishNotifEnabled}
              onValueChange={handleToggleWishNotif}
              trackColor={{ false: '#ccc', true: '#ff6584' }}
              thumbColor={wishNotifEnabled ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#ccc"
            />
          </View>

          {/* Hiển thị giờ hiện tại */}
          <View style={[styles.wishTimeRow, { opacity: wishNotifEnabled ? 1 : 0.4 }]}>
            <View style={styles.wishTimeBlock}>
              <Text style={styles.wishTimeLabel}>☀️ Buổi sáng</Text>
              <Text style={styles.wishTimeValue}>{wishMorningTime}</Text>
            </View>
            <View style={styles.wishTimeDivider} />
            <View style={styles.wishTimeBlock}>
              <Text style={styles.wishTimeLabel}>🌙 Buổi tối</Text>
              <Text style={styles.wishTimeValue}>{wishEveningTime}</Text>
            </View>
            <TouchableOpacity
              onPress={() => { setEditMorning(wishMorningTime); setEditEvening(wishEveningTime); setIsEditingWishTime(true); }}
              style={styles.wishEditBtn}
              disabled={!wishNotifEnabled}
            >
              <Text style={styles.wishEditBtnText}>✏️ Chỉnh giờ</Text>
            </TouchableOpacity>
          </View>

          {/* Nút áp dụng ngay */}
          <TouchableOpacity
            onPress={() => scheduleWishNotifications(wishNotifEnabled, wishMorningTime, wishEveningTime)}
            style={[styles.wishApplyBtn, { opacity: wishNotifEnabled && !isSchedulingWish ? 1 : 0.5 }]}
            disabled={!wishNotifEnabled || isSchedulingWish}
          >
            <Text style={styles.wishApplyBtnText}>
              {isSchedulingWish ? 'Đang lên lịch...' : '🔔 Áp dụng & Lên lịch ngay'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modal chỉnh giờ */}
        <Modal
          visible={isEditingWishTime}
          transparent
          animationType="fade"
          onRequestClose={() => setIsEditingWishTime(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeader}>⏰ Chỉnh giờ gửi lời chúc</Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>☀️ Giờ buổi sáng (HH:MM)</Text>
                <TextInput
                  value={editMorning}
                  onChangeText={setEditMorning}
                  placeholder="Ví dụ: 08:00"
                  placeholderTextColor="#666"
                  style={styles.input}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>🌙 Giờ buổi tối (HH:MM)</Text>
                <TextInput
                  value={editEvening}
                  onChangeText={setEditEvening}
                  placeholder="Ví dụ: 23:00"
                  placeholderTextColor="#666"
                  style={styles.input}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>

              <View style={styles.formHint}>
                <Text style={styles.formHintText}>💡 Nhập định dạng HH:MM (24 giờ). Ví dụ: 08:00 là 8 giờ sáng, 23:00 là 11 giờ đêm.</Text>
              </View>

              <View style={styles.rowEnd}>
                <TouchableOpacity
                  onPress={() => setIsEditingWishTime(false)}
                  style={[styles.actionBtn, styles.secondaryActionBtn]}
                >
                  <Text style={styles.secondaryActionBtnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveWishTime}
                  style={[styles.actionBtn, { marginLeft: 8 }]}
                >
                  <Text style={styles.actionBtnText}>Lưu & Áp dụng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Instant Notification Tester */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.testerTitle}>Kiểm tra thông báo tức thì</Text>
              <Text style={styles.testerDesc}>Thử nghiệm bắn thông báo ngay trên điện thoại.</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => triggerInstantNotification('Chào bé yêu! ❤️', 'Hôm nay bạn đã nói lời yêu thương với đối phương chưa? Hãy gửi lời chúc nhé!')}
            style={[styles.testBtn, { marginTop: 12 }]}
          >
            <Text style={styles.testBtnText}>Bắn thử thông báo</Text>
          </TouchableOpacity>
        </View>

        {/* Reminders List */}
        <View style={{ marginTop: 12 }}>
          {reminders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có nhắc nhở nào được lên lịch.</Text>
            </View>
          ) : (
            reminders.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.card,
                  !item.isActive && styles.cardInactive
                ]}
              >
                <View style={styles.rowBetween}>
                  <Text style={[styles.reminderTitle, !item.isActive && styles.textInactive]}>{item.title}</Text>
                  <TouchableOpacity
                    onPress={() => handleToggle(idx)}
                    activeOpacity={0.8}
                    style={[
                      styles.toggleBtn,
                      item.isActive ? styles.toggleActive : styles.toggleInactive
                    ]}
                  >
                    <Text style={[styles.toggleBtnText, item.isActive ? styles.toggleBtnTextActive : styles.toggleBtnTextInactive]}>
                      {item.isActive ? 'BẬT' : 'TẮT'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.reminderMessage, !item.isActive && styles.textInactive]}>
                  {item.message}
                </Text>

                <View style={styles.reminderFooter}>
                  <View style={styles.row}>
                    <Text style={styles.clockIcon}>⏰</Text>
                    <Text style={styles.reminderTimeInfo}>
                      {getCleanTime(item.scheduledTime)} - {getRepeatLabel(item.repeatInterval)}
                    </Text>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => handleSendReminderPush(item.title, item.message)}
                      style={styles.sendTryBtn}
                    >
                      <Text style={styles.sendTryBtnText}>Gửi thử</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(idx)}
                      style={styles.deleteBtn}
                    >
                      <Text style={{ fontSize: 14 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => setIsOpenAddModal(true)}
        activeOpacity={0.8}
        style={styles.fab}
      >
        <Text style={styles.fabText}>+ Lên lịch nhắc</Text>
      </TouchableOpacity>

      {/* Add Reminder Modal */}
      <Modal
        visible={isOpenAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpenAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeader}>Lên lịch nhắc nhở mới</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tiêu đề lịch nhắc</Text>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="Ví dụ: Chúc ngủ ngon, Nhắc uống nước..."
                placeholderTextColor="#666"
                style={styles.input}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Lời nhắn gửi</Text>
              <TextInput
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Nội dung nhắc nhở..."
                placeholderTextColor="#666"
                style={styles.input}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Giờ báo thức (HH:MM)</Text>
              <TextInput
                value={newTime}
                onChangeText={setNewTime}
                placeholder="Ví dụ: 08:00"
                placeholderTextColor="#666"
                style={styles.input}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tần suất lặp lại</Text>
              <View style={styles.repeatSelectRow}>
                {['once', 'daily', 'weekly', 'monthly'].map((rep) => (
                  <TouchableOpacity
                    key={rep}
                    onPress={() => setNewRepeat(rep as any)}
                    style={[
                      styles.repeatBtn,
                      newRepeat === rep && styles.repeatBtnActive
                    ]}
                  >
                    <Text style={[styles.repeatBtnText, newRepeat === rep && styles.repeatBtnTextActive]}>
                      {rep === 'once'
                        ? 'Một lần'
                        : rep === 'daily'
                        ? 'Ngày'
                        : rep === 'weekly'
                        ? 'Tuần'
                        : 'Tháng'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.rowEnd}>
              <TouchableOpacity
                onPress={() => setIsOpenAddModal(false)}
                style={[styles.actionBtn, styles.secondaryActionBtn]}
              >
                <Text style={styles.secondaryActionBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddReminder}
                style={[styles.actionBtn, { marginLeft: 8 }]}
              >
                <Text style={styles.actionBtnText}>Lên lịch</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ==================== STYLES ADDITION ====================

const AppTheme = {
  bgPrimary: '#fff6f7',
  bgCard: '#ffffff',
  borderColor: '#3d2f3d',
  textPrimary: '#3d2f3d',
  textSecondary: '#856a85',
  colorPrimary: '#ff6584',
  colorSecondary: '#00b894',
  colorWarning: '#ee5253',
  borderWidth: 2.2,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.bgPrimary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: AppTheme.borderWidth,
    borderColor: AppTheme.borderColor,
    backgroundColor: AppTheme.bgCard,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: AppTheme.textPrimary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 150,
  },
  card: {
    backgroundColor: AppTheme.bgCard,
    borderWidth: AppTheme.borderWidth,
    borderColor: AppTheme.borderColor,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: AppTheme.borderColor,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  cardInactive: {
    opacity: 0.6,
    backgroundColor: 'rgba(61, 47, 61, 0.05)',
    borderColor: 'rgba(61, 47, 61, 0.15)',
    elevation: 0,
    shadowOpacity: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bellIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 142, 158, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: AppTheme.textPrimary,
  },
  testerDesc: {
    fontSize: 10,
    color: AppTheme.textSecondary,
    marginTop: 2,
  },
  testBtn: {
    backgroundColor: AppTheme.bgPrimary,
    borderWidth: 1.8,
    borderColor: AppTheme.borderColor,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBtnText: {
    fontWeight: '800',
    fontSize: 12,
    color: AppTheme.textPrimary,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: AppTheme.textSecondary,
    fontWeight: '800',
    fontSize: 12,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: AppTheme.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  textInactive: {
    color: AppTheme.textSecondary,
  },
  toggleBtn: {
    borderWidth: 1.8,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  toggleActive: {
    backgroundColor: AppTheme.colorPrimary,
    borderColor: AppTheme.borderColor,
  },
  toggleInactive: {
    backgroundColor: AppTheme.bgPrimary,
    borderColor: AppTheme.borderColor,
  },
  toggleBtnText: {
    fontSize: 10,
    fontWeight: '900',
  },
  toggleBtnTextActive: {
    color: AppTheme.borderColor,
  },
  toggleBtnTextInactive: {
    color: AppTheme.textSecondary,
  },
  reminderMessage: {
    fontSize: 12,
    color: AppTheme.textSecondary,
    marginTop: 8,
    lineHeight: 16,
  },
  reminderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    borderTopWidth: 1.5,
    borderColor: AppTheme.borderColor,
    borderStyle: 'dashed',
    paddingTop: 10,
  },
  clockIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  reminderTimeInfo: {
    fontSize: 11,
    fontWeight: '800',
    color: AppTheme.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sendTryBtn: {
    backgroundColor: 'rgba(181, 234, 215, 0.15)',
    borderWidth: 1.5,
    borderColor: AppTheme.borderColor,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  sendTryBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: AppTheme.colorSecondary,
  },
  deleteBtn: {
    padding: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    backgroundColor: AppTheme.colorPrimary,
    borderWidth: AppTheme.borderWidth,
    borderColor: AppTheme.borderColor,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: AppTheme.borderColor,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  fabText: {
    fontWeight: '800',
    color: AppTheme.borderColor,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: AppTheme.bgCard,
    borderWidth: AppTheme.borderWidth,
    borderColor: AppTheme.borderColor,
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: AppTheme.textPrimary,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontWeight: '800',
    fontSize: 11,
    color: AppTheme.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: AppTheme.bgPrimary,
    borderWidth: AppTheme.borderWidth,
    borderColor: AppTheme.borderColor,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: AppTheme.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  repeatSelectRow: {
    flexDirection: 'row',
    gap: 6,
  },
  repeatBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: AppTheme.borderColor,
    borderRadius: 8,
    backgroundColor: AppTheme.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatBtnActive: {
    borderColor: AppTheme.colorPrimary,
    backgroundColor: 'rgba(255, 142, 158, 0.15)',
  },
  repeatBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: AppTheme.textSecondary,
  },
  repeatBtnTextActive: {
    color: AppTheme.colorPrimary,
  },
  // Wish settings card styles
  wishCard: {
    backgroundColor: '#fff0f5',
    borderWidth: 2.2,
    borderColor: '#3d2f3d',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#3d2f3d',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  wishCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  wishCardIcon: {
    fontSize: 28,
  },
  wishCardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#3d2f3d',
  },
  wishCardDesc: {
    fontSize: 10,
    color: '#856a85',
    marginTop: 2,
    lineHeight: 14,
  },
  wishTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.8,
    borderColor: '#3d2f3d',
    padding: 10,
    marginBottom: 10,
  },
  wishTimeBlock: {
    flex: 1,
    alignItems: 'center',
  },
  wishTimeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#856a85',
    textTransform: 'uppercase',
  },
  wishTimeValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#3d2f3d',
    marginTop: 2,
  },
  wishTimeDivider: {
    width: 1.5,
    height: 40,
    backgroundColor: '#3d2f3d',
    marginHorizontal: 10,
    opacity: 0.2,
  },
  wishEditBtn: {
    backgroundColor: '#fff6f7',
    borderWidth: 1.5,
    borderColor: '#3d2f3d',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  wishEditBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3d2f3d',
  },
  wishApplyBtn: {
    backgroundColor: '#ff6584',
    borderWidth: 2,
    borderColor: '#3d2f3d',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  wishApplyBtnText: {
    fontWeight: '900',
    color: '#fff',
    fontSize: 12,
  },
  formHint: {
    backgroundColor: 'rgba(255, 142, 158, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  formHintText: {
    fontSize: 11,
    color: '#856a85',
    lineHeight: 16,
    fontWeight: '600',
  },
  rowEnd: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionBtn: {
    backgroundColor: AppTheme.colorPrimary,
    borderWidth: AppTheme.borderWidth,
    borderColor: AppTheme.borderColor,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  actionBtnText: {
    fontWeight: '800',
    color: AppTheme.borderColor,
  },
  secondaryActionBtn: {
    backgroundColor: AppTheme.textPrimary,
  },
  secondaryActionBtnText: {
    color: '#ffffff',
    fontWeight: '800',
  },
});

export default RemindersScreen;
