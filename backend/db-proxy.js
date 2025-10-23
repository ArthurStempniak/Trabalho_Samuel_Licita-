const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "..")));

// --- CONFIGURAÇÃO DA CONEXÃO COM O MYSQL ---
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "server",
  database: "licita_plus",
  multipleStatements: true,
});

db.connect((err) => {
  if (err) {
    console.error("!!! ERRO AO CONECTAR AO MYSQL:", err.stack);
    return;
  }
  console.log("--- Ponte com o MySQL conectada com sucesso! ---");
});

app.post("/query", (req, res) => {
  const { sql, params } = req.body;

  if (!sql) {
    return res.status(400).json({ error: "Comando SQL não fornecido." });
  }

  db.query(sql, params || [], (err, results) => {
    if (err) {
      console.error("!!! ERRO AO EXECUTAR QUERY:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Ponte rodando em http://localhost:${port}`);
  console.log(
    "AVISO: Este servidor é inseguro e só deve ser usado localmente para fins de demonstração."
  );
});
