export interface ZodiacSign {
    id: number;
    name: string;
    english_name: string;
    date_range: string;
    element: string;
    modality: string;
    ruling_planet: string;
    lucky_colors: string;
    description: string;
    image_url: string;
    start_month: number | null;
    start_day: number | null;
    end_month: number | null;
    end_day: number | null;
}
export interface ZodiacCriteria {
    id: number;
    criteria_name: string;
    category: string;
    icon_url: string;
}
export interface ZodiacDetail {
    id: number;
    zodiac_id: number;
    topic: string;
    title: string;
    content: string;
    is_premium: boolean;
}
export interface ZodiacMatch {
    id: number;
    zodiac_sign_1_id: number;
    zodiac_sign_2_id: number;
    match_score: number;
    love_analysis: string;
    friendship_analysis: string;
}
export interface ZodiacAttribute {
    id: number;
    zodiac_id: number;
    criteria_id: number;
    score: number;
    description: string;
}
export declare const MOCK_ZODIAC_SIGNS: ZodiacSign[];
export declare const MOCK_ZODIAC_CRITERIA: ZodiacCriteria[];
export declare const MOCK_ZODIAC_DETAILS: ZodiacDetail[];
export declare const MOCK_ZODIAC_MATCHES: ZodiacMatch[];
export declare const MOCK_ZODIAC_ATTRIBUTES: ZodiacAttribute[];
