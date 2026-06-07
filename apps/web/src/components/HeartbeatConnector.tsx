import React, { useEffect, useRef } from 'react';
import { Cake, PartyPopper } from 'lucide-react';

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

interface SparkleParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  maxOpacity: number;
  life: number;
  decay: number;
  color: string;
  type: number; // 0: Star, 1: Heart, 2: Dot
  rotation: number;
  rotationSpeed: number;
}

const CustomPartyPopper: React.FC<{ size?: number }> = ({ size = 42 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ display: 'block' }}>
      <g transform="translate(-2, -4)">
        {/* Streamers */}
        <path d="M18,18 C16,10 24,6 20,2" fill="none" stroke="#FFDAC1" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M22,22 C32,16 28,10 36,8" fill="none" stroke="#B5EAD7" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M20,20 C28,14 36,24 38,16" fill="none" stroke="#ff6584" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Mini Stars */}
        <g transform="translate(6, 4) scale(0.6)">
          <path d="M12,2 L15,9 L22,9 L16,14 L18,21 L12,17 L6,21 L8,14 L2,9 L9,9 Z" fill="#FFE57F" stroke="#3D2F3D" strokeWidth="2" strokeLinejoin="round" />
        </g>
        <g transform="translate(26, 0) scale(0.4) rotate(15)">
          <path d="M12,2 L15,9 L22,9 L16,14 L18,21 L12,17 L6,21 L8,14 L2,9 L9,9 Z" fill="#ff6584" stroke="#3D2F3D" strokeWidth="2.5" strokeLinejoin="round" />
        </g>

        {/* Confetti dots */}
        <circle cx="28" cy="14" r="2.5" fill="#FFB7B2" stroke="#3D2F3D" strokeWidth="1.5" />
        <circle cx="14" cy="12" r="2" fill="#B5EAD7" stroke="#3D2F3D" strokeWidth="1.5" />
        <circle cx="34" cy="22" r="2" fill="#FFE57F" stroke="#3D2F3D" strokeWidth="1.5" />
      </g>

      {/* Cone Shadow */}
      <path d="M7,35 L17,13 L29,25 Z" fill="rgba(61, 47, 61, 0.15)" />

      {/* Cone (Fatter) */}
      <path d="M6,34 L16,12 L28,24 Z" fill="#FFE57F" stroke="#3D2F3D" strokeWidth="2.5" strokeLinejoin="round" />
      
      {/* Cone Stripe */}
      <polygon points="11,23 14,17 22,27 17,29" fill="#ff6584" stroke="#3D2F3D" strokeWidth="2" strokeLinejoin="round" />
      
      {/* Popper String Base */}
      <path d="M6,34 L2,38" fill="none" stroke="#3D2F3D" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="2" cy="38" r="1.5" fill="#B5EAD7" stroke="#3D2F3D" strokeWidth="1.5" />
    </svg>
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sparklesRef = useRef<SparkleParticle[]>([]);

  const colors = ['#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#FFE57F'];
  const strokeColor = '#3D2F3D';

  const generateSparkle = (initial = false): SparkleParticle => {
    const angle = Math.random() * 2 * Math.PI;
    const radius = 45 + Math.random() * 65;
    const randVal = Math.random();
    let type = 0;
    if (randVal < 0.4) {
      type = 0; // star
    } else if (randVal < 0.75) {
      type = 1; // heart
    } else {
      type = 2; // dot
    }

    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = type === 1 ? 8 + Math.random() * 6 : 6 + Math.random() * 5;

    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      size,
      speedX: Math.cos(angle) * 0.3 + (Math.random() - 0.5) * 0.2,
      speedY: Math.sin(angle) * 0.3 - 0.3 - Math.random() * 0.2,
      opacity: initial ? Math.random() : 0.0,
      maxOpacity: 0.6 + Math.random() * 0.4,
      life: Math.random(),
      decay: 0.007 + Math.random() * 0.01,
      color,
      type,
      rotation: Math.random() * 2 * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 0.03,
    };
  };

  // Click handler to trigger bubble explosion
  const handleHeartClick = () => {
    const newSparkles = [...sparklesRef.current];
    for (let i = 0; i < 8; i++) {
      newSparkles.push(generateSparkle(false));
    }
    sparklesRef.current = newSparkles;
  };

  useEffect(() => {
    // Generate initial sparkles
    const initialSparkles = Array.from({ length: 16 }, () => generateSparkle(true));
    sparklesRef.current = initialSparkles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let pulseProgress = 0.0;

    const resizeCanvas = () => {
      if (containerRef.current && canvas) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = 240;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Helpers to draw paths
    const getCubicBezierPoint = (t: number, p0: number, p1: number, p2: number, p3: number) => {
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * t;
      return uuu * p0 + 3 * uu * t * p1 + 3 * u * tt * p2 + ttt * p3;
    };

    const drawStar = (c: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number, color: string) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      c.beginPath();
      c.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        c.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        c.lineTo(x, y);
        rot += step;
      }
      c.lineTo(cx, cy - outerRadius);
      c.closePath();
      c.fillStyle = color;
      c.fill();
      c.lineWidth = 1.5;
      c.strokeStyle = strokeColor;
      c.stroke();
    };

    const drawHeart = (c: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) => {
      c.save();
      c.translate(cx, cy);
      c.beginPath();
      c.moveTo(0, -size / 4);
      c.bezierCurveTo(-size / 2, -size / 2 - size / 4, -size, -size / 4, 0, size);
      c.bezierCurveTo(size, -size / 4, size / 2, -size / 2 - size / 4, 0, -size / 4);
      c.closePath();
      c.fillStyle = color;
      c.fill();
      c.lineWidth = 1.5;
      c.strokeStyle = strokeColor;
      c.stroke();
      c.restore();
    };

    const draw = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const sideOffset = width * 0.16;
      const leftX = sideOffset;
      const rightX = width - sideOffset;
      const centerY = 100;

      // 1. Draw connecting scribble lines
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(46, 35, 37, 0.2)';

      // S-curve Path definition
      const drawCurve = (offsetY: number, color: string, strokeW: number) => {
        ctx.beginPath();
        ctx.moveTo(leftX, centerY + offsetY);
        ctx.bezierCurveTo(
          leftX + 60, centerY + 35 + offsetY,
          width / 2 - 60, centerY - 35 + offsetY,
          width / 2, centerY + offsetY
        );
        ctx.bezierCurveTo(
          width / 2 + 60, centerY + 35 + offsetY,
          rightX - 60, centerY - 35 + offsetY,
          rightX, centerY + offsetY
        );
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeW;
        ctx.stroke();
      };

      // Background thick line
      drawCurve(0, 'rgba(46, 35, 37, 0.2)', 2.0);
      // Sketchy offset line
      drawCurve(-1.2, 'rgba(46, 35, 37, 0.08)', 1.0);

      // 2. Draw energy pulses running along the curve
      pulseProgress = (pulseProgress + 0.005) % 1.0;
      const getPositionOnCurve = (prog: number) => {
        // Two bezier curves
        if (prog < 0.5) {
          const t = prog * 2;
          return {
            x: getCubicBezierPoint(t, leftX, leftX + 60, width / 2 - 60, width / 2),
            y: getCubicBezierPoint(t, centerY, centerY + 35, centerY - 35, centerY),
          };
        } else {
          const t = (prog - 0.5) * 2;
          return {
            x: getCubicBezierPoint(t, width / 2, width / 2 + 60, rightX - 60, rightX),
            y: getCubicBezierPoint(t, centerY, centerY + 35, centerY - 35, centerY),
          };
        }
      };

      // Left-to-right pulse (Pink)
      const p1 = getPositionOnCurve(pulseProgress);
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 6.0, 0, 2 * Math.PI);
      ctx.fillStyle = strokeColor;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFB7B2';
      ctx.fill();

      // Right-to-left pulse (Mint)
      const p2 = getPositionOnCurve(1.0 - pulseProgress);
      ctx.beginPath();
      ctx.arc(p2.x, p2.y, 6.0, 0, 2 * Math.PI);
      ctx.fillStyle = strokeColor;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p2.x, p2.y, 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#B5EAD7';
      ctx.fill();

      // 3. Update & Draw Sparkles
      const activeSparkles = sparklesRef.current.map(s => {
        const updated = { ...s };
        updated.x += s.speedX;
        updated.y += s.speedY;
        updated.life -= s.decay;
        updated.rotation += s.rotationSpeed;

        if (updated.life > 0.7) {
          updated.opacity = ((1.0 - updated.life) / 0.3) * s.maxOpacity;
        } else {
          updated.opacity = (updated.life / 0.7) * s.maxOpacity;
        }

        return updated;
      });

      // Filter dead particles and respawn if necessary
      const cleanedSparkles = activeSparkles.map(s => (s.life <= 0 ? generateSparkle(false) : s));
      sparklesRef.current = cleanedSparkles;

      // Draw sparkles
      cleanedSparkles.forEach(s => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, s.opacity));
        const px = width / 2 + s.x;
        const py = 90 + s.y;

        if (s.type === 0) {
          // Star
          ctx.translate(px, py);
          ctx.rotate(s.rotation);
          drawStar(ctx, 0, 0, 5, s.size, s.size / 2, s.color);
        } else if (s.type === 1) {
          // Heart
          drawHeart(ctx, px, py, s.size, s.color);
        } else {
          // Dot
          ctx.beginPath();
          ctx.arc(px, py, s.size / 2, 0, 2 * Math.PI);
          ctx.fillStyle = s.color;
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = strokeColor;
          ctx.stroke();
        }
        ctx.restore();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const formatDob = (dobStr?: string) => {
    if (!dobStr) return null;
    const date = new Date(dobStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  const getZodiacSign = (dobStr: string): string => {
    const date = new Date(dobStr);
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
    const dob = new Date(dobStr);
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
    <div ref={containerRef} style={{ width: '100%', height: '240px', position: 'relative' }}>
      {/* 1. Canvas Background */}
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '240px' }} />

      {/* 2. User 1 Avatar (Left) */}
      <div
        style={{
          position: 'absolute',
          left: 'calc(16% - 42px)',
          top: '49px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        {/* Birthday Ring */}
        <div
          style={{
            position: 'relative',
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 101, 132, 0.03)',
            boxShadow: '0 0 10px rgba(255, 101, 132, 0.1)',
          }}
        >
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              transform: 'rotate(-90deg)',
            }}
            viewBox="0 0 84 84"
          >
            <circle
              cx="42"
              cy="42"
              r="39"
              fill="none"
              stroke="#ff6584"
              strokeWidth="2"
              strokeDasharray="4,4"
              opacity="0.25"
            />
            <circle
              cx="42"
              cy="42"
              r="39"
              fill="none"
              stroke="#ff6584"
              strokeWidth="2.5"
              strokeDasharray={2 * Math.PI * 39}
              strokeDashoffset={2 * Math.PI * 39 * (1 - user1Progress)}
              strokeLinecap="round"
            />
          </svg>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              border: `2.2px solid ${strokeColor}`,
              backgroundColor: 'white',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              zIndex: 2,
            }}
          >
            {user1Avatar ? (
              <img src={user1Avatar} alt={user1Name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ fontSize: '28px', backgroundColor: '#FCE4EC', width: '100%', height: '100%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                👦
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            marginTop: '10px',
            padding: '4px 12px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: `1.8px solid ${strokeColor}`,
            boxShadow: `2.5px 2.5px 0px ${strokeColor}`,
            fontWeight: 'bold',
            fontSize: '11px',
            color: strokeColor,
            whiteSpace: 'nowrap',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          <span>{user1Name}</span>
          {user1Dob && (
            <span style={{ fontSize: '9px', color: '#ff6584', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Cake size={10} color="#ff6584" strokeWidth={2.5} /> {formatDob(user1Dob)} ({getZodiacSign(user1Dob)})
            </span>
          )}
        </div>
      </div>

      {/* 3. Center Heart Sticker Centering Wrapper */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '25px',
          transform: 'translateX(-50%)',
          width: '120px',
          height: '120px',
          zIndex: 20,
        }}
      >
        {/* Pulsing element inside centering wrapper */}
        <div
          className="pulse-animation hover:scale-105 transition-transform duration-200 cursor-pointer w-full h-full relative"
          onClick={handleHeartClick}
        >
          {isCelebrationDay && (
            <div
              style={{
                position: 'absolute',
                top: '-10px',
                right: '-12px',
                zIndex: 30,
                transform: 'rotate(12deg)',
              }}
            >
              <CustomPartyPopper size={46} />
            </div>
          )}
          <svg
            viewBox="-10 -10 120 120"
            style={{
              width: '100%',
              height: '100%',
              filter: `drop-shadow(3.5px 3.5px 0px ${strokeColor})`,
              display: 'block',
            }}
          >
            <defs>
              {/* Rich gradient overlay for premium sticker look */}
              <linearGradient id="stickerHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff8a9f" />
                <stop offset="30%" stopColor="#ff6584" />
                <stop offset="100%" stopColor="#d83a5c" />
              </linearGradient>
            </defs>

            {/* Sticker White Outline */}
            <path
              d="M50,15 C35,3 15,3 5,18 C-5,33 0,58 50,93 C100,58 105,33 95,18 C85,3 65,3 50,15 Z"
              fill="white"
              stroke={strokeColor}
              strokeWidth="5.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Heart Body */}
            <path
              d="M50,15 C35,3 15,3 5,18 C-5,33 0,58 50,93 C100,58 105,33 95,18 C85,3 65,3 50,15 Z"
              fill="url(#stickerHeartGrad)"
              stroke={strokeColor}
              strokeWidth="3.2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Premium gloss shine reflection */}
            <path
              d="M18,25 A 12 12 0 0 1 38,17"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.9"
            />

            {/* Secondary micro-gloss dot */}
            <circle cx="16" cy="35" r="2.5" fill="white" opacity="0.8" />
          </svg>

          {/* Text Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: '10px',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                fontSize: '25px',
                fontWeight: 900,
                color: 'white',
                letterSpacing: '-0.5px',
                textShadow: `2.5px 2.5px 0px ${strokeColor}`,
              }}
            >
              {days}
            </div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#FFF0F2',
                letterSpacing: '0.5px',
                textShadow: `1.5px 1.5px 0px ${strokeColor}`,
                marginTop: '-2px',
              }}
            >
              ngày
            </div>
          </div>
        </div>
      </div>

      {/* 4. Partner Avatar (Right) */}
      <div
        style={{
          position: 'absolute',
          right: 'calc(16% - 42px)',
          top: '49px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        {/* Birthday Ring */}
        <div
          style={{
            position: 'relative',
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 101, 132, 0.03)',
            boxShadow: '0 0 10px rgba(255, 101, 132, 0.1)',
          }}
        >
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              transform: 'rotate(-90deg)',
            }}
            viewBox="0 0 84 84"
          >
            <circle
              cx="42"
              cy="42"
              r="39"
              fill="none"
              stroke="#ff6584"
              strokeWidth="2"
              strokeDasharray="4,4"
              opacity="0.25"
            />
            <circle
              cx="42"
              cy="42"
              r="39"
              fill="none"
              stroke="#ff6584"
              strokeWidth="2.5"
              strokeDasharray={2 * Math.PI * 39}
              strokeDashoffset={2 * Math.PI * 39 * (1 - user2Progress)}
              strokeLinecap="round"
            />
          </svg>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              border: `2.2px solid ${strokeColor}`,
              backgroundColor: 'white',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              zIndex: 2,
            }}
          >
            {user2Avatar ? (
              <img src={user2Avatar} alt={user2Name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ fontSize: '28px', backgroundColor: '#FCE4EC', width: '100%', height: '100%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                👧
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            marginTop: '10px',
            padding: '4px 12px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: `1.8px solid ${strokeColor}`,
            boxShadow: `2.5px 2.5px 0px ${strokeColor}`,
            fontWeight: 'bold',
            fontSize: '11px',
            color: strokeColor,
            whiteSpace: 'nowrap',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          <span>{user2Name}</span>
          {user2Dob && (
            <span style={{ fontSize: '9px', color: '#ff6584', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Cake size={10} color="#ff6584" strokeWidth={2.5} /> {formatDob(user2Dob)} ({getZodiacSign(user2Dob)})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
