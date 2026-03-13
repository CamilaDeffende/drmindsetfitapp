import 'dotenv/config'

console.log('API KEY:', process.env.EXERCISEDB_API_KEY ? 'ok' : 'não encontrada')
console.log('API HOST:', process.env.EXERCISEDB_API_HOST || 'não encontrado')