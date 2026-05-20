console.log("File script.js dengan FITUR SUARA & MUSIK aktif!");

// ==========================================================================
// 1. JAM, TANGGAL, & SAPAAN (NAMA KUSTOM)
// ==========================================================================
const userNameInput = document.getElementById('user-name-input');
if (userNameInput) {
    userNameInput.value = localStorage.getItem('dashboard-username') || '';
    userNameInput.addEventListener('input', () => {
        localStorage.setItem('dashboard-username', userNameInput.value);
    });
}

function updateDateTimeAndGreeting() {
    const timeDisplay = document.getElementById('time-display');
    const dateDisplay = document.getElementById('date-display');
    const greetingMessage = document.getElementById('greeting-message');
    
    if (!timeDisplay || !dateDisplay || !greetingMessage) return;

    const now = new Date();
    timeDisplay.textContent = now.toLocaleTimeString('id-ID');
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDisplay.textContent = now.toLocaleDateString('id-ID', options);
    
    const hours = now.getHours();
    if (hours >= 5 && hours < 12) {
        greetingMessage.textContent = "Good Morning";
    } else if (hours >= 12 && hours < 17) {
        greetingMessage.textContent = "Good Afternoon";
    } else if (hours >= 17 && hours < 20) {
        greetingMessage.textContent = "Good Evening";
    } else {
        greetingMessage.textContent = "Good Night";
    }
}
setInterval(updateDateTimeAndGreeting, 1000);
updateDateTimeAndGreeting();


// ==========================================================================
// AUDIO SYNTHESIZER ENGINE (ALARM & MUSIC MAKER)
// ==========================================================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let musicInterval;

// Fungsi Alarm Bunyi Beep Digital saat Waktu Habis
function playAlarmSound() {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Nada tinggi ceria
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    // Bunyi alarm berulang selama 1.5 detik
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
    osc.stop(audioCtx.currentTime + 1.5);
}

// Mesin Pembuat Pola Nada Musik Latar Otomatis
function playSynthMusic(type) {
    stopSynthMusic();
    if (type === 'none') return;

    let notes = [440, 494, 523, 587]; // Default
    let speed = 500;

    if (type === 'semangat') {
        notes = [220, 261, 293, 329, 392]; // Nada Tech Synthwave
        speed = 250; // Tempo cepat berenergi
    } else if (type === 'gembira') {
        notes = [329, 392, 440, 523, 587]; // Pentatonik ceria Lo-Fi
        speed = 400;
    } else if (type === 'fokus') {
        notes = [261, 329, 392, 523]; // Akor Piano Tenang
        speed = 800; // Tempo lambat rileks
    }

    let step = 0;
    musicInterval = setInterval(() => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        // Memilih karakter gelombang suara sesuai vibe
        osc.type = (type === 'semangat') ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(notes[step % notes.length], audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime); // Volume lembut melatar
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
        step++;
    }, speed);
}

function stopSynthMusic() {
    if (musicInterval) {
        clearInterval(musicInterval);
    }
}


// ==========================================================================
// 2. FOCUS TIMER (DENGAN ALARM SUARA SAAT HABIS)
// ==========================================================================
let timerInterval;
let currentDurationMins = parseInt(localStorage.getItem('pomodoro-duration')) || 25;
let timeLeft = currentDurationMins * 60;

const timerDisplay = document.getElementById('timer-display');
const timerDurationInput = document.getElementById('timer-duration');
const setDurationBtn = document.getElementById('set-duration-btn');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const resetBtn = document.getElementById('reset-btn');

if (timerDurationInput) {
    timerDurationInput.value = currentDurationMins;
}

function updateTimerDisplay() {
    if (!timerDisplay) return;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

if (setDurationBtn && timerDurationInput) {
    setDurationBtn.addEventListener('click', () => {
        const newMins = parseInt(timerDurationInput.value);
        if (newMins > 0 && newMins <= 120) {
            clearInterval(timerInterval);
            currentDurationMins = newMins;
            localStorage.setItem('pomodoro-duration', newMins);
            timeLeft = newMins * 60;
            updateTimerDisplay();
            alert(`Durasi timer berhasil diubah menjadi ${newMins} menit!`);
        } else {
            alert("Masukkan angka durasi yang valid!");
        }
    });
}

if (startBtn && stopBtn && resetBtn) {
    startBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        // Memastikan audio context aktif setelah interaksi user
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                playAlarmSound(); // 🔔 TRIGER BUNYI ALARM!
                timeLeft = currentDurationMins * 60;
                updateTimerDisplay();
            }
        }, 1000);
    });

    stopBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
    });

    resetBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timeLeft = currentDurationMins * 60;
        updateTimerDisplay();
    });
}
updateTimerDisplay();


// ==========================================================================
// 3. TO-DO LIST (CEGAH DUPLIKAT & SORTIR A-Z)
// ==========================================================================
let tasks = JSON.parse(localStorage.getItem('dashboard-tasks')) || [];

const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskContainer = document.getElementById('task-container');
const sortTasksBtn = document.getElementById('sort-tasks-btn');

function renderTasks() {
    if (!taskContainer) return;
    taskContainer.innerHTML = '';
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'checked' : ''}`;
        
        li.innerHTML = `
            <span class="task-text" style="cursor:pointer; flex-grow: 1;">${task.text}</span>
            <div>
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">X</button>
            </div>
        `;

        li.querySelector('.task-text').addEventListener('click', () => toggleTask(index));
        li.querySelector('.edit-btn').addEventListener('click', () => editTask(index));
        li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(index));

        taskContainer.appendChild(li);
    });
    localStorage.setItem('dashboard-tasks', JSON.stringify(tasks));
}

if (addTaskBtn && taskInput) {
    addTaskBtn.addEventListener('click', () => {
        const taskText = taskInput.value.trim();
        if (taskText === '') return;

        const isDuplicate = tasks.some(task => task.text.toLowerCase() === taskText.toLowerCase());
        if (isDuplicate) {
            alert("Tugas ini sudah ada di dalam daftar dashboard Anda!");
            return;
        }

        tasks.push({ text: taskText, completed: false });
        taskInput.value = '';
        renderTasks();
    });
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    renderTasks();
}

function deleteTask(index) {
    tasks.splice(index, 1);
    renderTasks();
}

function editTask(index) {
    const newText = prompt("Ubah tugas:", tasks[index].text);
    if (newText && newText.trim() !== '') {
        const isDuplicate = tasks.some((task, i) => i !== index && task.text.toLowerCase() === newText.trim().toLowerCase());
        if (isDuplicate) {
            alert("Tugas tersebut sudah ada di daftar!");
            return;
        }
        tasks[index].text = newText.trim();
        renderTasks();
    }
}

if (sortTasksBtn) {
    sortTasksBtn.addEventListener('click', () => {
        tasks.sort((a, b) => a.text.localeCompare(b.text));
        renderTasks();
    });
}
renderTasks();


// ==========================================================================
// 4. QUICK LINKS WITH LOCAL STORAGE
// ==========================================================================
let links = JSON.parse(localStorage.getItem('dashboard-links')) || [
    { name: 'Google', url: 'https://google.com' },
    { name: 'Gmail', url: 'https://gmail.com' }
];

const linkNameInput = document.getElementById('link-name');
const linkUrlInput = document.getElementById('link-url');
const addLinkBtn = document.getElementById('add-link-btn');
const linksContainer = document.getElementById('links-container');

function renderLinks() {
    if (!linksContainer) return;
    linksContainer.innerHTML = '';
    links.forEach((link, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'link-button-wrapper';
        wrapper.innerHTML = `
            <a href="${link.url}" target="_blank">${link.name}</a>
            <button class="remove-link-btn">×</button>
        `;
        
        wrapper.querySelector('.remove-link-btn').addEventListener('click', () => deleteLink(index));
        linksContainer.appendChild(wrapper);
    });
    localStorage.setItem('dashboard-links', JSON.stringify(links));
}

if (addLinkBtn && linkNameInput && linkUrlInput) {
    addLinkBtn.addEventListener('click', () => {
        const name = linkNameInput.value.trim();
        let url = linkUrlInput.value.trim();
        
        if (name === '' || url === '') return;
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        links.push({ name: name, url: url });
        linkNameInput.value = '';
        linkUrlInput.value = '';
        renderLinks();
    });
}

function deleteLink(index) {
    links.splice(index, 1);
    renderLinks();
}
renderLinks();


// ==========================================================================
// 5. OPSI 1: LIGHT / DARK MODE MANAGEMENT
// ==========================================================================
const themeToggle = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'light';

if (currentTheme === 'dark' && themeToggle) {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.textContent = "☀️ Mode Terang";
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.textContent = "🌙 Mode Gelap";
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.textContent = "☀️ Mode Terang";
            localStorage.setItem('theme', 'dark');
        }
    });
}