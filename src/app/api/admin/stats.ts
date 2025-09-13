/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from 'next'
import {createClient} from '../../../lib/supabase'

const supabaseAdmin =await createClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Get user stats
      const { count: totalUsers } = await supabaseAdmin
        .from('auth.users')
        .select('*', { count: 'exact', head: true })

      const { count: activeUsers } = await supabaseAdmin
        .from('auth.users')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .is('banned_until', null)

      const { count: bannedUsers } = await supabaseAdmin
        .from('auth.users')
        .select('*', { count: 'exact', head: true })
        .not('banned_until', 'is', null)

      const { count: ssoUsers } = await supabaseAdmin
        .from('auth.users')
        .select('*', { count: 'exact', head: true })
        .eq('is_sso_user', true)

      // Get quiz stats (assuming you have generated_quizzes table)
      const { count: totalQuizzes } = await supabaseAdmin
        .from('generated_quizzes')
        .select('*', { count: 'exact', head: true })

      const today = new Date().toISOString().split('T')[0]
      const { count: quizzesToday } = await supabaseAdmin
        .from('generated_quizzes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today)

      const stats: any = {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalQuizzes: totalQuizzes || 0,
        quizzesToday: quizzesToday || 0,
        bannedUsers: bannedUsers || 0,
        ssoUsers: ssoUsers || 0
      }

      res.status(200).json(stats)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' })
    }
  }
}
