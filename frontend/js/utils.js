export function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

export function redirectToApp() {
    window.location.href = "index.html";
}