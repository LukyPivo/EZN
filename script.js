//FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyCpdBUnMwa7LR2_ZONu7BUG3trooman_Q4",
    authDomain: "ghb-evidence.firebaseapp.com",
    projectId: "ghb-evidence",
    storageBucket: "ghb-evidence.firebasestorage.app",
    messagingSenderId: "473485992439",
    appId: "1:473485992439:web:1150e92edbbe55c3594ef2",
    measurementId: "G-JQGNHWTQ28"
};

firebase.initializeApp(firebaseConfig);
const db   = firebase.firestore();
const auth = firebase.auth();

// stav přihlášení (true = admin, false = běžný uživatel)
let loggedIn = false;

// ELEMENTY
const modal       = document.getElementById("modal");
const loginModal  = document.getElementById("loginModal");
const cards       = document.getElementById("cards");
const loginBtn    = document.getElementById("loginBtn");
const loginError  = document.getElementById("loginError");
const loadingOvrl = document.getElementById("loadingOverlay");

//  PŘIHLÁŠENÍ / ODHÁŠENÍ
auth.onAuthStateChanged(user => {
    loggedIn = !!user;
    loginBtn.innerText = user ? "Odhlásit se" : "Přihlásit se";
});

loginBtn.onclick = () => {
    if (loggedIn) {
        auth.signOut();
    } else {
        loginModal.classList.add("show");
        loginError.style.display = "none";
    }
};

document.getElementById("loginCancel").onclick = () => loginModal.classList.remove("show");

document.getElementById("loginSubmit").onclick = async () => {
    const email = document.getElementById("loginEmail").value.trim();
    const pass  = document.getElementById("loginPass").value;
    try {
        await auth.signInWithEmailAndPassword(email, pass);
        loginModal.classList.remove("show");
    } catch {
        loginError.textContent = "Špatný e-mail nebo heslo.";
        loginError.style.display = "block";
    }
};


//  OTEVŘENÍ FORMULÁŘE
document.getElementById("openFound").onclick = () => {
    document.getElementById("status").value = "found";
    modal.classList.add("show");
};
document.getElementById("openLost").onclick = () => {
    document.getElementById("status").value = "lost";
    modal.classList.add("show");
};
document.getElementById("cancel").onclick = () => modal.classList.remove("show");


//  ZMENŠENÍ OBRÁZKU max 800px
//  Firestore limit je 1 MB na dokument
function resizeImage(file, maxSize = 800, quality = 0.7) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let w = img.width, h = img.height;

                // Zmenšit na max 800px (zachovat poměr stran)
                if (w > h && w > maxSize) { h = h * maxSize / w; w = maxSize; }
                else if (h > maxSize)     { w = w * maxSize / h; h = maxSize; }

                canvas.width  = w;
                canvas.height = h;
                canvas.getContext("2d").drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL("image/jpeg", quality));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}


//  ULOŽENÍ → Firestore (obrázek jako base64)
document.getElementById("save").onclick = async () => {
    const name       = document.getElementById("name").value.trim();
    const date       = document.getElementById("date").value;
    const place      = document.getElementById("place").value.trim();
    const desc       = document.getElementById("desc").value.trim();
    const status     = document.getElementById("status").value;
    const imageInput = document.getElementById("image");

    if (!name)  return alert("Vyplň název");
    if (!date)  return alert("Vyplň datum");
    if (!place) return alert("Vyplň místo");

    loadingOvrl.style.display = "flex";

    try {
        let imageBase64 = null;

        if (imageInput.files[0]) {
            imageBase64 = await resizeImage(imageInput.files[0]);
        }

        await db.collection("veci").add({
            name,
            date,
            place,
            desc,
            status,
            imageBase64,   // uloženo přímo do Firestore, žádný Storage
            done: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        modal.classList.remove("show");
        document.querySelectorAll(".modal-box input, .modal-box textarea")
            .forEach(i => i.value = "");

    } catch (err) {
        console.error(err);
        alert("Chyba při ukládání: " + err.message);
    } finally {
        loadingOvrl.style.display = "none";
    }
};


//  NAČTENÍ KARET Z FIRESTORE (real-time)
db.collection("veci")
  .orderBy("createdAt", "desc")
  .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
          const el = document.getElementById(`card-${change.doc.id}`);
          if (change.type === "removed") { if (el) el.remove(); return; }
          if (change.type === "modified") { if (el) el.remove(); }
          renderCard(change.doc);
      });
  });


//  VYTVOŘENÍ KARTY
function renderCard(doc) {
    const data = doc.data();
    const id   = doc.id;

    const card = document.createElement("div");
    card.id        = `card-${id}`;
    card.className = `card ${data.status}${data.done ? " done" : ""}`;

    if (data.imageBase64) {
        const img = document.createElement("img");
        img.src = data.imageBase64;
        card.appendChild(img);
    }

    const content = document.createElement("div");
    content.innerHTML = `
        <h3>${data.name}</h3>
        <p>${data.place}</p>
        <p>${data.date}</p>
        <p>${data.desc || ""}</p>
        <div class="card-actions">
            <button class="btn-done">${data.done ? "Obnovit" : "Vyřízeno"}</button>
            <button class="btn-delete">Smazat</button>
        </div>
    `;
    card.appendChild(content);

    content.querySelector(".btn-done").onclick = async () => {
        await db.collection("veci").doc(id).update({ done: !data.done });
    };

    content.querySelector(".btn-delete").onclick = async () => {
        if (!loggedIn) { alert("Mazat může jen přihlášený administrátor."); return; }
        if (!confirm(`Opravdu smazat „${data.name}"?`)) return;
        await db.collection("veci").doc(id).delete();
    };

    cards.prepend(card);
    applyFilters();
}

// ── FILTROVÁNÍ ────────────────────────────────────────────────
let activeFilter = "all";

// stav tlačítek
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeFilter = btn.dataset.filter;
        applyFilters();
    };
});

// vyhledávání podle názvu
document.getElementById("searchName").addEventListener("input", applyFilters);

// řazení podle datumu
document.getElementById("sortDate").addEventListener("change", () => {
    sortCards();
    applyFilters();
});

function applyFilters() {
    const search = document.getElementById("searchName").value.trim().toLowerCase();

    document.querySelectorAll(".card").forEach(card => {
        const isDone   = card.classList.contains("done");
        const isFound  = card.classList.contains("found");
        const isLost   = card.classList.contains("lost");
        const name     = (card.querySelector("h3")?.textContent || "").toLowerCase();

        // stav filter
        let statusMatch = false;
        if (activeFilter === "all")   statusMatch = true;
        if (activeFilter === "found") statusMatch = isFound && !isDone;
        if (activeFilter === "lost")  statusMatch = isLost  && !isDone;
        if (activeFilter === "done")  statusMatch = isDone;

        // název filter
        const nameMatch = name.includes(search);

        card.style.display = (statusMatch && nameMatch) ? "" : "none";
    });
}

function sortCards() {
    const dir = document.getElementById("sortDate").value;
    const cardList = Array.from(document.querySelectorAll(".card"));

    cardList.sort((a, b) => {
        const dateA = a.querySelector("p:nth-child(3)")?.textContent || "";
        const dateB = b.querySelector("p:nth-child(3)")?.textContent || "";
        return dir === "asc"
            ? dateA.localeCompare(dateB)
            : dateB.localeCompare(dateA);
    });

    cardList.forEach(c => cards.appendChild(c));
}