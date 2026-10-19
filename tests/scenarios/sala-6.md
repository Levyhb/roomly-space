# SALA-6 — duração máxima por sala

## Etapa 1 — dados e validação no servidor

| Test case     | Cenário                                              | Resultado esperado                              |
| ------------- | ---------------------------------------------------- | ----------------------------------------------- |
| TC_SALA_6_001 | Salas com limites diferentes recebem a mesma duração | A sala de limite menor rejeita; a outra aceita  |
| TC_SALA_6_002 | Catálogo público retorna uma sala                    | Resposta inclui `maxReservationDurationMinutes` |

## Etapa 2 — interfaces

| Test case     | Cenário                                               | Resultado esperado                                        |
| ------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| TC_SALA_6_003 | Formulário de reserva recebe limites de 60 e 360 min  | Rejeita 61 minutos na primeira sala e aceita 300 na outra |
| TC_SALA_6_004 | Admin informa duração menor que 15 minutos            | Formulário bloqueia o envio e apresenta erro              |
| TC_SALA_6_005 | Reserva ultrapassa o limite exibido no modal          | Interface bloqueia o POST e informa o limite da sala      |
| TC_SALA_6_006 | Servidor retorna `400` por duração                    | Toast exibe a regra e os horários permanecem preenchidos  |
| TC_SALA_6_007 | Saída igual ou anterior à entrada durante a digitação | Campo de saída fica inválido e mostra orientação imediata |

Validações complementares da etapa: API administrativa exige inteiro a partir de 15 minutos; repository persiste o campo no cadastro e na edição; migration aplica 240 minutos a uma sala legada; banco vazio recebe cinco salas com durações distintas pelos seeds.
