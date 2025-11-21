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
