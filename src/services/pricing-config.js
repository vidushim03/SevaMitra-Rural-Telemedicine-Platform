// Consultation fees based on Indian Government Hospital / CGHS rates (2025-26)
// Rural telemedicine platform pricing — affordable for Nabha-style rural blocks
export const CONSULTATION_FEES = {
  "General Physician": 50,
  Cardiologist: 200,
  Dermatologist: 100,
  Pediatrician: 100,
  Gynecologist: 150,
};

// Medicine prices based on Jan Aushadhi (Pradhan Mantri Bhartiya Jan Aushadhi Pariyojana)
// Prices are per strip/pack as sold at Jan Aushadhi Kendras across India

export const MEDICINE_PRICES = [
  {
    name: "Paracetamol",
    genericName: "Acetaminophen",
    strength: "500mg",
    form: "Tablet",
    pricePerStrip: 4,
    stripSize: 10,
  },
  {
    name: "Paracetamol",
    genericName: "Acetaminophen",
    strength: "650mg",
    form: "Tablet",
    pricePerStrip: 8,
    stripSize: 10,
  },
  {
    name: "Cetirizine",
    genericName: "Cetirizine HCl",
    strength: "10mg",
    form: "Tablet",
    pricePerStrip: 3,
    stripSize: 10,
  },
  {
    name: "Amlodipine",
    genericName: "Amlodipine Besylate",
    strength: "5mg",
    form: "Tablet",
    pricePerStrip: 8,
    stripSize: 10,
  },
  {
    name: "Metformin",
    genericName: "Metformin HCl",
    strength: "500mg",
    form: "Tablet",
    pricePerStrip: 12,
    stripSize: 10,
  },
  {
    name: "Omeprazole",
    genericName: "Omeprazole",
    strength: "20mg",
    form: "Capsule",
    pricePerStrip: 9,
    stripSize: 10,
  },
  {
    name: "Amoxicillin",
    genericName: "Amoxicillin",
    strength: "500mg",
    form: "Capsule",
    pricePerStrip: 32,
    stripSize: 10,
  },
  {
    name: "Azithromycin",
    genericName: "Azithromycin",
    strength: "250mg",
    form: "Tablet",
    pricePerStrip: 40,
    stripSize: 6,
  },
  {
    name: "Cough Syrup",
    genericName: "Dextromethorphan + Chlorpheniramine",
    strength: "100ml",
    form: "Syrup",
    pricePerStrip: 35,
    stripSize: 1,
  },
  {
    name: "Pantoprazole",
    genericName: "Pantoprazole",
    strength: "40mg",
    form: "Tablet",
    pricePerStrip: 12,
    stripSize: 10,
  },
  {
    name: "Ibuprofen",
    genericName: "Ibuprofen",
    strength: "400mg",
    form: "Tablet",
    pricePerStrip: 5,
    stripSize: 10,
  },
  {
    name: "Diclofenac",
    genericName: "Diclofenac Sodium",
    strength: "50mg",
    form: "Tablet",
    pricePerStrip: 4,
    stripSize: 10,
  },
  {
    name: "Losartan",
    genericName: "Losartan Potassium",
    strength: "50mg",
    form: "Tablet",
    pricePerStrip: 15,
    stripSize: 10,
  },
  {
    name: "Atorvastatin",
    genericName: "Atorvastatin Calcium",
    strength: "10mg",
    form: "Tablet",
    pricePerStrip: 22,
    stripSize: 10,
  },
  {
    name: "Salbutamol Inhaler",
    genericName: "Salbutamol",
    strength: "100mcg",
    form: "Inhaler",
    pricePerStrip: 120,
    stripSize: 1,
  },
  {
    name: "ORS Sachets",
    genericName: "Oral Rehydration Salts",
    strength: "1L",
    form: "Powder",
    pricePerStrip: 18,
    stripSize: 10,
  },
];

export function getMedicinePrice(name) {
  return MEDICINE_PRICES.find(
    (m) => m.name.toLowerCase() === name.toLowerCase(),
  );
}

export function getConsultationFee(specialty) {
  return CONSULTATION_FEES[specialty] ?? 50;
}
