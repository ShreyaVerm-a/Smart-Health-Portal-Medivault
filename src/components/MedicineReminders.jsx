import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';

const MedicineReminders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Fetch today's pending reminders
    fetchTodayReminders();

    // Set up real-time subscription
    const channel = supabase
      .channel('medicine-reminders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'medicine_reminders',
          filter: `patient_id=eq.${user.id}`,
        },
        (payload) => {
          checkAndNotify(payload.new);
        }
      )
      .subscribe();

    // Check every minute for due reminders
    const interval = setInterval(checkPendingReminders, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user]);

  const fetchTodayReminders = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('medicine_reminders')
        .select(`
          *,
          medicine:medicine_id(medicine_name, dosage)
        `)
        .eq('patient_id', user.id)
        .eq('reminder_date', today)
        .eq('status', 'pending');

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const checkPendingReminders = async () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    reminders.forEach((reminder) => {
      const reminderTime = reminder.reminder_time.slice(0, 5);
      if (reminderTime === currentTime) {
        showReminderNotification(reminder);
      }
    });
  };

  const checkAndNotify = (reminder) => {
    const now = new Date();
    const reminderDate = new Date(reminder.reminder_date);
    const [hours, minutes] = reminder.reminder_time.split(':');
    reminderDate.setHours(parseInt(hours), parseInt(minutes));

    // If reminder is within 5 minutes
    const timeDiff = reminderDate.getTime() - now.getTime();
    if (timeDiff > 0 && timeDiff <= 300000) {
      setTimeout(() => {
        fetchTodayReminders();
        showReminderNotification(reminder);
      }, timeDiff);
    }
  };

  const showReminderNotification = async (reminder) => {
    // Fetch medicine details
    const { data: medicine } = await supabase
      .from('medicine_tracker')
      .select('medicine_name, dosage')
      .eq('id', reminder.medicine_id)
      .single();

    if (medicine) {
      toast({
        title: '💊 Medicine Reminder',
        description: `Time to take ${medicine.medicine_name} (${medicine.dosage})`,
        duration: 10000,
        action: (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => markAsTaken(reminder.id)}
            >
              Taken
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => markAsSkipped(reminder.id)}
            >
              Skip
            </Button>
          </div>
        ),
      });

      // Browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Medicine Reminder', {
          body: `Time to take ${medicine.medicine_name} (${medicine.dosage})`,
          icon: '/medivault-favicon.png',
          tag: reminder.id,
        });
      }
    }
  };

  const markAsTaken = async (reminderId) => {
    try {
      const { error } = await supabase
        .from('medicine_reminders')
        .update({
          status: 'taken',
          taken_at: new Date().toISOString(),
        })
        .eq('id', reminderId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Medicine marked as taken',
      });
      fetchTodayReminders();
    } catch (error) {
      console.error('Error marking as taken:', error);
    }
  };

  const markAsSkipped = async (reminderId) => {
    try {
      const { error } = await supabase
        .from('medicine_reminders')
        .update({
          status: 'skipped',
          skipped_at: new Date().toISOString(),
        })
        .eq('id', reminderId);

      if (error) throw error;

      toast({
        title: 'Reminder skipped',
        description: 'Medicine marked as skipped',
      });
      fetchTodayReminders();
    } catch (error) {
      console.error('Error marking as skipped:', error);
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return null; // This component doesn't render anything visible
};

export default MedicineReminders;