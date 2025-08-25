import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface LeaderboardProps {
  onClose: () => void;
}

interface Score {
  id: number;
  created_at: string;
  player_name: string;
  clear_time_seconds: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      const today = new Date();
      const challenge_date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('daily_scores')
          .select('*')
          .eq('challenge_date', challenge_date)
          .order('clear_time_seconds', { ascending: true })
          .limit(100); // Get top 100 scores

        if (error) {
          throw error;
        }

        setScores(data || []);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching scores:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md mx-4 flex flex-col" style={{ maxHeight: '80vh' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">デイリー リーダーボード</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">&times;</button>
        </div>
        <div className="overflow-y-auto">
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-500">Error: {error}</p>
          ) : scores.length === 0 ? (
            <p className="text-center p-4">まだスコアが登録されていません</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="p-2">Rank</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((score, index) => (
                  <tr key={score.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2">{score.player_name}</td>
                    <td className="p-2">{formatTime(score.clear_time_seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
