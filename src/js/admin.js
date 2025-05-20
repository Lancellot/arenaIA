// Exemplo simplificado – em produção, isto envolveria requisições a um back‑end seguro
function listarUsuarios() {
  const lista = document.getElementById("listaUsuarios");
  lista.innerHTML = "";
  // Supondo que os usuários foram armazenados com email como chave
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key) && key.indexOf("@") !== -1) {
      const user = JSON.parse(localStorage.getItem(key));
      const li = document.createElement("li");
      li.textContent = `${user.nome} – ${key} – Crédito: ${user.credito || 0}`;
      lista.appendChild(li);
    }
  }
}

document.getElementById("novoCharForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const nome = document.getElementById("nomeChar").value;
  const tipo = document.getElementById("tipoChar").value.toUpperCase();
  // Aqui você poderia adicionar na lista de personagens do jogo (exemplo usando a função newChar modificada)
  if (tipo === "A" || tipo === "B") {
    newChar(500, 300, tipo); // Posição fixa para exemplificar
    alert(`Novo personagem ${nome} adicionado!`);
  } else {
    alert("Tipo inválido. Use 'A' ou 'B'.");
  }
});

listarUsuarios();
