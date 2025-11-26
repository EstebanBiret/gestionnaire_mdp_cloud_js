import { loadPasswords } from "./js/passwords.js";

export function initApp() {
    const sessionId = localStorage.getItem("sessionToken");
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    //TODO récup cet user via authorizer au lieu de local storage

    if (!sessionId || sessionId === "undefined" || !currentUser) {
        localStorage.removeItem("sessionToken");
        window.location.href = "login.html";
        return;
    }

    document.getElementById("username").textContent = currentUser.firstname + " " + currentUser.lastname;

    loadPasswords();
}