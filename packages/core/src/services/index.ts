import { supabase } from '../supabaseClient';
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
  PairingCode
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
