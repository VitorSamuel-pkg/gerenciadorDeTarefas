// Configuração inicial das matérias (cores fixas)
const MATERIAS = [
    { sigla: 'LOPAL', nome: 'Lógica de programação e algoritmos', cor: '#3498db', classe: 'azul' },
    { sigla: 'PBE', nome: 'Programação Back-end', cor: '#2ecc71', classe: 'verde' },
    { sigla: 'SOP', nome: 'Sistemas operacionais', cor: '#e74c3c', classe: 'vermelho' },
    { sigla: 'ARI', nome: 'Aquitetura de redes e IOT', cor: '#f1c40f', classe: 'amarelo' },
    { sigla: 'LIMA', nome: 'Linguagem de marcação', cor: '#9b59b6', classe: 'roxo' },
    { sigla: 'LER', nome: 'Levantamento de requisitos', cor: '#e67e22', classe: 'laranja' } 
];

// Estado da aplicação
let tarefas = [];
let materiaSelecionada = null;
let mesCalendario = new Date();
let dataSelecionada = '';

// Elementos DOM
const modal = document.getElementById('modal');
const formTarefa = document.getElementById('formTarefa');
const btnNovaTarefa = document.getElementById('btnNovaTarefa');
const btnFecharModal = document.getElementById('btnFecharModal');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const materiasGrid = document.getElementById('materiasGrid');
const mesAno = document.getElementById('mesAno');
const calendarioDias = document.getElementById('calendarioDias');
const btnMesAnterior = document.getElementById('btnMesAnterior');
const btnMesProximo = document.getElementById('btnMesProximo');
const btnHoje = document.getElementById('btnHoje');
const dataSelecionadaDisplay = document.getElementById('dataSelecionadaDisplay');

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    carregarTarefas();
    renderizarMaterias();
    renderizarCalendario();
    renderizarKanban();
    configurarDragAndDrop();
});

// ========== LOCALSTORAGE ==========
function carregarTarefas() {
    const tarefasSalvas = localStorage.getItem('tarefas');
    if (tarefasSalvas) {
        tarefas = JSON.parse(tarefasSalvas);
    } else {
        // Tarefas de exemplo
        const hoje = new Date();
        const amanha = new Date(hoje);
        amanha.setDate(hoje.getDate() + 1);
        
        const depoisAmanha = new Date(hoje);
        depoisAmanha.setDate(hoje.getDate() + 2);
        
        const semana = new Date(hoje);
        semana.setDate(hoje.getDate() + 7);
        
        const atrasada = new Date(hoje);
        atrasada.setDate(hoje.getDate() - 3);
        
        tarefas = [
            {
                id: gerarId(),
                titulo: 'Resolver exercícios de Matemática',
                materia: 'MAT',
                cor: '#3498db',
                dataEntrega: formatarDataParaString(amanha),
                status: 'pendente',
                dataCriacao: Date.now()
            },
            {
                id: gerarId(),
                titulo: 'Estudar para prova de História',
                materia: 'HIST',
                cor: '#e74c3c',
                dataEntrega: formatarDataParaString(hoje),
                status: 'andamento',
                dataCriacao: Date.now()
            },
            {
                id: gerarId(),
                titulo: 'Fazer resumo de Geografia',
                materia: 'GEO',
                cor: '#f1c40f',
                dataEntrega: formatarDataParaString(atrasada),
                status: 'andamento',
                dataCriacao: Date.now()
            },
            {
                id: gerarId(),
                titulo: 'Trabalho de Física',
                materia: 'FIS',
                cor: '#9b59b6',
                dataEntrega: formatarDataParaString(depoisAmanha),
                status: 'pendente',
                dataCriacao: Date.now()
            }
        ];
        salvarTarefas();
    }
}

function formatarDataParaString(data) {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function salvarTarefas() {
    localStorage.setItem('tarefas', JSON.stringify(tarefas));
    renderizarKanban();
    atualizarContadores();
}

// ========== UTILS ==========
function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function parseData(dataStr) {
    const [dia, mes, ano] = dataStr.split('/');
    return new Date(ano, mes - 1, dia);
}

function calcularDiasRestantes(dataEntrega) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const entrega = parseData(dataEntrega);
    entrega.setHours(0, 0, 0, 0);
    
    const diff = entrega - hoje;
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return dias;
}

function getStatusPrazo(dias) {
    if (dias < 0) return { texto: 'Atrasada', classe: 'atrasada' };
    if (dias === 0) return { texto: 'Hoje', classe: 'hoje' };
    if (dias <= 2) return { texto: 'Próxima', classe: 'proxima' };
    return { texto: 'Normal', classe: 'normal' };
}

function getTextoDiasRestantes(dias) {
    if (dias < 0) {
        const diasAtraso = Math.abs(dias);
        return `${diasAtraso} dia${diasAtraso !== 1 ? 's' : ''} atrasado`;
    }
    if (dias === 0) return 'Entrega hoje';
    if (dias === 1) return 'Falta 1 dia';
    return `Faltam ${dias} dias`;
}

// ========== ORDENAÇÃO POR DATA ==========
function ordenarTarefasPorData(tarefasParaOrdenar) {
    return tarefasParaOrdenar.sort((a, b) => {
        const dataA = parseData(a.dataEntrega);
        const dataB = parseData(b.dataEntrega);
        return dataA - dataB;
    });
}

// ========== RENDERIZAÇÃO DAS MATÉRIAS ==========
function renderizarMaterias() {
    materiasGrid.innerHTML = '';
    MATERIAS.forEach(materia => {
        const div = document.createElement('div');
        div.className = `materia-item ${materiaSelecionada?.sigla === materia.sigla ? 'selected' : ''}`;
        div.dataset.sigla = materia.sigla;
        div.dataset.cor = materia.cor;
        
        div.innerHTML = `
            <div class="materia-cor ${materia.classe}"></div>
            <span class="materia-sigla">${materia.nome}</span>
        `;
        
        div.addEventListener('click', () => {
            document.querySelectorAll('.materia-item').forEach(item => item.classList.remove('selected'));
            div.classList.add('selected');
            materiaSelecionada = materia;
            document.getElementById('materia').value = materia.sigla;
            document.getElementById('cor').value = materia.cor;
        });
        
        materiasGrid.appendChild(div);
    });
}

// ========== CALENDÁRIO LATERAL ==========
function renderizarCalendario() {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    mesAno.textContent = `${meses[mesCalendario.getMonth()]} ${mesCalendario.getFullYear()}`;
    
    const primeiroDia = new Date(mesCalendario.getFullYear(), mesCalendario.getMonth(), 1);
    const ultimoDia = new Date(mesCalendario.getFullYear(), mesCalendario.getMonth() + 1, 0);
    
    const hoje = formatarDataParaString(new Date());
    
    let diasHTML = '';
    
    // Dias vazios do início
    for (let i = 0; i < primeiroDia.getDay(); i++) {
        diasHTML += '<div class="calendario-dia vazio"></div>';
    }
    
    // Dias do mês
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
        const dataStr = `${String(dia).padStart(2, '0')}/${String(mesCalendario.getMonth() + 1).padStart(2, '0')}/${mesCalendario.getFullYear()}`;
        const isHoje = dataStr === hoje;
        const isSelected = dataStr === dataSelecionada;
        
        diasHTML += `<div class="calendario-dia ${isHoje ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-data="${dataStr}">${dia}</div>`;
    }
    
    calendarioDias.innerHTML = diasHTML;
    
    // Adicionar eventos aos dias
    calendarioDias.querySelectorAll('.calendario-dia:not(.vazio)').forEach(dia => {
        dia.addEventListener('click', () => {
            // Remove selected de todos
            document.querySelectorAll('.calendario-dia').forEach(d => d.classList.remove('selected'));
            
            // Adiciona selected no clicado
            dia.classList.add('selected');
            
            // Atualiza data selecionada
            dataSelecionada = dia.dataset.data;
            dataSelecionadaDisplay.textContent = dataSelecionada;
        });
    });
}

// Navegação do calendário
btnMesAnterior.addEventListener('click', (e) => {
    e.preventDefault();
    mesCalendario.setMonth(mesCalendario.getMonth() - 1);
    renderizarCalendario();
});

btnMesProximo.addEventListener('click', (e) => {
    e.preventDefault();
    mesCalendario.setMonth(mesCalendario.getMonth() + 1);
    renderizarCalendario();
});

// Botão Hoje
btnHoje.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Volta para o mês atual
    mesCalendario = new Date();
    renderizarCalendario();
    
    // Seleciona o dia de hoje
    const hoje = formatarDataParaString(new Date());
    dataSelecionada = hoje;
    dataSelecionadaDisplay.textContent = hoje;
    
    // Destaca o dia de hoje
    document.querySelectorAll('.calendario-dia').forEach(dia => {
        dia.classList.remove('selected');
        if (dia.dataset.data === hoje) {
            dia.classList.add('selected');
        }
    });
});

// ========== MODAL ==========
btnNovaTarefa.addEventListener('click', () => {
    abrirModal();
});

btnFecharModal.addEventListener('click', () => {
    fecharModal();
});

btnCancelar.addEventListener('click', () => {
    fecharModal();
});

function abrirModal(tarefa = null) {
    modal.classList.add('active');
    formTarefa.reset();
    materiaSelecionada = null;
    dataSelecionada = '';
    dataSelecionadaDisplay.textContent = 'Nenhuma data selecionada';
    
    // Reset calendário
    mesCalendario = new Date();
    renderizarCalendario();
    
    document.querySelectorAll('.materia-item').forEach(item => item.classList.remove('selected'));
    
    if (tarefa) {
        document.getElementById('modalTitle').textContent = 'Editar Tarefa';
        document.getElementById('tarefaId').value = tarefa.id;
        document.getElementById('titulo').value = tarefa.titulo;
        
        // Selecionar data no calendário
        dataSelecionada = tarefa.dataEntrega;
        dataSelecionadaDisplay.textContent = tarefa.dataEntrega;
        
        // Selecionar matéria
        const materia = MATERIAS.find(m => m.sigla === tarefa.materia);
        if (materia) {
            materiaSelecionada = materia;
            document.getElementById('materia').value = materia.sigla;
            document.getElementById('cor').value = materia.cor;
            document.querySelectorAll('.materia-item').forEach(item => {
                if (item.dataset.sigla === materia.sigla) {
                    item.classList.add('selected');
                }
            });
        }
        
        renderizarCalendario();
    } else {
        document.getElementById('modalTitle').textContent = 'Nova Tarefa';
        document.getElementById('tarefaId').value = '';
    }
}

function fecharModal() {
    modal.classList.remove('active');
    formTarefa.reset();
    materiaSelecionada = null;
    dataSelecionada = '';
}

btnSalvar.addEventListener('click', () => {
    const id = document.getElementById('tarefaId').value;
    const titulo = document.getElementById('titulo').value.trim();
    const materia = document.getElementById('materia').value;
    const cor = document.getElementById('cor').value;
    
    if (!titulo) {
        alert('Por favor, insira um título para a tarefa!');
        return;
    }
    
    if (!materia || !cor) {
        alert('Por favor, selecione uma matéria!');
        return;
    }
    
    if (!dataSelecionada) {
        alert('Por favor, selecione uma data no calendário!');
        return;
    }
    
    if (id) {
        // Editar tarefa existente
        const index = tarefas.findIndex(t => t.id === id);
        if (index !== -1) {
            tarefas[index] = {
                ...tarefas[index],
                titulo,
                materia,
                cor,
                dataEntrega: dataSelecionada
            };
        }
    } else {
        // Nova tarefa
        const novaTarefa = {
            id: gerarId(),
            titulo,
            materia,
            cor,
            dataEntrega: dataSelecionada,
            status: 'pendente',
            dataCriacao: Date.now()
        };
        tarefas.push(novaTarefa);
    }
    
    salvarTarefas();
    fecharModal();
});

// ========== KANBAN ==========
function renderizarKanban() {
    const colunas = {
        pendente: document.getElementById('pendente'),
        andamento: document.getElementById('andamento'),
        concluida: document.getElementById('concluida')
    };
    
    // Limpar colunas
    Object.values(colunas).forEach(coluna => coluna.innerHTML = '');
    
    // Ordenar tarefas por data antes de renderizar
    const tarefasPorStatus = {
        pendente: ordenarTarefasPorData(tarefas.filter(t => t.status === 'pendente')),
        andamento: ordenarTarefasPorData(tarefas.filter(t => t.status === 'andamento')),
        concluida: ordenarTarefasPorData(tarefas.filter(t => t.status === 'concluida'))
    };
    
    // Renderizar tarefas ordenadas
    Object.keys(tarefasPorStatus).forEach(status => {
        tarefasPorStatus[status].forEach(tarefa => {
            const card = criarCardTarefa(tarefa);
            colunas[status].appendChild(card);
        });
    });
    
    atualizarContadores();
}

function criarCardTarefa(tarefa) {
    const card = document.createElement('div');
    card.className = 'tarefa-card';
    card.draggable = true;
    card.dataset.id = tarefa.id;
    card.style.borderLeftColor = tarefa.cor;
    
    const diasRestantes = calcularDiasRestantes(tarefa.dataEntrega);
    const statusPrazo = getStatusPrazo(diasRestantes);
    const diasTexto = getTextoDiasRestantes(diasRestantes);
    
    card.innerHTML = `
        <div class="tarefa-header">
            <span class="tarefa-titulo">${tarefa.titulo}</span>
            <div class="tarefa-acoes">
                <button class="btn-acao" onclick="editarTarefa('${tarefa.id}')" title="Editar">✏️</button>
                <button class="btn-acao" onclick="duplicarTarefa('${tarefa.id}')" title="Duplicar">📋</button>
                <button class="btn-acao" onclick="excluirTarefa('${tarefa.id}')" title="Excluir">🗑️</button>
            </div>
        </div>
        <div class="tarefa-materia" style="background-color: ${tarefa.cor}">${tarefa.materia}</div>
        <div class="tarefa-prazo">
            <span>${diasTexto}</span>
            <span class="status-prazo ${statusPrazo.classe}">${statusPrazo.texto}</span>
        </div>
        <div class="tarefa-data">${tarefa.dataEntrega}</div>
    `;
    
    // Eventos de drag and drop
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    
    return card;
}

// ========== DRAG AND DROP ==========
let dragSrcElement = null;

function handleDragStart(e) {
    this.classList.add('dragging');
    dragSrcElement = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.coluna-tarefas').forEach(coluna => {
        coluna.classList.remove('drag-over');
    });
}

function configurarDragAndDrop() {
    document.querySelectorAll('.coluna-tarefas').forEach(coluna => {
        coluna.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            coluna.classList.add('drag-over');
        });
        
        coluna.addEventListener('dragleave', () => {
            coluna.classList.remove('drag-over');
        });
        
        coluna.addEventListener('drop', (e) => {
            e.preventDefault();
            coluna.classList.remove('drag-over');
            
            const id = e.dataTransfer.getData('text/plain');
            const novoStatus = coluna.parentElement.dataset.status;
            
            const tarefaIndex = tarefas.findIndex(t => t.id === id);
            if (tarefaIndex !== -1 && tarefas[tarefaIndex].status !== novoStatus) {
                tarefas[tarefaIndex].status = novoStatus;
                salvarTarefas();
            }
        });
    });
}

// ========== AÇÕES DAS TAREFAS ==========
window.editarTarefa = function(id) {
    const tarefa = tarefas.find(t => t.id === id);
    if (tarefa) {
        abrirModal(tarefa);
    }
}

window.duplicarTarefa = function(id) {
    const tarefaOriginal = tarefas.find(t => t.id === id);
    if (tarefaOriginal) {
        const novaTarefa = {
            ...tarefaOriginal,
            id: gerarId(),
            titulo: `${tarefaOriginal.titulo} (cópia)`,
            status: 'pendente',
            dataCriacao: Date.now()
        };
        tarefas.push(novaTarefa);
        salvarTarefas();
    }
}

window.excluirTarefa = function(id) {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        tarefas = tarefas.filter(t => t.id !== id);
        salvarTarefas();
    }
}

// ========== ATUALIZAR CONTADORES ==========
function atualizarContadores() {
    const pendentes = tarefas.filter(t => t.status === 'pendente').length;
    const andamento = tarefas.filter(t => t.status === 'andamento').length;
    const concluidas = tarefas.filter(t => t.status === 'concluida').length;
    
    document.getElementById('contPendente').textContent = pendentes;
    document.getElementById('contAndamento').textContent = andamento;
    document.getElementById('contConcluida').textContent = concluidas;
}