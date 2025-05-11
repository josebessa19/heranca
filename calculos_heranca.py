# calculos_heranca.py
from decimal import Decimal, ROUND_HALF_UP

# Added helper for Decimal formatting
def format_currency_decimal(value):
    """Helper to format Decimal to string for display, or handle floats/ints."""
    if isinstance(value, Decimal):
        return str(value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
    try:
        # Try to convert to Decimal if it's a number-like string or float/int
        val_decimal = Decimal(str(value))
        return str(val_decimal.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
    except:
        return str(value) # Fallback for non-numeric types

def calcular_vth(relictum_valor, passivo_valor, donatum_herdeiros_total_geral):
    """Calcula o Valor da Herança para a Legítima (VTH). Using Decimals for precision."""
    # Ensure all inputs that should be numbers are treated as such, defaulting to 0 if None or empty
    r = Decimal(str(relictum_valor) if relictum_valor else '0.0')
    p = Decimal(str(passivo_valor) if passivo_valor else '0.0')
    # MODIFIED: Combined all donations for VTH calculation
    d_geral = Decimal(str(donatum_herdeiros_total_geral) if donatum_herdeiros_total_geral else '0.0')
    
    vth = r - p + d_geral # MODIFIED
    return vth

def determinar_fracao_legitima(conjuge_sobrevive, num_filhos, ascendentes_presentes, tipo_ascendentes=None):
    """Determina a fração da legítima (QL) e retorna a fração (as Decimal) and a string descritiva."""
    if num_filhos > 0:
        if conjuge_sobrevive:
            return Decimal('2') / Decimal('3'), "2/3 (cônjuge e filhos)"
        else: # Sem cônjuge, apenas filhos
            if num_filhos == 1:
                return Decimal('1') / Decimal('2'), "1/2 (1 filho)"
            else: # 2 ou mais filhos
                return Decimal('2') / Decimal('3'), "2/3 (2+ filhos)"
    elif conjuge_sobrevive:
        if ascendentes_presentes:
            return Decimal('2') / Decimal('3'), "2/3 (cônjuge e ascendentes)"
        else:
            return Decimal('1') / Decimal('2'), "1/2 (cônjuge)"
    elif ascendentes_presentes:
        if tipo_ascendentes == "pais":
            return Decimal('1') / Decimal('2'), "1/2 (pais)" # Art. 2161.º, n.º 2 CC
        elif tipo_ascendentes == "avos_outros":
            return Decimal('1') / Decimal('3'), "1/3 (avós/outros ascendentes)" # Art. 2161.º, n.º 2 CC
        else:
            # Fallback if tipo_ascendentes is not specified but ascendentes are present
            # This case implies only ascendentes are heirs, without further specification. Typically 1/2 or 1/3
            # Defaulting to the more general or cautious approach, or requiring clarification.
            # For now, let's assume 1/2 if only ascendentes and type not specified (could be 1 parent)
            return Decimal('1') / Decimal('2'), "1/2 (ascendentes - tipo não especificado, assumindo pais)"
    else:
        return Decimal('0'), "0 (sem herdeiros legitimários)" # Ou 1, se considerarmos que tudo é QD

def calcular_quotas(vth, fracao_legitima):
    """Calcula a Quota Legítima (QL) e a Quota Disponível (QD) using Decimals."""
    vth_decimal = Decimal(str(vth))
    fracao_legitima_decimal = Decimal(str(fracao_legitima))
    
    ql = (vth_decimal * fracao_legitima_decimal).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    qd = (vth_decimal - ql).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
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

def processar_sem_testamento(
    vth, quota_legitima, quota_disponivel, 
    conjuge_sobrevive, nome_conjuge,
    num_filhos_para_calculo, nomes_filhos, 
    deixou_ascendentes, tipo_ascendentes, num_pais, nomes_pais, num_avos_outros, nomes_avos_outros,
    relictum, passivo,
    # MODIFIED parameter names for generalized heir donations
    doacoes_individuais_herdeiros_com_dispensa, 
    doacoes_individuais_herdeiros_sem_dispensa,
    doacoes_nao_herdeiros_total # Donations to non-heirs (terceiros)
):
    resultado_detalhado = calcular_partilha_detalhada(
        vth=vth, ql_global=quota_legitima, qd_global=quota_disponivel,
        conjuge_sobrevive=conjuge_sobrevive, nome_conjuge=nome_conjuge,
        num_filhos=num_filhos_para_calculo, nomes_filhos_lista=nomes_filhos,
        deixou_ascendentes=deixou_ascendentes, tipo_ascendentes=tipo_ascendentes,
        num_pais=num_pais, nomes_pais_lista=nomes_pais,
        num_avos_outros=num_avos_outros, nomes_avos_outros_lista=nomes_avos_outros,
        relictum=relictum, passivo=passivo,
        # MODIFIED arguments passed
        doacoes_individuais_herdeiros_com_dispensa=doacoes_individuais_herdeiros_com_dispensa,
        doacoes_individuais_herdeiros_sem_dispensa=doacoes_individuais_herdeiros_sem_dispensa,
        doacoes_nao_herdeiros_total=doacoes_nao_herdeiros_total, # Pass to the corresponding param
        valor_testamento_original=Decimal('0')
    )
    resultado_detalhado['tipo_processamento'] = 'Sucessão Legítima (Sem Testamento - Detalhada)'
    return resultado_detalhado 

def processar_com_testamento(
    vth, quota_legitima_valor, quota_disponivel_valor, valor_deixas_testamento,
    conjuge_sobrevive, nome_conjuge,
    num_filhos, nomes_filhos, 
    deixou_ascendentes, tipo_ascendentes, num_pais, nomes_pais, num_avos_outros, nomes_avos_outros,
    # MODIFIED parameter names
    doacoes_individuais_herdeiros_com_dispensa, 
    doacoes_individuais_herdeiros_sem_dispensa,
    doacoes_nao_herdeiros_total, # Donations to non-heirs
    relictum, 
    passivo   
):
    resultado_detalhado = calcular_partilha_detalhada(
        vth=vth, ql_global=quota_legitima_valor, qd_global=quota_disponivel_valor,
        conjuge_sobrevive=conjuge_sobrevive, nome_conjuge=nome_conjuge,
        num_filhos=num_filhos, nomes_filhos_lista=nomes_filhos,
        deixou_ascendentes=deixou_ascendentes, tipo_ascendentes=tipo_ascendentes,
        num_pais=num_pais, nomes_pais_lista=nomes_pais,
        num_avos_outros=num_avos_outros, nomes_avos_outros_lista=nomes_avos_outros,
        relictum=relictum, 
        passivo=passivo,    
        # MODIFIED arguments passed
        doacoes_individuais_herdeiros_com_dispensa=doacoes_individuais_herdeiros_com_dispensa,
        doacoes_individuais_herdeiros_sem_dispensa=doacoes_individuais_herdeiros_sem_dispensa,
        doacoes_nao_herdeiros_total=doacoes_nao_herdeiros_total,
        valor_testamento_original=Decimal(str(valor_deixas_testamento))
    )
    resultado_detalhado['tipo_processamento'] = 'Sucessão Testamentária e Legítima (Detalhada)'
    return resultado_detalhado

# New main processing function
def calcular_partilha_detalhada(
    vth, ql_global, qd_global,
    conjuge_sobrevive, nome_conjuge,
    num_filhos, nomes_filhos_lista, 
    deixou_ascendentes, tipo_ascendentes, num_pais, nomes_pais_lista, num_avos_outros, nomes_avos_outros_lista,
    relictum, passivo,
    # MODIFIED parameter names for generalized heir donations
    doacoes_individuais_herdeiros_com_dispensa, # Dict: {'NomeHerdeiro': valor}
    doacoes_individuais_herdeiros_sem_dispensa, # Dict: {'NomeHerdeiro': valor}
    doacoes_nao_herdeiros_total, # Total donations to non-legitimarios (terceiros)
    valor_testamento_original=Decimal('0') # For _com_testamento path
):
    """
    Calcula a partilha detalhada, incluindo imputação de doações (com e sem dispensa a herdeiros legitimários),
    deixas testamentárias, e cálculo de inoficiosidades.
    """
    # Initialize dictionaries if None
    doacoes_herdeiros_com_dispensa = doacoes_individuais_herdeiros_com_dispensa or {}
    doacoes_herdeiros_sem_dispensa = doacoes_individuais_herdeiros_sem_dispensa or {}
    donations_to_non_heirs_total = Decimal(str(doacoes_nao_herdeiros_total) if doacoes_nao_herdeiros_total else '0')


    # Garantir que nomes_filhos_lista, nomes_pais_lista, nomes_avos_outros_lista são listas
    nomes_filhos = list(nomes_filhos_lista) if nomes_filhos_lista else []
    nomes_pais = list(nomes_pais_lista) if nomes_pais_lista else []
    nomes_avos_outros = list(nomes_avos_outros_lista) if nomes_avos_outros_lista else []

    num_f = int(num_filhos if num_filhos else 0)

    # ----- 1. Initialize herdeiros_info list -----
    # This list will store detailed info for each legitimário.
    herdeiros_info = []
    mapa_herdeiros_por_nome = {} # Helper to access heir info by name

    # Add Spouse
    if conjuge_sobrevive:
        nome_conj = nome_conjuge if nome_conjuge and nome_conjuge.strip() else "Cônjuge"
        herdeiro_conjuge_info = {
            'nome': nome_conj, 'tipo': 'conjuge', 
            'quota_legitima_pura': Decimal('0'), 'valor_doado_sem_dispensa': Decimal('0'),
            'valor_doado_com_dispensa': Decimal('0'), 'valor_recebido_testamento': Decimal('0'),
            'valor_imputado_legitima': Decimal('0'), 'valor_imputado_qd': Decimal('0'),
            'excesso_doacao_sem_dispensa': Decimal('0'), 'excesso_total_liberalidades': Decimal('0'),
            'reducao_inoficiosidade': Decimal('0'), 'valor_final_a_receber_heranca': Decimal('0'),
            'notas_calculo': []
        }
        herdeiros_info.append(herdeiro_conjuge_info)
        mapa_herdeiros_por_nome[nome_conj] = herdeiro_conjuge_info

    # Add Children
    for i in range(num_f):
        nome_filho = nomes_filhos[i] if i < len(nomes_filhos) and nomes_filhos[i].strip() else f"Filho(a) {i+1}"
        herdeiro_filho_info = {
            'nome': nome_filho, 'tipo': 'descendente',
            'quota_legitima_pura': Decimal('0'), 'valor_doado_sem_dispensa': Decimal('0'),
            'valor_doado_com_dispensa': Decimal('0'), 'valor_recebido_testamento': Decimal('0'),
            'valor_imputado_legitima': Decimal('0'), 'valor_imputado_qd': Decimal('0'),
            'excesso_doacao_sem_dispensa': Decimal('0'), 'excesso_total_liberalidades': Decimal('0'),
            'reducao_inoficiosidade': Decimal('0'), 'valor_final_a_receber_heranca': Decimal('0'),
            'notas_calculo': []
        }
        herdeiros_info.append(herdeiro_filho_info)
        mapa_herdeiros_por_nome[nome_filho] = herdeiro_filho_info

    # Add Ascendants (Parents)
    if deixou_ascendentes and tipo_ascendentes == 'pais':
        num_p = int(num_pais if num_pais else 0)
        for i in range(num_p):
            nome_pai_mae = nomes_pais[i] if i < len(nomes_pais) and nomes_pais[i].strip() else f"Progenitor {i+1}"
            herdeiro_asc_info = {
                'nome': nome_pai_mae, 'tipo': 'ascendente_pais',
                'quota_legitima_pura': Decimal('0'), 'valor_doado_sem_dispensa': Decimal('0'),
                'valor_doado_com_dispensa': Decimal('0'), 'valor_recebido_testamento': Decimal('0'),
                'valor_imputado_legitima': Decimal('0'), 'valor_imputado_qd': Decimal('0'),
                'excesso_doacao_sem_dispensa': Decimal('0'), 'excesso_total_liberalidades': Decimal('0'),
                'reducao_inoficiosidade': Decimal('0'), 'valor_final_a_receber_heranca': Decimal('0'),
                'notas_calculo': []
            }
            herdeiros_info.append(herdeiro_asc_info)
            mapa_herdeiros_por_nome[nome_pai_mae] = herdeiro_asc_info
            
    # Add Ascendants (Grandparents/Others)
    if deixou_ascendentes and tipo_ascendentes == 'avos_outros':
        num_ao = int(num_avos_outros if num_avos_outros else 0)
        for i in range(num_ao):
            nome_avo_outro = nomes_avos_outros[i] if i < len(nomes_avos_outros) and nomes_avos_outros[i].strip() else f"Ascendente Remoto {i+1}"
            herdeiro_asc_info = {
                'nome': nome_avo_outro, 'tipo': 'ascendente_avos_outros',
                'quota_legitima_pura': Decimal('0'), 'valor_doado_sem_dispensa': Decimal('0'),
                'valor_doado_com_dispensa': Decimal('0'), 'valor_recebido_testamento': Decimal('0'),
                'valor_imputado_legitima': Decimal('0'), 'valor_imputado_qd': Decimal('0'),
                'excesso_doacao_sem_dispensa': Decimal('0'), 'excesso_total_liberalidades': Decimal('0'),
                'reducao_inoficiosidade': Decimal('0'), 'valor_final_a_receber_heranca': Decimal('0'),
                'notas_calculo': []
            }
            herdeiros_info.append(herdeiro_asc_info)
            mapa_herdeiros_por_nome[nome_avo_outro] = herdeiro_asc_info

    # ----- 2. Calcular quotas puras da Legítima para cada herdeiro legitimário -----
    # Usa a função distribuir_valor para obter as quotas teóricas da QL Global.
    # Ensure all heir names used here match keys in `mapa_herdeiros_por_nome`
    distribuicao_ql = distribuir_valor(
        ql_global, herdeiros=None, # herdeiros param in distribuir_valor is not used for primary logic
        tem_conjuge=conjuge_sobrevive, num_linhas_descendencia=num_f, tem_ascendentes=deixou_ascendentes,
        nome_conjuge=nome_conjuge if conjuge_sobrevive else None, 
        nomes_filhos=nomes_filhos, # Pass list of names
        tipo_ascendentes=tipo_ascendentes if deixou_ascendentes else None,
        num_pais=num_pais if deixou_ascendentes and tipo_ascendentes == 'pais' else None,
        nomes_pais=nomes_pais, # Pass list of names
        num_avos_outros=num_avos_outros if deixou_ascendentes and tipo_ascendentes == 'avos_outros' else None,
        nomes_avos_outros=nomes_avos_outros # Pass list of names
    )

    if conjuge_sobrevive:
        nome_conj_key = nome_conjuge if nome_conjuge and nome_conjuge.strip() else "Cônjuge"
        if nome_conj_key in mapa_herdeiros_por_nome:
            mapa_herdeiros_por_nome[nome_conj_key]['quota_legitima_pura'] = Decimal(str(distribuicao_ql['conjuge']['quota']))
            mapa_herdeiros_por_nome[nome_conj_key]['notas_calculo'].append(f"Quota legítima teórica: {format_currency_decimal(mapa_herdeiros_por_nome[nome_conj_key]['quota_legitima_pura'])}.")

    for i, filho_ql_info in enumerate(distribuicao_ql['descendentes']):
        # The name from distribuir_valor might be a fallback; use the name from `herdeiros_info` if possible
        nome_filho_key = herdeiros_info[mapa_herdeiros_por_nome[filho_ql_info['nome']]['idx_original']] ['nome'] if filho_ql_info['nome'] in mapa_herdeiros_por_nome and 'idx_original' in mapa_herdeiros_por_nome[filho_ql_info['nome']] else filho_ql_info['nome']

        # Correct approach: Iterate herdeiros_info, find by type 'descendente' and map based on order
        # For now, let's assume a direct mapping is mostly okay, but it needs to be robust.
        # If `distribuicao_ql` uses standardized names, this matching is important.

        # We need a reliable way to map `distribuicao_ql` names to `mapa_herdeiros_por_nome` keys
        # Current `distribuir_valor` uses names passed or generates fallbacks.
        
        # Let's try to match based on the names_filhos list order used for both.
        if i < len(nomes_filhos): # Assuming `distribuicao_ql['descendentes']` is in the same order as `nomes_filhos`
            nome_f_key = nomes_filhos[i] if nomes_filhos[i] and nomes_filhos[i].strip() else f"Filho(a) {i+1}"
            if nome_f_key in mapa_herdeiros_por_nome:
                 mapa_herdeiros_por_nome[nome_f_key]['quota_legitima_pura'] = Decimal(str(filho_ql_info['quota_individual']))
                 mapa_herdeiros_por_nome[nome_f_key]['notas_calculo'].append(f"Quota legítima teórica: {format_currency_decimal(mapa_herdeiros_por_nome[nome_f_key]['quota_legitima_pura'])}.")
        elif filho_ql_info['nome'] in mapa_herdeiros_por_nome : # Fallback if name matches directly
             mapa_herdeiros_por_nome[filho_ql_info['nome']]['quota_legitima_pura'] = Decimal(str(filho_ql_info['quota_individual']))
             mapa_herdeiros_por_nome[filho_ql_info['nome']]['notas_calculo'].append(f"Quota legítima teórica: {format_currency_decimal(mapa_herdeiros_por_nome[filho_ql_info['nome']]['quota_legitima_pura'])}.")


    for i, asc_ql_info in enumerate(distribuicao_ql['ascendentes']):
        # Similar mapping challenge as with children. Assume order or direct name match for now.
        # This depends on `distribuir_valor` using consistent names.
        asc_original_list = []
        if tipo_ascendentes == 'pais': asc_original_list = nomes_pais
        elif tipo_ascendentes == 'avos_outros': asc_original_list = nomes_avos_outros
        
        if i < len(asc_original_list):
            nome_a_key = asc_original_list[i] if asc_original_list[i] and asc_original_list[i].strip() else (f"Progenitor {i+1}" if tipo_ascendentes == 'pais' else f"Ascendente Remoto {i+1}")
            if nome_a_key in mapa_herdeiros_por_nome:
                mapa_herdeiros_por_nome[nome_a_key]['quota_legitima_pura'] = Decimal(str(asc_ql_info['quota_individual']))
                mapa_herdeiros_por_nome[nome_a_key]['notas_calculo'].append(f"Quota legítima teórica: {format_currency_decimal(mapa_herdeiros_por_nome[nome_a_key]['quota_legitima_pura'])}.")
        elif asc_ql_info['nome'] in mapa_herdeiros_por_nome: # Fallback if name matches directly
            mapa_herdeiros_por_nome[asc_ql_info['nome']]['quota_legitima_pura'] = Decimal(str(asc_ql_info['quota_individual']))
            mapa_herdeiros_por_nome[asc_ql_info['nome']]['notas_calculo'].append(f"Quota legítima teórica: {format_currency_decimal(mapa_herdeiros_por_nome[asc_ql_info['nome']]['quota_legitima_pura'])}.")


    # ----- 3. Imputação de Doações "Sem Dispensa de Colação" à Legítima -----
    # These donations are imputed first to the heir's share of the QL.
    # Any excess is imputed to the QD (handled later or reduces what they get from QD).
    total_doacoes_sem_dispensa_imputadas_legitima = Decimal('0')
    total_excesso_doacoes_sem_dispensa_para_qd = Decimal('0')

    for herdeiro_nome, herdeiro_dados in mapa_herdeiros_por_nome.items():
        valor_doado_sem_dispensa = Decimal(str(doacoes_herdeiros_sem_dispensa.get(herdeiro_nome, '0')))
        herdeiro_dados['valor_doado_sem_dispensa'] = valor_doado_sem_dispensa
        
        if valor_doado_sem_dispensa > 0:
            quota_legitima_pessoal = herdeiro_dados['quota_legitima_pura']
            if valor_doado_sem_dispensa <= quota_legitima_pessoal:
                herdeiro_dados['valor_imputado_legitima'] += valor_doado_sem_dispensa
                total_doacoes_sem_dispensa_imputadas_legitima += valor_doado_sem_dispensa
                herdeiro_dados['notas_calculo'].append(f"Doação s/ dispensa ({format_currency_decimal(valor_doado_sem_dispensa)}) imputada à quota legítima.")
            else: # Doação excede a quota legítima pessoal
                herdeiro_dados['valor_imputado_legitima'] += quota_legitima_pessoal
                total_doacoes_sem_dispensa_imputadas_legitima += quota_legitima_pessoal
                excesso = valor_doado_sem_dispensa - quota_legitima_pessoal
                herdeiro_dados['excesso_doacao_sem_dispensa'] = excesso
                total_excesso_doacoes_sem_dispensa_para_qd += excesso
                herdeiro_dados['notas_calculo'].append(
                    f"Doação s/ dispensa ({format_currency_decimal(valor_doado_sem_dispensa)}): "
                    f"{format_currency_decimal(quota_legitima_pessoal)} imputado à QL, "
                    f"excesso de {format_currency_decimal(excesso)} vai para QD."
                )

    # ----- 4. Cálculo da QD Remanescente após imputações à Legítima e excessos de "sem dispensa" -----
    # QD inicial - excessos de doações "sem dispensa" (que são imputados aqui)
    #             - doações a não herdeiros (imputados aqui)
    #             - doações "com dispensa" a herdeiros (imputados aqui)
    #             - testamento (imputado depois)

    qd_remanescente = qd_global # Start with the global QD

    # 4a. Imputar excessos de doações "sem dispensa" à QD
    qd_remanescente -= total_excesso_doacoes_sem_dispensa_para_qd
    for herdeiro_dados in herdeiros_info: # Update individual heir's QD imputation
        if herdeiro_dados['excesso_doacao_sem_dispensa'] > 0:
            herdeiro_dados['valor_imputado_qd'] += herdeiro_dados['excesso_doacao_sem_dispensa']


    # 4b. Imputar Doações "Com Dispensa de Colação" (a herdeiros legitimários) à QD
    total_doacoes_com_dispensa_imputadas_qd = Decimal('0')
    for herdeiro_nome, herdeiro_dados in mapa_herdeiros_por_nome.items():
        valor_doado_com_dispensa = Decimal(str(doacoes_herdeiros_com_dispensa.get(herdeiro_nome, '0')))
        herdeiro_dados['valor_doado_com_dispensa'] = valor_doado_com_dispensa
        if valor_doado_com_dispensa > 0:
            # Imputa diretamente na QD (ou na parte do herdeiro na QD)
            # Para simplificação, consideramos que preenche a QD global primeiro, depois se vê inoficiosidade
            herdeiro_dados['valor_imputado_qd'] += valor_doado_com_dispensa
            total_doacoes_com_dispensa_imputadas_qd += valor_doado_com_dispensa
            herdeiro_dados['notas_calculo'].append(f"Doação c/ dispensa ({format_currency_decimal(valor_doado_com_dispensa)}) imputada à QD.")
    
    qd_remanescente -= total_doacoes_com_dispensa_imputadas_qd

    # 4c. Imputar Doações a Não-Herdeiros (Terceiros) à QD
    # These are donations_to_non_heirs_total
    qd_remanescente -= donations_to_non_heirs_total
    # (Não há um 'herdeiro' específico para estas, mas são consideradas contra a QD global)


    # ----- 5. Imputação de Deixas Testamentárias à QD Remanescente -----
    valor_testamento_efetivo = valor_testamento_original
    if valor_testamento_original > qd_remanescente:
        # Testamento é inoficioso e será reduzido.
        # A redução aplica-se proporcionalmente se houver várias deixas, aqui simplificado para total.
        reducao_testamento = valor_testamento_original - qd_remanescente
        valor_testamento_efetivo = qd_remanescente
        # Nota: A lógica de quem recebe o testamento e como é distribuído não está aqui,
        # apenas o impacto na QD. Se o testamento nomeia herdeiros legitimários,
        # essa parte é somada à 'valor_recebido_testamento' deles.
        # Por agora, assumimos que o testamento beneficia "alguém" e consome QD.
    
    qd_remanescente_final = qd_remanescente - valor_testamento_efetivo
    if qd_remanescente_final < Decimal('0'): qd_remanescente_final = Decimal('0') # Não pode ser negativo

    # TODO: Se o testamento nomeia herdeiros legitimários, atualizar 'valor_recebido_testamento' deles
    # e 'valor_imputado_qd' deles. Isso requer detalhes do testamento (quem são os legatários).
    # Por ora, o valor_testamento_efetivo apenas reduz a QD global.


    # ----- 6. Verificação de Inoficiosidades e Reduções -----
    # Inoficiosidade ocorre se as liberalidades (doações + testamento) excedem a QD.
    # Ou se doações sem dispensa a um herdeiro excedem sua quota na QL + sua parte na QD.

    # O cálculo acima já reduziu o testamento se ele excedeu a QD *disponível naquele momento*.
    # Agora, verificar se as doações (com e sem dispensa) + testamento reduzido excedem a QD_global.
    
    total_liberalidades_imputadas_qd = (total_excesso_doacoes_sem_dispensa_para_qd + 
                                     total_doacoes_com_dispensa_imputadas_qd +
                                     donations_to_non_heirs_total + # Doações a terceiros
                                     valor_testamento_efetivo)

    reducao_necessaria_total_qd = Decimal('0')
    if total_liberalidades_imputadas_qd > qd_global:
        reducao_necessaria_total_qd = total_liberalidades_imputadas_qd - qd_global
        # Esta redução deve ser aplicada às liberalidades pela ordem inversa da sua realização
        # ou proporcionalmente. Testamento é o último a ser reduzido (já foi feito acima).
        # Depois doações com dispensa, depois excessos de sem dispensa.
        # Esta é uma área complexa, simplificando: o `qd_remanescente_final` já reflete isso.
        # Se qd_remanescente_final é 0, e o `total_liberalidades_imputadas_qd` era > `qd_global`,
        # então as últimas liberalidades a serem imputadas são as que "sofreram" a redução.

    # Atualizar `excesso_total_liberalidades` e `reducao_inoficiosidade` para cada herdeiro
    # Esta parte precisa de uma lógica mais detalhada de como as reduções são distribuídas
    # entre as várias liberalidades (doações com dispensa, deixas testamentárias a herdeiros).
    # Por enquanto, `reducao_inoficiosidade` não está sendo preenchida com detalhes finos.

    # ----- 7. Cálculo Final do Valor a Receber da Herança (Relictum - Passivo) -----
    # O que cada herdeiro recebe da herança "física" (relictum - passivo)
    # é sua quota legítima pura MENOS o que já recebeu por doação sem dispensa (imputada na legítima)
    # MAIS o que lhe couber da QD remanescente (se houver e se for distribuída aos legitimários).

    # A QD remanescente (qd_remanescente_final) pode ser distribuída conforme a lei ou testamento.
    # Se não houver testamento dispondo da QD, ela acresce à QL e é distribuída pelos legitimários.
    # Se o testamento não esgotar a QD, o remanescente também acresce.

    ql_efetiva_total_distribuir = ql_global - total_doacoes_sem_dispensa_imputadas_legitima
    if ql_efetiva_total_distribuir < Decimal('0'): ql_efetiva_total_distribuir = Decimal('0') # Não pode distribuir negativo

    # Adicionar a QD remanescente não testamentada à QL para distribuição final entre legitimários
    # (se não houver outras disposições para a QD)
    # Esta é uma simplificação: se há testamento, a QD remanescente pode ter outro destino.
    # Se não há testamento, a QD remanescente (se houver) é distribuída como a QL.
    valor_total_a_distribuir_dos_bens = ql_efetiva_total_distribuir
    if valor_testamento_original == Decimal('0'): # Sem testamento, QD remanescente junta-se à QL para distribuição
        valor_total_a_distribuir_dos_bens += qd_remanescente_final


    # Distribuir o `valor_total_a_distribuir_dos_bens` entre os legitimários
    # Esta distribuição deve seguir as mesmas proporções da QL pura.
    distribuicao_final_bens = distribuir_valor(
        valor_total_a_distribuir_dos_bens, None,
        conjuge_sobrevive, num_f, deixou_ascendentes,
        nome_conjuge if conjuge_sobrevive else None, nomes_filhos,
        tipo_ascendentes if deixou_ascendentes else None,
        num_pais if deixou_ascendentes and tipo_ascendentes == 'pais' else None, nomes_pais,
        num_avos_outros if deixou_ascendentes and tipo_ascendentes == 'avos_outros' else None, nomes_avos_outros
    )

    for herdeiro_dados in herdeiros_info:
        nome_herdeiro = herdeiro_dados['nome']
        tipo_herdeiro = herdeiro_dados['tipo']
        valor_a_receber_bens = Decimal('0')

        if tipo_herdeiro == 'conjuge':
            valor_a_receber_bens = Decimal(str(distribuicao_final_bens['conjuge']['quota']))
        elif tipo_herdeiro == 'descendente':
            # Match by name from distribuicao_final_bens['descendentes']
            for desc_info in distribuicao_final_bens['descendentes']:
                if desc_info['nome'] == nome_herdeiro: # Assuming names match
                    valor_a_receber_bens = Decimal(str(desc_info['quota_individual']))
                    break
        elif tipo_herdeiro.startswith('ascendente'):
            # Match by name from distribuicao_final_bens['ascendentes']
            for asc_info in distribuicao_final_bens['ascendentes']:
                if asc_info['nome'] == nome_herdeiro: # Assuming names match
                    valor_a_receber_bens = Decimal(str(asc_info['quota_individual']))
                    break
        
        herdeiro_dados['valor_final_a_receber_heranca'] = valor_a_receber_bens
        herdeiro_dados['notas_calculo'].append(f"Valor final a receber dos bens da herança: {format_currency_decimal(valor_a_receber_bens)}.")

        # Adicionar valor recebido por testamento (se aplicável e detalhado)
        # herdeiro_dados['valor_final_a_receber_heranca'] += herdeiro_dados['valor_recebido_testamento']


    # ----- Sumário VTH, QL, QD -----
    # Total de todas as doações que entram no VTH (feitas a herdeiros e a não herdeiros)
    total_doacoes_para_vth = sum(Decimal(str(v)) for v in doacoes_herdeiros_com_dispensa.values()) + \
                             sum(Decimal(str(v)) for v in doacoes_herdeiros_sem_dispensa.values()) + \
                             donations_to_non_heirs_total

    resumo_vth_ql_qd = {
        'relictum': format_currency_decimal(relictum),
        'passivo': format_currency_decimal(passivo),
        'donatum_total_vth': format_currency_decimal(total_doacoes_para_vth),
        'vth_calculado': format_currency_decimal(vth),
        'ql_global_valor': format_currency_decimal(ql_global),
        'qd_global_valor': format_currency_decimal(qd_global),
        'detalhe_doacoes_vth': {
            'doacoes_herdeiros_com_dispensa': {k: format_currency_decimal(v) for k, v in doacoes_herdeiros_com_dispensa.items()},
            'doacoes_herdeiros_sem_dispensa': {k: format_currency_decimal(v) for k, v in doacoes_herdeiros_sem_dispensa.items()},
            'doacoes_nao_herdeiros_total': format_currency_decimal(donations_to_non_heirs_total)
        },
        'testamento_valor_original': format_currency_decimal(valor_testamento_original),
        'testamento_valor_efetivo_imputado_qd': format_currency_decimal(valor_testamento_efetivo if valor_testamento_original > 0 else 0),
        'qd_remanescente_final': format_currency_decimal(qd_remanescente_final),
        'total_imputado_legitima_herdeiros': format_currency_decimal(total_doacoes_sem_dispensa_imputadas_legitima),
        'total_imputado_qd_herdeiros_doacoes_com_dispensa': format_currency_decimal(total_doacoes_com_dispensa_imputadas_qd),
        'total_imputado_qd_herdeiros_excesso_sem_dispensa': format_currency_decimal(total_excesso_doacoes_sem_dispensa_para_qd),
        'total_imputado_qd_nao_herdeiros': format_currency_decimal(donations_to_non_heirs_total),
    }


    # ----- Composição final do resultado -----
    # Normalizar os valores decimais para string formatada em herdeiros_info
    for herdeiro in herdeiros_info:
        for key, value in herdeiro.items():
            if isinstance(value, Decimal):
                herdeiro[key] = format_currency_decimal(value)
            elif key == 'notas_calculo': # Ensure notes are strings
                herdeiro[key] = [str(nota) for nota in value]


    return {
        'resumo_vth_ql_qd': resumo_vth_ql_qd,
        'herdeiros_info': herdeiros_info, # Lista de dicionários com detalhes por herdeiro
        'distribuicao_legitima_pura': distribuicao_ql, # Como a QL Global foi dividida teoricamente
        'distribuicao_final_bens': distribuicao_final_bens, # Como o remanescente dos bens foi dividido
        'fracao_legitima_aplicada_display': "", # Preencher com a fracao usada (e.g. "2/3")
        'nota_geral_calculo': "Cálculo detalhado considerando doações individualizadas a herdeiros."
    }


def format_currency(value): 
    """Helper to format numbers as currency strings (Real R$)."""
    if value is None: return "N/A"
    try:
        val = Decimal(str(value))
        return f"R$ {val.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)}"
    except:
        return str(value) # Fallback

# Exemplo de como `aplicar_colacao` poderia ser integrado ou substituído:
# A lógica de colação (imputação de doações sem dispensa à legítima) agora está
# diretamente em `calcular_partilha_detalhada`.
# Se `aplicar_colacao` tivesse funções adicionais, como calcular o "mapa de colações"
# para exibição, essa parte poderia ser adaptada.
# Por agora, a imputação está feita. O `herdeiros_info` contém os valores.

# O `aplicar_colacao` anterior focava em `donatário == herdeiro`.
# Agora, `calcular_partilha_detalhada` lida com isso para todos os legitimários.
# Se houver necessidade de um sub-relatório específico de "colações",
# pode ser gerado a partir de `herdeiros_info`.

# Old format_currency kept for now if any part of JS still relies on its specific EUR formatting directly.
# Prefer format_currency_decimal for internal calculations and new display elements.
def format_currency(value): 
    """Helper to format numbers as currency strings (EUR)."""
    try:
        # Ensure it's a number first
        val_float = float(value)
        return f"{val_float:,.2f} €".replace(",", "X").replace(".", ",").replace("X", ".")
    except (ValueError, TypeError):
        # If it's already a string that looks like currency from format_currency_decimal, pass it through
        if isinstance(value, str) and " €" in value: 
             return value
        return str(value) # Fallback 