// Estado do wizard
let currentStep = 1;
const totalSteps = 5;
const formData = {};

// Elementos
const form = document.getElementById('acquisitionForm');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const generateBtn = document.getElementById('generateBtn');
const progressLine = document.getElementById('progressLine');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    updateProgressBar();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    nextBtn.addEventListener('click', nextStep);
    prevBtn.addEventListener('click', prevStep);
    generateBtn.addEventListener('click', generateDocuments);

    document.querySelectorAll('input[name="modalidade"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const hipoteseGroup = document.getElementById('hipotese_dispensa_group');
            if (e.target.value === 'dispensa') {
                hipoteseGroup.style.display = 'block';
            } else {
                hipoteseGroup.style.display = 'none';
            }
        });
    });
}

// Navegação
function nextStep() {
    if (!validateCurrentStep()) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    saveCurrentStepData();

    if (currentStep < totalSteps) {
        currentStep++;
        updateWizard();

        if (currentStep === 5) {
            performAnalysis();
        }
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateWizard();
    }
}

function updateWizard() {
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelector(`[data-section="${currentStep}"]`).classList.add('active');

    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < currentStep) {
            step.classList.add('completed');
        } else if (index + 1 === currentStep) {
            step.classList.add('active');
        }
    });

    prevBtn.style.display = currentStep === 1 ? 'none' : 'inline-flex';
    nextBtn.style.display = currentStep === totalSteps ? 'none' : 'inline-flex';
    generateBtn.style.display = currentStep === totalSteps ? 'inline-flex' : 'none';

    updateProgressBar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgressBar() {
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
    progressLine.style.width = progress + '%';
}

function validateCurrentStep() {
    const currentSection = document.querySelector(`[data-section="${currentStep}"]`);
    const requiredFields = currentSection.querySelectorAll('[required]');
    
    for (let field of requiredFields) {
        if (!field.value) {
            field.focus();
            return false;
        }
    }
    return true;
}

function saveCurrentStepData() {
    const currentSection = document.querySelector(`[data-section="${currentStep}"]`);
    const inputs = currentSection.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (input.type === 'radio') {
            if (input.checked) {
                formData[input.name] = input.value;
            }
        } else {
            formData[input.name] = input.value;
        }
    });
}

function performAnalysis() {
    const loadingDiv = document.getElementById('loadingAnalysis');
    const summaryDiv = document.getElementById('summaryContent');

    loadingDiv.classList.add('show');
    summaryDiv.style.display = 'none';

    setTimeout(() => {
        const analysis = analyzeAcquisition(formData);
        displayAnalysis(analysis);
        
        loadingDiv.classList.remove('show');
        summaryDiv.style.display = 'block';
    }, 2000);
}

function analyzeAcquisition(data) {
    const valor = parseFloat(data.valor_estimado || 0);
    const tipo = data.tipo_contratacao;
    const complexidade = data.complexidade;

    let geraETP = false;
    let tipoETP = 'NÃO GERA';
    let motivoETP = '';

    if (data.modalidade === 'dispensa' && data.hipotese_dispensa === 'dispensa_por_valor') {
        geraETP = false;
        tipoETP = 'FACULTATIVO';
        motivoETP = 'Art. 14, I da IN SEGES 58/2022 - Dispensa por valor até R$ 100.000,00 (bens) ou R$ 200.000,00 (serviços): ETP é facultativo.';
    } else if (complexidade === 'alta' || tipo === 'obra' || tipo === 'engenharia') {
        geraETP = true;
        tipoETP = 'OBRIGATÓRIO';
        motivoETP = 'Art. 14, II da IN SEGES 58/2022 - Contratações de alta complexidade ou obras/engenharia requerem ETP obrigatório.';
    }

    let geraMapaRisco = false;
    let nivelRisco = 'BAIXO';
    let tipoMapaRisco = 'NÃO GERA';
    let motivoMapaRisco = '';

    if (tipo === 'obra' || tipo === 'engenharia' || complexidade === 'alta' || valor > 350000) {
        geraMapaRisco = true;
        nivelRisco = 'ALTO';
        tipoMapaRisco = 'COMPLETO';
        motivoMapaRisco = 'Contratação de alta complexidade ou alto valor. Necessário gerenciamento estruturado de riscos conforme orientações do TCU.';
    } else if (complexidade === 'media' || (valor > 50000 && valor <= 350000)) {
        geraMapaRisco = true;
        nivelRisco = 'MÉDIO';
        tipoMapaRisco = 'SIMPLIFICADO';
        motivoMapaRisco = 'Contratação de complexidade moderada. Recomenda-se análise de riscos simplificada.';
    } else {
        nivelRisco = 'BAIXO';
        motivoMapaRisco = 'Compra simples e padronizada. Gerenciamento de riscos proporcional à relevância do objeto.';
    }

    const documentos = ['DFD - Documento de Formalização da Demanda', 'TR - Termo de Referência'];
    if (geraETP) documentos.push('ETP - Estudo Técnico Preliminar');
    if (geraMapaRisco) documentos.push(`Mapa de Risco (${tipoMapaRisco})`);

    return {
        documentos,
        etp: { gera: geraETP, tipo: tipoETP, motivo: motivoETP },
        mapaRisco: { gera: geraMapaRisco, nivel: nivelRisco, tipo: tipoMapaRisco, motivo: motivoMapaRisco },
        formData: data
    };
}

function displayAnalysis(analysis) {
    const docsList = document.getElementById('documentsList');
    docsList.innerHTML = analysis.documentos.map(doc => 
        `<p>✅ <strong>${doc}</strong></p>`
    ).join('');

    const legalDiv = document.getElementById('legalAnalysis');
    let legalHTML = '';

    const etpBadge = analysis.etp.gera ? 
        '<span class="badge badge-success">OBRIGATÓRIO</span>' : 
        '<span class="badge badge-warning">FACULTATIVO</span>';
    legalHTML += `
        <p><strong>ETP (Estudo Técnico Preliminar):</strong> ${etpBadge}</p>
        <p style="margin-left: 20px; font-size: 14px;">${analysis.etp.motivo}</p>
    `;

    const riscoBadge = analysis.mapaRisco.nivel === 'ALTO' ? 'badge-danger' :
                       analysis.mapaRisco.nivel === 'MÉDIO' ? 'badge-warning' : 'badge-success';
    legalHTML += `
        <p style="margin-top: 16px;"><strong>Mapa de Risco:</strong> 
            <span class="badge ${riscoBadge}">${analysis.mapaRisco.nivel}</span>
            ${analysis.mapaRisco.gera ? '<span class="badge badge-info">' + analysis.mapaRisco.tipo + '</span>' : ''}
        </p>
        <p style="margin-left: 20px; font-size: 14px;">${analysis.mapaRisco.motivo}</p>
    `;

    legalDiv.innerHTML = legalHTML;

    const summaryDiv = document.getElementById('summaryDetails');
    const tipoLabel = {
        'produto': '🛒 Produto/Material',
        'servico': '🔧 Serviço',
        'obra': '🏗️ Obra',
        'engenharia': '📐 Engenharia'
    };

    summaryDiv.innerHTML = `
        <p><strong>Tipo:</strong> ${tipoLabel[analysis.formData.tipo_contratacao]}</p>
        <p><strong>Descrição:</strong> ${analysis.formData.descricao}</p>
        <p><strong>Quantidade:</strong> ${analysis.formData.quantidade}</p>
        <p><strong>Valor Estimado:</strong> R$ ${parseFloat(analysis.formData.valor_estimado).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
        <p><strong>Modalidade:</strong> ${analysis.formData.modalidade}</p>
        <p><strong>Complexidade:</strong> ${analysis.formData.complexidade.toUpperCase()}</p>
    `;
}

function generateDocuments() {
    saveCurrentStepData();
    
    alert('🎉 Documentos sendo gerados!\n\nEm breve você receberá:\n- DFD (Word)\n- Termo de Referência (Word)\n' + 
          (formData.gera_etp ? '- ETP (Word)\n' : '') +
          (formData.gera_mapa_risco ? '- Mapa de Risco (Word)\n' : '') +
          '\nOs arquivos estarão disponíveis para download.');
    
    console.log('Dados completos:', formData);
}
