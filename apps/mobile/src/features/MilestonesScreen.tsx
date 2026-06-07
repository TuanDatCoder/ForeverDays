import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Linking, Alert, Platform, InteractionManager, ActivityIndicator, Animated } from 'react-native';
import { useRelationship } from '../core/RelationshipContext';
import { MilestoneService } from '@forever-days/core';
import { Calendar, Trash2, Heart, Clock, CheckCircle2 } from 'lucide-react-native';
import * as ExpoCalendar from 'expo-calendar';

import { LoveUtils, MilestoneItem } from '../core/loveUtils';

let cachedCoupleId: string | null = null;
let cachedMilestones: MilestoneItem[] | null = null;

export const MilestonesScreen: React.FC = () => {
  const { anniversaryDate, coupleId, isDemoMode } = useRelationship();
  const [customMilestones, setCustomMilestones] = useState<MilestoneItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  // If cache exists, skip the artificial loading delay
  const [isReady, setIsReady] = useState(cachedMilestones !== null);
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (!isReady) {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.25,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();
    }
    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [isReady]);

  // Modal
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [upcomingLimit, setUpcomingLimit] = useState(10);

  const milestoneService = new MilestoneService();

  const loadCustomMilestones = async (forceRefresh = false) => {
    if (isDemoMode) {
      // Local storage simulations
      return;
    }
    if (!coupleId) return;

    if (!forceRefresh && cachedCoupleId === coupleId && cachedMilestones) {
      setCustomMilestones(cachedMilestones);
      return;
    }

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
      cachedCoupleId = coupleId;
      cachedMilestones = items;
      setCustomMilestones(items);
    } catch {}
  };

  useEffect(() => {
    if (isReady) return; // Skip if already ready from cache
    // Defer render until screen navigation transition animations finish
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    return () => task.cancel();
  }, [isReady]);

  useEffect(() => {
    if (isReady) {
      loadCustomMilestones();
    }
  }, [coupleId, isDemoMode, isReady]);

  const handleSyncCalendar = async () => {
    setIsSyncing(true);
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

    const updated = [...customMilestones, newItem];
    setCustomMilestones(updated);
    cachedMilestones = updated;

    if (!isDemoMode && coupleId) {
      await milestoneService.createMilestone(coupleId, newTitle.trim(), newDate, 'custom');
      // No need to reload from db, we updated local cache
    }

    setNewTitle('');
    setNewDate('');
    setIsOpenAddModal(false);
  };

  const handleDeleteMilestone = async (item: MilestoneItem) => {
    const updated = customMilestones.filter(m => m.title !== item.title || m.targetDate !== item.targetDate);
    setCustomMilestones(updated);
    if (!isDemoMode) {
      cachedMilestones = updated;
    }
    
    if (!isDemoMode && item.id) {
      await milestoneService.deleteMilestone(item.id);
    }
  };

  // Generate system list memoized
  const systemItems = useMemo(() => {
    return anniversaryDate ? LoveUtils.generateSystemMilestones(anniversaryDate) : [];
  }, [anniversaryDate]);

  const allMilestones = useMemo(() => {
    return [...systemItems, ...customMilestones];
  }, [systemItems, customMilestones]);

  const upcoming = useMemo(() => {
    return allMilestones
      .filter(m => !m.isPassed)
      .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
  }, [allMilestones]);

  const passed = useMemo(() => {
    return allMilestones
      .filter(m => m.isPassed)
      .sort((a, b) => new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime());
  }, [allMilestones]);

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

  const parseSafeDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    return null;
  };

  const handleAddToCalendar = async (title: string, dateStr: string) => {
    try {
      // 1. Request calendar permissions
      const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Quyền truy cập lịch bị từ chối',
          'Bạn cần cấp quyền truy cập lịch để thêm sự kiện trực tiếp vào điện thoại. Ứng dụng sẽ chuyển hướng sang trang web để bạn thêm thủ công.',
          [
            {
              text: 'Mở Trình duyệt',
              onPress: () => {
                const url = getGoogleCalendarUrl(title, dateStr);
                Linking.openURL(url).catch(err => console.error("Failed to open Google Calendar link:", err));
              }
            },
            { text: 'Đóng', style: 'cancel' }
          ]
        );
        return;
      }

      // 2. Resolve target dates in UTC midnight
      const parts = dateStr.split('-');
      let startDate: Date;
      let endDate: Date;

      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed
        const day = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          startDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
          endDate = new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0));
        } else {
          throw new Error('Invalid date parts');
        }
      } else {
        const parsedDate = parseSafeDate(dateStr);
        if (!parsedDate) {
          throw new Error('Invalid target date');
        }
        startDate = new Date(Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 0, 0, 0, 0));
        endDate = new Date(Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate() + 1, 0, 0, 0, 0));
      }

      // 3. Find primary / writeable calendar
      let defaultCalendarId: string | null = null;
      if (Platform.OS === 'ios') {
        const defaultCalendar = await ExpoCalendar.getDefaultCalendarAsync();
        defaultCalendarId = defaultCalendar ? defaultCalendar.id : null;
      } else {
        const calendars = await ExpoCalendar.getCalendarsAsync(ExpoCalendar.EntityTypes.EVENT);
        const targetCalendar = calendars.find(c => c.isPrimary) || calendars.find(c => c.allowsModifications) || calendars[0];
        defaultCalendarId = targetCalendar ? targetCalendar.id : null;
      }

      if (!defaultCalendarId) {
        throw new Error('No writeable calendar found on device');
      }

      // 4. Create the event
      await ExpoCalendar.createEventAsync(defaultCalendarId, {
        title,
        startDate,
        endDate,
        allDay: true,
        timeZone: 'UTC',
      });

      Alert.alert('Thành công', `Đã thêm cột mốc "${title}" vào lịch trên điện thoại của bạn.`);
    } catch (error) {
      console.error('Failed to add to calendar:', error);
      Alert.alert(
        'Lỗi lịch',
        'Không thể tự động thêm vào lịch. Bạn có muốn mở Google Calendar trên trình duyệt để tự thêm không?',
        [
          {
            text: 'Mở Trình duyệt',
            onPress: () => {
              const url = getGoogleCalendarUrl(title, dateStr);
              Linking.openURL(url).catch(err => console.error("Failed to open Google Calendar link:", err));
            }
          },
          { text: 'Đóng', style: 'cancel' }
        ]
      );
    }
  };

  if (!isReady) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cột mốc kỷ niệm</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
            <Heart size={54} color="#ff6584" fill="#ff6584" />
          </Animated.View>
          <Text style={{ fontSize: 13, fontWeight: '800', color: AppTheme.textSecondary }}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cột mốc kỷ niệm</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Calendar Card */}
        <View style={[styles.card, styles.rowBetween, { marginBottom: 20 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.boldTitle}>Đồng bộ Google Calendar</Text>
            <Text style={styles.descText}>Tự động tạo lịch nhắc trên điện thoại hai bạn.</Text>
          </View>
          <TouchableOpacity
            onPress={handleSyncCalendar}
            disabled={isSyncing}
            style={styles.syncBtn}
          >
            <Text style={styles.syncBtnText}>{isSyncing ? '...' : 'Đồng bộ'}</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Section Container Box */}
        {upcoming.length > 0 && (
          <View style={styles.sectionFrame}>
            {/* Box Header */}
            <View style={[styles.sectionHeaderBar, { backgroundColor: 'rgba(255, 101, 132, 0.04)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Clock size={15} color={AppTheme.colorPrimary} />
                <Text style={styles.sectionHeaderTitle}>Kỷ niệm sắp tới</Text>
              </View>
              <View style={styles.sectionCountBadge}>
                <Text style={styles.sectionCountBadgeText}>{upcoming.length} mốc</Text>
              </View>
            </View>

            {/* Scrollable list of items - fixed height */}
            <ScrollView nestedScrollEnabled style={{ maxHeight: 360 }} contentContainerStyle={{ padding: 12 }}>
              {upcoming.slice(0, upcomingLimit).map((item, idx) => (
                <View key={`up-${idx}`} style={styles.itemCard}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      {item.yearLabel && (
                        <View style={styles.yearBadge}>
                          <Text style={styles.yearBadgeText}>{item.yearLabel}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.itemDate}>{formatDateString(item.targetDate)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ marginRight: 8, alignItems: 'flex-end' }}>
                      <Text style={styles.descText}>Còn lại</Text>
                      <Text style={styles.remainingText}>{item.daysRemaining} ngày</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleAddToCalendar(item.title, item.targetDate)} style={{ marginRight: 8, padding: 4 }}>
                      <Calendar size={18} color={AppTheme.textSecondary} />
                    </TouchableOpacity>
                    {item.type === 'custom' && (
                      <TouchableOpacity onPress={() => handleDeleteMilestone(item)} style={{ padding: 4 }}>
                        <Trash2 size={18} color={AppTheme.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Load more button - OUTSIDE ScrollView so always visible */}
            {upcomingLimit < upcoming.length && (
              <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => setUpcomingLimit(prev => prev + 10)}
                  style={{
                    paddingVertical: 10,
                    borderWidth: 1.5,
                    borderColor: AppTheme.colorPrimary,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 101, 132, 0.06)',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: AppTheme.colorPrimary }}>
                    Xem thêm 10 sự kiện
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Passed Section Container Box */}
        {passed.length > 0 && (
          <View style={[styles.sectionFrame, { opacity: 0.85, marginTop: 20 }]}>
            {/* Box Header */}
            <View style={[styles.sectionHeaderBar, { backgroundColor: 'rgba(0, 184, 148, 0.04)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Heart size={15} color={AppTheme.colorSecondary} fill={AppTheme.colorSecondary} />
                <Text style={[styles.sectionHeaderTitle, { color: AppTheme.textSecondary }]}>Kỷ niệm đã qua</Text>
              </View>
              <View style={styles.sectionCountBadge}>
                <Text style={styles.sectionCountBadgeText}>{passed.length} mốc</Text>
              </View>
            </View>

            {/* Scrollable list of items */}
            <ScrollView nestedScrollEnabled style={{ maxHeight: 240 }} contentContainerStyle={{ padding: 12 }}>
              {passed.map((item, idx) => (
                <View key={`pass-${idx}`} style={[styles.itemCard, styles.passedItemCard]}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                      <Text style={[styles.itemTitle, styles.passedTitle]}>{item.title}</Text>
                      {item.yearLabel && (
                        <View style={styles.yearBadgePassed}>
                          <Text style={styles.yearBadgeTextPassed}>{item.yearLabel}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.itemDate}>{formatDateString(item.targetDate)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.passedBadge}>
                      <Text style={styles.passedBadgeText}>Đã qua</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleAddToCalendar(item.title, item.targetDate)} style={{ marginLeft: 8, padding: 4 }}>
                      <Calendar size={18} color={AppTheme.textSecondary} />
                    </TouchableOpacity>
                    {item.type === 'custom' && (
                      <TouchableOpacity onPress={() => handleDeleteMilestone(item)} style={{ marginLeft: 8, padding: 4 }}>
                        <Trash2 size={18} color={AppTheme.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => setIsOpenAddModal(true)}
        activeOpacity={0.8}
        style={styles.fab}
      >
        <Text style={styles.fabText}>+ Thêm sự kiện</Text>
      </TouchableOpacity>

      {/* Sync Success Dialog */}
      {showSyncSuccess && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <CheckCircle2 size={24} color={AppTheme.colorSecondary} />
              <Text style={[styles.modalHeader, { marginBottom: 0 }]}>Đồng bộ thành công</Text>
            </View>
            <Text style={styles.modalBody}>
              Các cột mốc kỷ niệm quan trọng của hai bạn đã được tạo và ghi nhận trực tiếp vào Lịch Google của điện thoại di động! Cả hai bạn sẽ nhận được thông báo nhắc nhở tự động từ Google.
            </Text>
            <TouchableOpacity
              onPress={() => setShowSyncSuccess(false)}
              style={styles.actionBtn}
            >
              <Text style={styles.actionBtnText}>Tuyệt vời</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Add Custom Milestone Modal */}
      {isOpenAddModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeader}>Tạo sự kiện mới</Text>

            <Text style={styles.label}>Tên cột mốc kỷ niệm</Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Ví dụ: Nụ hôn đầu tiên..."
              placeholderTextColor="#666"
              style={styles.input}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Ngày diễn ra (YYYY-MM-DD)</Text>
            <TextInput
              value={newDate}
              onChangeText={setNewDate}
              placeholder="Ví dụ: 2026-07-28"
              placeholderTextColor="#666"
              style={[styles.input, { marginBottom: 20 }]}
            />

            <View style={styles.rowEnd}>
              <TouchableOpacity
                onPress={() => setIsOpenAddModal(false)}
                style={[styles.actionBtn, styles.secondaryActionBtn]}
              >
                <Text style={styles.secondaryActionBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddMilestone}
                style={[styles.actionBtn, { marginLeft: 8 }]}
              >
                <Text style={styles.actionBtnText}>Tạo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boldTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: AppTheme.textPrimary,
  },
  descText: {
    fontSize: 10,
    color: AppTheme.textSecondary,
  },
  syncBtn: {
    backgroundColor: AppTheme.colorPrimary,
    borderWidth: AppTheme.borderWidth,
    borderColor: AppTheme.borderColor,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  syncBtnText: {
    fontWeight: '800',
    fontSize: 12,
    color: AppTheme.borderColor,
  },
  passedTitle: {
    color: AppTheme.textSecondary,
    textDecorationLine: 'line-through',
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '800',
    color: AppTheme.colorPrimary,
  },
  passedBadge: {
    backgroundColor: AppTheme.borderColor,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  passedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: AppTheme.bgCard,
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
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 1000,
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
    marginBottom: 16,
  },
  modalBody: {
    fontSize: 13,
    color: AppTheme.textSecondary,
    lineHeight: 18,
    marginBottom: 20,
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
  rowEnd: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
    color: AppTheme.bgCard,
    fontWeight: '800',
  },

  // Framed Boxes styles
  sectionFrame: {
    backgroundColor: AppTheme.bgCard,
    borderWidth: AppTheme.borderWidth,
    borderColor: AppTheme.borderColor,
    borderRadius: 18,
    shadowColor: AppTheme.borderColor,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    overflow: 'hidden',
  },
  sectionHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: AppTheme.borderColor,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: AppTheme.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCountBadge: {
    backgroundColor: 'rgba(61, 47, 61, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionCountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: AppTheme.textSecondary,
  },
  itemCard: {
    backgroundColor: AppTheme.bgPrimary,
    borderWidth: 1.5,
    borderColor: 'rgba(61, 47, 61, 0.22)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passedItemCard: {
    backgroundColor: 'rgba(61, 47, 61, 0.02)',
    borderColor: 'rgba(61, 47, 61, 0.12)',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: AppTheme.textPrimary,
  },
  itemDate: {
    fontSize: 11,
    color: AppTheme.textSecondary,
    marginTop: 2,
  },
  yearBadge: {
    backgroundColor: 'rgba(255, 101, 132, 0.15)',
    borderColor: 'rgba(255, 101, 132, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  yearBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: AppTheme.colorPrimary,
  },
  yearBadgePassed: {
    backgroundColor: 'rgba(0, 184, 148, 0.15)',
    borderColor: 'rgba(0, 184, 148, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  yearBadgeTextPassed: {
    fontSize: 9,
    fontWeight: '800',
    color: AppTheme.colorSecondary,
  },
});
export default MilestonesScreen;
