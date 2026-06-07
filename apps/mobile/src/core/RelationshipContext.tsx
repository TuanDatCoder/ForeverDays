import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  supabase,
  CoupleService, ProfileService, PairingCodeService
} from '@forever-days/core';
import type { UserProfile, Couple } from '@forever-days/core';

interface RelationshipState {
  user: UserProfile | null;
  partner: UserProfile | null;
  anniversaryDate: string | null;
  isPaired: boolean;
  isLoading: boolean;
  error: string | null;
  isDemoMode: boolean;
  pairingCode: string | null;
  coupleId: string | null;
}

interface RelationshipContextType extends RelationshipState {
  startDemoMode: () => Promise<void>;
  signOut: () => Promise<void>;
  updateAnniversary: (date: string) => Promise<void>;
  updateProfile: (isMe: boolean, nickname: string, dob: string, gender: string, avatarUrl?: string) => Promise<void>;
  generatePairCode: () => Promise<void>;
  connectWithCode: (code: string) => Promise<boolean>;
  register: (email: string, password: string, nickname: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  clearError: () => void;
}

const RelationshipContext = createContext<RelationshipContextType | undefined>(undefined);

const coupleService = new CoupleService();
const profileService = new ProfileService();
const pairingCodeService = new PairingCodeService();

const MOCK_USER: UserProfile = {
  id: 'user-1',
  nickname: 'Hoàng Long',
  avatarUrl: '',
  dob: '2001-08-15',
  gender: 'Nam',
};

const MOCK_PARTNER: UserProfile = {
  id: 'user-2',
  nickname: 'Mai Chi',
  avatarUrl: '',
  dob: '2002-10-24',
  gender: 'Nữ',
};

// In-memory fallback storage for Demo Mode in React Native
const demoStorage: Record<string, string> = {};

export const RelationshipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<RelationshipState>({
    user: null,
    partner: null,
    anniversaryDate: null,
    isPaired: false,
    isLoading: true,
    error: null,
    isDemoMode: false,
    pairingCode: null,
    coupleId: null,
  });

  const clearError = () => setState(prev => ({ ...prev, error: null }));

  const loadState = async (userId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const isDemo = demoStorage['is_demo_mode'] === 'true';
      if (isDemo) {
        loadDemoState();
        return;
      }

      // 1. Fetch User Profile
      const userProfile = await profileService.fetchProfile(userId);
      if (!userProfile) {
        setState(prev => ({ ...prev, isLoading: false, error: 'Không tìm thấy profile' }));
        return;
      }

      // 2. Fetch Active Couple
      const couple = await coupleService.fetchActiveCouple(userId);
      if (couple) {
        const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;
        let partnerProfile: UserProfile | null = null;
        if (partnerId) {
          partnerProfile = await profileService.fetchProfile(partnerId);
        }

        setState({
          user: userProfile,
          partner: partnerProfile,
          anniversaryDate: couple.anniversaryDate || null,
          isPaired: true,
          isLoading: false,
          error: null,
          isDemoMode: false,
          pairingCode: null,
          coupleId: couple.id,
        });
      } else {
        // Unpaired user
        setState({
          user: userProfile,
          partner: null,
          anniversaryDate: null,
          isPaired: false,
          isLoading: false,
          error: null,
          isDemoMode: false,
          pairingCode: null,
          coupleId: null,
        });
      }
    } catch (e: any) {
      setState(prev => ({ ...prev, isLoading: false, error: e.message || 'Lỗi tải dữ liệu.' }));
    }
  };

  const loadDemoState = () => {
    const defaultAnn = new Date();
    defaultAnn.setFullYear(defaultAnn.getFullYear() - 1);
    const annDateStr = demoStorage['demo_anniversary'] || defaultAnn.toISOString().split('T')[0];
    const userNick = demoStorage['demo_user_nickname'] || MOCK_USER.nickname;
    const partnerNick = demoStorage['demo_partner_nickname'] || MOCK_PARTNER.nickname;
    const userDob = demoStorage['demo_user_dob'] || MOCK_USER.dob;
    const partnerDob = demoStorage['demo_partner_dob'] || MOCK_PARTNER.dob;
    const userGender = demoStorage['demo_user_gender'] || MOCK_USER.gender;
    const partnerGender = demoStorage['demo_partner_gender'] || MOCK_PARTNER.gender;
    const userAvatar = demoStorage['demo_user_avatarUrl'] || MOCK_USER.avatarUrl;
    const partnerAvatar = demoStorage['demo_partner_avatarUrl'] || MOCK_PARTNER.avatarUrl;

    setState({
      user: { ...MOCK_USER, nickname: userNick, dob: userDob, gender: userGender, avatarUrl: userAvatar },
      partner: { ...MOCK_PARTNER, nickname: partnerNick, dob: partnerDob, gender: partnerGender, avatarUrl: partnerAvatar },
      anniversaryDate: annDateStr,
      isPaired: true,
      isLoading: false,
      error: null,
      isDemoMode: true,
      pairingCode: 'LOVE999',
      coupleId: 'demo-couple-id',
    });
  };

  // Listen to Auth state changes
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const isDemo = demoStorage['is_demo_mode'] === 'true';

      if (isDemo) {
        loadDemoState();
      } else if (session?.user) {
        await loadState(session.user.id);
      } else {
        setState(prev => ({ ...prev, isLoading: false, user: null, partner: null, isPaired: false }));
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const isDemo = demoStorage['is_demo_mode'] === 'true';
      if (isDemo) return;

      if (event === 'SIGNED_IN' && session?.user) {
        await loadState(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          partner: null,
          anniversaryDate: null,
          isPaired: false,
          isLoading: false,
          error: null,
          isDemoMode: false,
          pairingCode: null,
          coupleId: null,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const startDemoMode = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    demoStorage['is_demo_mode'] = 'true';
    const defaultAnn = new Date();
    defaultAnn.setFullYear(defaultAnn.getFullYear() - 1);
    
    demoStorage['demo_anniversary'] = defaultAnn.toISOString().split('T')[0];
    demoStorage['demo_user_nickname'] = MOCK_USER.nickname;
    demoStorage['demo_partner_nickname'] = MOCK_PARTNER.nickname;
    demoStorage['demo_user_dob'] = MOCK_USER.dob || '';
    demoStorage['demo_partner_dob'] = MOCK_PARTNER.dob || '';
    demoStorage['demo_user_gender'] = MOCK_USER.gender || '';
    demoStorage['demo_partner_gender'] = MOCK_PARTNER.gender || '';
    demoStorage['demo_user_avatarUrl'] = MOCK_USER.avatarUrl;
    demoStorage['demo_partner_avatarUrl'] = MOCK_PARTNER.avatarUrl;

    setState({
      user: MOCK_USER,
      partner: MOCK_PARTNER,
      anniversaryDate: defaultAnn.toISOString().split('T')[0],
      isPaired: true,
      isLoading: false,
      error: null,
      isDemoMode: true,
      pairingCode: 'LOVE999',
      coupleId: 'demo-couple-id',
    });
  };

  const signOut = async () => {
    // Clear memory demo storage
    for (const key in demoStorage) {
      delete demoStorage[key];
    }
    try {
      await supabase.auth.signOut();
    } catch {}
    setState({
      user: null,
      partner: null,
      anniversaryDate: null,
      isPaired: false,
      isLoading: false,
      error: null,
      isDemoMode: false,
      pairingCode: null,
      coupleId: null,
    });
  };

  const updateAnniversary = async (date: string) => {
    if (state.isDemoMode) {
      demoStorage['demo_anniversary'] = date;
      setState(prev => ({ ...prev, anniversaryDate: date }));
    } else {
      try {
        if (state.coupleId) {
          await coupleService.updateAnniversaryDate(state.coupleId, date);
          setState(prev => ({ ...prev, anniversaryDate: date }));
        }
      } catch (e: any) {
        setState(prev => ({ ...prev, error: `Lỗi cập nhật ngày kỷ niệm: ${e.message}` }));
      }
    }
  };

  const updateProfile = async (isMe: boolean, nickname: string, dob: string, gender: string, avatarUrl?: string) => {
    if (state.isDemoMode) {
      const prefix = isMe ? 'demo_user' : 'demo_partner';
      demoStorage[`${prefix}_nickname`] = nickname;
      demoStorage[`${prefix}_dob`] = dob;
      demoStorage[`${prefix}_gender`] = gender;
      if (avatarUrl !== undefined) {
        demoStorage[`${prefix}_avatarUrl`] = avatarUrl;
      }

      if (isMe) {
        setState(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, nickname, dob, gender, avatarUrl: avatarUrl !== undefined ? avatarUrl : prev.user.avatarUrl } : null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          partner: prev.partner ? { ...prev.partner, nickname, dob, gender, avatarUrl: avatarUrl !== undefined ? avatarUrl : prev.partner.avatarUrl } : null,
        }));
      }
    } else {
      try {
        const targetProfile = isMe ? state.user : state.partner;
        if (!targetProfile) return;

        const updated: UserProfile = {
          ...targetProfile,
          nickname,
          dob,
          gender,
          avatarUrl: avatarUrl !== undefined ? avatarUrl : targetProfile.avatarUrl,
        };

        await profileService.updateProfile(updated);

        if (isMe) {
          setState(prev => ({ ...prev, user: updated }));
        } else {
          setState(prev => ({ ...prev, partner: updated }));
        }
      } catch (e: any) {
        setState(prev => ({ ...prev, error: `Lỗi cập nhật hồ sơ: ${e.message}` }));
      }
    }
  };

  const generatePairCode = async () => {
    if (state.isDemoMode) {
      setState(prev => ({ ...prev, pairingCode: 'LOVE888' }));
      return;
    }
    if (!state.user) return;

    try {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const expires = new Date();
      expires.setHours(expires.getHours() + 24);

      await pairingCodeService.createPairingCode(state.user.id, code, expires.toISOString());
      setState(prev => ({ ...prev, pairingCode: code }));
    } catch (e: any) {
      setState(prev => ({ ...prev, error: `Lỗi sinh mã ghép đôi: ${e.message}` }));
    }
  };

  const connectWithCode = async (code: string): Promise<boolean> => {
    if (state.isDemoMode) {
      setState(prev => ({
        ...prev,
        isPaired: true,
        anniversaryDate: new Date().toISOString().split('T')[0],
        partner: MOCK_PARTNER,
      }));
      return true;
    }
    if (!state.user) return false;

    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const validCode = await pairingCodeService.fetchValidCode(code);
      if (!validCode) {
        setState(prev => ({ ...prev, isLoading: false, error: 'Mã ghép đôi không tồn tại hoặc đã hết hạn!' }));
        return false;
      }

      const creatorId = validCode.creatorId;
      if (creatorId === state.user.id) {
        setState(prev => ({ ...prev, isLoading: false, error: 'Bạn không thể tự ghép đôi với chính mình!' }));
        return false;
      }

      // Insert Couple row
      await coupleService.insertCouple(creatorId, state.user.id, new Date().toISOString().split('T')[0]);

      // Mark code as used
      await pairingCodeService.markCodeAsUsed(validCode.id);

      // Reload state
      await loadState(state.user.id);
      return true;
    } catch (e: any) {
      setState(prev => ({ ...prev, isLoading: false, error: e.message || 'Lỗi ghép đôi.' }));
      return false;
    }
  };

  const register = async (email: string, password: string, nickname: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const redirectTo = `https://foreverdays.co/confirm`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nickname },
          emailRedirectTo: redirectTo,
        },
      });

      if (error) throw error;
      const user = data.user;

      if (user) {
        if (!data.session) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Đăng ký thành công! Vui lòng kiểm tra hộp thư email của bạn để xác nhận tài khoản trước khi đăng nhập.',
          }));
          return false;
        }

        try {
          await profileService.createProfile(user.id, nickname);
        } catch {}

        demoStorage['is_demo_mode'] = 'false';
        await loadState(user.id);
        return true;
      }
      setState(prev => ({ ...prev, isLoading: false, error: 'Đăng ký thất bại!' }));
      return false;
    } catch (e: any) {
      setState(prev => ({ ...prev, isLoading: false, error: e.message || 'Lỗi đăng ký.' }));
      return false;
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      const user = data.user;

      if (user) {
        demoStorage['is_demo_mode'] = 'false';
        await loadState(user.id);
        return true;
      }
      setState(prev => ({ ...prev, isLoading: false, error: 'Đăng nhập thất bại!' }));
      return false;
    } catch (e: any) {
      setState(prev => ({ ...prev, isLoading: false, error: e.message || 'Lỗi đăng nhập.' }));
      return false;
    }
  };

  return (
    <RelationshipContext.Provider
      value={{
        ...state,
        startDemoMode,
        signOut,
        updateAnniversary,
        updateProfile,
        generatePairCode,
        connectWithCode,
        register,
        signIn,
        clearError,
      }}
    >
      {children}
    </RelationshipContext.Provider>
  );
};

export const useRelationship = () => {
  const context = useContext(RelationshipContext);
  if (!context) {
    throw new Error('useRelationship must be used within a RelationshipProvider');
  }
  return context;
};
export { demoStorage };
