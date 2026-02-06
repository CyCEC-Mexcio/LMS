// app/api/admin/users/[userId]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createClient();
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = params;

    // Delete user's related data first (foreign key constraints)
    // Delete enrollments
    await supabase
      .from('enrollments')
      .delete()
      .eq('user_id', userId);

    // Delete progress
    await supabase
      .from('progress')
      .delete()
      .eq('user_id', userId);

    // Delete certificates
    await supabase
      .from('certificates')
      .delete()
      .eq('user_id', userId);

    // Delete any courses created by the user
    await supabase
      .from('courses')
      .delete()
      .eq('instructor_id', userId);

    // Finally delete the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      throw profileError;
    }

    // Note: You cannot delete auth.users via the API
    // You need to use Supabase Admin API or SQL function
    // See solution #2 below

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}