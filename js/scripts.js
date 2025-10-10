// =================================================================
// SCRIPTS.JS - LÓGICA COMPARTILHADA DO PAINEL (FINAL COM PERMISSÕES)
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    buildLayout();
    const successMessage = sessionStorage.getItem('successMessage');
    if (successMessage) {
        displayToast(successMessage, 'success');
        sessionStorage.removeItem('successMessage');
    }
});

function buildLayout() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const headerHTML = `
        <div class="user-info">
            <span id="user-name">Olá, ${user.nome}</span>
            <button id="logout-button" class="btn-logout">Sair</button>
        </div>
    `;

    // --- LÓGICA DE MENU ATUALIZADA ---
    let userLinks = '';
    if (Auth.isAdm() || Auth.isPublicServer()) {
        userLinks = `
            <li><a href="/pages/usuarios/listagem-usuarios.html" class="nav-link">Usuários</a></li>
            <li><a href="/pages/licitacoes/form-licitacoes.html" class="nav-link">Nova Licitação</a></li>
        `;
    } else if (Auth.isStandardUser()) {
        userLinks = `
            <li><a href="/pages/licitacoes/minhas-licitacoes.html" class="nav-link">Minhas Licitações</a></li>
            <li><a href="/pages/documentos/meus-documentos.html" class="nav-link">Meus Documentos</a></li>
            <li><a href="/pages/alertas/alertas.html" class="nav-link">Alertas</a></li>
        `;
    }

    const sidebarHTML = `
        <div class="sidebar-header">
            LicitHub
        </div>
        <ul class="sidebar-nav">
            <li><a href="/pages/licitacoes/listagem-licitacoes.html" class="nav-link">Início</a></li>
            ${userLinks}
        </ul>
    `;

    document.querySelector('.header').innerHTML = headerHTML;
    document.querySelector('.sidebar').innerHTML = sidebarHTML;
    document.getElementById('logout-button').addEventListener('click', Auth.logout);
    setActiveNav();
}

function setActiveNav() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}


function displayToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

function getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}