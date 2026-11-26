import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Scanner;

public class TorneioSI {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String opcao = "";

        // try/catch: se o banco der erro, o programa avisa em vez de quebrar
        try {
            // abre (ou cria) o arquivo torneio.db na pasta atual
            Connection conn = DriverManager.getConnection("jdbc:sqlite:torneio.db");
            Statement st = conn.createStatement();

            // cria as tabelas, iguais às do arquivo sql/banco.sql
            st.execute("PRAGMA foreign_keys = ON");
            st.execute("CREATE TABLE IF NOT EXISTS modalidades ("
                    + " id INTEGER PRIMARY KEY,"
                    + " nome TEXT NOT NULL UNIQUE,"
                    + " vagas INTEGER NOT NULL CHECK (vagas > 0))");
            st.execute("CREATE TABLE IF NOT EXISTS inscricoes ("
                    + " id INTEGER PRIMARY KEY AUTOINCREMENT,"
                    + " nome TEXT NOT NULL,"
                    + " email TEXT NOT NULL UNIQUE,"
                    + " curso TEXT NOT NULL,"
                    + " periodo INTEGER NOT NULL CHECK (periodo BETWEEN 1 AND 10),"
                    + " modalidade_id INTEGER NOT NULL REFERENCES modalidades (id),"
                    + " criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)");
            st.execute("INSERT OR IGNORE INTO modalidades (id, nome, vagas) VALUES"
                    + " (1, 'Free Fire', 8), (2, 'Clash Royale', 8), (3, 'Xadrez', 4)");

            System.out.println("=== TORNEIO DE SI ===");

            do {
                System.out.println("\n1 - Nova inscrição");
                System.out.println("2 - Listar inscritos");
                System.out.println("3 - Buscar por nome");
                System.out.println("4 - Cancelar inscrição");
                System.out.println("5 - Vagas por modalidade");
                System.out.println("0 - Sair");
                System.out.print("Escolha: ");
                opcao = sc.nextLine().trim();

                if (opcao.equals("1")) {
                    // ---------- NOVA INSCRIÇÃO ----------
                    boolean podeInscrever = true; // flag
                    String nome, email, curso = "";
                    int periodo = 0, idModalidade = 0;

                    do {
                        System.out.print("Nome completo: ");
                        nome = sc.nextLine().trim();
                        if (nome.length() < 3) {
                            System.out.println("Digite pelo menos 3 letras.");
                        }
                    } while (nome.length() < 3);

                    do {
                        System.out.print("E-mail: ");
                        email = sc.nextLine().trim().toLowerCase();
                        if (!email.contains("@") || !email.contains(".")) {
                            System.out.println("E-mail inválido.");
                        }
                    } while (!email.contains("@") || !email.contains("."));

                    // regra 1: e-mail não pode repetir
                    PreparedStatement psEmail = conn.prepareStatement(
                            "SELECT COUNT(*) FROM inscricoes WHERE email = ?");
                    psEmail.setString(1, email); // troca o ? pelo e-mail
                    ResultSet rsEmail = psEmail.executeQuery();
                    rsEmail.next();
                    if (rsEmail.getInt(1) > 0) {
                        System.out.println("Esse e-mail já está inscrito.");
                        podeInscrever = false;
                    }
                    psEmail.close();

                    if (podeInscrever) {
                        while (curso.equals("")) {
                            System.out.println("Curso: [1] Sistemas de Informação [2] Ciência da Computação");
                            System.out.print("       [3] Engenharia de Software [4] Outro curso: ");
                            String c = sc.nextLine().trim();
                            if (c.equals("1")) {
                                curso = "Sistemas de Informação";
                            } else if (c.equals("2")) {
                                curso = "Ciência da Computação";
                            } else if (c.equals("3")) {
                                curso = "Engenharia de Software";
                            } else if (c.equals("4")) {
                                curso = "Outro curso";
                            } else {
                                System.out.println("Opção inválida.");
                            }
                        }

                        do {
                            System.out.print("Período (1 a 10): ");
                            try {
                                periodo = Integer.parseInt(sc.nextLine().trim());
                            } catch (NumberFormatException e) {
                                periodo = 0; // digitou letra
                            }
                            if (periodo < 1 || periodo > 10) {
                                System.out.println("Período inválido.");
                            }
                        } while (periodo < 1 || periodo > 10);

                        // mostra as modalidades com as vagas que sobraram
                        ResultSet rsVagas = st.executeQuery(
                                "SELECT m.id, m.nome, m.vagas - COUNT(i.id) AS restantes"
                                + " FROM modalidades m"
                                + " LEFT JOIN inscricoes i ON i.modalidade_id = m.id"
                                + " GROUP BY m.id ORDER BY m.id");
                        while (rsVagas.next()) {
                            System.out.println("[" + rsVagas.getInt("id") + "] " + rsVagas.getString("nome")
                                    + " - " + rsVagas.getInt("restantes") + " vagas");
                        }
                        rsVagas.close();

                        do {
                            System.out.print("Modalidade: ");
                            try {
                                idModalidade = Integer.parseInt(sc.nextLine().trim());
                            } catch (NumberFormatException e) {
                                idModalidade = 0;
                            }
                            if (idModalidade < 1 || idModalidade > 3) {
                                System.out.println("Escolha 1, 2 ou 3.");
                            }
                        } while (idModalidade < 1 || idModalidade > 3);

                        // regra 2: precisa ter vaga
                        PreparedStatement psVaga = conn.prepareStatement(
                                "SELECT m.vagas - COUNT(i.id) FROM modalidades m"
                                + " LEFT JOIN inscricoes i ON i.modalidade_id = m.id"
                                + " WHERE m.id = ? GROUP BY m.id");
                        psVaga.setInt(1, idModalidade);
                        ResultSet rsVaga = psVaga.executeQuery();
                        rsVaga.next();
                        if (rsVaga.getInt(1) <= 0) {
                            System.out.println("As vagas dessa modalidade acabaram.");
                            podeInscrever = false;
                        }
                        psVaga.close();
                    }

                    if (podeInscrever) {
                        PreparedStatement psInsere = conn.prepareStatement(
                                "INSERT INTO inscricoes (nome, email, curso, periodo, modalidade_id)"
                                + " VALUES (?, ?, ?, ?, ?)");
                        psInsere.setString(1, nome);
                        psInsere.setString(2, email);
                        psInsere.setString(3, curso);
                        psInsere.setInt(4, periodo);
                        psInsere.setInt(5, idModalidade);
                        psInsere.executeUpdate();
                        psInsere.close();

                        ResultSet rsId = st.executeQuery("SELECT last_insert_rowid()");
                        rsId.next();
                        System.out.printf("Inscrição #%03d confirmada!%n", rsId.getInt(1));
                        rsId.close();
                    }

                } else if (opcao.equals("2") || opcao.equals("3")) {
                    // ---------- LISTAR OU BUSCAR ----------
                    String termo = "";
                    if (opcao.equals("3")) {
                        System.out.print("Parte do nome: ");
                        termo = sc.nextLine().trim();
                    }

                    PreparedStatement psLista = conn.prepareStatement(
                            "SELECT i.id, i.nome, i.curso, i.periodo, m.nome AS modalidade"
                            + " FROM inscricoes i"
                            + " JOIN modalidades m ON m.id = i.modalidade_id"
                            + " WHERE i.nome LIKE ?"
                            + " ORDER BY i.nome");
                    psLista.setString(1, "%" + termo + "%"); // % = qualquer texto
                    ResultSet rsLista = psLista.executeQuery();

                    int contador = 0;
                    while (rsLista.next()) {
                        System.out.printf("#%03d  %-25s  %-24s %2dº  %s%n",
                                rsLista.getInt("id"), rsLista.getString("nome"),
                                rsLista.getString("curso"), rsLista.getInt("periodo"),
                                rsLista.getString("modalidade"));
                        contador++;
                    }
                    psLista.close();

                    if (contador == 0) {
                        System.out.println("Ninguém encontrado.");
                    } else {
                        System.out.println(contador + " inscrito(s).");
                    }

                } else if (opcao.equals("4")) {
                    // ---------- CANCELAR ----------
                    int id;
                    System.out.print("Número da inscrição: ");
                    try {
                        id = Integer.parseInt(sc.nextLine().trim().replace("#", ""));
                    } catch (NumberFormatException e) {
                        id = 0;
                    }

                    System.out.print("Tem certeza? [S] Sim [N] Não: ");
                    String certeza = sc.nextLine().trim();

                    if (certeza.equalsIgnoreCase("S")) {
                        PreparedStatement psApaga = conn.prepareStatement(
                                "DELETE FROM inscricoes WHERE id = ?");
                        psApaga.setInt(1, id);
                        int apagadas = psApaga.executeUpdate(); // quantas linhas saíram
                        psApaga.close();

                        if (apagadas > 0) {
                            System.out.println("Inscrição cancelada.");
                        } else {
                            System.out.println("Inscrição não encontrada.");
                        }
                    } else {
                        System.out.println("Nada foi apagado.");
                    }

                } else if (opcao.equals("5")) {
                    // ---------- VAGAS ----------
                    ResultSet rsResumo = st.executeQuery(
                            "SELECT m.nome, m.vagas, COUNT(i.id) AS inscritos"
                            + " FROM modalidades m"
                            + " LEFT JOIN inscricoes i ON i.modalidade_id = m.id"
                            + " GROUP BY m.id ORDER BY m.id");
                    while (rsResumo.next()) {
                        System.out.println(rsResumo.getString("nome") + ": "
                                + rsResumo.getInt("inscritos") + " de " + rsResumo.getInt("vagas") + " inscritos");
                    }
                    rsResumo.close();

                } else if (!opcao.equals("0")) {
                    System.out.println("Opção inválida.");
                }
            } while (!opcao.equals("0"));

            st.close();
            conn.close();
            System.out.println("Até a próxima!");

        } catch (SQLException e) {
            System.out.println("Erro no banco de dados: " + e.getMessage());
        }

        sc.close();
    }
}
