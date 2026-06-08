// ==========================================
// FOREVERDAYS - TYPESCRIPT MODELS & INTERFACES
// ==========================================
// -------------------------------------------------------------
// Database Mapping Utilities (Snake Case to Camel Case & vice-versa)
// -------------------------------------------------------------
export function mapProfileFromDb(row) {
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
export function mapProfileToDb(profile) {
    return {
        id: profile.id,
        nickname: profile.nickname,
        avatar_url: profile.avatarUrl,
        dob: profile.dob,
        gender: profile.gender,
    };
}
export function mapCoupleFromDb(row) {
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
export function mapCoupleToDb(couple) {
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
export function mapUserStatusFromDb(row) {
    return {
        id: row.id,
        userId: row.user_id,
        emoji: row.emoji || '😊',
        statusText: row.status_text || 'Đang ổn định',
        updatedAt: row.updated_at,
    };
}
export function mapUserStatusToDb(status) {
    return {
        id: status.id,
        user_id: status.userId,
        emoji: status.emoji,
        status_text: status.statusText,
    };
}
export function mapUserSizeFromDb(row) {
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
export function mapUserSizeToDb(size) {
    return {
        id: size.id,
        user_id: size.userId,
        shirt_size: size.shirtSize,
        pants_size: size.pantsSize,
        shoe_size: size.shoeSize,
        ring_size: size.ringSize,
    };
}
export function mapBobaPreferenceFromDb(row) {
    return {
        id: row.id,
        userId: row.user_id,
        favoriteTopping: row.favorite_topping || [],
        sugarLevel: row.sugar_level || '70%',
        iceLevel: row.ice_level || 'Normal',
        note: row.note,
    };
}
export function mapBobaPreferenceToDb(boba) {
    return {
        id: boba.id,
        user_id: boba.userId,
        favorite_topping: boba.favoriteTopping,
        sugar_level: boba.sugarLevel,
        ice_level: boba.iceLevel,
        note: boba.note,
    };
}
export function mapFavoriteFromDb(row) {
    return {
        id: row.id,
        userId: row.user_id,
        category: row.category,
        itemName: row.item_name,
        isDislike: row.is_dislike || false,
        createdAt: row.created_at,
    };
}
export function mapFavoriteToDb(fav) {
    return {
        id: fav.id,
        user_id: fav.userId,
        category: fav.category,
        item_name: fav.itemName,
        is_dislike: fav.isDislike,
    };
}
export function mapHobbyFromDb(row) {
    return {
        id: row.id,
        userId: row.user_id,
        hobbyName: row.hobby_name,
        description: row.description,
        createdAt: row.created_at,
    };
}
export function mapHobbyToDb(hobby) {
    return {
        id: hobby.id,
        user_id: hobby.userId,
        hobby_name: hobby.hobbyName,
        description: hobby.description,
    };
}
export function mapMilestoneFromDb(row) {
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
export function mapMilestoneToDb(milestone) {
    return {
        id: milestone.id,
        couple_id: milestone.coupleId,
        title: milestone.title,
        target_date: milestone.targetDate,
        type: milestone.type,
        description: milestone.description,
    };
}
export function mapReminderFromDb(row) {
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
export function mapReminderToDb(reminder) {
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
export function mapReminderLogFromDb(row) {
    return {
        id: row.id,
        reminderId: row.reminder_id,
        triggeredAt: row.triggered_at,
        status: row.status || 'sent',
        errorMessage: row.error_message,
    };
}
export function mapLoveDiaryFromDb(row) {
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
export function mapLoveDiaryToDb(diary) {
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
export function mapDiaryMediaFromDb(row) {
    return {
        id: row.id,
        diaryId: row.diary_id,
        mediaUrl: row.media_url,
        mediaType: row.media_type || 'image',
        createdAt: row.created_at,
    };
}
export function mapDiaryMediaToDb(media) {
    return {
        id: media.id,
        diary_id: media.diaryId,
        media_url: media.mediaUrl,
        media_type: media.mediaType,
    };
}
export function mapWidgetSettingFromDb(row) {
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
export function mapWidgetSettingToDb(setting) {
    return {
        id: setting.id,
        user_id: setting.userId,
        theme_color: setting.themeColor,
        background_img_url: setting.backgroundImgUrl,
        is_show_heart_icon: setting.isShowHeartIcon,
        text_size: setting.textSize,
    };
}
export function mapPartnerProfileNoteFromDb(row) {
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
export function mapPartnerProfileNoteToDb(note) {
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
export function mapCoupleEventFromDb(row) {
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
export function mapCoupleEventToDb(event) {
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
export function mapUserMoodLogFromDb(row) {
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
export function mapUserMoodLogToDb(log) {
    return {
        id: log.id,
        user_id: log.userId,
        couple_id: log.coupleId,
        mood_type: log.moodType,
        note: log.note,
        is_shared: log.isShared,
    };
}
export function mapCoupleCountdownCustomizationFromDb(row) {
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
export function mapCoupleCountdownCustomizationToDb(customization) {
    return {
        id: customization.id,
        couple_id: customization.coupleId,
        custom_avatar_1_url: customization.customAvatar1Url === undefined ? null : customization.customAvatar1Url,
        custom_avatar_2_url: customization.customAvatar2Url === undefined ? null : customization.customAvatar2Url,
        background_url: customization.backgroundUrl === undefined ? null : customization.backgroundUrl,
    };
}
export function mapMilestonePlanFromDb(row) {
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
export function mapMilestonePlanToDb(plan) {
    return {
        id: plan.id,
        couple_id: plan.coupleId,
        milestone_id: plan.milestoneId,
        milestone_title: plan.milestoneTitle,
        category: plan.category,
        content: plan.content,
    };
}
export function mapDailyWishFromDb(row) {
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
export function mapDailyWishToDb(wish) {
    return {
        id: wish.id,
        content: wish.content,
        type: wish.type,
        special_month: wish.specialMonth,
        special_day: wish.specialDay,
        special_event: wish.specialEvent,
    };
}
