import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/db';

export async function GET() {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from DB based on github session or fetch
    // For simplicity, let's fetch all snapshots ordered by time
    const { data: snapshots, error } = await supabase
      .from('snapshots')
      .select('*')
      .order('captured_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ snapshots: snapshots || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}