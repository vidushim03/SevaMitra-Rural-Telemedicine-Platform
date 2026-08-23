export const pharmacies = [
  {
    id: 1,
    name: "Apollo Pharmacy",
    baseAddress: "Main Market, Sector 12",
    phone: "+91 98765 43210",
    isOpen: true,
    rating: 4.5,
    openHours: "8:00 AM - 10:00 PM",
    coordinates: { lat: 30.7333, lng: 76.7794 },
  },
  {
    id: 2,
    name: "MedPlus",
    baseAddress: "Civil Lines",
    phone: "+91 98765 43211",
    isOpen: true,
    rating: 4.2,
    openHours: "9:00 AM - 9:00 PM",
    coordinates: { lat: 30.74, lng: 76.78 },
  },
  {
    id: 3,
    name: "Local Medical Store",
    baseAddress: "Village Center",
    phone: "+91 98765 43212",
    isOpen: false,
    rating: 3.8,
    openHours: "9:00 AM - 6:00 PM",
    coordinates: { lat: 30.72, lng: 76.77 },
  },
  {
    id: 4,
    name: "Health Plus Pharmacy",
    baseAddress: "Near Bus Stand",
    phone: "+91 98765 43213",
    isOpen: true,
    rating: 4.0,
    openHours: "24 Hours",
    coordinates: { lat: 30.735, lng: 76.775 },
  },
  {
    id: 5,
    name: "City Care Chemist",
    baseAddress: "Hospital Road",
    phone: "+91 98765 43214",
    isOpen: true,
    rating: 4.3,
    openHours: "8:00 AM - 11:00 PM",
    coordinates: { lat: 30.728, lng: 76.782 },
  },
  {
    id: 6,
    name: "Quick Meds",
    baseAddress: "Shopping Complex",
    phone: "+91 98765 43215",
    isOpen: true,
    rating: 3.9,
    openHours: "10:00 AM - 8:00 PM",
    coordinates: { lat: 30.738, lng: 76.778 },
  },
];

// Medicine prices based on Jan Aushadhi (Pradhan Mantri Bhartiya Jan Aushadhi Pariyojana)
export const medicines = [
  {
    id: 1,
    name: "Paracetamol",
    genericName: "Acetaminophen",
    strength: "500mg",
    form: "Tablet",
    manufacturer: "Jan Aushadhi",
    price: "₹4",
    stocks: {
      1: { quantity: 500, status: "in_stock", lastUpdated: "2026-08-18 10:30" },
      2: { quantity: 300, status: "in_stock", lastUpdated: "2026-08-18 09:45" },
      3: {
        quantity: 0,
        status: "out_of_stock",
        lastUpdated: "2026-08-17 18:00",
      },
      4: { quantity: 200, status: "in_stock", lastUpdated: "2026-08-18 11:15" },
      5: { quantity: 80, status: "in_stock", lastUpdated: "2026-08-18 10:45" },
      6: { quantity: 30, status: "low_stock", lastUpdated: "2026-08-18 09:30" },
    },
  },
  {
    id: 2,
    name: "Cetirizine",
    genericName: "Cetirizine HCl",
    strength: "10mg",
    form: "Tablet",
    manufacturer: "Jan Aushadhi",
    price: "₹3",
    stocks: {
      1: { quantity: 400, status: "in_stock", lastUpdated: "2026-08-18 11:00" },
      2: { quantity: 150, status: "in_stock", lastUpdated: "2026-08-18 10:15" },
      3: { quantity: 60, status: "in_stock", lastUpdated: "2026-08-18 08:30" },
      4: { quantity: 250, status: "in_stock", lastUpdated: "2026-08-18 12:00" },
      5: { quantity: 40, status: "low_stock", lastUpdated: "2026-08-18 11:30" },
      6: { quantity: 100, status: "in_stock", lastUpdated: "2026-08-18 10:00" },
    },
  },
  {
    id: 3,
    name: "Amlodipine",
    genericName: "Amlodipine Besylate",
    strength: "5mg",
    form: "Tablet",
    manufacturer: "Jan Aushadhi",
    price: "₹8",
    stocks: {
      1: { quantity: 300, status: "in_stock", lastUpdated: "2026-08-18 12:00" },
      2: { quantity: 200, status: "in_stock", lastUpdated: "2026-08-18 11:30" },
      3: { quantity: 20, status: "low_stock", lastUpdated: "2026-08-18 07:45" },
      4: { quantity: 180, status: "in_stock", lastUpdated: "2026-08-18 11:45" },
      5: { quantity: 60, status: "in_stock", lastUpdated: "2026-08-18 10:15" },
      6: { quantity: 120, status: "in_stock", lastUpdated: "2026-08-18 09:00" },
    },
  },
  {
    id: 4,
    name: "Amoxicillin",
    genericName: "Amoxicillin",
    strength: "500mg",
    form: "Capsule",
    manufacturer: "Jan Aushadhi",
    price: "₹32",
    stocks: {
      1: { quantity: 200, status: "in_stock", lastUpdated: "2026-08-18 09:00" },
      2: {
        quantity: 0,
        status: "out_of_stock",
        lastUpdated: "2026-08-16 16:00",
      },
      3: { quantity: 80, status: "in_stock", lastUpdated: "2026-08-18 10:00" },
      4: { quantity: 150, status: "in_stock", lastUpdated: "2026-08-18 08:30" },
      5: { quantity: 10, status: "low_stock", lastUpdated: "2026-08-18 07:00" },
      6: { quantity: 60, status: "in_stock", lastUpdated: "2026-08-18 09:00" },
    },
  },
];

export function getStockAlerts() {
  const alerts = [];
  medicines.forEach((med) => {
    Object.entries(med.stocks).forEach(([pharmacyId, stock]) => {
      if (stock.status !== "in_stock") {
        const pharm = pharmacies.find((p) => p.id === Number(pharmacyId));
        alerts.push({
          pharmacy: pharm?.name ?? `Pharmacy ${pharmacyId}`,
          medicine: med.name,
          status: stock.status,
          quantity: stock.quantity,
          lastUpdated: stock.lastUpdated,
        });
      }
    });
  });
  return alerts.sort((a, b) => a.status.localeCompare(b.status));
}

export function getStockBreakdown() {
  const counts = { in_stock: 0, low_stock: 0, out_of_stock: 0 };
  medicines.forEach((med) => {
    Object.values(med.stocks).forEach((stock) => {
      counts[stock.status] += 1;
    });
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}
