import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView,
  Linking, Alert, Platform, InteractionManager, ActivityIndicator, Animated, Image, Modal
} from 'react-native';
import { useRelationship, demoStorage } from '../core/RelationshipContext';
import { MilestoneService, CoupleEventService, MilestonePlanService, TravelService } from '@forever-days/core';
import type { CoupleEvent, MilestonePlan, TravelLocation, TravelTrip } from '@forever-days/core';
import {
  Calendar, Trash2, Heart, Clock, CheckCircle2, Compass, ChevronDown, ChevronUp,
  MapPin, Plane, Globe, Pencil
} from 'lucide-react-native';
import * as ExpoCalendar from 'expo-calendar';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LoveUtils, MilestoneItem } from '../core/loveUtils';

let cachedCoupleId: string | null = null;
let cachedMilestones: MilestoneItem[] | null = null;

// ─── Theme ───────────────────────────────────────────────────────────────────
const T = {
  bgPrimary: '#fff6f7',
  bgCard: '#ffffff',
  border: '#3d2f3d',
  textPrimary: '#3d2f3d',
  textSecondary: '#856a85',
  coral: '#ff6584',
  mint: '#00b894',
  warning: '#ee5253',
  bw: 2.2,
};

// ─── Pill Tab (inline styles to avoid forward-reference of `styles`) ──────────
const pillTabBase = { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 2.2, alignItems: 'center' as const, justifyContent: 'center' as const };
const PillTab: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({ label, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[pillTabBase, active
      ? { backgroundColor: '#ff6584', borderColor: '#3d2f3d', shadowColor: '#3d2f3d', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }
      : { backgroundColor: '#fff6f7', borderColor: 'rgba(61,47,61,0.25)' }
    ]}
  >
    <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.3, color: active ? '#3d2f3d' : '#856a85' }}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const MilestonesScreen: React.FC = () => {
  const { anniversaryDate, coupleId, isDemoMode } = useRelationship();

  // ── Tab ──────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'milestones' | 'travel'>('milestones');

  // ── Milestone state ──────────────────────────────────────────────────────────
  const [customMilestones, setCustomMilestones] = useState<MilestoneItem[]>([]);
  const [plans, setPlans] = useState<MilestonePlan[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [newPlanCategory, setNewPlanCategory] = useState<'go' | 'eat' | 'play'>('go');
  const [newPlanContent, setNewPlanContent] = useState('');
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [upcomingLimit, setUpcomingLimit] = useState(10);

  // ── Couple Events state ───────────────────────────────────────────────────────
  const [coupleEvents, setCoupleEvents] = useState<CoupleEvent[]>([]);
  const [isOpenAddEventModal, setIsOpenAddEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  // ── Travel state ─────────────────────────────────────────────────────────────
  const [locations, setLocations] = useState<TravelLocation[]>([]);
  const [trips, setTrips] = useState<TravelTrip[]>([]);
  const [isOpenAddTripModal, setIsOpenAddTripModal] = useState(false);
  const [isAddingTrip, setIsAddingTrip] = useState(false);
  const [tripTitle, setTripTitle] = useState('');
  const [tripStartDate, setTripStartDate] = useState('');
  const [tripEndDate, setTripEndDate] = useState('');
  const [tripLocationId, setTripLocationId] = useState<number | ''>('');
  const [tripDescription, setTripDescription] = useState('');
  const [tripFilter, setTripFilter] = useState<'all' | 'domestic' | 'international'>('all');
  const [tripSort, setTripSort] = useState<'desc' | 'asc'>('desc');
  const [tripViewMode, setTripViewMode] = useState<'list' | 'group'>('list');
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  const [isOpenLocationPicker, setIsOpenLocationPicker] = useState(false);
  const [showTripStartDatePicker, setShowTripStartDatePicker] = useState(false);
  const [showTripEndDatePicker, setShowTripEndDatePicker] = useState(false);
  const [isSyncMode, setIsSyncMode] = useState(false);
  const [selectedForSync, setSelectedForSync] = useState<string[]>([]);
  const [syncedEvents, setSyncedEvents] = useState<Record<string, any>>({});

  const loadSyncedEvents = async () => {
    try {
      const stored = await AsyncStorage.getItem('synced_calendar_events');
      if (stored) {
        setSyncedEvents(JSON.parse(stored));
      }
    } catch {}
  };

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [isReady, setIsReady] = useState(cachedMilestones !== null);
  const pulseScale = useRef(new Animated.Value(1)).current;

  // ── Services ─────────────────────────────────────────────────────────────────
  const milestoneService = new MilestoneService();
  const planService = new MilestonePlanService();
  const eventService = new CoupleEventService();
  const travelService = new TravelService();

  const getMilestoneKey = (item: MilestoneItem) => item.id || item.title;

  const toggleSyncSelection = (key: string) => {
    setSelectedForSync(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // ── Loading animation ─────────────────────────────────────────────────────────
  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (!isReady) {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, { toValue: 1.25, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      animLoop.start();
    }
    return () => { if (animLoop) animLoop.stop(); };
  }, [isReady]);

  useEffect(() => {
    if (isReady) return;
    const task = InteractionManager.runAfterInteractions(() => setIsReady(true));
    return () => task.cancel();
  }, [isReady]);

  // ── Data loaders ─────────────────────────────────────────────────────────────
  const loadCustomMilestones = async (forceRefresh = false) => {
    if (isDemoMode) return;
    if (!coupleId) return;
    if (!forceRefresh && cachedCoupleId === coupleId && cachedMilestones) {
      setCustomMilestones(cachedMilestones);
      return;
    }
    try {
      const dbMilestones = await milestoneService.fetchMilestones(coupleId);
      const items: MilestoneItem[] = dbMilestones.map(milestone => {
        const target = new Date(milestone.targetDate);
        target.setHours(0, 0, 0, 0);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const isPassed = target.getTime() < today.getTime();
        return { id: milestone.id, title: milestone.title, targetDate: milestone.targetDate, daysRemaining: isPassed ? 0 : diffDays, isPassed, type: 'custom' };
      });
      cachedCoupleId = coupleId;
      cachedMilestones = items;
      setCustomMilestones(items);
    } catch {}
  };

  const cleanupOldEvents = async (events: CoupleEvent[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoffTime = today.getTime() - (3 * 24 * 60 * 60 * 1000); // 3 days ago

    const validEvents: CoupleEvent[] = [];
    const eventsToDelete: string[] = [];
    
    for (const event of events) {
      if (!event.eventDate) {
        validEvents.push(event);
        continue;
      }
      const eventDate = new Date(event.eventDate);
      eventDate.setHours(0, 0, 0, 0);
      if (eventDate.getTime() <= cutoffTime) {
        eventsToDelete.push(event.id!);
      } else {
        validEvents.push(event);
      }
    }

    if (eventsToDelete.length > 0) {
      if (isDemoMode) {
        demoStorage['demo_couple_events'] = JSON.stringify(validEvents);
      } else {
        for (const id of eventsToDelete) {
          try { await eventService.deleteEvent(id); } catch {}
        }
      }
    }
    return validEvents;
  };

  const loadCoupleEvents = async () => {
    let loadedEvents: CoupleEvent[] = [];
    if (isDemoMode) {
      const saved = demoStorage['demo_couple_events'];
      let parsed = [];
      if (saved) {
        try { parsed = JSON.parse(saved); } catch {}
      }
      if (parsed.length > 0) {
        loadedEvents = parsed;
      } else {
        loadedEvents = [
          { id: 'e-1', coupleId: 'demo-couple-id', title: 'Hẹn hò xem phim', eventDate: new Date().toISOString().split('T')[0], eventTime: '19:00', location: 'CGV Vincom', description: 'Xem phim Doraemon mới ra rạp, sau đó đi ăn kem bơ.', createdAt: new Date().toISOString() }
        ];
        demoStorage['demo_couple_events'] = JSON.stringify(loadedEvents);
      }
    } else {
      if (!coupleId) return;
      try { loadedEvents = await eventService.fetchEvents(coupleId); } catch {}
    }
    
    loadedEvents = await cleanupOldEvents(loadedEvents);
    setCoupleEvents(loadedEvents);
  };

  const loadPlans = async () => {
    if (isDemoMode) {
      const saved = demoStorage['demo_milestone_plans'];
      if (saved) {
        try { setPlans(JSON.parse(saved)); } catch {}
      } else {
        const mockPlans: MilestonePlan[] = [
          { id: 'p-1', coupleId: 'demo-couple-id', milestoneTitle: '100 Ngày Yêu Nhau', category: 'eat', content: 'Ăn tối lãng mạn tại quán nướng gần hồ' },
          { id: 'p-2', coupleId: 'demo-couple-id', milestoneTitle: '100 Ngày Yêu Nhau', category: 'go', content: 'Đi dạo quanh hồ Tây' },
          { id: 'p-3', coupleId: 'demo-couple-id', milestoneTitle: '1000 Ngày Yêu Nhau', category: 'go', content: 'Đi du lịch Đà Lạt cùng nhau' },
          { id: 'p-4', coupleId: 'demo-couple-id', milestoneTitle: '1000 Ngày Yêu Nhau', category: 'eat', content: 'Ăn lẩu gà lá é' },
          { id: 'p-5', coupleId: 'demo-couple-id', milestoneTitle: '1000 Ngày Yêu Nhau', category: 'play', content: 'Chơi bắn cung, trượt phao cỏ' },
        ];
        setPlans(mockPlans);
        demoStorage['demo_milestone_plans'] = JSON.stringify(mockPlans);
      }
      return;
    }
    if (!coupleId) return;
    try { setPlans(await planService.fetchPlans(coupleId)); } catch {}
  };

  const loadTravelData = async () => {
    try {
      if (isDemoMode) {
        const mockLocations: TravelLocation[] = [
          { id: 1, name: 'Đà Lạt', type: 'province', country: 'Việt Nam', image_url: 'https://images.unsplash.com/photo-1517427677505-610b42f1a601?auto=format&fit=crop&q=80&w=800' },
          { id: 2, name: 'Hà Nội', type: 'province', country: 'Việt Nam', image_url: 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&q=80&w=800' },
          { id: 3, name: 'Thái Lan', type: 'country', country: 'Thái Lan', image_url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&q=80&w=800' },
        ];
        setLocations(mockLocations);
        const saved = demoStorage['demo_travel_trips'];
        let loadedTrips: TravelTrip[] = [];
        if (saved) {
          try { loadedTrips = JSON.parse(saved); } catch {}
        }
        if (loadedTrips.length === 0) {
          loadedTrips = [{
            id: 'trip-1', couple_id: 'demo-couple-id', location_id: 1, title: 'Nghỉ dưỡng Đà Lạt 3N2Đ',
            start_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
            end_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
            description: 'Đi ăn lẩu bò, đi săn mây', location: mockLocations[0],
          }];
          demoStorage['demo_travel_trips'] = JSON.stringify(loadedTrips);
        }
        setTrips(loadedTrips);
      } else {
        const locs = await travelService.fetchLocations();
        setLocations(locs);
        if (coupleId) {
          const dbTrips = await travelService.fetchTrips(coupleId);
          setTrips(dbTrips);
        }
      }
    } catch {}
  };


  useEffect(() => {
    if (isReady) {
      loadCustomMilestones();
      loadCoupleEvents();
      loadPlans();
      loadTravelData();
      loadSyncedEvents();
    }
  }, [coupleId, isDemoMode, isReady]);

  // ── Milestone handlers ────────────────────────────────────────────────────────
  const handleAddMilestone = async () => {
    if (!newTitle.trim() || !newDate) return;
    const target = new Date(newDate); target.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isPassed = target.getTime() < today.getTime();
    const newItem: MilestoneItem = { title: newTitle.trim(), targetDate: newDate, daysRemaining: isPassed ? 0 : diffDays, isPassed, type: 'custom' };
    const updated = [...customMilestones, newItem];
    setCustomMilestones(updated);
    cachedMilestones = updated;
    if (!isDemoMode && coupleId) await milestoneService.createMilestone(coupleId, newTitle.trim(), newDate, 'custom');
    setNewTitle(''); setNewDate(''); setIsOpenAddModal(false);
  };

  const handleDeleteMilestone = async (item: MilestoneItem) => {
    const updated = customMilestones.filter(m => m.title !== item.title || m.targetDate !== item.targetDate);
    setCustomMilestones(updated);
    if (!isDemoMode) cachedMilestones = updated;
    if (!isDemoMode && item.id) await milestoneService.deleteMilestone(item.id);
  };

  const handleAddPlan = async (milestoneTitle: string, milestoneId?: string) => {
    if (!newPlanContent.trim()) return;
    setIsAddingPlan(true);
    const content = newPlanContent.trim();
    const category = newPlanCategory;
    if (isDemoMode) {
      const np: MilestonePlan = { id: `plan-${Date.now()}`, coupleId: 'demo-couple-id', milestoneId, milestoneTitle, category, content };
      const updatedList = [...plans, np];
      setPlans(updatedList);
      demoStorage['demo_milestone_plans'] = JSON.stringify(updatedList);
    } else if (coupleId) {
      const created = await planService.createPlan(coupleId, milestoneTitle, category, content, milestoneId);
      if (created) setPlans(prev => [...prev, created]); else await loadPlans();
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

  // ── Event handlers ────────────────────────────────────────────────────────────
  const handleAddCoupleEvent = async () => {
    if (!eventTitle.trim() || !eventDate) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ tiêu đề và ngày.');
      return;
    }
    setIsAddingEvent(true);
    const newEventData = { coupleId: coupleId || 'demo-couple-id', title: eventTitle.trim(), eventDate, eventTime, location: eventLocation.trim(), description: eventDescription.trim() };
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
      setEventTitle(''); setEventDate(''); setEventTime(''); setEventLocation(''); setEventDescription('');
      setIsOpenAddEventModal(false);
    } catch { Alert.alert('Lỗi', 'Không thể lưu hoạt động.'); }
    setIsAddingEvent(false);
  };

  const handleDeleteCoupleEvent = async (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa hoạt động này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive', onPress: async () => {
          try {
            if (isDemoMode) {
              const updated = coupleEvents.filter(e => e.id !== id);
              setCoupleEvents(updated);
              demoStorage['demo_couple_events'] = JSON.stringify(updated);
            } else { await eventService.deleteEvent(id); await loadCoupleEvents(); }
          } catch { Alert.alert('Lỗi', 'Không thể xóa hoạt động.'); }
        }
      }
    ]);
  };

  // ── Trip handlers ─────────────────────────────────────────────────────────────
  const openAddTrip = () => {
    setTripTitle(''); setTripStartDate(''); setTripEndDate(''); setTripLocationId(''); setTripDescription(''); setEditingTripId(null);
    setIsOpenAddTripModal(true);
  };

  const handleEditTrip = (trip: TravelTrip) => {
    setTripTitle(trip.title); setTripStartDate(trip.start_date); setTripEndDate(trip.end_date);
    setTripLocationId(trip.location_id); setTripDescription(trip.description || '');
    setEditingTripId(trip.id || null);
    setIsOpenAddTripModal(true);
  };

  const confirmDeleteTrip = async () => {
    if (!tripToDelete) return;
    if (isDemoMode) {
      const updatedList = trips.filter(t => t.id !== tripToDelete);
      setTrips(updatedList);
      demoStorage['demo_travel_trips'] = JSON.stringify(updatedList);
    } else {
      await travelService.deleteTrip(tripToDelete);
      await loadTravelData();
    }
    setTripToDelete(null);
  };

  const handleDeleteTrip = (id: string) => {
    setTripToDelete(id);
  };

  const handleAddTrip = async () => {
    if (!tripTitle.trim() || !tripStartDate || !tripEndDate || !tripLocationId) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ tiêu đề, địa điểm và ngày.');
      return;
    }
    setIsAddingTrip(true);
    const newTripData = { couple_id: coupleId || 'demo-couple-id', location_id: Number(tripLocationId), title: tripTitle.trim(), start_date: tripStartDate, end_date: tripEndDate, description: tripDescription.trim() || undefined };
    if (editingTripId) {
      if (isDemoMode) {
        const loc = locations.find(l => l.id === Number(tripLocationId));
        const updatedList = trips.map(t => t.id === editingTripId ? { ...t, ...newTripData, location: loc } : t);
        setTrips(updatedList);
        demoStorage['demo_travel_trips'] = JSON.stringify(updatedList);
      } else { await travelService.updateTrip(editingTripId, newTripData); await loadTravelData(); }
    } else {
      if (isDemoMode) {
        const loc = locations.find(l => l.id === Number(tripLocationId));
        const tripItem: TravelTrip = { id: `trip-${Date.now()}`, ...newTripData, location: loc };
        const updatedList = [tripItem, ...trips];
        setTrips(updatedList);
        demoStorage['demo_travel_trips'] = JSON.stringify(updatedList);
      } else { await travelService.createTrip(newTripData); await loadTravelData(); }
    }
    setIsOpenAddTripModal(false);
    setIsAddingTrip(false);
  };



  // ── Calendar helpers ─────────────────────────────────────────────────────────
  const handleSyncCalendar = async () => {
    if (!isSyncMode) {
      setIsSyncMode(true);
      return;
    }
    
    if (selectedForSync.length === 0) {
      setIsSyncMode(false);
      return;
    }

    setIsSyncing(true);

    try {
      const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền lịch bị từ chối', 'Ứng dụng cần quyền truy cập lịch để đồng bộ tự động.');
        setIsSyncing(false);
        return;
      }

      let defaultCalendarId: string | null = null;
      if (Platform.OS === 'ios') {
        const cal = await ExpoCalendar.getDefaultCalendarAsync();
        defaultCalendarId = cal ? cal.id : null;
      } else {
        const cals = await ExpoCalendar.getCalendarsAsync(ExpoCalendar.EntityTypes.EVENT);
        const target = cals.find(c => c.isPrimary) || cals.find(c => c.allowsModifications) || cals[0];
        defaultCalendarId = target ? target.id : null;
      }

      if (!defaultCalendarId) {
        throw new Error('No writable calendar found');
      }

      const stored = await AsyncStorage.getItem('synced_calendar_events');
      const syncedMap = stored ? JSON.parse(stored) : {};

      for (const mKey of selectedForSync) {
        const item = upcoming.find(m => getMilestoneKey(m) === mKey);
        if (!item) continue;

        const parts = item.targetDate.split('-');
        const y = parseInt(parts[0]), m = parseInt(parts[1]) - 1, d = parseInt(parts[2]);
        const startDate = new Date(Date.UTC(y, m, d));
        const endDate = new Date(Date.UTC(y, m, d + 1));
        const details = {
          title: item.title,
          startDate,
          endDate,
          allDay: true,
          timeZone: 'UTC'
        };

        const existingEventId = syncedMap[mKey];
        if (existingEventId) {
          try {
            await ExpoCalendar.updateEventAsync(existingEventId, details);
          } catch {
            const newEventId = await ExpoCalendar.createEventAsync(defaultCalendarId, details);
            syncedMap[mKey] = newEventId;
          }
        } else {
          const newEventId = await ExpoCalendar.createEventAsync(defaultCalendarId, details);
          syncedMap[mKey] = newEventId;
        }
      }

      await AsyncStorage.setItem('synced_calendar_events', JSON.stringify(syncedMap));
      await loadSyncedEvents();

      setIsSyncMode(false);
      setSelectedForSync([]);
      setShowSyncSuccess(true);
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi đồng bộ', 'Không thể đồng bộ các cột mốc vào lịch.');
    } finally {
      setIsSyncing(false);
    }
  };

  const getGoogleCalendarUrl = (title: string, dateStr: string) => {
    const clean = dateStr.replace(/-/g, '');
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    d.setDate(d.getDate() + 1);
    const end = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${clean}/${end}`;
  };

  const parseSafeDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0]), m = parseInt(parts[1]) - 1, d = parseInt(parts[2]);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m, d);
    }
    const p = new Date(dateStr);
    return isNaN(p.getTime()) ? null : p;
  };

  const handleAddToCalendar = async (title: string, dateStr: string) => {
    try {
      const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền lịch bị từ chối', 'Ứng dụng sẽ mở Google Calendar để bạn tự thêm.', [
          { text: 'Mở Trình duyệt', onPress: () => Linking.openURL(getGoogleCalendarUrl(title, dateStr)) },
          { text: 'Đóng', style: 'cancel' }
        ]);
        return;
      }
      const parts = dateStr.split('-');
      const y = parseInt(parts[0]), m = parseInt(parts[1]) - 1, d = parseInt(parts[2]);
      const startDate = new Date(Date.UTC(y, m, d));
      const endDate = new Date(Date.UTC(y, m, d + 1));
      let defaultCalendarId: string | null = null;
      if (Platform.OS === 'ios') {
        const cal = await ExpoCalendar.getDefaultCalendarAsync();
        defaultCalendarId = cal ? cal.id : null;
      } else {
        const cals = await ExpoCalendar.getCalendarsAsync(ExpoCalendar.EntityTypes.EVENT);
        const target = cals.find(c => c.isPrimary) || cals.find(c => c.allowsModifications) || cals[0];
        defaultCalendarId = target ? target.id : null;
      }
      if (!defaultCalendarId) throw new Error('No writable calendar found');
      await ExpoCalendar.createEventAsync(defaultCalendarId, { title, startDate, endDate, allDay: true, timeZone: 'UTC' });
      Alert.alert('Thành công', `Đã thêm "${title}" vào lịch điện thoại của bạn.`);
    } catch {
      Alert.alert('Lỗi lịch', 'Không thể tự động thêm vào lịch. Bạn có muốn mở Google Calendar không?', [
        { text: 'Mở Trình duyệt', onPress: () => Linking.openURL(getGoogleCalendarUrl(title, dateStr)) },
        { text: 'Đóng', style: 'cancel' }
      ]);
    }
  };

  // ── Formatters ────────────────────────────────────────────────────────────────
  const getDayName = (date: Date) => ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][date.getDay()];

  const formatDateString = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${getDayName(date)}, ${date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  };

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
  };

  const getTripDuration = (start: string, end: string) => {
    if (!start || !end) return '';
    const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
    if (diff <= 0) return '';
    return diff === 1 ? '(Trong ngày)' : `(${diff} ngày ${diff - 1} đêm)`;
  };

  // ── Render Milestone Item ───────────────────────────────────────────────────
  const renderMilestoneItem = (item: MilestoneItem, idx: number, isPast: boolean) => {
    const mKey = getMilestoneKey(item);
    const isExpanded = expandedKey === mKey;
    const planColor = isPast ? T.mint : T.coral;
    const planBg = isPast ? 'rgba(0,184,148,0.08)' : 'rgba(255,101,132,0.08)';
    const planBorder = isPast ? 'rgba(0,184,148,0.2)' : 'rgba(255,101,132,0.2)';
    const planLabel = isPast ? 'Lịch sử ăn chơi' : 'Kế hoạch ăn chơi';
    return (
      <View key={`${isPast ? 'pass' : 'up'}-${idx}`} style={[styles.itemCard, isPast && styles.passedItemCard, { flexDirection: 'column', alignItems: 'stretch' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {isSyncMode && !isPast && (
            <TouchableOpacity 
              onPress={() => toggleSyncSelection(mKey)}
              style={{
                marginRight: 10,
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: T.coral,
                backgroundColor: selectedForSync.includes(mKey) ? T.coral : 'transparent',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {selectedForSync.includes(mKey) && (
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>✓</Text>
              )}
            </TouchableOpacity>
          )}
          <View style={{ flex: 1, paddingRight: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
              <Text style={[styles.itemTitle, isPast && styles.passedTitle, { flexShrink: 1 }]}>{item.title}</Text>
              {syncedEvents[mKey] && (
                <View style={{ backgroundColor: 'rgba(0,184,148,0.1)', borderWidth: 1, borderColor: 'rgba(0,184,148,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: T.mint }}>📅 Đã đồng bộ</Text>
                </View>
              )}
              {item.yearLabel && (
                <View style={isPast ? styles.yearBadgePassed : styles.yearBadge}>
                  <Text style={isPast ? styles.yearBadgeTextPassed : styles.yearBadgeText}>{item.yearLabel}</Text>
                </View>
              )}
            </View>
            <Text style={styles.itemDate}>{formatDateString(item.targetDate)}</Text>
            <TouchableOpacity
              onPress={() => setExpandedKey(isExpanded ? null : mKey)}
              style={{ marginTop: 6, alignSelf: 'flex-start', backgroundColor: planBg, borderWidth: 1, borderColor: planBorder, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Compass size={12} color={planColor} />
              <Text style={{ fontSize: 10, fontWeight: '800', color: planColor }}>{planLabel}</Text>
              {isExpanded ? <ChevronUp size={10} color={planColor} /> : <ChevronDown size={10} color={planColor} />}
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {!isPast && (
              <View style={{ marginRight: 8, alignItems: 'flex-end' }}>
                <Text style={styles.descText}>Còn lại</Text>
                <Text style={styles.remainingText}>{item.daysRemaining} ngày</Text>
              </View>
            )}
            {isPast && (
              <View style={[styles.passedBadge, { marginRight: 8 }]}>
                <Text style={styles.passedBadgeText}>✓ Đã qua</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => handleAddToCalendar(item.title, item.targetDate)} style={{ marginRight: 4, padding: 4 }}>
              <Calendar size={18} color={T.textSecondary} />
            </TouchableOpacity>
            {item.type === 'custom' && (
              <TouchableOpacity onPress={() => handleDeleteMilestone(item)} style={{ padding: 4 }}>
                <Trash2 size={18} color={T.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Expanded Plan Section */}
        {isExpanded && (
          <View style={{ marginTop: 10, borderTopWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(61,47,61,0.15)', paddingTop: 8 }}>
            {/* Plans by category */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
              {(['go', 'eat', 'play'] as const).map(cat => {
                const catPlans = plans.filter(p => p.milestoneTitle === item.title && p.category === cat);
                const catLabel = cat === 'go' ? '🚗 Đi đâu' : cat === 'eat' ? '🍔 Ăn gì' : '🎮 Chơi gì';
                return (
                  <View key={cat} style={{ flex: 1, backgroundColor: T.bgCard, borderWidth: 1, borderColor: 'rgba(61,47,61,0.15)', borderRadius: 10, padding: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: cat === 'go' ? T.coral : cat === 'eat' ? T.mint : T.textPrimary, marginBottom: 6 }}>{catLabel}</Text>
                    {catPlans.length === 0 ? (
                      <Text style={{ fontSize: 10, color: T.textSecondary, fontStyle: 'italic' }}>Chưa có</Text>
                    ) : (
                      catPlans.map(plan => (
                        <View key={plan.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: T.bgPrimary, borderWidth: 1, borderColor: 'rgba(61,47,61,0.08)', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 6, marginBottom: 3 }}>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: T.textPrimary, flex: 1 }} numberOfLines={2}>{plan.content}</Text>
                          <TouchableOpacity onPress={() => handleDeletePlan(plan.id!)} style={{ padding: 2 }}>
                            <Trash2 size={11} color={T.warning} />
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </View>
                );
              })}
            </View>

            {/* Category selector */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
              {(['go', 'eat', 'play'] as const).map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setNewPlanCategory(cat)}
                  style={{ flex: 1, paddingVertical: 6, borderWidth: 1.2, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: newPlanCategory === cat ? 'rgba(255,101,132,0.1)' : T.bgCard, borderColor: newPlanCategory === cat ? T.coral : 'rgba(61,47,61,0.2)' }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '800', color: newPlanCategory === cat ? T.coral : T.textSecondary }}>
                    {cat === 'go' ? '🚗 Đi' : cat === 'eat' ? '🍔 Ăn' : '🎮 Chơi'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Input */}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TextInput
                value={newPlanContent}
                onChangeText={setNewPlanContent}
                placeholder="Nhập nội dung kế hoạch..."
                placeholderTextColor="#999"
                style={{ flex: 1, borderWidth: 1.2, borderColor: T.border, borderRadius: 8, backgroundColor: T.bgPrimary, paddingVertical: 6, paddingHorizontal: 10, fontSize: 12, color: T.textPrimary, fontWeight: '600' }}
              />
              <TouchableOpacity
                onPress={() => handleAddPlan(item.title, item.id)}
                disabled={isAddingPlan}
                style={{ backgroundColor: T.coral, borderWidth: 1.2, borderColor: T.border, borderRadius: 8, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: T.border, fontWeight: '800', fontSize: 12 }}>{isAddingPlan ? '...' : '+ Thêm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  // ── Trip card renderer ────────────────────────────────────────────────────────
  const renderTripCard = (trip: TravelTrip) => {
    const loc = trip.location;
    return (
      <View key={trip.id} style={styles.tripCard}>
        {/* Image */}
        <View style={{ height: 110, width: '100%', backgroundColor: 'rgba(61,47,61,0.1)', overflow: 'hidden' }}>
          {loc?.image_url ? (
            <Image source={{ uri: loc.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Plane size={24} color="rgba(133,106,133,0.5)" />
            </View>
          )}
          <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} />
          <View style={{ position: 'absolute', bottom: 6, left: 10 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }}>{loc?.name}</Text>
          </View>
          <View style={{ position: 'absolute', top: 6, right: 6 }}>
            <Text style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 9, fontWeight: '700', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 }}>
              {loc?.type === 'province' ? 'Trong nước' : 'Nước ngoài'}
            </Text>
          </View>
        </View>
        {/* Content */}
        <View style={{ padding: 10, flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: T.textPrimary, flex: 1, paddingRight: 4 }} numberOfLines={1}>{trip.title}</Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <TouchableOpacity onPress={() => handleEditTrip(trip)} style={{ padding: 4 }}>
                <Pencil size={14} color={T.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteTrip(trip.id!)} style={{ padding: 4 }}>
                <Trash2 size={14} color={T.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, backgroundColor: T.bgPrimary, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(61,47,61,0.15)' }}>
            <Calendar size={10} color={T.textSecondary} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: T.textSecondary }}>
              {formatShortDate(trip.start_date)}{trip.end_date && trip.end_date !== trip.start_date ? ` → ${formatShortDate(trip.end_date)}` : ''}
            </Text>
          </View>
          {getTripDuration(trip.start_date, trip.end_date) ? (
            <Text style={{ fontSize: 9, fontWeight: '800', color: T.coral, backgroundColor: 'rgba(255,101,132,0.1)', borderWidth: 1, borderColor: 'rgba(255,101,132,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start', marginTop: 4 }}>
              {getTripDuration(trip.start_date, trip.end_date)}
            </Text>
          ) : null}
          {trip.description ? (
            <Text style={{ fontSize: 11, color: T.textSecondary, fontStyle: 'italic', marginTop: 4 }} numberOfLines={2}>"{trip.description}"</Text>
          ) : null}
        </View>
      </View>
    );
  };

  // ── Computed ──────────────────────────────────────────────────────────────────
  const systemItems = useMemo(() => anniversaryDate ? LoveUtils.generateSystemMilestones(anniversaryDate) : [], [anniversaryDate]);
  const allMilestones = useMemo(() => [...systemItems, ...customMilestones], [systemItems, customMilestones]);
  const upcoming = useMemo(() => allMilestones.filter(m => !m.isPassed).sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()), [allMilestones]);
  const passed = useMemo(() => allMilestones.filter(m => m.isPassed).sort((a, b) => new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime()), [allMilestones]);

  const travelStats = useMemo(() => ({
    totalTrips: trips.length,
    uniqueLocations: new Set(trips.map(t => t.location_id)).size,
    domesticCount: new Set(trips.filter(t => t.location?.type === 'province').map(t => t.location_id)).size,
    internationalCount: new Set(trips.filter(t => t.location?.type === 'country').map(t => t.location_id)).size,
  }), [trips]);

  const filteredSortedTrips = useMemo(() => {
    let f = trips.filter(t => {
      if (tripFilter === 'domestic') return t.location?.type === 'province';
      if (tripFilter === 'international') return t.location?.type === 'country';
      return true;
    });
    f.sort((a, b) => {
      const ta = new Date(a.start_date).getTime(), tb = new Date(b.start_date).getTime();
      return tripSort === 'desc' ? tb - ta : ta - tb;
    });
    return f;
  }, [trips, tripFilter, tripSort]);

  const groupedTrips = useMemo(() => {
    const map = new Map<number, { location: NonNullable<(typeof trips)[0]['location']>; trips: typeof trips }>();
    filteredSortedTrips.forEach(trip => {
      if (trip.location) {
        const key = trip.location_id;
        if (!map.has(key)) map.set(key, { location: trip.location, trips: [] });
        map.get(key)!.trips.push(trip);
      }
    });
    return Array.from(map.values());
  }, [filteredSortedTrips]);

  const selectedLocation = locations.find(l => l.id === Number(tripLocationId));

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cột mốc kỷ niệm</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <PillTab label="Ngày kỷ niệm" active={activeTab === 'milestones'} onPress={() => setActiveTab('milestones')} />
        <PillTab label="Chuyến đi kỷ niệm" active={activeTab === 'travel'} onPress={() => setActiveTab('travel')} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ── TAB: MILESTONES ── */}
        {activeTab === 'milestones' && (
          <>
            {/* Upcoming */}
            <View style={styles.sectionFrame}>
              <View style={[styles.sectionHeaderBar, { backgroundColor: 'rgba(255,101,132,0.04)' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Clock size={15} color={T.coral} />
                  <Text style={styles.sectionHeaderTitle}>Kỷ niệm sắp tới</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity onPress={() => setIsOpenAddModal(true)} style={styles.smallBtn}>
                    <Text style={styles.smallBtnText}>+ Thêm</Text>
                  </TouchableOpacity>
                  <View style={styles.sectionCountBadge}>
                    <Text style={styles.sectionCountBadgeText}>{upcoming.length} mốc</Text>
                  </View>
                </View>
              </View>
              <View style={{ padding: 12 }}>
                {upcoming.length === 0 ? (
                  <Text style={{ textAlign: 'center', color: T.textSecondary, fontSize: 13, paddingVertical: 20 }}>Chưa có cột mốc nào sắp tới 🥺</Text>
                ) : (
                  upcoming.slice(0, upcomingLimit).map((item, idx) => renderMilestoneItem(item, idx, false))
                )}
                {upcomingLimit < upcoming.length && (
                  <TouchableOpacity
                    onPress={() => setUpcomingLimit(prev => prev + 10)}
                    style={{ paddingVertical: 10, borderWidth: 1.5, borderColor: T.coral, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(255,101,132,0.06)', marginTop: 4 }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '800', color: T.coral }}>Xem thêm 10 sự kiện</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Calendar Sync */}
            <View style={[styles.card, { marginTop: 16 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.boldTitle}>Đồng bộ Google Calendar</Text>
                  <Text style={styles.descText}>Tự động tạo lịch nhắc trên điện thoại hai bạn.</Text>
                </View>
                <TouchableOpacity onPress={handleSyncCalendar} disabled={isSyncing} style={[styles.syncBtn, isSyncMode && { backgroundColor: T.mint, borderColor: T.border }]}>
                  <Text style={[styles.syncBtnText, isSyncMode && { color: T.border }]}>
                    {isSyncing ? '...' : isSyncMode ? `Xác nhận (${selectedForSync.length})` : 'Đồng bộ'}
                  </Text>
                </TouchableOpacity>
              </View>
              {isSyncMode && (
                <TouchableOpacity
                  onPress={() => { setIsSyncMode(false); setSelectedForSync([]); }}
                  style={{
                    backgroundColor: T.bgCard,
                    borderWidth: 2,
                    borderColor: T.border,
                    borderRadius: 12,
                    paddingVertical: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 10
                  }}
                >
                  <Text style={{ color: T.textSecondary, fontWeight: '800', fontSize: 13 }}>Hủy đồng bộ</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Passed */}
            {passed.length > 0 && (
              <View style={[styles.sectionFrame, { opacity: 0.85, marginTop: 16 }]}>
                <View style={[styles.sectionHeaderBar, { backgroundColor: 'rgba(0,184,148,0.04)' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Heart size={15} color={T.mint} fill={T.mint} />
                    <Text style={[styles.sectionHeaderTitle, { color: T.textSecondary }]}>Kỷ niệm đã qua</Text>
                  </View>
                  <View style={styles.sectionCountBadge}>
                    <Text style={styles.sectionCountBadgeText}>{passed.length} mốc</Text>
                  </View>
                </View>
                <View style={{ padding: 12 }}>
                  {passed.map((item, idx) => renderMilestoneItem(item, idx, true))}
                </View>
              </View>
            )}
          </>
        )}

        {/* ── TAB: TRAVEL ── */}
        {activeTab === 'travel' && (
          <>
            {/* Daily Events */}
            <View style={styles.sectionFrame}>
              <View style={[styles.sectionHeaderBar, { backgroundColor: 'rgba(255,101,132,0.04)' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MapPin size={15} color={T.coral} />
                  <Text style={styles.sectionHeaderTitle}>Hoạt động & Chuyến đi</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity onPress={() => setIsOpenAddEventModal(true)} style={styles.smallBtn}>
                    <Text style={styles.smallBtnText}>+ Thêm</Text>
                  </TouchableOpacity>
                  <View style={styles.sectionCountBadge}>
                    <Text style={styles.sectionCountBadgeText}>{coupleEvents.length}</Text>
                  </View>
                </View>
              </View>
              <View style={{ padding: 12 }}>
                {coupleEvents.length === 0 ? (
                  <Text style={{ textAlign: 'center', color: T.textSecondary, fontSize: 13, paddingVertical: 20 }}>Chưa ghi nhận hoạt động nào 🥺</Text>
                ) : (
                  coupleEvents.map((event, idx) => (
                    <View key={`event-${idx}`} style={styles.itemCard}>
                      <View style={{ flex: 1, paddingRight: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.itemTitle, { flexShrink: 1 }]}>{event.title}</Text>
                          {event.eventTime && (
                            <View style={{ backgroundColor: 'rgba(61,47,61,0.08)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginTop: 2 }}>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: T.textPrimary }}>🕒 {event.eventTime?.slice(0, 5)}</Text>
                            </View>
                          )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                          <Calendar size={11} color={T.textSecondary} />
                          <Text style={styles.itemDate}>{formatDateString(event.eventDate)}</Text>
                        </View>
                        {event.location && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <MapPin size={11} color={T.coral} />
                            <Text style={[styles.descText, { fontWeight: '700', color: T.textPrimary }]} numberOfLines={1}>{event.location}</Text>
                          </View>
                        )}
                        {event.description ? (
                          <Text style={[styles.descText, { marginTop: 4, fontStyle: 'italic' }]} numberOfLines={2}>"{event.description}"</Text>
                        ) : null}
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteCoupleEvent(event.id!)} style={{ padding: 4 }}>
                        <Trash2 size={18} color={T.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* Travel Stats */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              {[
                { icon: <Plane size={16} color={T.coral} />, value: travelStats.totalTrips, label: 'Chuyến đi' },
                { icon: <MapPin size={16} color={T.mint} />, value: travelStats.uniqueLocations, label: 'Địa điểm' },
                { icon: <Compass size={16} color="#FBBF24" />, value: travelStats.domesticCount, label: 'Trong nước' },
                { icon: <Globe size={16} color="#3B82F6" />, value: travelStats.internationalCount, label: 'Quốc tế' },
              ].map((stat, i) => (
                <View key={i} style={styles.statCard}>
                  {stat.icon}
                  <Text style={{ fontSize: 18, fontWeight: '900', color: T.textPrimary }}>{stat.value}</Text>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: T.textSecondary, textTransform: 'uppercase', textAlign: 'center' }}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Travel Diary */}
            <View style={[styles.sectionFrame, { marginTop: 16 }]}>
              <View style={[styles.sectionHeaderBar, { backgroundColor: 'rgba(61,47,61,0.04)' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Plane size={15} color={T.textPrimary} />
                  <Text style={styles.sectionHeaderTitle}>Sổ tay du lịch</Text>
                </View>
                <TouchableOpacity onPress={openAddTrip} style={[styles.smallBtn, { backgroundColor: T.textPrimary }]}>
                  <Text style={[styles.smallBtnText, { color: T.bgCard }]}>+ Thêm</Text>
                </TouchableOpacity>
              </View>

              {/* Filter / Sort / View Dashboard */}
              <View style={{ backgroundColor: 'rgba(61,47,61,0.02)', padding: 12, borderBottomWidth: 1.5, borderBottomColor: 'rgba(61,47,61,0.1)' }}>
                {/* Region Select (Tất cả, Trong nước, Nước ngoài) */}
                <View style={{ width: '100%' }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: T.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Khu vực</Text>
                  <View style={styles.segmentedControl}>
                    {([['all', 'Tất cả'], ['domestic', 'Trong nước'], ['international', 'Nước ngoài']] as const).map(([val, label], idx) => (
                      <TouchableOpacity
                        key={val}
                        onPress={() => setTripFilter(val)}
                        style={[
                          styles.segmentBtn,
                          tripFilter === val && { backgroundColor: T.coral },
                          idx !== 2 && { borderRightWidth: 1.5, borderRightColor: T.border }
                        ]}
                      >
                        <Text style={[
                          styles.segmentText,
                          tripFilter === val ? { color: T.border } : { color: T.textSecondary }
                        ]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Row with View Mode and Sort Direction */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  {/* View Mode Toggle */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: T.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Chế độ xem</Text>
                    <View style={styles.segmentedControl}>
                      {([['list', 'Danh sách'], ['group', 'Địa điểm']] as const).map(([val, label], idx) => (
                        <TouchableOpacity
                          key={val}
                          onPress={() => setTripViewMode(val)}
                          style={[
                            styles.segmentBtn,
                            tripViewMode === val && { backgroundColor: T.mint },
                            idx !== 1 && { borderRightWidth: 1.5, borderRightColor: T.border }
                          ]}
                        >
                          <Text style={[
                            styles.segmentText,
                            tripViewMode === val ? { color: '#fff' } : { color: T.textSecondary }
                          ]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Sort Toggle */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: T.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Sắp xếp</Text>
                    <View style={styles.segmentedControl}>
                      {([['desc', 'Mới nhất'], ['asc', 'Cũ nhất']] as const).map(([val, label], idx) => (
                        <TouchableOpacity
                          key={val}
                          onPress={() => setTripSort(val)}
                          style={[
                            styles.segmentBtn,
                            tripSort === val && { backgroundColor: '#FBBF24' },
                            idx !== 1 && { borderRightWidth: 1.5, borderRightColor: T.border }
                          ]}
                        >
                          <Text style={[
                            styles.segmentText,
                            tripSort === val ? { color: T.border } : { color: T.textSecondary }
                          ]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>

              {/* Trip cards */}
              <View style={{ padding: 12 }}>
                {filteredSortedTrips.length === 0 ? (
                  <Text style={{ textAlign: 'center', color: T.textSecondary, fontSize: 13, paddingVertical: 20 }}>Chưa có chuyến đi nào 🥺</Text>
                ) : tripViewMode === 'group' ? (
                  groupedTrips.map(group => (
                    <View key={group.location.id} style={{ marginBottom: 16 }}>
                      {/* Group Header */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(61,47,61,0.1)' }} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(61,47,61,0.05)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, marginHorizontal: 8, borderWidth: 1, borderColor: 'rgba(61,47,61,0.1)' }}>
                          <MapPin size={14} color={T.coral} />
                          <Text style={{ fontSize: 14, fontWeight: '900', color: T.textPrimary }}>{group.location.name}</Text>
                          <View style={{ backgroundColor: T.bgCard, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(61,47,61,0.1)' }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: T.textSecondary }}>{group.trips.length} chuyến</Text>
                          </View>
                        </View>
                        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(61,47,61,0.1)' }} />
                      </View>
                      
                      {/* Trips in Group */}
                      {group.trips.map(trip => renderTripCard(trip))}
                    </View>
                  ))
                ) : (
                  filteredSortedTrips.map(trip => renderTripCard(trip))
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      {activeTab === 'milestones' && (
        <TouchableOpacity onPress={() => setIsOpenAddModal(true)} activeOpacity={0.8} style={styles.fab}>
          <Text style={styles.fabText}>+ Thêm sự kiện</Text>
        </TouchableOpacity>
      )}

      {/* ── MODALS ── */}

      {/* Sync Success */}
      <Modal visible={showSyncSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <CheckCircle2 size={24} color={T.mint} />
              <Text style={[styles.modalHeader, { marginBottom: 0 }]}>Đồng bộ thành công</Text>
            </View>
            <Text style={styles.modalBody}>Các cột mốc kỷ niệm của hai bạn đã được tạo vào Lịch Google! Cả hai bạn sẽ nhận thông báo nhắc nhở tự động.</Text>
            <TouchableOpacity onPress={() => setShowSyncSuccess(false)} style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>Tuyệt vời 💖</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Milestone Modal */}
      <Modal visible={isOpenAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeader}>Tạo sự kiện mới</Text>
            <Text style={styles.label}>Tên cột mốc kỷ niệm</Text>
            <TextInput value={newTitle} onChangeText={setNewTitle} placeholder="Ví dụ: Nụ hôn đầu tiên..." placeholderTextColor="#666" style={styles.input} />
            <Text style={[styles.label, { marginTop: 12 }]}>Ngày diễn ra (YYYY-MM-DD)</Text>
            <TextInput value={newDate} onChangeText={setNewDate} placeholder="2026-07-28" placeholderTextColor="#666" style={[styles.input, { marginBottom: 20 }]} />
            <View style={styles.rowEnd}>
              <TouchableOpacity onPress={() => setIsOpenAddModal(false)} style={[styles.actionBtn, styles.secondaryActionBtn]}>
                <Text style={styles.secondaryActionBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddMilestone} style={[styles.actionBtn, { marginLeft: 8 }]}>
                <Text style={styles.actionBtnText}>Tạo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Event Modal */}
      <Modal visible={isOpenAddEventModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 40 }}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeader}>Thêm hoạt động mới</Text>
              <Text style={styles.label}>Tên hoạt động</Text>
              <TextInput value={eventTitle} onChangeText={setEventTitle} placeholder="Ví dụ: Đi xem phim, Ăn tối..." placeholderTextColor="#666" style={styles.input} />
              <Text style={[styles.label, { marginTop: 12 }]}>Ngày (YYYY-MM-DD)</Text>
              <TextInput value={eventDate} onChangeText={setEventDate} placeholder="2026-06-08" placeholderTextColor="#666" style={styles.input} />
              <Text style={[styles.label, { marginTop: 12 }]}>Giờ (HH:MM)</Text>
              <TextInput value={eventTime} onChangeText={setEventTime} placeholder="19:30" placeholderTextColor="#666" style={styles.input} />
              <Text style={[styles.label, { marginTop: 12 }]}>Địa điểm</Text>
              <TextInput value={eventLocation} onChangeText={setEventLocation} placeholder="Lotte Cinema Tây Hồ" placeholderTextColor="#666" style={styles.input} />
              <Text style={[styles.label, { marginTop: 12 }]}>Mô tả</Text>
              <TextInput value={eventDescription} onChangeText={setEventDescription} placeholder="Ghi chú chi tiết..." placeholderTextColor="#666" multiline style={[styles.input, { height: 80, textAlignVertical: 'top', marginBottom: 6 }]} />
              <Text style={{ fontSize: 10, color: T.warning, fontWeight: '700', fontStyle: 'italic', marginBottom: 20, paddingHorizontal: 4 }}>
                * Hoạt động sẽ tự động xóa sau 3 ngày kể từ ngày diễn ra.
              </Text>
              <View style={styles.rowEnd}>
                <TouchableOpacity onPress={() => setIsOpenAddEventModal(false)} style={[styles.actionBtn, styles.secondaryActionBtn]}>
                  <Text style={styles.secondaryActionBtnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddCoupleEvent} disabled={isAddingEvent} style={[styles.actionBtn, { marginLeft: 8 }]}>
                  <Text style={styles.actionBtnText}>{isAddingEvent ? 'Đang lưu...' : 'Lưu'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Add/Edit Trip Modal */}
      <Modal visible={isOpenAddTripModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 40 }}>
            <View style={[styles.modalCard, { padding: 0, overflow: 'hidden' }]}>
              {/* Modal Header */}
              <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 2, borderBottomColor: 'rgba(61,47,61,0.1)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: T.bgCard }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Plane size={20} color={T.textPrimary} />
                  <Text style={{ fontSize: 16, fontWeight: '900', color: T.textPrimary }}>{editingTripId ? 'Sửa nhật ký chuyến đi' : 'Thêm nhật ký chuyến đi'}</Text>
                </View>
                <TouchableOpacity onPress={() => setIsOpenAddTripModal(false)} style={{ backgroundColor: 'rgba(61,47,61,0.08)', borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: T.textPrimary, fontWeight: '800', fontSize: 14 }}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={{ padding: 20 }}>
                <Text style={styles.label}>Tiêu đề chuyến đi <Text style={{ color: T.warning }}>*</Text></Text>
                <TextInput value={tripTitle} onChangeText={setTripTitle} placeholder="Nghỉ dưỡng cuối tuần Đà Lạt" placeholderTextColor="#999" style={styles.input} />

                <Text style={[styles.label, { marginTop: 12 }]}>Địa điểm <Text style={{ color: T.warning }}>*</Text></Text>
                <TouchableOpacity
                  onPress={() => setIsOpenLocationPicker(true)}
                  style={[styles.input, { justifyContent: 'space-between', marginBottom: 0, flexDirection: 'row', alignItems: 'center' }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <MapPin size={16} color={T.textSecondary} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: selectedLocation ? T.textPrimary : '#999', flex: 1 }} numberOfLines={1}>
                      {selectedLocation ? `${selectedLocation.name} (${selectedLocation.type === 'province' ? 'Trong nước' : 'Nước ngoài'})` : '-- Chọn địa điểm du lịch --'}
                    </Text>
                  </View>
                  <ChevronDown size={16} color={T.textSecondary} />
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Ngày đi <Text style={{ color: T.warning }}>*</Text></Text>
                    <TouchableOpacity onPress={() => setShowTripStartDatePicker(true)} style={[styles.input, { justifyContent: 'center' }]}>
                      <Text style={{ color: tripStartDate ? T.textPrimary : '#999', fontWeight: '700', fontSize: 14 }}>
                        {tripStartDate || "YYYY-MM-DD"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Ngày về <Text style={{ color: T.warning }}>*</Text></Text>
                    <TouchableOpacity onPress={() => setShowTripEndDatePicker(true)} style={[styles.input, { justifyContent: 'center' }]}>
                      <Text style={{ color: tripEndDate ? T.textPrimary : '#999', fontWeight: '700', fontSize: 14 }}>
                        {tripEndDate || "YYYY-MM-DD"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {showTripStartDatePicker && (
                  <DateTimePicker
                    value={tripStartDate ? new Date(tripStartDate) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowTripStartDatePicker(Platform.OS === 'ios');
                      if (date && event.type !== 'dismissed') {
                        const formatted = date.toISOString().split('T')[0];
                        setTripStartDate(formatted);
                        if (!tripEndDate || tripEndDate < formatted) setTripEndDate(formatted);
                      }
                    }}
                  />
                )}
                {showTripEndDatePicker && (
                  <DateTimePicker
                    value={tripEndDate ? new Date(tripEndDate) : new Date()}
                    mode="date"
                    display="default"
                    minimumDate={tripStartDate ? new Date(tripStartDate) : undefined}
                    onChange={(event, date) => {
                      setShowTripEndDatePicker(Platform.OS === 'ios');
                      if (date && event.type !== 'dismissed') {
                        setTripEndDate(date.toISOString().split('T')[0]);
                      }
                    }}
                  />
                )}

                <Text style={[styles.label, { marginTop: 12 }]}>Mô tả / Cảm nhận</Text>
                <TextInput value={tripDescription} onChangeText={setTripDescription} placeholder="Ghi lại những khoảnh khắc đáng nhớ..." placeholderTextColor="#999" multiline style={[styles.input, { height: 80, textAlignVertical: 'top', marginBottom: 20 }]} />

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                  <TouchableOpacity onPress={() => setIsOpenAddTripModal(false)} style={{ backgroundColor: T.bgPrimary, borderWidth: 2.2, borderColor: T.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}>
                    <Text style={{ color: T.textPrimary, fontWeight: '800', fontSize: 13 }}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddTrip}
                    disabled={isAddingTrip || !tripTitle.trim() || !tripStartDate || !tripEndDate || !tripLocationId}
                    style={{ flex: 1, backgroundColor: T.coral, borderWidth: 2.2, borderColor: T.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3, opacity: (isAddingTrip || !tripTitle.trim() || !tripStartDate || !tripEndDate || !tripLocationId) ? 0.5 : 1 }}
                  >
                    <Text style={{ color: T.bgCard, fontWeight: '800', fontSize: 14 }}>{isAddingTrip ? 'Đang lưu...' : editingTripId ? 'Cập nhật' : 'Lưu kỷ niệm'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Location Picker Modal */}
      <Modal visible={isOpenLocationPicker} transparent animationType="slide">
        <View style={[styles.modalOverlay, { justifyContent: 'flex-end', padding: 0 }]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setIsOpenLocationPicker(false)} activeOpacity={1} />
          <View style={[styles.modalCard, { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, maxHeight: '70%', padding: 0 }]}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(61,47,61,0.1)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: T.textPrimary }}>Chọn địa điểm</Text>
              <TouchableOpacity onPress={() => setIsOpenLocationPicker(false)} style={{ padding: 4 }}>
                <Text style={{ color: T.textSecondary, fontWeight: '800', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ paddingHorizontal: 16 }}>
              {[{ id: '' as any, name: '-- Chọn địa điểm du lịch --', type: null as any, country: '', image_url: '' }, ...locations].map(loc => (
                <TouchableOpacity
                  key={String(loc.id)}
                  onPress={() => { setTripLocationId(loc.id || ''); setIsOpenLocationPicker(false); }}
                  style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(61,47,61,0.05)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: tripLocationId === loc.id ? 'rgba(255,101,132,0.05)' : 'transparent', marginHorizontal: -16, paddingHorizontal: 16 }}
                >
                  <Text style={{ fontSize: 15, fontWeight: tripLocationId === loc.id ? '800' : '600', color: tripLocationId === loc.id ? T.coral : T.textPrimary }}>{loc.name}</Text>
                  {loc.type && (
                    <Text style={{ fontSize: 11, fontWeight: '700', color: T.textSecondary, backgroundColor: 'rgba(61,47,61,0.05)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                      {loc.type === 'province' ? 'Trong nước' : 'Nước ngoài'}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!tripToDelete} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { padding: 24, alignItems: 'center' }]}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,101,132,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Trash2 size={32} color={T.warning} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: T.textPrimary, marginBottom: 8 }}>Xóa chuyến đi?</Text>
            <Text style={{ fontSize: 13, color: T.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
              Bạn có chắc chắn muốn xóa chuyến đi này không?{'\n'}Hành động này không thể hoàn tác.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity onPress={() => setTripToDelete(null)} style={{ flex: 1, backgroundColor: T.bgPrimary, borderWidth: 2.2, borderColor: T.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}>
                <Text style={{ color: T.textPrimary, fontWeight: '800', fontSize: 14 }}>Giữ lại</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDeleteTrip} style={{ flex: 1, backgroundColor: T.warning, borderWidth: 2.2, borderColor: T.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}>
                <Text style={{ color: T.bgCard, fontWeight: '800', fontSize: 14 }}>Đồng ý Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bgPrimary },
  header: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 16, borderBottomWidth: T.bw, borderColor: T.border, backgroundColor: T.bgCard },
  headerTitle: { fontSize: 20, fontWeight: '900', color: T.textPrimary },

  tabBar: { flexDirection: 'row', backgroundColor: T.bgCard, borderBottomWidth: T.bw, borderBottomColor: T.border, padding: 10, gap: 10 },
  pillTab: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: T.bw, alignItems: 'center', justifyContent: 'center' },
  pillTabActive: { backgroundColor: T.coral, borderColor: T.border, shadowColor: T.border, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  pillTabInactive: { backgroundColor: T.bgPrimary, borderColor: 'rgba(61,47,61,0.25)' },
  pillTabText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.3 },
  pillTabTextActive: { color: T.border },
  pillTabTextInactive: { color: T.textSecondary },

  scrollContent: { padding: 16, paddingBottom: 160 },

  sectionFrame: { backgroundColor: T.bgCard, borderWidth: T.bw, borderColor: T.border, borderRadius: 18, shadowColor: T.border, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3, overflow: 'hidden' },
  sectionHeaderBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: T.border },
  sectionHeaderTitle: { fontSize: 11, fontWeight: '900', color: T.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionCountBadge: { backgroundColor: 'rgba(61,47,61,0.08)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  sectionCountBadgeText: { fontSize: 10, fontWeight: '800', color: T.textSecondary },

  card: { backgroundColor: T.bgCard, borderWidth: T.bw, borderColor: T.border, borderRadius: 16, padding: 16, shadowColor: T.border, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  boldTitle: { fontSize: 13, fontWeight: '800', color: T.textPrimary },
  descText: { fontSize: 10, color: T.textSecondary },
  syncBtn: { backgroundColor: T.coral, borderWidth: T.bw, borderColor: T.border, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  syncBtnText: { fontWeight: '800', fontSize: 12, color: T.border },
  smallBtn: { backgroundColor: T.coral, borderWidth: 1.5, borderColor: T.border, borderRadius: 16, paddingVertical: 4, paddingHorizontal: 10 },
  smallBtnText: { fontWeight: '800', fontSize: 11, color: T.border },

  itemCard: { backgroundColor: T.bgPrimary, borderWidth: 1.5, borderColor: 'rgba(61,47,61,0.22)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  passedItemCard: { backgroundColor: 'rgba(61,47,61,0.02)', borderColor: 'rgba(61,47,61,0.12)' },
  itemTitle: { fontSize: 14, fontWeight: '800', color: T.textPrimary },
  passedTitle: { color: T.textSecondary, textDecorationLine: 'line-through' },
  itemDate: { fontSize: 11, color: T.textSecondary, marginTop: 2 },
  remainingText: { fontSize: 14, fontWeight: '800', color: T.coral },
  passedBadge: { backgroundColor: T.border, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  passedBadgeText: { fontSize: 10, fontWeight: '800', color: T.bgCard },
  yearBadge: { backgroundColor: 'rgba(255,101,132,0.15)', borderColor: 'rgba(255,101,132,0.3)', borderWidth: 1, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 4 },
  yearBadgeText: { fontSize: 9, fontWeight: '800', color: T.coral },
  yearBadgePassed: { backgroundColor: 'rgba(0,184,148,0.15)', borderColor: 'rgba(0,184,148,0.3)', borderWidth: 1, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 4 },
  yearBadgeTextPassed: { fontSize: 9, fontWeight: '800', color: T.mint },

  statCard: { flex: 1, backgroundColor: T.bgCard, borderWidth: T.bw, borderColor: T.border, borderRadius: 14, paddingVertical: 10, alignItems: 'center', gap: 3, shadowColor: T.border, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2 },

  tripCard: { backgroundColor: T.bgPrimary, borderWidth: 1.5, borderColor: 'rgba(61,47,61,0.22)', borderRadius: 14, overflow: 'hidden', marginBottom: 12, shadowColor: T.border, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.5, shadowRadius: 0, elevation: 2 },

  fab: { position: 'absolute', right: 20, bottom: 90, backgroundColor: T.coral, borderWidth: T.bw, borderColor: T.border, borderRadius: 25, paddingVertical: 12, paddingHorizontal: 20, shadowColor: T.border, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 },
  fabText: { fontWeight: '800', color: T.border, fontSize: 13 },

  modalOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: T.bgCard, borderWidth: T.bw, borderColor: T.border, borderRadius: 16, padding: 24 },
  modalHeader: { fontSize: 18, fontWeight: '800', color: T.textPrimary, marginBottom: 16 },
  modalBody: { fontSize: 13, color: T.textSecondary, lineHeight: 18, marginBottom: 20 },
  label: { fontWeight: '800', fontSize: 11, color: T.textSecondary, marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: T.bgPrimary, borderWidth: T.bw, borderColor: T.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, color: T.textPrimary, fontWeight: '700', fontSize: 14 },
  rowEnd: { flexDirection: 'row', justifyContent: 'flex-end' },
  actionBtn: { backgroundColor: T.coral, borderWidth: T.bw, borderColor: T.border, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center' },
  actionBtnText: { fontWeight: '800', color: T.border },
  secondaryActionBtn: { backgroundColor: T.textPrimary },
  secondaryActionBtnText: { color: T.bgCard, fontWeight: '800' },

  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: T.bgCard,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '800',
  },
});

export default MilestonesScreen;
