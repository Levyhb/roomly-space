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

SQLite temporário: migration/seed em banco vazio geraram cinco salas com complemento nulo; banco migrado até SALA-3 e com endereço/descrição editados recebeu a migration sem perder dados. Em `next start`, visitante recebeu `401`, USER recebeu `403` e ADMIN listou, criou (`201`), recebeu `409` por nome duplicado, editou (`200`), viu complemento e recursos atualizados no catálogo público; recurso inexistente recebeu `400`.

Mutações controladas e restauradas: remover `requireAdmin` de GET fez `TC_SALA_4_001` falhar com `200` no lugar de `401`; remover a exclusão dos vínculos antigos fez `TC_SALA_4_015` falhar.
Retirar a rejeição de query em POST e em PATCH, separadamente, fez `TC_SALA_4_016` falhar com `201` e `200`; ambas as mutações foram restauradas.
