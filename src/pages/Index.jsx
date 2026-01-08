import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Shield, 
  FileText, 
  Users, 
  Lock, 
  Smartphone,
  Brain,
  Clock,
  ChevronRight,
  UserCheck,
  Stethoscope
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Document Management",
      description: "Secure storage and easy access to all medical records",
      color: "bg-primary/10 text-primary"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Privacy Control",
      description: "Complete control over who can access your medical data",
      color: "bg-accent/10 text-accent"
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "OTP Verification",
      description: "Two-factor authentication for enhanced security",
      color: "bg-warning/10 text-warning"
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI Assistant",
      description: "Smart analysis and health insights powered by AI",
      color: "bg-success/10 text-success"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Medicine Reminders",
      description: "Never miss a dose with smart medication tracking",
      color: "bg-primary/10 text-primary"
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Mobile Friendly",
      description: "Access your health data anywhere, anytime",
      color: "bg-accent/10 text-accent"
    }
  ];

  const userTypes = [
    {
      icon: <UserCheck className="w-8 h-8" />,
      title: "Patients",
      description: "Take control of your medical records",
      features: ["View medical documents", "Grant doctor access", "Track medications", "AI health insights"],
      color: "from-primary/20 to-primary/5 border-primary/20"
    },
    {
      icon: <Stethoscope className="w-8 h-8" />,
      title: "Doctors",
      description: "Secure patient data management",
      features: ["Upload patient documents", "Access with OTP verification", "AI diagnostic assistance", "Patient search"],
      color: "from-accent/20 to-accent/5 border-accent/20"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Hospitals",
      description: "Streamlined healthcare operations",
      features: ["Staff management", "Bulk document uploads", "System integration", "Analytics dashboard"],
      color: "from-warning/20 to-warning/5 border-warning/20"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-muted">
      {/* Navigation Header */}
      <header className="bg-white/80 backdrop-blur border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  MediVault
                </h1>
                <p className="text-sm text-muted-foreground">Secure Healthcare Portal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate('/auth')}
                className="hidden sm:inline-flex"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate('/auth')}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                Get Started
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
              <Heart className="w-4 h-4 mr-2" />
              HIPAA Compliant Healthcare Portal
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Your Health,{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Your Control
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Secure, modern healthcare portal that puts patients in control of their medical records 
              while enabling seamless collaboration with healthcare providers.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="h-14 px-8 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-lg font-semibold"
              >
                Start Your Journey
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="h-14 px-8 text-lg"
              >
                <Shield className="w-5 h-5 mr-2" />
                Learn About Security
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Powerful Features for Modern Healthcare
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage healthcare data securely and efficiently
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-card to-muted/30">
                <CardHeader>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Built for Every Healthcare Role
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tailored experiences for patients, doctors, and healthcare institutions
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {userTypes.map((type, index) => (
              <Card key={index} className={`group hover:shadow-xl transition-all duration-300 border bg-gradient-to-br ${type.color}`}>
                <CardHeader className="text-center">
                  <div className="w-20 h-20 bg-white/50 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    {type.icon}
                  </div>
                  <CardTitle className="text-2xl">{type.title}</CardTitle>
                  <CardDescription className="text-base">
                    {type.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {type.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <ChevronRight className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Healthcare?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of patients and healthcare providers who trust MediVault 
            with their most important medical data.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/auth')}
              className="h-14 px-8 text-lg font-semibold bg-white text-primary hover:bg-white/90"
            >
              Get Started Now
              <Heart className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="h-14 px-8 text-lg border-white/20 text-white hover:bg-white/10"
            >
              Contact Sales
              <Users className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">MediVault</h3>
                <p className="text-sm opacity-70">Secure Healthcare Portal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm opacity-70">
              <span>© 2024 MediVault. All rights reserved.</span>
              <span>•</span>
              <span>HIPAA Compliant</span>
              <span>•</span>
              <span>End-to-End Encrypted</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;