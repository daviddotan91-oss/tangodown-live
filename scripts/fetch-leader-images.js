/**
 * Fetch leader images from Wikipedia API
 * Saves to public/images/leaders/{id}.jpg
 * Updates leaders.json with image paths
 */

import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LEADERS_PATH = path.join(__dirname, '..', 'public', 'data', 'leaders.json')
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'leaders')

// Some leaders have Wikipedia article names that differ from their display name
const WIKI_OVERRIDES = {
  'le-006': 'Abu_Bakr_al-Baghdadi',
  'le-008': 'Osama_bin_Laden',
  'le-081': 'Jihadi_John',
  'le-082': 'Abu_Omar_al-Shishani',
  'le-089': 'Haji_Bakr',
  'le-180': 'Abu_Musab_al-Zarqawi',
  'le-017': 'Yahya_Sinwar',
  'le-002': 'Ismail_Haniyeh',
  'le-001': 'Hassan_Nasrallah',
  'le-007': 'Qasem_Soleimani',
  'le-012': 'Mohammed_Deif',
  'le-061': 'Imad_Mughniyeh',
  'le-005': 'Ayman_al-Zawahiri',
  'le-100': 'Anwar_al-Awlaki',
  'le-011': 'Yevgeny_Prigozhin',
  'le-016': 'Abubakar_Shekau',
  'le-010': 'Ibrahim_Aqil',
  'le-003': 'Fuad_Shukr',
  'le-004': 'Saleh_al-Arouri',
  'le-130': 'Akhtar_Mansour',
  'le-131': 'Mullah_Dadullah',
  'le-132': 'Baitullah_Mehsud',
  'le-133': 'Hakimullah_Mehsud',
  'le-140': 'Abu_Mahdi_al-Muhandis',
  'le-120': 'Ahmed_Abdi_Godane',
  'le-170': 'Ahmed_Jabari',
  'le-171': 'Sheikh_Ahmed_Yassin',
  'le-172': 'Abdel_Aziz_al-Rantisi',
  'le-173': 'Mahmoud_al-Mabhouh',
  'le-175': 'Salah_Shehade',
  'le-176': 'Yahya_Ayyash',
  'le-062': 'Mustafa_Badreddine',
  'le-063': 'Samir_Kuntar',
  'le-080': 'Abu_Muhammad_al-Adnani',
  'le-084': 'Turki_al-Binali',
  'le-102': 'Nasir_al-Wuhayshi',
  'le-106': 'Jamal_al-Badawi',
  'le-198': 'Bassem_Issa',
  'le-150': 'Dmitry_Utkin',
  'le-015': 'Hashem_Safieddine',
  'le-064': 'Ali_Karaki',
  'le-069': 'Nabil_Kaouk',
  'la-002': 'Ali_Khamenei',
  'la-003': 'Esmail_Qaani',
  'la-004': 'Abdul-Malik_al-Houthi',
  'la-005': 'Naim_Qassem',
  'la-009': 'Saif_al-Adel',
  'la-010': 'Hibatullah_Akhundzada',
  'la-011': 'Sirajuddin_Haqqani',
  'la-008': 'Iyad_ag_Ghali',
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    mod.get(url, { headers: { 'User-Agent': 'TangoDownBot/1.0 (defense-intelligence-dashboard)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJSON(res.headers.location).then(resolve).catch(reject)
      }
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(new Error(`JSON parse error: ${e.message}`)) }
      })
    }).on('error', reject)
  })
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    mod.get(url, { headers: { 'User-Agent': 'TangoDownBot/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`))
      }
      const stream = fs.createWriteStream(dest)
      res.pipe(stream)
      stream.on('finish', () => { stream.close(); resolve(true) })
      stream.on('error', reject)
    }).on('error', reject)
  })
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function getWikipediaImage(name, id) {
  // Use override if available, otherwise clean the name for Wikipedia
  const wikiTitle = WIKI_OVERRIDES[id] || name.replace(/ /g, '_')

  const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`

  try {
    const data = await fetchJSON(apiUrl)
    if (data.thumbnail?.source) {
      // Get a reasonable size (300px wide)
      let imgUrl = data.thumbnail.source
      // Wikipedia thumbnails can be resized by changing the /XXXpx- part
      imgUrl = imgUrl.replace(/\/\d+px-/, '/300px-')
      return imgUrl
    }
    // Try originalimage if no thumbnail
    if (data.originalimage?.source) {
      return data.originalimage.source
    }
  } catch (e) {
    // Try without special characters
    const simpleName = name.replace(/[''`]/g, '').replace(/\s+/g, '_')
    if (simpleName !== wikiTitle) {
      try {
        const data2 = await fetchJSON(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(simpleName)}`)
        if (data2.thumbnail?.source) {
          return data2.thumbnail.source.replace(/\/\d+px-/, '/300px-')
        }
      } catch (e2) {
        // give up
      }
    }
  }
  return null
}

async function main() {
  const leaders = JSON.parse(fs.readFileSync(LEADERS_PATH, 'utf8'))
  const allLeaders = [...leaders.eliminated, ...leaders.active]

  let found = 0
  let notFound = 0
  let skipped = 0

  for (const leader of allLeaders) {
    const ext = 'jpg'
    const filename = `${leader.id}.${ext}`
    const destPath = path.join(IMAGES_DIR, filename)

    // Skip if already downloaded
    if (fs.existsSync(destPath)) {
      const stat = fs.statSync(destPath)
      if (stat.size > 1000) {
        leader.image = `/images/leaders/${filename}`
        skipped++
        console.log(`  SKIP ${leader.name} (already exists)`)
        continue
      }
    }

    console.log(`  Fetching image for: ${leader.name} (${leader.id})...`)

    const imgUrl = await getWikipediaImage(leader.name, leader.id)

    if (imgUrl) {
      try {
        await downloadFile(imgUrl, destPath)
        const stat = fs.statSync(destPath)
        if (stat.size > 1000) {
          leader.image = `/images/leaders/${filename}`
          found++
          console.log(`    ✓ Downloaded (${(stat.size / 1024).toFixed(0)}KB)`)
        } else {
          fs.unlinkSync(destPath)
          notFound++
          console.log(`    ✗ Too small, removed`)
        }
      } catch (e) {
        notFound++
        console.log(`    ✗ Download failed: ${e.message}`)
      }
    } else {
      notFound++
      console.log(`    ✗ No image found on Wikipedia`)
    }

    // Rate limit — be nice to Wikipedia
    await sleep(2500)
  }

  // Write updated leaders.json
  fs.writeFileSync(LEADERS_PATH, JSON.stringify(leaders, null, 2))

  console.log(`\n=== DONE ===`)
  console.log(`Found: ${found}`)
  console.log(`Skipped (existing): ${skipped}`)
  console.log(`Not found: ${notFound}`)
  console.log(`Total: ${allLeaders.length}`)
}

main().catch(console.error)
