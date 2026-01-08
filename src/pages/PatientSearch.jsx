import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, User, Shield, Clock, Phone, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { patientSearchSchema, otpSchema } from '@/lib/validation';

const PatientSearch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('email');
  const [loading, setLoading] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;

    // Validate search input
    const validation = patientSearchSchema.safeParse({ searchQuery, searchType });
    if (!validation.success) {
      toast({
        title: 'Invalid Search',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setPatientProfile(null);
    setOtpRequested(false);

    try {
      const searchField = searchType === 'email' ? 'email' : 'patient_id';
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq(searchField, searchQuery.trim())
        .eq('role', 'patient')
        .maybeSingle();

      if (error || !data) {
        toast({
          title: 'Patient Not Found',
          description: `No patient found with this ${searchType === 'email' ? 'email' : 'patient ID'}.`,
          variant: 'destructive',
        });
      } else {
        setPatientProfile(data);
        toast({
          title: 'Patient Found',
          description: 'Patient profile loaded successfully.',
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Failed',
        description: 'Failed to search for patient. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    if (!patientProfile || !user) return;

    setLoading(true);
    try {
      // Generate cryptographically secure 6-digit OTP
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      const otpCode = (100000 + (array[0] % 900000)).toString();
      
      // Get doctor's profile info
      const { data: doctorProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from('otp_verifications')
        .insert({
          patient_id: patientProfile.user_id,
          doctor_id: user.id,
          otp_code: otpCode,
          purpose: 'document_access'
        });

      if (error) {
        throw error;
      }

      // Send OTP email to patient
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-otp-email', {
          body: {
            patient_email: patientProfile.email,
            patient_name: patientProfile.full_name,
            doctor_name: doctorProfile?.full_name || 'Unknown Doctor',
            otp_code: otpCode
          }
        });

        if (emailError) {
          console.error('Email sending failed:', emailError);
          toast({
            title: 'Email Failed',
            description: 'OTP was generated but email failed to send. Please try again.',
            variant: 'destructive',
          });
          // Don't set otpRequested to true if email failed
          return;
        } else {
          console.log('Email sent successfully:', emailData);
          toast({
            title: 'OTP Sent',
            description: 'OTP has been sent to the patient\'s email',
          });
          setOtpRequested(true);
        }
      } catch (emailError) {
        console.error('Email service error:', emailError);
        toast({
          title: 'Email Service Error',
          description: 'Email service is not configured. Please contact support.',
          variant: 'destructive',
        });
        // Don't set otpRequested to true if email service failed
        return;
      }
    } catch (error) {
      console.error('OTP request error:', error);
      toast({
        title: 'OTP Request Failed',
        description: 'Failed to generate OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpCode.trim() || !patientProfile || !user) return;

    // Validate OTP format
    const validation = otpSchema.safeParse(otpCode.trim());
    if (!validation.success) {
      toast({
        title: 'Invalid OTP',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setVerifyingOtp(true);
    try {
      const { data, error } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('patient_id', patientProfile.user_id)
        .eq('doctor_id', user.id)
        .eq('otp_code', otpCode.trim())
        .eq('is_verified', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        toast({
          title: 'Invalid OTP',
          description: 'The OTP code is invalid or has expired.',
          variant: 'destructive',
        });
        return;
      }

      // Mark OTP as verified
      await supabase
        .from('otp_verifications')
        .update({ 
          is_verified: true, 
          verified_at: new Date().toISOString() 
        })
        .eq('id', data.id);

      // Grant access permission
      await supabase
        .from('document_access_permissions')
        .insert({
          patient_id: patientProfile.user_id,
          doctor_id: user.id,
          access_type: 'view_only',
          notes: 'Access granted via OTP verification'
        });

      toast({
        title: 'Access Granted',
        description: 'You now have access to this patient\'s medical records.',
      });

      // Navigate to patient records view
      navigate(`/patient-records/${patientProfile.user_id}`);
      
    } catch (error) {
      console.error('OTP verification error:', error);
      toast({
        title: 'Verification Failed',
        description: 'Failed to verify OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-muted">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Patient Search</h1>
          <p className="text-muted-foreground">
            Search for patients and request access to their medical records
          </p>
        </div>

        {/* Search Form */}
        <Card className="border-0 bg-gradient-to-br from-card to-muted/30 mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6 text-accent" />
              </div>
              <div>
                <CardTitle>Search Patient</CardTitle>
                <CardDescription>
                  Find a patient by email or patient ID
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={searchType === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchType('email')}
                >
                  Email
                </Button>
                <Button
                  variant={searchType === 'patient_id' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchType('patient_id')}
                >
                  Patient ID
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="search">
                  {searchType === 'email' ? 'Patient Email' : 'Patient ID'}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="search"
                    type={searchType === 'email' ? 'email' : 'text'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchType === 'email' ? 'patient@example.com' : 'PAT-12345678'}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient Profile */}
        {patientProfile && (
          <Card className="border-0 bg-gradient-to-br from-card to-muted/30 mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{patientProfile.full_name}</CardTitle>
                  <CardDescription>Patient ID: {patientProfile.patient_id}</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{patientProfile.email}</span>
                </div>
                
                {patientProfile.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{patientProfile.phone}</span>
                  </div>
                )}
                
                {patientProfile.date_of_birth && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>DOB: {new Date(patientProfile.date_of_birth).toLocaleDateString()}</span>
                  </div>
                )}
                
                {patientProfile.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Address:</span>
                    <span>{patientProfile.address}</span>
                  </div>
                )}
              </div>
              
              {!otpRequested ? (
                <Button onClick={requestOtp} disabled={loading}>
                  <Shield className="w-4 h-4 mr-2" />
                  Request Access (Send OTP)
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-success">
                    <Shield className="w-4 h-4" />
                    <span>OTP has been generated for patient verification</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="otp">Enter OTP Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="otp"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        onKeyPress={(e) => e.key === 'Enter' && verifyOtp()}
                      />
                      <Button onClick={verifyOtp} disabled={verifyingOtp || !otpCode.trim()}>
                        {verifyingOtp ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'Verify'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PatientSearch;