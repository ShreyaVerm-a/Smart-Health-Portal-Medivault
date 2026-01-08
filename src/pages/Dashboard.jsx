import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RecentActivity from '@/components/RecentActivity';
import { 
  Heart, 
  FileText, 
  Shield, 
  Pill, 
  Activity, 
  Users,
  Upload,
  Calendar,
  Settings,
  LogOut,
  Brain,
  Building,
  Search,
  Clock,
  UserCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data.',
          variant: 'destructive',
        });
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed Out',
      description: 'You have been signed out successfully.',
    });
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-muted flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Profile Setup Required</CardTitle>
            <CardDescription>
              We couldn't load your profile. Please try signing in again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignOut} className="w-full">
              Sign Out and Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'doctor':
        return <Activity className="w-5 h-5" />;
      case 'hospital_admin':
        return <Heart className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'doctor':
        return 'bg-accent text-accent-foreground';
      case 'hospital_admin':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-muted">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  MediVault
                </h1>
                <p className="text-sm text-muted-foreground">Healthcare Portal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <p className="font-medium">{profile.full_name}</p>
                {profile.patient_id && (
                  <p className="text-sm text-muted-foreground">ID: {profile.patient_id}</p>
                )}
                <div className="flex items-center gap-2">
                  <Badge className={getRoleColor(profile.role)}>
                    {getRoleIcon(profile.role)}
                    {profile.role.replace('_', ' ')}
                  </Badge>
                  {profile.is_verified && (
                    <Badge variant="outline" className="text-success border-success">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {profile.full_name.split(' ')[0]}!
          </h2>
          <p className="text-muted-foreground">
            {profile.role === 'patient' 
              ? 'Manage your health records and medications.'
              : profile.role === 'doctor'
              ? 'Access patient records and upload medical documents.'
              : 'Oversee hospital operations and manage staff access.'
            }
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {profile.role === 'patient' && (
            <>
              <Card 
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-card to-muted/30"
                onClick={() => navigate('/medical-records')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <Badge variant="secondary">View</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">Medical Records</CardTitle>
                  <CardDescription>
                    View and manage your medical documents and reports
                  </CardDescription>
                </CardContent>
              </Card>

              <Card 
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-card to-muted/30"
                onClick={() => navigate('/medicine-tracker')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Pill className="w-6 h-6 text-accent" />
                    </div>
                    <Badge variant="secondary">Track</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">Medicine Tracker</CardTitle>
                  <CardDescription>
                    Set reminders and track your medication schedule
                  </CardDescription>
                </CardContent>
              </Card>

              <Card 
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-card to-muted/30"
                onClick={() => navigate('/access-control')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center group-hover:bg-warning/20 transition-colors">
                      <Shield className="w-6 h-6 text-warning" />
                    </div>
                    <Badge variant="secondary">Manage</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">Access Control</CardTitle>
                  <CardDescription>
                    Grant or revoke doctor access to your medical records
                  </CardDescription>
                </CardContent>
              </Card>

              <Card 
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-card to-muted/30"
                onClick={() => navigate('/appointments')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                      <Calendar className="w-6 h-6 text-indigo-500" />
                    </div>
                    <Badge variant="secondary">Book</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">Appointments</CardTitle>
                  <CardDescription>
                    Book and manage your appointments with doctors
                  </CardDescription>
                </CardContent>
              </Card>

              <Card 
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-card to-muted/30"
                onClick={() => navigate('/ai-assistant')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center group-hover:bg-success/20 transition-colors">
                      <Activity className="w-6 h-6 text-success" />
                    </div>
                    <Badge variant="secondary">AI</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">AI Assistant</CardTitle>
                  <CardDescription>
                    Get AI-powered health insights and specialist suggestions
                  </CardDescription>
                </CardContent>
              </Card>

              <Card 
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-card to-muted/30"
                onClick={() => navigate('/complete-profile')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
                      <UserCircle className="w-6 h-6 text-pink-500" />
                    </div>
                    <Badge variant="secondary">Profile</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">Complete Profile</CardTitle>
                  <CardDescription>
                    Update your personal information and preferences
                  </CardDescription>
                </CardContent>
              </Card>
            </>
          )}

          {profile.role === 'doctor' && (
            <>
              <Card 
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-card to-muted/30"
                onClick={() => navigate('/appointments')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                      <Calendar className="w-6 h-6 text-indigo-500" />
                    </div>
                    <Badge variant="secondary">View</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">My Appointments</CardTitle>
                  <CardDescription>
                    View and manage your scheduled appointments
                  </CardDescription>
                </CardContent>
              </Card>

              <Card 
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-card to-muted/30"
                onClick={() => navigate('/working-hours')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                      <Clock className="w-6 h-6 text-cyan-500" />
                    </div>
                    <Badge variant="secondary">Manage</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">Working Hours</CardTitle>
                  <CardDescription>
                    Set your availability schedule for appointments
                  </CardDescription>
                </CardContent>
              </Card>

              <Card 
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-card to-muted/30"
                onClick={() => navigate('/upload-documents')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <Badge variant="secondary">Upload</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">Upload Documents</CardTitle>
                  <CardDescription>
                    Upload medical documents for your patients
                  </CardDescription>
                </CardContent>
              </Card>

              <Card 
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-card to-muted/30"
                onClick={() => navigate('/patient-search')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Users className="w-6 h-6 text-accent" />
                    </div>
                    <Badge variant="secondary">Search</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">Patient Search</CardTitle>
                  <CardDescription>
                    Search and access patient records with OTP verification
                  </CardDescription>
                </CardContent>
              </Card>

              <Card 
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-card to-muted/30"
                onClick={() => navigate('/complete-profile')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
                      <UserCircle className="w-6 h-6 text-pink-500" />
                    </div>
                    <Badge variant="secondary">Profile</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">Complete Profile</CardTitle>
                  <CardDescription>
                    Update your professional information
                  </CardDescription>
                </CardContent>
              </Card>
            </>
          )}

            {profile.role === 'hospital_admin' && (
              <>
                <Card 
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-card to-muted/30"
                  onClick={() => navigate('/hospital-admin')}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                        <Building className="w-6 h-6 text-purple-500" />
                      </div>
                      <Badge variant="secondary">Manage</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg mb-2">Hospital Management</CardTitle>
                    <CardDescription>
                      Oversee hospital operations, doctors, and patients
                    </CardDescription>
                  </CardContent>
                </Card>


                <Card 
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-card to-muted/30"
                  onClick={() => navigate('/upload-documents')}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Upload className="w-6 h-6 text-primary" />
                      </div>
                      <Badge variant="secondary">Upload</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg mb-2">Upload Documents</CardTitle>
                    <CardDescription>
                      Upload medical documents for patients
                    </CardDescription>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

        {/* Recent Activity Section */}
        <RecentActivity />
      </main>
    </div>
  );
};

export default Dashboard;