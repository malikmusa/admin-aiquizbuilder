// import { NextRequest, NextResponse } from 'next/server';
// import { supabaseAdmin } from '../../../../lib/supabase';

// export const dynamic = 'force-dynamic';

// async function fetchUsers(params: {
//   page: number;
//   perPage: number;
//   email?: string;
// }) {
//   const { page, perPage, email } = params;

//   if (email && email.trim()) {
//     // Try to find user by email using listUsers with filter
//     const r = await supabaseAdmin.auth.admin.listUsers({
//       page: 1,
//       perPage: 1000, // Search through more users to find the email
//     });

//     if (r.error) throw new Error(r.error.message);

//     const users = r.data?.users ?? [];
//     const filteredUser = users.find(u => u.email === email.trim());

//     return { users: filteredUser ? [filteredUser] : [], total: filteredUser ? 1 : 0 };
//   }

//   const r = await supabaseAdmin.auth.admin.listUsers({
//     page,
//     perPage: perPage
//   });

//   if (r.error) throw new Error(r.error.message);

//   return {
//     users: r.data?.users ?? [],
//     total: r.data?.users?.length ?? 0 // Use actual length since total might not be available
//   };
// }

// export async function GET(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const page = Number(searchParams.get('page') ?? 1) || 1;
//     const perPage = Math.min(100, Number(searchParams.get('perPage') ?? 25) || 25);
//     const email = searchParams.get('email') || '';

//     const { users, total } = await fetchUsers({ page, perPage, email });

//     return NextResponse.json({ users, total }, { status: 200 });
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch users', users: [], total: 0 },
//       { status: 500 }
//     );
//   }
// }




import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
export const dynamic = 'force-dynamic';

async function fetchUsers(params: {
  page: number;
  perPage: number;
  email?: string;
}) {
  const { page, perPage, email } = params;

  if (email && email.trim()) {
    const r = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (r.error) throw new Error(r.error.message);
    const users = r.data?.users ?? [];
    const filteredUser = users.find(u => u.email === email.trim());
    return {
      users: filteredUser ? [filteredUser] : [],
      total: filteredUser ? 1 : 0,
    };
  }

  const r = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
  if (r.error) throw new Error(r.error.message);

  return {
    users: r.data?.users ?? [],
    total: r.data?.total ?? r.data?.users?.length ?? 0, // ✅ use r.data.total
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') ?? 1) || 1;
    const perPage = Math.min(100, Number(searchParams.get('perPage') ?? 25) || 25);
    const email = searchParams.get('email') || '';

    const { users, total } = await fetchUsers({ page, perPage, email });
    return NextResponse.json({ users, total }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', users: [], total: 0 },
      { status: 500 }
    );
  }
}