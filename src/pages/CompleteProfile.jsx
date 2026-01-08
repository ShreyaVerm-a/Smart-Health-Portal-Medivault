import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const CompleteProfile = () => {
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    emergency_contact: '',
    specialization: '',
    medical_license: '',
    hospital_affiliation: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          date_of_birth: data.date_of_birth || '',
          address: data.address || '',
          emergency_contact: data.emergency_contact || '',
          specialization: data.specialization || '',
          medical_license: data.medical_license || '',
          hospital_affiliation: data.hospital_affiliation || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Complete Your Profile</h1>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Basic Information</h2>
              
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={profile.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={profile.date_of_birth}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Address</Label>
                <Textarea
                  value={profile.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>

              {role === 'patient' && (
                <div>
                  <Label>Emergency Contact</Label>
                  <Input
                    value={profile.emergency_contact}
                    onChange={(e) => handleChange('emergency_contact', e.target.value)}
                    placeholder="Name and phone number"
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            {role === 'doctor' && (
              <div className="space-y-4 pt-6 border-t">
                <h2 className="text-xl font-semibold">Professional Information</h2>
                
                <div>
                  <Label>Specialization</Label>
                  <Input
                    value={profile.specialization}
                    onChange={(e) => handleChange('specialization', e.target.value)}
                    placeholder="e.g., Cardiologist, Pediatrician"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Medical License Number</Label>
                  <Input
                    value={profile.medical_license}
                    onChange={(e) => handleChange('medical_license', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Hospital Affiliation</Label>
                  <Input
                    value={profile.hospital_affiliation}
                    onChange={(e) => handleChange('hospital_affiliation', e.target.value)}
                    placeholder="Current hospital/clinic name"
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CompleteProfile;