import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform, Alert, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'AsyncStorageError',
  'Auto refresh tick failed with error'
]);
import { RelationshipProvider, useRelationship, loadDemoStorageFromAsyncStorage } from './src/core/RelationshipContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setSupabaseStorage, supabase } from '@forever-days/core';

// Safe Storage Wrapper to prevent crash in Expo Go SDK 53
const MemoryStorage = new Map<string, string>();
const SafeStorage = {
  getItem: async (key: string) => {
    try { return await AsyncStorage.getItem(key); }
    catch { return MemoryStorage.get(key) || null; }
  },
  setItem: async (key: string, value: string) => {
    try { await AsyncStorage.setItem(key, value); }
    catch { MemoryStorage.set(key, value); }
  },
  removeItem: async (key: string) => {
    try { await AsyncStorage.removeItem(key); }
    catch { MemoryStorage.delete(key); }
  }
};

// Configure Supabase to persist auth state on Mobile
setSupabaseStorage(SafeStorage);
import { MOBILE_CONFIG } from './src/constants/config';
import { AuthScreen } from './src/features/AuthScreen';
import { HomeScreen } from './src/features/HomeScreen';
import { MilestonesScreen } from './src/features/MilestonesScreen';
import { RemindersScreen } from './src/features/RemindersScreen';
import { CosmosScreen } from './src/features/CosmosScreen';
import { ProfileScreen } from './src/features/ProfileScreen';
import { Heart, Calendar, Bell, User, Sparkles } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { UserPushTokenService } from '@forever-days/core';

// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function MainApp() {
  const { user, isLoading, coupleId, partner, isDemoMode } = useRelationship();
  const [activeTab, setActiveTab] = useState<'home' | 'milestones' | 'reminders' | 'cosmos' | 'profile'>('home');

  // Restore last active tab
  useEffect(() => {
    AsyncStorage.getItem('fd_active_tab').then(saved => {
      const valid = ['home', 'milestones', 'reminders', 'cosmos', 'profile'];
      if (saved && valid.includes(saved)) {
        setActiveTab(saved as any);
      }
    }).catch(() => {});
  }, []);

  const handleTabChange = (tab: 'home' | 'milestones' | 'reminders' | 'cosmos' | 'profile') => {
    setActiveTab(tab);
    AsyncStorage.setItem('fd_active_tab', tab).catch(() => {});
  };

  // Listen to signal channel globally on Mobile
  useEffect(() => {
    if (isDemoMode || !coupleId || !user?.id) return;

    const channel = supabase.channel(`couple_signals_${coupleId}`)
      .on('broadcast', { event: 'signal' }, ({ payload }) => {
        if (payload.senderId !== user.id) {
          const senderName = partner?.nickname || 'Nửa kia';
          const title = payload.type === 'love' ? 'Tín hiệu yêu thương! 💕' : 'Ai đó đang chọc bạn! 🤪';
          const body = payload.type === 'love'
            ? `${senderName} đang nhớ bạn rất nhiều! 🥰`
            : `${senderName} vừa chọc ghẹo bạn một cái! 🤪`;

          Alert.alert(title, body);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, user?.id, partner, isDemoMode]);

  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      if (!user) return;
      
      try {
        let token;
        
        const permission = (await Notifications.getPermissionsAsync()) as any;
        let isGranted = permission.granted || permission.status === 'granted';
        if (!isGranted) {
          const requestPermission = (await Notifications.requestPermissionsAsync()) as any;
          isGranted = requestPermission.granted || requestPermission.status === 'granted';
        }
        if (!isGranted) {
          Alert.alert('Quyền thông báo', 'Quyền thông báo bị từ chối! Hãy bật quyền thông báo trong cài đặt điện thoại.');
          return;
        }

        try {
          token = (await Notifications.getExpoPushTokenAsync({
            projectId: '39e77de7-8632-4920-acbf-a8ddf27db9ee',
          })).data;
        } catch (tokenErr: any) {
          console.log('Lỗi getExpoPushTokenAsync với projectId cố định:', tokenErr);
          try {
            token = (await Notifications.getExpoPushTokenAsync()).data;
          } catch (tokenErr2: any) {
            console.log('Không thể lấy Expo Push Token thực tế (đang chạy trong Expo Go):', tokenErr2);
            // Đăng ký mock token để bypass giới hạn của Expo Go SDK 53/54
            token = `mock-expo-go-token-${user.id}`;
            const tokenService = new UserPushTokenService();
            await tokenService.updatePushToken(user.id, token);
            console.log('Đã đăng ký mock token cho Expo Go:', token);
            if (MOBILE_CONFIG.SHOW_NOTIFICATION_DIAGNOSTIC_ALERTS) {
              Alert.alert(
                'Chế độ giả lập Expo Go',
                'Do Expo Go SDK 54 không hỗ trợ nhận thông báo đẩy trực tiếp, hệ thống đã chuyển sang chế độ giả lập thông báo để bạn test tính năng!'
              );
            }
            return;
          }
        }

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }

        if (token) {
          const tokenService = new UserPushTokenService();
          await tokenService.updatePushToken(user.id, token);
          console.log('Đăng ký push token thành công:', token);
          if (MOBILE_CONFIG.SHOW_NOTIFICATION_DIAGNOSTIC_ALERTS) {
            Alert.alert('Đăng ký thành công', 'Thiết bị đã được đăng ký nhận thông báo đẩy thành công!');
          }
        }
      } catch (err: any) {
        console.error('Lỗi đăng ký nhận thông báo:', err);
        if (MOBILE_CONFIG.SHOW_NOTIFICATION_DIAGNOSTIC_ALERTS) {
          Alert.alert('Lỗi đăng ký thông báo', err?.message || String(err));
        }
      }
    }

    if (user) {
      registerForPushNotificationsAsync();
    }
  }, [user]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppTheme.colorPrimary} />
        <Text style={styles.loadingText}>Đang chuẩn bị ForeverDays...</Text>
      </View>
    );
  }

  // Not logged in -> AuthScreen
  if (!user) {
    return <AuthScreen />;
  }

  // Logged in -> Bottom Tab Navigator Dashboard
  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar style="light" />
      <View style={styles.screenContent}>
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'milestones' && <MilestonesScreen />}
        {activeTab === 'cosmos' && <CosmosScreen />}
        {activeTab === 'reminders' && <RemindersScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </View>

      {/* Custom Neo-Brutalist Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => handleTabChange('home')}
          activeOpacity={0.8}
          style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]}
        >
          <Heart
            size={20}
            color={activeTab === 'home' ? AppTheme.colorPrimary : AppTheme.textSecondary}
            fill={activeTab === 'home' ? AppTheme.colorPrimary : 'none'}
            style={{ marginBottom: 4 }}
          />
          <Text allowFontScaling={false} style={[styles.tabText, activeTab === 'home' && styles.tabTextActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabChange('milestones')}
          activeOpacity={0.8}
          style={[styles.tabItem, activeTab === 'milestones' && styles.tabItemActive]}
        >
          <Calendar
            size={20}
            color={activeTab === 'milestones' ? AppTheme.colorPrimary : AppTheme.textSecondary}
            fill={activeTab === 'milestones' ? AppTheme.colorPrimary : 'none'}
            style={{ marginBottom: 4 }}
          />
          <Text allowFontScaling={false} style={[styles.tabText, activeTab === 'milestones' && styles.tabTextActive]}>Cột mốc</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabChange('cosmos')}
          activeOpacity={0.8}
          style={[styles.tabItem, activeTab === 'cosmos' && styles.tabItemActive]}
        >
          <Sparkles
            size={20}
            color={activeTab === 'cosmos' ? AppTheme.colorPrimary : AppTheme.textSecondary}
            fill={activeTab === 'cosmos' ? AppTheme.colorPrimary : 'none'}
            style={{ marginBottom: 4 }}
          />
          <Text allowFontScaling={false} style={[styles.tabText, activeTab === 'cosmos' && styles.tabTextActive]}>Vũ Trụ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabChange('reminders')}
          activeOpacity={0.8}
          style={[styles.tabItem, activeTab === 'reminders' && styles.tabItemActive]}
        >
          <Bell
            size={20}
            color={activeTab === 'reminders' ? AppTheme.colorPrimary : AppTheme.textSecondary}
            fill={activeTab === 'reminders' ? AppTheme.colorPrimary : 'none'}
            style={{ marginBottom: 4 }}
          />
          <Text allowFontScaling={false} style={[styles.tabText, activeTab === 'reminders' && styles.tabTextActive]}>Báo thức</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabChange('profile')}
          activeOpacity={0.8}
          style={[styles.tabItem, activeTab === 'profile' && styles.tabItemActive]}
        >
          <User
            size={20}
            color={activeTab === 'profile' ? AppTheme.colorPrimary : AppTheme.textSecondary}
            fill={activeTab === 'profile' ? AppTheme.colorPrimary : 'none'}
            style={{ marginBottom: 4 }}
          />
          <Text allowFontScaling={false} style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>Hồ sơ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function init() {
      await loadDemoStorageFromAsyncStorage();
      setIsReady(true);
    }
    init();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <RelationshipProvider>
      <MainApp />
    </RelationshipProvider>
  );
}

const AppTheme = {
  bgPrimary: '#fff6f7',
  bgCard: '#ffffff',
  borderColor: '#3d2f3d',
  textPrimary: '#3d2f3d',
  textSecondary: '#856a85',
  colorPrimary: '#ff6584',
  borderWidth: 2.2,
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: AppTheme.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 14,
    color: AppTheme.textSecondary,
    fontWeight: '800',
    fontSize: 14,
  },
  appContainer: {
    flex: 1,
    backgroundColor: AppTheme.bgPrimary,
  },
  screenContent: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: AppTheme.bgCard,
    borderTopWidth: AppTheme.borderWidth,
    borderColor: AppTheme.borderColor,
    paddingVertical: 10,
    paddingHorizontal: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginHorizontal: 4,
  },
  tabItemActive: {
    borderColor: AppTheme.colorPrimary,
    backgroundColor: 'rgba(255, 142, 158, 0.12)',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '800',
    color: AppTheme.textSecondary,
  },
  tabTextActive: {
    color: AppTheme.colorPrimary,
  },
});
