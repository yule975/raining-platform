// Minimal Vercel Node serverless API in plain JS to avoid TS export issues
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const { createClient } = require('@supabase/supabase-js')

const app = express()
app.use(helmet())
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() })
})

// Training sessions (minimal)
app.get('/api/training-sessions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json(data || [])
  } catch (e) {
    console.error('training-sessions error:', e)
    res.status(500).json({ error: 'Failed to fetch training sessions' })
  }
})

// Update authorized user basic info
app.patch('/api/authorized-users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid user ID' })
    const updates = {}
    if (typeof req.body.name === 'string') updates.name = req.body.name
    if (typeof req.body.email === 'string') updates.email = req.body.email
    if (req.body.status === 'active' || req.body.status === 'inactive') updates.status = req.body.status

    if (updates.email) {
      const { data: existing } = await supabase
        .from('authorized_users')
        .select('id')
        .eq('email', updates.email)
        .neq('id', id)
        .single()
      if (existing) return res.status(409).json({ error: '该邮箱已存在' })
    }

    const { data, error } = await supabase
      .from('authorized_users')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: '用户不存在' })
    res.json(data)
  } catch (e) {
    console.error('update authorized user error:', e)
    res.status(500).json({ error: '更新失败', detail: e.message || String(e) })
  }
})

// Set student sessions (number id -> uuid mapping)
app.put('/api/students/:userId/sessions', async (req, res) => {
  try {
    let { userId } = req.params
    const sessionIds = Array.isArray(req.body.sessionIds) ? req.body.sessionIds : []
    let finalUserId = userId
    const isUuid = typeof userId === 'string' && userId.includes('-') && userId.length >= 32
    if (!isUuid) {
      const parsed = Number(userId)
      if (Number.isNaN(parsed)) return res.status(400).json({ error: 'Invalid userId' })
      const { data: authRow, error: authErr } = await supabase
        .from('authorized_users')
        .select('email,name')
        .eq('id', parsed)
        .single()
      if (authErr || !authRow?.email) return res.status(404).json({ error: 'User not found in authorized_users' })
      const { data: profileList } = await supabase
        .from('profiles')
        .select('id,email')
        .eq('email', authRow.email)
        .limit(1)
      const profile = Array.isArray(profileList) ? profileList[0] : profileList
      if (profile?.id) {
        finalUserId = profile.id
      } else {
        const { data: listed } = await supabase.auth.admin.listUsers()
        let authUser = listed?.users?.find(u => u.email === authRow.email)
        if (!authUser) {
          const { data: created, error: cErr } = await supabase.auth.admin.createUser({
            email: authRow.email,
            password: Math.random().toString(36).slice(-10) + 'Aa1!',
            email_confirm: true,
            user_metadata: { full_name: authRow.name || authRow.email.split('@')[0] || '' }
          })
          if (cErr) return res.status(500).json({ error: 'Failed to create auth user', detail: cErr.message })
          authUser = created.user
        }
        await supabase.from('profiles').upsert({
          id: authUser.id,
          email: authRow.email,
          full_name: authRow.name || authRow.email.split('@')[0] || '',
          role: 'student',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        finalUserId = authUser.id
      }
    }
    await supabase.from('session_students').delete().eq('user_id', finalUserId)
    if (sessionIds.length > 0) {
      const rows = sessionIds.map(id => ({ session_id: id, user_id: finalUserId, status: 'active' }))
      const { error: insErr } = await supabase.from('session_students').insert(rows)
      if (insErr) throw insErr
    }
    res.json({ success: true })
  } catch (e) {
    console.error('set sessions error:', e)
    res.status(500).json({ error: 'Failed to set student sessions', detail: e.message || String(e) })
  }
})

module.exports = app


