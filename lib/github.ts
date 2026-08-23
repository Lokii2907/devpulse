export async function fetchGitHubStats(accessToken: string) {
  // 1. Fetch user's repositories
  const res = await fetch('https://api.github.com/user/repos?per_page=100', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch repositories from GitHub');
  }

  const repos = await res.json();
  const reposCount = repos.length;

  // 2. Aggregate programming languages used across repos
  const languages: Record<string, number> = {};

  for (const repo of repos) {
    if (repo.language) {
      languages[repo.language] = (languages[repo.language] || 0) + 1;
    }
  }

  // 3. Fetch user's events/commits (or approximate via public events)
  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const userData = await userRes.json();

  // For a robust commit metric, we can track public contributions or repo stats. 
  // Let's default total_commits tracking placeholder or parse from events:
  const eventsRes = await fetch(`https://api.github.com/users/${userData.login}/events/public`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  let recentPushEvents = 0;
  if (eventsRes.ok) {
    const events = await eventsRes.json();
    recentPushEvents = events.filter((e: any) => e.type === 'PushEvent').length;
  }

  return {
    githubId: userData.id.toString(),
    username: userData.login,
    avatarUrl: userData.avatar_url,
    reposCount,
    totalCommits: recentPushEvents * 3, // Weighted approximation or actual tracking
    languagesJson: languages,
  };
}