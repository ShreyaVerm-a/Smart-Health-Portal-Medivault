import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Search, Trash2, FileText, Send, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const DocumentDeletionManager = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletionRequests, setDeletionRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [processingOtp, setProcessingOtp] = useState(false);

  useEffect(() => {
    fetchDeletionRequests();
  }, []);

  const fetchDeletionRequests = async () => {
    try {
      setLoading(true);

      const { data: requests, error: reqError } = await supabase
        .from('document_deletion_requests')
        .select('*')
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (reqError) throw reqError;

      const requestList = requests || [];
      if (requestList.length === 0) {
        setDeletionRequests([]);
        return;
      }

      const documentIds = [...new Set(requestList.map((r) => r.document_id).filter(Boolean))];
      const patientIds = [...new Set(requestList.map((r) => r.patient_id).filter(Boolean))];

      const [{ data: docs, error: docsError }, { data: patients, error: patientsError }] = await Promise.all([
        supabase
          .from('medical_documents')
          .select('id, file_name, document_type, hospital_name, patient_id')
          .in('id', documentIds),
        supabase
          .from('profiles')
          .select('user_id, full_name, email, patient_id')
          .in('user_id', patientIds),
      ]);

      if (docsError) throw docsError;
      if (patientsError) throw patientsError;

      const docsById = new Map((docs || []).map((d) => [d.id, d]));
      const patientsById = new Map((patients || []).map((p) => [p.user_id, p]));

      const enriched = requestList.map((r) => ({
        ...r,
        document: docsById.get(r.document_id) || null,
        patient: patientsById.get(r.patient_id) || null,
      }));

      setDeletionRequests(enriched);
    } catch (error) {
      console.error('Error fetching deletion requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load deletion requests.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = deletionRequests.filter((request) =>
    request.patient?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.patient?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.patient?.patient_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.document?.file_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInitiateDelete = (request) => {
    setSelectedRequest(request);
    setOtpSent(false);
    setOtp('');
    setOtpDialogOpen(true);
  };

  const handleSendOtp = async () => {
    if (!selectedRequest) return;

    setProcessingOtp(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!selectedRequest.patient_id || !selectedRequest.patient?.email) {
        throw new Error('Patient profile not found for this request.');
      }

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP in database
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      const { error: otpError } = await supabase
        .from('otp_verifications')
        .insert({
          doctor_id: user.id, // Admin acts as doctor in OTP flow
          patient_id: selectedRequest.patient_id,
          otp_code: otpCode,
          purpose: 'document_deletion',
          is_verified: false,
          expires_at: expiresAt,
        });

      if (otpError) throw otpError;

      // Send OTP email
      const { error: emailError } = await supabase.functions.invoke('send-otp-email', {
        body: {
          patient_email: selectedRequest.patient.email,
          patient_name: selectedRequest.patient.full_name,
          doctor_name: 'Hospital Admin',
          otp_code: otpCode,
        },
      });

      if (emailError) {
        console.error('Email error:', emailError);
        // Still proceed as OTP is stored
      }

      setOtpSent(true);
      toast({
        title: 'OTP Sent',
        description: `OTP has been sent to ${selectedRequest.patient.email}`,
      });
    } catch (error) {
      console.error('Error sending OTP:', error);
      const msg =
        (error && typeof error === 'object' && 'message' in error && error.message) ? String(error.message) :
        'Failed to send OTP.';

      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setProcessingOtp(false);
    }
  };

  const handleVerifyAndDelete = async () => {
    if (!selectedRequest) return;

    const otpClean = String(otp).replace(/\D/g, '');
    if (otpClean.length !== 6) return;

    setProcessingOtp(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Verify OTP (latest, unverified, not expired)
      const { data: otpData, error: otpError } = await supabase
        .from('otp_verifications')
        .select('id, otp_code, created_at, expires_at, is_verified')
        .eq('doctor_id', user.id)
        .eq('patient_id', selectedRequest.patient_id)
        .eq('otp_code', otpClean)
        .eq('purpose', 'document_deletion')
        .eq('is_verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (otpError || !otpData) {
        toast({
          title: 'Invalid OTP',
          description: 'The OTP is invalid or has expired.',
          variant: 'destructive',
        });
        return;
      }

      // Mark OTP as verified (must succeed before trashing)
      const { error: otpUpdateError } = await supabase
        .from('otp_verifications')
        .update({ is_verified: true, verified_at: new Date().toISOString() })
        .eq('id', otpData.id);

      if (otpUpdateError) throw otpUpdateError;

      // Approve deletion request (DB trigger will trash the document with elevated privileges)
      const { error: requestError } = await supabase
        .from('document_deletion_requests')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString(),
          processed_by: user.id,
        })
        .eq('id', selectedRequest.id);

      if (requestError) throw requestError;

      toast({
        title: 'Document Deleted',
        description: 'Approved. The document will now appear in the patient\'s Trash.',
      });

      setOtpDialogOpen(false);
      setSelectedRequest(null);
      setOtp('');
      fetchDeletionRequests();
    } catch (error) {
      console.error('Error deleting document:', error);
      const msg =
        (error && typeof error === 'object' && 'message' in error && error.message)
          ? String(error.message)
          : 'Failed to delete document.';

      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setProcessingOtp(false);
    }
  };

  const handleRejectRequest = async (request) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('document_deletion_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: user.id,
        })
        .eq('id', request.id);

      if (error) throw error;

      toast({
        title: 'Request Rejected',
        description: 'The deletion request has been rejected.',
      });

      fetchDeletionRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject request.',
        variant: 'destructive',
      });
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Document Deletion Requests
          </CardTitle>
          <CardDescription>
            Process patient requests to delete their documents. Requires OTP verification from patient.
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient name, email, ID, or document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No pending deletion requests</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.patient?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{request.patient?.email}</p>
                        <p className="text-xs text-muted-foreground">ID: {request.patient?.patient_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{request.document?.file_name}</p>
                          <Badge variant="outline" className="mt-1">{request.document?.document_type}</Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-muted-foreground truncate">
                        {request.reason || 'No reason provided'}
                      </p>
                    </TableCell>
                    <TableCell>
                      {new Date(request.requested_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleInitiateDelete(request)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(request)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Patient Identity</DialogTitle>
            <DialogDescription>
              Send an OTP to the patient to confirm deletion. The patient must provide this OTP to you.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Patient: {selectedRequest.patient?.full_name}</p>
                <p className="text-sm text-muted-foreground">Email: {selectedRequest.patient?.email}</p>
                <p className="text-sm text-muted-foreground mt-2">Document: {selectedRequest.document?.file_name}</p>
              </div>

              {!otpSent ? (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Click below to send an OTP to the patient's email for verification.
                  </p>
                  <Button onClick={handleSendOtp} disabled={processingOtp}>
                    <Send className="w-4 h-4 mr-2" />
                    {processingOtp ? 'Sending...' : 'Send OTP to Patient'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      OTP sent to patient. Ask them for the code.
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium">Enter OTP from patient:</p>
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={setOtp}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOtpDialogOpen(false)}>
              Cancel
            </Button>
            {otpSent && (
              <Button
                variant="destructive"
                onClick={handleVerifyAndDelete}
                disabled={String(otp).replace(/\D/g, '').length !== 6 || processingOtp}
              >
                {processingOtp ? 'Processing...' : 'Verify & Delete'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
