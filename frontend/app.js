import { loadPasswords } from "./js/passwords.js";
import { API_URL } from "./config.js";

export async function initApp() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error("Non authentifié");
        }

        const data = await response.json();
        const user = data.user;

        const displayName = (user.firstname && user.lastname)
            ? `${user.firstname} ${user.lastname}`
            : user.email;

        document.getElementById("username").textContent = displayName;

        loadPasswords();

    } catch (error) {
        window.location.href = "login.html";
    }
}