# SETUP — cenários automatizados

| ID           | Ambiente | Cenário                               | Resultado esperado                                               |
| ------------ | -------- | ------------------------------------- | ---------------------------------------------------------------- |
| TC_SETUP_001 | Node     | Acesso sem cookie de sessão           | 401; repository não é consultado                                 |
| TC_SETUP_002 | Node     | Usuário comum solicita acesso admin   | 403 após consultar a role no repository                          |
| TC_SETUP_003 | jsdom    | Selecionar admin na interface inicial | POST de sessão e estado visível atualizado com a resposta da API |

Os testes usam mocks de repository, cookie e HTTP; não acessam SQLite. Os cenários dos cards SALA serão adicionados em arquivos próprios quando suas regras forem implementadas.
