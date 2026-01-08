import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, User, MapPin, ArrowLeft, Plus } from 'lucide-react';
import { format } from 'date-fns';

const Appointments = () => {
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patient_id(full_name, email, phone),
          doctor:doctor_id(full_name, specialization, hospital_affiliation)
        `)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load appointments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Appointment cancelled successfully',
      });
      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel appointment',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'no_show':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">My Appointments</h1>
          </div>
          {role === 'patient' && (
            <Button onClick={() => navigate('/book-appointment')} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Book Appointment
            </Button>
          )}
        </div>

        {appointments.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No appointments</h3>
            <p className="text-muted-foreground mb-4">
              {role === 'patient' 
                ? "You haven't booked any appointments yet" 
                : "You don't have any scheduled appointments"}
            </p>
            {role === 'patient' && (
              <Button onClick={() => navigate('/book-appointment')}>
                Book Your First Appointment
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-4">
            {appointments.map((appointment) => {
              // For doctors: show patient name (from patient_name field if admin-booked, or from patient profile)
              const displayName = role === 'patient'
                ? appointment.doctor?.full_name
                : appointment.patient_name || appointment.patient?.full_name;
              
              const isAdminBooked = !!appointment.booked_by;
              
              return (
                <Card key={appointment.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">{displayName}</p>
                        {role === 'patient' && appointment.doctor?.specialization && (
                          <p className="text-sm text-muted-foreground">
                            {appointment.doctor.specialization}
                          </p>
                        )}
                        {role === 'doctor' && isAdminBooked && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Booked by Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(appointment.appointment_date), 'PPP')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{appointment.appointment_time}</span>
                  </div>
                </div>

                {appointment.doctor?.hospital_affiliation && (
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{appointment.doctor.hospital_affiliation}</span>
                  </div>
                )}

                {appointment.reason && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold mb-1">Reason:</p>
                    <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                  </div>
                )}

                {appointment.status === 'scheduled' && (
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelAppointment(appointment.id)}
                    >
                      Cancel Appointment
                    </Button>
                  </div>
                )}
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;