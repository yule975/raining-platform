// Vercel Serverless Function - 纯JS版本避免TS导出问题
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const { createClient } = require('@supabase/supabase-js')

const app = express()

// Supabase配置
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// 中间件
app.use(helmet())
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ========== 健康检查 ==========
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ========== 课程管理 ==========
app.get('/api/courses', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json(data || [])
  } catch (e) {
    console.error('courses error:', e)
    res.status(500).json({ error: 'Failed to fetch courses' })
  }
})

app.get('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    res.json(data)
  } catch (e) {
    console.error('get course error:', e)
    res.status(500).json({ error: 'Failed to fetch course' })
  }
})

app.post('/api/courses', async (req, res) => {
  try {
    const { title, description, cover_url, video_url, duration, instructor } = req.body
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .insert({ title, description, cover_url, video_url, duration, instructor })
      .select()
      .single()
    if (courseError) throw courseError
    
    // 自动关联到当前期次
    try {
      const { data: currentSession } = await supabase
        .from('training_sessions')
        .select('id, name')
        .eq('is_current', true)
        .eq('status', 'active')
        .single()
      if (currentSession) {
        await supabase.from('session_courses').insert({
          session_id: currentSession.id,
          course_id: courseData.id,
          is_active: true,
          added_at: new Date().toISOString()
        })
      }
    } catch {}
    
    res.status(201).json(courseData)
  } catch (e) {
    console.error('create course error:', e)
    res.status(500).json({ error: 'Failed to create course' })
  }
})

app.patch('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, cover_url, video_url, duration, instructor } = req.body
    const { data, error } = await supabase
      .from('courses')
      .update({
        title,
        description,
        cover_url,
        video_url,
        duration,
        instructor,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch (e) {
    console.error('update course error:', e)
    res.status(500).json({ error: 'Failed to update course' })
  }
})

app.delete('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // 删除关联的作业
    await supabase.from('assignments').delete().eq('course_id', id)
    
    // 删除课程材料
    await supabase.from('course_materials').delete().eq('course_id', id)
    
    // 删除课程
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) throw error
    
    res.json({ success: true })
  } catch (e) {
    console.error('delete course error:', e)
    res.status(500).json({ error: 'Failed to delete course' })
  }
})

app.get('/api/courses/:id/materials', async (req, res) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('course_materials')
      .select('*')
      .eq('course_id', id)
    if (error) throw error
    res.json(data || [])
  } catch (e) {
    console.error('get materials error:', e)
    res.status(500).json({ error: 'Failed to fetch materials' })
  }
})

app.put('/api/courses/:id/materials', async (req, res) => {
  try {
    const { id } = req.params
    const { materials } = req.body
    
    // 删除旧材料
    await supabase.from('course_materials').delete().eq('course_id', id)
    
    // 插入新材料
    if (materials && materials.length > 0) {
      const rows = materials.map(m => ({
        course_id: id,
        file_name: m.name || '',
        file_type: m.type || 'other',
        file_size: m.size || '',
        file_url: m.downloadUrl || ''
      }))
      const { error } = await supabase.from('course_materials').insert(rows)
      if (error) throw error
    }
    
    res.json({ success: true })
  } catch (e) {
    console.error('set materials error:', e)
    res.status(500).json({ error: 'Failed to set materials' })
  }
})

// ========== 期次管理 ==========
app.get('/api/training-sessions', async (req, res) => {
  try {
    const { data: sessions, error } = await supabase
      .from('training_sessions')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    
    const sessionsWithCount = await Promise.all((sessions || []).map(async (session) => {
      try {
        const { count } = await supabase
          .from('session_students')
          .select('*', { count: 'exact' })
          .eq('session_id', session.id)
        return { ...session, student_count: count || 0 }
      } catch {
        return { ...session, student_count: 0 }
      }
    }))
    
    res.json(sessionsWithCount)
  } catch (e) {
    console.error('training-sessions error:', e)
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
      if (error.code === 'PGRST116') return res.json(null)
      throw error
    }
    res.json(data)
  } catch (e) {
    console.error('current session error:', e)
    res.status(500).json({ error: 'Failed to fetch current session' })
  }
})

app.get('/api/training-sessions/:id/courses', async (req, res) => {
  try {
    const { id } = req.params
    const { data: relations, error: relErr } = await supabase
      .from('session_courses')
      .select('course_id')
      .eq('session_id', id)
    if (relErr) throw relErr
    
    const courseIds = (relations || []).map(r => r.course_id)
    if (courseIds.length === 0) return res.json([])
    
    const { data: courses, error: courseErr } = await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds)
      .order('created_at', { ascending: false })
    if (courseErr) throw courseErr
    
    res.json(courses || [])
  } catch (e) {
    console.error('session courses error:', e)
    res.status(500).json({ error: 'Failed to fetch session courses' })
  }
})

app.get('/api/sessions/:sessionId/members/:userId/exists', async (req, res) => {
  try {
    const { sessionId, userId } = req.params
    const { data, error } = await supabase
      .from('session_students')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()
    res.json({ isMember: !!data && !error })
  } catch {
    res.json({ isMember: false })
  }
})

// ========== 作业管理 ==========
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
      console.error('Error fetching assignments:', error?.message || error)
      return res.json([])
    }
    return res.json(data || [])
  } catch (error) {
    console.error('Error fetching assignments:', error?.message || error)
    return res.json([])
  }
})

app.get('/api/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    res.json(data)
  } catch (e) {
    console.error('get assignment error:', e)
    res.status(500).json({ error: 'Failed to fetch assignment' })
  }
})

app.post('/api/assignments', async (req, res) => {
  try {
    const assignmentData = req.body
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        course_id: assignmentData.course_id,
        title: assignmentData.title,
        description: assignmentData.description,
        assignment_type: assignmentData.assignment_type || 'general',
        due_date: assignmentData.due_date,
        max_score: assignmentData.max_score || 100,
        allow_file_upload: assignmentData.allow_file_upload || true,
        allowed_file_types: assignmentData.allowed_file_types || 'pdf,jpg,png,zip',
        max_file_size_mb: assignmentData.max_file_size_mb || 10,
        instructions: assignmentData.instructions || '',
        requirements: assignmentData.requirements || [],
        is_active: assignmentData.is_active !== false,
        created_at: now,
        updated_at: now
      })
      .select()
      .single()
    if (error) throw error
    res.status(201).json(data)
  } catch (e) {
    console.error('create assignment error:', e)
    res.status(500).json({ error: 'Failed to create assignment' })
  }
})

app.patch('/api/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    const now = new Date().toISOString()
    
    const updateData = { updated_at: now }
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.assignment_type !== undefined) updateData.assignment_type = updates.assignment_type
    if (updates.due_date !== undefined) updateData.due_date = updates.due_date
    if (updates.max_score !== undefined) updateData.max_score = updates.max_score
    if (updates.allow_file_upload !== undefined) updateData.allow_file_upload = updates.allow_file_upload
    if (updates.allowed_file_types !== undefined) updateData.allowed_file_types = updates.allowed_file_types
    if (updates.max_file_size_mb !== undefined) updateData.max_file_size_mb = updates.max_file_size_mb
    if (updates.instructions !== undefined) updateData.instructions = updates.instructions
    if (updates.requirements !== undefined) updateData.requirements = updates.requirements
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active
    
    const { data, error } = await supabase
      .from('assignments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch (e) {
    console.error('update assignment error:', e)
    res.status(500).json({ error: 'Failed to update assignment' })
  }
})

app.delete('/api/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { error } = await supabase.from('assignments').delete().eq('id', id)
    if (error) throw error
    res.json({ success: true })
  } catch (e) {
    console.error('delete assignment error:', e)
    res.status(500).json({ error: 'Failed to delete assignment' })
  }
})

app.get('/api/assignments/:assignmentId/submissions', async (req, res) => {
  try {
    const { assignmentId } = req.params
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        profiles!submissions_student_id_fkey(id, email, full_name)
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false })
    if (error) throw error
    
    const formatted = (data || []).map(s => ({
      ...s,
      student: {
        id: s.profiles?.id || s.student_id,
        name: s.profiles?.full_name || 'Unknown',
        email: s.profiles?.email || ''
      }
    }))
    res.json(formatted)
  } catch (e) {
    console.error('submissions error:', e)
    res.status(500).json({ error: 'Failed to fetch submissions' })
  }
})

app.get('/api/assignments/:assignmentId/submissions/:studentId', async (req, res) => {
  try {
    const { assignmentId, studentId } = req.params
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Not found' })
      throw error
    }
    res.json(data)
  } catch (e) {
    console.error('submission error:', e)
    res.status(500).json({ error: 'Failed to fetch submission' })
  }
})

app.post('/api/assignments/:assignmentId/submissions', async (req, res) => {
  try {
    const { assignmentId } = req.params
    const { studentId, content, fileUrl } = req.body
    const now = new Date().toISOString()
    
    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .single()
    
    if (existing) {
      const { data, error } = await supabase
        .from('submissions')
        .update({ content, file_url: fileUrl, submitted_at: now, updated_at: now })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return res.json(data)
    } else {
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          assignment_id: assignmentId,
          student_id: studentId,
          content,
          file_url: fileUrl,
          submitted_at: now,
          created_at: now,
          updated_at: now
        })
        .select()
        .single()
      if (error) throw error
      return res.json(data)
    }
  } catch (e) {
    console.error('submit error:', e)
    res.status(500).json({ error: 'Failed to submit assignment' })
  }
})

// 获取学生的所有提交记录
app.get('/api/students/:studentId/submissions', async (req, res) => {
  try {
    const { studentId } = req.params
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        assignments:assignment_id(title, course_id)
      `)
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false })
    
    if (error) throw error
    res.json(data || [])
  } catch (e) {
    console.error('student submissions error:', e)
    res.status(500).json({ error: 'Failed to fetch student submissions' })
  }
})

// ========== 辅助函数 ==========
function generateStrongPassword(length = 12) {
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

async function ensureProfileByEmail(email, name) {
  try {
    const { data: profileList } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
    const profile = Array.isArray(profileList) ? profileList[0] : profileList
    if (!profile?.id) {
      const { data: users } = await supabase.auth.admin.listUsers()
      const found = users?.users?.find(u => u.email === email)
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

// ========== 学生凭证导出 ==========
app.post('/api/students/export-credentials', async (req, res) => {
  try {
    console.log('导出凭证请求:', req.body)
    const { userIds, sessionIds } = req.body
    if (!Array.isArray(userIds) || userIds.length === 0) {
      console.error('导出凭证失败: userIds 为空或无效')
      return res.status(400).json({ error: 'userIds required' })
    }

    const numericUserIds = userIds.map(id => {
      const numId = typeof id === 'string' ? parseInt(id, 10) : id
      if (isNaN(numId)) throw new Error(`Invalid user ID: ${id}`)
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

    const credentials = []
    const { data: listed, error: listErr } = await supabase.auth.admin.listUsers()
    if (listErr) {
      console.error('获取认证用户列表失败:', listErr)
      throw new Error('获取认证用户列表失败: ' + listErr.message)
    }
    console.log('现有认证用户数量:', listed?.users?.length || 0)

    let sessionNameMap = {}
    if (Array.isArray(sessionIds) && sessionIds.length > 0) {
      console.log('查询期次信息:', sessionIds)
      const { data: sess, error: sessErr } = await supabase
        .from('training_sessions')
        .select('id,name')
        .in('id', sessionIds)
      
      if (sessErr) {
        console.error('查询期次失败:', sessErr)
      } else {
        sessionNameMap = (sess || []).reduce((acc, s) => { acc[s.id] = s.name; return acc }, {})
        console.log('期次名称映射:', sessionNameMap)
      }
    }

    const loginUrl = `${process.env.FRONTEND_URL || 'https://trae0uv01uwq-99jblfomd-yule2.vercel.app'}/login`
    console.log('登录URL:', loginUrl)

    console.log('开始为用户生成凭证...')
    for (const u of users || []) {
      try {
        const email = u.email
        const name = u.name || email.split('@')[0]
        console.log(`处理用户: ${name} (${email})`)
        
        let authUser = listed?.users?.find(x => x.email === email)
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
            const profile = Array.isArray(profileList) ? profileList[0] : profileList
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
          }
        }
      } catch (error) {
        console.error(`处理用户 ${u.email} 时出错:`, error)
        throw error
      }
    }

    console.log(`完成凭证生成，共 ${credentials.length} 个凭证`)
    
    if (credentials.length === 0) {
      console.warn('警告：未生成任何凭证')
      return res.status(400).json({ error: '未能生成任何用户凭证' })
    }

    const headers = ['name','email','initial_password','assigned_sessions','assigned_session_names','login_url']
    const escape = (v) => {
      const s = (v ?? '').toString()
      if (s.includes('"') || s.includes(',') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }
    const rows = [headers.join(',')].concat(
      credentials.map(r => [
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
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="credentials.csv"')
    return res.status(200).send(csv)
  } catch (error) {
    console.error('导出凭证失败:', error?.message || error)
    console.error('错误详情:', error)
    return res.status(500).json({ 
      error: '导出凭证失败', 
      details: error?.message || '未知错误',
      timestamp: new Date().toISOString()
    })
  }
})

// ========== 学生期次管理 ==========
app.put('/api/students/:userId/sessions', async (req, res) => {
  try {
    let { userId } = req.params
    const { sessionIds } = req.body
    
    console.log(`🔧 [后端] 设置学员期次开始: userId=${userId}, sessionIds=[${sessionIds.join(',')}]`)
    
    if (!Array.isArray(sessionIds)) {
      console.error(`🔧 [后端] sessionIds不是数组:`, typeof sessionIds, sessionIds)
      return res.status(400).json({ error: 'sessionIds should be an array' })
    }

    let finalUserId = userId
    
    const isUuid = typeof userId === 'string' && userId.includes('-') && userId.length >= 32
    if (!isUuid) {
      console.log(`开始ID转换流程: 数字ID=${userId}`)
      
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
        return res.status(500).json({ error: 'Failed to find user in authorized_users', detail: authErr.message })
      }
      
      if (!authRow?.email) {
        console.error('🔧 [后端] User not found in authorized_users, parsedId:', parsedId)
        return res.status(404).json({ error: 'User not found in authorized_users' })
      }
      
      console.log(`找到授权用户: email=${authRow.email}, name=${authRow.name}`)
      
      const { data: profileList, error: profileErr } = await supabase
        .from('profiles')
        .select('id,email,full_name,updated_at,created_at')
        .eq('email', authRow.email)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        
      let profile = Array.isArray(profileList) ? profileList[0] : profileList
      
      if (profileErr) {
        console.error('Fetch profile by email failed:', profileErr?.message || profileErr)
        profile = null
      }
      
      if (!profile?.id) {
        console.log(`用户未注册或无profile记录，尝试创建: email=${authRow.email}`)
        
        let authUser = null
        try {
          const { data: users, error: listErr } = await supabase.auth.admin.listUsers()
          if (listErr) {
            console.error('List auth users failed:', listErr?.message || listErr)
          } else {
            authUser = users?.users?.find(u => u.email === authRow.email)
            console.log(`在auth.users中${authUser ? '找到' : '未找到'}用户: ${authRow.email}`)
          }
        } catch (listError) {
          console.error('Error listing auth users:', listError)
        }
        
        if (!authUser) {
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

    const { error: delErr } = await supabase
      .from('session_students')
      .delete()
      .eq('user_id', finalUserId)
      
    if (delErr) {
      console.error('删除旧期次关系失败:', delErr?.message || delErr)
      throw delErr
    }
    
    console.log(`删除旧期次关系成功`)

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
  } catch (error) {
    console.error('🔧 [后端] Error setting student sessions:', error?.message || error)
    console.error('🔧 [后端] Error stack:', error?.stack)
    res.status(500).json({ 
      error: 'Failed to set student sessions', 
      detail: error?.message || String(error),
      userId: req.params.userId,
      timestamp: new Date().toISOString()
    })
  }
})

// ========== 授权用户管理 ==========
app.get('/api/authorized-users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('authorized_users')
      .select('*')
      .eq('role', 'student')
      .order('added_at', { ascending: false })
    if (error) throw error
    res.json(data || [])
  } catch (e) {
    console.error('get authorized users error:', e)
    res.status(500).json({ error: 'Failed to fetch authorized users' })
  }
})

app.post('/api/authorized-users', async (req, res) => {
  try {
    const { name, email } = req.body
    const { data, error } = await supabase
      .from('authorized_users')
      .insert({ name, email, status: 'active' })
      .select()
      .single()
    if (error) throw error
    res.status(201).json(data)
  } catch (e) {
    console.error('add authorized user error:', e)
    res.status(500).json({ error: 'Failed to add authorized user' })
  }
})

app.delete('/api/authorized-users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' })
    }
    const { error } = await supabase
      .from('authorized_users')
      .delete()
      .eq('id', id)
    if (error) throw error
    res.json({ success: true })
  } catch (e) {
    console.error('delete authorized user error:', e)
    res.status(500).json({ error: 'Failed to delete authorized user' })
  }
})

app.patch('/api/authorized-users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const updates = req.body
    
    console.log('🔧 [后端] 更新授权用户:', { id, updates })
    
    if (isNaN(id)) {
      console.error('🔧 [后端] 无效的用户ID:', req.params.id)
      return res.status(400).json({ error: 'Invalid user ID' })
    }
    
    if (updates.email) {
      const { data: existing, error: checkErr } = await supabase
        .from('authorized_users')
        .select('id')
        .eq('email', updates.email)
        .neq('id', id)
        .single()
      
      if (!checkErr && existing) {
        console.error('🔧 [后端] 邮箱已存在:', updates.email)
        return res.status(409).json({ error: '邮箱已存在' })
      }
    }
    
    const { data: updatedUser, error: updateErr } = await supabase
      .from('authorized_users')
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.email && { email: updates.email }),
        ...(updates.status && { status: updates.status })
      })
      .eq('id', id)
      .select('*')
      .single()
    
    if (updateErr) {
      console.error('🔧 [后端] 更新失败:', updateErr)
      throw updateErr
    }
    
    console.log('🔧 [后端] 更新成功:', updatedUser.email)
    res.json(updatedUser)
  } catch (error) {
    console.error('🔧 [后端] 更新授权用户异常:', error)
    res.status(500).json({ 
      error: 'Failed to update user',
      detail: error?.message || String(error)
    })
  }
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// 导出为Vercel Serverless Function
module.exports = app
