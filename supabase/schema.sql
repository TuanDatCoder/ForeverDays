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
-- HOÀN TẤT ✅
-- ==========================================
