const loginModal = document.getElementById("loginModal");
const loginBtn = document.getElementById("loginBtn");
const loginCancel = document.getElementById("loginCancel");
const loginSubmit = document.getElementById("loginSubmit");

let loggedIn = false;



const modal = document.getElementById("modal");                                 //formulař
const openFoundBtn = document.getElementById("openFound");                      //tlacitko nalezená
const openLostBtn = document.getElementById("openLost");                        //tlacitko ztracená
const cancelBtn = document.getElementById("cancel");                            //lacitko zrušit
const saveBtn = document.getElementById("save");                                //tlačítko ulozit
const cards = document.getElementById("cards");                                 // kontejner pridavani karet

//OTEVŘENÍ A ZAVŘENÍ FORMULÁŘE
openFoundBtn.onclick = () => {
    document.getElementById("status").value = "found";
    modal.classList.add("show");
};
openLostBtn.onclick = () => {
    document.getElementById("status").value = "lost";
    modal.classList.add("show");
};
cancelBtn.onclick = () => modal.classList.remove("show");                       //zavře po kliknutí na zrušit


//ULOŽENÍ NOVE VĚCI 

saveBtn.onclick = () => {

    //nacteni z formuláře
    const name = document.getElementById("name").value;                         // název věci
    const date = document.getElementById("date").value;                         // datum
    const place = document.getElementById("place").value;                       // místo
    const desc = document.getElementById("desc").value;                         // popis
    const status = document.getElementById("status").value;                     // found / lost
    const imageInput = document.getElementById("image");                        // obrázek

    //OVĚŘENÍ jestli je vše vyplněné
    if (!name) return alert("Vyplň název");
    if (!date) return alert("Vyplň datum");
    if (!place) return alert("Vyplň místo nalezení");
    if (!status) return alert("Veber sttus věci");
    if (!name || !image)  return alert("Vyplň obrazek nebo popis");
   
    const card = document.createElement("div");                                 // vytvoření nové karty
    card.className = `card ${status}`;                                          // třída card a nalezena nebo ztracena kvuli barvě

    //OBRÁZEK
    // pokud je vybrana fotka
    if (imageInput.files[0]) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(imageInput.files[0]);
        card.appendChild(img);
    }


    //=============================================================================================================================




    //OBSAH KARTY
    card.innerHTML += `
        <h3>${name}</h3>
        <p>${place}</p>
        <p>${date}</p>
        <p>${desc}</p>

        <div class="card-actions">
            <button class="btn-done">Vyřízeno</button>
            <button class="btn-delete">Smazat</button>
        </div>
    `;

    //VYŘÍZENO
    card.querySelector(".btn-done").onclick = () => {                           // přepíná stav vyřízeno / nevyřízeno
        card.classList.toggle("done");
    };

    //SMAZAT
    card.querySelector(".btn-delete").onclick = () => {
    if (!loggedIn) {
        alert("Mazat může jen přihlášený");
        return;
    }
    card.remove();
    };


    // přidání karty na stránku
    cards.appendChild(card);

    // zavření fromuláře
    modal.classList.remove("show");

    // vymazání formuláře
    document.querySelectorAll(".modal-box input, textarea")
        .forEach(i => i.value = "");

        
        loginBtn.onclick = () => {
    if (loggedIn) {
        loggedIn = false;
        loginBtn.innerText = "Přihlásit se";
    } else {
        loginModal.classList.add("show");
    }
    };

    loginCancel.onclick = () => {
    loginModal.classList.remove("show");
    };

    loginSubmit.onclick = () => {
    const user = document.getElementById("loginUser").value;
    const pass = document.getElementById("loginPass").value;

    if (user === "admin" && pass === "1234") {
        loggedIn = true;
        loginBtn.innerText = "Odhlásit se";
        loginModal.classList.remove("show");
    } else {
        alert("Špatné jméno nebo heslo");
    }
    };

};