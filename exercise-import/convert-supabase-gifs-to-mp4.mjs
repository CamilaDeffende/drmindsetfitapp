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
const GIF_FOLDER = 'gifs'
const MP4_FOLDER = 'mp4'

const TEMP_GIF_DIR = path.resolve('./temp-gifs')
const TEMP_MP4_DIR = path.resolve('./temp-mp4')

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true })
}

async function listAllGifs() {
  const allFiles = []
  let offset = 0
  const limit = 100

  while (true) {
    const { data, error } = await supabase
      .storage
      .from(BUCKET)
      .list(GIF_FOLDER, {
        limit,
        offset,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) {
      throw new Error(`Erro ao listar gifs: ${error.message}`)
    }

    if (!data || data.length === 0) break

    const gifs = data.filter(file => file.name.toLowerCase().endsWith('.gif'))
    allFiles.push(...gifs)

    if (data.length < limit) break
    offset += limit
  }

  return allFiles
}

async function mp4AlreadyExists(mp4FileName) {
  const { data, error } = await supabase
    .storage
    .from(BUCKET)
    .list(MP4_FOLDER, {
      search: mp4FileName
    })

  if (error) {
    throw new Error(`Erro ao verificar mp4 existente: ${error.message}`)
  }

  return Array.isArray(data) && data.some(file => file.name === mp4FileName)
}

async function downloadGifFromSupabase(fileName, localPath) {
  const { data, error } = await supabase
    .storage
    .from(BUCKET)
    .download(`${GIF_FOLDER}/${fileName}`)

  if (error) {
    throw new Error(`Erro ao baixar gif ${fileName}: ${error.message}`)
  }

  const arrayBuffer = await data.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  await fsp.writeFile(localPath, buffer)
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

async function uploadMp4ToSupabase(localPath, mp4FileName) {
  const buffer = await fsp.readFile(localPath)

  const { error } = await supabase
    .storage
    .from(BUCKET)
    .upload(`${MP4_FOLDER}/${mp4FileName}`, buffer, {
      contentType: 'video/mp4',
      upsert: true
    })

  if (error) {
    throw new Error(`Erro ao enviar mp4 ${mp4FileName}: ${error.message}`)
  }
}

async function main() {
  await ensureDir(TEMP_GIF_DIR)
  await ensureDir(TEMP_MP4_DIR)

  const gifs = await listAllGifs()

  console.log(`Encontrados ${gifs.length} gifs no Supabase.`)

  for (const gif of gifs) {
    try {
      const gifFileName = gif.name
      const mp4FileName = gifFileName.replace(/\.gif$/i, '.mp4')

      const exists = await mp4AlreadyExists(mp4FileName)
      if (exists) {
        console.log(`PULANDO ${mp4FileName} (já existe)`)
        continue
      }

      const localGifPath = path.join(TEMP_GIF_DIR, gifFileName)
      const localMp4Path = path.join(TEMP_MP4_DIR, mp4FileName)

      console.log(`Baixando ${gifFileName}...`)
      await downloadGifFromSupabase(gifFileName, localGifPath)

      console.log(`Convertendo ${gifFileName}...`)
      await convertGifToMp4(localGifPath, localMp4Path)

      console.log(`Enviando ${mp4FileName}...`)
      await uploadMp4ToSupabase(localMp4Path, mp4FileName)

      console.log(`OK ${gifFileName}`)
    } catch (err) {
      console.log(`ERRO ${gif.name} -> ${err.message}`)
    }
  }

  console.log('Processo finalizado.')
}

main().catch(err => {
  console.error('Erro fatal:', err.message)
})