import { supabase } from '@/lib/db';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicProfile({ params }: PageProps) {
  const { username } = await params;

  // 1. Fetch user record from Supabase by username
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (userError || !user) {
    notFound();
  }

  // 2. Fetch the latest snapshot for this user
  const { data: snapshots, error: snapshotError } = await supabase
    .from('snapshots')
    .select('*')
    .eq('user_id', user.id)
    .order('captured_at', { ascending: false });

  if (snapshotError) {
    console.error('Error fetching snapshots:', snapshotError);
  }

  const latestSnapshot = snapshots && snapshots.length > 0 ? snapshots[0] : null;
  const languages = latestSnapshot?.languages_json || {};

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        
        {/* User Info Header */}
        <div className="flex items-center gap-6 mb-8 border-b border-gray-800 pb-6">
          <img 
            src={user.avatar_url} 
            alt={user.username} 
            className="w-20 h-20 rounded-full border-2 border-green-500 shadow-md" 
          />
          <div>
            <h1 className="text-3xl font-extrabold">{user.username}</h1>
            <p className="text-sm text-gray-400">DevPulse Public Analytics Profile</p>
            <span className="inline-block mt-2 px-3 py-1 bg-green-900/40 text-green-400 text-xs font-semibold rounded-full border border-green-700/50">
              Verified Developer
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        {latestSnapshot ? (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 text-center">
                <p className="text-xs text-gray-400 mb-1">Total Repositories</p>
                <p className="text-3xl font-bold text-blue-400">{latestSnapshot.repos_count}</p>
              </div>
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 text-center">
                <p className="text-xs text-gray-400 mb-1">Recent Commit Activity</p>
                <p className="text-3xl font-bold text-green-400">{latestSnapshot.total_commits}</p>
              </div>
            </div>

            {/* Language Breakdown */}
            <div className="bg-gray-950 p-6 rounded-xl border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Top Languages</h3>
              {Object.keys(languages).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(languages).map(([lang, count]: [string, any]) => (
                    <div key={lang} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-200">{lang}</span>
                      <span className="px-2.5 py-0.5 bg-gray-800 text-gray-300 rounded-md text-xs font-mono">
                        {count} repos/activity
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No language data recorded yet.</p>
              )}
            </div>

            <div className="mt-8 text-center text-xs text-gray-500">
              Last updated: {new Date(latestSnapshot.captured_at).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            No snapshot data found for this user yet.
          </div>
        )}

      </div>
    </div>
  );
}