// Variáveis globais para armazenar os dados
let currentListData = [];
let currentObjectData = [];
let currentPrazoData = [];
let currentDistribuicaoData = [];
let currentReportData = [];
let scannedObjects = [];
let isProcessing = false;
let sortDirection = {};
let currentTab = 'relatorio-principal';

// Inicializa a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    updateDatabaseStatus();
    loadDarkModePreference();
    setupKeyboardShortcuts();
    setupTabNavigation();
});

function setupEventListeners() {
    // Modo escuro
    document.getElementById('toggleDarkMode').addEventListener('click', toggleDarkMode);
    
    // Modal de configuração
    document.getElementById('openDatabaseModal').addEventListener('click', openModal);
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('saveDatabases').addEventListener('click', saveDatabases);
    document.getElementById('clearDatabases').addEventListener('click', clearDatabases);
    
    // Modal de ajuda
    document.getElementById('openHelpModal').addEventListener('click', openHelpModal);
    document.querySelector('.help-close').addEventListener('click', closeHelpModal);
    document.getElementById('closeHelpModal').addEventListener('click', closeHelpModal);
    document.getElementById('openHelpNewWindow').addEventListener('click', openHelpNewWindow);
    
    // Botões de exportar/importar JSON
    document.getElementById('exportJson').addEventListener('click', exportToJson);
    document.getElementById('importJson').addEventListener('click', function() {
        document.getElementById('importJsonFile').click();
    });
    document.getElementById('importJsonFile').addEventListener('change', importFromJson);
    
    // Fechar modal clicando fora dele
    window.addEventListener('click', function(event) {
        const databaseModal = document.getElementById('databaseModal');
        const helpModal = document.getElementById('helpModal');
        if (event.target === databaseModal) {
            closeModal();
        } else if (event.target === helpModal) {
            closeHelpModal();
        }
    });
    
    // Fechar modal com ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
            closeHelpModal();
        }
    });
    
    // Botões principais - Relatório Principal
    document.getElementById('printReport').addEventListener('click', function() {
        window.print();
    });
    
    document.getElementById('generateReport').addEventListener('click', function() {
        if (!isProcessing) {
            generateReport();
        }
    });
    
    document.getElementById('findCoincidentPoints').addEventListener('click', function() {
        if (!isProcessing) {
            findCoincidentPoints();
        }
    });
    
    // Botões de exportação
    document.getElementById('exportExcel').addEventListener('click', exportToExcel);
    document.getElementById('exportCSV').addEventListener('click', exportToCSV);
    
    // Filtro de busca
    document.getElementById('searchFilter').addEventListener('input', debounce(applyFilters, 300));
    
    // Filtros existentes
    document.getElementById('filterGrade').addEventListener('change', applyFilters);
    document.getElementById('filterSide').addEventListener('change', applyFilters);
    
    // Ordenação da tabela
    document.querySelectorAll('#reportTable th[data-column]').forEach(th => {
        th.addEventListener('click', function() {
            sortTable(this.dataset.column);
        });
    });
    
    // Auto-save nos textareas
    document.getElementById('listDatabase').addEventListener('input', debounce(updateDatabaseStatus, 500));
    document.getElementById('objectDatabase').addEventListener('input', debounce(updateDatabaseStatus, 500));
    document.getElementById('prazoDatabase').addEventListener('input', debounce(updateDatabaseStatus, 500));
    document.getElementById('distribuicaoDatabase').addEventListener('input', debounce(updateDatabaseStatus, 500));
    
    // Botões da aba de Controle de Prazos
    document.getElementById('generatePrazoReport').addEventListener('click', function() {
        if (!isProcessing) {
            generatePrazoReport();
        }
    });
    
    document.getElementById('prazoDistritoFilter').addEventListener('change', applyPrazoFilters);
    
    // Botões da aba de Conferência Física
    document.getElementById('addObjeto').addEventListener('click', addObjetoToConferencia);
    document.getElementById('clearConferencia').addEventListener('click', clearConferencia);
    document.getElementById('conferenciaDistritoFilter').addEventListener('change', updateConferenciaExpectedObjects);
    
    // Enter no campo de objeto
    document.getElementById('objetoInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            addObjetoToConferencia();
        }
    });
    
    // Validação em tempo real no campo de objeto
    document.getElementById('objetoInput').addEventListener('input', function(event) {
        const input = event.target;
        const valor = input.value.trim().toUpperCase();
        
        // Aplicar máscara: converter para maiúsculas
        input.value = valor;
        
        // Validar formato em tempo real
        if (valor.length > 0) {
            if (validateObjetoFormat(valor)) {
                input.classList.remove('invalid-format');
                input.classList.add('valid-format');
            } else {
                input.classList.remove('valid-format');
                input.classList.add('invalid-format');
            }
        } else {
            input.classList.remove('valid-format', 'invalid-format');
        }
    });
    
    // Botões da aba de Acompanhamento de Distribuição
    document.getElementById('generateDistribuicaoReport').addEventListener('click', function() {
        if (!isProcessing) {
            generateDistribuicaoReport();
        }
    });
    
    document.getElementById('distribuicaoDistritoFilter').addEventListener('change', applyDistribuicaoFilters);
    
    // Filtros da aba de Controle de Prazos
    document.getElementById('prazoStatusFilter').addEventListener('change', applyPrazoFilters);
    document.getElementById('prazoObjetoFilter').addEventListener('input', applyPrazoFilters);
    document.getElementById('prazoEnderecoFilter').addEventListener('input', applyPrazoFilters);
    document.getElementById('prazoDiasFilter').addEventListener('change', applyPrazoFilters);
    document.getElementById('clearPrazoFilters').addEventListener('click', clearPrazoFilters);
    
    // Ordenação da tabela de prazos
    document.querySelectorAll('#prazoTable .sortable').forEach(header => {
        header.addEventListener('click', function() {
            sortPrazoTable(this.dataset.column);
        });
    });
    
    // Botões da aba de Conferência de Devoluções
    document.getElementById('generateDevolucaoReport').addEventListener('click', function() {
        if (!isProcessing) {
            generateDevolucaoReport();
        }
    });
    
    document.getElementById('addObjetoDevolucao').addEventListener('click', addObjetoDevolucao);
    document.getElementById('clearDevolucao').addEventListener('click', clearDevolucao);
    document.getElementById('devolucaoDistritoFilter').addEventListener('change', updateDevolucaoExpectedObjects);
    
    // Enter no campo de objeto de devolução
    document.getElementById('devolucaoObjetoInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            addObjetoDevolucao();
        }
    });
    
    // Validação em tempo real no campo de objeto de devolução
    document.getElementById('devolucaoObjetoInput').addEventListener('input', function(event) {
        const input = event.target;
        const valor = input.value.trim().toUpperCase();
        
        // Aplicar máscara: converter para maiúsculas
        input.value = valor;
        
        // Validar formato em tempo real
        if (valor.length > 0) {
            if (validateObjetoFormat(valor)) {
                input.classList.remove('invalid-format');
                input.classList.add('valid-format');
            } else {
                input.classList.remove('valid-format');
                input.classList.add('invalid-format');
            }
        } else {
            input.classList.remove('valid-format', 'invalid-format');
        }
    });
    
    // Botões da aba de Gerenciamento de Objetos
    document.getElementById('searchObjetoBtn').addEventListener('click', searchObjeto);
    document.getElementById('objetoSearchInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            searchObjeto();
        }
    });
    document.getElementById('objetoSearchInput').addEventListener('input', function(event) {
        const input = event.target;
        const valor = input.value.trim().toUpperCase();
        input.value = valor;
        
        if (valor.length > 0) {
            if (validateObjetoFormat(valor)) {
                input.classList.remove('invalid-format');
                input.classList.add('valid-format');
            } else {
                input.classList.remove('valid-format');
                input.classList.add('invalid-format');
            }
        } else {
            input.classList.remove('valid-format', 'invalid-format');
        }
    });
    
    document.getElementById('novoDistritoSelect').addEventListener('change', updateNovaListaOptions);
    document.getElementById('novaListaSelect').addEventListener('change', validateMovimentacao);
    document.getElementById('confirmarMovimentacaoBtn').addEventListener('click', confirmarMovimentacao);
    document.getElementById('cancelarMovimentacaoBtn').addEventListener('click', cancelarMovimentacao);
    document.getElementById('exportarHistoricoBtn').addEventListener('click', exportarHistoricoMovimentacoes);
    document.getElementById('limparHistoricoBtn').addEventListener('click', limparHistoricoMovimentacoes);
}

// Navegação por abas
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            switchTab(targetTab);
        });
    });
}

function switchTab(tabId) {
    // Remover classe active de todos os botões e conteúdos
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Adicionar classe active ao botão e conteúdo selecionados
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
    
    currentTab = tabId;
    
    // Atualizar filtros de distrito quando necessário
    if (tabId === 'controle-prazos') {
        updateDistritoFilters('prazoDistritoFilter');
    } else if (tabId === 'conferencia-fisica') {
        updateDistritoFilters('conferenciaDistritoFilter');
    } else if (tabId === 'acompanhamento-distribuicao') {
        updateDistritoFilters('distribuicaoDistritoFilter');
    } else if (tabId === 'conferencia-devolucoes') {
        updateDistritoFilters('devolucaoDistritoFilter');
    }
}

function updateDistritoFilters(selectId) {
    const select = document.getElementById(selectId);
    const currentValue = select.value;
    
    // Limpar opções existentes (exceto a primeira)
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }
    
    // Obter distritos únicos dos dados atuais
    const distritos = [...new Set(currentListData.map(item => item.distrito))].sort();
    
    distritos.forEach(distrito => {
        const option = document.createElement('option');
        option.value = distrito;
        option.textContent = distrito;
        select.appendChild(option);
    });
    
    // Restaurar valor selecionado se ainda existir
    if (currentValue && distritos.includes(currentValue)) {
        select.value = currentValue;
    }
}

// Atalhos de teclado
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
        // Verificar se não está em um campo de input
        if (event.target.tagName === 'TEXTAREA' || event.target.tagName === 'INPUT') {
            return;
        }
        
        if (event.ctrlKey || event.metaKey) {
            switch(event.key.toLowerCase()) {
                case 'd':
                    event.preventDefault();
                    openModal();
                    break;
                case 'r':
                    event.preventDefault();
                    if (!isProcessing) generateReport();
                    break;
                case 'p':
                    event.preventDefault();
                    window.print();
                    break;
                case 'f':
                    event.preventDefault();
                    if (!isProcessing) findCoincidentPoints();
                    break;
                case 'e':
                    event.preventDefault();
                    exportToExcel();
                    break;
                case 'arrowright':
                    event.preventDefault();
                    navigateTab(1);
                    break;
                case 'arrowleft':
                    event.preventDefault();
                    navigateTab(-1);
                    break;
            }
        } else if (event.key === 'F11') {
            event.preventDefault();
            toggleDarkMode();
        } else if (event.key === 'F1') {
            event.preventDefault();
            openHelpModal();
        }
    });
}

function navigateTab(direction) {
    const tabs = ['relatorio-principal', 'controle-prazos', 'conferencia-fisica', 'acompanhamento-distribuicao', 'conferencia-devolucoes', 'gerenciamento-objetos'];
    const currentIndex = tabs.indexOf(currentTab);
    let newIndex = currentIndex + direction;
    
    if (newIndex < 0) newIndex = tabs.length - 1;
    if (newIndex >= tabs.length) newIndex = 0;
    
    switchTab(tabs[newIndex]);
}

// Funções do Modal
function openModal() {
    document.getElementById('databaseModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    // Focar no primeiro textarea
    setTimeout(() => {
        document.getElementById('listDatabase').focus();
    }, 100);
}

function closeModal() {
    document.getElementById('databaseModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function saveDatabases() {
    const listData = document.getElementById('listDatabase').value.trim();
    const objectData = document.getElementById('objectDatabase').value.trim();
    const prazoData = document.getElementById('prazoDatabase').value.trim();
    const distribuicaoData = document.getElementById('distribuicaoDatabase').value.trim();
    
    if (listData || objectData || prazoData || distribuicaoData) {
        try {
            if (listData) {
                const parsedList = parseListDatabase(listData);
                if (parsedList.length === 0) {
                    throw new Error('Dados de lista inválidos');
                }
            }
            
            if (objectData) {
                const parsedObject = parseObjectDatabase(objectData);
                if (parsedObject.length === 0) {
                    throw new Error('Dados de objeto inválidos');
                }
            }
            
            if (prazoData) {
                const parsedPrazo = parsePrazoDatabase(prazoData);
                if (parsedPrazo.length === 0) {
                    throw new Error('Dados de prazo inválidos');
                }
            }
            
            if (distribuicaoData) {
                const parsedDistribuicao = parseDistribuicaoDatabase(distribuicaoData);
                if (parsedDistribuicao.length === 0) {
                    throw new Error('Dados de distribuição inválidos');
                }
            }
            
            // Salvar no localStorage
            localStorage.setItem('listDatabase', listData);
            localStorage.setItem('objectDatabase', objectData);
            localStorage.setItem('prazoDatabase', prazoData);
            localStorage.setItem('distribuicaoDatabase', distribuicaoData);
            
            updateDatabaseStatus();
            closeModal();
            showNotification('Bancos de dados salvos com sucesso!', 'success');
        } catch (error) {
            showNotification('Erro ao validar os dados: ' + error.message, 'error');
        }
    } else {
        closeModal();
    }
}

function clearDatabases() {
    if (confirm('Tem certeza que deseja limpar todos os dados dos bancos de dados?')) {
        document.getElementById('listDatabase').value = '';
        document.getElementById('objectDatabase').value = '';
        document.getElementById('prazoDatabase').value = '';
        document.getElementById('distribuicaoDatabase').value = '';
        currentListData = [];
        currentObjectData = [];
        currentPrazoData = [];
        currentDistribuicaoData = [];
        currentReportData = [];
        scannedObjects = [];
        devolucaoExpectedObjects = [];
        devolucaoScannedObjects = [];
        
        // Limpar localStorage
        localStorage.removeItem('listDatabase');
        localStorage.removeItem('objectDatabase');
        localStorage.removeItem('prazoDatabase');
        localStorage.removeItem('distribuicaoDatabase');
        
        updateDatabaseStatus();
        clearReports();
        clearPrazoReport();
        clearConferencia();
        clearDistribuicaoReport();
        clearDevolucaoReport();
        showNotification('Bancos de dados limpos!', 'warning');
    }
}

function updateDatabaseStatus() {
    const listData = document.getElementById('listDatabase').value.trim();
    const objectData = document.getElementById('objectDatabase').value.trim();
    const prazoData = document.getElementById('prazoDatabase').value.trim();
    const distribuicaoData = document.getElementById('distribuicaoDatabase').value.trim();
    const statusDiv = document.getElementById('databaseStatus');
    const listStatus = document.getElementById('listStatus');
    const objectStatus = document.getElementById('objectStatus');
    const prazoStatus = document.getElementById('prazoStatus');
    const distribuicaoStatus = document.getElementById('distribuicaoStatus');
    
    let listCount = 0;
    let objectCount = 0;
    let prazoCount = 0;
    let distribuicaoCount = 0;
    
    try {
        if (listData) {
            const parsed = parseListDatabase(listData);
            listCount = parsed.length;
            listStatus.textContent = `Lista: ${listCount} registros carregados`;
            listStatus.parentElement.className = 'status-item loaded';
        } else {
            listStatus.textContent = 'Lista: Não carregado';
            listStatus.parentElement.className = 'status-item';
        }
    } catch (error) {
        listStatus.textContent = 'Lista: Erro no formato';
        listStatus.parentElement.className = 'status-item error';
    }
    
    try {
        if (objectData) {
            const parsed = parseObjectDatabase(objectData);
            objectCount = parsed.length;
            objectStatus.textContent = `Objetos: ${objectCount} registros carregados`;
            objectStatus.parentElement.className = 'status-item loaded';
        } else {
            objectStatus.textContent = 'Objetos: Não carregado';
            objectStatus.parentElement.className = 'status-item';
        }
    } catch (error) {
        objectStatus.textContent = 'Objetos: Erro no formato';
        objectStatus.parentElement.className = 'status-item error';
    }
    
    try {
        if (prazoData) {
            const parsed = parsePrazoDatabase(prazoData);
            prazoCount = parsed.length;
            prazoStatus.textContent = `Prazos: ${prazoCount} registros carregados`;
            prazoStatus.parentElement.className = 'status-item loaded';
        } else {
            prazoStatus.textContent = 'Prazos: Não carregado';
            prazoStatus.parentElement.className = 'status-item';
        }
    } catch (error) {
        prazoStatus.textContent = 'Prazos: Erro no formato';
        prazoStatus.parentElement.className = 'status-item error';
    }
    
    try {
        if (distribuicaoData) {
            const parsed = parseDistribuicaoDatabase(distribuicaoData);
            distribuicaoCount = parsed.length;
            distribuicaoStatus.textContent = `Distribuição: ${distribuicaoCount} registros carregados`;
            distribuicaoStatus.parentElement.className = 'status-item loaded';
        } else {
            distribuicaoStatus.textContent = 'Distribuição: Não carregado';
            distribuicaoStatus.parentElement.className = 'status-item';
        }
    } catch (error) {
        distribuicaoStatus.textContent = 'Distribuição: Erro no formato';
        distribuicaoStatus.parentElement.className = 'status-item error';
    }
    
    if (listData || objectData || prazoData || distribuicaoData) {
        statusDiv.style.display = 'flex';
    } else {
        statusDiv.style.display = 'none';
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.getElementById('toggleDarkMode').textContent = isDark ? 'Desativar Modo Escuro' : 'Ativar Modo Escuro';
    
    localStorage.setItem('darkMode', isDark);
    showNotification(`Modo ${isDark ? 'escuro' : 'claro'} ativado`, 'info');
}

function loadDarkModePreference() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('toggleDarkMode').textContent = 'Desativar Modo Escuro';
    }
    
    // Carregar dados salvos
    const savedListData = localStorage.getItem('listDatabase');
    const savedObjectData = localStorage.getItem('objectDatabase');
    const savedPrazoData = localStorage.getItem('prazoDatabase');
    const savedDistribuicaoData = localStorage.getItem('distribuicaoDatabase');
    
    if (savedListData) {
        document.getElementById('listDatabase').value = savedListData;
    }
    if (savedObjectData) {
        document.getElementById('objectDatabase').value = savedObjectData;
    }
    if (savedPrazoData) {
        document.getElementById('prazoDatabase').value = savedPrazoData;
    }
    if (savedDistribuicaoData) {
        document.getElementById('distribuicaoDatabase').value = savedDistribuicaoData;
    }
    
    if (savedListData || savedObjectData || savedPrazoData || savedDistribuicaoData) {
        updateDatabaseStatus();
    }
}

function parseListDatabase(data) {
    const rows = data.split('\n').filter(line => line.trim());
    const parsedData = [];
    
    rows.forEach((row, index) => {
        const parts = row.split('\t').map(col => col.trim());
        if (parts.length >= 7) {
            parsedData.push({
                distrito: parts[0],
                funcionario: parts[1],
                lista: parts[6],
                rowIndex: index + 1
            });
        }
    });
    
    return parsedData;
}

function parseObjectDatabase(data) {
    const rows = data.split('\n').filter(line => line.trim());
    const parsedData = [];
    let currentList = null;

    rows.forEach((row, index) => {
        const parts = row.split('\t').map(col => col.trim());
        if (parts[0]) {
            currentList = parts[0];
        } else if (currentList && parts.length >= 4) {
            parsedData.push({
                lista: currentList,
                objeto: parts[1] || '',
                endereco: (parts[3] || '').trim().toUpperCase(),
                rowIndex: index + 1
            });
        }
    });

    return parsedData;
}

function parsePrazoDatabase(data) {
    const rows = data.split('\n').filter(line => line.trim());
    const parsedData = [];
    
    rows.forEach((row, index) => {
        const parts = row.split('\t').map(col => col.trim());
        if (parts.length >= 12 && parts[0] && parts[11]) {
            const prazoFinal = parseDate(parts[11]);
            if (prazoFinal) {
                parsedData.push({
                    objeto: parts[0],
                    prazoFinal: prazoFinal,
                    rowIndex: index + 1
                });
            }
        }
    });
    
    return parsedData;
}

function parseDistribuicaoDatabase(data) {
    const rows = data.split('\n').filter(line => line.trim());
    const parsedData = [];
    
    rows.forEach((row, index) => {
        const parts = row.split('\t').map(col => col.trim());
        if (parts.length >= 8 && parts[1] && parts[3] && parts[7]) {
            // Coluna 2 (índice 1): Nº objeto
            // Coluna 4 (índice 3): Horário de baixa
            // Coluna 8 (índice 7): Status
            
            const horarioBaixa = parseDateTime(parts[3]);
            if (horarioBaixa) {
                parsedData.push({
                    objeto: parts[1],
                    horario_baixa: horarioBaixa,
                    status: parts[7],
                    rowIndex: index + 1
                });
            }
        }
    });
    
    return parsedData;
}

function parseDateTime(dateTimeString) {
    // Tentar diferentes formatos de data e hora
    const formats = [
        /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/, // DD/MM/AAAA HH:MM
        /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/, // AAAA-MM-DD HH:MM
        /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/, // DD/MM/AAAA HH:MM:SS
        /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/, // AAAA-MM-DD HH:MM:SS
    ];
    
    for (let format of formats) {
        const match = dateTimeString.match(format);
        if (match) {
            let day, month, year, hour, minute, second = 0;
            
            if (format === formats[0] || format === formats[2]) { // DD/MM/AAAA
                day = parseInt(match[1]);
                month = parseInt(match[2]) - 1; // JavaScript months are 0-based
                year = parseInt(match[3]);
                hour = parseInt(match[4]);
                minute = parseInt(match[5]);
                if (match[6]) second = parseInt(match[6]);
            } else { // AAAA-MM-DD
                year = parseInt(match[1]);
                month = parseInt(match[2]) - 1;
                day = parseInt(match[3]);
                hour = parseInt(match[4]);
                minute = parseInt(match[5]);
                if (match[6]) second = parseInt(match[6]);
            }
            
            const date = new Date(year, month, day, hour, minute, second);
            if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
                return date;
            }
        }
    }
    
    return null;
}

function parseDate(dateString) {
    // Tentar diferentes formatos de data
    const formats = [
        /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/AAAA
        /^(\d{4})-(\d{2})-(\d{2})$/, // AAAA-MM-DD
        /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-AAAA
    ];
    
    for (let format of formats) {
        const match = dateString.match(format);
        if (match) {
            let day, month, year;
            if (format === formats[0] || format === formats[2]) { // DD/MM/AAAA ou DD-MM-AAAA
                day = parseInt(match[1]);
                month = parseInt(match[2]) - 1; // JavaScript months are 0-based
                year = parseInt(match[3]);
            } else { // AAAA-MM-DD
                year = parseInt(match[1]);
                month = parseInt(match[2]) - 1;
                day = parseInt(match[3]);
            }
            
            const date = new Date(year, month, day);
            if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
                return date;
            }
        }
    }
    
    return null;
}

function generateReport() {
    const listDatabase = document.getElementById('listDatabase').value.trim();
    const objectDatabase = document.getElementById('objectDatabase').value.trim();

    if (!listDatabase || !objectDatabase) {
        showNotification('Por favor, configure os bancos de dados primeiro.', 'warning');
        openModal();
        return;
    }

    isProcessing = true;
    toggleLoading(true);

    setTimeout(() => {
        try {
            currentListData = parseListDatabase(listDatabase);
            currentObjectData = parseObjectDatabase(objectDatabase);

            if (currentListData.length === 0 || currentObjectData.length === 0) {
                throw new Error('Os dados inseridos não estão no formato esperado. Verifique os bancos de dados.');
            }

            currentReportData = currentListData.map(entry => {
                const relatedObjects = currentObjectData.filter(obj => obj.lista === entry.lista);
                const totalObjetos = relatedObjects.length;
                const uniqueEnderecos = new Set(relatedObjects.map(obj => obj.endereco).filter(e => e)).size;

                return {
                    distrito: entry.distrito,
                    funcionario: entry.funcionario,
                    lista: entry.lista,
                    totalObjetos: totalObjetos,
                    totalPontos: uniqueEnderecos,
                    grade: entry.distrito[0],
                    lado: entry.distrito.slice(-1)
                };
            });

            applyFilters();
            document.getElementById('coincidentPointsSection').style.display = 'none';
            
            // Atualizar filtros de distrito nas outras abas
            updateDistritoFilters('prazoDistritoFilter');
            updateDistritoFilters('conferenciaDistritoFilter');
            updateDistritoFilters('distribuicaoDistritoFilter');
            updateDistritoFilters('devolucaoDistritoFilter');
            
            showNotification('Relatório gerado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            showNotification('Erro ao gerar relatório: ' + error.message, 'error');
        } finally {
            isProcessing = false;
            toggleLoading(false);
        }
    }, 100);
}

function applyFilters() {
    if (currentReportData.length === 0) return;
    
    const filterGrade = document.getElementById('filterGrade').value;
    const filterSide = document.getElementById('filterSide').value;
    const searchText = document.getElementById('searchFilter').value.toLowerCase();
    
    let filteredData = [...currentReportData];
    
    // Aplicar filtros
    if (filterGrade) {
        filteredData = filteredData.filter(row => row.grade === filterGrade);
    }
    if (filterSide) {
        filteredData = filteredData.filter(row => row.lado === filterSide);
    }
    if (searchText) {
        filteredData = filteredData.filter(row => 
            row.distrito.toLowerCase().includes(searchText) ||
            row.funcionario.toLowerCase().includes(searchText) ||
            row.lista.toLowerCase().includes(searchText)
        );
    }
    
    updateReportTable(filteredData);
    generateSummary(filteredData);
}

function updateReportTable(data) {
    const reportTableBody = document.querySelector('#reportTable tbody');
    reportTableBody.innerHTML = '';

    if (data.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="5" style="text-align: center; color: #666;">Nenhum dado encontrado com os filtros aplicados</td>';
        reportTableBody.appendChild(tr);
        return;
    }

    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.distrito}</td>
            <td>${row.funcionario}</td>
            <td>${row.lista}</td>
            <td>${row.totalObjetos}</td>
            <td>${row.totalPontos}</td>
        `;
        reportTableBody.appendChild(tr);
    });
}

// Funcionalidades da aba Controle de Prazos
function generatePrazoReport() {
    const prazoDatabase = document.getElementById('prazoDatabase').value.trim();
    
    if (!prazoDatabase) {
        showNotification('Por favor, configure o banco de dados de prazos primeiro.', 'warning');
        openModal();
        return;
    }
    
    if (currentListData.length === 0 || currentObjectData.length === 0) {
        showNotification('Por favor, gere o relatório principal primeiro.', 'warning');
        switchTab('relatorio-principal');
        return;
    }
    
    isProcessing = true;
    toggleLoading(true, 'generatePrazoReport');
    
    setTimeout(() => {
        try {
            currentPrazoData = parsePrazoDatabase(prazoDatabase);
            
            if (currentPrazoData.length === 0) {
                throw new Error('Nenhum dado de prazo válido encontrado.');
            }
            
            applyPrazoFilters();
            showNotification('Relatório de prazos gerado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao gerar relatório de prazos:', error);
            showNotification('Erro ao gerar relatório de prazos: ' + error.message, 'error');
        } finally {
            isProcessing = false;
            toggleLoading(false, 'generatePrazoReport');
        }
    }, 100);
}

// Variáveis globais para ordenação de prazos
let prazoSortColumn = '';
let prazoSortDirection = 'asc';

function applyPrazoFilters() {
    if (currentPrazoData.length === 0) return;
    
    const selectedDistrito = document.getElementById('prazoDistritoFilter').value;
    const selectedStatus = document.getElementById('prazoStatusFilter').value;
    const objetoFilter = document.getElementById('prazoObjetoFilter').value.toLowerCase();
    const enderecoFilter = document.getElementById('prazoEnderecoFilter').value.toLowerCase();
    const diasFilter = document.getElementById('prazoDiasFilter').value;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Cruzar dados de prazo com objetos e listas
    const prazoWithDetails = currentPrazoData.map(prazoItem => {
        const objectInfo = currentObjectData.find(obj => obj.objeto === prazoItem.objeto);
        if (objectInfo) {
            const listInfo = currentListData.find(list => list.lista === objectInfo.lista);
            if (listInfo) {
                const diasRestantes = Math.ceil((prazoItem.prazoFinal - today) / (1000 * 60 * 60 * 24));
                let status;
                if (diasRestantes < 0) {
                    status = 'Atrasado';
                } else if (diasRestantes === 0) {
                    status = 'Vence Hoje';
                } else {
                    status = 'No Prazo';
                }
                
                return {
                    distrito: listInfo.distrito,
                    objeto: prazoItem.objeto,
                    endereco: objectInfo.endereco,
                    prazoFinal: prazoItem.prazoFinal,
                    status: status,
                    diasRestantes: diasRestantes
                };
            }
        }
        return null;
    }).filter(item => item !== null);
    
    // Aplicar filtros
    let filteredData = prazoWithDetails;
    
    // Filtrar por distrito
    if (selectedDistrito) {
        filteredData = filteredData.filter(item => item.distrito === selectedDistrito);
    }
    
    // Filtrar por status
    if (selectedStatus) {
        filteredData = filteredData.filter(item => item.status === selectedStatus);
    }
    
    // Filtrar por objeto
    if (objetoFilter) {
        filteredData = filteredData.filter(item => 
            item.objeto.toLowerCase().includes(objetoFilter)
        );
    }
    
    // Filtrar por endereço
    if (enderecoFilter) {
        filteredData = filteredData.filter(item => 
            item.endereco && item.endereco.toLowerCase().includes(enderecoFilter)
        );
    }
    
    // Filtrar por dias restantes
    if (diasFilter) {
        filteredData = filteredData.filter(item => {
            const dias = item.diasRestantes;
            switch (diasFilter) {
                case 'atrasado':
                    return dias < 0;
                case 'hoje':
                    return dias === 0;
                case '1-3':
                    return dias >= 1 && dias <= 3;
                case '4-7':
                    return dias >= 4 && dias <= 7;
                case '8-15':
                    return dias >= 8 && dias <= 15;
                case '15+':
                    return dias > 15;
                default:
                    return true;
            }
        });
    }
    
    // Aplicar ordenação se houver
    if (prazoSortColumn) {
        filteredData = sortPrazoData(filteredData, prazoSortColumn, prazoSortDirection);
    }
    
    updatePrazoTable(filteredData);
    generatePrazoSummary(filteredData);
}

function updatePrazoTable(data) {
    const tableBody = document.querySelector('#prazoTable tbody');
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="6" style="text-align: center; color: #666;">Nenhum dado encontrado</td>';
        tableBody.appendChild(tr);
        return;
    }
    
    data.forEach(item => {
        const tr = document.createElement('tr');
        const statusClass = item.status === 'Atrasado' ? 'status-atrasado' : 
                           item.status === 'Vence Hoje' ? 'status-vence-hoje' : 'status-no-prazo';
        
        tr.innerHTML = `
            <td>${item.distrito}</td>
            <td>${item.objeto}</td>
            <td>${item.endereco || 'Endereço não encontrado'}</td>
            <td>${item.prazoFinal.toLocaleDateString('pt-BR')}</td>
            <td class="${statusClass}">${item.status}</td>
            <td>${item.diasRestantes >= 0 ? item.diasRestantes : Math.abs(item.diasRestantes)} dias</td>
        `;
        tableBody.appendChild(tr);
    });
}

function generatePrazoSummary(data) {
    const summarySection = document.getElementById('prazoSummarySection');
    summarySection.innerHTML = '';
    
    if (data.length === 0) {
        const card = document.createElement('div');
        card.className = 'summary-card';
        card.innerHTML = `
            <h3>⏰ Resumo de Prazos</h3>
            <p>Nenhum dado encontrado</p>
        `;
        summarySection.appendChild(card);
        return;
    }
    
    const atrasados = data.filter(item => item.status === 'Atrasado');
    const venceHoje = data.filter(item => item.status === 'Vence Hoje');
    const noPrazo = data.filter(item => item.status === 'No Prazo');
    
    // Resumo geral
    const card = document.createElement('div');
    card.className = 'summary-card';
    card.innerHTML = `
        <h3>⏰ Resumo de Prazos</h3>
        <p><strong>Total de Objetos:</strong> ${data.length}</p>
        <p><strong class="status-atrasado">Atrasados:</strong> ${atrasados.length}</p>
        <p><strong class="status-vence-hoje">Vencem Hoje:</strong> ${venceHoje.length}</p>
        <p><strong class="status-no-prazo">No Prazo:</strong> ${noPrazo.length}</p>
    `;
    summarySection.appendChild(card);
    
    // Resumo por distrito se não filtrado
    const selectedDistrito = document.getElementById('prazoDistritoFilter').value;
    if (!selectedDistrito) {
        const distritos = [...new Set(data.map(item => item.distrito))].sort();
        distritos.forEach(distrito => {
            const distData = data.filter(item => item.distrito === distrito);
            const distAtrasados = distData.filter(item => item.status === 'Atrasado').length;
            const distVenceHoje = distData.filter(item => item.status === 'Vence Hoje').length;
            const distNoPrazo = distData.filter(item => item.status === 'No Prazo').length;
            
            const distCard = document.createElement('div');
            distCard.className = 'summary-card';
            distCard.innerHTML = `
                <h3>🏢 ${distrito}</h3>
                <p><strong>Total:</strong> ${distData.length}</p>
                <p><strong class="status-atrasado">Atrasados:</strong> ${distAtrasados}</p>
                <p><strong class="status-vence-hoje">Vencem Hoje:</strong> ${distVenceHoje}</p>
                <p><strong class="status-no-prazo">No Prazo:</strong> ${distNoPrazo}</p>
            `;
            summarySection.appendChild(distCard);
        });
    }
}

// Funcionalidades da aba Conferência Física
function validateObjetoFormat(objeto) {
    // Padrão: 2 letras + 9 números + 2 letras (exemplo: AB527084135BR)
    const pattern = /^[A-Z]{2}\d{9}[A-Z]{2}$/;
    return pattern.test(objeto.toUpperCase());
}

function addObjetoToConferencia() {
    const objetoInput = document.getElementById('objetoInput');
    const objeto = objetoInput.value.trim().toUpperCase();
    const selectedDistrito = document.getElementById('conferenciaDistritoFilter').value;
    
    if (!objeto) {
        showNotification('Digite o número do objeto', 'warning');
        return;
    }
    
    // Validar formato do objeto
    if (!validateObjetoFormat(objeto)) {
        showNotification('Formato inválido! Use o padrão: 2 letras + 9 números + 2 letras (ex: AB527084135BR)', 'error');
        objetoInput.focus();
        objetoInput.select();
        return;
    }
    
    if (!selectedDistrito) {
        showNotification('Selecione um distrito primeiro', 'warning');
        return;
    }
    
    // Verificar se o objeto já foi lido
    if (scannedObjects.includes(objeto)) {
        showNotification('Objeto já foi lido', 'warning');
        return;
    }
    
    scannedObjects.push(objeto);
    objetoInput.value = '';
    objetoInput.focus();
    
    updateConferenciaTable();
    updateConferenciaSummary();
    
    showNotification(`Objeto ${objeto} adicionado`, 'success');
}

function clearConferencia() {
    if (confirm('Tem certeza que deseja limpar a lista de objetos lidos?')) {
        scannedObjects = [];
        updateConferenciaTable();
        updateConferenciaSummary();
        showNotification('Lista de conferência limpa', 'info');
    }
}

function updateConferenciaExpectedObjects() {
    updateConferenciaTable();
    updateConferenciaSummary();
}

function updateConferenciaTable() {
    const tableBody = document.querySelector('#conferenciaTable tbody');
    tableBody.innerHTML = '';
    
    const selectedDistrito = document.getElementById('conferenciaDistritoFilter').value;
    
    if (!selectedDistrito) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="4" style="text-align: center; color: #666;">Selecione um distrito</td>';
        tableBody.appendChild(tr);
        return;
    }
    
    // Obter objetos esperados para o distrito
    const expectedObjects = getExpectedObjectsForDistrito(selectedDistrito);
    const expectedObjectNumbers = expectedObjects.map(obj => obj.objeto);
    
    // Função para obter endereço do objeto
    function getObjectAddress(objeto) {
        const objectInfo = currentObjectData.find(obj => obj.objeto === objeto);
        return objectInfo ? objectInfo.endereco || 'Endereço não encontrado' : 'Endereço não encontrado';
    }
    
    // Objetos lidos
    scannedObjects.forEach(objeto => {
        const tr = document.createElement('tr');
        const isExpected = expectedObjectNumbers.includes(objeto);
        const status = isExpected ? 'Conferido' : 'Sobra';
        const statusClass = isExpected ? 'status-conferido' : 'status-sobra';
        const endereco = getObjectAddress(objeto);
        
        tr.innerHTML = `
            <td>${objeto}</td>
            <td class="${statusClass}">${status}</td>
            <td>${endereco}</td>
            <td>${isExpected ? 'Objeto esperado para este distrito' : 'Objeto não esperado para este distrito'}</td>
        `;
        tableBody.appendChild(tr);
    });
    
    // Objetos faltantes (esperados mas não lidos)
    expectedObjectNumbers.forEach(objeto => {
        if (!scannedObjects.includes(objeto)) {
            const tr = document.createElement('tr');
            const endereco = getObjectAddress(objeto);
            tr.innerHTML = `
                <td>${objeto}</td>
                <td class="status-faltante">Faltante</td>
                <td>${endereco}</td>
                <td>Objeto esperado mas não foi lido</td>
            `;
            tableBody.appendChild(tr);
        }
    });
    
    if (scannedObjects.length === 0 && expectedObjectNumbers.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="4" style="text-align: center; color: #666;">Nenhum objeto encontrado para este distrito</td>';
        tableBody.appendChild(tr);
    }
}

function getExpectedObjectsForDistrito(distrito) {
    // Obter listas do distrito
    const districtLists = currentListData.filter(item => item.distrito === distrito).map(item => item.lista);
    
    // Obter objetos das listas do distrito
    const expectedObjects = currentObjectData.filter(obj => districtLists.includes(obj.lista));
    
    return expectedObjects;
}

function updateConferenciaSummary() {
    const summarySection = document.getElementById('conferenciaSummarySection');
    summarySection.innerHTML = '';
    
    const selectedDistrito = document.getElementById('conferenciaDistritoFilter').value;
    
    if (!selectedDistrito) {
        const card = document.createElement('div');
        card.className = 'summary-card';
        card.innerHTML = `
            <h3>📦 Conferência Física</h3>
            <p>Selecione um distrito para iniciar a conferência</p>
        `;
        summarySection.appendChild(card);
        return;
    }
    
    const expectedObjects = getExpectedObjectsForDistrito(selectedDistrito);
    const expectedObjectNumbers = expectedObjects.map(obj => obj.objeto);
    
    const conferidos = scannedObjects.filter(obj => expectedObjectNumbers.includes(obj));
    const sobras = scannedObjects.filter(obj => !expectedObjectNumbers.includes(obj));
    const faltantes = expectedObjectNumbers.filter(obj => !scannedObjects.includes(obj));
    
    const card = document.createElement('div');
    card.className = 'summary-card';
    card.innerHTML = `
        <h3>📦 Conferência - ${selectedDistrito}</h3>
        <p><strong>Objetos Esperados:</strong> ${expectedObjectNumbers.length}</p>
        <p><strong>Objetos Lidos:</strong> ${scannedObjects.length}</p>
        <p><strong class="status-conferido">Conferidos:</strong> ${conferidos.length}</p>
        <p><strong class="status-sobra">Sobras:</strong> ${sobras.length}</p>
        <p><strong class="status-faltante">Faltantes:</strong> ${faltantes.length}</p>
        <p><strong>Progresso:</strong> ${expectedObjectNumbers.length > 0 ? Math.round((conferidos.length / expectedObjectNumbers.length) * 100) : 0}%</p>
    `;
    summarySection.appendChild(card);
}

function clearPrazoReport() {
    document.querySelector('#prazoTable tbody').innerHTML = '';
    document.getElementById('prazoSummarySection').innerHTML = '';
}

// Funções existentes (continuação do código original)
function findCoincidentPoints() {
    if (currentReportData.length === 0) {
        showNotification('Por favor, gere o relatório principal primeiro.', 'warning');
        return;
    }

    isProcessing = true;
    toggleLoading(true, 'findCoincidentPoints');

    setTimeout(() => {
        try {
            const grade6Lists = currentListData
                .filter(item => item.distrito[0] === '6')
                .reduce((acc, item) => {
                    acc[item.lista] = item.distrito;
                    return acc;
                }, {});
            
            const grade6Addresses = {};
            currentObjectData.forEach(obj => {
                if (grade6Lists[obj.lista] && obj.endereco) {
                    if (!grade6Addresses[obj.endereco]) {
                        grade6Addresses[obj.endereco] = {
                            listas: new Set(),
                            distritos: new Set()
                        };
                    }
                    grade6Addresses[obj.endereco].listas.add(obj.lista);
                    grade6Addresses[obj.endereco].distritos.add(grade6Lists[obj.lista]);
                }
            });

            const grade3Lists = currentListData
                .filter(item => item.distrito[0] === '3')
                .reduce((acc, item) => {
                    acc[item.lista] = item.distrito;
                    return acc;
                }, {});
            
            const grade3Addresses = {};
            currentObjectData.forEach(obj => {
                if (grade3Lists[obj.lista] && obj.endereco) {
                    if (!grade3Addresses[obj.endereco]) {
                        grade3Addresses[obj.endereco] = {
                            listas: new Set(),
                            distritos: new Set()
                        };
                    }
                    grade3Addresses[obj.endereco].listas.add(obj.lista);
                    grade3Addresses[obj.endereco].distritos.add(grade3Lists[obj.lista]);
                }
            });

            const coincidentAddresses = Object.keys(grade6Addresses)
                .filter(endereco => grade3Addresses.hasOwnProperty(endereco))
                .sort();

            updateCoincidentPointsTable(coincidentAddresses, grade6Addresses, grade3Addresses);
            generateCoincidentSummary(coincidentAddresses, grade6Addresses, grade3Addresses);
            
            document.getElementById('coincidentPointsSection').style.display = 'block';
            document.getElementById('coincidentPointsSection').scrollIntoView({ behavior: 'smooth' });
            
            showNotification(`Encontrados ${coincidentAddresses.length} pontos coincidentes`, 'success');
            
        } catch (error) {
            console.error('Erro ao buscar pontos coincidentes:', error);
            showNotification('Erro ao buscar pontos coincidentes: ' + error.message, 'error');
        } finally {
            isProcessing = false;
            toggleLoading(false, 'findCoincidentPoints');
        }
    }, 100);
}

function updateCoincidentPointsTable(addresses, grade6Addresses, grade3Addresses) {
    const tableBody = document.querySelector('#coincidentPointsTable tbody');
    tableBody.innerHTML = '';

    if (addresses.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="5" style="text-align: center; color: #666;">Nenhum ponto coincidente encontrado</td>';
        tableBody.appendChild(tr);
        return;
    }

    addresses.forEach(address => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${address}</td>
            <td>${Array.from(grade6Addresses[address].distritos).join(', ')}</td>
            <td>${Array.from(grade6Addresses[address].listas).join(', ')}</td>
            <td>${Array.from(grade3Addresses[address].distritos).join(', ')}</td>
            <td>${Array.from(grade3Addresses[address].listas).join(', ')}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function generateCoincidentSummary(addresses, grade6Addresses, grade3Addresses) {
    const summarySection = document.getElementById('coincidentSummary');
    summarySection.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'summary-card';
    
    if (addresses.length === 0) {
        card.innerHTML = `
            <h3>🎯 Pontos Coincidentes</h3>
            <p><strong>Resultado:</strong> Nenhum ponto coincidente encontrado</p>
            <p>Verifique se há endereços idênticos em ambas as grades</p>
            <p><em>Dica:</em> Certifique-se de que os endereços estão formatados de forma consistente</p>
        `;
    } else {
        const grade6Lists = new Set();
        const grade3Lists = new Set();
        const grade6Districts = new Set();
        const grade3Districts = new Set();
        
        addresses.forEach(address => {
            Array.from(grade6Addresses[address].listas).forEach(lista => grade6Lists.add(lista));
            Array.from(grade3Addresses[address].listas).forEach(lista => grade3Lists.add(lista));
            Array.from(grade6Addresses[address].distritos).forEach(distrito => grade6Districts.add(distrito));
            Array.from(grade3Addresses[address].distritos).forEach(distrito => grade3Districts.add(distrito));
        });

        card.innerHTML = `
            <h3>🎯 Resumo de Pontos Coincidentes</h3>
            <p><strong>Total de Pontos Coincidentes:</strong> ${addresses.length}</p>
            <p><strong>Grade 6:</strong> ${grade6Lists.size} listas em ${grade6Districts.size} distritos</p>
            <p><strong>Grade 3:</strong> ${grade3Lists.size} listas em ${grade3Districts.size} distritos</p>
            <p><em>Distritos Grade 6:</em> ${Array.from(grade6Districts).join(', ')}</p>
            <p><em>Distritos Grade 3:</em> ${Array.from(grade3Districts).join(', ')}</p>
        `;
    }
    
    summarySection.appendChild(card);
}

function generateSummary(data) {
    const summarySection = document.getElementById('summarySection');
    summarySection.innerHTML = '';

    if (data.length === 0) {
        const card = document.createElement('div');
        card.className = 'summary-card';
        card.innerHTML = `
            <h3>📊 Resumo</h3>
            <p>Nenhum dado encontrado com os filtros aplicados</p>
        `;
        summarySection.appendChild(card);
        return;
    }

    // Resumo por Grade
    const grades = ['3', '6'];
    grades.forEach(grade => {
        const gradeData = data.filter(row => row.grade === grade);
        if (gradeData.length > 0) {
            const totalObjetos = gradeData.reduce((sum, row) => sum + row.totalObjetos, 0);
            const totalPontos = gradeData.reduce((sum, row) => sum + row.totalPontos, 0);

            const card = document.createElement('div');
            card.className = 'summary-card';
            card.innerHTML = `
                <h3>🔢 Grade ${grade}</h3>
                <p><strong>Distritos:</strong> ${gradeData.length}</p>
                <p><strong>Total de Objetos:</strong> ${totalObjetos.toLocaleString()}</p>
                <p><strong>Total de Pontos:</strong> ${totalPontos.toLocaleString()}</p>
                <p><strong>Média Objetos/Distrito:</strong> ${(totalObjetos / gradeData.length).toFixed(1)}</p>
            `;
            summarySection.appendChild(card);
        }
    });

    // Resumo por Lado
    const lados = ['A', 'B'];
    lados.forEach(lado => {
        const ladoData = data.filter(row => row.lado === lado);
        if (ladoData.length > 0) {
            const totalObjetos = ladoData.reduce((sum, row) => sum + row.totalObjetos, 0);
            const totalPontos = ladoData.reduce((sum, row) => sum + row.totalPontos, 0);

            const card = document.createElement('div');
            card.className = 'summary-card';
            card.innerHTML = `
                <h3>↔️ Lado ${lado}</h3>
                <p><strong>Distritos:</strong> ${ladoData.length}</p>
                <p><strong>Total de Objetos:</strong> ${totalObjetos.toLocaleString()}</p>
                <p><strong>Total de Pontos:</strong> ${totalPontos.toLocaleString()}</p>
                <p><strong>Média Objetos/Distrito:</strong> ${(totalObjetos / ladoData.length).toFixed(1)}</p>
            `;
            summarySection.appendChild(card);
        }
    });

    // Resumo Geral
    const totalObjetos = data.reduce((sum, row) => sum + row.totalObjetos, 0);
    const totalPontos = data.reduce((sum, row) => sum + row.totalPontos, 0);

    const card = document.createElement('div');
    card.className = 'summary-card';
    card.innerHTML = `
        <h3>📈 Resumo Geral</h3>
        <p><strong>Total de Distritos:</strong> ${data.length}</p>
        <p><strong>Total de Objetos:</strong> ${totalObjetos.toLocaleString()}</p>
        <p><strong>Total de Pontos:</strong> ${totalPontos.toLocaleString()}</p>
        <p><strong>Eficiência:</strong> ${totalPontos > 0 ? (totalObjetos / totalPontos).toFixed(2) : 0} objetos/ponto</p>
    `;
    summarySection.appendChild(card);
}

function sortTable(column) {
    const rows = Array.from(document.querySelectorAll('#reportTable tbody tr'));
    
    if (rows.length === 0 || (rows.length === 1 && rows[0].cells.length === 1)) {
        return;
    }
    
    // Alternar direção da ordenação
    sortDirection[column] = sortDirection[column] === 'asc' ? 'desc' : 'asc';
    const direction = sortDirection[column];
    
    const sortedRows = rows.sort((a, b) => {
        const cellA = a.querySelector(`td:nth-child(${getColumnIndex(column)})`).textContent.trim();
        const cellB = b.querySelector(`td:nth-child(${getColumnIndex(column)})`).textContent.trim();
        
        let comparison = 0;
        if (column === 'totalObjetos' || column === 'totalPontos') {
            comparison = parseInt(cellA) - parseInt(cellB);
        } else {
            comparison = cellA.localeCompare(cellB, undefined, { numeric: true });
        }
        
        return direction === 'asc' ? comparison : -comparison;
    });

    const reportTableBody = document.querySelector('#reportTable tbody');
    reportTableBody.innerHTML = '';
    sortedRows.forEach(row => reportTableBody.appendChild(row));
    
    // Atualizar indicador visual
    document.querySelectorAll('#reportTable th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });
    
    const currentTh = document.querySelector(`#reportTable th[data-column="${column}"]`);
    currentTh.classList.add(`sorted-${direction}`);
    
    showNotification(`Tabela ordenada por ${getColumnName(column)} (${direction === 'asc' ? 'crescente' : 'decrescente'})`, 'info');
}

function getColumnIndex(column) {
    const columns = {
        'distrito': 1,
        'funcionario': 2,
        'lista': 3,
        'totalObjetos': 4,
        'totalPontos': 5
    };
    return columns[column] || 1;
}

function getColumnName(column) {
    const names = {
        'distrito': 'Distrito',
        'funcionario': 'Funcionário',
        'lista': 'Lista',
        'totalObjetos': 'Total de Objetos',
        'totalPontos': 'Total de Pontos'
    };
    return names[column] || column;
}

// Funções de exportação
function exportToExcel() {
    const data = getCurrentTableData();
    if (data.length === 0) {
        showNotification('Nenhum dado para exportar', 'warning');
        return;
    }
    
    const csv = convertToCSV(data);
    downloadFile(csv, 'relatorio_pontos.csv', 'text/csv');
    showNotification('Dados exportados para CSV (compatível com Excel)', 'success');
}

function exportToCSV() {
    const data = getCurrentTableData();
    if (data.length === 0) {
        showNotification('Nenhum dado para exportar', 'warning');
        return;
    }
    
    const csv = convertToCSV(data);
    downloadFile(csv, 'relatorio_pontos.csv', 'text/csv');
    showNotification('Dados exportados para CSV', 'success');
}

function getCurrentTableData() {
    const rows = document.querySelectorAll('#reportTable tbody tr');
    const data = [];
    
    // Cabeçalho
    data.push(['Distrito', 'Funcionário', 'Número da Lista', 'Total de Objetos', 'Total de Pontos']);
    
    rows.forEach(row => {
        if (row.cells.length === 5) {
            const rowData = [];
            for (let i = 0; i < row.cells.length; i++) {
                rowData.push(row.cells[i].textContent.trim());
            }
            data.push(rowData);
        }
    });
    
    return data;
}

function convertToCSV(data) {
    return data.map(row => 
        row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function toggleLoading(show, buttonId = null) {
    const buttons = ['generateReport', 'findCoincidentPoints', 'generatePrazoReport', 'generateDistribuicaoReport', 'generateDevolucaoReport'];
    
    buttons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            if (show && (!buttonId || id === buttonId)) {
                btn.disabled = true;
                if (!btn.querySelector('.loading')) {
                    btn.innerHTML += '<span class="loading"></span>';
                }
            } else {
                btn.disabled = false;
                const loading = btn.querySelector('.loading');
                if (loading) {
                    loading.remove();
                }
            }
        }
    });
}

function clearReports() {
    document.querySelector('#reportTable tbody').innerHTML = '';
    document.getElementById('summarySection').innerHTML = '';
    document.getElementById('coincidentPointsSection').style.display = 'none';
}

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        animation: slideInRight 0.3s ease;
    `;
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    
    const closeBtn = notification.querySelector('button');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Adicionar estilos para animação da notificação e ordenação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .sorted-asc::after {
        content: ' ↑';
        color: var(--primary-color);
    }
    
    .sorted-desc::after {
        content: ' ↓';
        color: var(--primary-color);
    }
`;
document.head.appendChild(style);



// Funções da Aba de Acompanhamento de Distribuição

function generateDistribuicaoReport() {
    const listDatabase = document.getElementById('listDatabase').value.trim();
    const objectDatabase = document.getElementById('objectDatabase').value.trim();
    const distribuicaoDatabase = document.getElementById('distribuicaoDatabase').value.trim();

    if (!listDatabase || !objectDatabase || !distribuicaoDatabase) {
        showNotification('Por favor, configure os bancos de dados de Lista, Objetos e Distribuição primeiro.', 'warning');
        openModal();
        return;
    }

    isProcessing = true;
    toggleLoading(true, 'generateDistribuicaoReport');

    setTimeout(() => {
        try {
            currentListData = parseListDatabase(listDatabase);
            currentObjectData = parseObjectDatabase(objectDatabase);
            currentDistribuicaoData = parseDistribuicaoDatabase(distribuicaoDatabase);

            if (currentListData.length === 0 || currentObjectData.length === 0 || currentDistribuicaoData.length === 0) {
                throw new Error('Os dados inseridos não estão no formato esperado. Verifique os bancos de dados.');
            }

            // Cruzar dados de distribuição com distritos
            const distribuicaoComDistrito = currentDistribuicaoData.map(dist => {
                // Encontrar o objeto no banco de objetos
                const objetoInfo = currentObjectData.find(obj => obj.objeto === dist.objeto);
                if (objetoInfo) {
                    // Encontrar o distrito através da lista
                    const listaInfo = currentListData.find(lista => lista.lista === objetoInfo.lista);
                    if (listaInfo) {
                        return {
                            ...dist,
                            distrito: listaInfo.distrito,
                            endereco: objetoInfo.endereco
                        };
                    }
                }
                return {
                    ...dist,
                    distrito: 'Não encontrado',
                    endereco: 'Não encontrado'
                };
            });

            // Atualizar filtros de distrito
            updateDistritoFilters('distribuicaoDistritoFilter');
            
            // Aplicar filtros e gerar relatório
            applyDistribuicaoFilters(distribuicaoComDistrito);
            
            showNotification('Relatório de acompanhamento gerado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao gerar relatório de distribuição:', error);
            showNotification('Erro ao gerar relatório: ' + error.message, 'error');
        } finally {
            isProcessing = false;
            toggleLoading(false);
        }
    }, 100);
}

function applyDistribuicaoFilters(data = null) {
    const distribuicaoData = data || currentDistribuicaoData.map(dist => {
        const objetoInfo = currentObjectData.find(obj => obj.objeto === dist.objeto);
        if (objetoInfo) {
            const listaInfo = currentListData.find(lista => lista.lista === objetoInfo.lista);
            if (listaInfo) {
                return {
                    ...dist,
                    distrito: listaInfo.distrito,
                    endereco: objetoInfo.endereco
                };
            }
        }
        return {
            ...dist,
            distrito: 'Não encontrado',
            endereco: 'Não encontrado'
        };
    });

    const distritoFilter = document.getElementById('distribuicaoDistritoFilter').value;
    
    let filteredData = [...distribuicaoData];
    
    if (distritoFilter) {
        filteredData = filteredData.filter(item => item.distrito === distritoFilter);
    }
    
    // Ordenar por horário de baixa
    filteredData.sort((a, b) => a.horario_baixa - b.horario_baixa);
    
    updateItinerarioTable(filteredData);
    generateEstatisticasDistribuicao(distribuicaoData);
    updateDistribuicaoSummary(filteredData);
}

function updateItinerarioTable(data) {
    const tableBody = document.querySelector('#itinerarioTable tbody');
    const itinerarioSection = document.getElementById('itinerarioSection');
    
    if (data.length === 0) {
        itinerarioSection.style.display = 'none';
        return;
    }
    
    itinerarioSection.style.display = 'block';
    tableBody.innerHTML = '';
    
    data.forEach((item, index) => {
        const row = document.createElement('tr');
        
        // Calcular tempo desde a última baixa
        let tempoDesdeUltima = '';
        let isAlert = false;
        
        if (index > 0) {
            const diffMs = item.horario_baixa - data[index - 1].horario_baixa;
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            
            if (diffMinutes > 12) {
                isAlert = true;
                tempoDesdeUltima = `${diffMinutes} min`;
            } else {
                tempoDesdeUltima = `${diffMinutes} min`;
            }
        } else {
            tempoDesdeUltima = 'Primeira entrega';
        }
        
        if (isAlert) {
            row.classList.add('alert-row');
        }
        
        row.innerHTML = `
            <td>${item.objeto}</td>
            <td>${item.endereco || 'Endereço não encontrado'}</td>
            <td>${formatDateTime(item.horario_baixa)}</td>
            <td>${item.status}</td>
            <td class="${isAlert ? 'alert-time' : ''}">${tempoDesdeUltima}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

function generateEstatisticasDistribuicao(data) {
    const estatisticasSection = document.getElementById('estatisticasSection');
    const estatisticasGrid = document.getElementById('estatisticasGrid');
    const estatisticasTableBody = document.querySelector('#estatisticasTable tbody');
    
    if (data.length === 0) {
        estatisticasSection.style.display = 'none';
        return;
    }
    
    estatisticasSection.style.display = 'block';
    
    // Contar por status
    const statusCount = {};
    data.forEach(item => {
        statusCount[item.status] = (statusCount[item.status] || 0) + 1;
    });
    
    const total = data.length;
    
    // Atualizar grid de resumo
    const entregues = (statusCount['OBJETO DISTRIBUIDO'] || 0) + (statusCount['DISTRIBUIDO AO REMETENTE'] || 0);
    const devolvidos = total - entregues;
    
    estatisticasGrid.innerHTML = `
        <div class="summary-card">
            <h3>Total de Objetos</h3>
            <p class="summary-number">${total}</p>
        </div>
        <div class="summary-card success">
            <h3>Entregues</h3>
            <p class="summary-number">${entregues}</p>
            <p class="summary-percentage">${((entregues / total) * 100).toFixed(1)}%</p>
        </div>
        <div class="summary-card warning">
            <h3>Devolvidos</h3>
            <p class="summary-number">${devolvidos}</p>
            <p class="summary-percentage">${((devolvidos / total) * 100).toFixed(1)}%</p>
        </div>
    `;
    
    // Atualizar tabela de estatísticas
    estatisticasTableBody.innerHTML = '';
    
    Object.entries(statusCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([status, count]) => {
            const row = document.createElement('tr');
            const percentage = ((count / total) * 100).toFixed(1);
            
            row.innerHTML = `
                <td>${status}</td>
                <td>${count}</td>
                <td>${percentage}%</td>
            `;
            
            estatisticasTableBody.appendChild(row);
        });
}

function updateDistribuicaoSummary(data) {
    const summarySection = document.getElementById('distribuicaoSummarySection');
    
    if (data.length === 0) {
        summarySection.innerHTML = '<p>Nenhum dado encontrado para o filtro selecionado.</p>';
        return;
    }
    
    const distritoFilter = document.getElementById('distribuicaoDistritoFilter').value;
    const titulo = distritoFilter ? `Distrito: ${distritoFilter}` : 'Todos os Distritos';
    
    summarySection.innerHTML = `
        <div class="summary-card">
            <h3>${titulo}</h3>
            <p class="summary-number">${data.length}</p>
            <p class="summary-text">objetos processados</p>
        </div>
    `;
}

function formatDateTime(date) {
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Funções da Aba de Conferência de Devoluções

let devolucaoExpectedObjects = [];
let devolucaoScannedObjects = [];

function generateDevolucaoReport() {
    const listDatabase = document.getElementById('listDatabase').value.trim();
    const objectDatabase = document.getElementById('objectDatabase').value.trim();
    const distribuicaoDatabase = document.getElementById('distribuicaoDatabase').value.trim();

    if (!listDatabase || !objectDatabase || !distribuicaoDatabase) {
        showNotification('Por favor, configure os bancos de dados de Lista, Objetos e Distribuição primeiro.', 'warning');
        openModal();
        return;
    }

    isProcessing = true;
    toggleLoading(true, 'generateDevolucaoReport');

    setTimeout(() => {
        try {
            currentListData = parseListDatabase(listDatabase);
            currentObjectData = parseObjectDatabase(objectDatabase);
            currentDistribuicaoData = parseDistribuicaoDatabase(distribuicaoDatabase);

            if (currentListData.length === 0 || currentObjectData.length === 0 || currentDistribuicaoData.length === 0) {
                throw new Error('Os dados inseridos não estão no formato esperado. Verifique os bancos de dados.');
            }

            // Atualizar filtros de distrito
            updateDistritoFilters('devolucaoDistritoFilter');
            
            showNotification('Dados carregados! Selecione um distrito para ver as devoluções.', 'success');
            
        } catch (error) {
            console.error('Erro ao gerar relatório de devoluções:', error);
            showNotification('Erro ao carregar dados: ' + error.message, 'error');
        } finally {
            isProcessing = false;
            toggleLoading(false);
        }
    }, 100);
}

function updateDevolucaoExpectedObjects() {
    const distrito = document.getElementById('devolucaoDistritoFilter').value;
    
    if (!distrito) {
        document.getElementById('devolucaoEsperadaSection').style.display = 'none';
        document.getElementById('devolucaoConferenciaSection').style.display = 'none';
        updateDevolucaoSummary();
        return;
    }

    // Encontrar objetos do distrito que devem ser devolvidos
    const objetosDistrito = [];
    
    // Primeiro, encontrar todas as listas do distrito
    const listasDistrito = currentListData.filter(lista => lista.distrito === distrito);
    
    // Para cada lista, encontrar os objetos
    listasDistrito.forEach(lista => {
        const objetosLista = currentObjectData.filter(obj => obj.lista === lista.lista);
        objetosLista.forEach(obj => {
            // Verificar se o objeto tem status de devolução
            const distribuicaoInfo = currentDistribuicaoData.find(dist => dist.objeto === obj.objeto);
            if (distribuicaoInfo) {
                // Considerar devolução se não for "OBJETO DISTRIBUIDO" ou "DISTRIBUIDO AO REMETENTE"
                const statusEntrega = ['OBJETO DISTRIBUIDO', 'DISTRIBUIDO AO REMETENTE'];
                if (!statusEntrega.includes(distribuicaoInfo.status)) {
                    objetosDistrito.push({
                        objeto: obj.objeto,
                        endereco: obj.endereco,
                        status: distribuicaoInfo.status,
                        situacao: 'Pendente'
                    });
                }
            }
        });
    });

    devolucaoExpectedObjects = objetosDistrito;
    
    // Atualizar a tabela de objetos esperados
    updateDevolucaoEsperadaTable();
    
    // Atualizar conferência se já houver objetos escaneados
    updateDevolucaoConferenciaTable();
    
    // Atualizar resumo
    updateDevolucaoSummary();
    
    document.getElementById('devolucaoDistritoTitle').textContent = distrito;
    document.getElementById('devolucaoEsperadaSection').style.display = 'block';
    
    if (devolucaoScannedObjects.length > 0) {
        document.getElementById('devolucaoConferenciaSection').style.display = 'block';
    }
}

function updateDevolucaoEsperadaTable() {
    const tableBody = document.querySelector('#devolucaoEsperadaTable tbody');
    tableBody.innerHTML = '';
    
    devolucaoExpectedObjects.forEach(obj => {
        const row = document.createElement('tr');
        
        // Verificar se foi conferido
        const isConferido = devolucaoScannedObjects.some(scanned => scanned.objeto === obj.objeto);
        const situacaoClass = isConferido ? 'conferido' : 'pendente';
        const situacaoText = isConferido ? '🟢 Conferido' : '⏳ Pendente';
        
        row.innerHTML = `
            <td>${obj.objeto}</td>
            <td>${obj.status}</td>
            <td>${obj.endereco}</td>
            <td class="${situacaoClass}">${situacaoText}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

function addObjetoDevolucao() {
    const input = document.getElementById('devolucaoObjetoInput');
    const objeto = input.value.trim().toUpperCase();
    
    if (!objeto) {
        showNotification('Digite o número do objeto.', 'warning');
        return;
    }
    
    if (!validateObjetoFormat(objeto)) {
        showNotification('Formato do objeto inválido. Use o formato: AB123456789BR', 'error');
        return;
    }
    
    // Verificar se já foi adicionado
    if (devolucaoScannedObjects.some(scanned => scanned.objeto === objeto)) {
        showNotification('Objeto já foi adicionado à conferência.', 'warning');
        return;
    }
    
    // Verificar se é esperado para este distrito
    const expectedObj = devolucaoExpectedObjects.find(exp => exp.objeto === objeto);
    
    let situacao, status, endereco;
    
    if (expectedObj) {
        situacao = '🟢 Conferido';
        status = expectedObj.status;
        endereco = expectedObj.endereco;
    } else {
        // Verificar se existe no banco de dados geral
        const objetoInfo = currentObjectData.find(obj => obj.objeto === objeto);
        if (objetoInfo) {
            const distribuicaoInfo = currentDistribuicaoData.find(dist => dist.objeto === objeto);
            situacao = '🟡 Sobra';
            status = distribuicaoInfo ? distribuicaoInfo.status : 'Status não encontrado';
            endereco = objetoInfo.endereco;
        } else {
            situacao = '🔴 Não encontrado';
            status = 'Não encontrado';
            endereco = 'Não encontrado';
        }
    }
    
    devolucaoScannedObjects.push({
        objeto: objeto,
        status: status,
        endereco: endereco,
        situacao: situacao
    });
    
    // Limpar campo
    input.value = '';
    input.classList.remove('valid-format', 'invalid-format');
    
    // Atualizar tabelas
    updateDevolucaoEsperadaTable();
    updateDevolucaoConferenciaTable();
    updateDevolucaoSummary();
    
    // Mostrar seção de conferência
    document.getElementById('devolucaoConferenciaSection').style.display = 'block';
    
    // Focar no campo para próximo objeto
    input.focus();
}

function updateDevolucaoConferenciaTable() {
    const tableBody = document.querySelector('#devolucaoConferenciaTable tbody');
    tableBody.innerHTML = '';
    
    devolucaoScannedObjects.forEach(obj => {
        const row = document.createElement('tr');
        
        let rowClass = '';
        if (obj.situacao.includes('Conferido')) rowClass = 'conferido';
        else if (obj.situacao.includes('Sobra')) rowClass = 'sobra';
        else if (obj.situacao.includes('Não encontrado')) rowClass = 'nao-encontrado';
        
        row.className = rowClass;
        
        row.innerHTML = `
            <td>${obj.objeto}</td>
            <td>${obj.status}</td>
            <td>${obj.endereco}</td>
            <td>${obj.situacao}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

function updateDevolucaoSummary() {
    const summarySection = document.getElementById('devolucaoSummarySection');
    const distrito = document.getElementById('devolucaoDistritoFilter').value;
    
    if (!distrito) {
        summarySection.innerHTML = '<p>Selecione um distrito para ver as devoluções esperadas.</p>';
        return;
    }
    
    const totalEsperado = devolucaoExpectedObjects.length;
    const totalConferido = devolucaoScannedObjects.filter(obj => obj.situacao.includes('Conferido')).length;
    const totalSobra = devolucaoScannedObjects.filter(obj => obj.situacao.includes('Sobra')).length;
    const totalNaoEncontrado = devolucaoScannedObjects.filter(obj => obj.situacao.includes('Não encontrado')).length;
    const totalFaltante = totalEsperado - totalConferido;
    
    const percentualConferido = totalEsperado > 0 ? ((totalConferido / totalEsperado) * 100).toFixed(1) : 0;
    
    summarySection.innerHTML = `
        <div class="summary-card">
            <h3>Distrito: ${distrito}</h3>
            <p class="summary-number">${totalEsperado}</p>
            <p class="summary-text">devoluções esperadas</p>
        </div>
        <div class="summary-card success">
            <h3>🟢 Conferidos</h3>
            <p class="summary-number">${totalConferido}</p>
            <p class="summary-percentage">${percentualConferido}%</p>
        </div>
        <div class="summary-card warning">
            <h3>🔴 Faltantes</h3>
            <p class="summary-number">${totalFaltante}</p>
        </div>
        <div class="summary-card info">
            <h3>🟡 Sobras</h3>
            <p class="summary-number">${totalSobra}</p>
        </div>
        ${totalNaoEncontrado > 0 ? `
        <div class="summary-card danger">
            <h3>❌ Não Encontrados</h3>
            <p class="summary-number">${totalNaoEncontrado}</p>
        </div>
        ` : ''}
    `;
}

function clearDevolucao() {
    if (confirm('Tem certeza que deseja limpar a lista de conferência?')) {
        devolucaoScannedObjects = [];
        
        // Atualizar tabelas
        updateDevolucaoEsperadaTable();
        document.getElementById('devolucaoConferenciaSection').style.display = 'none';
        updateDevolucaoSummary();
        
        // Limpar campo
        const input = document.getElementById('devolucaoObjetoInput');
        input.value = '';
        input.classList.remove('valid-format', 'invalid-format');
        
        showNotification('Lista de conferência limpa!', 'info');
    }
}

// Funções de limpeza para as novas abas

function clearDistribuicaoReport() {
    document.getElementById('distribuicaoSummarySection').innerHTML = '';
    document.getElementById('itinerarioSection').style.display = 'none';
    document.getElementById('estatisticasSection').style.display = 'none';
    document.querySelector('#itinerarioTable tbody').innerHTML = '';
    document.querySelector('#estatisticasTable tbody').innerHTML = '';
    document.getElementById('estatisticasGrid').innerHTML = '';
}

function clearDevolucaoReport() {
    document.getElementById('devolucaoSummarySection').innerHTML = '';
    document.getElementById('devolucaoEsperadaSection').style.display = 'none';
    document.getElementById('devolucaoConferenciaSection').style.display = 'none';
    document.querySelector('#devolucaoEsperadaTable tbody').innerHTML = '';
    document.querySelector('#devolucaoConferenciaTable tbody').innerHTML = '';
    document.getElementById('devolucaoObjetoInput').value = '';
    document.getElementById('devolucaoObjetoInput').classList.remove('valid-format', 'invalid-format');
    devolucaoExpectedObjects = [];
    devolucaoScannedObjects = [];
}

// Funções do Modal de Ajuda

function openHelpModal() {
    document.getElementById('helpModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeHelpModal() {
    document.getElementById('helpModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function openHelpNewWindow() {
    window.open('help_guide_complete.html', '_blank', 'width=1000,height=700,scrollbars=yes,resizable=yes');
}

// Funções de Exportação e Importação JSON

function exportToJson() {
    try {
        const data = {
            version: "5.8.0",
            timestamp: new Date().toISOString(),
            databases: {
                listDatabase: document.getElementById('listDatabase').value.trim(),
                objectDatabase: document.getElementById('objectDatabase').value.trim(),
                prazoDatabase: document.getElementById('prazoDatabase').value.trim(),
                distribuicaoDatabase: document.getElementById('distribuicaoDatabase').value.trim()
            }
        };
        
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_integrado_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Dados exportados com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        showNotification('Erro ao exportar dados: ' + error.message, 'error');
    }
}

function importFromJson(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validar estrutura do JSON
            if (!data.databases) {
                throw new Error('Formato de arquivo inválido: estrutura de bancos de dados não encontrada');
            }
            
            // Confirmar importação
            if (confirm('Tem certeza que deseja importar os dados? Isso substituirá os dados atuais.')) {
                // Carregar dados nos campos
                document.getElementById('listDatabase').value = data.databases.listDatabase || '';
                document.getElementById('objectDatabase').value = data.databases.objectDatabase || '';
                document.getElementById('prazoDatabase').value = data.databases.prazoDatabase || '';
                document.getElementById('distribuicaoDatabase').value = data.databases.distribuicaoDatabase || '';
                
                showNotification(`Dados importados com sucesso! Versão: ${data.version || 'Desconhecida'}`, 'success');
            }
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            showNotification('Erro ao importar dados: ' + error.message, 'error');
        }
        
        // Limpar o input file
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

// Funções da Aba de Gerenciamento de Objetos

let currentObjetoInfo = null;
let movimentacoesHistorico = JSON.parse(localStorage.getItem('movimentacoesHistorico') || '[]');

function searchObjeto() {
    const objetoInput = document.getElementById('objetoSearchInput');
    const objeto = objetoInput.value.trim().toUpperCase();
    
    if (!objeto) {
        showNotification('Digite o número do objeto.', 'warning');
        return;
    }
    
    if (!validateObjetoFormat(objeto)) {
        showNotification('Formato do objeto inválido. Use o formato: AB123456789BR', 'error');
        return;
    }
    
    if (currentObjectData.length === 0) {
        showNotification('Por favor, carregue os bancos de dados primeiro.', 'warning');
        switchTab('relatorio-principal');
        return;
    }
    
    // Buscar o objeto nos dados
    const objetoInfo = currentObjectData.find(obj => obj.objeto === objeto);
    
    if (!objetoInfo) {
        showNotification('Objeto não encontrado no sistema.', 'error');
        hideObjetoInfo();
        return;
    }
    
    // Buscar informações da lista e distrito
    const listaInfo = currentListData.find(list => list.lista === objetoInfo.lista);
    
    if (!listaInfo) {
        showNotification('Lista do objeto não encontrada.', 'error');
        hideObjetoInfo();
        return;
    }
    
    currentObjetoInfo = {
        objeto: objetoInfo.objeto,
        endereco: objetoInfo.endereco,
        lista: objetoInfo.lista,
        distrito: listaInfo.distrito,
        funcionario: listaInfo.funcionario
    };
    
    displayObjetoInfo(currentObjetoInfo);
    showNotification('Objeto encontrado!', 'success');
}

function displayObjetoInfo(info) {
    document.getElementById('objetoNumero').textContent = info.objeto;
    document.getElementById('objetoEndereco').textContent = info.endereco;
    document.getElementById('objetoListaAtual').textContent = info.lista;
    document.getElementById('objetoDistritoAtual').textContent = info.distrito;
    document.getElementById('objetoFuncionarioAtual').textContent = info.funcionario;
    
    document.getElementById('objetoInfoSection').style.display = 'block';
    document.getElementById('movimentacaoSection').style.display = 'block';
    
    // Atualizar opções de distrito
    updateDistritoOptions();
    
    // Carregar histórico
    updateHistoricoTable();
}

function hideObjetoInfo() {
    document.getElementById('objetoInfoSection').style.display = 'none';
    document.getElementById('movimentacaoSection').style.display = 'none';
    currentObjetoInfo = null;
}

function updateDistritoOptions() {
    const select = document.getElementById('novoDistritoSelect');
    
    // Limpar opções existentes (exceto a primeira)
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }
    
    // Obter distritos únicos
    const distritos = [...new Set(currentListData.map(item => item.distrito))].sort();
    
    distritos.forEach(distrito => {
        // Não incluir o distrito atual
        if (distrito !== currentObjetoInfo.distrito) {
            const option = document.createElement('option');
            option.value = distrito;
            option.textContent = distrito;
            select.appendChild(option);
        }
    });
    
    // Resetar seleções
    select.value = '';
    document.getElementById('novaListaSelect').innerHTML = '<option value="">Selecione uma lista</option>';
    document.getElementById('confirmarMovimentacaoBtn').disabled = true;
}

function updateNovaListaOptions() {
    const distritoSelect = document.getElementById('novoDistritoSelect');
    const listaSelect = document.getElementById('novaListaSelect');
    const selectedDistrito = distritoSelect.value;
    
    // Limpar opções de lista
    listaSelect.innerHTML = '<option value="">Selecione uma lista</option>';
    
    if (!selectedDistrito) {
        document.getElementById('confirmarMovimentacaoBtn').disabled = true;
        return;
    }
    
    // Obter listas do distrito selecionado
    const listasDistrito = currentListData.filter(item => item.distrito === selectedDistrito);
    
    listasDistrito.forEach(item => {
        const option = document.createElement('option');
        option.value = item.lista;
        option.textContent = `${item.lista} (${item.funcionario})`;
        listaSelect.appendChild(option);
    });
    
    validateMovimentacao();
}

function validateMovimentacao() {
    const novoDistrito = document.getElementById('novoDistritoSelect').value;
    const novaLista = document.getElementById('novaListaSelect').value;
    const confirmBtn = document.getElementById('confirmarMovimentacaoBtn');
    
    if (novoDistrito && novaLista) {
        confirmBtn.disabled = false;
    } else {
        confirmBtn.disabled = true;
    }
}

function confirmarMovimentacao() {
    const novoDistrito = document.getElementById('novoDistritoSelect').value;
    const novaLista = document.getElementById('novaListaSelect').value;
    
    if (!novoDistrito || !novaLista) {
        showNotification('Selecione o distrito e a lista de destino.', 'warning');
        return;
    }
    
    const novaListaInfo = currentListData.find(item => item.lista === novaLista);
    
    if (!novaListaInfo) {
        showNotification('Erro: Lista de destino não encontrada.', 'error');
        return;
    }
    
    const confirmMessage = `Confirma a movimentação do objeto ${currentObjetoInfo.objeto}?\n\n` +
                          `DE: ${currentObjetoInfo.distrito} - Lista ${currentObjetoInfo.lista} (${currentObjetoInfo.funcionario})\n` +
                          `PARA: ${novoDistrito} - Lista ${novaLista} (${novaListaInfo.funcionario})`;
    
    if (confirm(confirmMessage)) {
        executarMovimentacao(novoDistrito, novaLista, novaListaInfo.funcionario);
    }
}

function executarMovimentacao(novoDistrito, novaLista, novoFuncionario) {
    try {
        // Registrar no histórico
        const movimentacao = {
            timestamp: new Date().toISOString(),
            objeto: currentObjetoInfo.objeto,
            deDistrito: currentObjetoInfo.distrito,
            deLista: currentObjetoInfo.lista,
            deFuncionario: currentObjetoInfo.funcionario,
            paraDistrito: novoDistrito,
            paraLista: novaLista,
            paraFuncionario: novoFuncionario,
            usuario: 'Sistema' // Pode ser expandido para incluir login de usuário
        };
        
        movimentacoesHistorico.unshift(movimentacao);
        localStorage.setItem('movimentacoesHistorico', JSON.stringify(movimentacoesHistorico));
        
        // Atualizar os dados internos
        const objetoIndex = currentObjectData.findIndex(obj => obj.objeto === currentObjetoInfo.objeto);
        if (objetoIndex !== -1) {
            currentObjectData[objetoIndex].lista = novaLista;
        }
        
        // Atualizar localStorage com os dados modificados
        const listDatabase = document.getElementById('listDatabase').value.trim();
        const objectDatabase = document.getElementById('objectDatabase').value.trim();
        const prazoDatabase = document.getElementById('prazoDatabase').value.trim();
        const distribuicaoDatabase = document.getElementById('distribuicaoDatabase').value.trim();
        
        // Reconstruir o banco de objetos com a alteração
        const originalLines = objectDatabase.split('\n');
        const updatedLines = originalLines.map(line => {
            if (line.includes(currentObjetoInfo.objeto)) {
                const parts = line.split('\t');
                parts[0] = novaLista; // Primeira coluna é a lista
                return parts.join('\t');
            }
            return line;
        });
        
        const updatedObjectDatabase = updatedLines.join('\n');
        
        // Atualizar o campo de texto
        document.getElementById('objectDatabase').value = updatedObjectDatabase;
        
        // Salvar no localStorage
        localStorage.setItem('objectDatabase', updatedObjectDatabase);
        
        // Reprocessar todos os dados para refletir as mudanças
        currentListData = parseListDatabase(listDatabase);
        currentObjectData = parseObjectDatabase(updatedObjectDatabase);
        if (prazoDatabase) {
            currentPrazoData = parsePrazoDatabase(prazoDatabase);
        }
        if (distribuicaoDatabase) {
            currentDistribuicaoData = parseDistribuicaoDatabase(distribuicaoDatabase);
        }
        
        // Regenerar relatórios se já foram gerados
        if (currentReportData.length > 0) {
            // Regenerar dados do relatório principal
            currentReportData = currentListData.map(entry => {
                const relatedObjects = currentObjectData.filter(obj => obj.lista === entry.lista);
                const totalObjetos = relatedObjects.length;
                const uniqueEnderecos = new Set(relatedObjects.map(obj => obj.endereco).filter(e => e)).size;

                return {
                    distrito: entry.distrito,
                    funcionario: entry.funcionario,
                    lista: entry.lista,
                    totalObjetos: totalObjetos,
                    totalPontos: uniqueEnderecos,
                    grade: entry.distrito[0],
                    lado: entry.distrito.slice(-1)
                };
            });
            
            applyFilters();
        }
        
        // Atualizar filtros de distrito em todas as abas
        updateDistritoFilters('prazoDistritoFilter');
        updateDistritoFilters('conferenciaDistritoFilter');
        updateDistritoFilters('distribuicaoDistritoFilter');
        updateDistritoFilters('devolucaoDistritoFilter');
        
        // Atualizar informações exibidas
        currentObjetoInfo.lista = novaLista;
        currentObjetoInfo.distrito = novoDistrito;
        currentObjetoInfo.funcionario = novoFuncionario;
        
        displayObjetoInfo(currentObjetoInfo);
        
        showNotification(`Objeto ${currentObjetoInfo.objeto} movido com sucesso para ${novoDistrito} - Lista ${novaLista}!`, 'success');
        
        // Limpar seleções
        document.getElementById('novoDistritoSelect').value = '';
        document.getElementById('novaListaSelect').innerHTML = '<option value="">Selecione uma lista</option>';
        document.getElementById('confirmarMovimentacaoBtn').disabled = true;
        
    } catch (error) {
        console.error('Erro ao executar movimentação:', error);
        showNotification('Erro ao executar movimentação: ' + error.message, 'error');
    }
}

function cancelarMovimentacao() {
    document.getElementById('novoDistritoSelect').value = '';
    document.getElementById('novaListaSelect').innerHTML = '<option value="">Selecione uma lista</option>';
    document.getElementById('confirmarMovimentacaoBtn').disabled = true;
    hideObjetoInfo();
    document.getElementById('objetoSearchInput').value = '';
    document.getElementById('objetoSearchInput').classList.remove('valid-format', 'invalid-format');
}

function updateHistoricoTable() {
    const tableBody = document.querySelector('#historicoTable tbody');
    tableBody.innerHTML = '';
    
    if (movimentacoesHistorico.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="5" style="text-align: center; color: #666;">Nenhuma movimentação registrada</td>';
        tableBody.appendChild(tr);
        return;
    }
    
    movimentacoesHistorico.slice(0, 50).forEach(mov => { // Mostrar apenas os últimos 50
        const tr = document.createElement('tr');
        const dataHora = new Date(mov.timestamp).toLocaleString('pt-BR');
        
        tr.innerHTML = `
            <td>${dataHora}</td>
            <td>${mov.objeto}</td>
            <td>${mov.deDistrito} / ${mov.deLista}</td>
            <td>${mov.paraDistrito} / ${mov.paraLista}</td>
            <td>${mov.usuario}</td>
        `;
        
        tableBody.appendChild(tr);
    });
}

function exportarHistoricoMovimentacoes() {
    if (movimentacoesHistorico.length === 0) {
        showNotification('Não há movimentações para exportar.', 'warning');
        return;
    }
    
    const csvContent = [
        ['Data/Hora', 'Objeto', 'De (Distrito)', 'De (Lista)', 'De (Funcionário)', 'Para (Distrito)', 'Para (Lista)', 'Para (Funcionário)', 'Usuário'].join(','),
        ...movimentacoesHistorico.map(mov => [
            new Date(mov.timestamp).toLocaleString('pt-BR'),
            mov.objeto,
            mov.deDistrito,
            mov.deLista,
            mov.deFuncionario,
            mov.paraDistrito,
            mov.paraLista,
            mov.paraFuncionario,
            mov.usuario
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico_movimentacoes_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Histórico exportado com sucesso!', 'success');
}

function limparHistoricoMovimentacoes() {
    if (confirm('Tem certeza que deseja limpar todo o histórico de movimentações? Esta ação não pode ser desfeita.')) {
        movimentacoesHistorico = [];
        localStorage.removeItem('movimentacoesHistorico');
        updateHistoricoTable();
        showNotification('Histórico de movimentações limpo!', 'info');
    }
}

// Funções de Ordenação e Filtros para Controle de Prazos

function sortPrazoTable(column) {
    // Alternar direção se a mesma coluna for clicada
    if (prazoSortColumn === column) {
        prazoSortDirection = prazoSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        prazoSortColumn = column;
        prazoSortDirection = 'asc';
    }
    
    // Atualizar indicadores visuais
    updatePrazoSortIndicators();
    
    // Reaplicar filtros (que incluirá a ordenação)
    applyPrazoFilters();
}

function sortPrazoData(data, column, direction) {
    return data.sort((a, b) => {
        let valueA, valueB;
        
        switch (column) {
            case 'distrito':
                valueA = a.distrito;
                valueB = b.distrito;
                break;
            case 'objeto':
                valueA = a.objeto;
                valueB = b.objeto;
                break;
            case 'endereco':
                valueA = a.endereco || '';
                valueB = b.endereco || '';
                break;
            case 'prazoFinal':
                valueA = a.prazoFinal;
                valueB = b.prazoFinal;
                break;
            case 'status':
                // Ordenar por prioridade: Atrasado > Vence Hoje > No Prazo
                const statusOrder = { 'Atrasado': 0, 'Vence Hoje': 1, 'No Prazo': 2 };
                valueA = statusOrder[a.status];
                valueB = statusOrder[b.status];
                break;
            case 'diasRestantes':
                valueA = a.diasRestantes;
                valueB = b.diasRestantes;
                break;
            default:
                return 0;
        }
        
        // Comparação
        let comparison = 0;
        if (valueA > valueB) {
            comparison = 1;
        } else if (valueA < valueB) {
            comparison = -1;
        }
        
        return direction === 'desc' ? comparison * -1 : comparison;
    });
}

function updatePrazoSortIndicators() {
    // Resetar todos os indicadores
    document.querySelectorAll('#prazoTable .sort-indicator').forEach(indicator => {
        indicator.textContent = '↕️';
    });
    
    // Atualizar o indicador da coluna ativa
    if (prazoSortColumn) {
        const activeHeader = document.querySelector(`#prazoTable [data-column="${prazoSortColumn}"] .sort-indicator`);
        if (activeHeader) {
            activeHeader.textContent = prazoSortDirection === 'asc' ? '↑' : '↓';
        }
    }
}

function clearPrazoFilters() {
    // Limpar todos os filtros
    document.getElementById('prazoDistritoFilter').value = '';
    document.getElementById('prazoStatusFilter').value = '';
    document.getElementById('prazoObjetoFilter').value = '';
    document.getElementById('prazoEnderecoFilter').value = '';
    document.getElementById('prazoDiasFilter').value = '';
    
    // Resetar ordenação
    prazoSortColumn = '';
    prazoSortDirection = 'asc';
    updatePrazoSortIndicators();
    
    // Reaplicar filtros (agora limpos)
    applyPrazoFilters();
    
    showNotification('Filtros de prazos limpos!', 'info');
}
