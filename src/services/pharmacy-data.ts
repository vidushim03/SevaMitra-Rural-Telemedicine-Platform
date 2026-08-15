export interface PharmacyLocation {
  id: number;
  name: string;
  baseAddress: string;
  phone: string;
  isOpen: boolean;
  rating: number;
  openHours: string;
  coordinates: { lat: number; lng: number };
}

export interface MedicineStock {
  quantity: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastUpdated: string;
}

export interface Medicine {
  id: number;
  name: string;
  genericName: string;
  strength: string;
  form: string;
  manufacturer: string;
  price: string;
  stocks: Record<number, MedicineStock>;
}

export const pharmacies: PharmacyLocation[] = [
  {
    id: 1,
    name: 'Apollo Pharmacy',
    baseAddress: 'Main Market, Sector 12',
    phone: '+91 98765 43210',
    isOpen: true,
    rating: 4.5,
    openHours: '8:00 AM - 10:00 PM',
    coordinates: { lat: 30.7333, lng: 76.7794 },
  },
  {
    id: 2,
    name: 'MedPlus',
    baseAddress: 'Civil Lines',
    phone: '+91 98765 43211',
    isOpen: true,
    rating: 4.2,
    openHours: '9:00 AM - 9:00 PM',
    coordinates: { lat: 30.74, lng: 76.78 },
  },
  {
    id: 3,
    name: 'Local Medical Store',
    baseAddress: 'Village Center',
    phone: '+91 98765 43212',
    isOpen: false,
    rating: 3.8,
    openHours: '9:00 AM - 6:00 PM',
    coordinates: { lat: 30.72, lng: 76.77 },
  },
  {
    id: 4,
    name: 'Health Plus Pharmacy',
    baseAddress: 'Near Bus Stand',
    phone: '+91 98765 43213',
    isOpen: true,
    rating: 4.0,
    openHours: '24 Hours',
    coordinates: { lat: 30.735, lng: 76.775 },
  },
  {
    id: 5,
    name: 'City Care Chemist',
    baseAddress: 'Hospital Road',
    phone: '+91 98765 43214',
    isOpen: true,
    rating: 4.3,
    openHours: '8:00 AM - 11:00 PM',
    coordinates: { lat: 30.728, lng: 76.782 },
  },
  {
    id: 6,
    name: 'Quick Meds',
    baseAddress: 'Shopping Complex',
    phone: '+91 98765 43215',
    isOpen: true,
    rating: 3.9,
    openHours: '10:00 AM - 8:00 PM',
    coordinates: { lat: 30.738, lng: 76.778 },
  },
];

export const medicines: Medicine[] = [
  {
    id: 1,
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    strength: '500mg',
    form: 'Tablet',
    manufacturer: 'Cipla',
    price: '₹25',
    stocks: {
      1: { quantity: 150, status: 'in_stock', lastUpdated: '2024-01-25 10:30' },
      2: { quantity: 25, status: 'low_stock', lastUpdated: '2024-01-25 09:45' },
      3: { quantity: 0, status: 'out_of_stock', lastUpdated: '2024-01-24 18:00' },
      4: { quantity: 80, status: 'in_stock', lastUpdated: '2024-01-25 11:15' },
      5: { quantity: 40, status: 'in_stock', lastUpdated: '2024-01-25 10:45' },
      6: { quantity: 15, status: 'low_stock', lastUpdated: '2024-01-25 09:30' },
    },
  },
  {
    id: 2,
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    strength: '250mg',
    form: 'Capsule',
    manufacturer: 'Sun Pharma',
    price: '₹45',
    stocks: {
      1: { quantity: 80, status: 'in_stock', lastUpdated: '2024-01-25 11:00' },
      2: { quantity: 5, status: 'low_stock', lastUpdated: '2024-01-25 10:15' },
      3: { quantity: 20, status: 'in_stock', lastUpdated: '2024-01-25 08:30' },
      4: { quantity: 60, status: 'in_stock', lastUpdated: '2024-01-25 12:00' },
      5: { quantity: 10, status: 'low_stock', lastUpdated: '2024-01-25 11:30' },
      6: { quantity: 35, status: 'in_stock', lastUpdated: '2024-01-25 10:00' },
    },
  },
  {
    id: 3,
    name: 'Amlodipine',
    genericName: 'Amlodipine Besylate',
    strength: '5mg',
    form: 'Tablet',
    manufacturer: 'Ranbaxy',
    price: '₹35',
    stocks: {
      1: { quantity: 200, status: 'in_stock', lastUpdated: '2024-01-25 12:00' },
      2: { quantity: 60, status: 'in_stock', lastUpdated: '2024-01-25 11:30' },
      3: { quantity: 10, status: 'low_stock', lastUpdated: '2024-01-25 07:45' },
      4: { quantity: 120, status: 'in_stock', lastUpdated: '2024-01-25 11:45' },
      5: { quantity: 25, status: 'low_stock', lastUpdated: '2024-01-25 10:15' },
      6: { quantity: 90, status: 'in_stock', lastUpdated: '2024-01-25 09:00' },
    },
  },
  {
    id: 4,
    name: 'Insulin Glargine',
    genericName: 'Insulin Glargine',
    strength: '100IU/ml',
    form: 'Injection',
    manufacturer: 'Sanofi',
    price: '₹1250',
    stocks: {
      1: { quantity: 12, status: 'low_stock', lastUpdated: '2024-01-25 09:00' },
      2: { quantity: 0, status: 'out_of_stock', lastUpdated: '2024-01-24 16:00' },
      3: { quantity: 8, status: 'low_stock', lastUpdated: '2024-01-25 10:00' },
      4: { quantity: 15, status: 'in_stock', lastUpdated: '2024-01-25 08:30' },
      5: { quantity: 3, status: 'low_stock', lastUpdated: '2024-01-25 07:00' },
      6: { quantity: 0, status: 'out_of_stock', lastUpdated: '2024-01-24 20:00' },
    },
  },
];

export interface StockAlert {
  pharmacy: string;
  medicine: string;
  status: 'low_stock' | 'out_of_stock';
  quantity: number;
  lastUpdated: string;
}

export function getStockAlerts(): StockAlert[] {
  const alerts: StockAlert[] = [];
  medicines.forEach((med) => {
    Object.entries(med.stocks).forEach(([pharmacyId, stock]) => {
      if (stock.status !== 'in_stock') {
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
  const counts: Record<string, number> = { in_stock: 0, low_stock: 0, out_of_stock: 0 };
  medicines.forEach((med) => {
    Object.values(med.stocks).forEach((stock) => {
      counts[stock.status] += 1;
    });
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}
