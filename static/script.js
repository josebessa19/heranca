document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("[DOMContentLoaded] Script setup started.");

    let currentSection = 1;
    const totalSections = 5; // Adjusted as S5 is sometimes the last, or S4 if no testament

    const form = document.getElementById('simulacaoForm');

    // Section 1 fields
    const radioDeixouTestamento = document.querySelectorAll('input[name="deixou_testamento"]');
    const selectEstadoCivil = document.getElementById('estado_civil');
    const divRegimeBens = document.getElementById('divRegimeBens');
    const selectRegimeBens = document.getElementById('regime_bens');

    // Section 2 fields
    const divNomeConjuge = document.getElementById('divNomeConjuge');
    const inputNomeConjuge = document.getElementById('nome_conjuge');
    const radioDeixouFilhos = document.querySelectorAll('input[name="deixou_filhos"]');
    const divQuantosFilhos = document.getElementById('divQuantosFilhos');
    const inputQuantosFilhos = document.getElementById('quantos_filhos');
    const camposNomesFilhosDiv = document.getElementById('camposNomesFilhos');
    const divDeixouAscendentes = document.getElementById('divDeixouAscendentes');
    const radiosDeixouAscendentes = document.querySelectorAll('input[name="deixou_ascendentes"]');
    const divTipoAscendentes = document.getElementById('divTipoAscendentes');
    const radiosTipoAscendentes = document.querySelectorAll('input[name="tipo_ascendentes"]');

    // New detailed ascendant fields (within divTipoAscendentes)
    const divDetalhesPais = document.getElementById('divDetalhesPais');
    const radiosNumPais = document.querySelectorAll('input[name="num_pais"]');
    const divNomePai1 = document.getElementById('divNomePai1');
    const inputNomePai1 = document.getElementById('nome_pai_1');
    const divNomesPais2 = document.getElementById('divNomesPais2');
    const inputNomePaiMae = document.getElementById('nome_pai_mae');
    const inputNomeMaePai = document.getElementById('nome_mae_pai');

    const divDetalhesAvosOutros = document.getElementById('divDetalhesAvosOutros');
    const inputNumAvosOutros = document.getElementById('num_avos_outros');
    const camposNomesAvosOutrosDiv = document.getElementById('camposNomesAvosOutros');

    // Section 4 fields
    const radioDoacoesHerdeiros = document.querySelectorAll('input[name="doacoes_herdeiros"]');
        // --- NEW SIMPLIFIED FLOW DOM ELEMENTS FOR HEIR DONATIONS ---
        const divDetalhesDoacoesHerdeiros = document.getElementById('divDetalhesDoacoesHerdeiros');
        const inputValorTotalGlobalDoacoesHerdeiros = document.getElementById('inputValorTotalGlobalDoacoesHerdeiros');
        const divCamposIndividuaisDoacoesHerdeiros = document.getElementById('divCamposIndividuaisDoacoesHerdeiros');
        // --- END NEW SIMPLIFIED FLOW DOM ELEMENTS ---

    const radioDoacoesOutrasPessoas = document.querySelectorAll('input[name="doacoes_outras_pessoas"]');
    const divValorDoacoesOutrasPessoas = document.getElementById('divValorDoacoesOutrasPessoas');
    const inputValorDoacoesOutrasPessoas = document.getElementById('valor_doacoes_outras_pessoas');
    
    // Section 5 fields
    const seccao5 = document.getElementById('seccao5');
    const inputValorBensTestamento = document.getElementById('valor_bens_testamento');

    const btnCalcular = document.getElementById('btnCalcular');
    const resultadosContainer = document.getElementById('resultadosContainer');
    const resultadosConteudo = document.getElementById('resultadosConteudo');

        // Global helper function
        const formatCurrency = (value) => value !== undefined && value !== null ? parseFloat(value).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }) : 'N/A';

    function showSection(sectionIndex) {
        for (let i = 1; i <= totalSections; i++) {
            const section = document.getElementById(`seccao${i}`);
            if (section) {
                section.style.display = (i === sectionIndex) ? 'block' : 'none';
            }
        }
        // Special handling for section 5 visibility based on testament
        toggleTestamentoFieldsVisibility();
    }

    window.nextSection = () => {
        if (!validateSection(currentSection)) {
            return;
        }

        let deixouTestamento = document.querySelector('input[name="deixou_testamento"]:checked');
        
        if (currentSection === 4 && deixouTestamento && deixouTestamento.value === 'sim') {
            currentSection = 5;
        } else if (currentSection === 4 && deixouTestamento && deixouTestamento.value === 'nao') {
            // Skip to calculation if no testament and currently on S4
            // This case should be handled by btnCalcular's logic, nextSection from S4 always tries S5
            // Or, we change totalSections dynamically, or btnCalcular appears on S4 if no S5.
            // For now, let's assume S5 is the "potential" final data entry section before calculation.
            // The calculation button is on S5. If S5 is skipped, then S4's next should not go to S5.
            // This logic will be simplified by having "Calcular" on S4 if S5 is not applicable.
                // Let's adjust S4's "Próximo" button to become "Calcular" if S5 is not shown.
                // For now, this function just tries to go to the next numerical section.
            // Let's adjust S4's "Próximo" button to become "Calcular" if S5 is not shown.
            // For now, this function just tries to go to the next numerical section.
            currentSection++; 
        } else if (currentSection < totalSections) {
            currentSection++;
        }
        
        showSection(currentSection);
        updateButtonStates();
    };

    window.previousSection = () => {
        let deixouTestamento = document.querySelector('input[name="deixou_testamento"]:checked');

        if (currentSection === 5 && deixouTestamento && deixouTestamento.value === 'nao') {
            // This should not happen if S5 is hidden when no testament.
            // If somehow on S5 and testament is 'no', jump back to S4.
             currentSection = 4;
        } else if (currentSection > 1) {
            currentSection--;
        }
        showSection(currentSection);
        updateButtonStates();
    };

    function updateButtonStates() {
        // Adjust "Próximo" on S4 / Show "Calcular" on S4 if S5 is skipped.
        const s4NextButton = document.querySelector('#seccao4 .form-button[onclick="nextSection()"]');
        const s5CalculateButton = document.querySelector('#seccao5 #btnCalcular'); // Original calculate button
        let deixouTestamento = document.querySelector('input[name="deixou_testamento"]:checked');

        if (currentSection === 4) {
            if (deixouTestamento && deixouTestamento.value === 'nao') {
                if (s4NextButton) s4NextButton.textContent = 'Calcular Simulação';
                if (s4NextButton) s4NextButton.onclick = () => btnCalcular.click(); // Make it trigger the main calculate
            } else {
                if (s4NextButton) s4NextButton.textContent = 'Próximo';
                if (s4NextButton) s4NextButton.onclick = nextSection;
            }
        } else { // Reset S4 button if not on S4
             if (s4NextButton) {
                s4NextButton.textContent = 'Próximo';
                s4NextButton.onclick = nextSection;
            }
        }
    }

    function toggleTestamentoFieldsVisibility() {
        const deixouTestamento = document.querySelector('input[name="deixou_testamento"]:checked');
        if (deixouTestamento && deixouTestamento.value === 'sim') {
            seccao5.style.display = (currentSection === 5) ? 'block' : 'none'; // Only show S5 if it's the current
            if (currentSection !== 5) seccao5.style.display = 'none'; // Explicitly hide if not current

            inputValorBensTestamento.required = true;
        } else {
            seccao5.style.display = 'none';
            inputValorBensTestamento.required = false;
            inputValorBensTestamento.value = '';
        }
        updateButtonStates(); // Update buttons based on S5 visibility
    }

    function toggleAscendentesFields() {
        const deixouFilhos = document.querySelector('input[name="deixou_filhos"]:checked');
        const divDeixouAscendentes = document.getElementById('divDeixouAscendentes');
        const radiosDeixouAscendentes = document.querySelectorAll('input[name="deixou_ascendentes"]');
        const divTipoAscendentes = document.getElementById('divTipoAscendentes');
        const radiosTipoAscendentes = document.querySelectorAll('input[name="tipo_ascendentes"]');

        if (deixouFilhos && deixouFilhos.value === 'nao') {
            divDeixouAscendentes.style.display = 'block';
            radiosDeixouAscendentes.forEach(radio => radio.required = true);

            // Further toggle for tipo_ascendentes based on deixou_ascendentes
            const deixouAscendentes = document.querySelector('input[name="deixou_ascendentes"]:checked');
            if (deixouAscendentes && deixouAscendentes.value === 'sim') {
                divTipoAscendentes.style.display = 'block';
                radiosTipoAscendentes.forEach(radio => radio.required = true);
            } else {
                divTipoAscendentes.style.display = 'none';
                radiosTipoAscendentes.forEach(radio => {
                    radio.required = false;
                    radio.checked = false; // Clear selection if hidden
                });
            }
        } else {
            divDeixouAscendentes.style.display = 'none';
            radiosDeixouAscendentes.forEach(radio => {
                radio.required = false;
                radio.checked = false; // Clear selection
            });
            divTipoAscendentes.style.display = 'none';
            radiosTipoAscendentes.forEach(radio => {
                radio.required = false;
                radio.checked = false; // Clear selection
            });
        }
    }

    function toggleDetalhesAscendentes() {
        const tipoAscendente = document.querySelector('input[name="tipo_ascendentes"]:checked');
        divDetalhesPais.style.display = 'none';
        radiosNumPais.forEach(r => { r.checked = false; r.required = false; });
        divNomePai1.style.display = 'none';
        inputNomePai1.required = false; inputNomePai1.value = '';
        divNomesPais2.style.display = 'none';
        inputNomePaiMae.required = false; inputNomePaiMae.value = '';
        inputNomeMaePai.required = false; inputNomeMaePai.value = '';

        divDetalhesAvosOutros.style.display = 'none';
        inputNumAvosOutros.required = false; inputNumAvosOutros.value = '';
        camposNomesAvosOutrosDiv.innerHTML = '';

        if (tipoAscendente) {
            if (tipoAscendente.value === 'pais') {
                divDetalhesPais.style.display = 'block';
                radiosNumPais.forEach(r => r.required = true);
            } else if (tipoAscendente.value === 'avos_outros') {
                divDetalhesAvosOutros.style.display = 'block';
                inputNumAvosOutros.required = true;
            }
        }
    }

    function toggleDetalhesNumPais() {
        const numPais = document.querySelector('input[name="num_pais"]:checked');
        divNomePai1.style.display = 'none';
        inputNomePai1.required = false; inputNomePai1.value = '';
        divNomesPais2.style.display = 'none';
        inputNomePaiMae.required = false; inputNomePaiMae.value = '';
        inputNomeMaePai.required = false; inputNomeMaePai.value = '';

        if (numPais) {
            if (numPais.value === '1') {
                divNomePai1.style.display = 'block';
                inputNomePai1.required = true;
            } else if (numPais.value === '2') {
                divNomesPais2.style.display = 'block';
                inputNomePaiMae.required = true;
                inputNomeMaePai.required = true;
            }
        }
    }

    function gerarCamposNomesAvosOutros() {
        camposNomesAvosOutrosDiv.innerHTML = '';
        const num = parseInt(inputNumAvosOutros.value);
        if (num > 0) {
            for (let i = 1; i <= num; i++) {
                const label = document.createElement('label');
                label.setAttribute('for', `nome_avo_outro_${i}`);
                label.textContent = `Nome do Ascendente ${i}:`;
                
                const input = document.createElement('input');
                input.type = 'text';
                input.id = `nome_avo_outro_${i}`;
                input.name = `nome_avo_outro_${i}`;
                input.classList.add('form-input');
                input.required = true;

                camposNomesAvosOutrosDiv.appendChild(label);
                camposNomesAvosOutrosDiv.appendChild(input);
                camposNomesAvosOutrosDiv.appendChild(document.createElement('br'));
            }
        }
    }

    function validateSection(sectionNum) {
            console.log(`[validateSection] Validating section: ${sectionNum}`);
        let isValid = true;
        const section = document.getElementById(`seccao${sectionNum}`);
        if (!section) return true;

        // General visibility check for required inputs and selects
        section.querySelectorAll('input[required], select[required]').forEach(input => {
            // Check if the input is visible (its offsetParent is not null)
            // and if it's part of a div that is currently displayed (e.g., divRegimeBens)
            let parentDiv = input.closest('.form-group'); // Get the direct form-group parent
            let isVisible = input.offsetParent !== null;
            if(parentDiv && parentDiv.style.display === 'none') {
                isVisible = false;
            }

            if (isVisible && !input.value.trim()) {
                alert(`Por favor, preencha o campo: ${input.previousElementSibling?.textContent || input.name || input.id}`);
                isValid = false;
            }
        });
        if (!isValid) return false;

        // Radio button group validation (general visibility check)
        const radioGroups = {};
        section.querySelectorAll('input[type="radio"][required]').forEach(radio => {
            let parentDiv = radio.closest('.form-group');
            let isVisible = radio.offsetParent !== null;
            if(parentDiv && parentDiv.style.display === 'none') {
                isVisible = false;
            }
            if (isVisible) { 
                 radioGroups[radio.name] = radioGroups[radio.name] || [];
                 radioGroups[radio.name].push(radio);
            }
        });

        for (const name in radioGroups) {
            if (!radioGroups[name].some(radio => radio.checked)) {
                alert(`Por favor, selecione uma opção para: ${name.replace(/_/g, ' ')}`);
                isValid = false;
                break; 
            }
        }
        if (!isValid) return false;
        
        // Custom validation for section-specific logic
        if (sectionNum === 1) {
            if (selectEstadoCivil.value === 'casado' && divRegimeBens.style.display !== 'none' && !selectRegimeBens.value) {
                alert('Por favor, selecione o regime de bens.');
                isValid = false;
            }
        } else if (sectionNum === 2) {
            const filhosChecked = document.querySelector('input[name="deixou_filhos"]:checked');
            if (filhosChecked && filhosChecked.value === 'sim') {
                if (divQuantosFilhos.style.display !== 'none' && (!inputQuantosFilhos.value || parseInt(inputQuantosFilhos.value) < 1)) {
                    alert('Por favor, insira um número válido de filhos.');
                    isValid = false;
                } else {
                    const numFilhos = parseInt(inputQuantosFilhos.value);
                    for (let i = 1; i <= numFilhos; i++) {
                        const nomeFilhoInput = document.getElementById(`nome_filho_${i}`);
                        if (nomeFilhoInput && nomeFilhoInput.offsetParent !== null && !nomeFilhoInput.value.trim()) {
                            alert(`Por favor, insira o nome do Filho ${i}.`);
                            isValid = false;
                            break;
                        }
                    }
                }
            }
            if (document.getElementById('divDeixouAscendentes').style.display === 'block' && !document.querySelector('input[name="deixou_ascendentes"]:checked')) {
                alert('Por favor, indique se o falecido deixou ascendentes.');
                isValid = false;
            }
            // Validate tipo_ascendentes if visible
            if (divTipoAscendentes.style.display === 'block' && !document.querySelector('input[name="tipo_ascendentes"]:checked')) {
                alert('Por favor, especifique o tipo de ascendentes.');
                isValid = false;
            } else if (divTipoAscendentes.style.display === 'block' && document.querySelector('input[name="tipo_ascendentes"]:checked')) {
                const tipoAsc = document.querySelector('input[name="tipo_ascendentes"]:checked').value;
                if (tipoAsc === 'pais') {
                    if (divDetalhesPais.style.display === 'block' && !document.querySelector('input[name="num_pais"]:checked')) {
                        alert('Por favor, especifique o número de progenitores.');
                        isValid = false;
                    } else if (document.querySelector('input[name="num_pais"]:checked')) {
                        const numPais = document.querySelector('input[name="num_pais"]:checked').value;
                        if (numPais === '1' && divNomePai1.style.display === 'block' && !inputNomePai1.value.trim()) {
                            alert('Por favor, insira o nome do progenitor.');
                            isValid = false;
                        } else if (numPais === '2' && divNomesPais2.style.display === 'block') {
                            if (!inputNomePaiMae.value.trim()) {
                                alert('Por favor, insira o nome do pai.');
                                isValid = false;
                            }
                            if (!inputNomeMaePai.value.trim()) {
                                alert('Por favor, insira o nome da mãe.');
                                isValid = false;
                            }
                        }
                    }
                } else if (tipoAsc === 'avos_outros') {
                    if (divDetalhesAvosOutros.style.display === 'block') {
                        if (!inputNumAvosOutros.value || parseInt(inputNumAvosOutros.value) < 1) {
                            alert('Por favor, insira um número válido de avós/outros ascendentes.');
                            isValid = false;
                        } else {
                            const numAvos = parseInt(inputNumAvosOutros.value);
                            for (let i = 1; i <= numAvos; i++) {
                                const nomeAvoInput = document.getElementById(`nome_avo_outro_${i}`);
                                if (nomeAvoInput && nomeAvoInput.offsetParent !== null && !nomeAvoInput.value.trim()) {
                                    alert(`Por favor, insira o nome do Ascendente ${i}.`);
                                    isValid = false;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        } else if (sectionNum === 4) {
                const doacoesHerdeirosRadio = section.querySelector('input[name="doacoes_herdeiros"]:checked');
                if (!doacoesHerdeirosRadio) {
                    alert('Por favor, indique se houve doações a herdeiros legitimários.'); isValid = false; return isValid;
                }

                if (doacoesHerdeirosRadio.value === 'sim') {
                    if (!inputValorTotalGlobalDoacoesHerdeiros || !inputValorTotalGlobalDoacoesHerdeiros.value) {
                        alert('Por favor, insira o VALOR TOTAL GLOBAL das doações feitas a herdeiros legitimários.'); isValid = false; return isValid;
                    }
                    const totalGlobalDeclarado = parseFloat(inputValorTotalGlobalDoacoesHerdeiros.value) || 0;
                    if (totalGlobalDeclarado < 0) {
                         alert('O VALOR TOTAL GLOBAL das doações não pode ser negativo.'); isValid = false; return isValid;
                    }

                    let somaTotalIndividualComESemDispensa = 0;
                    const activeHeirs = getAllActiveHeirNames();

                    if (activeHeirs.length > 0) {
                        for (let i = 0; i < activeHeirs.length; i++) {
                            const heirName = activeHeirs[i];

                            const inputComDispensa = document.getElementById(`doacao_com_dispensa_herdeiro_${i}`);
                            const inputSemDispensa = document.getElementById(`doacao_sem_dispensa_herdeiro_${i}`);

                            if (!inputComDispensa || !inputComDispensa.value) {
                                alert(`Por favor, insira o valor da doação COM DISPENSA para ${heirName}. (Pode ser 0)`); isValid = false; return isValid;
                            }
                            const valorComDispensa = parseFloat(inputComDispensa.value);
                            if (isNaN(valorComDispensa) || valorComDispensa < 0) {
                                alert(`Valor inválido para doação COM DISPENSA para ${heirName}. Deve ser um número não negativo.`); isValid = false; return isValid;
                            }
                            somaTotalIndividualComESemDispensa += valorComDispensa;

                            if (!inputSemDispensa || !inputSemDispensa.value) {
                                alert(`Por favor, insira o valor da doação SEM DISPENSA para ${heirName}. (Pode ser 0)`); isValid = false; return isValid;
                            }
                            const valorSemDispensa = parseFloat(inputSemDispensa.value);
                            if (isNaN(valorSemDispensa) || valorSemDispensa < 0) {
                                alert(`Valor inválido para doação SEM DISPENSA para ${heirName}. Deve ser um número não negativo.`); isValid = false; return isValid;
                            }
                            somaTotalIndividualComESemDispensa += valorSemDispensa;
                        }
                        
                        if (Math.abs(somaTotalIndividualComESemDispensa - totalGlobalDeclarado) > 0.001) {
                            alert(`A soma de todas as doações individuais (COM e SEM dispensa) aos herdeiros (${formatCurrency(somaTotalIndividualComESemDispensa)}) não corresponde ao VALOR TOTAL GLOBAL declarado (${formatCurrency(totalGlobalDeclarado)}). Verifique os valores.`);
                            isValid = false; return isValid;
                        }
                    } else if (totalGlobalDeclarado > 0) { 
                        alert('Indicou um valor total global de doações a herdeiros, mas não há herdeiros especificados na Secção 2 para detalhar essas doações.');
                        isValid = false; return isValid;
                    }
                }
                const doacoesOutras = section.querySelector('input[name="doacoes_outras_pessoas"]:checked');
                if (!doacoesOutras) { alert('Por favor, indique se houve doações a outras pessoas.'); isValid = false; return isValid; }
                if (doacoesOutras.value === 'sim' && !inputValorDoacoesOutrasPessoas.value) {
                    alert('Por favor, insira o valor total das doações a outras pessoas.'); isValid = false; return isValid;
            }
        } else if (sectionNum === 5) {
             if (seccao5.style.display !== 'none' && !inputValorBensTestamento.value) {
                alert('Por favor, insira o valor total dos bens deixados em testamento.');
                isValid = false;
            }
        }
            console.log(`[validateSection] Section ${sectionNum} validation result: ${isValid}`);
        return isValid;
    }

    function getFormData() {
            console.log("[getFormData] Starting to collect form data...");
        const formData = new FormData(form);
            const data = {};
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }

            // Handle multi-value fields like nomes_filhos, nomes_pais, nomes_avos_outros
            data.nomes_filhos = [];
            const numFilhos = parseInt(inputQuantosFilhos.value);
            if (!isNaN(numFilhos) && numFilhos > 0) {
                for (let i = 0; i < numFilhos; i++) {
                    // Child name input IDs are nome_filho_1, nome_filho_2, etc.
                    // Loop i is 0-indexed, so access nome_filho_{i+1}
                    const nomeFilhoInput = document.getElementById(`nome_filho_${i + 1}`); 
                    if (nomeFilhoInput && nomeFilhoInput.value.trim() !== '') {
                        data.nomes_filhos.push(nomeFilhoInput.value.trim());
        } else {
                        data.nomes_filhos.push(`Filho(a) ${i + 1}`); // Default if not provided or empty
                    }
                }
            }
            console.log("[getFormData] Collected nomes_filhos:", data.nomes_filhos);

            data.nomes_pais = [];
            const numPaisRadio = document.querySelector('input[name="num_pais"]:checked');
            if (numPaisRadio) {
                if (numPaisRadio.value === '1') {
                    const nomePai1Input = document.getElementById('nome_pai_1');
                    if (nomePai1Input && nomePai1Input.value) data.nomes_pais.push(nomePai1Input.value);
                    else data.nomes_pais.push('Progenitor 1');
                } else if (numPaisRadio.value === '2') {
                    const nomePaiMaeInput = document.getElementById('nome_pai_mae');
                    const nomeMaePaiInput = document.getElementById('nome_mae_pai');
                    if (nomePaiMaeInput && nomePaiMaeInput.value) data.nomes_pais.push(nomePaiMaeInput.value);
                    else data.nomes_pais.push('Progenitor Pai');
                    if (nomeMaePaiInput && nomeMaePaiInput.value) data.nomes_pais.push(nomeMaePaiInput.value);
                    else data.nomes_pais.push('Progenitor Mãe');
                }
            }

        data.nomes_avos_outros = [];
            const numAvosOutros = parseInt(inputNumAvosOutros.value);
            if (!isNaN(numAvosOutros) && numAvosOutros > 0) {
                for (let i = 0; i < numAvosOutros; i++) {
                    const nomeAvoOutroInput = document.getElementById(`nome_avo_outro_${i}`);
                    if (nomeAvoOutroInput && nomeAvoOutroInput.value) {
                        data.nomes_avos_outros.push(nomeAvoOutroInput.value);
                    } else {
                        data.nomes_avos_outros.push(`Ascendente ${i + 1}`);
                    }
                }
            }
            
            // --- REVISED COLLECTION FOR GENERALIZED HEIR DONATION FLOW ---
            if (document.querySelector('input[name="doacoes_herdeiros"]:checked')?.value === 'sim') {
                data.valor_total_global_doacoes_herdeiros = parseFloat(inputValorTotalGlobalDoacoesHerdeiros.value) || 0;
                data.doacoes_individuais_herdeiros_com_dispensa = {};
                data.doacoes_individuais_herdeiros_sem_dispensa = {};

                const activeHeirs = getAllActiveHeirNames();

                if (activeHeirs.length > 0) {
                    for (let i = 0; i < activeHeirs.length; i++) {
                        const heirName = activeHeirs[i];
                        
                        const comDispensaInput = document.getElementById(`doacao_com_dispensa_herdeiro_${i}`);
                        data.doacoes_individuais_herdeiros_com_dispensa[heirName] = parseFloat(comDispensaInput.value || 0);

                        const semDispensaInput = document.getElementById(`doacao_sem_dispensa_herdeiro_${i}`);
                        data.doacoes_individuais_herdeiros_sem_dispensa[heirName] = parseFloat(semDispensaInput.value || 0);
                    }
                }
            } else {
                data.valor_total_global_doacoes_herdeiros = 0;
                data.doacoes_individuais_herdeiros_com_dispensa = {};
                data.doacoes_individuais_herdeiros_sem_dispensa = {};
            }
            console.log("[getFormData] Collected valor_total_global_doacoes_herdeiros:", data.valor_total_global_doacoes_herdeiros);
            console.log("[getFormData] Collected doacoes_individuais_herdeiros_com_dispensa:", data.doacoes_individuais_herdeiros_com_dispensa);
            console.log("[getFormData] Collected doacoes_individuais_herdeiros_sem_dispensa:", data.doacoes_individuais_herdeiros_sem_dispensa);
            // --- END REVISED COLLECTION ---

            // Ensure numeric fields that might be empty are sent as 0 or appropriate defaults
            // Corrected IDs for Section 3 inputs
            data.valor_bens = parseFloat(document.getElementById('valor_bens').value) || 0;
            data.valor_dividas = parseFloat(document.getElementById('valor_dividas').value) || 0;
            
            // Corrected ID for Section 5 input
        if (document.getElementById('seccao5').style.display !== 'none') {
                data.valor_bens_testamento = parseFloat(document.getElementById('valor_bens_testamento').value) || 0;
        } else {
                data.valor_bens_testamento = 0;
        }

            console.log("[getFormData] Final data object collected:", JSON.stringify(data, null, 2));
        return data;
    }

    // Event Listeners for conditional fields
    radioDeixouTestamento.forEach(radio => radio.addEventListener('change', () => {
        toggleTestamentoFieldsVisibility();
        // If current section is 4 and "não" is selected for testamento, "Próximo" becomes "Calcular"
        if (currentSection === 4) {
            updateButtonStates();
        }
        // If user is on S5 and changes testament to "no", move them to S4.
        if (currentSection === 5 && radio.value === 'nao') {
            currentSection = 4;
            showSection(currentSection);
        }
    }));

    selectEstadoCivil.addEventListener('change', (e) => {
        const estadoCivilSelecionado = e.target.value;
        if (estadoCivilSelecionado === 'casado' || estadoCivilSelecionado === 'unido_facto') {
            divRegimeBens.style.display = (estadoCivilSelecionado === 'casado') ? 'block' : 'none';
            selectRegimeBens.required = (estadoCivilSelecionado === 'casado');
            if (estadoCivilSelecionado === 'unido_facto') { // Clear regime de bens if not casado
                selectRegimeBens.value = '';
            }

            divNomeConjuge.style.display = 'block'; 
            inputNomeConjuge.required = true;      
        } else {
            divRegimeBens.style.display = 'none';
            selectRegimeBens.required = false;
            selectRegimeBens.value = '';

            divNomeConjuge.style.display = 'none'; 
            inputNomeConjuge.required = false;     
            inputNomeConjuge.value = '';
        }
    });

    radioDeixouFilhos.forEach(radio => radio.addEventListener('change', (e) => {
        if (e.target.value === 'sim') {
            divQuantosFilhos.style.display = 'block';
            inputQuantosFilhos.required = true;
            divDeixouAscendentes.style.display = 'none';
            document.querySelectorAll('input[name="deixou_ascendentes"]').forEach(r => r.checked = false);
            document.querySelectorAll('input[name="deixou_ascendentes"]').forEach(r => r.required = false);
        } else { // Não deixou filhos
            divQuantosFilhos.style.display = 'none';
            inputQuantosFilhos.required = false;
            inputQuantosFilhos.value = '';
            camposNomesFilhosDiv.innerHTML = ''; // Clear names
            divDeixouAscendentes.style.display = 'block';
            document.querySelectorAll('input[name="deixou_ascendentes"]').forEach(r => r.required = true);

        }
    }));

    inputQuantosFilhos.addEventListener('input', (e) => {
        camposNomesFilhosDiv.innerHTML = ''; // Clear previous
        const numFilhos = parseInt(e.target.value);
        if (numFilhos > 0) {
            for (let i = 1; i <= numFilhos; i++) {
                const label = document.createElement('label');
                label.setAttribute('for', `nome_filho_${i}`);
                label.textContent = `Nome do Filho ${i} (ou representante da linha de descendência):`;
                
                const input = document.createElement('input');
                input.type = 'text';
                input.id = `nome_filho_${i}`;
                input.name = `nome_filho_${i}`; // Name attribute is important for FormData
                input.classList.add('form-input');
                input.required = true;

                camposNomesFilhosDiv.appendChild(label);
                camposNomesFilhosDiv.appendChild(input);
                camposNomesFilhosDiv.appendChild(document.createElement('br')); // For spacing
            }
        }
    });

        // Section 4: Donations Logic - REVISED FOR SIMPLIFIED FLOW
    radioDoacoesHerdeiros.forEach(radio => radio.addEventListener('change', (e) => {
            const showDetalhes = e.target.value === 'sim';
            if (divDetalhesDoacoesHerdeiros) {
                divDetalhesDoacoesHerdeiros.style.display = showDetalhes ? 'block' : 'none';
            }
            if (inputValorTotalGlobalDoacoesHerdeiros) {
                inputValorTotalGlobalDoacoesHerdeiros.required = showDetalhes;
                if (!showDetalhes) {
                    inputValorTotalGlobalDoacoesHerdeiros.value = '';
                }
            }
            if (divCamposIndividuaisDoacoesHerdeiros) {
                 if (!showDetalhes) {
                    divCamposIndividuaisDoacoesHerdeiros.innerHTML = '<p><strong>Detalhe das Doações por Herdeiro:</strong></p><small>Para cada herdeiro legitimário indicado na Secção 2, especifique o valor doado COM dispensa de colação e o valor doado SEM dispensa de colação (sujeito a colação). A soma de todas estas doações individuais deve igualar o "Valor TOTAL GLOBAL" acima.</small>';
                 }
            }

            if (showDetalhes) {
                gerarCamposIndividuaisDoacoesHerdeiros();
        }
    }));

        // Remove old listeners associated with the more complex flow
        // if (radioDispensaColacaoGeral) { ... } 
        // if(inputValorDoacoesDescendentes) inputValorDoacoesDescendentes.removeEventListener('input', toggleTodasDoacoesIndividuaisDescendentes); 
        // if(inputValorTotalDoacoesComDispensaDesc) inputValorTotalDoacoesComDispensaDesc.removeEventListener('input', toggleTodasDoacoesIndividuaisDescendentes); 
        
        // Update listener for quantos_filhos to also regenerate the new donation fields
        if(inputQuantosFilhos) {
            inputQuantosFilhos.addEventListener('input', () => {
                gerarCamposNomesFilhos(); 
                if (divDetalhesDoacoesHerdeiros && divDetalhesDoacoesHerdeiros.style.display === 'block') {
                    gerarCamposIndividuaisDoacoesHerdeiros();
                }
            });
        }

    radioDoacoesOutrasPessoas.forEach(radio => radio.addEventListener('change', (e) => {
        const show = e.target.value === 'sim';
        divValorDoacoesOutrasPessoas.style.display = show ? 'block' : 'none';
        inputValorDoacoesOutrasPessoas.required = show;
        if (!show) {
            inputValorDoacoesOutrasPessoas.value = '';
        }
    }));

    // Add listeners for 'deixou_filhos' to toggle 'deixou_ascendentes' and then 'tipo_ascendentes'
    document.querySelectorAll('input[name="deixou_filhos"]').forEach(radio => {
        radio.addEventListener('change', toggleAscendentesFields);
    });

    // Add listeners for 'deixou_ascendentes' to toggle 'tipo_ascendentes'
    document.querySelectorAll('input[name="deixou_ascendentes"]').forEach(radio => {
        radio.addEventListener('change', toggleAscendentesFields);
    });

    // Add listeners for 'tipo_ascendentes' to toggle detailed parent/other ascendant fields
    radiosTipoAscendentes.forEach(radio => {
        radio.addEventListener('change', toggleDetalhesAscendentes);
    });

    // Add listeners for 'num_pais' to toggle single/dual parent name fields
    radiosNumPais.forEach(radio => {
        radio.addEventListener('change', toggleDetalhesNumPais);
    });
    
    // Add listener for 'num_avos_outros' to generate name fields
    inputNumAvosOutros.addEventListener('input', gerarCamposNomesAvosOutros);

        // Add listeners for dynamic updates of donation fields
        if(inputValorTotalGlobalDoacoesHerdeiros) inputValorTotalGlobalDoacoesHerdeiros.addEventListener('input', gerarCamposIndividuaisDoacoesHerdeiros);

    btnCalcular.addEventListener('click', async () => {
            console.log("'Calcular Simulação' button clicked.");

        // Validate all relevant sections before submitting
            const maxSectionsToValidate = document.querySelector('input[name="deixou_testamento"]:checked')?.value === 'sim' ? 5 : 4;
            console.log(`Max sections to validate: ${maxSectionsToValidate}`);

            for (let i = 1; i <= maxSectionsToValidate; i++) {
                // Skip validation for section 5 if it's hidden (e.g. no testament)
                if (i === 5 && seccao5.style.display === 'none') {
                    console.log("Skipping validation for hidden Section 5.");
                    continue;
                }
                console.log(`Validating Section ${i}...`);
                const sectionIsValid = validateSection(i);
                console.log(`Validation result for Section ${i}: ${sectionIsValid}`);
                if (!sectionIsValid) {
                alert(`Por favor, corrija os erros na Secção ${i} antes de continuar.`);
                showSection(i); // Show the section with errors
                    console.log(`Validation failed for Section ${i}. Aborting submission.`);
                return;
            }
        }
        
            console.log("All relevant sections validated. Proceeding to get form data.");
        const data = getFormData();
            console.log("Dados a enviar para o backend:", JSON.stringify(data, null, 2));

        try {
                console.log("Attempting to fetch /calculate_inheritance...");
            const response = await fetch('/calculate_inheritance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
                console.log("Received response from backend:", result);
            displayResults(result);
        } catch (error) {
            console.error('Erro ao calcular:', error);
            resultadosConteudo.innerHTML = `<p class="error">Ocorreu um erro ao processar o seu pedido: ${error.message}</p>`;
            resultadosContainer.style.display = 'block';
        }
    });

    function displayResults(data) {
            console.log("Raw data received by displayResults:", data);
            const resultadosContainer = document.getElementById('resultadosContainer');
            const resultadosConteudo = document.getElementById('resultadosConteudo');
            if (!resultadosContainer || !resultadosConteudo) {
                console.error("Elementos de resultado não encontrados! IDs should be 'resultadosContainer' and 'resultadosConteudo'.");
                return;
            }

            resultadosContainer.style.display = 'block';
            let html = '<button onclick="window.print()" class="form-button print-button">Imprimir Resultados</button>';
            html += '<button onclick="resetSimulation()" class="form-button reset-button">Nova Simulação</button>';
            html += '<h2>Resultados da Simulação de Herança</h2>';

            html += '<h3>Resumo Geral</h3>';
            html += `<p><strong>Valor Total da Herança (VTH) para cálculo da legítima:</strong> ${formatCurrency(data.VTH)}</p>`;
            html += `<p><strong>Fração da Legítima:</strong> ${data.fracao_legitima_display || 'N/A'} (correspondente a ${ (parseFloat(data.fracao_legitima || 0) * 100).toFixed(2)}%)</p>`;
            html += `<p><strong>Quota Legítima (QL):</strong> ${formatCurrency(data.QL)}</p>`;
            html += `<p><strong>Quota Disponível (QD):</strong> ${formatCurrency(data.QD)}</p>`;

            const procRes = data.processamento_heranca;
            if (!procRes) {
                html += '<p style="color:red;">Erro: Detalhes do processamento da herança (processamento_heranca) não encontrados na resposta.</p>';
                resultadosConteudo.innerHTML = html;
                document.getElementById('simulacaoForm').style.display = 'none';
                resultadosContainer.scrollIntoView({ behavior: 'smooth' });
            return;
        }

            html += `<h3>Detalhes da Partilha (${procRes.tipo_processamento || 'Não especificado'})</h3>`;

            // Attempt to get structured herdeiros_info if backend provides it for spouse/ascendants
            const herdeirosInfoGeral = procRes.herdeiros_info || {}; 

            // Specific path for the array of heir details, often containing descendants or all heirs in a flat list
            const listaTodosHerdeiros = procRes.colacao_info && procRes.colacao_info.detalhes_herdeiros 
                                      ? procRes.colacao_info.detalhes_herdeiros 
                                      : (procRes.quotas_herdeiros_final || []); // Fallback to quotas_herdeiros_final if present

            // Cônjuge - uses herdeirosInfoGeral for now
            if (data.form_data_echo && data.form_data_echo.nome_conjuge && herdeirosInfoGeral.conjuge && herdeirosInfoGeral.conjuge.nome) {
                html += '<h4>Cônjuge</h4>';
                const conjuge = herdeirosInfoGeral.conjuge;
                html += `<p><strong>${conjuge.nome || 'Cônjuge'}:</strong></p>`;
                html += '<ul>';
                // Assuming property names for conjuge would be similar if herdeirosInfoGeral.conjuge existed
                html += `<li><strong>Valor a Receber da Herança (Líquido): ${formatCurrency(conjuge.valor_final_a_receber_heranca || conjuge.valor_a_receber_da_heranca_remanescente)}</strong></li>`;
                if (conjuge.legitima_ideal_pura !== undefined) {
                    html += `<li>Legítima Individual Ideal: ${formatCurrency(conjuge.legitima_ideal_pura)}</li>`;
                }
                if (conjuge.parcela_qd_remanescente !== undefined && parseFloat(conjuge.parcela_qd_remanescente) > 0) {
                     html += `<li>Parcela da Quota Disponível Atribuída: ${formatCurrency(conjuge.parcela_qd_remanescente)}</li>`;
                }
                html += `<li>Total Final (Herança + Doações/Liberalidades já recebidas, se aplicável): ${formatCurrency(conjuge.total_recebido_final || conjuge.total_final_apos_partilha)}</li>`;
                html += '</ul>';
            } else if (data.form_data_echo && data.form_data_echo.nome_conjuge) {
                html += '<h4>Cônjuge</h4><p>Não foram encontrados detalhes de partilha específicos para o cônjuge na estrutura esperada (herdeiros_info.conjuge).</p>';
            }

            // Descendentes - uses listaTodosHerdeiros (expected to be an array from colacao_info.detalhes_herdeiros)
            // This assumes listaTodosHerdeiros primarily contains descendant data or is the main list of heirs to display.
            if (listaTodosHerdeiros.length > 0 && (data.form_data_echo && parseInt(data.form_data_echo.quantos_filhos || data.form_data_echo.num_filhos || '0') > 0) ) {
                html += '<h4>Descendentes</h4>';
                listaTodosHerdeiros.forEach(desc => {
                    // Check if current item 'desc' is likely a descendant based on form input or presence of descendant-specific fields
                    // This is a heuristic if the array is mixed; for now, assumes items are descendants if form indicated descendants.
                    html += `<p><strong>${desc.nome}:</strong></p>`;
            html += '<ul>';
                    html += `<li><strong>Valor a Receber da Herança (Líquido): ${formatCurrency(desc.valor_final_a_receber_heranca)}</strong></li>`; // Python: valor_final_a_receber_heranca
                    if (desc.doacao_sem_dispensa_imputada !== undefined && parseFloat(desc.doacao_sem_dispensa_imputada) > 0) { // Python: doacao_sem_dispensa_imputada
                        html += `<li>Doação Sujeita a Colação (imputada na legítima, já recebida): ${formatCurrency(desc.doacao_sem_dispensa_imputada)}</li>`;
                    }
                    if (desc.doacao_com_dispensa_original !== undefined && parseFloat(desc.doacao_com_dispensa_original) > 0) { // Python: doacao_com_dispensa_original
                        html += `<li>Doação Com Dispensa de Colação (valor original): ${formatCurrency(desc.doacao_com_dispensa_original)}</li>`;
                         if (desc.excesso_doacao_dispensada_imputado_legitima !== undefined && parseFloat(desc.excesso_doacao_dispensada_imputado_legitima) > 0) { // Python: excesso_doacao_dispensada_imputado_legitima
                            html += `<small style="display:block; margin-left: 15px;">&hookrightarrow; Desta, ${formatCurrency(desc.excesso_doacao_dispensada_imputado_legitima)} excedeu a QD e foi imputada na legítima.</small>`;
                        }
                        html += `<small style="display:block; margin-left: 15px;">&hookrightarrow; Imputado à QD: ${formatCurrency(desc.doacao_com_dispensa_efetiva_qd)}</small>`; // Python: doacao_com_dispensa_efetiva_qd
                    }
                    html += `<li>Legítima Individual Ideal: ${formatCurrency(desc.legitima_ideal_pura)}</li>`; // Python: legitima_ideal_pura
                    if (desc.parcela_qd_remanescente !== undefined && parseFloat(desc.parcela_qd_remanescente) > 0) { // Python: parcela_qd_remanescente
                        html += `<li>Parcela da Quota Disponível Atribuída: ${formatCurrency(desc.parcela_qd_remanescente)}</li>`;
                    }
                    html += `<li>Total Final (Herança + Doações já recebidas): ${formatCurrency(desc.total_recebido_final)}</li>`; // Python: total_recebido_final
                    html += '</ul>';
                });
            } else if (data.form_data_echo && parseInt(data.form_data_echo.quantos_filhos || data.form_data_echo.num_filhos || '0') > 0) {
                html += '<h4>Descendentes</h4><p>Não foram encontrados detalhes de partilha para descendentes na lista principal de herdeiros (colacao_info.detalhes_herdeiros).</p>';
            }

            // Ascendentes - uses herdeirosInfoGeral for now
            if (data.form_data_echo && ( (data.form_data_echo.num_pais && parseInt(data.form_data_echo.num_pais) > 0) || (data.form_data_echo.num_avos_outros && parseInt(data.form_data_echo.num_avos_outros) > 0)) && herdeirosInfoGeral.ascendentes && herdeirosInfoGeral.ascendentes.length > 0) {
                html += '<h4>Ascendentes</h4>';
                herdeirosInfoGeral.ascendentes.forEach(asc => {
                    html += `<p><strong>${asc.nome}:</strong></p>`;
                    html += '<ul>';
                    // Assuming property names for ascendant would be similar if herdeirosInfoGeral.ascendentes existed
                    html += `<li><strong>Valor a Receber da Herança (Líquido): ${formatCurrency(asc.valor_final_a_receber_heranca || asc.valor_a_receber_da_heranca_remanescente)}</strong></li>`;
                     if (asc.legitima_ideal_pura !== undefined) {
                        html += `<li>Legítima Individual Ideal: ${formatCurrency(asc.legitima_ideal_pura)}</li>`;
                    }
                    if (asc.parcela_qd_remanescente !== undefined && parseFloat(asc.parcela_qd_remanescente) > 0) {
                        html += `<li>Parcela da Quota Disponível Atribuída: ${formatCurrency(asc.parcela_qd_remanescente)}</li>`;
                    }
                    html += `<li>Total Final (Herança + Doações/Liberalidades já recebidas, se aplicável): ${formatCurrency(asc.total_recebido_final || asc.total_final_apos_partilha)}</li>`;
            html += '</ul>';
                });
            } else if (data.detailed_ascendants_echo && ( (data.detailed_ascendants_echo.num_pais && parseInt(data.detailed_ascendants_echo.num_pais) > 0) || (data.detailed_ascendants_echo.num_avos_outros && parseInt(data.detailed_ascendants_echo.num_avos_outros) > 0))) {
                 html += '<h4>Ascendentes</h4><p>Não foram encontrados detalhes de partilha específicos para ascendentes na estrutura esperada (herdeiros_info.ascendentes).</p>';
            }
            
            if (procRes.notas_gerais_calculo && procRes.notas_gerais_calculo.length > 0) {
                 html += '<h4>Notas sobre a Partilha:</h4><ul>';
                 procRes.notas_gerais_calculo.forEach(nota => { html += `<li>${nota}</li>`; });
                 html += '</ul>';
            }
            
            const imputacaoLiberalidades = procRes.imputacao_liberalidades_info; 
            if (data.form_data_echo.deixou_testamento === 'sim' || (imputacaoLiberalidades && imputacaoLiberalidades.testamento && parseFloat(imputacaoLiberalidades.testamento.valor_original_deixas) > 0)) {
                html += '<h3>Informações sobre o Testamento</h3>';
                if (imputacaoLiberalidades && imputacaoLiberalidades.testamento) {
                    const testamento = imputacaoLiberalidades.testamento;
                    html += `<p><strong>Valor Original das Deixas Testamentárias:</strong> ${formatCurrency(testamento.valor_original_deixas)}</p>`;
                    if (testamento.reducao_por_inoficiosidade !== undefined && parseFloat(testamento.reducao_por_inoficiosidade) > 0) {
                        html += '<p style="color:red;"><strong>Inoficiosidade Testamentária Detectada!</strong></p>';
                        html += `<p>As deixas testamentárias excedem a Quota Disponível.</p>`;
                        html += `<p><strong>Redução por Inoficiosidade:</strong> ${formatCurrency(testamento.reducao_por_inoficiosidade)}</p>`;
                        html += `<p><strong>Valor Ajustado das Deixas Testamentárias (após redução):</strong> ${formatCurrency(testamento.valor_efetivo_deixas)}</p>`;
                    } else {
                        html += '<p>Não foi detectada inoficiosidade testamentária.</p>';
                        html += `<p><strong>Valor Efetivo das Deixas Testamentárias:</strong> ${formatCurrency(testamento.valor_efetivo_deixas)}</p>`;
                    }
                } else {
                     html += '<p>Detalhes do testamento não disponíveis no processamento (ou testamento não indicado).</p>';
                }
            }
            
            if (imputacaoLiberalidades) {
                 if (data.form_data_echo.deixou_testamento !== 'sim' && 
                    ((imputacaoLiberalidades.doacoes_outros_qd && parseFloat(imputacaoLiberalidades.doacoes_outros_qd.total_para_qd) > 0) || 
                     (imputacaoLiberalidades.doacoes_herdeiros_com_dispensa_qd && parseFloat(imputacaoLiberalidades.doacoes_herdeiros_com_dispensa_qd.total_para_qd) > 0))) {
                    html += '<h3>Outras Liberalidades Imputadas na Quota Disponível</h3>';
                }

                if (imputacaoLiberalidades.doacoes_herdeiros_com_dispensa_qd && parseFloat(imputacaoLiberalidades.doacoes_herdeiros_com_dispensa_qd.total_para_qd) > 0) {
                    const doacoesComDispensa = imputacaoLiberalidades.doacoes_herdeiros_com_dispensa_qd;
                    html += '<h4>Doações a Herdeiros (COM Dispensa de Colação)</h4>';
                    html += `<p>Total original para imputação na QD: ${formatCurrency(doacoesComDispensa.total_para_qd)}</p>`; // Using total_para_qd as the original value meant for QD
                    html += `<p>Valor efetivamente imputado na QD: ${formatCurrency(doacoesComDispensa.valor_efetivo_na_qd)}</p>`;
                    if (doacoesComDispensa.reducao_por_inoficiosidade !== undefined && parseFloat(doacoesComDispensa.reducao_por_inoficiosidade) > 0) {
                        // Using excesso_imputado_legitimas_desc from backend response if available
                        const excessoImputado = doacoesComDispensa.excesso_imputado_legitimas_desc || doacoesComDispensa.reducao_por_inoficiosidade;
                        html += `<p style="color:red;">Inoficiosidade detectada: ${formatCurrency(doacoesComDispensa.reducao_por_inoficiosidade)}. Este excesso (${formatCurrency(excessoImputado)}) foi imputado na legítima dos donatários.</p>`;
                    }
                }
                if (imputacaoLiberalidades.doacoes_outros_qd && parseFloat(imputacaoLiberalidades.doacoes_outros_qd.total_para_qd) > 0) {
                    const doacoesOutros = imputacaoLiberalidades.doacoes_outros_qd;
                    html += '<h4>Doações a Não Herdeiros Legitimários</h4>';
                     html += `<p>Total original para imputação na QD: ${formatCurrency(doacoesOutros.total_para_qd)}</p>`;
                    html += `<p>Valor efetivamente imputado na QD: ${formatCurrency(doacoesOutros.valor_efetivo_na_qd)}</p>`;
                     if (doacoesOutros.reducao_por_inoficiosidade !== undefined && parseFloat(doacoesOutros.reducao_por_inoficiosidade) > 0) {
                        html += `<p style="color:red;">Inoficiosidade detectada: ${formatCurrency(doacoesOutros.reducao_por_inoficiosidade)} (valor reduzido)</p>`;
                    }
                }
                // Display overall QD summary if imputacaoLiberalidades object exists
                if (imputacaoLiberalidades.total_liberalidades_na_qd !== undefined) {
                    html += `<p><strong>Total Global de Liberalidades Imputadas na QD:</strong> ${formatCurrency(imputacaoLiberalidades.total_liberalidades_na_qd)}</p>`;
                }
                if (imputacaoLiberalidades.qd_remanescente_para_legitimarios !== undefined) {
                    html += `<p><strong>Quota Disponível Remanescente (após todas as liberalidades, distribuída aos legitimários):</strong> ${formatCurrency(imputacaoLiberalidades.qd_remanescente_para_legitimarios)}</p>`;
                    if (parseFloat(imputacaoLiberalidades.qd_remanescente_para_legitimarios) > 0) {
                        html += '<p><small>Este remanescente da QD é distribuído entre os herdeiros legitimários, já refletido nos seus valores a receber.</small></p>';
                    }
                }
            }

            const colacaoInfo = procRes.colacao_info; 
            if (data.form_data_echo && data.form_data_echo.doacoes_herdeiros === 'sim') {
                html += '<h3>Informações sobre a Colação (Igualação por Doações SEM Dispensa)</h3>';
                // Prefer total_geral_doacoes_sem_dispensa_colacionadas if backend provides it directly in colacao_info
                const totalColacionado = colacaoInfo && colacaoInfo.total_geral_doacoes_sem_dispensa_colacionadas !== undefined 
                                        ? colacaoInfo.total_geral_doacoes_sem_dispensa_colacionadas 
                                        : listaTodosHerdeiros.reduce((sum, h) => sum + parseFloat(h.doacao_sem_dispensa_imputada || 0), 0);

                if (parseFloat(totalColacionado) > 0 && listaTodosHerdeiros.some(h => parseFloat(h.doacao_sem_dispensa_imputada || 0) > 0)) {
                    html += `<p><strong>Total Geral Colacionado (imputado nas quotas dos herdeiros):</strong> ${formatCurrency(totalColacionado)}</p>`;
                } else {
                    html += '<p>Não houve valor colacionado por doações SEM dispensa (ou todas as doações a herdeiros foram COM dispensa).</p>';
                }
                if (colacaoInfo && colacaoInfo.notas_colacao && colacaoInfo.notas_colacao.length > 0) {
                    html += '<p><strong>Notas da Colação:</strong></p><ul>';
                    colacaoInfo.notas_colacao.forEach(nota => {
                        html += `<li>${nota}</li>`;
                    });
                    html += '</ul>';
                } else {
                    html += '<p><small>Sem notas específicas sobre a colação.</small></p>';
                }
            }
            
            const resumoVTH = procRes.resumo_vth_ql_qd;
            if (resumoVTH) {
                html += '<h3>Composição do Valor Total da Herança (VTH)</h3>';
                html += '<ul>';
                html += `<li>Bens Deixados (Relictum): ${formatCurrency(resumoVTH.relictum)}</li>`;
                if (resumoVTH.passivo !== undefined && parseFloat(resumoVTH.passivo) > 0) {
                    html += `<li>(-) Passivo (Dívidas): ${formatCurrency(resumoVTH.passivo)}</li>`;
                }
                if (resumoVTH.doacoes_total_para_vth !== undefined && parseFloat(resumoVTH.doacoes_total_para_vth) > 0) {
                     html += `<li>(+) Total de Doações (para cálculo do VTH): ${formatCurrency(resumoVTH.doacoes_total_para_vth)}</li>`;
                     if (resumoVTH.detalhe_doacoes_vth) {
                         html += '<ul>';
                         if (resumoVTH.detalhe_doacoes_vth.doacoes_herdeiros_sem_dispensa !== undefined && parseFloat(resumoVTH.detalhe_doacoes_vth.doacoes_herdeiros_sem_dispensa) > 0) html += `<li>&hookrightarrow; Doações a Herdeiros (SEM dispensa): ${formatCurrency(resumoVTH.detalhe_doacoes_vth.doacoes_herdeiros_sem_dispensa)}</li>`;
                         if (resumoVTH.detalhe_doacoes_vth.doacoes_herdeiros_com_dispensa !== undefined && parseFloat(resumoVTH.detalhe_doacoes_vth.doacoes_herdeiros_com_dispensa) > 0) html += `<li>&hookrightarrow; Doações a Herdeiros (COM dispensa): ${formatCurrency(resumoVTH.detalhe_doacoes_vth.doacoes_herdeiros_com_dispensa)}</li>`;
                         if (resumoVTH.detalhe_doacoes_vth.doacoes_outros !== undefined && parseFloat(resumoVTH.detalhe_doacoes_vth.doacoes_outros) > 0) html += `<li>&hookrightarrow; Doações a Outros: ${formatCurrency(resumoVTH.detalhe_doacoes_vth.doacoes_outros)}</li>`;
                    html += '</ul>';
                }
            }
                html += `<li><strong>VTH Calculado: ${formatCurrency(resumoVTH.vth_calculado)}</strong></li>`;
                html += '</ul>';
        }
        
        resultadosConteudo.innerHTML = html;
            document.getElementById('simulacaoForm').style.display = 'none';
        resultadosContainer.scrollIntoView({ behavior: 'smooth' });
    }

        // Helper function to get all active heir names from Section 2
        function getAllActiveHeirNames() {
            const heirNames = [];
            // Spouse
            if (inputNomeConjuge && inputNomeConjuge.value.trim() !== '' && divNomeConjuge.style.display !== 'none') {
                heirNames.push(inputNomeConjuge.value.trim());
            }
            // Children
            const numFilhosVal = parseInt(inputQuantosFilhos.value);
            if (!isNaN(numFilhosVal) && numFilhosVal > 0 && divQuantosFilhos.style.display !== 'none') {
                for (let i = 1; i <= numFilhosVal; i++) {
                    const nomeFilhoInput = document.getElementById(`nome_filho_${i}`);
                    if (nomeFilhoInput && nomeFilhoInput.value.trim() !== '') {
                        heirNames.push(nomeFilhoInput.value.trim());
                    } else {
                        heirNames.push(`Filho(a) ${i} (Nome não especificado)`); // Fallback name
                    }
                }
            }
            // Ascendants
            const tipoAscendente = document.querySelector('input[name="tipo_ascendentes"]:checked');
            if (tipoAscendente && divTipoAscendentes.style.display !== 'none') {
                if (tipoAscendente.value === 'pais' && divDetalhesPais.style.display !== 'none') {
                    const numPais = document.querySelector('input[name="num_pais"]:checked');
                    if (numPais) {
                        if (numPais.value === '1' && inputNomePai1.value.trim() !== '' && divNomePai1.style.display !== 'none') {
                            heirNames.push(inputNomePai1.value.trim());
                        } else if (numPais.value === '2' && divNomesPais2.style.display !== 'none') {
                            if (inputNomePaiMae.value.trim() !== '') heirNames.push(inputNomePaiMae.value.trim());
                            if (inputNomeMaePai.value.trim() !== '') heirNames.push(inputNomeMaePai.value.trim());
                        }
                    }
                } else if (tipoAscendente.value === 'avos_outros' && divDetalhesAvosOutros.style.display !== 'none') {
                    const numAvos = parseInt(inputNumAvosOutros.value);
                    if (!isNaN(numAvos) && numAvos > 0) {
                        for (let i = 1; i <= numAvos; i++) {
                            const nomeAvoInput = document.getElementById(`nome_avo_outro_${i}`);
                            if (nomeAvoInput && nomeAvoInput.value.trim() !== '') {
                                heirNames.push(nomeAvoInput.value.trim());
                            } else {
                                heirNames.push(`Ascendente ${i} (Nome não especificado)`); // Fallback
                            }
                        }
                    }
                }
            }
            console.log("[getAllActiveHeirNames] Active heirs:", heirNames);
            return heirNames;
        }


        // --- NEW FUNCTION TO GENERATE PAIRED COM/SEM DISPENSA INPUTS PER HEIR ---
        function gerarCamposIndividuaisDoacoesHerdeiros() {
            console.log("[gerarCamposIndividuaisDoacoesHerdeiros] Called.");
            if (!divCamposIndividuaisDoacoesHerdeiros) return;

            const pElement = divCamposIndividuaisDoacoesHerdeiros.querySelector('p');
            const smallElement = divCamposIndividuaisDoacoesHerdeiros.querySelector('small');
            divCamposIndividuaisDoacoesHerdeiros.innerHTML = ''; 
            if (pElement) divCamposIndividuaisDoacoesHerdeiros.appendChild(pElement);
            
            const activeHeirs = getAllActiveHeirNames();

            if (activeHeirs.length === 0) {
                if (smallElement) divCamposIndividuaisDoacoesHerdeiros.appendChild(smallElement);
                else {
                    const defaultSmall = document.createElement('small');
                    defaultSmall.textContent = 'Indique os herdeiros legitimários (cônjuge, filhos, ascendentes) na Secção 2 para detalhar estas doações. A soma de todas as doações (COM e SEM dispensa) para todos os herdeiros deve igualar o "Valor TOTAL GLOBAL" acima.';
                    divCamposIndividuaisDoacoesHerdeiros.appendChild(defaultSmall);
                }
                console.log("[gerarCamposIndividuaisDoacoesHerdeiros] No active heirs found.");
                return; 
            }

            console.log(`[gerarCamposIndividuaisDoacoesHerdeiros] Generating paired fields for ${activeHeirs.length} heirs.`);

            activeHeirs.forEach((heirName, i) => {
                const heirDonationContainer = document.createElement('div');
                heirDonationContainer.classList.add('heir-donation-group');
                heirDonationContainer.style.marginTop = '10px';
                heirDonationContainer.style.paddingTop = '5px';
                heirDonationContainer.style.borderTop = '1px dashed #ccc';

                const heirNameLabel = document.createElement('h5');
                heirNameLabel.textContent = heirName;
                heirNameLabel.style.marginTop = '0';
                heirDonationContainer.appendChild(heirNameLabel);

                // COM Dispensa Input
                const labelComDispensa = document.createElement('label');
                labelComDispensa.setAttribute('for', `doacao_com_dispensa_herdeiro_${i}`);
                labelComDispensa.textContent = `Valor doado a ${heirName} (COM dispensa) (€):`;
                labelComDispensa.style.display = 'block';
                const inputComDispensa = document.createElement('input');
                inputComDispensa.type = 'number';
                inputComDispensa.name = `doacao_com_dispensa_herdeiro_${i}`;
                inputComDispensa.id = `doacao_com_dispensa_herdeiro_${i}`;
                inputComDispensa.step = 'any'; inputComDispensa.min = '0'; inputComDispensa.value = '0';
                inputComDispensa.classList.add('form-input');
                inputComDispensa.required = true; 
                heirDonationContainer.appendChild(labelComDispensa);
                heirDonationContainer.appendChild(inputComDispensa);

                // SEM Dispensa Input
                const labelSemDispensa = document.createElement('label');
                labelSemDispensa.setAttribute('for', `doacao_sem_dispensa_herdeiro_${i}`);
                labelSemDispensa.textContent = `Valor doado a ${heirName} (SEM dispensa / colacionável) (€):`;
                labelSemDispensa.style.display = 'block'; labelSemDispensa.style.marginTop = '5px';
                const inputSemDispensa = document.createElement('input');
                inputSemDispensa.type = 'number';
                inputSemDispensa.name = `doacao_sem_dispensa_herdeiro_${i}`;
                inputSemDispensa.id = `doacao_sem_dispensa_herdeiro_${i}`;
                inputSemDispensa.step = 'any'; inputSemDispensa.min = '0'; inputSemDispensa.value = '0';
                inputSemDispensa.classList.add('form-input');
                inputSemDispensa.required = true; 
                heirDonationContainer.appendChild(labelSemDispensa);
                heirDonationContainer.appendChild(inputSemDispensa);

                divCamposIndividuaisDoacoesHerdeiros.appendChild(heirDonationContainer);
            });
            if (smallElement) divCamposIndividuaisDoacoesHerdeiros.appendChild(smallElement);

        }
        // --- END NEW FUNCTION ---

        // Initial calls to set correct visibility based on default/reload state
    showSection(currentSection);
    toggleTestamentoFieldsVisibility(); // Ensure S5 is correctly hidden/shown initially
    // Add other initial event listeners or field setup if needed
        console.log("[DOMContentLoaded] Script setup finished.");
    } catch (e) {
        console.error("[DOMContentLoaded] CRITICAL ERROR DURING SCRIPT SETUP:", e);
        alert("Um erro crítico ocorreu ao carregar a página. Algumas funcionalidades podem não estar disponíveis. Por favor, verifique a consola do programador.");
    }
}); 