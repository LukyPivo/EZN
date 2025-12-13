const modal = document.getElementById("modal");
const openBtn = document.getElementById("openForm");
const cancelBtn = document.getElementById("cancel");
const saveBtn = document.getElementById("save");
const cards = document.getElementById("cards");

openBtn.onclick = () => modal.classList.add("show");
cancelBtn.onclick = () => modal.classList.remove("show");

saveBtn.onclick = () => {
    const name = document.getElementById("name").value;
    const date = document.getElementById("date").value;
    const place = document.getElementById("place").value;
    const desc = document.getElementById("desc").value;
    const status = document.getElementById("status").value;
    const imageInput = document.getElementById("image");

    if (!name) return alert("Vyplň název");

    const card = document.createElement("div");
    card.className = `card ${status}`;

    if (imageInput.files[0]) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(imageInput.files[0]);
        card.appendChild(img);
    }

    card.innerHTML += `
        <h3>${name}</h3>
        <p>${place}</p>
        <p>${date}</p>
        <p>${desc}</p>
    `;

    cards.appendChild(card);

    modal.classList.remove("show");
    document.querySelectorAll(".modal-box input, textarea").forEach(i => i.value = "");
};
