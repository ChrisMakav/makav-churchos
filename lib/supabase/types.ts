export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
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
      annual_donation_receipts: {
        Row: {
          created_at: string
          created_by: string | null
          donation_count: number
          fiscal_year: number
          id: string
          issued_at: string
          member_id: string
          organization_id: string
          receipt_number: string
          total_amount: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          donation_count: number
          fiscal_year: number
          id?: string
          issued_at?: string
          member_id: string
          organization_id: string
          receipt_number: string
          total_amount: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          donation_count?: number
          fiscal_year?: number
          id?: string
          issued_at?: string
          member_id?: string
          organization_id?: string
          receipt_number?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "annual_donation_receipts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "annual_donation_receipts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          children_count: number
          created_at: string
          created_by: string | null
          event_id: string | null
          id: string
          label: string
          men_count: number
          new_people_count: number
          notes: string | null
          organization_id: string
          service_date: string
          site_id: string
          teens_count: number
          total_count: number | null
          women_count: number
        }
        Insert: {
          children_count?: number
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          id?: string
          label: string
          men_count?: number
          new_people_count?: number
          notes?: string | null
          organization_id: string
          service_date: string
          site_id: string
          teens_count?: number
          total_count?: number | null
          women_count?: number
        }
        Update: {
          children_count?: number
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          id?: string
          label?: string
          men_count?: number
          new_people_count?: number
          notes?: string | null
          organization_id?: string
          service_date?: string
          site_id?: string
          teens_count?: number
          total_count?: number | null
          women_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_site_id_fkey"
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
      carpool_driver_availabilities: {
        Row: {
          created_at: string
          frequency: string | null
          id: string
          is_active: boolean
          member_id: string
          notes: string | null
          organization_id: string
          vehicle_id: string | null
          zones: string | null
        }
        Insert: {
          created_at?: string
          frequency?: string | null
          id?: string
          is_active?: boolean
          member_id: string
          notes?: string | null
          organization_id: string
          vehicle_id?: string | null
          zones?: string | null
        }
        Update: {
          created_at?: string
          frequency?: string | null
          id?: string
          is_active?: boolean
          member_id?: string
          notes?: string | null
          organization_id?: string
          vehicle_id?: string | null
          zones?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carpool_driver_availabilities_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carpool_driver_availabilities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carpool_driver_availabilities_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "carpool_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      carpool_incidents: {
        Row: {
          created_at: string
          description: string
          id: string
          incident_type: string
          organization_id: string
          reported_by_member_id: string
          resolved_at: string | null
          resolved_by: string | null
          ride_id: string
          status: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          incident_type: string
          organization_id: string
          reported_by_member_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          ride_id: string
          status?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          incident_type?: string
          organization_id?: string
          reported_by_member_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          ride_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "carpool_incidents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carpool_incidents_reported_by_member_id_fkey"
            columns: ["reported_by_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carpool_incidents_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "carpool_rides"
            referencedColumns: ["id"]
          },
        ]
      }
      carpool_ride_needs: {
        Row: {
          created_at: string
          departure_label: string
          event_id: string | null
          has_children: boolean
          id: string
          member_id: string
          needed_by: string | null
          notes: string | null
          organization_id: string
          seats_needed: number
          site_id: string
          status: string
        }
        Insert: {
          created_at?: string
          departure_label: string
          event_id?: string | null
          has_children?: boolean
          id?: string
          member_id: string
          needed_by?: string | null
          notes?: string | null
          organization_id: string
          seats_needed?: number
          site_id: string
          status?: string
        }
        Update: {
          created_at?: string
          departure_label?: string
          event_id?: string | null
          has_children?: boolean
          id?: string
          member_id?: string
          needed_by?: string | null
          notes?: string | null
          organization_id?: string
          seats_needed?: number
          site_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "carpool_ride_needs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carpool_ride_needs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carpool_ride_needs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carpool_ride_needs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      carpool_ride_requests: {
        Row: {
          checked_in_at: string | null
          created_at: string
          decided_at: string | null
          id: string
          message: string | null
          no_show: boolean
          organization_id: string
          passenger_member_id: string
          requested_at: string
          ride_id: string
          seats_requested: number
          status: string
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          message?: string | null
          no_show?: boolean
          organization_id: string
          passenger_member_id: string
          requested_at?: string
          ride_id: string
          seats_requested?: number
          status?: string
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          message?: string | null
          no_show?: boolean
          organization_id?: string
          passenger_member_id?: string
          requested_at?: string
          ride_id?: string
          seats_requested?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "carpool_ride_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carpool_ride_requests_passenger_member_id_fkey"
            columns: ["passenger_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carpool_ride_requests_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "carpool_rides"
            referencedColumns: ["id"]
          },
        ]
      }
      carpool_ride_stops: {
        Row: {
          address: string | null
          created_at: string
          estimated_time: string | null
          id: string
          label: string
          position_order: number
          ride_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          estimated_time?: string | null
          id?: string
          label: string
          position_order?: number
          ride_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          estimated_time?: string | null
          id?: string
          label?: string
          position_order?: number
          ride_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carpool_ride_stops_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "carpool_rides"
            referencedColumns: ["id"]
          },
        ]
      }
      carpool_rides: {
        Row: {
          accepts_children: boolean
          accepts_luggage: boolean
          accepts_pets: boolean
          auto_confirm: boolean
          created_at: string
          created_by: string | null
          departs_at: string
          departure_label: string
          destination_label: string
          driver_member_id: string
          estimated_arrival_at: string | null
          event_id: string | null
          has_air_conditioning: boolean
          id: string
          is_pmr_accessible: boolean
          non_smoking: boolean
          notes: string | null
          organization_id: string
          recurrence_group_id: string | null
          seat_capacity: number
          seats_available: number
          site_id: string
          status: string
          vehicle_id: string | null
        }
        Insert: {
          accepts_children?: boolean
          accepts_luggage?: boolean
          accepts_pets?: boolean
          auto_confirm?: boolean
          created_at?: string
          created_by?: string | null
          departs_at: string
          departure_label: string
          destination_label: string
          driver_member_id: string
          estimated_arrival_at?: string | null
          event_id?: string | null
          has_air_conditioning?: boolean
          id?: string
          is_pmr_accessible?: boolean
          non_smoking?: boolean
          notes?: string | null
          organization_id: string
          recurrence_group_id?: string | null
          seat_capacity: number
          seats_available: number
          site_id: string
          status?: string
          vehicle_id?: string | null
        }
        Update: {
          accepts_children?: boolean
          accepts_luggage?: boolean
          accepts_pets?: boolean
          auto_confirm?: boolean
          created_at?: string
          created_by?: string | null
          departs_at?: string
          departure_label?: string
          destination_label?: string
          driver_member_id?: string
          estimated_arrival_at?: string | null
          event_id?: string | null
          has_air_conditioning?: boolean
          id?: string
          is_pmr_accessible?: boolean
          non_smoking?: boolean
          notes?: string | null
          organization_id?: string
          recurrence_group_id?: string | null
          seat_capacity?: number
          seats_available?: number
          site_id?: string
          status?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carpool_rides_driver_member_id_fkey"
            columns: ["driver_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carpool_rides_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carpool_rides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carpool_rides_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carpool_rides_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "carpool_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      carpool_vehicles: {
        Row: {
          brand: string
          color: string | null
          created_at: string
          id: string
          is_pmr_accessible: boolean
          member_id: string
          model: string
          organization_id: string
          plate_masked: string | null
          seat_capacity: number
        }
        Insert: {
          brand: string
          color?: string | null
          created_at?: string
          id?: string
          is_pmr_accessible?: boolean
          member_id: string
          model: string
          organization_id: string
          plate_masked?: string | null
          seat_capacity: number
        }
        Update: {
          brand?: string
          color?: string | null
          created_at?: string
          id?: string
          is_pmr_accessible?: boolean
          member_id?: string
          model?: string
          organization_id?: string
          plate_masked?: string | null
          seat_capacity?: number
        }
        Relationships: [
          {
            foreignKeyName: "carpool_vehicles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carpool_vehicles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_sessions: {
        Row: {
          checked_in_at: string
          checked_in_by: string
          checked_out_at: string | null
          checked_out_by: string | null
          child_member_id: string
          event_id: string | null
          guardian_name: string
          guardian_phone: string | null
          id: string
          notes: string | null
          organization_id: string
          security_code: string
          site_id: string
        }
        Insert: {
          checked_in_at?: string
          checked_in_by: string
          checked_out_at?: string | null
          checked_out_by?: string | null
          child_member_id: string
          event_id?: string | null
          guardian_name: string
          guardian_phone?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          security_code: string
          site_id: string
        }
        Update: {
          checked_in_at?: string
          checked_in_by?: string
          checked_out_at?: string | null
          checked_out_by?: string | null
          child_member_id?: string
          event_id?: string | null
          guardian_name?: string
          guardian_phone?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          security_code?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_sessions_child_member_id_fkey"
            columns: ["child_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_sessions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          body: string
          channel: string
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          recipient_count: number
          scheduled_at: string | null
          segment_summary: string
          segments: Json
          sent_at: string | null
          site_id: string
          status: string
          title: string
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          recipient_count?: number
          scheduled_at?: string | null
          segment_summary: string
          segments?: Json
          sent_at?: string | null
          site_id: string
          status?: string
          title: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          recipient_count?: number
          scheduled_at?: string | null
          segment_summary?: string
          segments?: Json
          sent_at?: string | null
          site_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_site_id_fkey"
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
          ends_on: string | null
          goal_amount: number | null
          id: string
          is_active: boolean
          is_restricted: boolean
          name: string
          organization_id: string
          starts_on: string | null
        }
        Insert: {
          created_at?: string
          ends_on?: string | null
          goal_amount?: number | null
          id?: string
          is_active?: boolean
          is_restricted?: boolean
          name: string
          organization_id: string
          starts_on?: string | null
        }
        Update: {
          created_at?: string
          ends_on?: string | null
          goal_amount?: number | null
          id?: string
          is_active?: boolean
          is_restricted?: boolean
          name?: string
          organization_id?: string
          starts_on?: string | null
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
          is_recurring: boolean
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
          is_recurring?: boolean
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
          is_recurring?: boolean
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
      event_registration_tracks: {
        Row: {
          capacity: number
          created_at: string
          event_id: string
          id: string
          label: string
          registered_count: number
        }
        Insert: {
          capacity: number
          created_at?: string
          event_id: string
          id?: string
          label: string
          registered_count?: number
        }
        Update: {
          capacity?: number
          created_at?: string
          event_id?: string
          id?: string
          label?: string
          registered_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_registration_tracks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_service_items: {
        Row: {
          created_at: string
          event_id: string
          id: string
          owner_name: string | null
          starts_at: string
          title: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          owner_name?: string | null
          starts_at: string
          title: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          owner_name?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_service_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
          room_id: string | null
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
          room_id?: string | null
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
          room_id?: string | null
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
            foreignKeyName: "events_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
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
      group_members: {
        Row: {
          group_id: string
          joined_at: string
          member_id: string
          role_in_group: string
        }
        Insert: {
          group_id: string
          joined_at?: string
          member_id: string
          role_in_group?: string
        }
        Update: {
          group_id?: string
          joined_at?: string
          member_id?: string
          role_in_group?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      group_reports: {
        Row: {
          children_count: number
          created_at: string
          created_by: string | null
          group_id: string
          id: string
          meeting_date: string
          men_count: number
          new_births_count: number
          new_people_count: number
          notes: string | null
          organization_id: string
          site_id: string
          teens_count: number
          theme: string
          total_count: number | null
          women_count: number
        }
        Insert: {
          children_count?: number
          created_at?: string
          created_by?: string | null
          group_id: string
          id?: string
          meeting_date: string
          men_count?: number
          new_births_count?: number
          new_people_count?: number
          notes?: string | null
          organization_id: string
          site_id: string
          teens_count?: number
          theme: string
          total_count?: number | null
          women_count?: number
        }
        Update: {
          children_count?: number
          created_at?: string
          created_by?: string | null
          group_id?: string
          id?: string
          meeting_date?: string
          men_count?: number
          new_births_count?: number
          new_people_count?: number
          notes?: string | null
          organization_id?: string
          site_id?: string
          teens_count?: number
          theme?: string
          total_count?: number | null
          women_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "group_reports_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_reports_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          capacity: number | null
          created_at: string
          description: string | null
          id: string
          leader_member_id: string | null
          location: string | null
          meeting_day: string | null
          meeting_time: string | null
          name: string
          organization_id: string
          site_id: string
          status: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          leader_member_id?: string | null
          location?: string | null
          meeting_day?: string | null
          meeting_time?: string | null
          name: string
          organization_id: string
          site_id: string
          status?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          leader_member_id?: string | null
          location?: string | null
          meeting_day?: string | null
          meeting_time?: string | null
          name?: string
          organization_id?: string
          site_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_leader_member_id_fkey"
            columns: ["leader_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_site_id_fkey"
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
          communication_id: string | null
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
          communication_id?: string | null
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
          communication_id?: string | null
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
            foreignKeyName: "notifications_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
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
      pastoral_appointment_managers: {
        Row: {
          created_at: string
          created_by: string | null
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pastoral_appointment_managers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pastoral_appointment_slots: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string
          id: string
          location: string | null
          member_id: string | null
          organization_id: string
          pastor_user_id: string
          reason: string | null
          site_id: string
          starts_at: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at: string
          id?: string
          location?: string | null
          member_id?: string | null
          organization_id: string
          pastor_user_id: string
          reason?: string | null
          site_id: string
          starts_at: string
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string
          id?: string
          location?: string | null
          member_id?: string | null
          organization_id?: string
          pastor_user_id?: string
          reason?: string | null
          site_id?: string
          starts_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pastoral_appointment_slots_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pastoral_appointment_slots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pastoral_appointment_slots_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      pastoral_records: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          created_by: string
          follow_up_date: string | null
          id: string
          member_id: string
          notes: string
          organization_id: string
          site_id: string
          status: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          created_by: string
          follow_up_date?: string | null
          id?: string
          member_id: string
          notes: string
          organization_id: string
          site_id: string
          status?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          created_by?: string
          follow_up_date?: string | null
          id?: string
          member_id?: string
          notes?: string
          organization_id?: string
          site_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pastoral_records_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pastoral_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pastoral_records_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
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
      rooms: {
        Row: {
          capacity: number | null
          created_at: string
          id: string
          name: string
          organization_id: string
          site_id: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          site_id: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
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
          is_reconciled: boolean
          occurred_on: string
          organization_id: string
          reconciled_at: string | null
          reconciled_by: string | null
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
          is_reconciled?: boolean
          occurred_on: string
          organization_id: string
          reconciled_at?: string | null
          reconciled_by?: string | null
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
          is_reconciled?: boolean
          occurred_on?: string
          organization_id?: string
          reconciled_at?: string | null
          reconciled_by?: string | null
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
      volunteer_slots: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          member_id: string | null
          organization_id: string
          position_order: number
          service_date: string
          site_id: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          member_id?: string | null
          organization_id: string
          position_order?: number
          service_date: string
          site_id: string
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          member_id?: string | null
          organization_id?: string
          position_order?: number
          service_date?: string
          site_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_slots_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_slots_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_slots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_slots_site_id_fkey"
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
      cancel_carpool_request: {
        Args: { target_request_id: string }
        Returns: undefined
      }
      create_donation:
        | {
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
        | {
            Args: {
              target_account_id: string
              target_amount: number
              target_currency: string
              target_fund_id: string
              target_given_at: string
              target_is_anonymous: boolean
              target_is_recurring?: boolean
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
      generate_annual_receipts: {
        Args: { target_org_id: string; target_year: number }
        Returns: number
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
      is_pastoral_appointment_manager: {
        Args: { org_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      mark_carpool_request_checkin: {
        Args: {
          boarded: boolean
          is_no_show: boolean
          target_request_id: string
        }
        Returns: undefined
      }
      mark_expense_paid: {
        Args: {
          occurred_on: string
          target_account_id: string
          target_expense_id: string
        }
        Returns: string
      }
      next_receipt_number: { Args: { target_org_id: string }; Returns: string }
      request_carpool_seat: {
        Args: {
          request_message?: string
          seats: number
          target_ride_id: string
        }
        Returns: string
      }
      respond_carpool_request: {
        Args: { approve: boolean; target_request_id: string }
        Returns: undefined
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      membership_status: ["invited", "active", "suspended"],
      site_type: ["region", "church", "campus"],
      transaction_status: ["draft", "posted", "void"],
    },
  },
} as const

