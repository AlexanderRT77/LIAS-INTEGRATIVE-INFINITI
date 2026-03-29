# LIAS Dashboard - Plataforma Colaborativa de Análise de IAs

## Fase 1: Backend e Banco de Dados
- [ ] Criar tabelas: analyses, analysis_responses, team_members, permissions
- [ ] Implementar API de CRUD para análises
- [ ] Adicionar endpoints de importação em lote
- [ ] Criar sistema de validação de dados

## Fase 2: Frontend - Formulário e Entrada de Dados
- [ ] Criar componente AnalysisForm para inserir dados
- [ ] Implementar tabela editável com histórico
- [ ] Adicionar validação de campos (custo, tokens, tempo)
- [ ] Criar sistema de notificações

## Fase 3: Colaboração e Permissões
- [ ] Implementar sistema de membros da liga
- [ ] Adicionar controle de permissões (view, edit, delete)
- [ ] Criar auditoria de mudanças
- [ ] Implementar comentários e notas

## Fase 4: Importação de Dados
- [ ] Criar importador CSV/JSON
- [ ] Validar dados importados
- [ ] Mostrar preview antes de importar
- [ ] Implementar rollback em caso de erro

## Fase 5: Visualizações e Relatórios
- [ ] Atualizar gráficos Radar 3D com dados reais
- [ ] Criar gráficos de comparação de custo/tempo
- [ ] Implementar filtros por período e membro
- [ ] Gerar relatórios em PDF/Excel

## Fase 6: Testes e Deploy
- [ ] Escrever testes unitários
- [ ] Testar fluxo completo de análise
- [ ] Fazer checkpoint e deploy
- [ ] Documentar para usuários finais


## Fase 7: Sistema Analítico em Tempo Real (artificialanalysis.ai)
- [ ] Criar schema para cache de dados de IA
- [ ] Implementar API para buscar dados de artificialanalysis.ai
- [ ] Criar página "Análise em Tempo Real"
- [ ] Implementar gráficos comparativos (barras, linhas, scatter)
- [ ] Adicionar filtros por categoria
- [ ] Adicionar ordenação dinâmica
- [ ] Integrar ao dashboard principal

## Fase 8: Buscador Bibliográfico (NCBI + Supabase)
- [ ] Criar tabela cache_artigos no banco
- [ ] Implementar API NCBI com cache
- [ ] Criar página "Buscador Bibliográfico"
- [ ] Implementar UI Premium com cards translúcidos
- [ ] Adicionar links para PubMed
- [ ] Integrar ao dashboard principal
- [ ] Testes e validação

## Fase 9: Integração com LLM e Dashboard Personalizado
- [x] Criar schema para preferências de usuário e análises favoritas
- [x] Implementar API backend para LLM analysis
- [x] Criar página de Dashboard Personalizado
- [x] Implementar sistema de filtros salvos
- [x] Adicionar análises favoritas
- [x] Gerar resumos automáticos com LLM
- [x] Criar análises comparativas de IAs com LLM
- [x] Implementar geração de relatórios automáticos
- [x] Testar todas as funcionalidades (20/23 tests passing)
- [ ] Salvar checkpoint final


## Fase 10: Correção do Buscador Bibliográfico (PubMed)
- [x] Implementar API NCBI E-utilities (esearch + efetch)
- [x] Criar tRPC router para busca de artigos
- [x] Validar IDs e gerar links corretos do PubMed
- [x] Implementar cache de buscas
- [x] Testar com termos reais (Diabetes, Cancer, etc)
- [x] Atualizar Bibliography.tsx para usar API real
- [x] Corrigir erro de hooks (useQuery -> useMutation)
- [x] Testar no navegador - 10 artigos encontrados com sucesso
- [ ] Salvar checkpoint final


## Fase 11: Melhorias no Buscador Bibliográfico
- [x] Implementar paginação de resultados (10, 20, 50 por página)
- [x] Adicionar filtros avançados (data, journal, citações)
- [x] Implementar sistema de favoritos
- [x] Implementar histórico de buscas
- [x] Testar paginação com múltiplas páginas
- [x] Testar filtros com dados reais
- [x] Testar favoritos e histórico (backend pronto)
- [ ] Salvar checkpoint final


## Fase 12: Exportação de Resultados (CSV e PDF)
- [x] Criar módulo de exportação CSV
- [x] Criar módulo de exportação PDF
- [x] Adicionar endpoints tRPC para exportação
- [x] Integrar botões de download na UI
- [x] Testar exportação CSV (✓ Funcionando)
- [x] Testar exportação PDF (✓ Funcionando)
- [ ] Salvar checkpoint final


## Fase 13: Relatórios Agendados e Integração com Nuvem
- [x] Criar schema para relatórios agendados (scheduled_exports)
- [x] Implementar sistema de cron jobs para agendamento
- [x] Integrar autenticação OAuth Google Drive
- [x] Integrar autenticação OAuth OneDrive
- [x] Criar endpoints tRPC para upload em nuvem
- [ ] Implementar UI para configurar relatórios agendados
- [ ] Adicionar seleção de frequência (diária, semanal, mensal)
- [ ] Testar agendamento de relatórios
- [ ] Testar upload para Google Drive
- [ ] Testar upload para OneDrive
- [ ] Salvar checkpoint final


## Fase 14: UI para Configurar Relat\u00f3rios Age## Fase 14: UI para Configurar Relatórios Agendados
- [x] Criar página ScheduledReports.tsx com formulário
- [x] Implementar lista de relatórios agendados com ações (editar, deletar)
- [x] Adicionar gerenciamento de cloud storage (conectar/desconectar)
- [x] Integrar histórico de exportações
- [x] Testar formulário e agendamento (✓ Funcionando)
- [ ] Salvar checkpoint final


## Fase 15: Integração Real da Página Analytics
- [x] Criar backend tRPC router para buscar dados de análises
- [x] Implementar funções de banco de dados para analytics
- [ ] Integrar API artificialanalysis.ai (próxima fase)
- [x] Atualizar frontend Analytics.tsx com dados reais
- [ ] Testar integrações e validar dados
- [ ] Salvar checkpoint final


## Fase 16: Integração com artificialanalysis.ai
- [x] Criar módulo de integração com artificialanalysis.ai
- [x] Implementar cache de dados externos (24 horas)
- [x] Criar funções de comparação de performance
- [x] Adicionar endpoints tRPC para comparação (5 endpoints)
- [x] Atualizar UI Analytics com comparação lado a lado
- [x] Testar integração e validar dados (✓ Funcionando)
- [ ] Salvar checkpoint final


## Fase 17: UI para Relatórios Automáticos de Analytics
- [x] Criar schema para relatórios de Analytics
- [x] Implementar endpoints tRPC para CRUD de relatórios
- [x] Criar página AnalyticsReports.tsx com UI completa
- [x] Integrar formulário de configuração com filtros
- [x] Adicionar botão de navegação no Dashboard
- [x] Testar UI e agendamento
- [ ] Salvar checkpoint final
