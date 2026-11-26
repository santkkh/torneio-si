# 🎮 Torneio de SI

Sistema de inscrições para um campeonato universitário de Free Fire, Clash Royale e Xadrez, com banco de dados SQL.

🔗 **[Abrir o site](https://santkkh.github.io/torneio-si/)**

O projeto tem três partes que usam o mesmo modelo de banco:

- **SQL** (SQLite): tabelas, regras e consultas de exemplo em `sql/banco.sql`.
- **Web** (HTML, CSS e JavaScript): ficha de inscrição em formato de crachá, lista de inscritos e quadro de vagas. O banco roda dentro do navegador com [sql.js](https://sql.js.org), e a página mostra o comando SQL que acabou de ser executado.
- **Terminal** (Java): menu do organizador gravando num arquivo SQLite via JDBC.

## Funcionalidades

- Inscrição com nome, e-mail, curso, período e modalidade
- Validação dos campos
- Bloqueio de e-mail repetido (regra `UNIQUE`)
- Limite de vagas por modalidade
- Lista com busca por nome e filtro por modalidade
- Cancelamento de inscrição com confirmação
- Quadro de vagas restantes

## Banco de dados

```
modalidades                    inscricoes
-----------                    ----------
id (PK)       <───────────┐    id (PK)
nome (UNIQUE)             │    nome
vagas                     │    email (UNIQUE)
                          │    curso
                          │    periodo (1 a 10)
                          └─── modalidade_id (FK)
                               criado_em
```

**Comandos SQL usados:** `CREATE TABLE`, `INSERT`, `SELECT` com `WHERE`, `LIKE` e `ORDER BY`, `JOIN` e `LEFT JOIN`, `COUNT` com `GROUP BY` e `DELETE`.

## Como rodar

### SQL

Abra o arquivo `sql/banco.sql` em qualquer editor de SQLite (por exemplo, o [DB Browser for SQLite](https://sqlitebrowser.org) ou um site como o sqliteonline.com) e execute.

### Versão web

Abra o arquivo `index.html` no navegador. Precisa de internet para carregar o sql.js.

> Os dados ficam salvos apenas no navegador de quem usa (`localStorage`). Uma pessoa não vê as inscrições feitas em outro computador.

### Versão Java

É preciso ter o JDK instalado e baixar o driver do SQLite:

1. Baixe o arquivo `sqlite-jdbc-3.47.1.0.jar` na [página de versões do sqlite-jdbc](https://github.com/xerial/sqlite-jdbc/releases/tag/3.47.1.0).
2. Coloque o `.jar` dentro da pasta `java`.
3. Compile e rode:

```bash
cd java
javac -encoding UTF-8 TorneioSI.java

# Windows
java -cp ".;sqlite-jdbc-3.47.1.0.jar" TorneioSI

# Linux ou macOS
java -cp ".:sqlite-jdbc-3.47.1.0.jar" TorneioSI
```

O programa cria o arquivo `torneio.db` na pasta `java`.

## Estrutura

```
torneio-si/
├── index.html
├── style.css
├── script.js
├── sql/
│   └── banco.sql
├── java/
│   └── TorneioSI.java
└── README.md
```

## Conceitos praticados

- **SQL:** chave primária, chave estrangeira, `UNIQUE`, `CHECK`, junções e agrupamentos
- **Java:** `Scanner`, menu com `do-while`, flag, JDBC, `PreparedStatement` e `try/catch`
- **JavaScript:** sql.js, consultas com parâmetros (`?`), manipulação do DOM e `localStorage`
- **HTML e CSS:** formulários acessíveis, CSS Grid e layout responsivo

## Próximas melhorias

- [ ] Servidor em Java para guardar as inscrições de todo mundo num banco só
- [ ] Editar uma inscrição
- [ ] Exportar a lista de inscritos em CSV

## Autor

**Gabriel Araújo**, estudante de Sistemas de Informação na Unitins (Palmas/TO).

Os nomes e e-mails de exemplo são fictícios.
