# Daily examples (published board)

Output inside code fences is **pt-BR** (few-shot reference). Section titles are in English for the hub.

**Layout (mandatory since 26/06):** no blank lines within a person block (`*date*` → `**name**` → bullets). **One blank line** between people (after plano, before next `**name**`). See 26/06 canonical example.

### Example (link not bold; plan with several cards bold only)

```markdown
**gueff**

- No resto do dia ficou no card [Adição na API criação loja](https://github.com/AGX-Software/board/issues/7089)
- Hoje pretende subir os PRs do card **Adição na API criação loja**, testar o card **ChangeHistory Null** e continuar nas alterações dos PRs de tradução
```

### Example (absence + bullets)

```markdown
> Não participou da daily
**gueff**

- Fez correções no PR da [Importação de Cotas](https://github.com/AGX-Software/board/issues/6964) da BEVI. Corrigiu RCs do _Adriano_ nos **PRs de tradução**
- Hoje pretende dar continuidade à [Internacionalização Nexus](https://github.com/AGX-Software/board/issues/7120) e acompanhar revisões e testes pendentes
```

### Example (published board — 12/06)

```markdown
**adriano**

- Passou o dia tentando resolver as especificações de acesso no [Api TesseractX](https://github.com/AGX-Software/board/issues/7143), relacionadas à autenticação no módulo, e ajudou o _Nicolas_ e depois o _Cardoso_ com algumas dúvidas pontuais
- Hoje pretende seguir com a autenticação e com as demais RCs e melhorias estipuladas do **Api TesseractX**

**vieira**

- Começou o dia no card [Ajustar headers Rodobens](https://github.com/AGX-Software/board/issues/6951), fez nova análise e configuração para sucesso no card. Em seguida tratou o **Ticket** [PDF - Ajustes CET](https://github.com/AGX-Software/board/issues/7408)
- Hoje pretende seguir, junto ao _Nicolas_, no **Presentation PDF**
```

### Example (published board — 16/06)

```markdown
**adriano**

- Analisou e melhorou os testes integrados no [Api TesseractX](https://github.com/AGX-Software/board/issues/7143), atendeu as últimas solicitações do _Zarco_ e, depois, apresentou ao _Vieira_, onde surgiram mais pontos de correção. No restante do dia analisou problemas de lentidão no Tesseract
- Hoje pretende focar na [Adicionar Detran no Tesseract](https://github.com/AGX-Software/board/issues/7388)

**gueff**

- De manhã, junto ao _Nicolas_, separaram as atribuições para iniciar o card [Presentation PDF](https://github.com/AGX-Software/board/issues/7384) e, em paralelo, testou dois cards ([Adicionar CNPJ na Loja por API](https://github.com/AGX-Software/board/issues/7394) e [Atualizar CNPJ Retroativamente em Lojas](https://github.com/AGX-Software/board/issues/7395))
- Hoje pretende continuar no **Presentation PDF**
```

### Example (published board — 23/06)

```markdown
**adriano**

- Finalizou as RCs do card [Adicionar Detran no Tesseract](https://github.com/AGX-Software/board/issues/7388), implementou também alguns pontos de auditoria e, após as correções, começou a trabalhar em um kit de habilidades para o agente de IA documentar desenvolvimentos
- Hoje está fazendo testes nesse agente e pretende testar o desenvolvimento do **Adicionar Detran no Tesseract** que foi merged

**vieira**

- Começou o dia com o **Ticket** [Erro na extensão do arquivo AWS](https://github.com/AGX-Software/board/issues/7455). Depois do almoço fez uma gravação e acompanhou os testes do **Presentation PDF**
- Hoje pretende verificar o **Ticket** [Sem Saldo Devedor pra Refin](https://github.com/AGX-Software/board/issues/7460) e, caso não haja prioridades, seguir com o **SaaS**
```

### Example (published board — 24/06)

```markdown
**adriano**

- Começou o dia fazendo as wikis do [Api TesseractX](https://github.com/AGX-Software/board/issues/7143) e desenvolveu uma `SKILL.md` para IA gerar wikis. Corrigiu alguns pontos do [Adicionar Detran no Tesseract](https://github.com/AGX-Software/board/issues/7388) e, mais ao final do dia, fez uma nova _feature review_, onde surgiram mais apontamentos e explicações
- Hoje pretende seguir com as últimas solicitações do **Tesseract**

**gueff**

- Trabalhou no **Ticket** [Horário Errado Helpdesk](https://github.com/AGX-Software/board/issues/7461), fez o minor fix do [Adicionar CNPJ na Loja por API](https://github.com/AGX-Software/board/issues/7394) e, ao final do dia, começou o desenvolvimento do [Pdf na emissão de NF](https://github.com/AGX-Software/board/issues/7410)
- Hoje pretende seguir com o mesmo card

**rob**

- Trabalhou no **SaaS**, fez testes e começou a avançar na segunda parte de limitar o uso do usuário na plataforma. Ao final do dia, verificou o **Ticket** [Taxa de Adm incorreta no Consórcio](https://github.com/AGX-Software/board/issues/7457)
- Hoje está verificando um novo **Ticket** [Consórcio Lento](https://github.com/AGX-Software/board/issues/7472) e, depois, pretende voltar ao **SaaS**

**vieira**

- Começou o dia verificando o **Ticket** [Sem Saldo Devedor pra Refin](https://github.com/AGX-Software/board/issues/7460). Depois de finalizado, voltou ao **SaaS** e ficou nele o restante do dia. Em paralelo, acompanhou o _Gueff_ nas configs do `chat-web` e a _feature review_ do **Tesseract**
- Hoje pretende focar no **SaaS**, enquanto não houver outra prioridade
```

### Example (published board — 25/06)

```markdown
*25/06/2026*
**adriano**
- Começou a fazer as requisições da última _feature review_ do [Tesseract](https://github.com/AGX-Software/board/issues/7143) e finalizou as mais simples. Em paralelo, testou e melhorou a `SKILL.md` de wiki, criando wikis de tasks antigas que ficaram pendentes
- Hoje pretende continuar com as solicitações mais complexas da _feature review_ do **Tesseract**

**gueff**
- Ficou desenvolvendo o [Pdf na emissão de NF](https://github.com/AGX-Software/board/issues/7410), testou em local e abriu os PRs. Ao final do dia ficou abrindo os PRs do [Presentation PDF](https://github.com/AGX-Software/board/issues/7384) para `produção`
- Hoje pretende testar a NF em `HML`, terminar de abrir os PRs do **Presentation PDF** e aguardar nova tarefa do _Zarco_, em paralelo com os testes

**rob**
- De manhã trabalhou no **Ticket** [Simulação por parcela não simula](https://github.com/AGX-Software/board/issues/7472) da **ConeXia**, e na resolução identificou um problema de recursos em que o front enviava o array inteiro de ofertas sem uso no back. À tarde fez uma gravação e, ao final do dia, revisou o **SaaS**
- Hoje de manhã está revisando os PRs que irão subir e falou com o suporte sobre **Consórcio** com possível erro. Pretende seguir com o **SaaS**

**vieira**
- Começou o dia no **SaaS**. Depois o _Rob_ identificou um problema no front do Consórcio. Em seguida surgiram 3 tickets do PDF do consórcio ([#7469](https://github.com/AGX-Software/board/issues/7469), [#7474](https://github.com/AGX-Software/board/issues/7474) e [#7476](https://github.com/AGX-Software/board/issues/7476)). Depois fez alterações nas regras e skills do Cursor e, ao final do dia, voltou ao **SaaS** com ajustes no stepper
- Hoje pretende seguir com a revisão e subida dos PRs da **Órion** e continuar no **SaaS**
```

### Example (published board — 26/06) — canonical full team

```markdown
*26/06/2026*
**adriano**
- Terminou algumas pendências do [Tesseract](https://github.com/AGX-Software/board/issues/7143) que já tinha iniciado, mas não finalizou completamente os pontos relatados na _feature review_. À tarde começou o card [Bloqueio de usuário por inatividade](https://github.com/AGX-Software/board/issues/7426) e conversou com a _Samira_ para mais especificações
- Hoje pretende seguir com o mesmo card

**gueff**
- Começou o dia abrindo os PRs do [Presentation PDF](https://github.com/AGX-Software/board/issues/7384) para `produção`. Depois foi testar o card [Pdf na emissão de NF](https://github.com/AGX-Software/board/issues/7410) em `HML`. Em seguida foi pro card [Importação de Leads para o Seller](https://github.com/AGX-Software/board/issues/7477)
- Hoje pretende continuar com o card **Importação de Leads para o Seller** fazendo ajustes e testes. Além disso, aguardar os testes do **Presentation PDF** em `produção`

**rob**
- Realizou o deploy de alguns PRs da **Órion** ([CND Line](https://github.com/AGX-Software/board/issues/3470), **Presentation PDF** e [Props faltantes em `locations`](https://github.com/AGX-Software/board/issues/7458)). Na tarefa de **Locations** descobriu que faltaram alterações no `indiky-server` e desenvolveu elas
- Hoje pretende focar no **SaaS**, fazendo integração com o front e ajustes do fluxo

**vieira**
- Começou o dia revisando os PRs e acompanhando as subidas dos 3 cards da **Órion** que subiram ontem. Depois de tudo revisado, voltou ao **SaaS**, mas teve que parar porque surgiram várias RCs no PR do **Presentation PDF** do _Nicolas_. Em paralelo, também se preparou para a gravação que tinha no final do dia e, ao final do dia, fez a gravação
- Hoje o foco é o **SaaS**, fazendo a integração do back e front
```

### Example (published board — 29/06)

```markdown
*29/06/2026*
**adriano**
- Terminou a implementação do [Bloqueio de usuário por inatividade](https://github.com/AGX-Software/board/issues/7426). Na sexta finalizou os testes principais e hoje está finalizando os testes de borda
- Hoje pretende focar nos testes e, caso finalize a tempo, voltar ao [Tesseract](https://github.com/AGX-Software/board/issues/7143)

**gueff**
- Ficou desenvolvendo o card [Importação de Leads para o Seller](https://github.com/AGX-Software/board/issues/7477) a maior parte do dia, até que houve uma reprova do [Presentation PDF](https://github.com/AGX-Software/board/issues/7384). Com ajuda do _Vieira_, fez a correção necessária para resolver a reprova
- Hoje pretende acompanhar os testes do suporte nos seus cards e continuar o card [Limitar visualização de propostas no Master adicional](https://github.com/AGX-Software/board/issues/7427) com base no tipo de link

**rob**
- De manhã trabalhou em um **Ticket** [ConeXia](https://github.com/AGX-Software/board/issues/7482), onde havia um comportamento que, de acordo com eles, estava incorreto, porém, analisando melhor, era o comportamento esperado. Depois voltou ao **SaaS** e avançou bastante no back, junto com a integração do front
- Hoje pretende fazer os ajustes finos do [SaaS](https://github.com/AGX-Software/board/issues/7417) e, depois, focar na criação dos domínios do master

**vieira**
- Começou o dia fazendo uma correção no **SaaS** que o _Rob_ percebeu e seguiu a maior parte do dia no desenvolvimento do **SaaS**. No meio do tempo surgiram alguns tickets e outras correções
- Hoje a prioridade segue no **SaaS**
```

### Example (published board — 30/06)

```markdown
*30/06/2026*
**adriano**
- Terminou de revisar algumas coisas na nova configuração do `master` para o [Bloqueio de usuário por inatividade](https://github.com/AGX-Software/board/issues/7426). Ao final do dia abriu os PRs e recebeu RCs do _Vieira_ no PR do front
- Hoje pretende acompanhar a revisão, fazer as RCs e subir os PRs e, quando terminar, voltar ao [Tesseract](https://github.com/AGX-Software/board/issues/7143)

**gueff**
- Trabalhou no card [Limitar visualização de propostas no Master adicional](https://github.com/AGX-Software/board/issues/7427) com base no tipo de link. Em paralelo, a _Samira_ conversou para auxílio nos testes de um card
- Hoje pretende continuar com o mesmo card, fazendo os testes finais e, quando finalizar, iniciar o card do [Agenda no FollowUp](https://github.com/AGX-Software/board/issues/7484) após o almoço

**rob**
- Continuou no desenvolvimento do **SaaS**, avançou bastante e analisou a configuração de domínios nos ajustes finais.
- De manhã corrigiu um **Ticket** da **ConeXia** na criação de propostas. Hoje pretende revisar alguns PRs e depois seguir com o [SaaS](https://github.com/AGX-Software/board/issues/7417)

**vieira**
- Recebeu a nova atribuição do **Agenda no FollowUp** do _Gueff_. Depois seguiu com o **SaaS**, onde fizeram testes e correções. Ao final do dia revisou o PR do _Adriano_.
- De manhã começou alterações na LP, identificando que a V1 do _Carlos_ estava desatualizada com a especificação atual e pretende seguir com o **SaaS**
```

### Example (published board — 02/07)

```markdown
*02/07/2026*
**adriano**
- Terminou pontos do [Tesseract](https://github.com/AGX-Software/board/issues/7143) ao longo do dia e, em paralelo, acompanhou os testes do suporte do [Bloqueio de usuário por inatividade](https://github.com/AGX-Software/board/issues/7426)
- Hoje está preparando os PRs para `produção` do card **Bloqueio de usuário por inatividade** e pretende continuar com os testes do **Tesseract**

**fernanda**
- De manhã se atualizou nos cards do board e nas notificações pelo período de férias. Depois revisou a wiki do [CRUD Status Table](https://github.com/AGX-Software/board/issues/6248) que o _Vieira_ fez e adicionou melhorias. Depois ingressou no card [Agenda no FollowUp](https://github.com/AGX-Software/board/issues/7484) junto ao _Gueff_
- Hoje pretende continuar com o mesmo card

**gueff**
- Ficou o dia inteiro na tarefa do **Agenda no FollowUp**, com vários problemas na implementação. Mais tarde foi definido que a especificação foi alterada devido à inviabilidade do desenvolvimento
- Hoje pretende continuar com o mesmo card e, após finalizar, verificar as RCs do [Importação de Leads para o Seller](https://github.com/AGX-Software/board/issues/7477) para `produção`

**rob**
- De manhã atualizou propostas de um ticket em `produção`. Em seguida voltou ao **SaaS**, realizou testes de desenvolvimento e integração e passou aos ajustes finais de código. À tarde teve que acompanhar o _Jander_ no deploy da **Crefaz**
- Hoje de manhã continuou ajudando o _Jander_. Pretende desenvolver o novo card [Cartão PINE](https://github.com/AGX-Software/board/issues/7497), quando finalizado, voltar ao **SaaS**

**vieira**
- Começou o dia verificando a exportação de relatórios que ocorrem mensalmente. Depois seguiu com o **SaaS**. Após o almoço, com os testes necessários já feitos, começou a revisar o código. No meio do caminho conversou com o _Gueff_ e a _Fernanda_ sobre o card **Agenda no FollowUp**
- Hoje pretende focar na _review_ de código do **SaaS**
```

### Example (published board — 03/07)

```markdown
*03/07/2026*
**adriano**
- Ficou refazendo as RCs do PR de `produção` do [Bloqueio de usuário por inatividade](https://github.com/AGX-Software/board/issues/7426). Depois voltou ao [Tesseract](https://github.com/AGX-Software/board/issues/7143), testou a implementação como um todo e ficou nisso até o final do dia. Também avaliou práticas de segurança do sistema
- Hoje pretende fazer mais testes no card **Bloqueio de usuário por inatividade**. Depois continuar com os testes e melhorias de segurança do **Tesseract**

**gueff**
- Continuou o desenvolvimento do [Agenda no FollowUp](https://github.com/AGX-Software/board/issues/7484) e passou o dia nesse card. À tarde subiram para `HML`, porém ao final do dia surgiu uma nova especificação do mesmo card. Ao final do dia conversou com o _André_ sobre a feature de **Reunião Gravação**. Também analisou alguns problemas de tradução, que a Samira reportou
- Hoje pretende continuar e finalizar essa especificação adicional do **Agenda no FollowUp**. Caso sobre tempo, irá verificar alguns outros cards que estão em _Teste Dev_

**rob**
- De manhã acompanhou o _Jander_ no deploy do produto da **Crefaz** para `produção`. Em paralelo trabalhou no card [Cartão PINE](https://github.com/AGX-Software/board/issues/7497) e subiu para `HML`. Também revisou o código do **SaaS** e fez algumas alterações
- Hoje pretende continuar na _review_ e melhorias do **SaaS** e, após finalizado, testar o fluxo completo novamente. Ainda irá revisar alguns pontos com o _Jander_ da **Crefaz**

**vieira**
- Começou o dia seguindo com a _review_ de código do **SaaS** e ficou nisso praticamente o dia inteiro, revisando os 2 PRs do front, fazendo correções, alterações e melhorias. Parou alguns momentos para falar com o _Gueff_ e a _Fernanda_ sobre o card **Agenda no FollowUp**. No meio do dia fez um teste rápido em um bot do Discord que havia comentado com o _Zarco_
- Hoje pretende seguir com as revisões do **SaaS** e melhorias
```

### Example (published board — 08/07)

```markdown
*08/07/2026*
**adriano**
- Revisou a documentação do relatório do [Tesseract](https://github.com/AGX-Software/board/issues/7143). Enquanto a reunião não foi iniciada, começou a análise da API para encontrar dúvidas e problemas antes de iniciar o card. Depois iniciou a reunião, onde revisaram o documento para corrigir problemas e dúvidas
- Hoje pretende seguir com os débitos do **Tesseract** e iniciar o desenvolvimento da [BEVI Produção API](https://github.com/AGX-Software/board/issues/7506)

**gueff**
- Trabalhou no card [Limitar visualização de propostas](https://github.com/AGX-Software/board/issues/7427), aplicou ajustes solicitados pelo _Rob_ e fez otimizações que encontrou. Em paralelo corrigiu pontos das traduções, testou o card [Adicionar CNPJ na Loja por API](https://github.com/AGX-Software/board/issues/7394) e respondeu dúvidas da _Samira_ sobre o [Agenda no FollowUp](https://github.com/AGX-Software/board/issues/7484)
- Hoje pretende continuar as correções do card **Limitar visualização de propostas**, já que o _Rob_ identificou mais pontos, e aguardar os testes das outras tarefas que estão com o suporte

**rob**
- Verificou um problema no `core-jobs`, onde a máquina reinicia muitas vezes por causa do watcher, e fez um **Ticket** de atualizar duas propostas diretamente no banco de dados. De manhã realizou alguns PRs e focou no **SaaS**, configurando os ambientes de homologação do core, ainda faltam alguns ajustes
- Hoje de manhã está revendo alguns PRs e pretende continuar focado na configuração do **SaaS**

**vieira**
- Finalizou a revisão do PR mais crítico do **SaaS**. Começou o dia analisando o relatório do _Adriano_ e fazendo apontamentos. Depois surgiu um **Ticket** e analisou para corrigir. Depois do almoço continuou com a revisão e melhoria do **SaaS** e, ao final do dia, participou da reunião do [Tesseract](https://github.com/AGX-Software/board/issues/7143)
- Hoje pretende seguir com a revisão e melhoria do **SaaS** no outro PR
```

### Example (published board — 13/07)

```markdown
*13/07/2026*
**adriano**
- Começou o card [BEVI Produção API](https://github.com/AGX-Software/board/issues/7506). De manhã desenvolveu uma lógica para investigar a data mais antiga recebida. Resolvido isso, analisou o tempo da consulta, que em abordagem linear poderia levar de 94 a 100 horas, e investigou a paralelização para reduzir o tempo. Chegou a um bom padrão, mas passou a tomar muito timeout
- Hoje pretende investigar os documentos adquiridos até o momento e, depois, voltar a buscar a maneira mais eficiente de extrair esses dados

**gueff**
- Começou no card [Limitar visualização de propostas](https://github.com/AGX-Software/board/issues/7427), faltando uma RC para finalizar. Em paralelo, fez correções de traduções no `indiky-server` e no `uxvision-web`
- Hoje está aguardando os testes e está livre para novas atribuições

**rob**
- Começou em dois **Tickets**: [Expiração de Status não Funcionando](https://github.com/AGX-Software/board/issues/7524), e o segundo, [NIO Reprovar proposta em status excluido](https://github.com/AGX-Software/board/issues/7515). Depois voltou ao **SaaS**, focando em entender como será a segunda parte, e conversou com o _Vieira_ para centralizar as dúvidas. Também fez testes do fluxo do **SaaS** e corrigiu alguns pontos
- Hoje pretende analisar como começar o desenvolvimento e seguir com a parte 2

**vieira**
- Começou o dia seguindo com a configuração do CI para deploy na Vercel. Depois, junto ao _Rob_, criaram a LP em `HML`. Em seguida analisaram um fluxo e anotaram novas dúvidas sobre o **SaaS**. Depois fez testes e alterações na LP e no UXvision, que foram necessárias para a abertura dos PRs. Ao final do dia seguiu com o desenvolvimento do pacote de instalação para deploy na Vercel
- Hoje pretende seguir com o CI de deploy na Vercel, aguardar a _review_ dos PRs do **SaaS** e verificar as próximas atribuições
```

### Example (published board — 20/07)

```markdown
*20/07/2026*
**adriano**
- Ficou terminando de corrigir os headers do [Tesseract](https://github.com/AGX-Software/board/issues/7143), que estavam com nota baixa. Depois conseguiu deixar rodando e testou a rotina de coleta de dados da API da **BEVI** em `HML` do card [BEVI Produção API](https://github.com/AGX-Software/board/issues/7506), tanto o backfill quanto o diário
- Hoje pretende seguir com a adição da leitura dos dados Bevi em `produção` na consulta do **Tesseract**

> Ausente nas últimas semanas devido a procedimento médico
**fernanda**
- Hoje pretende analisar e testar o [CRUD de Status Table](https://github.com/AGX-Software/board/issues/6248) e verificar suas próximas atribuições

**gueff**
- Começou o dia abrindo os PRs do [Pdf na emissão de NF](https://github.com/AGX-Software/board/issues/7410) e do [Limitar visualização de propostas](https://github.com/AGX-Software/board/issues/7427). Ao final do dia surgiu um **Ticket** [Importação de IA ConeXia](https://github.com/AGX-Software/board/issues/7566).
- Hoje está finalizando a abertura dos PRs do Ticket e, assim que finalizado, irá verificar as pendências das outras tarefas e seguir com os desenvolvimentos

**rob**
- Trabalhou no card [SDC](https://github.com/AGX-Software/board/issues/7556). Depois de finalizado voltou ao card [Carta Contemplada](https://github.com/AGX-Software/board/issues/7554). Também estava revisando os PRs de ([Atualizar produto Consórcio](https://github.com/AGX-Software/board/issues/7553)).
- Hoje de manhã fez os testes do **SDC** e passou para o suporte testar e pretende seguir com o **Carta Contemplada**

**vieira**
- Seguiu com **Atualizar produto Consórcio**, subiu os PRs para `HML`, testou o fluxo, fechou o card e começou a revisar PRs pendentes relacionados à **BEVI**. Em paralelo, fez o card [Input de valor da Simulação do Consórcio](https://github.com/AGX-Software/board/issues/7552)
- Hoje pretende seguir com o card **Carta Contemplada** e revisar alguns PRs pendentes
```

### Example (published board — 21/07) — ≤2000 chars with fernanda

```markdown
*21/07/2026*
**adriano**
- Avaliou a rotina da **BEVI** em `HML` do [BEVI Produção API](https://github.com/AGX-Software/board/issues/7506) e enriqueceu a resposta do [Tesseract](https://github.com/AGX-Software/board/issues/7143) com dados da **BEVI**. Conversou com o _Vieira_ e o _Zarco_ sobre os próximos passos do **Tesseract** em `produção`. Resolveu também um problema no fluxo de recuperação de senha
- Hoje pretende aguardar os próximos passos do **Tesseract** e verificar prioridades

**fernanda**
- De manhã se atualizou no board e recebeu o [CRUD de Status Table](https://github.com/AGX-Software/board/issues/6248) para revisar e testar. Encontrou problemas no back, reabriu os PRs e ficou nisso o resto do dia. Em paralelo revisou um PR do **SaaS**
- Hoje pretende finalizar a abertura dos PRs e verificar prioridades

**gueff**
- De manhã resolveu o **Ticket** [Importação de IA ConeXia](https://github.com/AGX-Software/board/issues/7566) e passou para o suporte. Em paralelo ajudou a _Fernanda_ no **CRUD de Status Table**. Atualizou as branches de `produção` do [Limitar visualização de propostas](https://github.com/AGX-Software/board/issues/7427)
- Hoje pretende terminar esses PRs de `produção` e seguir com [Reverter status da proposta](https://github.com/AGX-Software/board/issues/7100)

**rob**
- De manhã fez o deploy para `HML` do [SDC](https://github.com/AGX-Software/board/issues/7556), com reprova por erro de configuração. Depois fez uma gravação e voltou ao [Carta Contemplada](https://github.com/AGX-Software/board/issues/7554)
- Hoje pretende seguir com o mesmo card e abrir os PRs

**vieira**
- Revisou um PR grande do _João Carlos_. De manhã conversou com a _Fernanda_ sobre o **CRUD de Status Table**. Depois entrou no **Carta Contemplada** com o _Rob_ e finalizou o front
- Hoje de manhã está no **Ticket** [Diferença entre valores dash master x agx](https://github.com/AGX-Software/board/issues/7579). À tarde tem gravação, foco nos testes do **Carta Contemplada**
```

### Example (published board — 23/07)

```markdown
*23/07/2026*
**adriano**
- Ficou a maior parte do dia mapeando as regras do [Whodoes](https://github.com/AGX-Software/board/issues/7355). Também ajudou o suporte a entender a tarefa da [BEVI Produção API](https://github.com/AGX-Software/board/issues/7506) e algumas partes específicas do [Tesseract](https://github.com/AGX-Software/board/issues/7143) como um todo. Ao final do dia fez algumas revisões de PRs
- Hoje pretende seguir com o mapeamento das regras do **Whodoes** e, em paralelo, os desenvolvimentos pós-deploy do **Tesseract**

**fernanda**
- Finalizou o fix de ordenação e paginação dos disparos do omnichannel no [Programação de disparos](https://github.com/AGX-Software/board/issues/7583). Ao longo do dia também revisou alguns PRs. Ao final do dia pegou o fix [Slug de Campanha](https://github.com/AGX-Software/board/issues/7486) da **Rodobens**, que não permitia cadastrar com traços
- Hoje pretende seguir com o mesmo card

**gueff**
- Terminou de abrir os PRs para `main` do [Reverter status da proposta](https://github.com/AGX-Software/board/issues/7100) e ficou focado nessa tarefa, nos testes e na correção de conflitos
- Hoje pretende acompanhar as revisões e está liberado para novas atribuições

**vieira**
- Começou o dia com a Reunião dos Líderes com o _Zarco_. Depois seguiu com as revisões que estavam pendentes. No meio das revisões surgiu o **Ticket** [Propostas não exibindo no filtro por status](https://github.com/AGX-Software/board/issues/7587) do master **Sany**. Depois da correção continuou com mais algumas revisões. Depois teve a reunião geral com o _Ale_. Em seguida um dos tickets foi reprovado e analisou o motivo. Depois teve a reunião com o _Zarco_ dos líderes sobre a reorganização das equipes. No restante do dia acompanhou os testes dos cards e revisou PRs
- Hoje continuou com o restante das revisões e, sem prioridades, pretende seguir com a revisão e edição das gravações pendentes
```

### Example (published board — 29/07)

```markdown
*29/07/2026*
**adriano**
- Pegou as coleções consumidas no [Tesseract](https://github.com/AGX-Software/board/issues/7143) e adicionou via meta programação, removendo hardcoded. Ao final do dia ajudou o _Hugo_ e o _Cardoso_ e respondeu dúvida da _Samira_
- Hoje pretende seguir com [View Bevi Producao](https://github.com/AGX-Software/board/issues/7619) e retomar a especificação do [Whodoes](https://github.com/AGX-Software/board/issues/7355)

**cardoso**
- Ficou focado no [Auto-pareamento das branches de produção](https://github.com/AGX-Software/board/issues/7287), finalizou distribuidor e job diário e migrou o projeto pro `watcher-server`, com problemas na migração
- Hoje pretende implementar o sistema de notificações do Discord

**fernanda**
- Se reuniu com o _Gueff_ no inter-equipes no [Filtrar MetaProduto e Banco](https://github.com/AGX-Software/board/issues/7612), passou pro suporte e iniciou a [Análise de cards órfãos](https://github.com/AGX-Software/board/issues/7617)
- Hoje pretende continuar a **Análise de cards órfãos** e ver as próximas prioridades

**hugo**
- Suporte comentou problema no **Sub-Corp** no filtro de propostas vigentes, onde corrigiu e abriu PR. Montou queries no MongoDB para análise do Sub-Corp e revisou PR do **TesseractX**.
- Hoje pretende acompanhar as revisões dos PRs do **Sub-Corp**

**vieira**
- Criou [Analisar metaProductBankId inexistente](https://github.com/AGX-Software/board/issues/7609), migrou cards da **Fênix** pra **Órion**, explicou **Consórcio** e fez wiki de onboarding pro _Vini_, e criou **Análise de cards órfãos**.
- Hoje pretende focar no card **Analisar metaProductBankId inexistente**

**vini**
- Continua no [Envio Retroativo ONBASE](https://github.com/AGX-Software/board/issues/7337), falta menos de 1%. Diminuirá o **Auto-pareamento das branches** pelo foco na **BEVI**. Fez mini ajuste de comissão Corp e Loja pra **BEVI**
- Hoje pretende testar o fluxo da **BEVI** em paralelo com o **Auto-pareamento das branches**
```

### Example (published board — 31/07)

```markdown
*31/07/2026*
**adriano**
- Terminou [View Bevi Producao](https://github.com/AGX-Software/board/issues/7619), subiu para `produção` e adicionou a VIEW semanal. Ao apresentar o [Tesseract](https://github.com/AGX-Software/board/issues/7143) ao suporte, encontrou bug na criação de escopos e ficou nisso o restante do dia
- Hoje pretende corrigir a criação de escopos do **Tesseract** e, se sobrar tempo, retomar o [Whodoes](https://github.com/AGX-Software/board/issues/7355)

**cardoso**
- Finalizou a documentação do [Auto-pareamento das branches de produção](https://github.com/AGX-Software/board/issues/7287), adicionou o código no `agx`, adaptou o mock-server e ajudou o _Hugo_ no card de variáveis de Postback
- Hoje pretende, após a API, fazer os testes do desenvolvedor e ver próximas atribuições

**fernanda**
- De manhã fez os testes do [Botão Flutuante AGX](https://github.com/AGX-Software/board/issues/7621). Depois atualizou cards, corrigiu o card [Lembrar PWA](https://github.com/AGX-Software/board/issues/143)
- Hoje pretende seguir junto ao _Gueff_ na análise da reprova do [Filtrar MetaProduto e Banco](https://github.com/AGX-Software/board/issues/7612)

**hugo**
- Abriu o PR de [Adicionar variáveis de Postback](https://github.com/AGX-Software/board/issues/7602), recebeu RC do _Vini_ e, com ele, achou diferença entre branches de prod que geravam o erro
- Hoje pretende solicitar nova revisão do _Vini_, testar e ver próximas prioridades

**vieira**
- Seguiu com as [Customizações da TORQ](https://github.com/AGX-Software/board/issues/7620), ajudou no **Filtrar MetaProduto e Banco**, acompanhou a **View Bevi Producao**, e fechou o dia nos testes finais da **TORQ**
- Hoje pretende finalizar a **TORQ** e abrir os PRs

**vini**
- Voltou à [Customização de Comissão](https://github.com/AGX-Software/board/issues/7614) , pois a especificação havia sido interpretada de forma diferente do solicitado
- Hoje pretende focar em corrigir o problema e atualizar as branches produtivas
```

More examples (11/06–22/06): see history in `daily-standup-patterns.md` or AGX board.
