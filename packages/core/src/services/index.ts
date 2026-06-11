import { supabase, cosmosSupabase } from '../supabaseClient';
import {
  MOCK_ZODIAC_SIGNS,
  MOCK_ZODIAC_CRITERIA,
  MOCK_ZODIAC_DETAILS,
  MOCK_ZODIAC_MATCHES,
  MOCK_ZODIAC_ATTRIBUTES,
  ZodiacSign,
  ZodiacCriteria,
  ZodiacDetail,
  ZodiacMatch,
  ZodiacAttribute
} from './zodiacMockData';
import { DatabaseConstants } from '../constants/databaseConstants';
import {
  UserProfile, mapProfileFromDb, mapProfileToDb,
  Couple, mapCoupleFromDb, mapCoupleToDb,
  UserStatus, mapUserStatusFromDb, mapUserStatusToDb,
  UserSize, mapUserSizeFromDb, mapUserSizeToDb,
  UserBobaPreference, mapBobaPreferenceFromDb, mapBobaPreferenceToDb,
  UserFavorite, mapFavoriteFromDb, mapFavoriteToDb,
  UserHobby, mapHobbyFromDb, mapHobbyToDb,
  Milestone, mapMilestoneFromDb, mapMilestoneToDb,
  Reminder, mapReminderFromDb, mapReminderToDb,
  ReminderLog, mapReminderLogFromDb,
  LoveDiary, mapLoveDiaryFromDb, mapLoveDiaryToDb,
  DiaryMedia, mapDiaryMediaFromDb, mapDiaryMediaToDb,
  WidgetSetting, mapWidgetSettingFromDb, mapWidgetSettingToDb,
  PairingCode,
  PartnerProfileNote, mapPartnerProfileNoteFromDb, mapPartnerProfileNoteToDb,
  CoupleEvent, mapCoupleEventFromDb, mapCoupleEventToDb,
  UserMoodLog, mapUserMoodLogFromDb, mapUserMoodLogToDb,
  CoupleCountdownCustomization, mapCoupleCountdownCustomizationFromDb, mapCoupleCountdownCustomizationToDb,
  MilestonePlan, mapMilestonePlanFromDb, mapMilestonePlanToDb,
  DailyWish, mapDailyWishFromDb, mapDailyWishToDb
} from '../models';

export class CoupleService {
  async fetchActiveCouple(userId: string): Promise<Couple | null> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.couples)
        .select()
        .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
        .neq('status', 'broken')
        .maybeSingle();

      if (error || !data) return null;
      return mapCoupleFromDb(data);
    } catch {
      return null;
    }
  }

  async updateAnniversaryDate(coupleId: string, date: string): Promise<void> {
    await supabase
      .from(DatabaseConstants.couples)
      .update({ anniversary_date: date })
      .eq('id', coupleId);
  }

  async insertCouple(user1Id: string, user2Id: string, date: string): Promise<void> {
    await supabase
      .from(DatabaseConstants.couples)
      .insert({
        user_1_id: user1Id,
        user_2_id: user2Id,
        anniversary_date: date,
        status: 'active',
      });
  }

  async updateVotedBreakup(coupleId: string, userKey: 'user_1_voted_breakup' | 'user_2_voted_breakup', vote: boolean): Promise<void> {
    await supabase
      .from(DatabaseConstants.couples)
      .update({ [userKey]: vote })
      .eq('id', coupleId);
  }
}

export class ProfileService {
  async fetchProfile(id: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.profiles)
        .select()
        .eq('id', id)
        .maybeSingle();

      if (error || !data) return null;
      return mapProfileFromDb(data);
    } catch {
      return null;
    }
  }

  // Dùng SECURITY DEFINER function để fetch profile của partner (bypass RLS an toàn)
  async fetchPartnerProfile(partnerId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_partner_profile', { target_user_id: partnerId });

      if (error || !data || data.length === 0) return null;
      return mapProfileFromDb(data[0]);
    } catch {
      return null;
    }
  }

  async updateProfile(profile: UserProfile): Promise<void> {
    const dbData = mapProfileToDb(profile);
    await supabase
      .from(DatabaseConstants.profiles)
      .update(dbData)
      .eq('id', profile.id);
  }

  async createProfile(id: string, nickname: string): Promise<void> {
    await supabase
      .from(DatabaseConstants.profiles)
      .upsert({
        id,
        nickname,
        dob: new Date().toISOString().split('T')[0],
        gender: 'Chưa chọn',
      });
  }
}

export class PairingCodeService {
  async fetchValidCode(code: string): Promise<PairingCode | null> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.pairingCodes)
        .select()
        .eq('code', code.toUpperCase())
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !data) return null;
      return {
        id: data.id,
        creatorId: data.creator_id,
        code: data.code,
        isUsed: data.is_used,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
      };
    } catch {
      return null;
    }
  }

  async createPairingCode(creatorId: string, code: string, expiresAt: string): Promise<void> {
    await supabase
      .from(DatabaseConstants.pairingCodes)
      .insert({
        creator_id: creatorId,
        code,
        is_used: false,
        expires_at: expiresAt,
      });
  }

  async markCodeAsUsed(id: string): Promise<void> {
    await supabase
      .from(DatabaseConstants.pairingCodes)
      .update({ is_used: true })
      .eq('id', id);
  }
}

export class UserBobaPreferenceService {
  async fetchBobaPreferences(userId: string): Promise<UserBobaPreference | null> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.userBobaPreferences)
        .select()
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) return null;
      return mapBobaPreferenceFromDb(data);
    } catch {
      return null;
    }
  }

  async updateBobaPreferences(userId: string, sugar: string, ice: string, toppings: string, note: string = ''): Promise<void> {
    const toppingsList = toppings
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    await supabase
      .from(DatabaseConstants.userBobaPreferences)
      .upsert({
        user_id: userId,
        sugar_level: sugar,
        ice_level: ice,
        favorite_topping: toppingsList,
        note
      }, { onConflict: 'user_id' });
  }
}

export class UserFavoriteService {
  async fetchFavorites(userId: string): Promise<UserFavorite[]> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.userFavorites)
        .select()
        .eq('user_id', userId);

      if (error || !data) return [];
      return data.map(mapFavoriteFromDb);
    } catch {
      return [];
    }
  }

  async addFavorite(itemName: string, category: string, isDislike: boolean, userId: string): Promise<void> {
    await supabase
      .from(DatabaseConstants.userFavorites)
      .insert({
        user_id: userId,
        item_name: itemName,
        category,
        is_dislike: isDislike,
      });
  }

  async deleteFavorite(favId: string): Promise<void> {
    await supabase
      .from(DatabaseConstants.userFavorites)
      .delete()
      .eq('id', favId);
  }
}

export class UserHobbyService {
  async fetchHobbies(userId: string): Promise<UserHobby[]> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.userHobbies)
        .select()
        .eq('user_id', userId);

      if (error || !data) return [];
      return data.map(mapHobbyFromDb);
    } catch {
      return [];
    }
  }

  async addHobby(hobbyName: string, description: string, userId: string): Promise<void> {
    await supabase
      .from(DatabaseConstants.userHobbies)
      .insert({
        user_id: userId,
        hobby_name: hobbyName,
        description,
      });
  }

  async deleteHobby(hobbyId: string): Promise<void> {
    await supabase
      .from(DatabaseConstants.userHobbies)
      .delete()
      .eq('id', hobbyId);
  }
}

export class UserSizeService {
  async fetchSizes(userId: string): Promise<UserSize | null> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.userSizes)
        .select()
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) return null;
      return mapUserSizeFromDb(data);
    } catch {
      return null;
    }
  }

  async updateSizes(userId: string, shirtSize: string, pantsSize: string, shoeSize: number, ringSize: number): Promise<void> {
    await supabase
      .from(DatabaseConstants.userSizes)
      .upsert({
        user_id: userId,
        shirt_size: shirtSize,
        pants_size: pantsSize,
        shoe_size: shoeSize,
        ring_size: ringSize,
      }, { onConflict: 'user_id' });
  }
}

export class UserStatusService {
  async fetchStatus(userId: string): Promise<UserStatus | null> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.userStatuses)
        .select()
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) return null;
      return mapUserStatusFromDb(data);
    } catch {
      return null;
    }
  }

  async updateStatus(userId: string, emoji: string, statusText: string): Promise<void> {
    await supabase
      .from(DatabaseConstants.userStatuses)
      .upsert({
        user_id: userId,
        emoji,
        status_text: statusText,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
  }
}

export class WidgetSettingService {
  async fetchSettings(userId: string): Promise<WidgetSetting | null> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.widgetSettings)
        .select()
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) return null;
      return mapWidgetSettingFromDb(data);
    } catch {
      return null;
    }
  }

  async updateSettings(userId: string, themeColor: string, textSize: number, isShowHeartIcon: boolean, backgroundImgUrl?: string): Promise<void> {
    await supabase
      .from(DatabaseConstants.widgetSettings)
      .upsert({
        user_id: userId,
        theme_color: themeColor,
        text_size: textSize,
        is_show_heart_icon: isShowHeartIcon,
        background_img_url: backgroundImgUrl,
      }, { onConflict: 'user_id' });
  }
}

export class MilestoneService {
  async fetchMilestones(coupleId: string): Promise<Milestone[]> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.milestones)
        .select()
        .eq('couple_id', coupleId)
        .order('target_date', { ascending: true });

      if (error || !data) return [];
      return data.map(mapMilestoneFromDb);
    } catch {
      return [];
    }
  }

  async createMilestone(coupleId: string, title: string, targetDate: string, type: 'system' | 'custom', description: string = ''): Promise<void> {
    await supabase
      .from(DatabaseConstants.milestones)
      .insert({
        couple_id: coupleId,
        title,
        target_date: targetDate,
        type,
        description,
      });
  }

  async deleteMilestone(milestoneId: string): Promise<void> {
    await supabase
      .from(DatabaseConstants.milestones)
      .delete()
      .eq('id', milestoneId);
  }
}

export class ReminderService {
  async fetchReminders(coupleId: string): Promise<Reminder[]> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.reminders)
        .select()
        .eq('couple_id', coupleId);

      if (error || !data) return [];
      return data.map(mapReminderFromDb);
    } catch {
      return [];
    }
  }

  async createReminder(reminder: Omit<Reminder, 'id'>): Promise<void> {
    const dbData = mapReminderToDb(reminder as any);
    delete dbData.id;
    await supabase
      .from(DatabaseConstants.reminders)
      .insert(dbData);
  }

  async updateReminder(reminder: Reminder): Promise<void> {
    const dbData = mapReminderToDb(reminder);
    await supabase
      .from(DatabaseConstants.reminders)
      .update(dbData)
      .eq('id', reminder.id);
  }

  async deleteReminder(reminderId: string): Promise<void> {
    await supabase
      .from(DatabaseConstants.reminders)
      .delete()
      .eq('id', reminderId);
  }
}

export class ReminderLogService {
  async fetchLogs(reminderId: string): Promise<ReminderLog[]> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.reminderLogs)
        .select()
        .eq('reminder_id', reminderId)
        .order('triggered_at', { ascending: false });

      if (error || !data) return [];
      return data.map(mapReminderLogFromDb);
    } catch {
      return [];
    }
  }

  async insertLog(reminderId: string, status: 'sent' | 'failed', errorMessage?: string): Promise<void> {
    await supabase
      .from(DatabaseConstants.reminderLogs)
      .insert({
        reminder_id: reminderId,
        status,
        error_message: errorMessage,
      });
  }
}

export class LoveDiaryService {
  async fetchDiaries(coupleId: string): Promise<LoveDiary[]> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.loveDiaries)
        .select()
        .eq('couple_id', coupleId)
        .order('event_date', { ascending: false });

      if (error || !data) return [];
      return data.map(mapLoveDiaryFromDb);
    } catch {
      return [];
    }
  }

  async createDiary(diary: Omit<LoveDiary, 'id'>): Promise<LoveDiary | null> {
    const dbData = mapLoveDiaryToDb(diary as any);
    delete dbData.id;
    const { data, error } = await supabase
      .from(DatabaseConstants.loveDiaries)
      .insert(dbData)
      .select()
      .single();

    if (error || !data) return null;
    return mapLoveDiaryFromDb(data);
  }

  async deleteDiary(diaryId: string): Promise<void> {
    await supabase
      .from(DatabaseConstants.loveDiaries)
      .delete()
      .eq('id', diaryId);
  }
}

export class DiaryMediaService {
  async fetchMedia(diaryId: string): Promise<DiaryMedia[]> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.diaryMedia)
        .select()
        .eq('diary_id', diaryId);

      if (error || !data) return [];
      return data.map(mapDiaryMediaFromDb);
    } catch {
      return [];
    }
  }

  async insertMedia(mediaUrl: string, diaryId: string, mediaType: 'image' | 'video' = 'image'): Promise<void> {
    await supabase
      .from(DatabaseConstants.diaryMedia)
      .insert({
        diary_id: diaryId,
        media_url: mediaUrl,
        media_type: mediaType,
      });
  }
}

export class PartnerProfileNoteService {
  async fetchNote(writerId: string, targetId: string): Promise<PartnerProfileNote | null> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.partnerProfileNotes)
        .select()
        .eq('writer_id', writerId)
        .eq('target_id', targetId)
        .maybeSingle();

      if (error || !data) return null;
      return mapPartnerProfileNoteFromDb(data);
    } catch {
      return null;
    }
  }

  async fetchReceivedNotes(targetId: string): Promise<PartnerProfileNote[]> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.partnerProfileNotes)
        .select()
        .eq('target_id', targetId)
        .eq('is_shared', true);

      if (error || !data) return [];
      return data.map(mapPartnerProfileNoteFromDb);
    } catch {
      return [];
    }
  }

  async upsertNote(note: Omit<PartnerProfileNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const dbData = mapPartnerProfileNoteToDb(note as any);
    await supabase
      .from(DatabaseConstants.partnerProfileNotes)
      .upsert(dbData, { onConflict: 'writer_id,target_id' });
  }

  async deleteNote(id: string): Promise<void> {
    await supabase
      .from(DatabaseConstants.partnerProfileNotes)
      .delete()
      .eq('id', id);
  }
}

export class CoupleEventService {
  async fetchEvents(coupleId: string): Promise<CoupleEvent[]> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.coupleEvents)
        .select()
        .eq('couple_id', coupleId)
        .order('event_date', { ascending: false })
        .order('event_time', { ascending: false });

      if (error || !data) return [];
      return data.map(mapCoupleEventFromDb);
    } catch {
      return [];
    }
  }

  async createEvent(event: Omit<CoupleEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const dbData = mapCoupleEventToDb(event as any);
    delete dbData.id;
    await supabase
      .from(DatabaseConstants.coupleEvents)
      .insert(dbData);
  }

  async updateEvent(event: CoupleEvent): Promise<void> {
    const dbData = mapCoupleEventToDb(event);
    await supabase
      .from(DatabaseConstants.coupleEvents)
      .update(dbData)
      .eq('id', event.id);
  }

  async deleteEvent(eventId: string): Promise<void> {
    await supabase
      .from(DatabaseConstants.coupleEvents)
      .delete()
      .eq('id', eventId);
  }
}

export class UserMoodLogService {
  async fetchMyMoodLogs(userId: string): Promise<UserMoodLog[]> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.userMoodLogs)
        .select()
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data.map(mapUserMoodLogFromDb);
    } catch {
      return [];
    }
  }

  async fetchPartnerMoodLogs(partnerId: string): Promise<UserMoodLog[]> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.userMoodLogs)
        .select()
        .eq('user_id', partnerId)
        .eq('is_shared', true)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data.map(mapUserMoodLogFromDb);
    } catch {
      return [];
    }
  }

  async createMoodLog(log: Omit<UserMoodLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const dbData = mapUserMoodLogToDb(log as any);
    delete dbData.id;
    await supabase
      .from(DatabaseConstants.userMoodLogs)
      .insert(dbData);
  }

  async deleteMoodLog(logId: string): Promise<void> {
    await supabase
      .from(DatabaseConstants.userMoodLogs)
      .delete()
      .eq('id', logId);
  }
}

export class CoupleCountdownCustomizationService {
  async fetchCustomization(coupleId: string): Promise<CoupleCountdownCustomization | null> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.coupleCountdownCustomizations)
        .select()
        .eq('couple_id', coupleId)
        .maybeSingle();

      if (error || !data) return null;
      return mapCoupleCountdownCustomizationFromDb(data);
    } catch {
      return null;
    }
  }

  async upsertCustomization(customization: Omit<CoupleCountdownCustomization, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const dbData = mapCoupleCountdownCustomizationToDb(customization as any);
    await supabase
      .from(DatabaseConstants.coupleCountdownCustomizations)
      .upsert(dbData, { onConflict: 'couple_id' });
  }
}

export class UserPushTokenService {
  async updatePushToken(userId: string, token: string): Promise<void> {
    await supabase
      .from(DatabaseConstants.userPushTokens)
      .upsert(
        {
          user_id: userId,
          push_token: token,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      );
  }

  async fetchPushToken(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.userPushTokens)
        .select('push_token')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) return null;
      return data.push_token;
    } catch {
      return null;
    }
  }
}

export class MilestonePlanService {
  async fetchPlans(coupleId: string): Promise<MilestonePlan[]> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.milestonePlans)
        .select()
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: true });

      if (error || !data) return [];
      return data.map(mapMilestonePlanFromDb);
    } catch {
      return [];
    }
  }

  async createPlan(coupleId: string, milestoneTitle: string, category: 'go' | 'eat' | 'play', content: string, milestoneId?: string): Promise<MilestonePlan | null> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.milestonePlans)
        .insert({
          couple_id: coupleId,
          milestone_title: milestoneTitle,
          category,
          content,
          milestone_id: milestoneId || null,
        })
        .select()
        .single();

      if (error || !data) return null;
      return mapMilestonePlanFromDb(data);
    } catch {
      return null;
    }
  }

  async deletePlan(planId: string): Promise<void> {
    await supabase
      .from(DatabaseConstants.milestonePlans)
      .delete()
      .eq('id', planId);
  }
}

export class DailyWishService {
  async fetchAllWishes(): Promise<DailyWish[]> {
    try {
      const { data, error } = await supabase
        .from(DatabaseConstants.dailyWishes)
        .select()
        .order('created_at', { ascending: true });

      if (error || !data) return [];
      return data.map(mapDailyWishFromDb);
    } catch {
      return [];
    }
  }
}

export class ZodiacService {
  async fetchZodiacSigns(): Promise<ZodiacSign[]> {
    try {
      const { data, error } = await cosmosSupabase
        .from('zodiac_signs')
        .select('*')
        .order('id', { ascending: true });

      if (error || !data || data.length === 0) {
        return MOCK_ZODIAC_SIGNS;
      }
      return data;
    } catch {
      return MOCK_ZODIAC_SIGNS;
    }
  }

  async fetchZodiacDetails(zodiacId: number): Promise<ZodiacDetail[]> {
    try {
      const { data, error } = await cosmosSupabase
        .from('zodiac_details')
        .select('*')
        .eq('zodiac_id', zodiacId);

      if (error || !data || data.length === 0) {
        return MOCK_ZODIAC_DETAILS.filter(d => d.zodiac_id === zodiacId);
      }
      return data;
    } catch {
      return MOCK_ZODIAC_DETAILS.filter(d => d.zodiac_id === zodiacId);
    }
  }

  async fetchZodiacMatch(id1: number, id2: number): Promise<ZodiacMatch | null> {
    try {
      const { data, error } = await cosmosSupabase
        .from('zodiac_matches')
        .select('*')
        .or(`and(zodiac_sign_1_id.eq.${id1},zodiac_sign_2_id.eq.${id2}),and(zodiac_sign_1_id.eq.${id2},zodiac_sign_2_id.eq.${id1})`)
        .maybeSingle();

      if (error || !data) {
        const found = MOCK_ZODIAC_MATCHES.find(
          m => (m.zodiac_sign_1_id === id1 && m.zodiac_sign_2_id === id2) ||
               (m.zodiac_sign_1_id === id2 && m.zodiac_sign_2_id === id1)
        );
        return found || null;
      }
      return data;
    } catch {
      const found = MOCK_ZODIAC_MATCHES.find(
        m => (m.zodiac_sign_1_id === id1 && m.zodiac_sign_2_id === id2) ||
             (m.zodiac_sign_1_id === id2 && m.zodiac_sign_2_id === id1)
      );
      return found || null;
    }
  }

  async fetchZodiacCriteria(): Promise<ZodiacCriteria[]> {
    try {
      const { data, error } = await cosmosSupabase
        .from('zodiac_criteria')
        .select('*')
        .order('id', { ascending: true });

      if (error || !data || data.length === 0) {
        return MOCK_ZODIAC_CRITERIA;
      }
      return data;
    } catch {
      return MOCK_ZODIAC_CRITERIA;
    }
  }

  async fetchZodiacAttributes(id1: number, id2: number): Promise<ZodiacAttribute[]> {
    try {
      const { data, error } = await cosmosSupabase
        .from('zodiac_attributes')
        .select('*')
        .in('zodiac_id', [id1, id2]);

      if (error || !data || data.length === 0) {
        return MOCK_ZODIAC_ATTRIBUTES.filter(a => a.zodiac_id === id1 || a.zodiac_id === id2);
      }
      return data;
    } catch {
      return MOCK_ZODIAC_ATTRIBUTES.filter(a => a.zodiac_id === id1 || a.zodiac_id === id2);
    }
  }
}

export function getZodiacSignIdFromDob(dobString?: string): number {
  if (!dobString) return 10; // Default Ma Kết (Capricorn)
  const date = new Date(dobString);
  if (isNaN(date.getTime())) return 10;
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 1; // Aries / Bạch Dương
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 2; // Taurus / Kim Ngưu
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 3; // Gemini / Song Tử
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 4; // Cancer / Cự Giải
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 5; // Leo / Sư Tử
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 6; // Virgo / Xử Nữ
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 7; // Libra / Thiên Bình
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 8; // Scorpio / Bọ Cạp
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 9; // Sagittarius / Nhân Mã
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 10; // Capricorn / Ma Kết
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 11; // Aquarius / Bảo Bình
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 12; // Pisces / Song Ngư

  return 10;
}

export {
  ZodiacSign,
  ZodiacCriteria,
  ZodiacDetail,
  ZodiacMatch,
  ZodiacAttribute
};

export * from './travelService';
