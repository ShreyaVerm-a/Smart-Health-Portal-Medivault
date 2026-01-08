import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Pill, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AddMedicine = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    medicine_name: '',
    dosage: '',
    frequency: '',
    start_date: '',
    end_date: '',
    timing: [],
    notes: ''
  });
  const [timeInput, setTimeInput] = useState('');

  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTime = () => {
    if (timeInput && !formData.timing.includes(timeInput)) {
      setFormData(prev => ({
        ...prev,
        timing: [...prev.timing, timeInput]
      }));
      setTimeInput('');
    }
  };

  const removeTime = (timeToRemove) => {
    setFormData(prev => ({
      ...prev,
      timing: prev.timing.filter(time => time !== timeToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('medicine_tracker')
        .insert({
          patient_id: user.id,
          medicine_name: formData.medicine_name,
          dosage: formData.dosage,
          frequency: formData.frequency,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          timing: formData.timing.length > 0 ? formData.timing : null,
          notes: formData.notes || null
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Medicine Added',
        description: 'Medicine has been added to your tracker successfully.',
      });

      navigate('/medicine-tracker');
      
    } catch (error) {
      console.error('Add medicine error:', error);
      toast({
        title: 'Failed to Add Medicine',
        description: 'There was an error adding the medicine. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-muted">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/medicine-tracker')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Medicine Tracker
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Add New Medicine</h1>
          <p className="text-muted-foreground">
            Add a new medicine to your tracking list
          </p>
        </div>

        <Card className="border-0 bg-gradient-to-br from-card to-muted/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <Pill className="w-6 h-6 text-accent" />
              </div>
              <div>
                <CardTitle>Medicine Details</CardTitle>
                <CardDescription>
                  Enter the details of your medicine
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="medicine_name">Medicine Name</Label>
                <Input
                  id="medicine_name"
                  value={formData.medicine_name}
                  onChange={(e) => handleInputChange('medicine_name', e.target.value)}
                  placeholder="e.g., Paracetamol"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  value={formData.dosage}
                  onChange={(e) => handleInputChange('dosage', e.target.value)}
                  placeholder="e.g., 500mg"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select 
                  value={formData.frequency} 
                  onValueChange={(value) => handleInputChange('frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Once daily">Once daily</SelectItem>
                    <SelectItem value="Twice daily">Twice daily</SelectItem>
                    <SelectItem value="Three times daily">Three times daily</SelectItem>
                    <SelectItem value="Four times daily">Four times daily</SelectItem>
                    <SelectItem value="As needed">As needed</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timing">Timing (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="timing"
                    type="time"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    placeholder="Add time"
                  />
                  <Button type="button" onClick={addTime} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.timing.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.timing.map((time, index) => (
                      <div key={index} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm">
                        {time}
                        <button
                          type="button"
                          onClick={() => removeTime(time)}
                          className="text-muted-foreground hover:text-destructive ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any special instructions or notes..."
                  rows={3}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Adding Medicine...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Medicine
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddMedicine;