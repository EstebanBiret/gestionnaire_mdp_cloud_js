import { API_URL } from "../config.js";
import { escapeHtml } from "./utils.js";
import { closeModal, editingPasswordId, setEditingPasswordId } from "./modal.js";
import { getSessionId, logout } from "./auth.js";

const passwordById = new Map();

export async function loadPasswords() {
    const sessionId = getSessionId();

    try {
        const response = await fetch(`${API_URL}/passwords`, {
            headers: { "Authorization": `Bearer ${sessionId}` }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        const passwords = await response.json();
        displayPasswords(passwords);
    } catch (err) {

    }
}

export function displayPasswords(passwords) {
    const container = document.getElementById("passwordsList");
    const emptyState = document.getElementById("emptyState");

    container.innerHTML = "";
    emptyState.innerHTML = "";

    if (!passwords || passwords.length === 0) {
        emptyState.innerHTML = `
            <div class="empty-state">
                <h2>Aucun mot de passe enregistré</h2>
                <p>Commencez par ajouter votre premier mot de passe !</p>
            </div>
        `;
        return;
    }

    passwordById.clear();

    passwords.forEach(pwd => {
        let decrypted = "";
        try {
            decrypted = atob(pwd.encryptedPassword || "");
        } catch {
            decrypted = "Erreur déchiffrement";
        }

        const masked = (decrypted === "Erreur déchiffrement")
            ? "•".repeat(8)
            : "•".repeat(Math.max(1, decrypted.length));

        const safeSite = escapeHtml(pwd.site);
        const safeLogin = escapeHtml(pwd.login);

        passwordById.set(pwd.id, {
            site: pwd.site,
            login: pwd.login,
            decrypted
        });

        const card = document.createElement("div");
        card.className = "password-card";
        card.id = `pwd-${pwd.id}`;

        card.innerHTML = `
            <h3>${safeSite}</h3>
            <p><strong>Login :</strong> ${safeLogin}</p>

            <p>
                <strong>Mot de passe :</strong>
                <span id="pwd-value-${pwd.id}" class="password-hidden">${masked}</span>
            </p>

            <p>
                <button class="btn-eye" onclick="togglePassword('${pwd.id}', '${decrypted}')">Afficher</button>
                <button class="btn-copy" onclick="copyPassword('${decrypted}')">Copier</button>
            </p>

            <div class="actions">
                <button class="btn-edit" onclick="editPassword('${pwd.id}')">✏️ Modifier</button>
                <button class="btn-delete" onclick="deletePassword('${pwd.id}')">🗑️ Supprimer</button>
            </div>
        `;

        container.appendChild(card);
    });
}

export async function savePassword() {
    const sessionId = getSessionId();
    const site = document.getElementById("modalSite").value;
    const login = document.getElementById("modalLogin").value;
    const password = document.getElementById("modalPassword").value;

    if (!site || !login || !password) {
        document.getElementById("modalError").textContent = "Veuillez remplir tous les champs";
        return;
    }

    if (password.length < 8) {
        document.getElementById("modalError").textContent =
            "Le mot de passe doit contenir au moins 8 caractères";
        return;
    }

    try {
        const encryptedPassword = btoa(password);
        let url, method;

        if (editingPasswordId.value) {
            url = `${API_URL}/passwords/${editingPasswordId.value}`;
            method = "PUT";
        } else {
            url = `${API_URL}/passwords`;
            method = "POST";
        }

        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${sessionId}`
            },
            body: JSON.stringify({ site, login, encryptedPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            throw new Error(data.message || data.error || "Erreur lors de l'enregistrement");
        }

        closeModal();
        loadPasswords();
    } catch (error) {
        document.getElementById("modalError").textContent = error.message;
    }
}

export async function deletePassword(id) {
    const sessionId = getSessionId();

    if (!confirm("Êtes-vous sûr de vouloir supprimer ce mot de passe ?")) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/passwords/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${sessionId}` }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Erreur lors de la suppression");
        }

        loadPasswords();
    } catch (error) {
        alert(error.message);
    }
}

export function editPassword(id) {
    setEditingPasswordId(id);

    document.getElementById("modalTitle").textContent = "Modifier le mot de passe";
    const entry = passwordById.get(id);
    if (entry) {
        document.getElementById("modalSite").value = entry.site;
        document.getElementById("modalLogin").value = entry.login;
        document.getElementById("modalPassword").value = entry.decrypted === "Erreur déchiffrement" ? "" : entry.decrypted;
    } else {
        document.getElementById("modalSite").value = "";
        document.getElementById("modalLogin").value = "";
        document.getElementById("modalPassword").value = "";
    }
    document.getElementById("modalError").textContent = "";

    document.getElementById("modal").style.display = "block";
}

window.editPassword = editPassword;
window.deletePassword = deletePassword;

window.togglePassword = function (id, value) {
    const span = document.getElementById(`pwd-value-${id}`);
    const btn = event.target;

    if (span.classList.contains("password-hidden")) {
        span.textContent = value;
        span.classList.remove("password-hidden");
        btn.textContent = "Masquer";
    } else {
        const masked = (value === "Erreur déchiffrement") ? '•'.repeat(8) : '•'.repeat(Math.max(1, value.length));
        span.textContent = masked;
        span.classList.add("password-hidden");
        btn.textContent = "Afficher";
    }
};

window.copyPassword = function (value) {
    navigator.clipboard.writeText(value)
        .then(() => alert("Mot de passe copié !"))
        .catch(() => alert("Impossible de copier le mot de passe"));
};