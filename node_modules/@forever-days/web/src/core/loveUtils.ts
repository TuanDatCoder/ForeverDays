export interface ZodiacInfo {
  nameVi: string;
  nameEn: string;
  emoji: string;
  dateRange: string;
}

export interface MilestoneItem {
  id?: string;
  title: string;
  targetDate: string; // YYYY-MM-DD
  daysRemaining: number;
  isPassed: boolean;
  type?: 'system' | 'custom';
  yearLabel?: string; // "1 năm", "2 năm"... nếu trùng với mốc năm
  dayCount?: number;  // số ngày gốc (100, 200, ...)
}

export class LoveUtils {
  static calculateDaysSince(startDateStr: string): number {
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  }

  static getZodiacSign(dobStr: string): ZodiacInfo {
    const dob = new Date(dobStr);
    const day = dob.getDate();
    const month = dob.getMonth() + 1;

    switch (month) {
      case 1:  return day < 20 ? { nameVi: 'Ma Kết', nameEn: 'Capricorn', emoji: '♑', dateRange: '22/12 - 19/01' } : { nameVi: 'Bảo Bình', nameEn: 'Aquarius', emoji: '♒', dateRange: '20/01 - 18/02' };
      case 2:  return day < 19 ? { nameVi: 'Bảo Bình', nameEn: 'Aquarius', emoji: '♒', dateRange: '20/01 - 18/02' } : { nameVi: 'Song Ngư', nameEn: 'Pisces', emoji: '♓', dateRange: '19/02 - 20/03' };
      case 3:  return day < 21 ? { nameVi: 'Song Ngư', nameEn: 'Pisces', emoji: '♓', dateRange: '19/02 - 20/03' } : { nameVi: 'Bạch Dương', nameEn: 'Aries', emoji: '♈', dateRange: '21/03 - 19/04' };
      case 4:  return day < 20 ? { nameVi: 'Bạch Dương', nameEn: 'Aries', emoji: '♈', dateRange: '21/03 - 19/04' } : { nameVi: 'Kim Ngưu', nameEn: 'Taurus', emoji: '♉', dateRange: '20/04 - 20/05' };
      case 5:  return day < 21 ? { nameVi: 'Kim Ngưu', nameEn: 'Taurus', emoji: '♉', dateRange: '20/04 - 20/05' } : { nameVi: 'Song Tử', nameEn: 'Gemini', emoji: '♊', dateRange: '21/05 - 20/06' };
      case 6:  return day < 21 ? { nameVi: 'Song Tử', nameEn: 'Gemini', emoji: '♊', dateRange: '21/05 - 20/06' } : { nameVi: 'Cự Giải', nameEn: 'Cancer', emoji: '♋', dateRange: '21/06 - 22/07' };
      case 7:  return day < 23 ? { nameVi: 'Cự Giải', nameEn: 'Cancer', emoji: '♋', dateRange: '21/06 - 22/07' } : { nameVi: 'Sư Tử', nameEn: 'Leo', emoji: '♌', dateRange: '23/07 - 22/08' };
      case 8:  return day < 23 ? { nameVi: 'Sư Tử', nameEn: 'Leo', emoji: '♌', dateRange: '23/07 - 22/08' } : { nameVi: 'Xử Nữ', nameEn: 'Virgo', emoji: '♍', dateRange: '23/08 - 22/09' };
      case 9:  return day < 23 ? { nameVi: 'Xử Nữ', nameEn: 'Virgo', emoji: '♍', dateRange: '23/08 - 22/09' } : { nameVi: 'Thiên Bình', nameEn: 'Libra', emoji: '♎', dateRange: '23/09 - 22/10' };
      case 10: return day < 23 ? { nameVi: 'Thiên Bình', nameEn: 'Libra', emoji: '♎', dateRange: '23/09 - 22/10' } : { nameVi: 'Bọ Cạp', nameEn: 'Scorpio', emoji: '♏', dateRange: '23/10 - 21/11' };
      case 11: return day < 22 ? { nameVi: 'Bọ Cạp', nameEn: 'Scorpio', emoji: '♏', dateRange: '23/10 - 21/11' } : { nameVi: 'Nhân Mã', nameEn: 'Sagittarius', emoji: '♐', dateRange: '22/11 - 21/12' };
      case 12: return day < 22 ? { nameVi: 'Nhân Mã', nameEn: 'Sagittarius', emoji: '♐', dateRange: '22/11 - 21/12' } : { nameVi: 'Ma Kết', nameEn: 'Capricorn', emoji: '♑', dateRange: '22/12 - 19/01' };
      default: return { nameVi: 'Không rõ', nameEn: 'Unknown', emoji: '❓', dateRange: '' };
    }
  }

  static generateSystemMilestones(anniversaryDateStr: string): MilestoneItem[] {
    const anniversary = new Date(anniversaryDateStr);
    anniversary.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const list: MilestoneItem[] = [];

    const toLocalYYYYMMDD = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Map: dateStr -> nhãn năm (để detect mốc ngày trùng với mốc năm)
    const yearMap = new Map<string, string>();
    for (let y = 1; y <= 30; y++) {
      const t = new Date(anniversary);
      t.setFullYear(anniversary.getFullYear() + y);
      yearMap.set(toLocalYYYYMMDD(t), y === 1 ? '1 năm' : `${y} năm`);
    }

    // Mốc ngày: 100, 200, 300, ..., 10000
    for (let days = 100; days <= 10000; days += 100) {
      const target = new Date(anniversary);
      target.setDate(anniversary.getDate() + days);
      const dateStr = toLocalYYYYMMDD(target);
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isPassed = target.getTime() < today.getTime();
      const yearLabel = yearMap.get(dateStr);

      list.push({
        title: `${days} Ngày Yêu Nhau`,
        targetDate: dateStr,
        daysRemaining: isPassed ? 0 : diffDays,
        isPassed,
        type: 'system',
        dayCount: days,
        yearLabel,
      });
    }

    // Mốc năm riêng (khi không trùng bội 100 ngày)
    for (let y = 1; y <= 30; y++) {
      const target = new Date(anniversary);
      target.setFullYear(anniversary.getFullYear() + y);
      const dateStr = toLocalYYYYMMDD(target);
      const alreadyMerged = list.some(m => m.targetDate === dateStr);
      if (!alreadyMerged) {
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isPassed = target.getTime() < today.getTime();
        const label = y === 1 ? '1 năm' : `${y} năm`;
        list.push({
          title: `Kỷ Niệm ${label} Yêu Nhau`,
          targetDate: dateStr,
          daysRemaining: isPassed ? 0 : diffDays,
          isPassed,
          type: 'system',
          yearLabel: label,
        });
      }
    }

    // Valentine gần nhất
    let valentineYear = today.getFullYear();
    let valentine = new Date(valentineYear, 1, 14);
    if (valentine.getTime() <= today.getTime()) {
      valentine = new Date(valentineYear + 1, 1, 14);
    }
    const diffTimeVal = valentine.getTime() - today.getTime();
    list.push({
      title: 'Ngày Lễ Tình Nhân',
      targetDate: toLocalYYYYMMDD(valentine),
      daysRemaining: Math.ceil(diffTimeVal / (1000 * 60 * 60 * 24)),
      isPassed: false,
      type: 'system',
    });

    return list;
  }
}
export default LoveUtils;
