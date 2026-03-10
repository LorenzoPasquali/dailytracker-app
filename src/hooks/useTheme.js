import { useState, useEffect } from 'react';

const THEME_KEY = 'theme';

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    return sessionStorage.getItem(THEME_KEY) || 'system';
  });

  useEffect(() => {
    const apply = (t) => {
      const resolved = t === 'system' ? getSystemTheme() : t;
      document.documentElement.setAttribute('data-theme', resolved);
    };

    apply(theme);
    sessionStorage.setItem(THEME_KEY, theme);

    if (theme !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => apply('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return { theme, setTheme };
}
