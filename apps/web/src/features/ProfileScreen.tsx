import React, { useState, useEffect } from 'react';
import { useRelationship } from '../core/RelationshipContext';
import { LoveUtils } from '../core/loveUtils';
import {
  UserSizeService, UserBobaPreferenceService,
  UserHobbyService, UserFavoriteService, CoupleService,
  PartnerProfileNoteService, UserPushTokenService
} from '@forever-days/core';
import type { UserSize, UserBobaPreference, UserHobby, UserFavorite, PartnerProfileNote } from '@forever-days/core';
import { User, ShieldAlert, HeartCrack, Plus, Trash2, Camera, Check, Heart, Ruler, CupSoda, Utensils, Edit3, KeyRound } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

export const ProfileScreen: React.FC = () => {
  useSEO({
    title: 'Hồ Sơ Cặp Đôi | ForeverDays',
    description: 'Cập nhật thông tin sở thích, kích cỡ, và những điều nhỏ bé về nửa kia.',
    keywords: 'hồ sơ tình yêu, sở thích người yêu, foreverdays profile'
  });

  const {
    user, partner, isDemoMode, updateProfile, coupleId,
    changePassword,
    signOut
  } = useRelationship();

  const [activeTab, setActiveTab] = useState<'info' | 'sizes' | 'boba' | 'hobbies' | 'partner-notes' | 'breakup' | 'about'>('info');

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Personal Info Inputs (Own)
  const [nickname, setNickname] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Chưa chọn');
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);

  const AVATAR_PRESETS = [
    { name: 'Oliver 🐼', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver' },
    { name: 'Lily 🐱', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lily' },
    { name: 'Jack 🐶', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack' },
    { name: 'Daisy 🐰', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Daisy' },
    { name: 'Milo 🦊', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo' },
    { name: 'Mia 🐿️', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Mia' },
    { name: 'Ruby 🐨', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ruby' },
    { name: 'Zoe 🐻', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe' },
    { name: 'Bella 🐝', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Bella' },
    { name: 'Coco 🦖', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Coco' },
    { name: 'Teddy 🐧', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Teddy' },
    { name: 'Lulu 🦄', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lulu' },
  ];

  const compressImage = (base64Str: string, maxWidth = 150, maxHeight = 150): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawBase64 = event.target?.result as string;
      const compressedBase64 = await compressImage(rawBase64);
      await updateProfile(true, nickname, dob, gender, compressedBase64);
      showToast('Cập nhật ảnh đại diện thành công! 📸');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = async (url: string) => {
    await updateProfile(true, nickname, dob, gender, url);
    showToast('Cập nhật ảnh đại diện thành công! 📸');
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
  const [_partnerFavorites, _setPartnerFavorites] = useState<UserFavorite[]>([]);
  const [newFavName, setNewFavName] = useState('');
  const [newFavCategory, setNewFavCategory] = useState('Thức ăn');
  const [newFavDislike, setNewFavDislike] = useState(false);

  // Breakup Voting
  const [votedBreakup, setVotedBreakup] = useState(false);
  const [partnerVotedBreakup, setPartnerVotedBreakup] = useState(false);
  const [isCastingVote, setIsCastingVote] = useState(false);

  // Partner Profile Notes
  const [partnerNote, setPartnerNote] = useState<PartnerProfileNote | null>(null);
  const [receivedNote, setReceivedNote] = useState<PartnerProfileNote | null>(null);
  const [noteHeight, setNoteHeight] = useState('');
  const [noteWeight, setNoteWeight] = useState('');
  const [noteHobbies, setNoteHobbies] = useState('');
  const [notePersonality, setNotePersonality] = useState('');
  const [noteIsShared, setNoteIsShared] = useState(false);
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);

  // Change Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Services
  const sizeService = new UserSizeService();
  const bobaService = new UserBobaPreferenceService();
  const hobbyService = new UserHobbyService();
  const favService = new UserFavoriteService();
  const coupleService = new CoupleService();
  const partnerNoteService = new PartnerProfileNoteService();

  // Load User Data
  const loadProfileData = async () => {
    if (user) {
      setNickname(user.nickname);
      setDob(user.dob || '');
      setGender(user.gender || 'Chưa chọn');
    }

    if (isDemoMode) {
      // Load sizes from local storage
      setShirtSize(localStorage.getItem('demo_shirt_size') || 'M');
      setPantsSize(localStorage.getItem('demo_pants_size') || '30');
      setShoeSize(Number(localStorage.getItem('demo_shoe_size') || '40'));
      setRingSize(Number(localStorage.getItem('demo_ring_size') || '15'));
      setPartnerSizes({
        id: 'p-sizes', userId: 'user-2',
        shirtSize: 'S', pantsSize: '27', shoeSize: 37, ringSize: 10
      });

      // Load Boba
      setSugar(localStorage.getItem('demo_boba_sugar') || '70%');
      setIce(localStorage.getItem('demo_boba_ice') || 'Normal');
      setToppings(localStorage.getItem('demo_boba_toppings') || 'Trân châu đen, Thạch dừa');
      setNote(localStorage.getItem('demo_boba_note') || 'Ít sữa đặc');
      setPartnerBoba({
        id: 'p-boba', userId: 'user-2',
        favoriteTopping: ['Trân châu trắng', 'Kem muối'],
        sugarLevel: '50%', iceLevel: 'Less Ice', note: 'Không lấy thạch'
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
      _setPartnerFavorites([
        { id: 'f-p1', userId: 'user-2', category: 'Thức ăn', itemName: 'Sầu riêng', isDislike: true },
        { id: 'f-p2', userId: 'user-2', category: 'Màu sắc', itemName: 'Hồng pastel', isDislike: false }
      ]);

      // Demo notes
      const demoNoteSaved = localStorage.getItem('demo_partner_note');
      if (demoNoteSaved) {
        try {
          const parsed = JSON.parse(demoNoteSaved);
          setNoteHeight(parsed.height || '');
          setNoteWeight(parsed.weight || '');
          setNoteHobbies(parsed.hobbies || '');
          setNotePersonality(parsed.personality || '');
          setNoteIsShared(parsed.isShared ?? false);
        } catch {}
      }
      setReceivedNote({
        id: 'rec-note',
        coupleId: 'demo-couple-id',
        writerId: 'user-2',
        targetId: 'user-1',
        height: '1m78',
        weight: '70kg',
        hobbies: 'Thích bóng đá, xem phim viễn tưởng',
        personality: 'Chu đáo, hiền lành, đôi lúc hơi trầm tính',
        isShared: true
      });
      return;
    }

    if (!user) return;

    // Load sizes
    const sizeRes = await sizeService.fetchSizes(user.id);
    if (sizeRes) {
      _setSizes(sizeRes);
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
      _setBoba(bobaRes);
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
      _setPartnerFavorites(pF);
    }

    // Load Breakup status from couple
    if (coupleId) {
      const activeCouple = await coupleService.fetchActiveCouple(user.id);
      if (activeCouple) {
        // Find if user is user1 or user2
        const isUser1 = activeCouple.user1Id === user.id;
        setVotedBreakup(isUser1 ? activeCouple.user1VotedBreakup : activeCouple.user2VotedBreakup);
        setPartnerVotedBreakup(isUser1 ? activeCouple.user2VotedBreakup : activeCouple.user1VotedBreakup);
      }
    }

    // Load Partner Notes
    if (user && partner) {
      const myNote = await partnerNoteService.fetchNote(user.id, partner.id);
      if (myNote) {
        setPartnerNote(myNote);
        setNoteHeight(myNote.height || '');
        setNoteWeight(myNote.weight || '');
        setNoteHobbies(myNote.hobbies || '');
        setNotePersonality(myNote.personality || '');
        setNoteIsShared(myNote.isShared);
      } else {
        setPartnerNote(null);
        setNoteHeight('');
        setNoteWeight('');
        setNoteHobbies('');
        setNotePersonality('');
        setNoteIsShared(false);
      }

      const received = await partnerNoteService.fetchNote(partner.id, user.id);
      if (received && received.isShared) {
        setReceivedNote(received);
      } else {
        setReceivedNote(null);
      }
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [user, partner, coupleId, isDemoMode]);

  // Info Actions
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingInfo(true);
    await updateProfile(true, nickname, dob, gender);
    setIsUpdatingInfo(false);
    showToast('Cập nhật hồ sơ thành công! 🎉');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Lỗi: Mật khẩu xác nhận không khớp! ❌');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Lỗi: Mật khẩu phải có ít nhất 6 ký tự! ❌');
      return;
    }
    
    setIsChangingPassword(true);
    const result = await changePassword(newPassword);
    setIsChangingPassword(false);
    
    if (result.success) {
      setNewPassword('');
      setConfirmPassword('');
      showToast('Đổi mật khẩu thành công! 🔐');
    } else {
      showToast(`Lỗi: ${result.message}`);
    }
  };

  // Sizes Actions
  const handleSaveSizes = async () => {
    setIsUpdatingSizes(true);
    if (isDemoMode) {
      localStorage.setItem('demo_shirt_size', shirtSize);
      localStorage.setItem('demo_pants_size', pantsSize);
      localStorage.setItem('demo_shoe_size', String(shoeSize));
      localStorage.setItem('demo_ring_size', String(ringSize));
    } else if (user) {
      await sizeService.updateSizes(user.id, shirtSize, pantsSize, shoeSize, ringSize);
    }
    setIsUpdatingSizes(false);
    showToast('Cập nhật kích cỡ thành công! 📏');
  };

  // Boba Actions
  const handleSaveBoba = async () => {
    setIsUpdatingBoba(true);
    if (isDemoMode) {
      localStorage.setItem('demo_boba_sugar', sugar);
      localStorage.setItem('demo_boba_ice', ice);
      localStorage.setItem('demo_boba_toppings', toppings);
      localStorage.setItem('demo_boba_note', note);
    } else if (user) {
      await bobaService.updateBobaPreferences(user.id, sugar, ice, toppings, note);
    }
    setIsUpdatingBoba(false);
    showToast('Cập nhật gu trà sữa thành công! 🥤');
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

  // Partner Notes Action
  const handleSavePartnerNote = async () => {
    setIsUpdatingNote(true);
    const noteData = {
      coupleId: coupleId || 'demo-couple-id',
      writerId: user?.id || 'user-1',
      targetId: partner?.id || 'user-2',
      height: noteHeight,
      weight: noteWeight,
      hobbies: noteHobbies,
      personality: notePersonality,
      isShared: noteIsShared,
    };

    try {
      if (isDemoMode) {
        localStorage.setItem('demo_partner_note', JSON.stringify(noteData));
      } else {
        await partnerNoteService.upsertNote(noteData);
      }
      showToast('Cập nhật ghi chú đối phương thành công! 📝');
    } catch (e: any) {
      showToast(`Lỗi: ${e.message}`);
    } finally {
      setIsUpdatingNote(false);
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
      alert('Đã dọn dẹp mối tình thử nghiệm!');
      signOut();
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

      // Reload to see if relationship broke completely
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
    setIsCastingVote(false);
  };

  // DOB Formatter and Zodiac Calculator
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
    <div className="flex flex-col flex-1">
      <div className="bg-gradient-to-br from-primary-coral/15 to-secondary-mint/5 p-6 border-b-[2.2px] border-border-color text-center">
        <h2 className="text-xl font-black text-text-primary flex items-center justify-center gap-2">
          Hồ sơ & Sở thích <User size={22} className="text-primary-coral" />
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b-[2.2px] border-border-color bg-bg-card p-[6px_6px_0] overflow-x-auto whitespace-nowrap">
        {(['info', 'sizes', 'boba', 'hobbies', 'partner-notes', 'breakup', 'about'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 bg-transparent border-0 font-extrabold text-[11px] py-3 px-3 cursor-pointer uppercase border-b-3 ${
              activeTab === tab ? 'text-primary-coral border-primary-coral' : 'text-text-secondary border-transparent'
            }`}
          >
            {tab === 'info' ? 'Chi tiết' : tab === 'sizes' ? 'Kích cỡ' : tab === 'boba' ? 'Gu Boba' : tab === 'hobbies' ? 'Sở thích' : tab === 'partner-notes' ? 'Ghi chú đối phương' : tab === 'breakup' ? 'Giải tán' : 'Giới thiệu'}
          </button>
        ))}
      </div>

      <div className="p-5 pb-[92px] w-full flex flex-col flex-1">
        {/* Tab 1: Chi tiết / Personal Details */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <form onSubmit={handleSaveInfo} className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 mb-4 shadow-neo transition-all duration-200">
              <h4 className="text-[15px] font-extrabold mb-4 flex gap-1.5 items-center">
                <User size={18} className="text-primary-coral" /> Cập nhật thông tin của bạn
              </h4>

              {/* Avatar Section */}
              <div className="flex flex-col items-center mb-5">
                <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                  <div className="w-24 h-24 rounded-full border-[2.2px] border-border-color bg-bg-primary overflow-hidden shadow-neo flex items-center justify-center relative">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} className="text-text-secondary" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                      <Camera size={24} className="text-white" />
                    </div>
                  </div>
                  {/* Floating camera icon */}
                  <div className="absolute bottom-0 right-0 bg-primary-coral text-border-color border-[2px] border-border-color rounded-full p-1.5 shadow-sm transform translate-x-1 translate-y-1 group-hover:scale-110 transition-transform">
                    <Camera size={14} />
                  </div>
                </div>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="text-[10px] text-text-secondary mt-2 font-bold">Bấm vào ảnh để tải ảnh lên (.png, .jpg)</span>
              </div>

              {/* Predefined Avatars Grid */}
              <div className="mb-5">
                <label className="block font-extrabold text-xs text-text-secondary mb-2 uppercase tracking-wider">Chọn Avatar Cặp Đôi Đáng Yêu</label>
                <div className="grid grid-cols-6 gap-2 max-h-[140px] overflow-y-auto p-1.5 border-[2.2px] border-border-color rounded-xl bg-bg-primary shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)]
                  [&::-webkit-scrollbar]:w-1.5
                  [&::-webkit-scrollbar-track]:bg-transparent
                  [&::-webkit-scrollbar-thumb]:bg-border-color/30
                  [&::-webkit-scrollbar-thumb]:rounded-full">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset.url)}
                      className={`w-10 h-10 rounded-full overflow-hidden border-[1.5px] hover:border-primary-coral transition-all p-0.5 cursor-pointer bg-white ${
                        user?.avatarUrl === preset.url ? 'border-primary-coral ring-2 ring-primary-coral/30' : 'border-border-color/30'
                      }`}
                      title={preset.name}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover rounded-full" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Biệt danh</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Ngày sinh nhật</label>
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral"
                  required
                />
              </div>
              <div className="mb-5">
                <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Giới tính</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral h-12"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Chưa chọn">Chưa chọn</option>
                </select>
              </div>

              {dob && getZodiacInfo(dob) && (
                <div className="bg-bg-primary border-[2.2px] border-border-color rounded-2xl p-3 mb-4 shadow-none flex items-center gap-2.5">
                  <div className="text-[32px]">{getZodiacInfo(dob)?.emoji}</div>
                  <div>
                    <h5 className="font-extrabold text-[13px]">Cung Hoàng Đạo: {getZodiacInfo(dob)?.nameVi} ({getZodiacInfo(dob)?.nameEn})</h5>
                    <p className="text-[10px] text-text-secondary">Chu kỳ: {getZodiacInfo(dob)?.dateRange}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdatingInfo}
                className="w-full bg-primary-coral text-border-color font-extrabold text-[15px] border-[2.2px] border-border-color rounded-xl px-5 py-2.5 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
              >
                {isUpdatingInfo ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </form>

            {/* Partner Details */}
            {partner && (
              <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 mb-4 shadow-neo transition-all duration-200">
                <h4 className="text-[15px] font-extrabold mb-4 text-secondary-mint flex items-center gap-1.5">
                  <Heart size={18} fill="currentColor" /> Thông tin đối phương
                </h4>
                
                <div className="flex flex-col items-center mb-5">
                  <div className="w-20 h-20 rounded-full border-[2.2px] border-border-color bg-bg-primary overflow-hidden shadow-neo flex items-center justify-center">
                    {partner.avatarUrl ? (
                      <img src={partner.avatarUrl} alt="Partner Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={32} className="text-text-secondary" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 text-sm">
                  <div>
                    <span className="block font-extrabold text-[10px] text-text-secondary mb-1.5 uppercase tracking-wider">Biệt danh</span>
                    <div className="font-bold">{partner.nickname}</div>
                  </div>
                  <div>
                    <span className="block font-extrabold text-[10px] text-text-secondary mb-1.5 uppercase tracking-wider">Ngày sinh</span>
                    <div className="font-bold">{formatBirthday(partner.dob)}</div>
                  </div>
                  <div>
                    <span className="block font-extrabold text-[10px] text-text-secondary mb-1.5 uppercase tracking-wider">Giới tính</span>
                    <div className="font-bold">{partner.gender}</div>
                  </div>
                  {partner.dob && getZodiacInfo(partner.dob) && (
                    <div className="flex items-center gap-2.5 p-2.5 bg-bg-primary border-1.5 border-border-color rounded-xl mt-2">
                      <div className="text-2xl">{getZodiacInfo(partner.dob)?.emoji}</div>
                      <div>
                        <div className="font-bold text-xs">Cung hoàng đạo: {getZodiacInfo(partner.dob)?.nameVi}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Change Password Form */}
            {!isDemoMode && (
              <form onSubmit={handleChangePassword} className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 mb-4 shadow-neo transition-all duration-200">
                <h4 className="text-[15px] font-extrabold mb-4 flex items-center gap-1.5">
                  <KeyRound size={18} className="text-primary-coral" /> Bảo mật tài khoản
                </h4>
                <div className="mb-3">
                  <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral"
                    placeholder="Nhập mật khẩu mới"
                    required
                  />
                </div>
                <div className="mb-5">
                  <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral"
                    placeholder="Nhập lại mật khẩu mới"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full bg-text-primary text-bg-card font-extrabold text-[15px] border-[2.2px] border-border-color rounded-xl px-5 py-2.5 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
                >
                  {isChangingPassword ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                </button>
              </form>
            )}

          </div>
        )}

        {/* Tab 2: Kích cỡ / Fashion Sizes */}
        {activeTab === 'sizes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 mb-4 shadow-neo transition-all duration-200">
              <h4 className="text-[15px] font-extrabold mb-4 flex items-center gap-1.5">
                <Ruler size={18} className="text-primary-coral" /> Thông số kích cỡ của bạn
              </h4>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Áo thun (Shirt)</label>
                  <input type="text" value={shirtSize} onChange={e => setShirtSize(e.target.value)} className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral" placeholder="L, M, XL..." />
                </div>
                <div>
                  <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Quần (Pants)</label>
                  <input type="text" value={pantsSize} onChange={e => setPantsSize(e.target.value)} className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral" placeholder="30, 31, S..." />
                </div>
                <div>
                  <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Giày (Shoe size)</label>
                  <input type="number" value={shoeSize} onChange={e => setShoeSize(Number(e.target.value))} className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral" />
                </div>
                <div>
                  <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Nhẫn (Ring size)</label>
                  <input type="number" value={ringSize} onChange={e => setRingSize(Number(e.target.value))} className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral" />
                </div>
              </div>
              <button
                onClick={handleSaveSizes}
                disabled={isUpdatingSizes}
                className="w-full bg-primary-coral text-border-color font-extrabold text-[15px] border-[2.2px] border-border-color rounded-xl px-5 py-2.5 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
              >
                {isUpdatingSizes ? 'Đang lưu...' : 'Cập nhật kích cỡ'}
              </button>
            </div>

            {partner && partnerSizes && (
              <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 mb-4 shadow-neo transition-all duration-200">
                <h4 className="text-[15px] font-extrabold mb-4 text-secondary-mint flex items-center gap-1.5">
                  <Ruler size={18} /> Kích cỡ của {partner.nickname}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-[13px]">
                  <div>
                    <span className="block font-extrabold text-[10px] text-text-secondary mb-1.5 uppercase tracking-wider">Cỡ Áo</span>
                    <div className="font-bold">{partnerSizes.shirtSize || 'Chưa cập nhật'}</div>
                  </div>
                  <div>
                    <span className="block font-extrabold text-[10px] text-text-secondary mb-1.5 uppercase tracking-wider">Cỡ Quần</span>
                    <div className="font-bold">{partnerSizes.pantsSize || 'Chưa cập nhật'}</div>
                  </div>
                  <div>
                    <span className="block font-extrabold text-[10px] text-text-secondary mb-1.5 uppercase tracking-wider">Cỡ Giày</span>
                    <div className="font-bold">{partnerSizes.shoeSize || 'Chưa cập nhật'}</div>
                  </div>
                  <div>
                    <span className="block font-extrabold text-[10px] text-text-secondary mb-1.5 uppercase tracking-wider">Cỡ Nhẫn</span>
                    <div className="font-bold">{partnerSizes.ringSize || 'Chưa cập nhật'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Gu Boba / Milk Tea Preferences */}
        {activeTab === 'boba' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 mb-4 shadow-neo transition-all duration-200">
              <h4 className="text-[15px] font-extrabold mb-4 flex items-center gap-1.5">
                <CupSoda size={18} className="text-primary-coral" /> Gu uống trà sữa của bạn
              </h4>
              <div className="mb-3">
                <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Mức đường (Sugar)</label>
                <input type="text" value={sugar} onChange={e => setSugar(e.target.value)} className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral" placeholder="70%, 50%, Không đường..." />
              </div>
              <div className="mb-3">
                <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Mức đá (Ice)</label>
                <input type="text" value={ice} onChange={e => setIce(e.target.value)} className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral" placeholder="Normal, Ít đá, Không đá..." />
              </div>
              <div className="mb-3">
                <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Toppings yêu thích (phân cách bằng dấu phẩy)</label>
                <input type="text" value={toppings} onChange={e => setToppings(e.target.value)} className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral" placeholder="Trân châu đen, kem cheese..." />
              </div>
              <div className="mb-5">
                <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Ghi chú thêm</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral h-[70px] resize-none" placeholder="Thêm sở thích chi tiết..." />
              </div>
              <button
                onClick={handleSaveBoba}
                disabled={isUpdatingBoba}
                className="w-full bg-primary-coral text-border-color font-extrabold text-[15px] border-[2.2px] border-border-color rounded-xl px-5 py-2.5 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
              >
                {isUpdatingBoba ? 'Đang lưu...' : 'Lưu tùy chọn'}
              </button>
            </div>

            {partner && partnerBoba && (
              <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 mb-4 shadow-neo transition-all duration-200">
                <h4 className="text-[15px] font-extrabold mb-4 text-secondary-mint flex items-center gap-1.5">
                  <CupSoda size={18} /> Gu boba của {partner.nickname}
                </h4>
                <div className="flex flex-col gap-3 text-[13px]">
                  <div>
                    <span className="block font-extrabold text-[10px] text-text-secondary mb-1.5 uppercase tracking-wider">Đường & Đá</span>
                    <div className="font-bold">Đường: {partnerBoba.sugarLevel} • Đá: {partnerBoba.iceLevel}</div>
                  </div>
                  <div>
                    <span className="block font-extrabold text-[10px] text-text-secondary mb-1.5 uppercase tracking-wider">Toppings</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {partnerBoba.favoriteTopping.length > 0 ? (
                        partnerBoba.favoriteTopping.map((t, i) => (
                          <span key={i} className="py-1 px-2.5 bg-bg-primary border-1.5 border-border-color rounded-full text-[11px] font-bold">
                            {t}
                          </span>
                        ))
                      ) : (
                        <div>Chưa thêm toppings</div>
                      )}
                    </div>
                  </div>
                  {partnerBoba.note && (
                    <div>
                      <span className="block font-extrabold text-[10px] text-text-secondary mb-1.5 uppercase tracking-wider">Lưu ý đặc biệt</span>
                      <div className="font-bold italic">"{partnerBoba.note}"</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Sở thích & Hobbies */}
        {activeTab === 'hobbies' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="flex flex-col gap-6">
              {/* List and Add own Hobbies */}
              <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 shadow-neo transition-all duration-200">
              <h4 className="text-[15px] font-extrabold mb-4">Sở thích cá nhân (Hobbies)</h4>
              <div className="flex flex-col gap-2.5 mb-4">
                {hobbies.map(h => (
                  <div key={h.id} className="flex justify-between items-center py-2.5 px-3.5 bg-bg-primary border-[1.8px] border-border-color rounded-xl">
                    <div>
                      <div className="font-extrabold text-[13px]">{h.hobbyName}</div>
                      {h.description && <div className="text-[11px] text-text-secondary">{h.description}</div>}
                    </div>
                    <button onClick={() => handleDeleteHobby(h.id)} className="bg-transparent border-0 text-warning-coral cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="my-3.5 border-t-2 border-dashed border-border-color" />
              <div className="flex flex-col gap-2.5">
                <input type="text" placeholder="Tên sở thích..." value={newHobbyName} onChange={e => setNewHobbyName(e.target.value)} className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral" />
                <input type="text" placeholder="Mô tả thêm..." value={newHobbyDesc} onChange={e => setNewHobbyDesc(e.target.value)} className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral" />
                <button
                  onClick={handleAddHobby}
                  className="bg-primary-coral text-border-color font-extrabold text-sm border-[2.2px] border-border-color rounded-xl px-4 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
                >
                  <Plus size={16} /> Thêm sở thích
                </button>
              </div>
            </div>

            {/* List Food Favorites */}
            <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 mb-4 shadow-neo transition-all duration-200">
              <h4 className="text-[15px] font-extrabold mb-4 flex items-center gap-1.5">
                <Utensils size={18} className="text-primary-coral" /> Món yêu thích / Món ghét
              </h4>
              <div className="flex flex-col gap-2.5 mb-4">
                {favorites.map(f => (
                  <div key={f.id} className="flex justify-between items-center py-2.5 px-3.5 bg-bg-primary border-[1.8px] border-border-color rounded-xl">
                    <div>
                      <span className="text-[10px] py-0.5 px-1.5 rounded bg-bg-card border border-border-color font-extrabold mr-2 text-text-secondary">
                        {f.category}
                      </span>
                      <span className="font-extrabold text-[13px]">{f.itemName}</span>
                      {f.isDislike && <span className="text-[9px] font-black text-warning-coral ml-2">[Ghétt ❌]</span>}
                    </div>
                    <button onClick={() => handleDeleteFavorite(f.id)} className="bg-transparent border-0 text-warning-coral cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="my-3.5 border-t-2 border-dashed border-border-color" />
              <div className="flex flex-col gap-2.5">
                <div className="flex gap-2">
                  <input type="text" placeholder="Tên món ăn/đồ dùng..." value={newFavName} onChange={e => setNewFavName(e.target.value)} className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral flex-1" />
                  <select value={newFavCategory} onChange={e => setNewFavCategory(e.target.value)} className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-[110px] outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral h-[48px]">
                    <option value="Thức ăn">Thức ăn</option>
                    <option value="Đồ uống">Đồ uống</option>
                    <option value="Màu sắc">Màu sắc</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pl-1">
                  <input type="checkbox" id="dislike-check" checked={newFavDislike} onChange={e => setNewFavDislike(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                  <label htmlFor="dislike-check" className="text-[13px] font-extrabold cursor-pointer">Đây là thứ mình cực kì ghét!</label>
                </div>
                <button
                  onClick={handleAddFavorite}
                  className="bg-primary-coral text-border-color font-extrabold text-sm border-[2.2px] border-border-color rounded-xl px-4 py-2 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
                >
                  <Plus size={16} /> Thêm vào mục yêu thích
                </button>
              </div>
            </div>
          </div>

          {/* Display Partner Hobbies */}
          {partner && partnerHobbies.length > 0 && (
            <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 shadow-neo transition-all duration-200">
              <h4 className="text-[15px] font-extrabold mb-4 text-secondary-mint">
                Sở thích của {partner.nickname}
              </h4>
              <div className="flex flex-col gap-2.5">
                {partnerHobbies.map(h => (
                  <div key={h.id} className="py-2.5 px-3.5 bg-bg-primary border-1.5 border-border-color rounded-xl">
                    <div className="font-extrabold text-[13px]">{h.hobbyName}</div>
                    {h.description && <div className="text-[11px] text-text-secondary">{h.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

        {/* Tab 5: Ghi chú đối phương / Partner Notes */}
        {activeTab === 'partner-notes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Form to edit notes about partner */}
            <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 mb-4 shadow-neo transition-all duration-200">
              <h4 className="text-[15px] font-extrabold mb-4 flex items-center gap-1.5">
                <Edit3 size={18} className="text-primary-coral" /> Ghi chú của bạn về {partner?.nickname || 'đối phương'} {partnerNote ? '✏️' : '➕'}
              </h4>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Chiều cao</label>
                  <input
                    type="text"
                    value={noteHeight}
                    onChange={e => setNoteHeight(e.target.value)}
                    className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral"
                    placeholder="VD: 1m65, 1m75..."
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Cân nặng</label>
                  <input
                    type="text"
                    value={noteWeight}
                    onChange={e => setNoteWeight(e.target.value)}
                    className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral"
                    placeholder="VD: 50kg, 65kg..."
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Sở thích đặc biệt</label>
                <textarea
                  value={noteHobbies}
                  onChange={e => setNoteHobbies(e.target.value)}
                  className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral h-[70px] resize-none"
                  placeholder="Thích ăn gì, làm gì lúc rảnh rỗi..."
                />
              </div>

              <div className="mb-4">
                <label className="block font-extrabold text-xs text-text-secondary mb-1.5 uppercase tracking-wider">Tính cách</label>
                <textarea
                  value={notePersonality}
                  onChange={e => setNotePersonality(e.target.value)}
                  className="bg-bg-primary border-[2.2px] border-border-color rounded-xl px-4 py-3 text-text-primary font-bold text-[15px] w-full outline-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] focus:border-primary-coral h-[70px] resize-none"
                  placeholder="VD: Dễ thương, hay dỗi, hiền lành..."
                />
              </div>

              <div className="flex items-center gap-2 mb-5 pl-1">
                <input
                  type="checkbox"
                  id="note-share-check"
                  checked={noteIsShared}
                  onChange={e => setNoteIsShared(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="note-share-check" className="text-[13px] font-extrabold cursor-pointer">
                  Chia sẻ ghi chú này để đối phương cùng đọc 🔓
                </label>
              </div>

              <button
                onClick={handleSavePartnerNote}
                disabled={isUpdatingNote}
                className="w-full bg-primary-coral text-border-color font-extrabold text-[15px] border-[2.2px] border-border-color rounded-xl px-5 py-2.5 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
              >
                {isUpdatingNote ? 'Đang lưu...' : 'Lưu ghi chú'}
              </button>
            </div>

            {/* Read-only notes written by partner about user */}
            <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 mb-4 shadow-neo transition-all duration-200">
              <h4 className="text-[15px] font-extrabold mb-4 text-secondary-mint flex items-center gap-1.5">
                <Heart size={18} fill="currentColor" /> {partner?.nickname || 'Đối phương'} ghi chú về bạn
              </h4>

              {receivedNote ? (
                <div className="flex flex-col gap-3.5 text-[13px]">
                  <div className="bg-secondary-mint/10 border-[1.5px] border-secondary-mint/30 rounded-xl px-3 py-2 text-center text-secondary-mint font-extrabold text-xs">
                    🔓 Được đối phương chia sẻ
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block font-extrabold text-[10px] text-text-secondary mb-1.5 uppercase tracking-wider">Chiều cao</span>
                      <div className="font-bold">{receivedNote.height || 'Chưa rõ'}</div>
                    </div>
                    <div>
                      <span className="block font-extrabold text-[10px] text-text-secondary mb-1.5 uppercase tracking-wider">Cân nặng</span>
                      <div className="font-bold">{receivedNote.weight || 'Chưa rõ'}</div>
                    </div>
                  </div>

                  <div>
                    <span className="block font-extrabold text-[10px] text-text-secondary mb-1.5 uppercase tracking-wider">Sở thích</span>
                    <div className="font-bold whitespace-pre-wrap">{receivedNote.hobbies || 'Chưa ghi chú'}</div>
                  </div>

                  <div>
                    <span className="block font-extrabold text-[10px] text-text-secondary mb-1.5 uppercase tracking-wider">Tính cách</span>
                    <div className="font-bold whitespace-pre-wrap">{receivedNote.personality || 'Chưa ghi chú'}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-text-secondary text-sm font-bold">
                  🔐 Đối phương chưa chia sẻ hoặc chưa tạo ghi chú nào về bạn.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Giải tán / Breakup Voting */}
        {toastMessage && (
          <div className="fixed bottom-24 right-5 md:bottom-5 md:right-5 z-[9999] bg-[#00b894] text-white font-extrabold text-sm border-[2.2px] border-[#3d2f3d] rounded-xl px-5 py-3 shadow-[4px_4px_0px_#3d2f3d] flex items-center gap-2 transform transition-all duration-300 translate-y-0 scale-100">
            <Check size={18} />
            <span>{toastMessage}</span>
          </div>
        )}

        {activeTab === 'breakup' && (
          <div className="flex flex-col gap-4">
            <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-5 mb-4 shadow-neo transition-all duration-200 border-warning-coral">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-warning-coral/15 flex items-center justify-center text-warning-coral">
                  <ShieldAlert size={20} />
                </div>
                <h4 className="font-extrabold text-[15px]">Khu vực nhạy cảm</h4>
              </div>
              <p className="text-[13px] text-text-secondary leading-normal mb-5">
                Nếu hai bạn gặp bất đồng hoặc quyết định dừng lại, bạn có thể bỏ phiếu chấm dứt mối tình. 
                <br />
                <strong className="text-warning-coral">Chú ý:</strong> Nếu cả hai người cùng bỏ phiếu "Chia tay", mối quan hệ trên hệ thống sẽ lập tức chuyển sang trạng thái <strong>Broken</strong> và ngắt kết nối vĩnh viễn.
              </p>

              <div className="flex flex-col gap-3 mb-6">
                <div className="flex justify-between items-center p-[12px_16px] bg-bg-primary rounded-xl border-1.5 border-border-color">
                  <span className="font-extrabold">Ý kiến của bạn:</span>
                  <span className={`font-black ${votedBreakup ? 'text-warning-coral' : 'text-secondary-mint'}`}>
                    {votedBreakup ? 'Đã vote chia tay 💔' : 'Đang duy trì ❤️'}
                  </span>
                </div>

                {partner && (
                  <div className="flex justify-between items-center p-[12px_16px] bg-bg-primary rounded-xl border-1.5 border-border-color">
                    <span className="font-extrabold">Ý kiến của {partner.nickname}:</span>
                    <span className={`font-black ${partnerVotedBreakup ? 'text-warning-coral' : 'text-secondary-mint'}`}>
                      {partnerVotedBreakup ? 'Đã vote chia tay 💔' : 'Đang duy trì ❤️'}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={handleVoteBreakup}
                disabled={isCastingVote}
                className="w-full bg-warning-coral text-bg-card font-extrabold text-[15px] border-[2.2px] border-border-color rounded-xl px-5 py-3.5 cursor-pointer shadow-neo inline-flex items-center justify-center gap-2 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none select-none"
              >
                <HeartCrack size={18} />
                {votedBreakup ? 'Hủy biểu quyết chia tay' : 'Bỏ phiếu chia tay'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="flex flex-col gap-4">
            <div className="bg-bg-card border-[2.2px] border-border-color rounded-2xl p-6 shadow-neo text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-coral/15 border-[1.8px] border-border-color flex items-center justify-center text-primary-coral shadow-sm mx-auto">
                <Heart size={30} fill="currentColor" />
              </div>
              <h3 className="text-lg font-black text-text-primary">ForeverDays</h3>
              <p className="text-xs text-text-secondary font-bold -mt-2">Phiên bản 1.0.0</p>
              <div className="w-full border-t-2 border-dashed border-border-color/20 my-2" />
              
              <div className="flex flex-col gap-1.5">
                <span className="block text-xs font-extrabold text-text-secondary uppercase tracking-wider">Hợp tác & Feedback</span>
                <a href="mailto:devprojectlabvn@gmail.com" className="text-[14px] font-black text-primary-coral hover:underline">
                  devprojectlabvn@gmail.com
                </a>
              </div>

              <div className="w-full border-t-2 border-dashed border-border-color/20 my-2" />

              <div className="text-xs text-text-secondary font-bold flex flex-col gap-1">
                <span>© 2026 Góc Vũ Trụ</span>
                <span>
                  Crafted with ❤️ by <strong className="text-text-primary">Family Love Studio</strong>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ProfileScreen;
