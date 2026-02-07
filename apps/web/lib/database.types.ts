// Types generados manualmente basados en supabase/migrations/001_initial_schema.sql
// Equivalente a: npx supabase gen types --project-id <id> (requiere SUPABASE_ACCESS_TOKEN)

export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          telegram_id: number;
          name: string;
          active_household_id: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          telegram_id: number;
          name: string;
          active_household_id?: number | null | undefined;
          created_at?: string | null | undefined;
          updated_at?: string | null | undefined;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "users_active_household_id_fkey";
            columns: ["active_household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
        ];
      };

      households: {
        Row: {
          id: number;
          name: string;
          type: "permanent" | "temporary" | null;
          description: string | null;
          icon: string | null;
          created_by: number | null;
          is_active: boolean | null;
          monthly_budget: string | null; // NUMERIC(12,2) → string en JSON
          settings: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          name: string;
          type?: "permanent" | "temporary" | null | undefined;
          description?: string | null | undefined;
          icon?: string | null | undefined;
          created_by?: number | null | undefined;
          is_active?: boolean | null | undefined;
          monthly_budget?: string | number | null | undefined;
          settings?: Json | null | undefined;
          created_at?: string | null | undefined;
          updated_at?: string | null | undefined;
        };
        Update: Partial<Database["public"]["Tables"]["households"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "households_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      household_members: {
        Row: {
          id: number;
          household_id: number;
          user_id: number;
          role: string;
          nickname: string | null;
          joined_at: string | null;
          is_active: boolean | null;
        };
        Insert: {
          household_id: number;
          user_id: number;
          role?: string | undefined;
          nickname?: string | null | undefined;
          joined_at?: string | null | undefined;
          is_active?: boolean | null | undefined;
        };
        Update: Partial<Database["public"]["Tables"]["household_members"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "household_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      expenses: {
        Row: {
          id: number;
          household_id: number;
          paid_by: number;
          amount: string; // NUMERIC(12,2) → string en JSON
          category: string;
          type: "fixed" | "variable";
          description: string | null;
          store: string | null;
          shared_with: number[];
          receipt_url: string | null;
          expense_date: string;
          created_at: string | null;
        };
        Insert: {
          household_id: number;
          paid_by: number;
          amount: string | number;
          category: string;
          type: "fixed" | "variable";
          description?: string | null | undefined;
          store?: string | null | undefined;
          shared_with?: number[] | undefined;
          receipt_url?: string | null | undefined;
          expense_date?: string | undefined;
          created_at?: string | null | undefined;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "expenses_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_paid_by_fkey";
            columns: ["paid_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      recurring_expenses: {
        Row: {
          id: number;
          household_id: number;
          paid_by: number;
          name: string;
          amount: string; // NUMERIC(12,2) → string en JSON
          category: string;
          type: "fixed" | "variable";
          shared_with: number[];
          frequency: "weekly" | "monthly" | "yearly";
          next_due_date: string;
          reminder_days_before: number[] | null;
          auto_register: boolean | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          household_id: number;
          paid_by: number;
          name: string;
          amount: string | number;
          category: string;
          type: "fixed" | "variable";
          shared_with?: number[] | undefined;
          frequency: "weekly" | "monthly" | "yearly";
          next_due_date: string;
          reminder_days_before?: number[] | null | undefined;
          auto_register?: boolean | null | undefined;
          is_active?: boolean | null | undefined;
          created_at?: string | null | undefined;
          updated_at?: string | null | undefined;
        };
        Update: Partial<Database["public"]["Tables"]["recurring_expenses"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "recurring_expenses_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurring_expenses_paid_by_fkey";
            columns: ["paid_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      automation_rules: {
        Row: {
          id: number;
          household_id: number;
          name: string;
          trigger_type: "email_pattern" | "schedule" | "category" | null;
          trigger_category: string | null;
          auto_shared_with: number[];
          email_pattern: Json | null;
          extraction_rules: Json | null;
          auto_action: Json | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          household_id: number;
          name: string;
          trigger_type?: "email_pattern" | "schedule" | "category" | null | undefined;
          trigger_category?: string | null | undefined;
          auto_shared_with?: number[] | undefined;
          email_pattern?: Json | null | undefined;
          extraction_rules?: Json | null | undefined;
          auto_action?: Json | null | undefined;
          is_active?: boolean | null | undefined;
          created_at?: string | null | undefined;
        };
        Update: Partial<Database["public"]["Tables"]["automation_rules"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "automation_rules_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
        ];
      };
    };

    Views: {};

    Functions: {};
  };
}
