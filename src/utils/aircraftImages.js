// Maps aircraft type names (from conflicts.json) to local image paths
const AIRCRAFT_IMAGES = {
  // Israel
  'F-35I Adir': '/images/aircraft/f-35i-adir.jpg',
  'F-16I Sufa': '/images/aircraft/f-16i-sufa.jpg',
  'F-15I Ra\'am': '/images/aircraft/f-15e-strike-eagle.jpg', // Same family
  'AH-64D Saraph': '/images/aircraft/ah-64d-saraph.jpg',
  'Hermes 900 Kochav': '/images/aircraft/hermes-900-kochav.jpg',
  'Hermes 450': '/images/aircraft/hermes-450.jpg',
  'Heron TP Eitan': '/images/aircraft/heron-tp-eitan.jpg',

  // Russia
  'Su-34 Fullback': '/images/aircraft/su-34-fullback.jpg',
  'Su-25 Frogfoot': '/images/aircraft/su-25-frogfoot.jpg',
  'Su-35S Flanker-E': '/images/aircraft/su-35s-flanker-e.jpg',
  'Su-24M Fencer': '/images/aircraft/su-24m-fencer.jpg',
  'Tu-95MS Bear': '/images/aircraft/tu-95ms-bear.jpg',
  'Tu-22M3 Backfire': '/images/aircraft/tu-22m3-backfire.jpg',
  'Ka-52 Alligator': '/images/aircraft/ka-52-alligator.jpg',

  // Ukraine
  'MiG-29 Fulcrum': '/images/aircraft/mig-29-fulcrum.jpg',
  'F-16AM Viper': '/images/aircraft/f-16am-viper.jpg',
  'Bayraktar TB2': '/images/aircraft/bayraktar-tb2.jpg',
  'Su-24M Fencer': '/images/aircraft/su-24m-fencer.jpg',

  // US / NATO
  'F/A-18E/F Super Hornet': '/images/aircraft/f-a-18e-f-super-hornet.jpg',
  'EA-18G Growler': '/images/aircraft/ea-18g-growler.jpg',
  'E-2D Advanced Hawkeye': '/images/aircraft/e-2d-advanced-hawkeye.jpg',
  'MQ-9A Reaper': '/images/aircraft/mq-9a-reaper.jpg',
  'Rafale M': '/images/aircraft/rafale-m.jpg',
  'Eurofighter Typhoon': '/images/aircraft/eurofighter-typhoon.jpg',
  'F-15E Strike Eagle': '/images/aircraft/f-15e-strike-eagle.jpg',
  'AC-130J Ghostrider': '/images/aircraft/ac-130j-ghostrider.jpg',
  'P-8A Poseidon': '/images/aircraft/p-8a-poseidon.jpg',

  // Houthis
  'Samad-3': null,
  'Waid': null,

  // Iran
  'Mohajer-6': '/images/aircraft/mohajer-6.jpg',
  'Shahed-129': '/images/aircraft/shahed-129.jpg',
  'Kowsar-88': '/images/aircraft/kowsar-88.jpg',

  // Chinese
  'J-20 Mighty Dragon': '/images/aircraft/j-20-mighty-dragon.jpg',
  'J-16': '/images/aircraft/j-16.jpg',
  'J-15 Flying Shark': '/images/aircraft/j-15-flying-shark.jpg',
  'H-6K/N': '/images/aircraft/h-6k-n.jpg',
  'GJ-11 Sharp Sword': null,
  'Wing Loong II': '/images/aircraft/wing-loong-ii.jpg',
  'Wing Loong I': '/images/aircraft/wing-loong-i.jpg',
  'CH-3 Rainbow': '/images/aircraft/ch-3-rainbow.jpg',
  'CH-4 Rainbow': '/images/aircraft/ch-3-rainbow.jpg', // Same family

  // Taiwan / Philippines
  'F-16V Viper': '/images/aircraft/f-16v-viper.jpg',
  'ScanEagle': '/images/aircraft/scaneagle.jpg',

  // Turkey
  'Bayraktar Akinci': '/images/aircraft/bayraktar-akinci.jpg',

  // Myanmar
  'Yak-130': '/images/aircraft/yak-130.jpg',
  'JF-17 Thunder': '/images/aircraft/jf-17-thunder.jpg',
  'Mi-35 Hind': '/images/aircraft/mi-35-hind.jpg',
  'DJI Mavic 3 (modified)': '/images/aircraft/dji-mavic-3-modified.jpg',

  // Sahel / Africa
  'L-39 Albatros': '/images/aircraft/l-39-albatros.jpg',
  'Mi-17 Hip': '/images/aircraft/mi-17-hip.jpg',
  'Mi-24 Hind': '/images/aircraft/mi-24-hind.jpg',
}

export function getAircraftImage(aircraftType) {
  return AIRCRAFT_IMAGES[aircraftType] || null
}
