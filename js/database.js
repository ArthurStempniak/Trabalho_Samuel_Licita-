async function executeQuery(sql, params = []) {
  try {
    const response = await fetch("http://localhost:3001/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error);
    }
    return await response.json();
  } catch (error) {
    console.error("Erro fatal de conexão com a ponte/banco:", error);
    alert(
      "Não foi possível conectar ao banco de dados. Verifique se o servidor-ponte (db-proxy.js) está rodando."
    );
    return [];
  }
}

const DB = {
  // --- USUÁRIOS ---
  async getUsers(currentUser) {
    if (!currentUser) return [];
    if (Auth.isPublicServer()) {
      const sql =
        'SELECT * FROM usuarios WHERE orgao = ? AND perfil = "Administrador" ORDER BY nome';
      return await executeQuery(sql, [currentUser.orgao]);
    }
    if (Auth.isAdm()) {
      const sql =
        'SELECT * FROM usuarios WHERE orgao = ? AND perfil = "Usuário Padrão" ORDER BY nome';
      return await executeQuery(sql, [currentUser.orgao]);
    }
    return [];
  },
  async getUserById(id) {
    const sql = "SELECT * FROM usuarios WHERE id = ?";
    const results = await executeQuery(sql, [id]);
    return results[0];
  },
  async addUser(user) {
    const sql =
      "INSERT INTO usuarios (nome, email, cpf, senha, cargo, orgao, perfil) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const params = [
      user.nome,
      user.email,
      user.cpf,
      user.senha,
      user.cargo,
      user.orgao,
      user.perfil,
    ];
    return await executeQuery(sql, params);
  },
  async registerUser(user) {
    const sql =
      "INSERT INTO usuarios (nome, email, cpf, senha, perfil) VALUES (?, ?, ?, ?, ?)";
    const params = [
      user.nome,
      user.email,
      user.cpf,
      user.senha,
      "Usuário Padrão", // Perfil fixo
    ];
    return await executeQuery(sql, params);
  },
  async updateUser(user) {
    const sql =
      "UPDATE usuarios SET nome = ?, email = ?, cpf = ?, cargo = ?, perfil = ?, orgao = ? WHERE id = ?";
    const params = [
      user.nome,
      user.email,
      user.cpf,
      user.cargo,
      user.perfil,
      user.orgao,
      user.id,
    ];
    return await executeQuery(sql, params);
  },
  async deleteUser(id) {
    const sql = "DELETE FROM usuarios WHERE id = ?";
    return await executeQuery(sql, [id]);
  },

  // --- LICITAÇÕES ---
  async getLicitacoes(currentUser, filters = {}) {
    let sql = "";
    let params = [];
    const whereClauses = [];

    if (Auth.isStandardUser()) {
      sql = 'SELECT * FROM licitacoes WHERE situacao = "Aberta"';
    } else {
      sql = "SELECT * FROM licitacoes WHERE orgao = ?";
      params.push(currentUser.orgao);
    }

    if (filters.searchTerm) {
      whereClauses.push(`(titulo LIKE ? OR descricao LIKE ?)`);
      params.push(`%${filters.searchTerm}%`);
      params.push(`%${filters.searchTerm}%`);
    }
    if (filters.orgao) {
      whereClauses.push(`orgao = ?`);
      params.push(filters.orgao);
    }

    if (whereClauses.length > 0) {
      sql +=
        (sql.includes("WHERE") ? " AND " : " WHERE ") +
        whereClauses.join(" AND ");
    }

    sql += Auth.isStandardUser()
      ? " ORDER BY data_encerramento ASC"
      : " ORDER BY data_abertura DESC";

    return await executeQuery(sql, params);
  },
  async getAllOrgaos() {
    const sql = "SELECT DISTINCT orgao FROM licitacoes ORDER BY orgao";
    return await executeQuery(sql);
  },
  async getLicitacaoById(id) {
    const sql = "SELECT * FROM licitacoes WHERE id = ?";
    const results = await executeQuery(sql, [id]);
    return results[0];
  },
  async addLicitacao(licitacao) {
    const sql =
      "INSERT INTO licitacoes (titulo, descricao, orgao, valor_estimado, data_abertura, data_encerramento, situacao, criado_por, requisitos_tecnicos, requisitos_economicos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const params = [
      licitacao.titulo,
      licitacao.descricao,
      licitacao.orgao,
      licitacao.valor_estimado,
      licitacao.data_abertura,
      licitacao.data_encerramento,
      licitacao.situacao,
      licitacao.criado_por,
      licitacao.requisitos_tecnicos,
      licitacao.requisitos_economicos,
    ];
    return await executeQuery(sql, params);
  },
  async updateLicitacao(licitacao) {
    const sql =
      "UPDATE licitacoes SET titulo = ?, descricao = ?, orgao = ?, valor_estimado = ?, data_abertura = ?, data_encerramento = ?, situacao = ?, requisitos_tecnicos = ?, requisitos_economicos = ? WHERE id = ?";
    const params = [
      licitacao.titulo,
      licitacao.descricao,
      licitacao.orgao,
      licitacao.valor_estimado,
      licitacao.data_abertura,
      licitacao.data_encerramento,
      licitacao.situacao,
      licitacao.requisitos_tecnicos,
      licitacao.requisitos_economicos,
      licitacao.id,
    ];
    return await executeQuery(sql, params);
  },
  async deleteLicitacao(id) {
    const sql = "DELETE FROM licitacoes WHERE id = ?";
    return await executeQuery(sql, [id]);
  },
  async getDocumentsByLicitacaoId(id) {
    const sql = "SELECT * FROM documentos WHERE id_licitacao = ?";
    return await executeQuery(sql, [id]);
  },

  // --- FUNÇÕES DE PARTICIPAÇÃO E PROPOSTA ---
  async verificarParticipacao(id_licitacao, id_usuario) {
    const sql =
      "SELECT * FROM participacoes WHERE id_licitacao = ? AND id_usuario = ?";
    const results = await executeQuery(sql, [id_licitacao, id_usuario]);
    return results[0];
  },
  async participar(id_licitacao, id_usuario) {
    const sql =
      "INSERT INTO participacoes (id_licitacao, id_usuario) VALUES (?, ?)";
    return await executeQuery(sql, [id_licitacao, id_usuario]);
  },
  async enviarProposta(id_participacao, valor, documentoPath) {
    const sql =
      "INSERT INTO propostas (id_participacao, valor_proposta, documento_proposta_path) VALUES (?, ?, ?)";
    return await executeQuery(sql, [id_participacao, valor, documentoPath]);
  },
  async getMinhasParticipacoes(id_usuario) {
    const sql = `
          SELECT l.*, p.status AS status_proposta
          FROM licitacoes l
          JOIN participacoes part ON l.id = part.id_licitacao
          LEFT JOIN propostas p ON part.id = p.id_participacao
          WHERE part.id_usuario = ?
          ORDER BY l.data_encerramento ASC
      `;
    return await executeQuery(sql, [id_usuario]);
  },
  async getPropostasByLicitacao(id_licitacao) {
    const sql = `
          SELECT u.id as usuario_id, u.nome, u.email, p.id, p.valor_proposta, p.status, p.data_envio
          FROM propostas p
          JOIN participacoes part ON p.id_participacao = part.id
          JOIN usuarios u ON part.id_usuario = u.id
          WHERE part.id_licitacao = ?
          ORDER BY p.valor_proposta ASC
      `;
    return await executeQuery(sql, [id_licitacao]);
  },
  async updateStatusProposta(id_proposta, novo_status) {
    const sql = "UPDATE propostas SET status = ? WHERE id = ?";
    return await executeQuery(sql, [novo_status, id_proposta]);
  },

  // --- FUNÇÕES DE ALERTAS ---
  async criarAlerta(id_usuario, id_licitacao, mensagem, tipo = "Info") {
    const sql =
      "INSERT INTO alertas (id_usuario, id_licitacao, mensagem, tipo) VALUES (?, ?, ?, ?)";
    return await executeQuery(sql, [id_usuario, id_licitacao, mensagem, tipo]);
  },
  async getAlertas(id_usuario) {
    const sql =
      "SELECT * FROM alertas WHERE id_usuario = ? ORDER BY data_criacao DESC";
    return await executeQuery(sql, [id_usuario]);
  },
  async marcarAlertaComoLido(id_alerta) {
    const sql = "UPDATE alertas SET lido = TRUE WHERE id = ?";
    return await executeQuery(sql, [id_alerta]);
  },
  async getParticipantesDaLicitacao(id_licitacao) {
    const sql = "SELECT id_usuario FROM participacoes WHERE id_licitacao = ?";
    return await executeQuery(sql, [id_licitacao]);
  },

  // --- FUNÇÕES DE DOCUMENTOS FAVORITOS ---
  async getMeusDocumentos(id_usuario) {
    const sql = `
        SELECT d.nome_arquivo, d.caminho_arquivo, l.titulo AS titulo_licitacao
        FROM documentos_favoritos df
        JOIN documentos d ON df.id_documento = d.id
        JOIN licitacoes l ON d.id_licitacao = l.id
        WHERE df.id_usuario = ?
        ORDER BY df.data_favoritado DESC
    `;
    return await executeQuery(sql, [id_usuario]);
  },
  async favoritarDocumento(id_usuario, id_documento) {
    const sql =
      "INSERT INTO documentos_favoritos (id_usuario, id_documento) VALUES (?, ?)";
    return await executeQuery(sql, [id_usuario, id_documento]);
  },
  async desfavoritarDocumento(id_usuario, id_documento) {
    const sql =
      "DELETE FROM documentos_favoritos WHERE id_usuario = ? AND id_documento = ?";
    return await executeQuery(sql, [id_usuario, id_documento]);
  },
  async getFavoritosPorLicitacao(id_usuario, id_licitacao) {
    const sql = `
          SELECT id_documento FROM documentos_favoritos
          WHERE id_usuario = ? AND id_documento IN (SELECT id FROM documentos WHERE id_licitacao = ?)
      `;
    const results = await executeQuery(sql, [id_usuario, id_licitacao]);
    return results.map((r) => r.id_documento); // Retorna um array de IDs
  },
};