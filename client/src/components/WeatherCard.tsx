import { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { waterOutline } from 'ionicons/icons';

// Bali coordinates (Denpasar area)
const BALI_LAT = -8.3405;
const BALI_LON = 115.0920;

interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  weatherCode: number;
  windSpeed: number;
  isDay: boolean;
  daily: {
    date: string;
    tempMax: number;
    tempMin: number;
    weatherCode: number;
    precipProb: number;
  }[];
}

function getWeatherEmoji(code: number, isDay = true): string {
  if (code === 0) return isDay ? '☀️' : '🌙';
  if (code <= 3) return isDay ? '⛅' : '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 55) return '🌦️';
  if (code <= 65) return '🌧️';
  if (code <= 67) return '🌨️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌧️';
  if (code <= 86) return '🌨️';
  if (code >= 95) return '⛈️';
  return '☁️';
}

function getWeatherDesc(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 55) return 'Drizzle';
  if (code <= 65) return 'Rainy';
  if (code <= 67) return 'Freezing Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
}

const WeatherCard: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${BALI_LAT}&longitude=${BALI_LON}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=Asia/Makassar&forecast_days=3`;
      const res = await fetch(url);
      const data = await res.json();

      setWeather({
        temp: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        weatherCode: data.current.weather_code,
        windSpeed: Math.round(data.current.wind_speed_10m),
        isDay: data.current.is_day === 1,
        daily: data.daily.time.map((date: string, i: number) => ({
          date,
          tempMax: Math.round(data.daily.temperature_2m_max[i]),
          tempMin: Math.round(data.daily.temperature_2m_min[i]),
          weatherCode: data.daily.weather_code[i],
          precipProb: data.daily.precipitation_probability_max[i],
        })),
      });
    } catch {
      setError(true);
    }
  };

  if (error || !weather) return null;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ padding: '0 16px' }}>
      <div className="section-header" style={{ padding: '16px 0 8px' }}>
        🌤️ BALI WEATHER
      </div>
      <div style={{
        background: 'var(--ion-card-background, #1E293B)', borderRadius: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)', overflow: 'hidden',
      }}>
        {/* Current */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '2.2rem' }}>{getWeatherEmoji(weather.weatherCode, weather.isDay)}</span>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1 }}>{weather.temp}°C</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginTop: '2px' }}>
                {getWeatherDesc(weather.weatherCode)} · Feels {weather.feelsLike}°
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
              <IonIcon icon={waterOutline} style={{ fontSize: '13px' }} />
              {weather.humidity}%
            </div>
            <div style={{ marginTop: '4px' }}>
              💨 {weather.windSpeed} km/h
            </div>
          </div>
        </div>

        {/* 3-day forecast */}
        <div style={{
          display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {weather.daily.map((day, i) => {
            const d = new Date(day.date + 'T00:00:00');
            return (
              <div key={i} style={{
                flex: 1, padding: '12px 8px', textAlign: 'center',
                borderRight: i < weather.daily.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ion-color-medium)' }}>
                  {i === 0 ? 'Today' : dayNames[d.getDay()]}
                </div>
                <div style={{ fontSize: '1.2rem', margin: '4px 0' }}>
                  {getWeatherEmoji(day.weatherCode)}
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                  {day.tempMax}° <span style={{ color: 'var(--ion-color-medium)', fontWeight: 400 }}>{day.tempMin}°</span>
                </div>
                {day.precipProb > 20 && (
                  <div style={{ fontSize: '0.65rem', color: '#0891B2', marginTop: '2px' }}>
                    🌧 {day.precipProb}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
