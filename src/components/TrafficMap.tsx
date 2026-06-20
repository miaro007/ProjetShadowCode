"use client";

/**
 * TrafficMap.tsx  —  src/components/TrafficMap.tsx
 *
 * Carte Leaflet interactive pour Smart Ambotaka – Transport Urbain Antananarivo
 *
 * Dépendances :
 *   npm install leaflet react-leaflet
 *   npm install --save-dev @types/leaflet
 *
 * Ajouter dans globals.css (ou layout.tsx) :
 *   import "leaflet/dist/leaflet.css";
 */
import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Circle, Popup, Marker, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Types ────────────────────────────────────────────────────────

interface Vehicle {
  id: string;
  lat: number;
  lng: number;
  type: "taxibe" | "car" | "moto";
  line?: string;
  speed: number; // km/h simulé
}

import { HotZone, TrajetItem } from "@/types/dashboard";

interface Props {
  zones: HotZone[];
  selectedTrajet: TrajetItem | null;
  userCoords?: [number, number] | null;
}

// ─── Véhicules simulés autour d'Antananarivo ─────────────────────
const INITIAL_VEHICLES: Vehicle[] = [
  { id: "tb-109", lat: -18.8948, lng: 47.5289, type: "taxibe", line: "109", speed: 8 },
  { id: "tb-154", lat: -18.9241, lng: 47.5081, type: "taxibe", line: "154", speed: 5 },
  { id: "tb-135", lat: -18.9005, lng: 47.5162, type: "taxibe", line: "135", speed: 12 },
  { id: "tb-117", lat: -18.8712, lng: 47.5412, type: "taxibe", line: "117", speed: 3 },
  { id: "tb-015", lat: -18.9421, lng: 47.5321, type: "taxibe", line: "015", speed: 10 },
  { id: "car-1", lat: -18.9100, lng: 47.5200, type: "car", speed: 15 },
  { id: "car-2", lat: -18.9050, lng: 47.5350, type: "car", speed: 6 },
  { id: "car-3", lat: -18.8850, lng: 47.5280, type: "car", speed: 20 },
  { id: "moto-1", lat: -18.9180, lng: 47.5130, type: "moto", speed: 25 },
  { id: "moto-2", lat: -18.9010, lng: 47.5400, type: "moto", speed: 30 },
  { id: "moto-3", lat: -18.9310, lng: 47.5260, type: "moto", speed: 22 },
];

// ─── Couleur selon niveau de congestion ───────────────────────────
function zoneColor(level: number): string {
  if (level >= 80) return "#FF3D00";
  if (level >= 60) return "#FFB300";
  return "#00D4A4";
}

function zoneRadius(level: number): number {
  if (level >= 80) return 600;
  if (level >= 60) return 420;
  return 280;
}

// ─── Icône véhicule personnalisée ─────────────────────────────────
function makeVehicleIcon(type: Vehicle["type"], line?: string): L.DivIcon {
  const colors = { taxibe: "#00E5FF", car: "#FFB300", moto: "#A78BFA" };
  const color = colors[type];
  const emoji = type === "taxibe" ? "🚌" : type === "moto" ? "🏍️" : "🚗";
  const label = line ? `<div style="font-size:8px;font-weight:700;color:${color};text-align:center;letter-spacing:-.02em;margin-top:1px;">${line}</div>` : "";

  return L.divIcon({
    className: "",
    html: `
      <div style="
        position:relative;
        display:flex;flex-direction:column;align-items:center;
      ">
        <div style="
          font-size:16px;
          filter:drop-shadow(0 0 4px ${color});
          animation:vehicle-pulse 2s ease infinite;
        ">${emoji}</div>
        ${label}
      </div>
    `,
    iconSize: [28, 32],
    iconAnchor: [14, 16],
  });
}

// ─── Composant auto-recadrage selon trajet sélectionné ────────────
const TRAJET_COORDS: Record<string, [number, number][]> = {
  "Ivandry": [[-18.893, 47.517]],
  "Analakely": [[-18.913, 47.536]],
  "Ankorondrano": [[-18.895, 47.529]],
  "Andravoahangy": [[-18.905, 47.544]],
  "Tanjombato": [[-18.942, 47.533]],
  "Ambohimanarina": [[-18.865, 47.512]],
};

function MapController({ selectedTrajet }: { selectedTrajet: TrajetItem | null }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedTrajet) return;
    const fromCoords = TRAJET_COORDS[selectedTrajet.from]?.[0];
    const toCoords = TRAJET_COORDS[selectedTrajet.to]?.[0];
    if (fromCoords && toCoords) {
      const bounds = L.latLngBounds([fromCoords, toCoords]);
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [selectedTrajet, map]);
  return null;
}

// ─── Route (OpenRouteService) ────────────────────────────────────
function RoutePolyline({ trajet, userCoords, onRouteInfo }: { trajet: TrajetItem; userCoords?: [number, number] | null; onRouteInfo: (info: any) => void }) {
  const [routes, setRoutes] = useState<[number, number][][]>([]);
  const map = useMap();

  useEffect(() => {
    let active = true;

    async function fetchRoute() {
      let fromCoords: [number, number] | undefined;
      let toCoords: [number, number] | undefined;

      // 1. Déterminer le point de départ
      if (trajet.from === "CURRENT_LOCATION") {
        if (userCoords) {
          fromCoords = userCoords;
        } else {
          // Fallback par défaut (Analakely) si le GPS est désactivé
          console.warn("GPS non disponible, utilisation du point de départ par défaut.");
          fromCoords = [-18.9137, 47.5361];
        }
      } else {
        fromCoords = TRAJET_COORDS[trajet.from]?.[0];
      }

      // 2. Déterminer le point d'arrivée
      toCoords = TRAJET_COORDS[trajet.to]?.[0];

      // Géocodage de secours si la destination n'est pas dans la liste en dur
      if (!toCoords && trajet.to) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trajet.to + ", Antananarivo")}`);
          const data = await res.json();
          if (data && data.length > 0) {
            toCoords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          }
        } catch (e) {
          console.error("Erreur géocodage de la destination", e);
        }
      }

      if (!fromCoords || !toCoords || !active) {
        setRoutes([]);
        return;
      }

      // Fallback avec la clé fournie si NEXT_PUBLIC n'est pas encore rechargé par le navigateur
      const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY || "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjVhYWMwMDA3ZGIzNjQ2NmNiNWE1ZWU0Y2MyMjQ5OTVhIiwiaCI6Im11cm11cjY0In0=";
      
      if (!apiKey) {
        setRoutes([[fromCoords, toCoords]]);
        return;
      }

      const profile = trajet.transportType === "marche" ? "foot-walking" : "driving-car";

      try {
        const fetchReq = async (withAlt: boolean) => {
          const body: any = {
            coordinates: [
              [fromCoords![1], fromCoords![0]], // [lng, lat]
              [toCoords![1], toCoords![0]]
            ]
          };
          if (withAlt) body.alternative_routes = { target_count: 2, weight_factor: 1.4 };

          const res = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}/geojson`, {
            method: "POST",
            headers: {
              "Authorization": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body)
          });
          return await res.json();
        };

        let data = await fetchReq(true);
        if (data.error) {
          console.warn("Erreur ORS avec alternative_routes, essai sans alternatives...", data.error);
          data = await fetchReq(false);
        }

        if (data.features && data.features.length > 0 && active) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newRoutes = data.features.map((feature: any) => 
            feature.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]])
          );
          setRoutes(newRoutes);

          // Extraire la distance et durée
          const summary = data.features[0].properties.summary;
          onRouteInfo({
            distKm: (summary.distance / 1000).toFixed(1),
            durCarMin: Math.round(summary.duration / 60),
            durFootMin: Math.round((summary.distance / 1000) / 4 * 60) // 4 km/h à pied
          });

          // Cadrer automatiquement la carte sur le trajet
          const bounds = L.latLngBounds([fromCoords, toCoords]);
          map.fitBounds(bounds, { padding: [60, 60] });
        } else if (active) {
          console.warn("ORS n'a renvoyé aucune feature. Tracé d'une ligne droite.", data);
          setRoutes([[fromCoords, toCoords]]);
          onRouteInfo(null);
        }
      } catch (err) {
        console.error("Erreur réseau ORS:", err);
        if (active) {
          setRoutes([[fromCoords, toCoords]]);
          onRouteInfo(null);
        }
      }
    }

    fetchRoute();
    return () => { active = false; };
  }, [trajet, userCoords, map, onRouteInfo]);

  if (routes.length === 0) return null;

  return (
    <>
      {/* Route 2 (Alternative - Plus long) en Jaune */}
      {routes.length > 1 && (
        <Polyline 
          positions={routes[1]} 
          pathOptions={{ color: "#FFB800", weight: 5, opacity: 0.6, dashArray: "10, 10" }} 
        />
      )}
      
      {/* Route 1 (Principale - Plus court) en Bleu */}
      {routes.length > 0 && (
        <Polyline 
          positions={routes[0]} 
          pathOptions={{ color: "#00E5FF", weight: 6, opacity: 0.9 }} 
        />
      )}
    </>
  );
}

// ─── Localisation GPS Utilisateur ────────────────────────────────
function UserLocation() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const map = useMap();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setPosition(coords);
          // Centrer doucement la carte sur l'utilisateur une fois trouvé
          map.flyTo(coords, 14, { animate: true, duration: 1.5 });
        },
        (err) => console.warn("GPS désactivé:", err),
        { enableHighAccuracy: true }
      );
    }
  }, [map]);

  if (!position) return null;

  return (
    <Marker 
      position={position}
      icon={L.divIcon({
        className: "",
        html: `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%;">
            <div style="position:absolute;width:48px;height:48px;background:rgba(0,229,160,0.3);border-radius:50%;animation:pulse-ring 2s infinite;"></div>
            <div style="position:relative;width:32px;height:32px;background:#0A0E1A;border:2px solid #00E5A0;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.5);z-index:2;">
              <span style="font-size:16px;line-height:1;">🧑🏽‍💻</span>
            </div>
          </div>
          <style>
            @keyframes pulse-ring {
              0% { transform: scale(0.6); opacity: 1; }
              100% { transform: scale(1.6); opacity: 0; }
            }
          </style>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })}
    >
      <Popup>
        <div style={{ textAlign: "center", minWidth: 120 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: "#00E5A0", marginBottom: 4 }}>📍 C'est vous !</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Position GPS en direct</div>
        </div>
      </Popup>
    </Marker>
  );
}

// ─── Animation des véhicules (simulation GPS) ────────────────────
function useRealtimeVehicles(initial: Vehicle[]): Vehicle[] {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initial);

  useEffect(() => {
    // Charge les données initiales
    supabase.from("vehicles").select("*").then(({ data }) => {
      if (data) setVehicles(data);
    });

    // Écoute les mises à jour temps réel
    const channel = supabase
      .channel("vehicles-live")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "vehicles",
      }, payload => {
        setVehicles(prev =>
          prev.map(v => v.id === payload.new.id ? { ...v, ...payload.new } : v)
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return vehicles;
}

// ─── Légende ─────────────────────────────────────────────────────
function MapLegend() {
  return (
    <div style={{
      position: "absolute", bottom: 12, left: 12, zIndex: 1000,
      background: "rgba(10,15,30,.9)", backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,.1)",
      borderRadius: 12, padding: "10px 14px",
      fontSize: 11, display: "flex", flexDirection: "column", gap: 6,
      color: "rgba(255,255,255,.7)",
    }}>
      <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: ".08em", color: "rgba(255,255,255,.4)", marginBottom: 2, textTransform: "uppercase" }}>
        Légende
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF3D00", display: "inline-block", boxShadow: "0 0 6px #FF3D00" }} />
        Bouchon ≥ 80%
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFB300", display: "inline-block", boxShadow: "0 0 6px #FFB300" }} />
        Dense 60–79%
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#00D4A4", display: "inline-block" }} />
        Fluide &lt; 60%
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
        <div>🚌 Taxi-be (live GPS)</div>
        <div>🚗 Voiture particulière</div>
        <div>🏍️ Taxi-moto</div>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────
export default function TrafficMap({ zones, selectedTrajet, userCoords }: Props) {
  const vehicles = useRealtimeVehicles(INITIAL_VEHICLES);
  const [routeInfo, setRouteInfo] = useState<{ distKm: string, durCarMin: number, durFootMin: number } | null>(null);

  // Fix icônes Leaflet (Next.js)
  useEffect(() => {
    // Supprime le marker par défaut cassé de Leaflet avec webpack
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <style>{`
        /* Override Leaflet tiles pour le dark mode */
        .leaflet-tile {
          filter: brightness(0.55) saturate(0.7) hue-rotate(195deg) contrast(1.1);
        }
        .leaflet-container {
          width: 100%;
          height: 100%;
          background: #0A0E1A;
          font-family: inherit;
        }
        .leaflet-popup-content-wrapper {
          background: rgba(10,15,30,.95) !important;
          border: 1px solid rgba(255,255,255,.1) !important;
          color: #fff !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 30px rgba(0,0,0,.6) !important;
          backdrop-filter: blur(12px);
        }
        .leaflet-popup-tip {
          background: rgba(10,15,30,.95) !important;
        }
        .leaflet-popup-content {
          margin: 12px 14px !important;
          line-height: 1.5 !important;
        }
        .leaflet-control-zoom {
          border: 1px solid rgba(255,255,255,.1) !important;
          background: rgba(10,15,30,.9) !important;
        }
        .leaflet-control-zoom a {
          background: rgba(10,15,30,.9) !important;
          color: rgba(255,255,255,.6) !important;
          border-bottom: 1px solid rgba(255,255,255,.08) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(255,255,255,.08) !important;
          color: #fff !important;
        }
        @keyframes vehicle-pulse {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes hotspot-pulse {
          0%, 100% { opacity: .7; transform: scale(1); }
          50% { opacity: .25; transform: scale(1.15); }
        }
      `}</style>

      <MapContainer
        center={[-18.9137, 47.5361]}
        zoom={13}
        style={{ width: "100%", height: "100%", borderRadius: 20 }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
        />

        <MapController selectedTrajet={selectedTrajet} />
        <UserLocation />
        
        {selectedTrajet && (
          <RoutePolyline 
            trajet={selectedTrajet}
            userCoords={userCoords}
            onRouteInfo={setRouteInfo}
          />
        )}

        {/* ── Zones de bouchon (cercles pulsants) ── */}
        {zones.map(zone => (
          <div key={zone.id}>
            {/* Cercle extérieur pulsant */}
            <Circle
              center={[zone.lat, zone.lng]}
              radius={zoneRadius(zone.level) * 1.6}
              pathOptions={{
                color: zoneColor(zone.level),
                fillColor: zoneColor(zone.level),
                fillOpacity: 0.06,
                weight: 1,
                opacity: 0.3,
                dashArray: zone.level >= 80 ? "4 4" : undefined,
                className: "hotspot-ring",
              }}
            />
            {/* Cercle principal */}
            <Circle
              center={[zone.lat, zone.lng]}
              radius={zoneRadius(zone.level)}
              pathOptions={{
                color: zoneColor(zone.level),
                fillColor: zoneColor(zone.level),
                fillOpacity: zone.level >= 80 ? 0.22 : 0.14,
                weight: 2,
                opacity: 0.9,
              }}
            >
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: zoneColor(zone.level) }}>
                    {zone.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{
                      height: 5, flex: 1, background: "rgba(255,255,255,.1)", borderRadius: 3, overflow: "hidden",
                    }}>
                      <div style={{ width: `${zone.level}%`, height: "100%", background: zoneColor(zone.level), borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: zoneColor(zone.level) }}>{zone.level}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>
                    {zone.level >= 80 ? "⚠️ Axe saturé — éviter" : zone.level >= 60 ? "🟡 Trafic dense" : "✅ Circulation fluide"}
                  </div>
                  {zone.level >= 80 && (
                    <div style={{ marginTop: 8, padding: "6px 8px", background: "rgba(255,61,0,.1)", borderRadius: 8, fontSize: 11, color: "#FF3D00" }}>
                      Contournement conseillé via ARIA →
                    </div>
                  )}
                </div>
              </Popup>
            </Circle>
          </div>
        ))}

        {/* ── Véhicules en mouvement ── */}
        {vehicles.map(v => (
          <Marker
            key={v.id}
            position={[v.lat, v.lng]}
            icon={makeVehicleIcon(v.type, v.line)}
          >
            <Popup>
              <div style={{ fontSize: 12, minWidth: 140 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  {v.type === "taxibe" ? `🚌 Taxi-be ${v.line ?? ""}` : v.type === "moto" ? "🏍️ Taxi-moto" : "🚗 Véhicule"}
                </div>
                <div style={{ color: "rgba(255,255,255,.55)" }}>
                  Vitesse : <span style={{ color: v.speed < 10 ? "#FF3D00" : v.speed < 20 ? "#FFB300" : "#00D4A4", fontWeight: 600 }}>
                    {Math.round(v.speed)} km/h
                  </span>
                </div>
                <div style={{ color: "rgba(255,255,255,.4)", fontSize: 10, marginTop: 4 }}>
                  GPS mis à jour il y a 2s
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ── Overlay Infos Trajet ── */}
      {selectedTrajet && routeInfo && (
        <div className="route-info-card">
          <div className="route-dest">🎯 {selectedTrajet.to}</div>
          <div className="route-stats">
            <div className="stat-item">
              <span className="icon">📏</span>
              <span className="val">{routeInfo.distKm} km</span>
            </div>
            <div className="stat-item highlight">
              <span className="icon">🚗</span>
              <span className="val">{routeInfo.durCarMin} min</span>
            </div>
            <div className="stat-item">
              <span className="icon">🚌</span>
              <span className="val">{Math.round(routeInfo.durCarMin * 1.3)} min</span>
            </div>
            <div className="stat-item">
              <span className="icon">🚶</span>
              <span className="val">{routeInfo.durFootMin} min</span>
            </div>
          </div>
        </div>
      )}

      {/* Légende overlay */}
      <MapLegend />

      <style jsx>{`
        .route-info-card {
          position: absolute;
          bottom: 30px; left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          background: rgba(10, 14, 26, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 229, 160, 0.3);
          border-radius: 16px;
          padding: 16px 24px;
          display: flex; flex-direction: column; gap: 10px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 20px rgba(0,229,160,0.15);
          animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes slideUp {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .route-dest {
          color: #fff; font-size: 14px; font-weight: 800;
          text-align: center; letter-spacing: 0.05em;
        }
        .route-stats {
          display: flex; gap: 16px; justify-content: center;
        }
        .stat-item {
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.05);
          padding: 6px 12px; border-radius: 10px;
        }
        .stat-item.highlight {
          background: rgba(0, 229, 160, 0.15);
          border: 1px solid rgba(0, 229, 160, 0.4);
        }
        .stat-item .icon { font-size: 14px; }
        .stat-item .val { font-size: 13px; font-weight: 700; color: #fff; }
        .stat-item.highlight .val { color: #00E5A0; }
      `}</style>
    </div>
  );
}
