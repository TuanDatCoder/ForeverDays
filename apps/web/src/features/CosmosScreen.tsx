import React, { useState, useEffect } from 'react';
import { ZodiacService, getZodiacSignIdFromDob } from '@forever-days/core';
import type {
  ZodiacSign,
  ZodiacCriteria,
  ZodiacDetail,
  ZodiacMatch,
  ZodiacAttribute
} from '@forever-days/core';
import {
  Sparkles,
  Heart,
  BookOpen,
  ArrowRightLeft,
  Info,
  HelpCircle
} from 'lucide-react';
import { useRelationship } from '../core/RelationshipContext';

const zodiacService = new ZodiacService();

export const CosmosScreen: React.FC = () => {
  const { user, partner } = useRelationship();
  const [activeTab, setActiveTab] = useState<'compatibility' | 'meanings'>('compatibility');
  const [signs, setSigns] = useState<ZodiacSign[]>([]);
  const [criteria, setCriteria] = useState<ZodiacCriteria[]>([]);
  
  // Calculate zodiac sign IDs from date of birth (or use defaults if not set)
  const userZodiacId = getZodiacSignIdFromDob(user?.dob);
  const partnerZodiacId = partner?.dob 
    ? getZodiacSignIdFromDob(partner.dob)
    : (userZodiacId === 3 ? 10 : 3); // Avoid identical default fallback

  const sign1Id = userZodiacId;
  const sign2Id = partnerZodiacId;

  // Tab 1: Compatibility States
  const [match, setMatch] = useState<ZodiacMatch | null>(null);
  const [attributes, setAttributes] = useState<ZodiacAttribute[]>([]);
  const [loadingMatch, setLoadingMatch] = useState<boolean>(false);

  // Tab 2: Meanings States
  const [selectedSignId, setSelectedSignId] = useState<number | null>(null);
  const [details, setDetails] = useState<ZodiacDetail[]>([]);
  const [activeTopic, setActiveTopic] = useState<string>('');
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // Fetch signs and criteria on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const signsData = await zodiacService.fetchZodiacSigns();
        const criteriaData = await zodiacService.fetchZodiacCriteria();
        setSigns(signsData);
        setCriteria(criteriaData);
        setSelectedSignId(userZodiacId);
      } catch (err) {
        console.error('Failed to initialize Cosmos data:', err);
      }
    };
    initData();
  }, [userZodiacId]);

  // Fetch match details when sign selections change
  useEffect(() => {
    if (activeTab !== 'compatibility') return;
    const fetchMatchInfo = async () => {
      setLoadingMatch(true);
      try {
        const matchData = await zodiacService.fetchZodiacMatch(sign1Id, sign2Id);
        const attrsData = await zodiacService.fetchZodiacAttributes(sign1Id, sign2Id);
        setMatch(matchData);
        setAttributes(attrsData);
      } catch (err) {
        console.error('Failed to fetch match information:', err);
      } finally {
        setLoadingMatch(false);
      }
    };
    fetchMatchInfo();
  }, [sign1Id, sign2Id, activeTab]);

  // Fetch zodiac details when sign selected in meanings tab
  useEffect(() => {
    if (!selectedSignId) return;
    const fetchDetailsInfo = async () => {
      setLoadingDetails(true);
      try {
        const detailsData = await zodiacService.fetchZodiacDetails(selectedSignId);
        setDetails(detailsData);
        if (detailsData.length > 0) {
          // Pre-select first topic or keep current if valid
          const topics = detailsData.map(d => d.topic);
          if (!topics.includes(activeTopic)) {
            setActiveTopic(topics[0]);
          }
        } else {
          setActiveTopic('');
        }
      } catch (err) {
        console.error('Failed to fetch zodiac details:', err);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetailsInfo();
  }, [selectedSignId]);

  const sign1 = signs.find(s => s.id === sign1Id);
  const sign2 = signs.find(s => s.id === sign2Id);
  const selectedSign = signs.find(s => s.id === selectedSignId);

  // Group attributes by criteria category
  const categories = Array.from(new Set(criteria.map(c => c.category)));

  // Custom styling utilities
  const getElementBadgeClass = (element: string) => {
    switch (element) {
      case 'Lửa': return 'bg-amber-100 text-amber-700 border-amber-400';
      case 'Nước': return 'bg-blue-100 text-blue-700 border-blue-400';
      case 'Đất': return 'bg-emerald-100 text-emerald-700 border-emerald-400';
      case 'Khí': return 'bg-purple-100 text-purple-700 border-purple-400';
      default: return 'bg-gray-100 text-gray-700 border-gray-400';
    }
  };

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-2 border-border-color bg-white p-6 rounded-2xl shadow-neo">
        <div className="flex items-center gap-4">
          <div className="bg-primary-coral p-3 rounded-xl border-2 border-border-color text-white shadow-neo-hover">
            <Sparkles size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">
              Góc Vũ Trụ
            </h1>
            <p className="text-sm font-bold text-text-secondary mt-0.5">
              Khám phá độ hợp cạ và ý nghĩa sâu sắc của các chòm sao hoàng đạo
            </p>
          </div>
        </div>

        {/* Tab Toggle buttons */}
        <div className="flex bg-bg-primary border-2 border-border-color rounded-xl p-1 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('compatibility')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black text-xs md:text-sm transition-all cursor-pointer ${
              activeTab === 'compatibility'
                ? 'bg-primary-coral text-white border-2 border-border-color shadow-neo-hover'
                : 'text-text-secondary hover:text-text-primary border-2 border-transparent'
            }`}
          >
            <Heart size={16} fill={activeTab === 'compatibility' ? 'white' : 'none'} />
            <span>So khớp cung</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('meanings');
              setSelectedSignId(userZodiacId);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black text-xs md:text-sm transition-all cursor-pointer ${
              activeTab === 'meanings'
                ? 'bg-primary-coral text-white border-2 border-border-color shadow-neo-hover'
                : 'text-text-secondary hover:text-text-primary border-2 border-transparent'
            }`}
          >
            <BookOpen size={16} />
            <span>Ý nghĩa 12 cung</span>
          </button>
        </div>
      </div>

      {/* COMPATIBILITY TAB */}
      {activeTab === 'compatibility' && (
        <div className="flex flex-col gap-6">
          {/* Sign Selectors and Score Board */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Sign 1 Info */}
            <div className="flex flex-col gap-2 bg-white border-2 border-border-color p-5 rounded-2xl shadow-neo">
              <label className="text-[10px] font-black uppercase tracking-wider text-primary-coral">Cung của bạn</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border-2 border-border-color bg-bg-primary overflow-hidden shrink-0 flex items-center justify-center">
                  {sign1?.image_url ? (
                    <img src={sign1.image_url} alt={sign1.name} className="w-full h-full object-cover scale-110" />
                  ) : (
                    <HelpCircle size={28} className="text-text-secondary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-bg-primary border-2 border-border-color px-3 py-2 rounded-xl font-black text-sm text-text-primary">
                    {sign1?.name || 'Đang tải...'}
                  </div>
                  {sign1 && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border border-border-color ${getElementBadgeClass(sign1.element)}`}>
                        {sign1.element}
                      </span>
                      <span className="text-[10px] font-bold text-text-secondary">
                        {sign1.date_range}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Match Circle Score */}
            <div className="flex flex-col items-center justify-center bg-white border-2 border-border-color p-6 rounded-2xl shadow-neo h-full relative overflow-hidden">
              {loadingMatch ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="w-10 h-10 border-4 border-primary-coral border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-bold text-text-secondary">Đang tính toán...</span>
                </div>
              ) : (
                <>
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    {/* Ring background */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-bg-primary"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-primary-coral transition-all duration-1000 ease-out"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - (match?.match_score || 50) / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-black text-text-primary">
                        {match?.match_score ?? 50}%
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-text-secondary -mt-1">
                        Hòa hợp
                      </span>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 text-primary-coral animate-pulse">
                    <Heart size={16} fill="#ff6584" />
                  </div>
                </>
              )}
            </div>

            {/* Sign 2 Info */}
            <div className="flex flex-col gap-2 bg-white border-2 border-border-color p-5 rounded-2xl shadow-neo">
              <label className="text-[10px] font-black uppercase tracking-wider text-purple-600">Cung của nửa kia</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border-2 border-border-color bg-bg-primary overflow-hidden shrink-0 flex items-center justify-center">
                  {sign2?.image_url ? (
                    <img src={sign2.image_url} alt={sign2.name} className="w-full h-full object-cover scale-110" />
                  ) : (
                    <HelpCircle size={28} className="text-text-secondary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-bg-primary border-2 border-border-color px-3 py-2 rounded-xl font-black text-sm text-text-primary">
                    {sign2?.name || 'Đang tải...'}
                  </div>
                  {sign2 && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border border-border-color ${getElementBadgeClass(sign2.element)}`}>
                        {sign2.element}
                      </span>
                      <span className="text-[10px] font-bold text-text-secondary">
                        {sign2.date_range}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Text details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Love Analysis */}
            <div className="bg-white border-2 border-border-color rounded-2xl p-6 shadow-neo flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-dashed border-border-color/20">
                <div className="bg-rose-100 p-2 rounded-lg text-rose-600 border border-rose-300">
                  <Heart size={18} fill="currentColor" />
                </div>
                <h3 className="text-base font-black text-text-primary">Góc Độ Tình Yêu</h3>
              </div>
              <p className="text-sm font-bold text-text-secondary leading-relaxed">
                {match?.love_analysis || 'Hai cung hoàng đạo này đang tìm hiểu về mức độ tương hợp. Tình yêu cần sự kiên nhẫn, chia sẻ và thấu cảm từ hai phía.'}
              </p>
            </div>

            {/* Friendship Analysis */}
            <div className="bg-white border-2 border-border-color rounded-2xl p-6 shadow-neo flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-dashed border-border-color/20">
                <div className="bg-sky-100 p-2 rounded-lg text-sky-600 border border-sky-300">
                  <ArrowRightLeft size={18} />
                </div>
                <h3 className="text-base font-black text-text-primary">Góc Độ Tình Bạn</h3>
              </div>
              <p className="text-sm font-bold text-text-secondary leading-relaxed">
                {match?.friendship_analysis || 'Góc độ bạn bè, cộng sự hoặc tri kỷ. Khám phá cách hai cung bổ trợ và bù đắp khuyết điểm cho nhau trong cuộc sống.'}
              </p>
            </div>
          </div>

          {/* Detailed Side-by-Side Trait Bars */}
          <div className="bg-white border-2 border-border-color rounded-2xl p-6 shadow-neo flex flex-col gap-6">
            <div className="text-center pb-4 border-b-2 border-dashed border-border-color/20">
              <h2 className="text-lg md:text-xl font-black text-text-primary">So Sánh Đặc Điểm Tương Quan</h2>
              <p className="text-xs font-bold text-text-secondary mt-1">
                Điểm số chi tiết từ 1 - 10 của {sign1?.name} & {sign2?.name} qua từng tiêu chí
              </p>
            </div>

            {categories.map(cat => {
              // Get criteria for this category
              const catCriteria = criteria.filter(c => c.category === cat);
              
              // Calculate category average difference
              let totalDiff = 0;
              let count = 0;
              catCriteria.forEach(crit => {
                const s1 = attributes.find(a => a.zodiac_id === sign1Id && a.criteria_id === crit.id)?.score || 5;
                const s2 = attributes.find(a => a.zodiac_id === sign2Id && a.criteria_id === crit.id)?.score || 5;
                totalDiff += Math.abs(s1 - s2);
                count++;
              });
              const avgDiff = count > 0 ? totalDiff / count : 0;
              const catMatchScore = Math.max(0, Math.min(100, Math.round(100 - (avgDiff * 11))));

              return (
                <div key={cat} className="flex flex-col gap-4">
                  {/* Category Header */}
                  <div className="flex items-center justify-between bg-bg-primary border-2 border-border-color px-4 py-2 rounded-xl">
                    <span className="text-sm font-black text-text-primary">{cat}</span>
                    <span className="text-xs font-black text-primary-coral">
                      Hợp: {catMatchScore}%
                    </span>
                  </div>

                  {/* Criteria list */}
                  <div className="flex flex-col gap-6 px-1">
                    {catCriteria.map(crit => {
                      // Fetch scores and descriptions
                      const attr1 = attributes.find(a => a.zodiac_id === sign1Id && a.criteria_id === crit.id);
                      const attr2 = attributes.find(a => a.zodiac_id === sign2Id && a.criteria_id === crit.id);

                      const score1 = attr1?.score || 5;
                      const score2 = attr2?.score || 5;

                      return (
                        <div key={crit.id} className="flex flex-col gap-2.5 pb-5 border-b border-dashed border-border-color/10 last:border-0 last:pb-0">
                          {/* Label row */}
                          <div className="grid grid-cols-3 items-center text-center">
                            <span className="text-left font-black text-sm text-primary-coral">
                              {score1}/10
                            </span>
                            <span className="text-xs font-black text-text-primary uppercase tracking-wide">
                              {crit.criteria_name}
                            </span>
                            <span className="text-right font-black text-sm text-purple-600">
                              {score2}/10
                            </span>
                          </div>

                          {/* Interactive Dual Progress Bars */}
                          <div className="grid grid-cols-2 gap-4 items-center h-4">
                            {/* Sign 1 Bar (Left aligned, flows right-to-left) */}
                            <div className="w-full bg-bg-primary h-3 rounded-full border border-border-color overflow-hidden flex justify-end">
                              <div
                                className="bg-primary-coral h-full rounded-full transition-all duration-700"
                                style={{ width: `${score1 * 10}%` }}
                              />
                            </div>
                            {/* Sign 2 Bar (Right aligned, flows left-to-right) */}
                            <div className="w-full bg-bg-primary h-3 rounded-full border border-border-color overflow-hidden">
                              <div
                                className="bg-purple-500 h-full rounded-full transition-all duration-700"
                                style={{ width: `${score2 * 10}%` }}
                              />
                            </div>
                          </div>

                          {/* Description Row */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-text-secondary leading-relaxed mt-1">
                            <div className="bg-bg-primary/50 p-2.5 rounded-lg border border-border-color/10">
                              <span className="text-[10px] font-black text-primary-coral uppercase block mb-1">{sign1?.name}</span>
                              {attr1?.description || 'Đang tải luận giải...'}
                            </div>
                            <div className="bg-bg-primary/50 p-2.5 rounded-lg border border-border-color/10">
                              <span className="text-[10px] font-black text-purple-600 uppercase block mb-1">{sign2?.name}</span>
                              {attr2?.description || 'Đang tải luận giải...'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MEANINGS TAB */}
      {activeTab === 'meanings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 12 Sign Selector Left/Top Panel */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-white border-2 border-border-color p-4 rounded-2xl shadow-neo">
              <h3 className="text-sm font-black text-text-primary uppercase tracking-wider mb-3 pb-2 border-b border-border-color/10">
                12 Cung Hoàng Đạo
              </h3>
              <div className="grid grid-cols-3 gap-2.5">
                {signs.map(s => {
                  const isSelected = selectedSignId === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSignId(s.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary-coral text-white border-border-color shadow-neo-hover'
                          : 'bg-white hover:bg-bg-primary text-text-primary border-transparent'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-border-color bg-bg-primary flex items-center justify-center shrink-0 mb-1">
                        {s.image_url ? (
                          <img src={s.image_url} alt={s.name} className="w-full h-full object-cover scale-110" />
                        ) : (
                          <HelpCircle size={16} />
                        )}
                      </div>
                      <span className="text-[10px] font-black whitespace-nowrap text-ellipsis overflow-hidden w-full text-center">
                        {s.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Details Content Right Panel */}
          <div className="lg:col-span-8 bg-white border-2 border-border-color rounded-2xl p-6 shadow-neo min-h-[500px] flex flex-col gap-6">
            {selectedSign ? (
              <>
                {/* Header Profile details */}
                <div className="flex flex-col sm:flex-row gap-5 items-center pb-5 border-b-2 border-dashed border-border-color/20">
                  <div className="w-24 h-24 rounded-2xl border-2 border-border-color bg-bg-primary overflow-hidden shrink-0 flex items-center justify-center shadow-neo-hover">
                    {selectedSign.image_url ? (
                      <img src={selectedSign.image_url} alt={selectedSign.name} className="w-full h-full object-cover scale-110" />
                    ) : (
                      <HelpCircle size={40} className="text-text-secondary" />
                    )}
                  </div>

                  <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left gap-1">
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <h2 className="text-xl md:text-2xl font-black text-text-primary">
                        {selectedSign.name}
                      </h2>
                      <span className="text-xs font-black text-text-secondary bg-bg-primary border border-border-color/10 px-2 py-0.5 rounded-lg">
                        {selectedSign.english_name}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-text-secondary">
                      Khoảng ngày: <strong className="text-text-primary">{selectedSign.date_range}</strong>
                    </p>

                    <p className="text-xs font-bold text-text-secondary leading-relaxed mt-1 max-w-lg">
                      {selectedSign.description}
                    </p>
                  </div>
                </div>

                {/* Specs Box Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-bg-primary p-3 rounded-xl border border-border-color/20 flex flex-col text-center">
                    <span className="text-[10px] font-black text-text-secondary uppercase">Nguyên tố</span>
                    <span className="text-xs font-black text-text-primary mt-0.5">{selectedSign.element || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="bg-bg-primary p-3 rounded-xl border border-border-color/20 flex flex-col text-center">
                    <span className="text-[10px] font-black text-text-secondary uppercase">Tính chất</span>
                    <span className="text-xs font-black text-text-primary mt-0.5">{selectedSign.modality || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="bg-bg-primary p-3 rounded-xl border border-border-color/20 flex flex-col text-center">
                    <span className="text-[10px] font-black text-text-secondary uppercase">Sao chiếu mệnh</span>
                    <span className="text-xs font-black text-text-primary mt-0.5">{selectedSign.ruling_planet || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="bg-bg-primary p-3 rounded-xl border border-border-color/20 flex flex-col text-center">
                    <span className="text-[10px] font-black text-text-secondary uppercase">Màu may mắn</span>
                    <span className="text-xs font-black text-text-primary mt-0.5">{selectedSign.lucky_colors || 'Chưa cập nhật'}</span>
                  </div>
                </div>

                {/* Details Section Selector Tabs */}
                {loadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-10 h-10 border-4 border-primary-coral border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-text-secondary">Đang tải chi tiết...</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* Topics Buttons */}
                    {details.length > 0 ? (
                      <>
                        <div className="flex flex-wrap gap-2 pb-2 border-b border-border-color/10">
                          {details.map(d => (
                            <button
                              key={d.id}
                              onClick={() => setActiveTopic(d.topic)}
                              className={`px-3 py-1.5 rounded-lg font-black text-xs transition-all cursor-pointer ${
                                activeTopic === d.topic
                                  ? 'bg-primary-coral text-white border-2 border-border-color shadow-neo-hover'
                                  : 'bg-bg-primary text-text-secondary hover:text-text-primary border-2 border-transparent'
                              }`}
                            >
                              {d.topic}
                            </button>
                          ))}
                        </div>

                        {/* Details content */}
                        {details.map(d => {
                          if (d.topic !== activeTopic) return null;
                          return (
                            <div key={d.id} className="flex flex-col gap-3 animation-fade-in">
                              <h3 className="text-base font-black text-text-primary flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary-coral"></span>
                                {d.title}
                              </h3>
                              <p className="text-sm font-bold text-text-secondary leading-relaxed whitespace-pre-line bg-bg-primary p-4 rounded-xl border border-border-color/10">
                                {d.content}
                              </p>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Info size={32} className="text-text-secondary mb-2" />
                        <span className="text-sm font-bold text-text-secondary">Chưa có bài viết chi tiết cho cung này.</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Info size={40} className="text-text-secondary mb-2 animate-bounce" />
                <span className="text-base font-black text-text-primary">Hãy chọn một Cung Hoàng Đạo</span>
                <span className="text-xs font-bold text-text-secondary mt-1">Chọn từ bảng 12 chòm sao bên trái để bắt đầu khám phá</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CosmosScreen;
