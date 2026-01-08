import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pill, Plus, Clock, Calendar, User, Trash2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MedicineTracker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchMedicines();
  }, [user, navigate]);

  const fetchMedicines = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('medicine_tracker')
        .select('*')
        .eq('patient_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching medicines:', error);
        toast({
          title: 'Error',
          description: 'Failed to load medicine tracker.',
          variant: 'destructive',
        });
      } else {
        setMedicines(data || []);
      }
    } catch (error) {
      console.error('Medicines fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsTaken = async (medicineId) => {
    try {
      const medicine = medicines.find(m => m.id === medicineId);
      if (!medicine) throw new Error('Medicine not found');

      const takenAt = new Date().toISOString();

      const { error } = await supabase
        .from('medicine_reminders')
        .insert({
          medicine_id: medicineId,
          patient_id: user.id,
          reminder_date: new Date().toISOString().split('T')[0],
          reminder_time: new Date().toTimeString().split(' ')[0].slice(0, 5),
          status: 'taken',
          taken_at: takenAt
        });

      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', user.id)
        .single();

      if (profile?.email) {
        await supabase.functions.invoke('send-confirmation-email', {
          body: {
            patientEmail: profile.email,
            patientName: profile.full_name,
            medicineName: medicine.medicine_name,
            dosage: medicine.dosage,
            takenAt: takenAt
          }
        });
      }

      toast({
        title: 'Medicine Marked as Taken',
        description: 'Your medicine has been recorded successfully.',
      });

      fetchMedicines();
    } catch (error) {
      console.error('Error marking medicine as taken:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark medicine as taken.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMedicine = async (medicineId) => {
    try {
      const { error } = await supabase
        .from('medicine_tracker')
        .update({ is_active: false })
        .eq('id', medicineId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Medicine removed successfully',
      });
      
      fetchMedicines();
    } catch (error) {
      console.error('Error deleting medicine:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove medicine',
        variant: 'destructive',
      });
    }
  };

  const handleCompleteMedicine = async (medicineId) => {
    try {
      const { error } = await supabase
        .from('medicine_tracker')
        .update({ 
          is_active: false,
          end_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', medicineId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Medicine marked as completed',
      });
      
      fetchMedicines();
    } catch (error) {
      console.error('Error completing medicine:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark medicine as completed',
        variant: 'destructive',
      });
    }
  };

  const getFrequencyColor = (frequency) => {
    switch (frequency.toLowerCase()) {
      case 'daily':
        return 'bg-success text-success-foreground';
      case 'twice daily':
        return 'bg-warning text-warning-foreground';
      case 'three times daily':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Pill className="w-8 h-8 text-white" />
          </div>
          <p className="text-muted-foreground">Loading your medicine tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Medicine Tracker</h1>
              <p className="text-muted-foreground">
                Track your medications and set reminders
              </p>
            </div>
            <Button onClick={() => navigate('/add-medicine')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Medicine
            </Button>
          </div>
        </div>

        {medicines.length === 0 ? (
          <Card className="border-0 bg-gradient-to-br from-card to-muted/30">
            <CardContent className="text-center py-12">
              <Pill className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">No Medicines Added</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your medications by adding your first medicine.
              </p>
              <Button onClick={() => navigate('/add-medicine')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Medicine
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {medicines.map((medicine) => (
              <Card key={medicine.id} className="border-0 bg-gradient-to-br from-card to-muted/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                        <Pill className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{medicine.medicine_name}</CardTitle>
                        <CardDescription className="mt-1">
                          {medicine.dosage} • {medicine.frequency}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <Badge className={getFrequencyColor(medicine.frequency)}>
                      {medicine.frequency}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Start:</span>
                        <span>{new Date(medicine.start_date).toLocaleDateString()}</span>
                      </div>
                      
                      {medicine.end_date && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">End:</span>
                          <span>{new Date(medicine.end_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {medicine.timing && medicine.timing.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Times:</span>
                          <span>{medicine.timing.join(', ')}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {medicine.prescribed_by && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Prescribed by doctor</span>
                        </div>
                      )}
                      
                      {medicine.notes && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Notes:</span>
                          <p className="mt-1 text-sm">{medicine.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleMarkAsTaken(medicine.id)}
                    >
                      Mark as Taken
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate('/add-medicine', { state: { editMedicine: medicine } })}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCompleteMedicine(medicine.id)}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Complete
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteMedicine(medicine.id)}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineTracker;