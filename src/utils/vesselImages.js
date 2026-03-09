// Maps vessel class names (from naval.json) to local image paths
const VESSEL_IMAGES = {
  // US Navy
  'Ford-class': '/images/vessels/ford-class-carrier.jpg',
  'Nimitz-class': '/images/vessels/nimitz-class-carrier.jpg',
  'Arleigh Burke-class': '/images/vessels/arleigh-burke-destroyer.jpg',
  'Wasp-class': '/images/vessels/wasp-class-lhd.jpg',
  'Virginia-class': '/images/vessels/virginia-class-submarine.jpg',

  // Royal Navy
  'Daring-class (Type 45)': '/images/vessels/type-45-destroyer.jpg',

  // Israeli Navy
  'Sa\'ar 6-class': '/images/vessels/saar-6-corvette.jpg',
  'Sa\'ar 5-class': '/images/vessels/saar-5-corvette.jpg',

  // German Navy
  'Sachsen-class (F124)': '/images/vessels/sachsen-class-frigate.jpg',

  // Russian Navy
  'Slava-class': '/images/vessels/slava-class-cruiser.jpg',

  // PLA Navy (China)
  'Type 001': '/images/vessels/type-001-carrier.jpg',
  'Type 002': '/images/vessels/type-002-carrier.jpg',

  // Iran Navy
  'Moudge-class': '/images/vessels/moudge-class-frigate.jpg',
}

export function getVesselImage(vesselClass) {
  return VESSEL_IMAGES[vesselClass] || null
}
