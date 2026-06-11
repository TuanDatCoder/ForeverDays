-- ==========================================
-- FOREVERDAYS - SUPABASE SCHEMA HOÀN CHỈNH
-- Chạy toàn bộ file này một lần trong Supabase SQL Editor
-- ==========================================


-- ==========================================
-- 0. DỌN DẸP (nếu cần chạy lại từ đầu)
-- ==========================================
-- DROP SCHEMA public CASCADE; CREATE SCHEMA public;
-- Bỏ comment 2 dòng trên nếu muốn reset toàn bộ DB


-- ==========================================
-- 1. KHỞI TẠO CÁC KIỂU DỮ LIỆU ĐẶC BIỆT (ENUMS)
-- ==========================================
DO $$ BEGIN
    CREATE TYPE couple_status    AS ENUM ('active', 'paused', 'broken');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE milestone_type   AS ENUM ('system', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE reminder_category AS ENUM ('dating', 'morning_wish', 'water', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE repeat_type      AS ENUM ('once', 'daily', 'weekly', 'monthly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ==========================================
-- 2. KHỞI TẠO CÁC BẢNG (TABLES)
-- ==========================================

-- Bảng 1: Thông tin tài khoản cơ bản
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nickname    VARCHAR(50),
    avatar_url  TEXT,
    dob         DATE,
    gender      VARCHAR(10),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng 2: Trạng thái cảm xúc / Emoji hàng ngày
CREATE TABLE IF NOT EXISTS public.user_statuses (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    emoji       VARCHAR(10)  DEFAULT '😊',
    status_text VARCHAR(100) DEFAULT 'Đang ổn định',
    updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Bảng 3: Mối quan hệ cặp đôi
-- FIX: anniversary_date bỏ NOT NULL vì khi ghép đôi user chưa chắc biết ngày yêu
CREATE TABLE IF NOT EXISTS public.couples (
    id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_1_id            UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_2_id            UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    anniversary_date     DATE,                          -- nullable: user tự cập nhật sau
    status               couple_status DEFAULT 'active',
    heart_effect_style   VARCHAR(30)   DEFAULT 'default_sparkle',
    user_1_voted_breakup BOOLEAN       DEFAULT FALSE,
    user_2_voted_breakup BOOLEAN       DEFAULT FALSE,
    created_at           TIMESTAMPTZ   DEFAULT NOW(),
    CONSTRAINT check_different_users CHECK (user_1_id <> user_2_id)
);

-- Bảng 4: Mã ghép đôi
CREATE TABLE IF NOT EXISTS public.pairing_codes (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    code       VARCHAR(10) UNIQUE NOT NULL,
    is_used    BOOLEAN     DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng 5: Kích cỡ trang phục
CREATE TABLE IF NOT EXISTS public.user_sizes (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    shirt_size  VARCHAR(10),
    pants_size  VARCHAR(10),
    shoe_size   INT,
    ring_size   INT,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng 6: Gu trà sữa
CREATE TABLE IF NOT EXISTS public.user_boba_preferences (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    favorite_topping TEXT[],
    sugar_level     VARCHAR(10) DEFAULT '70%',
    ice_level       VARCHAR(10) DEFAULT 'Normal',
    note            TEXT
);

-- Bảng 7: Sở thích ăn uống, màu sắc
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    category    VARCHAR(50)  NOT NULL,
    item_name   VARCHAR(255) NOT NULL,
    is_dislike  BOOLEAN      DEFAULT FALSE,
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Bảng 8: Sở thích cá nhân
CREATE TABLE IF NOT EXISTS public.user_hobbies (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    hobby_name  VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng 9: Các cột mốc kỷ niệm
CREATE TABLE IF NOT EXISTS public.milestones (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id   UUID REFERENCES public.couples(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    target_date DATE         NOT NULL,
    type        milestone_type DEFAULT 'custom',
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng 10: Tích hợp Google Calendar
CREATE TABLE IF NOT EXISTS public.google_calendar_integrations (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    access_token        TEXT NOT NULL,
    refresh_token       TEXT NOT NULL,
    google_calendar_id  TEXT,
    is_sync_enabled     BOOLEAN     DEFAULT TRUE,
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng 11: Cài đặt nhắc nhở
CREATE TABLE IF NOT EXISTS public.reminders (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id        UUID REFERENCES public.couples(id) ON DELETE CASCADE,
    creator_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_user_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category         reminder_category DEFAULT 'custom',
    title            VARCHAR(150) NOT NULL,
    message          TEXT         NOT NULL,
    scheduled_time   TIME         NOT NULL,
    repeat_interval  repeat_type  DEFAULT 'daily',
    is_active        BOOLEAN      DEFAULT TRUE,
    created_at       TIMESTAMPTZ  DEFAULT NOW()
);

-- Bảng 12: Lịch sử gửi nhắc nhở
CREATE TABLE IF NOT EXISTS public.reminder_logs (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reminder_id   UUID REFERENCES public.reminders(id) ON DELETE CASCADE,
    triggered_at  TIMESTAMPTZ DEFAULT NOW(),
    status        VARCHAR(20) DEFAULT 'sent',
    error_message TEXT
);

-- Bảng 13: Cấu hình Widget màn hình chính
CREATE TABLE IF NOT EXISTS public.widget_settings (
    id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    theme_color       VARCHAR(20) DEFAULT '#FF69B4',
    background_img_url TEXT,
    is_show_heart_icon BOOLEAN     DEFAULT TRUE,
    text_size         INT         DEFAULT 14,
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng 14: Nhật ký tình yêu
CREATE TABLE IF NOT EXISTS public.love_diaries (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id  UUID REFERENCES public.couples(id) ON DELETE CASCADE,
    writer_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title      VARCHAR(255) NOT NULL,
    content    TEXT         NOT NULL,
    mood       VARCHAR(50),
    event_date DATE         NOT NULL,
    created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- Bảng 15: Hình ảnh / Video đính kèm nhật ký
CREATE TABLE IF NOT EXISTS public.diary_media (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    diary_id   UUID REFERENCES public.love_diaries(id) ON DELETE CASCADE,
    media_url  TEXT        NOT NULL,
    media_type VARCHAR(10) DEFAULT 'image',
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==========================================
-- 3. FUNCTIONS VÀ TRIGGERS
-- ==========================================

-- FUNCTION: Xử lý lifecycle cặp đôi (breakup voting + kiểm tra chung thủy)
CREATE OR REPLACE FUNCTION public.process_couple_modifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Xử lý bỏ phiếu chia tay
    IF NEW.user_1_voted_breakup = TRUE AND NEW.user_2_voted_breakup = TRUE THEN
        NEW.status := 'broken';
    ELSIF NEW.user_1_voted_breakup = TRUE OR NEW.user_2_voted_breakup = TRUE THEN
        NEW.status := 'paused';
    END IF;

    -- Kiểm tra "một lòng một dạ" (chỉ khi quan hệ chưa broken)
    IF NEW.status != 'broken' THEN
        IF NEW.user_1_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.couples
            WHERE id != NEW.id
              AND status != 'broken'
              AND (user_1_id = NEW.user_1_id OR user_2_id = NEW.user_1_id)
        ) THEN
            RAISE EXCEPTION 'User 1 vẫn đang trong một mối quan hệ chưa chấm dứt!';
        END IF;

        IF NEW.user_2_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.couples
            WHERE id != NEW.id
              AND status != 'broken'
              AND (user_1_id = NEW.user_2_id OR user_2_id = NEW.user_2_id)
        ) THEN
            RAISE EXCEPTION 'User 2 vẫn đang trong một mối quan hệ chưa chấm dứt!';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_couple_lifecycle ON public.couples;
CREATE TRIGGER trigger_couple_lifecycle
    BEFORE INSERT OR UPDATE ON public.couples
    FOR EACH ROW EXECUTE FUNCTION public.process_couple_modifications();


-- FUNCTION: Tự động tạo profile + statuses + widget khi user mới đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nickname, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nickname', 'Thành viên mới'),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;  -- tránh lỗi nếu trigger chạy 2 lần

    INSERT INTO public.widget_settings (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.user_statuses (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- FUNCTION: Tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_profiles_time    ON public.profiles;
DROP TRIGGER IF EXISTS sync_statuses_time    ON public.user_statuses;
DROP TRIGGER IF EXISTS sync_sizes_time       ON public.user_sizes;
DROP TRIGGER IF EXISTS sync_widget_time      ON public.widget_settings;

CREATE TRIGGER sync_profiles_time  BEFORE UPDATE ON public.profiles       FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER sync_statuses_time  BEFORE UPDATE ON public.user_statuses   FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER sync_sizes_time     BEFORE UPDATE ON public.user_sizes       FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER sync_widget_time    BEFORE UPDATE ON public.widget_settings  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


-- ==========================================
-- 4. INDEXES (TỐI ƯU HIỆU NĂNG)
-- ==========================================

-- Ngăn cặp đôi trùng lặp (chỉ áp dụng khi status != 'broken' → cho phép tái hợp)
CREATE UNIQUE INDEX IF NOT EXISTS unique_couple_prevent_reverse
ON public.couples (LEAST(user_1_id, user_2_id), GREATEST(user_1_id, user_2_id))
WHERE status != 'broken';

-- Pairing codes: tra cứu nhanh theo code và creator
CREATE INDEX IF NOT EXISTS idx_pairing_codes_code    ON public.pairing_codes(code);
CREATE INDEX IF NOT EXISTS idx_pairing_codes_creator ON public.pairing_codes(creator_id);
-- Index riêng cho code đang hoạt động (chưa dùng, chưa hết hạn)
CREATE INDEX IF NOT EXISTS idx_pairing_codes_active
ON public.pairing_codes(code)
WHERE is_used = FALSE;

-- Các index quan hệ
CREATE INDEX IF NOT EXISTS idx_milestones_couple_id    ON public.milestones(couple_id);
CREATE INDEX IF NOT EXISTS idx_reminders_couple_id     ON public.reminders(couple_id);
CREATE INDEX IF NOT EXISTS idx_love_diaries_couple_id  ON public.love_diaries(couple_id);
CREATE INDEX IF NOT EXISTS idx_diary_media_diary_id    ON public.diary_media(diary_id);

-- Index composite cho user_favorites (hay query theo user + category)
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_category
ON public.user_favorites(user_id, category);


-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==========================================

-- BẬT RLS cho tất cả bảng
ALTER TABLE public.profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_statuses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairing_codes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sizes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_boba_preferences     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hobbies              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.love_diaries              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_media               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_integrations ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES ----
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id
        OR auth.uid() IN (
            SELECT user_1_id FROM public.couples WHERE user_2_id = public.profiles.id AND status = 'active'
            UNION
            SELECT user_2_id FROM public.couples WHERE user_1_id = public.profiles.id AND status = 'active'
        )
    );
CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- ---- USER STATUSES ----
DROP POLICY IF EXISTS "statuses_select" ON public.user_statuses;
DROP POLICY IF EXISTS "statuses_insert" ON public.user_statuses;
DROP POLICY IF EXISTS "statuses_update" ON public.user_statuses;

CREATE POLICY "statuses_select" ON public.user_statuses
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.uid() IN (
            SELECT user_1_id FROM public.couples WHERE user_2_id = user_id AND status = 'active'
            UNION
            SELECT user_2_id FROM public.couples WHERE user_1_id = user_id AND status = 'active'
        )
    );
CREATE POLICY "statuses_insert" ON public.user_statuses
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "statuses_update" ON public.user_statuses
    FOR UPDATE USING (auth.uid() = user_id);

-- ---- COUPLES ----
DROP POLICY IF EXISTS "couples_select" ON public.couples;
DROP POLICY IF EXISTS "couples_insert" ON public.couples;
DROP POLICY IF EXISTS "couples_update" ON public.couples;

CREATE POLICY "couples_select" ON public.couples
    FOR SELECT USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);
CREATE POLICY "couples_insert" ON public.couples
    FOR INSERT WITH CHECK (auth.uid() = user_1_id OR auth.uid() = user_2_id);
CREATE POLICY "couples_update" ON public.couples
    FOR UPDATE USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

-- ---- PAIRING CODES ----
DROP POLICY IF EXISTS "pairing_codes_select" ON public.pairing_codes;
DROP POLICY IF EXISTS "pairing_codes_insert" ON public.pairing_codes;
DROP POLICY IF EXISTS "pairing_codes_update" ON public.pairing_codes;

-- Ai cũng có thể tra mã (để nhập mã ghép đôi), chỉ tạo được mã của mình
CREATE POLICY "pairing_codes_select" ON public.pairing_codes
    FOR SELECT USING (true);
CREATE POLICY "pairing_codes_insert" ON public.pairing_codes
    FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "pairing_codes_update" ON public.pairing_codes
    FOR UPDATE 
    USING (auth.uid() = creator_id OR is_used = FALSE)
    WITH CHECK (auth.uid() = creator_id OR is_used = TRUE);

-- ---- WIDGET SETTINGS ----
DROP POLICY IF EXISTS "widget_select" ON public.widget_settings;
DROP POLICY IF EXISTS "widget_insert" ON public.widget_settings;
DROP POLICY IF EXISTS "widget_update" ON public.widget_settings;

CREATE POLICY "widget_select" ON public.widget_settings
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "widget_insert" ON public.widget_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "widget_update" ON public.widget_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- ---- USER SIZES ----
DROP POLICY IF EXISTS "sizes_all" ON public.user_sizes;
CREATE POLICY "sizes_all" ON public.user_sizes
    FOR ALL USING (
        auth.uid() = user_id
        OR auth.uid() IN (
            SELECT user_1_id FROM public.couples WHERE user_2_id = user_id AND status = 'active'
            UNION
            SELECT user_2_id FROM public.couples WHERE user_1_id = user_id AND status = 'active'
        )
    );

-- ---- USER BOBA PREFERENCES ----
DROP POLICY IF EXISTS "boba_all" ON public.user_boba_preferences;
CREATE POLICY "boba_all" ON public.user_boba_preferences
    FOR ALL USING (
        auth.uid() = user_id
        OR auth.uid() IN (
            SELECT user_1_id FROM public.couples WHERE user_2_id = user_id AND status = 'active'
            UNION
            SELECT user_2_id FROM public.couples WHERE user_1_id = user_id AND status = 'active'
        )
    );

-- ---- USER FAVORITES ----
DROP POLICY IF EXISTS "favorites_all" ON public.user_favorites;
CREATE POLICY "favorites_all" ON public.user_favorites
    FOR ALL USING (
        auth.uid() = user_id
        OR auth.uid() IN (
            SELECT user_1_id FROM public.couples WHERE user_2_id = user_id AND status = 'active'
            UNION
            SELECT user_2_id FROM public.couples WHERE user_1_id = user_id AND status = 'active'
        )
    );

-- ---- USER HOBBIES ----
DROP POLICY IF EXISTS "hobbies_all" ON public.user_hobbies;
CREATE POLICY "hobbies_all" ON public.user_hobbies
    FOR ALL USING (
        auth.uid() = user_id
        OR auth.uid() IN (
            SELECT user_1_id FROM public.couples WHERE user_2_id = user_id AND status = 'active'
            UNION
            SELECT user_2_id FROM public.couples WHERE user_1_id = user_id AND status = 'active'
        )
    );

-- ---- MILESTONES ----
DROP POLICY IF EXISTS "milestones_all" ON public.milestones;
CREATE POLICY "milestones_all" ON public.milestones
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_1_id FROM public.couples WHERE id = couple_id
            UNION
            SELECT user_2_id FROM public.couples WHERE id = couple_id
        )
    );

-- ---- REMINDERS ----
DROP POLICY IF EXISTS "reminders_all" ON public.reminders;
CREATE POLICY "reminders_all" ON public.reminders
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_1_id FROM public.couples WHERE id = couple_id
            UNION
            SELECT user_2_id FROM public.couples WHERE id = couple_id
        )
    );

-- ---- REMINDER LOGS ----
DROP POLICY IF EXISTS "reminder_logs_all" ON public.reminder_logs;
CREATE POLICY "reminder_logs_all" ON public.reminder_logs
    FOR ALL USING (
        reminder_id IN (
            SELECT r.id FROM public.reminders r
            JOIN public.couples c ON c.id = r.couple_id
            WHERE c.user_1_id = auth.uid() OR c.user_2_id = auth.uid()
        )
    );

-- ---- LOVE DIARIES ----
DROP POLICY IF EXISTS "diaries_all" ON public.love_diaries;
CREATE POLICY "diaries_all" ON public.love_diaries
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_1_id FROM public.couples WHERE id = couple_id
            UNION
            SELECT user_2_id FROM public.couples WHERE id = couple_id
        )
    );

-- ---- DIARY MEDIA ----
DROP POLICY IF EXISTS "diary_media_all" ON public.diary_media;
CREATE POLICY "diary_media_all" ON public.diary_media
    FOR ALL USING (
        diary_id IN (
            SELECT d.id FROM public.love_diaries d
            JOIN public.couples c ON c.id = d.couple_id
            WHERE c.user_1_id = auth.uid() OR c.user_2_id = auth.uid()
        )
    );

-- ---- GOOGLE CALENDAR ----
DROP POLICY IF EXISTS "gcal_all" ON public.google_calendar_integrations;
CREATE POLICY "gcal_all" ON public.google_calendar_integrations
    FOR ALL USING (auth.uid() = user_id);


-- ==========================================
-- 6. HELPER FUNCTIONS (SECURITY DEFINER)
-- ==========================================

-- FUNCTION: Lấy profile của partner (bypass RLS an toàn)
-- Chỉ trả dữ liệu khi 2 người đang là couple active
CREATE OR REPLACE FUNCTION public.get_partner_profile(target_user_id UUID)
RETURNS TABLE (
    id          UUID,
    nickname    VARCHAR(50),
    avatar_url  TEXT,
    dob         DATE,
    gender      VARCHAR(10),
    created_at  TIMESTAMPTZ,
    updated_at  TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER  -- chạy với quyền owner, bypass RLS
SET search_path = public
AS $$
BEGIN
    -- Chỉ trả kết quả nếu người gọi (auth.uid()) đang trong couple active với target_user_id
    IF NOT EXISTS (
        SELECT 1 FROM public.couples
        WHERE status = 'active'
          AND (
            (user_1_id = auth.uid() AND user_2_id = target_user_id)
            OR
            (user_2_id = auth.uid() AND user_1_id = target_user_id)
          )
    ) THEN
        RETURN; -- trả về empty nếu không phải partner
    END IF;

    RETURN QUERY
    SELECT p.id, p.nickname, p.avatar_url, p.dob, p.gender, p.created_at, p.updated_at
    FROM public.profiles p
    WHERE p.id = target_user_id;
END;
$$;

-- Cấp quyền gọi function cho authenticated users
GRANT EXECUTE ON FUNCTION public.get_partner_profile(UUID) TO authenticated;


-- ==========================================
-- 7. CÁC BẢNG BỔ SUNG TÍNH NĂNG MỚI
-- ==========================================

-- Bảng: Ghi chú về đối phương (sở thích, chiều cao, cân nặng, tính cách)
CREATE TABLE IF NOT EXISTS public.partner_profile_notes (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id   UUID REFERENCES public.couples(id) ON DELETE CASCADE,
    writer_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    height      VARCHAR(50),
    weight      VARCHAR(50),
    hobbies     TEXT,
    personality TEXT,
    is_shared   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_writer_target UNIQUE (writer_id, target_id)
);

-- Bảng: Nhật ký cột mốc/hoạt động trong ngày (đi đâu, vị trí, mấy giờ, chi tiết)
CREATE TABLE IF NOT EXISTS public.couple_events (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id   UUID REFERENCES public.couples(id) ON DELETE CASCADE,
    created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title       VARCHAR(255) NOT NULL,
    event_date  DATE NOT NULL,
    event_time  TIME,
    location    VARCHAR(255),
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng: Lịch sử cảm xúc/nhật ký tâm trạng (buồn vui, giận hờn, chia sẻ/không chia sẻ)
CREATE TABLE IF NOT EXISTS public.user_mood_logs (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    couple_id   UUID REFERENCES public.couples(id) ON DELETE CASCADE,
    mood_type   VARCHAR(50) NOT NULL,
    note        TEXT,
    is_shared   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng: Tùy chỉnh avatar và hình nền của widget đếm ngày yêu
CREATE TABLE IF NOT EXISTS public.couple_countdown_customizations (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id           UUID REFERENCES public.couples(id) ON DELETE CASCADE UNIQUE,
    custom_avatar_1_url TEXT,
    custom_avatar_2_url TEXT,
    background_url      TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng: Lưu trữ mã Expo Push Token để nhận thông báo đẩy
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    push_token  TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ---- TRIGGERS CẬP NHẬT UPDATED_AT ----
CREATE TRIGGER sync_partner_notes_time BEFORE UPDATE ON public.partner_profile_notes FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER sync_couple_events_time BEFORE UPDATE ON public.couple_events FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER sync_user_mood_logs_time BEFORE UPDATE ON public.user_mood_logs FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER sync_couple_countdown_cust_time BEFORE UPDATE ON public.couple_countdown_customizations FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER sync_user_push_tokens_time BEFORE UPDATE ON public.user_push_tokens FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- ---- INDEXES HỖ TRỢ TỐI ƯU ----
CREATE INDEX IF NOT EXISTS idx_partner_profile_notes_couple ON public.partner_profile_notes(couple_id);
CREATE INDEX IF NOT EXISTS idx_couple_events_couple ON public.couple_events(couple_id);
CREATE INDEX IF NOT EXISTS idx_user_mood_logs_user ON public.user_mood_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mood_logs_couple ON public.user_mood_logs(couple_id);

-- ---- BẬT ROW LEVEL SECURITY (RLS) ----
ALTER TABLE public.partner_profile_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_countdown_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- ---- RLS POLICIES ----

-- partner_profile_notes: người viết luôn có full quyền; người nhận được đọc nếu is_shared = TRUE
CREATE POLICY "partner_notes_select" ON public.partner_profile_notes
    FOR SELECT USING (
        auth.uid() = writer_id 
        OR (auth.uid() = target_id AND is_shared = TRUE)
    );
CREATE POLICY "partner_notes_insert" ON public.partner_profile_notes
    FOR INSERT WITH CHECK (auth.uid() = writer_id);
CREATE POLICY "partner_notes_update" ON public.partner_profile_notes
    FOR UPDATE USING (auth.uid() = writer_id);
CREATE POLICY "partner_notes_delete" ON public.partner_profile_notes
    FOR DELETE USING (auth.uid() = writer_id);

-- couple_events: cả 2 người trong couple có full quyền
CREATE POLICY "couple_events_all" ON public.couple_events
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_1_id FROM public.couples WHERE id = couple_id
            UNION
            SELECT user_2_id FROM public.couples WHERE id = couple_id
        )
    );

-- user_mood_logs: chủ nhân mood log có full quyền; partner có thể đọc nếu is_shared = TRUE
CREATE POLICY "mood_logs_select" ON public.user_mood_logs
    FOR SELECT USING (
        auth.uid() = user_id
        OR (
            is_shared = TRUE
            AND auth.uid() IN (
                SELECT user_1_id FROM public.couples WHERE (user_2_id = user_id AND status = 'active')
                UNION
                SELECT user_2_id FROM public.couples WHERE (user_1_id = user_id AND status = 'active')
            )
        )
    );
CREATE POLICY "mood_logs_insert" ON public.user_mood_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mood_logs_update" ON public.user_mood_logs
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "mood_logs_delete" ON public.user_mood_logs
    FOR DELETE USING (auth.uid() = user_id);

-- couple_countdown_customizations: cả 2 người trong couple có full quyền
CREATE POLICY "couple_countdown_cust_all" ON public.couple_countdown_customizations
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_1_id FROM public.couples WHERE id = couple_id
            UNION
            SELECT user_2_id FROM public.couples WHERE id = couple_id
        )
    );

-- user_push_tokens: người dùng có toàn quyền với token của mình, partner có quyền đọc để gửi thông báo
DROP POLICY IF EXISTS "user_push_tokens_all" ON public.user_push_tokens;

CREATE POLICY "user_push_tokens_select" ON public.user_push_tokens
    FOR SELECT USING (
        auth.uid() = user_id 
        OR auth.uid() IN (
            SELECT user_1_id FROM public.couples WHERE (user_2_id = user_id AND status = 'active')
            UNION
            SELECT user_2_id FROM public.couples WHERE (user_1_id = user_id AND status = 'active')
        )
    );

CREATE POLICY "user_push_tokens_insert" ON public.user_push_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_push_tokens_update" ON public.user_push_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_push_tokens_delete" ON public.user_push_tokens
    FOR DELETE USING (auth.uid() = user_id);


-- ==========================================
-- 6. CHI TIẾT KẾ HOẠCH CỘT MỐC (MILESTONE PLANS)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.milestone_plans (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id        UUID REFERENCES public.couples(id) ON DELETE CASCADE,
    milestone_id     UUID REFERENCES public.milestones(id) ON DELETE CASCADE, -- null đối với mốc hệ thống
    milestone_title  VARCHAR(255) NOT NULL,
    category         VARCHAR(50) NOT NULL,  -- 'go' (Đi đâu), 'eat' (Ăn gì), 'play' (Chơi gì)
    content          TEXT NOT NULL,
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Tự động cập nhật thời gian
CREATE TRIGGER sync_milestone_plans_time BEFORE UPDATE ON public.milestone_plans FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Index hỗ trợ tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_milestone_plans_couple ON public.milestone_plans(couple_id);

-- Bật RLS
ALTER TABLE public.milestone_plans ENABLE ROW LEVEL SECURITY;

-- Chính sách RLS: Cả 2 thành viên cặp đôi đều có toàn quyền
CREATE POLICY "milestone_plans_all" ON public.milestone_plans
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_1_id FROM public.couples WHERE id = couple_id
            UNION
            SELECT user_2_id FROM public.couples WHERE id = couple_id
        )
    );


-- ==========================================
-- 7. LỜI CHÚC NGỌT NGÀO HẰNG NGÀY & NGÀY ĐẶC BIỆT (DAILY WISHES)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.daily_wishes (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content       TEXT NOT NULL,
    type          VARCHAR(20) DEFAULT 'daily', -- 'daily', 'special'
    special_month INT,
    special_day   INT,
    special_event VARCHAR(100),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Bật RLS
ALTER TABLE public.daily_wishes ENABLE ROW LEVEL SECURITY;

-- Cho phép tất cả người dùng authenticated đọc câu chúc
CREATE POLICY "daily_wishes_select" ON public.daily_wishes
    FOR SELECT TO authenticated USING (true);

-- Dọn dẹp dữ liệu cũ nếu chạy lại
-- SQL INSERT FOR 300 WISHES
DELETE FROM public.daily_wishes;

INSERT INTO public.daily_wishes (content, type) VALUES
('Chúc em ngày mới tràn ngập niềm vui và luôn nghĩ về anh nhé! ❤️', 'daily'),
('Hôm nay là một ngày tuyệt vời để chúng ta yêu thương nhau nhiều hơn. 🥰', 'daily'),
('Mỗi ngày thức dậy có em trong đời là điều may mắn nhất của anh. 💕', 'daily'),
('Nụ cười của em chính là năng lượng cho cả ngày dài của anh đó! ☀️', 'daily'),
('Chúc nửa kia có một ngày làm việc và học tập thật hiệu quả nhé, thương em! 😘', 'daily'),
('Anh muốn gửi ngàn nụ hôn ngọt ngào nhất đến cô gái của anh hôm nay. 💋', 'daily'),
('Dù ngày hôm nay có bận rộn thế nào, cũng đừng quên có một người luôn nhớ em. 🤗', 'daily'),
('Em là điều ngọt ngào nhất mà cuộc sống đã ban tặng cho anh. 🍭', 'daily'),
('Chúc em một ngày tràn đầy năng lượng tích cực và may mắn nha! 🍀', 'daily'),
('Hôm nay anh lại yêu em nhiều hơn hôm qua một chút rồi! 💖', 'daily'),
('Hôm nay hãy ôm người ấy thật chặt trước khi chia tay nhau ra về nhé! 🥰', 'daily'),
('Đừng quên nhắn tin bảo người ấy là bạn nhớ người ấy lắm rồi nha! 💕', 'daily'),
('Thử mua tặng người ấy một ly trà sữa loại ít đường đúng gu xem sao! 🥤', 'daily'),
('Hãy cùng người ấy ôn lại một kỷ niệm ngày đầu mới yêu nhau nhé! 🌸', 'daily'),
('Nhắc nhở nhẹ nhàng: Hãy luôn yêu thương và quan tâm đến cảm xúc của nhau hôm nay nha! ❤️', 'daily'),
('Một lời khen ngọt ngào vào buổi sáng sẽ làm cả ngày của người ấy bừng sáng đó! ☀️', 'daily'),
('Hãy dành 5 phút để gọi điện nghe giọng nói ấm áp của nửa kia hôm nay nhé! 📞', 'daily'),
('Hãy nấu một món ăn đơn giản mà người ấy yêu thích để hâm nóng tình cảm nha! 🍳', 'daily'),
('Đừng quên gửi một tấm hình tự sướng dễ thương kèm lời chúc ngày mới tốt lành! 📸', 'daily'),
('Hôm nay hãy quan tâm đến những điều nhỏ nhặt nhất của người ấy nhé! 🤗', 'daily'),
('Hôm nay là ngày tuyệt vời để ôm nhẹ từ phía sau để bày tỏ sự trân trọng 💕', 'daily'),
('Thử dành cho đối phương những cử chỉ ngọt ngào như hỏi xem hôm nay người ấy có chuyện gì vui không nhé người thương 💕', 'daily'),
('Hôm nay là ngày tuyệt vời để gửi một bài hát ngọt ngào mà bạn vô tình nghe thấy 💫', 'daily'),
('Đừng quên dành cho nửa kia những cử chỉ ngọt ngào như nhắc uống đủ nước để luôn tràn đầy năng lượng nhé người ấy ơi 🥤', 'daily'),
('Hãy dành thời gian dành cho người ấy những cử chỉ ngọt ngào như nhường nhịn đối phương một chút nếu có bất đồng nhỏ nhé nửa kia yêu dấu 🧸', 'daily'),
('Dành một chút thời gian hôm nay để gửi một tin nhắn ngọt ngào để bắt đầu ngày mới 💫', 'daily'),
('Hôm nay bạn hãy gửi một nhãn dán (sticker) thật đáng yêu và tinh nghịch 💖', 'daily'),
('Đừng quên dành cho tình yêu của bạn những cử chỉ ngọt ngào như chia sẻ một bức ảnh cũ chụp chung của hai đứa nhé 🥳', 'daily'),
('Hãy dành cho người ấy những cử chỉ ngọt ngào như gửi một cái ôm thật ấm áp qua tin nhắn để ngày hôm nay thêm ngọt ngào 💫', 'daily'),
('Hãy dành cho nửa kia những cử chỉ ngọt ngào như tạo một bất ngờ nho nhỏ bằng cách đặt đồ ăn gửi qua nha ❤️', 'daily'),
('Hãy dành cho đối phương những cử chỉ ngọt ngào như rủ đi uống trà sữa hoặc ăn món ăn vặt yêu thích đó 🍀', 'daily'),
('Hãy dành cho tình yêu của bạn những cử chỉ ngọt ngào như dành một lời khen ngợi chân thành về nụ cười hoặc mái tóc nha người ấy ơi 🍀', 'daily'),
('Thử dành cho tình yêu của bạn những cử chỉ ngọt ngào như cùng nhau chụp một tấm ảnh tự sướng mới nhất nhé để ngày hôm nay thêm ngọt ngào 🍀', 'daily'),
('Hãy dành thời gian dành cho tình yêu của bạn những cử chỉ ngọt ngào như hỏi xem hôm nay người ấy có chuyện gì vui không nhé tình yêu 🌷', 'daily'),
('Hãy luôn dành cho tình yêu của bạn những cử chỉ ngọt ngào như gửi một nhãn dán (sticker) thật đáng yêu và tinh nghịch nha người thương 🌷', 'daily'),
('Hãy chủ động gửi một nhãn dán (sticker) thật đáng yêu và tinh nghịch 🌸', 'daily'),
('Hãy dành cho nửa kia những cử chỉ ngọt ngào như dành một lời khen ngợi chân thành về nụ cười hoặc mái tóc nha tình yêu 🧸', 'daily'),
('Hôm nay bạn hãy chia sẻ một bức ảnh cũ chụp chung của hai đứa nhé 🥤', 'daily'),
('Hôm nay hãy gửi một cái ôm thật ấm áp qua tin nhắn 🍀', 'daily'),
('Hôm nay bạn hãy nắm tay thật chặt khi cùng nhau đi bộ dưới phố 🥤', 'daily'),
('Dành một chút thời gian hôm nay để gửi một bài hát ngọt ngào mà bạn vô tình nghe thấy 🥤', 'daily'),
('Đừng quên dành cho đối phương những cử chỉ ngọt ngào như dành một lời khen ngợi chân thành về nụ cười hoặc mái tóc nhé 💖', 'daily'),
('Hôm nay là ngày tuyệt vời để ôm nhẹ từ phía sau để bày tỏ sự trân trọng ✨', 'daily'),
('Hôm nay là ngày tuyệt vời để hỏi xem có cần bạn giúp đỡ việc gì không nhé 💫', 'daily'),
('Dành một chút thời gian hôm nay để hôn nhẹ lên trán để thể hiện sự chở che yêu thương ✨', 'daily'),
('Hôm nay là ngày tuyệt vời để chia sẻ một câu chuyện vui vẻ bạn gặp hôm nay ☀️', 'daily'),
('Hãy luôn dành cho nửa kia những cử chỉ ngọt ngào như nhắc nhở đi ngủ sớm để giữ gìn nhan sắc và sức khỏe nhé để ngày hôm nay thêm ngọt ngào 🌷', 'daily'),
('Đừng quên dành cho đối phương những cử chỉ ngọt ngào như gửi một bài hát ngọt ngào mà bạn vô tình nghe thấy nha 💖', 'daily'),
('Hôm nay bạn hãy gửi một nhãn dán (sticker) thật đáng yêu và tinh nghịch 🍀', 'daily'),
('Hôm nay là ngày tuyệt vời để viết một mẩu giấy nhớ ngọt ngào gửi kèm nhé 😘', 'daily'),
('Hôm nay là ngày tuyệt vời để lên kế hoạch cho một buổi hẹn hò lãng mạn cuối tuần này 🤝', 'daily'),
('Hãy luôn dành cho đối phương những cử chỉ ngọt ngào như nhắc nhở đi ngủ sớm để giữ gìn nhan sắc và sức khỏe nhé tình yêu của anh/em 🤝', 'daily'),
('Hãy luôn dành cho đối phương những cử chỉ ngọt ngào như hỏi xem có cần bạn giúp đỡ việc gì không nhé để tình cảm thêm bền chặt 😍', 'daily'),
('Hôm nay bạn hãy kiên nhẫn lắng nghe những tâm sự nhỏ to sau ngày làm việc 🥤', 'daily'),
('Hôm nay bạn hãy lên kế hoạch cho một buổi hẹn hò lãng mạn cuối tuần này 🍀', 'daily'),
('Thử dành cho người ấy những cử chỉ ngọt ngào như nhường nhịn đối phương một chút nếu có bất đồng nhỏ nhé để ngày hôm nay thêm ngọt ngào 💋', 'daily'),
('Hãy dành thời gian dành cho người thương những cử chỉ ngọt ngào như ôm nhẹ từ phía sau để bày tỏ sự trân trọng nha tình yêu 💕', 'daily'),
('Dành một chút thời gian hôm nay để hỏi xem có cần bạn giúp đỡ việc gì không nhé 😘', 'daily'),
('Hãy dành cho người thương những cử chỉ ngọt ngào như gửi một nhãn dán (sticker) thật đáng yêu và tinh nghịch nha 🍀', 'daily'),
('Hôm nay là ngày tuyệt vời để rủ đi uống trà sữa hoặc ăn món ăn vặt yêu thích 🤗', 'daily'),
('Hãy dành cho người thương những cử chỉ ngọt ngào như viết một mẩu giấy nhớ ngọt ngào gửi kèm nhé 🤗', 'daily'),
('Hãy dành cho tình yêu của bạn những cử chỉ ngọt ngào như gửi một cái ôm thật ấm áp qua tin nhắn nhé tình yêu của anh/em 🤝', 'daily'),
('Hãy dành thời gian dành cho người ấy những cử chỉ ngọt ngào như chia sẻ một bức ảnh cũ chụp chung của hai đứa nhé nửa kia yêu dấu 🍀', 'daily'),
('Thử dành cho đối phương những cử chỉ ngọt ngào như hỏi xem có cần bạn giúp đỡ việc gì không nhé đó ☀️', 'daily'),
('Thử dành cho đối phương những cử chỉ ngọt ngào như rủ đi uống trà sữa hoặc ăn món ăn vặt yêu thích nha 🥤', 'daily'),
('Hãy dành cho tình yêu của bạn những cử chỉ ngọt ngào như hỏi xem có cần bạn giúp đỡ việc gì không nhé để ngày hôm nay thêm ngọt ngào 🌸', 'daily'),
('Hãy dành cho người ấy những cử chỉ ngọt ngào như chia sẻ một bức ảnh cũ chụp chung của hai đứa nhé 🥤', 'daily'),
('Dành một chút thời gian hôm nay để lên kế hoạch cho một buổi hẹn hò lãng mạn cuối tuần này ✨', 'daily'),
('Dành một chút thời gian hôm nay để nhắc uống đủ nước để luôn tràn đầy năng lượng nhé 😍', 'daily'),
('Hôm nay bạn hãy gọi điện thoại chỉ để nghe giọng nói quen thuộc 🤝', 'daily'),
('Hãy dành cho nửa kia những cử chỉ ngọt ngào như chia sẻ một bức ảnh cũ chụp chung của hai đứa nhé người thương 😍', 'daily'),
('Dành một chút thời gian hôm nay để dành cho nhau 10 phút nói chuyện hoàn toàn không bấm điện thoại 🍿', 'daily'),
('Hãy dành thời gian dành cho nửa kia những cử chỉ ngọt ngào như gửi một bài hát ngọt ngào mà bạn vô tình nghe thấy nhé nửa kia yêu dấu 🎁', 'daily'),
('Hãy dành cho đối phương những cử chỉ ngọt ngào như hỏi xem có cần bạn giúp đỡ việc gì không nhé đó 💖', 'daily'),
('Hãy dành thời gian dành cho đối phương những cử chỉ ngọt ngào như tạo một bất ngờ nho nhỏ bằng cách đặt đồ ăn gửi qua nha tình yêu 🍿', 'daily'),
('Thử dành cho tình yêu của bạn những cử chỉ ngọt ngào như hôn nhẹ lên trán để thể hiện sự chở che yêu thương nhé nửa kia yêu dấu 🌸', 'daily'),
('Hãy chủ động nhắc nhở đi ngủ sớm để giữ gìn nhan sắc và sức khỏe nhé 💖', 'daily'),
('Hôm nay là ngày tuyệt vời để nhắn tin hỏi thăm xem có mệt không nhé 🎁', 'daily'),
('Hôm nay là ngày tuyệt vời để viết một mẩu giấy nhớ ngọt ngào gửi kèm nhé 🥤', 'daily'),
('Hôm nay bạn hãy dành cho nhau 10 phút nói chuyện hoàn toàn không bấm điện thoại ❤️', 'daily'),
('Hôm nay bạn hãy nhường nhịn đối phương một chút nếu có bất đồng nhỏ nhé 💫', 'daily'),
('Thử dành cho người thương những cử chỉ ngọt ngào như dành một lời khen ngợi chân thành về nụ cười hoặc mái tóc nhé nửa kia yêu dấu 💋', 'daily'),
('Hôm nay hãy lên kế hoạch cho một buổi hẹn hò lãng mạn cuối tuần này 🥰', 'daily'),
('Dành một chút thời gian hôm nay để gửi một nhãn dán (sticker) thật đáng yêu và tinh nghịch 🧸', 'daily'),
('Đừng quên dành cho tình yêu của bạn những cử chỉ ngọt ngào như chia sẻ một câu chuyện vui vẻ bạn gặp hôm nay nhé 🥰', 'daily'),
('Đừng quên dành cho đối phương những cử chỉ ngọt ngào như chia sẻ một câu chuyện vui vẻ bạn gặp hôm nay nhé ❤️', 'daily'),
('Đừng quên dành cho người thương những cử chỉ ngọt ngào như nhắc uống đủ nước để luôn tràn đầy năng lượng nhé để tình cảm thêm bền chặt 🎁', 'daily'),
('Hôm nay bạn hãy chuẩn bị một viên kẹo ngọt hoặc món quà nhỏ bỏ vào túi áo nhé ✨', 'daily'),
('Hãy luôn dành cho tình yêu của bạn những cử chỉ ngọt ngào như gửi một bài hát ngọt ngào mà bạn vô tình nghe thấy nha ✨', 'daily'),
('Hãy dành cho tình yêu của bạn những cử chỉ ngọt ngào như chia sẻ một bức ảnh cũ chụp chung của hai đứa nhé tình yêu 🤝', 'daily'),
('Đừng quên dành cho tình yêu của bạn những cử chỉ ngọt ngào như gửi một tin nhắn ngọt ngào để bắt đầu ngày mới nhé tình yêu của anh/em ✨', 'daily'),
('Hãy chủ động khen ngợi phong cách ăn mặc hoặc mùi nước hoa hôm nay 🥰', 'daily'),
('Dành một chút thời gian hôm nay để động viên và cổ vũ cho những nỗ lực hôm nay của người ấy nhé 💕', 'daily'),
('Hãy dành thời gian dành cho người ấy những cử chỉ ngọt ngào như nhắc uống đủ nước để luôn tràn đầy năng lượng nhé để tình cảm thêm bền chặt 💕', 'daily'),
('Hôm nay bạn hãy nói lời yêu thương ngọt ngào trước khi đi ngủ nhé 🌷', 'daily'),
('Hãy luôn dành cho nửa kia những cử chỉ ngọt ngào như hỏi xem hôm nay người ấy có chuyện gì vui không nhé ✨', 'daily'),
('Hôm nay hãy gửi một cái ôm thật ấm áp qua tin nhắn 😍', 'daily'),
('Hãy luôn dành cho đối phương những cử chỉ ngọt ngào như nhắc uống đủ nước để luôn tràn đầy năng lượng nhé 😘', 'daily'),
('Thử dành cho người thương những cử chỉ ngọt ngào như cùng nhau chụp một tấm ảnh tự sướng mới nhất nhé để ngày hôm nay thêm ngọt ngào 🍀', 'daily'),
('Hãy dành cho nửa kia những cử chỉ ngọt ngào như nói lời yêu thương ngọt ngào trước khi đi ngủ nhé để tình cảm thêm bền chặt 🎁', 'daily'),
('Hãy luôn dành cho tình yêu của bạn những cử chỉ ngọt ngào như dành một lời khen ngợi chân thành về nụ cười hoặc mái tóc để tình cảm thêm bền chặt ✨', 'daily'),
('Hãy dành thời gian dành cho người thương những cử chỉ ngọt ngào như viết một mẩu giấy nhớ ngọt ngào gửi kèm nhé ✨', 'daily'),
('Hôm nay bạn hãy dành cho nhau 10 phút nói chuyện hoàn toàn không bấm điện thoại 💕', 'daily'),
('Hãy dành thời gian dành cho đối phương những cử chỉ ngọt ngào như ôm nhẹ từ phía sau để bày tỏ sự trân trọng đó 🌷', 'daily'),
('Hôm nay là ngày tuyệt vời để tạo một bất ngờ nho nhỏ bằng cách đặt đồ ăn gửi qua 🤝', 'daily'),
('Hãy chủ động khen ngợi phong cách ăn mặc hoặc mùi nước hoa hôm nay 🌸', 'daily'),
('Đừng quên dành cho người thương những cử chỉ ngọt ngào như gọi điện thoại chỉ để nghe giọng nói quen thuộc nhé nửa kia yêu dấu 🎁', 'daily'),
('Hôm nay bạn hãy rủ đi uống trà sữa hoặc ăn món ăn vặt yêu thích 🥰', 'daily'),
('Hôm nay bạn hãy cùng nhau chụp một tấm ảnh tự sướng mới nhất nhé 🍿', 'daily'),
('Hãy luôn dành cho nửa kia những cử chỉ ngọt ngào như gửi một nhãn dán (sticker) thật đáng yêu và tinh nghịch nha người ấy ơi 🤗', 'daily'),
('Dành một chút thời gian hôm nay để nói lời yêu thương ngọt ngào trước khi đi ngủ nhé 🥤', 'daily'),
('Hôm nay là ngày tuyệt vời để rủ đi uống trà sữa hoặc ăn món ăn vặt yêu thích 🎁', 'daily'),
('Hôm nay là ngày tuyệt vời để động viên và cổ vũ cho những nỗ lực hôm nay của người ấy nhé 💫', 'daily'),
('Dành một chút thời gian hôm nay để khen ngợi phong cách ăn mặc hoặc mùi nước hoa hôm nay 🥤', 'daily'),
('Hãy dành cho nửa kia những cử chỉ ngọt ngào như gửi một tin nhắn ngọt ngào để bắt đầu ngày mới để tình cảm thêm bền chặt 🥰', 'daily'),
('Thử dành cho tình yêu của bạn những cử chỉ ngọt ngào như nhắc uống đủ nước để luôn tràn đầy năng lượng nhé để tình cảm thêm bền chặt 🥰', 'daily'),
('Hãy luôn dành cho đối phương những cử chỉ ngọt ngào như gửi một bài hát ngọt ngào mà bạn vô tình nghe thấy nha 🧸', 'daily'),
('Hãy luôn dành cho người thương những cử chỉ ngọt ngào như động viên và cổ vũ cho những nỗ lực hôm nay của người ấy nhé người ấy ơi 🍿', 'daily'),
('Hôm nay là ngày tuyệt vời để dành một lời khen ngợi chân thành về nụ cười hoặc mái tóc 🌷', 'daily'),
('Hãy dành cho người thương những cử chỉ ngọt ngào như nhắc nhở ăn uống đúng giờ và giữ gìn sức khỏe nhé 💖', 'daily'),
('Hãy luôn dành cho nửa kia những cử chỉ ngọt ngào như kiên nhẫn lắng nghe những tâm sự nhỏ to sau ngày làm việc để ngày hôm nay thêm ngọt ngào 🍀', 'daily'),
('Hôm nay hãy hỏi xem có cần bạn giúp đỡ việc gì không nhé ❤️', 'daily'),
('Hãy luôn dành cho đối phương những cử chỉ ngọt ngào như hôn nhẹ lên trán để thể hiện sự chở che yêu thương nha người thương 🤝', 'daily'),
('Dành một chút thời gian hôm nay để lên kế hoạch cho một buổi hẹn hò lãng mạn cuối tuần này 🧸', 'daily'),
('Hôm nay hãy chia sẻ một câu chuyện vui vẻ bạn gặp hôm nay 🥳', 'daily'),
('Hãy dành thời gian dành cho tình yêu của bạn những cử chỉ ngọt ngào như gửi một cái ôm thật ấm áp qua tin nhắn để ngày hôm nay thêm ngọt ngào 🌷', 'daily'),
('Hãy chủ động hôn nhẹ lên trán để thể hiện sự chở che yêu thương 🤝', 'daily'),
('Hãy chủ động nhắc nhở đi ngủ sớm để giữ gìn nhan sắc và sức khỏe nhé 😘', 'daily'),
('Thử dành cho đối phương những cử chỉ ngọt ngào như gửi một nhãn dán (sticker) thật đáng yêu và tinh nghịch nhé tình yêu của anh/em ❤️', 'daily'),
('Thử dành cho nửa kia những cử chỉ ngọt ngào như gửi một bài hát ngọt ngào mà bạn vô tình nghe thấy để tình cảm thêm bền chặt 🍿', 'daily'),
('Hãy luôn dành cho nửa kia những cử chỉ ngọt ngào như gửi một bài hát ngọt ngào mà bạn vô tình nghe thấy nhé ☀️', 'daily'),
('Hãy dành cho nửa kia những cử chỉ ngọt ngào như chia sẻ một bức ảnh cũ chụp chung của hai đứa nhé 🍀', 'daily'),
('Hãy dành thời gian dành cho người thương những cử chỉ ngọt ngào như ôm nhẹ từ phía sau để bày tỏ sự trân trọng nha người thương ☀️', 'daily'),
('Hãy chủ động kiên nhẫn lắng nghe những tâm sự nhỏ to sau ngày làm việc 💫', 'daily'),
('Hôm nay hãy nhắc nhở đi ngủ sớm để giữ gìn nhan sắc và sức khỏe nhé 🌷', 'daily'),
('Hãy dành thời gian dành cho nửa kia những cử chỉ ngọt ngào như nhắc uống đủ nước để luôn tràn đầy năng lượng nhé tình yêu của anh/em 🤗', 'daily'),
('Hãy luôn dành cho người ấy những cử chỉ ngọt ngào như kiên nhẫn lắng nghe những tâm sự nhỏ to sau ngày làm việc để tình cảm thêm bền chặt 💕', 'daily'),
('Thử dành cho tình yêu của bạn những cử chỉ ngọt ngào như hôn nhẹ lên trán để thể hiện sự chở che yêu thương để ngày hôm nay thêm ngọt ngào 💕', 'daily'),
('Hãy dành thời gian dành cho người ấy những cử chỉ ngọt ngào như nhắc nhở ăn uống đúng giờ và giữ gìn sức khỏe nhé tình yêu 🌷', 'daily'),
('Hãy chủ động hỏi xem có cần bạn giúp đỡ việc gì không nhé ☀️', 'daily'),
('Thử dành cho nửa kia những cử chỉ ngọt ngào như nhường nhịn đối phương một chút nếu có bất đồng nhỏ nhé ❤️', 'daily'),
('Hãy dành cho tình yêu của bạn những cử chỉ ngọt ngào như gửi một lời chúc ngủ ngon thật ấm áp và dễ thương nha người ấy ơi 💕', 'daily'),
('Hãy dành cho tình yêu của bạn những cử chỉ ngọt ngào như ôm nhẹ từ phía sau để bày tỏ sự trân trọng để tình cảm thêm bền chặt 🥤', 'daily'),
('Thử dành cho nửa kia những cử chỉ ngọt ngào như nhường nhịn đối phương một chút nếu có bất đồng nhỏ nhé người ấy ơi 😍', 'daily'),
('Hôm nay hãy dành một lời khen ngợi chân thành về nụ cười hoặc mái tóc ☀️', 'daily'),
('Thử dành cho người thương những cử chỉ ngọt ngào như nhắc nhở ăn uống đúng giờ và giữ gìn sức khỏe nhé 🍿', 'daily'),
('Đừng quên dành cho người ấy những cử chỉ ngọt ngào như nhắn tin hỏi thăm xem có mệt không nhé đó 🥰', 'daily'),
('Dành một chút thời gian hôm nay để nhắc nhở ăn uống đúng giờ và giữ gìn sức khỏe nhé ❤️', 'daily'),
('Hãy dành thời gian dành cho nửa kia những cử chỉ ngọt ngào như nhắc uống đủ nước để luôn tràn đầy năng lượng nhé người ấy ơi 🧸', 'daily'),
('Hôm nay là ngày tuyệt vời để gọi điện thoại chỉ để nghe giọng nói quen thuộc 🤗', 'daily'),
('Hãy luôn dành cho nửa kia những cử chỉ ngọt ngào như gọi điện thoại chỉ để nghe giọng nói quen thuộc nha người ấy ơi 💋', 'daily'),
('Hãy luôn dành cho đối phương những cử chỉ ngọt ngào như gửi một nhãn dán (sticker) thật đáng yêu và tinh nghịch nhé tình yêu của anh/em 🎁', 'daily'),
('Thử dành cho tình yêu của bạn những cử chỉ ngọt ngào như dành cho nhau 10 phút nói chuyện hoàn toàn không bấm điện thoại để ngày hôm nay thêm ngọt ngào ☀️', 'daily'),
('Dành một chút thời gian hôm nay để nhắc nhở ăn uống đúng giờ và giữ gìn sức khỏe nhé 🍀', 'daily'),
('Hôm nay bạn hãy gọi điện thoại chỉ để nghe giọng nói quen thuộc 🍿', 'daily'),
('Thử dành cho đối phương những cử chỉ ngọt ngào như chia sẻ một câu chuyện vui vẻ bạn gặp hôm nay nhé nửa kia yêu dấu ☀️', 'daily'),
('Hôm nay hãy nhắc uống đủ nước để luôn tràn đầy năng lượng nhé 🥰', 'daily'),
('Thử dành cho người thương những cử chỉ ngọt ngào như tạo một bất ngờ nho nhỏ bằng cách đặt đồ ăn gửi qua nha người thương 🥰', 'daily'),
('Hôm nay bạn hãy lên kế hoạch cho một buổi hẹn hò lãng mạn cuối tuần này 🌷', 'daily'),
('Hôm nay bạn hãy nhắc uống đủ nước để luôn tràn đầy năng lượng nhé 🧸', 'daily'),
('Hãy dành thời gian dành cho đối phương những cử chỉ ngọt ngào như chia sẻ một câu chuyện vui vẻ bạn gặp hôm nay nha người thương 🧸', 'daily'),
('Đừng quên dành cho đối phương những cử chỉ ngọt ngào như gọi điện thoại chỉ để nghe giọng nói quen thuộc nha người thương 🤗', 'daily'),
('Hôm nay hãy gửi một tin nhắn ngọt ngào để bắt đầu ngày mới 💋', 'daily'),
('Dành một chút thời gian hôm nay để gửi một tin nhắn ngọt ngào để bắt đầu ngày mới 🥤', 'daily'),
('Hôm nay bạn hãy dành một lời khen ngợi chân thành về nụ cười hoặc mái tóc 🎁', 'daily'),
('Hôm nay là ngày tuyệt vời để lên kế hoạch cho một buổi hẹn hò lãng mạn cuối tuần này 🤗', 'daily'),
('Hãy luôn dành cho người ấy những cử chỉ ngọt ngào như rủ đi uống trà sữa hoặc ăn món ăn vặt yêu thích nhé nửa kia yêu dấu ❤️', 'daily'),
('Hãy dành cho người thương những cử chỉ ngọt ngào như nhắn tin hỏi thăm xem có mệt không nhé để tình cảm thêm bền chặt ☀️', 'daily'),
('Hãy dành thời gian dành cho tình yêu của bạn những cử chỉ ngọt ngào như dành cho nhau 10 phút nói chuyện hoàn toàn không bấm điện thoại nhé nửa kia yêu dấu 🍿', 'daily'),
('Hôm nay bạn hãy dành cho nhau 10 phút nói chuyện hoàn toàn không bấm điện thoại 💫', 'daily'),
('Hãy chủ động chia sẻ một bức ảnh cũ chụp chung của hai đứa nhé 💋', 'daily'),
('Đừng quên dành cho người ấy những cử chỉ ngọt ngào như chia sẻ một câu chuyện vui vẻ bạn gặp hôm nay nhé 😘', 'daily'),
('Hôm nay là ngày tuyệt vời để tạo một bất ngờ nho nhỏ bằng cách đặt đồ ăn gửi qua 🌷', 'daily'),
('Đừng quên dành cho người ấy những cử chỉ ngọt ngào như cùng nhau chụp một tấm ảnh tự sướng mới nhất nhé người thương 🥰', 'daily'),
('Hãy chủ động gửi một tin nhắn ngọt ngào để bắt đầu ngày mới ☀️', 'daily'),
('Hôm nay là ngày tuyệt vời để viết một mẩu giấy nhớ ngọt ngào gửi kèm nhé 🍿', 'daily'),
('Hôm nay bạn hãy cùng nhau chụp một tấm ảnh tự sướng mới nhất nhé ❤️', 'daily'),
('Hôm nay bạn hãy lên kế hoạch cho một buổi hẹn hò lãng mạn cuối tuần này 💕', 'daily'),
('Thử dành cho đối phương những cử chỉ ngọt ngào như kiên nhẫn lắng nghe những tâm sự nhỏ to sau ngày làm việc nhé tình yêu của anh/em 🍀', 'daily'),
('Hãy dành cho tình yêu của bạn những cử chỉ ngọt ngào như tạo một bất ngờ nho nhỏ bằng cách đặt đồ ăn gửi qua nha ☀️', 'daily'),
('Hôm nay là ngày tuyệt vời để nhắc nhở ăn uống đúng giờ và giữ gìn sức khỏe nhé 💖', 'daily'),
('Hôm nay hãy cùng nhau chụp một tấm ảnh tự sướng mới nhất nhé 🎁', 'daily'),
('Hôm nay là ngày tuyệt vời để rủ đi uống trà sữa hoặc ăn món ăn vặt yêu thích 💫', 'daily'),
('Hôm nay bạn hãy nhường nhịn đối phương một chút nếu có bất đồng nhỏ nhé 🍿', 'daily'),
('Hôm nay hãy chuẩn bị một viên kẹo ngọt hoặc món quà nhỏ bỏ vào túi áo nhé ✨', 'daily'),
('Hôm nay là ngày tuyệt vời để gửi một nhãn dán (sticker) thật đáng yêu và tinh nghịch 💫', 'daily'),
('Hãy luôn dành cho người ấy những cử chỉ ngọt ngào như chia sẻ một câu chuyện vui vẻ bạn gặp hôm nay đó 🍿', 'daily'),
('Hãy chủ động nhắc nhở ăn uống đúng giờ và giữ gìn sức khỏe nhé 🧸', 'daily'),
('Hãy dành thời gian dành cho nửa kia những cử chỉ ngọt ngào như tạo một bất ngờ nho nhỏ bằng cách đặt đồ ăn gửi qua để ngày hôm nay thêm ngọt ngào 😘', 'daily'),
('Hãy luôn dành cho đối phương những cử chỉ ngọt ngào như nhắc uống đủ nước để luôn tràn đầy năng lượng nhé người thương 💋', 'daily'),
('Đừng quên dành cho người ấy những cử chỉ ngọt ngào như ôm nhẹ từ phía sau để bày tỏ sự trân trọng nhé 🌸', 'daily'),
('Hôm nay bạn hãy hỏi xem hôm nay người ấy có chuyện gì vui không nhé ❤️', 'daily'),
('Hãy luôn dành cho tình yêu của bạn những cử chỉ ngọt ngào như dành một lời khen ngợi chân thành về nụ cười hoặc mái tóc nha người ấy ơi 🥰', 'daily'),
('Thử dành cho nửa kia những cử chỉ ngọt ngào như nhắc nhở ăn uống đúng giờ và giữ gìn sức khỏe nhé để ngày hôm nay thêm ngọt ngào 🥳', 'daily'),
('Hãy chủ động nhường nhịn đối phương một chút nếu có bất đồng nhỏ nhé 💋', 'daily'),
('Hãy luôn dành cho tình yêu của bạn những cử chỉ ngọt ngào như nhắn tin hỏi thăm xem có mệt không nhé để ngày hôm nay thêm ngọt ngào ✨', 'daily'),
('Hãy luôn dành cho người ấy những cử chỉ ngọt ngào như cùng nhau chụp một tấm ảnh tự sướng mới nhất nhé nửa kia yêu dấu 💫', 'daily'),
('Hôm nay bạn hãy khen ngợi phong cách ăn mặc hoặc mùi nước hoa hôm nay 🥰', 'daily'),
('Dành một chút thời gian hôm nay để nắm tay thật chặt khi cùng nhau đi bộ dưới phố 🧸', 'daily'),
('Hãy chủ động lên kế hoạch cho một buổi hẹn hò lãng mạn cuối tuần này 🍿', 'daily'),
('Đừng quên dành cho đối phương những cử chỉ ngọt ngào như gửi một lời chúc ngủ ngon thật ấm áp và dễ thương nhé nửa kia yêu dấu 💕', 'daily'),
('Thử dành cho nửa kia những cử chỉ ngọt ngào như tạo một bất ngờ nho nhỏ bằng cách đặt đồ ăn gửi qua nha tình yêu 💫', 'daily'),
('Hãy dành thời gian dành cho người thương những cử chỉ ngọt ngào như hỏi xem hôm nay người ấy có chuyện gì vui không nhé người thương 🍿', 'daily'),
('Hãy chủ động gửi một bài hát ngọt ngào mà bạn vô tình nghe thấy 💫', 'daily'),
('Đừng quên dành cho tình yêu của bạn những cử chỉ ngọt ngào như dành cho nhau 10 phút nói chuyện hoàn toàn không bấm điện thoại nha người ấy ơi ✨', 'daily'),
('Hãy dành thời gian dành cho nửa kia những cử chỉ ngọt ngào như hỏi xem có cần bạn giúp đỡ việc gì không nhé đó 🎁', 'daily'),
('Đừng quên dành cho tình yêu của bạn những cử chỉ ngọt ngào như hỏi xem hôm nay người ấy có chuyện gì vui không nhé để tình cảm thêm bền chặt 💖', 'daily'),
('Hãy chủ động chia sẻ một bức ảnh cũ chụp chung của hai đứa nhé 🧸', 'daily'),
('Hôm nay là ngày tuyệt vời để khen ngợi phong cách ăn mặc hoặc mùi nước hoa hôm nay 😘', 'daily'),
('Dành một chút thời gian hôm nay để nhắc uống đủ nước để luôn tràn đầy năng lượng nhé 🍀', 'daily'),
('Hãy dành cho người thương những cử chỉ ngọt ngào như chuẩn bị một viên kẹo ngọt hoặc món quà nhỏ bỏ vào túi áo nhé để ngày hôm nay thêm ngọt ngào 💕', 'daily'),
('Hôm nay bạn hãy động viên và cổ vũ cho những nỗ lực hôm nay của người ấy nhé ✨', 'daily'),
('Dành một chút thời gian hôm nay để kiên nhẫn lắng nghe những tâm sự nhỏ to sau ngày làm việc 🍀', 'daily'),
('Đừng quên dành cho người ấy những cử chỉ ngọt ngào như tạo một bất ngờ nho nhỏ bằng cách đặt đồ ăn gửi qua nha 💖', 'daily'),
('Hôm nay là ngày tuyệt vời để dành một lời khen ngợi chân thành về nụ cười hoặc mái tóc 🤝', 'daily'),
('Hãy luôn dành cho đối phương những cử chỉ ngọt ngào như gửi một nhãn dán (sticker) thật đáng yêu và tinh nghịch để tình cảm thêm bền chặt 🧸', 'daily'),
('Hãy dành thời gian dành cho tình yêu của bạn những cử chỉ ngọt ngào như kiên nhẫn lắng nghe những tâm sự nhỏ to sau ngày làm việc nha ❤️', 'daily'),
('Hôm nay bạn hãy cùng nhau chụp một tấm ảnh tự sướng mới nhất nhé 💖', 'daily'),
('Hôm nay là ngày tuyệt vời để hôn nhẹ lên trán để thể hiện sự chở che yêu thương 🍀', 'daily'),
('Hãy luôn dành cho người thương những cử chỉ ngọt ngào như gửi một cái ôm thật ấm áp qua tin nhắn nhé 💖', 'daily'),
('Hôm nay hãy gọi điện thoại chỉ để nghe giọng nói quen thuộc 🥳', 'daily'),
('Hãy luôn dành cho đối phương những cử chỉ ngọt ngào như gửi một bài hát ngọt ngào mà bạn vô tình nghe thấy nha người thương 🤗', 'daily'),
('Hãy luôn dành cho người thương những cử chỉ ngọt ngào như khen ngợi phong cách ăn mặc hoặc mùi nước hoa hôm nay để tình cảm thêm bền chặt 🌷', 'daily'),
('Hôm nay hãy cùng nhau chụp một tấm ảnh tự sướng mới nhất nhé 🥤', 'daily'),
('Hãy chủ động dành một lời khen ngợi chân thành về nụ cười hoặc mái tóc 😍', 'daily'),
('Hôm nay bạn hãy cùng nhau chụp một tấm ảnh tự sướng mới nhất nhé ✨', 'daily'),
('Hãy chủ động kiên nhẫn lắng nghe những tâm sự nhỏ to sau ngày làm việc 🥰', 'daily'),
('Hôm nay hãy rủ đi uống trà sữa hoặc ăn món ăn vặt yêu thích ✨', 'daily'),
('Hãy chủ động gửi một tin nhắn ngọt ngào để bắt đầu ngày mới 💕', 'daily'),
('Thử dành cho tình yêu của bạn những cử chỉ ngọt ngào như khen ngợi phong cách ăn mặc hoặc mùi nước hoa hôm nay nha tình yêu 💕', 'daily'),
('Hãy chủ động rủ đi uống trà sữa hoặc ăn món ăn vặt yêu thích 🍀', 'daily'),
('Hãy luôn dành cho người thương những cử chỉ ngọt ngào như chia sẻ một bức ảnh cũ chụp chung của hai đứa nhé tình yêu 🧸', 'daily'),
('Hôm nay là ngày tuyệt vời để gửi một tin nhắn ngọt ngào để bắt đầu ngày mới 😍', 'daily'),
('Hôm nay hãy động viên và cổ vũ cho những nỗ lực hôm nay của người ấy nhé 🥳', 'daily'),
('Hãy luôn dành cho người ấy những cử chỉ ngọt ngào như gửi một tin nhắn ngọt ngào để bắt đầu ngày mới đó ☀️', 'daily'),
('Hãy luôn dành cho đối phương những cử chỉ ngọt ngào như gửi một nhãn dán (sticker) thật đáng yêu và tinh nghịch nha tình yêu 💫', 'daily'),
('Hôm nay bạn hãy chia sẻ một câu chuyện vui vẻ bạn gặp hôm nay 🧸', 'daily'),
('Thử dành cho người thương những cử chỉ ngọt ngào như viết một mẩu giấy nhớ ngọt ngào gửi kèm nhé người ấy ơi 🤝', 'daily'),
('Đừng quên dành cho nửa kia những cử chỉ ngọt ngào như chuẩn bị một viên kẹo ngọt hoặc món quà nhỏ bỏ vào túi áo nhé để ngày hôm nay thêm ngọt ngào 😘', 'daily'),
('Hãy chủ động cùng nhau chụp một tấm ảnh tự sướng mới nhất nhé 💕', 'daily'),
('Đừng quên dành cho người thương những cử chỉ ngọt ngào như lên kế hoạch cho một buổi hẹn hò lãng mạn cuối tuần này nhé 🥤', 'daily'),
('Hôm nay là ngày tuyệt vời để nhắn tin hỏi thăm xem có mệt không nhé 🤗', 'daily'),
('Hôm nay bạn hãy ôm nhẹ từ phía sau để bày tỏ sự trân trọng 💕', 'daily'),
('Đừng quên dành cho nửa kia những cử chỉ ngọt ngào như động viên và cổ vũ cho những nỗ lực hôm nay của người ấy nhé tình yêu của anh/em 😍', 'daily'),
('Đừng quên dành cho nửa kia những cử chỉ ngọt ngào như gửi một lời chúc ngủ ngon thật ấm áp và dễ thương nha người ấy ơi 💕', 'daily'),
('Hôm nay bạn hãy nhường nhịn đối phương một chút nếu có bất đồng nhỏ nhé 🥰', 'daily'),
('Hãy dành thời gian dành cho người ấy những cử chỉ ngọt ngào như gọi điện thoại chỉ để nghe giọng nói quen thuộc để ngày hôm nay thêm ngọt ngào 🧸', 'daily'),
('Hãy dành cho nửa kia những cử chỉ ngọt ngào như nhắc nhở đi ngủ sớm để giữ gìn nhan sắc và sức khỏe nhé tình yêu 💋', 'daily'),
('Hãy dành cho nửa kia những cử chỉ ngọt ngào như nhắn tin hỏi thăm xem có mệt không nhé để tình cảm thêm bền chặt 💫', 'daily'),
('Dành một chút thời gian hôm nay để hôn nhẹ lên trán để thể hiện sự chở che yêu thương 💖', 'daily'),
('Hãy chủ động hỏi xem có cần bạn giúp đỡ việc gì không nhé 🌸', 'daily'),
('Hôm nay hãy hỏi xem hôm nay người ấy có chuyện gì vui không nhé 😍', 'daily'),
('Hãy dành thời gian dành cho nửa kia những cử chỉ ngọt ngào như khen ngợi phong cách ăn mặc hoặc mùi nước hoa hôm nay nhé nửa kia yêu dấu 🥳', 'daily'),
('Dành một chút thời gian hôm nay để nhắn tin hỏi thăm xem có mệt không nhé 🌸', 'daily'),
('Đừng quên dành cho người ấy những cử chỉ ngọt ngào như gọi điện thoại chỉ để nghe giọng nói quen thuộc để tình cảm thêm bền chặt 💫', 'daily'),
('Hãy dành thời gian dành cho tình yêu của bạn những cử chỉ ngọt ngào như nhường nhịn đối phương một chút nếu có bất đồng nhỏ nhé người thương 🌷', 'daily'),
('Hãy chủ động nắm tay thật chặt khi cùng nhau đi bộ dưới phố ❤️', 'daily'),
('Hãy luôn dành cho tình yêu của bạn những cử chỉ ngọt ngào như nhường nhịn đối phương một chút nếu có bất đồng nhỏ nhé 😘', 'daily'),
('Thử dành cho nửa kia những cử chỉ ngọt ngào như lên kế hoạch cho một buổi hẹn hò lãng mạn cuối tuần này nhé 🥰', 'daily'),
('Dành một chút thời gian hôm nay để chuẩn bị một viên kẹo ngọt hoặc món quà nhỏ bỏ vào túi áo nhé 🍀', 'daily'),
('Hãy dành thời gian dành cho người thương những cử chỉ ngọt ngào như hỏi xem hôm nay người ấy có chuyện gì vui không nhé tình yêu 🍿', 'daily'),
('Hôm nay là ngày tuyệt vời để gửi một bài hát ngọt ngào mà bạn vô tình nghe thấy 🥳', 'daily'),
('Hôm nay hãy nhắc uống đủ nước để luôn tràn đầy năng lượng nhé 💫', 'daily'),
('Hãy dành cho tình yêu của bạn những cử chỉ ngọt ngào như chia sẻ một câu chuyện vui vẻ bạn gặp hôm nay nha người thương 🌷', 'daily'),
('Hãy luôn dành cho đối phương những cử chỉ ngọt ngào như khen ngợi phong cách ăn mặc hoặc mùi nước hoa hôm nay để ngày hôm nay thêm ngọt ngào 😘', 'daily'),
('Thử dành cho người ấy những cử chỉ ngọt ngào như dành một lời khen ngợi chân thành về nụ cười hoặc mái tóc đó 💫', 'daily'),
('Thử dành cho người thương những cử chỉ ngọt ngào như động viên và cổ vũ cho những nỗ lực hôm nay của người ấy nhé để ngày hôm nay thêm ngọt ngào 🧸', 'daily'),
('Dành một chút thời gian hôm nay để nhường nhịn đối phương một chút nếu có bất đồng nhỏ nhé 💋', 'daily'),
('Hôm nay hãy hỏi xem hôm nay người ấy có chuyện gì vui không nhé ❤️', 'daily'),
('Hôm nay hãy hôn nhẹ lên trán để thể hiện sự chở che yêu thương 💖', 'daily'),
('Thử dành cho nửa kia những cử chỉ ngọt ngào như nắm tay thật chặt khi cùng nhau đi bộ dưới phố nhé 🍀', 'daily'),
('Hãy dành thời gian dành cho người thương những cử chỉ ngọt ngào như tạo một bất ngờ nho nhỏ bằng cách đặt đồ ăn gửi qua nha 💫', 'daily'),
('Hôm nay là ngày tuyệt vời để nhường nhịn đối phương một chút nếu có bất đồng nhỏ nhé 🤗', 'daily'),
('Thử dành cho nửa kia những cử chỉ ngọt ngào như gửi một lời chúc ngủ ngon thật ấm áp và dễ thương nhé ❤️', 'daily'),
('Thử dành cho đối phương những cử chỉ ngọt ngào như khen ngợi phong cách ăn mặc hoặc mùi nước hoa hôm nay để tình cảm thêm bền chặt 🌷', 'daily'),
('Hãy dành cho đối phương những cử chỉ ngọt ngào như nắm tay thật chặt khi cùng nhau đi bộ dưới phố nhé nửa kia yêu dấu 🥰', 'daily'),
('Thử dành cho tình yêu của bạn những cử chỉ ngọt ngào như nhắn tin hỏi thăm xem có mệt không nhé người thương ✨', 'daily'),
('Hôm nay là ngày tuyệt vời để gọi điện thoại chỉ để nghe giọng nói quen thuộc 🍿', 'daily'),
('Hôm nay bạn hãy cùng nhau chụp một tấm ảnh tự sướng mới nhất nhé 💕', 'daily'),
('Thử dành cho người thương những cử chỉ ngọt ngào như kiên nhẫn lắng nghe những tâm sự nhỏ to sau ngày làm việc nha người ấy ơi 😘', 'daily'),
('Thử dành cho người thương những cử chỉ ngọt ngào như rủ đi uống trà sữa hoặc ăn món ăn vặt yêu thích để ngày hôm nay thêm ngọt ngào 🤗', 'daily'),
('Hãy dành thời gian dành cho tình yêu của bạn những cử chỉ ngọt ngào như dành cho nhau 10 phút nói chuyện hoàn toàn không bấm điện thoại nhé 🥰', 'daily'),
('Hãy dành thời gian dành cho người thương những cử chỉ ngọt ngào như nắm tay thật chặt khi cùng nhau đi bộ dưới phố để ngày hôm nay thêm ngọt ngào 🥳', 'daily'),
('Đừng quên dành cho người thương những cử chỉ ngọt ngào như dành một lời khen ngợi chân thành về nụ cười hoặc mái tóc nha tình yêu 💋', 'daily'),
('Hôm nay bạn hãy cùng nhau chụp một tấm ảnh tự sướng mới nhất nhé ☀️', 'daily'),
('Hãy dành cho người ấy những cử chỉ ngọt ngào như gửi một lời chúc ngủ ngon thật ấm áp và dễ thương nha 🍿', 'daily'),
('Hôm nay là ngày tuyệt vời để nhắn tin hỏi thăm xem có mệt không nhé 💋', 'daily'),
('Hôm nay hãy cùng nhau chụp một tấm ảnh tự sướng mới nhất nhé 🤗', 'daily'),
('Đừng quên dành cho nửa kia những cử chỉ ngọt ngào như dành một lời khen ngợi chân thành về nụ cười hoặc mái tóc nha 🍀', 'daily'),
('Hãy dành thời gian dành cho tình yêu của bạn những cử chỉ ngọt ngào như chia sẻ một câu chuyện vui vẻ bạn gặp hôm nay nha người ấy ơi 🥰', 'daily'),
('Hãy dành cho tình yêu của bạn những cử chỉ ngọt ngào như lên kế hoạch cho một buổi hẹn hò lãng mạn cuối tuần này để ngày hôm nay thêm ngọt ngào 🍀', 'daily'),
('Hãy luôn dành cho tình yêu của bạn những cử chỉ ngọt ngào như nhắn tin hỏi thăm xem có mệt không nhé nửa kia yêu dấu 🥰', 'daily'),
('Thử dành cho đối phương những cử chỉ ngọt ngào như viết một mẩu giấy nhớ ngọt ngào gửi kèm nhé 🍿', 'daily'),
('Hôm nay bạn hãy gửi một lời chúc ngủ ngon thật ấm áp và dễ thương 😍', 'daily'),
('Hôm nay bạn hãy nhắn tin hỏi thăm xem có mệt không nhé ☀️', 'daily'),
('Hôm nay là ngày tuyệt vời để hỏi xem hôm nay người ấy có chuyện gì vui không nhé 🍀', 'daily'),
('Hãy dành thời gian dành cho tình yêu của bạn những cử chỉ ngọt ngào như nắm tay thật chặt khi cùng nhau đi bộ dưới phố để ngày hôm nay thêm ngọt ngào 🍀', 'daily'),
('Hãy dành thời gian dành cho tình yêu của bạn những cử chỉ ngọt ngào như rủ đi uống trà sữa hoặc ăn món ăn vặt yêu thích nhé 🧸', 'daily'),
('Hãy luôn dành cho nửa kia những cử chỉ ngọt ngào như rủ đi uống trà sữa hoặc ăn món ăn vặt yêu thích nha 😍', 'daily'),
('Đừng quên dành cho người ấy những cử chỉ ngọt ngào như gửi một bài hát ngọt ngào mà bạn vô tình nghe thấy nha người thương 🥤', 'daily');

INSERT INTO public.daily_wishes (content, type, special_month, special_day, special_event) VALUES
('Chúc mừng Ngày Lễ Tình Nhân Valentine! 💕 Cảm ơn em vì đã là nửa kia hoàn hảo nhất của anh. Anh yêu em mãi mãi!', 'special', 2, 14, 'valentine'),
('Giáng Sinh ấm áp bên em! 🎄 Chúc tình yêu của chúng mình luôn rực rỡ và ấm áp như những ngọn nến đêm Noel.', 'special', 12, 25, 'christmas'),
('Chúc mừng Ngày Quốc tế Phụ nữ 8/3! 💐 Gửi tới người con gái anh yêu những lời chúc tốt đẹp nhất, em luôn là bông hoa đẹp nhất trong lòng anh.', 'special', 3, 8, 'womens_day'),
('Chúc mừng Ngày Phụ nữ Việt Nam 20/10! 💕 Chúc em luôn xinh đẹp, hạnh phúc và bình yên bên anh nhé!', 'special', 10, 20, 'vietnamese_womens_day'),
('Happy New Year! 🎆 Chúc mừng năm mới tình yêu của anh! Mong rằng chúng ta sẽ cùng nhau đi qua thêm nhiều năm tháng tuyệt vời nữa.', 'special', 1, 1, 'new_year');


-- ==========================================
-- BẢNG 17: TRAVEL LOCATIONS (ĐỊA ĐIỂM DU LỊCH)
-- ==========================================
CREATE TABLE travel_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'province', -- 'province' (Tỉnh/Thành phố VN) hoặc 'country' (Quốc gia)
    country VARCHAR(100) DEFAULT 'Việt Nam', -- Mặc định là Việt Nam
    image_url TEXT, -- Link ảnh đại diện cho địa điểm
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE travel_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "travel_locations_select" ON public.travel_locations FOR SELECT USING (true);


-- ==========================================
-- BẢNG 18: TRAVEL TRIPS (CHUYẾN ĐI CỦA CẶP ĐÔI)
-- ==========================================
CREATE TABLE travel_trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
    location_id INT REFERENCES travel_locations(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL, -- Tên chuyến đi (VD: Tuần trăng mật, Chơi lễ 30/4)
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT, -- Lời nhắc hoặc kỷ niệm
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE travel_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "travel_trips_select" ON public.travel_trips
    FOR SELECT USING (
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE user_1_id = auth.uid() OR user_2_id = auth.uid()
        )
    );

CREATE POLICY "travel_trips_insert" ON public.travel_trips
    FOR INSERT WITH CHECK (
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE user_1_id = auth.uid() OR user_2_id = auth.uid()
        )
    );

CREATE POLICY "travel_trips_update" ON public.travel_trips
    FOR UPDATE USING (
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE user_1_id = auth.uid() OR user_2_id = auth.uid()
        )
    );

CREATE POLICY "travel_trips_delete" ON public.travel_trips
    FOR DELETE USING (
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE user_1_id = auth.uid() OR user_2_id = auth.uid()
        )
    );


-- ==========================================
-- HOÀN TẤT ✅
-- ==========================================
