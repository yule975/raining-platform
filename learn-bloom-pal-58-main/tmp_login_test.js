// 临时脚本：测试管理员账号登录
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const url = process.env.VITE_SUPABASE_URL
const anon = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !anon) {
  console.error('缺少环境变量 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(url, anon)

const email = 'xiewenxuan001@51Talk.com'
const password = 'Admin123456!'

async function main() {
  console.log('尝试登录:', email)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    console.error('登录失败:', error.message)
    process.exit(2)
  }
  console.log('登录成功, 用户:', data.user?.email)
  const { data: profile, error: pErr } = await supabase.from('profiles').select('id, email, role').eq('id', data.user.id).single()
  if (pErr) {
    console.error('读取profile失败:', pErr.message)
  } else {
    console.log('Profile:', profile)
  }
  await supabase.auth.signOut()
}

main().catch(e => { console.error('异常:', e); process.exit(3) })