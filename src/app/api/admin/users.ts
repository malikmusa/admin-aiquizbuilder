import { NextApiRequest, NextApiResponse } from 'next'
import {createClient} from '../../../lib/supabase'

const supabaseAdmin =await createClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { page = 1, limit = 10, search = '', filter = 'all' } = req.query

      let query = supabaseAdmin
        .from('auth.users')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply search filter
      if (search) {
        query = query.or(`email.ilike.%${search}%,phone.ilike.%${search}%`)
      }

      // Apply status filter
      switch (filter) {
        case 'active':
          query = query.is('deleted_at', null).is('banned_until', null)
          break
        case 'banned':
          query = query.not('banned_until', 'is', null)
          break
        case 'deleted':
          query = query.not('deleted_at', 'is', null)
          break
        case 'sso':
          query = query.eq('is_sso_user', true)
          break
      }

      const offset = (Number(page) - 1) * Number(limit)
      query = query.range(offset, offset + Number(limit) - 1)

      const { data: users, error, count } = await query

      if (error) throw error

      res.status(200).json({
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0
        }
      })
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' })
    }
  }
}