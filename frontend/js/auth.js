import { API_URL } from "../config.js";
import { redirectToApp } from "./utils.js";

export function getSessionId() {
    return localStorage.getItem("sessionId");
}

export function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser") || "null");
}

export function initLoginPage() {
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
        if (!response.ok) throw new Error(data.error || "Erreur de connexion");

        localStorage.setItem("sessionId", data.sessionId);
        localStorage.setItem("currentUser", JSON.stringify({
            userId: data.userId,
            login: data.login,
            firstname: data.firstname,
            lastname: data.lastname
        }));

        redirectToApp();
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
            body: JSON.stringify({ login: email, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erreur d'inscription");

        localStorage.setItem("sessionId", data.sessionId);
        localStorage.setItem("currentUser", JSON.stringify({
            userId: data.userId,
            login: data.login,
            firstname: data.firstname,
            lastname: data.lastname
        }));

        redirectToApp();
    } catch (err) {
        document.getElementById("authError").textContent = err.message;
    }
}

export function logout() {
    localStorage.removeItem("sessionId");
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
}