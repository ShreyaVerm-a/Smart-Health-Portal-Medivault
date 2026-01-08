import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Search, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

const BookAppointment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchName, setSearchName] = useState('');
  const [searchHospital, setSearchHospital] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchDoctors();
  }, [user]);

  useEffect(() => {
    filterDoctors();
  }, [searchName, searchHospital, doctors]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'doctor')
        .eq('is_verified', true);

      if (error) throw error;
      setDoctors(data || []);
      setFilteredDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load doctors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = doctors;

    if (searchName) {
      filtered = filtered.filter((doc) =>
        doc.full_name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (searchHospital) {
      filtered = filtered.filter((doc) =>
        doc.hospital_affiliation?.toLowerCase().includes(searchHospital.toLowerCase())
      );
    }

    setFilteredDoctors(filtered);
  };

  const fetchAvailableSlots = async () => {
    try {
      const dayOfWeek = selectedDate.getDay();
      
      const { data: workingHours, error: whError } = await supabase
        .from('doctor_working_hours')
        .select('*')
        .eq('doctor_id', selectedDoctor.user_id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);

      if (whError) throw whError;

      if (!workingHours || workingHours.length === 0) {
        setAvailableSlots([]);
        return;
      }

      const { data: existingAppointments, error: apptError } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('doctor_id', selectedDoctor.user_id)
        .eq('appointment_date', format(selectedDate, 'yyyy-MM-dd'))
        .neq('status', 'cancelled');

      if (apptError) throw apptError;

      const bookedTimes = existingAppointments.map((a) => a.appointment_time);

      const slots = [];
      workingHours.forEach((wh) => {
        const start = new Date(`2000-01-01T${wh.start_time}`);
        const end = new Date(`2000-01-01T${wh.end_time}`);
        
        let current = new Date(start);
        while (current < end) {
          const timeStr = format(current, 'HH:mm:ss');
          if (!bookedTimes.includes(timeStr)) {
            slots.push(format(current, 'HH:mm'));
          }
          current = new Date(current.getTime() + 30 * 60000);
        }
      });

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available time slots',
        variant: 'destructive',
      });
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast({
        title: 'Error',
        description: 'Please select a doctor, date, and time',
        variant: 'destructive',
      });
      return;
    }

    try {
      setBookingLoading(true);
      const { error } = await supabase.from('appointments').insert({
        patient_id: user.id,
        doctor_id: selectedDoctor.user_id,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: selectedTime + ':00',
        reason: reason || null,
        status: 'scheduled',
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Appointment booked successfully',
      });
      navigate('/appointments');
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to book appointment',
        variant: 'destructive',
      });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/appointments')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Book Appointment</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Search Doctors</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <Label>Doctor Name</Label>
                <Input
                  placeholder="Search by doctor name"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Hospital Name</Label>
                <Input
                  placeholder="Search by hospital"
                  value={searchHospital}
                  onChange={(e) => setSearchHospital(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredDoctors.map((doctor) => (
                <Card
                  key={doctor.user_id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedDoctor?.user_id === doctor.user_id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedDoctor(doctor)}
                >
                  <h3 className="font-semibold">{doctor.full_name}</h3>
                  {doctor.specialization && (
                    <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                  )}
                  {doctor.hospital_affiliation && (
                    <p className="text-sm text-muted-foreground mt-1">
                      🏥 {doctor.hospital_affiliation}
                    </p>
                  )}
                </Card>
              ))}
              {filteredDoctors.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No doctors found matching your search
                </p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Select Date & Time</h2>
            
            {!selectedDoctor ? (
              <p className="text-center text-muted-foreground py-8">
                Please select a doctor first
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Select Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {selectedDate && (
                  <>
                    <div>
                      <Label>Available Time Slots</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {availableSlots.length === 0 ? (
                          <p className="col-span-3 text-center text-sm text-muted-foreground py-4">
                            No available slots for this date
                          </p>
                        ) : (
                          availableSlots.map((slot) => (
                            <Button
                              key={slot}
                              variant={selectedTime === slot ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setSelectedTime(slot)}
                            >
                              {slot}
                            </Button>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <Label>Reason for Visit (Optional)</Label>
                      <Textarea
                        placeholder="Describe your symptoms or reason for visit"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="mt-1"
                        rows={4}
                      />
                    </div>

                    <Button
                      onClick={handleBookAppointment}
                      disabled={!selectedTime || bookingLoading}
                      className="w-full"
                    >
                      {bookingLoading ? 'Booking...' : 'Book Appointment'}
                    </Button>
                  </>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;