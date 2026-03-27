import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { 
  Home, 
  Video, 
  Search, 
  FileText, 
  Pill, 
  Store,
  Bell, 
  UserCheck,
  Menu,
  X,
  Phone,
  Users,
  Calendar,
  Activity,
  Settings,
  BarChart3
} from "lucide-react";
import { useTranslation } from "./translations";

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  language: string;
  isHealthWorkerMode: boolean;
  userType: 'patient' | 'doctor';
}

export function Navigation({ currentPage, onPageChange, language, isHealthWorkerMode, userType }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = useTranslation(language);

  // Different navigation items based on user type
  const patientNavigationItems = [
    { id: 'home', icon: Home, label: t.home },
    { id: 'consultation', icon: Video, label: t.consultation },
    { id: 'symptoms', icon: Search, label: t.symptoms },
    { id: 'records', icon: FileText, label: t.records },
    { id: 'medicines', icon: Pill, label: t.medicines },
    { id: 'pharmacy', icon: Store, label: t.pharmacy },
    { id: 'notifications', icon: Bell, label: t.notifications },
    ...(isHealthWorkerMode ? [{ id: 'health-worker', icon: UserCheck, label: t.healthWorker }] : [])
  ];

  const doctorNavigationItems = [
    { id: 'doctor-dashboard', icon: BarChart3, label: t.doctorDashboard },
    { id: 'doctor-records', icon: FileText, label: t.patientRecords },
    { id: 'pharmacy', icon: Store, label: t.pharmacy },
    { id: 'notifications', icon: Bell, label: t.notifications }
  ];

  const navigationItems = userType === 'doctor' ? doctorNavigationItems : patientNavigationItems;

  const NavigationButton = ({ item }: { item: typeof navigationItems[0] }) => {
    const Icon = item.icon;
    const isActive = currentPage === item.id;
    
    return (
      <Button
        key={item.id}
        variant={isActive ? "default" : "outline"}
        size="lg"
        onClick={() => {
          onPageChange(item.id);
          setIsMenuOpen(false);
        }}
        className={`w-full justify-start gap-4 p-6 h-auto ${
          isActive 
            ? userType === 'doctor' 
              ? 'bg-green-600 text-white border-2 border-green-600 hover:bg-green-700' 
              : 'bg-primary text-primary-foreground border-2 border-primary'
            : 'bg-white border-2 border-gray-200 hover:border-primary hover:bg-gray-50'
        }`}
      >
        <Icon className="w-6 h-6 flex-shrink-0" />
        <span className="text-left">{item.label}</span>
      </Button>
    );
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`bg-white border-2 p-3 ${
            userType === 'doctor' ? 'border-green-600' : 'border-primary'
          }`}
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <Card className={`hidden md:flex flex-col w-80 h-full p-6 gap-4 border-r-2 ${
        userType === 'doctor' ? 'border-green-200 bg-green-50' : 'border-gray-200'
      }`}>
        {/* User Type Indicator */}
        <div className={`p-4 rounded-lg border-2 ${
          userType === 'doctor' 
            ? 'bg-green-100 border-green-300' 
            : 'bg-blue-100 border-blue-300'
        }`}>
          <div className="flex items-center gap-3">
            {userType === 'doctor' ? (
              <UserCheck className="w-6 h-6 text-green-600" />
            ) : (
              <Home className="w-6 h-6 text-blue-600" />
            )}
            <div>
              <h3 className={`font-semibold ${
                userType === 'doctor' ? 'text-green-800' : 'text-blue-800'
              }`}>
                {userType === 'doctor' ? t.doctorDashboard : t.home}
              </h3>
              <p className="text-xs text-muted-foreground">
                {userType === 'doctor' ? 'Medical Professional' : 'Patient Portal'}
              </p>
            </div>
          </div>
        </div>

        {navigationItems.map((item) => (
          <NavigationButton key={item.id} item={item} />
        ))}
      </Card>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50">
          <Card className={`w-80 h-full p-6 bg-white flex flex-col gap-4 ${
            userType === 'doctor' ? 'bg-green-50' : ''
          }`}>
            <div className="pt-16">
              {/* Mobile User Type Indicator */}
              <div className={`p-4 rounded-lg border-2 mb-4 ${
                userType === 'doctor' 
                  ? 'bg-green-100 border-green-300' 
                  : 'bg-blue-100 border-blue-300'
              }`}>
                <div className="flex items-center gap-3">
                  {userType === 'doctor' ? (
                    <UserCheck className="w-6 h-6 text-green-600" />
                  ) : (
                    <Home className="w-6 h-6 text-blue-600" />
                  )}
                  <div>
                    <h3 className={`font-semibold ${
                      userType === 'doctor' ? 'text-green-800' : 'text-blue-800'
                    }`}>
                      {userType === 'doctor' ? t.doctorDashboard : t.home}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {userType === 'doctor' ? 'Medical Professional' : 'Patient Portal'}
                    </p>
                  </div>
                </div>
              </div>

              {navigationItems.map((item) => (
                <NavigationButton key={item.id} item={item} />
              ))}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}