import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // 1. Verify the secret header to ensure only Vercel Cron can trigger this endpoint
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }

    // 2. Fetch all registered users from Supabase
    const { data: users, error: userError } = await supabase.from('users').select('*');
    if (userError) throw userError;

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users found to snapshot.' });
    }

    const results = [];

    // 3. Loop through users and fetch their public GitHub stats
    for (const user of users) {
      const githubRes = await fetch(`https://api.github.com/users/${user.username}/repos?per_page=100`, {
        headers: {
          Accept: 'application/vnd.github+json',
        },
      });

      if (!githubRes.ok) continue;
      const repos = await githubRes.json();
      const reposCount = repos.length;

      // Aggregate languages
      const languages: Record<string, number> = {};
      for (const repo of repos) {
        if (repo.language) {
          languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
      }

      // Fetch public events for commit tracking approximation
      const eventsRes = await fetch(`https://api.github.com/users/${user.username}/events/public`);
      let totalCommits = 15; // default fallback
      if (eventsRes.ok) {
        const events = await eventsRes.json();
        const pushEvents = events.filter((e: any) => e.type === 'PushEvent').length;
        totalCommits = pushEvents * 3;
      }

      // 4. Insert automatic snapshot into Supabase
      await supabase.from('snapshots').insert({
        user_id: user.id,
        total_commits: totalCommits,
        languages_json: languages,
        repos_count: reposCount,
      });

      results.push({ username: user.username, success: true });
    }

    return NextResponse.json({ success: true, processed: results.length });
  } catch (err: any) {
    console.error('Cron error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}