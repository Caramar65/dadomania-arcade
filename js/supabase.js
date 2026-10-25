// Supabase Cloud Integration: Global Leaderboard & Cloud Stats
class SupabaseService {
  constructor() {
    this.url = 'https://nejbmejcmztdklgwfelu.supabase.co';
    // Load public anon key from localStorage or fallback
    this.key = localStorage.getItem('dadomania_supabase_anon_key') || '';
    this.client = null;
    this.isOnline = false;
    this.init();
  }

  setAnonKey(key) {
    if (!key) return;
    this.key = key.trim();
    localStorage.setItem('dadomania_supabase_anon_key', this.key);
    this.init();
  }

  init() {
    if (window.supabase && window.supabase.createClient && this.key) {
      try {
        this.client = window.supabase.createClient(this.url, this.key);
        this.isOnline = true;
      } catch (err) {
        console.warn('Supabase initialization error:', err);
        this.isOnline = false;
      }
    }
  }

  // Submit high score to global cloud leaderboard
  async submitScore(playerName, gameType, score) {
    if (!this.client) this.init();
    if (!this.client) {
      return { error: 'Falta configurar la clave pública (anon) de Supabase.' };
    }

    try {
      const { data, error } = await this.client
        .from('leaderboard')
        .insert([
          {
            player_name: playerName || 'Jugador Anónimo',
            game_type: gameType,
            score: Number(score)
          }
        ])
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('Error submitting score to Supabase:', err);
      return { error: err.message };
    }
  }

  // Fetch top scores globally
  async getTopScores(gameType = null, limit = 10) {
    if (!this.client) this.init();
    if (!this.client) return [];

    try {
      let query = this.client
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit);

      if (gameType) {
        query = query.eq('game_type', gameType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Error fetching top scores from Supabase:', err);
      return [];
    }
  }
}

window.supabaseService = new SupabaseService();
