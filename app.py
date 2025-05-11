from flask import Flask, request, jsonify, render_template
import os
# Assuming calculos_heranca.py is in the same directory or accessible via PYTHONPATH
import calculos_heranca
from decimal import Decimal

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
        
        # Correctly get 'quantos_filhos' from the form data
        num_filhos_str = data.get('quantos_filhos', '0') 
        num_filhos = int(num_filhos_str) if num_filhos_str.isdigit() else 0
        nomes_filhos = data.get('nomes_filhos', [])
        deixou_ascendentes_input = data.get('deixou_ascendentes') # sim, nao, ou None
        deixou_ascendentes = deixou_ascendentes_input == 'sim' # Define boolean based on input
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

        # Extract donations - REVISED FOR SIMPLIFIED FLOW
        doacoes_a_herdeiros_presentes = data.get('doacoes_herdeiros') == 'sim'
        
        valor_total_global_doacoes_herdeiros = Decimal(data.get('valor_total_global_doacoes_herdeiros', '0'))
        doacoes_individuais_herdeiros_com_dispensa = data.get('doacoes_individuais_herdeiros_com_dispensa', {})
        doacoes_individuais_herdeiros_sem_dispensa = data.get('doacoes_individuais_herdeiros_sem_dispensa', {})

        # Logging the received donation details
        app.logger.info(f"[DEBUG] Doações a Herdeiros Presentes: {doacoes_a_herdeiros_presentes}")
        app.logger.info(f"[DEBUG] Valor Total Global Doações Herdeiros: {valor_total_global_doacoes_herdeiros}")
        app.logger.info(f"[DEBUG] Doações Individuais Herdeiros COM Dispensa: {doacoes_individuais_herdeiros_com_dispensa}")
        app.logger.info(f"[DEBUG] Doações Individuais Herdeiros SEM Dispensa: {doacoes_individuais_herdeiros_sem_dispensa}")

        doacoes_outras_pessoas = data.get('doacoes_outras_pessoas') == 'sim'
        total_doacoes_outras_pessoas = Decimal(data.get('valor_doacoes_outras_pessoas', '0')) if doacoes_outras_pessoas else Decimal('0')

        # Extract testament info
        valor_bens_testamento = Decimal(data.get('valor_bens_testamento', '0')) if deixou_testamento else Decimal('0')

        # 1. Calcular VTH (Valor Total da Herança para cálculo da legítima)
        vth, fracao_legitima, fracao_legitima_display, ql, qd = calculos_heranca.calcular_vth_e_quotas(
            relictum=relictum,
            passivo=passivo,
            donatum_herdeiros_total=valor_total_global_doacoes_herdeiros,
            donatum_outros_total=total_doacoes_outras_pessoas,
            conjuge_sobrevive=conjuge_sobrevivo,
            num_filhos=num_filhos,
            ascendentes_presentes=deixou_ascendentes,
            tipo_ascendentes=tipo_ascendentes
        )

        # 2. Processar a herança (com ou sem testamento)
        if deixou_testamento:
            processamento_resultado = calculos_heranca.processar_com_testamento(
                relictum=relictum,
                passivo=passivo,
                valor_bens_testamento=valor_bens_testamento,
                vth=vth,
                ql=ql,
                qd=qd,
                fracao_legitima_calc=fracao_legitima,
                conjuge_info=(conjuge_sobrevivo, nome_conjuge),
                descendentes_info=(num_filhos, nomes_filhos),
                ascendentes_info=(deixou_ascendentes, tipo_ascendentes, num_pais, nomes_pais, num_avos_outros, nomes_avos_outros),
                doacoes_herdeiros_com_dispensa_detalhado=doacoes_individuais_herdeiros_com_dispensa,
                doacoes_herdeiros_sem_dispensa_detalhado=doacoes_individuais_herdeiros_sem_dispensa,
                doacoes_outros_total_para_qd=total_doacoes_outras_pessoas,
                regime_bens=regime_bens,
                estado_civil=estado_civil
            )
        else:
            # No testamento processing path
            processamento_resultado = calculos_heranca.processar_sem_testamento(
                vth=vth,
                ql=ql,
                qd=qd,
                fracao_legitima_calc=fracao_legitima,
                conjuge_info=(conjuge_sobrevivo, nome_conjuge),
                descendentes_info=(num_filhos, nomes_filhos),
                ascendentes_info=(deixou_ascendentes, tipo_ascendentes, num_pais, nomes_pais, num_avos_outros, nomes_avos_outros),
                doacoes_herdeiros_com_dispensa_detalhado=doacoes_individuais_herdeiros_com_dispensa,
                doacoes_herdeiros_sem_dispensa_detalhado=doacoes_individuais_herdeiros_sem_dispensa,
                doacoes_outros_total_para_qd=total_doacoes_outras_pessoas,
                regime_bens=regime_bens,
                estado_civil=estado_civil,
                relictum=relictum,
                passivo=passivo
            )
        
        # 4. Aplicar Colação - This logic will now be integrated into processar_com/sem_testamento
        # The 'colacao_info' will be part of the 'processamento_resultado' from those functions.
        # Therefore, the explicit call to aplicar_colacao is removed.
        
        # colacao_resultado = calculos_heranca.aplicar_colacao(
        #     quotas_herdeiros_base=processamento_resultado.get('quotas_herdeiros_base', {}),
        #     detalhes_doacoes_desc_sem_dispensa=doacoes_individuais_desc_sem_dispensa_val,
        #     num_linhas_descendencia=num_filhos, 
        #     vth=vth_calculado 
        # )
        # Assuming colacao_info is now part of processamento_resultado
        colacao_info = processamento_resultado.get('colacao_info', {})

        # Echo back some form data for easier display or debugging on frontend
        form_data_echo = {
            'nome_conjuge': nome_conjuge,
            'nomes_filhos': nomes_filhos,
            'num_filhos': num_filhos
        }

        response_data = {
            'VTH': vth,
            'fracao_legitima': fracao_legitima, 
            'fracao_legitima_display': fracao_legitima_display,
            'QL': ql,
            'QD': qd,
            'processamento_heranca': processamento_resultado, # This should now contain all necessary share details
            'colacao_info': colacao_info, # Extracted from processamento_resultado
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