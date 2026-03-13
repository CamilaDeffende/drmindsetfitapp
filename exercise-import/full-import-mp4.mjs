import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import fsp from 'node:fs/promises'
import path from 'node:path'
import ffmpeg from 'fluent-ffmpeg'

ffmpeg.setFfmpegPath('E:/projetos/ffmpeg-essentials_build/bin/ffmpeg.exe')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BUCKET = 'exercise-media'
const DOWNLOAD_DIR = path.resolve('./downloads-all')
const MP4_DIR = path.resolve('./mp4-all')
const LIMIT = 500

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true })
}

async function fetchExercises() {
  const url = `https://${process.env.EXERCISEDB_API_HOST}/exercises?limit=${LIMIT}`

  const res = await fetch(url, {
    headers: {
      'x-rapidapi-key': process.env.EXERCISEDB_API_KEY,
      'x-rapidapi-host': process.env.EXERCISEDB_API_HOST
    }
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Erro API: ${text}`)
  }

  return await res.json()
}

async function downloadGif(exerciseId, outputPath) {
  const url = `https://${process.env.EXERCISEDB_API_HOST}/image?exerciseId=${exerciseId}&resolution=180`

  const res = await fetch(url, {
    headers: {
      'x-rapidapi-key': process.env.EXERCISEDB_API_KEY,
      'x-rapidapi-host': process.env.EXERCISEDB_API_HOST
    }
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Erro download gif: ${text}`)
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  await fsp.writeFile(outputPath, buffer)
}

async function convertGifToMp4(inputPath, outputPath) {
  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-movflags faststart',
        '-pix_fmt yuv420p'
      ])
      .save(outputPath)
      .on('end', resolve)
      .on('error', reject)
  })
}

async function uploadMp4(filePath, storagePath) {
  const buffer = await fsp.readFile(filePath)

  const { error } = await supabase
    .storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: 'video/mp4',
      upsert: true
    })

  if (error) {
    throw new Error(error.message)
  }
}

function safeName(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function fileExists(storagePath) {
  const fileName = storagePath.split('/').pop()

  const { data, error } = await supabase
    .storage
    .from(BUCKET)
    .list('mp4', {
      search: fileName
    })

  if (error) {
    throw new Error(`Erro ao verificar arquivo existente: ${error.message}`)
  }

  return Array.isArray(data) && data.some(file => file.name === fileName)
}

async function main() {
  console.log(`Buscando até ${LIMIT} exercícios...`)

  await ensureDir(DOWNLOAD_DIR)
  await ensureDir(MP4_DIR)

  const exercises = await fetchExercises()

  for (const exercise of exercises) {
    try {
      const id = exercise.id
      const name = safeName(exercise.name)

      const gifPath = path.join(DOWNLOAD_DIR, `${id}-${name}.gif`)
      const mp4Path = path.join(MP4_DIR, `${id}-${name}.mp4`)
      const storagePath = `mp4/${id}-${name}.mp4`

      const exists = await fileExists(storagePath)

      if (exists) {
        console.log(`PULANDO ${id} - ${exercise.name} (já existe)`)
        continue
      }

      console.log(`Baixando ${id} - ${exercise.name}`)
      await downloadGif(id, gifPath)

      console.log(`Convertendo ${id} - ${exercise.name}`)
      await convertGifToMp4(gifPath, mp4Path)

      console.log(`Enviando ${id} - ${exercise.name}`)
      await uploadMp4(mp4Path, storagePath)

      console.log(`OK ${id} - ${exercise.name}`)
    } catch (err) {
      console.log(`ERRO ${exercise.name || 'desconhecido'} -> ${err.message}`)
    }
  }

  console.log('Processo finalizado.')
}

main().catch(err => {
  console.error('Erro fatal:', err.message)
})