'use client';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';


const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { data: session }: any = useSession();
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const fetchSnapshots = async () => {
    try {
      const res = await fetch('/api/snapshots-history'); // We'll wire this or fetch user snapshots
      const data = await res.json();
      if (data.snapshots) setSnapshots(data.snapshots);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  const takeSnapshot = async () => {
    setTriggering(true);
    await fetch('/api/snapshot');
    await fetchSnapshots();
    setTriggering(false);
  };

  useEffect(() => {
    if (session) {
      fetchSnapshots();
    }
  }, [session]);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p>Please log in to view your dashboard.</p>
      </div>
    );
  }

  // Parse latest snapshot languages for the pie chart
  const latestSnapshot = snapshots[snapshots.length - 1] || {};
  const languagesData = latestSnapshot.languages_json 
    ? Object.entries(latestSnapshot.languages_json).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      {/* Top Header Bar */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-4">
          <img src={session.user?.image} alt="Avatar" className="w-12 h-12 rounded-full border border-gray-700" />
          <div>
            <h1 className="text-2xl font-bold">{session.user?.name}</h1>
            <p className="text-sm text-gray-400">@{session.user?.email}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={takeSnapshot}
            disabled={triggering}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-sm font-medium rounded-md transition"
          >
            {triggering ? "Saving..." : "Take New Snapshot"}
          </button>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-sm font-medium rounded-md transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Total Repositories</h3>
          <p className="text-3xl font-extrabold text-blue-400">{latestSnapshot.repos_count || 0}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Estimated Commits Activity</h3>
          <p className="text-3xl font-extrabold text-green-400">{latestSnapshot.total_commits || 0}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Snapshots Recorded</h3>
          <p className="text-3xl font-extrabold text-purple-400">{snapshots.length}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Commit Trend Chart */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">Commit Growth Over Time</h3>
          <div className="h-64 w-full">
            {snapshots.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={snapshots}>
                  <XAxis dataKey="captured_at" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
                  <Bar dataKey="total_commits" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">No snapshot history found yet. Take a snapshot!</div>
            )}
          </div>
        </div>
        {/* Contribution Heatmap Card */}
<div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg mt-6">
  <h3 className="text-lg font-semibold text-white mb-4">Contribution Activity Heatmap</h3>
  <div className="overflow-x-auto">
    <CalendarHeatmap
      startDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
      endDate={new Date()}
      values={snapshots.map((s: any) => ({
        date: s.captured_at ? s.captured_at.split('T')[0] : new Date().toISOString().split('T')[0],
        count: s.commit_count || 1, // maps your snapshot commit count
      }))}
      classForValue={(value) => {
        if (!value) {
          return 'color-empty';
        }
        return `color-github-${Math.min(value.count, 4)}`;
      }}
      showWeekdayLabels={true}
    />
  </div>
</div>    

{/* Contribution Activity Heatmap */}
<div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg mt-6">
  <h3 className="text-lg font-semibold text-white mb-4">Contribution Activity Heatmap</h3>
  <div className="overflow-x-auto">
    <CalendarHeatmap
      startDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
      endDate={new Date()}
      values={snapshots.map((s: any) => ({
        date: s.captured_at ? s.captured_at.split('T')[0] : new Date().toISOString().split('T')[0],
        count: s.commit_count || 1,
      }))}
      classForValue={(value) => {
        if (!value) {
          return 'color-empty';
        }
        return `color-github-${Math.min(value.count, 4)}`;
      }}
      showWeekdayLabels={true}
    />
  </div>
</div>
        {/* Language Distribution */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">Language Stack Breakdown</h3>
          <div className="h-64 w-full flex items-center justify-center">
            {languagesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
                  <Pie data={languagesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {languagesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">No language data available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}