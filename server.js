const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 8080;

// PostgreSQL DB connection
const pool = new Pool({
  user: 'postgres',
  host: 'pollingapp.cveqa0c4yu0s.eu-north-1.rds.amazonaws.com',
  database: 'postgres',
  password: '5umeYUInp9nISfTbIcS2',
  port: 5432,
  ssl: false
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// REGISTER
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Username taken' });
    }

    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, password]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT id, username FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CREATE POLL
app.post('/api/polls', async (req, res) => {
  const { title, options, deadline } = req.body;
  try {
    const pollRes = await pool.query(
      'INSERT INTO polls (question, expires_at) VALUES ($1, $2) RETURNING id',
      [title, deadline]
    );
    const pollId = pollRes.rows[0].id;

    const insertOptions = options.map(opt =>
      pool.query('INSERT INTO choices (poll_id, text) VALUES ($1, $2)', [pollId, opt])
    );
    await Promise.all(insertOptions);

    res.json({ id: pollId, title, options, deadline });
  } catch (err) {
    console.error('Poll creation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET ALL POLLS
app.get('/api/polls', async (req, res) => {
  try {
    const pollsRes = await pool.query('SELECT * FROM polls');
    const polls = pollsRes.rows;

    // For each poll, fetch its options
    for (const poll of polls) {
      const optionsRes = await pool.query('SELECT id, text FROM options WHERE poll_id = $1', [poll.id]);
      poll.options = optionsRes.rows;
    }

    res.json(polls);
  } catch (err) {
    console.error('Get polls error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// VOTE
app.post('/api/polls/:id/vote', async (req, res) => {
  const pollId = req.params.id;
  const { userId, optionIndex } = req.body;

  try {
    const options = await pool.query('SELECT id FROM choices WHERE poll_id = $1', [pollId]);
    const optionId = options.rows[optionIndex]?.id;
    if (!optionId) return res.status(400).json({ error: 'Invalid option index' });

    await pool.query(
      `INSERT INTO votes (user_id, poll_id, choice_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, poll_id)
       DO UPDATE SET choice_id = EXCLUDED.choice_id`,
      [userId, pollId, optionId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET RESULTS
app.get('/api/polls/:id/results', async (req, res) => {
  const pollId = req.params.id;
  try {
    const results = await pool.query(
      `SELECT c.text, COUNT(v.id) AS votes
       FROM choices c
       LEFT JOIN votes v ON v.choice_id = c.id
       WHERE c.poll_id = $1
       GROUP BY c.text`,
      [pollId]
    );
    res.json(results.rows);
  } catch (err) {
    console.error('Results error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});
