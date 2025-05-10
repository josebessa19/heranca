# calculos_heranca.py

def calcular_vth(relictum_valor, passivo_valor, donatum_descendentes_total, donatum_outros_total):
    """Calcula o Valor da Herança para a Legítima (VTH)."""
    # Ensure all inputs that should be numbers are treated as such, defaulting to 0 if None or empty
    r = float(relictum_valor) if relictum_valor else 0.0
    p = float(passivo_valor) if passivo_valor else 0.0
    dd = float(donatum_descendentes_total) if donatum_descendentes_total else 0.0
    do = float(donatum_outros_total) if donatum_outros_total else 0.0
    
    vth = r - p + dd + do
    return vth

def determinar_fracao_legitima(conjuge_sobrevive, num_filhos, ascendentes_presentes, tipo_ascendentes=None):
    """Determina a fração da legítima (QL) e retorna a fração e uma string descritiva."""
    if num_filhos > 0:
        if conjuge_sobrevive:
            return 2/3, "2/3 (cônjuge e filhos)"
        else:
            return 1/2, "1/2 (filhos)" # Art. 2159.º, n.º 2 CC - se não há cônjuge, QL dos filhos é 1/2
    elif conjuge_sobrevive:
        if ascendentes_presentes:
            return 2/3, "2/3 (cônjuge e ascendentes)"
        else:
            return 1/2, "1/2 (cônjuge)"
    elif ascendentes_presentes:
        if tipo_ascendentes == "pais":
            return 1/2, "1/2 (pais)" # Art. 2161.º, n.º 2 CC
        elif tipo_ascendentes == "avos_outros":
            return 1/3, "1/3 (avós/outros ascendentes)" # Art. 2161.º, n.º 2 CC
        else:
            # Fallback if tipo_ascendentes is not specified but ascendentes are present
            # This case implies only ascendentes are heirs, without further specification. Typically 1/2 or 1/3
            # Defaulting to the more general or cautious approach, or requiring clarification.
            # For now, let's assume 1/2 if only ascendentes and type not specified (could be 1 parent)
            return 1/2, "1/2 (ascendentes - tipo não especificado)"
    else:
        return 0, "0 (sem herdeiros legitimários)" # Ou 1, se considerarmos que tudo é QD

def calcular_quotas(vth, fracao_legitima):
    """Calcula a Quota Legítima (QL) e a Quota Disponível (QD)."""
    ql = vth * fracao_legitima
    qd = vth - ql
    # Ensure QD is not negative due to floating point issues if VTH is very small or zero
    if qd < 0 and abs(qd) < 1e-9: # Using a small epsilon for comparison
        qd = 0.0
    return ql, qd

def distribuir_valor(valor_a_distribuir, herdeiros, tem_conjuge, num_linhas_descendencia, tem_ascendentes, 
                     nome_conjuge, nomes_filhos, 
                     tipo_ascendentes=None, num_pais=None, nomes_pais=None, 
                     num_avos_outros=None, nomes_avos_outros=None,
                     base_calculo_legitima=True):
    """
    Distribui um valor entre cônjuge, filhos (com nomes) e ascendentes (com nomes e número).
    Retorna um dicionário com quotas nomeadas.
    """
    resultado = {
        'conjuge': {'nome': nome_conjuge if nome_conjuge else 'Cônjuge', 'quota': 0},
        'descendentes': [], # Lista de dicts: {'nome': str, 'quota_individual': float}
        'ascendentes': [], # NOW A LIST: [{'nome': str, 'quota_individual': float}]
        'nota_distribuicao': ''
    }
    filhos_int = int(num_linhas_descendencia if num_linhas_descendencia else 0)
    
    # Ensure nomes_filhos list has enough entries
    nomes_filhos_list = list(nomes_filhos) if nomes_filhos else []
    if filhos_int > len(nomes_filhos_list):
        for i in range(len(nomes_filhos_list), filhos_int):
            nomes_filhos_list.append(f"Filho(a) {i+1} (Nome não fornecido)")

    # Ensure ascendant names lists are a_list
    nomes_pais_list = list(nomes_pais) if nomes_pais else []
    nomes_avos_outros_list = list(nomes_avos_outros) if nomes_avos_outros else []


    if tem_conjuge and filhos_int > 0:
        quota_conjuge_final = 0
        quota_por_filho_final = 0
        
        if valor_a_distribuir > 0: # Proceed only if there is something to distribute
            # Calculate the spouse's minimum share (1/4 of the total to be divided among spouse and children)
            min_quota_conjuge = valor_a_distribuir / 4.0
            
            # Calculate the share per "head" (spouse counts as one head)
            share_per_head = valor_a_distribuir / (filhos_int + 1.0)
            
            if share_per_head < min_quota_conjuge:
                quota_conjuge_final = min_quota_conjuge
                remanescente_para_filhos = valor_a_distribuir - quota_conjuge_final
                if filhos_int > 0: # Should be true here
                    quota_por_filho_final = remanescente_para_filhos / filhos_int
                else: # Should not happen if filhos_int > 0 initially
                    quota_por_filho_final = 0 
            else:
                quota_conjuge_final = share_per_head
                quota_por_filho_final = share_per_head
        
        resultado['conjuge']['quota'] = quota_conjuge_final
        for i in range(filhos_int):
            resultado['descendentes'].append({
                'nome': nomes_filhos_list[i] if i < len(nomes_filhos_list) else f'Filho(a) {i+1}',
                'quota_individual': quota_por_filho_final
            })

    elif filhos_int > 0: # Only Descendentes
        quota_por_filho = valor_a_distribuir / filhos_int if filhos_int > 0 else 0
        for i in range(filhos_int):
            resultado['descendentes'].append({
                'nome': nomes_filhos_list[i] if i < len(nomes_filhos_list) else f'Filho(a) {i+1}',
                'quota_individual': quota_por_filho
            })
        resultado['conjuge']['quota'] = 0

    elif tem_conjuge and tem_ascendentes:
        quota_conjuge = valor_a_distribuir * (2/3)
        quota_total_ascendentes = valor_a_distribuir * (1/3)
        resultado['conjuge']['quota'] = quota_conjuge

        if tipo_ascendentes == 'pais' and num_pais:
            num_pais_int = int(num_pais)
            if num_pais_int > 0:
                quota_por_pai = quota_total_ascendentes / num_pais_int
                for i in range(num_pais_int):
                    nome = nomes_pais_list[i] if i < len(nomes_pais_list) else f"Progenitor {i+1}"
                    resultado['ascendentes'].append({'nome': nome, 'quota_individual': quota_por_pai})
        elif tipo_ascendentes == 'avos_outros' and num_avos_outros:
            num_avos_outros_int = int(num_avos_outros)
            if num_avos_outros_int > 0:
                quota_por_avo_outro = quota_total_ascendentes / num_avos_outros_int
                for i in range(num_avos_outros_int):
                    nome = nomes_avos_outros_list[i] if i < len(nomes_avos_outros_list) else f"Ascendente (Avó/Outro) {i+1}"
                    resultado['ascendentes'].append({'nome': nome, 'quota_individual': quota_por_avo_outro})
        else: # Fallback if type not specified but asc present (should not happen if form is good)
            if quota_total_ascendentes > 0: # Avoid adding if share is zero
                 resultado['ascendentes'].append({'nome': 'Ascendentes (detalhe não especificado)', 'quota_individual': quota_total_ascendentes})


    elif tem_conjuge: # Only Cônjuge
        resultado['conjuge']['quota'] = valor_a_distribuir

    elif tem_ascendentes: # Only Ascendentes
        quota_total_ascendentes = valor_a_distribuir
        if tipo_ascendentes == 'pais' and num_pais:
            num_pais_int = int(num_pais)
            if num_pais_int > 0:
                quota_por_pai = quota_total_ascendentes / num_pais_int
                for i in range(num_pais_int):
                    nome = nomes_pais_list[i] if i < len(nomes_pais_list) else f"Progenitor {i+1}"
                    resultado['ascendentes'].append({'nome': nome, 'quota_individual': quota_por_pai})
        elif tipo_ascendentes == 'avos_outros' and num_avos_outros:
            num_avos_outros_int = int(num_avos_outros)
            if num_avos_outros_int > 0:
                quota_por_avo_outro = quota_total_ascendentes / num_avos_outros_int
                for i in range(num_avos_outros_int):
                    nome = nomes_avos_outros_list[i] if i < len(nomes_avos_outros_list) else f"Ascendente (Avó/Outro) {i+1}"
                    resultado['ascendentes'].append({'nome': nome, 'quota_individual': quota_por_avo_outro})
        else: # Fallback
            if quota_total_ascendentes > 0:
                resultado['ascendentes'].append({'nome': 'Ascendentes (detalhe não especificado)', 'quota_individual': quota_total_ascendentes})
    
    if filhos_int > 0:
        resultado['nota_distribuicao'] = ("A quota individual por descendente é para cada linha de descendência. "
                                        "Se houver direito de representação, esta quota deve ser subdividida entre os representantes dessa linha.")
    elif tem_ascendentes and not resultado['ascendentes'] and valor_a_distribuir > 0 :
        # This case might occur if tem_ascendentes is true but tipo_ascendentes or num_... is None/0
        # leading to an empty list. Provide a generic note.
        resultado['nota_distribuicao'] = ("Ascendentes foram indicados, mas detalhes para distribuição individual não foram totalmente fornecidos ou aplicáveis. "
                                         "O valor total para ascendentes foi calculado.")
        # Optionally add a generic entry if the list is empty but there's a share
        if not resultado['ascendentes'] and valor_a_distribuir > 0 and ( (tem_conjuge and tem_ascendentes) or (tem_ascendentes and not tem_conjuge and not filhos_int) ):
             asc_share = 0
             if tem_conjuge and tem_ascendentes: asc_share = valor_a_distribuir * (1/3)
             elif tem_ascendentes: asc_share = valor_a_distribuir
             if asc_share > 0:
                resultado['ascendentes'].append({'nome': 'Ascendentes (Total Genérico)', 'quota_individual': asc_share})


    return resultado

def processar_sem_testamento(vth, quota_legitima, quota_disponivel, conjuge_sobrevive, 
                             num_filhos_para_calculo, deixou_ascendentes, 
                             nome_conjuge, nomes_filhos, tipo_ascendentes=None, 
                             num_pais=None, nomes_pais=None, num_avos_outros=None, nomes_avos_outros=None,
                             relictum=0, passivo=0):
    """Processa a herança SEM testamento, distribuindo (Relictum - Passivo)."""
    valor_a_partilhar_total = max(0, float(relictum if relictum else 0) - float(passivo if passivo else 0))
    
    quotas_herdeiros = distribuir_valor(
        valor_a_distribuir=valor_a_partilhar_total, 
        herdeiros=None, 
        tem_conjuge=conjuge_sobrevive, 
        num_linhas_descendencia=num_filhos_para_calculo, 
        tem_ascendentes=deixou_ascendentes, 
        nome_conjuge=nome_conjuge, 
        nomes_filhos=nomes_filhos, 
        tipo_ascendentes=tipo_ascendentes,
        num_pais=num_pais, nomes_pais=nomes_pais,
        num_avos_outros=num_avos_outros, nomes_avos_outros=nomes_avos_outros,
        base_calculo_legitima=True 
    )
    return {
        'tipo_processamento': 'Sucessão Legítima (Sem Testamento)',
        'valor_total_partilhado': valor_a_partilhar_total,
        'quotas_herdeiros_base': quotas_herdeiros,
        'inoficiosidade_testamentaria_detectada': False,
        'valor_deixas_test_ajustado': 0
    }

def processar_com_testamento(vth, quota_legitima, quota_disponivel, valor_testamento_original, 
                             conjuge_sobrevive, num_filhos_para_calculo, deixou_ascendentes, 
                             nome_conjuge, nomes_filhos, tipo_ascendentes=None, 
                             num_pais=None, nomes_pais=None, num_avos_outros=None, nomes_avos_outros=None,
                             relictum=0, passivo=0, doacoes_desc_com_dispensa=0, 
                             doacoes_outros_total_para_qd=0):
    """Processa a herança COM testamento."""
    val_deixas_test = float(valor_testamento_original if valor_testamento_original else 0)
    val_doac_desc_disp = float(doacoes_desc_com_dispensa if doacoes_desc_com_dispensa else 0)
    val_doac_outros_qd = float(doacoes_outros_total_para_qd if doacoes_outros_total_para_qd else 0)

    liberalidades_imputaveis_na_qd = val_deixas_test + val_doac_desc_disp + val_doac_outros_qd
    
    reducao_inoficiosidade = 0
    valor_deixas_test_ajustado = val_deixas_test
    inoficiosidade_detectada = False

    if liberalidades_imputaveis_na_qd > quota_disponivel:
        inoficiosidade_detectada = True
        reducao_inoficiosidade = liberalidades_imputaveis_na_qd - quota_disponivel
        valor_deixas_test_ajustado = max(0, val_deixas_test - reducao_inoficiosidade)
        liberalidades_efetivas_na_qd = valor_deixas_test_ajustado + val_doac_desc_disp + val_doac_outros_qd
    else:
        liberalidades_efetivas_na_qd = liberalidades_imputaveis_na_qd
    
    liberalidades_efetivas_na_qd = min(liberalidades_efetivas_na_qd, quota_disponivel)

    # Quota Legítima é distribuída na totalidade
    quotas_na_ql = distribuir_valor(
        valor_a_distribuir=quota_legitima, 
        herdeiros=None, 
        tem_conjuge=conjuge_sobrevive, 
        num_linhas_descendencia=num_filhos_para_calculo, 
        tem_ascendentes=deixou_ascendentes, 
        nome_conjuge=nome_conjuge, 
        nomes_filhos=nomes_filhos, 
        tipo_ascendentes=tipo_ascendentes,
        num_pais=num_pais, nomes_pais=nomes_pais,
        num_avos_outros=num_avos_outros, nomes_avos_outros=nomes_avos_outros,
        base_calculo_legitima=True
    )
    
    qd_remanescente = quota_disponivel - liberalidades_efetivas_na_qd
    if qd_remanescente < 0.005: qd_remanescente = 0

    quotas_herdeiros_finais = {
        'conjuge': {'nome': nome_conjuge if nome_conjuge else 'Cônjuge', 'quota': 0},
        'descendentes': [],
        'ascendentes': [], # Changed from object to list
        'nota_distribuicao': quotas_na_ql.get('nota_distribuicao', '')
    }

    quotas_herdeiros_finais['conjuge']['quota'] = quotas_na_ql['conjuge']['quota']
    quotas_herdeiros_finais['descendentes'] = list(quotas_na_ql['descendentes'])
    quotas_herdeiros_finais['ascendentes'] = list(quotas_na_ql['ascendentes']) # Now a list

    if qd_remanescente > 0:
        quotas_do_remanescente_qd = distribuir_valor(
            valor_a_distribuir=qd_remanescente, 
            herdeiros=None, 
            tem_conjuge=conjuge_sobrevive, 
            num_linhas_descendencia=num_filhos_para_calculo, 
            tem_ascendentes=deixou_ascendentes, 
            nome_conjuge=nome_conjuge, 
            nomes_filhos=nomes_filhos, 
            tipo_ascendentes=tipo_ascendentes,
            num_pais=num_pais, nomes_pais=nomes_pais,
            num_avos_outros=num_avos_outros, nomes_avos_outros=nomes_avos_outros,
            base_calculo_legitima=False
        )
        quotas_herdeiros_finais['conjuge']['quota'] += quotas_do_remanescente_qd['conjuge']['quota']
        for i in range(len(quotas_herdeiros_finais['descendentes'])):
            if i < len(quotas_do_remanescente_qd['descendentes']): # Check boundary
                quotas_herdeiros_finais['descendentes'][i]['quota_individual'] += quotas_do_remanescente_qd['descendentes'][i]['quota_individual']
        
        # Summing QD remanescente for ascendentes
        for i in range(len(quotas_do_remanescente_qd['ascendentes'])):
            nome_asc_remanescente = quotas_do_remanescente_qd['ascendentes'][i]['nome']
            quota_asc_remanescente = quotas_do_remanescente_qd['ascendentes'][i]['quota_individual']
            
            found_asc = False
            for j in range(len(quotas_herdeiros_finais['ascendentes'])):
                if quotas_herdeiros_finais['ascendentes'][j]['nome'] == nome_asc_remanescente:
                    quotas_herdeiros_finais['ascendentes'][j]['quota_individual'] += quota_asc_remanescente
                    found_asc = True
                    break
            if not found_asc and quota_asc_remanescente > 0 : # Should not happen if names are consistent
                 quotas_herdeiros_finais['ascendentes'].append({'nome': nome_asc_remanescente, 'quota_individual': quota_asc_remanescente})


    return {
        'tipo_processamento': 'Sucessão Contratual e Testamentária (Com Testamento)',
        'quotas_herdeiros_base': quotas_herdeiros_finais, 
        'inoficiosidade_testamentaria_detectada': inoficiosidade_detectada,
        'valor_original_deixas_testamento': val_deixas_test,
        'valor_deixas_test_ajustado': valor_deixas_test_ajustado,
        'reducao_inoficiosidade': reducao_inoficiosidade,
        'qd_remanescente_distribuido_legitimarios': qd_remanescente,
        'valor_total_liberalidades_imputadas_qd': liberalidades_efetivas_na_qd
    }

def aplicar_colacao(quotas_herdeiros_base, total_doacoes_desc_sem_dispensa_para_colacao, 
                    num_linhas_descendencia, vth, detalhes_filhos_donatarios=None):
    """
    Aplica a colação às quotas dos descendentes. 
    `quotas_herdeiros_base` já inclui nomes.
    """
    final_quotas = {
        'conjuge': {},
        'descendentes': [],
        'ascendentes': [], # Will now be a list
        'nota_colacao': '',
        'nota_distribuicao': quotas_herdeiros_base.get('nota_distribuicao', ''),
        'total_doacoes_desc_sem_dispensa_para_colacao': total_doacoes_desc_sem_dispensa_para_colacao
    }

    # Copy Cônjuge from base
    base_conjuge = quotas_herdeiros_base.get('conjuge', {'nome': 'Cônjuge', 'quota': 0})
    final_quotas['conjuge']['nome'] = base_conjuge.get('nome', 'Cônjuge')
    final_quotas['conjuge']['quota_final'] = base_conjuge.get('quota', 0) # Assuming 'quota' from base is the one to carry

    # Copy Ascendentes from base (now a list)
    base_ascendentes = quotas_herdeiros_base.get('ascendentes', [])
    for asc_original in base_ascendentes:
        final_quotas['ascendentes'].append({
            'nome': asc_original.get('nome'),
            'quota_final_individual': asc_original.get('quota_individual', 0) # Carry over their share
        })
    
    base_descendentes = quotas_herdeiros_base.get('descendentes', [])
    filhos_int = int(num_linhas_descendencia if num_linhas_descendencia else 0)

    if filhos_int > 0 and total_doacoes_desc_sem_dispensa_para_colacao > 0:
        if filhos_int == 1 and base_descendentes:
            desc_original = base_descendentes[0]
            quota_base_individual = desc_original.get('quota_individual', 0)
            ajuste_colacao = -total_doacoes_desc_sem_dispensa_para_colacao
            quota_final_individual = max(0, quota_base_individual + ajuste_colacao)
            
            final_quotas['descendentes'].append({
                'nome': desc_original.get('nome', 'Descendente Único'),
                'quota_base_individual': quota_base_individual,
                'ajuste_colacao_individual': ajuste_colacao,
                'quota_final_individual': quota_final_individual
            })
            final_quotas['nota_colacao'] = (f"Ao único descendente ({desc_original.get('nome')}) foi imputado o valor de "
                                           f"{total_doacoes_desc_sem_dispensa_para_colacao:.2f}€ referente a doações sujeitas a colação.")
        else: 
            for desc_original in base_descendentes:
                final_quotas['descendentes'].append({
                    'nome': desc_original.get('nome'),
                    'quota_base_individual': desc_original.get('quota_individual', 0),
                    'ajuste_colacao_individual': 0, 
                    'quota_final_individual': desc_original.get('quota_individual', 0)
                })
            final_quotas['nota_colacao'] = (f"Existe um total de {total_doacoes_desc_sem_dispensa_para_colacao:.2f}€ em doações a descendentes sujeitas a colação. "
                                           "Como não foram fornecidos detalhes por donatário (para cada descendente), este valor deve ser "
                                           "manualmente imputado às quotas dos descendentes que receberam as doações. As quotas abaixo não refletem essa imputação individual.")
    else: 
        for desc_original in base_descendentes:
            final_quotas['descendentes'].append({
                'nome': desc_original.get('nome'),
                'quota_base_individual': desc_original.get('quota_individual', 0),
                'ajuste_colacao_individual': 0,
                'quota_final_individual': desc_original.get('quota_individual', 0)
            })
        final_quotas['nota_colacao'] = "Não existem doações a descendentes sujeitas a colação ou não há descendentes."
    
    return final_quotas 