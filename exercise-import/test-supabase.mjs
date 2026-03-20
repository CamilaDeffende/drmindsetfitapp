import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const buffer = Buffer.from('teste simples')

const { data, error } = await supabase.storage
  .from('exercise-media')
  .upload('testes/teste.txt', buffer, {
    contentType: 'text/plain',
    upsert: true
  })

console.log({ data, error })