export type ClassroomStatus = 'active' | 'archived' | 'deleted';
export type SessionStatus = 'active' | 'paused' | 'completed';
export type AuthorType = 'user' | 'colearner' | 'instructor';
export type ContentType = 'text' | 'mindmap' | 'card' | 'recap' | 'question' | 'answer';
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      classrooms: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          topic_summary: string | null;
          intake_transcript: Json | null;
          persona_definitions: Json | null;
          status: ClassroomStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          topic_summary?: string | null;
          intake_transcript?: Json | null;
          persona_definitions?: Json | null;
          status?: ClassroomStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          topic_summary?: string | null;
          intake_transcript?: Json | null;
          persona_definitions?: Json | null;
          status?: ClassroomStatus;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          classroom_id: string;
          user_id: string;
          status: SessionStatus;
          planned_duration_minutes: number | null;
          started_at: string;
          ended_at: string | null;
          recap_shown: boolean;
          recap_content: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          classroom_id: string;
          user_id: string;
          status?: SessionStatus;
          planned_duration_minutes?: number | null;
          started_at?: string;
          ended_at?: string | null;
          recap_shown?: boolean;
          recap_content?: string | null;
          created_at?: string;
        };
        Update: {
          status?: SessionStatus;
          planned_duration_minutes?: number | null;
          ended_at?: string | null;
          recap_shown?: boolean;
          recap_content?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          session_id: string;
          classroom_id: string;
          author: string;
          author_type: AuthorType;
          content: string;
          content_type: ContentType;
          parent_message_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          classroom_id: string;
          author: string;
          author_type: AuthorType;
          content: string;
          content_type?: ContentType;
          parent_message_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          content?: string;
          content_type?: ContentType;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      session_state: {
        Row: {
          id: string;
          session_id: string;
          scroll_position: number;
          last_message_id: string | null;
          context_summary: string | null;
          saved_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          scroll_position?: number;
          last_message_id?: string | null;
          context_summary?: string | null;
          saved_at?: string;
        };
        Update: {
          scroll_position?: number;
          last_message_id?: string | null;
          context_summary?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
