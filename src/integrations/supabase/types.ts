export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          booked_by: string | null
          created_at: string
          doctor_id: string
          duration_minutes: number
          id: string
          notes: string | null
          patient_id: string
          patient_name: string | null
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          booked_by?: string | null
          created_at?: string
          doctor_id: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id: string
          patient_name?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          booked_by?: string | null
          created_at?: string
          doctor_id?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id?: string
          patient_name?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "appointments_patient_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      doctor_working_hours: {
        Row: {
          created_at: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id: string
          is_available: boolean | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id?: string
          is_available?: boolean | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          doctor_id?: string
          end_time?: string
          id?: string
          is_available?: boolean | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_working_hours_doctor_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      document_access_permissions: {
        Row: {
          access_type: string | null
          created_at: string
          doctor_id: string
          document_id: string | null
          expires_at: string | null
          granted_at: string
          id: string
          is_active: boolean | null
          notes: string | null
          patient_id: string
        }
        Insert: {
          access_type?: string | null
          created_at?: string
          doctor_id: string
          document_id?: string | null
          expires_at?: string | null
          granted_at?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          patient_id: string
        }
        Update: {
          access_type?: string | null
          created_at?: string
          doctor_id?: string
          document_id?: string | null
          expires_at?: string | null
          granted_at?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_access_permissions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_access_permissions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "medical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_permissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      document_deletion_requests: {
        Row: {
          created_at: string
          document_id: string
          id: string
          patient_id: string
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          requested_at: string
          status: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          patient_id: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          patient_id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_deletion_requests_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "medical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_deletion_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      medical_documents: {
        Row: {
          created_at: string
          date_of_document: string | null
          description: string | null
          document_type: string
          extracted_text: string | null
          file_name: string
          file_path: string
          file_type: string
          hospital_name: string | null
          id: string
          is_active: boolean | null
          is_handwritten: boolean | null
          is_trashed: boolean | null
          patient_id: string
          tags: string[] | null
          trashed_at: string | null
          trashed_by: string | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          date_of_document?: string | null
          description?: string | null
          document_type: string
          extracted_text?: string | null
          file_name: string
          file_path: string
          file_type: string
          hospital_name?: string | null
          id?: string
          is_active?: boolean | null
          is_handwritten?: boolean | null
          is_trashed?: boolean | null
          patient_id: string
          tags?: string[] | null
          trashed_at?: string | null
          trashed_by?: string | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          date_of_document?: string | null
          description?: string | null
          document_type?: string
          extracted_text?: string | null
          file_name?: string
          file_path?: string
          file_type?: string
          hospital_name?: string | null
          id?: string
          is_active?: boolean | null
          is_handwritten?: boolean | null
          is_trashed?: boolean | null
          patient_id?: string
          tags?: string[] | null
          trashed_at?: string | null
          trashed_by?: string | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "medical_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      medicine_reminders: {
        Row: {
          created_at: string
          id: string
          medicine_id: string
          patient_id: string
          reminder_date: string
          reminder_time: string
          skipped_at: string | null
          status: string | null
          taken_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          medicine_id: string
          patient_id: string
          reminder_date: string
          reminder_time: string
          skipped_at?: string | null
          status?: string | null
          taken_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          medicine_id?: string
          patient_id?: string
          reminder_date?: string
          reminder_time?: string
          skipped_at?: string | null
          status?: string | null
          taken_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_reminders_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicine_tracker"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_reminders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      medicine_tracker: {
        Row: {
          created_at: string
          dosage: string
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean | null
          medicine_name: string
          notes: string | null
          patient_id: string
          prescribed_by: string | null
          start_date: string
          timing: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosage: string
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          medicine_name: string
          notes?: string | null
          patient_id: string
          prescribed_by?: string | null
          start_date: string
          timing?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dosage?: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          medicine_name?: string
          notes?: string | null
          patient_id?: string
          prescribed_by?: string | null
          start_date?: string
          timing?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_tracker_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "medicine_tracker_prescribed_by_fkey"
            columns: ["prescribed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      otp_verifications: {
        Row: {
          created_at: string
          doctor_id: string
          expires_at: string
          id: string
          is_verified: boolean | null
          otp_code: string
          patient_id: string
          purpose: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          doctor_id: string
          expires_at?: string
          id?: string
          is_verified?: boolean | null
          otp_code: string
          patient_id: string
          purpose: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          doctor_id?: string
          expires_at?: string
          id?: string
          is_verified?: boolean | null
          otp_code?: string
          patient_id?: string
          purpose?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "otp_verifications_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "otp_verifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          emergency_contact: string | null
          full_name: string
          hospital_affiliation: string | null
          id: string
          is_verified: boolean | null
          medical_license: string | null
          patient_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          specialization: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          emergency_contact?: string | null
          full_name: string
          hospital_affiliation?: string | null
          id?: string
          is_verified?: boolean | null
          medical_license?: string | null
          patient_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          specialization?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          emergency_contact?: string | null
          full_name?: string
          hospital_affiliation?: string | null
          id?: string
          is_verified?: boolean | null
          medical_license?: string | null
          patient_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          specialization?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_file_access: {
        Args: { p_action: string; p_file_path: string; p_patient_id?: string }
        Returns: undefined
      }
      log_security_event: {
        Args: { p_action: string; p_description: string; p_metadata?: Json }
        Returns: undefined
      }
      schedule_medicine_reminders: { Args: never; Returns: undefined }
      send_otp_notification: {
        Args: {
          doctor_name: string
          otp_code: string
          patient_email: string
          patient_name: string
        }
        Returns: undefined
      }
      trash_document_after_approval: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      validate_file_upload: {
        Args: { p_file_name: string; p_file_size: number }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "patient" | "doctor" | "hospital_admin"
      user_role: "patient" | "doctor" | "hospital_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["patient", "doctor", "hospital_admin"],
      user_role: ["patient", "doctor", "hospital_admin"],
    },
  },
} as const
