import { API_URL } from "../config.js";
import { redirectToApp } from "./utils.js";

export async function checkAuth() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            credentials: 'include', // Envoie le cookie
            headers: { 'Content-Type': 'application/json' }
        });
        return response.ok ? await response.json() : null;
    } catch (e) {
        return null;
    }
}

export async function initLoginRegisterPages() {
    const authData = await checkAuth();

    if (authData && authData.authenticated) {
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
            credentials: 'include',
            body: JSON.stringify({ login: email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Identifiants incorrects");
        }
        redirectToApp();

    } catch (err) {
        document.getElementById("authError").textContent = err.message;
    }
}

export async function register() {
    const email = document.getElementById("email").value;
    const firstname = document.getElementById("firstname").value;
    const lastname = document.getElementById("lastname").value;
    const password = document.getElementById("password").value;

    const confirmInput = document.getElementById("passwordConfirm");
    const passwordConfirm = confirmInput ? confirmInput.value : password;

    if (!email || !password || !firstname || !lastname) {
        document.getElementById("authError").textContent = "Veuillez remplir tous les champs";
        return;
    }

    if (password.length < 8) {
        document.getElementById("authError").textContent =
            "Le mot de passe doit contenir au moins 8 caractères";
        return;
    }

    if (password !== passwordConfirm) {
        document.getElementById("authError").textContent =
            "Les mots de passe ne correspondent pas";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({
                login: email,
                email,
                firstname,
                lastname,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Erreur lors de l'inscription");
        }
        redirectToApp();

    } catch (err) {
        document.getElementById("authError").textContent = err.message;
    }
}

export async function logout() {
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (e) {
    } finally {
        window.location.href = "login.html";
    }
}