import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JSON_PATH = process.env.JSON_PATH || "./urban_bus_stops_madagascar_complete.json";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Définis SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const data = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

let cityIdByCode = new Map();

async function upsertCities() {
  const payload = [
    { code: "TNR", name: "Antananarivo" },
    { code: "FTU", name: "Fianarantsoa" },
  ];
  for (const c of payload) {
    const { error } = await supabase.from("cities").upsert(c, { onConflict: "code" });
    if (error) { console.error("cities error:", error.message); throw error; }
  }
  const { data: rows, error } = await supabase.from("cities").select("*");
  if (error) throw error;
  console.log(`✅ Cities: ${rows.length} villes`);
  return new Map(rows.map(r => [r.code, r.id]));
}

async function importCity(cityKey, cityCode) {
  const city_id = cityIdByCode.get(cityCode);
  if (!city_id) { console.warn(`⚠️ city_id introuvable pour ${cityCode}`); return; }

  // 1) Coopératives
  const coopSource = data[cityKey]?.cooperatives || [];
  if (coopSource.length > 0) {
    for (const ch of chunk(coopSource, 200)) {
      const payload = ch.map(co => ({
        city_id,
        source_id: co.id || null,
        name: co.nom,
        nom_complet: co.nom_complet || null,
        contact: co.contact || null,
        couleurs_principales: co.couleurs_principales || null,
        zone_couverture: co.zone_couverture || null,
      }));
      const { error } = await supabase.from("cooperatives").upsert(payload, { onConflict: "city_id,source_id" });
      if (error) { console.error(`❌ cooperatives (${cityCode}):`, error.message); }
    }
    console.log(`✅ Coopératives (${cityCode}): ${coopSource.length} insérées`);
  }

  // map coops
  const { data: coopRows } = await supabase.from("cooperatives").select("id, name").eq("city_id", city_id);
  const coopIdByName = new Map((coopRows || []).map(r => [r.name, r.id]));

  // 2) Hubs
  const hubs = data[cityKey]?.hubs_principaux || [];
  if (hubs.length > 0) {
    for (const ch of chunk(hubs, 200)) {
      const payload = ch.map(h => ({
        city_id,
        source_id: h.id || null,
        name: h.nom,
        hub_type: h.type || null,
        lat: h.coordonnees?.lat ?? null,
        lng: h.coordonnees?.lng ?? null,
        metadata: h,
      }));
      const { error } = await supabase.from("hubs").upsert(payload, { onConflict: "city_id,source_id" });
      if (error) { console.error(`❌ hubs (${cityCode}):`, error.message); }
    }
    console.log(`✅ Hubs (${cityCode}): ${hubs.length} insérés`);
  }

  // 3) Routes
  const lignes = data[cityKey]?.lignes_urbaines || [];
  if (lignes.length === 0) { console.log(`ℹ️ Aucune ligne pour ${cityCode}`); return; }

  for (const ch of chunk(lignes, 50)) {
    const payload = ch.map(l => ({
      city_id,
      source_id: l.source_id || null,
      route_number: l.numero,
      route_name: l.nom,
      cooperative_id: l.cooperative ? (coopIdByName.get(l.cooperative) ?? null) : null,
      color: l.couleur ?? null,
      route_type: l.type ?? null,
      tarif: l.tarif ?? null,
      premier_bus: l.premier_bus ?? null,
      dernier_bus: l.dernier_bus ?? null,
      metadata: l.metadata || {},
    }));
    const { error } = await supabase.from("routes").upsert(payload, { onConflict: "city_id,route_number" });
    if (error) { console.error(`❌ routes (${cityCode}):`, error.message); }
  }
  console.log(`✅ Routes (${cityCode}): ${lignes.length} insérées`);

  // map routes
  const { data: routeRows } = await supabase.from("routes").select("id, route_number").eq("city_id", city_id);
  const routeIdByNumber = new Map((routeRows || []).map(r => [r.route_number, r.id]));

  // 4) Directions + Stops
  let totalStops = 0;
  for (const ligne of lignes) {
    const route_id = routeIdByNumber.get(ligne.numero);
    if (!route_id) continue;

    const directions = [
      { label: "direction_a", obj: ligne.direction_a },
      { label: "direction_b", obj: ligne.direction_b },
    ].filter(d => d.obj);

    for (const d of directions) {
      const { error: dirErr } = await supabase.from("route_directions").upsert({
        route_id,
        direction_label: d.label,
        depart: d.obj.depart ?? null,
        arrivee: d.obj.arrivee ?? null,
        duration: d.obj.duree_moyenne ?? null,
        frequency_pointe: d.obj.frequence_pointe ?? null,
        frequency_normale: d.obj.frequence_normale ?? null,
        metadata: d.obj.metadata || {},
      }, { onConflict: "route_id,direction_label" });
      if (dirErr) { console.error(`❌ route_directions:`, dirErr.message); continue; }

      const { data: dirRows } = await supabase.from("route_directions").select("id").eq("route_id", route_id).eq("direction_label", d.label);
      const rd_id = dirRows?.[0]?.id;
      if (!rd_id) continue;

      const arrets = d.obj.arrets || d.obj.stops || [];
      if (arrets.length === 0) continue;

      // upsert stops
      const stopsPayload = arrets.map((a, i) => ({
        city_id,
        source_id: a.id || `${ligne.numero}_${d.label}_${i}`,
        name: a.nom,
        stop_type: a.type ?? null,
        lat: a.coordonnees?.lat ?? null,
        lng: a.coordonnees?.lng ?? null,
        services: a.services || null,
        metadata: a,
      }));
      const { error: stopErr } = await supabase.from("stops").upsert(stopsPayload, { onConflict: "city_id,source_id" });
      if (stopErr) { console.error(`❌ stops:`, stopErr.message); continue; }

      const sourceIds = stopsPayload.map(s => s.source_id);
      const { data: stopRows } = await supabase.from("stops").select("id, source_id").eq("city_id", city_id).in("source_id", sourceIds);
      const stopIdBySource = new Map((stopRows || []).map(r => [r.source_id, r.id]));

      const joinPayload = arrets.map((a, i) => {
        const src = a.id || `${ligne.numero}_${d.label}_${i}`;
        const stop_id = stopIdBySource.get(src);
        if (!stop_id) return null;
        return {
          route_direction_id: rd_id,
          stop_id,
          stop_order: i,
          temps_arret: a.temps_arret ?? null,
          correspondances: Array.isArray(a.correspondances) ? a.correspondances : [],
          metadata: a.metadata || {},
        };
      }).filter(Boolean);

      if (joinPayload.length > 0) {
        const { error: joinErr } = await supabase.from("route_direction_stops").upsert(joinPayload, { onConflict: "route_direction_id,stop_id" });
        if (joinErr) { console.error(`❌ route_direction_stops:`, joinErr.message); }
      }
      totalStops += arrets.length;
    }
  }
  console.log(`✅ Stops (${cityCode}): ~${totalStops} arrêts traités`);
}

async function main() {
  console.log("🚀 Démarrage de l'import...");
  cityIdByCode = await upsertCities();

  if (data.antananarivo) await importCity("antananarivo", "TNR");
  if (data.fianarantsoa) await importCity("fianarantsoa", "FTU");

  console.log("🎉 Import terminé avec succès !");
}

main().catch(e => {
  console.error("❌ Erreur fatale:", e.message);
  process.exit(1);
});
