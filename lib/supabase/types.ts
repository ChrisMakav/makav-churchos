export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string
          currency: string
          id: string
          is_active: boolean
          name: string
          opening_balance: number
          organization_id: string
          site_id: string
          type: string
        }
        Insert: {
          created_at?: string
          currency: string
          id?: string
          is_active?: boolean
          name: string
          opening_balance?: number
          organization_id: string
          site_id: string
          type?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          opening_balance?: number
          organization_id?: string
          site_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_alerts_sent: {
        Row: {
          budget_line_id: string
          sent_at: string
          threshold: number
        }
        Insert: {
          budget_line_id: string
          sent_at?: string
          threshold: number
        }
        Update: {
          budget_line_id?: string
          sent_at?: string
          threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_alerts_sent_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_line_actuals"
            referencedColumns: ["budget_line_id"]
          },
          {
            foreignKeyName: "budget_alerts_sent_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_lines: {
        Row: {
          allocated_amount: number
          budget_id: string
          category_id: string
          department_id: string | null
          id: string
        }
        Insert: {
          allocated_amount: number
          budget_id: string
          category_id: string
          department_id?: string | null
          id?: string
        }
        Update: {
          allocated_amount?: number
          budget_id?: string
          category_id?: string
          department_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          created_at: string
          fiscal_year: number
          id: string
          name: string
          organization_id: string
          site_id: string
          status: string
        }
        Insert: {
          created_at?: string
          fiscal_year: number
          id?: string
          name: string
          organization_id: string
          site_id: string
          status?: string
        }
        Update: {
          created_at?: string
          fiscal_year?: number
          id?: string
          name?: string
          organization_id?: string
          site_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      department_members: {
        Row: {
          department_id: string
          member_id: string
          role_in_department: string
        }
        Insert: {
          department_id: string
          member_id: string
          role_in_department?: string
        }
        Update: {
          department_id?: string
          member_id?: string
          role_in_department?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          leader_member_id: string | null
          name: string
          organization_id: string
          parent_department_id: string | null
          site_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          leader_member_id?: string | null
          name: string
          organization_id: string
          parent_department_id?: string | null
          site_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          leader_member_id?: string | null
          name?: string
          organization_id?: string
          parent_department_id?: string | null
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_leader_member_id_fkey"
            columns: ["leader_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_funds: {
        Row: {
          created_at: string
          id: string
          is_restricted: boolean
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_restricted?: boolean
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_restricted?: boolean
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_funds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          fund_id: string
          given_at: string
          id: string
          is_anonymous: boolean
          member_id: string | null
          method: string
          organization_id: string
          receipt_issued_at: string | null
          receipt_number: string | null
          site_id: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency: string
          fund_id: string
          given_at: string
          id?: string
          is_anonymous?: boolean
          member_id?: string | null
          method: string
          organization_id: string
          receipt_issued_at?: string | null
          receipt_number?: string | null
          site_id: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          fund_id?: string
          given_at?: string
          id?: string
          is_anonymous?: boolean
          member_id?: string | null
          method?: string
          organization_id?: string
          receipt_issued_at?: string | null
          receipt_number?: string | null
          site_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "donation_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_types: {
        Row: {
          code: string
          color: string
          id: string
          label_fr: string
          organization_id: string
        }
        Insert: {
          code: string
          color?: string
          id?: string
          label_fr: string
          organization_id: string
        }
        Update: {
          code?: string
          color?: string
          id?: string
          label_fr?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          all_day: boolean
          capacity: number | null
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string | null
          ends_at: string
          event_type_id: string
          id: string
          location: string | null
          organization_id: string
          site_id: string
          starts_at: string
          status: string
          title: string
        }
        Insert: {
          all_day?: boolean
          capacity?: number | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          ends_at: string
          event_type_id: string
          id?: string
          location?: string | null
          organization_id: string
          site_id: string
          starts_at: string
          status?: string
          title: string
        }
        Update: {
          all_day?: boolean
          capacity?: number | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          ends_at?: string
          event_type_id?: string
          id?: string
          location?: string | null
          organization_id?: string
          site_id?: string
          starts_at?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          budget_line_id: string | null
          category_id: string
          created_at: string
          currency: string
          department_id: string | null
          description: string | null
          id: string
          organization_id: string
          paid_at: string | null
          receipt_file_path: string | null
          requested_by: string
          site_id: string
          status: string
          vendor: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          budget_line_id?: string | null
          category_id: string
          created_at?: string
          currency: string
          department_id?: string | null
          description?: string | null
          id?: string
          organization_id: string
          paid_at?: string | null
          receipt_file_path?: string | null
          requested_by: string
          site_id: string
          status?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          budget_line_id?: string | null
          category_id?: string
          created_at?: string
          currency?: string
          department_id?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          paid_at?: string | null
          receipt_file_path?: string | null
          requested_by?: string
          site_id?: string
          status?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_line_actuals"
            referencedColumns: ["budget_line_id"]
          },
          {
            foreignKeyName: "expenses_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          head_member_id: string | null
          id: string
          name: string
          organization_id: string
          site_id: string
        }
        Insert: {
          created_at?: string
          head_member_id?: string | null
          id?: string
          name: string
          organization_id: string
          site_id: string
        }
        Update: {
          created_at?: string
          head_member_id?: string | null
          id?: string
          name?: string
          organization_id?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "families_head_member_id_fkey"
            columns: ["head_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "families_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "families_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          birth_date: string | null
          created_at: string
          email: string | null
          family_id: string | null
          family_role: string | null
          first_name: string
          gender: string | null
          id: string
          join_date: string | null
          last_name: string
          member_status: string
          organization_id: string
          phone: string | null
          photo_url: string | null
          site_id: string
          user_id: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          family_id?: string | null
          family_role?: string | null
          first_name: string
          gender?: string | null
          id?: string
          join_date?: string | null
          last_name: string
          member_status?: string
          organization_id: string
          phone?: string | null
          photo_url?: string | null
          site_id: string
          user_id?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          family_id?: string | null
          family_role?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          join_date?: string | null
          last_name?: string
          member_status?: string
          organization_id?: string
          phone?: string | null
          photo_url?: string | null
          site_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          invited_email: string | null
          organization_id: string
          role_id: string
          site_id: string | null
          status: Database["public"]["Enums"]["membership_status"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          id?: string
          invited_email?: string | null
          organization_id: string
          role_id: string
          site_id?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department_id?: string | null
          id?: string
          invited_email?: string | null
          organization_id?: string
          role_id?: string
          site_id?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          organization_id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          organization_id: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          organization_id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          currency: string
          id: string
          name: string
          plan: string
          slug: string
          timezone: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          name: string
          plan?: string
          slug: string
          timezone?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          name?: string
          plan?: string
          slug?: string
          timezone?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          code: string
          description: string | null
          id: string
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          locale: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          locale?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          locale?: string
        }
        Relationships: []
      }
      receipt_counters: {
        Row: {
          last_number: number
          organization_id: string
          year: number
        }
        Insert: {
          last_number?: number
          organization_id: string
          year: number
        }
        Update: {
          last_number?: number
          organization_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "receipt_counters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          id: string
          is_system: boolean
          label_fr: string
          organization_id: string | null
        }
        Insert: {
          code: string
          id?: string
          is_system?: boolean
          label_fr: string
          organization_id?: string | null
        }
        Update: {
          code?: string
          id?: string
          is_system?: boolean
          label_fr?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          parent_site_id: string | null
          timezone: string | null
          type: Database["public"]["Enums"]["site_type"]
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          parent_site_id?: string | null
          timezone?: string | null
          type?: Database["public"]["Enums"]["site_type"]
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          parent_site_id?: string | null
          timezone?: string | null
          type?: Database["public"]["Enums"]["site_type"]
        }
        Relationships: [
          {
            foreignKeyName: "sites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_parent_site_id_fkey"
            columns: ["parent_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_categories: {
        Row: {
          id: string
          kind: string
          name: string
          organization_id: string
          parent_category_id: string | null
        }
        Insert: {
          id?: string
          kind: string
          name: string
          organization_id: string
          parent_category_id?: string | null
        }
        Update: {
          id?: string
          kind?: string
          name?: string
          organization_id?: string
          parent_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          budget_line_id: string | null
          category_id: string
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          expense_id: string | null
          id: string
          occurred_on: string
          organization_id: string
          site_id: string
          status: Database["public"]["Enums"]["transaction_status"]
          type: string
        }
        Insert: {
          account_id: string
          amount: number
          budget_line_id?: string | null
          category_id: string
          created_at?: string
          created_by?: string | null
          currency: string
          description?: string | null
          expense_id?: string | null
          id?: string
          occurred_on: string
          organization_id: string
          site_id: string
          status?: Database["public"]["Enums"]["transaction_status"]
          type: string
        }
        Update: {
          account_id?: string
          amount?: number
          budget_line_id?: string | null
          category_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          expense_id?: string | null
          id?: string
          occurred_on?: string
          organization_id?: string
          site_id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_line_actuals"
            referencedColumns: ["budget_line_id"]
          },
          {
            foreignKeyName: "transactions_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      budget_line_actuals: {
        Row: {
          allocated_amount: number | null
          budget_id: string | null
          budget_line_id: string | null
          spent_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_expense: {
        Args: { approve: boolean; target_expense_id: string }
        Returns: undefined
      }
      create_donation: {
        Args: {
          target_account_id: string
          target_amount: number
          target_currency: string
          target_fund_id: string
          target_given_at: string
          target_is_anonymous: boolean
          target_member_id: string
          target_method: string
          target_org_id: string
          target_site_id: string
        }
        Returns: string
      }
      create_organization: {
        Args: { org_currency?: string; org_name: string; org_timezone?: string }
        Returns: string
      }
      has_permission: {
        Args: { org_id: string; perm_code: string }
        Returns: boolean
      }
      invite_member: {
        Args: {
          member_email: string
          target_org_id: string
          target_role_code: string
        }
        Returns: string
      }
      is_org_member: { Args: { org_id: string }; Returns: boolean }
      mark_expense_paid: {
        Args: {
          occurred_on: string
          target_account_id: string
          target_expense_id: string
        }
        Returns: string
      }
      next_receipt_number: { Args: { target_org_id: string }; Returns: string }
      seed_default_donation_funds: {
        Args: { target_org_id: string }
        Returns: undefined
      }
      seed_default_event_types: {
        Args: { target_org_id: string }
        Returns: undefined
      }
      seed_default_transaction_categories: {
        Args: { target_org_id: string }
        Returns: undefined
      }
      set_membership_role: {
        Args: { target_membership_id: string; target_role_code: string }
        Returns: undefined
      }
      set_membership_status: {
        Args: {
          new_status: Database["public"]["Enums"]["membership_status"]
          target_membership_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      membership_status: "invited" | "active" | "suspended"
      site_type: "region" | "church" | "campus"
      transaction_status: "draft" | "posted" | "void"
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
      membership_status: ["invited", "active", "suspended"],
      site_type: ["region", "church", "campus"],
      transaction_status: ["draft", "posted", "void"],
    },
  },
} as const

