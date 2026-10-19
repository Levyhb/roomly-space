# Changelog

Todas as mudanças relevantes deste projeto serão registradas neste arquivo.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não publicado]

### Adicionado

- Duração máxima configurável por sala, aplicada no cadastro, na edição e na validação de reservas.

## [1.0.0] - 2026-10-19

### Adicionado

- Catálogo responsivo de salas com busca, filtros na URL e paginação.
- Reserva de salas com consulta de disponibilidade e validações no servidor.
- Proteção contra reservas no passado, duração inválida e sobreposição de horários.
- Listagem e cancelamento das próprias reservas com histórico por cancelamento lógico.
- Administração protegida para cadastrar e editar salas e seus recursos.
- Sessão simulada com usuários do seed e autorização baseada na role consultada no servidor.
- Banco SQLite versionado por migrations e preenchido por seeders.
- Testes unitários com Jest e React Testing Library.
- Verificações de formatação, lint, tipos, testes e build na integração contínua.

[1.0.0]: https://github.com/Levyhb/roomly-space/releases/tag/v1.0.0
