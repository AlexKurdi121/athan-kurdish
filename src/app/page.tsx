"use client";

import { useEffect, useState } from "react";

interface PrayerTime {
  bayani: string;
  xorhalatn: string;
  niwaro: string;
  asr: string;
  eywara: string;
  esha: string;
  date: string;
}

type Language = "en" | "ku";
type ViewMode = "today" | "month" | "ramadan";

const translations = {
  en: {
    title: "Hawler Prayer Times",
    today: "Today",
    nextPrayer: "Next Prayer",
    remaining: "Remaining",
    seeMonth: "This Month",
    showToday: "Today",
    ramadan: "Ramadan Dates",
    showRamadan: "Ramadan",
    prayers: {
      bayani: "Fajr",
      xorhalatn: "Sunrise",
      niwaro: "Dhuhr",
      asr: "Asr",
      eywara: "Maghrib",
      esha: "Isha",
    },
  },
  ku: {
    title: "کاتی بانگی - ھەولێر",
    today: "ئەمڕۆ",
    nextPrayer: "بانگی داهاتوو",
    remaining: "کاتی ماوە",
    seeMonth: "ئەم مانگە",
    showToday: "ئەمڕۆ",
    ramadan: "ڕەمەزان",
    showRamadan: "ڕەمەزان",
    prayers: {
      bayani: "بەیانی",
      xorhalatn: "خۆرھەڵاتن",
      niwaro: "نیوەڕۆ",
      asr: "عەسر",
      eywara: "ئێوارە",
      esha: "عیشا",
    },
  },
};

// Convert English numbers to Kurdish (Eastern Arabic) numerals
function toKurdishNumbers(text: string): string {
  const kurdishNumbers: { [key: string]: string } = {
    '0': '٠',
    '1': '١',
    '2': '٢',
    '3': '٣',
    '4': '٤',
    '5': '٥',
    '6': '٦',
    '7': '٧',
    '8': '٨',
    '9': '٩'
  };
  
  return text.replace(/[0-9]/g, (d) => kurdishNumbers[d]);
}

// Convert "HH:mm" to 12-hour format
function convertTo12Hour(time: string, lang: "en" | "ku") {
  if (!time) return "";

  const [hourStr, minute] = time.split(":");
  let hour = parseInt(hourStr, 10);

  if (lang === "ku") {
    let hour12 = hour % 12;
    if (hour12 === 0) hour12 = 12;
    const timeStr = `${hour12}:${minute}`;
    return toKurdishNumbers(timeStr);
  }

  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${hour}:${minute} ${ampm}`;
}

function formatRemaining(hours: number, minutes: number, seconds: number, lang: Language) {
  if (lang === "ku") {
    const text = `${hours} : ${minutes} : ${seconds}`;
    return toKurdishNumbers(text);
  }
  return `${hours}h ${minutes}m ${seconds}s`;
}

function getTodayMMDD() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}

function getCurrentMonth() {
  const now = new Date();
  return String(now.getMonth() + 1).padStart(2, "0");
}

function formatCurrentTime(date: Date, lang: Language) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  
  if (lang === "ku") {
    let hour12 = hours % 12;
    if (hour12 === 0) hour12 = 12;
    const timeStr = `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return toKurdishNumbers(timeStr);
  } else {
    const ampm = hours >= 12 ? "PM" : "AM";
    let hour12 = hours % 12;
    if (hour12 === 0) hour12 = 12;
    return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
  }
}

function formatCurrentDate(date: Date, lang: Language) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  
  if (lang === "ku") {
    const dateStr = `${year}-${month}-${day}`;
    return toKurdishNumbers(dateStr);
  } else {
    return `${day}-${month}-${year}`;
  }
}

// Check if current date is within Ramadan (18 Feb - 19 Mar)
function isWithinRamadan() {
  const now = new Date();
  const currentDate = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return currentDate >= "02-18" && currentDate <= "03-19";
}

export default function Home() {
  const [data, setData] = useState<PrayerTime[]>([]);
  const [today, setToday] = useState<PrayerTime | null>(null);
  const [nextPrayer, setNextPrayer] = useState<string>("");
  const [remaining, setRemaining] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const [lang, setLang] = useState<Language>("ku");
  const [currentTime, setCurrentTime] = useState(new Date());

  const t = translations[lang];
  const inRamadan = isWithinRamadan();

  const ramadanStart = "02-18";
  const ramadanEnd = "03-19";
  const currentMonth = getCurrentMonth();

  const ramadanData = data.filter(item => {
    return item.date >= ramadanStart && item.date <= ramadanEnd;
  });

  const monthData = data.filter(item => {
    return item.date.startsWith(currentMonth);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/prayertimes")
      .then((res) => res.json())
      .then((result: PrayerTime[]) => {
        setData(result);
        const todayData = result.find((item) => item.date === getTodayMMDD());
        if (todayData) {
          setToday(todayData);
          detectNextPrayer(todayData, result);
        }
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (today && data.length) detectNextPrayer(today, data);
    }, 1000);
    return () => clearInterval(interval);
  }, [today, data, lang]);

  function detectNextPrayer(todayPrayer: PrayerTime, allData: PrayerTime[]) {
    const now = new Date();
    const prayerKeys: (keyof PrayerTime)[] = ["bayani", "xorhalatn", "niwaro", "asr", "eywara", "esha"];

    let next: { key: keyof PrayerTime; dateObj: Date } | null = null;

    for (let key of prayerKeys) {
      const timeStr = todayPrayer[key];
      if (!timeStr) continue;

      const [h, m] = timeStr.split(":").map(Number);
      const prayerDate = new Date();
      prayerDate.setHours(h, m, 0, 0);

      if (prayerDate > now) {
        next = { key, dateObj: prayerDate };
        break;
      }
    }

    if (!next && allData.length > 0) {
      const todayIndex = allData.findIndex((d) => d.date === todayPrayer?.date);
      const tomorrow = allData[(todayIndex + 1) % allData.length];
      if (tomorrow) {
        const [h, m] = tomorrow.bayani.split(":").map(Number);
        const prayerDate = new Date();
        prayerDate.setDate(now.getDate() + 1);
        prayerDate.setHours(h, m, 0, 0);
        next = { key: "bayani", dateObj: prayerDate };
      }
    }

    if (next) {
      const prayerKey = next.key as keyof typeof t.prayers;
      setNextPrayer(t.prayers[prayerKey]);

      const diff = next.dateObj.getTime() - now.getTime();
      const hours = Math.floor(diff / 1000 / 60 / 60);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setRemaining(formatRemaining(hours, minutes, seconds, lang));
    } else {
      setNextPrayer(lang === "ku" ? "سەرەتاوە" : "Tomorrow");
      setRemaining("");
    }
  }

  const formatDate = (date: string) => {
    if (lang === "ku") {
      return toKurdishNumbers(date);
    }
    return date;
  };

  const getMonthName = (month: string) => {
    const months = {
      en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      ku: ["کانونی دووەم", "شوبات", "ئازار", "نیسان", "ئایار", "حوزەیران", "تەمموز", "ئاب", "ئەیلول", "تشرینی یەکەم", "تشرینی دووەم", "کانونی یەکەم"]
    };
    return lang === "en" ? months.en[parseInt(month) - 1] : months.ku[parseInt(month) - 1];
  };

  const getViewTitle = () => {
    if (viewMode === "ramadan") {
      return lang === "ku" ? "ڕۆژەکانی ڕەمەزان (١٨-٢ بۆ ١٩-٣)" : "Ramadan Dates (18 Feb - 19 Mar)";
    }
    if (viewMode === "month") {
      return lang === "ku" 
        ? `مانگی ${getMonthName(currentMonth)}` 
        : `${getMonthName(currentMonth)} ${new Date().getFullYear()}`;
    }
    return "";
  };

  return (
    <main className="container" dir={lang === "ku" ? "rtl" : "ltr"}>
      {/* Animated background elements */}
      <div className="bg-gradient"></div>
      <div className="floating-stars">
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
      </div>
      <div className="floating-crescent"></div>
      
      {/* Main content with glass morphism */}
      <div className="content-wrapper">
        <div className="glass-card">
          {/* Header with gradient */}
          <div className="header-gradient">
            <div className="top-bar">
              <h1 className="title">
                <span className="title-icon">🕌</span>
                {t.title}
              </h1>
              <button className="lang-btn" onClick={() => setLang(lang === "en" ? "ku" : "en")}>
                <span className="lang-icon">{lang === "en" ? "KR" : "EN"}</span>
                <span className="lang-text">{lang === "en" ? "کوردی" : "English"}</span>
              </button>
            </div>

            {/* Live Clock and Date with elegant design */}
            <div className="datetime-container">
              <div className="time-wrapper">
                <div className="time-icon">⏰</div>
                <div className="time-display">{formatCurrentTime(currentTime, lang)}</div>
              </div>
              <div className="date-wrapper">
                <div className="date-icon">📅</div>
                <div className="date-display">{formatCurrentDate(currentTime, lang)}</div>
              </div>
            </div>
          </div>

          {/* Today's prayer times with beautiful cards */}
          {viewMode === "today" && today && (
            <div className="prayers-section">
              <div className="prayer-grid">
                {/* First row - 3 prayers on desktop, stack on mobile */}
                <div className="grid-row row-1">
                  {["bayani", "xorhalatn", "niwaro"].map((key) => {
                    const time = today[key as keyof PrayerTime];
                    if (!time) return null;
                    const icons: Record<string, string> = {
                      bayani: "🌙",
                      xorhalatn: "🌅",
                      niwaro: "☀️",
                    };
                    const gradients: Record<string, string> = {
                      bayani: "fajr-gradient",
                      xorhalatn: "sunrise-gradient",
                      niwaro: "dhuhr-gradient",
                    };
                    return (
                      <div key={key} className={`prayer-card ${gradients[key]}`}>
                        <div className="card-content">
                          <div className="prayer-time">{convertTo12Hour(time, lang)}</div>
                          <div className="prayer-icon-wrapper">
                            <span className="prayer-icon">{icons[key]}</span>
                          </div>
                          <div className="prayer-name">{t.prayers[key as keyof typeof t.prayers]}</div>
                        </div>
                        <div className="card-shine"></div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Second row - 3 prayers on desktop, stack on mobile */}
                <div className="grid-row row-2">
                  {["asr", "eywara", "esha"].map((key) => {
                    const time = today[key as keyof PrayerTime];
                    if (!time) return null;
                    const icons: Record<string, string> = {
                      asr: "🌆",
                      eywara: "🌇",
                      esha: "🌃",
                    };
                    const gradients: Record<string, string> = {
                      asr: "asr-gradient",
                      eywara: "maghrib-gradient",
                      esha: "isha-gradient",
                    };
                    return (
                      <div key={key} className={`prayer-card ${gradients[key]}`}>
                        <div className="card-content">
                          <div className="prayer-time">{convertTo12Hour(time, lang)}</div>
                          <div className="prayer-icon-wrapper">
                            <span className="prayer-icon">{icons[key]}</span>
                          </div>
                          <div className="prayer-name">{t.prayers[key as keyof typeof t.prayers]}</div>
                        </div>
                        <div className="card-shine"></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Next prayer countdown with elegant design */}
              <div className="countdown-container">
                <div className="countdown-glow"></div>
                <div className="countdown-content">
                  <div className="countdown-header">
                    <span className="countdown-bell">🔔</span>
                    <span className="countdown-label">{t.nextPrayer}</span>
                  </div>
                  <div className="next-prayer-name">{nextPrayer}</div>
                  <div className="countdown-timer">
                    <div className="timer-digits">
                      {remaining || (lang === "ku" ? "---" : "---")}
                    </div>
                  </div>
                  <div className="countdown-subtitle">{t.remaining}</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons with beautiful design */}
          <div className="nav-buttons">
            <button 
              className={`nav-btn today-btn ${viewMode === "today" ? "active" : ""}`}
              onClick={() => setViewMode("today")}
            >
              <span className="btn-glow"></span>
              <span className="btn-icon">📅</span>
              <span className="btn-text">{t.showToday}</span>
            </button>
            
            <button 
              className={`nav-btn month-btn ${viewMode === "month" ? "active" : ""}`}
              onClick={() => setViewMode("month")}
            >
              <span className="btn-glow"></span>
              <span className="btn-icon">📆</span>
              <span className="btn-text">{t.seeMonth}</span>
            </button>
            
            {inRamadan && (
              <button 
                className={`nav-btn ramadan-btn ${viewMode === "ramadan" ? "active" : ""}`}
                onClick={() => setViewMode("ramadan")}
              >
                <span className="btn-glow"></span>
                <span className="btn-icon">🌙</span>
                <span className="btn-text">{t.ramadan}</span>
              </button>
            )}
          </div>

          {/* Month View with responsive card layout for mobile */}
          {viewMode === "month" && (
            <div className="table-section">
              <div className="table-header">
                <span className="header-icon">📊</span>
                <h3 className="table-title">{getViewTitle()}</h3>
              </div>
              <div className="month-cards">
                {monthData.map((item, index) => (
                  <div key={index} className={`month-card ${item.date === today?.date ? "today-card" : ""}`}>
                    <div className="month-card-header">
                      <span className="month-date">{formatDate(item.date)}</span>
                      {item.date === today?.date && <span className="today-badge">{t.today}</span>}
                    </div>
                    <div className="month-card-prayers">
                      <div className="prayer-row">
                        <span className="prayer-label">{t.prayers.bayani}:</span>
                        <span className="prayer-value">{convertTo12Hour(item.bayani, lang)}</span>
                      </div>
                      <div className="prayer-row">
                        <span className="prayer-label">{t.prayers.xorhalatn}:</span>
                        <span className="prayer-value">{convertTo12Hour(item.xorhalatn, lang)}</span>
                      </div>
                      <div className="prayer-row">
                        <span className="prayer-label">{t.prayers.niwaro}:</span>
                        <span className="prayer-value">{convertTo12Hour(item.niwaro, lang)}</span>
                      </div>
                      <div className="prayer-row">
                        <span className="prayer-label">{t.prayers.asr}:</span>
                        <span className="prayer-value">{convertTo12Hour(item.asr, lang)}</span>
                      </div>
                      <div className="prayer-row">
                        <span className="prayer-label">{t.prayers.eywara}:</span>
                        <span className="prayer-value">{convertTo12Hour(item.eywara, lang)}</span>
                      </div>
                      <div className="prayer-row">
                        <span className="prayer-label">{t.prayers.esha}:</span>
                        <span className="prayer-value">{convertTo12Hour(item.esha, lang)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ramadan Dates View with responsive card layout for mobile */}
          {viewMode === "ramadan" && inRamadan && (
            <div className="table-section ramadan-section">
              <div className="table-header ramadan-header">
                <span className="header-icon">🌙</span>
                <h3 className="table-title">{getViewTitle()}</h3>
              </div>
              <div className="ramadan-badge">
                <span className="badge-content">
                  {lang === "ku" ? "١٨ شوبات - ١٩ ئازار" : "18 February - 19 March"}
                </span>
              </div>
              <div className="month-cards">
                {ramadanData.map((item, index) => (
                  <div key={index} className="month-card ramadan-card">
                    <div className="month-card-header ramadan-header-bg">
                      <span className="month-date ramadan-date-text">{formatDate(item.date)}</span>
                      <span className="ramadan-icon-small">🌙</span>
                    </div>
                    <div className="month-card-prayers">
                      <div className="prayer-row">
                        <span className="prayer-label">{t.prayers.bayani}:</span>
                        <span className="prayer-value">{convertTo12Hour(item.bayani, lang)}</span>
                      </div>
                      <div className="prayer-row">
                        <span className="prayer-label">{t.prayers.xorhalatn}:</span>
                        <span className="prayer-value">{convertTo12Hour(item.xorhalatn, lang)}</span>
                      </div>
                      <div className="prayer-row">
                        <span className="prayer-label">{t.prayers.niwaro}:</span>
                        <span className="prayer-value">{convertTo12Hour(item.niwaro, lang)}</span>
                      </div>
                      <div className="prayer-row">
                        <span className="prayer-label">{t.prayers.asr}:</span>
                        <span className="prayer-value">{convertTo12Hour(item.asr, lang)}</span>
                      </div>
                      <div className="prayer-row">
                        <span className="prayer-label">{t.prayers.eywara}:</span>
                        <span className="prayer-value">{convertTo12Hour(item.eywara, lang)}</span>
                      </div>
                      <div className="prayer-row">
                        <span className="prayer-label">{t.prayers.esha}:</span>
                        <span className="prayer-value">{convertTo12Hour(item.esha, lang)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decorative footer - only show during Ramadan */}
          {inRamadan && (
            <div className="footer-decoration">
              <div className="decoration-line"></div>
              <div className="decoration-text">
                <span>🕋</span>
                <span>{lang === "ku" ? "اللهم تقبل صلاتنا" : "May your prayers be accepted"}</span>
                <span>🕋</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0f1e 0%, #1a1f2f 50%, #2a2f3f 100%);
          position: relative;
          overflow-x: hidden;
          padding: 10px;
        }

        /* Animated gradient background */
        .bg-gradient {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 20% 50%, rgba(76, 201, 240, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(247, 37, 133, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 40% 20%, rgba(255, 209, 102, 0.1) 0%, transparent 50%);
          animation: gradientShift 15s ease infinite;
          z-index: 0;
        }

        /* Floating stars animation */
        .floating-stars {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .star {
          position: absolute;
          background: white;
          border-radius: 50%;
          animation: twinkle 3s infinite;
        }

        .star:nth-child(1) { top: 10%; left: 5%; width: 2px; height: 2px; animation-delay: 0s; }
        .star:nth-child(2) { top: 20%; right: 15%; width: 3px; height: 3px; animation-delay: 1s; }
        .star:nth-child(3) { bottom: 30%; left: 10%; width: 2px; height: 2px; animation-delay: 2s; }
        .star:nth-child(4) { top: 40%; right: 25%; width: 4px; height: 4px; animation-delay: 0.5s; }
        .star:nth-child(5) { bottom: 20%; right: 30%; width: 2px; height: 2px; animation-delay: 1.5s; }
        .star:nth-child(6) { top: 70%; left: 15%; width: 3px; height: 3px; animation-delay: 2.5s; }
        .star:nth-child(7) { bottom: 10%; left: 25%; width: 2px; height: 2px; animation-delay: 0.2s; }
        .star:nth-child(8) { top: 15%; right: 40%; width: 3px; height: 3px; animation-delay: 1.2s; }

        /* Floating crescent moon */
        .floating-crescent {
          position: fixed;
          top: 5%;
          right: 5%;
          width: 100px;
          height: 100px;
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2), transparent 70%);
          border-radius: 50%;
          filter: blur(30px);
          animation: float 20s infinite;
          z-index: 1;
        }

        /* Content wrapper */
        .content-wrapper {
          position: relative;
          z-index: 2;
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Glass card effect */
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 30px;
          padding: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5),
                      inset 0 1px 1px rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Header gradient */
        .header-gradient {
          background: linear-gradient(135deg, rgba(76, 201, 240, 0.2), rgba(247, 37, 133, 0.2));
          border-radius: 25px;
          padding: 20px;
          margin-bottom: 20px;
          position: relative;
          overflow: hidden;
        }

        .header-gradient::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
          animation: rotate 20s linear infinite;
        }

        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          position: relative;
          z-index: 2;
          flex-wrap: wrap;
          gap: 10px;
        }

        .title {
          font-size: 1.5rem;
          font-weight: 600;
          background: linear-gradient(135deg, #fff, #e0e0ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .title-icon {
          font-size: 1.8rem;
        }

        .lang-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 40px;
          padding: 8px 16px;
          color: white;
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s ease;
          backdrop-filter: blur(5px);
        }

        .lang-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }

        .lang-icon {
          font-size: 1rem;
        }

        .lang-text {
          font-weight: 500;
        }

        /* DateTime container */
        .datetime-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 30px;
          padding: 15px;
          position: relative;
          z-index: 2;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .time-wrapper, .date-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
        }

        .time-icon, .date-icon {
          font-size: 1.3rem;
          filter: drop-shadow(0 0 10px rgba(76, 201, 240, 0.5));
        }

        .time-display {
          font-size: 1.5rem;
          font-weight: 600;
          background: linear-gradient(135deg, #4cc9f0, #f72585);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: 1px;
        }

        .date-display {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.9);
        }

        /* Prayers section */
        .prayers-section {
          margin-bottom: 30px;
        }

        /* Prayer grid */
        .prayer-grid {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 20px;
        }

        .grid-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .prayer-card {
          position: relative;
          border-radius: 20px;
          padding: 15px 10px;
          overflow: hidden;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .prayer-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
        }

        .card-content {
          position: relative;
          z-index: 2;
          text-align: center;
        }

        .card-shine {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .prayer-card:hover .card-shine {
          opacity: 1;
          animation: shine 1s ease;
        }

        /* Gradient classes for prayer cards */
        .fajr-gradient { background: linear-gradient(135deg, #1e3c72, #2a5298); }
        .sunrise-gradient { background: linear-gradient(135deg, #f12711, #f5af19); }
        .dhuhr-gradient { background: linear-gradient(135deg, #2193b0, #6dd5ed); }
        .asr-gradient { background: linear-gradient(135deg, #b24592, #f15f79); }
        .maghrib-gradient { background: linear-gradient(135deg, #ff6b6b, #ff8e8e); }
        .isha-gradient { background: linear-gradient(135deg, #0f2027, #203a43, #2c5364); }

        .prayer-time {
          font-size: 1.3rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          margin-bottom: 5px;
        }

        .prayer-icon-wrapper {
          margin: 8px 0;
        }

        .prayer-icon {
          font-size: 2rem;
          filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.5));
        }

        .prayer-name {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }

        /* Countdown container */
        .countdown-container {
          position: relative;
          background: linear-gradient(135deg, rgba(76, 201, 240, 0.2), rgba(247, 37, 133, 0.2));
          border-radius: 25px;
          padding: 20px;
          margin-top: 15px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .countdown-glow {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(76, 201, 240, 0.3) 0%, transparent 70%);
          animation: rotate 10s linear infinite;
        }

        .countdown-content {
          position: relative;
          z-index: 2;
          text-align: center;
        }

        .countdown-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .countdown-bell {
          font-size: 1.5rem;
          animation: ring 2s infinite;
        }

        .countdown-label {
          font-size: 1.2rem;
          color: white;
          font-weight: 500;
        }

        .next-prayer-name {
          font-size: 1.8rem;
          font-weight: 700;
          background: linear-gradient(135deg, #fff, #4cc9f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 15px;
          text-transform: uppercase;
        }

        .countdown-timer {
          margin: 15px 0;
        }

        .timer-digits {
          font-size: 2.2rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 0 15px rgba(76, 201, 240, 0.5);
          letter-spacing: 3px;
        }

        .countdown-subtitle {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.7);
        }

        /* Navigation buttons */
        .nav-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .nav-btn {
          position: relative;
          padding: 12px 20px;
          border: none;
          border-radius: 40px;
          font-size: 0.95rem;
          font-weight: 600;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          overflow: hidden;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          flex: 1;
          min-width: 100px;
          justify-content: center;
        }

        .btn-glow {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .nav-btn:hover .btn-glow {
          left: 100%;
        }

        .nav-btn.active {
          background: linear-gradient(135deg, #4cc9f0, #f72585);
          box-shadow: 0 8px 20px rgba(247, 37, 133, 0.4);
          border: none;
        }

        .today-btn.active { background: linear-gradient(135deg, #4cc9f0, #3a7bd5); }
        .month-btn.active { background: linear-gradient(135deg, #f72585, #b5179e); }
        .ramadan-btn.active { background: linear-gradient(135deg, #ffd166, #fca311); }

        .btn-icon {
          font-size: 1.1rem;
          position: relative;
          z-index: 2;
        }

        .btn-text {
          position: relative;
          z-index: 2;
          font-size: 0.9rem;
        }

        /* Table section - replaced with cards for mobile */
        .table-section {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 25px;
          padding: 20px;
          margin-top: 15px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .ramadan-section {
          background: linear-gradient(135deg, rgba(255, 209, 102, 0.1), rgba(252, 163, 17, 0.1));
        }

        .table-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 15px;
        }

        .ramadan-header {
          color: #ffd166;
        }

        .header-icon {
          font-size: 1.5rem;
        }

        .table-title {
          font-size: 1.3rem;
          font-weight: 600;
          color: white;
          margin: 0;
        }

        .ramadan-badge {
          display: inline-block;
          background: linear-gradient(135deg, #ffd166, #fca311);
          padding: 6px 15px;
          border-radius: 40px;
          margin-bottom: 15px;
        }

        .badge-content {
          color: #1a1f2f;
          font-weight: 600;
          font-size: 0.95rem;
        }

        /* Month cards - responsive design for mobile */
        .month-cards {
          display: flex;
          flex-direction: column;
          gap: 15px;
          max-height: 500px;
          overflow-y: auto;
          padding-right: 5px;
        }

        .month-cards::-webkit-scrollbar {
          width: 4px;
        }

        .month-cards::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .month-cards::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #4cc9f0, #f72585);
          border-radius: 10px;
        }

        .month-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 15px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .month-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
          background: rgba(255, 255, 255, 0.08);
        }

        .today-card {
          background: rgba(76, 201, 240, 0.15);
          border-left: 4px solid #4cc9f0;
        }

        .ramadan-card {
          background: rgba(255, 209, 102, 0.1);
        }

        .month-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .ramadan-header-bg {
          border-bottom: 1px solid rgba(255, 209, 102, 0.3);
        }

        .month-date {
          font-size: 1.1rem;
          font-weight: 600;
          color: #4cc9f0;
        }

        .ramadan-date-text {
          color: #ffd166;
        }

        .today-badge {
          background: #4cc9f0;
          color: white;
          padding: 3px 8px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .ramadan-icon-small {
          font-size: 1.1rem;
        }

        .month-card-prayers {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .prayer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.95rem;
        }

        .prayer-label {
          color: rgba(255, 255, 255, 0.7);
        }

        .prayer-value {
          color: white;
          font-weight: 500;
        }

        /* Footer decoration */
        .footer-decoration {
          margin-top: 30px;
          text-align: center;
        }

        .decoration-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, #4cc9f0, #f72585, transparent);
          margin-bottom: 15px;
        }

        .decoration-text {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.95rem;
          flex-wrap: wrap;
        }

        /* Animations */
        @keyframes gradientShift {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes shine {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }

        @keyframes ring {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(15deg); }
          20% { transform: rotate(-15deg); }
          30% { transform: rotate(10deg); }
          40% { transform: rotate(-10deg); }
          50% { transform: rotate(5deg); }
          60% { transform: rotate(-5deg); }
        }

        /* RTL Support */
        [dir="rtl"] .top-bar {
          flex-direction: row-reverse;
        }

        [dir="rtl"] .nav-buttons {
          flex-direction: row-reverse;
        }

        [dir="rtl"] .table-header {
          flex-direction: row-reverse;
        }

        [dir="rtl"] .prayer-row {
          flex-direction: row-reverse;
        }

        [dir="rtl"] .month-card-header {
          flex-direction: row-reverse;
        }

        /* Tablet and desktop styles */
        @media (min-width: 769px) {
          .container {
            padding: 20px;
          }

          .glass-card {
            padding: 30px;
          }

          .header-gradient {
            padding: 25px;
          }

          .title {
            font-size: 2rem;
          }

          .datetime-container {
            flex-direction: row;
            justify-content: space-between;
            padding: 15px 25px;
          }

          .time-display {
            font-size: 2rem;
          }

          .date-display {
            font-size: 1.5rem;
          }

          .grid-row {
            gap: 20px;
          }

          .prayer-time {
            font-size: 2rem;
          }

          .prayer-icon {
            font-size: 3rem;
          }

          .prayer-name {
            font-size: 1.2rem;
          }

          .countdown-label {
            font-size: 1.5rem;
          }

          .next-prayer-name {
            font-size: 2.5rem;
          }

          .timer-digits {
            font-size: 3.5rem;
          }

          .nav-btn {
            padding: 15px 30px;
            font-size: 1.1rem;
            flex: none;
          }

          .btn-text {
            font-size: 1.1rem;
          }

          .month-cards {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            max-height: none;
            overflow-y: visible;
          }

          .month-card {
            padding: 20px;
          }

          .month-date {
            font-size: 1.2rem;
          }

          .prayer-row {
            font-size: 1rem;
          }

          .decoration-text {
            font-size: 1.1rem;
          }
        }

        /* iPhone specific styles */
        @media (max-width: 390px) {
          .grid-row {
            gap: 8px;
          }

          .prayer-card {
            padding: 12px 5px;
          }

          .prayer-time {
            font-size: 1.1rem;
          }

          .prayer-icon {
            font-size: 1.8rem;
          }

          .prayer-name {
            font-size: 0.9rem;
          }

          .nav-btn {
            padding: 10px 12px;
            min-width: 80px;
          }

          .btn-icon {
            font-size: 1rem;
          }

          .btn-text {
            font-size: 0.8rem;
          }

          .timer-digits {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </main>
  );
}