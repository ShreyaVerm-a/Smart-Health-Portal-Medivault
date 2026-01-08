import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Activity, Send, Bot, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AIAssistant = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI Health Assistant. I can help you understand your symptoms, suggest when to see a specialist, and provide general health information. Please note that I\'m not a replacement for professional medical advice. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if user is a patient, if not redirect to dashboard
    const checkUserRole = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (profile?.role !== 'patient') {
        navigate('/dashboard');
        return;
      }
    };

    checkUserRole();
  }, [user, navigate]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setLoading(true);

    try {
      // Get user's location for hospital recommendations
      let location = null;
      try {
        if (navigator.geolocation) {
          location = await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (position) => resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              }),
              () => resolve({lat: 0, lng: 0}) // Default if denied
            );
          });
        }
      } catch (err) {
        console.log('Location access denied or unavailable');
      }

      // Call the AI health assistant edge function
      const { data, error } = await supabase.functions.invoke('ai-health-assistant', {
        body: { 
          message: currentMessage,
          include_recommendations: true,
          user_location: location
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data || !data.response) {
        console.error('Invalid response from AI assistant:', data);
        throw new Error('Invalid response from AI assistant');
      }

      const aiResponse = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);

      // Log the activity
      await logActivity('ai_consultation', `AI consultation: ${currentMessage.substring(0, 50)}...`);
    } catch (error) {
      console.error('AI Assistant error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const logActivity = async (action, description) => {
    try {
      // This will be implemented when types are updated
      console.log(`Activity: ${action} - ${description}`);
    } catch (error) {
      console.error('Activity log error:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-muted">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">AI Health Assistant</h1>
          <p className="text-muted-foreground">
            Get AI-powered health insights and specialist recommendations
          </p>
        </div>

        <Card className="border-0 bg-gradient-to-br from-card to-muted/30 h-[600px] flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-success" />
              </div>
              <div>
                <CardTitle className="text-lg">Health Assistant Chat</CardTitle>
                <CardDescription>
                  Ask about symptoms, get specialist recommendations, and health advice
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[400px]">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-success/10 text-success'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    
                    <div className={`rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 opacity-70`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input Area */}
            <div className="flex gap-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your symptoms or ask a health question..."
                className="flex-1 resize-none"
                rows={2}
                disabled={loading}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || loading}
                size="icon"
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2 text-center">
              ⚠️ This AI assistant provides general information only and is not a substitute for professional medical advice.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIAssistant;