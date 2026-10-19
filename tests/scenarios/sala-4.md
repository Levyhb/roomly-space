# SALA-4 — administração de salas

| ID            | Cenário                                                            | Esperado                                                              |
| ------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| TC_SALA_4_001 | GET/POST/PATCH sem sessão ou como USER                             | `401`/`403`, sem chamar o serviço                                     |
| TC_SALA_4_002 | Listagem com filtros combinados                                    | Busca, capacidade, recurso e página encaminhados; 10 itens por página |
| TC_SALA_4_003 | Query inválida, duplicada ou extra                                 | `400`                                                                 |
| TC_SALA_4_004 | Cadastro e edição válidos                                          | `201`/`200` e campos permitidos encaminhados                          |
| TC_SALA_4_005 | Body com imagem, role, capacidade, descrição ou recursos inválidos | `400`, sem gravar                                                     |
| TC_SALA_4_006 | ID inválido ou sala inexistente; nome conflitante                  | `400`, `404` ou `409`                                                 |
| TC_SALA_4_007 | Consulta administrativa                                            | Filtros, ordenação do repository e paginação de 10 itens              |
| TC_SALA_4_008 | Cadastro com recursos                                              | Sala e vínculos usam a mesma transação                                |
| TC_SALA_4_009 | Nome duplicado com caixa diferente, inclusive acento               | `409` antes da gravação                                               |
| TC_SALA_4_010 | ID de recurso inexistente                                          | `400` antes da gravação                                               |
| TC_SALA_4_011 | Edição de sala                                                     | Vínculos substituídos; imagem não é alterada                          |
| TC_SALA_4_012 | Edição de ID inexistente                                           | `404`, sem escrita                                                    |
| TC_SALA_4_013 | Cadastro sem complemento ou recursos                               | Aceito; vínculos vazios                                               |
| TC_SALA_4_014 | Persistência da imagem                                             | Criação usa `null`; edição não envia `imageUrl`                       |
| TC_SALA_4_015 | Substituição de vínculos                                           | Apaga antigos antes de inserir novos, na mesma transação              |
| TC_SALA_4_016 | Query extra em POST/PATCH (`userId` ou `role`)                     | `400` após autorização, sem chamar o serviço                          |
| TC_SALA_4_017 | Acesso direto a `/admin`                                           | Visitante e USER redirecionados no servidor; ADMIN acessa             |
| TC_SALA_4_018 | Link Admin e troca de perfil                                       | Apenas ADMIN vê o link; perda da role redireciona                     |
| TC_SALA_4_019 | Filtros/tabela administrativa                                      | URL alimenta GET; endereço com complemento, capacidade e ações        |
| TC_SALA_4_020 | Loading e respostas fora de ordem                                  | Skeleton; resultado antigo não substitui o novo                       |
| TC_SALA_4_021 | Erro, lista vazia e busca sem resultado                            | Retry, cadastro inicial ou limpar filtros                             |
| TC_SALA_4_022 | Menu e edição                                                      | Editar preenche o modal; Remover desabilitado; foco retorna ao botão  |
| TC_SALA_4_023 | Campos inválidos e imagem                                          | Mensagens locais; sem POST; imagem desabilitada                       |
| TC_SALA_4_024 | Cadastro                                                           | Body permitido, envio único, toast, refetch e foco                    |
| TC_SALA_4_025 | Edição com conflito                                                | Dados preservados em `409`; PATCH sem imagem; retry                   |
| TC_SALA_4_026 | Página acima do total                                              | URL normalizada                                                       |
| TC_SALA_4_027 | Troca de sessão durante GET                                        | Resposta antiga ignorada; USER redirecionado                          |
| TC_SALA_4_028 | Seleção de recursos                                                | Chips visíveis e IDs enviados ao servidor                             |
| TC_SALA_4_029 | Modal mobile                                                       | Diálogo em tela cheia                                                 |
| TC_SALA_4_030 | Erro no carregamento de recursos                                   | Retry independente da tabela                                          |
| TC_SALA_4_031 | Escape no formulário                                               | Diálogo fecha e foco volta ao gatilho                                 |
| TC_SALA_4_032 | Escrita sem permissão                                              | Redireciona sem sucesso falso                                         |
| TC_SALA_4_033 | Filtros e paginação                                                | Selects e página atualizam URL                                        |

SQLite temporário: migration/seed em banco vazio geraram cinco salas com complemento nulo; banco migrado até SALA-3 e com endereço/descrição editados recebeu a migration sem perder dados. Em `next start`, visitante recebeu `401`, USER recebeu `403` e ADMIN listou, criou (`201`), recebeu `409` por nome duplicado, editou (`200`), viu complemento e recursos atualizados no catálogo público; recurso inexistente recebeu `400`.

Mutações controladas e restauradas: remover `requireAdmin` de GET fez `TC_SALA_4_001` falhar com `200` no lugar de `401`; remover a exclusão dos vínculos antigos fez `TC_SALA_4_015` falhar.
Retirar a rejeição de query em POST e em PATCH, separadamente, fez `TC_SALA_4_016` falhar com `201` e `200`; ambas as mutações foram restauradas.
Na etapa 2, retirar a proteção do Server Component fez `TC_SALA_4_017` falhar; retirar a guarda de respostas antigas fez `TC_SALA_4_020` perder o resultado atual. As mutações foram restauradas.

QA visual real desktop/mobile pendente: o navegador embutido não estava disponível e o Computer Use encerrou o acesso ao Chrome por não conseguir confirmar a URL atual com segurança. Os testes de renderização mobile, foco, menu, tabela e formulário passaram em jsdom; isso não substitui a inspeção visual no navegador.
