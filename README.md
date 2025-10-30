# apppora
# Guia de Ajuda - Relatório Integrado v5.8.0

Bem-vindo ao Relatório Integrado! Este guia passo a passo irá ajudá-lo a entender e utilizar todas as funcionalidades do aplicativo, desde a configuração inicial até a análise dos relatórios.

## 1. Visão Geral do Aplicativo

O Relatório Integrado é uma ferramenta poderosa para gerenciar e analisar dados de distribuição e entrega de objetos. Ele permite:

-   Gerar relatórios detalhados sobre distritos, funcionários e listas.
-   Controlar prazos de entrega de objetos.
-   Realizar conferência física de objetos.
-   Acompanhar o itinerário de distribuição de carteiros, com alertas de tempo entre entregas.
-   Gerenciar a conferência física de objetos que precisam ser devolvidos.

## 2. Configuração Inicial: Carregando os Bancos de Dados

Para que o aplicativo funcione corretamente, você precisa carregar os bancos de dados necessários. Siga os passos:

1.  Clique no botão "**📊 Configurar Bancos de Dados**" (ou use o atalho `Ctrl+D`).
2.  Um modal será aberto com campos de texto para cada banco de dados.
3.  **Cole os dados** de cada banco no campo correspondente. Os dados devem ser separados por **tabulações** (`\t`).
    -   **📋 Banco de Dados de Lista e Funcionários**: Contém informações sobre distritos, funcionários e listas.
        -   *Formato esperado*: Distrito | Funcionário | ... | Lista
    -   **🏠 Banco de Dados de Objetos e Endereços**: Contém informações sobre objetos, suas listas e endereços.
        -   *Formato esperado*: Lista | Objeto | ... | Endereço
    -   **⏰ Banco de Dados de Prazos**: Contém o número do objeto e o prazo final de entrega.
        -   *Formato esperado*: Nº Objeto (coluna 1) | ... | Prazo Final (coluna 12) - Data no formato DD/MM/AAAA ou AAAA-MM-DD
    -   **🚚 Banco de Dados de Distribuição**: **NOVO!** Contém informações sobre a baixa dos objetos, horário e status.
        -   *Formato esperado*: Coluna 2 (Nº objeto) | Coluna 4 (Horário de baixa) | Coluna 8 (Status)
4.  Após colar os dados, clique em "**Salvar e Fechar**". O status de cada banco será exibido abaixo dos botões de controle.

## 3. Abas Principais do Aplicativo

O aplicativo é organizado em abas para facilitar a navegação. Você pode alternar entre elas clicando nos botões na parte superior ou usando os atalhos `Ctrl+←` e `Ctrl+→`.

### 3.1. 📊 Relatório Principal

Esta aba exibe um relatório consolidado dos dados carregados.

-   **Gerar Relatório**: Clique em "**📊 Gerar Relatório**" (`Ctrl+R`) após carregar os bancos de dados para popular a tabela.
-   **Filtros**: Utilize os campos de busca, grade e lado para refinar os resultados.
-   **Exportar**: Exporte os dados para Excel ou CSV, ou imprima o relatório.
-   **Pontos Coincidentes**: Encontre endereços que aparecem em diferentes grades.

### 3.2. ⏰ Controle de Prazos

Monitore o status dos prazos de entrega dos objetos.

-   **Gerar Relatório de Prazos**: Clique em "**⏰ Gerar Relatório de Prazos**".
-   **Filtro por Distrito**: Selecione um distrito para ver os prazos específicos.
-   **Status dos Prazos**:
    -   🔴 **Atrasado**: Prazo já vencido.
    -   🟡 **Vence Hoje**: Prazo vence no dia atual.
    -   🟢 **No Prazo**: Ainda dentro do prazo.

### 3.3. 📦 Conferência Física

Realize a conferência de objetos em posse do entregador.

-   **Seleção de Distrito**: Escolha o distrito para a conferência.
-   **Entrada de Objetos**: Digite ou escaneie o número do objeto no campo "Número do Objeto". O sistema validará o formato (`AB123456789BR`).
-   **Status de Conferência**:
    -   🟢 **Conferido**: Objeto esperado e encontrado.
    -   🟡 **Sobra**: Objeto encontrado, mas não esperado para este distrito.
    -   🔴 **Faltante**: Objeto esperado, mas não encontrado.

### 3.4. 🚚 Acompanhamento de Distribuição (NOVO!)

Esta aba permite acompanhar o itinerário dos carteiros e analisar a eficiência da distribuição.

-   **Gerar Relatório de Acompanhamento**: Clique em "**🚚 Gerar Relatório de Acompanhamento**" após carregar o Banco de Dados de Distribuição.
-   **Filtro por Distrito**: Selecione um distrito para visualizar o itinerário de um carteiro específico.
-   **Tabela de Itinerário**: Exibe os objetos na ordem em que foram baixados, com o tempo decorrido desde a baixa anterior.
    -   **Alerta de Tempo**: Linhas onde o tempo entre baixas consecutivas **ultrapassa 12 minutos** serão destacadas em amarelo, indicando possíveis atrasos ou problemas no itinerário.
-   **Estatísticas por Status**: Um resumo da quantidade e percentual de objetos por status (Entregues, Devolvidos, etc.), ajudando na avaliação geral da distribuição.

### 3.5. 📋 Conferência de Devoluções (NOVO!)

Esta aba é projetada para a conferência física de objetos que precisam ser devolvidos.

-   **Gerar Lista de Devoluções**: Clique em "**📋 Gerar Lista de Devoluções**" para carregar os objetos que, com base no status de baixa, devem ser devolvidos.
-   **Filtro por Distrito**: Selecione o distrito para focar na conferência de devoluções daquele local.
-   **Objetos para Devolução**: Um objeto é considerado para devolução se seu status de baixa **NÃO** for "OBJETO DISTRIBUIDO" ou "DISTRIBUIDO AO REMETENTE".
-   **Conferência Interativa**: Digite ou escaneie os objetos devolvidos. O sistema irá:
    -   Marcar objetos esperados como "🟢 Conferido".
    -   Identificar objetos não esperados para o distrito como "🟡 Sobra".
    -   Listar objetos esperados, mas não encontrados, como "🔴 Faltante".

## 4. Atalhos de Teclado Essenciais

-   `Ctrl+D`: Abrir configuração de bancos de dados.
-   `Ctrl+R`: Gerar relatório principal.
-   `Ctrl+F`: Buscar pontos coincidentes.
-   `Ctrl+E`: Exportar para Excel.
-   `Ctrl+P`: Imprimir.
-   `Ctrl+→`: Próxima aba.
-   `Ctrl+←`: Aba anterior.
-   `F11`: Alternar modo escuro.
-   `ESC`: Fechar modal.

## 5. Observações Importantes

-   **Dados Persistentes**: Todos os dados carregados são salvos automaticamente no seu navegador (localStorage).
-   **Formato de Datas**: O sistema aceita DD/MM/AAAA e AAAA-MM-DD para prazos.
-   **Performance**: O aplicativo é otimizado para lidar com grandes volumes de dados.
-   **Compatibilidade**: Funciona em navegadores modernos (Chrome, Firefox, Safari, Edge).

Esperamos que este guia ajude você a aproveitar ao máximo o Relatório Integrado!
