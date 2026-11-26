// mesmas tabelas do arquivo sql/banco.sql
const ESQUEMA = `
CREATE TABLE IF NOT EXISTS modalidades (
    id    INTEGER PRIMARY KEY,
    nome  TEXT    NOT NULL UNIQUE,
    vagas INTEGER NOT NULL CHECK (vagas > 0)
);

CREATE TABLE IF NOT EXISTS inscricoes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nome          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    curso         TEXT    NOT NULL,
    periodo       INTEGER NOT NULL CHECK (periodo BETWEEN 1 AND 10),
    modalidade_id INTEGER NOT NULL REFERENCES modalidades (id),
    criado_em     TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO modalidades (id, nome, vagas) VALUES
    (1, 'Free Fire', 8),
    (2, 'Clash Royale', 8),
    (3, 'Xadrez', 4);
`;

// pessoas fictícias para a página não começar vazia
const EXEMPLOS = `
INSERT OR IGNORE INTO inscricoes (nome, email, curso, periodo, modalidade_id) VALUES
    ('Ana Beatriz Lima', 'ana.lima@example.com', 'Sistemas de Informação', 1, 1),
    ('Carlos Eduardo Rocha', 'carlos.rocha@example.com', 'Ciência da Computação', 3, 2),
    ('Júlia Martins', 'julia.martins@example.com', 'Engenharia de Software', 2, 3);
`;

const CHAVE_SALVA = "torneio-si-banco";

let db;                   // o banco SQLite que roda dentro do navegador
let confirmandoId = null; // inscrição esperando o segundo clique para cancelar
let confirmandoRecomecar = false;

const formulario = document.getElementById("formulario");
const erro = document.getElementById("erro");
const lista = document.getElementById("lista");
const busca = document.getElementById("busca");
const filtroModalidade = document.getElementById("filtro-modalidade");
const confirmacao = document.getElementById("confirmacao");
const botaoRecomecar = document.getElementById("recomecar");

// ---------- funções do banco ----------

// roda um SELECT e devolve uma lista de objetos
function consultar(sql, valores) {
    const comando = db.prepare(sql);
    comando.bind(valores || []);
    const linhas = [];
    while (comando.step()) {
        linhas.push(comando.getAsObject());
    }
    comando.free();
    return linhas;
}

// roda INSERT, UPDATE ou DELETE e devolve o id da última linha inserida
function executar(sql, valores) {
    db.run(sql, valores || []);
    const id = consultar("SELECT last_insert_rowid() AS id")[0].id; // antes de salvar, que reinicia o banco
    salvar();
    return id;
}

// guarda o banco no navegador (localStorage) como texto
function salvar() {
    try {
        const bytes = db.export();
        let texto = "";
        for (let i = 0; i < bytes.length; i++) {
            texto += String.fromCharCode(bytes[i]);
        }
        localStorage.setItem(CHAVE_SALVA, btoa(texto));
    } catch (e) {
        // sem localStorage o site continua funcionando, só não guarda
    }
    db.run("PRAGMA foreign_keys = ON"); // o export desliga essa regra
}

function carregarSalvo() {
    try {
        const texto = atob(localStorage.getItem(CHAVE_SALVA) || "");
        if (texto === "") {
            return null;
        }
        const bytes = new Uint8Array(texto.length);
        for (let i = 0; i < texto.length; i++) {
            bytes[i] = texto.charCodeAt(i);
        }
        return bytes;
    } catch (e) {
        return null;
    }
}

function criarBanco(SQL, bytes) {
    db = bytes ? new SQL.Database(bytes) : new SQL.Database();
    db.run("PRAGMA foreign_keys = ON");
    db.exec(ESQUEMA);
    if (!bytes) {
        db.exec(EXEMPLOS);
    }
    salvar();
}

// ---------- caixa "SQL que acabou de rodar" ----------

function mostrarSQL(sql, valores, resultado) {
    document.getElementById("sql-comando").textContent = sql.trim();
    let detalhes = resultado;
    if (valores.length > 0) {
        detalhes = "Valores no lugar de cada ?: " + valores.map(function (v) {
            return typeof v === "string" ? "'" + v + "'" : v;
        }).join(", ") + ". " + resultado;
    }
    document.getElementById("sql-detalhes").textContent = detalhes;
}

// ---------- tela ----------

function numero(id) {
    return "#" + String(id).padStart(3, "0");
}

function modalidadesComVagas() {
    return consultar(`
        SELECT m.id, m.nome, m.vagas, COUNT(i.id) AS inscritos
        FROM modalidades m
        LEFT JOIN inscricoes i ON i.modalidade_id = m.id
        GROUP BY m.id
        ORDER BY m.id`);
}

function desenharModalidades() {
    const modalidades = modalidadesComVagas();
    const area = document.getElementById("opcoes-modalidade");
    const marcada = document.querySelector("input[name='modalidade']:checked");
    const idMarcado = marcada ? Number(marcada.value) : 0;
    const listaVagas = document.getElementById("vagas");

    area.textContent = "";
    listaVagas.textContent = "";

    for (let i = 0; i < modalidades.length; i++) {
        const m = modalidades[i];
        const restantes = m.vagas - m.inscritos;

        // opção do formulário
        const opcao = document.createElement("label");
        opcao.className = "modalidade" + (restantes <= 0 ? " esgotada" : "");
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "modalidade";
        radio.value = m.id;
        radio.disabled = restantes <= 0;
        radio.checked = m.id === idMarcado && restantes > 0;
        const nome = document.createElement("span");
        nome.textContent = m.nome;
        const info = document.createElement("span");
        info.textContent = restantes <= 0 ? "Esgotado" : restantes + (restantes === 1 ? " vaga" : " vagas");
        opcao.append(radio, nome, info);
        area.appendChild(opcao);

        // quadro de vagas
        const item = document.createElement("li");
        item.className = restantes <= 0 ? "cheia" : "";
        item.textContent = m.nome;
        const numeros = document.createElement("span");
        numeros.className = "numeros";
        numeros.textContent = m.inscritos + " de " + m.vagas + " inscritos";
        const barra = document.createElement("div");
        barra.className = "barra";
        const preenchido = document.createElement("span");
        preenchido.style.width = Math.min(100, (m.inscritos / m.vagas) * 100) + "%";
        barra.appendChild(preenchido);
        item.append(numeros, barra);
        listaVagas.appendChild(item);
    }
}

function preencherFiltro() {
    const modalidades = consultar("SELECT id, nome FROM modalidades ORDER BY id");
    for (let i = 0; i < modalidades.length; i++) {
        const opcao = document.createElement("option");
        opcao.value = modalidades[i].id;
        opcao.textContent = modalidades[i].nome;
        filtroModalidade.appendChild(opcao);
    }
}

function criarCelula(texto, classe) {
    const celula = document.createElement("td");
    celula.textContent = texto;
    if (classe) {
        celula.className = classe;
    }
    return celula;
}

// monta o SELECT da lista com a busca e o filtro escolhidos
function buscarInscritos() {
    const termo = "%" + busca.value.trim() + "%";
    const idModalidade = Number(filtroModalidade.value);
    const sql = `
SELECT i.id, i.nome, i.curso, i.periodo, m.nome AS modalidade
FROM inscricoes i
JOIN modalidades m ON m.id = i.modalidade_id
WHERE i.nome LIKE ?
  AND (? = 0 OR i.modalidade_id = ?)
ORDER BY i.nome`;
    const valores = [termo, idModalidade, idModalidade];
    return { sql: sql, valores: valores, linhas: consultar(sql, valores) };
}

function desenharLista(mostrarNoPainel) {
    const resultado = buscarInscritos();
    const inscritos = resultado.linhas;
    lista.textContent = "";

    for (let i = 0; i < inscritos.length; i++) {
        const p = inscritos[i];
        const linha = document.createElement("tr");
        linha.appendChild(criarCelula(numero(p.id)));
        linha.appendChild(criarCelula(p.nome));
        linha.appendChild(criarCelula(p.curso + ", " + p.periodo + "º", "periodo col-curso"));
        linha.appendChild(criarCelula(p.modalidade));

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "cancelar";
        if (confirmandoId === p.id) {
            botao.textContent = "Confirmar cancelamento";
            botao.classList.add("confirmar");
        } else {
            botao.textContent = "Cancelar";
        }
        botao.setAttribute("aria-label", botao.textContent + " de " + p.nome);
        botao.addEventListener("click", function () {
            cliqueCancelar(p.id, p.nome);
        });
        const celula = document.createElement("td");
        celula.appendChild(botao);
        linha.appendChild(celula);
        lista.appendChild(linha);
    }

    const vazio = document.getElementById("vazio");
    vazio.hidden = inscritos.length > 0;
    if (busca.value.trim() !== "" || filtroModalidade.value !== "0") {
        vazio.textContent = "Ninguém encontrado com essa busca.";
    } else {
        vazio.textContent = "Ainda não há inscritos. Preencha a ficha para fazer a primeira inscrição.";
    }

    if (mostrarNoPainel) {
        mostrarSQL(resultado.sql, resultado.valores, inscritos.length + (inscritos.length === 1 ? " resultado." : " resultados."));
    }
}

function atualizarTela() {
    desenharModalidades();
    desenharLista(false);
}

// ---------- ações ----------

function cliqueCancelar(id, nome) {
    // primeiro clique pede confirmação, o segundo apaga
    if (confirmandoId !== id) {
        confirmandoId = id;
        desenharLista(false);
        return;
    }

    const sql = "DELETE FROM inscricoes WHERE id = ?";
    executar(sql, [id]);
    mostrarSQL(sql, [id], "Inscrição de " + nome + " cancelada.");
    confirmandoId = null;
    confirmacao.hidden = true;
    atualizarTela();
}

function mostrarErro(texto, campo) {
    erro.textContent = texto;
    if (campo) {
        campo.focus();
    }
}

formulario.addEventListener("submit", function (evento) {
    evento.preventDefault(); // não recarrega a página

    const campoNome = document.getElementById("nome");
    const campoEmail = document.getElementById("email");
    const campoCurso = document.getElementById("curso");
    const campoPeriodo = document.getElementById("periodo");
    const marcada = document.querySelector("input[name='modalidade']:checked");

    const nome = campoNome.value.trim().replace(/\s+/g, " ");
    const email = campoEmail.value.trim().toLowerCase();

    if (nome.length < 3) {
        return mostrarErro("Digite o nome completo (pelo menos 3 letras).", campoNome);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return mostrarErro("Digite um e-mail válido, como nome@exemplo.com.", campoEmail);
    }
    if (campoCurso.value === "") {
        return mostrarErro("Escolha o curso.", campoCurso);
    }
    if (campoPeriodo.value === "") {
        return mostrarErro("Escolha o período.", campoPeriodo);
    }
    if (!marcada) {
        return mostrarErro("Escolha uma modalidade.");
    }

    const idModalidade = Number(marcada.value);

    // regra 1: e-mail não pode repetir
    const repetido = consultar("SELECT COUNT(*) AS total FROM inscricoes WHERE email = ?", [email]);
    if (repetido[0].total > 0) {
        return mostrarErro("Esse e-mail já está inscrito. Cada pessoa joga só uma modalidade.", campoEmail);
    }

    // regra 2: precisa ter vaga
    const vaga = consultar(`
        SELECT m.vagas - COUNT(i.id) AS restantes
        FROM modalidades m
        LEFT JOIN inscricoes i ON i.modalidade_id = m.id
        WHERE m.id = ?
        GROUP BY m.id`, [idModalidade]);
    if (vaga.length === 0 || vaga[0].restantes <= 0) {
        atualizarTela();
        return mostrarErro("As vagas dessa modalidade acabaram. Escolha outra.");
    }

    const sql = `
INSERT INTO inscricoes (nome, email, curso, periodo, modalidade_id)
VALUES (?, ?, ?, ?, ?)`;
    const valores = [nome, email, campoCurso.value, Number(campoPeriodo.value), idModalidade];
    const novoId = executar(sql, valores);
    const nomeModalidade = marcada.parentElement.children[1].textContent;
    mostrarSQL(sql, valores, "1 inscrição salva.");

    erro.textContent = "";
    formulario.reset();
    confirmacao.textContent = "";
    const destaque = document.createElement("strong");
    destaque.textContent = "Inscrição " + numero(novoId);
    confirmacao.append(destaque, nome + " está no " + nomeModalidade + ".");
    confirmacao.hidden = false;

    confirmandoId = null;
    atualizarTela();
});

busca.addEventListener("input", function () {
    confirmandoId = null;
    desenharLista(true);
});

filtroModalidade.addEventListener("change", function () {
    confirmandoId = null;
    desenharLista(true);
});

botaoRecomecar.addEventListener("click", function () {
    if (!confirmandoRecomecar) {
        confirmandoRecomecar = true;
        botaoRecomecar.textContent = "Clique de novo para apagar todas as inscrições";
        return;
    }
    db.exec("DELETE FROM inscricoes; DELETE FROM sqlite_sequence WHERE name = 'inscricoes';");
    db.exec(EXEMPLOS);
    salvar();
    confirmandoRecomecar = false;
    botaoRecomecar.textContent = "Apagar tudo e voltar aos exemplos";
    confirmacao.hidden = true;
    busca.value = "";
    filtroModalidade.value = "0";
    mostrarSQL("DELETE FROM inscricoes;", [], "Banco voltou para as 3 inscrições de exemplo.");
    atualizarTela();
});

// ---------- início ----------

function iniciar() {
    const aviso = document.getElementById("aviso-carregando");

    if (typeof initSqlJs !== "function") {
        aviso.textContent = "Não foi possível carregar o banco de dados. Verifique a internet e recarregue a página.";
        return;
    }

    initSqlJs({
        locateFile: function (arquivo) {
            return "https://cdn.jsdelivr.net/npm/sql.js@1.11.0/dist/" + arquivo;
        }
    }).then(function (SQL) {
        try {
            criarBanco(SQL, carregarSalvo());
        } catch (e) {
            criarBanco(SQL, null); // banco salvo estragado: começa de novo
        }
        preencherFiltro();
        atualizarTela();
        aviso.hidden = true;
        document.getElementById("app").hidden = false;
    }).catch(function () {
        aviso.textContent = "Não foi possível carregar o banco de dados. Verifique a internet e recarregue a página.";
    });
}

iniciar();
