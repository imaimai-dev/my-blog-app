import { useState, useEffect } from "react";

export default function DarkModeToggle() {
  const [dark , setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored === 'dark' || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button
    onClick={toggle}
    aria-label="ダークモード切り替え"
    className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    >
      {dark ? '🌙' : '☀️'}
    </button>
  );
}