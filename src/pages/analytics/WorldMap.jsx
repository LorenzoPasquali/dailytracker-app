import React, { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import topology from 'world-atlas/countries-110m.json';
import { countries, countryName } from './countries';

function color(value, max) {
  if (!value) return 'var(--bg-active)';
  const t = Math.sqrt(value / max);
  return `rgba(16, 185, 129, ${0.2 + t * 0.8})`;
}

/**
 * Choropleth of one metric per country. `rows` = [{ country: 'BR', ...metrics }], `metric` = key to color by.
 * world-atlas ids are ISO numeric; i18n-iso-countries maps them back to alpha-2.
 */
export default function WorldMap({ rows, metric, label }) {
  const [hover, setHover] = useState(null);
  const byNumeric = useMemo(() => {
    const m = {};
    for (const r of rows || []) {
      const numeric = countries.alpha2ToNumeric(r.country);
      if (numeric) m[numeric] = r;
    }
    return m;
  }, [rows]);
  const max = Math.max(1, ...(rows || []).map((r) => r[metric] || 0));

  return (
    <div style={{ position: 'relative' }}>
      <ComposableMap projection="geoNaturalEarth1" projectionConfig={{ scale: 150 }} style={{ width: '100%', height: 'auto' }}>
        <ZoomableGroup minZoom={1} maxZoom={6}>
          <Geographies geography={topology}>
            {({ geographies }) => geographies.map((geo) => {
              const row = byNumeric[geo.id];
              const value = row?.[metric] || 0;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={color(value, max)}
                  stroke="var(--bg-base)"
                  strokeWidth={0.4}
                  onMouseEnter={() => setHover({ name: geo.properties.name, alpha2: row?.country, value })}
                  onMouseLeave={() => setHover(null)}
                  style={{ default: { outline: 'none' }, hover: { outline: 'none', fill: value ? '#34d399' : 'var(--bg-hover)' }, pressed: { outline: 'none' } }}
                />
              );
            })}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      <div style={{ position: 'absolute', left: 8, bottom: 8, fontSize: '0.8rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', pointerEvents: 'none', minWidth: 160 }}>
        {hover
          ? <><strong>{hover.alpha2 ? countryName(hover.alpha2) : hover.name}</strong> <span style={{ color: 'var(--text-muted)' }}>{label}:</span> {hover.value.toLocaleString('pt-BR')}</>
          : <span style={{ color: 'var(--text-muted)' }}>Passe o mouse sobre um país</span>}
      </div>
    </div>
  );
}
