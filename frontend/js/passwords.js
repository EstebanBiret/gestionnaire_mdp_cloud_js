import { API_URL } from "../config.js";
import { escapeHtml } from "./utils.js";
import { closeModal, editingPasswordId, setEditingPasswordId } from "./modal.js";
import { getSessionId } from "./auth.js";

export async function loadPasswords() {
    const sessionId = getSessionId();

    try {
        const response = await fetch(`${API_URL}/passwords`, {
            headers: { "Authorization": `Bearer ${sessionId}` }
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        const passwords = await response.json();
        displayPasswords(passwords);
    } catch (err) {
        console.error("Erreur lors du chargement:", err);
    }
}

export function displayPasswords(passwords) {
    const container = document.getElementById("passwordsList");

    if (passwords.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h2>Aucun mot de passe enregistré</h2>
                <p>Commencez par ajouter votre premier mot de passe</p>
            </div>
        `;
        return;
    }

    container.innerHTML = passwords.map(pwd => {
        const decrypted = atob(pwd.encryptedPassword || "");
        const safeSite = escapeHtml(pwd.site);
        const safeLogin = escapeHtml(pwd.login);

        return `
        <div class="password-card" id="pwd-${pwd.id}">
            <h3>${safeSite}</h3>
            <p><strong>Login :</strong> ${safeLogin}</p>

            <p>
                <strong>Mot de passe :</strong>
                <span id="pwd-value-${pwd.id}" class="password-hidden">••••••••</span>

                <button class="btn-eye" onclick="togglePassword('${pwd.id}', '${decrypted}')">👁️</button>
                <button class="btn-copy" onclick="copyPassword('${decrypted}')">📋</button>
            </p>

            <div class="actions">
                <button class="btn-edit" onclick="editPassword('${pwd.id}')">✏️ Modifier</button>
                <button class="btn-delete" onclick="deletePassword('${pwd.id}')">🗑️ Supprimer</button>
            </div>
        </div>
        `;
    }).join("");
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
        console.log("Réponse API:", data);

        if (!response.ok) {
            throw new Error(data.error || "Erreur lors de l'enregistrement");
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

        const data = await response.json();
        console.log("Réponse API:", data);

        if (!response.ok) throw new Error("Erreur lors de la suppression");

        loadPasswords();
    } catch (error) {
        alert(error.message);
    }
}

export function editPassword(id) {
    setEditingPasswordId(id);

    document.getElementById("modalTitle").textContent = "Modifier le mot de passe";
    document.getElementById("modalSite").value = "";
    document.getElementById("modalLogin").value = "";
    document.getElementById("modalPassword").value = "";
    document.getElementById("modalError").textContent = "";

    document.getElementById("modal").style.display = "block";
}

window.editPassword = editPassword;
window.deletePassword = deletePassword;
window.togglePassword = function (id, value) {
    const span = document.getElementById(`pwd-value-${id}`);

    if (span.classList.contains("password-hidden")) {
        span.textContent = value;
        span.classList.remove("password-hidden");
    } else {
        span.textContent = "••••••••";
        span.classList.add("password-hidden");
    }
};

window.copyPassword = function (value) {
    navigator.clipboard.writeText(value)
        .then(() => alert("Mot de passe copié !"))
        .catch(() => alert("Impossible de copier le mot de passe"));
};
