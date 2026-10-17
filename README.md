# Roomly Space

Sistema interno de reserva de salas de reunião desenvolvido para o desafio técnico Full Stack Pleno da Sensedia.

## Estado do projeto

A base Next.js, as verificações de lint e formatação, o endpoint de saúde, o banco SQLite, a sessão simulada por cookie, a interface inicial com Material UI, os testes unitários e o workflow de CI foram configurados. A listagem de salas e as reservas serão acrescentadas nas próximas etapas. A CI ainda precisa ser observada em um PR e a proteção das branches configurada no GitHub.

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

Acesse `http://localhost:3000`. A página inicial contém somente a estrutura visual compartilhada e permite escolher um usuário do seed; a listagem, os filtros e os endpoints de salas entram na SALA-1. `GET /api/health` responde `200` com `{"status":"ok"}` e indica apenas que o servidor HTTP está ativo; ainda não verifica o banco. `db:setup` executa `db:migrate` e, somente se a migration terminar sem erro, executa `db:seed`.

Por padrão, o banco de desenvolvimento é `development.sqlite` e o de testes é `test.sqlite`, ambos na raiz e ignorados pelo Git. Os caminhos podem ser alterados por `DB_STORAGE_DEVELOPMENT` e `DB_STORAGE_TEST` (ver `.env.example`). Para executar os comandos individuais do banco no ambiente de teste, acrescente `-- --env test` a `db:migrate` e `db:seed`. Para usar `db:setup` no ambiente de teste, defina `NODE_ENV=test` no terminal antes de executá-lo. O Sequelize CLI lê as variáveis do processo; se usar caminhos personalizados, defina essas variáveis no terminal antes de executar os comandos.

Para verificar a base atual, execute `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test` e `npm run build`. Os comandos `npm run lint:fix` e `npm run format` aplicam correções locais antes de uma nova verificação.

Os testes unitários de componentes e código executado no navegador ficam em `tests/unit/client`; regras e módulos do servidor ficam em `tests/unit/server`. Os cenários são documentados em `tests/scenarios`, e os helpers reutilizáveis ficam em `tests/helpers`. O Jest usa ambiente Node por padrão e `jsdom` apenas nos testes de componentes. Os testes permanecem isolados e podem ser executados em paralelo pelo Jest, permitindo que a suíte cresça sem impor execução sequencial. O setup cobre autorização da sessão e troca de usuário na interface com repository, cookie e HTTP simulados, sem acessar SQLite. `npm run test:watch` executa os testes durante o desenvolvimento e `npm run test:coverage` gera o relatório de cobertura. As regras dos cards receberão testes próprios ao serem implementadas.

## Integração contínua

O workflow `.github/workflows/ci.yml` roda em pull requests para `develop` e `main`, com permissão apenas de leitura no repositório. Usa Node 24 conforme `.nvmrc`, cache npm e `npm ci`. Prepara migrations e seed em um SQLite temporário com `NODE_ENV=test`, depois executa formatação, lint, typecheck, `npm test` e build. O template de PR pede o quê mudou, por quê e como testar.

Após a primeira execução verde no PR de setup, configurar uma [ruleset de branches no GitHub](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository) para `develop` e `main` com exigência de pull request e do status `Verify` da CI antes do merge. A configuração remota e a execução do workflow ainda estão pendentes; os comandos locais validam apenas o conteúdo deste checkout.

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
| ESLint 9 com regras Next.js Core Web Vitals/TypeScript e Prettier 3 | Detectam problemas de código e mantêm formatação consistente; o CI executa os mesmos scripts usados localmente.                                  |

## Direção visual

Referência para as telas funcionais: cabeçalho claro, roxo para identidade e navegação, laranja para ações principais e cartões para as salas. Os tokens de cor estão em `src/app/globals.css`; o tema do Material UI reproduz essa paleta. `AppRouterCacheProvider` integra o MUI ao App Router e evita problemas de renderização dos estilos no servidor. A marca geométrica representa uma porta de sala e foi desenhada em SVG para continuar nítida em diferentes tamanhos.

Nesta etapa, a página mantém apenas o shell compartilhado, a identidade visual, o loading genérico e o seletor de usuário com estados de progresso e erro. Na SALA-1 entram a navegação, os cartões com dados reais e os filtros. “Minhas reservas” seguirá cartões empilhados. A área Admin seguirá abas por categoria, com listagem e ação de adicionar em cada uma; as permissões serão verificadas no servidor durante a SALA-4.

## Organização do código

- `src/app`: páginas e Route Handlers do App Router; cada handler expõe os métodos HTTP e delega ao controller.
- `src/server/controllers`: entrada HTTP, validação dos dados recebidos e construção da resposta. O controller de saúde é o primeiro exemplo.
- `src/server/repositories`: isola consultas ao banco; `src/server/services` será criado quando houver regras de negócio.
- `src/server/db`, `src/server/auth`, `src/server/schemas` e `src/server/http`: models/conexão, identificação e autorização, validação Zod e respostas de erro.
- `src/services/api`: instância Axios para Client Components. `src/components` contém o tema, a marca e a interface inicial; `src/types` será criado quando houver tipos compartilhados com uso concreto.

A autorização é verificada no servidor: o seletor de usuário definirá uma sessão simulada, e a role é consultada no banco. O fuso das regras de reserva será `America/Sao_Paulo`. O Next carrega Sequelize e SQLite diretamente no runtime Node por `serverExternalPackages`, pois o empacotamento padrão do Turbopack tenta resolver drivers de outros bancos que o projeto não usa.

O helper `validate` recebe dados de body, query ou parâmetros de rota e aplica o schema Zod correspondente. Nesta etapa, o corpo de `POST /api/session` é o primeiro uso; os filtros e IDs dos cards usarão o mesmo helper.

## Sessão simulada

- `POST /api/session` recebe JSON `{"userId":1}`, valida o corpo com Zod e grava o ID selecionado em cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção. A role não vem do navegador.
- `GET /api/session` retorna `{ "user": { "id", "name", "role" } }` consultando o usuário no banco; sem cookie ou com ID inexistente, retorna `401`.
- `DELETE /api/session` limpa o cookie e retorna `204`. Payload inválido recebe `400`; tipo de conteúdo diferente de JSON recebe `415`. O helper `requireAdmin` produz `403` quando um usuário sem role `ADMIN` tenta acessar uma rota protegida.

Este cookie guarda apenas o ID escolhido e representa uma **autenticação simulada** para o desafio, não uma prova de identidade. Mesmo com `HttpOnly`, alguém pode selecionar outro usuário ou manipular o próprio cookie. Os handlers protegidos dos cards usarão `requireUser` ou `requireAdmin` no servidor e consultarão a role no banco. Uma implantação real exigiria autenticação e sessão assinada.

Na página inicial, o seletor “entrar como” usa os usuários do seed lidos no servidor. Ele envia a escolha a `POST /api/session`, permite trocar de usuário e sair com `DELETE /api/session`. O usuário selecionado persiste após recarregar a página por meio do cookie.

## Dados de exemplo e modelagem

As migrations versionadas em `database/migrations` criam `users`, `rooms`, `resources`, `room_resources` e `reservations`, com chaves estrangeiras e índices para consultas por sala, recurso e usuário. Recursos foram separados em tabelas relacionais para permitir filtros por recurso no banco durante a SALA-1. Migrations e seeders usam CommonJS, carregado diretamente pelo Sequelize CLI; os models da aplicação ficam em TypeScript strict em `src/server/db/models.ts`. O schema é aplicado somente por migrations, sem `sequelize.sync()`.

O seed em `database/seeders` cria cinco salas, dois usuários `USER`, um `ADMIN`, quatro recursos e seus vínculos com as salas. Ele pode ser executado novamente sem duplicar esses dados.

Reservas têm usuário, sala, início e fim; a duração máxima por sala será adicionada na SALA-6. A forma de registrar cancelamentos será definida na SALA-3. A prevenção de sobreposição dependerá de validação e transação no servidor durante a SALA-2; SQLite não oferece uma constraint simples para intervalos de tempo sobrepostos.

## Fluxo de entrega

`main` representa produção e `develop` integra as funcionalidades. O commit inicial foi criado em `main` para inicializar o repositório; `develop` e `feature/SALA-0-setup` foram criadas a partir dele. As próximas mudanças serão propostas por pull request, com descrição do que mudou, por que mudou e como testar. Os commits seguem Conventional Commits.

## Limites e pendências

Swagger/OpenAPI, Docker, exclusão de salas e o desenho detalhado da arquitetura AWS serão avaliados depois dos requisitos obrigatórios. A proposta AWS será escrita após a aplicação estar completa para considerar com precisão execução, banco, arquivos estáticos, possível uso de S3, segredos e separação dos ambientes. Ao atingir aproximadamente oito horas de implementação, o trabalho será interrompido e o que faltar será registrado aqui.

`npm audit --omit=dev` aponta duas ocorrências moderadas na dependência transitiva `uuid` usada pelo Sequelize v6. Os IDs deste projeto são inteiros; a versão estável escolhida será mantida nesta etapa porque não há correção automática segura. Reavaliar a dependência antes de produção.
