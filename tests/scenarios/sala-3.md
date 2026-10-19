# SALA-3 — minhas reservas

| ID            | Cenário                                            | Esperado                                                                             |
| ------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| TC_SALA_3_001 | Lista própria com filtros e página                 | `userId` e `canceledAt: null` obrigatórios; ativas em ordem crescente, 10 por página |
| TC_SALA_3_002 | Busca literal pelo nome da sala                    | IDs filtrados sem interpolar a busca em SQL; concluídas mais recentes primeiro       |
| TC_SALA_3_003 | Atualização do cancelamento                        | Condição inclui dono, futuro e ausência de cancelamento                              |
| TC_SALA_3_004 | Fronteiras de status                               | Agendada, em andamento e concluída calculadas com relógio controlado                 |
| TC_SALA_3_005 | Reserva alheia ou inexistente                      | `404`, sem atualização                                                               |
| TC_SALA_3_006 | Em andamento, concluída ou cancelada               | `409`, sem atualização                                                               |
| TC_SALA_3_007 | Cancelamento bem sucedido ou atualização sem linha | Um registro atualizado ou `409`                                                      |
| TC_SALA_3_008 | Contenção SQLite                                   | `409` controlado                                                                     |
| TC_SALA_3_009 | GET com sessão                                     | Apenas ID da sessão enviado ao serviço; sem sessão retorna `401`                     |
| TC_SALA_3_010 | Query inválida, duplicada ou com `userId`          | `400`                                                                                |
| TC_SALA_3_011 | PATCH sem sessão ou ID inválido                    | `401` ou `400`, sem cancelamento                                                     |
| TC_SALA_3_012 | PATCH próprio, alheio e estado inválido            | `204` vazio, `404` e `409`                                                           |
| TC_SALA_3_013 | PATCH com query ou corpo                           | `400` antes do serviço, inclusive `userId`                                           |
| TC_SALA_3_014 | URL de busca e situação                            | GET recebe parâmetros; mudança de filtro reinicia página                             |
| TC_SALA_3_015 | Loading e resposta antiga                          | Skeleton durante GET; resultado novo prevalece                                       |
| TC_SALA_3_016 | Ausência e troca de sessão                         | Orientação ao visitante; nova sessão recarrega a lista                               |
| TC_SALA_3_017 | Vazio total e busca sem resultado                  | CTA para catálogo ou limpar filtros                                                  |
| TC_SALA_3_018 | Erro de lista                                      | Retry recupera consulta                                                              |
| TC_SALA_3_019 | Página acima do total                              | URL substituída pela última página válida                                            |
| TC_SALA_3_020 | Card e detalhes somente leitura                    | Dados da sala/status, campos readonly e nenhum GET de disponibilidade                |
| TC_SALA_3_021 | Status e confirmação                               | Concluída sem cancelamento; agendada abre confirmação e Voltar restaura foco         |
| TC_SALA_3_022 | Cancelamento bem sucedido                          | Envio único, loading, PATCH, fecha diálogos, toast, refetch e foco na busca          |
| TC_SALA_3_023 | Falha no cancelamento                              | Contexto preservado e nova tentativa possível                                        |
| TC_SALA_3_024 | Paginação                                          | Navegação altera `page` na URL                                                       |
| TC_SALA_3_025 | Detalhes no mobile                                 | Diálogo ocupa a tela                                                                 |
| TC_SALA_3_026 | Cancelamento do último item da página              | Refetch substitui URL pela última página válida                                      |
| TC_SALA_3_027 | Formatação de data e horário                       | Instantes UTC exibidos em `America/Sao_Paulo`                                        |
| TC_SALA_3_028 | Troca de sessão com GET pendente                   | Requisição antiga abortada; resposta antiga não substitui dados da nova sessão       |
| TC_SALA_3_029 | PATCH retorna 400                                  | Confirmação preservada; mensagem de erro genérica                                    |
| TC_SALA_3_030 | PATCH retorna 401                                  | Confirmação preservada; orientação para entrar novamente                             |
| TC_SALA_3_031 | PATCH retorna 404                                  | Confirmação preservada; mensagem de erro genérica                                    |
| TC_SALA_3_032 | PATCH retorna 409                                  | Confirmação preservada; mensagem de estado alterado                                  |

Validação manual em SQLite temporário com Next em modo produção: migration e seed em banco vazio; reserva criada com `201`, listagem do segundo usuário vazia, cancelamento alheio `404`, cancelamento próprio `204`, item removido da listagem, disponibilidade livre e nova reserva no intervalo liberado com `201`. A ordenação de reservas em andamento, futuras e concluídas foi conferida em `status=all`. Outro banco foi migrado até a versão anterior, recebeu uma reserva e depois recebeu a migration nova; a reserva permaneceu com `canceled_at` nulo.

Mutações controladas e restauradas: remover `canceledAt: null` da listagem fez `TC_SALA_3_001` falhar; remover `userId` da atualização condicional fez `TC_SALA_3_003` falhar.

Na etapa 2, retirar a guarda de resposta antiga fez `TC_SALA_3_015` perder o resultado mais novo; retirar o refetch após `204` fez `TC_SALA_3_022` falhar. Ambas as mutações foram restauradas.

Na revisão de foco, o fechamento passou a aguardar a saída dos dois diálogos antes de focar a busca. Remover o foco final em `onTransitionExited` fez `TC_SALA_3_022` falhar; a mutação foi restaurada.
