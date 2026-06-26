const express = require('express');
const { Pool } = require('pg');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve index.html, style.css, script.js

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Cria tabela se não existir
async function createTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      ltc_address VARCHAR(255),
      balance NUMERIC(20, 8) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Tabela users pronta!');
}
createTable();

// Rota de cadastro
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Gera endereço LTC na BlockCypher
    const response = await axios.post(
      `https://api.blockcypher.com/v1/ltc/main/addrs?token=${process.env.BLOCKCYPHER_TOKEN}`
    );
    const ltc_address = response.data.address;

    // 2. Salva usuário no banco
    const result = await pool.query(
      'INSERT INTO users (email, password, ltc_address) VALUES ($1, $2, $3) RETURNING id, email, ltc_address',
      [email, password, ltc_address]
    );

    res.json({
      success: true,
      user: result.rows[0],
      message: 'Usuário criado! Endereço LTC gerado.'
    });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Rota de login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT id, email, ltc_address, balance FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    res.json({ success: true, user: result.rows[0] });

  } catch (error) {
    res.status(500).json({ error: 'Erro no login' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
