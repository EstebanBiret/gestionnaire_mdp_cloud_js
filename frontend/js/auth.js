import { API_URL } from "../config.js";
import { redirectToApp } from "./utils.js";

export function getSessionId() {
    const token = localStorage.getItem("sessionToken");
    if (!token || token === "undefined" || token === "null") return null;
    return token;
}

export function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch (e) {
        return null;
    }
}

export function initLoginRegisterPages() {
    const sessionId = getSessionId();
    const currentUser = getCurrentUser();

    if (sessionId && currentUser) {
        window.location.href = "index.html";
    }
}

export async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        document.getElementById("authError").textContent = "Veuillez remplir tous les champs";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login: email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Identifiants incorrects");
        }

        if (data.sessionToken) {
            localStorage.setItem("sessionToken", data.sessionToken);
            localStorage.setItem("currentUser", JSON.stringify({
                userId: data.userId,
                login: data.email || email
            }));
            redirectToApp();
        } else {
            throw new Error("Erreur: Token manquant dans la réponse");
        }

    } catch (err) {
        document.getElementById("authError").textContent = err.message;
    }
}

export async function register() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const firstname = document.getElementById("firstname").value;
    const lastname = document.getElementById("lastname").value;

    if (!email || !password || !firstname || !lastname) {
        document.getElementById("authError").textContent = "Veuillez remplir tous les champs";
        return;
    }

    if (password.length < 8) {
        document.getElementById("authError").textContent =
            "Le mot de passe doit contenir au moins 8 caractères";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                login: email,
                password,
                firstname,
                lastname
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Erreur lors de l'inscription");
        }

        if (data.sessionToken) {
            localStorage.setItem("sessionToken", data.sessionToken);
            localStorage.setItem("currentUser", JSON.stringify({
                userId: data.userId,
                login: data.login || email
            }));
            redirectToApp();
        } else {
            window.location.href = "login.html";
        }

    } catch (err) {
        document.getElementById("authError").textContent = err.message;
    }
}

export function logout() {
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
}