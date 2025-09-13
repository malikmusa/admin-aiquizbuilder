import { NextApiRequest, NextApiResponse } from 'next'
import {createClient} from '../../../lib/supabase'

const supabaseAdmin =await createClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { 
        page = 1, 
        limit = 10, 
        userId = '',
        category = '',
        difficulty = '',
        search = ''
      } = req.query

      // Assuming you have a 'generated_quizzes' table
      let query = supabaseAdmin
        .from('generated_quizzes')
        .select(`
          *,
          users:user_id (
            email,
            raw_user_meta_data
          )
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      if (category) {
        query = query.eq('category', category)
      }
      
      if (difficulty) {
        query = query.eq('difficulty', difficulty)
      }
      
      if (search) {
        query = query.ilike('title', `%${search}%`)
      }

      const offset = (Number(page) - 1) * Number(limit)
      query = query.range(offset, offset + Number(limit) - 1)

      const { data: quizzes, error, count } = await query

      if (error) throw error

      res.status(200).json({
        quizzes,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0
        }
      })
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quizzes' })
    }
  }
}