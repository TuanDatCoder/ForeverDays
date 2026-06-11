import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image
} from 'react-native';
import { Camera, User, Heart, Ruler, CupSoda, Utensils } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRelationship, demoStorage } from '../core/RelationshipContext';
import { LoveUtils } from '../core/loveUtils';
import {
  UserSizeService,
  UserBobaPreferenceService,
  UserHobbyService,
  UserFavoriteService,
  CoupleService,
  PartnerProfileNoteService,
  UserPushTokenService
} from '@forever-days/core';
import type { UserSize, UserBobaPreference, UserHobby, UserFavorite, PartnerProfileNote } from '@forever-days/core';

export const ProfileScreen: React.FC = () => {
  const {
    user,
    partner,
    isDemoMode,
    updateProfile,
    coupleId,
    signOut
  } = useRelationship();

  const [activeTab, setActiveTab] = useState<'info' | 'sizes' | 'boba' | 'hobbies' | 'notes' | 'breakup' | 'about'>('info');

  // Partner Notes State
  const [partnerNote, setPartnerNote] = useState<PartnerProfileNote | null>(null);
  const [myNoteAboutPartner, setMyNoteAboutPartner] = useState<PartnerProfileNote | null>(null);
  const [noteHeight, setNoteHeight] = useState('');
  const [noteWeight, setNoteWeight] = useState('');
  const [noteHobbies, setNoteHobbies] = useState('');
  const [notePersonality, setNotePersonality] = useState('');
  const [noteIsShared, setNoteIsShared] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  const noteService = new PartnerProfileNoteService();

  // Personal Info Inputs (Own)
  const [nickname, setNickname] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Chưa chọn');
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  const AVATAR_PRESETS = [
    { name: 'Oliver 🐼', url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Oliver' },
    { name: 'Lily 🐱', url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Lily' },
    { name: 'Jack 🐶', url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Jack' },
    { name: 'Daisy 🐰', url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Daisy' },
    { name: 'Milo 🦊', url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Milo' },
    { name: 'Mia 🐿️', url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Mia' },
    { name: 'Ruby 🐨', url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Ruby' },
    { name: 'Zoe 🐻', url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Zoe' },
    { name: 'Bella 🐝', url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Bella' },
    { name: 'Coco 🦖', url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Coco' },
    { name: 'Teddy 🐧', url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Teddy' },
    { name: 'Lulu 🦄', url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Lulu' },
  ];

  useEffect(() => {
    if (user?.avatarUrl) {
      setCustomAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  const handleSelectPreset = async (url: string) => {
    await updateProfile(true, nickname.trim(), dob, gender, url);
    setCustomAvatarUrl(url);
    Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện!');
  };

  const handleSaveCustomAvatarUrl = async () => {
    await updateProfile(true, nickname.trim(), dob, gender, customAvatarUrl.trim());
    Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện qua link!');
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Quyền truy cập', 'Bạn cần cấp quyền truy cập thư viện ảnh để chọn ảnh!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 200 } }],
          { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        if (manipResult.base64) {
          const base64Uri = `data:image/jpeg;base64,${manipResult.base64}`;
          await updateProfile(true, nickname.trim(), dob, gender, base64Uri);
          setCustomAvatarUrl(base64Uri);
          Alert.alert('Thành công', 'Đã tải lên và cập nhật ảnh đại diện!');
        }
      }
    } catch (error) {
      console.error('Lỗi chọn ảnh:', error);
      Alert.alert('Lỗi', 'Không thể chọn hoặc xử lý ảnh!');
    }
  };

  // Clothing Sizes
  const [_sizes, _setSizes] = useState<UserSize | null>(null);
  const [partnerSizes, setPartnerSizes] = useState<UserSize | null>(null);
  const [shirtSize, setShirtSize] = useState('M');
  const [pantsSize, setPantsSize] = useState('30');
  const [shoeSize, setShoeSize] = useState(40);
  const [ringSize, setRingSize] = useState(15);
  const [isUpdatingSizes, setIsUpdatingSizes] = useState(false);

  // Boba Preferences
  const [_boba, _setBoba] = useState<UserBobaPreference | null>(null);
  const [partnerBoba, setPartnerBoba] = useState<UserBobaPreference | null>(null);
  const [sugar, setSugar] = useState('70%');
  const [ice, setIce] = useState('Normal');
  const [toppings, setToppings] = useState('');
  const [note, setNote] = useState('');
  const [isUpdatingBoba, setIsUpdatingBoba] = useState(false);

  // Hobbies & Favorites
  const [hobbies, setHobbies] = useState<UserHobby[]>([]);
  const [partnerHobbies, setPartnerHobbies] = useState<UserHobby[]>([]);
  const [newHobbyName, setNewHobbyName] = useState('');
  const [newHobbyDesc, setNewHobbyDesc] = useState('');

  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [partnerFavorites, setPartnerFavorites] = useState<UserFavorite[]>([]);
  const [newFavName, setNewFavName] = useState('');
  const [newFavCategory, setNewFavCategory] = useState('Thức ăn');
  const [newFavDislike, setNewFavDislike] = useState(false);

  // Breakup Voting
  const [votedBreakup, setVotedBreakup] = useState(false);
  const [partnerVotedBreakup, setPartnerVotedBreakup] = useState(false);
  const [isCastingVote, setIsCastingVote] = useState(false);

  // Services
  const sizeService = new UserSizeService();
  const bobaService = new UserBobaPreferenceService();
  const hobbyService = new UserHobbyService();
  const favService = new UserFavoriteService();
  const coupleService = new CoupleService();

  // Load User Data
  const loadProfileData = async () => {
    if (user) {
      setNickname(user.nickname);
      setDob(user.dob || '');
      setGender(user.gender || 'Chưa chọn');
    }

    if (isDemoMode) {
      // Load sizes from local storage
      setShirtSize(demoStorage['demo_shirt_size'] || 'M');
      setPantsSize(demoStorage['demo_pants_size'] || '30');
      setShoeSize(Number(demoStorage['demo_shoe_size'] || '40'));
      setRingSize(Number(demoStorage['demo_ring_size'] || '15'));
      setPartnerSizes({
        id: 'p-sizes',
        userId: 'user-2',
        shirtSize: 'S',
        pantsSize: '27',
        shoeSize: 37,
        ringSize: 10
      });

      // Load Boba
      setSugar(demoStorage['demo_boba_sugar'] || '70%');
      setIce(demoStorage['demo_boba_ice'] || 'Normal');
      setToppings(demoStorage['demo_boba_toppings'] || 'Trân châu đen, Thạch dừa');
      setNote(demoStorage['demo_boba_note'] || 'Ít sữa đặc');
      setPartnerBoba({
        id: 'p-boba',
        userId: 'user-2',
        favoriteTopping: ['Trân châu trắng', 'Kem muối'],
        sugarLevel: '50%',
        iceLevel: 'Less Ice',
        note: 'Không lấy thạch'
      });

      // Hobbies
      setHobbies([
        { id: 'h-1', userId: 'user-1', hobbyName: 'Chơi game', description: 'Thích chơi LoL, Valorant' },
        { id: 'h-2', userId: 'user-1', hobbyName: 'Nghe nhạc', description: 'Pop, Lofi chill' }
      ]);
      setPartnerHobbies([
        { id: 'h-p1', userId: 'user-2', hobbyName: 'Nấu ăn', description: 'Thích làm bánh ngọt' },
        { id: 'h-p2', userId: 'user-2', hobbyName: 'Đọc truyện', description: 'Truyện trinh thám' }
      ]);

      // Favorites
      setFavorites([
        { id: 'f-1', userId: 'user-1', category: 'Thức ăn', itemName: 'Lẩu Thái', isDislike: false },
        { id: 'f-2', userId: 'user-1', category: 'Màu sắc', itemName: 'Xanh dương', isDislike: false }
      ]);
      setPartnerFavorites([
        { id: 'f-p1', userId: 'user-2', category: 'Thức ăn', itemName: 'Sầu riêng', isDislike: true },
        { id: 'f-p2', userId: 'user-2', category: 'Màu sắc', itemName: 'Hồng pastel', isDislike: false }
      ]);

      // Load partner notes (demo mode)
      const demoMyNote = demoStorage['demo_partner_note_my'];
      if (demoMyNote) {
        try {
          const parsed = JSON.parse(demoMyNote);
          setMyNoteAboutPartner(parsed);
          setNoteHeight(parsed.height || '');
          setNoteWeight(parsed.weight || '');
          setNoteHobbies(parsed.hobbies || '');
          setNotePersonality(parsed.personality || '');
          setNoteIsShared(parsed.isShared || false);
        } catch {}
      } else {
        setNoteHeight('1m62');
        setNoteWeight('48kg');
        setNoteHobbies('Thích đi cà phê chụp ảnh');
        setNotePersonality('Dễ thương, thỉnh thoảng hay dỗi');
        setNoteIsShared(true);
      }
      setPartnerNote({
        id: 'p-note',
        coupleId: 'demo-couple-id',
        writerId: 'user-2',
        targetId: 'user-1',
        height: '1m78',
        weight: '68kg',
        hobbies: 'Đá bóng, chơi game PC',
        personality: 'Hiền lành, kiên nhẫn',
        isShared: true
      });

      return;
    }

    if (!user) return;

    // Load sizes
    const sizeRes = await sizeService.fetchSizes(user.id);
    if (sizeRes) {
      setShirtSize(sizeRes.shirtSize || 'M');
      setPantsSize(sizeRes.pantsSize || '30');
      setShoeSize(sizeRes.shoeSize || 40);
      setRingSize(sizeRes.ringSize || 15);
    }
    if (partner) {
      const pSize = await sizeService.fetchSizes(partner.id);
      setPartnerSizes(pSize);
    }

    // Load Boba
    const bobaRes = await bobaService.fetchBobaPreferences(user.id);
    if (bobaRes) {
      setSugar(bobaRes.sugarLevel || '70%');
      setIce(bobaRes.iceLevel || 'Normal');
      setToppings(bobaRes.favoriteTopping.join(', '));
      setNote(bobaRes.note || '');
    }
    if (partner) {
      const pBoba = await bobaService.fetchBobaPreferences(partner.id);
      setPartnerBoba(pBoba);
    }

    // Load Hobbies & Favorites
    const myH = await hobbyService.fetchHobbies(user.id);
    setHobbies(myH);
    const myF = await favService.fetchFavorites(user.id);
    setFavorites(myF);

    if (partner) {
      const pH = await hobbyService.fetchHobbies(partner.id);
      setPartnerHobbies(pH);
      const pF = await favService.fetchFavorites(partner.id);
      setPartnerFavorites(pF);
    }

    // Load Breakup status from couple
    if (coupleId) {
      const activeCouple = await coupleService.fetchActiveCouple(user.id);
      if (activeCouple) {
        const isUser1 = activeCouple.user1Id === user.id;
        setVotedBreakup(isUser1 ? activeCouple.user1VotedBreakup : activeCouple.user2VotedBreakup);
        setPartnerVotedBreakup(isUser1 ? activeCouple.user2VotedBreakup : activeCouple.user1VotedBreakup);
      }
    }

    // Load Partner Notes
    try {
      if (partner) {
        const myNote = await noteService.fetchNote(user.id, partner.id);
        if (myNote) {
          setMyNoteAboutPartner(myNote);
          setNoteHeight(myNote.height || '');
          setNoteWeight(myNote.weight || '');
          setNoteHobbies(myNote.hobbies || '');
          setNotePersonality(myNote.personality || '');
          setNoteIsShared(myNote.isShared || false);
        }
        const pNote = await noteService.fetchNote(partner.id, user.id);
        if (pNote && pNote.isShared) {
          setPartnerNote(pNote);
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadProfileData();
  }, [user, partner, coupleId, isDemoMode]);

  // Partner Notes Action
  const handleSaveNote = async () => {
    setIsSavingNote(true);
    const noteData = {
      coupleId: coupleId || 'demo-couple-id',
      writerId: user?.id || 'user-1',
      targetId: partner?.id || 'user-2',
      height: noteHeight.trim(),
      weight: noteWeight.trim(),
      hobbies: noteHobbies.trim(),
      personality: notePersonality.trim(),
      isShared: noteIsShared,
    };

    try {
      if (isDemoMode) {
        demoStorage['demo_partner_note_my'] = JSON.stringify(noteData);
        setMyNoteAboutPartner(noteData as any);
        Alert.alert('Thành công', 'Đã lưu ghi chú đối phương (Demo mode)');
      } else {
        await noteService.upsertNote(noteData);
        Alert.alert('Thành công', 'Đã lưu ghi chú đối phương');
        await loadProfileData();
      }
    } catch {
      Alert.alert('Thất bại', 'Không thể lưu ghi chú.');
    }
    setIsSavingNote(false);
  };

  // Info Actions
  const handleSaveInfo = async () => {
    if (!nickname.trim()) return;
    setIsUpdatingInfo(true);
    await updateProfile(true, nickname.trim(), dob, gender);
    setIsUpdatingInfo(false);
    Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân!');
  };

  // Sizes Actions
  const handleSaveSizes = async () => {
    setIsUpdatingSizes(true);
    if (isDemoMode) {
      demoStorage['demo_shirt_size'] = shirtSize;
      demoStorage['demo_pants_size'] = pantsSize;
      demoStorage['demo_shoe_size'] = String(shoeSize);
      demoStorage['demo_ring_size'] = String(ringSize);
    } else if (user) {
      await sizeService.updateSizes(user.id, shirtSize, pantsSize, shoeSize, ringSize);
    }
    setIsUpdatingSizes(false);
    Alert.alert('Thành công', 'Đã lưu thông số kích cỡ của bạn!');
  };

  // Boba Actions
  const handleSaveBoba = async () => {
    setIsUpdatingBoba(true);
    if (isDemoMode) {
      demoStorage['demo_boba_sugar'] = sugar;
      demoStorage['demo_boba_ice'] = ice;
      demoStorage['demo_boba_toppings'] = toppings;
      demoStorage['demo_boba_note'] = note;
    } else if (user) {
      await bobaService.updateBobaPreferences(user.id, sugar, ice, toppings, note);
    }
    setIsUpdatingBoba(false);
    Alert.alert('Thành công', 'Đã cập nhật tùy chọn trà sữa!');
  };

  // Hobbies Actions
  const handleAddHobby = async () => {
    if (!newHobbyName.trim()) return;

    if (isDemoMode) {
      const newItem: UserHobby = {
        id: `h-${Date.now()}`,
        userId: 'user-1',
        hobbyName: newHobbyName.trim(),
        description: newHobbyDesc.trim(),
      };
      setHobbies([...hobbies, newItem]);
    } else if (user) {
      await hobbyService.addHobby(newHobbyName.trim(), newHobbyDesc.trim(), user.id);
      const myH = await hobbyService.fetchHobbies(user.id);
      setHobbies(myH);
    }

    setNewHobbyName('');
    setNewHobbyDesc('');
  };

  const handleDeleteHobby = async (id: string) => {
    if (isDemoMode) {
      setHobbies(hobbies.filter(h => h.id !== id));
    } else {
      await hobbyService.deleteHobby(id);
      if (user) {
        const myH = await hobbyService.fetchHobbies(user.id);
        setHobbies(myH);
      }
    }
  };

  // Favorites Actions
  const handleAddFavorite = async () => {
    if (!newFavName.trim()) return;

    if (isDemoMode) {
      const newItem: UserFavorite = {
        id: `f-${Date.now()}`,
        userId: 'user-1',
        category: newFavCategory,
        itemName: newFavName.trim(),
        isDislike: newFavDislike,
      };
      setFavorites([...favorites, newItem]);
    } else if (user) {
      await favService.addFavorite(newFavName.trim(), newFavCategory, newFavDislike, user.id);
      const myF = await favService.fetchFavorites(user.id);
      setFavorites(myF);
    }

    setNewFavName('');
    setNewFavDislike(false);
  };

  const handleDeleteFavorite = async (id: string) => {
    if (isDemoMode) {
      setFavorites(favorites.filter(f => f.id !== id));
    } else {
      await favService.deleteFavorite(id);
      if (user) {
        const myF = await favService.fetchFavorites(user.id);
        setFavorites(myF);
      }
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
      data: { screen: 'Profile' },
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

  // Breakup Actions
  const handleVoteBreakup = async () => {
    if (isDemoMode) {
      Alert.alert('Thông báo', 'Đã giải tán mối tình thử nghiệm!', [
        { text: 'OK', onPress: signOut }
      ]);
      return;
    }
    if (!coupleId || !user) return;

    setIsCastingVote(true);
    const activeCouple = await coupleService.fetchActiveCouple(user.id);
    if (activeCouple) {
      const isUser1 = activeCouple.user1Id === user.id;
      const key = isUser1 ? 'user_1_voted_breakup' : 'user_2_voted_breakup';
      const nextVoteValue = !votedBreakup;

      await coupleService.updateVotedBreakup(coupleId, key, nextVoteValue);
      setVotedBreakup(nextVoteValue);

      // Trigger push notification to partner
      if (partner?.id) {
        try {
          const tokenService = new UserPushTokenService();
          const partnerToken = await tokenService.fetchPushToken(partner.id);
          if (partnerToken) {
            const title = nextVoteValue ? 'Quyết định quan trọng! 💔' : 'Rút lại quyết định! ❤️';
            const body = nextVoteValue
              ? `${user?.nickname || 'Người ấy'} đã biểu quyết giải tán mối quan hệ.`
              : `${user?.nickname || 'Người ấy'} đã rút lại biểu quyết giải tán mối quan hệ.`;
            await sendPushNotification(partnerToken, title, body);
          }
        } catch (err) {
          console.log('Lỗi gửi push notification giải tán:', err);
        }
      }

      Alert.alert(
        'Đã ghi nhận biểu quyết',
        nextVoteValue
          ? 'Bạn đã bỏ phiếu dừng lại. Nếu đối phương cũng đồng ý, mối quan hệ sẽ chấm dứt.'
          : 'Bạn đã rút lại phiếu biểu quyết chia tay.',
        [{ text: 'OK' }]
      );
    }
    setIsCastingVote(false);
  };

  const getZodiacInfo = (dobStr?: string) => {
    if (!dobStr) return null;
    return LoveUtils.getZodiacSign(dobStr);
  };

  const formatBirthday = (dobStr?: string) => {
    if (!dobStr) return 'Chưa chọn';
    const date = new Date(dobStr);
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ & Sở thích</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
          {(['info', 'sizes', 'boba', 'hobbies', 'notes', 'breakup', 'about'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabButton,
                activeTab === tab && styles.tabButtonActive
              ]}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === tab && styles.tabButtonTextActive
                ]}
              >
                {tab === 'info'
                  ? 'Chi tiết'
                  : tab === 'sizes'
                  ? 'Kích cỡ'
                  : tab === 'boba'
                  ? 'Gu Boba'
                  : tab === 'hobbies'
                  ? 'Sở thích'
                  : tab === 'notes'
                  ? 'Ghi chú'
                  : tab === 'breakup'
                  ? 'Giải tán'
                  : 'Giới thiệu'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Tab 1: Info */}
        {activeTab === 'info' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cập nhật thông tin của bạn</Text>

              {/* Avatar Section */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={{ position: 'relative' }}>
                  <View style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    borderWidth: AppTheme.borderWidth,
                    borderColor: AppTheme.borderColor,
                    backgroundColor: AppTheme.bgPrimary,
                    overflow: 'hidden',
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: AppTheme.borderColor,
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                    elevation: 2,
                  }}>
                    {user?.avatarUrl ? (
                      <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <User size={36} color={AppTheme.textSecondary} />
                    )}
                  </View>
                  {/* Floating camera icon */}
                  <View style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: AppTheme.colorPrimary,
                    borderWidth: 1.8,
                    borderColor: AppTheme.borderColor,
                    borderRadius: 15,
                    width: 30,
                    height: 30,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: AppTheme.borderColor,
                    shadowOffset: { width: 1, height: 1 },
                    shadowOpacity: 0.8,
                    shadowRadius: 0,
                    elevation: 3,
                  }}>
                    <Camera size={14} color={AppTheme.borderColor} />
                  </View>
                </TouchableOpacity>
                <Text style={{ fontSize: 10, color: AppTheme.textSecondary, marginTop: 8, fontWeight: '700' }}>Ảnh Đại Diện Của Bạn</Text>
              </View>

              {/* Predefined Avatars */}
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.label}>Chọn Avatar Cặp Đôi Đáng Yêu</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleSelectPreset(preset.url)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        borderWidth: 1.8,
                        borderColor: user?.avatarUrl === preset.url ? AppTheme.colorPrimary : 'rgba(61,47,61,0.2)',
                        padding: 2,
                        backgroundColor: '#fff',
                      }}
                    >
                      <Image source={{ uri: preset.url }} style={{ width: '100%', height: '100%', borderRadius: 20 }} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Custom URL Input */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Hoặc Link Ảnh Tùy Chọn</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={customAvatarUrl}
                    onChangeText={setCustomAvatarUrl}
                    placeholder="Dán link ảnh tại đây..."
                    placeholderTextColor="#666"
                    style={[styles.input, { flex: 1, paddingVertical: 8 }]}
                  />
                  <TouchableOpacity
                    onPress={handleSaveCustomAvatarUrl}
                    style={[styles.saveBtn, { paddingHorizontal: 12, paddingVertical: 8 }]}
                  >
                    <Text style={[styles.saveBtnText, { fontSize: 11 }]}>Lưu Link</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Biệt danh</Text>
                <TextInput
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="Nhập biệt danh của bạn..."
                  placeholderTextColor="#666"
                  style={styles.input}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ngày sinh (YYYY-MM-DD)</Text>
                <TextInput
                  value={dob}
                  onChangeText={setDob}
                  placeholder="Ví dụ: 2001-08-15"
                  placeholderTextColor="#666"
                  style={styles.input}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Giới tính</Text>
                <View style={styles.genderRow}>
                  {['Nam', 'Nữ', 'Chưa chọn'].map(g => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setGender(g)}
                      style={[
                        styles.genderBtn,
                        gender === g && styles.genderBtnActive
                      ]}
                    >
                      <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {dob ? (
                (() => {
                  const zodiac = getZodiacInfo(dob);
                  if (!zodiac) return null;
                  return (
                    <View style={styles.zodiacCard}>
                      <Text style={styles.zodiacEmoji}>{zodiac.emoji}</Text>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.zodiacTitle}>Cung hoàng đạo: {zodiac.nameVi} ({zodiac.nameEn})</Text>
                        <Text style={styles.zodiacPeriod}>Chu kỳ: {zodiac.dateRange}</Text>
                      </View>
                    </View>
                  );
                })()
              ) : null}

              <TouchableOpacity
                onPress={handleSaveInfo}
                disabled={isUpdatingInfo}
                style={styles.saveBtn}
              >
                <Text style={styles.saveBtnText}>
                  {isUpdatingInfo ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Text>
              </TouchableOpacity>
            </View>

            {partner && (
              <View style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                  <Heart size={18} color={AppTheme.colorSecondary} fill={AppTheme.colorSecondary} />
                  <Text style={[styles.cardTitle, { color: AppTheme.colorSecondary, marginBottom: 0 }]}>Thông tin đối phương</Text>
                </View>
                
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    borderWidth: AppTheme.borderWidth,
                    borderColor: AppTheme.borderColor,
                    backgroundColor: AppTheme.bgPrimary,
                    overflow: 'hidden',
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: AppTheme.borderColor,
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                    elevation: 2,
                  }}>
                    {partner.avatarUrl ? (
                      <Image source={{ uri: partner.avatarUrl }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <User size={32} color={AppTheme.textSecondary} />
                    )}
                  </View>
                </View>

                <View style={styles.partnerInfoRow}>
                  <Text style={styles.partnerInfoLabel}>Biệt danh</Text>
                  <Text style={styles.partnerInfoValue}>{partner.nickname}</Text>
                </View>

                <View style={styles.partnerInfoRow}>
                  <Text style={styles.partnerInfoLabel}>Ngày sinh</Text>
                  <Text style={styles.partnerInfoValue}>{formatBirthday(partner.dob)}</Text>
                </View>

                <View style={styles.partnerInfoRow}>
                  <Text style={styles.partnerInfoLabel}>Giới tính</Text>
                  <Text style={styles.partnerInfoValue}>{partner.gender}</Text>
                </View>

                {partner.dob ? (
                  (() => {
                    const pZodiac = getZodiacInfo(partner.dob);
                    if (!pZodiac) return null;
                    return (
                      <View style={[styles.zodiacCard, { marginTop: 12, backgroundColor: 'rgba(181, 234, 215, 0.05)' }]}>
                        <Text style={styles.zodiacEmoji}>{pZodiac.emoji}</Text>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.zodiacTitle}>Cung hoàng đạo: {pZodiac.nameVi}</Text>
                        </View>
                      </View>
                    );
                  })()
                ) : null}
              </View>
            )}
          </View>
        )}

        {/* Tab 2: Sizes */}
        {activeTab === 'sizes' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <Ruler size={18} color={AppTheme.textPrimary} />
                <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Thông số kích cỡ của bạn</Text>
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Áo thun</Text>
                  <TextInput
                    value={shirtSize}
                    onChangeText={setShirtSize}
                    placeholder="L, M, S..."
                    placeholderTextColor="#666"
                    style={styles.input}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={styles.label}>Quần</Text>
                  <TextInput
                    value={pantsSize}
                    onChangeText={setPantsSize}
                    placeholder="30, 28, M..."
                    placeholderTextColor="#666"
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Giày</Text>
                  <TextInput
                    value={String(shoeSize)}
                    onChangeText={text => setShoeSize(Number(text) || 0)}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={styles.label}>Nhẫn</Text>
                  <TextInput
                    value={String(ringSize)}
                    onChangeText={text => setRingSize(Number(text) || 0)}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSaveSizes}
                disabled={isUpdatingSizes}
                style={[styles.saveBtn, { marginTop: 12 }]}
              >
                <Text style={styles.saveBtnText}>
                  {isUpdatingSizes ? 'Đang lưu...' : 'Lưu kích cỡ'}
                </Text>
              </TouchableOpacity>
            </View>

            {partner && partnerSizes && (
              <View style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                  <Ruler size={18} color={AppTheme.colorSecondary} />
                  <Text style={[styles.cardTitle, { color: AppTheme.colorSecondary, marginBottom: 0 }]}>Kích cỡ của {partner.nickname}</Text>
                </View>
                
                <View style={styles.sizesGrid}>
                  <View style={styles.sizeItem}>
                    <Text style={styles.sizeLabel}>Cỡ Áo</Text>
                    <Text style={styles.sizeValue}>{partnerSizes.shirtSize || 'Chưa có'}</Text>
                  </View>
                  <View style={styles.sizeItem}>
                    <Text style={styles.sizeLabel}>Cỡ Quần</Text>
                    <Text style={styles.sizeValue}>{partnerSizes.pantsSize || 'Chưa có'}</Text>
                  </View>
                  <View style={styles.sizeItem}>
                    <Text style={styles.sizeLabel}>Cỡ Giày</Text>
                    <Text style={styles.sizeValue}>{partnerSizes.shoeSize || 'Chưa có'}</Text>
                  </View>
                  <View style={styles.sizeItem}>
                    <Text style={styles.sizeLabel}>Cỡ Nhẫn</Text>
                    <Text style={styles.sizeValue}>{partnerSizes.ringSize || 'Chưa có'}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Tab 3: Boba */}
        {activeTab === 'boba' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <CupSoda size={18} color={AppTheme.textPrimary} />
                <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Gu uống trà sữa của bạn</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Mức đường</Text>
                <TextInput
                  value={sugar}
                  onChangeText={setSugar}
                  placeholder="70%, 50%, Không đường..."
                  placeholderTextColor="#666"
                  style={styles.input}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Mức đá</Text>
                <TextInput
                  value={ice}
                  onChangeText={setIce}
                  placeholder="Normal, Ít đá, Không đá..."
                  placeholderTextColor="#666"
                  style={styles.input}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Toppings yêu thích (ngăn cách bằng dấu phẩy)</Text>
                <TextInput
                  value={toppings}
                  onChangeText={setToppings}
                  placeholder="Trân châu đen, Kem cheese, Thạch dừa..."
                  placeholderTextColor="#666"
                  style={styles.input}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ghi chú thêm</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Ít ngọt, nhiều kem cheese..."
                  placeholderTextColor="#666"
                  multiline
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                />
              </View>

              <TouchableOpacity
                onPress={handleSaveBoba}
                disabled={isUpdatingBoba}
                style={styles.saveBtn}
              >
                <Text style={styles.saveBtnText}>
                  {isUpdatingBoba ? 'Đang lưu...' : 'Lưu sở thích Boba'}
                </Text>
              </TouchableOpacity>
            </View>

            {partner && partnerBoba && (
              <View style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                  <CupSoda size={18} color={AppTheme.colorSecondary} />
                  <Text style={[styles.cardTitle, { color: AppTheme.colorSecondary, marginBottom: 0 }]}>Gu boba của {partner.nickname}</Text>
                </View>
                
                <View style={styles.partnerBobaDetails}>
                  <View style={{ marginBottom: 8 }}>
                    <Text style={styles.label}>Đường & Đá</Text>
                    <Text style={styles.bobaDetailVal}>
                      Đường: {partnerBoba.sugarLevel || 'Chưa cập nhật'} • Đá: {partnerBoba.iceLevel || 'Chưa cập nhật'}
                    </Text>
                  </View>

                  <View style={{ marginBottom: 8 }}>
                    <Text style={styles.label}>Toppings yêu thích</Text>
                    <View style={styles.toppingsContainer}>
                      {partnerBoba.favoriteTopping.length > 0 ? (
                        partnerBoba.favoriteTopping.map((top, idx) => (
                          <View key={idx} style={styles.toppingBadge}>
                            <Text style={styles.toppingBadgeText}>{top}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noToppingsText}>Chưa cập nhật topping</Text>
                      )}
                    </View>
                  </View>

                  {partnerBoba.note ? (
                    <View>
                      <Text style={styles.label}>Lưu ý đặc biệt</Text>
                      <Text style={styles.bobaNoteVal}>"{partnerBoba.note}"</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Tab 4: Hobbies */}
        {activeTab === 'hobbies' && (
          <View style={styles.tabContent}>
            {/* My Hobbies */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sở thích cá nhân (Hobbies)</Text>

              {hobbies.length === 0 ? (
                <Text style={styles.emptyText}>Chưa có sở thích nào được thêm.</Text>
              ) : (
                <View style={styles.listContainer}>
                  {hobbies.map(h => (
                    <View key={h.id} style={styles.listItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listItemName}>{h.hobbyName}</Text>
                        {h.description ? (
                          <Text style={styles.listItemDesc}>{h.description}</Text>
                        ) : null}
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteHobby(h.id)}
                        style={styles.deleteItemBtn}
                      >
                        <Text style={{ fontSize: 16 }}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.divider} />

              <Text style={styles.formSubtitle}>Thêm sở thích mới</Text>
              <TextInput
                value={newHobbyName}
                onChangeText={setNewHobbyName}
                placeholder="Tên sở thích..."
                placeholderTextColor="#666"
                style={[styles.input, { marginBottom: 8 }]}
              />
              <TextInput
                value={newHobbyDesc}
                onChangeText={setNewHobbyDesc}
                placeholder="Mô tả thêm..."
                placeholderTextColor="#666"
                style={[styles.input, { marginBottom: 12 }]}
              />
              <TouchableOpacity
                onPress={handleAddHobby}
                style={styles.addBtn}
              >
                <Text style={styles.addBtnText}>+ Thêm sở thích</Text>
              </TouchableOpacity>
            </View>

            {/* My Favorites */}
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <Utensils size={18} color={AppTheme.textPrimary} />
                <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Món yêu thích / Món ghét</Text>
              </View>

              {favorites.length === 0 ? (
                <Text style={styles.emptyText}>Chưa có món yêu thích nào.</Text>
              ) : (
                <View style={styles.listContainer}>
                  {favorites.map(f => (
                    <View key={f.id} style={styles.listItem}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>{f.category}</Text>
                          </View>
                          <Text style={styles.listItemName}>{f.itemName}</Text>
                          {f.isDislike ? (
                            <Text style={styles.dislikeLabel}>[Ghétt ❌]</Text>
                          ) : null}
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteFavorite(f.id)}
                        style={styles.deleteItemBtn}
                      >
                        <Text style={{ fontSize: 16 }}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.divider} />

              <Text style={styles.formSubtitle}>Thêm món ăn/vật dụng</Text>
              <View style={styles.row}>
                <TextInput
                  value={newFavName}
                  onChangeText={setNewFavName}
                  placeholder="Tên món..."
                  placeholderTextColor="#666"
                  style={[styles.input, { flex: 1 }]}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryPickerScroll}
                  contentContainerStyle={{ gap: 6 }}
                >
                  {['Thức ăn', 'Đồ uống', 'Màu sắc', 'Khác'].map(cat => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setNewFavCategory(cat)}
                      style={[
                        styles.catSelectBtn,
                        newFavCategory === cat && styles.catSelectBtnActive
                      ]}
                    >
                      <Text style={[styles.catSelectBtnText, newFavCategory === cat && styles.catSelectBtnTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                onPress={() => setNewFavDislike(!newFavDislike)}
                activeOpacity={0.8}
                style={styles.dislikeToggleRow}
              >
                <View style={[styles.checkbox, newFavDislike && styles.checkboxChecked]}>
                  {newFavDislike && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.dislikeToggleLabel}>Đây là thứ mình cực kì ghét!</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddFavorite}
                style={styles.addBtn}
              >
                <Text style={styles.addBtnText}>+ Thêm vào yêu thích</Text>
              </TouchableOpacity>
            </View>

            {/* Partner Hobbies */}
            {partner && partnerHobbies.length > 0 && (
              <View style={styles.card}>
                <Text style={[styles.cardTitle, { color: AppTheme.colorSecondary }]}>Sở thích của {partner.nickname}</Text>
                <View style={styles.listContainer}>
                  {partnerHobbies.map(h => (
                    <View key={h.id} style={[styles.listItem, { paddingRight: 12 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listItemName}>{h.hobbyName}</Text>
                        {h.description ? (
                          <Text style={styles.listItemDesc}>{h.description}</Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {partner && partnerFavorites.length > 0 && (
              <View style={styles.card}>
                <Text style={[styles.cardTitle, { color: AppTheme.colorSecondary }]}>Món thích/ghét của {partner.nickname}</Text>
                <View style={styles.listContainer}>
                  {partnerFavorites.map(f => (
                    <View key={f.id} style={[styles.listItem, { paddingRight: 12 }]}>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.categoryBadge, { backgroundColor: 'rgba(181, 234, 215, 0.15)' }]}>
                          <Text style={styles.categoryBadgeText}>{f.category}</Text>
                        </View>
                        <Text style={styles.listItemName}>{f.itemName}</Text>
                        {f.isDislike ? (
                          <Text style={styles.dislikeLabel}>[Ghétt ❌]</Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Tab Notes: Ghi chú đối phương */}
        {activeTab === 'notes' && (
          <View style={styles.tabContent}>
            {/* Note written by partner about me */}
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <Heart size={18} color={AppTheme.colorSecondary} fill={AppTheme.colorSecondary} />
                <Text style={[styles.cardTitle, { color: AppTheme.colorSecondary, marginBottom: 0 }]}>Đối phương ghi chú về bạn</Text>
              </View>

              {partnerNote && partnerNote.isShared ? (
                <View style={styles.partnerBobaDetails}>
                  <View style={{ marginBottom: 8 }}>
                    <Text style={styles.label}>Chiều cao & Cân nặng</Text>
                    <Text style={styles.bobaDetailVal}>
                      {partnerNote.height ? `Cao: ${partnerNote.height}` : 'Chưa có'} • {partnerNote.weight ? `Nặng: ${partnerNote.weight}` : 'Chưa có'}
                    </Text>
                  </View>

                  <View style={{ marginBottom: 8 }}>
                    <Text style={styles.label}>Sở thích của bạn (đối phương note)</Text>
                    <Text style={styles.bobaNoteVal}>{partnerNote.hobbies || 'Chưa ghi chú'}</Text>
                  </View>

                  <View>
                    <Text style={styles.label}>Tính cách của bạn (đối phương note)</Text>
                    <Text style={styles.bobaNoteVal}>{partnerNote.personality || 'Chưa ghi chú'}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.emptyText}>
                  {partner ? `${partner.nickname} chưa ghi chú hoặc chưa bật chia sẻ ghi chú với bạn.` : 'Chưa kết nối đối phương.'}
                </Text>
              )}
            </View>

            {/* Note written by me about partner */}
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <Heart size={18} color={AppTheme.colorPrimary} fill={AppTheme.colorPrimary} />
                <Text style={[styles.cardTitle, { color: AppTheme.colorPrimary, marginBottom: 0 }]}>Ghi chú của bạn về đối phương</Text>
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Chiều cao</Text>
                  <TextInput
                    value={noteHeight}
                    onChangeText={setNoteHeight}
                    placeholder="Ví dụ: 1m75"
                    placeholderTextColor="#666"
                    style={styles.input}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={styles.label}>Cân nặng</Text>
                  <TextInput
                    value={noteWeight}
                    onChangeText={setNoteWeight}
                    placeholder="Ví dụ: 65kg"
                    placeholderTextColor="#666"
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Sở thích của đối phương</Text>
                <TextInput
                  value={noteHobbies}
                  onChangeText={setNoteHobbies}
                  placeholder="Ghi chú sở thích của nửa kia..."
                  placeholderTextColor="#666"
                  multiline
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Tính cách của đối phương</Text>
                <TextInput
                  value={notePersonality}
                  onChangeText={setNotePersonality}
                  placeholder="Ghi chú tính cách, đặc điểm của nửa kia..."
                  placeholderTextColor="#666"
                  multiline
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                />
              </View>

              <TouchableOpacity
                onPress={() => setNoteIsShared(!noteIsShared)}
                activeOpacity={0.8}
                style={styles.dislikeToggleRow}
              >
                <View style={[styles.checkbox, noteIsShared && styles.checkboxChecked]}>
                  {noteIsShared && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.dislikeToggleLabel}>Chia sẻ ghi chú này cho đối phương thấy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveNote}
                disabled={isSavingNote}
                style={styles.saveBtn}
              >
                <Text style={styles.saveBtnText}>
                  {isSavingNote ? 'Đang lưu...' : 'Lưu ghi chú'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tab 5: Breakup */}
        {activeTab === 'breakup' && (
          <View style={styles.tabContent}>
            <View style={[styles.card, { borderColor: AppTheme.colorWarning }]}>
              <View style={styles.warningHeader}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningTitle}>Khu vực nhạy cảm</Text>
              </View>
              <Text style={styles.warningText}>
                Nếu hai bạn gặp bất đồng hoặc quyết định dừng lại, bạn có thể bỏ phiếu chấm dứt mối tình.{"\n"}{"\n"}
                <Text style={{ fontWeight: '800', color: AppTheme.colorWarning }}>Chú ý:</Text> Nếu cả hai người cùng bỏ phiếu "Chia tay", mối quan hệ trên hệ thống sẽ lập tức chuyển sang trạng thái <Text style={{ fontWeight: '800' }}>Broken</Text> và ngắt kết nối vĩnh viễn.
              </Text>

              <View style={styles.voteStatusContainer}>
                <View style={styles.voteStatusRow}>
                  <Text style={styles.voteStatusLabel}>Ý kiến của bạn:</Text>
                  <Text style={[styles.voteStatusVal, { color: votedBreakup ? AppTheme.colorWarning : AppTheme.colorSecondary }]}>
                    {votedBreakup ? 'Đã vote chia tay 💔' : 'Đang duy trì ❤️'}
                  </Text>
                </View>

                {partner && (
                  <View style={[styles.voteStatusRow, { borderTopWidth: 1.5, borderColor: AppTheme.borderColor, marginTop: 8, paddingTop: 8 }]}>
                    <Text style={styles.voteStatusLabel}>Ý kiến của {partner.nickname}:</Text>
                    <Text style={[styles.voteStatusVal, { color: partnerVotedBreakup ? AppTheme.colorWarning : AppTheme.colorSecondary }]}>
                      {partnerVotedBreakup ? 'Đã vote chia tay 💔' : 'Đang duy trì ❤️'}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={handleVoteBreakup}
                disabled={isCastingVote}
                activeOpacity={0.8}
                style={[styles.breakupBtn, votedBreakup && styles.breakupBtnActive]}
              >
                <Text style={styles.breakupBtnText}>
                  {votedBreakup ? 'Hủy biểu quyết chia tay' : 'Bỏ phiếu chia tay'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tab 6: About */}
        {activeTab === 'about' && (
          <View style={styles.tabContent}>
            <View style={[styles.card, { alignItems: 'center', paddingVertical: 30 }]}>
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(255, 101, 132, 0.1)',
                borderWidth: AppTheme.borderWidth,
                borderColor: AppTheme.borderColor,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Heart size={32} color={AppTheme.colorPrimary} fill={AppTheme.colorPrimary} />
              </View>
              
              <Text style={{ fontSize: 20, fontWeight: '900', color: AppTheme.textPrimary }}>ForeverDays</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: AppTheme.textSecondary, marginTop: 4 }}>Phiên bản 1.0.0</Text>
              
              <View style={{
                width: '100%',
                borderTopWidth: 2,
                borderColor: AppTheme.borderColor,
                borderStyle: 'dashed',
                marginVertical: 20,
              }} />
              
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '800',
                  color: AppTheme.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}>Hợp tác & Feedback</Text>
                <Text style={{
                  fontSize: 15,
                  fontWeight: '900',
                  color: AppTheme.colorPrimary,
                }}>devprojectlabvn@gmail.com</Text>
              </View>

              <View style={{
                width: '100%',
                borderTopWidth: 2,
                borderColor: AppTheme.borderColor,
                borderStyle: 'dashed',
                marginVertical: 10,
              }} />

              <View style={{ alignItems: 'center', marginTop: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: AppTheme.textSecondary, marginBottom: 4 }}>© 2026 Góc Vũ Trụ</Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: AppTheme.textSecondary }}>
                  Crafted with ❤️ by <Text style={{ color: AppTheme.textPrimary, fontWeight: '900' }}>Family Love Studio</Text>
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
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
  tabsWrapper: {
    borderBottomWidth: AppTheme.borderWidth,
    borderColor: AppTheme.borderColor,
    backgroundColor: AppTheme.bgCard,
  },
  tabsScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1.8,
    borderColor: AppTheme.borderColor,
    borderRadius: 20,
    backgroundColor: AppTheme.bgPrimary,
  },
  tabButtonActive: {
    borderColor: AppTheme.colorPrimary,
    backgroundColor: 'rgba(255, 142, 158, 0.15)',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: AppTheme.textSecondary,
    textTransform: 'uppercase',
  },
  tabButtonTextActive: {
    color: AppTheme.colorPrimary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  tabContent: {
    gap: 16,
  },
  card: {
    backgroundColor: AppTheme.bgCard,
    borderWidth: AppTheme.borderWidth,
    borderColor: AppTheme.borderColor,
    borderRadius: 16,
    padding: 20,
    shadowColor: AppTheme.borderColor,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: AppTheme.textPrimary,
    marginBottom: 16,
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
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1.8,
    borderColor: AppTheme.borderColor,
    borderRadius: 12,
    backgroundColor: AppTheme.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderBtnActive: {
    borderColor: AppTheme.colorPrimary,
    backgroundColor: 'rgba(255, 142, 158, 0.15)',
  },
  genderBtnText: {
    fontWeight: '800',
    fontSize: 13,
    color: AppTheme.textSecondary,
  },
  genderBtnTextActive: {
    color: AppTheme.colorPrimary,
  },
  zodiacCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppTheme.bgPrimary,
    borderWidth: 1.5,
    borderColor: AppTheme.borderColor,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  zodiacEmoji: {
    fontSize: 32,
  },
  zodiacTitle: {
    fontWeight: '800',
    fontSize: 13,
    color: AppTheme.textPrimary,
  },
  zodiacPeriod: {
    fontSize: 10,
    color: AppTheme.textSecondary,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: AppTheme.colorPrimary,
    borderWidth: AppTheme.borderWidth,
    borderColor: AppTheme.borderColor,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontWeight: '900',
    fontSize: 14,
    color: AppTheme.borderColor,
  },
  partnerInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1.5,
    borderColor: AppTheme.borderColor,
  },
  partnerInfoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: AppTheme.textSecondary,
  },
  partnerInfoValue: {
    fontSize: 13,
    fontWeight: '800',
    color: AppTheme.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  sizesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sizeItem: {
    width: '47%',
    padding: 12,
    backgroundColor: AppTheme.bgPrimary,
    borderWidth: 1.5,
    borderColor: AppTheme.borderColor,
    borderRadius: 12,
  },
  sizeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: AppTheme.textSecondary,
    textTransform: 'uppercase',
  },
  sizeValue: {
    fontSize: 14,
    fontWeight: '900',
    color: AppTheme.textPrimary,
    marginTop: 4,
  },
  partnerBobaDetails: {
    backgroundColor: AppTheme.bgPrimary,
    borderWidth: 1.5,
    borderColor: AppTheme.borderColor,
    borderRadius: 12,
    padding: 14,
  },
  bobaDetailVal: {
    fontSize: 13,
    fontWeight: '800',
    color: AppTheme.textPrimary,
    marginTop: 2,
  },
  toppingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  toppingBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: AppTheme.bgCard,
    borderWidth: 1.5,
    borderColor: AppTheme.borderColor,
    borderRadius: 20,
  },
  toppingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: AppTheme.textPrimary,
  },
  noToppingsText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: AppTheme.textSecondary,
  },
  bobaNoteVal: {
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic',
    color: AppTheme.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: AppTheme.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    paddingVertical: 12,
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: AppTheme.bgPrimary,
    borderWidth: 1.5,
    borderColor: AppTheme.borderColor,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  listItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: AppTheme.textPrimary,
  },
  listItemDesc: {
    fontSize: 11,
    color: AppTheme.textSecondary,
    marginTop: 2,
  },
  deleteItemBtn: {
    padding: 6,
  },
  divider: {
    borderTopWidth: 2,
    borderColor: AppTheme.borderColor,
    borderStyle: 'dashed',
    marginVertical: 16,
  },
  formSubtitle: {
    fontSize: 12,
    fontWeight: '900',
    color: AppTheme.textPrimary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  addBtn: {
    backgroundColor: AppTheme.bgPrimary,
    borderWidth: AppTheme.borderWidth,
    borderColor: AppTheme.borderColor,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontWeight: '800',
    fontSize: 13,
    color: AppTheme.textPrimary,
  },
  categoryBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: AppTheme.bgCard,
    borderWidth: 1,
    borderColor: AppTheme.borderColor,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: AppTheme.textSecondary,
  },
  dislikeLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: AppTheme.colorWarning,
    marginLeft: 8,
  },
  categoryPickerScroll: {
    flex: 1,
    maxHeight: 40,
  },
  catSelectBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: AppTheme.borderColor,
    borderRadius: 8,
    backgroundColor: AppTheme.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catSelectBtnActive: {
    borderColor: AppTheme.colorPrimary,
    backgroundColor: 'rgba(255,142,158,0.1)',
  },
  catSelectBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: AppTheme.textSecondary,
  },
  catSelectBtnTextActive: {
    color: AppTheme.colorPrimary,
  },
  dislikeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    paddingLeft: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.8,
    borderColor: AppTheme.borderColor,
    borderRadius: 4,
    backgroundColor: AppTheme.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: AppTheme.colorWarning,
    backgroundColor: 'rgba(255,183,178,0.15)',
  },
  checkboxTick: {
    color: AppTheme.colorWarning,
    fontWeight: '900',
    fontSize: 11,
  },
  dislikeToggleLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: AppTheme.textPrimary,
    marginLeft: 8,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  warningIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: AppTheme.colorWarning,
  },
  warningText: {
    fontSize: 12,
    color: AppTheme.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  voteStatusContainer: {
    backgroundColor: AppTheme.bgPrimary,
    borderWidth: 1.5,
    borderColor: AppTheme.borderColor,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  voteStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voteStatusLabel: {
    fontWeight: '800',
    fontSize: 12,
    color: AppTheme.textPrimary,
  },
  voteStatusVal: {
    fontWeight: '900',
    fontSize: 12,
  },
  breakupBtn: {
    backgroundColor: 'rgba(255, 183, 178, 0.15)',
    borderWidth: AppTheme.borderWidth,
    borderColor: AppTheme.colorWarning,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakupBtnActive: {
    backgroundColor: AppTheme.colorWarning,
  },
  breakupBtnText: {
    fontWeight: '900',
    fontSize: 14,
    color: AppTheme.colorWarning,
  },
});

export default ProfileScreen;
