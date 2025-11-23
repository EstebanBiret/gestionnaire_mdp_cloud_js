import { loadPasswords } from "./js/passwords.js";

export function initApp() {
    const sessionId = localStorage.getItem("sessionToken");
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

    if (!sessionId || sessionId === "undefined" || !currentUser) {
        // Nettoyage préventif
        localStorage.removeItem("sessionToken");
        window.location.href = "login.html";
        return;
    }

    document.getElementById("username").textContent = currentUser.login;

    loadPasswords();
}