import 'dotenv/config'

console.log('URL:', process.env.SUPABASE_URL)

try {
  const res = await fetch(process.env.SUPABASE_URL)
  console.log('status:', res.status)
  console.log('ok:', res.ok)
} catch (err) {
  console.error('erro:', err.message)
}
