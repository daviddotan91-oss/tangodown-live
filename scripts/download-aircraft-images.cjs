// Downloads aircraft images from Wikipedia and saves them locally
const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

const AIRCRAFT_WIKI_SLUGS = {
  'F-35I Adir': 'Lockheed_Martin_F-35_Lightning_II',
  'F-16I Sufa': 'F-16I_Sufa',
  'F-15I Ra\'am': 'F-15I_Ra%27am',
  'AH-64D Saraph': 'Boeing_AH-64_Apache',
  'Hermes 900 Kochav': 'Elbit_Hermes_900',
  'Hermes 450': 'Elbit_Hermes_450',
  'Heron TP Eitan': 'IAI_Eitan',
  'Su-34 Fullback': 'Sukhoi_Su-34',
  'Su-25 Frogfoot': 'Sukhoi_Su-25',
  'Su-35S Flanker-E': 'Sukhoi_Su-35',
  'Su-24M Fencer': 'Sukhoi_Su-24',
  'Tu-95MS Bear': 'Tupolev_Tu-95',
  'Tu-22M3 Backfire': 'Tupolev_Tu-22M',
  'Ka-52 Alligator': 'Kamov_Ka-52',
  'MiG-29 Fulcrum': 'Mikoyan_MiG-29',
  'F-16AM Viper': 'General_Dynamics_F-16_Fighting_Falcon',
  'Bayraktar TB2': 'Bayraktar_TB2',
  'F/A-18E/F Super Hornet': 'Boeing_F/A-18E/F_Super_Hornet',
  'EA-18G Growler': 'Boeing_EA-18G_Growler',
  'E-2D Advanced Hawkeye': 'Northrop_Grumman_E-2_Hawkeye',
  'MQ-9A Reaper': 'General_Atomics_MQ-9_Reaper',
  'Rafale M': 'Dassault_Rafale',
  'Eurofighter Typhoon': 'Eurofighter_Typhoon',
  'F-15E Strike Eagle': 'McDonnell_Douglas_F-15E_Strike_Eagle',
  'AC-130J Ghostrider': 'Lockheed_AC-130',
  'P-8A Poseidon': 'Boeing_P-8_Poseidon',
  'Samad-3': 'Samad_(unmanned_aerial_vehicle)',
  'Waid': 'Waid_(unmanned_aerial_vehicle)',
  'Mohajer-6': 'Mohajer-6',
  'Shahed-129': 'Shahed_129',
  'Kowsar-88': 'HESA_Kowsar',
  'J-20 Mighty Dragon': 'Chengdu_J-20',
  'J-16': 'Shenyang_J-16',
  'J-15 Flying Shark': 'Shenyang_J-15',
  'H-6K/N': 'Xian_H-6',
  'GJ-11 Sharp Sword': 'GJ-11',
  'Wing Loong II': 'Wing_Loong_II',
  'Wing Loong I': 'Wing_Loong',
  'CH-3 Rainbow': 'CASC_Rainbow',
  'CH-4 Rainbow': 'CASC_Rainbow_4',
  'F-16V Viper': 'General_Dynamics_F-16_Fighting_Falcon',
  'ScanEagle': 'Boeing_Insitu_ScanEagle',
  'Bayraktar Akinci': 'Bayraktar_Ak%C4%B1nc%C4%B1',
  'Yak-130': 'Yakovlev_Yak-130',
  'JF-17 Thunder': 'CAC/PAC_JF-17_Thunder',
  'Mi-35 Hind': 'Mil_Mi-24',
  'Mi-24 Hind': 'Mil_Mi-24',
  'DJI Mavic 3 (modified)': 'DJI_Mavic_3',
  'L-39 Albatros': 'Aero_L-39_Albatros',
  'Mi-17 Hip': 'Mil_Mi-17',
}

const OUT_DIR = path.join(__dirname, '..', 'public', 'images', 'aircraft')

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const get = url.startsWith('https') ? https.get : http.get
    get(url, { headers: { 'User-Agent': 'TangoDownBot/1.0' } }, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const get = url.startsWith('https') ? https.get : http.get
    get(url, { headers: { 'User-Agent': 'TangoDownBot/1.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`))
      const ws = fs.createWriteStream(dest)
      res.pipe(ws)
      ws.on('finish', () => { ws.close(); resolve() })
      ws.on('error', reject)
    }).on('error', reject)
  })
}

function slugifyName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').replace(/^-+/, '')
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const entries = Object.entries(AIRCRAFT_WIKI_SLUGS)
  // Deduplicate slugs (F-16V and F-16AM both point to same article)
  const seen = new Set()

  for (const [name, slug] of entries) {
    const filename = slugifyName(name) + '.jpg'
    const dest = path.join(OUT_DIR, filename)

    if (fs.existsSync(dest)) {
      console.log(`SKIP ${name} (already exists)`)
      continue
    }

    try {
      const summary = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`)
      const thumbUrl = summary.thumbnail?.source || summary.originalimage?.source
      if (!thumbUrl) {
        console.log(`MISS ${name} — no image on Wikipedia`)
        continue
      }
      // Get 640px version
      const bigUrl = thumbUrl.replace(/\/\d+px-/, '/640px-')
      await downloadFile(bigUrl, dest)
      console.log(`OK   ${name} → ${filename}`)
    } catch (e) {
      console.log(`FAIL ${name} — ${e.message}`)
    }
    // Rate limit
    await new Promise(r => setTimeout(r, 1500))
  }
  console.log('\nDone!')
}

main()
