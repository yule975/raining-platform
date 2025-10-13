// Vercel Serverless Function - API入口
import type { VercelRequest, VercelResponse } from '@vercel/node'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 加载环境变量
dotenv.config()

const app = express()

// Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

// 中间件
app.use(helmet())

// CORS配置
const allowedOrigins: (string | RegExp)[] = [
  process.env.FRONTEND_URL || 'https://trae0uv01uwq-99jblfomd-yule2.vercel.app',
  /\.vercel\.app$/
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    const isAllowed = allowedOrigins.some((o) =>
      typeof o === 'string' ? o === origin : o.test(origin)
    )
    if (isAllowed) return callback(null, true)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'training-platform-backend'
  })
})


// API 路由
app.get('/api/courses', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    res.json(data)
  } catch (error) {
    console.error('Error fetching courses:', error)
    res.status(500).json({ error: 'Failed to fetch courses' })
  }
})

app.post('/api/courses', async (req, res) => {
  try {
    const { title, description, cover_url, video_url, duration, instructor } = req.body

    const { data, error } = await supabase
      .from('courses')
      .insert({
        title,
        description,
        cover_url,
        video_url,
        duration,
        instructor
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    res.status(201).json(data)
  } catch (error) {
    console.error('Error creating course:', error)
    res.status(500).json({ error: 'Failed to create course' })
  }
})

// ========== 培训期次相关路由 ==========
app.get('/api/training-sessions', async (req, res) => {
  try {
    // 获取期次基本信息
    const { data: sessions, error } = await supabase
      .from('training_sessions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // 为每个期次计算学员数量
    const sessionsWithCount = await Promise.all((sessions || []).map(async (session) => {
      try {
        const { count, error: countError } = await supabase
          .from('session_students')
          .select('*', { count: 'exact' })
          .eq('session_id', session.id)

        if (countError) {
          console.warn('计算学员数量失败:', session.name, countError.message)
          return { ...session, student_count: 0 }
        }

        return { ...session, student_count: count || 0 }
      } catch (err) {
        console.warn('计算学员数量失败:', session.name, err)
        return { ...session, student_count: 0 }
      }
    }))

    res.json(sessionsWithCount)
  } catch (error) {
    console.error('Error fetching training sessions:', error)
    res.status(500).json({ error: 'Failed to fetch training sessions' })
  }
})

app.get('/api/training-sessions/current', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('is_current', true)
      .eq('status', 'active')
      .single()

    if (error) {
      // PGRST116: No rows found
      if ((error as any).code === 'PGRST116') {
        return res.json(null)
      }
      throw error
    }

    res.json(data)
  } catch (error) {
    console.error('Error fetching current session:', error)
    res.status(500).json({ error: 'Failed to fetch current session' })
  }
})

// 校验学员是否属于指定期次
app.get('/api/sessions/:sessionId/members/:userId/exists', async (req, res) => {
  try {
    const { sessionId, userId } = req.params
    if (!sessionId || !userId) {
      return res.status(400).json({ isMember: false, error: 'Missing params' })
    }

    const { data, error } = await supabase
      .from('session_students')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single()

    if (error && (error as any).code !== 'PGRST116') {
      throw error
    }

    return res.json({ isMember: !!data })
  } catch (error) {
    console.error('Error checking session membership:', (error as any)?.message || error)
    return res.json({ isMember: false })
  }
})

// 获取某期次关联课程列表
app.get('/api/training-sessions/:id/courses', async (req, res) => {
  try {
    const { id } = req.params

    // 从 session_courses 取关联，再 JOIN 课程信息
    const { data: relations, error: relErr } = await supabase
      .from('session_courses')
      .select('course_id')
      .eq('session_id', id)

    if (relErr) throw relErr

    const courseIds = (relations || []).map((r: any) => r.course_id)
    if (courseIds.length === 0) {
      return res.json([])
    }

    const { data: courses, error: courseErr } = await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds)
      .order('created_at', { ascending: false })

    if (courseErr) throw courseErr

    res.json(courses || [])
  } catch (error) {
    console.error('Error fetching session courses:', error)
    res.status(500).json({ error: 'Failed to fetch session courses' })
  }
})

// 作业相关路由
app.get('/api/assignments', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        courses(title)
      `)
      .neq('status', 'template')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching assignments:', (error as any)?.message || error)
      return res.json([])
    }

    return res.json(data || [])
  } catch (error) {
    console.error('Error fetching assignments:', (error as any)?.message || error)
    return res.json([])
  }
})

// 获取某个作业的所有提交明细（管理员查看）
app.get('/api/assignments/:assignmentId/submissions', async (req, res) => {
  try {
    const { assignmentId } = req.params

    // 获取提交记录
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        *,
        assignments(id, title, due_date, max_score)
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false })

    if (submissionsError) throw submissionsError

    if (!submissions || submissions.length === 0) {
      return res.json([])
    }

    // 获取学员信息（从profiles表）
    const studentIds = [...new Set(submissions.map(s => s.student_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', studentIds)

    if (profilesError) {
      console.error('Error fetching student profiles:', profilesError)
    }

    // 创建学员信息映射
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // 组合数据，添加学员姓名
    const result = submissions.map(submission => ({
      ...submission,
      student_name: profileMap.get(submission.student_id)?.full_name || submission.student_id,
      student_email: profileMap.get(submission.student_id)?.email || '',
      student: {
        id: submission.student_id,
        name: profileMap.get(submission.student_id)?.full_name || submission.student_id,
        email: profileMap.get(submission.student_id)?.email || ''
      }
    }))

    res.json(result)
  } catch (error) {
    console.error('Error fetching assignment submissions:', error)
    res.status(500).json({ error: 'Failed to fetch assignment submissions' })
  }
})

app.get('/api/assignments/:assignmentId/submissions/:studentId', async (req, res) => {
  try {
    const { assignmentId, studentId } = req.params

    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        assignments(title, due_date, max_score)
      `)
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .single()

    if (error) {
      // PGRST116: No rows found
      if ((error as any).code === 'PGRST116') {
        return res.json(null)
      }
      throw error
    }

    res.json(data)
  } catch (error) {
    console.error('Error fetching submission:', error)
    res.status(500).json({ error: 'Failed to fetch submission' })
  }
})

// 学员提交/更新提交记录（前端"我已提交"或回跳打点）
app.post('/api/assignments/:assignmentId/submissions', async (req, res) => {
  try {
    const { assignmentId } = req.params
    const { studentId, content, fileUrl } = req.body as { studentId: string; content?: string; fileUrl?: string }

    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required' })
    }

    // 先查是否已有提交
    const { data: existing, error: fetchErr } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .single()

    const now = new Date().toISOString()

    if (existing && !fetchErr) {
      const { data, error } = await supabase
        .from('submissions')
        .update({
          content: content ?? existing.content ?? '',
          file_url: fileUrl ?? existing.file_url ?? null,
          submitted_at: now
        })
        .eq('id', existing.id)
        .select('*')
        .single()

      if (error) throw error
      // 补写课程完成表：将 assignments_completed 置为 true
      try {
        const { data: assignment } = await supabase
          .from('assignments')
          .select('course_id')
          .eq('id', assignmentId)
          .single()
        const { data: currentSession } = await supabase
          .from('training_sessions')
          .select('*')
          .eq('is_current', true)
          .eq('status', 'active')
          .single()
        if (assignment?.course_id && currentSession?.id) {
          await supabase.rpc('update_course_completion', {
            p_session_id: currentSession.id,
            p_user_id: studentId,
            p_course_id: assignment.course_id,
            p_assignments_completed: true
          })
        }
      } catch {}
      return res.json(data)
    }

    // 插入新提交
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        assignment_id: assignmentId,
        student_id: studentId,
        content: content || '',
        file_url: fileUrl || null,
        submitted_at: now
      })
      .select('*')
      .single()

    if (error) throw error
    try {
      const { data: assignment } = await supabase
        .from('assignments')
        .select('course_id')
        .eq('id', assignmentId)
        .single()
      const { data: currentSession } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('is_current', true)
        .eq('status', 'active')
        .single()
      if (assignment?.course_id && currentSession?.id) {
        await supabase.rpc('update_course_completion', {
          p_session_id: currentSession.id,
          p_user_id: studentId,
          p_course_id: assignment.course_id,
          p_assignments_completed: true
        })
      }
    } catch {}
    res.status(201).json(data)
  } catch (error) {
    console.error('Error creating/updating submission:', error)
    res.status(500).json({ error: 'Failed to submit assignment' })
  }
})

// 标记视频观看完成（学员手动确认）
app.post('/api/courses/:courseId/video-completed', async (req, res) => {
  try {
    const { courseId } = req.params
    const { studentId } = req.body as { studentId: string }

    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required' })
    }

    const { data: currentSession, error: sesErr } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('is_current', true)
      .eq('status', 'active')
      .single()

    if (sesErr) throw sesErr
    if (!currentSession) return res.status(400).json({ error: 'No active current session' })

    const { error } = await supabase.rpc('update_course_completion', {
      p_session_id: (currentSession as any).id,
      p_user_id: studentId,
      p_course_id: courseId,
      p_video_completed: true
    })

    if (error) {
      // Fallback: upsert into course_completions
      const now = new Date().toISOString()
      const { data: existed } = await supabase
        .from('course_completions')
        .select('id')
        .eq('session_id', (currentSession as any).id)
        .eq('user_id', studentId)
        .eq('course_id', courseId)
        .single()
      if (existed) {
        await supabase
          .from('course_completions')
          .update({ video_completed: true, updated_at: now })
          .eq('id', (existed as any).id)
      } else {
        await supabase
          .from('course_completions')
          .insert({
            session_id: (currentSession as any).id,
            user_id: studentId,
            course_id: courseId,
            video_completed: true,
            assignments_completed: false,
            course_completed: false,
            created_at: now,
            updated_at: now
          })
      }
    }

    return res.json({ success: true })
  } catch (error) {
    console.error('Error marking video completed:', (error as any)?.message || error)
    return res.status(500).json({ error: 'Failed to mark video completed', detail: (error as any)?.message || String(error) })
  }
})

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

export default function handler(req: VercelRequest, res: VercelResponse) {
  return new Promise<void>((resolve, reject) => {
    // 监听响应完成
    res.on('finish', resolve)
    res.on('close', resolve) 
    res.on('error', reject)
    
    // 处理请求
    app(req as any, res as any)
  })
}
