import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Share, Platform, ImageBackground, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRelationship, demoStorage } from '../core/RelationshipContext';
import { HeartbeatConnector } from '../components/HeartbeatConnector';
import { UserStatusService, MilestoneService, UserMoodLogService, CoupleCountdownCustomizationService, UserPushTokenService, MilestonePlanService, DailyWishService, MOCK_DAILY_WISHES, supabase } from '@forever-days/core';
import type { UserMoodLog, CoupleCountdownCustomization, MilestonePlan, DailyWish } from '@forever-days/core';
import { Calendar, Edit3, Heart, RotateCw, Clock, Cake, Trash2 } from 'lucide-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as ImagePicker from 'expo-image-picker';

export const HomeScreen: React.FC = () => {
  const {
    user, partner, anniversaryDate, isPaired, isDemoMode,
    pairingCode, updateAnniversary, generatePairCode, connectWithCode,
    signOut, error, clearError, coupleId
  } = useRelationship();

  const [isGenerating, setIsGenerating] = useState(false);
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Status State
  const [userEmoji, setUserEmoji] = useState('😊');
  const [userStatusText, setUserStatusText] = useState('Đang rất nhớ đối phương');
  const [partnerEmoji, setPartnerEmoji] = useState('🥰');
  const [partnerStatusText, setPartnerStatusText] = useState('Cảm thấy hạnh phúc');
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  const [customMilestones, setCustomMilestones] = useState<any[]>([]);
  const [plans, setPlans] = useState<MilestonePlan[]>([]);
  const [wishes, setWishes] = useState<DailyWish[]>([]);

  // Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [modalEmoji, setModalEmoji] = useState('😊');
  const [modalText, setModalText] = useState('');
  const [isAnniversaryModalOpen, setIsAnniversaryModalOpen] = useState(false);
  const [anniversaryInput, setAnniversaryInput] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'ios');

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
  const [isSendingTestNotification, setIsSendingTestNotification] = useState(false);

  const statusService = new UserStatusService();
  const moodLogService = new UserMoodLogService();
  const customizationService = new CoupleCountdownCustomizationService();

  const moodEmojis = [
    '😊', '🥰', '😍', '😘', '🥳', '😎', '😜', '😇',
    '🥺', '😢', '😭', '😡', '🤬', '😱', '😴', '🥱',
    '😷', '🤔', '🙄', '💖', '🍿', '🎮', '☕', '🥤'
  ];

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

  const handleSendLoveOrPoke = async (type: 'love' | 'poke') => {
    if (isDemoMode) {
      Alert.alert('Chế độ Demo', 'Ứng dụng đang ở chế độ Demo! Tính năng thông báo đẩy chỉ hoạt động ở chế độ kết nối cơ sở dữ liệu thật.');
      return;
    }
    if (!partner?.id) {
      Alert.alert('Chưa kết nối', 'Bạn chưa kết nối với nửa kia! Hãy ghép đôi để sử dụng tính năng này.');
      return;
    }
    setIsSendingTestNotification(true);
    try {
      const tokenService = new UserPushTokenService();
      const partnerToken = await tokenService.fetchPushToken(partner.id);
      
      const title = type === 'love' ? 'Tín hiệu yêu thương! 💕' : 'Ai đó đang chọc bạn! 🤪';
      const body = type === 'love' 
        ? `${user?.nickname || 'Nửa kia'} đang nhớ bạn rất nhiều! 🥰` 
        : `${user?.nickname || 'Nửa kia'} vừa chọc ghẹo bạn một cái! 🤪`;

      if (partnerToken) {
        await sendPushNotification(partnerToken, title, body);
        Alert.alert('Thành công', type === 'love' ? 'Đã gửi yêu thương thành công đến đối phương! 💕' : 'Đã chọc ghẹo đối phương thành công! 🤪');
      } else {
        Alert.alert(
          'Không tìm thấy Token',
          'Không tìm thấy mã đăng ký thông báo (Push Token) của đối phương!\n\n' +
          'Lưu ý: Đối phương cần phải đăng nhập vào ứng dụng trên điện thoại ít nhất một lần để đăng ký thiết bị.'
        );
      }
    } catch (err: any) {
      console.error('Lỗi khi gửi tín hiệu:', err);
      Alert.alert('Thất bại', 'Đã xảy ra lỗi khi gửi: ' + (err?.message || err));
    } finally {
      setIsSendingTestNotification(false);
    }
  };

  const pickImage = async (field: 'avatar1' | 'avatar2' | 'background') => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Quyền truy cập', 'Bạn cần cấp quyền truy cập thư viện ảnh để chọn ảnh!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: field === 'background' ? [4, 3] : [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]?.base64) {
        const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        if (field === 'avatar1') {
          setThemeAvatar1(base64Uri);
        } else if (field === 'avatar2') {
          setThemeAvatar2(base64Uri);
        } else {
          setThemeBackground(base64Uri);
        }
      }
    } catch (error) {
      console.error('Lỗi chọn ảnh:', error);
      Alert.alert('Lỗi', 'Không thể chọn hoặc xử lý ảnh!');
    }
  };

  const loadStatuses = async () => {
    if (isDemoMode) {
      // Stub loading from global context variables or in-memory
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
      // Mood logs
      const savedMoods = demoStorage['demo_mood_logs'];
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
        demoStorage['demo_mood_logs'] = JSON.stringify(defaultMoods);
      }

      // Custom theme
      const savedTheme = demoStorage['demo_custom_theme'];
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
        const saved = demoStorage['custom_milestones'];
        if (saved) {
          try {
            setCustomMilestones(JSON.parse(saved));
          } catch {}
        }
        const savedPlans = demoStorage['demo_milestone_plans'];
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
      .channel('mobile_user_statuses_realtime')
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

  const shareCode = async () => {
    if (pairingCode) {
      try {
        await Share.share({
          message: `Mã ghép đôi của mình trên ForeverDays là: ${pairingCode}. Hãy nhập mã để chúng ta ghép đôi nha! ❤️`,
        });
      } catch {}
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
      // Local updates
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
    setShowDatePicker(Platform.OS === 'ios');
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
    const newLog = {
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
        demoStorage['demo_mood_logs'] = JSON.stringify(updated);
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
        demoStorage['demo_mood_logs'] = JSON.stringify(updated);
      } else {
        await moodLogService.deleteMoodLog(id);
        await loadThemeAndMoodLogs();
      }
    } catch {}
  };

  // Custom Theme Actions
  const handleSaveTheme = async () => {
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
        demoStorage['demo_custom_theme'] = JSON.stringify(customizationData);
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
        delete demoStorage['demo_custom_theme'];
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Hôm nay yêu</Text>
          <Text style={styles.headerTitle}>Bên nhau trọn đời</Text>
        </View>
        <TouchableOpacity
          onPress={signOut}
          activeOpacity={0.7}
          style={styles.logoutBtn}
        >
          <Text style={styles.logoutBtnText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Pairing Banner if Unpaired */}
        {!isPaired && !isDemoMode && (
          <View style={styles.card}>
            <View style={styles.pairingBannerHeader}>
              <View style={styles.heartCircle}>
                <Heart size={20} color={AppTheme.colorPrimary} fill={AppTheme.colorPrimary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.pairingBannerTitle}>Chưa kết nối với ai cả!</Text>
                <Text style={styles.pairingBannerSub}>Hãy ghép đôi với nửa kia để bắt đầu!</Text>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Mã ghép đôi của bạn</Text>
              <View style={styles.row}>
                <View style={styles.codeDisplay}>
                  <Text style={styles.codeText}>{pairingCode || 'CHƯA TẠO MÃ'}</Text>
                </View>
                {!pairingCode ? (
                  <TouchableOpacity
                    onPress={handleGenerateCode}
                    disabled={isGenerating}
                    activeOpacity={0.8}
                    style={styles.codeButton}
                  >
                    <Text style={styles.codeButtonText}>{isGenerating ? '...' : 'Tạo mã'}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={shareCode}
                    activeOpacity={0.8}
                    style={[styles.codeButton, styles.secondaryButton]}
                  >
                    <Text style={styles.secondaryButtonText}>Gửi</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nhập mã của nửa kia</Text>
              <View style={styles.row}>
                <TextInput
                  value={partnerCodeInput}
                  onChangeText={setPartnerCodeInput}
                  placeholder="Ví dụ: LOVE99"
                  placeholderTextColor="#666"
                  autoCapitalize="characters"
                  style={[styles.input, { flex: 1 }]}
                />
                <TouchableOpacity
                  onPress={handleConnect}
                  disabled={isConnecting}
                  activeOpacity={0.8}
                  style={styles.codeButton}
                >
                  <Text style={styles.codeButtonText}>{isConnecting ? '...' : 'Kết nối'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {error && (
              <Text style={styles.errorLabel}>{error}</Text>
            )}
          </View>
        )}

        {/* Dashboard contents */}
        {(isPaired || isDemoMode) && (
          <View>
            {/* Heartbeat Connector */}
            <View style={[styles.card, { padding: 0, overflow: 'hidden', marginBottom: 16, position: 'relative' }]}>
              <TouchableOpacity
                onPress={() => setIsOpenThemeModal(true)}
                activeOpacity={0.8}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  zIndex: 10,
                  backgroundColor: '#ffffff',
                  borderWidth: 1.5,
                  borderColor: AppTheme.borderColor,
                  borderRadius: 18,
                  padding: 8,
                  elevation: 2,
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 1.41,
                }}
              >
                <Edit3 size={14} color={AppTheme.textPrimary} />
              </TouchableOpacity>
              {themeCustomization?.backgroundUrl ? (
                <ImageBackground source={{ uri: themeCustomization.backgroundUrl }} style={{ width: '100%' }} resizeMode="cover">
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
                  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: 16, marginTop: -8 }}>
                    <TouchableOpacity
                      onPress={() => handleSendLoveOrPoke('love')}
                      disabled={isSendingTestNotification}
                      activeOpacity={0.8}
                      style={{
                        backgroundColor: AppTheme.bgCard,
                        borderWidth: 1.8,
                        borderColor: AppTheme.borderColor,
                        borderRadius: 20,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        shadowColor: '#000000',
                        shadowOffset: { width: 1.5, height: 1.5 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        elevation: 1,
                        flexShrink: 0,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '900', color: AppTheme.textPrimary }}>❤️ Nhớ nửa kia</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleSendLoveOrPoke('poke')}
                      disabled={isSendingTestNotification}
                      activeOpacity={0.8}
                      style={{
                        backgroundColor: AppTheme.bgCard,
                        borderWidth: 1.8,
                        borderColor: AppTheme.borderColor,
                        borderRadius: 20,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        shadowColor: '#000000',
                        shadowOffset: { width: 1.5, height: 1.5 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        elevation: 1,
                        flexShrink: 0,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '900', color: AppTheme.textPrimary }}>🤪 Chọc ghẹo</Text>
                    </TouchableOpacity>
                  </View>
                </ImageBackground>
              ) : (
                <>
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
                  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: 16, marginTop: -8 }}>
                    <TouchableOpacity
                      onPress={() => handleSendLoveOrPoke('love')}
                      disabled={isSendingTestNotification}
                      activeOpacity={0.8}
                      style={{
                        backgroundColor: AppTheme.bgCard,
                        borderWidth: 1.8,
                        borderColor: AppTheme.borderColor,
                        borderRadius: 20,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        shadowColor: '#000000',
                        shadowOffset: { width: 1.5, height: 1.5 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        elevation: 1,
                        flexShrink: 0,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '900', color: AppTheme.textPrimary }}>❤️ Nhớ nửa kia</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleSendLoveOrPoke('poke')}
                      disabled={isSendingTestNotification}
                      activeOpacity={0.8}
                      style={{
                        backgroundColor: AppTheme.bgCard,
                        borderWidth: 1.8,
                        borderColor: AppTheme.borderColor,
                        borderRadius: 20,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        shadowColor: '#000000',
                        shadowOffset: { width: 1.5, height: 1.5 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        elevation: 1,
                        flexShrink: 0,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '900', color: AppTheme.textPrimary }}>🤪 Chọc ghẹo</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

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
                <View style={[styles.card, { backgroundColor: '#fffcfc', padding: 16 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                      <View style={{
                        width: 42,
                        height: 42,
                        borderRadius: 21,
                        backgroundColor: 'rgba(255, 101, 132, 0.1)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1.5,
                        borderColor: AppTheme.borderColor,
                        marginRight: 12,
                      }}>
                        <EventIcon size={20} color={AppTheme.colorPrimary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Sự kiện gần nhất</Text>
                        <Text style={{ fontWeight: '900', fontSize: 15, color: AppTheme.textPrimary }}>{nearestEvent.title}</Text>
                        <Text style={{ fontSize: 11, color: AppTheme.textSecondary, marginTop: 2 }}>{formatDateWithDayOfWeek(nearestEvent.targetDate)}</Text>
                      </View>
                    </View>
                    <View style={{
                      backgroundColor: 'rgba(255, 101, 132, 0.1)',
                      borderWidth: 1.5,
                      borderColor: AppTheme.borderColor,
                      borderRadius: 12,
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      alignItems: 'center',
                    }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: AppTheme.textSecondary, textTransform: 'uppercase' }}>Còn lại</Text>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: AppTheme.colorPrimary }}>{nearestEvent.daysRemaining} ngày</Text>
                    </View>
                  </View>
                  {/* Plan details list */}
                  {(() => {
                    const eventPlans = plans.filter(p => p.milestoneTitle === nearestEvent.title);
                    if (eventPlans.length > 0) {
                      return (
                        <View style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTopWidth: 1,
                          borderStyle: 'dashed',
                          borderColor: 'rgba(0,0,0,0.1)',
                        }}>
                          <Text style={{
                            fontSize: 10,
                            fontWeight: '800',
                            color: AppTheme.textSecondary,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            marginBottom: 8,
                          }}>🚗 Kế hoạch cho ngày này:</Text>
                          <View style={{ flexDirection: 'column', gap: 8 }}>
                            {['go', 'eat', 'play'].map(cat => {
                              const catPlans = eventPlans.filter(p => p.category === cat);
                              const icon = cat === 'go' ? '🚗' : cat === 'eat' ? '🍔' : '🎮';
                              const label = cat === 'go' ? 'Đi đâu' : cat === 'eat' ? 'Ăn gì' : 'Chơi gì';
                              return (
                                <View key={cat} style={{
                                  backgroundColor: '#f9f9f9',
                                  borderWidth: 1,
                                  borderColor: 'rgba(0,0,0,0.05)',
                                  borderRadius: 8,
                                  padding: 8,
                                }}>
                                  <Text style={{
                                    fontSize: 10,
                                    fontWeight: '800',
                                    color: AppTheme.textSecondary,
                                    textTransform: 'uppercase',
                                    marginBottom: 4,
                                  }}>{icon} {label}</Text>
                                  <View style={{ flexDirection: 'column', gap: 2 }}>
                                    {catPlans.length === 0 ? (
                                      <Text style={{ fontSize: 11, fontStyle: 'italic', color: 'rgba(0,0,0,0.3)' }}>Chưa lên kế hoạch</Text>
                                    ) : (
                                      catPlans.map(p => (
                                        <Text key={p.id} style={{ fontSize: 11, fontWeight: '600', color: AppTheme.textPrimary }}>
                                          • {p.content}
                                        </Text>
                                      ))
                                    )}
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      );
                    }
                    return null;
                  })()}
                </View>
              );
            })()}

            {/* Lời chúc ngọt ngào hôm nay */}
            {currentWish && (
              <View style={[
                styles.card, 
                { 
                  marginBottom: 16, 
                  backgroundColor: '#ffffff',
                  borderColor: currentWish.type === 'special' ? AppTheme.colorWarning : AppTheme.borderColor,
                  position: 'relative',
                  overflow: 'hidden'
                }
              ]}>
                {currentWish.type === 'special' && (
                  <View style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: AppTheme.colorWarning,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderBottomLeftRadius: 8,
                    borderLeftWidth: 1.5,
                    borderBottomWidth: 1.5,
                    borderColor: AppTheme.borderColor,
                  }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', color: '#ffffff', textTransform: 'uppercase' }}>Ngày đặc biệt ✨</Text>
                  </View>
                )}
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: currentWish.type === 'special' ? 'rgba(238, 82, 83, 0.1)' : 'rgba(255, 101, 132, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: AppTheme.borderColor,
                  }}>
                    <Heart size={16} color={currentWish.type === 'special' ? AppTheme.colorWarning : AppTheme.colorPrimary} fill={currentWish.type === 'special' ? AppTheme.colorWarning : AppTheme.colorPrimary} />
                  </View>
                  <View style={{ flex: 1, paddingRight: currentWish.type === 'special' ? 40 : 0 }}>
                    <Text style={styles.label}>Lời chúc ngọt ngào hôm nay</Text>
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: AppTheme.textPrimary,
                      fontStyle: 'italic',
                      lineHeight: 18,
                      marginTop: 4,
                    }}>
                      "{currentWish.content}"
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Anniversary display */}
            <View style={[styles.card, styles.rowBetween]}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Ngày bắt đầu yêu</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Calendar size={18} color={AppTheme.colorPrimary} style={{ marginRight: 6 }} />
                  <Text style={styles.annDateText}>{formatDateString(anniversaryDate)}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  onPress={handleOpenAnniversaryModal}
                  activeOpacity={0.8}
                  style={[styles.editBtn, { backgroundColor: AppTheme.textPrimary }]}
                >
                  <Text style={[styles.editBtnText, { color: '#ffffff' }]}>Sửa</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Mood status card */}
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.moodTitle, { marginBottom: 0 }]}>Tâm trạng hôm nay</Text>
                  <Heart size={15} color={AppTheme.colorPrimary} fill={AppTheme.colorPrimary} />
                </View>
                <TouchableOpacity
                  onPress={loadStatuses}
                  disabled={isLoadingStatuses}
                  activeOpacity={0.7}
                  style={{ padding: 4 }}
                >
                  <RotateCw
                    size={16}
                    color={AppTheme.textSecondary}
                    style={isLoadingStatuses ? { opacity: 0.5 } : {}}
                  />
                </TouchableOpacity>
              </View>
              {isLoadingStatuses ? (
                <Text style={styles.loadingText}>Đang tải...</Text>
              ) : (
                <View style={styles.row}>
                  {/* Mine */}
                  <TouchableOpacity
                    onPress={handleOpenStatusModal}
                    activeOpacity={0.9}
                    style={styles.moodBox}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={styles.moodBoxLabel}>Của bạn</Text>
                      <Edit3 size={10} color={AppTheme.textSecondary} />
                    </View>
                    <Text style={styles.moodBoxEmoji}>{userEmoji}</Text>
                    <Text style={styles.moodBoxText}>{userStatusText}</Text>
                  </TouchableOpacity>

                  {/* Partner */}
                  <View style={[styles.moodBox, { marginLeft: 12 }]}>
                    <Text style={styles.moodBoxLabel}>{partner?.nickname || 'Nửa kia'}</Text>
                    <Text style={styles.moodBoxEmoji}>{partnerEmoji}</Text>
                    <Text style={styles.moodBoxText}>{partnerStatusText}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Mood Log Section */}
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={styles.moodTitle}>Lịch sử cảm xúc</Text>
                <TouchableOpacity
                  onPress={() => setIsOpenAddMoodModal(true)}
                  activeOpacity={0.8}
                  style={styles.editBtn}
                >
                  <Text style={styles.editBtnText}>+ Ghi nhận</Text>
                </TouchableOpacity>
              </View>

              {moodLogs.length === 0 ? (
                <Text style={styles.loadingText}>Chưa có lịch sử cảm xúc nào được lưu.</Text>
              ) : (
                <View style={{ gap: 8 }}>
                  {moodLogs.map((log) => {
                    const isOwnLog = log.userId === user?.id || log.userId === 'user-1';
                    const creatorName = isOwnLog ? 'Bạn' : (partner?.nickname || 'Nửa kia');

                    return (
                      <View
                        key={log.id}
                        style={{
                          backgroundColor: AppTheme.bgPrimary,
                          borderWidth: 1.5,
                          borderColor: AppTheme.borderColor,
                          borderRadius: 12,
                          padding: 12,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={{ fontWeight: '800', fontSize: 11, color: AppTheme.textPrimary }}>{creatorName}</Text>
                            <View style={{ backgroundColor: 'white', borderWidth: 1, borderColor: AppTheme.borderColor, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 }}>
                              <Text style={{ fontSize: 9, fontWeight: '800' }}>{log.moodType}</Text>
                            </View>
                            <Text style={{ fontSize: 9, color: AppTheme.textSecondary }}>
                              {new Date(log.createdAt || '').toLocaleDateString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                month: 'numeric',
                                day: 'numeric',
                              })}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: AppTheme.textSecondary, marginTop: 4 }}>{log.note}</Text>
                          {isOwnLog && (
                            <Text style={{ fontSize: 8, color: AppTheme.textSecondary, marginTop: 2 }}>
                              {log.isShared ? '🌍 Chia sẻ với đối phương' : '🔒 Chỉ mình bạn'}
                            </Text>
                          )}
                        </View>

                        {isOwnLog && (
                          <TouchableOpacity
                            onPress={() => handleDeleteMoodLog(log.id)}
                            style={{ padding: 4 }}
                          >
                            <Trash2 size={16} color={AppTheme.colorWarning} />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Mood Edit Overlay Modal */}
      {isStatusModalOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeader}>Cập nhật tâm trạng</Text>
            <View style={styles.modalEmojiDisplay}>
              <Text style={{ fontSize: 42 }}>{modalEmoji}</Text>
            </View>

            <Text style={styles.label}>Chọn một biểu tượng:</Text>
            <ScrollView horizontal style={styles.emojiList} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {moodEmojis.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => setModalEmoji(emoji)}
                  style={[
                    styles.emojiBtn,
                    modalEmoji === emoji && styles.emojiBtnSelected
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Trạng thái ngắn</Text>
            <TextInput
              value={modalText}
              onChangeText={setModalText}
              maxLength={50}
              placeholder="Hôm nay bạn thế nào..."
              placeholderTextColor="#666"
              style={[styles.input, { marginBottom: 20 }]}
            />

            <View style={styles.rowEnd}>
              <TouchableOpacity
                onPress={() => setIsStatusModalOpen(false)}
                style={[styles.actionBtn, styles.secondaryActionBtn]}
              >
                <Text style={styles.secondaryActionBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateStatus}
                style={[styles.actionBtn, { marginLeft: 8 }]}
              >
                <Text style={styles.actionBtnText}>Cập nhật</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Anniversary Edit Overlay Modal */}
      {isAnniversaryModalOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeader}>Chọn ngày kỷ niệm</Text>
            
            {/* Date display */}
            <View style={{
              backgroundColor: 'rgba(255,101,132,0.08)',
              borderWidth: AppTheme.borderWidth,
              borderColor: AppTheme.colorPrimary,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: AppTheme.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>Ngày đã chọn</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: AppTheme.colorPrimary }}>
                {anniversaryInput ? (() => {
                  const parts = anniversaryInput.split('-');
                  if (parts.length === 3) {
                    return `${parts[2]}/${parts[1]}/${parts[0]}`;
                  }
                  return anniversaryInput;
                })() : 'Chưa chọn'}
              </Text>
            </View>

            {/* DateTimePicker (native) */}
            {(Platform.OS === 'ios' || showDatePicker) && (
              <DateTimePicker
                value={anniversaryInput ? (() => {
                  const parts = anniversaryInput.split('-');
                  if (parts.length === 3) {
                    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                  }
                  return new Date();
                })() : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                minimumDate={new Date(2000, 0, 1)}
                onChange={(_event, selectedDate) => {
                  if (Platform.OS === 'android') {
                    setShowDatePicker(false);
                  }
                  if (selectedDate) {
                    const y = selectedDate.getFullYear();
                    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                    const d = String(selectedDate.getDate()).padStart(2, '0');
                    setAnniversaryInput(`${y}-${m}-${d}`);
                  }
                }}
                style={{ width: '100%' }}
              />
            )}

            {/* Android: show button to open picker */}
            {Platform.OS === 'android' && !showDatePicker && (
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: AppTheme.bgPrimary,
                  borderWidth: AppTheme.borderWidth,
                  borderColor: AppTheme.borderColor,
                  borderRadius: 12,
                  paddingVertical: 14,
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', color: AppTheme.textPrimary }}>Chọn ngày từ lịch</Text>
              </TouchableOpacity>
            )}

            <View style={[styles.rowEnd, { marginTop: 16 }]}>
              <TouchableOpacity
                onPress={() => setIsAnniversaryModalOpen(false)}
                style={[styles.actionBtn, styles.secondaryActionBtn]}
              >
                <Text style={[styles.secondaryActionBtnText, { color: '#ffffff' }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveAnniversary}
                style={[styles.actionBtn, { marginLeft: 8 }]}
              >
                <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Add Mood Log Modal */}
      {isOpenAddMoodModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeader}>Ghi nhận cảm xúc mới</Text>

            <Text style={styles.label}>Chọn tâm trạng</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {[
                '😊 Vui vẻ', '🥰 Hạnh phúc', '😡 Giận dỗi', '🥺 Mè nheo',
                '😢 Buồn bã', '🥱 Mệt mỏi', '🥳 Hào hứng', '😴 Buồn ngủ'
              ].map((mood) => (
                <TouchableOpacity
                  key={mood}
                  onPress={() => setSelectedMoodType(mood)}
                  style={[
                    styles.emojiBtn,
                    selectedMoodType === mood && styles.emojiBtnSelected,
                    { width: '47%', paddingVertical: 8, height: 'auto', borderWidth: 1.5, borderColor: AppTheme.borderColor }
                  ]}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800' }}>{mood}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Ghi chú chi tiết</Text>
            <TextInput
              value={moodNote}
              onChangeText={setMoodNote}
              placeholder="Hôm nay có chuyện gì thế..."
              placeholderTextColor="#666"
              style={[styles.input, { marginBottom: 12 }]}
            />

            <TouchableOpacity
              onPress={() => setMoodIsShared(!moodIsShared)}
              activeOpacity={0.8}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}
            >
              <View style={{
                width: 18,
                height: 18,
                borderWidth: 1.8,
                borderColor: AppTheme.borderColor,
                borderRadius: 4,
                backgroundColor: AppTheme.bgPrimary,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}>
                {moodIsShared && <Text style={{ color: AppTheme.colorPrimary, fontWeight: '900', fontSize: 11 }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 12, fontWeight: '800', color: AppTheme.textPrimary }}>Chia sẻ cảm xúc này cho đối phương</Text>
            </TouchableOpacity>

            <View style={styles.rowEnd}>
              <TouchableOpacity
                onPress={() => setIsOpenAddMoodModal(false)}
                style={[styles.actionBtn, styles.secondaryActionBtn]}
              >
                <Text style={styles.secondaryActionBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddMoodLog}
                disabled={isAddingMood}
                style={[styles.actionBtn, { marginLeft: 8 }]}
              >
                <Text style={styles.actionBtnText}>{isAddingMood ? '...' : 'Lưu'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Theme Customization Modal */}
      {isOpenThemeModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeader}>Tùy chỉnh giao diện đếm ngày</Text>

            {/* Field 1: Avatar của bạn */}
            <Text style={styles.label}>Avatar của bạn</Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: AppTheme.bgPrimary,
              borderWidth: 1.5,
              borderColor: AppTheme.borderColor,
              borderRadius: 12,
              padding: 10,
              marginBottom: 12,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  borderWidth: 1.5,
                  borderColor: AppTheme.borderColor,
                  overflow: 'hidden',
                  backgroundColor: AppTheme.bgCard,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  {themeAvatar1 ? (
                    <ImageBackground source={{ uri: themeAvatar1 }} style={{ width: '100%', height: '100%' }} />
                  ) : user?.avatarUrl ? (
                    <ImageBackground source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%', opacity: 0.6 }} />
                  ) : (
                    <Text style={{ fontSize: 18 }}>👦</Text>
                  )}
                </View>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: AppTheme.textPrimary }}>
                    {themeAvatar1 ? 'Đã tùy chỉnh' : 'Mặc định'}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  onPress={() => pickImage('avatar1')}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: AppTheme.colorPrimary,
                    borderWidth: 1.5,
                    borderColor: AppTheme.borderColor,
                    borderRadius: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#ffffff' }}>Chọn ảnh</Text>
                </TouchableOpacity>
                {!!themeAvatar1 && (
                  <TouchableOpacity
                    onPress={() => setThemeAvatar1('')}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: AppTheme.bgCard,
                      borderWidth: 1.5,
                      borderColor: AppTheme.borderColor,
                      borderRadius: 8,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '800', color: AppTheme.textPrimary }}>Xóa</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Field 2: Avatar của đối phương */}
            <Text style={styles.label}>Avatar đối phương</Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: AppTheme.bgPrimary,
              borderWidth: 1.5,
              borderColor: AppTheme.borderColor,
              borderRadius: 12,
              padding: 10,
              marginBottom: 12,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  borderWidth: 1.5,
                  borderColor: AppTheme.borderColor,
                  overflow: 'hidden',
                  backgroundColor: AppTheme.bgCard,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  {themeAvatar2 ? (
                    <ImageBackground source={{ uri: themeAvatar2 }} style={{ width: '100%', height: '100%' }} />
                  ) : partner?.avatarUrl ? (
                    <ImageBackground source={{ uri: partner.avatarUrl }} style={{ width: '100%', height: '100%', opacity: 0.6 }} />
                  ) : (
                    <Text style={{ fontSize: 18 }}>👧</Text>
                  )}
                </View>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: AppTheme.textPrimary }}>
                    {themeAvatar2 ? 'Đã tùy chỉnh' : 'Mặc định'}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  onPress={() => pickImage('avatar2')}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: AppTheme.colorPrimary,
                    borderWidth: 1.5,
                    borderColor: AppTheme.borderColor,
                    borderRadius: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#ffffff' }}>Chọn ảnh</Text>
                </TouchableOpacity>
                {!!themeAvatar2 && (
                  <TouchableOpacity
                    onPress={() => setThemeAvatar2('')}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: AppTheme.bgCard,
                      borderWidth: 1.5,
                      borderColor: AppTheme.borderColor,
                      borderRadius: 8,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '800', color: AppTheme.textPrimary }}>Xóa</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Field 3: Hình nền */}
            <Text style={styles.label}>Hình nền đếm ngày</Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: AppTheme.bgPrimary,
              borderWidth: 1.5,
              borderColor: AppTheme.borderColor,
              borderRadius: 12,
              padding: 10,
              marginBottom: 20,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{
                  width: 56,
                  height: 42,
                  borderRadius: 6,
                  borderWidth: 1.5,
                  borderColor: AppTheme.borderColor,
                  overflow: 'hidden',
                  backgroundColor: AppTheme.bgCard,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  {themeBackground ? (
                    <ImageBackground source={{ uri: themeBackground }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Text style={{ fontSize: 9, fontWeight: '800', color: AppTheme.textSecondary, textAlign: 'center' }}>Mặc định</Text>
                  )}
                </View>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: AppTheme.textPrimary }}>
                    {themeBackground ? 'Đã tùy chỉnh' : 'Mặc định'}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  onPress={() => pickImage('background')}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: AppTheme.colorPrimary,
                    borderWidth: 1.5,
                    borderColor: AppTheme.borderColor,
                    borderRadius: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#ffffff' }}>Chọn ảnh</Text>
                </TouchableOpacity>
                {!!themeBackground && (
                  <TouchableOpacity
                    onPress={() => setThemeBackground('')}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: AppTheme.bgCard,
                      borderWidth: 1.5,
                      borderColor: AppTheme.borderColor,
                      borderRadius: 8,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '800', color: AppTheme.textPrimary }}>Xóa</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={handleResetTheme}
                disabled={isSavingTheme}
                style={[styles.actionBtn, { backgroundColor: AppTheme.colorWarning }]}
              >
                <Text style={styles.actionBtnText}>Reset</Text>
              </TouchableOpacity>

              <View style={styles.rowEnd}>
                <TouchableOpacity
                  onPress={() => setIsOpenThemeModal(false)}
                  style={[styles.actionBtn, styles.secondaryActionBtn]}
                >
                  <Text style={styles.secondaryActionBtnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveTheme}
                  disabled={isSavingTheme}
                  style={[styles.actionBtn, { marginLeft: 8 }]}
                >
                  <Text style={styles.actionBtnText}>{isSavingTheme ? '...' : 'Lưu'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
      {nearestEvent?.daysRemaining === 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ConfettiCannon count={200} origin={{x: -10, y: 0}} fallSpeed={2500} fadeOut autoStart={true} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: AppTheme.borderWidth,
    borderColor: AppTheme.borderColor,
    backgroundColor: AppTheme.bgCard,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '700',
    color: AppTheme.textSecondary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: AppTheme.textPrimary,
  },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: AppTheme.borderColor,
    borderRadius: 20,
    backgroundColor: 'rgba(61,47,61,0.05)',
  },
  logoutBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: AppTheme.textPrimary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: AppTheme.bgCard,
    borderWidth: AppTheme.borderWidth,
    borderColor: AppTheme.borderColor,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: AppTheme.borderColor,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  pairingBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heartCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 142, 158, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIconText: {
    fontSize: 18,
  },
  pairingBannerTitle: {
    fontWeight: '800',
    fontSize: 15,
    color: AppTheme.textPrimary,
  },
  pairingBannerSub: {
    fontSize: 11,
    color: AppTheme.textSecondary,
  },
  formGroup: {
    marginVertical: 8,
  },
  label: {
    fontWeight: '800',
    fontSize: 11,
    color: AppTheme.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  codeDisplay: {
    flex: 1,
    borderWidth: AppTheme.borderWidth,
    borderColor: AppTheme.borderColor,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppTheme.bgPrimary,
  },
  codeText: {
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 3,
    color: AppTheme.colorPrimary,
  },
  codeButton: {
    backgroundColor: AppTheme.colorPrimary,
    borderWidth: AppTheme.borderWidth,
    borderColor: AppTheme.borderColor,
    borderRadius: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeButtonText: {
    fontWeight: '800',
    color: AppTheme.borderColor,
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: AppTheme.textPrimary,
  },
  secondaryButtonText: {
    color: AppTheme.borderColor,
    fontWeight: '900',
  },
  divider: {
    borderTopWidth: 2,
    borderColor: AppTheme.borderColor,
    borderStyle: 'dashed',
    marginVertical: 14,
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
  errorLabel: {
    color: AppTheme.colorWarning,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 14,
    textAlign: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  annDateText: {
    fontWeight: '800',
    fontSize: 17,
    color: AppTheme.textPrimary,
    marginTop: 2,
  },
  editBtn: {
    backgroundColor: AppTheme.bgCard,
    borderWidth: AppTheme.borderWidth,
    borderColor: AppTheme.borderColor,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    shadowColor: AppTheme.borderColor,
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  editBtnText: {
    fontWeight: '800',
    fontSize: 12,
    color: AppTheme.textPrimary,
  },
  moodTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: AppTheme.textPrimary,
    marginBottom: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: AppTheme.textSecondary,
    paddingVertical: 20,
  },
  moodBox: {
    flex: 1,
    padding: 16,
    backgroundColor: AppTheme.bgPrimary,
    borderWidth: 1.8,
    borderColor: AppTheme.borderColor,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodBoxLabel: {
    fontSize: 10,
    color: AppTheme.textSecondary,
    fontWeight: '800',
  },
  moodBoxEmoji: {
    fontSize: 32,
    marginVertical: 8,
  },
  moodBoxText: {
    fontSize: 11,
    fontWeight: '700',
    color: AppTheme.textPrimary,
    textAlign: 'center',
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
    marginBottom: 20,
  },
  modalEmojiDisplay: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: AppTheme.borderColor,
    backgroundColor: AppTheme.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  emojiList: {
    flexDirection: 'row',
    marginBottom: 16,
    maxHeight: 46,
  },
  emojiBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  emojiBtnSelected: {
    borderColor: AppTheme.colorPrimary,
    backgroundColor: 'rgba(255,142,158,0.15)',
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
export default HomeScreen;
