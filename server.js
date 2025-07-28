const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = 8080;


const users = [];
let nextUserId = 1;

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id == req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});


app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

let polls = [];
let pollIdCounter = 1;

// REGISTER route
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username taken' });
  }
  const newUser = { id: nextUserId++, username, password }; // plaintext password (simple demo)
  users.push(newUser);
  res.json({ id: newUser.id, username: newUser.username });
});

// LOGIN route
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ id: user.id, username: user.username });
});


app.post('/api/polls', (req, res) => {
  const { title, options, deadline } = req.body;
 const poll = {
  id: pollIdCounter++,
  title,
  options: options.map(opt => ({ text: opt, votes: 0 })),
  votes: [], // to track who voted
  deadline,
};

  polls.push(poll);
  res.json(poll);
});

app.get('/api/polls', (req, res) => {
  res.json(polls);
});

app.post('/api/polls/:id/vote', (req, res) => {
  const poll = polls.find(p => p.id == req.params.id);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });

  const { userId, optionIndex } = req.body;
  if (typeof userId !== 'number') return res.status(400).json({ error: 'Missing userId' });

  const previousVote = poll.votes.find(v => v.userId === userId);
  if (previousVote) {
    previousVote.optionIndex = optionIndex; // user is changing vote
  } else {
const user = users.find(u => u.id === userId);
if (!user) {
  return res.status(404).json({ error: 'User not found' });
}
poll.votes.push({ userId, username: user.username, optionIndex });
  }

  res.json({ success: true });
});


app.get('/api/polls/:id/results', (req, res) => {
  const poll = polls.find(p => p.id == req.params.id);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });

  const results = poll.options.map((opt, index) => {
    const voters = poll.votes
      .filter(v => v.optionIndex === index)
      .map(v => {
        const user = users.find(u => u.id === v.userId);
        return user ? user.username : `User ${v.userId}`;
      });

    return {
      text: opt.text,
      votes: voters.length,
      voters
    };
  });

  res.json(results);
});




app.post('/api/reset', (req, res) => {
  polls.forEach(p => {
    p.options.forEach(opt => opt.votes = 0);
  });
  res.json({ message: 'Votes reset' });
});

app.delete('/api/polls/:id', (req, res) => {
  const pollId = parseInt(req.params.id);
  const index = polls.findIndex(p => p.id === pollId);
  if (index !== -1) {
    polls.splice(index, 1);
    res.json({ message: 'Poll deleted' });
  } else {
    res.status(404).json({ error: 'Poll not found' });
  }
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});


