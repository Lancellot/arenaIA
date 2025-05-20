// Exemplo básico utilizando localStorage
document.getElementById("cadastroForm")?.addEventListener("submit", function (event) {
    event.preventDefault();
    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    // Salve o usuário (simplificado – NÃO use em produção)
    const user = { nome, email, senha, credito: 0, apostas: [] };
    localStorage.setItem(email, JSON.stringify(user));
    alert("Cadastro realizado com sucesso!");
    window.location.href = "login.html";
});

document.getElementById("loginForm")?.addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    const userStr = localStorage.getItem(email);
    if (!userStr) {
        alert("Usuário não encontrado.");
        return;
    }
    const user = JSON.parse(userStr);
    if (user.senha !== senha) {
        alert("Senha incorreta.");
        return;
    }
    // Simule criação de sessão
    localStorage.setItem("sessionUser", email);
    alert("Login realizado com sucesso!");
    window.location.href = "index.html";
});
