import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs/promises'
import path from 'node:path'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BUCKET = 'exercise-media'
const DOWNLOAD_DIR = path.resolve('./downloads')
const EXERCISE_IDS = ['0001', '0002', '0003']

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function fetchGifBuffer(id) {
  const url = `https://${process.env.EXERCISEDB_API_HOST}/image?exerciseId=${id}&resolution=180`

  const res = await fetch(url, {
    headers: {
      'x-rapidapi-key': process.env.EXERCISEDB_API_KEY,
      'x-rapidapi-host': process.env.EXERCISEDB_API_HOST
    }
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Erro ${res.status} ao baixar ${id}: ${text}`)
  }

  return Buffer.from(await res.arrayBuffer())
}

async function upload(filePath, storagePath) {
  const buffer = await fs.readFile(filePath)

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: 'image/gif',
      upsert: true
    })

  if (error) {
    throw new Error(`Upload falhou: ${error.message}`)
  }

  return data
}

async function main() {
  console.log('Iniciando importação de exercícios...')

  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'ok' : 'não encontrada')
  console.log('SERVICE_ROLE:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'ok' : 'não encontrada')

  await ensureDir(DOWNLOAD_DIR)

  for (const id of EXERCISE_IDS) {
    try {
      console.log(`Baixando exercício ${id}...`)
      const buffer = await fetchGifBuffer(id)

      const localFile = path.join(DOWNLOAD_DIR, `${id}.gif`)
      await fs.writeFile(localFile, buffer)

      console.log(`Enviando exercício ${id} para Supabase...`)
      await upload(localFile, `gifs/${id}.gif`)

      console.log(`✔ Exercício ${id} concluído`)
    } catch (err) {
      console.error(`❌ Erro no exercício ${id}: ${err.message}`)
    }
  }

  console.log('Importação finalizada.')
}

main().catch((err) => {
  console.error('Erro fatal:', err)
})