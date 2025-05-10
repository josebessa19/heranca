document.addEventListener('DOMContentLoaded', () => {
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
    const radioDoacoesDescendentes = document.querySelectorAll('input[name="doacoes_descendentes"]');
    const divValorDoacoesDescendentes = document.getElementById('divValorDoacoesDescendentes');
    const inputValorDoacoesDescendentes = document.getElementById('valor_doacoes_descendentes');
    const divDispensaColacao = document.getElementById('divDispensaColacao');
    const radioDispensaColacao = document.querySelectorAll('input[name="dispensa_colacao_descendentes"]');
    const divValorDoacoesComDispensa = document.getElementById('divValorDoacoesComDispensa');
    const inputValorDoacoesComDispensa = document.getElementById('valor_doacoes_com_dispensa');
    const radioDoacoesOutrasPessoas = document.querySelectorAll('input[name="doacoes_outras_pessoas"]');
    const divValorDoacoesOutrasPessoas = document.getElementById('divValorDoacoesOutrasPessoas');
    const inputValorDoacoesOutrasPessoas = document.getElementById('valor_doacoes_outras_pessoas');
    
    // Section 5 fields
    const seccao5 = document.getElementById('seccao5');
    const inputValorBensTestamento = document.getElementById('valor_bens_testamento');

    const btnCalcular = document.getElementById('btnCalcular');
    const resultadosContainer = document.getElementById('resultadosContainer');
    const resultadosConteudo = document.getElementById('resultadosConteudo');

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
            // Validations for Section 4 (Donations)
            const doacoesDescChecked = document.querySelector('input[name="doacoes_descendentes"]:checked');
            if (doacoesDescChecked && doacoesDescChecked.value === 'sim') {
                if (divValorDoacoesDescendentes.style.display !== 'none' && !inputValorDoacoesDescendentes.value) {
                    alert('Por favor, insira o valor total das doações a descendentes.');
                    isValid = false;
                }
                const dispensaColacaoChecked = document.querySelector('input[name="dispensa_colacao_descendentes"]:checked');
                if (divDispensaColacao.style.display !== 'none' && !dispensaColacaoChecked) {
                    alert('Por favor, selecione se alguma doação a descendentes foi com dispensa de colação.');
                    isValid = false;
                }
                if (dispensaColacaoChecked && (dispensaColacaoChecked.value === 'sim' || dispensaColacaoChecked.value === 'parcialmente')) {
                    if (divValorDoacoesComDispensa.style.display !== 'none' && !inputValorDoacoesComDispensa.value) {
                        alert('Por favor, insira o valor das doações com dispensa de colação.');
                        isValid = false;
                    }
                }
            }
            const doacoesOutrasChecked = document.querySelector('input[name="doacoes_outras_pessoas"]:checked');
            if (doacoesOutrasChecked && doacoesOutrasChecked.value === 'sim') {
                if (divValorDoacoesOutrasPessoas.style.display !== 'none' && !inputValorDoacoesOutrasPessoas.value) {
                    alert('Por favor, insira o valor total das doações a outras pessoas.');
                    isValid = false;
                }
            }
        } else if (sectionNum === 5) {
             if (seccao5.style.display !== 'none' && !inputValorBensTestamento.value) {
                alert('Por favor, insira o valor total dos bens deixados em testamento.');
                isValid = false;
            }
        }
        return isValid;
    }

    function getFormData() {
            const data = {};
        // Collect all form data using FormData API first
        const formData = new FormData(form);
            formData.forEach((value, key) => {
                data[key] = value;
            });

        // Handle specific fields like radio buttons not checked, or those needing type conversion
        // Seção 1
        data.deixou_testamento = document.querySelector('input[name="deixou_testamento"]:checked')?.value;
        data.estado_civil = document.querySelector('input[name="estado_civil"]:checked')?.value;
        if (document.getElementById('divRegimeBens').style.display !== 'none') {
            data.regime_bens = document.querySelector('input[name="regime_bens"]:checked')?.value;
        } else {
            data.regime_bens = null;
        }

        // Seção 2
        data.conjuge_sobrevivo_input = document.querySelector('input[name="conjuge_sobrevivo_input"]:checked')?.value;
        if (document.getElementById('divNomeConjuge').style.display !== 'none') {
            data.nome_conjuge = document.getElementById('inputNomeConjuge').value;
        } else {
            data.nome_conjuge = null;
        }
        data.deixou_filhos = document.querySelector('input[name="deixou_filhos"]:checked')?.value;
        if (document.getElementById('divNumFilhos').style.display !== 'none') {
            data.num_filhos = parseInt(document.getElementById('inputNumFilhos').value) || 0;
        } else {
            data.num_filhos = 0;
        }
        data.nomes_filhos = [];
        if (data.deixou_filhos === 'sim' && data.num_filhos > 0) { // Ensure num_filhos is also checked
            const camposNomesFilhos = document.getElementById('camposNomesFilhos');
            const inputsNomesFilhos = camposNomesFilhos.querySelectorAll('input[type="text"]');
            inputsNomesFilhos.forEach(input => {
                if (input.value.trim() !== '') { // Only push non-empty names
                    data.nomes_filhos.push(input.value.trim());
                }
            });
        }

        if (document.getElementById('divDeixouAscendentes').style.display !== 'none') {
            data.deixou_ascendentes = document.querySelector('input[name="deixou_ascendentes"]:checked')?.value;
            if (data.deixou_ascendentes === 'sim' && document.getElementById('divTipoAscendentes').style.display !== 'none') {
                data.tipo_ascendentes = document.querySelector('input[name="tipo_ascendentes"]:checked')?.value;
            } else {
                data.tipo_ascendentes = null;
            }
        } else {
            data.deixou_ascendentes = null;
            data.tipo_ascendentes = null;
        }

        // Detailed ascendant data
        data.num_pais = null;
        data.nomes_pais = [];
        data.num_avos_outros = null;
        data.nomes_avos_outros = [];

        if (data.tipo_ascendentes === 'pais' && document.getElementById('divDetalhesPais').style.display !== 'none') {
            const numPaisChecked = document.querySelector('input[name="num_pais"]:checked');
            if (numPaisChecked) {
                data.num_pais = parseInt(numPaisChecked.value);
                if (data.num_pais === 1 && document.getElementById('divNomePai1').style.display !== 'none') {
                    if (document.getElementById('nome_pai_1').value.trim()) {
                        data.nomes_pais.push(document.getElementById('nome_pai_1').value.trim());
                    }
                } else if (data.num_pais === 2 && document.getElementById('divNomesPais2').style.display !== 'none') {
                    if (document.getElementById('nome_pai_mae').value.trim()) {
                        data.nomes_pais.push(document.getElementById('nome_pai_mae').value.trim());
                    }
                    if (document.getElementById('nome_mae_pai').value.trim()) {
                        data.nomes_pais.push(document.getElementById('nome_mae_pai').value.trim());
                    }
                }
            }
        } else if (data.tipo_ascendentes === 'avos_outros' && document.getElementById('divDetalhesAvosOutros').style.display !== 'none') {
            const numAvosOutrosVal = document.getElementById('num_avos_outros').value;
            if (numAvosOutrosVal && parseInt(numAvosOutrosVal) > 0) {
                data.num_avos_outros = parseInt(numAvosOutrosVal);
                const camposNomesAvos = document.getElementById('camposNomesAvosOutros');
                const inputsNomesAvos = camposNomesAvos.querySelectorAll('input[type="text"]');
                inputsNomesAvos.forEach(input => {
                    if (input.value.trim() !== '') {
                        data.nomes_avos_outros.push(input.value.trim());
                    }
                });
            }
        }

        // Seção 3
        // For simpler cases, directly get relictum_valor_total and passivo_valor_total
        data.relictum_valor_total = parseFloat(document.getElementById('inputRelictumTotal').value) || 0;
        data.passivo_valor_total = parseFloat(document.getElementById('inputPassivoTotal').value) || 0;
        
        // Detailed fields (if they become primary later)
        data.relictum_bens_comuns = parseFloat(document.getElementById('inputRelictumBensComuns').value) || 0;
        data.relictum_bens_proprios = parseFloat(document.getElementById('inputRelictumBensProprios').value) || 0;
        data.dividas_comuns = parseFloat(document.getElementById('inputDividasComuns').value) || 0;
        data.dividas_proprias = parseFloat(document.getElementById('inputDividasProprias').value) || 0;


        // Seção 4
        data.doacoes_descendentes_com_dispensa_colacao = parseFloat(document.getElementById('inputDoacoesDescComDispensa').value) || 0;
        data.doacoes_descendentes_sem_dispensa_colacao = parseFloat(document.getElementById('inputDoacoesDescSemDispensa').value) || 0;
        data.doacoes_outros_herdeiros_legitimarios = parseFloat(document.getElementById('inputDoacoesOutrosHerdeiros').value) || 0;
        data.doacoes_nao_herdeiros = parseFloat(document.getElementById('inputDoacoesNaoHerdeiros').value) || 0;

        // Seção 5
        if (document.getElementById('seccao5').style.display !== 'none') {
            data.valor_testamento = parseFloat(document.getElementById('inputValorTestamento').value) || 0;
        } else {
            data.valor_testamento = 0;
        }

        console.log("Data collected:", data);
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

    // Section 4: Donations Logic
    radioDoacoesDescendentes.forEach(radio => radio.addEventListener('change', (e) => {
        const show = e.target.value === 'sim';
        divValorDoacoesDescendentes.style.display = show ? 'block' : 'none';
        inputValorDoacoesDescendentes.required = show;
        divDispensaColacao.style.display = show ? 'block' : 'none';
        radioDispensaColacao.forEach(r => r.required = show);

        if (!show) {
            inputValorDoacoesDescendentes.value = '';
            radioDispensaColacao.forEach(r => r.checked = false);
            divValorDoacoesComDispensa.style.display = 'none';
            inputValorDoacoesComDispensa.required = false;
            inputValorDoacoesComDispensa.value = '';
        }
    }));

    radioDispensaColacao.forEach(radio => radio.addEventListener('change', (e) => {
        const showValorComDispensa = (e.target.value === 'sim' || e.target.value === 'parcialmente');
        divValorDoacoesComDispensa.style.display = showValorComDispensa ? 'block' : 'none';
        inputValorDoacoesComDispensa.required = showValorComDispensa;
        if (!showValorComDispensa) {
            inputValorDoacoesComDispensa.value = '';
        }
    }));

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

    btnCalcular.addEventListener('click', async () => {
        // Validate all relevant sections before submitting
        for (let i = 1; i <= (document.querySelector('input[name="deixou_testamento"]:checked')?.value === 'sim' ? 5 : 4); i++) {
            // Skip validation for section 5 if it's hidden
            if (i === 5 && seccao5.style.display === 'none') continue;
            if (!validateSection(i)) {
                alert(`Por favor, corrija os erros na Secção ${i} antes de continuar.`);
                showSection(i); // Show the section with errors
                return;
            }
        }
        
        const data = getFormData();
        console.log("Dados a enviar:", data);

        try {
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
            displayResults(result);
        } catch (error) {
            console.error('Erro ao calcular:', error);
            resultadosConteudo.innerHTML = `<p class="error">Ocorreu um erro ao processar o seu pedido: ${error.message}</p>`;
            resultadosContainer.style.display = 'block';
        }
    });

    function displayResults(data) {
        resultadosConteudo.innerHTML = ''; // Clear previous results
        
        if (data.error) {
            resultadosConteudo.innerHTML = `<p class="error">Erro no cálculo: ${data.error}</p>`;
            resultadosContainer.style.display = 'block';
            return;
        }

        const formatCurrency = (value) => value !== undefined && value !== null ? parseFloat(value).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }) : 'N/A';

        let html = '<p><strong>Cálculo Base da Herança:</strong></p>';
        html += `<p>Valor Total da Herança (VTH): <strong>${formatCurrency(data.VTH)}</strong></p>`;
        html += `<p>Fração da Legítima (Quota Indisponível): <strong>${data.fracao_legitima_display || data.fracao_legitima || 'N/A'}</strong></p>`;
        html += `<p>Quota Legítima (QL): <strong>${formatCurrency(data.QL)}</strong></p>`;
        html += `<p>Quota Disponível (QD): <strong>${formatCurrency(data.QD)}</strong></p>`;

        if (data.processamento_heranca) {
            const proc = data.processamento_heranca;
            html += '<hr><p><strong>Processamento da Herança:</strong></p>';
            html += `<p>Tipo de Processamento: <strong>${proc.tipo_processamento}</strong></p>`;
            
            if (proc.inoficiosidade_testamentaria_detectada) {
                html += `<p style="color: orange;"><strong>Inoficiosidade Testamentária Detectada!</strong> As deixas testamentárias excedem a Quota Disponível.</p>`;
                html += `<p>Valor original das deixas testamentárias: ${formatCurrency(proc.valor_original_deixas_testamento)}</p>`;
                html += `<p>Valor ajustado das deixas testamentárias (após redução): ${formatCurrency(proc.valor_deixas_test_ajustado)}</p>`;
                html += `<p>Valor da redução por inoficiosidade: ${formatCurrency(proc.reducao_inoficiosidade)}</p>`;
            } else if (proc.valor_deixas_test_ajustado !== undefined) {
                 html += `<p>Deixas testamentárias (consideradas): ${formatCurrency(proc.valor_deixas_test_ajustado)}</p>`;
            }

            html += '<p><strong>Distribuição da Quota Legítima (Base):</strong></p>';
            html += '<ul>';
            if (proc.quotas_herdeiros_base) {
                if (proc.quotas_herdeiros_base.conjuge && proc.quotas_herdeiros_base.conjuge.quota > 0) {
                    const conjugeNome = data.form_data_echo?.nome_conjuge || 'Cônjuge';
                    html += `<li>${conjugeNome}: ${formatCurrency(proc.quotas_herdeiros_base.conjuge.quota)}</li>`;
                }
                if (proc.quotas_herdeiros_base.descendentes && proc.quotas_herdeiros_base.descendentes.length > 0) {
                    proc.quotas_herdeiros_base.descendentes.forEach((desc, index) => {
                         const descNome = desc.nome || `Descendente ${index + 1}`;
                         html += `<li>${descNome}: ${formatCurrency(desc.quota_individual)} (Linha de Descendência)</li>`;
                    });
                } else if (proc.quotas_herdeiros_base.ascendentes && proc.quotas_herdeiros_base.ascendentes.quota > 0) {
                     html += `<li>Ascendentes (total): ${formatCurrency(proc.quotas_herdeiros_base.ascendentes.quota)}</li>`;
                }
                 if (proc.quotas_herdeiros_base.nota_distribuicao) {
                    html += `<li><em>Nota: ${proc.quotas_herdeiros_base.nota_distribuicao}</em></li>`;
                }
            } else {
                html += '<li>Nenhuma informação de quotas base disponível.</li>';
            }
            html += '</ul>';

            if (data.colacao_info) {
                const colacao = data.colacao_info;
                html += '<hr><p><strong>Processamento da Colação (Doações a Descendentes):</strong></p>';
                html += `<p>Total de doações a descendentes sujeitas a colação: <strong>${formatCurrency(colacao.total_doacoes_desc_sem_dispensa_para_colacao)}</strong></p>`;
                if (colacao.nota_colacao) {
                    html += `<p><em>Nota sobre Colação: ${colacao.nota_colacao}</em></p>`;
                }
                if (colacao.final_quotas_com_colacao) {
                    html += '<p><strong>Quotas Finais dos Herdeiros Legitimários (após Colação):</strong></p>';
                    html += '<ul>';
                     if (colacao.final_quotas_com_colacao.conjuge && colacao.final_quotas_com_colacao.conjuge.quota_final > 0) {
                        const conjugeNome = data.form_data_echo?.nome_conjuge || 'Cônjuge';
                        html += `<li>${conjugeNome}: ${formatCurrency(colacao.final_quotas_com_colacao.conjuge.quota_final)}</li>`;
                    }
                    if (colacao.final_quotas_com_colacao.descendentes && colacao.final_quotas_com_colacao.descendentes.length > 0) {
                        colacao.final_quotas_com_colacao.descendentes.forEach((desc, index) => {
                            const descNome = desc.nome || `Descendente ${index + 1}`;
                            html += `<li>${descNome}: ${formatCurrency(desc.quota_final_individual)} (Quota Base: ${formatCurrency(desc.quota_base_individual)}, Ajuste Colação: ${formatCurrency(desc.ajuste_colacao_individual)})</li>`;
                        });
                    } else if (colacao.final_quotas_com_colacao.ascendentes && colacao.final_quotas_com_colacao.ascendentes.quota_final > 0) {
                         html += `<li>Ascendentes (total): ${formatCurrency(colacao.final_quotas_com_colacao.ascendentes.quota_final)}</li>`;
                    }
                     if (colacao.final_quotas_com_colacao.nota_distribuicao) {
                        html += `<li><em>Nota: ${colacao.final_quotas_com_colacao.nota_distribuicao}</em></li>`;
                    }
                    html += '</ul>';
                }
            }
        }
        
        resultadosConteudo.innerHTML = html;
        resultadosContainer.style.display = 'block';
        resultadosContainer.scrollIntoView({ behavior: 'smooth' });
    }

    // Initial setup
    showSection(currentSection);
    toggleTestamentoFieldsVisibility(); // Ensure S5 is correctly hidden/shown initially
    // Add other initial event listeners or field setup if needed
}); 