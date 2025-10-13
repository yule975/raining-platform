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

// 辅助函数
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

// ========== 学生管理相关路由 ==========
app.post('/api/students/export-credentials', async (req, res) => {
  try {
    console.log('导出凭证请求:', req.body)
    const { userIds, sessionIds } = req.body as { userIds: (string|number)[]; sessionIds?: string[] }
    if (!Array.isArray(userIds) || userIds.length === 0) {
      console.error('导出凭证失败: userIds 为空或无效')
      return res.status(400).json({ error: 'userIds required' })
    }

    // 确保 userIds 转换为数字类型，支持字符串输入
    const numericUserIds = userIds.map(id => {
      const numId = typeof id === 'string' ? parseInt(id, 10) : id
      if (isNaN(numId)) {
        throw new Error(`Invalid user ID: ${id}`)
      }
      return numId
    })
    console.log('处理的用户IDs:', numericUserIds)

    const { data: users, error: usersErr } = await supabase
      .from('authorized_users')
      .select('id,email,name')
      .in('id', numericUserIds)
    
    if (usersErr) {
      console.error('查询用户失败:', usersErr)
      throw usersErr
    }
    
    console.log('查询到的用户数量:', users?.length || 0)
    if (!users || users.length === 0) {
      console.warn('未找到匹配的用户')
      return res.status(404).json({ error: '未找到匹配的用户' })
    }

    const credentials: any[] = []
    const { data: listed, error: listErr } = await supabase.auth.admin.listUsers()
    if (listErr) {
      console.error('获取认证用户列表失败:', listErr)
      throw new Error('获取认证用户列表失败: ' + listErr.message)
    }
    console.log('现有认证用户数量:', listed?.users?.length || 0)

    // 期次名称映射（如果传了期次）
    let sessionNameMap: Record<string, string> = {}
    if (Array.isArray(sessionIds) && sessionIds.length > 0) {
      console.log('查询期次信息:', sessionIds)
      const { data: sess, error: sessErr } = await supabase
        .from('training_sessions')
        .select('id,name')
        .in('id', sessionIds)
      
      if (sessErr) {
        console.error('查询期次失败:', sessErr)
      } else {
        sessionNameMap = (sess || []).reduce((acc: any, s: any) => { acc[s.id] = s.name; return acc }, {})
        console.log('期次名称映射:', sessionNameMap)
      }
    }

    const loginUrl = `${process.env.FRONTEND_URL || 'https://trae0uv01uwq-99jblfomd-yule2.vercel.app'}/login`
    console.log('登录URL:', loginUrl)

    console.log('开始为用户生成凭证...')
    for (const u of users || []) {
      try {
        const email: string = u.email
        const name: string = u.name || email.split('@')[0]
        console.log(`处理用户: ${name} (${email})`)
        
        let authUser = listed?.users?.find((x: any) => x.email === email)
        const pwd = generateStrongPassword()
        
        if (!authUser) {
          console.log(`创建新认证用户: ${email}`)
          const { data: created, error: cErr } = await supabase.auth.admin.createUser({
            email,
            password: pwd,
            email_confirm: true,
            user_metadata: { full_name: name, must_change_password: true }
          })
          if (cErr) {
            console.error(`创建用户失败 ${email}:`, cErr)
            throw new Error(`创建用户失败 ${email}: ${cErr.message}`)
          }
          authUser = created.user
          console.log(`用户创建成功: ${email}`)
        } else {
          console.log(`更新现有用户密码: ${email}`)
          const { error: uErr } = await supabase.auth.admin.updateUserById(authUser.id, {
            password: pwd,
            user_metadata: { ...(authUser.user_metadata || {}), must_change_password: true }
          })
          if (uErr) {
            console.error(`更新用户密码失败 ${email}:`, uErr)
            throw new Error(`更新用户密码失败 ${email}: ${uErr.message}`)
          }
          console.log(`用户密码更新成功: ${email}`)
        }
        
        const credential = {
          name,
          email,
          initial_password: pwd,
          assigned_sessions: (sessionIds || []).join(';'),
          assigned_session_names: (sessionIds || []).map(id => sessionNameMap[id] || id).join(';'),
          login_url: loginUrl
        }
        credentials.push(credential)
        console.log(`凭证生成成功: ${email}`)
        
        // 可选：分配期次
        if (Array.isArray(sessionIds) && sessionIds.length > 0) {
          try {
            console.log(`为用户 ${email} 分配期次: ${sessionIds.join(', ')}`)
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
              console.log(`期次分配成功: ${email}`)
            } else {
              console.warn(`未找到用户profile: ${email}`)
            }
          } catch (sessionError) {
            console.error(`为用户 ${email} 分配期次失败:`, sessionError)
            // 不抛出错误，因为凭证已经生成成功
          }
        }
      } catch (error) {
        console.error(`处理用户 ${u.email} 时出错:`, error)
        // 继续处理其他用户，但记录错误
        throw error
      }
    }

    console.log(`完成凭证生成，共 ${credentials.length} 个凭证`)
    
    // 验证是否有凭证生成
    if (credentials.length === 0) {
      console.warn('警告：未生成任何凭证')
      return res.status(400).json({ error: '未能生成任何用户凭证' })
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
    
    console.log('CSV生成成功，字节数:', csv.length)
    console.log('CSV前100个字符:', csv.substring(0, 100))
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="credentials.csv"')
    return res.status(200).send(csv)
  } catch (error: any) {
    console.error('导出凭证失败:', error?.message || error)
    console.error('错误详情:', error)
    return res.status(500).json({ 
      error: '导出凭证失败', 
      details: error?.message || '未知错误',
      timestamp: new Date().toISOString()
    })
  }
})

app.put('/api/students/:userId/sessions', async (req, res) => {
  try {
    let { userId } = req.params
    const { sessionIds } = req.body as { sessionIds: string[] }

    console.log(`🔧 [后端] 设置学员期次开始: userId=${userId}, sessionIds=[${sessionIds.join(',')}]`)
    console.log(`🔧 [后端] 请求体详情:`, req.body)
    console.log(`🔧 [后端] userId类型:`, typeof userId, `长度:`, userId.length)

    if (!Array.isArray(sessionIds)) {
      console.error(`🔧 [后端] sessionIds不是数组:`, typeof sessionIds, sessionIds)
      return res.status(400).json({ error: 'sessionIds should be an array' })
    }

    let finalUserId = userId
    
    // 兼容：如果传入的是 authorized_users 的数字主键，需换取 profiles/auth 的 UUID
    const isUuid = typeof userId === 'string' && userId.includes('-') && userId.length >= 32
    if (!isUuid) {
      console.log(`开始ID转换流程: 数字ID=${userId}`)
      
      // 查找学员邮箱
      const parsedId = Number(userId)
      if (Number.isNaN(parsedId)) {
        console.error('Invalid userId: not a number')
        return res.status(400).json({ error: 'Invalid userId: must be a number or UUID' })
      }
      
      const { data: authRow, error: authErr } = await supabase
        .from('authorized_users')
        .select('email,name')
        .eq('id', parsedId)
        .single()
        
      if (authErr) {
        console.error('🔧 [后端] Fetch authorized_users failed:', authErr?.message || authErr)
        console.error('🔧 [后端] Error details:', authErr)
        return res.status(500).json({ error: 'Failed to find user in authorized_users', detail: authErr.message })
      }
      
      if (!authRow?.email) {
        console.error('🔧 [后端] User not found in authorized_users, parsedId:', parsedId)
        return res.status(404).json({ error: 'User not found in authorized_users' })
      }
      
      console.log(`找到授权用户: email=${authRow.email}, name=${authRow.name}`)
      
      // 用邮箱在 profiles 中找到 UUID
      const { data: profileList, error: profileErr } = await supabase
        .from('profiles')
        .select('id,email,full_name,updated_at,created_at')
        .eq('email', authRow.email)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        
      let profile = Array.isArray(profileList) ? profileList[0] : (profileList as any)
      
      if (profileErr) {
        console.error('Fetch profile by email failed:', profileErr?.message || profileErr)
        profile = null
      }
      
      if (!profile?.id) {
        console.log(`用户未注册或无profile记录，尝试创建: email=${authRow.email}`)
        
        // 尝试用 Admin API 找到 auth 用户
        let authUser = null
        try {
          const { data: users, error: listErr } = await supabase.auth.admin.listUsers()
          if (listErr) {
            console.error('List auth users failed:', listErr?.message || listErr)
          } else {
            authUser = users?.users?.find((u: any) => u.email === authRow.email)
            console.log(`在auth.users中${authUser ? '找到' : '未找到'}用户: ${authRow.email}`)
          }
        } catch (listError) {
          console.error('Error listing auth users:', listError)
        }
        
        if (!authUser) {
          // 创建新的Auth用户
          try {
            const randomPwd = Math.random().toString(36).slice(-10) + 'A1!'
            console.log(`创建新的Auth用户: email=${authRow.email}`)
            
            const { data: created, error: createErr } = await supabase.auth.admin.createUser({
              email: authRow.email,
              password: randomPwd,
              email_confirm: true,
              user_metadata: { full_name: authRow.name || authRow.email.split('@')[0] || '' }
            })
            
            if (createErr) {
              console.error('Create auth user failed:', createErr?.message || createErr)
              return res.status(500).json({ error: 'Failed to create auth user', detail: createErr.message })
            }
            
            authUser = created.user
            console.log(`Auth用户创建成功: id=${authUser?.id}`)
          } catch (createError) {
            console.error('Error creating auth user:', createError)
            return res.status(500).json({ error: 'Failed to create auth user', detail: String(createError) })
          }
        }
        
        if (authUser) {
          // 创建或更新 profiles 记录
          try {
            console.log(`创建/更新profile记录: id=${authUser.id}, email=${authRow.email}`)
            
            const { error: upsertErr } = await supabase
              .from('profiles')
              .upsert({
                id: authUser.id,
                email: authRow.email,
                full_name: authUser.user_metadata?.full_name || authRow.name || authRow.email.split('@')[0] || '',
                role: 'student',
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString()
              }, { onConflict: 'id' })
              
            if (upsertErr) {
              console.error('Upsert profile failed:', upsertErr?.message || upsertErr)
              return res.status(500).json({ error: 'Failed to create profile', detail: upsertErr.message })
            }
            
            finalUserId = authUser.id
            console.log(`Profile创建成功，最终userId=${finalUserId}`)
          } catch (upsertError) {
            console.error('Error upserting profile:', upsertError)
            return res.status(500).json({ error: 'Failed to create profile', detail: String(upsertError) })
          }
        } else {
          console.error('无法获取或创建Auth用户')
          return res.status(500).json({ error: 'Failed to resolve or create auth user' })
        }
      } else {
        finalUserId = profile.id
        console.log(`找到现有profile: id=${finalUserId}, email=${profile.email}`)
      }
    } else {
      console.log(`已经是UUID格式: ${userId}`)
      finalUserId = userId
    }

    console.log(`开始操作session_students表: finalUserId=${finalUserId}`)

    // 删除该学员所有旧关系
    const { error: delErr } = await supabase
      .from('session_students')
      .delete()
      .eq('user_id', finalUserId)
      
    if (delErr) {
      console.error('删除旧期次关系失败:', delErr?.message || delErr)
      throw delErr
    }
    
    console.log(`删除旧期次关系成功`)

    // 批量插入新关系（若为空则表示清空）
    if (sessionIds.length > 0) {
      const rows = sessionIds.map(id => ({ session_id: id, user_id: finalUserId, status: 'active' }))
      console.log(`准备插入${rows.length}个新期次关系`)
      
      const { error: insErr } = await supabase
        .from('session_students')
        .insert(rows)
        
      if (insErr) {
        console.error('插入新期次关系失败:', insErr?.message || insErr)
        throw insErr
      }
      
      console.log(`插入新期次关系成功`)
    } else {
      console.log(`sessionIds为空，仅清空期次关系`)
    }

    console.log(`设置学员期次成功: userId=${finalUserId}`)
    res.json({ success: true })
  } catch (error: any) {
    console.error('🔧 [后端] Error setting student sessions:', error?.message || error)
    console.error('🔧 [后端] Error stack:', error?.stack)
    console.error('🔧 [后端] Full error object:', error)
    res.status(500).json({ 
      error: 'Failed to set student sessions', 
      detail: error?.message || String(error),
      userId: req.params.userId,
      timestamp: new Date().toISOString()
    })
  }
})

// ========== 授权用户管理相关路由 ==========
app.patch('/api/authorized-users/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body as { name?: string; email?: string; status?: 'active' | 'inactive' }

    console.log('🔧 [后端] 更新授权用户:', { id, updates })

    // 转换ID为数字
    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) {
      console.error('🔧 [后端] 无效的用户ID:', id)
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    // 检查邮箱是否已存在（如果要更新邮箱）
    if (updates.email) {
      const { data: existing, error: checkErr } = await supabase
        .from('authorized_users')
        .select('id')
        .eq('email', updates.email)
        .neq('id', numericId)
        .single()

      if (!checkErr && existing) {
        console.error('🔧 [后端] 邮箱已存在:', updates.email)
        return res.status(409).json({ error: '该邮箱已存在' })
      }
    }

    // 更新用户信息
    const { data: updatedUser, error: updateErr } = await supabase
      .from('authorized_users')
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.email && { email: updates.email }),
        ...(updates.status && { status: updates.status }),
        updated_at: new Date().toISOString()
      })
      .eq('id', numericId)
      .select('*')
      .single()

    if (updateErr) {
      console.error('🔧 [后端] 更新用户失败:', updateErr)
      throw updateErr
    }

    if (!updatedUser) {
      console.error('🔧 [后端] 用户不存在:', numericId)
      return res.status(404).json({ error: '用户不存在' })
    }

    console.log('🔧 [后端] 用户更新成功:', updatedUser)
    res.json(updatedUser)
  } catch (error: any) {
    console.error('🔧 [后端] 更新授权用户失败:', error?.message || error)
    res.status(500).json({ 
      error: '更新失败', 
      detail: error?.message || String(error),
      timestamp: new Date().toISOString()
    })
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
