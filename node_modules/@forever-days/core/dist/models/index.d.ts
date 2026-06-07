export interface UserProfile {
    id: string;
    nickname: string;
    avatarUrl: string;
    dob?: string;
    gender?: string;
    createdAt?: string;
    updatedAt?: string;
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
    anniversaryDate?: string;
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
    targetDate: string;
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
    scheduledTime: string;
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
    eventDate: string;
    createdAt?: string;
}
export interface DiaryMedia {
    id: string;
    diaryId: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    createdAt?: string;
}
export declare function mapProfileFromDb(row: any): UserProfile;
export declare function mapProfileToDb(profile: Partial<UserProfile>): any;
export declare function mapCoupleFromDb(row: any): Couple;
export declare function mapCoupleToDb(couple: Partial<Couple>): any;
export declare function mapUserStatusFromDb(row: any): UserStatus;
export declare function mapUserStatusToDb(status: Partial<UserStatus>): any;
export declare function mapUserSizeFromDb(row: any): UserSize;
export declare function mapUserSizeToDb(size: Partial<UserSize>): any;
export declare function mapBobaPreferenceFromDb(row: any): UserBobaPreference;
export declare function mapBobaPreferenceToDb(boba: Partial<UserBobaPreference>): any;
export declare function mapFavoriteFromDb(row: any): UserFavorite;
export declare function mapFavoriteToDb(fav: Partial<UserFavorite>): any;
export declare function mapHobbyFromDb(row: any): UserHobby;
export declare function mapHobbyToDb(hobby: Partial<UserHobby>): any;
export declare function mapMilestoneFromDb(row: any): Milestone;
export declare function mapMilestoneToDb(milestone: Partial<Milestone>): any;
export declare function mapReminderFromDb(row: any): Reminder;
export declare function mapReminderToDb(reminder: Partial<Reminder>): any;
export declare function mapReminderLogFromDb(row: any): ReminderLog;
export declare function mapLoveDiaryFromDb(row: any): LoveDiary;
export declare function mapLoveDiaryToDb(diary: Partial<LoveDiary>): any;
export declare function mapDiaryMediaFromDb(row: any): DiaryMedia;
export declare function mapDiaryMediaToDb(media: Partial<DiaryMedia>): any;
export declare function mapWidgetSettingFromDb(row: any): WidgetSetting;
export declare function mapWidgetSettingToDb(setting: Partial<WidgetSetting>): any;
