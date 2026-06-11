import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Platform
} from 'react-native';
import {
  ZodiacService,
  getZodiacSignIdFromDob
} from '@forever-days/core';
import type {
  ZodiacSign,
  ZodiacCriteria,
  ZodiacDetail,
  ZodiacMatch,
  ZodiacAttribute
} from '@forever-days/core';
import {
  Sparkles,
  Heart,
  BookOpen,
  ArrowRightLeft,
  Info,
  HelpCircle
} from 'lucide-react-native';
import { useRelationship } from '../core/RelationshipContext';

const zodiacService = new ZodiacService();

export const CosmosScreen: React.FC = () => {
  const { user, partner } = useRelationship();
  const [activeTab, setActiveTab] = useState<'compatibility' | 'meanings'>('compatibility');
  const [signs, setSigns] = useState<ZodiacSign[]>([]);
  const [criteria, setCriteria] = useState<ZodiacCriteria[]>([]);

  // Calculate zodiac sign IDs from date of birth (or use defaults if not set)
  const userZodiacId = getZodiacSignIdFromDob(user?.dob);
  const partnerZodiacId = partner?.dob 
    ? getZodiacSignIdFromDob(partner.dob)
    : (userZodiacId === 3 ? 10 : 3); // Avoid identical default fallback

  const sign1Id = userZodiacId;
  const sign2Id = partnerZodiacId;

  // Tab 1: Compatibility States
  const [match, setMatch] = useState<ZodiacMatch | null>(null);
  const [attributes, setAttributes] = useState<ZodiacAttribute[]>([]);
  const [loadingMatch, setLoadingMatch] = useState<boolean>(false);

  // Tab 2: Meanings States
  const [selectedSignId, setSelectedSignId] = useState<number | null>(null);
  const [details, setDetails] = useState<ZodiacDetail[]>([]);
  const [activeTopic, setActiveTopic] = useState<string>('');
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // Selector Modal States (left in code structure but unused since dropdowns are disabled)
  const [selectorTarget, setSelectorTarget] = useState<'sign1' | 'sign2' | null>(null);

  // Fetch signs and criteria on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const signsData = await zodiacService.fetchZodiacSigns();
        const criteriaData = await zodiacService.fetchZodiacCriteria();
        setSigns(signsData);
        setCriteria(criteriaData);
        setSelectedSignId(userZodiacId);
      } catch (err) {
        console.error('Failed to initialize Cosmos data:', err);
      }
    };
    initData();
  }, [userZodiacId]);

  // Fetch match details when sign selections change
  useEffect(() => {
    if (activeTab !== 'compatibility') return;
    const fetchMatchInfo = async () => {
      setLoadingMatch(true);
      try {
        const matchData = await zodiacService.fetchZodiacMatch(sign1Id, sign2Id);
        const attrsData = await zodiacService.fetchZodiacAttributes(sign1Id, sign2Id);
        setMatch(matchData);
        setAttributes(attrsData);
      } catch (err) {
        console.error('Failed to fetch match information:', err);
      } finally {
        setLoadingMatch(false);
      }
    };
    fetchMatchInfo();
  }, [sign1Id, sign2Id, activeTab]);

  // Fetch zodiac details when sign selected in meanings tab
  useEffect(() => {
    if (!selectedSignId) return;
    const fetchDetailsInfo = async () => {
      setLoadingDetails(true);
      try {
        const detailsData = await zodiacService.fetchZodiacDetails(selectedSignId);
        setDetails(detailsData);
        if (detailsData.length > 0) {
          const topics = detailsData.map(d => d.topic);
          if (!topics.includes(activeTopic)) {
            setActiveTopic(topics[0]);
          }
        } else {
          setActiveTopic('');
        }
      } catch (err) {
        console.error('Failed to fetch zodiac details:', err);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetailsInfo();
  }, [selectedSignId]);

  const sign1 = signs.find(s => s.id === sign1Id);
  const sign2 = signs.find(s => s.id === sign2Id);
  const selectedSign = signs.find(s => s.id === selectedSignId);

  // Group attributes by criteria category
  const categories = Array.from(new Set(criteria.map(c => c.category)));

  // Custom styling utilities
  const getElementBadgeColor = (element: string) => {
    switch (element) {
      case 'Lửa': return { bg: '#fef3c7', text: '#b45309', border: '#f59e0b' };
      case 'Nước': return { bg: '#dbeafe', text: '#1d4ed8', border: '#3b82f6' };
      case 'Đất': return { bg: '#d1fae5', text: '#047857', border: '#10b981' };
      case 'Khí': return { bg: '#f3e8ff', text: '#6b21a8', border: '#a855f7' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' };
    }
  };

  const handleSelectSign = (id: number) => {
    setSelectorTarget(null);
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerInfo}>
          <View style={styles.headerIconContainer}>
            <Sparkles size={24} color="#ffffff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text allowFontScaling={false} numberOfLines={1} style={styles.headerTitle}>Góc Vũ Trụ</Text>
            <Text allowFontScaling={false} numberOfLines={1} style={styles.headerSubtitle}>Tử vi & So khớp các chòm sao hoàng đạo</Text>
          </View>
        </View>

        {/* Tab Selection */}
        <View style={styles.tabToggleContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('compatibility')}
            style={[styles.tabButton, activeTab === 'compatibility' && styles.tabButtonActive]}
          >
            <Heart size={14} color={activeTab === 'compatibility' ? '#ffffff' : '#856a85'} fill={activeTab === 'compatibility' ? '#ffffff' : 'none'} style={{ marginRight: 6 }} />
            <Text allowFontScaling={false} numberOfLines={1} style={[styles.tabButtonText, activeTab === 'compatibility' && styles.tabButtonTextActive]}>So khớp cung</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setActiveTab('meanings');
              setSelectedSignId(userZodiacId);
            }}
            style={[styles.tabButton, activeTab === 'meanings' && styles.tabButtonActive]}
          >
            <BookOpen size={14} color={activeTab === 'meanings' ? '#ffffff' : '#856a85'} style={{ marginRight: 6 }} />
            <Text allowFontScaling={false} numberOfLines={1} style={[styles.tabButtonText, activeTab === 'meanings' && styles.tabButtonTextActive]}>Ý nghĩa 12 cung</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* COMPATIBILITY TAB */}
        {activeTab === 'compatibility' && (
          <View style={styles.tabContent}>
            {/* Match Info Board */}
            <View style={styles.matchSelectorsContainer}>
              {/* Sign 1 */}
              <View style={styles.selectorCard}>
                <Text allowFontScaling={false} numberOfLines={1} style={[styles.selectorLabel, { color: Theme.colorPrimary }]}>Cung của bạn</Text>
                <View style={styles.selectorImageContainer}>
                  {sign1?.image_url ? (
                    <Image source={{ uri: sign1.image_url }} style={styles.selectorImage} />
                  ) : (
                    <HelpCircle size={36} color="#856a85" />
                  )}
                </View>
                <Text allowFontScaling={false} numberOfLines={1} style={styles.selectorName}>{sign1?.name || 'Đang tải'}</Text>
                {sign1 && (
                  <View style={[styles.miniBadge, { backgroundColor: getElementBadgeColor(sign1.element).bg, borderColor: getElementBadgeColor(sign1.element).border }]}>
                    <Text allowFontScaling={false} numberOfLines={1} style={[styles.miniBadgeText, { color: getElementBadgeColor(sign1.element).text }]}>{sign1.element}</Text>
                  </View>
                )}
              </View>

              {/* Heart and Percentage Ring */}
              <View style={styles.scoreContainer}>
                {loadingMatch ? (
                  <ActivityIndicator size="small" color="#ff6584" />
                ) : (
                  <View style={styles.circleRing}>
                    <Text allowFontScaling={false} numberOfLines={1} style={styles.circleScoreText}>{match?.match_score ?? 50}%</Text>
                    <Text allowFontScaling={false} numberOfLines={1} style={styles.circleScoreLabel}>HÒA HỢP</Text>
                  </View>
                )}
                <View style={styles.heartFloat}>
                  <Heart size={16} color="#ff6584" fill="#ff6584" />
                </View>
              </View>

              {/* Sign 2 */}
              <View style={styles.selectorCard}>
                <Text allowFontScaling={false} numberOfLines={1} style={[styles.selectorLabel, { color: '#8b5cf6' }]}>Cung nửa kia</Text>
                <View style={styles.selectorImageContainer}>
                  {sign2?.image_url ? (
                    <Image source={{ uri: sign2.image_url }} style={styles.selectorImage} />
                  ) : (
                    <HelpCircle size={36} color="#856a85" />
                  )}
                </View>
                <Text allowFontScaling={false} numberOfLines={1} style={styles.selectorName}>{sign2?.name || 'Đang tải'}</Text>
                {sign2 && (
                  <View style={[styles.miniBadge, { backgroundColor: getElementBadgeColor(sign2.element).bg, borderColor: getElementBadgeColor(sign2.element).border }]}>
                    <Text allowFontScaling={false} numberOfLines={1} style={[styles.miniBadgeText, { color: getElementBadgeColor(sign2.element).text }]}>{sign2.element}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Analysis details */}
            <View style={styles.detailsCard}>
              <View style={styles.detailTitleRow}>
                <View style={[styles.iconBox, { backgroundColor: '#ffe4e6' }]}>
                  <Heart size={16} color="#e11d48" fill="#e11d48" />
                </View>
                <Text allowFontScaling={false} numberOfLines={1} style={styles.detailTitleText}>Góc Độ Tình Yêu</Text>
              </View>
              <Text style={styles.detailBodyText}>
                {match?.love_analysis || 'Luận giải về tình duyên và tình cảm đôi bên đang được cập nhật.'}
              </Text>
            </View>

            <View style={styles.detailsCard}>
              <View style={styles.detailTitleRow}>
                <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
                  <ArrowRightLeft size={16} color="#0284c7" />
                </View>
                <Text allowFontScaling={false} numberOfLines={1} style={styles.detailTitleText}>Góc Độ Tình Bạn</Text>
              </View>
              <Text style={styles.detailBodyText}>
                {match?.friendship_analysis || 'Luận giải về giao tiếp xã hội và mối quan hệ bạn bè đang được cập nhật.'}
              </Text>
            </View>

            {/* Trait Comparisons Section */}
            <View style={styles.comparisonCard}>
              <View style={styles.comparisonHeader}>
                <Text allowFontScaling={false} numberOfLines={1} style={styles.comparisonTitle}>So Sánh Đặc Điểm Tương Quan</Text>
                <Text allowFontScaling={false} numberOfLines={1} style={styles.comparisonSubtitle}>Đánh giá các chỉ số từ 1 đến 10</Text>
              </View>

              {categories.map(cat => {
                const catCriteria = criteria.filter(c => c.category === cat);
                
                // Calculate category average difference
                let totalDiff = 0;
                let count = 0;
                catCriteria.forEach(crit => {
                  const s1 = attributes.find(a => a.zodiac_id === sign1Id && a.criteria_id === crit.id)?.score || 5;
                  const s2 = attributes.find(a => a.zodiac_id === sign2Id && a.criteria_id === crit.id)?.score || 5;
                  totalDiff += Math.abs(s1 - s2);
                  count++;
                });
                const avgDiff = count > 0 ? totalDiff / count : 0;
                const catMatchScore = Math.max(0, Math.min(100, Math.round(100 - (avgDiff * 11))));

                return (
                  <View key={cat} style={styles.categoryBlock}>
                    {/* Category Label */}
                    <View style={styles.categoryHeaderRow}>
                      <Text allowFontScaling={false} numberOfLines={1} style={styles.categoryLabelText}>{cat}</Text>
                      <Text allowFontScaling={false} numberOfLines={1} style={styles.categoryMatchPercentText}>Hợp: {catMatchScore}%</Text>
                    </View>

                    {/* Criteria list */}
                    {catCriteria.map(crit => {
                      const attr1 = attributes.find(a => a.zodiac_id === sign1Id && a.criteria_id === crit.id);
                      const attr2 = attributes.find(a => a.zodiac_id === sign2Id && a.criteria_id === crit.id);
                      const score1 = attr1?.score || 5;
                      const score2 = attr2?.score || 5;

                      return (
                        <View key={crit.id} style={styles.criteriaItem}>
                          {/* Top scores row */}
                          <View style={styles.criteriaHeader}>
                            <Text allowFontScaling={false} numberOfLines={1} style={styles.score1Text}>{score1}/10</Text>
                            <Text allowFontScaling={false} numberOfLines={1} style={styles.criteriaName}>{crit.criteria_name}</Text>
                            <Text allowFontScaling={false} numberOfLines={1} style={styles.score2Text}>{score2}/10</Text>
                          </View>

                          {/* Progress bars row */}
                          <View style={styles.barRow}>
                            {/* Bar 1 (flows right-to-left) */}
                            <View style={styles.leftBarContainer}>
                              <View
                                style={[
                                  styles.leftBarFill,
                                  { width: `${score1 * 10}%` }
                                ]}
                              />
                            </View>
                            {/* Bar 2 (flows left-to-right) */}
                            <View style={styles.rightBarContainer}>
                              <View
                                style={[
                                  styles.rightBarFill,
                                  { width: `${score2 * 10}%` }
                                ]}
                              />
                            </View>
                          </View>

                          {/* Descriptions row */}
                          <View style={styles.descriptionRow}>
                            <View style={styles.descriptionCol}>
                              <Text allowFontScaling={false} numberOfLines={1} style={styles.miniLabel1}>{sign1?.name}</Text>
                              <Text style={styles.miniDescText}>{attr1?.description || 'Nội dung đang tải...'}</Text>
                            </View>
                            <View style={styles.descriptionCol}>
                              <Text allowFontScaling={false} numberOfLines={1} style={styles.miniLabel2}>{sign2?.name}</Text>
                              <Text style={styles.miniDescText}>{attr2?.description || 'Nội dung đang tải...'}</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* MEANINGS TAB */}
        {activeTab === 'meanings' && (
          <View style={styles.tabContent}>
            {/* Horizontal Zodiac Selector */}
            <View style={styles.zodiacSelectorCard}>
              <Text allowFontScaling={false} numberOfLines={1} style={styles.horizontalSelectorTitle}>12 chòm sao hoàng đạo</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollList}>
                {signs.map(s => {
                  const isSelected = selectedSignId === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => setSelectedSignId(s.id)}
                      style={[styles.horizontalItem, isSelected && styles.horizontalItemActive]}
                    >
                      <View style={styles.horizontalAvatarContainer}>
                        {s.image_url ? (
                          <Image source={{ uri: s.image_url }} style={styles.horizontalAvatar} />
                        ) : (
                          <HelpCircle size={20} color="#856a85" />
                        )}
                      </View>
                      <Text allowFontScaling={false} numberOfLines={1} style={[styles.horizontalName, isSelected && styles.horizontalNameActive]}>
                        {s.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Selected Sign Details Box */}
            {selectedSign ? (
              <View style={styles.detailsContainerCard}>
                {/* Header details */}
                <View style={styles.detailsHeader}>
                  <View style={styles.detailsBigAvatarContainer}>
                    {selectedSign.image_url ? (
                      <Image source={{ uri: selectedSign.image_url }} style={styles.detailsBigAvatar} />
                    ) : (
                      <HelpCircle size={44} color="#856a85" />
                    )}
                  </View>
                  <View style={styles.detailsProfileInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text allowFontScaling={false} numberOfLines={1} style={styles.detailsProfileName}>{selectedSign.name}</Text>
                      <View style={styles.englishNameBadge}>
                        <Text allowFontScaling={false} numberOfLines={1} style={styles.englishNameText}>{selectedSign.english_name}</Text>
                      </View>
                    </View>
                    <Text allowFontScaling={false} numberOfLines={1} style={styles.detailsDateText}>Ngày sinh: {selectedSign.date_range}</Text>
                    <Text style={styles.detailsDescText}>{selectedSign.description}</Text>
                  </View>
                </View>

                {/* Grid Specs */}
                <View style={styles.specsGrid}>
                  <View style={styles.specBox}>
                    <Text allowFontScaling={false} numberOfLines={1} style={styles.specLabel}>Nguyên tố</Text>
                    <Text allowFontScaling={false} numberOfLines={1} style={styles.specVal}>{selectedSign.element || 'Chưa có'}</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text allowFontScaling={false} numberOfLines={1} style={styles.specLabel}>Tính chất</Text>
                    <Text allowFontScaling={false} numberOfLines={1} style={styles.specVal}>{selectedSign.modality || 'Chưa có'}</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text allowFontScaling={false} numberOfLines={1} style={styles.specLabel}>Sao cai quản</Text>
                    <Text allowFontScaling={false} numberOfLines={1} style={styles.specVal}>{selectedSign.ruling_planet || 'Chưa có'}</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text allowFontScaling={false} numberOfLines={1} style={styles.specLabel}>Màu sắc</Text>
                    <Text allowFontScaling={false} numberOfLines={1} style={styles.specVal}>{selectedSign.lucky_colors || 'Chưa có'}</Text>
                  </View>
                </View>

                {/* Sub Topics */}
                {loadingDetails ? (
                  <ActivityIndicator size="small" color="#ff6584" style={{ marginVertical: 30 }} />
                ) : (
                  <View style={{ marginTop: 8 }}>
                    {details.length > 0 ? (
                      <>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicTabsScroll}>
                          {details.map(d => (
                            <TouchableOpacity
                              key={d.id}
                              onPress={() => setActiveTopic(d.topic)}
                              style={[styles.topicTab, activeTopic === d.topic && styles.topicTabActive]}
                            >
                              <Text allowFontScaling={false} numberOfLines={1} style={[styles.topicTabText, activeTopic === d.topic && styles.topicTabTextActive]}>
                                {d.topic}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>

                        {/* Article Text Content */}
                        {details.map(d => {
                          if (d.topic !== activeTopic) return null;
                          return (
                            <View key={d.id} style={styles.topicContentBox}>
                              <Text allowFontScaling={false} numberOfLines={1} style={styles.topicTitle}>{d.title}</Text>
                              <Text style={styles.topicBody}>{d.content}</Text>
                            </View>
                          );
                        })}
                      </>
                    ) : (
                      <View style={styles.noDetailsBox}>
                        <Info size={24} color="#856a85" style={{ marginBottom: 6 }} />
                        <Text allowFontScaling={false} style={styles.noDetailsText}>Chưa có thông tin bài viết chi tiết cho cung này.</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noSelectedBox}>
                <Info size={36} color="#856a85" style={{ marginBottom: 8 }} />
                <Text allowFontScaling={false} style={styles.noSelectedText}>Hãy chọn một cung hoàng đạo ở trên để xem chi tiết.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* SIGN SELECTOR MODAL (BOTTOM DRAWER-STYLE GRID) */}
      <Modal
        visible={selectorTarget !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectorTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text allowFontScaling={false} style={styles.modalTitle}>
                {selectorTarget === 'sign1' ? 'Chọn Cung Thứ Nhất' : 'Chọn Cung Thứ Hai'}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectorTarget(null)}
                style={styles.modalCloseButton}
              >
                <Text allowFontScaling={false} style={styles.modalCloseText}>Đóng</Text>
              </TouchableOpacity>
            </View>

            {/* Grid list of 12 signs */}
            <FlatList
              data={signs}
              keyExtractor={(item) => item.id.toString()}
              numColumns={3}
              contentContainerStyle={styles.modalGridList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectSign(item.id)}
                  style={styles.modalGridItem}
                >
                  <View style={styles.modalAvatarContainer}>
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={styles.modalAvatar} />
                    ) : (
                      <HelpCircle size={24} color="#856a85" />
                    )}
                  </View>
                  <Text allowFontScaling={false} numberOfLines={1} style={styles.modalItemName}>{item.name}</Text>
                  <Text allowFontScaling={false} numberOfLines={1} style={styles.modalItemDate}>{item.date_range}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const Theme = {
  bgPrimary: '#fff6f7',
  bgCard: '#ffffff',
  borderColor: '#3d2f3d',
  textPrimary: '#3d2f3d',
  textSecondary: '#856a85',
  colorPrimary: '#ff6584',
  borderWidth: 2.2,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.bgPrimary,
  },
  headerCard: {
    backgroundColor: Theme.bgCard,
    borderBottomWidth: Theme.borderWidth,
    borderColor: Theme.borderColor,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: Platform.OS === 'android' ? 70 : 60,
    zIndex: 10,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIconContainer: {
    backgroundColor: Theme.colorPrimary,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Theme.borderColor,
  },
  headerTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Theme.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.textSecondary,
    marginTop: 1,
  },
  tabToggleContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.bgPrimary,
    borderWidth: 1.5,
    borderColor: Theme.borderColor,
    borderRadius: 10,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: Theme.colorPrimary,
    borderColor: Theme.borderColor,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.textSecondary,
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 100, // Safe buffer for bottom absolute tab bar
  },
  tabContent: {
    padding: 14,
    gap: 14,
  },
  matchSelectorsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.bgCard,
    borderWidth: Theme.borderWidth,
    borderColor: Theme.borderColor,
    padding: 14,
    borderRadius: 20,
  },
  selectorCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Theme.bgPrimary,
    borderWidth: 1.5,
    borderColor: Theme.borderColor,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  selectorLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  selectorImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Theme.borderColor,
    backgroundColor: Theme.bgCard,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  selectorName: {
    fontSize: 13,
    fontWeight: '900',
    color: Theme.textPrimary,
    marginTop: 6,
  },
  miniBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 4,
  },
  miniBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  scoreContainer: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    position: 'relative',
  },
  circleRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: Theme.borderWidth,
    borderColor: Theme.borderColor,
    backgroundColor: Theme.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleScoreText: {
    fontSize: 18,
    fontWeight: '900',
    color: Theme.textPrimary,
  },
  circleScoreLabel: {
    fontSize: 6,
    fontWeight: '900',
    color: Theme.textSecondary,
    marginTop: 1,
  },
  heartFloat: {
    position: 'absolute',
    top: -6,
    right: 2,
    transform: [{ rotate: '15deg' }],
  },
  detailsCard: {
    backgroundColor: Theme.bgCard,
    borderWidth: Theme.borderWidth,
    borderColor: Theme.borderColor,
    borderRadius: 20,
    padding: 16,
  },
  detailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: 'rgba(61, 47, 61, 0.08)',
    marginBottom: 8,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.borderColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitleText: {
    fontSize: 13,
    fontWeight: '900',
    color: Theme.textPrimary,
    marginLeft: 8,
  },
  detailBodyText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.textSecondary,
    lineHeight: 18,
  },
  comparisonCard: {
    backgroundColor: Theme.bgCard,
    borderWidth: Theme.borderWidth,
    borderColor: Theme.borderColor,
    borderRadius: 20,
    padding: 14,
  },
  comparisonHeader: {
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderColor: 'rgba(61, 47, 61, 0.08)',
    marginBottom: 12,
  },
  comparisonTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Theme.textPrimary,
  },
  comparisonSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.textSecondary,
    marginTop: 2,
  },
  categoryBlock: {
    marginBottom: 16,
  },
  categoryHeaderRow: {
    backgroundColor: Theme.bgPrimary,
    borderWidth: 1.5,
    borderColor: Theme.borderColor,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryMatchPercentText: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colorPrimary,
  },
  categoryLabelText: {
    fontSize: 11,
    fontWeight: '900',
    color: Theme.textPrimary,
  },
  criteriaItem: {
    marginBottom: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(61, 47, 61, 0.05)',
    paddingBottom: 14,
  },
  criteriaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  score1Text: {
    fontSize: 12,
    fontWeight: '900',
    color: Theme.colorPrimary,
    flex: 1,
    textAlign: 'left',
  },
  criteriaName: {
    fontSize: 10,
    fontWeight: '900',
    color: Theme.textPrimary,
    textTransform: 'uppercase',
    textAlign: 'center',
    flex: 3,
  },
  score2Text: {
    fontSize: 12,
    fontWeight: '900',
    color: '#8b5cf6',
    flex: 1,
    textAlign: 'right',
  },
  barRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  leftBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Theme.bgPrimary,
    borderWidth: 1,
    borderColor: Theme.borderColor,
    borderRadius: 4,
    alignItems: 'flex-end',
  },
  leftBarFill: {
    height: '100%',
    backgroundColor: Theme.colorPrimary,
    borderRadius: 3,
  },
  rightBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Theme.bgPrimary,
    borderWidth: 1,
    borderColor: Theme.borderColor,
    borderRadius: 4,
  },
  rightBarFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 3,
  },
  descriptionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  descriptionCol: {
    flex: 1,
    backgroundColor: '#fffcfc',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(61, 47, 61, 0.05)',
  },
  miniLabel1: {
    fontSize: 7,
    fontWeight: '900',
    color: Theme.colorPrimary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  miniLabel2: {
    fontSize: 7,
    fontWeight: '900',
    color: '#8b5cf6',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  miniDescText: {
    fontSize: 9,
    fontWeight: '700',
    color: Theme.textSecondary,
    lineHeight: 13,
  },
  zodiacSelectorCard: {
    backgroundColor: Theme.bgCard,
    borderWidth: Theme.borderWidth,
    borderColor: Theme.borderColor,
    borderRadius: 20,
    padding: 12,
    marginBottom: 14,
  },
  horizontalSelectorTitle: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: Theme.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  horizontalScrollList: {
    paddingHorizontal: 4,
    gap: 10,
  },
  horizontalItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    width: 68,
  },
  horizontalItemActive: {
    borderColor: Theme.borderColor,
    backgroundColor: 'rgba(255, 101, 132, 0.08)',
  },
  horizontalAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.borderColor,
    backgroundColor: Theme.bgPrimary,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  horizontalAvatar: {
    width: '100%',
    height: '100%',
  },
  horizontalName: {
    fontSize: 9,
    fontWeight: '800',
    color: Theme.textSecondary,
    textAlign: 'center',
  },
  horizontalNameActive: {
    color: Theme.colorPrimary,
    fontWeight: '900',
  },
  detailsContainerCard: {
    backgroundColor: Theme.bgCard,
    borderWidth: Theme.borderWidth,
    borderColor: Theme.borderColor,
    borderRadius: 20,
    padding: 16,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderColor: 'rgba(61, 47, 61, 0.08)',
    paddingBottom: 14,
    marginBottom: 12,
  },
  detailsBigAvatarContainer: {
    width: 76,
    height: 76,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Theme.borderColor,
    backgroundColor: Theme.bgPrimary,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBigAvatar: {
    width: '100%',
    height: '100%',
  },
  detailsProfileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  detailsProfileName: {
    fontSize: 16,
    fontWeight: '900',
    color: Theme.textPrimary,
  },
  englishNameBadge: {
    backgroundColor: Theme.bgPrimary,
    borderWidth: 1,
    borderColor: 'rgba(61, 47, 61, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    marginLeft: 6,
  },
  englishNameText: {
    fontSize: 8,
    fontWeight: '800',
    color: Theme.textSecondary,
  },
  detailsDateText: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.textSecondary,
    marginTop: 2,
  },
  detailsDescText: {
    fontSize: 9,
    fontWeight: '700',
    color: Theme.textSecondary,
    marginTop: 4,
    lineHeight: 13,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  specBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Theme.bgPrimary,
    borderWidth: 1,
    borderColor: 'rgba(61, 47, 61, 0.08)',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
  },
  specVal: {
    fontSize: 10,
    fontWeight: '900',
    color: Theme.textPrimary,
    marginTop: 2,
  },
  topicTabsScroll: {
    borderBottomWidth: 1,
    borderColor: 'rgba(61, 47, 61, 0.08)',
    paddingBottom: 8,
    marginBottom: 12,
  },
  topicTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 6,
  },
  topicTabActive: {
    backgroundColor: Theme.colorPrimary,
    borderColor: Theme.borderColor,
  },
  topicTabText: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.textSecondary,
  },
  topicTabTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  topicContentBox: {
    backgroundColor: Theme.bgPrimary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(61, 47, 61, 0.08)',
    padding: 12,
  },
  topicTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: Theme.textPrimary,
    marginBottom: 6,
  },
  topicBody: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.textSecondary,
    lineHeight: 17,
  },
  noDetailsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  noDetailsText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.textSecondary,
  },
  noSelectedBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.bgCard,
    borderWidth: Theme.borderWidth,
    borderColor: Theme.borderColor,
    borderRadius: 20,
    padding: 30,
  },
  noSelectedText: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(61, 47, 61, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Theme.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: Theme.borderWidth,
    borderLeftWidth: Theme.borderWidth,
    borderRightWidth: Theme.borderWidth,
    borderColor: Theme.borderColor,
    maxHeight: '70%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderColor: 'rgba(61, 47, 61, 0.08)',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Theme.textPrimary,
    flex: 1,
  },
  modalCloseButton: {
    backgroundColor: Theme.bgPrimary,
    borderWidth: 1,
    borderColor: Theme.borderColor,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modalCloseText: {
    fontSize: 11,
    fontWeight: '900',
    color: Theme.textPrimary,
  },
  modalGridList: {
    paddingBottom: 20,
  },
  modalGridItem: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    paddingVertical: 12,
    backgroundColor: Theme.bgPrimary,
    borderWidth: 1,
    borderColor: Theme.borderColor,
    borderRadius: 12,
  },
  modalAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.borderColor,
    backgroundColor: Theme.bgCard,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modalAvatar: {
    width: '100%',
    height: '100%',
  },
  modalItemName: {
    fontSize: 11,
    fontWeight: '900',
    color: Theme.textPrimary,
  },
  modalItemDate: {
    fontSize: 8,
    fontWeight: '700',
    color: Theme.textSecondary,
    marginTop: 1,
  },
});
