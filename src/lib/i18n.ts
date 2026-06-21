export type Language = "fr" | "mg";

type Translations = Record<string, string>;

export const fr: Translations = {
  // Navigation & General
  "nav.notifs": "Notifs",
  "nav.history": "Historique",
  "nav.favs": "Favoris",
  "nav.settings": "Config",
  "menu.extra": "Menu Supplémentaire",
  
  // Settings
  "settings.title": "Paramètres de l'App",
  "settings.push": "Notifications Push",
  "settings.eco": "Mode Économie de données",
  "settings.voice": "Voix ARIA Automatique",
  "settings.lang": "Langue de l'interface",
  
  // Notifications
  "notifs.title": "Notifications Récentes",
  "notifs.1": "Gros embouteillage signalé à Anosizato (il y a 5 min)",
  "notifs.2": "Ligne 119 très fluide aujourd'hui.",
  "notifs.3": "Météo : Risque d'averses ce soir à 17h.",

  // History & Favs
  "history.title": "Historique des Trajets",
  "history.time.1": "Hier à 16:30",
  "history.time.2": "Il y a 2 jours",
  "history.time.3": "La semaine dernière",
  "favs.title": "Chemins Favoris",
  "favs.home_work": "Maison ↔ Travail",
  "favs.uni": "Université",
  "favs.add": "+ Ajouter un favori",

  // Simulation
  "sim.start": "Lancer la Simulation",
  "sim.stop": "Arrêter la Simulation",

  // Tabs
  "tab.route": "Itinéraire",
  "tab.voice": "Vocal",
  "tab.meteo": "Prédiction",
  "tab.trust": "Confiance",
  "tab.escape": "Secours",

  // Multimodal Tab
  "route.title": "Itinéraire Multimodal",
  "route.sub": "Taxi-be + Marche à pied optimisés",
  "route.alert": "Bouchon détecté à Anosizato. Itinéraire alternatif calculé par ARIA.",
  "route.walk": "Mandeha tongotra",
  "route.total": "Durée totale estimée",
  "route.ask": "Demander à ARIA",

  // Voice Tab
  "voice.title": "Signalement Vocal",
  "voice.sub": "Parlez en malgache ou français",
  "voice.hold": "Maintenir pour parler",
  "voice.release": "Relâcher pour envoyer",
  "voice.examples": "Exemples :",
  "voice.analyze": "ARIA analyse votre message…",
  "voice.transcription": "Transcription ARIA",
  "voice.confirm": "Confirmer et envoyer",

  // Prediction Tab
  "meteo.title": "Météo du Trafic",
  "meteo.sub": "Prédictions intelligentes d'ARIA",
  "meteo.aria": "Demain est un vendredi de fin de mois. Le trafic vers le centre-ville sera saturé dès 15h. Je recommande d'anticiper ton départ à 14h ou de choisir la voie via Ambohipo.",

  // Trust Tab
  "trust.title": "Fiabilité des Lignes",
  "trust.sub": "Votes communautaires en temps réel",
  "trust.votes": "votes",
  "trust.reliable": "fiable",

  // Escape Tab
  "escape.title": "Sortie de Secours",
  "escape.sub": "Analyse GPS en temps réel par ARIA",
  "escape.intro": "Coincé dans un embouteillage ? ARIA analyse votre position GPS et les rapports communautaires pour vous proposer une sortie de secours immédiate.",
  "escape.scan": "Analyser ma position",
  "escape.scanning": "ARIA scanne les axes autour de vous…",
  "escape.blocked": "Blocage détecté — 2.2 km sur votre axe",
  "escape.wait": "Temps d'attente estimé :",
  "escape.graph": "Congestion sur votre axe",
  "escape.fluid": "Fluide",
  "escape.dense": "Dense",
  "escape.blocked_short": "Bloqué",
  "escape.aria": "Le bus est bloqué pour au moins 45 minutes. Je vous conseille de descendre au prochain arrêt (à 150m) et de marcher jusqu'à l'axe parallèle pour prendre la ligne 194 qui roule parfaitement.",
  "escape.gain": "Gain estimé",
  "escape.gain_val": "33 min gagnées",
  "escape.ask": "Détailler avec ARIA",

  // Map
  "map.realtime": "CARTE TEMPS RÉEL",
  "map.critical": "zones critiques",
  "map.legend": "LÉGENDE",
  "map.legend.jam": "Bouchon ≥ 80%",
  "map.legend.dense": "Dense 60–79%",
  "map.legend.fluid": "Fluide < 60%",
  "map.legend.bus": "Taxi-be (live GPS)",
  "map.legend.car": "Voiture particulière",
  "map.legend.moto": "Taxi-moto",
  "map.legend.pedestrian": "Piétons en direct",
  "map.sim_active": "Live Simulation active",
  "map.gps_updated": "GPS mis à jour à l'instant",
  "map.speed": "Vitesse :",
};

export const mg: Translations = {
  // Navigation & General
  "nav.notifs": "Fampilazana",
  "nav.history": "Tantara",
  "nav.favs": "Ankafizina",
  "nav.settings": "Fikirana",
  "menu.extra": "Sakafo fanampiny",
  
  // Settings
  "settings.title": "Fikiran'ny Rindranasa",
  "settings.push": "Fampilazana Push",
  "settings.eco": "Hitsitsy Data",
  "settings.voice": "Feo ARIA Mandeha Ho Azy",
  "settings.lang": "Fiteny ampiasaina",
  
  // Notifications
  "notifs.title": "Fampilazana farany",
  "notifs.1": "Fitohanana be ao Anosizato (5 minitra lasa)",
  "notifs.2": "Tena mandeha tsara ny zotra 119 anio.",
  "notifs.3": "Toetr'andro: Ahiana hisy orana anio hariva amin'ny 5 ora.",

  // History & Favs
  "history.title": "Tantaran'ny Lalana",
  "history.time.1": "Omaly tamin'ny 16:30",
  "history.time.2": "2 andro lasa izay",
  "history.time.3": "Tamin'ny herinandro",
  "favs.title": "Lalana ankafizina",
  "favs.home_work": "Trano ↔ Asa",
  "favs.uni": "Oniversite",
  "favs.add": "+ Ampio ankafizina",

  // Simulation
  "sim.start": "Alefa ny Simulation",
  "sim.stop": "Atsaharo ny Simulation",

  // Tabs
  "tab.route": "Lalana",
  "tab.voice": "Feo",
  "tab.meteo": "Tombana",
  "tab.trust": "Fahatokisana",
  "tab.escape": "Vonjy",

  // Multimodal Tab
  "route.title": "Lalana Mifangaro",
  "route.sub": "Taxi-be + Mandeha tongotra tsara indrindra",
  "route.alert": "Fitohanana hita ao Anosizato. Lalana hafa naroson'i ARIA.",
  "route.walk": "Mandeha tongotra",
  "route.total": "Faharetana tombanana",
  "route.ask": "Hanontany an'i ARIA",

  // Voice Tab
  "voice.title": "Filazana amin'ny feo",
  "voice.sub": "Mitenena amin'ny teny malagasy na frantsay",
  "voice.hold": "Tsindrio lava raha hiteny",
  "voice.release": "Avotsory mba handefa",
  "voice.examples": "Ohatra:",
  "voice.analyze": "Famakafakana ataon'i ARIA…",
  "voice.transcription": "Soratra avy amin'i ARIA",
  "voice.confirm": "Hamafiso sy alefaso",

  // Prediction Tab
  "meteo.title": "Toetr'andron'ny fifamoivoizana",
  "meteo.sub": "Tombana marani-tsaina avy amin'i ARIA",
  "meteo.aria": "Rahampitso zoma faran'ny volana. Ho feno hipoka ny lalana mankany afovoan-tanàna manomboka amin'ny 3 ora tolakandro. Manoro hevitra anao aho hiainga amin'ny 2 ora na handeha amin'ny lalan'Ambohipo.",

  // Trust Tab
  "trust.title": "Fahatokisan'ny zotra",
  "trust.sub": "Latsabato avy amin'ny mpampiasa amin'izao fotoana izao",
  "trust.votes": "vato",
  "trust.reliable": "azo antoka",

  // Escape Tab
  "escape.title": "Lalan-kivoahana (Vonjy)",
  "escape.sub": "Famakafakana GPS ataon'i ARIA",
  "escape.intro": "Tavela anaty fitohanana ? Fakafakain'i ARIA ny toerana misy anao sy ny tatitra avy amin'ny mpampiasa hanomezana lalan-kivoahana haingana.",
  "escape.scan": "Fakafakao ny toerana misy ahy",
  "escape.scanning": "Mijery ny lalana manodidina anao i ARIA…",
  "escape.blocked": "Fitohanana hita — 2.2 km eo amin'ny lalanao",
  "escape.wait": "Fotoana iandrasana tombanana :",
  "escape.graph": "Fitohanana eo amin'ny lalanao",
  "escape.fluid": "Mandeha",
  "escape.dense": "Be olona",
  "escape.blocked_short": "Tsy mandeha",
  "escape.aria": "Bilaoky ny aotobisy mandritra ny 45 minitra farafahakeliny. Manoro hevitra anao aho hidina amin'ny fiantsonana manaraka (150m) ary handeha tongotra hatramin'ny lalana mifanindran-dalana hakàna ny zotra 194 izay mandeha tsara.",
  "escape.gain": "Tombony azo",
  "escape.gain_val": "33 minitra tombony",
  "escape.ask": "Andinindininy miaraka amin'i ARIA",

  // Map
  "map.realtime": "SARY AN-TSARITANY ZIMIA",
  "map.critical": "faritra saro-pady",
  "map.legend": "TOROLALANA",
  "map.legend.jam": "Fitohanana ≥ 80%",
  "map.legend.dense": "Somary feno 60–79%",
  "map.legend.fluid": "Mandeha < 60%",
  "map.legend.bus": "Taxi-be (GPS zimia)",
  "map.legend.car": "Fiara manokana",
  "map.legend.moto": "Taxi-moto",
  "map.legend.pedestrian": "Mpandeha an-tongotra zimia",
  "map.sim_active": "Simulation mandeha",
  "map.gps_updated": "GPS nohavaozina teo",
  "map.speed": "Hafainganam-pandeha :",
};

export const dictionaries = { fr, mg };
