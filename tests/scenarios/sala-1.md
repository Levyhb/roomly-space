# SALA-1 — API do catálogo

| ID            | Cenário                           | Esperado                                                   |
| ------------- | --------------------------------- | ---------------------------------------------------------- |
| TC_SALA_1_001 | Busca por nome                    | `q` chega ao repository                                    |
| TC_SALA_1_002 | Faixas 2–4, 5–8, 9–12 e 13+       | Limites inclusivos aplicados                               |
| TC_SALA_1_003 | Filtro de recurso                 | Código chega ao repository                                 |
| TC_SALA_1_004 | Busca, faixa, recurso e página    | Filtros combinados                                         |
| TC_SALA_1_005 | Página 2 de 13 itens              | `pageSize=12`, `totalPages=2`                              |
| TC_SALA_1_006 | Parâmetros inválidos              | HTTP 400 `INVALID_INPUT`                                   |
| TC_SALA_1_007 | Sem sessão                        | HTTP 200                                                   |
| TC_SALA_1_008 | Listar recursos                   | Opções vêm do banco                                        |
| TC_SALA_1_009 | Busca e capacidade no repository  | Predicados SQL inclusivos, ordem e paginação               |
| TC_SALA_1_010 | Recurso combinado no repository   | IDs associados restringem salas sem apagar outros filtros  |
| TC_SALA_1_011 | Busca por `%`, `_` e barra        | Caracteres especiais são literais no SQL                   |
| TC_SALA_1_012 | API recebe busca especial         | Query decodificada é encaminhada sem alterar os caracteres |
| TC_SALA_1_013 | Busca com aspa simples            | Termo fica seguro no SQL                                   |
| TC_SALA_1_014 | Paginar antes de incluir recursos | Busca não depende de alias SQL do include                  |

Os testes unitários simulam o repository. A migration, o seed e as consultas SQL são validados separadamente em bancos temporários antes da entrega da etapa.

Validação manual do seed: alterar o endereço de uma sala e a descrição de outra, deixar o campo restante vazio e repetir `db:seed`. Os valores editados devem permanecer; os campos vazios devem receber os valores do seed. Em banco legado, os placeholders da migration também devem ser substituídos.
