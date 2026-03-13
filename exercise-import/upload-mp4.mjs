import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const dir = './mp4'

const files = fs.readdirSync(dir).filter(f => f.endsWith('.mp4'))

for (const file of files) {

  const filePath = path.join(dir, file)
  const buffer = fs.readFileSync(filePath)

  console.log('enviando', file)

  const { error } = await supabase.storage
    .from('exercise-media')
    .upload(`mp4/${file}`, buffer, {
      contentType: 'video/mp4',
      upsert: true
    })

  if (error) {
    console.log('erro', error.message)
  } else {
    console.log('ok', file)
  }

}

console.log('upload finalizado')