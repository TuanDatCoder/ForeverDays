import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Share, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRelationship } from '../core/RelationshipContext';
import { HeartbeatConnector } from '../components/HeartbeatConnector';
import { UserStatusService, MilestoneService, supabase } from '@forever-days/core';
import { Calendar, Edit3, Heart, RotateCw, Clock, Cake } from 'lucide-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

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

  // Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [modalEmoji, setModalEmoji] = useState('😊');
  const [modalText, setModalText] = useState('');
  const [isAnniversaryModalOpen, setIsAnniversaryModalOpen] = useState(false);
  const [anniversaryInput, setAnniversaryInput] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'ios');

  const statusService = new UserStatusService();

  const moodEmojis = [
    '😊', '🥰', '😍', '😘', '🥳', '😎', '😜', '😇',
    '🥺', '😢', '😭', '😡', '🤬', '😱', '😴', '🥱',
    '😷', '🤔', '🙄', '💖', '🍿', '🎮', '☕', '🥤'
  ];

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

  useEffect(() => {
    loadStatuses();
  }, [user, partner, isDemoMode]);

  useEffect(() => {
    const fetchCustom = async () => {
      if (isDemoMode) {
        return;
      }
      if (!user || !coupleId) return;
      const milestoneService = new MilestoneService();
      try {
        const list = await milestoneService.fetchMilestones(coupleId);
        setCustomMilestones(list);
      } catch {}
    };
    fetchCustom();
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
            <View style={[styles.card, { padding: 0, overflow: 'hidden', marginBottom: 16 }]}>
              <HeartbeatConnector
                days={daysCount}
                user1Avatar={user?.avatarUrl || ''}
                user2Avatar={partner?.avatarUrl || ''}
                user1Name={user?.nickname || 'Bạn'}
                user2Name={partner?.nickname || 'Nửa kia'}
                user1Dob={user?.dob || ''}
                user2Dob={partner?.dob || ''}
                isCelebrationDay={nearestEvent?.daysRemaining === 0}
              />
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
                </View>
              );
            })()}

            {/* Anniversary display */}
            <View style={[styles.card, styles.rowBetween]}>
              <View>
                <Text style={styles.label}>Ngày bắt đầu yêu</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Calendar size={18} color={AppTheme.colorPrimary} style={{ marginRight: 6 }} />
                  <Text style={styles.annDateText}>{formatDateString(anniversaryDate)}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleOpenAnniversaryModal}
                activeOpacity={0.8}
                style={styles.editBtn}
              >
                <Text style={styles.editBtnText}>Sửa</Text>
              </TouchableOpacity>
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
