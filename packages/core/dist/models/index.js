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
