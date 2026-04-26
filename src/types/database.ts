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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_admins: {
        Row: {
          created_at: string
          created_by: string | null
          notes: string | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          notes?: string | null
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          notes?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action_type: string
          actor_role: string | null
          actor_user_id: string | null
          created_at: string
          diff_after: Json | null
          diff_before: Json | null
          id: string
          target_pk: Json
          target_table: string
        }
        Insert: {
          action_type: string
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          diff_after?: Json | null
          diff_before?: Json | null
          id?: string
          target_pk: Json
          target_table: string
        }
        Update: {
          action_type?: string
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          diff_after?: Json | null
          diff_before?: Json | null
          id?: string
          target_pk?: Json
          target_table?: string
        }
        Relationships: []
      }
      class_enrollments: {
        Row: {
          class_id: string
          joined_at: string | null
          student_user_id: string
        }
        Insert: {
          class_id: string
          joined_at?: string | null
          student_user_id: string
        }
        Update: {
          class_id?: string
          joined_at?: string | null
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          archived_at: string | null
          created_at: string | null
          id: string
          join_code: string
          join_code_expires_at: string | null
          name: string
          organization_id: string
          school_year: string | null
          teacher_user_id: string
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string | null
          id?: string
          join_code: string
          join_code_expires_at?: string | null
          name: string
          organization_id: string
          school_year?: string | null
          teacher_user_id: string
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string | null
          id?: string
          join_code?: string
          join_code_expires_at?: string | null
          name?: string
          organization_id?: string
          school_year?: string | null
          teacher_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_overrides: {
        Row: {
          author_user_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          locale: string
          patch_json: Json
          slug: string
          updated_at: string
        }
        Insert: {
          author_user_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          locale: string
          patch_json: Json
          slug: string
          updated_at?: string
        }
        Update: {
          author_user_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          locale?: string
          patch_json?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      live_exercises: {
        Row: {
          data_json: Json
          locale: string
          slug: string
          updated_at: string
        }
        Insert: {
          data_json: Json
          locale: string
          slug: string
          updated_at?: string
        }
        Update: {
          data_json?: Json
          locale?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          bucket: string
          canonical_url: string | null
          created_at: string | null
          created_by: string | null
          height: number | null
          id: string
          mime: string
          path: string
          size: number | null
          width: number | null
        }
        Insert: {
          bucket: string
          canonical_url?: string | null
          created_at?: string | null
          created_by?: string | null
          height?: number | null
          id?: string
          mime: string
          path: string
          size?: number | null
          width?: number | null
        }
        Update: {
          bucket?: string
          canonical_url?: string | null
          created_at?: string | null
          created_by?: string | null
          height?: number | null
          id?: string
          mime?: string
          path?: string
          size?: number | null
          width?: number | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          academic_domain: string | null
          code: string
          country_code: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          is_pro: boolean | null
          lemon_squeezy_customer_id: string | null
          name: string
          pro_activated_at: string | null
          pro_expires_at: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          academic_domain?: string | null
          code: string
          country_code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_pro?: boolean | null
          lemon_squeezy_customer_id?: string | null
          name: string
          pro_activated_at?: string | null
          pro_expires_at?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_domain?: string | null
          code?: string
          country_code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_pro?: boolean | null
          lemon_squeezy_customer_id?: string | null
          name?: string
          pro_activated_at?: string | null
          pro_expires_at?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      teacher_annotations: {
        Row: {
          author_user_id: string
          content: Json
          created_at: string | null
          deleted_at: string | null
          exercise_slug: string
          exercise_version: number | null
          id: string
          locale: string
          needs_review: boolean | null
          organization_id: string
          scope_id: string | null
          updated_at: string | null
          visibility_scope: string
        }
        Insert: {
          author_user_id: string
          content?: Json
          created_at?: string | null
          deleted_at?: string | null
          exercise_slug: string
          exercise_version?: number | null
          id?: string
          locale?: string
          needs_review?: boolean | null
          organization_id: string
          scope_id?: string | null
          updated_at?: string | null
          visibility_scope?: string
        }
        Update: {
          author_user_id?: string
          content?: Json
          created_at?: string | null
          deleted_at?: string | null
          exercise_slug?: string
          exercise_version?: number | null
          id?: string
          locale?: string
          needs_review?: boolean | null
          organization_id?: string
          scope_id?: string | null
          updated_at?: string | null
          visibility_scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_annotations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      training_entries: {
        Row: {
          created_at: string | null
          date: string
          exercices: Json
          id: string
          methodes: string[] | null
          notes: string | null
          objectif: string | null
          organization_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          exercices?: Json
          id?: string
          methodes?: string[] | null
          notes?: string | null
          objectif?: string | null
          organization_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          exercices?: Json
          id?: string
          methodes?: string[] | null
          notes?: string | null
          objectif?: string | null
          organization_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_class_join_code: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      join_class_with_code: { Args: { p_code: string }; Returns: string }
      user_class_ids: { Args: never; Returns: string[] }
      user_org_ids: { Args: never; Returns: string[] }
      user_teacher_class_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
