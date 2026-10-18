# SALA-2 — disponibilidade e criação da reserva

| ID            | Cenário                                                | Esperado                                                 |
| ------------- | ------------------------------------------------------ | -------------------------------------------------------- |
| TC_SALA_2_001 | Disponibilidade da sala e dia                          | Só horários locais, sem dados pessoais                   |
| TC_SALA_2_002 | Criação autenticada                                    | Usuário da sessão e instantes UTC na persistência        |
| TC_SALA_2_003 | Duração de 15 e 240 minutos                            | Ambas aceitas                                            |
| TC_SALA_2_004 | Duração de 14 e 241 minutos                            | Ambas rejeitadas antes do banco                          |
| TC_SALA_2_005 | Início passado ou igual ao instante atual              | HTTP 400                                                 |
| TC_SALA_2_006 | Horários iguais, invertidos ou outro dia               | HTTP 400                                                 |
| TC_SALA_2_007 | Conflito e adjacência                                  | Conflito 409, adjacência aceita                          |
| TC_SALA_2_008 | Sala inexistente na criação                            | HTTP 404, sem transação                                  |
| TC_SALA_2_009 | SQLite ocupado                                         | HTTP 409 controlado                                      |
| TC_SALA_2_010 | Predicado SQL de conflito                              | `start < existingEnd && end > existingStart`, por sala   |
| TC_SALA_2_011 | Predicado SQL de disponibilidade                       | Apenas intervalos que cruzam o dia solicitado            |
| TC_SALA_2_012 | Transação de criação                                   | SQLite `IMMEDIATE`                                       |
| TC_SALA_2_013 | GET público                                            | HTTP 200 sem exigir sessão                               |
| TC_SALA_2_014 | ID/data inválidos, chave extra e data duplicada no GET | HTTP 400, sem consultar disponibilidade                  |
| TC_SALA_2_015 | POST sem sessão                                        | HTTP 401, sem criação                                    |
| TC_SALA_2_016 | `userId` no corpo ou horário inválido                  | HTTP 400, sem criação                                    |
| TC_SALA_2_017 | USER e ADMIN autenticados                              | Ambos podem reservar; HTTP 201                           |
| TC_SALA_2_018 | Falhas da camada de serviço                            | HTTP 404 ou 409 preservado                               |
| TC_SALA_2_019 | Mesmo, parcial, contém e contido                       | Todos os conflitos rejeitados; bordas adjacentes aceitas |
| TC_SALA_2_020 | Fim às 23:59 e outra sala                              | Aceitos                                                  |
| TC_SALA_2_021 | Sala inexistente na disponibilidade                    | HTTP 404                                                 |
| TC_SALA_2_022 | SQLite bloqueado                                       | HTTP 409 controlado                                      |

Validação manual com banco temporário: duas requisições simultâneas para a mesma sala e intervalo retornaram `201` e `409`; a disponibilidade apresentou um único intervalo ocupado.
