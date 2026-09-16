import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

/**
 * Anonymous pageview beacon for public marketing/auth pages. Sends path + referrer + UTM params
 * to the backend, which counts daily unique visitors from a salted hash (no cookie, no IP stored).
 * Only public pages are tracked: the dashboard (authenticated) is measured server-side.
 */
const TRACKED_PREFIXES = ['/', '/login', '/register', '/politica-de-privacidade', '/politica-de-cookies', '/invite'];

function isTracked(pathname) {
  if (pathname === '/') return true;
  return TRACKED_PREFIXES.some((p) => p !== '/' && pathname.startsWith(p));
}

export function usePageviewTracking() {
  const location = useLocation();

  useEffect(() => {
    const { pathname, search } = location;
    if (!isTracked(pathname)) return;
    const params = new URLSearchParams(search);
    const body = {
      path: pathname,
      referrer: document.referrer || null,
      utmSource: params.get('utm_source'),
      utmMedium: params.get('utm_medium'),
      utmCampaign: params.get('utm_campaign'),
    };
    api.post('/public/pageview', body, { _silent: true }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
}
