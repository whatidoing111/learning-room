import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Thermometer, MapPin } from 'lucide-react';

const weatherCodeMap: Record<number, { label: string; icon: typeof Sun }> = {
  0: { label: '晴朗', icon: Sun },
  1: { label: '大部晴朗', icon: Sun },
  2: { label: '多云', icon: Cloud },
  3: { label: '阴天', icon: Cloud },
  45: { label: '雾', icon: Cloud },
  48: { label: '雾凇', icon: Cloud },
  51: { label: '小毛毛雨', icon: CloudRain },
  53: { label: '毛毛雨', icon: CloudRain },
  55: { label: '大毛毛雨', icon: CloudRain },
  61: { label: '小雨', icon: CloudRain },
  63: { label: '中雨', icon: CloudRain },
  65: { label: '大雨', icon: CloudRain },
  71: { label: '小雪', icon: CloudSnow },
  73: { label: '中雪', icon: CloudSnow },
  75: { label: '大雪', icon: CloudSnow },
  80: { label: '阵雨', icon: CloudRain },
  81: { label: '中阵雨', icon: CloudRain },
  82: { label: '大阵雨', icon: CloudRain },
  95: { label: '雷暴', icon: CloudLightning },
  96: { label: '雷暴伴冰雹', icon: CloudLightning },
  99: { label: '强雷暴', icon: CloudLightning },
};

interface WeatherData {
  temperature: number;
  weatherCode: number;
  humidity: number;
  windSpeed: number;
  locationName: string;
}

export default function ParallaxClock() {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { stiffness: 150, damping: 30, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const layer1X = useTransform(smoothX, (v) => v * -15);
  const layer1Y = useTransform(smoothY, (v) => v * -10);
  const layer2X = useTransform(smoothX, (v) => v * -8);
  const layer2Y = useTransform(smoothY, (v) => v * -5);
  const layer3X = useTransform(smoothX, (v) => v * -3);
  const layer3Y = useTransform(smoothY, (v) => v * -2);
  const glowX = useTransform(smoothX, (v) => v * 20);
  const glowY = useTransform(smoothY, (v) => v * 15);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX / innerWidth - 0.5) * 2;
    const y = (e.clientY / innerHeight - 0.5) * 2;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) { reject(new Error('no geo')); return; }
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        const { latitude, longitude } = pos.coords;

        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=&latitude=${latitude}&longitude=${longitude}&count=1`
        );

        let locationName = `${latitude.toFixed(1)}°N ${longitude.toFixed(1)}°E`;
        try {
          const nominatimRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=zh-CN`
          );
          const nominatimData = await nominatimRes.json();
          const addr = nominatimData.address;
          locationName = addr?.city || addr?.town || addr?.county || addr?.state || locationName;
        } catch {}

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m`
        );
        const data = await weatherRes.json();
        const current = data.current;

        setWeather({
          temperature: Math.round(current.temperature_2m),
          weatherCode: current.weather_code,
          humidity: current.relative_humidity_2m,
          windSpeed: Math.round(current.wind_speed_10m),
          locationName,
        });
      } catch {
        setWeather({
          temperature: 22,
          weatherCode: 0,
          humidity: 60,
          windSpeed: 10,
          locationName: '未知地区',
        });
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const dateStr = `${time.getFullYear()}年${time.getMonth() + 1}月${time.getDate()}日 ${weekDays[time.getDay()]}`;

  const weatherInfo = weather ? weatherCodeMap[weather.weatherCode] ?? { label: '未知', icon: Cloud } : { label: '--', icon: Cloud };
  const WeatherIcon = weatherInfo.icon;

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ perspective: '1000px' }}>
      <motion.div
        className="relative flex flex-col items-center gap-6 pointer-events-auto select-none"
        style={{ x: layer2X, y: layer2Y, transformStyle: 'preserve-3d' }}
      >
        <motion.div
          className="absolute -inset-24 rounded-full opacity-40 blur-3xl"
          style={{
            x: glowX,
            y: glowY,
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          }}
        />

        <motion.div className="relative flex flex-col items-center" style={{ x: layer1X, y: layer1Y, transformStyle: 'preserve-3d' }}>
          <motion.span
            className="text-8xl font-extralight tracking-tight text-white"
            style={{
              fontVariantNumeric: 'tabular-nums',
              textShadow: '0 0 60px rgba(255,255,255,0.15), 0 0 120px rgba(255,255,255,0.05)',
            }}
          >
            {hours}:{minutes}
          </motion.span>
          <motion.span
            className="absolute -right-8 top-2 text-2xl font-extralight text-white/40"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {seconds}
          </motion.span>
        </motion.div>

        <motion.div className="relative flex flex-col items-center gap-1" style={{ x: layer3X, y: layer3Y }}>
          <span className="text-sm font-light tracking-widest text-white/60">{dateStr}</span>
        </motion.div>

        {!weatherLoading && weather && (
          <motion.div
            className="relative flex items-center gap-5 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-md"
            style={{ x: layer2X, y: layer2Y }}
          >
            <div className="flex items-center gap-2">
              <WeatherIcon size={20} className="text-white/70" />
              <span className="text-sm text-white/60">{weatherInfo.label}</span>
            </div>

            <div className="h-6 w-px bg-white/10" />

            <div className="flex items-center gap-1.5">
              <Thermometer size={15} className="text-orange-400/70" />
              <span className="text-lg font-light text-white/80" style={{ fontVariantNumeric: 'tabular-nums' }}>{weather.temperature}°C</span>
            </div>

            <div className="h-6 w-px bg-white/10" />

            <div className="flex items-center gap-3 text-xs text-white/40">
              <span className="flex items-center gap-1">
                <Droplets size={12} /> {weather.humidity}%
              </span>
              <span className="flex items-center gap-1">
                <Wind size={12} /> {weather.windSpeed}km/h
              </span>
            </div>

            <div className="h-6 w-px bg-white/10" />

            <span className="flex items-center gap-1 text-xs text-white/40">
              <MapPin size={12} /> {weather.locationName}
            </span>
          </motion.div>
        )}

        {weatherLoading && (
          <motion.div
            className="relative flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-md"
            style={{ x: layer2X, y: layer2Y }}
          >
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
            <span className="text-xs text-white/40">获取天气中…</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
