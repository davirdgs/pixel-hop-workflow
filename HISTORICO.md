# Histórico de decisões e proveniência

Registro cronológico das decisões de projeto deste framework: **o que mudou, por que mudou e onde a mudança pode ser verificada no repositório**.

## Por que este arquivo existe

Este repositório é objeto de um estudo de caso acadêmico cuja análise documental reconstrói a trajetória de decisões do framework. Como a publicação pode não preservar o histórico Git original, este documento consolida essa trajetória em forma auditável e independente do log de commits.

Três registros coexistem, com funções distintas:

| Registro | Responde a | Formato |
|---|---|---|
| `CHANGELOG.md` | **o que** mudou em cada versão | lista técnica por versão, em inglês |
| `HISTORICO.md` (este) | **por que** mudou e **onde verificar** | motivação, decisão, mecanismos e arquivos |
| `docs/desenvolvimento-pixel-hop-framework.md` | como a trajetória se interpreta como um todo | relato técnico analítico |

Cada entrada abaixo é ancorada em evidência verificável no próprio repositório: os arquivos citados existem e podem ser lidos; as versões correspondem ao campo `version` de `package.json` no momento de cada entrega.

---

## Registro por versão

### 2.0.0 — Lifecycle canônico, independente de agente
**Entrega 2 · 2026-07-14**

**Problema.** O SDD existia como prática operacional, não como contrato. Cada ferramenta passava a operar segundo sua própria versão do processo; aprovações perdiam validade silenciosamente quando o conteúdo mudava; o estado de uma especificação podia ser afirmado sem evidência que o sustentasse.

**Decisão.** Estabelecer uma fonte de verdade canônica e neutra em relação ao agente, com os comandos do Claude e do Codex reduzidos a adaptadores finos que referenciam — em vez de reimplementar — a semântica do processo.

**Mecanismos introduzidos.** Lifecycle explícito de artefatos e execução; IDs em formato EARS com rastreabilidade até as tarefas; aprovações vinculadas a hash do conteúdo; estratégias de verificação e evidência durável; reivindicação atômica de escopo para trabalho paralelo; schemas, lint e verificação de distribuição; instalador não destrutivo com regras de compatibilidade que preservam especificações existentes.

**Onde verificar.** `.sdd/settings/lifecycle.md` · `.sdd/settings/schemas/spec.schema.json` · `.sdd/settings/rules/ears-format.md` · `.sdd/tools/sdd.mjs` · `scripts/install.mjs` · `scripts/verify-distribution.mjs`

---

### 2.1.0 — Descoberta de produto antes do SDD
**Entrega 3 · 2026-07-14**

**Problema.** Motivação econômica: especificar e implementar corretamente uma ideia pouco promissora continua sendo desperdício. O framework governava a construção, mas não a decisão de investir.

**Decisão.** Introduzir um lifecycle de descoberta anterior ao SDD, separado das especificações e com decisão explícita ao final. Apenas um `GO` explícito torna uma ideia elegível à promoção para `spec-init`.

**Mecanismos introduzidos.** Os cinco fluxos — brainstorm interativo, validação de mercado atual, viabilidade de negócio, esboço de produto e decisão `GO`/`PIVOT`/`STOP`; registro append-only de fontes de pesquisa com direção da evidência (`supports`, `contradicts`, `constrains`, `context`); contratos transparentes de custo, contribuição, break-even, payback, ROI e custo de oportunidade; perfil `single-mobile-indie` como restrição produtiva do método.

**Onde verificar.** `.sdd/settings/workflows/discovery-{brainstorm,validate,business,product,decide,status}.md` · `.sdd/settings/rules/product-discovery.md` · `.sdd/settings/rules/research-sources.md` · `.sdd/settings/schemas/{discovery,research-source}.schema.json`

---

### 2.2.0 — Orquestração auto-SDD com uma única fronteira manual
**Entrega 4 · 2026-07-15**

**Problema.** Aprovações repetidas ao longo de requisitos, design e tarefas geravam custo de interação alto sem ganho proporcional de controle.

**Decisão.** Permitir a delegação dessas aprovações após validação e correção automáticas, preservando **uma** barreira manual antes da implementação. A fronteira expressa um princípio: automação de planejamento não equivale a autoridade para modificar código ou sistemas externos.

**Mecanismos introduzidos.** Estado durável `auto-sdd.json` com ondas de execução; planejamento sensível a dependências; gate único de implementação vinculado à revisão da especificação e aos hashes de requisitos, design, tarefas e plano de ondas; subagentes executores isolados e validadores independentes por onda; escrita no ledger restrita ao coordenador.

**Onde verificar.** `.sdd/settings/workflows/auto-sdd.md` · `.sdd/settings/rules/auto-sdd.md` · `.sdd/settings/schemas/auto-sdd.schema.json`

---

### 2.3.0 — Lifecycle de release após o SDD
**Entrega 4 · 2026-07-15**

**Problema.** Software validado não é sinônimo de produto pronto para publicação. O método terminava na validação técnica e deixava sem governança a preparação, o lançamento e o aprendizado posterior.

**Decisão.** Criar um lifecycle pós-SDD próprio, com barreiras separadas para publicação e para mídia paga — reconhecendo que são decisões de natureza e risco distintos.

**Mecanismos introduzidos.** Readiness operacional; metadados e criativos de loja; analytics e atribuição; rollout escalonado, observação e crescimento iterativo; gate de publicação vinculado a hash; gate explícito e separado de canal, orçamento e datas para mídia paga; contratos de pesquisa e evidência append-only.

**Onde verificar.** `.sdd/settings/workflows/release-*.md` · `.sdd/settings/rules/release-principles.md` · `.sdd/settings/schemas/release.schema.json`

---

### 2.4.0 e 2.4.1 — Política de loja como restrição de design
**Entregas 5 e 6 · 2026-07-16 e 2026-07-17**

**Problema.** Risco de rejeição nas lojas aparecia tarde, quando o produto já estava definido. Além disso, uma pontuação média podia esconder um bloqueio crítico em uma das plataformas.

**Decisão.** Antecipar a avaliação de política para a descoberta, tratando-a como restrição de design; pontuar Apple e Google de forma independente; adotar a menor pontuação entre as plataformas-alvo como pontuação cruzada; e fazer com que qualquer flag crítica não resolvida bloqueie o `GO` independentemente da média.

**Mecanismos introduzidos.** Pontuações separadas por plataforma com artefato validado por máquina; separação entre duplicação de submissão (Apple 4.3(a)) e substituibilidade de mercado (4.3(b)), esta avaliada apenas para alvos Apple; regras próprias do Google Play; princípios compartilhados de originalidade, profundidade funcional, qualidade, apresentação honesta e operação sustentável. A revisão 2.4.1 refinou a análise antispam da Apple com orientação vigente e múltiplos relatos de desenvolvedores, mantendo a experiência anedótica explicitamente como não-autoritativa.

**Onde verificar.** `.sdd/settings/rules/store-design-readiness.md` · `.sdd/settings/rules/design-principles.md` · `.sdd/settings/schemas/store-design-score.schema.json`

---

### 2.5.0 — Seleção de modelo por capacidade, custo e risco
**Entrega 6 · 2026-07-17**

**Problema.** Duas formas opostas de desperdício: usar modelos caros em trabalho rotineiro e usar modelos insuficientes em trabalho crítico. A herança implícita do modelo do coordenador também ocultava qual capacidade de fato executou ou validou cada tarefa.

**Decisão.** Exigir seleção explícita e persistida de modelo para cada executor, validador de onda, corretor e validador final, adotando o **menor modelo adequado** como regra e escalando para modelos de fronteira em trabalho de alto risco e na validação final. Quando nenhum modelo adequado está configurado, a execução é bloqueada em vez de degradar silenciosamente.

**Mecanismos introduzidos.** Catálogos por provedor; requisitos de capacidade persistidos; snapshots do catálogo em tempo de execução; atribuições concretas com custo e justificativa de seleção; salvaguardas de override e allowlist.

**Onde verificar.** `.sdd/config.example.json` (bloco `auto_sdd.model_selection`) · `.sdd/settings/schemas/auto-sdd.schema.json`

---

### 2.6.0 — Encerramento administrativo distinto de conclusão técnica
**Entrega 7 · 2026-07-18**

**Problema.** Forçar uma especificação obsoleta, substituída, cancelada ou duplicada através do pipeline de validação produziria trabalho sem valor e poderia falsificar seu estado histórico.

**Decisão.** Criar um caminho terminal determinístico (`spec-close`) que encerra sem afirmar sucesso, preservando integralmente o estado histórico de artefatos, implementação, validação e evidência.

**Mecanismos introduzidos.** Roteamento da intenção de encerrar para fora do auto-SDD; proibição de subagentes, reconciliação de artefatos, reparo de cobertura, builds e validação de implementação durante o encerramento; revogação do gate de auto-SDD; segurança de claims; reporte de status; paridade entre adaptadores Claude e Codex.

**Onde verificar.** `.sdd/settings/workflows/spec-close.md`

---

### 2.7.0 — Validação adaptativa ao risco
**Entrega 8 · 2026-07-19**

**Problema.** Revisões redundantes elevavam custo sem elevar garantia. Uniformizar a profundidade de verificação significa rigor demais no trivial e de menos no crítico.

**Decisão.** Tornar a profundidade da validação proporcional ao risco persistido da entrega, sem enfraquecer a independência do revisor.

**Mecanismos introduzidos.** Perfis `lean`, `standard` e `critical` selecionados a partir do risco registrado; reutilização de revisão vinculada a hash; verificação direcionada por onda com uma passagem final de regressão; possibilidade de um validador independente de onda única satisfazer a validação final; capacidade do validador final derivada do perfil; estado de otimização verificável por máquina.

**Onde verificar.** `.sdd/config.example.json` (bloco `auto_sdd.validation_optimization`) · `.sdd/settings/workflows/validate-*.md`

---

### 2.8.0 — Instalação não destrutiva da orientação dos agentes
**Entrega 8 · 2026-07-19**

**Problema.** Atualizar a orientação do framework nos arquivos `AGENTS.md` e `CLAUDE.md` do projeto consumidor sobrescreveria instruções pertencentes ao projeto.

**Decisão.** Delimitar blocos gerenciados pelo framework, preservando integralmente o conteúdo fora deles, e falhar antes de qualquer mutação quando os marcadores estiverem malformados ou ambíguos.

**Mecanismos introduzidos.** Blocos gerenciados e delimitados, atualizados automaticamente; migração segura de seções canônicas legadas; validação de marcadores anterior à escrita.

**Onde verificar.** `AGENTS.md` · `CLAUDE.md` · `scripts/install.mjs` · `scripts/install.test.mjs`

---

### 2.9.0 — Retomada e recuperação determinísticas
**Entrega 9 · 2026-07-20**

**Problema.** Interrupções são parte normal de uma orquestração longa, mas retomar sem auditoria arrisca duplicar trabalho, abandonar alterações válidas ou reaproveitar validações obsoletas.

**Decisão.** Tratar a retomada como operação auditada, com fronteiras canônicas explícitas entre continuar, recuperar e replanejar a partir de estado obsoleto.

**Mecanismos introduzidos.** `--resume <feature>` com semântica canônica; preservação de diffs; abandono restrito a claims comprovadamente órfãos; incremento de tentativas; reinicialização de validadores obsoletos; proveniência de recuperação estruturada e append-only; exigência de reverificação com evidência produzida na tentativa atual.

**Onde verificar.** `.sdd/settings/workflows/auto-sdd.md` · `.sdd/settings/schemas/auto-sdd.schema.json` · `.sdd/tools/sdd.test.mjs`

---

### 2.10.0 — Overrides auditáveis, evidência proporcional e governança de contexto
**Entrega 10 · 2026-07-20**

**Problema.** Uma investigação transversal do fluxo, conduzida sob quatro perspectivas (Product/UX Design, arquitetura de software, Growth e custos), identificou uma lacuna central no pré-SDD: coerência documental não é evidência de desejabilidade — o fluxo podia recomendar `GO` sem evidência direta de usuário. As demais perspectivas apontaram contratos não integralmente garantidos pelo tooling, ausência de vínculo estrutural entre candidato, escopo e experimentos, e ausência de orçamento e telemetria observáveis.

**Decisão.** A distinção que organiza toda a versão: **o usuário pode assumir conscientemente uma decisão de negócio ou processo, mas essa autoridade não pode fabricar evidência técnica, disponibilidade em produção ou desempenho de mercado.** Overrides humanos passam a ser possíveis, registrados e incapazes de forjar evidência.

**Mecanismos introduzidos.** *Discovery:* problem framing; modos de evidência (`desk_only`, `primary`, `mixed`); ledger de hipóteses; validação de conceito e usabilidade proporcional ao risco; promotion brief estruturado; manutenção deliberada de `single-mobile-indie` como único perfil, com a variação alocada na modalidade de evidência e não na identidade do perfil. *SDD:* correção do parser do sufixo `(P)`; conclusão condicionada a evidência `passed`; revisão e invalidação determinísticas; status derivado em vez de escrito; recuperação de locks órfãos. *Release:* vínculo entre gate, candidato e escopo por digest; autorização completa de mídia paga; schemas de snapshot de métricas e de experimentos; roteamento do aprendizado de volta ao SDD ou à descoberta. *Governança:* manifestos de contexto; leitura delta-first; freshness de pesquisa; loops de correção limitados; budgets e telemetria de tokens.

**Onde verificar.** `.sdd/settings/schemas/{assumption,context-manifest,metrics-snapshot,experiment}.schema.json` · `.sdd/config.example.json` (blocos `context` e `auto_sdd.token_governance`) · `docs/avaliacao-fluxo-sdd-4-perspectivas.md` (a investigação que originou a versão)

---

## Linhas de evolução

Lidas em conjunto, as versões seguem três linhas contínuas — úteis para quem analisa a trajetória em vez de versões isoladas:

**Da construção para a decisão.** A 2.0.0 governava como construir uma especificação. A 2.1.0 passou a governar se a ideia merece ser especificada; a 2.3.0, o que acontece depois do lançamento. O escopo do método migrou progressivamente para fora da implementação — o mesmo movimento que o estudo de caso identifica no ciclo de desenvolvimento como um todo.

**Da regra documental ao enforcement.** Uma constatação recorrente é que a presença de uma regra no workflow não garante seu cumprimento: um sufixo não reconhecido pelo parser ou um estado escrito em vez de derivado é defeito de compatibilidade do processo, não detalhe de implementação. Daí a regra de evolução mais estrita adotada a partir da 2.10.0: lifecycle, workflow, template, schema, lint, ferramenta e adaptadores devem descrever a mesma semântica.

**Da supervisão uniforme à supervisão proporcional.** Da 2.5.0 (menor modelo adequado) à 2.7.0 (perfis de validação) e à 2.10.0 (leitura delta-first, budgets), a trajetória concentra esforço e custo onde há maior risco, preservando intactos os pontos de julgamento humano: os gates, a independência do validador e a exigência de evidência.
