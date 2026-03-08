#!/bin/bash
OUT="$(dirname "$0")/../public/images/aircraft"
mkdir -p "$OUT"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

declare -A SLUGS
SLUGS["f-35i-adir"]="Lockheed_Martin_F-35_Lightning_II"
SLUGS["f-16i-sufa"]="F-16I_Sufa"
SLUGS["f-15i-raam"]="F-15I_Ra%27am"
SLUGS["ah-64d-saraph"]="Boeing_AH-64_Apache"
SLUGS["hermes-900-kochav"]="Elbit_Hermes_900"
SLUGS["hermes-450"]="Elbit_Hermes_450"
SLUGS["heron-tp-eitan"]="IAI_Eitan"
SLUGS["su-34-fullback"]="Sukhoi_Su-34"
SLUGS["su-25-frogfoot"]="Sukhoi_Su-25"
SLUGS["su-35s-flanker-e"]="Sukhoi_Su-35"
SLUGS["su-24m-fencer"]="Sukhoi_Su-24"
SLUGS["tu-95ms-bear"]="Tupolev_Tu-95"
SLUGS["tu-22m3-backfire"]="Tupolev_Tu-22M"
SLUGS["ka-52-alligator"]="Kamov_Ka-52"
SLUGS["mig-29-fulcrum"]="Mikoyan_MiG-29"
SLUGS["f-16am-viper"]="General_Dynamics_F-16_Fighting_Falcon"
SLUGS["bayraktar-tb2"]="Bayraktar_TB2"
SLUGS["f-a-18e-f-super-hornet"]="Boeing_F/A-18E/F_Super_Hornet"
SLUGS["ea-18g-growler"]="Boeing_EA-18G_Growler"
SLUGS["e-2d-advanced-hawkeye"]="Northrop_Grumman_E-2_Hawkeye"
SLUGS["mq-9a-reaper"]="General_Atomics_MQ-9_Reaper"
SLUGS["rafale-m"]="Dassault_Rafale"
SLUGS["eurofighter-typhoon"]="Eurofighter_Typhoon"
SLUGS["f-15e-strike-eagle"]="McDonnell_Douglas_F-15E_Strike_Eagle"
SLUGS["ac-130j-ghostrider"]="Lockheed_AC-130"
SLUGS["p-8a-poseidon"]="Boeing_P-8_Poseidon"
SLUGS["samad-3"]="Samad_(unmanned_aerial_vehicle)"
SLUGS["waid"]="Waid_(unmanned_aerial_vehicle)"
SLUGS["mohajer-6"]="Mohajer-6"
SLUGS["shahed-129"]="Shahed_129"
SLUGS["kowsar-88"]="HESA_Kowsar"
SLUGS["j-20-mighty-dragon"]="Chengdu_J-20"
SLUGS["j-16"]="Shenyang_J-16"
SLUGS["j-15-flying-shark"]="Shenyang_J-15"
SLUGS["h-6k-n"]="Xian_H-6"
SLUGS["gj-11-sharp-sword"]="GJ-11"
SLUGS["wing-loong-ii"]="Wing_Loong_II"
SLUGS["wing-loong-i"]="Wing_Loong"
SLUGS["ch-3-rainbow"]="CASC_Rainbow"
SLUGS["ch-4-rainbow"]="CASC_Rainbow_4"
SLUGS["f-16v-viper"]="General_Dynamics_F-16_Fighting_Falcon"
SLUGS["scaneagle"]="Boeing_Insitu_ScanEagle"
SLUGS["bayraktar-akinci"]="Bayraktar_Ak%C4%B1nc%C4%B1"
SLUGS["yak-130"]="Yakovlev_Yak-130"
SLUGS["jf-17-thunder"]="CAC/PAC_JF-17_Thunder"
SLUGS["mi-35-hind"]="Mil_Mi-24"
SLUGS["mi-24-hind"]="Mil_Mi-24"
SLUGS["dji-mavic-3-modified"]="DJI_Mavic_3"
SLUGS["l-39-albatros"]="Aero_L-39_Albatros"
SLUGS["mi-17-hip"]="Mil_Mi-17"

for name in "${!SLUGS[@]}"; do
  dest="$OUT/${name}.jpg"
  if [ -f "$dest" ] && [ -s "$dest" ]; then
    echo "SKIP $name"
    continue
  fi
  slug="${SLUGS[$name]}"
  url=$(curl -s -H "User-Agent: $UA" "https://en.wikipedia.org/api/rest_v1/page/summary/${slug}" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log(j.originalimage?.source||j.thumbnail?.source||'')})")
  if [ -z "$url" ]; then
    echo "MISS $name"
    continue
  fi
  curl -s -L -H "User-Agent: $UA" -o "$dest" "$url"
  if [ -s "$dest" ]; then
    echo "OK   $name ($(du -k "$dest" | cut -f1)K)"
  else
    echo "FAIL $name"
    rm -f "$dest"
  fi
  sleep 2
done
echo "DONE"
