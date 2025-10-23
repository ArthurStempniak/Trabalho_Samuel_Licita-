// =================================================================
// AUTH.JS - GERENCIAMENTO DE AUTENTICAÇÃO E SESSÃO (COM 3 PERFIS)
// =================================================================

const Auth = {
    SESSION_KEY: 'loggedInUser',

    login: async function(email, password) {
        // MODIFICAÇÃO: Adicionado "AND status = 'ativo'" para impedir login de usuários inativos
        const sql = 'SELECT * FROM usuarios WHERE email = ? AND senha = ? AND status = \'ativo\'';
        const params = [email, password];
        const results = await executeQuery(sql, params);
        const user = results[0];

        if (user) {
            const { senha, ...userToStore } = user;
            sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(userToStore));
            return true;
        }
        return false;
    },

    logout: function() {
        // --- LÓGICA DE LOGOUT CORRIGIDA ---
        // A função agora apenas redireciona para a página de login com uma instrução.
        // A própria página de login ficará responsável por limpar a sessão.
        // Isso resolve o problema de timing e garante que a sessão seja encerrada.
        const path = window.location.pathname;

        if (path.includes('/usuarios/') || path.includes('/licitacoes/') || path.includes('/alertas/') || path.includes('/documentos/')) {
            window.location.href = '../../index.html?action=logout';
        } else if (path.includes('/pages/')) {
            window.location.href = '../index.html?action=logout';
        } else {
            window.location.href = 'index.html?action=logout';
        }
    },

    clearSession: function() {
        // Nova função dedicada para ser chamada pela página de login.
        sessionStorage.removeItem(this.SESSION_KEY);
    },

    isUserLoggedIn: function() {
        return sessionStorage.getItem(this.SESSION_KEY) !== null;
    },

    getCurrentUser: function() {
        return JSON.parse(sessionStorage.getItem(this.SESSION_KEY));
    },

    // --- FUNÇÕES AUXILIARES DE PERFIL ---
    isStandardUser: function() {
        const user = this.getCurrentUser();
        return user && user.perfil === 'Usuário Padrão';
    },

    isAdm: function() {
        const user = this.getCurrentUser();
        return user && user.perfil === 'Administrador';
    },

    isPublicServer: function() {
        const user = this.getCurrentUser();
        return user && user.perfil === 'Servidor Público';
    },
    // --- FIM DAS FUNÇÕES ---

    protectPage: function() {
        if (!this.isUserLoggedIn()) {
            alert('Você precisa estar logado para acessar esta página.');
            const path = window.location.pathname;
            if (path.includes('/usuarios/') || path.includes('/licitacoes/') || path.includes('/alertas/') || path.includes('/documentos/')) {
                window.location.href = '../../index.html';
            } else if (path.includes('/pages/')) {
                window.location.href = '../index.html';
            } else {
                window.location.href = 'index.html';
            }
        }
    },
};

if (!window.location.pathname.endsWith('/') && !window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('register.html')) {
    Auth.protectPage();
}