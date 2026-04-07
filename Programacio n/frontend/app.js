const btnHello = document.getElementById("btnHello");
const statusEl = document.getElementById("status");
const outputEl = document.getElementById("output");

function setStatus(msg) {
  statusEl.textContent = msg;
}

async function pedirHello() {
  try {
    setStatus("Consultando back-end...");
    outputEl.textContent = "";

    const res = await fetch("http://localhost:9021/api/hello", {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    outputEl.textContent = JSON.stringify(data, null, 2);
    setStatus("Listo.");
  } catch (err) {
    setStatus("Error al llamar al back-end.");
    outputEl.textContent = String(err);
  }
}

btnHello.addEventListener("click", pedirHello);

// Llama automáticamente al cargar.
pedirHello();

