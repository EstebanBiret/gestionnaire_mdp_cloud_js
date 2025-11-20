import { API_URL } from "./config.js";
console.log("API :", API_URL);

let sessionId = null;
let currentUser = null;
let editingPasswordId = null;

// Chargement initial
document.addEventListener('DOMContentLoaded', () => {
    sessionId = localStorage.getItem('sessionId');
    currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (sessionId && currentUser) {
        showMainPage();
        loadPasswords();
    } else {
        showLoginPage();
    }
});

// Navigation entre login et register
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('authError').textContent = '';
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('authError').textContent = '';
}

function showLoginPage() {
    document.getElementById('loginPage').style.display = 'block';
    document.getElementById('mainPage').style.display = 'none';
}

function showMainPage() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('mainPage').style.display = 'block';
    document.getElementById('username').textContent = currentUser?.login || '';
}

// Authentification
async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        document.getElementById('authError').textContent = 'Veuillez remplir tous les champs';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login: username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erreur de connexion');
        }
        
        sessionId = data.sessionId;
        currentUser = { userId: data.userId, login: data.login };
        
        localStorage.setItem('sessionId', sessionId);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showMainPage();
        loadPasswords();
    } catch (error) {
        document.getElementById('authError').textContent = error.message;
    }
}

async function register() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    
    if (!username || !password) {
        document.getElementById('authError').textContent = 'Veuillez remplir tous les champs';
        return;
    }
    
    if (password.length < 8) {
        document.getElementById('authError').textContent = 'Le mot de passe doit contenir au moins 8 caractères';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login: username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erreur d\'inscription');
        }
        
        sessionId = data.sessionId;
        currentUser = { userId: data.userId, login: data.login };
        
        localStorage.setItem('sessionId', sessionId);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showMainPage();
        loadPasswords();
    } catch (error) {
        document.getElementById('authError').textContent = error.message;
    }
}

async function logout() {
    try {
        const response = await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${sessionId}`
            }
        });
    const data = await response.json();
    console.log('Logout response:', data);
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
    }
    
    sessionId = null;
    currentUser = null;
    localStorage.removeItem('sessionId');
    localStorage.removeItem('currentUser');
    showLoginPage();
}

// Gestion des mots de passe
async function loadPasswords() {
    try {
        const response = await fetch(`${API_URL}/passwords`, {
            headers: { 
                'Authorization': `Bearer ${sessionId}`
            }
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const passwords = await response.json();
        displayPasswords(passwords);
    } catch (error) {
        console.error('Erreur lors du chargement des mots de passe:', error);
    }
}

function displayPasswords(passwords) {
    const container = document.getElementById('passwordsList');
    
    if (passwords.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h2>Aucun mot de passe enregistré</h2>
                <p>Commencez par ajouter votre premier mot de passe</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = passwords.map(pwd => `
        <div class="password-card">
            <h3>${escapeHtml(pwd.site)}</h3>
            <p><strong>Login:</strong> ${escapeHtml(pwd.login)}</p>
            <p><strong>Mot de passe:</strong> ••••••••</p>
            <div class="actions">
                <button class="btn-edit" onclick="editPassword('${pwd.id}')">✏️ Modifier</button>
                <button class="btn-delete" onclick="deletePassword('${pwd.id}')">🗑️ Supprimer</button>
            </div>
        </div>
    `).join('');
}

// Modal
function showAddModal() {
    editingPasswordId = null;
    document.getElementById('modalTitle').textContent = 'Ajouter un mot de passe';
    document.getElementById('modalSite').value = '';
    document.getElementById('modalLogin').value = '';
    document.getElementById('modalPassword').value = '';
    document.getElementById('modalError').textContent = '';
    document.getElementById('modal').style.display = 'block';
}

function editPassword(id) {
    // Dans une vraie app, on récupérerait les détails du password
    // Pour simplifier, on demande juste les nouvelles valeurs
    editingPasswordId = id;
    document.getElementById('modalTitle').textContent = 'Modifier le mot de passe';
    document.getElementById('modalSite').value = '';
    document.getElementById('modalLogin').value = '';
    document.getElementById('modalPassword').value = '';
    document.getElementById('modalError').textContent = '';
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    editingPasswordId = null;
}

async function savePassword() {
    const site = document.getElementById('modalSite').value;
    const login = document.getElementById('modalLogin').value;
    const password = document.getElementById('modalPassword').value;
    
    if (!site || !login || !password) {
        document.getElementById('modalError').textContent = 'Veuillez remplir tous les champs';
        return;
    }
    
    try {
        // Ici, on devrait chiffrer le mot de passe côté client
        // Pour simplifier, on l'envoie tel quel (à ne PAS faire en production)
        const encryptedPassword = btoa(password); // Base64 simple pour la démo
        
        let url, method;
        if (editingPasswordId) {
            url = `${API_URL}/passwords/${editingPasswordId}`;
            method = 'PUT';
        } else {
            url = `${API_URL}/passwords`;
            method = 'POST';
        }
        
        const response = await fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionId}`
            },
            body: JSON.stringify({ site, login, encryptedPassword })
        });
        
        const data = await response.json();
        console.log("Réponse de l'API:", data);

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de l\'enregistrement');
        }
        
        closeModal();
        loadPasswords();
    } catch (error) {
        document.getElementById('modalError').textContent = error.message;
    }
}

async function deletePassword(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce mot de passe ?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/passwords/${id}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${sessionId}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la suppression');
        }
        
        loadPasswords();
    } catch (error) {
        alert(error.message);
    }
}

// Utilitaires
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Fermer le modal en cliquant en dehors
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
    }
}

// Expose functions to global scope so inline `onclick` attributes in `index.html`
// can call them even when this file is loaded as an ES module.
window.login = login;
window.register = register;
window.showRegister = showRegister;
window.showLogin = showLogin;
window.logout = logout;
window.showAddModal = showAddModal;
window.closeModal = closeModal;
window.savePassword = savePassword;
window.editPassword = editPassword;
window.deletePassword = deletePassword;