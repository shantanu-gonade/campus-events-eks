import pg from 'pg'
const { Pool } = pg

// Configure SSL for AWS RDS PostgreSQL
// For AWS RDS, we need to enable SSL but allow self-signed certificates
const sslConfig = process.env.DB_SSL_MODE === 'require' ? {
  rejectUnauthorized: false  // Accept self-signed certificates from RDS
} : false

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'campus_events',
  user: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: sslConfig,
})

pool.on('error', (err) => {
  console.error('Unexpected database error:', err)
})

// Log connection configuration (without sensitive data)
console.log('Database pool configuration:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  ssl: !!sslConfig,
  sslMode: process.env.DB_SSL_MODE
})

export default pool
