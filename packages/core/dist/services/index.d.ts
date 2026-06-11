import { ZodiacSign, ZodiacCriteria, ZodiacDetail, ZodiacMatch, ZodiacAttribute } from './zodiacMockData';
import { UserProfile, Couple, UserStatus, UserSize, UserBobaPreference, UserFavorite, UserHobby, Milestone, Reminder, ReminderLog, LoveDiary, DiaryMedia, WidgetSetting, PairingCode, PartnerProfileNote, CoupleEvent, UserMoodLog, CoupleCountdownCustomization, MilestonePlan, DailyWish } from '../models';
export declare class CoupleService {
    fetchActiveCouple(userId: string): Promise<Couple | null>;
    updateAnniversaryDate(coupleId: string, date: string): Promise<void>;
    insertCouple(user1Id: string, user2Id: string, date: string): Promise<void>;
    updateVotedBreakup(coupleId: string, userKey: 'user_1_voted_breakup' | 'user_2_voted_breakup', vote: boolean): Promise<void>;
}
export declare class ProfileService {
    fetchProfile(id: string): Promise<UserProfile | null>;
    fetchPartnerProfile(partnerId: string): Promise<UserProfile | null>;
    updateProfile(profile: UserProfile): Promise<void>;
    createProfile(id: string, nickname: string): Promise<void>;
}
export declare class PairingCodeService {
    fetchValidCode(code: string): Promise<PairingCode | null>;
    createPairingCode(creatorId: string, code: string, expiresAt: string): Promise<void>;
    markCodeAsUsed(id: string): Promise<void>;
}
export declare class UserBobaPreferenceService {
    fetchBobaPreferences(userId: string): Promise<UserBobaPreference | null>;
    updateBobaPreferences(userId: string, sugar: string, ice: string, toppings: string, note?: string): Promise<void>;
}
export declare class UserFavoriteService {
    fetchFavorites(userId: string): Promise<UserFavorite[]>;
    addFavorite(itemName: string, category: string, isDislike: boolean, userId: string): Promise<void>;
    deleteFavorite(favId: string): Promise<void>;
}
export declare class UserHobbyService {
    fetchHobbies(userId: string): Promise<UserHobby[]>;
    addHobby(hobbyName: string, description: string, userId: string): Promise<void>;
    deleteHobby(hobbyId: string): Promise<void>;
}
export declare class UserSizeService {
    fetchSizes(userId: string): Promise<UserSize | null>;
    updateSizes(userId: string, shirtSize: string, pantsSize: string, shoeSize: number, ringSize: number): Promise<void>;
}
export declare class UserStatusService {
    fetchStatus(userId: string): Promise<UserStatus | null>;
    updateStatus(userId: string, emoji: string, statusText: string): Promise<void>;
}
export declare class WidgetSettingService {
    fetchSettings(userId: string): Promise<WidgetSetting | null>;
    updateSettings(userId: string, themeColor: string, textSize: number, isShowHeartIcon: boolean, backgroundImgUrl?: string): Promise<void>;
}
export declare class MilestoneService {
    fetchMilestones(coupleId: string): Promise<Milestone[]>;
    createMilestone(coupleId: string, title: string, targetDate: string, type: 'system' | 'custom', description?: string): Promise<void>;
    deleteMilestone(milestoneId: string): Promise<void>;
}
export declare class ReminderService {
    fetchReminders(coupleId: string): Promise<Reminder[]>;
    createReminder(reminder: Omit<Reminder, 'id'>): Promise<void>;
    updateReminder(reminder: Reminder): Promise<void>;
    deleteReminder(reminderId: string): Promise<void>;
}
export declare class ReminderLogService {
    fetchLogs(reminderId: string): Promise<ReminderLog[]>;
    insertLog(reminderId: string, status: 'sent' | 'failed', errorMessage?: string): Promise<void>;
}
export declare class LoveDiaryService {
    fetchDiaries(coupleId: string): Promise<LoveDiary[]>;
    createDiary(diary: Omit<LoveDiary, 'id'>): Promise<LoveDiary | null>;
    deleteDiary(diaryId: string): Promise<void>;
}
export declare class DiaryMediaService {
    fetchMedia(diaryId: string): Promise<DiaryMedia[]>;
    insertMedia(mediaUrl: string, diaryId: string, mediaType?: 'image' | 'video'): Promise<void>;
}
export declare class PartnerProfileNoteService {
    fetchNote(writerId: string, targetId: string): Promise<PartnerProfileNote | null>;
    fetchReceivedNotes(targetId: string): Promise<PartnerProfileNote[]>;
    upsertNote(note: Omit<PartnerProfileNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<void>;
    deleteNote(id: string): Promise<void>;
}
export declare class CoupleEventService {
    fetchEvents(coupleId: string): Promise<CoupleEvent[]>;
    createEvent(event: Omit<CoupleEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<void>;
    updateEvent(event: CoupleEvent): Promise<void>;
    deleteEvent(eventId: string): Promise<void>;
}
export declare class UserMoodLogService {
    fetchMyMoodLogs(userId: string): Promise<UserMoodLog[]>;
    fetchPartnerMoodLogs(partnerId: string): Promise<UserMoodLog[]>;
    createMoodLog(log: Omit<UserMoodLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<void>;
    deleteMoodLog(logId: string): Promise<void>;
}
export declare class CoupleCountdownCustomizationService {
    fetchCustomization(coupleId: string): Promise<CoupleCountdownCustomization | null>;
    upsertCustomization(customization: Omit<CoupleCountdownCustomization, 'id' | 'createdAt' | 'updatedAt'>): Promise<void>;
}
export declare class UserPushTokenService {
    updatePushToken(userId: string, token: string): Promise<void>;
    fetchPushToken(userId: string): Promise<string | null>;
}
export declare class MilestonePlanService {
    fetchPlans(coupleId: string): Promise<MilestonePlan[]>;
    createPlan(coupleId: string, milestoneTitle: string, category: 'go' | 'eat' | 'play', content: string, milestoneId?: string): Promise<MilestonePlan | null>;
    deletePlan(planId: string): Promise<void>;
}
export declare class DailyWishService {
    fetchAllWishes(): Promise<DailyWish[]>;
}
export declare class ZodiacService {
    fetchZodiacSigns(): Promise<ZodiacSign[]>;
    fetchZodiacDetails(zodiacId: number): Promise<ZodiacDetail[]>;
    fetchZodiacMatch(id1: number, id2: number): Promise<ZodiacMatch | null>;
    fetchZodiacCriteria(): Promise<ZodiacCriteria[]>;
    fetchZodiacAttributes(id1: number, id2: number): Promise<ZodiacAttribute[]>;
}
export declare function getZodiacSignIdFromDob(dobString?: string): number;
export { ZodiacSign, ZodiacCriteria, ZodiacDetail, ZodiacMatch, ZodiacAttribute };
export * from './travelService';
