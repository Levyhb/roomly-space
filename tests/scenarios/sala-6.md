# SALA-6 — duração máxima por sala

## Etapa 1 — dados e validação no servidor

| Test case     | Cenário                                              | Resultado esperado                              |
| ------------- | ---------------------------------------------------- | ----------------------------------------------- |
| TC_SALA_6_001 | Salas com limites diferentes recebem a mesma duração | A sala de limite menor rejeita; a outra aceita  |
| TC_SALA_6_002 | Catálogo público retorna uma sala                    | Resposta inclui `maxReservationDurationMinutes` |

Validações complementares da etapa: API administrativa exige inteiro a partir de 15 minutos; repository persiste o campo no cadastro e na edição; migration aplica 240 minutos a uma sala legada; banco vazio recebe cinco salas com durações distintas pelos seeds.
