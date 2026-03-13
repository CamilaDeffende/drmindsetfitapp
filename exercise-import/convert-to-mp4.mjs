import ffmpeg from 'fluent-ffmpeg'
import fs from 'node:fs'
import path from 'node:path'

ffmpeg.setFfmpegPath('E:/projetos/ffmpeg-essentials_build/bin/ffmpeg.exe')

const inputDir = path.resolve('./downloads')
const outputDir = path.resolve('./mp4')

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const files = fs.readdirSync(inputDir).filter(file => file.endsWith('.gif'))

for (const file of files) {
  const inputPath = path.join(inputDir, file)
  const outputPath = path.join(outputDir, file.replace('.gif', '.mp4'))

  console.log(`Convertendo ${file}...`)

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

  console.log(`OK: ${file}`)
}

console.log('Conversão finalizada.')