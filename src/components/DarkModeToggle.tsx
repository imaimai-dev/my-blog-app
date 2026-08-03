import { useEffect, useState } from 'react';

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const nextThemeIsDark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', nextThemeIsDark);
    localStorage.setItem('theme', nextThemeIsDark ? 'dark' : 'light');
    setIsDark(nextThemeIsDark);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'ライトモードに切り替える' : 'ダークモードに切り替える'}
      title={isDark ? 'ライトモード' : 'ダークモード'}
      style={{
        display: 'grid',
        width: 40,
        height: 40,
        placeItems: 'center',
        border: 0,
        borderRadius: '50%',
        background: 'transparent',
        color: 'var(--muted)',
        cursor: 'pointer',
      }}
    >
      {isDark ? (
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.1 15.15A8.5 8.5 0 0 1 8.85 3.9 8.5 8.5 0 1 0 20.1 15.15Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
