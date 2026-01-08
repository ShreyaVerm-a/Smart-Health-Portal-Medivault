import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Activity, Search, UserPlus, Trash2, CalendarPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentDeletionManager } from '@/components/admin/DocumentDeletionManager';
import { AdminBookAppointment } from '@/components/admin/AdminBookAppointment';

const HospitalAdmin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch doctors
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'doctor');

      // Fetch patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'patient');

      if (doctorsError) throw doctorsError;
      if (patientsError) throw patientsError;

      setDoctors(doctorsData || []);
      setPatients(patientsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDoctor = async (doctorUserId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('user_id', doctorUserId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Doctor verified successfully',
      });
      
      fetchData();
    } catch (error) {
      console.error('Error verifying doctor:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify doctor',
        variant: 'destructive',
      });
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPatients = patients.filter(patient =>
    patient.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.patient_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-muted flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Hospital Administration</h1>
          <p className="text-muted-foreground">
            Manage doctors, patients, and oversee hospital operations
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{doctors.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patients.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{doctors.length + patients.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="doctors" className="space-y-4">
          <TabsList>
            <TabsTrigger value="doctors">Doctors</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-1">
              <CalendarPlus className="w-3 h-3" />
              Book Appointment
            </TabsTrigger>
            <TabsTrigger value="deletions" className="flex items-center gap-1">
              <Trash2 className="w-3 h-3" />
              Deletion Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="doctors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Doctor Management</CardTitle>
                <CardDescription>View and manage hospital doctors</CardDescription>
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search doctors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDoctors.map((doctor) => (
                      <TableRow key={doctor.user_id}>
                        <TableCell className="font-medium">{doctor.full_name}</TableCell>
                        <TableCell>{doctor.email}</TableCell>
                        <TableCell>{doctor.specialization || 'Not specified'}</TableCell>
                        <TableCell>{doctor.medical_license || 'Not provided'}</TableCell>
                        <TableCell>
                          <Badge variant={doctor.is_verified ? "default" : "secondary"}>
                            {doctor.is_verified ? "Verified" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!doctor.is_verified && (
                            <Button
                              size="sm"
                              onClick={() => handleVerifyDoctor(doctor.user_id)}
                            >
                              Verify
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Patient Management</CardTitle>
                <CardDescription>View and manage registered patients</CardDescription>
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Date of Birth</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow key={patient.user_id}>
                        <TableCell className="font-medium">{patient.patient_id}</TableCell>
                        <TableCell>{patient.full_name}</TableCell>
                        <TableCell>{patient.email}</TableCell>
                        <TableCell>{patient.phone || 'Not provided'}</TableCell>
                        <TableCell>{patient.date_of_birth || 'Not provided'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <AdminBookAppointment />
          </TabsContent>

          <TabsContent value="deletions" className="space-y-4">
            <DocumentDeletionManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HospitalAdmin;