// ==========================================
// FOREVERDAYS - TYPESCRIPT MODELS & INTERFACES
// ==========================================

export interface UserProfile {
  id: string;
  nickname: string;
  avatarUrl: string;
  dob?: string; // YYYY-MM-DD
  gender?: string; // Nam / Nữ
  createdAt?: string;
  updatedAt?: string;
}

export interface ZodiacMatchResult {
  matchPercentage: number;
  details: string;
}

export interface TravelLocation {
  id: number;
  name: string;
  type: 'province' | 'country';
  country: string;
  image_url: string;
  created_at?: string;
}

export interface TravelTrip {
  id?: string;
  couple_id: string;
  location_id: number;
  title: string;
  start_date: string;
  end_date: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  
  // Joined relation for UI convenience
  location?: TravelLocation;
}

export interface UserStatus {
  id: string;
  userId: string;
  emoji: string;
  statusText: string;
  updatedAt: string;
}

export interface Couple {
  id: string;
  user1Id?: string;
  user2Id?: string;
  anniversaryDate?: string; // YYYY-MM-DD
  status: 'active' | 'paused' | 'broken';
  heartEffectStyle: string;
  user1VotedBreakup: boolean;
  user2VotedBreakup: boolean;
  createdAt?: string;
}

export interface PairingCode {
  id: string;
  creatorId: string;
  code: string;
  isUsed: boolean;
  expiresAt: string;
  createdAt?: string;
}

export interface UserSize {
  id: string;
  userId: string;
  shirtSize?: string;
  pantsSize?: string;
  shoeSize?: number;
  ringSize?: number;
  updatedAt?: string;
}

export interface UserBobaPreference {
  id: string;
  userId: string;
  favoriteTopping: string[];
  sugarLevel: string;
  iceLevel: string;
  note?: string;
}

export interface UserFavorite {
  id: string;
  userId: string;
  category: string;
  itemName: string;
  isDislike: boolean;
  createdAt?: string;
}

export interface UserHobby {
  id: string;
  userId: string;
  hobbyName: string;
  description?: string;
  createdAt?: string;
}

export interface Milestone {
  id: string;
  coupleId: string;
  title: string;
  targetDate: string; // YYYY-MM-DD
  type: 'system' | 'custom';
  description?: string;
  createdAt?: string;
}

export interface GoogleCalendarIntegration {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  googleCalendarId?: string;
  isSyncEnabled: boolean;
  updatedAt?: string;
}

export interface Reminder {
  id: string;
  coupleId: string;
  creatorId?: string;
  targetUserId?: string;
  category: 'dating' | 'morning_wish' | 'water' | 'custom';
  title: string;
  message: string;
  scheduledTime: string; // HH:mm:ss
  repeatInterval: 'once' | 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  createdAt?: string;
}

export interface ReminderLog {
  id: string;
  reminderId: string;
  triggeredAt: string;
  status: 'sent' | 'failed';
  errorMessage?: string;
}

export interface WidgetSetting {
  id: string;
  userId: string;
  themeColor: string;
  backgroundImgUrl?: string;
  isShowHeartIcon: boolean;
  textSize: number;
  updatedAt?: string;
}

export interface LoveDiary {
  id: string;
  coupleId: string;
  writerId?: string;
  title: string;
  content: string;
  mood?: string;
  eventDate: string; // YYYY-MM-DD
  createdAt?: string;
}

export interface DiaryMedia {
  id: string;
  diaryId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt?: string;
}

export interface PartnerProfileNote {
  id: string;
  coupleId: string;
  writerId: string;
  targetId: string;
  height?: string;
  weight?: string;
  hobbies?: string;
  personality?: string;
  isShared: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CoupleEvent {
  id: string;
  coupleId: string;
  createdBy?: string;
  title: string;
  eventDate: string; // YYYY-MM-DD
  eventTime?: string; // HH:mm:ss
  location?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserMoodLog {
  id: string;
  userId: string;
  coupleId: string;
  moodType: string;
  note?: string;
  isShared: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CoupleCountdownCustomization {
  id: string;
  coupleId: string;
  customAvatar1Url?: string | null;
  customAvatar2Url?: string | null;
  backgroundUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// -------------------------------------------------------------
// Database Mapping Utilities (Snake Case to Camel Case & vice-versa)
// -------------------------------------------------------------

export function mapProfileFromDb(row: any): UserProfile {
  return {
    id: row.id,
    nickname: row.nickname || 'Thành viên mới',
    avatarUrl: row.avatar_url || '',
    dob: row.dob,
    gender: row.gender,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapProfileToDb(profile: Partial<UserProfile>): any {
  return {
    id: profile.id,
    nickname: profile.nickname,
    avatar_url: profile.avatarUrl,
    dob: profile.dob,
    gender: profile.gender,
  };
}

export function mapCoupleFromDb(row: any): Couple {
  return {
    id: row.id,
    user1Id: row.user_1_id,
    user2Id: row.user_2_id,
    anniversaryDate: row.anniversary_date,
    status: row.status || 'active',
    heartEffectStyle: row.heart_effect_style || 'default_sparkle',
    user1VotedBreakup: row.user_1_voted_breakup || false,
    user2VotedBreakup: row.user_2_voted_breakup || false,
    createdAt: row.created_at,
  };
}

export function mapCoupleToDb(couple: Partial<Couple>): any {
  return {
    id: couple.id,
    user_1_id: couple.user1Id,
    user_2_id: couple.user2Id,
    anniversary_date: couple.anniversaryDate,
    status: couple.status,
    heart_effect_style: couple.heartEffectStyle,
    user_1_voted_breakup: couple.user1VotedBreakup,
    user_2_voted_breakup: couple.user2VotedBreakup,
  };
}

export function mapUserStatusFromDb(row: any): UserStatus {
  return {
    id: row.id,
    userId: row.user_id,
    emoji: row.emoji || '😊',
    statusText: row.status_text || 'Đang ổn định',
    updatedAt: row.updated_at,
  };
}

export function mapUserStatusToDb(status: Partial<UserStatus>): any {
  return {
    id: status.id,
    user_id: status.userId,
    emoji: status.emoji,
    status_text: status.statusText,
  };
}

export function mapUserSizeFromDb(row: any): UserSize {
  return {
    id: row.id,
    userId: row.user_id,
    shirtSize: row.shirt_size,
    pantsSize: row.pants_size,
    shoeSize: row.shoe_size,
    ringSize: row.ring_size,
    updatedAt: row.updated_at,
  };
}

export function mapUserSizeToDb(size: Partial<UserSize>): any {
  return {
    id: size.id,
    user_id: size.userId,
    shirt_size: size.shirtSize,
    pants_size: size.pantsSize,
    shoe_size: size.shoeSize,
    ring_size: size.ringSize,
  };
}

export function mapBobaPreferenceFromDb(row: any): UserBobaPreference {
  return {
    id: row.id,
    userId: row.user_id,
    favoriteTopping: row.favorite_topping || [],
    sugarLevel: row.sugar_level || '70%',
    iceLevel: row.ice_level || 'Normal',
    note: row.note,
  };
}

export function mapBobaPreferenceToDb(boba: Partial<UserBobaPreference>): any {
  return {
    id: boba.id,
    user_id: boba.userId,
    favorite_topping: boba.favoriteTopping,
    sugar_level: boba.sugarLevel,
    ice_level: boba.iceLevel,
    note: boba.note,
  };
}

export function mapFavoriteFromDb(row: any): UserFavorite {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    itemName: row.item_name,
    isDislike: row.is_dislike || false,
    createdAt: row.created_at,
  };
}

export function mapFavoriteToDb(fav: Partial<UserFavorite>): any {
  return {
    id: fav.id,
    user_id: fav.userId,
    category: fav.category,
    item_name: fav.itemName,
    is_dislike: fav.isDislike,
  };
}

export function mapHobbyFromDb(row: any): UserHobby {
  return {
    id: row.id,
    userId: row.user_id,
    hobbyName: row.hobby_name,
    description: row.description,
    createdAt: row.created_at,
  };
}

export function mapHobbyToDb(hobby: Partial<UserHobby>): any {
  return {
    id: hobby.id,
    user_id: hobby.userId,
    hobby_name: hobby.hobbyName,
    description: hobby.description,
  };
}

export function mapMilestoneFromDb(row: any): Milestone {
  return {
    id: row.id,
    coupleId: row.couple_id,
    title: row.title,
    targetDate: row.target_date,
    type: row.type || 'custom',
    description: row.description,
    createdAt: row.created_at,
  };
}

export function mapMilestoneToDb(milestone: Partial<Milestone>): any {
  return {
    id: milestone.id,
    couple_id: milestone.coupleId,
    title: milestone.title,
    target_date: milestone.targetDate,
    type: milestone.type,
    description: milestone.description,
  };
}

export function mapReminderFromDb(row: any): Reminder {
  return {
    id: row.id,
    coupleId: row.couple_id,
    creatorId: row.creator_id,
    targetUserId: row.target_user_id,
    category: row.category || 'custom',
    title: row.title,
    message: row.message,
    scheduledTime: row.scheduled_time,
    repeatInterval: row.repeat_interval || 'daily',
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
  };
}

export function mapReminderToDb(reminder: Partial<Reminder>): any {
  return {
    id: reminder.id,
    couple_id: reminder.coupleId,
    creator_id: reminder.creatorId,
    target_user_id: reminder.targetUserId,
    category: reminder.category,
    title: reminder.title,
    message: reminder.message,
    scheduled_time: reminder.scheduledTime,
    repeat_interval: reminder.repeatInterval,
    is_active: reminder.isActive,
  };
}

export function mapReminderLogFromDb(row: any): ReminderLog {
  return {
    id: row.id,
    reminderId: row.reminder_id,
    triggeredAt: row.triggered_at,
    status: row.status || 'sent',
    errorMessage: row.error_message,
  };
}

export function mapLoveDiaryFromDb(row: any): LoveDiary {
  return {
    id: row.id,
    coupleId: row.couple_id,
    writerId: row.writer_id,
    title: row.title,
    content: row.content,
    mood: row.mood,
    eventDate: row.event_date,
    createdAt: row.created_at,
  };
}

export function mapLoveDiaryToDb(diary: Partial<LoveDiary>): any {
  return {
    id: diary.id,
    couple_id: diary.coupleId,
    writer_id: diary.writerId,
    title: diary.title,
    content: diary.content,
    mood: diary.mood,
    event_date: diary.eventDate,
  };
}

export function mapDiaryMediaFromDb(row: any): DiaryMedia {
  return {
    id: row.id,
    diaryId: row.diary_id,
    mediaUrl: row.media_url,
    mediaType: row.media_type || 'image',
    createdAt: row.created_at,
  };
}

export function mapDiaryMediaToDb(media: Partial<DiaryMedia>): any {
  return {
    id: media.id,
    diary_id: media.diaryId,
    media_url: media.mediaUrl,
    media_type: media.mediaType,
  };
}

export function mapWidgetSettingFromDb(row: any): WidgetSetting {
  return {
    id: row.id,
    userId: row.user_id,
    themeColor: row.theme_color || '#FF69B4',
    backgroundImgUrl: row.background_img_url,
    isShowHeartIcon: row.is_show_heart_icon ?? true,
    textSize: row.text_size || 14,
    updatedAt: row.updated_at,
  };
}

export function mapWidgetSettingToDb(setting: Partial<WidgetSetting>): any {
  return {
    id: setting.id,
    user_id: setting.userId,
    theme_color: setting.themeColor,
    background_img_url: setting.backgroundImgUrl,
    is_show_heart_icon: setting.isShowHeartIcon,
    text_size: setting.textSize,
  };
}

export function mapPartnerProfileNoteFromDb(row: any): PartnerProfileNote {
  return {
    id: row.id,
    coupleId: row.couple_id,
    writerId: row.writer_id,
    targetId: row.target_id,
    height: row.height,
    weight: row.weight,
    hobbies: row.hobbies,
    personality: row.personality,
    isShared: row.is_shared ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPartnerProfileNoteToDb(note: Partial<PartnerProfileNote>): any {
  return {
    id: note.id,
    couple_id: note.coupleId,
    writer_id: note.writerId,
    target_id: note.targetId,
    height: note.height,
    weight: note.weight,
    hobbies: note.hobbies,
    personality: note.personality,
    is_shared: note.isShared,
  };
}

export function mapCoupleEventFromDb(row: any): CoupleEvent {
  return {
    id: row.id,
    coupleId: row.couple_id,
    createdBy: row.created_by,
    title: row.title,
    eventDate: row.event_date,
    eventTime: row.event_time,
    location: row.location,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCoupleEventToDb(event: Partial<CoupleEvent>): any {
  return {
    id: event.id,
    couple_id: event.coupleId,
    created_by: event.createdBy,
    title: event.title,
    event_date: event.eventDate,
    event_time: event.eventTime,
    location: event.location,
    description: event.description,
  };
}

export function mapUserMoodLogFromDb(row: any): UserMoodLog {
  return {
    id: row.id,
    userId: row.user_id,
    coupleId: row.couple_id,
    moodType: row.mood_type,
    note: row.note,
    isShared: row.is_shared ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapUserMoodLogToDb(log: Partial<UserMoodLog>): any {
  return {
    id: log.id,
    user_id: log.userId,
    couple_id: log.coupleId,
    mood_type: log.moodType,
    note: log.note,
    is_shared: log.isShared,
  };
}

export function mapCoupleCountdownCustomizationFromDb(row: any): CoupleCountdownCustomization {
  return {
    id: row.id,
    coupleId: row.couple_id,
    customAvatar1Url: row.custom_avatar_1_url,
    customAvatar2Url: row.custom_avatar_2_url,
    backgroundUrl: row.background_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCoupleCountdownCustomizationToDb(customization: Partial<CoupleCountdownCustomization>): any {
  return {
    id: customization.id,
    couple_id: customization.coupleId,
    custom_avatar_1_url: customization.customAvatar1Url === undefined ? null : customization.customAvatar1Url,
    custom_avatar_2_url: customization.customAvatar2Url === undefined ? null : customization.customAvatar2Url,
    background_url: customization.backgroundUrl === undefined ? null : customization.backgroundUrl,
  };
}

export interface MilestonePlan {
  id?: string;
  coupleId: string;
  milestoneId?: string;
  milestoneTitle: string;
  category: 'go' | 'eat' | 'play';
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export function mapMilestonePlanFromDb(row: any): MilestonePlan {
  return {
    id: row.id,
    coupleId: row.couple_id,
    milestoneId: row.milestone_id,
    milestoneTitle: row.milestone_title,
    category: row.category,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMilestonePlanToDb(plan: Partial<MilestonePlan>): any {
  return {
    id: plan.id,
    couple_id: plan.coupleId,
    milestone_id: plan.milestoneId,
    milestone_title: plan.milestoneTitle,
    category: plan.category,
    content: plan.content,
  };
}

export interface DailyWish {
  id?: string;
  content: string;
  type: 'daily' | 'special';
  specialMonth?: number;
  specialDay?: number;
  specialEvent?: string;
  createdAt?: string;
}

export function mapDailyWishFromDb(row: any): DailyWish {
  return {
    id: row.id,
    content: row.content,
    type: row.type || 'daily',
    specialMonth: row.special_month,
    specialDay: row.special_day,
    specialEvent: row.special_event,
    createdAt: row.created_at,
  };
}

export function mapDailyWishToDb(wish: Partial<DailyWish>): any {
  return {
    id: wish.id,
    content: wish.content,
    type: wish.type,
    special_month: wish.specialMonth,
    special_day: wish.specialDay,
    special_event: wish.specialEvent,
  };
}


