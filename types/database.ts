export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      artists: {
        Row: {
          id: string
          name: string
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          image_url?: string | null
          created_at?: string
        }
      }
      albums: {
        Row: {
          id: string
          artist_id: string
          title: string
          cover_image_url: string | null
          release_year: number | null
          created_at: string
        }
        Insert: {
          id?: string
          artist_id: string
          title: string
          cover_image_url?: string | null
          release_year?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          artist_id?: string
          title?: string
          cover_image_url?: string | null
          release_year?: number | null
          created_at?: string
        }
      }
      songs: {
        Row: {
          id: string
          artist_id: string
          album_id: string | null
          title: string
          summary: string | null
          vocabs: Vocab[]
          created_at: string
        }
        Insert: {
          id?: string
          artist_id: string
          album_id?: string | null
          title: string
          summary?: string | null
          vocabs?: Vocab[]
          created_at?: string
        }
        Update: {
          id?: string
          artist_id?: string
          album_id?: string | null
          title?: string
          summary?: string | null
          vocabs?: Vocab[]
          created_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          favoritable_type: 'artist' | 'song'
          favoritable_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          favoritable_type: 'artist' | 'song'
          favoritable_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          favoritable_type?: 'artist' | 'song'
          favoritable_id?: string
          created_at?: string
        }
      }
      wrong_vocabs: {
        Row: {
          id: string
          user_id: string
          song_id: string
          vocab_name: string
          vocab_meaning: string
          vocab_pronunciation: string
          wrong_count: number
          last_wrong_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          song_id: string
          vocab_name: string
          vocab_meaning: string
          vocab_pronunciation: string
          wrong_count?: number
          last_wrong_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          song_id?: string
          vocab_name?: string
          vocab_meaning?: string
          vocab_pronunciation?: string
          wrong_count?: number
          last_wrong_at?: string
          created_at?: string
        }
      }
    }
    Functions: {
      get_favorite_vocabs: {
        Args: { p_user_id: string }
        Returns: {
          vocab_name: string
          vocab_meaning: string
          vocab_pronunciation: string
          song_id: string
          song_title: string
          artist_name: string
        }[]
      }
      get_wrong_vocabs_for_review: {
        Args: { p_user_id: string; p_limit?: number }
        Returns: {
          vocab_name: string
          vocab_meaning: string
          vocab_pronunciation: string
          wrong_count: number
          song_title: string
          artist_name: string
        }[]
      }
    }
  }
}

// Vocab type for songs.vocabs JSONB
export interface Vocab {
  name: string
  meaning: string
  pronunciation: string
}

// Helper types
export type Artist = Database['public']['Tables']['artists']['Row']
export type Album = Database['public']['Tables']['albums']['Row']
export type Song = Database['public']['Tables']['songs']['Row']
export type Favorite = Database['public']['Tables']['favorites']['Row']
export type WrongVocab = Database['public']['Tables']['wrong_vocabs']['Row']
