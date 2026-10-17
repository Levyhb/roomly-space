# Roomly Space

Sistema interno de reserva de salas de reunião desenvolvido para o desafio técnico Full Stack Pleno da Sensedia.

## Estado do projeto

A base Next.js, as verificações de lint e formatação, o endpoint de saúde e o banco SQLite com migrations e seed foram configurados. As funcionalidades de salas e reservas, os testes e a CI serão acrescentados nas próximas etapas.

## Escopo previsto

- Listagem de salas com filtros na URL por capacidade e recurso.
- Reserva com validação no servidor de sobreposição, data futura e duração permitida.
- Listagem e cancelamento das próprias reservas.
- Cadastro e edição de salas com autorização de administrador no servidor.
- Duração máxima configurável por sala (SALA-6).
- Reservas apenas em dias úteis, das 08h às 20h (hotfix SALA-5).

## Como rodar a base atual

Requer Node.js 24.19.0 (registrado em `.nvmrc`) e npm. Na raiz do projeto:

```bash
npm ci
npm run db:setup
npm run dev
```

Acesse `http://localhost:3000`. Neste estágio, a página mostra apenas que o sistema está em construção. `GET /api/health` responde `200` com `{"status":"ok"}` e indica apenas que o servidor HTTP está ativo; ainda não verifica o banco. `db:setup` executa `db:migrate` e, somente se a migration terminar sem erro, executa `db:seed`.

Por padrão, o banco de desenvolvimento é `development.sqlite` e o de testes é `test.sqlite`, ambos na raiz e ignorados pelo Git. Os caminhos podem ser alterados por `DB_STORAGE_DEVELOPMENT` e `DB_STORAGE_TEST` (ver `.env.example`). Para executar os comandos individuais do banco no ambiente de teste, acrescente `-- --env test` a `db:migrate` e `db:seed`. Para usar `db:setup` no ambiente de teste, defina `NODE_ENV=test` no terminal antes de executá-lo. O Sequelize CLI lê as variáveis do processo; se usar caminhos personalizados, defina essas variáveis no terminal antes de executar os comandos.

Para verificar a base atual, execute `npm run lint`, `npm run format:check`, `npm run typecheck` e `npm run build`. Os comandos `npm run lint:fix` e `npm run format` aplicam correções locais antes de uma nova verificação.

## Decisões técnicas

| Escolha                                                             | Motivo                                                                                                                                           |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Next.js 16.4.2 com App Router e TypeScript strict                   | Atende ao requisito obrigatório; páginas e API REST podem viver na mesma aplicação. A versão está fixada no lockfile para reproduzir o ambiente. |
| Node.js 24.19.0 LTS e npm                                           | Runtime com suporte de longo prazo e instalação reproduzível pelo lockfile.                                                                      |
| SQLite e Sequelize 6.37.8                                           | Banco relacional local, sem serviço externo; Sequelize oferece models, migrations e seeds em uma ferramenta que possuo familiaridade.            |
| Zod                                                                 | Valida dados recebidos pela API antes de aplicar as regras de negócio.                                                                           |
| Material UI                                                         | Acelera a construção de formulários e componentes responsivos.                                                                                   |
| Axios no cliente                                                    | Centraliza as chamadas HTTP das interações feitas no navegador.                                                                                  |
| Jest e React Testing Library                                        | Testes unitários das regras e dos componentes interativos, com dependências externas controladas por mocks.                                      |
| ESLint 9 com regras Next.js Core Web Vitals/TypeScript e Prettier 3 | Detectam problemas de código e mantêm formatação consistente; o CI usará os mesmos scripts quando for configurado.                               |

## Organização do código

- `src/app`: páginas e Route Handlers do App Router; cada handler expõe os métodos HTTP e delega ao controller.
- `src/server/controllers`: entrada HTTP, validação dos dados recebidos e construção da resposta. O controller de saúde é o primeiro exemplo.
- `src/server/services` e `src/server/repositories`: serão criados quando houver regras de negócio e consultas ao banco; services aplicarão regras e repositories isolarão o acesso aos dados.
- `src/server/db`: conexão e models tipados do Sequelize. `src/server/auth` e `src/server/schemas` serão criados para identificação/autorização e validação nas próximas etapas.
- `src/components`, `src/services/api` e `src/types`: componentes da interface, cliente HTTP para interações no navegador e tipos compartilhados, quando houver uso concreto.

A autorização será verificada no servidor: o seletor de usuário definirá uma sessão simulada, e a role será consultada no banco. O fuso das regras de reserva será `America/Sao_Paulo`.

## Dados de exemplo e modelagem

As migrations versionadas em `database/migrations` criam `users`, `rooms`, `resources`, `room_resources` e `reservations`, com chaves estrangeiras e índices para consultas por sala, recurso e usuário. Recursos foram separados em tabelas relacionais para permitir filtros por recurso no banco durante a SALA-1. Migrations e seeders usam CommonJS, carregado diretamente pelo Sequelize CLI; os models da aplicação ficam em TypeScript strict em `src/server/db/models.ts`. O schema é aplicado somente por migrations, sem `sequelize.sync()`.

O seed em `database/seeders` cria cinco salas, dois usuários `USER`, um `ADMIN`, quatro recursos e seus vínculos com as salas. Ele pode ser executado novamente sem duplicar esses dados.

Reservas têm usuário, sala, início e fim; a duração máxima por sala será adicionada na SALA-6. A forma de registrar cancelamentos será definida na SALA-3. A prevenção de sobreposição dependerá de validação e transação no servidor durante a SALA-2; SQLite não oferece uma constraint simples para intervalos de tempo sobrepostos.

## Fluxo de entrega

`main` representa produção e `develop` integra as funcionalidades. O commit inicial foi criado em `main` para inicializar o repositório; `develop` e `feature/SALA-0-setup` foram criadas a partir dele. As próximas mudanças serão propostas por pull request, com descrição do que mudou, por que mudou e como testar. Os commits seguem Conventional Commits.

## Limites e pendências

Swagger/OpenAPI, Docker e exclusão de salas serão avaliados depois dos requisitos obrigatórios. Ao atingir aproximadamente oito horas de implementação, o trabalho será interrompido e o que faltar será registrado aqui.

`npm audit --omit=dev` aponta duas ocorrências moderadas na dependência transitiva `uuid` usada pelo Sequelize v6. Os IDs deste projeto são inteiros; a versão estável escolhida será mantida nesta etapa porque não há correção automática segura. Reavaliar a dependência antes de produção.
