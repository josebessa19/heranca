from flask import Flask, request, jsonify, render_template
import os
# Assuming calculos_heranca.py is in the same directory or accessible via PYTHONPATH
import calculos_heranca

app = Flask(__name__, template_folder='.', static_folder='static')

# Ensure the static folder exists (though it should be there from previous steps)
if not os.path.exists(app.static_folder):
    os.makedirs(app.static_folder)

@app.route('/')
def index():
    # Check if templates/index.html exists, otherwise use index.html from root
    # Based on previous interactions, Flask will look in a 'templates' subfolder by default.
    # The user provided index.html without a templates folder path, so we assume it's in root
    # and template_folder='.' handles this.
    return render_template('index.html')

@app.route('/calculate_inheritance', methods=['POST'])
def calculate_inheritance_route():
    try:
        data = request.get_json()
        app.logger.info(f"Received data: {data}")

        # Extract basic info
        deixou_testamento = data.get('deixou_testamento') == 'sim'
        estado_civil = data.get('estado_civil')
        regime_bens = data.get('regime_bens') if estado_civil == 'casado' else None

        # Extract heir info
        conjuge_sobrevivo = data.get('estado_civil') == 'casado' or data.get('estado_civil') == 'unido_facto'
        nome_conjuge = data.get('nome_conjuge', 'Cônjuge/Companheiro(a)') if conjuge_sobrevivo else None
        deixou_filhos = data.get('deixou_filhos') == 'sim'
        num_filhos_str = data.get('num_filhos', '0')
        num_filhos = int(num_filhos_str) if num_filhos_str.isdigit() else 0
        nomes_filhos = data.get('nomes_filhos', [])
        deixou_ascendentes_input = data.get('deixou_ascendentes') # sim, nao, ou None
        tipo_ascendentes = data.get('tipo_ascendentes') # pais, avos_outros, or None

        # Detailed ascendant info
        num_pais = data.get('num_pais') # 1, 2, or None
        nomes_pais = data.get('nomes_pais', []) # Array of names
        num_avos_outros = data.get('num_avos_outros') # number or None
        nomes_avos_outros = data.get('nomes_avos_outros', []) # Array of names

        # Pad nomes_filhos if fewer names provided than num_filhos
        if deixou_filhos and len(nomes_filhos) < num_filhos:
            for i in range(len(nomes_filhos), num_filhos):
                nomes_filhos.append(f'Filho(a) {i+1}')
        elif not deixou_filhos:
            nomes_filhos = []
            
        # Pad ascendant names if necessary (example for pais)
        if tipo_ascendentes == 'pais' and num_pais:
            num_pais_int = int(num_pais)
            if len(nomes_pais) < num_pais_int:
                for i in range(len(nomes_pais), num_pais_int):
                    nomes_pais.append(f'Progenitor {i+1}') 
        elif tipo_ascendentes == 'avos_outros' and num_avos_outros:
            num_avos_outros_int = int(num_avos_outros)
            if len(nomes_avos_outros) < num_avos_outros_int:
                for i in range(len(nomes_avos_outros), num_avos_outros_int):
                    nomes_avos_outros.append(f'Ascendente (Avó/Outro) {i+1}')
        else: # Clear if not applicable
            num_pais = None; nomes_pais = []
            num_avos_outros = None; nomes_avos_outros = []

        # Extract assets and debts
        relictum = float(data.get('valor_bens', 0))
        passivo = float(data.get('valor_dividas', 0))

        # Extract donations
        doacoes_descendentes_sim = data.get('doacoes_descendentes') == 'sim'
        total_doacoes_descendentes = float(data.get('valor_doacoes_descendentes', 0)) if doacoes_descendentes_sim else 0
        
        dispensa_colacao_desc = data.get('dispensa_colacao_descendentes', 'nao') if doacoes_descendentes_sim else 'nao'
        doacoes_desc_com_dispensa = 0
        if doacoes_descendentes_sim and (dispensa_colacao_desc == 'sim' or dispensa_colacao_desc == 'parcialmente'):
            doacoes_desc_com_dispensa = float(data.get('valor_doacoes_com_dispensa', 0))
        
        doacoes_desc_sem_dispensa_total = total_doacoes_descendentes - doacoes_desc_com_dispensa
        if doacoes_desc_sem_dispensa_total < 0: # Should not happen with proper input validation
            doacoes_desc_sem_dispensa_total = 0 

        doacoes_outras_pessoas_sim = data.get('doacoes_outras_pessoas') == 'sim'
        total_doacoes_outras_pessoas = float(data.get('valor_doacoes_outras_pessoas', 0)) if doacoes_outras_pessoas_sim else 0

        # Extract testament info
        valor_bens_testamento = float(data.get('valor_bens_testamento', 0)) if deixou_testamento else 0

        # 1. Calcular VTH (Valor Total da Herança para cálculo da legítima)
        vth_calculado = calculos_heranca.calcular_vth(
            relictum_valor=relictum,
            passivo_valor=passivo,
            donatum_descendentes_total=total_doacoes_descendentes, # Correct: total donations to descendants for VTH
            donatum_outros_total=total_doacoes_outras_pessoas
        )

        # 2. Determinar Fração da Legítima (QL) e Quota Disponível (QD)
        fracao_legitima, fracao_display = calculos_heranca.determinar_fracao_legitima(
            conjuge_sobrevivo=conjuge_sobrevivo,
            num_filhos=num_filhos,
            deixou_ascendentes=deixou_ascendentes,
            tipo_ascendentes=tipo_ascendentes
        )
        quota_legitima_valor, quota_disponivel_valor = calculos_heranca.calcular_quotas(
            vth=vth_calculado,
            fracao_legitima=fracao_legitima
        )

        # 3. Processar a herança (com ou sem testamento)
        if deixou_testamento:
            processamento_resultado = calculos_heranca.processar_com_testamento(
                vth=vth_calculado,
                quota_legitima_valor=quota_legitima_valor,
                quota_disponivel_valor=quota_disponivel_valor,
                valor_deixas_testamento=valor_bens_testamento,
                conjuge_sobrevivo=conjuge_sobrevivo,
                nome_conjuge=nome_conjuge,
                num_filhos=num_filhos,
                nomes_filhos=nomes_filhos,
                deixou_ascendentes=deixou_ascendentes,
                doacoes_desc_com_dispensa=doacoes_desc_com_dispensa, # Pass this for inoficiosidade check
                doacoes_outros_total_para_qd=total_doacoes_outras_pessoas, # Pass this for inoficiosidade check
                tipo_ascendentes=tipo_ascendentes,
                num_pais=num_pais, nomes_pais=nomes_pais,
                num_avos_outros=num_avos_outros, nomes_avos_outros=nomes_avos_outros
            )
        else:
            processamento_resultado = calculos_heranca.processar_sem_testamento(
                vth=vth_calculado, # Added VTH based on previous corrections for context
                quota_legitima=quota_legitima_valor, # Corrected name from QL to quota_legitima
                quota_disponivel=quota_disponivel_valor, # Added QD for context
                conjuge_sobrevive=conjuge_sobrevivo,
                nome_conjuge=nome_conjuge,
                num_filhos_para_calculo=num_filhos,
                nomes_filhos=nomes_filhos,
                deixou_ascendentes=deixou_ascendentes,
                relictum=relictum, 
                passivo=passivo,    
                tipo_ascendentes=tipo_ascendentes,
                num_pais=num_pais, nomes_pais=nomes_pais,
                num_avos_outros=num_avos_outros, nomes_avos_outros=nomes_avos_outros
            )
        
        # 4. Aplicar Colação
        # quotas_herdeiros_base comes from processamento_resultado
        colacao_resultado = calculos_heranca.aplicar_colacao(
            quotas_herdeiros_base=processamento_resultado.get('quotas_herdeiros_base', {}),
            total_doacoes_desc_sem_dispensa_para_colacao=doacoes_desc_sem_dispensa_total,
            num_linhas_descendencia=num_filhos, # num_filhos represents lines of descent
            vth=vth_calculado # Pass VTH for context if needed in future colation adjustments
        )

        # Echo back some form data for easier display or debugging on frontend
        form_data_echo = {
            'nome_conjuge': nome_conjuge,
            'nomes_filhos': nomes_filhos,
            'num_filhos': num_filhos
        }

        response_data = {
            'VTH': vth_calculado,
            'fracao_legitima': fracao_legitima, 
            'fracao_legitima_display': fracao_display,
            'QL': quota_legitima_valor,
            'QD': quota_disponivel_valor,
            'processamento_heranca': processamento_resultado,
            'colacao_info': colacao_resultado,
            'form_data_echo': form_data_echo,
            'detailed_ascendants_echo': { # Echoing new ascendant details for confirmation
                'tipo_ascendentes': tipo_ascendentes,
                'num_pais': num_pais,
                'nomes_pais': nomes_pais,
                'num_avos_outros': num_avos_outros,
                'nomes_avos_outros': nomes_avos_outros
            }
        }

        app.logger.info(f"Sending response: {response_data}")
        return jsonify(response_data)

    except Exception as e:
        app.logger.error(f"Error in /calculate_inheritance: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Ensure the templates folder is correctly referenced if you decide to move index.html there
    # For now, with template_folder='.', it will look in the root where app.py is.
    # For static files, it will look in 'static' relative to where app.py is.
    app.run(debug=True) 