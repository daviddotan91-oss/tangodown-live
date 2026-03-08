// Maps aircraft type names (from conflicts.json) to Wikipedia article slugs
// Wikipedia REST API returns a thumbnail image for each article
const AIRCRAFT_WIKI_SLUGS = {
  // Israel
  'F-35I Adir': 'Lockheed_Martin_F-35_Lightning_II',
  'F-16I Sufa': 'F-16I_Sufa',
  'F-15I Ra\'am': 'F-15I_Ra%27am',
  'AH-64D Saraph': 'Boeing_AH-64_Apache',
  'Hermes 900 Kochav': 'Elbit_Hermes_900',
  'Hermes 450': 'Elbit_Hermes_450',
  'Heron TP Eitan': 'IAI_Eitan',

  // Russia
  'Su-34 Fullback': 'Sukhoi_Su-34',
  'Su-25 Frogfoot': 'Sukhoi_Su-25',
  'Su-35S Flanker-E': 'Sukhoi_Su-35',
  'Su-24M Fencer': 'Sukhoi_Su-24',
  'Tu-95MS Bear': 'Tupolev_Tu-95',
  'Tu-22M3 Backfire': 'Tupolev_Tu-22M',
  'Ka-52 Alligator': 'Kamov_Ka-52',

  // Ukraine
  'MiG-29 Fulcrum': 'Mikoyan_MiG-29',
  'F-16AM Viper': 'General_Dynamics_F-16_Fighting_Falcon',
  'Bayraktar TB2': 'Bayraktar_TB2',

  // US / NATO
  'F/A-18E/F Super Hornet': 'Boeing_F/A-18E/F_Super_Hornet',
  'EA-18G Growler': 'Boeing_EA-18G_Growler',
  'E-2D Advanced Hawkeye': 'Northrop_Grumman_E-2_Hawkeye',
  'MQ-9A Reaper': 'General_Atomics_MQ-9_Reaper',
  'Rafale M': 'Dassault_Rafale',
  'Eurofighter Typhoon': 'Eurofighter_Typhoon',
  'F-15E Strike Eagle': 'McDonnell_Douglas_F-15E_Strike_Eagle',
  'AC-130J Ghostrider': 'Lockheed_AC-130',
  'P-8A Poseidon': 'Boeing_P-8_Poseidon',

  // Houthis
  'Samad-3': 'Samad_(unmanned_aerial_vehicle)',
  'Waid': 'Waid_(unmanned_aerial_vehicle)',

  // Iran
  'Mohajer-6': 'Mohajer-6',
  'Shahed-129': 'Shahed_129',
  'Kowsar-88': 'HESA_Kowsar',

  // Chinese
  'J-20 Mighty Dragon': 'Chengdu_J-20',
  'J-16': 'Shenyang_J-16',
  'J-15 Flying Shark': 'Shenyang_J-15',
  'H-6K/N': 'Xian_H-6',
  'GJ-11 Sharp Sword': 'GJ-11',
  'Wing Loong II': 'Wing_Loong_II',
  'Wing Loong I': 'Wing_Loong',
  'CH-3 Rainbow': 'CASC_Rainbow',
  'CH-4 Rainbow': 'CASC_Rainbow_4',

  // Taiwan / Philippines
  'F-16V Viper': 'General_Dynamics_F-16_Fighting_Falcon',
  'ScanEagle': 'Boeing_Insitu_ScanEagle',

  // Turkey
  'Bayraktar Akinci': 'Bayraktar_Akıncı',

  // Myanmar
  'Yak-130': 'Yakovlev_Yak-130',
  'JF-17 Thunder': 'CAC/PAC_JF-17_Thunder',
  'Mi-35 Hind': 'Mil_Mi-24',
  'DJI Mavic 3 (modified)': 'DJI_Mavic_3',

  // Sahel / Africa
  'L-39 Albatros': 'Aero_L-39_Albatros',
  'Mi-17 Hip': 'Mil_Mi-17',
  'Mi-24 Hind': 'Mil_Mi-24',

  // Ethiopia
  'Mi-35 Hind': 'Mil_Mi-24',
}

// In-memory cache so we don't re-fetch
const imageCache = {}

export async function fetchAircraftImage(aircraftType) {
  if (imageCache[aircraftType]) return imageCache[aircraftType]

  const slug = AIRCRAFT_WIKI_SLUGS[aircraftType]
  if (!slug) return null

  try {
    const resp = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`)
    if (!resp.ok) return null
    const data = await resp.json()
    const url = data.thumbnail?.source || data.originalimage?.source || null
    if (url) {
      // Request a larger thumbnail (640px wide)
      const largeUrl = url.replace(/\/\d+px-/, '/640px-')
      imageCache[aircraftType] = largeUrl
      return largeUrl
    }
  } catch {
    return null
  }
  return null
}
