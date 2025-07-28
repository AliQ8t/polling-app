async function register() {
  const username = document.getElementById('authUsername').value;
  const password = document.getElementById('authPassword').value;

  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (res.ok) {
    const data = await res.json();
    localStorage.setItem('userId', data.id);
    document.getElementById('authStatus').innerText = `Registered as ${data.username}`;
    document.getElementById('pollApp').style.display = 'block';
    document.getElementById('authContainer').style.display = 'none';
  } else {
    document.getElementById('authStatus').innerText = 'Username already taken.';
  }
}


async function login() {
  const username = document.getElementById('authUsername').value;
  const password = document.getElementById('authPassword').value;

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (res.ok) {
    const data = await res.json();
    localStorage.setItem('userId', data.id);
    document.getElementById('authStatus').innerText = `Logged in as ${data.username}`;
    document.getElementById('pollApp').style.display = 'block';
    document.getElementById('authContainer').style.display = 'none';
  } else {
    document.getElementById('authStatus').innerText = 'Invalid credentials.';
  }
}



function addOption() {
  const container = document.getElementById('optionsContainer');
  const inputCount = container.querySelectorAll('.pollOption').length;

  const wrapper = document.createElement('div');
  wrapper.className = 'option-wrapper';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'pollOption';
  input.placeholder = `Option ${inputCount + 1}`;
  input.required = true;

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.innerText = '×';
  removeBtn.className = 'removeBtn';
  removeBtn.onclick = () => wrapper.remove();

  wrapper.appendChild(input);
  wrapper.appendChild(removeBtn);
  container.appendChild(wrapper);
}


const pollForm = document.getElementById('createPollForm');
const pollsContainer = document.getElementById('pollsContainer');

pollForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('pollTitle').value;
  const options = Array.from(document.getElementsByClassName('pollOption')).map(o => o.value);
  const deadline = document.getElementById('pollDeadline').value;
  await fetch('/api/polls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, options, deadline })
  });
  pollForm.reset();
  loadPolls();
});

async function loadPolls() {
  const res = await fetch('/api/polls');
  const polls = await res.json();
  pollsContainer.innerHTML = '';
  polls.forEach((poll) => {
    const div = document.createElement('div');
    div.innerHTML = `
  <h3>${poll.title}</h3>
  ${poll.deadline ? `<p><strong>Deadline:</strong> ${poll.deadline}</p>` : ''}
  ${poll.options.map((opt, i) => `
    <button onclick="vote(${poll.id}, ${i})">${opt.text}</button>
  `).join('<br>')}
  <br>
  <button onclick="deletePoll(${poll.id})" style="background-color:red;color:white;margin-top:10px;">Delete Poll</button>
  <div id="results-${poll.id}"></div>
`;

    pollsContainer.appendChild(div);
    showResults(poll.id);
  });
}

async function vote(pollId, optionIndex) {
 const userId = parseInt(localStorage.getItem('userId')); // 👈 read stored userId
await fetch(`/api/polls/${pollId}/vote`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, optionIndex })
});

  showResults(pollId);
}

async function showResults(pollId) {
  const res = await fetch(`/api/polls/${pollId}/results`);
  const results = await res.json();
  const totalVotes = results.reduce((sum, opt) => sum + opt.votes, 0);
  const div = document.getElementById(`results-${pollId}`);
  div.innerHTML = results.map(opt => {
  const percent = totalVotes ? ((opt.votes / totalVotes) * 100).toFixed(1) : 0;
  return `
    <p>${opt.text} (${opt.votes} votes - ${percent}%)</p>
    ${opt.voters && opt.voters.length ? `<small>Voters: ${opt.voters.join(', ')}</small>` : ''}
    <div class="result-bar">
      <div class="result-fill" style="width: ${percent}%">${percent}%</div>
    </div>
  `;
}).join('');

// PIE CHART
const canvas = document.createElement('canvas');
canvas.width = 300;
canvas.height = 300;
div.appendChild(canvas);

const labels = results.map(opt => opt.text);
const data = results.map(opt => opt.votes);

new Chart(canvas, {
  type: 'pie',
  data: {
    labels: labels,
    datasets: [{
      label: 'Votes',
      data: data,
      backgroundColor: [
        '#00d8ff', '#ff6384', '#36a2eb', '#ffcd56', '#4bc0c0', '#9966ff'
      ],
      borderColor: '#1a1a1a',
      borderWidth: 1
    }]
  },
  options: {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#ccc'
        }
      }
    }
  }
});

// Add a voter table below the chart
const table = document.createElement('table');
table.className = 'voter-table';

const header = document.createElement('tr');
header.innerHTML = `
  <th>Option</th>
  <th>Voters</th>
`;
table.appendChild(header);

results.forEach(opt => {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${opt.text}</td>
    <td>${opt.voters?.length ? opt.voters.join(', ') : '—'}</td>
  `;
  table.appendChild(row);
});

div.appendChild(table);


}

function resetVotes() {
  fetch('/api/reset', { method: 'POST' })
    .then(res => res.json())
    .then(() => {
      alert("Votes reset.");
      loadPolls();
    });
}

function deletePoll(pollId) {
  if (confirm("Are you sure you want to delete this poll?")) {
    fetch(`/api/polls/${pollId}`, {
      method: 'DELETE'
    }).then(() => loadPolls());
  }
}
window.addEventListener('DOMContentLoaded', async () => {
  const userId = localStorage.getItem('userId');

  if (!userId) {
    document.getElementById('pollApp').style.display = 'none';
    document.getElementById('authContainer').style.display = 'block';
    return;
  }

  // Validate the stored userId with the server
  const res = await fetch(`/api/users/${userId}`);
  if (res.ok) {
    const data = await res.json();
    document.getElementById('authStatus').innerText = `Welcome back, ${data.username}`;
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('pollApp').style.display = 'block';
    loadPolls(); // ✅ Only load polls if user is valid
  } else {
    // Invalid or deleted user
    localStorage.removeItem('userId');
    document.getElementById('pollApp').style.display = 'none';
    document.getElementById('authContainer').style.display = 'block';
    loadPolls();
  }
});



setInterval(loadPolls, 10000); // Refresh every 10 seconds

function logout() {
  localStorage.removeItem('userId');
  location.reload();
}




