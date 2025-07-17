import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getDatabase, ref, set, get, onValue, remove, push } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyB7-fXR59CqNMyYgZTDAdBNpMTE_GkcOlA",
  authDomain: "ansar-93d9e.firebaseapp.com",
  projectId: "ansar-93d9e",
  storageBucket: "ansar-93d9e.firebasestorage.app",
  messagingSenderId: "697623655771",
  appId: "1:697623655771:web:2487489b5825ab211f567e",
  measurementId: "G-N3LBBHM2N0"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

const presidentCode = '0000';
let currentUser = null;
let isChatOpen = false;
let selectedCallMembers = [];

const defaultData = {
  members: {
    '001': {
      code: '001',
      firstname: 'Mouhamed',
      lastname: 'Niang',
      age: 45,
      dob: '01012000',
      birthplace: 'Dakar',
      photo: 'assets/images/default-photo.png',
      email: 'mouhamed.niang@example.com',
      activity: 'Président',
      address: '123 Rue Principale, Dakar',
      phone: '+221123456789',
      residence: 'Dakar',
      role: 'president',
      status: 'actif',
      contributions: { 'Mensuelle': { '2023': Array(12).fill(false), '2024': Array(12).fill(false), '2025': Array(12).fill(false) } }
    }
  },
  contributions: { 'mensuelle': { name: 'Mensuelle', amount: 2000, years: ['2023', '2024', '2025'] } },
  events: { 'event1': { name: 'Conférence Annuelle', description: 'Conférence 2025', image: 'assets/images/conference.jpg', datetime: '2025-08-17T15:00:00' } },
  suggestions: {},
  gallery: {},
  messages: {},
  autoMessages: {},
  notes: {},
  internalDocs: {},
  presidentFiles: {},
  secretaryFiles: {},
  library: {}
};

async function initDB() {
  console.log('Initialisation de la base de données Firebase');
  const collections = ['members', 'contributions', 'events', 'suggestions', 'gallery', 'messages', 'autoMessages', 'notes', 'internalDocs', 'presidentFiles', 'secretaryFiles', 'library'];
  for (const collection of collections) {
    const snapshot = await get(ref(db, collection));
    if (!snapshot.exists()) {
      console.log(`Initialisation de ${collection} avec les données par défaut`);
      await set(ref(db, collection), defaultData[collection]);
    }
    onValue(ref(db, collection), (snapshot) => {
      const data = snapshot.val() || defaultData[collection];
      updateUI(collection, data);
    });
  }
}

function updateUI(collection, data) {
  console.log(`Mise à jour UI pour ${collection}`);
  switch (collection) {
    case 'members': updateMembersList(); updateEditMembersList(); updateCallMembersList(); updateStats(); break;
    case 'contributions': updateContributionsAdminList(); updatePersonalInfo(); updateStats(); break;
    case 'events': updateEventsList(); updateEventsAdminList(); updateEventCountdowns(); break;
    case 'suggestions': updateSuggestionsList(); break;
    case 'gallery': updateGalleryContent(); updateGalleryAdminList(); break;
    case 'messages': updateMessagesList(); updateMessagesAdminList(); updateMessagePopups(); break;
    case 'autoMessages': updateAutoMessagesList(); break;
    case 'notes': updateNotesList(); break;
    case 'internalDocs': updateInternalDocsList(); break;
    case 'presidentFiles': updatePresidentFilesList(); break;
    case 'secretaryFiles': updateSecretaryFilesList(); break;
    case 'library': updateLibraryContent(); break;
  }
}

function showPage(pageId) {
  const pageElement = document.querySelector(`#${pageId}`);
  if (!pageElement) {
    console.error(`Page ${pageId} non trouvée`);
    return;
  }
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  pageElement.classList.add('active');
  const navItem = document.querySelector(`a[onclick="showPage('${pageId}')"]`);
  if (navItem) navItem.classList.add('active');
  if (pageId === 'personal' && currentUser && currentUser.role !== 'admin') {
    const loginSection = document.querySelector('#personal-login');
    const contentSection = document.querySelector('#personal-content');
    if (loginSection && contentSection) {
      loginSection.style.display = 'none';
      contentSection.style.display = 'block';
      updatePersonalInfo();
    }
  }
}

function showTab(tabId) {
  const tabElement = document.querySelector(`#${tabId}`);
  if (!tabElement) {
    console.error(`Onglet ${tabId} non trouvé`);
    return;
  }
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  tabElement.classList.add('active');
  const tabButton = document.querySelector(`button[onclick="showTab('${tabId}')"]`);
  if (tabButton) tabButton.classList.add('active');
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  console.log('Thème basculé');
}

function updateEventCountdowns() {
  get(ref(db, 'events')).then((snapshot) => {
    const events = snapshot.val() || {};
    const countdowns = document.getElementById('event-countdowns');
    if (!countdowns) return;
    countdowns.innerHTML = Object.entries(events).map(([key, event]) => {
      const eventDate = new Date(event.datetime);
      const now = new Date();
      const diff = eventDate - now;
      if (diff <= 0 && diff > -30 * 60 * 1000) {
        return `<div id="countdown-${key}">Événement ${event.name} : EN COURS</div>`;
      } else if (diff <= -30 * 60 * 1000) {
        return '';
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return `<div id="countdown-${key}">Événement ${event.name} : JOUR J - ${days}j ${hours}h ${minutes}m ${seconds}s</div>`;
    }).join('');
  });
}

setInterval(updateEventCountdowns, 1000);
setInterval(checkAutoMessages, 60000);

function toggleChatbot() {
  isChatOpen = !isChatOpen;
  const chatbot = document.querySelector('#chatbot');
  if (chatbot) {
    chatbot.style.display = isChatOpen ? 'flex' : 'none';
    if (isChatOpen) {
      const messages = document.querySelector('#chatbot-messages');
      if (messages) {
        messages.innerHTML = '<div class="chatbot-message received">Bienvenue ! Posez une question ou utilisez un mot-clé comme "association", "membre", "cotisation", etc.</div>';
      }
    }
  }
}

document.addEventListener('click', (e) => {
  const chatbot = document.querySelector('#chatbot');
  const chatbotButton = document.querySelector('.chatbot-button');
  if (isChatOpen && chatbot && chatbotButton && !chatbot.contains(e.target) && !chatbotButton.contains(e.target)) {
    toggleChatbot();
  }
});

document.querySelector('.chatbot-button')?.addEventListener('click', () => {
  console.log('Bouton chatbot cliqué');
  toggleChatbot();
});

document.querySelector('#chatbot-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.querySelector('#chatbot-input');
  const messages = document.querySelector('#chatbot-messages');
  if (!input || !messages) return;
  const message = input.value.trim();
  if (!message) return;
  messages.innerHTML += `<div class="chatbot-message sent">${message}</div>`;
  const secretCodes = ['ADMIN12301012000', '00000000', '11111111', '22222222'];
  if (secretCodes.includes(message)) {
    const secretEntry = document.querySelector('#secret-entry');
    if (secretEntry) {
      secretEntry.style.display = 'block';
      setTimeout(() => {
        secretEntry.style.display = 'none';
      }, 30000);
    }
  } else {
    const response = getChatbotResponse(message);
    messages.innerHTML += `<div class="chatbot-message received">${response}</div>`;
  }
  input.value = '';
  messages.scrollTop = messages.scrollHeight;
});

function clearChatHistory() {
  const messages = document.querySelector('#chatbot-messages');
  if (messages) {
    messages.innerHTML = '<div class="chatbot-message received">Historique effacé. Posez une question !</div>';
    console.log('Historique du chatbot effacé');
  }
}

function enterSecret() {
  const password = document.querySelector('#secret-password')?.value;
  if (!password) return;
  const adminCodes = ['JESUISMEMBRE66', '33333333', '44444444', '55555555'];
  const treasurerCodes = ['JESUISTRESORIER444', '66666666', '77777777', '88888888'];
  const presidentCodes = ['PRESIDENT000', '99999999', '11112222', '33334444'];
  const secretaryCodes = ['SECRETAIRE000', '55556666', '77778888', '99990000'];
  const messages = document.querySelector('#chatbot-messages');
  if (adminCodes.includes(password)) {
    currentUser = { code: 'ADMIN123', role: 'admin' };
    showPage('secret');
    toggleChatbot();
  } else if (treasurerCodes.includes(password)) {
    currentUser = { code: 'TRESORIER', role: 'tresorier' };
    showPage('treasurer');
    showTab('treasurer-contributions');
    toggleChatbot();
  } else if (presidentCodes.includes(password)) {
    currentUser = { code: 'PRESIDENT', role: 'president' };
    showPage('president');
    showTab('president-files');
    toggleChatbot();
  } else if (secretaryCodes.includes(password)) {
    currentUser = { code: 'SECRETAIRE', role: 'secretaire' };
    showPage('secretary');
    showTab('secretary-files');
    toggleChatbot();
  } else {
    if (messages) {
      messages.innerHTML += '<div class="chatbot-message received">Mot de passe incorrect.</div>';
      messages.scrollTop = messages.scrollHeight;
    }
  }
}

document.querySelector('#personal-login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = document.querySelector('#personal-member-code')?.value;
  const password = document.querySelector('#personal-password')?.value;
  const errorMessage = document.querySelector('#personal-error-message');
  if (!code || !password || !errorMessage) return;
  const dateRegex = /^(0[1-9]|[12][0-9]|3[01])(0[1-9]|1[012])(19|20)\d\d$/;
  if (!dateRegex.test(password)) {
    errorMessage.textContent = 'Mot de passe invalide (format : JJMMAAAA)';
    errorMessage.style.display = 'block';
    return;
  }
  const snapshot = await get(ref(db, `members/${code}`));
  const member = snapshot.val();
  if (member && member.dob === password) {
    currentUser = { ...member, code };
    const title = document.querySelector('#personal-title');
    const loginSection = document.querySelector('#personal-login');
    const contentSection = document.querySelector('#personal-content');
    if (title && loginSection && contentSection) {
      title.textContent = `Espace de ${member.firstname} ${member.lastname}`;
      loginSection.style.display = 'none';
      contentSection.style.display = 'block';
      updatePersonalInfo();
    }
  } else {
    errorMessage.textContent = 'Numéro de membre ou mot de passe incorrect';
    errorMessage.style.display = 'block';
  }
});

function logoutPersonal() {
  currentUser = null;
  const loginSection = document.querySelector('#personal-login');
  const contentSection = document.querySelector('#personal-content');
  if (loginSection && contentSection) {
    loginSection.style.display = 'block';
    contentSection.style.display = 'none';
    showPage('home');
  }
}

document.querySelector('#add-member-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser || currentUser.role !== 'admin') return;
  const snapshot = await get(ref(db, 'members'));
  const members = snapshot.val() || {};
  const newCode = `${(Object.keys(members).length + 1).toString().padStart(3, '0')}`;
  const member = {
    code: newCode,
    firstname: document.querySelector('#new-member-firstname')?.value || '',
    lastname: document.querySelector('#new-member-lastname')?.value || '',
    age: parseInt(document.querySelector('#new-member-age')?.value) || null,
    dob: document.querySelector('#new-member-dob')?.value || null,
    birthplace: document.querySelector('#new-member-birthplace')?.value || null,
    photo: 'assets/images/default-photo.png',
    email: document.querySelector('#new-member-email')?.value || null,
    activity: document.querySelector('#new-member-activity')?.value || null,
    address: document.querySelector('#new-member-address')?.value || null,
    phone: document.querySelector('#new-member-phone')?.value || null,
    residence: document.querySelector('#new-member-residence')?.value || null,
    role: document.querySelector('#new-member-role')?.value || 'membre',
    status: document.querySelector('#new-member-status')?.value || 'actif',
    contributions: { 'Mensuelle': { '2023': Array(12).fill(false), '2024': Array(12).fill(false), '2025': Array(12).fill(false) } }
  };
  const file = document.querySelector('#new-member-photo')?.files[0];
  if (file) {
    const fileRef = storageRef(storage, `members/${newCode}/${file.name}`);
    await uploadBytes(fileRef, file);
    member.photo = await getDownloadURL(fileRef);
  }
  await set(ref(db, `members/${newCode}`), member);
  document.querySelector('#add-member-form')?.reset();
});

document.querySelector('#delete-member-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = document.querySelector('#delete-member-code')?.value;
  const form = document.querySelector('#delete-member-form');
  if (!code || !form) return;
  if (code !== presidentCode) {
    alert('Code président incorrect');
    return;
  }
  const memberCode = form.dataset.memberCode;
  await remove(ref(db, `members/${memberCode}`));
  form.style.display = 'none';
});

document.querySelector('#add-contribution-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser || currentUser.role !== 'tresorier') return;
  const name = document.querySelector('#contribution-name')?.value;
  const amount = parseInt(document.querySelector('#contribution-amount')?.value);
  if (!name || !amount) return;
  const currentYear = new Date().getFullYear().toString();
  const contribution = { name, amount, years: [currentYear] };
  const newRef = await push(ref(db, 'contributions'), contribution);
  const snapshot = await get(ref(db, 'members'));
  const members = snapshot.val() || {};
  for (const [code, member] of Object.entries(members)) {
    if (!member.contributions[name]) {
      member.contributions[name] = { [currentYear]: Array(12).fill(false) };
      await set(ref(db, `members/${code}`), member);
    }
  }
  document.querySelector('#add-contribution-form')?.reset();
  sendNotification('Nouvelle cotisation', `Cotisation ${name} ajoutée (${amount} FCFA).`);
});

document.querySelector('#suggestion-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) return;
  const text = document.querySelector('#suggestion-text')?.value;
  if (!text) return;
  await push(ref(db, 'suggestions'), { member: `${currentUser.firstname} ${currentUser.lastname}`, text });
  document.querySelector('#suggestion-form')?.reset();
});

document.querySelector('#add-gallery-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser || currentUser.role !== 'admin') return;
  const file = document.querySelector('#gallery-file')?.files[0];
  if (!file) return;
  const fileRef = storageRef(storage, `gallery/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  await push(ref(db, 'gallery'), { type: file.type.startsWith('image') ? 'image' : 'video', url, name: file.name });
  document.querySelector('#add-gallery-form')?.reset();
});

document.querySelector('#add-event-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser || currentUser.role !== 'admin') return;
  const event = {
    name: document.querySelector('#event-name')?.value || '',
    description: document.querySelector('#event-description')?.value || '',
    datetime: new Date(`${document.querySelector('#event-date')?.value}T${document.querySelector('#event-time')?.value}`).toISOString(),
    image: ''
  };
  const file = document.querySelector('#event-file')?.files[0];
  if (file) {
    const fileRef = storageRef(storage, `events/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    event.image = await getDownloadURL(fileRef);
  }
  await push(ref(db, 'events'), event);
  document.querySelector('#add-event-form')?.reset();
});

document.querySelector('#add-message-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser || currentUser.role !== 'admin') return;
  const message = {
    title: document.querySelector('#message-title')?.value || '',
    text: document.querySelector('#message-text')?.value || '',
    date: new Date().toISOString()
  };
  await push(ref(db, 'messages'), message);
  document.querySelector('#add-message-form')?.reset();
  sendNotification('Nouveau message', `${message.title}: ${message.text}`);
});

document.querySelector('#add-auto-message-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser || currentUser.role !== 'admin') return;
  const autoMessage = {
    name: document.querySelector('#auto-message-name')?.value || '',
    text: document.querySelector('#auto-message-text')?.value || '',
    datetime: new Date(`${document.querySelector('#auto-message-date')?.value}T${document.querySelector('#auto-message-time')?.value}`).toISOString()
  };
  await push(ref(db, 'autoMessages'), autoMessage);
  document.querySelector('#add-auto-message-form')?.reset();
});

document.querySelector('#add-note-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser || currentUser.role !== 'admin') return;
  const note = {
    theme: document.querySelector('#note-theme')?.value || '',
    text: document.querySelector('#note-text')?.value || ''
  };
  await push(ref(db, 'notes'), note);
  document.querySelector('#add-note-form')?.reset();
});

document.querySelector('#add-internal-doc-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser || currentUser.role !== 'admin') return;
  const file = document.querySelector('#internal-doc')?.files[0];
  if (!file) return;
  const fileRef = storageRef(storage, `internalDocs/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  await push(ref(db, 'internalDocs'), { name: file.name, url, category: document.querySelector('#internal-doc-category')?.value || '' });
  document.querySelector('#add-internal-doc-form')?.reset();
});

document.querySelector('#add-president-file-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser || currentUser.role !== 'president') return;
  const file = document.querySelector('#president-file')?.files[0];
  if (!file) return;
  const fileRef = storageRef(storage, `presidentFiles/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  await push(ref(db, 'presidentFiles'), { name: file.name, url, category: document.querySelector('#president-file-category')?.value || '' });
  document.querySelector('#add-president-file-form')?.reset();
});

document.querySelector('#add-secretary-file-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser || currentUser.role !== 'secretaire') return;
  const file = document.querySelector('#secretary-file')?.files[0];
  if (!file) return;
  const fileRef = storageRef(storage, `secretaryFiles/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  await push(ref(db, 'secretaryFiles'), { name: file.name, url, category: document.querySelector('#secretary-file-category')?.value || '' });
  document.querySelector('#add-secretary-file-form')?.reset();
});

function updateMembersList() {
  const search = document.querySelector('#members-search')?.value.toLowerCase() || '';
  const list = document.querySelector('#members-list');
  if (!list) return;
  get(ref(db, 'members')).then((snapshot) => {
    const members = snapshot.val() || {};
    list.innerHTML = Object.values(members)
      .filter(m => `${m.firstname} ${m.lastname}`.toLowerCase().includes(search) || m.code.toLowerCase().includes(search))
      .map(m => `
        <div class="member-card">
          <p><strong>${m.firstname} ${m.lastname}</strong></p>
          <p><strong>Numéro :</strong> MEMBRE${m.code}</p>
        </div>
      `).join('');
  });
}

function updateContributionsAdminList() {
  if (!currentUser || currentUser.role !== 'tresorier') return;
  const search = document.querySelector('#contributions-admin-search')?.value.toLowerCase() || '';
  const list = document.querySelector('#contributions-admin-list');
  if (!list) return;
  get(ref(db, 'contributions')).then(async (contribSnapshot) => {
    const contributions = contribSnapshot.val() || {};
    const membersSnapshot = await get(ref(db, 'members'));
    const members = membersSnapshot.val() || {};
    list.innerHTML = Object.entries(contributions)
      .filter(([_, c]) => c.name.toLowerCase().includes(search))
      .map(([key, c]) => `
        <div class="contribution-card">
          <h4>${c.name} (${c.amount} FCFA)</h4>
          ${Object.values(members).map(m => `
            <div>
              <p>${m.firstname} ${m.lastname}</p>
              ${c.years.map(year => `
                <h5>${year}</h5>
                ${['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'].map((month, i) => `
                  <input type="checkbox" id="contrib-${m.code}-${key}-${year}-${i}" ${m.contributions[c.name]?.[year]?.[i] ? 'checked' : ''} onchange="updateMonthlyPayment('${m.code}', '${c.name}', '${year}', ${i}, this.checked)">
                  <label for="contrib-${m.code}-${key}-${year}-${i}">${month}</label>
                `).join('')}
                <p>Payé: ${m.contributions[c.name]?.[year]?.map((p, i) => p ? ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][i] : '').filter(Boolean).join(', ') || ''}</p>
                <p>Non payé: ${m.contributions[c.name]?.[year]?.map((p, i) => !p ? ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][i] : '').filter(Boolean).join(', ') || ''}</p>
              `).join('')}
            </div>
          `).join('')}
        </div>
      `).join('');
  });
}

async function updateMonthlyPayment(memberCode, contributionName, year, monthIndex, paid) {
  if (!currentUser || currentUser.role !== 'tresorier') return;
  const memberRef = ref(db, `members/${memberCode}`);
  const snapshot = await get(memberRef);
  const member = snapshot.val();
  if (!member) return;
  if (!member.contributions[contributionName]) {
    member.contributions[contributionName] = {};
  }
  if (!member.contributions[contributionName][year]) {
    member.contributions[contributionName][year] = Array(12).fill(false);
  }
  member.contributions[contributionName][year][monthIndex] = paid;
  await set(memberRef, member);
  sendNotification('Mise à jour cotisation', `Cotisation ${contributionName} pour ${member.firstname} ${member.lastname} (${year}, ${['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][monthIndex]}) marquée comme ${paid ? 'payée' : 'non payée'}.`);
}

function updateEditMembersList() {
  const search = document.querySelector('#edit-member-search')?.value.toLowerCase() || '';
  const list = document.querySelector('#edit-members-list');
  if (!list) return;
  get(ref(db, 'members')).then((snapshot) => {
    const members = snapshot.val() || {};
    list.innerHTML = Object.values(members)
      .filter(m => `${m.firstname} ${m.lastname}`.toLowerCase().includes(search) || m.code.toLowerCase().includes(search))
      .map(m => `
        <div class="member-card">
          <p><strong>Prénom :</strong> ${m.firstname}</p>
          <p><strong>Nom :</strong> ${m.lastname}</p>
          <button class="cta-button" onclick="editMember('${m.code}')">Modifier</button>
          <button class="cta-button" onclick="deleteMember('${m.code}')">Supprimer</button>
        </div>
      `).join('');
  });
}

function editMember(code) {
  get(ref(db, `members/${code}`)).then((snapshot) => {
    const member = snapshot.val();
    if (!member) return;
    const fields = ['firstname', 'lastname', 'age', 'dob', 'birthplace', 'email', 'activity', 'address', 'phone', 'residence', 'role', 'status'];
    fields.forEach(field => {
      const element = document.querySelector(`#new-member-${field}`);
      if (element) element.value = member[field] || '';
    });
    showTab('add-member');
  });
}

function deleteMember(code) {
  if (!currentUser || currentUser.role !== 'admin') return;
  const form = document.querySelector('#delete-member-form');
  if (form) {
    form.dataset.memberCode = code;
    form.style.display = 'block';
  }
}

function updateEventsList() {
  const search = document.querySelector('#events-search')?.value.toLowerCase() || '';
  const list = document.querySelector('#events-list');
  if (!list) return;
  get(ref(db, 'events')).then((snapshot) => {
    const events = snapshot.val() || {};
    list.innerHTML = Object.values(events)
      .filter(e => e.name.toLowerCase().includes(search) || e.description.toLowerCase().includes(search))
      .map(e => `
        <div class="event-card">
          <h4>${e.name}</h4>
          <p>${e.description}</p>
          <p>Date: ${new Date(e.datetime).toLocaleString()}</p>
          ${e.image ? `<img src="${e.image}" alt="${e.name}" style="max-width: 100%; border-radius: 10px;">` : ''}
        </div>
      `).join('');
  });
}

function updateEventsAdminList() {
  const search = document.querySelector('#events-admin-search')?.value.toLowerCase() || '';
  const list = document.querySelector('#events-admin-list');
  if (!list) return;
  get(ref(db, 'events')).then((snapshot) => {
    const events = snapshot.val() || {};
    list.innerHTML = Object.entries(events)
      .filter(([_, e]) => e.name.toLowerCase().includes(search) || e.description.toLowerCase().includes(search))
      .map(([key, e]) => `
        <div class="event-card">
          <h4>${e.name}</h4>
          <p>${e.description}</p>
          <p>Date: ${new Date(e.datetime).toLocaleString()}</p>
          ${e.image ? `<img src="${e.image}" alt="${e.name}" style="max-width: 100%; border-radius: 10px;">` : ''}
          <button class="cta-button" onclick="deleteEvent('${key}')">Supprimer</button>
        </div>
      `).join('');
  });
}

async function deleteEvent(key) {
  if (!currentUser || currentUser.role !== 'admin') return;
  await remove(ref(db, `events/${key}`));
}

function updateGalleryContent() {
  const content = document.querySelector('#gallery-content');
  if (!content) return;
  get(ref(db, 'gallery')).then((snapshot) => {
    const gallery = snapshot.val() || {};
    content.innerHTML = Object.values(gallery)
      .map(g => `
        <div>
          ${g.type === 'image' ? `<img src="${g.url}" alt="Galerie">` : `<video src="${g.url}" controls></video>`}
        </div>
      `).join('');
  });
}

function updateGalleryAdminList() {
  const search = document.querySelector('#gallery-admin-search')?.value.toLowerCase() || '';
  const list = document.querySelector('#gallery-admin-list');
  if (!list) return;
  get(ref(db, 'gallery')).then((snapshot) => {
    const gallery = snapshot.val() || {};
    list.innerHTML = Object.entries(gallery)
      .filter(([_, g]) => g.name.toLowerCase().includes(search))
      .map(([key, g]) => `
        <div>
          ${g.type === 'image' ? `<img src="${g.url}" alt="Galerie" style="max-width: 100%; border-radius: 10px;">` : `<video src="${g.url}" controls style="max-width: 100%; border-radius: 10px;"></video>`}
          <button class="cta-button" onclick="deleteGalleryItem('${key}')">Supprimer</button>
        </div>
      `).join('');
  });
}

async function deleteGalleryItem(key) {
  if (!currentUser || currentUser.role !== 'admin') return;
  await remove(ref(db, `gallery/${key}`));
}

function updateMessagesList() {
  const list = document.querySelector('#messages-list');
  if (!list) return;
  get(ref(db, 'messages')).then((snapshot) => {
    const messages = snapshot.val() || {};
    list.innerHTML = Object.values(messages)
      .map(m => `
        <div class="message-card">
          <h4>${m.title}</h4>
          <p>${m.text}</p>
          <p><small>${new Date(m.date).toLocaleString()}</small></p>
        </div>
      `).join('');
  });
}

function updateMessagesAdminList() {
  const search = document.querySelector('#messages-admin-search')?.value.toLowerCase() || '';
  const list = document.querySelector('#messages-admin-list');
  if (!list) return;
  get(ref(db, 'messages')).then((snapshot) => {
    const messages = snapshot.val() || {};
    list.innerHTML = Object.entries(messages)
      .filter(([_, m]) => m.title.toLowerCase().includes(search) || m.text.toLowerCase().includes(search))
      .map(([key, m]) => `
        <div class="message-card">
          <h4>${m.title}</h4>
          <p>${m.text}</p>
          <p><small>${new Date(m.date).toLocaleString()}</small></p>
          <button class="cta-button" onclick="deleteMessage('${key}')">Supprimer</button>
        </div>
      `).join('');
  });
}

async function deleteMessage(key) {
  if (!currentUser || currentUser.role !== 'admin') return;
  await remove(ref(db, `messages/${key}`));
}

function updateMessagePopups() {
  const popups = document.querySelector('#message-popups');
  if (!popups) return;
  get(ref(db, 'messages')).then((snapshot) => {
    const messages = snapshot.val() || {};
    popups.innerHTML = Object.entries(messages)
      .map(([key, m]) => `
        <div class="message-popup">
          <h4>${m.title}</h4>
          <p>${m.text}</p>
          <button class="close-button" onclick="closeMessage('${key}')"><span class="material-icons">close</span></button>
        </div>
      `).join('');
  });
}

async function closeMessage(key) {
  await remove(ref(db, `messages/${key}`));
}

function checkAutoMessages() {
  get(ref(db, 'autoMessages')).then(async (snapshot) => {
    const autoMessages = snapshot.val() || {};
    const now = new Date();
    for (const [key, m] of Object.entries(autoMessages)) {
      if (new Date(m.datetime) <= now) {
        await push(ref(db, 'messages'), { title: m.name, text: m.text, date: now.toISOString() });
        await remove(ref(db, `autoMessages/${key}`));
        sendNotification('Message automatisé', `${m.name}: ${m.text}`);
      }
    }
  });
}

function updateAutoMessagesList() {
  const search = document.querySelector('#auto-messages-search')?.value.toLowerCase() || '';
  const list = document.querySelector('#auto-messages-list');
  if (!list) return;
  get(ref(db, 'autoMessages')).then((snapshot) => {
    const autoMessages = snapshot.val() || {};
    list.innerHTML = Object.entries(autoMessages)
      .filter(([_, m]) => m.name.toLowerCase().includes(search) || m.text.toLowerCase().includes(search))
      .map(([key, m]) => `
        <div class="message-card">
          <h4>${m.name}</h4>
          <p>${m.text}</p>
          <p>Date: ${new Date(m.datetime).toLocaleString()}</p>
          <button class="cta-button" onclick="deleteAutoMessage('${key}')">Supprimer</button>
        </div>
      `).join('');
  });
}

async function deleteAutoMessage(key) {
  if (!currentUser || currentUser.role !== 'admin') return;
  await remove(ref(db, `autoMessages/${key}`));
}

function updateNotesList() {
  const search = document.querySelector('#notes-search')?.value.toLowerCase() || '';
  const list = document.querySelector('#notes-list');
  if (!list) return;
  get(ref(db, 'notes')).then((snapshot) => {
    const notes = snapshot.val() || {};
    list.innerHTML = Object.entries(notes)
      .filter(([_, n]) => n.theme.toLowerCase().includes(search) || n.text.toLowerCase().includes(search))
      .map(([key, n]) => `
        <div class="note-card">
          <p><strong>${n.theme}</strong>: ${n.text}</p>
          <button class="cta-button" onclick="deleteNote('${key}')">Supprimer</button>
        </div>
      `).join('');
  });
}

async function deleteNote(key) {
  if (!currentUser || currentUser.role !== 'admin') return;
  await remove(ref(db, `notes/${key}`));
}

function updateInternalDocsList() {
  const search = document.querySelector('#internal-docs-search')?.value.toLowerCase() || '';
  const list = document.querySelector('#internal-docs-list');
  if (!list) return;
  get(ref(db, 'internalDocs')).then((snapshot) => {
    const internalDocs = snapshot.val() || {};
    list.innerHTML = Object.entries(internalDocs)
      .filter(([_, d]) => d.name.toLowerCase().includes(search) || d.category.toLowerCase().includes(search))
      .map(([key, d]) => `
        <div class="file-card">
          <p><strong>Catégorie :</strong> ${d.category}</p>
          <a href="${d.url}" download>${d.name}</a>
          <button class="cta-button" onclick="deleteInternalDoc('${key}')">Supprimer</button>
        </div>
      `).join('');
  });
}

async function deleteInternalDoc(key) {
  if (!currentUser || currentUser.role !== 'admin') return;
  await remove(ref(db, `internalDocs/${key}`));
}

function updatePresidentFilesList() {
  const search = document.querySelector('#president-files-search')?.value.toLowerCase() || '';
  const list = document.querySelector('#president-files-list');
  if (!list) return;
  get(ref(db, 'presidentFiles')).then((snapshot) => {
    const presidentFiles = snapshot.val() || {};
    list.innerHTML = Object.entries(presidentFiles)
      .filter(([_, f]) => f.name.toLowerCase().includes(search) || f.category.toLowerCase().includes(search))
      .map(([key, f]) => `
        <div class="file-card">
          <p><strong>Catégorie :</strong> ${f.category}</p>
          <a href="${f.url}" download>${f.name}</a>
          <button class="cta-button" onclick="deletePresidentFile('${key}')">Supprimer</button>
        </div>
      `).join('');
  });
}

async function deletePresidentFile(key) {
  if (!currentUser || currentUser.role !== 'president') return;
  await remove(ref(db, `presidentFiles/${key}`));
}

function updateSecretaryFilesList() {
  const search = document.querySelector('#secretary-files-search')?.value.toLowerCase() || '';
  const list = document.querySelector('#secretary-files-list');
  if (!list) return;
  get(ref(db, 'secretaryFiles')).then((snapshot) => {
    const secretaryFiles = snapshot.val() || {};
    list.innerHTML = Object.entries(secretaryFiles)
      .filter(([_, f]) => f.name.toLowerCase().includes(search) || f.category.toLowerCase().includes(search))
      .map(([key, f]) => `
        <div class="file-card">
          <p><strong>Catégorie :</strong> ${f.category}</p>
          <a href="${f.url}" download>${f.name}</a>
          <button class="cta-button" onclick="deleteSecretaryFile('${key}')">Supprimer</button>
        </div>
      `).join('');
  });
}

async function deleteSecretaryFile(key) {
  if (!currentUser || currentUser.role !== 'secretaire') return;
  await remove(ref(db, `secretaryFiles/${key}`));
}

function updateSuggestionsList() {
  const search = document.querySelector('#suggestions-search')?.value.toLowerCase() || '';
  const list = document.querySelector('#suggestions-list');
  if (!list) return;
  get(ref(db, 'suggestions')).then((snapshot) => {
    const suggestions = snapshot.val() || {};
    list.innerHTML = Object.entries(suggestions)
      .filter(([_, s]) => s.member.toLowerCase().includes(search) || s.text.toLowerCase().includes(search))
      .map(([key, s]) => `
        <div class="suggestion-card">
          <p><strong>${s.member}</strong>: ${s.text}</p>
          <button class="cta-button" onclick="deleteSuggestion('${key}')">Supprimer</button>
        </div>
      `).join('');
  });
}

async function deleteSuggestion(key) {
  if (!currentUser || currentUser.role !== 'admin') return;
  await remove(ref(db, `suggestions/${key}`));
}

function updateCoranContent() {
  const search = document.querySelector('#coran-search')?.value.toLowerCase() || '';
  const content = document.querySelector('#coran-content');
  if (!content) return;
  content.innerHTML = Array(30).fill()
    .map((_, i) => ({ juz: `Juz' ${i + 1}`, id: i + 1 }))
    .filter(j => j.juz.toLowerCase().includes(search))
    .map(j => `<p style="font-family: 'Amiri', serif; font-size: 1.2rem;">${j.juz}</p>`).join('');
}

function updateLibraryContent() {
  const search = document.querySelector('#library-search')?.value.toLowerCase() || '';
  const content = document.querySelector('#library-content');
  if (!content) return;
  get(ref(db, 'library')).then((snapshot) => {
    const library = snapshot.val() || {};
    content.innerHTML = Object.values(library)
      .filter(l => l.name.toLowerCase().includes(search) || l.category.toLowerCase().includes(search))
      .map(l => `
        <div class="file-card">
          <p><strong>Catégorie :</strong> ${l.category}</p>
          <a href="${l.url}" download>${l.name}</a>
        </div>
      `).join('');
  });
}

function updatePersonalInfo() {
  if (!currentUser) return;
  const info = document.querySelector('#personal-info');
  const contributions = document.querySelector('#personal-contributions');
  if (!info || !contributions) return;
  get(ref(db, `members/${currentUser.code}`)).then((snapshot) => {
    const member = snapshot.val();
    if (!member) return;
    info.innerHTML = `
      <img src="${member.photo || 'assets/images/default-photo.png'}" alt="${member.firstname} ${member.lastname}" style="width: 100px; border-radius: 50%;">
      <p><strong>Prénom :</strong> ${member.firstname}</p>
      <p><strong>Nom :</strong> ${member.lastname}</p>
      ${member.age ? `<p><strong>Âge :</strong> ${member.age}</p>` : ''}
      ${member.dob ? `<p><strong>Date de naissance :</strong> ${member.dob}</p>` : ''}
      ${member.birthplace ? `<p><strong>Lieu de naissance :</strong> ${member.birthplace}</p>` : ''}
      ${member.email ? `<p><strong>Email :</strong> ${member.email}</p>` : ''}
      ${member.activity ? `<p><strong>Activité :</strong> ${member.activity}</p>` : ''}
      ${member.address ? `<p><strong>Adresse :</strong> ${member.address}</p>` : ''}
      ${member.phone ? `<p><strong>Téléphone :</strong> ${member.phone}</p>` : ''}
      ${member.residence ? `<p><strong>Résidence :</strong> ${member.residence}</p>` : ''}
      <p><strong>Rôle :</strong> ${member.role}</p>
      <p><strong>Statut :</strong> ${member.status}</p>
    `;
    get(ref(db, 'contributions')).then((contribSnapshot) => {
      const contribs = contribSnapshot.val() || {};
      contributions.innerHTML = Object.entries(member.contributions || {}).map(([name, years]) => `
        <div class="contribution-card">
          <p><strong>${name}</strong>: ${contribs[name]?.amount || 0} FCFA</p>
          ${Object.entries(years).map(([year, months]) => `
            <p><strong>${year}</strong></p>
            <p>Payé: ${months.map((p, i) => p ? ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][i] : '').filter(Boolean).join(', ')}</p>
            <p>Non payé: ${months.map((p, i) => !p ? ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][i] : '').filter(Boolean).join(', ')}</p>
          `).join('')}
        </div>
      `).join('');
    });
  });
}

function updateStats() {
  const totalAmountCanvas = document.getElementById('stats-total-amount');
  const membersCanvas = document.getElementById('stats-members');
  const statusCanvas = document.getElementById('stats-status');
  const contributionsCanvas = document.getElementById('stats-contributions');
  if (!totalAmountCanvas || !membersCanvas || !statusCanvas || !contributionsCanvas) return;
  get(ref(db, 'members')).then((memberSnapshot) => {
    get(ref(db, 'contributions')).then((contribSnapshot) => {
      const members = memberSnapshot.val() || {};
      const contributions = contribSnapshot.val() || {};
      const totalAmount = Object.values(members).reduce((sum, m) => {
        return sum + Object.entries(m.contributions || {}).reduce((s, [name, years]) => {
          return s + Object.values(years).reduce((t, months) => {
            return t + (Array.isArray(months) ? months.filter(p => p).length * (contributions[name]?.amount || 0) : 0);
          }, 0);
        }, 0);
      }, 0);
      const membersCount = Object.keys(members).length;
      const activeMembers = Object.values(members).filter(m => m.status === 'actif').length;
      const upToDateMembers = Object.values(members).filter(m => {
        return Object.values(m.contributions || {}).every(years => {
          return Object.values(years).every(months => Array.isArray(months) && months.every(p => p));
        });
      }).length;

      new Chart(totalAmountCanvas, {
        type: 'bar',
        data: {
          labels: ['Somme totale'],
          datasets: [{ label: 'Montant (FCFA)', data: [totalAmount], backgroundColor: '#9b9c28' }]
        }
      });

      new Chart(membersCanvas, {
        type: 'pie',
        data: {
          labels: ['Membres'],
          datasets: [{ data: [membersCount], backgroundColor: ['#3a6241'] }]
        }
      });

      new Chart(statusCanvas, {
        type: 'pie',
        data: {
          labels: ['Actifs', 'Inactifs', 'Liste noire'],
          datasets: [{ data: [activeMembers, membersCount - activeMembers - Object.values(members).filter(m => m.status === 'liste-noire').length, Object.values(members).filter(m => m.status === 'liste-noire').length], backgroundColor: ['#3a6241', '#778152', '#9b9c28'] }]
        }
      });

      new Chart(contributionsCanvas, {
        type: 'bar',
        data: {
          labels: ['À jour', 'En retard'],
          datasets: [{ label: 'Membres', data: [upToDateMembers, membersCount - upToDateMembers], backgroundColor: ['#3a6241', '#9b9c28'] }]
        }
      });
    });
  });
}

function updateCallMembersList() {
  const search = document.querySelector('#video-calls-search')?.value.toLowerCase() || '';
  const list = document.querySelector('#members-call-list');
  if (!list) return;
  get(ref(db, 'members')).then((snapshot) => {
    const members = snapshot.val() || {};
    list.innerHTML = Object.values(members)
      .filter(m => `${m.firstname} ${m.lastname}`.toLowerCase().includes(search) || m.code.toLowerCase().includes(search))
      .map(m => `
        <div class="member-card">
          <input type="checkbox" id="call-${m.code}" value="${m.code}" onchange="updateSelectedCallMembers('${m.code}', this.checked)">
          <label for="call-${m.code}">${m.firstname} ${m.lastname} (MEMBRE${m.code})</label>
        </div>
      `).join('');
  });
}

function updateSelectedCallMembers(code, checked) {
  if (checked) {
    selectedCallMembers.push(code);
  } else {
    selectedCallMembers = selectedCallMembers.filter(c => c !== code);
  }
}

function toggleCallAll() {
  const checkAll = document.querySelector('#call-all')?.checked;
  if (checkAll === undefined) return;
  get(ref(db, 'members')).then((snapshot) => {
    const members = snapshot.val() || {};
    selectedCallMembers = checkAll ? Object.keys(members) : [];
    document.querySelectorAll('#members-call-list input[type=checkbox]').forEach(checkbox => {
      checkbox.checked = checkAll;
    });
  });
}

function initVideoCall() {
  if (!currentUser || !['admin', 'tresorier', 'president', 'secretaire'].includes(currentUser.role)) {
    const container = document.querySelector('#video-call-container');
    if (container) {
      container.innerHTML = '<p>Accès réservé aux membres du bureau.</p>';
    }
    return;
  }
  updateCallMembersList();
  const container = document.querySelector('#video-call-container');
  if (container) {
    container.innerHTML = '<p>Sélectionnez les membres à appeler ou cochez "Cocher tout".</p>';
  }
}

function startCall(type) {
  if (!currentUser || !['admin', 'tresorier', 'president', 'secretaire'].includes(currentUser.role)) return;
  if (selectedCallMembers.length === 0) {
    alert('Veuillez sélectionner au moins un membre.');
    return;
  }
  const roomId = `ansar-room-${Date.now()}`;
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmFwcGVhci5pbiIsImF1ZCI6Imh0dHBzOi8vYXBpLmFwcGVhci5pbi92MSIsImV4cCI6OTAwNzE5OTI1NDc0MDk5MSwiaWF0IjoxNzUyNzQzMzY5LCJvcmdhbml6YXRpb25JZCI6MzIwMzY3LCJqdGkiOiJmYzdmMjhiYS0xZTViLTRhYjAtOGQwZi1kZWNjNzAxYzkyNzAifQ.2WXwlPQj_-Da17X3IXJrVFYfiAsGlxzaRftPiG5oFWI';
  const videoCallContainer = document.querySelector('#video-call-container');
  if (videoCallContainer) {
    const roomUrl = `https://ansar-almouyassar.whereby.com/${roomId}?token=${token}&${type === 'audio' ? 'audioOnly=true' : ''}&displayName=${currentUser.firstname || 'Admin'} ${currentUser.lastname || ''}`;
    videoCallContainer.innerHTML = `<whereby-embed room="${roomUrl}"></whereby-embed>`;
    alert(`${type === 'video' ? 'Appel vidéo' : 'Appel audio'} démarré avec ${selectedCallMembers.length} membre(s).`);
  }
}

function payViaWave() {
  console.log('Bouton Wave cliqué');
  window.open('https://pay.wave.com/m/M_sn_dyIw8DZWV46K/c/sn/?amount=2000', '_blank');
}

function payViaOrangeMoney() {
  console.log('Bouton Orange Money cliqué');
  window.open('https://sugu.orange-sonatel.com/mp/dc3PQ0eEeSdcKQWVvcTH2Z', '_blank');
}

function sendNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  } else if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, { body });
      }
    });
  }
}

function attachEventListeners() {
  document.querySelector('#members-search')?.addEventListener('input', updateMembersList);
  document.querySelector('#events-search')?.addEventListener('input', updateEventsList);
  document.querySelector('#coran-search')?.addEventListener('input', updateCoranContent);
  document.querySelector('#library-search')?.addEventListener('input', updateLibraryContent);
  document.querySelector('#edit-member-search')?.addEventListener('input', updateEditMembersList);
  document.querySelector('#gallery-admin-search')?.addEventListener('input', updateGalleryAdminList);
  document.querySelector('#events-admin-search')?.addEventListener('input', updateEventsAdminList);
  document.querySelector('#messages-admin-search')?.addEventListener('input', updateMessagesAdminList);
  document.querySelector('#notes-search')?.addEventListener('input', updateNotesList);
  document.querySelector('#internal-docs-search')?.addEventListener('input', updateInternalDocsList);
  document.querySelector('#suggestions-search')?.addEventListener('input', updateSuggestionsList);
  document.querySelector('#video-calls-search')?.addEventListener('input', updateCallMembersList);
  document.querySelector('#auto-messages-search')?.addEventListener('input', updateAutoMessagesList);
  document.querySelector('#contributions-admin-search')?.addEventListener('input', updateContributionsAdminList);
  document.querySelector('#president-files-search')?.addEventListener('input', updatePresidentFilesList);
  document.querySelector('#secretary-files-search')?.addEventListener('input', updateSecretaryFilesList);
  document.querySelector('#settings-language')?.addEventListener('change', () => console.log('Langue changée'));
  document.querySelector('.settings-icon')?.addEventListener('click', () => {
    console.log('Icône paramètres cliquée');
    showPage('settings');
  });
  document.querySelector('button[onclick="toggleTheme()"]')?.addEventListener('click', toggleTheme);
  document.querySelector('button[onclick="payViaWave()"]')?.addEventListener('click', payViaWave);
  document.querySelector('button[onclick="payViaOrangeMoney()"]')?.addEventListener('click', payViaOrangeMoney);
  document.querySelector('button[onclick="logoutPersonal()"]')?.addEventListener('click', logoutPersonal);
  document.querySelector('button[onclick="clearChatHistory()"]')?.addEventListener('click', clearChatHistory);
  document.querySelector('button[onclick="enterSecret()"]')?.addEventListener('click', enterSecret);
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('Document chargé, initialisation des écouteurs d’événements');
  attachEventListeners();
  initDB();
});
