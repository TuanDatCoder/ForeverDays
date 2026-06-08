import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Linking, Alert, Platform, InteractionManager, ActivityIndicator, Animated } from 'react-native';
import { useRelationship, demoStorage } from '../core/RelationshipContext';
import { MilestoneService, CoupleEventService, MilestonePlanService } from '@forever-days/core';
import type { CoupleEvent, MilestonePlan } from '@forever-days/core';
import { Calendar, Trash2, Heart, Clock, CheckCircle2, Compass, ChevronDown, ChevronUp, Utensils, Gamepad2, MapPin } from 'lucide-react-native';
import * as ExpoCalendar from 'expo-calendar';

import { LoveUtils, MilestoneItem } from '../core/loveUtils';

let cachedCoupleId: string | null = null;
let cachedMilestones: MilestoneItem[] | null = null;

export const MilestonesScreen: React.FC = () => {
  const { anniversaryDate, coupleId, isDemoMode } = useRelationship();
  const [customMilestones, setCustomMilestones] = useState<MilestoneItem[]>([]);

  // Milestone Plans State
  const [plans, setPlans] = useState<MilestonePlan[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [newPlanCategory, setNewPlanCategory] = useState<'go' | 'eat' | 'play'>('go');
  const [newPlanContent, setNewPlanContent] = useState('');
  const [isAddingPlan, setIsAddingPlan] = useState(false);

  const planService = new MilestonePlanService();

  const getMilestoneKey = (item: MilestoneItem) => item.id || item.title;

  // Couple Events State
  const [coupleEvents, setCoupleEvents] = useState<CoupleEvent[]>([]);
  const [isOpenAddEventModal, setIsOpenAddEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  const eventService = new CoupleEventService();
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

  const loadCoupleEvents = async () => {
    if (isDemoMode) {
      const saved = demoStorage['demo_couple_events'];
      if (saved) {
        try {
          setCoupleEvents(JSON.parse(saved));
        } catch {}
      } else {
        const defaultEvents: CoupleEvent[] = [
          {
            id: 'e-1',
            coupleId: 'demo-couple-id',
            title: 'Hẹn hò xem phim',
            eventDate: '2026-06-07',
            eventTime: '19:00',
            location: 'CGV Vincom',
            description: 'Xem phim Doraemon mới ra rạp, sau đó đi ăn kem bơ.',
            createdAt: new Date().toISOString()
          }
        ];
        setCoupleEvents(defaultEvents);
        demoStorage['demo_couple_events'] = JSON.stringify(defaultEvents);
      }
      return;
    }

    if (!coupleId) return;
    try {
      const list = await eventService.fetchEvents(coupleId);
      setCoupleEvents(list);
    } catch {}
  };

  const loadPlans = async () => {
    if (isDemoMode) {
      const saved = demoStorage['demo_milestone_plans'];
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
        demoStorage['demo_milestone_plans'] = JSON.stringify(mockPlans);
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
      demoStorage['demo_milestone_plans'] = JSON.stringify(updatedList);
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
      demoStorage['demo_milestone_plans'] = JSON.stringify(updatedList);
    } else {
      await planService.deletePlan(planId);
      setPlans(prev => prev.filter(p => p.id !== planId));
    }
  };

  useEffect(() => {
    if (isReady) {
      loadCustomMilestones();
      loadCoupleEvents();
      loadPlans();
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

  const handleAddCoupleEvent = async () => {
    if (!eventTitle.trim() || !eventDate || !eventTime || !eventLocation) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ tiêu đề, ngày, giờ và địa điểm.');
      return;
    }

    setIsAddingEvent(true);
    const newEventData = {
      coupleId: coupleId || 'demo-couple-id',
      title: eventTitle.trim(),
      eventDate,
      eventTime,
      location: eventLocation.trim(),
      description: eventDescription.trim(),
    };

    try {
      if (isDemoMode) {
        const id = `e-${Date.now()}`;
        const updated = [{ id, createdAt: new Date().toISOString(), ...newEventData } as CoupleEvent, ...coupleEvents];
        setCoupleEvents(updated);
        demoStorage['demo_couple_events'] = JSON.stringify(updated);
        Alert.alert('Thành công', 'Đã lưu hoạt động (Demo)');
      } else {
        await eventService.createEvent(newEventData);
        Alert.alert('Thành công', 'Đã lưu hoạt động');
        await loadCoupleEvents();
      }
      setEventTitle('');
      setEventDate('');
      setEventTime('');
      setEventLocation('');
      setEventDescription('');
      setIsOpenAddEventModal(false);
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu hoạt động.');
    }
    setIsAddingEvent(false);
  };

  const handleDeleteCoupleEvent = async (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa hoạt động này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            if (isDemoMode) {
              const updated = coupleEvents.filter(e => e.id !== id);
              setCoupleEvents(updated);
              demoStorage['demo_couple_events'] = JSON.stringify(updated);
            } else {
              await eventService.deleteEvent(id);
              await loadCoupleEvents();
            }
          } catch {
            Alert.alert('Lỗi', 'Không thể xóa hoạt động.');
          }
        }
      }
    ]);
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

        {/* Daily Couple Events Section */}
        <View style={[styles.sectionFrame, { marginBottom: 20 }]}>
          <View style={[styles.sectionHeaderBar, { backgroundColor: 'rgba(0, 184, 148, 0.04)' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Heart size={15} color={AppTheme.colorSecondary} fill={AppTheme.colorSecondary} />
              <Text style={styles.sectionHeaderTitle}>Hoạt động & Chuyến đi</Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsOpenAddEventModal(true)}
              style={styles.syncBtn}
            >
              <Text style={styles.syncBtnText}>+ Thêm</Text>
            </TouchableOpacity>
          </View>

          {coupleEvents.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={styles.descText}>Chưa có hoạt động hay chuyến đi nào được lưu.</Text>
            </View>
          ) : (
            <ScrollView nestedScrollEnabled style={{ maxHeight: 300 }} contentContainerStyle={{ padding: 12 }}>
              {coupleEvents.map((event, idx) => (
                <View key={`event-${idx}`} style={styles.itemCard}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={styles.itemTitle}>{event.title}</Text>
                    <Text style={styles.itemDate}>
                      📅 {event.eventDate} lúc {event.eventTime}
                    </Text>
                    <Text style={[styles.descText, { marginTop: 4, fontWeight: '700' }]}>
                      📍 {event.location}
                    </Text>
                    {event.description ? (
                      <Text style={[styles.descText, { marginTop: 2 }]}>{event.description}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteCoupleEvent(event.id!)}
                    style={{ padding: 4 }}
                  >
                    <Trash2 size={18} color={AppTheme.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
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
              {upcoming.slice(0, upcomingLimit).map((item, idx) => {
                const mKey = getMilestoneKey(item);
                const isExpanded = expandedKey === mKey;
                return (
                  <View key={`up-${idx}`} style={[styles.itemCard, { flexDirection: 'column', alignItems: 'stretch' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
                        
                        {/* Plan Toggle Button */}
                        <TouchableOpacity
                          onPress={() => setExpandedKey(isExpanded ? null : mKey)}
                          style={{
                            marginTop: 6,
                            alignSelf: 'flex-start',
                            backgroundColor: 'rgba(255, 101, 132, 0.08)',
                            borderWidth: 1,
                            borderColor: 'rgba(255, 101, 132, 0.2)',
                            borderRadius: 12,
                            paddingVertical: 4,
                            paddingHorizontal: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Compass size={12} color={AppTheme.colorPrimary} />
                          <Text style={{ fontSize: 10, fontWeight: '800', color: AppTheme.colorPrimary }}>
                            Kế hoạch ăn chơi
                          </Text>
                          {isExpanded ? (
                            <ChevronUp size={10} color={AppTheme.colorPrimary} />
                          ) : (
                            <ChevronDown size={10} color={AppTheme.colorPrimary} />
                          )}
                        </TouchableOpacity>
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

                    {/* Expanded Plan Section */}
                    {isExpanded && (
                      <View style={{ marginTop: 10, borderTopWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(61, 47, 61, 0.15)', paddingTop: 8 }}>
                        {/* plans list */}
                        <View style={{ marginBottom: 6 }}>
                          {plans.filter(p => p.milestoneTitle === item.title).length === 0 ? (
                            <Text style={{ fontSize: 11, color: AppTheme.textSecondary, fontStyle: 'italic', textAlign: 'center', marginVertical: 6 }}>
                              Chưa có kế hoạch cho mốc này 🥺
                            </Text>
                          ) : (
                            plans.filter(p => p.milestoneTitle === item.title).map(plan => (
                              <View key={plan.id} style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: AppTheme.bgPrimary,
                                borderWidth: 1,
                                borderColor: 'rgba(61, 47, 61, 0.1)',
                                borderRadius: 8,
                                paddingVertical: 6,
                                paddingHorizontal: 10,
                                marginBottom: 4,
                              }}>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: AppTheme.textPrimary, flex: 1 }}>
                                  {plan.category === 'go' ? '🚗 Đi đâu: ' : plan.category === 'eat' ? '🍔 Ăn gì: ' : '🎮 Chơi gì: '}
                                  <Text style={{ fontWeight: '600', color: AppTheme.textSecondary }}>{plan.content}</Text>
                                </Text>
                                <TouchableOpacity onPress={() => handleDeletePlan(plan.id!)} style={{ padding: 4 }}>
                                  <Trash2 size={13} color={AppTheme.colorWarning} />
                                </TouchableOpacity>
                              </View>
                            ))
                          )}
                        </View>

                        {/* category selector */}
                        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                          {(['go', 'eat', 'play'] as const).map(cat => (
                            <TouchableOpacity
                              key={cat}
                              onPress={() => setNewPlanCategory(cat)}
                              style={{
                                flex: 1,
                                paddingVertical: 6,
                                borderWidth: 1.2,
                                borderRadius: 8,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: newPlanCategory === cat ? 'rgba(255, 101, 132, 0.1)' : AppTheme.bgCard,
                                borderColor: newPlanCategory === cat ? AppTheme.colorPrimary : 'rgba(61, 47, 61, 0.2)',
                              }}
                            >
                              <Text style={{ fontSize: 10, fontWeight: '800', color: newPlanCategory === cat ? AppTheme.colorPrimary : AppTheme.textSecondary }}>
                                {cat === 'go' ? '🚗 Đi đâu' : cat === 'eat' ? '🍔 Ăn gì' : '🎮 Chơi gì'}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* Input and add button */}
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TextInput
                            value={newPlanContent}
                            onChangeText={setNewPlanContent}
                            placeholder="Kế hoạch: Ăn uống, vui chơi..."
                            placeholderTextColor="#999"
                            style={{
                              flex: 1,
                              borderWidth: 1.2,
                              borderColor: AppTheme.borderColor,
                              borderRadius: 8,
                              backgroundColor: AppTheme.bgPrimary,
                              paddingVertical: 6,
                              paddingHorizontal: 10,
                              fontSize: 12,
                              color: AppTheme.textPrimary,
                              fontWeight: '600',
                            }}
                          />
                          <TouchableOpacity
                            onPress={() => handleAddPlan(item.title, item.id)}
                            disabled={isAddingPlan}
                            style={{
                              backgroundColor: AppTheme.colorPrimary,
                              borderWidth: 1.2,
                              borderColor: AppTheme.borderColor,
                              borderRadius: 8,
                              paddingHorizontal: 12,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ color: AppTheme.borderColor, fontWeight: '800', fontSize: 12 }}>
                              {isAddingPlan ? '...' : '+ Thêm'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
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
              {passed.map((item, idx) => {
                const mKey = getMilestoneKey(item);
                const isExpanded = expandedKey === mKey;
                return (
                  <View key={`pass-${idx}`} style={[styles.itemCard, styles.passedItemCard, { flexDirection: 'column', alignItems: 'stretch' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
                        
                        {/* Plan Toggle Button */}
                        <TouchableOpacity
                          onPress={() => setExpandedKey(isExpanded ? null : mKey)}
                          style={{
                            marginTop: 6,
                            alignSelf: 'flex-start',
                            backgroundColor: 'rgba(0, 184, 148, 0.08)',
                            borderWidth: 1,
                            borderColor: 'rgba(0, 184, 148, 0.2)',
                            borderRadius: 12,
                            paddingVertical: 4,
                            paddingHorizontal: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Compass size={12} color={AppTheme.colorSecondary} />
                          <Text style={{ fontSize: 10, fontWeight: '800', color: AppTheme.colorSecondary }}>
                            Lịch sử ăn chơi
                          </Text>
                          {isExpanded ? (
                            <ChevronUp size={10} color={AppTheme.colorSecondary} />
                          ) : (
                            <ChevronDown size={10} color={AppTheme.colorSecondary} />
                          )}
                        </TouchableOpacity>
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

                    {/* Expanded Plan Section */}
                    {isExpanded && (
                      <View style={{ marginTop: 10, borderTopWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(61, 47, 61, 0.15)', paddingTop: 8 }}>
                        {/* plans list */}
                        <View style={{ marginBottom: 6 }}>
                          {plans.filter(p => p.milestoneTitle === item.title).length === 0 ? (
                            <Text style={{ fontSize: 11, color: AppTheme.textSecondary, fontStyle: 'italic', textAlign: 'center', marginVertical: 6 }}>
                              Chưa có lịch sử hoạt động 🥺
                            </Text>
                          ) : (
                            plans.filter(p => p.milestoneTitle === item.title).map(plan => (
                              <View key={plan.id} style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: AppTheme.bgPrimary,
                                borderWidth: 1,
                                borderColor: 'rgba(61, 47, 61, 0.1)',
                                borderRadius: 8,
                                paddingVertical: 6,
                                paddingHorizontal: 10,
                                marginBottom: 4,
                              }}>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: AppTheme.textPrimary, flex: 1 }}>
                                  {plan.category === 'go' ? '🚗 Đã đi: ' : plan.category === 'eat' ? '🍔 Đã ăn: ' : '🎮 Đã chơi: '}
                                  <Text style={{ fontWeight: '600', color: AppTheme.textSecondary }}>{plan.content}</Text>
                                </Text>
                                <TouchableOpacity onPress={() => handleDeletePlan(plan.id!)} style={{ padding: 4 }}>
                                  <Trash2 size={13} color={AppTheme.colorWarning} />
                                </TouchableOpacity>
                              </View>
                            ))
                          )}
                        </View>

                        {/* category selector */}
                        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                          {(['go', 'eat', 'play'] as const).map(cat => (
                            <TouchableOpacity
                              key={cat}
                              onPress={() => setNewPlanCategory(cat)}
                              style={{
                                flex: 1,
                                paddingVertical: 6,
                                borderWidth: 1.2,
                                borderRadius: 8,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: newPlanCategory === cat ? 'rgba(255, 101, 132, 0.1)' : AppTheme.bgCard,
                                borderColor: newPlanCategory === cat ? AppTheme.colorPrimary : 'rgba(61, 47, 61, 0.2)',
                              }}
                            >
                              <Text style={{ fontSize: 10, fontWeight: '800', color: newPlanCategory === cat ? AppTheme.colorPrimary : AppTheme.textSecondary }}>
                                {cat === 'go' ? '🚗 Đi đâu' : cat === 'eat' ? '🍔 Ăn gì' : '🎮 Chơi gì'}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* Input and add button */}
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TextInput
                            value={newPlanContent}
                            onChangeText={setNewPlanContent}
                            placeholder="Kế hoạch: Ăn uống, vui chơi..."
                            placeholderTextColor="#999"
                            style={{
                              flex: 1,
                              borderWidth: 1.2,
                              borderColor: AppTheme.borderColor,
                              borderRadius: 8,
                              backgroundColor: AppTheme.bgPrimary,
                              paddingVertical: 6,
                              paddingHorizontal: 10,
                              fontSize: 12,
                              color: AppTheme.textPrimary,
                              fontWeight: '600',
                            }}
                          />
                          <TouchableOpacity
                            onPress={() => handleAddPlan(item.title, item.id)}
                            disabled={isAddingPlan}
                            style={{
                              backgroundColor: AppTheme.colorPrimary,
                              borderWidth: 1.2,
                              borderColor: AppTheme.borderColor,
                              borderRadius: 8,
                              paddingHorizontal: 12,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ color: AppTheme.borderColor, fontWeight: '800', fontSize: 12 }}>
                              {isAddingPlan ? '...' : '+ Thêm'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
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

      {/* Add Couple Event Modal */}
      {isOpenAddEventModal && (
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ justifyContent: 'center', flexGrow: 1, paddingVertical: 40 }}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeader}>Thêm hoạt động mới</Text>

              <Text style={styles.label}>Tên hoạt động</Text>
              <TextInput
                value={eventTitle}
                onChangeText={setEventTitle}
                placeholder="Ví dụ: Đi xem phim, Ăn tối..."
                placeholderTextColor="#666"
                style={styles.input}
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Ngày diễn ra (YYYY-MM-DD)</Text>
              <TextInput
                value={eventDate}
                onChangeText={setEventDate}
                placeholder="Ví dụ: 2026-06-08"
                placeholderTextColor="#666"
                style={styles.input}
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Giờ diễn ra (HH:MM)</Text>
              <TextInput
                value={eventTime}
                onChangeText={setEventTime}
                placeholder="Ví dụ: 19:30"
                placeholderTextColor="#666"
                style={styles.input}
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Địa điểm/Vị trí</Text>
              <TextInput
                value={eventLocation}
                onChangeText={setEventLocation}
                placeholder="Ví dụ: Lotte Cinema Tây Hồ"
                placeholderTextColor="#666"
                style={styles.input}
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Mô tả chi tiết</Text>
              <TextInput
                value={eventDescription}
                onChangeText={setEventDescription}
                placeholder="Ghi chú chi tiết hoạt động hôm đó..."
                placeholderTextColor="#666"
                multiline
                style={[styles.input, { height: 80, textAlignVertical: 'top', marginBottom: 20 }]}
              />

              <View style={styles.rowEnd}>
                <TouchableOpacity
                  onPress={() => setIsOpenAddEventModal(false)}
                  style={[styles.actionBtn, styles.secondaryActionBtn]}
                >
                  <Text style={styles.secondaryActionBtnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddCoupleEvent}
                  disabled={isAddingEvent}
                  style={[styles.actionBtn, { marginLeft: 8 }]}
                >
                  <Text style={styles.actionBtnText}>{isAddingEvent ? 'Đang lưu...' : 'Lưu'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
