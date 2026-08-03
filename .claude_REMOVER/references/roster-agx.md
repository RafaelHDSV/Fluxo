# Roster AGX — devs, logins e apelidos

Fonte única de identidade para as skills do hub. Resolve **apelido → login GitHub**, que é a chave de `.perfils/<login>.md`.

Vive no hub (e portanto viaja via `vieira ai push`) porque `.perfils/` é cache local por máquina: outra máquina precisa saber quem é quem antes de reconstruir os perfis.

Substitui três fontes que divergiam entre si:

| Fonte antiga | Problema |
|---|---|
| `serveruler-client/public/usernames.json` | 13 entradas, repo pessoal fora do hub, sem `adriano` nem `romulo` |
| aliases embutidos em `new-task/SKILL.md` | só 4 apelidos |
| lista de nomes em `triagem-tickets/SKILL.md` | desatualizada, misturava apelido e login |

## Devs do time (15)

Logins e nomes conferidos em `gh api orgs/AGX-Software/members` em 31/07/2026. Áreas principais vêm do bootstrap de 365 dias (`.perfils/`) e servem de mapa rápido — o dado detalhado está no perfil.

| Apelidos | Login | Nome | Áreas principais (365d) |
|---|---|---|---|
| adriano | `abertanha` | Adriano Bertanha | Pine, seguro, signin, bevi-sync |
| ana | `anamrcnds` | Ana Marcondes | **Crefaz**, Pine, CRCP, CPF |
| davi | `DaviSanttos` | Davi Santos | **WhatsApp**, NIO, INSS, autocontratação |
| fernanda | `mfernandanll` | Fernanda Loureiro | Consórcio, lojas, importação, autocontratação |
| gueff | `MathGueff` | Matheus Augusto Santos Gueff | **i18n**, NIO, Indiky, chat |
| cardoso, gustavo | `cardosoGu` | Gustavo Cardoso | CNPJ alfanumérico, corporação, CustomAxios |
| hugo | `meirelleshugo` | Hugo Meirelles | Corporação Sub, CNPJ |
| janderson, jander | `JandersonSR` | Janderson | **Crefaz**, Pine, CLT, OCR, Dataprev |
| marcus | `marcuslaraa` | Marcus Vinícius Lara | **BHS**, NIO, Pine, Dataprev, OCR |
| nicolas | `Nicolaskn95` | Nicolas Nagano | BHS, permissão, omnichannel, selfcontract |
| romulo | `RomuuloGoncalves` | Rômulo Gonçalves | NIO, assinatura, UnicoSign, CLT |
| thales | `thalesmanoel` | Thales Manoel | **NIO**, BankTools, selfcontract, RPA, EGI |
| vieira | `RafaelHDSV` | Rafael Vieira | Conexia, consórcio, Dataprev, refin |
| vinicius, vini | `ViniciusRibeiro6` | Vinicius Ribeiro | Digital Ocean, Serasa, Pine, OCR |
| zarco | `felipezarco` | Luiz Felipe Zarco | Release / port entre branches (68% dos PRs) |

## Não são devs do time

A org tem 32 membros. Os 17 abaixo **não** entram em recomendação de card nem de triagem:

- **Contas de serviço:** `agxcapacitacao`, `agxdevelopers`
- **Fora do time de desenvolvimento nesta janela:** `alexandreconstantino`, `Cizoto`, `eliaberr`, `fellipemachado`, `lukasilverio94`, `MatheusLBDev`, `matzaldev`, `Mayarasb`, `ogati25`, `Otavio-C-Oliveira`, `pabloh25`, `Pedro-Sardela`, `samira1406`, `ThiagoAGJ`, `tobiasperassi`

## Autor fora do roster

Arqueologia de git em código antigo vai apontar autores que não estão aqui — ex-membros como `rob`, ou membros da lista acima. Nesse caso:

1. **Não** recomendar a pessoa como responsável principal.
2. Dizer que não é do time atual.
3. Sugerir sucessor por volume no mesmo repo/feature, usando `.perfils/`.

É o mesmo caminho de quem tem perfil com `status: inativo`, com uma diferença: ali existe histórico para citar; aqui não existe perfil nenhum.

## Manutenção

- Entrou ou saiu alguém: editar a tabela aqui e rodar `vieira ai build`.
- Confirmar login novo com `gh api orgs/AGX-Software/members` (read-only) antes de gravar — apelido de daily não é login.
- Áreas principais desatualizam: são um retrato do bootstrap. A fonte viva é `.perfils/<login>.md`, atualizada a cada 30 dias.

## Consumidores

| Skill | Uso |
|---|---|
| `new-task` | resolve `<dev>` → login; `refresh-profile --all` itera este roster |
| `triagem-tickets` | valida se o autor é do time atual; lê `.perfils/` do candidato |
