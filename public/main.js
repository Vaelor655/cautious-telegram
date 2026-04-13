const socket = io();
const channelsEl = document.getElementById('channels');
const messagesEl = document.getElementById('messages');
const formEl = document.getElementById('composer');
const textEl = document.getElementById('text');
const authorEl = document.getElementById('author');

let currentChannel = 'general';

function appendMessage(msg) {
  const li = document.createElement('li');
  li.innerHTML = `<strong>${msg.author}</strong> <span class="muted">${new Date(msg.createdAt).toLocaleTimeString()}</span><br/>${msg.text}`;
  messagesEl.appendChild(li);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderChannels(channels) {
  channelsEl.innerHTML = '';
  channels.forEach((channel) => {
    const button = document.createElement('button');
    button.textContent = `# ${channel.name}`;
    button.className = channel.id === currentChannel ? 'active' : '';
    button.onclick = () => {
      socket.emit('channel:join', channel.id, (res) => {
        if (!res?.ok) return;
        currentChannel = channel.id;
        renderChannels(channels);
        messagesEl.innerHTML = '';
        res.history.forEach(appendMessage);
      });
    };
    channelsEl.appendChild(button);
  });
}

async function bootstrap() {
  const response = await fetch('/api/channels');
  const channels = await response.json();
  renderChannels(channels);

  socket.emit('channel:join', currentChannel, (res) => {
    if (!res?.ok) return;
    messagesEl.innerHTML = '';
    res.history.forEach(appendMessage);
  });
}

socket.on('channel:created', async () => {
  const response = await fetch('/api/channels');
  renderChannels(await response.json());
});

socket.on('message:new', (msg) => {
  if (msg.channelId === currentChannel) {
    appendMessage(msg);
  }
});

formEl.addEventListener('submit', (event) => {
  event.preventDefault();
  socket.emit(
    'message:send',
    {
      author: authorEl.value.trim() || 'guest',
      text: textEl.value
    },
    (res) => {
      if (res?.ok) {
        textEl.value = '';
      }
    }
  );
});

bootstrap();
