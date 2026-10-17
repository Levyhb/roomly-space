# Roomly Space

Sistema interno de reserva de salas de reunião desenvolvido para o desafio técnico Full Stack Pleno.

## Estado do projeto

Planejamento inicial. A aplicação ainda não foi implementada. As instruções executáveis, testes e o desenho de produção serão acrescentados durante o desenvolvimento.

## Escopo previsto

- Listagem de salas com filtros na URL por capacidade e recurso.
- Reserva com validação no servidor de sobreposição, data futura e duração permitida.
- Listagem e cancelamento das próprias reservas.
- Cadastro e edição de salas com autorização de administrador no servidor.
- Duração máxima configurável por sala (SALA-6).
- Reservas apenas em dias úteis, das 08h às 20h (hotfix SALA-5).

## Como rodar

A preencher após o setup. Objetivo: instalar dependências, preparar banco com dados de exemplo e iniciar a aplicação em até três comandos.

## Decisões técnicas

| Escolha | Motivo |
| --- | --- |
| Next.js com App Router e TypeScript strict | Atende ao requisito obrigatório; páginas e API REST podem viver na mesma aplicação. |
| Node.js 24 LTS e npm | Runtime com suporte de longo prazo e instalação reproduzível pelo lockfile. |
| SQLite e Sequelize v6 | Banco relacional local, sem serviço externo; Sequelize oferece models, migrations e seeds em uma ferramenta familiar ao candidato. |
| Zod | Valida dados recebidos pela API antes de aplicar as regras de negócio. |
| Material UI | Acelera a construção de formulários e componentes responsivos. |
| Axios no cliente | Centraliza as chamadas HTTP das interações feitas no navegador. |
| Jest e React Testing Library | Testes unitários das regras e dos componentes interativos, com dependências externas controladas por mocks. |
| ESLint e Prettier | Mantêm regras de qualidade e formatação consistentes no trabalho e na CI. |

Os Route Handlers do Next.js farão a entrada HTTP. Controllers tratarão requisições e respostas, services aplicarão regras e repositories acessarão os dados. A autorização será verificada no servidor: o seletor de usuário define uma sessão simulada, e a role é consultada no banco. O fuso das regras de reserva será `America/Sao_Paulo`.

## Fluxo de entrega

`main` representa produção e `develop` integra as funcionalidades. Mudanças serão propostas por pull request, com descrição do que mudou, por que mudou e como testar. Os commits seguem Conventional Commits. O repositório remoto foi criado vazio; a inicialização das branches será registrada aqui antes da primeira entrega.

## Limites e pendências

Swagger/OpenAPI, Docker e exclusão de salas serão avaliados depois dos requisitos obrigatórios. Ao atingir aproximadamente oito horas de implementação, o trabalho será interrompido e o que faltar será registrado aqui.
