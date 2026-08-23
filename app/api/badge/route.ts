import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username') || 'Lokesh';

  let totalCommits = 54;
  let reposCount = 6;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    const { data: snapshots, error } = await supabase
      .from('snapshots')
      .select('*')
      .order('captured_at', { ascending: false })
      .limit(1);

    if (!error && snapshots && snapshots.length > 0) {
      totalCommits = snapshots[0].total_commits || snapshots[0].commit_count || 54;
      reposCount = snapshots[0].repos_count || 6;
    }
  } catch (err) {
    // Falls back gracefully
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="340" height="60" viewBox="0 0 340 60" fill="none">
      <rect width="340" height="60" rx="12" fill="#0d1117" stroke="#30363d" stroke-width="2"/>
      <text x="20" y="25" fill="#58a6ff" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="14" font-weight="bold">DevPulse Stats • ${username}</text>
      <text x="20" y="45" fill="#8b949e" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="12">Commits: <tspan fill="#39d353" font-weight="bold">${totalCommits}</tspan> | Repos: <tspan fill="#39d353" font-weight="bold">${reposCount}</tspan></text>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}