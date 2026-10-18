# SALA-3 — minhas reservas (etapa 1)

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

Validação manual em SQLite temporário com Next em modo produção: migration e seed em banco vazio; reserva criada com `201`, listagem do segundo usuário vazia, cancelamento alheio `404`, cancelamento próprio `204`, item removido da listagem, disponibilidade livre e nova reserva no intervalo liberado com `201`. A ordenação de reservas em andamento, futuras e concluídas foi conferida em `status=all`. Outro banco foi migrado até a versão anterior, recebeu uma reserva e depois recebeu a migration nova; a reserva permaneceu com `canceled_at` nulo.

Mutações controladas e restauradas: remover `canceledAt: null` da listagem fez `TC_SALA_3_001` falhar; remover `userId` da atualização condicional fez `TC_SALA_3_003` falhar.
