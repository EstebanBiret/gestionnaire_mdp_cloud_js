import { loadPasswords } from "./js/passwords.js";

export function initApp() {
    const sessionId = localStorage.getItem("sessionId");
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

    if (!sessionId || !currentUser) {
        window.location.href = "login.html";
        return;
    }

    document.getElementById("username").textContent = currentUser.login;

    loadPasswords();
}