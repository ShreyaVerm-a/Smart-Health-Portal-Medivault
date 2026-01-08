import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Calendar as CalendarIcon, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export const AdminBookAppointment = () => {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchDoctor, setSearchDoctor] = useState('');
  
  // Patient lookup
  const [patientSearch, setPatientSearch] = useState('');
  const [foundPatient, setFoundPatient] = useState(null);
  const [patientName, setPatientName] = useState('');
  
  // Booking details
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [searchDoctor, doctors]);

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
    if (!searchDoctor) {
      setFilteredDoctors(doctors);
      return;
    }
    const filtered = doctors.filter((doc) =>
      doc.full_name?.toLowerCase().includes(searchDoctor.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(searchDoctor.toLowerCase())
    );
    setFilteredDoctors(filtered);
  };

  const handlePatientSearch = async () => {
    if (!patientSearch.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'patient')
        .or(`email.ilike.%${patientSearch}%,patient_id.ilike.%${patientSearch}%`)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setFoundPatient(data);
        setPatientName(data.full_name);
        toast({
          title: 'Patient Found',
          description: `Found: ${data.full_name} (${data.email})`,
        });
      } else {
        setFoundPatient(null);
        toast({
          title: 'Patient Not Found',
          description: 'No account found. You can still book with just the patient name.',
        });
      }
    } catch (error) {
      console.error('Error searching patient:', error);
    }
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
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime || !patientName.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields (doctor, date, time, patient name)',
        variant: 'destructive',
      });
      return;
    }

    try {
      setBookingLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const appointmentData = {
        doctor_id: selectedDoctor.user_id,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: selectedTime + ':00',
        reason: reason || null,
        status: 'scheduled',
        booked_by: user.id,
        patient_name: patientName,
        // If patient has account, link it; otherwise use a placeholder
        patient_id: foundPatient?.user_id || user.id, // Admin's ID as fallback
      };

      const { error } = await supabase.from('appointments').insert(appointmentData);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Appointment booked for ${patientName} with Dr. ${selectedDoctor.full_name}`,
      });

      // Reset form
      setSelectedDoctor(null);
      setSelectedDate(null);
      setSelectedTime('');
      setReason('');
      setPatientName('');
      setPatientSearch('');
      setFoundPatient(null);
      setAvailableSlots([]);
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
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Book Appointment for Patient
        </CardTitle>
        <CardDescription>
          Search patient by email or patient ID. If no account, enter name manually.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Patient & Doctor Selection */}
          <div className="space-y-4">
            {/* Patient Lookup */}
            <div className="space-y-2">
              <Label>Patient Email or ID</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email or patient ID..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePatientSearch()}
                />
                <Button variant="outline" onClick={handlePatientSearch}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              {foundPatient && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  Found: {foundPatient.full_name} ({foundPatient.email})
                </div>
              )}
            </div>

            {/* Patient Name (manual or auto-filled) */}
            <div className="space-y-2">
              <Label>Patient Name *</Label>
              <Input
                placeholder="Patient full name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
              {!foundPatient && patientName && (
                <p className="text-xs text-muted-foreground">
                  No account linked. Appointment will show patient name only.
                </p>
              )}
            </div>

            {/* Doctor Selection */}
            <div className="space-y-2">
              <Label>Select Doctor *</Label>
              <Input
                placeholder="Search doctor by name or specialization..."
                value={searchDoctor}
                onChange={(e) => setSearchDoctor(e.target.value)}
              />
              <div className="max-h-40 overflow-y-auto space-y-2">
                {filteredDoctors.map((doctor) => (
                  <div
                    key={doctor.user_id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedDoctor?.user_id === doctor.user_id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedDoctor(doctor)}
                  >
                    <p className="font-medium">{doctor.full_name}</p>
                    {doctor.specialization && (
                      <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Date & Time */}
          <div className="space-y-4">
            {!selectedDoctor ? (
              <p className="text-center text-muted-foreground py-8">
                Select a doctor to see available slots
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Select Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
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
                    <div className="space-y-2">
                      <Label>Available Time Slots *</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {availableSlots.length === 0 ? (
                          <p className="col-span-4 text-center text-sm text-muted-foreground py-4">
                            No available slots
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

                    <div className="space-y-2">
                      <Label>Reason (Optional)</Label>
                      <Textarea
                        placeholder="Reason for visit"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleBookAppointment}
                      disabled={!selectedTime || !patientName.trim() || bookingLoading}
                      className="w-full"
                    >
                      {bookingLoading ? 'Booking...' : 'Book Appointment'}
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
