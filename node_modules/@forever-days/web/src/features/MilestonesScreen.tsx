import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRelationship } from '../core/RelationshipContext';
import { LoveUtils } from '../core/loveUtils';
import type { MilestoneItem } from '../core/loveUtils';
import { MilestoneService, CoupleEventService, MilestonePlanService, TravelService } from '@forever-days/core';
import type { CoupleEvent, MilestonePlan, TravelLocation, TravelTrip } from '@forever-days/core';
import { Calendar, Plus, CheckCircle, Trash2, Pencil, Heart, Clock, MapPin, Compass, ChevronDown, ChevronUp, Utensils, Gamepad2, Plane, Globe } from 'lucide-react';

const CustomDropdown = ({ value, options, onChange, icon: Icon, label, fullWidth }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o: any) => o.value === value);

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between bg-bg-primary border-[1.5px] border-border-color rounded-lg gap-2 hover:bg-border-color/5 transition-colors ${fullWidth ? 'w-full px-4 py-3 border-[2px] rounded-xl' : 'px-3 py-1.5'}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {Icon && <Icon size={fullWidth ? 16 : 14} className="text-text-secondary shrink-0" />}
          <span className={`${fullWidth ? 'text-sm' : 'text-[12px]'} font-bold text-text-primary truncate`}>
            {label ? `${label}: ` : ''}{selectedOption?.label || '-- Chọn --'}
          </span>
        </div>
        <ChevronDown size={14} className={`text-text-secondary transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className={`absolute top-full left-0 mt-1 ${fullWidth ? 'w-full' : 'min-w-[140px]'} max-h-[200px] overflow-y-auto bg-bg-card border-[2.2px] border-border-color rounded-xl shadow-neo z-50 flex flex-col
          [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border-color/30 [&::-webkit-scrollbar-thumb]:rounded-full`}>
          {options.map((opt: any) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`text-left px-3 py-2 ${fullWidth ? 'text-sm' : 'text-[12px]'} font-bold transition-colors ${
                value === opt.value 
                  ? 'bg-primary-coral/10 text-primary-coral' 
                  : 'text-text-primary hover:bg-border-color/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const MilestonesScreen: React.FC = () => {
  const { anniversaryDate, coupleId, isDemoMode } = useRelationship();
  const [customMilestones, setCustomMilestones] = useState<MilestoneItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [isSyncMode, setIsSyncMode] = useState(false);
  const [selectedForSync, setSelectedForSync] = useState<string[]>([]);
  const [syncedEvents, setSyncedEvents] = useState<Record<string, any>>({});

  const loadSyncedEvents = () => {
    try {
      const stored = localStorage.getItem('synced_calendar_events');
      if (stored) {
        setSyncedEvents(JSON.parse(stored));
      }
    } catch {}
  };

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

  // Travel Trips State
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
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);

  const milestoneService = new MilestoneService();
  const coupleEventService = new CoupleEventService();
  const travelService = new TravelService();

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

  const cleanupOldEvents = async (events: CoupleEvent[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoffTime = today.getTime() - (3 * 24 * 60 * 60 * 1000);

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
        localStorage.setItem('demo_couple_events', JSON.stringify(validEvents));
      } else {
        for (const id of eventsToDelete) {
          try { await coupleEventService.deleteEvent(id); } catch {}
        }
      }
    }
    return validEvents;
  };

  const loadCoupleEvents = async () => {
    let loadedEvents: CoupleEvent[] = [];
    if (isDemoMode) {
      const saved = localStorage.getItem('demo_couple_events');
      let parsed = [];
      if (saved) {
        try {
          parsed = JSON.parse(saved);
        } catch {}
      }
      if (parsed.length > 0) {
        loadedEvents = parsed;
      } else {
        loadedEvents = [
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
        localStorage.setItem('demo_couple_events', JSON.stringify(loadedEvents));
      }
    } else if (coupleId) {
      try {
        loadedEvents = await coupleEventService.fetchEvents(coupleId);
      } catch {}
    }
    loadedEvents = await cleanupOldEvents(loadedEvents);
    setCoupleEvents(loadedEvents);
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

  const loadTravelData = async () => {
    try {
      if (isDemoMode) {
        const mockLocations: TravelLocation[] = [
          { id: 1, name: 'Đà Lạt', type: 'province', country: 'Việt Nam', image_url: 'https://images.unsplash.com/photo-1517427677505-610b42f1a601?auto=format&fit=crop&q=80&w=800' },
          { id: 2, name: 'Hà Nội', type: 'province', country: 'Việt Nam', image_url: 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&q=80&w=800' },
          { id: 3, name: 'Thái Lan', type: 'country', country: 'Thái Lan', image_url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&q=80&w=800' },
        ];
        setLocations(mockLocations);
        
        const savedTrips = localStorage.getItem('demo_travel_trips');
        let loadedTrips: TravelTrip[] = [];
        if (savedTrips) {
          try { loadedTrips = JSON.parse(savedTrips); } catch {}
        }
        if (loadedTrips.length === 0) {
          loadedTrips = [{
            id: 'trip-1',
            couple_id: 'demo-couple-id',
            location_id: 1,
            title: 'Nghỉ dưỡng Đà Lạt 3N2Đ',
            start_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
            end_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
            description: 'Đi ăn lẩu bò, đi săn mây',
            location: mockLocations[0],
          }];
          localStorage.setItem('demo_travel_trips', JSON.stringify(loadedTrips));
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
    loadCustomMilestones();
    loadCoupleEvents();
    loadPlans();
    loadTravelData();
    loadSyncedEvents();
  }, [coupleId, isDemoMode]);

  const handleAddTrip = async () => {
    if (!tripTitle.trim() || !tripStartDate || !tripEndDate || !tripLocationId) return;

    setIsAddingTrip(true);
    const newTrip = {
      couple_id: coupleId || 'demo-couple-id',
      location_id: Number(tripLocationId),
      title: tripTitle.trim(),
      start_date: tripStartDate,
      end_date: tripEndDate,
      description: tripDescription.trim() || undefined,
    };

    if (editingTripId) {
      if (isDemoMode) {
        const loc = locations.find(l => l.id === Number(tripLocationId));
        const updatedList = trips.map(t => t.id === editingTripId ? { ...t, ...newTrip, location: loc } : t);
        setTrips(updatedList);
        localStorage.setItem('demo_travel_trips', JSON.stringify(updatedList));
      } else {
        await travelService.updateTrip(editingTripId, newTrip);
        await loadTravelData();
      }
    } else {
      if (isDemoMode) {
        const loc = locations.find(l => l.id === Number(tripLocationId));
        const tripItem: TravelTrip = {
          id: `trip-${Date.now()}`,
          ...newTrip,
          location: loc,
        };
        const updatedList = [tripItem, ...trips];
        setTrips(updatedList);
        localStorage.setItem('demo_travel_trips', JSON.stringify(updatedList));
      } else {
        await travelService.createTrip(newTrip);
        await loadTravelData();
      }
    }

    setTripTitle('');
    setTripStartDate('');
    setTripEndDate('');
    setTripLocationId('');
    setTripDescription('');
    setEditingTripId(null);
    setIsOpenAddTripModal(false);
    setIsAddingTrip(false);
  };

  const handleEditTrip = (trip: TravelTrip) => {
    setTripTitle(trip.title);
    setTripStartDate(trip.start_date);
    setTripEndDate(trip.end_date);
    setTripLocationId(trip.location_id);
    setTripDescription(trip.description || '');
    setEditingTripId(trip.id || null);
    setIsOpenAddTripModal(true);
  };

  const handleDeleteTrip = (id: string) => {
    setTripToDelete(id);
  };

  const confirmDeleteTrip = async () => {
    if (!tripToDelete) return;
    if (isDemoMode) {
      const updatedList = trips.filter(t => t.id !== tripToDelete);
      setTrips(updatedList);
      localStorage.setItem('demo_travel_trips', JSON.stringify(updatedList));
    } else {
      await travelService.deleteTrip(tripToDelete);
      await loadTravelData();
    }
    setTripToDelete(null);
  };

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
      const stored = localStorage.getItem('synced_calendar_events');
      const syncedMap = stored ? JSON.parse(stored) : {};

      for (const mKey of selectedForSync) {
        const item = upcoming.find(m => getMilestoneKey(m) === mKey);
        if (item) {
          syncedMap[mKey] = {
            syncedAt: new Date().toISOString(),
            title: item.title,
            targetDate: item.targetDate
          };
        }
      }

      localStorage.setItem('synced_calendar_events', JSON.stringify(syncedMap));
      loadSyncedEvents();

      // Generate and download ICS file containing all selected items
      let icsContent = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//ForeverDays//Sync//EN\r\n";
      for (const mKey of selectedForSync) {
        const item = upcoming.find(m => getMilestoneKey(m) === mKey);
        if (!item) continue;
        const cleanDate = item.targetDate.replace(/-/g, '');
        const uid = `${mKey}@foreverdays.com`;
        icsContent += `BEGIN:VEVENT\r\nUID:${uid}\r\nDTSTART;VALUE=DATE:${cleanDate}\r\nSUMMARY:${item.title}\r\nEND:VEVENT\r\n`;
      }
      icsContent += "END:VCALENDAR\r\n";

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', 'forever_days_milestones.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsSyncMode(false);
      setSelectedForSync([]);
      setShowSyncSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleSyncSelection = (key: string) => {
    setSelectedForSync(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
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
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const dayName = getDayOfWeekName(date);
    const dateFormatted = date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${dayName}, ${dateFormatted}`;
  };

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const getTripDuration = (start: string, end: string) => {
    if (!start || !end) return '';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate.getTime() - startDate.getTime();
    if (diffTime < 0) return '';
    
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays === 1) return '(Trong ngày)';
    return `(${diffDays} ngày ${diffDays - 1} đêm)`;
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

  const [activeTab, setActiveTab] = useState<'milestones' | 'travel'>('milestones');
  const [tripViewMode, setTripViewMode] = useState<'list' | 'group'>('list');

  const travelStats = useMemo(() => {
    const uniqueLocations = new Set(trips.map(t => t.location_id));
    const domesticCount = new Set(trips.filter(t => t.location?.type === 'province').map(t => t.location_id)).size;
    const internationalCount = new Set(trips.filter(t => t.location?.type === 'country').map(t => t.location_id)).size;
    
    return {
      totalTrips: trips.length,
      uniqueLocations: uniqueLocations.size,
      domesticCount,
      internationalCount
    };
  }, [trips]);

  const filteredSortedTrips = useMemo(() => {
    let filtered = trips.filter(t => {
      if (tripFilter === 'domestic') return t.location?.type === 'province';
      if (tripFilter === 'international') return t.location?.type === 'country';
      return true;
    });
    
    filtered.sort((a, b) => {
      const timeA = new Date(a.start_date).getTime();
      const timeB = new Date(b.start_date).getTime();
      return tripSort === 'desc' ? timeB - timeA : timeA - timeB;
    });
    return filtered;
  }, [trips, tripFilter, tripSort]);

  const groupedTrips = useMemo(() => {
    const groups: Record<number, { location: TravelLocation, trips: TravelTrip[] }> = {};
    filteredSortedTrips.forEach(t => {
      if (!groups[t.location_id]) {
        groups[t.location_id] = { 
          location: t.location || { 
            id: t.location_id, 
            name: 'Unknown Location', 
            type: 'province', 
            country: '', 
            image_url: '' 
          }, 
          trips: [] 
        };
      }
      groups[t.location_id].trips.push(t);
    });

    return Object.values(groups);
  }, [filteredSortedTrips]);

  return (
    <div className="flex flex-col flex-1">
      <div className="bg-gradient-to-br from-primary-coral/15 to-secondary-mint/5 p-6 border-b-[2.2px] border-border-color text-center">
        <h2 className="text-xl font-black text-text-primary">Cột mốc kỷ niệm</h2>
      </div>

      {/* Tabs */}
      <div className="flex bg-bg-card border-b-[2.2px] border-border-color p-3 gap-3">
        <button
          onClick={() => setActiveTab('milestones')}
          className={`flex-1 py-3 rounded-xl font-black text-[13px] border-[2.2px] transition-all uppercase tracking-wider ${
            activeTab === 'milestones'
              ? 'bg-primary-coral text-border-color border-border-color shadow-neo'
              : 'bg-bg-primary text-text-secondary border-border-color/30 hover:bg-bg-primary/80'
          }`}
        >
          Ngày kỷ niệm
        </button>
        <button
          onClick={() => setActiveTab('travel')}
          className={`flex-1 py-3 rounded-xl font-black text-[13px] border-[2.2px] transition-all uppercase tracking-wider ${
            activeTab === 'travel'
              ? 'bg-primary-coral text-border-color border-border-color shadow-neo'
              : 'bg-bg-primary text-text-secondary border-border-color/30 hover:bg-bg-primary/80'
          }`}
        >
          Chuyến đi kỷ niệm
        </button>
      </div>

      <div className="p-5 pb-[92px] w-full flex flex-col flex-1 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start w-full">
          {/* Main Content */}
          <div className={`flex flex-col gap-4 order-2 md:order-1 ${activeTab === 'milestones' ? 'md:col-span-2' : 'md:col-span-3'}`}>
            
            {activeTab === 'milestones' ? (
              <>
                {/* ── UPCOMING ── */}
            <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl shadow-neo overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b-[2px] border-border-color/30 bg-primary-coral/5">
                <h3 className="text-[12px] font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <Clock size={14} className="text-primary-coral" /> Kỷ niệm sắp tới
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsOpenAddModal(true)}
                    className="bg-primary-coral text-border-color font-extrabold text-[10px] border-[1.5px] border-border-color rounded-full px-2.5 py-1 hover:bg-primary-coral/90 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={12} /> Thêm sự kiện
                  </button>
                  <span className="text-[11px] font-bold text-text-secondary bg-border-color/10 px-2 py-0.5 rounded-full">
                    {upcoming.length} mốc
                  </span>
                </div>
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
                        {isSyncMode && (
                          <div className="shrink-0 flex items-center justify-center">
                            <input 
                              type="checkbox" 
                              checked={selectedForSync.includes(mKey)} 
                              onChange={() => toggleSyncSelection(mKey)}
                              className="w-4 h-4 rounded-sm border-2 border-border-color accent-primary-coral cursor-pointer"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-[14px] truncate">{item.title}</span>
                             {syncedEvents[mKey] && (
                               <span className="bg-secondary-mint/15 text-secondary-mint text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap border border-secondary-mint/30 flex items-center gap-1">
                                 📅 Đã đồng bộ
                               </span>
                             )}
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
                                  className="bg-primary-coral text-border-color font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-100 hover:translate-x-[1px] hover:translate-y-[1px] select-none h-[32px] flex items-center justify-center"
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
              </>
            ) : (
              <>
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

            {/* ── SỔ TAY DU LỊCH CỦA HAI ĐỨA ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 mb-2">
              <div className="bg-bg-card border-[2.2px] border-border-color rounded-xl py-2 px-3 shadow-neo flex flex-col items-center justify-center gap-0.5 transition-transform hover:-translate-y-1">
                <Plane size={16} className="text-primary-coral mb-0.5" />
                <span className="text-[18px] font-black text-text-primary">{travelStats.totalTrips}</span>
                <span className="text-[9px] font-extrabold text-text-secondary uppercase">Chuyến đi</span>
              </div>
              <div className="bg-bg-card border-[2.2px] border-border-color rounded-xl py-2 px-3 shadow-neo flex flex-col items-center justify-center gap-0.5 transition-transform hover:-translate-y-1">
                <MapPin size={16} className="text-secondary-mint mb-0.5" />
                <span className="text-[18px] font-black text-text-primary">{travelStats.uniqueLocations}</span>
                <span className="text-[9px] font-extrabold text-text-secondary uppercase">Địa điểm</span>
              </div>
              <div className="bg-bg-card border-[2.2px] border-border-color rounded-xl py-2 px-3 shadow-neo flex flex-col items-center justify-center gap-0.5 transition-transform hover:-translate-y-1">
                <Compass size={16} className="text-[#FBBF24] mb-0.5" />
                <span className="text-[18px] font-black text-text-primary">{travelStats.domesticCount}</span>
                <span className="text-[9px] font-extrabold text-text-secondary uppercase">Trong nước</span>
              </div>
              <div className="bg-bg-card border-[2.2px] border-border-color rounded-xl py-2 px-3 shadow-neo flex flex-col items-center justify-center gap-0.5 transition-transform hover:-translate-y-1">
                <Globe size={16} className="text-[#3B82F6] mb-0.5" />
                <span className="text-[18px] font-black text-text-primary">{travelStats.internationalCount}</span>
                <span className="text-[9px] font-extrabold text-text-secondary uppercase">Quốc gia</span>
              </div>
            </div>

            <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl shadow-neo overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 border-b-[2px] border-border-color/30 bg-text-primary/5 gap-3">
                <h3 className="text-[14px] font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <Plane size={16} className="text-text-primary" /> Sổ tay du lịch của hai đứa
                </h3>
                
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <CustomDropdown
                    value={tripFilter}
                    onChange={setTripFilter}
                    icon={MapPin}
                    label="Lọc"
                    options={[
                      { value: 'all', label: 'Tất cả' },
                      { value: 'domestic', label: 'Trong nước' },
                      { value: 'international', label: 'Nước ngoài' },
                    ]}
                  />
                  <CustomDropdown
                    value={tripViewMode}
                    onChange={setTripViewMode}
                    icon={Compass}
                    label="View"
                    options={[
                      { value: 'list', label: 'Danh sách' },
                      { value: 'group', label: 'Địa điểm' },
                    ]}
                  />
                  <CustomDropdown
                    value={tripSort}
                    onChange={setTripSort}
                    icon={Clock}
                    label="Sắp xếp"
                    options={[
                      { value: 'desc', label: 'Mới nhất' },
                      { value: 'asc', label: 'Cũ nhất' },
                    ]}
                  />
                  <button
                    onClick={() => setIsOpenAddTripModal(true)}
                    className="ml-auto sm:ml-2 bg-text-primary text-bg-primary font-extrabold text-[12px] border-[1.5px] border-border-color rounded-lg px-3 py-1.5 hover:bg-text-primary/90 transition-colors shadow-sm"
                  >
                    + Thêm chuyến
                  </button>
                </div>
              </div>
              
              <div className="p-5 flex flex-col gap-6">
                {filteredSortedTrips.length === 0 && (
                  <div className="text-center text-text-secondary text-sm py-10">Chưa có chuyến đi nào phù hợp với bộ lọc 🥺</div>
                )}
                
                {tripViewMode === 'group' ? (
                  groupedTrips.map((group) => (
                    <div key={group.location.id} className="flex flex-col gap-3">
                      {/* Location Header */}
                      <div className="flex items-center gap-3">
                        <div className="h-[2px] flex-1 bg-border-color/20"></div>
                        <div className="flex items-center gap-2 bg-border-color/10 px-4 py-1.5 rounded-full border border-border-color/20">
                          <MapPin size={14} className="text-primary-coral" />
                          <h4 className="font-black text-[15px] text-text-primary">{group.location.name}</h4>
                          <span className="text-[10px] font-bold text-text-secondary bg-bg-card px-2 py-0.5 rounded-md border border-border-color/20 ml-1">
                            {group.trips.length} chuyến
                          </span>
                        </div>
                        <div className="h-[2px] flex-1 bg-border-color/20"></div>
                      </div>
                      
                      {/* Trips List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {group.trips.map(trip => {
                          const loc = trip.location;
                          return (
                            <div key={trip.id} className="relative bg-bg-primary border-[1.5px] border-border-color/50 rounded-xl overflow-hidden shadow-neo flex flex-col group transition-transform hover:-translate-y-1">
                              <div className="relative h-[110px] w-full overflow-hidden bg-border-color/10">
                                {loc?.image_url ? (
                                  <img src={loc.image_url} alt={loc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Plane size={24} className="text-text-secondary/50" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute top-2 right-2 flex gap-1">
                                  <span className="text-[9px] bg-black/40 text-white px-2 py-0.5 rounded-full backdrop-blur-sm font-bold">
                                    {loc?.type === 'province' ? 'Trong nước' : 'Nước ngoài'}
                                  </span>
                                </div>
                              </div>
                              <div className="p-3 flex flex-col gap-1.5 flex-1 relative">
                                <div className="absolute -top-3 right-3 flex gap-2 z-10">
                                  <button
                                    onClick={() => handleEditTrip(trip)}
                                    className="bg-bg-card text-text-secondary hover:text-primary-coral p-1.5 rounded-full shadow-md border border-border-color/20"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTrip(trip.id!)}
                                    className="bg-bg-card text-text-secondary hover:text-warning-coral p-1.5 rounded-full shadow-md border border-border-color/20"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <h5 className="font-extrabold text-[13px] text-text-primary pr-6 line-clamp-1" title={trip.title}>{trip.title}</h5>
                                <div className="flex flex-col gap-1 mt-1">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary/90 bg-bg-primary self-start px-2 py-0.5 rounded-md border border-border-color/20">
                                    <Calendar size={10} />
                                    <span>{formatShortDate(trip.start_date)}{trip.end_date && trip.end_date !== trip.start_date ? ` → ${formatShortDate(trip.end_date)}` : ''}</span>
                                  </div>
                                  {getTripDuration(trip.start_date, trip.end_date) && (
                                    <span className="text-[9px] font-extrabold text-primary-coral bg-primary-coral/10 border border-primary-coral/20 px-2 py-0.5 rounded-full self-start">
                                      {getTripDuration(trip.start_date, trip.end_date)}
                                    </span>
                                  )}
                                </div>
                                {trip.description && (
                                  <p className="text-[11px] text-text-secondary line-clamp-2 mt-1 italic leading-relaxed">
                                    "{trip.description}"
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredSortedTrips.map(trip => {
                      const loc = trip.location;
                      return (
                        <div key={trip.id} className="relative bg-bg-primary border-[1.5px] border-border-color/50 rounded-xl overflow-hidden shadow-neo flex flex-col group transition-transform hover:-translate-y-1">
                          <div className="relative h-[110px] w-full overflow-hidden bg-border-color/10">
                            {loc?.image_url ? (
                              <img src={loc.image_url} alt={loc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Plane size={24} className="text-text-secondary/50" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end">
                              <h4 className="text-white font-black text-lg drop-shadow-md truncate">{loc?.name}</h4>
                            </div>
                            <div className="absolute top-2 right-2 flex gap-1">
                              <span className="text-[9px] bg-black/40 text-white px-2 py-0.5 rounded-full backdrop-blur-sm font-bold">
                                {loc?.type === 'province' ? 'Trong nước' : 'Nước ngoài'}
                              </span>
                            </div>
                          </div>
                          <div className="p-3 flex flex-col gap-1.5 flex-1 relative">
                            <div className="absolute -top-3 right-3 flex gap-2 z-10">
                              <button
                                onClick={() => handleEditTrip(trip)}
                                className="bg-bg-card text-text-secondary hover:text-primary-coral p-1.5 rounded-full shadow-md border border-border-color/20"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteTrip(trip.id!)}
                                className="bg-bg-card text-text-secondary hover:text-warning-coral p-1.5 rounded-full shadow-md border border-border-color/20"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            <h5 className="font-extrabold text-[13px] text-text-primary pr-6 line-clamp-1" title={trip.title}>{trip.title}</h5>
                            <div className="flex flex-col gap-1 mt-1">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary/90 bg-bg-primary self-start px-2 py-0.5 rounded-md border border-border-color/20">
                                <Calendar size={10} />
                                <span>{formatShortDate(trip.start_date)}{trip.end_date && trip.end_date !== trip.start_date ? ` → ${formatShortDate(trip.end_date)}` : ''}</span>
                              </div>
                              {getTripDuration(trip.start_date, trip.end_date) && (
                                <span className="text-[9px] font-extrabold text-primary-coral bg-primary-coral/10 border border-primary-coral/20 px-2 py-0.5 rounded-full self-start">
                                  {getTripDuration(trip.start_date, trip.end_date)}
                                </span>
                              )}
                            </div>
                            {trip.description && (
                              <p className="text-[11px] text-text-secondary line-clamp-2 mt-1 italic leading-relaxed">
                                "{trip.description}"
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
              </>
            )}
          </div>

          {/* Sidebar / Tools - Spans 1 column on desktop */}
          {activeTab === 'milestones' && (
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
                className={`w-full ${isSyncMode ? 'bg-secondary-mint text-text-primary' : 'bg-primary-coral text-border-color'} font-extrabold text-xs border-[2.2px] border-border-color rounded-full py-2.5 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none`}
              >
                {isSyncing ? 'Đồng bộ...' : isSyncMode ? `Xác nhận đồng bộ (${selectedForSync.length})` : 'Đồng bộ'}
              </button>
              {isSyncMode && (
                <button
                  onClick={() => { setIsSyncMode(false); setSelectedForSync([]); }}
                  className="w-full bg-bg-card text-text-secondary font-extrabold text-xs border-[2.2px] border-border-color rounded-full py-2.5 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none mt-2"
                >
                  Hủy
                </button>
              )}
            </div>
          </div>
          )}
        </div>

        {/* Add Custom Milestone Modal */}
      </div>

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
              <p className="text-[11px] text-warning-coral font-bold italic mt-2">
                * Hoạt động sẽ tự động xóa sau 3 ngày kể từ ngày diễn ra.
              </p>
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

      {/* Add Travel Trip Modal */}
      {isOpenAddTripModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-text-primary/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-primary w-full max-w-md rounded-2xl border-[2.5px] border-border-color shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col">
            <div className="bg-text-primary p-4 border-b-[2px] border-border-color flex justify-between items-center">
              <h3 className="font-black text-bg-primary text-lg flex items-center gap-2">
                <Plane size={20} /> {editingTripId ? 'Sửa nhật ký chuyến đi' : 'Thêm nhật ký chuyến đi'}
              </h3>
              <button 
                onClick={() => setIsOpenAddTripModal(false)}
                className="w-8 h-8 rounded-full bg-bg-primary/20 text-bg-primary hover:bg-bg-primary/30 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-extrabold text-text-secondary uppercase mb-1.5 ml-1">Tiêu đề chuyến đi <span className="text-warning-coral">*</span></label>
                <input
                  type="text"
                  value={tripTitle}
                  onChange={e => setTripTitle(e.target.value)}
                  placeholder="Ví dụ: Nghỉ dưỡng cuối tuần Đà Lạt"
                  className="w-full bg-bg-card border-[2px] border-border-color rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-text-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-text-secondary uppercase mb-1.5 ml-1">Địa điểm <span className="text-warning-coral">*</span></label>
                <CustomDropdown
                  value={tripLocationId}
                  onChange={(val: any) => setTripLocationId(val ? Number(val) : '')}
                  icon={MapPin}
                  fullWidth={true}
                  options={[
                    { value: '', label: '-- Chọn địa điểm du lịch --' },
                    ...locations.filter(l => l.type === 'province').map(l => ({ value: l.id, label: `${l.name}` })),
                    ...locations.filter(l => l.type === 'country').map(l => ({ value: l.id, label: `${l.name}` }))
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-text-secondary uppercase mb-1.5 ml-1">Ngày đi <span className="text-warning-coral">*</span></label>
                  <input
                    type="date"
                    value={tripStartDate}
                    onChange={e => {
                      const newDate = e.target.value;
                      setTripStartDate(newDate);
                      if (!tripEndDate || new Date(tripEndDate) < new Date(newDate)) {
                        setTripEndDate(newDate);
                      }
                    }}
                    className="w-full bg-bg-card border-[2px] border-border-color rounded-xl px-3 py-3 text-sm font-semibold outline-none focus:border-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-text-secondary uppercase mb-1.5 ml-1">Ngày về <span className="text-warning-coral">*</span></label>
                  <input
                    type="date"
                    value={tripEndDate}
                    onChange={e => setTripEndDate(e.target.value)}
                    className="w-full bg-bg-card border-[2px] border-border-color rounded-xl px-3 py-3 text-sm font-semibold outline-none focus:border-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-text-secondary uppercase mb-1.5 ml-1">Mô tả / Cảm nhận</label>
                <textarea
                  value={tripDescription}
                  onChange={e => setTripDescription(e.target.value)}
                  placeholder="Ghi lại những khoảnh khắc đáng nhớ..."
                  rows={3}
                  className="w-full bg-bg-card border-[2px] border-border-color rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-text-primary transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setIsOpenAddTripModal(false)}
                  className="bg-bg-primary text-text-primary font-extrabold text-[13px] border-[2.2px] border-border-color rounded-xl px-5 py-3 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] inline-flex items-center justify-center transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddTrip}
                  disabled={isAddingTrip || !tripTitle.trim() || !tripStartDate || !tripEndDate || !tripLocationId}
                  className="flex-1 bg-primary-coral text-bg-primary font-extrabold text-[14px] border-[2.2px] border-border-color rounded-xl px-4 py-3 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingTrip ? 'Đang lưu...' : (editingTripId ? 'Cập nhật' : 'Lưu kỷ niệm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {tripToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-text-primary/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-primary w-full max-w-[340px] rounded-3xl border-[2.5px] border-border-color shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col p-6 items-center text-center">
            <div className="w-16 h-16 rounded-full bg-warning-coral/10 flex items-center justify-center mb-4 border-[2px] border-warning-coral/20">
              <Trash2 size={32} className="text-warning-coral" />
            </div>
            <h3 className="font-black text-text-primary text-xl mb-2">Xóa chuyến đi?</h3>
            <p className="text-sm font-bold text-text-secondary leading-relaxed mb-6">
              Bạn có chắc chắn muốn xóa chuyến đi này không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setTripToDelete(null)}
                className="flex-1 bg-bg-primary text-text-primary font-extrabold text-[13px] border-[2.2px] border-border-color rounded-xl px-4 py-3 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
              >
                Giữ lại
              </button>
              <button
                onClick={confirmDeleteTrip}
                className="flex-1 bg-warning-coral text-bg-primary font-extrabold text-[13px] border-[2.2px] border-border-color rounded-xl px-4 py-3 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
              >
                Đồng ý Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MilestonesScreen;
