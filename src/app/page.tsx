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

const translations = {
  en: {
    title: "Hawler Prayer Times",
    today: "Today",
    nextPrayer: "Next Prayer",
    remaining: "Remaining",
    seeAll: "See All Days",
    showToday: "Show Today Only",
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
    title: "کاتی بانگەواز - ھەولێر",
    today: "ئەمڕۆ",
    nextPrayer: "بانگەوازی داهاتوو",
    remaining: "کاتی ماوە",
    seeAll: "بینینی هەموو ڕۆژەکان",
    showToday: "تەنها ئەمڕۆ",
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

// Convert "HH:mm" to 12-hour format with Kurdish numbers for Kurdish language
function convertTo12Hour(time: string, lang: "en" | "ku") {
  if (!time) return "";

  const [hourStr, minute] = time.split(":");
  let hour = parseInt(hourStr, 10);

  // For Kurdish - convert to 12-hour format AND use Kurdish numbers
  if (lang === "ku") {
    // Convert to 12-hour format
    const period = hour >= 12 ? "PM" : "AM";
    let hour12 = hour % 12;
    if (hour12 === 0) hour12 = 12;
    
    // Format with Kurdish numbers
    const timeStr = `${hour12}:${minute}`;
    return toKurdishNumbers(timeStr);
  }

  // English → convert to 12h with AM/PM
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

export default function Home() {
  const [data, setData] = useState<PrayerTime[]>([]);
  const [today, setToday] = useState<PrayerTime | null>(null);
  const [nextPrayer, setNextPrayer] = useState<string>("");
  const [remaining, setRemaining] = useState<string>("");
  const [showAll, setShowAll] = useState(false);
  const [lang, setLang] = useState<Language>("ku");

  const t = translations[lang];

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

    // Check remaining prayers today
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

    // If no remaining today, take tomorrow's Fajr/Bayani
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

  // Format date with Kurdish numbers if needed
  const formatDate = (date: string) => {
    if (lang === "ku") {
      return toKurdishNumbers(date);
    }
    return date;
  };

  return (
    <main className="container" dir={lang === "ku" ? "rtl" : "ltr"}>
      {/* Decorative elements */}
      <div className="stars"></div>
      <div className="floating-shape shape-1"></div>
      <div className="floating-shape shape-2"></div>
      <div className="floating-shape shape-3"></div>

      <div className="card">
        <div className="top-bar">
          <h1>
            <span className="title-icon">🕌</span>
            {t.title}
          </h1>
          <button className="lang-btn" onClick={() => setLang(lang === "en" ? "ku" : "en")}>
            <span className="lang-icon">{lang === "en" ? "🇰🇼" : "🇬🇧"}</span>
            {lang === "en" ? "کوردی" : "English"}
          </button>
        </div>

        {!showAll && today && (
          <>
            <div className="date-badge">
              <span className="date-icon">📅</span>
              {t.today} - {formatDate(today.date)}
            </div>

            <div className="today-grid">
              {["bayani", "xorhalatn", "niwaro", "asr", "eywara", "esha"].map((key) => {
                const time = today[key as keyof PrayerTime];
                if (!time) return null;
                const icons: Record<string, string> = {
                  bayani: "🌙",
                  xorhalatn: "🌅",
                  niwaro: "☀️",
                  asr: "🌆",
                  eywara: "🌇",
                  esha: "🌃",
                };
                return (
                  <div key={key} className="prayer-card">
                    <div className="prayer-time">{convertTo12Hour(time, lang)}</div>
                    <div className="prayer-icon">{icons[key]}</div>
                    <div className="prayer-name">{t.prayers[key as keyof typeof t.prayers]}</div>
                  </div>
                );
              })}
            </div>

            <div className="countdown-card">
              <div className="countdown-header">
                <span className="countdown-icon">⏰</span>
                <h3>{t.nextPrayer}</h3>
              </div>
              <div className="next-prayer-name">{nextPrayer}</div>
              <div className="countdown-timer">
                <div className="timer-circle">
                  <span>{remaining || (lang === "ku" ? "---" : "---")}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {showAll && (
          <button className="toggle-btn" onClick={() => setShowAll(false)}>
            <span className="btn-icon">📅</span>
            {t.showToday}
          </button>
        )}

        {!showAll && (
          <button className="toggle-btn" onClick={() => setShowAll(true)}>
            <span className="btn-icon">📆</span>
            {t.seeAll}
          </button>
        )}

        {showAll && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>{t.prayers.bayani}</th>
                  <th>{t.prayers.xorhalatn}</th>
                  <th>{t.prayers.niwaro}</th>
                  <th>{t.prayers.asr}</th>
                  <th>{t.prayers.eywara}</th>
                  <th>{t.prayers.esha}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index} className={item.date === today?.date ? "today-row" : ""}>
                    <td>{formatDate(item.date)}</td>
                    <td>{convertTo12Hour(item.bayani, lang)}</td>
                    <td>{convertTo12Hour(item.xorhalatn, lang)}</td>
                    <td>{convertTo12Hour(item.niwaro, lang)}</td>
                    <td>{convertTo12Hour(item.asr, lang)}</td>
                    <td>{convertTo12Hour(item.eywara, lang)}</td>
                    <td>{convertTo12Hour(item.esha, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}