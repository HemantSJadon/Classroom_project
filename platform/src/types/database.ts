export type ClassroomStatus = 'active' | 'archived' | 'deleted';
export type SessionStatus = 'active' | 'paused' | 'completed';
export type AuthorType = 'user' | 'colearner' | 'instructor';
export type ContentType = 'text' | 'mindmap' | 'card' | 'recap' | 'question' | 'answer';

export interface Database {
  public: {
    Tables: {
      classrooms: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          topic_summary: string | null;
          intake_transcript: Record<string, unknown>[] | null;
          persona_definitions: Record<string, unknown>[] | null;
          status: ClassroomStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['classrooms']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['classrooms']['Insert']>;
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
        Insert: Omit<Database['public']['Tables']['sessions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['sessions']['Insert']>;
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
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
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
        Insert: Omit<Database['public']['Tables']['session_state']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['session_state']['Insert']>;
      };
    };
  };
}
