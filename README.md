# Roomly Space

Sistema interno de reserva de salas de reunião desenvolvido para o desafio técnico Full Stack Pleno da Sensedia.

## Estado do projeto

A base Next.js, as verificações de lint e formatação, o banco SQLite, a sessão simulada por cookie, os testes unitários e o workflow de CI foram configurados. A SALA-1 possui catálogo responsivo com filtros na URL. A SALA-2 acrescenta disponibilidade pública, criação de reservas validada no servidor e um modal responsivo para reservar no catálogo. A SALA-3 acrescenta a tela para consultar e cancelar apenas as próprias reservas. A SALA-4 acrescenta a API e a interface para administração de salas. A SALA-6 substitui o limite fixo de quatro horas por uma duração máxima configurável em cada sala.

## Escopo previsto

- Listagem de salas com filtros na URL por capacidade e recurso.
- Reserva com validação no servidor de sobreposição, data futura e duração permitida.
- Listagem e cancelamento das próprias reservas.
- Cadastro e edição de salas com autorização de administrador no servidor.
- Duração máxima configurável por sala (SALA-6).
- Reservas apenas em dias úteis, das 08h às 20h (hotfix SALA-5).

## Como executar a aplicação

Requer Node.js 24.19.0 (registrado em `.nvmrc`) e npm. Na raiz do projeto:

```bash
npm ci
npm run db:setup
npm run dev
```

Acesse `http://localhost:3000`. A página inicial contém o cabeçalho compartilhado, a navegação responsiva, o catálogo e o seletor dos usuários do seed. A busca por nome é aplicada ao enviar o formulário; capacidade e recurso são aplicados ao selecionar. Os filtros e a página ficam na URL e podem ser compartilhados. `GET /api/health` responde `200` com `{"status":"ok"}` e indica apenas que o servidor HTTP está ativo; ainda não verifica o banco. `db:setup` executa `db:migrate` e, somente se a migration terminar sem erro, executa `db:seed`.

O catálogo pode ser consultado sem sessão em `GET /api/rooms?q=&capacity=&resource=&page=`. As faixas aceitas em `capacity` são `2-4`, `5-8`, `9-12` e `13-plus`; os filtros são combináveis, a página começa em 1 e contém no máximo 12 salas. A interface ajusta URLs com páginas acima do total para a última página disponível. `GET /api/resources` fornece as opções do filtro. Parâmetros inválidos recebem `400` e a resposta do catálogo separa `items` dos metadados de `pagination`.

### Reservas (API)

`GET /api/rooms/1/availability?date=2030-10-20` é público e retorna `{roomId, date, timezone, unavailable}`; cada item de `unavailable` contém somente `startTime` e `endTime` em `HH:mm`. `POST /api/reservations` recebe JSON `{ "roomId": 1, "date": "2030-10-20", "startTime": "10:00", "endTime": "11:00" }` e exige uma sessão selecionada em `POST /api/session`. O `userId` vem exclusivamente da sessão; enviar esse campo no corpo causa `400`. A criação responde `201` com `{reservation}`; o intervalo é salvo em UTC e apresentado em `America/Sao_Paulo`.

O início precisa estar no futuro, entrada e saída devem ser no mesmo dia, em ordem crescente, e a duração mínima é de 15 minutos. A duração máxima vem de `maxReservationDurationMinutes` da sala escolhida; ultrapassá-la retorna `400`. Reservas são aceitas somente de segunda a sexta-feira e precisam ficar totalmente contidas entre 08:00 e 20:00 no fuso `America/Sao_Paulo`; os limites são inclusivos. Fim de semana retorna `400` com `NON_BUSINESS_DAY`, e horário fora do funcionamento retorna `400` com `OUTSIDE_BUSINESS_HOURS`. Intervalos adjacentes são aceitos; sobreposição retorna `409`. Data, horário ou duração inválidos retornam `400`; sessão ausente, `401`; sala inexistente, `404`. A consulta de disponibilidade informa a agenda atual, mas o `POST` verifica o conflito novamente dentro de uma transação SQLite `IMMEDIATE`. Contenção do SQLite também recebe resposta `409` controlada.

No catálogo, “Reservar” consulta a sessão atual antes de abrir o diálogo. Sem usuário selecionado, a interface orienta a usar “Entrar como”. O modal permite escolher a data pelo calendário nativo, digitar entrada e saída em `HH:mm`, consultar os horários ocupados e visualizar a duração máxima da sala. Ele informa permanentemente que as reservas funcionam de segunda a sexta-feira, das 08:00 às 20:00. Fim de semana, horário fora desse intervalo e saída anterior à entrada deixam o campo inválido imediatamente e apresentam uma explicação. A validação do cliente usa o limite da sala para orientar antes do envio; o servidor continua sendo a validação definitiva. A consulta tem loading, retry e cancelamento de respostas antigas; erros do servidor preservam os campos preenchidos e aparecem em toast. Em `409`, a disponibilidade também é atualizada. Após `201`, o modal fecha e reabre com formulário limpo. Em telas móveis ele ocupa a tela inteira.

### Minhas reservas (API)

`GET /api/reservations?q=&status=active&page=1` exige sessão e retorna `{items, pagination}` com até 10 reservas por página. `status` aceita `active` (padrão), `completed` e `all`; reservas canceladas ficam fora de todos os filtros. A busca usa o nome da sala. Reservas em andamento e futuras aparecem por início crescente; concluídas, por fim decrescente. Em `all`, as ativas aparecem antes das concluídas; o ID desempata. O status `SCHEDULED`, `IN_PROGRESS` ou `COMPLETED` é calculado com o relógio do servidor. Cada item inclui os instantes UTC e `{id, name, address, capacity, imageUrl}` da sala.

`PATCH /api/reservations/{reservationId}/cancel` cancela apenas uma reserva futura do usuário da sessão e responde `204` sem corpo. A requisição não aceita query nem body; o usuário vem exclusivamente da sessão. A migration aditiva `canceled_at` preserva o histórico; disponibilidade e verificação de sobreposição ignoram reservas canceladas, liberando o horário. Entrada inválida retorna `400`, ausência de sessão `401`, reserva inexistente ou alheia `404`, e reserva em andamento, concluída ou já cancelada `409`. A consulta e a atualização condicional ocorrem em transação SQLite `IMMEDIATE` para impedir dupla confirmação de cancelamento.

A rota `/my-reservations` mantém busca `q`, situação `status` e página `page` na URL. Os cards exibem sala, data e horários no fuso de São Paulo e o status calculado pelo servidor. O diálogo de detalhes mostra dados somente para leitura; reservas agendadas oferecem cancelamento em um segundo diálogo de confirmação. Após `204`, a tela atualiza a lista e normaliza uma página que ficou vazia. A troca de usuário no cabeçalho recarrega a listagem; sem sessão, a tela orienta a usar “Entrar como”.

### Administração de salas (API)

`GET /api/admin/rooms?q=&capacity=&resource=&page=` usa os mesmos filtros do catálogo, ordena por nome e ID e retorna `{items, pagination}` com 10 salas por página. Cada item inclui `resourceIds` para preencher o formulário de edição. `GET /api/resources` fornece `id`, `code` e `name` para o multiselect. Os contratos públicos de sala incluem `complement`, exibido após o endereço quando preenchido.

`POST /api/admin/rooms` e `PATCH /api/admin/rooms/{roomId}` recebem JSON com `name`, `description`, `capacity`, `address`, `complement` opcional, `resourceIds` (array que pode ser vazio) e `maxReservationDurationMinutes`. O formulário de edição envia o conjunto completo de campos permitidos. Nome, descrição e endereço não podem ficar em branco; capacidade deve ser inteiro positivo. A duração máxima deve ser um inteiro a partir de 15 minutos e não possui teto administrativo de negócio. IDs de recursos devem ser distintos e existir no banco. Campos extras no body, inclusive `imageUrl`, `role` e `userId`, ou qualquer parâmetro de query recebem `400`. O cadastro retorna `201` com `{room}`; a edição retorna `200` com `{room}`. Sala inexistente retorna `404` e nome duplicado, sem diferenciar maiúsculas/minúsculas, retorna `409`.

Todos os três métodos chamam `requireAdmin()` no servidor: sem sessão retornam `401` e com usuário comum retornam `403`. A criação e a edição ocorrem em transação SQLite `IMMEDIATE`, incluindo validação de nome/recursos e substituição dos vínculos. A migration acrescenta `complement` nulo às salas existentes e um índice único para `lower(name)`; como o `lower` nativo do SQLite cobre principalmente ASCII, a validação transacional da aplicação também compara nomes com acentos. Novas salas recebem `imageUrl: null` e mostram o fallback local; a edição preserva qualquer imagem existente. Um upload futuro exigiria salvar o arquivo em armazenamento local e gravar seu caminho em `image_url`. Na AWS, o arquivo iria ao S3; a aplicação gravaria a chave/URL e serviria o objeto por acesso controlado ou CloudFront.

A página `/admin` verifica a role no servidor e redireciona visitantes e usuários comuns para `/`. O link Admin só aparece para ADMIN; uma troca de sessão que retira essa role redireciona imediatamente. A tabela apresenta 10 salas por página, filtros `q`, `capacity`, `resource` e `page` na URL, endereço com complemento e coluna de ações fixa à direita na rolagem horizontal. O menu permite editar e mostra Remover desabilitado. O mesmo formulário atende cadastro e edição, com validação de campos, duração máxima em minutos, seleção de recursos em chips e imagem desabilitada. O campo de duração começa em 240 para uma nova sala, aceita qualquer inteiro a partir de 15 e carrega o valor existente na edição. Após salvar, a lista é atualizada; conflitos preservam os dados digitados. O modal usa tela cheia no mobile e devolve o foco ao botão de origem após fechar.

Por padrão, o banco de desenvolvimento é `development.sqlite` e o de testes é `test.sqlite`, ambos na raiz e ignorados pelo Git. Os caminhos podem ser alterados por `DB_STORAGE_DEVELOPMENT` e `DB_STORAGE_TEST` (ver `.env.example`). Para executar os comandos individuais do banco no ambiente de teste, acrescente `-- --env test` a `db:migrate` e `db:seed`. Para usar `db:setup` no ambiente de teste, defina `NODE_ENV=test` no terminal antes de executá-lo. O Sequelize CLI lê as variáveis do processo; se usar caminhos personalizados, defina essas variáveis no terminal antes de executar os comandos.

Para verificar a aplicação, execute `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test` e `npm run build`. Os comandos `npm run lint:fix` e `npm run format` aplicam correções locais antes de uma nova verificação.

O Prettier aceita o fim de linha nativo do arquivo (`LF` ou `CRLF`) para que a verificação funcione no checkout Windows e no CI Linux sem alterar arquivos não relacionados.

Os testes unitários de componentes e código executado no navegador ficam em `tests/unit/client`; regras e módulos do servidor ficam em `tests/unit/server`. Quando uma funcionalidade possui vários arquivos de teste, eles são agrupados em uma subpasta com o nome do domínio, como `tests/unit/server/reservation` e `tests/unit/client/room`. Os cenários são documentados em `tests/scenarios`, e os helpers reutilizáveis ficam em `tests/helpers`. O Jest usa ambiente Node por padrão e `jsdom` apenas nos testes de componentes. Os testes permanecem isolados e podem ser executados em paralelo pelo Jest, permitindo que a suíte cresça sem impor execução sequencial. O setup cobre autorização da sessão e troca de usuário na interface com repository, cookie e HTTP simulados, sem acessar SQLite. `npm run test:watch` executa os testes durante o desenvolvimento e `npm run test:coverage` gera o relatório de cobertura.

## Integração contínua

O workflow `.github/workflows/ci.yml` roda em pull requests para `develop` e `main`, com permissão apenas de leitura no repositório. Usa Node 24 conforme `.nvmrc`, cache npm e `npm ci`. Prepara migrations e seed em um SQLite temporário com `NODE_ENV=test`, depois executa formatação, lint, typecheck, `npm test` e build. O template de PR pede o quê mudou, por quê e como testar.

O workflow já é executado nos pull requests. A [ruleset de branches no GitHub](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository) deve proteger `develop` e `main`, exigindo pull request e o status `Verify` da CI antes do merge. Essa configuração remota deve ser conferida diretamente no repositório; os comandos locais validam apenas o conteúdo deste checkout.

## Decisões técnicas

| Escolha                                                             | Motivo                                                                                                                                           |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Next.js 16.4.2 com App Router e TypeScript strict                   | Atende ao requisito obrigatório; páginas e API REST podem viver na mesma aplicação. A versão está fixada no lockfile para reproduzir o ambiente. |
| Node.js 24.19.0 LTS e npm                                           | Runtime com suporte de longo prazo e instalação reproduzível pelo lockfile.                                                                      |
| SQLite e Sequelize 6.37.8                                           | Banco relacional local, sem serviço externo; Sequelize oferece models, migrations e seeds em uma ferramenta que possuo familiaridade.            |
| Zod                                                                 | Valida dados recebidos pela API antes de aplicar as regras de negócio.                                                                           |
| Material UI e Material Icons                                        | Aceleram a construção de formulários, navegação acessível e componentes responsivos com identidade consistente.                                  |
| Campos MUI com data/hora nativas                                    | Oferecem calendário e edição `HH:mm` sem dependência prerelease; a versão estável do MUI X Date Pickers ainda não declara suporte ao MUI 9.5.    |
| Axios no cliente                                                    | Centraliza as chamadas HTTP das interações feitas no navegador.                                                                                  |
| Day.js com plugins UTC/timezone                                     | Interpreta os horários recebidos em `America/Sao_Paulo` e persiste instantes UTC sem depender do fuso do servidor.                               |
| React Toastify                                                      | Centraliza mensagens de falha das interações assíncronas sem acoplar o feedback visual aos componentes de formulário.                            |
| Jest e React Testing Library                                        | Testes unitários das regras e dos componentes interativos, com dependências externas controladas por mocks.                                      |
| ESLint 9 com regras Next.js Core Web Vitals/TypeScript e Prettier 3 | Detectam problemas de código e mantêm formatação consistente; o CI executa os mesmos scripts usados localmente.                                  |

## Direção visual

Referência para as telas funcionais: cabeçalho claro, roxo para identidade e navegação, laranja para ações principais e cartões para as salas. Os tokens de cor estão em `src/app/globals.css`; o tema do Material UI reproduz essa paleta. `AppRouterCacheProvider` integra o MUI ao App Router e evita problemas de renderização dos estilos no servidor. Os PNGs locais da marca, do hero e do fallback das salas estão otimizados em `public/assets`; título e descrição do hero permanecem em HTML para preservar acessibilidade e adaptação aos breakpoints.

O cabeçalho fica no layout raiz e persiste entre as páginas. No desktop, exibe a navegação central e a rota ativa; no mobile, usa um drawer à esquerda que fecha com `Escape` e devolve o foco ao botão. O seletor informa progresso e erros por região acessível e toast. O catálogo usa até 12 cartões por página, com quatro colunas no desktop, duas em telas intermediárias e uma no mobile. Imagens ausentes ou com erro usam o fallback local. O botão “Reservar” abre o diálogo após validação da sessão. “Minhas reservas” usa cards horizontais no desktop e empilhados no mobile, com diálogos distintos para detalhes e confirmação; ambos preservam navegação por teclado e foco. O link Admin aparece somente para a sessão ADMIN.

## Organização do código

- `src/app`: páginas e Route Handlers do App Router; cada handler expõe os métodos HTTP e delega ao controller.
- `src/server/controllers`: entrada HTTP, validação dos dados recebidos e construção da resposta. O controller de saúde é o primeiro exemplo.
- `src/server/repositories`: isola consultas ao banco; `src/server/services` coordena as regras e o contrato do catálogo.
- `src/server/db`, `src/server/auth`, `src/server/schemas` e `src/server/http`: models/conexão, identificação e autorização, validação Zod e respostas de erro.
- `src/services/api`: instância Axios para Client Components. `src/components` contém o tema, o cabeçalho, o toast e a interface; `src/types` guarda tipos compartilhados com uso no servidor e no cliente.

A autorização é verificada no servidor: o seletor de usuário definirá uma sessão simulada, e a role é consultada no banco. O fuso das regras de reserva será `America/Sao_Paulo`. O Next carrega Sequelize e SQLite diretamente no runtime Node por `serverExternalPackages`, pois o empacotamento padrão do Turbopack tenta resolver drivers de outros bancos que o projeto não usa.

O helper `validate` recebe dados de body, query ou parâmetros de rota e aplica o schema Zod correspondente. Ele valida a sessão simulada e os filtros do catálogo antes que controller e service processem os valores.

## Sessão simulada

- `POST /api/session` recebe JSON `{"userId":1}`, valida o corpo com Zod e grava o ID selecionado em cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção. A role não vem do navegador.
- `GET /api/session` retorna `{ "user": { "id", "name", "role" } }` consultando o usuário no banco; sem cookie ou com ID inexistente, retorna `401`.
- `DELETE /api/session` limpa o cookie e retorna `204`. Payload inválido recebe `400`; tipo de conteúdo diferente de JSON recebe `415`. O helper `requireAdmin` produz `403` quando um usuário sem role `ADMIN` tenta acessar uma rota protegida.

Este cookie guarda apenas o ID escolhido e representa uma **autenticação simulada** para o desafio, não uma prova de identidade. Mesmo com `HttpOnly`, alguém pode selecionar outro usuário ou manipular o próprio cookie. Os handlers protegidos dos cards usarão `requireUser` ou `requireAdmin` no servidor e consultarão a role no banco. Uma implantação real exigiria autenticação e sessão assinada.

Na página inicial, o seletor “entrar como” usa os usuários do seed lidos no servidor. Ele envia a escolha a `POST /api/session`, permite trocar de usuário e sair com `DELETE /api/session`. O usuário selecionado persiste após recarregar a página por meio do cookie.

## Dados de exemplo e modelagem

As migrations versionadas em `database/migrations` criam `users`, `rooms`, `resources`, `room_resources` e `reservations`, com chaves estrangeiras e índices para consultas por sala, recurso e usuário. Salas possuem endereço e descrição obrigatórios, complemento e URL de imagem opcionais. Recursos foram separados em tabelas relacionais para permitir filtros no banco. Migrations e seeders usam CommonJS, carregado diretamente pelo Sequelize CLI; os models da aplicação ficam em TypeScript strict em `src/server/db/models.ts`. O schema é aplicado somente por migrations, sem `sequelize.sync()`.

O seed em `database/seeders` cria cinco salas, dois usuários `USER`, um `ADMIN`, seis recursos e seus vínculos com as salas. Ele pode ser executado novamente sem duplicar dados nem sobrescrever endereço ou descrição já editados.

Reservas têm usuário, sala, início, fim e instante opcional de cancelamento. Cada sala armazena sua duração máxima em minutos; a migration da SALA-6 atribui 240 minutos às salas existentes e os seeds demonstram limites diferentes. A sobreposição é impedida por validação dentro de uma transação no servidor; SQLite não oferece uma constraint simples para intervalos de tempo sobrepostos.

## Fluxo de entrega

`main` representa produção e `develop` integra as funcionalidades. O commit inicial foi criado em `main` para inicializar o repositório; `develop` e `feature/SALA-0-setup` foram criadas a partir dele. As mudanças são propostas por pull request, com descrição do que mudou, por que mudou e como testar. Os commits seguem Conventional Commits. Releases partem de `develop` em `release/<versão>`, são integradas em `main`, recebem uma tag `v<versão>` e depois são mescladas de volta em `develop`.

### Resolução do conflito entre SALA-5 e SALA-6

O hotfix SALA-5 partiu de `main` na versão 1.0.0, onde a duração máxima ainda era fixa em quatro horas. Enquanto isso, a SALA-6 já estava em `develop` e substituía esse valor pelo limite configurado em cada sala. Ao retornar o hotfix para `develop`, foram mantidas as duas regras: a reserva deve durar no mínimo 15 minutos, respeitar o máximo da sala, ocorrer de segunda a sexta-feira e permanecer entre 08:00 e 20:00.

Os conflitos em `reservation-form-utils` e no diálogo de reserva foram resolvidos preservando o parâmetro `maxReservationDurationMinutes` da SALA-6 e as validações visuais e de horário da SALA-5. Os testes conflitantes passaram a fornecer o limite da sala e usam datas futuras em dias úteis. README e CHANGELOG mantêm tanto o registro do hotfix 1.0.1 quanto a funcionalidade que será publicada na versão 1.1.0. O serviço do servidor também foi conferido para garantir que ele aplique o horário de funcionamento antes de comparar a duração com o limite da sala.

## Limites e pendências

Swagger/OpenAPI, Docker, exclusão de salas e o desenho detalhado da arquitetura AWS serão avaliados depois dos requisitos obrigatórios. A proposta AWS será escrita após a aplicação estar completa para considerar com precisão execução, banco, arquivos estáticos, possível uso de S3, segredos e separação dos ambientes. Ao atingir aproximadamente oito horas de implementação, o trabalho será interrompido e o que faltar será registrado aqui.

`npm audit --omit=dev` aponta duas ocorrências moderadas na dependência transitiva `uuid` usada pelo Sequelize v6. Os IDs deste projeto são inteiros; a versão estável escolhida será mantida nesta etapa porque não há correção automática segura. Reavaliar a dependência antes de produção.
