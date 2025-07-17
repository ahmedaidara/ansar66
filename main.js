const firebaseConfig = {
  apiKey: "AIzaSyB7-fXR59CqNMyYgZTDAdBNpMTE_GkcOlA",
  authDomain: "ansar-93d9e.firebaseapp.com",
  databaseURL: "https://ansar-93d9e-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ansar-93d9e",
  storageBucket: "ansar-93d9e.appspot.com",
  messagingSenderId: "697623655771",
  appId: "1:697623655771:web:2487489b5825ab211f567e",
  measurementId: "G-N3LBBHM2N0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();
let isChatOpen = false;

window.showPage = function(pageId) {
  const page = document.querySelector(`#${pageId}`);
  if (!page) return console.error(`Page ${pageId} non trouvée`);
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  page.classList.add('active');
  const navItem = document.querySelector(`a[onclick="showPage('${pageId}')"]`);
  if (navItem) navItem.classList.add('active');
  console.log(`Page ${pageId} affichée`);
};

window.showTab = function(tabId) {
  const tab = document.querySelector(`#${tabId}`);
  if (!tab) return console.error(`Onglet ${tabId} non trouvé`);
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
  tab.classList.add('active');
  const tabButton = document.querySelector(`button[onclick="showTab('${tabId}')"]`);
  if (tabButton) tabButton.classList.add('active');
  console.log(`Onglet ${tabId} affiché`);
};

window.toggleTheme = function() {
  document.body.classList.toggle('dark-mode');
  console.log('Thème basculé');
};

window.toggleChatbot = function() {
  isChatOpen = !isChatOpen;
  const chatbot = document.querySelector('#chatbot');
  if (!chatbot) return console.error('Chatbot non trouvé');
  chatbot.style.display = isChatOpen ? 'flex' : 'none';
  if (isChatOpen) {
    const messages = document.querySelector('#chatbot-messages');
    if (messages) {
      messages.innerHTML = `
        <div class="chatbot-message received">
          Bienvenue ! Posez une question ou utilisez un mot-clé.
          <button class="clear-chat" onclick="clearChatHistory()">
            <span class="material-icons">delete</span>
          </button>
        </div>`;
    }
  }
  console.log(`Chatbot ${isChatOpen ? 'ouvert' : 'fermé'}`);
};

window.clearChatHistory = function() {
  const messages = document.querySelector('#chatbot-messages');
  if (messages) {
    messages.innerHTML = `
      <div class="chatbot-message received">
        Historique effacé.
        <button class="clear-chat" onclick="clearChatHistory()">
          <span class="material-icons">delete</span>
        </button>
      </div>`;
    console.log('Historique effacé');
  }
};

window.enterSecret = function() {
  const password = document.querySelector('#secret-password')?.value;
  const messages = document.querySelector('#chatbot-messages');
  if (!password || !messages) return console.error('Mot de passe ou messages non trouvés');
  if (['JESUISMEMBRE66', '33333333'].includes(password)) {
    showPage('secret');
    toggleChatbot();
    console.log('Accès Admin réussi');
  } else {
    messages.innerHTML += '<div class="chatbot-message received">Mot de passe incorrect.</div>';
    messages.scrollTop = messages.scrollHeight;
    console.log('Mot de passe incorrect');
  }
};

function init() {
  console.log('Initialisation...');
  const defaultData = {
    members: {
      '001': {
        code: '001', firstname: 'Mouhamed', lastname: 'Niang', age: 45, dob: '01012000',
        birthplace: 'Dakar', photo: '/assets/images/logo.png', email: 'mouhamed.niang@example.com',
        activity: 'Président', address: '123 Rue Principale, Dakar', phone: '+221123456789',
        residence: 'Dakar', role: 'president', status: 'actif',
        contributions: { 'Mensuelle': { '2023': Array(12).fill(false), '2024': Array(12).fill(false), '2025': Array(12).fill(false) } }
      }
    },
    contributions: { 'mensuelle': { name: 'Mensuelle', amount: 2000, years: ['2023', '2024', '2025'] } },
    events: { 'event1': { name: 'Conférence Annuelle', description: 'Conférence 2025', image: '/assets/images/logo.png', datetime: '2025-08-17T15:00:00' } }
  };

  ['members', 'contributions', 'events'].forEach(collection => {
    db.ref(collection).once('value', snapshot => {
      if (!snapshot.exists()) {
        db.ref(collection).set(defaultData[collection]);
        console.log(`${collection} initialisé`);
      }
    });
  });

  document.querySelector('.chatbot-button')?.addEventListener('click', toggleChatbot);
  document.querySelector('#chatbot-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const input = document.querySelector('#chatbot-input');
    const messages = document.querySelector('#chatbot-messages');
    if (!input || !messages) return;
    const message = input.value.trim();
    if (!message) return;
    messages.innerHTML += `<div class="chatbot-message sent">${message}</div>`;
    if (['ADMIN12301012000', '00000000'].includes(message)) {
      const secretEntry = document.querySelector('#secret-entry');
      if (secretEntry) {
        secretEntry.style.display = 'block';
        setTimeout(() => {
          secretEntry.style.display = 'none';
          console.log('Secret fermé après 30s');
        }, 30000);
      }
    } else {
      messages.innerHTML += `<div class="chatbot-message received">Désolé, essayez "association", "membre", ou "cotisation".</div>`;
    }
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
  });

  document.querySelector('#secret-submit')?.addEventListener('click', enterSecret);
  document.querySelector('#wave-button')?.addEventListener('click', () => alert('Paiement Wave...'));
  document.querySelector('#orange-money-button')?.addEventListener('click', () => alert('Paiement Orange Money...'));
  document.addEventListener('click', e => {
    if (isChatOpen && !document.querySelector('#chatbot')?.contains(e.target) && !document.querySelector('.chatbot-button')?.contains(e.target)) {
      toggleChatbot();
      console.log('Chatbot fermé (clic dehors)');
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
