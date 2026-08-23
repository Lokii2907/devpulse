import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Ensure this points correctly to your auth route
import { supabase } from '@/lib/db';
import { fetchGitHubStats } from '@/lib/github';

export async function GET(request: Request) {
  try {
    // Pass authOptions so NextAuth can decode the session and token correctly
    const session: any = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized or missing GitHub token' }, { status: 401 });
    }

    // 1. Fetch live stats from GitHub using user's access token
    const stats = await fetchGitHubStats(session.accessToken);

    // 2. Upsert user into Supabase `users` table
    let { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('github_id', stats.githubId)
      .single();

    if (!userRecord) {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          github_id: stats.githubId,
          username: stats.username,
          avatar_url: stats.avatarUrl,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      userRecord = newUser;
    }

    // 3. Insert a new record into `snapshots` table
    const { error: snapshotError } = await supabase.from('snapshots').insert({
      user_id: userRecord.id,
      total_commits: stats.totalCommits,
      languages_json: stats.languagesJson,
      repos_count: stats.reposCount,
    });

    if (snapshotError) throw snapshotError;

    return NextResponse.json({ success: true, stats });
  } catch (err: any) {
    console.error('Snapshot error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}