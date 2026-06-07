import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { RelationshipProvider, useRelationship } from './src/core/RelationshipContext';
import { AuthScreen } from './src/features/AuthScreen';
import { HomeScreen } from './src/features/HomeScreen';
import { MilestonesScreen } from './src/features/MilestonesScreen';
import { RemindersScreen } from './src/features/RemindersScreen';
import { ProfileScreen } from './src/features/ProfileScreen';
import { Heart, Calendar, Bell, User } from 'lucide-react-native';

function MainApp() {
  const { user, isLoading } = useRelationship();
  const [activeTab, setActiveTab] = useState<'home' | 'milestones' | 'reminders' | 'profile'>('home');

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
        {activeTab === 'reminders' && <RemindersScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </View>

      {/* Custom Neo-Brutalist Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('home')}
          activeOpacity={0.8}
          style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]}
        >
          <Heart
            size={20}
            color={activeTab === 'home' ? AppTheme.colorPrimary : AppTheme.textSecondary}
            fill={activeTab === 'home' ? AppTheme.colorPrimary : 'none'}
            style={{ marginBottom: 4 }}
          />
          <Text style={[styles.tabText, activeTab === 'home' && styles.tabTextActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('milestones')}
          activeOpacity={0.8}
          style={[styles.tabItem, activeTab === 'milestones' && styles.tabItemActive]}
        >
          <Calendar
            size={20}
            color={activeTab === 'milestones' ? AppTheme.colorPrimary : AppTheme.textSecondary}
            fill={activeTab === 'milestones' ? AppTheme.colorPrimary : 'none'}
            style={{ marginBottom: 4 }}
          />
          <Text style={[styles.tabText, activeTab === 'milestones' && styles.tabTextActive]}>Cột mốc</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('reminders')}
          activeOpacity={0.8}
          style={[styles.tabItem, activeTab === 'reminders' && styles.tabItemActive]}
        >
          <Bell
            size={20}
            color={activeTab === 'reminders' ? AppTheme.colorPrimary : AppTheme.textSecondary}
            fill={activeTab === 'reminders' ? AppTheme.colorPrimary : 'none'}
            style={{ marginBottom: 4 }}
          />
          <Text style={[styles.tabText, activeTab === 'reminders' && styles.tabTextActive]}>Báo thức</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.8}
          style={[styles.tabItem, activeTab === 'profile' && styles.tabItemActive]}
        >
          <User
            size={20}
            color={activeTab === 'profile' ? AppTheme.colorPrimary : AppTheme.textSecondary}
            fill={activeTab === 'profile' ? AppTheme.colorPrimary : 'none'}
            style={{ marginBottom: 4 }}
          />
          <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>Hồ sơ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
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
