import { loadPasswords } from "./js/passwords.js";
import { getSessionId, getCurrentUser } from "./js/auth.js";

export function ensureAuth() {
    const sessionId = getSessionId();
    const user = getCurrentUser();

    if (!sessionId || !user) {
        window.location.replace("login.html");
        return null;
    }
    return user;
}

export function initApp() {
    const user = ensureAuth();
    if (!user) return;

    document.getElementById("username").textContent =
        `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim();

    loadPasswords();
}