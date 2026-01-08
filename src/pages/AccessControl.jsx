import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, User, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AccessControl = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchPermissions();
  }, [user, navigate]);

  const fetchPermissions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('document_access_permissions')
        .select('*')
        .eq('patient_id', user.id)
        .order('granted_at', { ascending: false });

      if (error) {
        console.error('Error fetching permissions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load access permissions.',
          variant: 'destructive',
        });
      } else {
        setPermissions(data || []);
      }
    } catch (error) {
      console.error('Permissions fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const revokeAccess = async (permissionId) => {
    try {
      const { error } = await supabase
        .from('document_access_permissions')
        .update({ is_active: false })
        .eq('id', permissionId);

      if (error) {
        console.error('Error revoking access:', error);
        toast({
          title: 'Error',
          description: 'Failed to revoke access.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Access Revoked',
          description: 'Doctor access has been revoked successfully.',
        });
        fetchPermissions(); // Refresh the list
      }
    } catch (error) {
      console.error('Revoke access error:', error);
    }
  };

  const getAccessTypeColor = (accessType, isActive) => {
    if (!isActive) return 'bg-muted text-muted-foreground';
    
    switch (accessType) {
      case 'view_only':
        return 'bg-secondary text-secondary-foreground';
      case 'full_access':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <p className="text-muted-foreground">Loading access control...</p>
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
          
          <h1 className="text-3xl font-bold mb-2">Access Control</h1>
          <p className="text-muted-foreground">
            Manage doctor access to your medical records
          </p>
        </div>

        {permissions.length === 0 ? (
          <Card className="border-0 bg-gradient-to-br from-card to-muted/30">
            <CardContent className="text-center py-12">
              <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">No Access Permissions</h3>
              <p className="text-muted-foreground mb-4">
                You haven't granted access to any doctors yet. When doctors request access to your records, permissions will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {permissions.map((permission) => (
              <Card key={permission.id} className="border-0 bg-gradient-to-br from-card to-muted/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                        <User className="w-6 h-6 text-warning" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Doctor Access</CardTitle>
                        <CardDescription className="mt-1">
                          Doctor ID: {permission.doctor_id.substring(0, 8)}...
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getAccessTypeColor(permission.access_type, permission.is_active)}>
                        {permission.access_type.replace('_', ' ')}
                      </Badge>
                      
                      {!permission.is_active && (
                        <Badge variant="destructive">Revoked</Badge>
                      )}
                      
                      {permission.expires_at && isExpired(permission.expires_at) && (
                        <Badge variant="destructive">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Expired
                        </Badge>
                      )}
                      
                      {permission.is_active && !isExpired(permission.expires_at) && (
                        <Badge variant="outline" className="text-success border-success">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Granted:</span>
                        <span>{new Date(permission.granted_at).toLocaleDateString()}</span>
                      </div>
                      
                      {permission.expires_at && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Expires:</span>
                          <span>{new Date(permission.expires_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {permission.notes && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Notes:</span>
                          <p className="mt-1 text-sm">{permission.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {permission.is_active && !isExpired(permission.expires_at) && (
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => revokeAccess(permission.id)}
                      >
                        Revoke Access
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessControl;