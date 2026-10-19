# SALA-5 — dias úteis e horário de funcionamento

## Etapa 1 — validação no servidor

| Test case     | Cenário                                  | Resultado esperado                                    |
| ------------- | ---------------------------------------- | ----------------------------------------------------- |
| TC_SALA_5_001 | Segunda a sexta e limites 08:00/20:00    | Reservas aceitas                                      |
| TC_SALA_5_002 | Reserva no sábado ou domingo             | `400 NON_BUSINESS_DAY`, sem consultar ou gravar sala  |
| TC_SALA_5_003 | Entrada 07:59 ou saída 20:01 em dia útil | `400 OUTSIDE_BUSINESS_HOURS`, sem consultar ou gravar |

As verificações usam `America/Sao_Paulo`. A validação ocorre antes da consulta da sala e da abertura da transação, sem substituir futuro, mesmo dia, duração e sobreposição.
