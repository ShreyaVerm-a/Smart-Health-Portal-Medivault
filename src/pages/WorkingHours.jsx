import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const WorkingHours = () => {
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [workingHours, setWorkingHours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (role && role !== 'doctor') {
      navigate('/dashboard');
      return;
    }
    fetchWorkingHours();
  }, [user, role]);

  const fetchWorkingHours = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('doctor_working_hours')
        .select('*')
        .eq('doctor_id', user.id)
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      setWorkingHours(data || []);
    } catch (error) {
      console.error('Error fetching working hours:', error);
      toast({
        title: 'Error',
        description: 'Failed to load working hours',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = (dayOfWeek) => {
    const newSlot = {
      id: `temp-${Date.now()}`,
      doctor_id: user.id,
      day_of_week: dayOfWeek,
      start_time: '09:00',
      end_time: '17:00',
      is_available: true,
      isNew: true,
    };
    setWorkingHours([...workingHours, newSlot]);
  };

  const handleUpdateSlot = (slotId, field, value) => {
    setWorkingHours(
      workingHours.map((slot) =>
        slot.id === slotId ? { ...slot, [field]: value } : slot
      )
    );
  };

  const handleSaveSlot = async (slot) => {
    try {
      if (slot.isNew) {
        const { id, isNew, ...insertData } = slot;
        const { error } = await supabase
          .from('doctor_working_hours')
          .insert(insertData);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('doctor_working_hours')
          .update({
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: slot.is_available,
          })
          .eq('id', slot.id);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Working hours saved successfully',
      });
      fetchWorkingHours();
    } catch (error) {
      console.error('Error saving working hours:', error);
      toast({
        title: 'Error',
        description: 'Failed to save working hours',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      const slot = workingHours.find((s) => s.id === slotId);
      if (slot.isNew) {
        setWorkingHours(workingHours.filter((s) => s.id !== slotId));
        return;
      }

      const { error } = await supabase
        .from('doctor_working_hours')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Working hours deleted successfully',
      });
      fetchWorkingHours();
    } catch (error) {
      console.error('Error deleting working hours:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete working hours',
        variant: 'destructive',
      });
    }
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Manage Working Hours</h1>
        </div>

        <div className="space-y-4">
          {DAYS.map((day, index) => {
            const daySlots = workingHours.filter((wh) => wh.day_of_week === index);

            return (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{day}</h3>
                  <Button
                    size="sm"
                    onClick={() => handleAddSlot(index)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Slot
                  </Button>
                </div>

                {daySlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No working hours set</p>
                ) : (
                  <div className="space-y-4">
                    {daySlots.map((slot) => (
                      <div key={slot.id} className="flex items-end gap-4 p-4 border rounded-lg">
                        <div className="flex-1">
                          <Label className="text-xs">Start Time</Label>
                          <Input
                            type="time"
                            value={slot.start_time}
                            onChange={(e) =>
                              handleUpdateSlot(slot.id, 'start_time', e.target.value)
                            }
                            className="mt-1"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">End Time</Label>
                          <Input
                            type="time"
                            value={slot.end_time}
                            onChange={(e) =>
                              handleUpdateSlot(slot.id, 'end_time', e.target.value)
                            }
                            className="mt-1"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={slot.is_available}
                            onCheckedChange={(checked) =>
                              handleUpdateSlot(slot.id, 'is_available', checked)
                            }
                          />
                          <Label className="text-xs">Available</Label>
                        </div>
                        <Button size="sm" onClick={() => handleSaveSlot(slot)}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteSlot(slot.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WorkingHours;