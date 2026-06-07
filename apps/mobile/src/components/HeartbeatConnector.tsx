import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G, Polygon } from 'react-native-svg';
import { Cake } from 'lucide-react-native';

interface HeartbeatConnectorProps {
  days: number;
  user1Avatar: string;
  user2Avatar: string;
  user1Name: string;
  user2Name: string;
  user1Dob?: string;
  user2Dob?: string;
  isCelebrationDay?: boolean;
}

interface AnimatedSparkle {
  id: number;
  animX: Animated.Value;
  animY: Animated.Value;
  animOpacity: Animated.Value;
  animScale: Animated.Value;
  size: number;
  color: string;
  type: number;
  rotation: string;
}

const colors = ['#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#FFE57F'];
const strokeColor = '#3D2F3D';

// Custom designed flat party popper sticker icon (avoiding native 3D OS emojis)
export const CustomPartyPopper: React.FC<{ size?: number }> = ({ size = 42 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <G transform="translate(-2, -4)">
        {/* Streamers */}
        <Path d="M18,18 C16,10 24,6 20,2" fill="none" stroke="#FFDAC1" strokeWidth={2.5} strokeLinecap="round" />
        <Path d="M22,22 C32,16 28,10 36,8" fill="none" stroke="#B5EAD7" strokeWidth={2.5} strokeLinecap="round" />
        <Path d="M20,20 C28,14 36,24 38,16" fill="none" stroke="#ff6584" strokeWidth={2.5} strokeLinecap="round" />
        
        {/* Mini Stars */}
        <G transform="translate(6, 4) scale(0.6)">
          <Path d="M12,2 L15,9 L22,9 L16,14 L18,21 L12,17 L6,21 L8,14 L2,9 L9,9 Z" fill="#FFE57F" stroke="#3D2F3D" strokeWidth={2} strokeLinejoin="round" />
        </G>
        <G transform="translate(26, 0) scale(0.4) rotate(15)">
          <Path d="M12,2 L15,9 L22,9 L16,14 L18,21 L12,17 L6,21 L8,14 L2,9 L9,9 Z" fill="#ff6584" stroke="#3D2F3D" strokeWidth={2.5} strokeLinejoin="round" />
        </G>

        {/* Confetti dots */}
        <Circle cx={28} cy={14} r={2.5} fill="#FFB7B2" stroke="#3D2F3D" strokeWidth={1.5} />
        <Circle cx={14} cy={12} r={2} fill="#B5EAD7" stroke="#3D2F3D" strokeWidth={1.5} />
        <Circle cx={34} cy={22} r={2} fill="#FFE57F" stroke="#3D2F3D" strokeWidth={1.5} />
      </G>

      {/* Cone Shadow */}
      <Path d="M7,35 L17,13 L29,25 Z" fill="rgba(61, 47, 61, 0.15)" />

      {/* Cone (Fatter) */}
      <Path d="M6,34 L16,12 L28,24 Z" fill="#FFE57F" stroke="#3D2F3D" strokeWidth={2.5} strokeLinejoin="round" />
      
      {/* Cone Stripe */}
      <Polygon points="11,23 14,17 22,27 17,29" fill="#ff6584" stroke="#3D2F3D" strokeWidth={2} strokeLinejoin="round" />
      
      {/* Popper String Base */}
      <Path d="M6,34 L2,38" fill="none" stroke="#3D2F3D" strokeWidth={2.5} strokeLinecap="round" />
      <Circle cx={2} cy={38} r={1.5} fill="#B5EAD7" stroke="#3D2F3D" strokeWidth={1.5} />
    </Svg>
  );
};

export const HeartbeatConnector: React.FC<HeartbeatConnectorProps> = ({
  days,
  user1Avatar,
  user2Avatar,
  user1Name,
  user2Name,
  user1Dob,
  user2Dob,
  isCelebrationDay,
}) => {
  const containerWidth = Dimensions.get('window').width - 40;
  const leftX = containerWidth * 0.16;
  const rightX = containerWidth - leftX;
  const centerY = 100;

  const [pulseProgress, setPulseProgress] = useState(0);

  // Pool of 64 particles (16 for idle, 48 for burst pool)
  const animatedSparkles = useRef<AnimatedSparkle[]>(
    Array.from({ length: 64 }, (_, idx) => {
      const type = Math.floor(Math.random() * 3); // 0: Star, 1: Heart, 2: Dot
      // Make particles slightly bigger initially
      const size = type === 1 ? 14 + Math.random() * 8 : 10 + Math.random() * 6;
      const color = colors[Math.floor(Math.random() * colors.length)];
      return {
        id: idx,
        animX: new Animated.Value(0),
        animY: new Animated.Value(0),
        animOpacity: new Animated.Value(0),
        animScale: new Animated.Value(1),
        size,
        color,
        type,
        rotation: `${(Math.random() * 2 * Math.PI).toFixed(2)}rad`,
      };
    })
  ).current;

  const burstIdxRef = useRef(16);

  const runSparkleAnimation = (idx: number, isBurst = false) => {
    const sparkle = animatedSparkles[idx];

    // Stop current
    sparkle.animX.stopAnimation();
    sparkle.animY.stopAnimation();
    sparkle.animOpacity.stopAnimation();
    sparkle.animScale.stopAnimation();

    // Reset
    sparkle.animX.setValue(0);
    sparkle.animY.setValue(0);
    sparkle.animOpacity.setValue(isBurst ? 1 : 0);
    sparkle.animScale.setValue(isBurst ? 1 : 1);

    const angle = Math.random() * 2 * Math.PI;
    const distance = isBurst ? 60 + Math.random() * 100 : 35 + Math.random() * 55;
    const targetX = Math.cos(angle) * distance;
    const targetY = Math.sin(angle) * distance - (isBurst ? 10 : 20); // slightly float upwards

    const duration = isBurst ? 600 + Math.random() * 400 : 1600 + Math.random() * 800;

    Animated.parallel([
      Animated.timing(sparkle.animX, {
        toValue: targetX,
        duration: duration,
        easing: isBurst ? Easing.out(Easing.cubic) : Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(sparkle.animY, {
        toValue: targetY,
        duration: duration,
        easing: isBurst ? Easing.out(Easing.cubic) : Easing.linear,
        useNativeDriver: true,
      }),
      isBurst ? 
        Animated.timing(sparkle.animOpacity, {
          toValue: 0,
          duration: duration,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        })
      :
        Animated.sequence([
          Animated.timing(sparkle.animOpacity, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(sparkle.animOpacity, {
            toValue: 0,
            duration: duration - 200,
            useNativeDriver: true,
          }),
        ]),
      Animated.timing(sparkle.animScale, {
        toValue: isBurst ? 0.4 : 0.1, // Burst particles don't shrink as much
        duration: duration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (!isBurst) {
        // loop indefinitely with a random delay to stagger
        setTimeout(() => {
          runSparkleAnimation(idx, false);
        }, Math.random() * 1200);
      }
    });
  };

  const handleHeartClick = () => {
    // Take 16 particles from the burst pool for a bigger explosion
    let startIdx = burstIdxRef.current;
    for (let i = 0; i < 16; i++) {
      let currentIdx = startIdx + i;
      if (currentIdx >= animatedSparkles.length) {
        currentIdx = 16 + (currentIdx % (animatedSparkles.length - 16)); // wrap around the burst pool
      }
      runSparkleAnimation(currentIdx, true);
    }
    burstIdxRef.current = startIdx + 16 >= animatedSparkles.length ? 16 : startIdx + 16;
  };

  useEffect(() => {
    // Start continuous staggers on mount for idle particles (0 to 15)
    animatedSparkles.slice(0, 16).forEach((_, idx) => {
      setTimeout(() => {
        runSparkleAnimation(idx, false);
      }, idx * 150);
    });

    // Connector pulse timer loop (just updates curve pulses, very light)
    let progress = 0;
    const interval = setInterval(() => {
      progress = (progress + 0.008) % 1.0;
      setPulseProgress(progress);
    }, 32);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Cubic Bezier path helpers
  const getCubicBezierPoint = (t: number, p0: number, p1: number, p2: number, p3: number) => {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
  };

  const getPositionOnCurve = (prog: number) => {
    if (prog < 0.5) {
      const t = prog * 2;
      return {
        x: getCubicBezierPoint(t, leftX, leftX + 60, containerWidth / 2 - 60, containerWidth / 2),
        y: getCubicBezierPoint(t, centerY, centerY + 35, centerY - 35, centerY),
      };
    } else {
      const t = (prog - 0.5) * 2;
      return {
        x: getCubicBezierPoint(t, containerWidth / 2, containerWidth / 2 + 60, rightX - 60, rightX),
        y: getCubicBezierPoint(t, centerY, centerY + 35, centerY - 35, centerY),
      };
    }
  };

  // Pulse coordinate calculations
  const pulse1 = getPositionOnCurve(pulseProgress);
  const pulse2 = getPositionOnCurve(1.0 - pulseProgress);

  // SVG Path Strings
  const pathD = `M ${leftX} ${centerY} C ${leftX + 60} ${centerY + 35}, ${containerWidth / 2 - 60} ${centerY - 35}, ${containerWidth / 2} ${centerY} C ${containerWidth / 2 + 60} ${centerY + 35}, ${rightX - 60} ${centerY - 35}, ${rightX} ${centerY}`;
  const pathDSketch = `M ${leftX} ${centerY - 1.2} C ${leftX + 60.5} ${centerY + 33.8}, ${containerWidth / 2 - 59.5} ${centerY - 36.2}, ${containerWidth / 2} ${centerY - 1.2} C ${containerWidth / 2 + 60.5} ${centerY + 33.8}, ${rightX - 59.5} ${centerY - 36.2}, ${rightX} ${centerY - 1.2}`;

  const parseSafeDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    return null;
  };

  const formatDob = (dobStr?: string) => {
    if (!dobStr) return null;
    const date = parseSafeDate(dobStr);
    if (!date) return null;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  const getZodiacSign = (dobStr: string): string => {
    const date = parseSafeDate(dobStr);
    if (!date) return '';
    const day = date.getDate();
    const month = date.getMonth() + 1;
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Bạch Dương';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Kim Ngưu';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Song Tử';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cự Giải';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Sư Tử';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Xử Nữ';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Thiên Bình';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Thiên Yết';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Nhân Mã';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Ma Kết';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Bảo Bình';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Song Ngư';
    return '';
  };

  const calculateBirthdayProgress = (dobStr?: string): number => {
    if (!dobStr) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dob = parseSafeDate(dobStr);
    if (!dob) return 0;
    let nextBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    if (nextBday.getTime() < today.getTime()) {
      nextBday.setFullYear(today.getFullYear() + 1);
    }
    const prevBday = new Date(nextBday);
    prevBday.setFullYear(nextBday.getFullYear() - 1);
    const totalDays = (nextBday.getTime() - prevBday.getTime()) / (1000 * 60 * 60 * 24);
    const daysRemaining = (nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    const progress = 1 - (daysRemaining / totalDays);
    return Math.max(0, Math.min(1, progress));
  };

  const user1Progress = calculateBirthdayProgress(user1Dob);
  const user2Progress = calculateBirthdayProgress(user2Dob);

  return (
    <View style={[styles.container, { width: containerWidth }]}>
      {/* 1. Svg curves and running pulses */}
      <Svg style={StyleSheet.absoluteFill}>
        {/* Main connectors */}
        <Path d={pathD} fill="none" stroke="rgba(61, 47, 61, 0.2)" strokeWidth={2.0} strokeLinecap="round" />
        <Path d={pathDSketch} fill="none" stroke="rgba(61, 47, 61, 0.08)" strokeWidth={1.0} />

        {/* Pulse 1: Left to Right (Pink) */}
        <Circle cx={pulse1.x} cy={pulse1.y} r={6} fill={strokeColor} />
        <Circle cx={pulse1.x} cy={pulse1.y} r={4.5} fill="#FFB7B2" />

        {/* Pulse 2: Right to Left (Mint) */}
        <Circle cx={pulse2.x} cy={pulse2.y} r={6} fill={strokeColor} />
        <Circle cx={pulse2.x} cy={pulse2.y} r={4.5} fill="#B5EAD7" />
      </Svg>

      {/* 2. Sparkles particles */}
      {animatedSparkles.map((s) => {
        // Position relative to the center of the heart
        // Heart is width 116, height 116, top 27, center is top 85, left containerWidth / 2
        const px = containerWidth / 2 - s.size / 2;
        const py = 85 - s.size / 2;

        return (
          <Animated.View
            key={s.id}
            style={[
              styles.sparkle,
              {
                left: px,
                top: py,
                width: s.size,
                height: s.size,
                opacity: s.animOpacity,
                transform: [
                  { translateX: s.animX },
                  { translateY: s.animY },
                  { scale: s.animScale },
                  { rotate: s.rotation },
                ],
              },
            ]}
          >
            <Svg width="100%" height="100%" viewBox={s.type === 0 ? "0 0 24 24" : s.type === 1 ? "0 0 100 100" : "0 0 24 24"}>
              {s.type === 0 && (
                <Path
                  d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"
                  fill={s.color}
                  stroke={strokeColor}
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              )}
              {s.type === 1 && (
                <Path
                  d="M50,22 C12,-5 -12,42 50,88 C112,42 88,-5 50,22 Z"
                  fill={s.color}
                  stroke={strokeColor}
                  strokeWidth="8"
                  strokeLinejoin="round"
                />
              )}
              {s.type === 2 && (
                <Circle
                  cx="12"
                  cy="12"
                  r="9"
                  fill={s.color}
                  stroke={strokeColor}
                  strokeWidth="2"
                />
              )}
            </Svg>
          </Animated.View>
        );
      })}

      {/* 3. User Avatar (Left) */}
      <View style={[styles.avatarContainer, { left: leftX - 50 }]}>
        <View style={styles.avatarFrameContainer}>
          <Svg width={84} height={84} style={{ position: 'absolute', top: 0, left: 0 }} viewBox="0 0 84 84">
            <Circle
              cx={42}
              cy={42}
              r={39}
              fill="none"
              stroke="#ff6584"
              strokeWidth={2}
              strokeDasharray={[4, 4]}
              opacity={0.25}
            />
            <G transform="rotate(-90 42 42)">
              <Circle
                cx={42}
                cy={42}
                r={39}
                fill="none"
                stroke="#ff6584"
                strokeWidth={2.5}
                strokeDasharray={[2 * Math.PI * 39, 2 * Math.PI * 39]}
                strokeDashoffset={2 * Math.PI * 39 * (1 - user1Progress)}
                strokeLinecap="round"
              />
            </G>
          </Svg>
          <View style={styles.avatarFrame}>
            {user1Avatar ? (
              <Image source={{ uri: user1Avatar }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarImg, styles.fallbackAvatar, { backgroundColor: '#FCE4EC' }]}>
                <Text style={styles.avatarEmoji}>👦</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.stickerLabel}>
          <Text style={styles.stickerText}>{user1Name}</Text>
          {user1Dob ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
              <Cake size={10} color="#ff6584" strokeWidth={2.5} />
              <Text style={styles.dobText}>{formatDob(user1Dob)} ({getZodiacSign(user1Dob)})</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* 4. Pulsing Center Heart */}
      <View style={styles.heartWrapper}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleHeartClick}
          style={StyleSheet.absoluteFill}
        >
          {isCelebrationDay && (
            <View style={{ position: 'absolute', top: -10, right: -12, zIndex: 30, transform: [{ rotate: '12deg' }] }}>
              <CustomPartyPopper size={46} />
            </View>
          )}
          <Svg
            viewBox="-10 -10 120 120"
            style={{
              width: '100%',
              height: '100%',
            }}
          >
            <Defs>
              <LinearGradient id="stickerHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#ff8a9f" />
                <Stop offset="30%" stopColor="#ff6584" />
                <Stop offset="100%" stopColor="#d83a5c" />
              </LinearGradient>
            </Defs>

            {/* Sticker Shadow */}
            <Path
              d="M50,15 C35,3 15,3 5,18 C-5,33 0,58 50,93 C100,58 105,33 95,18 C85,3 65,3 50,15 Z"
              fill="rgba(46, 35, 37, 0.12)"
              transform="translate(3.5, 3.5)"
            />

            {/* Sticker White Outline */}
            <Path
              d="M50,15 C35,3 15,3 5,18 C-5,33 0,58 50,93 C100,58 105,33 95,18 C85,3 65,3 50,15 Z"
              fill="white"
              stroke={strokeColor}
              strokeWidth="5.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Heart Body */}
            <Path
              d="M50,15 C35,3 15,3 5,18 C-5,33 0,58 50,93 C100,58 105,33 95,18 C85,3 65,3 50,15 Z"
              fill="url(#stickerHeartGrad)"
              stroke={strokeColor}
              strokeWidth="3.2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Premium gloss shine reflection */}
            <Path
              d="M18,25 A 12 12 0 0 1 38,17"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.9"
            />

            {/* Secondary micro-gloss dot */}
            <Circle cx="16" cy="35" r="2.5" fill="white" opacity="0.8" />
          </Svg>

          {/* Text Overlay */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 12,
            }}
          >
            <Text style={styles.heartDaysText}>{days}</Text>
            <Text style={styles.heartUnitText}>ngày</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 5. Partner Avatar (Right) */}
      <View style={[styles.avatarContainer, { right: leftX - 50 }]}>
        <View style={styles.avatarFrameContainer}>
          <Svg width={84} height={84} style={{ position: 'absolute', top: 0, left: 0 }} viewBox="0 0 84 84">
            <Circle
              cx={42}
              cy={42}
              r={39}
              fill="none"
              stroke="#ff6584"
              strokeWidth={2}
              strokeDasharray={[4, 4]}
              opacity={0.25}
            />
            <G transform="rotate(-90 42 42)">
              <Circle
                cx={42}
                cy={42}
                r={39}
                fill="none"
                stroke="#ff6584"
                strokeWidth={2.5}
                strokeDasharray={[2 * Math.PI * 39, 2 * Math.PI * 39]}
                strokeDashoffset={2 * Math.PI * 39 * (1 - user2Progress)}
                strokeLinecap="round"
              />
            </G>
          </Svg>
          <View style={styles.avatarFrame}>
            {user2Avatar ? (
              <Image source={{ uri: user2Avatar }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarImg, styles.fallbackAvatar, { backgroundColor: '#FCE4EC' }]}>
                <Text style={styles.avatarEmoji}>👦</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.stickerLabel}>
          <Text style={styles.stickerText}>{user2Name}</Text>
          {user2Dob ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
              <Cake size={10} color="#ff6584" strokeWidth={2.5} />
              <Text style={styles.dobText}>{formatDob(user2Dob)} ({getZodiacSign(user2Dob)})</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 240,
    position: 'relative',
    alignSelf: 'center',
  },
  sparkle: {
    position: 'absolute',
  },
  avatarContainer: {
    position: 'absolute',
    top: 55,
    alignItems: 'center',
    zIndex: 10,
    width: 100,
  },
  avatarFrame: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.2,
    borderColor: strokeColor,
    backgroundColor: 'white',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  avatarFrameContainer: {
    position: 'relative',
    width: 84,
    height: 84,
    borderRadius: 42,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 101, 132, 0.03)',
  },
  birthdayBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: strokeColor,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: strokeColor,
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
    zIndex: 11,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
  },
  fallbackAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  stickerLabel: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1.8,
    borderColor: strokeColor,
    shadowColor: strokeColor,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
    minWidth: 80,
    maxWidth: 100,
    alignItems: 'center',
  },
  stickerText: {
    fontWeight: '800',
    fontSize: 10,
    color: strokeColor,
    textAlign: 'center',
  },
  dobText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ff6584',
    marginTop: 0,
  },
  heartWrapper: {
    position: 'absolute',
    left: '50%',
    top: 27,
    marginLeft: -58,
    width: 116,
    height: 116,
    zIndex: 20,
  },
  heartSticker: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#FF6584',
    borderWidth: 3.2,
    borderColor: strokeColor,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  heartShadow: {
    backgroundColor: 'rgba(46, 35, 37, 0.12)',
    borderColor: 'transparent',
    borderWidth: 0,
    transform: [{ translateX: 2.5 }, { translateY: 2.5 }],
  },
  heartDaysText: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    textShadowColor: strokeColor,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  heartUnitText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF0F2',
    textShadowColor: strokeColor,
    textShadowOffset: { width: 1.5, height: 1.5 },
    textShadowRadius: 0,
    marginTop: -2,
  },
});
export default HeartbeatConnector;
