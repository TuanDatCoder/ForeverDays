import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal
} from 'react-native';
import { useRelationship, demoStorage } from '../core/RelationshipContext';
import { ReminderService } from '@forever-days/core';
import type { Reminder } from '@forever-days/core';

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
                      onPress={() => triggerInstantNotification(`Thử: ${item.title}`, item.message)}
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
