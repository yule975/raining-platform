import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 加载环境变量
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 中间件
app.use(helmet())

// 允许 Vercel 等域名
const allowedOrigins: (string | RegExp)[] = [
  process.env.FRONTEND_URL || 'http://localhost:8080',
  'http://localhost:8081',
  /^http:\/\/localhost:\d+$/,
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
app.use(morgan('combined'))
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

    // 第一步：创建课程
    const { data: courseData, error: courseError } = await supabase
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

    if (courseError) {
      throw courseError
    }

    console.log('Course created successfully:', courseData.id, courseData.title)

    // 第二步：自动关联到当前期次
    try {
      // 获取当前期次
      const { data: currentSession, error: sessionError } = await supabase
        .from('training_sessions')
        .select('id, name')
        .eq('is_current', true)
        .eq('status', 'active')
        .single()

      if (sessionError && sessionError.code !== 'PGRST116') {
        console.warn('获取当前期次失败，跳过自动关联:', sessionError.message)
      } else if (currentSession) {
        // 关联课程到当前期次
        const { error: linkError } = await supabase
          .from('session_courses')
          .insert({
            session_id: currentSession.id,
            course_id: courseData.id,
            is_active: true,
            added_at: new Date().toISOString()
          })

        if (linkError) {
          console.warn('课程关联到期次失败:', linkError.message)
        } else {
          console.log('✅ 课程自动关联到当前期次:', currentSession.name)
        }
      } else {
        console.log('⚠️ 未找到当前期次，课程未自动关联')
      }
    } catch (autoLinkError) {
      // 自动关联失败不影响课程创建
      console.warn('自动关联期次过程出错:', autoLinkError)
    }

    res.status(201).json(courseData)
  } catch (error) {
    console.error('Error creating course:', error)
    res.status(500).json({ error: 'Failed to create course' })
  }
})

// ========== 导出学生登录凭据 ==========
app.post('/api/students/export-credentials', async (req, res) => {
  try {
    const { userIds, sessionIds } = req.body as { userIds: number[]; sessionIds?: string[] }
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds required' })
    }

    const { data: users, error: usersErr } = await supabase
      .from('authorized_users')
      .select('id,email,name')
      .in('id', userIds)
    if (usersErr) throw usersErr

    const credentials: any[] = []
    const { data: listed } = await supabase.auth.admin.listUsers()

    // 期次名称映射（如果传了期次）
    let sessionNameMap: Record<string, string> = {}
    if (Array.isArray(sessionIds) && sessionIds.length > 0) {
      const { data: sess } = await supabase
        .from('training_sessions')
        .select('id,name')
        .in('id', sessionIds)
      sessionNameMap = (sess || []).reduce((acc: any, s: any) => { acc[s.id] = s.name; return acc }, {})
    }

    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/login`

    for (const u of users || []) {
      const email: string = u.email
      const name: string = u.name || email.split('@')[0]
      let authUser = listed?.users?.find((x: any) => x.email === email)
      if (!authUser) {
        const pwd = generateStrongPassword()
        const { data: created, error: cErr } = await supabase.auth.admin.createUser({
          email,
          password: pwd,
          email_confirm: true,
          user_metadata: { full_name: name, must_change_password: true }
        })
        if (cErr) throw cErr
        authUser = created.user
        credentials.push({
          name,
          email,
          initial_password: pwd,
          assigned_sessions: (sessionIds || []).join(';'),
          assigned_session_names: (sessionIds || []).map(id => sessionNameMap[id] || id).join(';'),
          login_url: loginUrl
        })
      } else {
        const pwd = generateStrongPassword()
        const { error: uErr } = await supabase.auth.admin.updateUserById(authUser.id, {
          password: pwd,
          user_metadata: { ...(authUser.user_metadata || {}), must_change_password: true }
        })
        if (uErr) throw uErr
        credentials.push({
          name,
          email,
          initial_password: pwd,
          assigned_sessions: (sessionIds || []).join(';'),
          assigned_session_names: (sessionIds || []).map(id => sessionNameMap[id] || id).join(';'),
          login_url: loginUrl
        })
      }

      // 可选：分配期次
      if (Array.isArray(sessionIds) && sessionIds.length > 0) {
        await ensureProfileByEmail(email, name)
        const { data: profileList } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .order('updated_at', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
        const profile = Array.isArray(profileList) ? profileList[0] : (profileList as any)
        const uuid = profile?.id
        if (uuid) {
          await supabase.from('session_students').delete().eq('user_id', uuid)
          const rows = sessionIds.map(id => ({ session_id: id, user_id: uuid, status: 'active' }))
          await supabase.from('session_students').insert(rows)
        }
      }
    }

    // 手动拼接 CSV，避免外部依赖
    const headers = ['name','email','initial_password','assigned_sessions','assigned_session_names','login_url']
    const escape = (v: any) => {
      const s = (v ?? '').toString()
      if (s.includes('"') || s.includes(',') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }
    const rows = [headers.join(',')].concat(
      credentials.map((r:any)=>[
        escape(r.name),
        escape(r.email),
        escape(r.initial_password),
        escape(r.assigned_sessions),
        escape(r.assigned_session_names),
        escape(r.login_url)
      ].join(','))
    )
    const csv = rows.join('\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="credentials.csv"')
    return res.status(200).send(csv)
  } catch (error: any) {
    console.error('Error export credentials:', error?.message || error)
    return res.status(500).json({ error: 'Failed to export credentials' })
  }
})

function generateStrongPassword(length: number = 12): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnpqrstuvwxyz'
  const nums = '23456789'
  const syms = '!@#$%^&*-_'
  const all = upper + lower + nums + syms
  let pwd = ''
  pwd += upper[Math.floor(Math.random() * upper.length)]
  pwd += lower[Math.floor(Math.random() * lower.length)]
  pwd += nums[Math.floor(Math.random() * nums.length)]
  pwd += syms[Math.floor(Math.random() * syms.length)]
  for (let i = 4; i < length; i++) pwd += all[Math.floor(Math.random() * all.length)]
  return pwd
}

async function ensureProfileByEmail(email: string, name?: string) {
  try {
    const { data: profileList } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
    const profile = Array.isArray(profileList) ? profileList[0] : (profileList as any)
    if (!profile?.id) {
      const { data: users } = await supabase.auth.admin.listUsers()
      const found = users?.users?.find((u: any) => u.email === email)
      if (found) {
        await supabase.from('profiles').upsert({
          id: found.id,
          email,
          full_name: name || email.split('@')[0] || '',
          role: 'student',
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }, { onConflict: 'id' })
      }
    }
  } catch {}
}

// ========== 新增：培训期次相关路由 ==========
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

// 学员管理路由
app.get('/api/authorized-users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('authorized_users')
      .select('*')
      .order('added_at', { ascending: false })

    if (error) {
      throw error
    }

    res.json(data)
  } catch (error) {
    console.error('Error fetching authorized users:', error)
    res.status(500).json({ error: 'Failed to fetch authorized users' })
  }
})

app.post('/api/authorized-users', async (req, res) => {
  try {
    const { email, name } = req.body

    const { data, error } = await supabase
      .from('authorized_users')
      .insert({ email, name, status: 'active' })
      .select()
      .single()

    if (error) {
      throw error
    }

    res.status(201).json(data)
  } catch (error) {
    console.error('Error adding authorized user:', error)
    res.status(500).json({ error: 'Failed to add authorized user' })
  }
})

app.delete('/api/authorized-users/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('authorized_users')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting authorized user:', error)
    res.status(500).json({ error: 'Failed to delete authorized user' })
  }
})

// 更新授权用户（姓名/邮箱/状态）
app.patch('/api/authorized-users/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, status } = req.body as { name?: string; email?: string; status?: 'active' | 'inactive' }

    // 可选：唯一邮箱检查
    if (email) {
      const { data: existed, error: checkErr } = await supabase
        .from('authorized_users')
        .select('id,email')
        .eq('email', email)
        .neq('id', id)
      if (checkErr) throw checkErr
      if (existed && existed.length > 0) {
        return res.status(409).json({ error: 'Email already exists' })
      }
    }

    const payload: any = {}
    if (typeof name === 'string') payload.name = name
    if (typeof email === 'string') payload.email = email
    if (status === 'active' || status === 'inactive') payload.status = status

    const { data, error } = await supabase
      .from('authorized_users')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error updating authorized user:', error)
    res.status(500).json({ error: 'Failed to update authorized user' })
  }
})

// 设置学员所属期次（覆盖式）
app.put('/api/students/:userId/sessions', async (req, res) => {
  try {
    let { userId } = req.params
    const { sessionIds } = req.body as { sessionIds: string[] }

    if (!Array.isArray(sessionIds)) {
      return res.status(400).json({ error: 'sessionIds should be an array' })
    }

    // 兼容：如果传入的是 authorized_users 的数字主键，需换取 profiles/auth 的 UUID
    const isUuid = typeof userId === 'string' && userId.includes('-') && userId.length >= 32
    if (!isUuid) {
      // 查找学员邮箱
      const parsedId = Number(userId)
      if (Number.isNaN(parsedId)) {
        return res.status(400).json({ error: 'Invalid userId' })
      }
      const { data: authRow, error: authErr } = await supabase
        .from('authorized_users')
        .select('email,name')
        .eq('id', parsedId)
        .single()
      if (authErr) {
        console.error('Fetch authorized_users failed:', authErr?.message || authErr)
        return res.status(500).json({ error: 'Failed to resolve user email' })
      }
      if (!authRow?.email) {
        return res.status(404).json({ error: 'User not found' })
      }
      // 用邮箱在 profiles 中找到 UUID
      let { data: profileList, error: profileErr } = await supabase
        .from('profiles')
        .select('id,updated_at,created_at')
        .eq('email', authRow.email)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
      let profile = Array.isArray(profileList) ? profileList[0] : (profileList as any)
      if (profileErr) {
        console.error('Fetch profile by email failed:', profileErr?.message || profileErr)
        profile = null as any
      }
      if (!profile?.id) {
        // 尝试用 Admin API 找到 auth 用户ID
        const { data: users, error: listErr } = await supabase.auth.admin.listUsers()
        if (listErr) {
          console.error('List auth users failed:', listErr?.message || listErr)
          return res.status(500).json({ error: 'Failed to resolve auth user' })
        }
        const authUser = users?.users?.find((u: any) => u.email === authRow.email)
        let finalUser = authUser
        if (!finalUser) {
          // 若没有Auth账户，自动创建一个（随机密码，直接确认）
          const randomPwd = Math.random().toString(36).slice(-10) + 'A1!'
          const { data: created, error: createErr } = await supabase.auth.admin.createUser({
            email: authRow.email,
            password: randomPwd,
            email_confirm: true,
            user_metadata: { full_name: authRow.name || authRow.email.split('@')[0] || '' }
          })
          if (createErr) {
            console.error('Create auth user failed:', createErr?.message || createErr)
            return res.status(500).json({ error: 'Failed to create auth user' })
          }
          finalUser = created.user as any
        }
        // 补写 profiles 记录
        const { error: upsertErr } = await supabase
          .from('profiles')
          .upsert({
            id: finalUser.id,
            email: authRow.email,
            full_name: finalUser.user_metadata?.full_name || authRow.name || authRow.email.split('@')[0] || '',
            role: 'student',
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          }, { onConflict: 'id' })
        if (upsertErr) {
          console.error('Upsert profile failed:', upsertErr?.message || upsertErr)
          return res.status(500).json({ error: 'Failed to upsert profile' })
        }
        userId = finalUser.id
      } else {
        userId = profile.id as unknown as string
      }
    }

    // 删除该学员所有旧关系
    const { error: delErr } = await supabase
      .from('session_students')
      .delete()
      .eq('user_id', userId)
    if (delErr) throw delErr

    // 批量插入新关系（若为空则表示清空）
    if (sessionIds.length > 0) {
      const rows = sessionIds.map(id => ({ session_id: id, user_id: userId, status: 'active' }))
      const { error: insErr } = await supabase
        .from('session_students')
        .insert(rows)
      if (insErr) throw insErr
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error setting student sessions:', error?.message || error)
    res.status(500).json({ error: 'Failed to set student sessions', detail: error?.message || String(error) })
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

// 获取课程下的作业模板（status=template）
app.get('/api/courses/:courseId/assignment-templates', async (req, res) => {
  try {
    const { courseId } = req.params

    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', courseId)
      .eq('status', 'template')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data || [])
  } catch (error) {
    console.error('Error fetching assignment templates:', error)
    res.status(500).json({ error: 'Failed to fetch assignment templates' })
  }
})

// 创建作业模板
app.post('/api/courses/:courseId/assignment-templates', async (req, res) => {
  try {
    const { courseId } = req.params
    const { title, description, formUrl, dueDaysOffset } = req.body as { title: string; description?: string; formUrl?: string; dueDaysOffset?: number }

    const instructions = JSON.stringify({ url: formUrl || '', dueDaysOffset: dueDaysOffset ?? null })

    const { data, error } = await supabase
      .from('assignments')
      .insert({
        course_id: courseId,
        title,
        description: description || '',
        instructions,
        status: 'template'
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('Error creating assignment template:', error)
    res.status(500).json({ error: 'Failed to create assignment template' })
  }
})

// 从模板发布到一个或多个期次：在 assignments 表生成实例，并在 instructions 中记录 sessions
app.post('/api/assignment-templates/:templateId/publish', async (req, res) => {
  try {
    const { templateId } = req.params
    const { sessionIds, dueDate, formUrl, sessionUrls } = req.body as { sessionIds: string[]; dueDate?: string; formUrl?: string; sessionUrls?: Array<{ id: string; url: string }> }

    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      return res.status(400).json({ error: 'sessionIds is required' })
    }

    const { data: template, error: fetchErr } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', templateId)
      .eq('status', 'template')
      .single()

    if (fetchErr) throw fetchErr
    if (!template) return res.status(404).json({ error: 'Template not found' })

    // 解析模板中的 instructions，合并 url/元信息
    let urlFromTemplate: string | null = null
    try {
      const parsed = JSON.parse(template.instructions || '{}')
      if (parsed && typeof parsed === 'object') {
        urlFromTemplate = parsed.url || null
      }
    } catch {}

    // 生成 instructions：支持每期次单独url
    const instructionsObj: any = { url: formUrl || urlFromTemplate || '', sessions: sessionIds }
    if (Array.isArray(sessionUrls)) {
      const valid = sessionUrls
        .filter(s => s && typeof s.id === 'string' && typeof s.url === 'string' && s.url.trim() !== '')
        .map(s => ({ id: s.id, url: s.url }))
      if (valid.length > 0) {
        instructionsObj.sessionUrls = valid
      }
    }
    const instructions = JSON.stringify(instructionsObj)

    const insertPayload = {
      course_id: template.course_id,
      title: template.title,
      description: template.description || '',
      instructions,
      status: 'published',
      due_date: dueDate || null
    }

    const { data: created, error: insErr } = await supabase
      .from('assignments')
      .insert(insertPayload)
      .select()

    if (insErr) throw insErr
    res.json(created || [])
  } catch (error) {
    console.error('Error publishing from template:', error)
    res.status(500).json({ error: 'Failed to publish from template' })
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

// 学员提交/更新提交记录（前端“我已提交”或回跳打点）
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

// 飞书认证相关路由
app.post('/api/auth/feishu/callback', async (req, res) => {
  try {
    const { code } = req.body
    
    // TODO: 实现飞书 OAuth2 回调处理
    // 1. 使用 code 换取 access_token
    // 2. 获取用户信息
    // 3. 检查白名单
    // 4. 创建或更新用户配置
    
    res.json({ message: 'Feishu callback handler - TODO' })
  } catch (error) {
    console.error('Error in Feishu callback:', error)
    res.status(500).json({ error: 'Authentication failed' })
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

// 在Vercel环境中不需要listen，直接export app
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`)
    console.log(`📊 Health check: http://localhost:${PORT}/health`)
  })
}

export default app
