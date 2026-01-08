import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Activity, 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Shield, 
  Bot,
  UserCheck,
  Pill
} from 'lucide-react';

const RecentActivity = ({ limit = 10, showHeader = true }) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecentActivity();
    }
  }, [user]);

  const fetchRecentActivity = async () => {
    if (!user) return;

    try {
      // For now, we'll create mock activity data since the types aren't updated yet
      // In a real implementation, this would query the activity_logs table
      const mockActivities = [
        {
          id: '1',
          action: 'document_download',
          description: 'Downloaded blood_test_results.pdf',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          action: 'ai_consultation',
          description: 'AI consultation: feeling dizzy and nauseous...',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          action: 'access_granted',
          description: 'Granted access to Dr. Smith for medical records',
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          action: 'medicine_added',
          description: 'Added Aspirin to medicine tracker',
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '5',
          action: 'document_preview',
          description: 'Previewed MRI_scan_report.pdf',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      // Show only recent activities for this user
      setActivities(mockActivities.slice(0, limit));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'document_upload':
        return <Upload className="w-4 h-4" />;
      case 'document_download':
        return <Download className="w-4 h-4" />;
      case 'document_preview':
        return <Eye className="w-4 h-4" />;
      case 'access_granted':
      case 'access_revoked':
        return <Shield className="w-4 h-4" />;
      case 'ai_consultation':
        return <Bot className="w-4 h-4" />;
      case 'otp_verified':
        return <UserCheck className="w-4 h-4" />;
      case 'medicine_added':
      case 'medicine_updated':
        return <Pill className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (action) => {
    switch (action) {
      case 'document_upload':
        return 'bg-blue-100 text-blue-700';
      case 'document_download':
        return 'bg-green-100 text-green-700';
      case 'document_preview':
        return 'bg-purple-100 text-purple-700';
      case 'access_granted':
        return 'bg-green-100 text-green-700';
      case 'access_revoked':
        return 'bg-red-100 text-red-700';
      case 'ai_consultation':
        return 'bg-cyan-100 text-cyan-700';
      case 'otp_verified':
        return 'bg-yellow-100 text-yellow-700';
      case 'medicine_added':
      case 'medicine_updated':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <Card className="border-0 bg-gradient-to-br from-card to-muted/30">
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading activity...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="border-0 bg-gradient-to-br from-card to-muted/30">
        {showHeader && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No recent activity</p>
            <p className="text-sm">
              Once you start using the portal, your activity will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-gradient-to-br from-card to-muted/30">
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.action)}`}>
                {getActivityIcon(activity.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTimeAgo(activity.created_at)}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {activity.action.replace('_', ' ')}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;