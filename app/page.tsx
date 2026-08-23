'use client';
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";

export default function Home() {
  const { data: session }: any = useSession();
  const [snapshotResult, setSnapshotResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const triggerSnapshot = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/snapshot');
      const data = await res.json();
      setSnapshotResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setSnapshotResult(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
        <h1 className="text-3xl font-bold mb-4">Welcome, {session.user?.name}!</h1>
        <p className="text-gray-400 mb-6">{session.user?.email}</p>
        
        <div className="flex gap-4 mb-8">
          <button 
            onClick={triggerSnapshot} 
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition"
          >
            {loading ? "Taking Snapshot..." : "Take GitHub Snapshot Now"}
          </button>
          <button 
            onClick={() => signOut()} 
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition"
          >
            Sign Out
          </button>
        </div>

        {snapshotResult && (
          <div className="w-full max-w-xl bg-black p-4 rounded-md border border-gray-800 text-left overflow-x-auto">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Snapshot Result:</h3>
            <pre className="text-xs text-green-400">{snapshotResult}</pre>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <h1 className="text-4xl font-extrabold mb-2">DevPulse</h1>
      <p className="text-gray-400 mb-8">Your GitHub contribution & code-quality analytics dashboard</p>
      <button 
        onClick={() => signIn("github")} 
        className="px-6 py-3 bg-white text-black hover:bg-gray-200 rounded-md font-semibold transition"
      >
        Sign in with GitHub
      </button>
    </main>
  );
}