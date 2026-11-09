'use client';
import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export interface MapPoint { id: string; lat: number; lng: number; label: string }

/** Leaflet map with one circle marker per point. Loaded in the browser only. */
export function LiveMap({ points, height = 320 }: { points: MapPoint[]; height?: number }) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const layerRef = useRef<import('leaflet').LayerGroup | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !el.current) return;
      if (!mapRef.current) {
        mapRef.current = L.map(el.current).setView([-33.92, 18.42], 12);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(mapRef.current);
        layerRef.current = L.layerGroup().addTo(mapRef.current);
      }
      layerRef.current!.clearLayers();
      points.forEach((p) => L.circleMarker([p.lat, p.lng], { radius: 9, color: '#DC2626', fillOpacity: 0.8 }).bindTooltip(p.label).addTo(layerRef.current!));
      if (points.length > 0) mapRef.current.setView([points[0].lat, points[0].lng], points.length === 1 ? 16 : 12);
    })();
    return () => { cancelled = true; };
  }, [points]);

  useEffect(() => () => { mapRef.current?.remove(); mapRef.current = null; }, []);

  return <div ref={el} data-testid="live-map" style={{ height, width: '100%', borderRadius: 12 }} />;
}
