"use client";

import { useSession, signIn } from "next-auth/react";
import Dashboard from "./dashboard/page";

export default function Home() {
  const { data: session } = useSession();

  if (session) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          DevPulse
        </h1>
        <p className="text-gray-400 text-lg">
          Your automated GitHub contribution & code-quality analytics dashboard.
        </p>
        <div className="pt-4">
          <button
            onClick={() => signIn("github")}
            className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition shadow-lg"
          >
            Sign in with GitHub
          </button>
        </div>
      </div>
    </div>
  );
}