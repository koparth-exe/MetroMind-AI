import { useEffect, useRef } from "react";
import type { RouteInsight } from "@workspace/api-client-react";

declare global {
  interface Window {
    L?: any;
  }
}

const MUMBAI_CENTER: [number, number] = [19.076, 72.8777];

export function MumbaiMap({
  routes,
  selectedRouteId,
  onSelect,
}: {
  routes: RouteInsight[];
  selectedRouteId?: string;
  onSelect: (routeId: string) => void;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!elementRef.current || !window.L) return;
    const map = window.L.map(elementRef.current, {
      center: MUMBAI_CENTER,
      zoom: 11,
      zoomControl: true,
      attributionControl: true,
    });
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    mapRef.current = map;
    window.setTimeout(() => map.invalidateSize(), 0);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.L) return;
    const layers = window.L.layerGroup().addTo(map);

    routes.forEach((route) => {
      const isSelected = route.routeId === selectedRouteId;
      const polyline = window.L.polyline(route.coordinates, {
        color: route.color,
        weight: isSelected ? 7 : 4,
        opacity: isSelected ? 1 : 0.42,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(layers);
      polyline.bindTooltip(`${route.routeId} · ${route.name}`, { sticky: true });
      polyline.on("click", () => onSelect(route.routeId));

      route.coordinates.forEach((coordinate, index) => {
        const marker = window.L.circleMarker(coordinate, {
          radius: isSelected ? 7 : 5,
          color: route.color,
          weight: 2,
          fillColor: "#ffffff",
          fillOpacity: 1,
        }).addTo(layers);
        marker.bindPopup(`<strong>${route.stations[index] ?? route.routeId}</strong><br/>${route.name}`);
        marker.on("click", () => onSelect(route.routeId));
      });
    });

    return () => {
      layers.remove();
    };
  }, [routes, selectedRouteId, onSelect]);

  return <div ref={elementRef} id="map" className="mumbai-map" data-testid="map-mumbai" />;
}