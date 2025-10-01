import json
import os
import random
from datetime import date, timedelta
from copy import deepcopy

# Carregar o modelo base
with open("Jsons/Nat_01_03_2025.json", "r", encoding="utf-8") as f:
    base_data = json.load(f)

# Função recursiva que altera dados
def alterar_dados(obj):
    if isinstance(obj, dict):
        return {k: alterar_dados(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        novo = []
        for item in obj:
            novo.append(alterar_dados(item))
        # opcional: embaralhar listas
        if random.random() < 0.2:
            random.shuffle(novo)
        return novo
    elif isinstance(obj, (int, float)):
        # varia até 30% para dar diversidade
        fator = random.uniform(0.7, 1.3)
        return round(obj * fator, 2) if isinstance(obj, float) else int(obj * fator)
    else:
        # string ou None → mantém ou troca se for descrição
        if isinstance(obj, str) and random.random() < 0.1:
            return obj + " (var)"
        return obj

# Gerar arquivos para um intervalo de dias
def gerar_jsons(inicio, fim, pasta_saida="Jsons"):
    os.makedirs(pasta_saida, exist_ok=True)
    dia = inicio
    while dia <= fim:
        dados = deepcopy(base_data)
        dados = alterar_dados(dados)

        nome_arquivo = f"Nat_{dia.day:02d}_{dia.month:02d}_{dia.year}.json"
        caminho = os.path.join(pasta_saida, nome_arquivo)
        with open(caminho, "w", encoding="utf-8") as f:
            json.dump(dados, f, indent=4, ensure_ascii=False)
        print(f"Gerado: {caminho}")
        dia += timedelta(days=1)

# Definir datas para preencher os dados
inicio = date(2025, 3, 1)
fim = date(2025, 10, 1)  # gera de 01 a 05 de março/2025
gerar_jsons(inicio, fim)
