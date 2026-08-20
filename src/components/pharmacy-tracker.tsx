import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  Store, 
  MapPin, 
  Clock, 
  Search, 
  Plus, 
  Minus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  Phone,
  Navigation as NavIcon,
  Loader,
  Target,
  AlertCircle,
  Map
} from "lucide-react";
import { useTranslation } from "./translations";

interface PharmacyTrackerProps {
  language: string;
}

interface Location {
  latitude: number;
  longitude: number;
}

interface Pharmacy {
  id: number;
  name: string;
  address: string;
  distance: string;
  distanceValue: number; // for sorting
  phone: string;
  isOpen: boolean;
  lastUpdated: string;
  coordinates: { lat: number; lng: number };
  rating?: number;
  openHours?: string;
}

export function PharmacyTracker({ language }: PharmacyTrackerProps) {
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [isPharmacistView, setIsPharmacistView] = useState(false);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [nearbyPharmacies, setNearbyPharmacies] = useState<Pharmacy[]>([]);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'name'>('distance');
  
  const t = useTranslation(language);

  // Base pharmacies data (mock data that would come from Google Places API or similar)
  const mockPharmaciesData = [
    {
      id: 1,
      name: "Apollo Pharmacy",
      baseAddress: "Main Market, Sector 12",
      phone: "+91 98765 43210",
      isOpen: true,
      rating: 4.5,
      openHours: "8:00 AM - 10:00 PM",
      coordinates: { lat: 30.7333, lng: 76.7794 }
    },
    {
      id: 2,
      name: "MedPlus",
      baseAddress: "Civil Lines",
      phone: "+91 98765 43211",
      isOpen: true,
      rating: 4.2,
      openHours: "9:00 AM - 9:00 PM",
      coordinates: { lat: 30.7400, lng: 76.7800 }
    },
    {
      id: 3,
      name: "Local Medical Store",
      baseAddress: "Village Center",
      phone: "+91 98765 43212",
      isOpen: false,
      rating: 3.8,
      openHours: "9:00 AM - 6:00 PM",
      coordinates: { lat: 30.7200, lng: 76.7700 }
    },
    {
      id: 4,
      name: "Health Plus Pharmacy",
      baseAddress: "Near Bus Stand",
      phone: "+91 98765 43213",
      isOpen: true,
      rating: 4.0,
      openHours: "24 Hours",
      coordinates: { lat: 30.7350, lng: 76.7750 }
    },
    {
      id: 5,
      name: "City Care Chemist",
      baseAddress: "Hospital Road",
      phone: "+91 98765 43214",
      isOpen: true,
      rating: 4.3,
      openHours: "8:00 AM - 11:00 PM",
      coordinates: { lat: 30.7280, lng: 76.7820 }
    },
    {
      id: 6,
      name: "Quick Meds",
      baseAddress: "Shopping Complex",
      phone: "+91 98765 43215",
      isOpen: true,
      rating: 3.9,
      openHours: "10:00 AM - 8:00 PM",
      coordinates: { lat: 30.7380, lng: 76.7780 }
    }
  ];

  const [medicines, setMedicines] = useState([
    {
      id: 1,
      name: "Paracetamol",
      genericName: "Acetaminophen",
      strength: "500mg",
      form: "Tablet",
      manufacturer: "Jan Aushadhi",
      price: 4,
      stocks: {
        1: { quantity: 150, status: "in_stock", lastUpdated: "2024-01-25 10:30" },
        2: { quantity: 25, status: "low_stock", lastUpdated: "2024-01-25 09:45" },
        3: { quantity: 0, status: "out_of_stock", lastUpdated: "2024-01-24 18:00" },
        4: { quantity: 80, status: "in_stock", lastUpdated: "2024-01-25 11:15" },
        5: { quantity: 40, status: "in_stock", lastUpdated: "2024-01-25 10:45" },
        6: { quantity: 15, status: "low_stock", lastUpdated: "2024-01-25 09:30" }
      }
    },
    {
      id: 2,
      name: "Cetirizine",
      genericName: "Cetirizine HCl",
      strength: "10mg",
      form: "Tablet",
      manufacturer: "Jan Aushadhi",
      price: 3,
      stocks: {
        1: { quantity: 80, status: "in_stock", lastUpdated: "2024-01-25 11:00" },
        2: { quantity: 5, status: "low_stock", lastUpdated: "2024-01-25 10:15" },
        3: { quantity: 20, status: "in_stock", lastUpdated: "2024-01-25 08:30" },
        4: { quantity: 60, status: "in_stock", lastUpdated: "2024-01-25 12:00" },
        5: { quantity: 10, status: "low_stock", lastUpdated: "2024-01-25 11:30" },
        6: { quantity: 35, status: "in_stock", lastUpdated: "2024-01-25 10:00" }
      }
    },
    {
      id: 3,
      name: "Amlodipine",
      genericName: "Amlodipine Besylate",
      strength: "5mg",
      form: "Tablet",
      manufacturer: "Jan Aushadhi",
      price: 8,
      stocks: {
        1: { quantity: 200, status: "in_stock", lastUpdated: "2024-01-25 12:00" },
        2: { quantity: 60, status: "in_stock", lastUpdated: "2024-01-25 11:30" },
        3: { quantity: 10, status: "low_stock", lastUpdated: "2024-01-25 07:45" },
        4: { quantity: 120, status: "in_stock", lastUpdated: "2024-01-25 11:45" },
        5: { quantity: 25, status: "low_stock", lastUpdated: "2024-01-25 10:15" },
        6: { quantity: 90, status: "in_stock", lastUpdated: "2024-01-25 09:00" }
      }
    },
    {
      id: 4,
      name: "Amoxicillin",
      genericName: "Amoxicillin",
      strength: "500mg",
      form: "Capsule",
      manufacturer: "Jan Aushadhi",
      price: 32,
      stocks: {
        1: { quantity: 12, status: "low_stock", lastUpdated: "2024-01-25 09:00" },
        2: { quantity: 0, status: "out_of_stock", lastUpdated: "2024-01-24 16:00" },
        3: { quantity: 8, status: "low_stock", lastUpdated: "2024-01-25 10:00" },
        4: { quantity: 15, status: "in_stock", lastUpdated: "2024-01-25 08:30" },
        5: { quantity: 3, status: "low_stock", lastUpdated: "2024-01-25 07:00" },
        6: { quantity: 0, status: "out_of_stock", lastUpdated: "2024-01-24 20:00" }
      }
    }
  ]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get user's current location
  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      const error = language === 'hi' ? 'जीपीएस समर्थित नहीं है' : 
                   language === 'pa' ? 'GPS ਸਮਰਥਿਤ ਨਹੀਂ ਹੈ' : 
                   'Geolocation is not supported';
      setLocationError(error);
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setUserLocation(location);
        findNearbyPharmacies(location);
        setIsLoadingLocation(false);
      },
      (error) => {
        let errorMessage = '';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = language === 'hi' ? 'स्थान की अनुमति अस्वीकार कर दी गई' : 
                          language === 'pa' ? 'ਸਥਾਨ ਦੀ ਇਜਾਜ਼ਤ ਨਾਂਹ ਕੀਤੀ ਗਈ' : 
                          'Location access denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = language === 'hi' ? 'स्थान उपलब्ध नहीं है' : 
                          language === 'pa' ? 'ਸਥਾਨ ਉਪਲਬਧ ਨਹੀਂ ਹੈ' : 
                          'Location unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = language === 'hi' ? 'स्थान प्राप्त करने में समय समाप्त' : 
                          language === 'pa' ? 'ਸਥਾਨ ਪ੍ਰਾਪਤ ਕਰਨ ਵਿੱਚ ਸਮਾਂ ਸਮਾਪਤ' : 
                          'Location request timed out';
            break;
          default:
            errorMessage = language === 'hi' ? 'स्थान प्राप्त करने में त्रुटि' : 
                          language === 'pa' ? 'ਸਥਾਨ ਪ੍ਰਾਪਤ ਕਰਨ ਵਿੱਚ ਗਲਤੀ' : 
                          'Error getting location';
        }
        setLocationError(errorMessage);
        setIsLoadingLocation(false);
        // Load default pharmacies without location-based sorting
        setNearbyPharmacies(mockPharmaciesData.map(pharmacy => ({
          ...pharmacy,
          address: pharmacy.baseAddress,
          distance: 'Unknown',
          distanceValue: 999,
          lastUpdated: '2 mins ago'
        })));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Find nearby pharmacies based on user location
  const findNearbyPharmacies = (location: Location) => {
    const pharmaciesWithDistance = mockPharmaciesData.map(pharmacy => {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        pharmacy.coordinates.lat,
        pharmacy.coordinates.lng
      );
      
      return {
        ...pharmacy,
        address: pharmacy.baseAddress,
        distance: distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`,
        distanceValue: distance,
        lastUpdated: distance < 1 ? 'Just now' : `${Math.round(distance * 2)} mins ago`
      };
    });

    // Sort by distance by default
    const sortedPharmacies = pharmaciesWithDistance.sort((a, b) => a.distanceValue - b.distanceValue);
    setNearbyPharmacies(sortedPharmacies);
  };

  // Sort pharmacies based on selected criteria
  const sortPharmacies = (criteria: 'distance' | 'rating' | 'name') => {
    const sorted = [...nearbyPharmacies].sort((a, b) => {
      switch (criteria) {
        case 'distance':
          return a.distanceValue - b.distanceValue;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
    setNearbyPharmacies(sorted);
    setSortBy(criteria);
  };

  // Load location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.genericName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 border-green-300';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-zinc-800 dark:text-gray-200 dark:border-zinc-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <CheckCircle className="w-4 h-4" />;
      case 'low_stock':
        return <AlertTriangle className="w-4 h-4" />;
      case 'out_of_stock':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_stock':
        return t.inStock;
      case 'low_stock':
        return t.lowStock;
      case 'out_of_stock':
        return t.outOfStock;
      default:
        return status;
    }
  };

  const updateStock = (medicineId: number, pharmacyId: number, newQuantity: number) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const status = newQuantity === 0 ? 'out_of_stock' : newQuantity <= 20 ? 'low_stock' : 'in_stock';
    setMedicines((meds) =>
      meds.map((m) =>
        m.id === medicineId && m.stocks[pharmacyId]
          ? { ...m, stocks: { ...m.stocks, [pharmacyId]: { quantity: newQuantity, status, lastUpdated: now } } }
          : m,
      ),
    );
  };

  const syncData = () => {
    setLastSyncTime(new Date());
    if (userLocation) {
      findNearbyPharmacies(userLocation);
    }
  };

  const callPharmacy = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  const getDirections = (pharmacy: Pharmacy) => {
    const { lat, lng } = pharmacy.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // Pharmacist Stock Update Component
  const PharmacistStockUpdate = ({ medicine }: { medicine: any }) => {
    const [newQuantity, setNewQuantity] = useState(
      selectedPharmacy ? medicine.stocks[selectedPharmacy.id]?.quantity || 0 : 0
    );

    return (
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">{medicine.name}</h3>
              <p className="text-sm text-muted-foreground">
                {medicine.strength} • {medicine.form}
              </p>
            </div>
            <Badge className={getStatusColor(medicine.stocks[selectedPharmacy?.id]?.status || 'out_of_stock')}>
              {getStatusText(medicine.stocks[selectedPharmacy?.id]?.status || 'out_of_stock')}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <Label>{t.quantity}:</Label>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setNewQuantity(Math.max(0, newQuantity - 1))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                value={newQuantity}
                onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                className="w-20 text-center border-2"
                min="0"
              />
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setNewQuantity(newQuantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <Button 
            size="sm"
            onClick={() => updateStock(medicine.id, selectedPharmacy?.id, newQuantity)}
            className="w-full"
          >
            {t.updateStock}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl mb-2">{t.medicineAvailability}</h1>
            <p className="text-muted-foreground">{t.nearbyPharmacies}</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Location Status */}
            <div className="flex items-center gap-2">
              {isLoadingLocation ? (
                <Badge variant="outline" className="gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  {t.locating || 'Locating...'}
                </Badge>
              ) : userLocation ? (
                <Badge variant="secondary" className="gap-2">
                  <Target className="w-4 h-4" />
                  {t.locationFound || 'Located'}
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {t.locationError || 'Location Error'}
                </Badge>
              )}
            </div>

            {/* Online/Offline Status */}
            <Badge variant={isOnline ? "secondary" : "destructive"} className="gap-2">
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isOnline ? "Online" : "Offline"}
            </Badge>
            
            {/* Pharmacist Toggle */}
            <div className="flex items-center gap-2">
              <Label className="text-sm">{t.pharmacistMode}</Label>
              <input
                type="checkbox"
                checked={isPharmacistView}
                onChange={(e) => setIsPharmacistView(e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            
            {/* Location and Sync Buttons */}
            <Button 
              onClick={getCurrentLocation} 
              variant="outline" 
              size="sm"
              disabled={isLoadingLocation}
            >
              <Target className="w-4 h-4 mr-2" />
              {t.findLocation || 'Find Location'}
            </Button>
            
            <Button onClick={syncData} variant="outline" size="sm">
              <RefreshCw className="w-5 h-5 mr-2" />
              {t.sync || 'Sync'}
            </Button>
          </div>
        </div>

        {/* Location Error */}
        {locationError && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="font-medium text-red-800">{t.locationError || 'Location Error'}</h3>
                  <p className="text-sm text-red-700">{locationError}</p>
                  <Button 
                    size="sm" 
                    onClick={getCurrentLocation} 
                    className="mt-2 bg-red-600 hover:bg-red-700"
                  >
                    {t.tryAgain || 'Try Again'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Pharmacy List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t.selectPharmacy}</CardTitle>
                  {userLocation && (
                    <Select value={sortBy} onValueChange={(value: 'distance' | 'rating' | 'name') => sortPharmacies(value)}>
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="distance">{t.distance || 'Distance'}</SelectItem>
                        <SelectItem value="rating">{t.rating || 'Rating'}</SelectItem>
                        <SelectItem value="name">{t.name || 'Name'}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {userLocation && (
                  <p className="text-xs text-muted-foreground">
                    {nearbyPharmacies.length} {t.pharmaciesFound || 'pharmacies found'}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {nearbyPharmacies.map((pharmacy) => (
                  <Card 
                    key={pharmacy.id}
                    className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                      selectedPharmacy?.id === pharmacy.id ? 'border-primary' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedPharmacy(pharmacy)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-primary" />
                          <h3 className="text-sm font-medium">{pharmacy.name}</h3>
                        </div>
                        <Badge variant={pharmacy.isOpen ? "secondary" : "outline"}>
                          {pharmacy.isOpen ? t.open || "Open" : t.closed || "Closed"}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{pharmacy.address}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <NavIcon className="w-3 h-3" />
                          <span>{pharmacy.distance}</span>
                        </div>
                        {pharmacy.rating && (
                          <div className="flex items-center gap-1">
                            <span>⭐</span>
                            <span>{pharmacy.rating}</span>
                          </div>
                        )}
                        {pharmacy.openHours && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{pharmacy.openHours}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-1 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            callPharmacy(pharmacy.phone);
                          }}
                          className="flex-1 text-xs"
                        >
                          <Phone className="w-3 h-3 mr-1" />
                          {t.call || 'Call'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            getDirections(pharmacy);
                          }}
                          className="flex-1 text-xs"
                        >
                          <Map className="w-3 h-3 mr-1" />
                          {t.directions || 'Directions'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {nearbyPharmacies.length === 0 && !isLoadingLocation && (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Store className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {t.noPharmaciesFound || 'No pharmacies found nearby'}
                      </p>
                      <Button 
                        size="sm" 
                        onClick={getCurrentLocation} 
                        className="mt-2"
                        disabled={isLoadingLocation}
                      >
                        {t.searchAgain || 'Search Again'}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Medicine Stock List */}
          <div className="lg:col-span-3">
            {selectedPharmacy ? (
              <div>
                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      type="text"
                      placeholder={t.searchMedicine}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 border-2"
                    />
                  </div>
                </div>

                {/* Pharmacist vs Patient View */}
                {isPharmacistView ? (
                  <div>
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>Pharmacist Dashboard - {selectedPharmacy.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          Update medicine stock quantities for your pharmacy
                        </p>
                      </CardContent>
                    </Card>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {filteredMedicines.map((medicine) => (
                        <PharmacistStockUpdate key={medicine.id} medicine={medicine} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMedicines.map((medicine) => {
                      const stock = medicine.stocks[selectedPharmacy.id];
                      
                      return (
                        <Card key={medicine.id} className="border-2">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-medium text-lg">{medicine.name}</h3>
                                <p className="text-muted-foreground">
                                  {medicine.genericName} • {medicine.strength} • {medicine.form}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  by {medicine.manufacturer}
                                </p>
                              </div>
                              
                              <div className="text-right">
                                <p className="text-lg font-medium">₹{medicine.price}</p>
                                <Badge className={`gap-1 ${getStatusColor(stock?.status || 'out_of_stock')}`}>
                                  {getStatusIcon(stock?.status || 'out_of_stock')}
                                  {getStatusText(stock?.status || 'out_of_stock')}
                                </Badge>
                              </div>
                            </div>
                            
                            {stock && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>{t.quantity}:</span>
                                  <span>{stock.quantity} units</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                  <span>{t.lastUpdated}:</span>
                                  <span>{new Date(stock.lastUpdated).toLocaleString()}</span>
                                </div>
                                
                                {stock.status === 'in_stock' && (
                                  <Button 
                                    size="sm" 
                                    className="w-full mt-3"
                                    onClick={() => callPharmacy(selectedPharmacy.phone)}
                                  >
                                    <Phone className="w-4 h-4 mr-2" />
                                    {t.reserveMedicine || 'Reserve Medicine'}
                                  </Button>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg mb-2">{t.selectPharmacy}</h3>
                  <p className="text-muted-foreground">
                    {t.choosePharmacyMessage || "Choose a pharmacy to view medicine availability"}
                  </p>
                  {!userLocation && !isLoadingLocation && (
                    <Button onClick={getCurrentLocation} className="mt-4">
                      <Target className="w-4 h-4 mr-2" />
                      {t.findNearbyPharmacies || 'Find Nearby Pharmacies'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Last Sync Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t.lastUpdated}: {lastSyncTime.toLocaleString()}
            {!isOnline && " (Offline data)"}
            {userLocation && ` • ${t.location || 'Location'}: ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`}
          </p>
        </div>
      </div>
    </div>
  );
}