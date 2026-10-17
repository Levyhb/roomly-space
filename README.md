# Roomly Space

Sistema interno de reserva de salas de reunião desenvolvido para o desafio técnico Full Stack Pleno da Sensedia.

## Estado do projeto

A base Next.js e as verificações de lint e formatação foram configuradas. As funcionalidades de salas e reservas, o banco com seed, os testes e a CI serão acrescentados nas próximas etapas.

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
npm run dev
```

Acesse `http://localhost:3000`. Neste estágio, a página mostra apenas que o sistema está em construção. O banco e o seed serão adicionados no setup; a versão final deverá subir com dados de exemplo em até três comandos.

Para verificar a base atual, execute `npm run lint`, `npm run format:check`, `npm run typecheck` e `npm run build`. Os comandos `npm run lint:fix` e `npm run format` aplicam correções locais antes de uma nova verificação.

## Decisões técnicas

| Escolha                                                             | Motivo                                                                                                                                           |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Next.js 16.4.2 com App Router e TypeScript strict                   | Atende ao requisito obrigatório; páginas e API REST podem viver na mesma aplicação. A versão está fixada no lockfile para reproduzir o ambiente. |
| Node.js 24.19.0 LTS e npm                                           | Runtime com suporte de longo prazo e instalação reproduzível pelo lockfile.                                                                      |
| SQLite e Sequelize v6                                               | Banco relacional local, sem serviço externo; Sequelize oferece models, migrations e seeds em uma ferramenta que possuo familiaridade.            |
| Zod                                                                 | Valida dados recebidos pela API antes de aplicar as regras de negócio.                                                                           |
| Material UI                                                         | Acelera a construção de formulários e componentes responsivos.                                                                                   |
| Axios no cliente                                                    | Centraliza as chamadas HTTP das interações feitas no navegador.                                                                                  |
| Jest e React Testing Library                                        | Testes unitários das regras e dos componentes interativos, com dependências externas controladas por mocks.                                      |
| ESLint 9 com regras Next.js Core Web Vitals/TypeScript e Prettier 3 | Detectam problemas de código e mantêm formatação consistente; o CI usará os mesmos scripts quando for configurado.                               |

Os Route Handlers do Next.js farão a entrada HTTP. Controllers tratarão requisições e respostas, services aplicarão regras e repositories acessarão os dados. A autorização será verificada no servidor: o seletor de usuário define uma sessão simulada, e a role é consultada no banco. O fuso das regras de reserva será `America/Sao_Paulo`.

## Fluxo de entrega

`main` representa produção e `develop` integra as funcionalidades. Mudanças serão propostas por pull request, com descrição do que mudou, por que mudou e como testar. Os commits seguem Conventional Commits. O repositório remoto foi criado vazio; a inicialização das branches será registrada aqui antes da primeira entrega.

## Limites e pendências

Swagger/OpenAPI, Docker e exclusão de salas serão avaliados depois dos requisitos obrigatórios. Ao atingir aproximadamente oito horas de implementação, o trabalho será interrompido e o que faltar será registrado aqui.
