import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { 
  User, 
  Phone, 
  Video, 
  Search, 
  FileText, 
  Pill,
  Store,
  Calendar,
  Clock,
  UserCheck,
  Stethoscope
} from "lucide-react";
import { useTranslation } from "./translations";

interface HomeScreenProps {
  language: string;
  isAuthenticated: boolean;
  onAuth: (authenticated: boolean, userType?: 'patient' | 'doctor') => void;
  onPageChange: (page: string) => void;
}

export function HomeScreen({ language, isAuthenticated, onAuth, onPageChange }: HomeScreenProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [userType, setUserType] = useState<'patient' | 'doctor' | null>(null);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  
  const t = useTranslation(language);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock authentication
    onAuth(true, userType || 'patient');
  };

  const handleUserTypeSelect = (type: 'patient' | 'doctor') => {
    setUserType(type);
  };

  const quickActions = [
    {
      id: 'consultation',
      icon: Video,
      title: t.bookConsultation,
      subtitle: t.doctorAvailable,
      color: 'bg-green-100 border-green-300 text-green-800',
      iconColor: 'text-green-600'
    },
    {
      id: 'symptoms',
      icon: Search,
      title: t.checkSymptoms,
      subtitle: "AI-powered health assessment",
      color: 'bg-blue-100 border-blue-300 text-blue-800',
      iconColor: 'text-blue-600'
    },
    {
      id: 'pharmacy',
      icon: Store,
      title: t.pharmacy,
      subtitle: t.nearbyPharmacies,
      color: 'bg-indigo-100 border-indigo-300 text-indigo-800',
      iconColor: 'text-indigo-600'
    },
    {
      id: 'medicines',
      icon: Pill,
      title: t.medicineReminder,
      subtitle: "Track your medications",
      color: 'bg-purple-100 border-purple-300 text-purple-800',
      iconColor: 'text-purple-600'
    },
    {
      id: 'records',
      icon: FileText,
      title: t.records,
      subtitle: "View medical history",
      color: 'bg-orange-100 border-orange-300 text-orange-800',
      iconColor: 'text-orange-600'
    }
  ];

  if (!isAuthenticated) {
    // Show user type selection first
    if (!userType) {
      return (
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">{t.welcome}</CardTitle>
              <p className="text-muted-foreground mt-2">{t.selectUserType}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => handleUserTypeSelect('patient')}
                className="w-full h-20 text-left p-4 bg-blue-50 border-2 border-blue-200 hover:bg-blue-100 text-blue-800"
                variant="outline"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-600">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{t.patientLogin}</h3>
                    <p className="text-sm text-muted-foreground">{t.continueAsPatient}</p>
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => handleUserTypeSelect('doctor')}
                className="w-full h-20 text-left p-4 bg-green-50 border-2 border-green-200 hover:bg-green-100 text-green-800"
                variant="outline"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-600">
                    <Stethoscope className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{t.doctorLogin}</h3>
                    <p className="text-sm text-muted-foreground">{t.continueAsDoctor}</p>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Show login/register form after user type selection
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {userType === 'doctor' ? (
                <Stethoscope className="w-8 h-8 text-green-600" />
              ) : (
                <User className="w-8 h-8 text-blue-600" />
              )}
              <CardTitle className="text-3xl">
                {userType === 'doctor' ? t.doctorLogin : t.patientLogin}
              </CardTitle>
            </div>
            <p className="text-muted-foreground mt-2">{t.subtitle}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setUserType(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ← {t.back || 'Back'}
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="py-3">{t.login}</TabsTrigger>
                <TabsTrigger value="register" className="py-3">{t.register}</TabsTrigger>
              </TabsList>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {authMode === 'register' && (
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.name}</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="h-12 border-2"
                      required
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="phone">{t.phone}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="h-12 border-2"
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">{t.password}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="h-12 border-2"
                    required
                  />
                </div>
                
                {authMode === 'register' && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="h-12 border-2"
                      required
                    />
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className={`w-full h-12 text-lg ${
                    userType === 'doctor' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {authMode === 'login' ? t.login : t.register}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl mb-2">{t.welcome}</h1>
          <p className="text-xl text-muted-foreground">{t.subtitle}</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl mb-6">{t.quickActions}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card 
                  key={action.id}
                  className={`cursor-pointer transition-all hover:scale-105 hover:shadow-lg border-2 ${action.color}`}
                  onClick={() => onPageChange(action.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-white">
                        <Icon className={`w-8 h-8 ${action.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl mb-1">{action.title}</h3>
                        <p className="text-sm opacity-80">{action.subtitle}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 border rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p>Consultation with Dr. Sharma</p>
                  <p className="text-sm text-muted-foreground">2 days ago</p>
                </div>
                <Badge variant="secondary">Completed</Badge>
              </div>
              <div className="flex items-center gap-4 p-3 border rounded-lg">
                <Pill className="w-5 h-5 text-purple-600" />
                <div className="flex-1">
                  <p>Medicine taken: Paracetamol</p>
                  <p className="text-sm text-muted-foreground">Today, 8:00 AM</p>
                </div>
                <Badge variant="outline">Reminder</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}