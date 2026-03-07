// app/api/lessons/[lessonId]/complete/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> } // ✅ Next.js 15
) {
  try {
    const { lessonId } = await params; // ✅ await params

    // ✅ FIX 1: use createClient(cookieStore) not createRouteHandlerClient
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    // ✅ FIX 2: accept duration_seconds from the client so we can track time
    const { duration_seconds } = body;

    // ✅ FIX 3: correct table is 'progress', correct columns are
    // student_id + lesson_id + is_completed (not user_id/completed/lesson_progress)
    const { error } = await supabase
      .from('progress')
      .upsert(
        {
          student_id: user.id,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date().toISOString(),
          // ✅ FIX 4: save duration so Mi Progreso shows real time
          // last_position_seconds stores how far they got — we reuse it
          // to accumulate total watch time
          ...(duration_seconds != null && {
            last_position_seconds: Math.round(duration_seconds),
          }),
        },
        { onConflict: 'student_id,lesson_id' }
      );

    if (error) {
      console.error('Error updating progress:', error);
      return NextResponse.json(
        { error: 'Failed to mark lesson complete' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in lesson complete route:', error);
    return NextResponse.json(
      { error: 'Failed to mark lesson complete' },
      { status: 500 }
    );
  }
}