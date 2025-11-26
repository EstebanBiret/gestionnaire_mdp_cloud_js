export let editingPasswordId = { value: null };

export function setEditingPasswordId(id) {
    editingPasswordId.value = id;
}

export function showAddModal() {
    setEditingPasswordId(null);

    document.getElementById("modalTitle").textContent = "Ajouter un mot de passe";
    document.getElementById("modalSite").value = "";
    document.getElementById("modalLogin").value = "";
    document.getElementById("modalPassword").value = "";
    document.getElementById("modalError").textContent = "";
    document.getElementById("modal").style.display = "block";
}

export function closeModal() {
    document.getElementById("modal").style.display = "none";
    setEditingPasswordId(null);
}

export function generateStrongPassword() {
    const length = 20;

    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+[]{}<>?,.";

    const all = upper + lower + numbers + symbols;

    let pwd = "";
    pwd += upper[Math.floor(Math.random() * upper.length)];
    pwd += lower[Math.floor(Math.random() * lower.length)];
    pwd += numbers[Math.floor(Math.random() * numbers.length)];
    pwd += symbols[Math.floor(Math.random() * symbols.length)];

    for (let i = 4; i < length; i++) {
        pwd += all[Math.floor(Math.random() * all.length)];
    }
    pwd = pwd.split('').sort(() => 0.5 - Math.random()).join('');

    document.getElementById("modalPassword").value = pwd;
}

export function togglePasswordVisibility() {
    const input = document.getElementById("modalPassword");
    const toggle = document.querySelector(".toggle-password");
    
    if (input.type === "password") {
        input.type = "text";
        toggle.textContent = "Masquer";
    } else {
        input.type = "password";
        toggle.textContent = "Afficher";
    }
}