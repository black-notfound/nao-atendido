import xlwings as xw
import datetime
import threading as th
import pandas as pd
import random
import json

tmp_inicio = datetime.datetime.now()


class escanear:
    def __init__(self):
        for n in xw.books:
            if 'NÃO ATENDIDO' in n.name.upper():
                self.wb: xw.Book = n
                break
        else:
            raise ValueError('Planilha do nat não esta aberta para modificações')

        self.erro: xw.Sheet = self.wb.sheets('% ERROS')
        self.resumo: xw.Sheet = self.wb.sheets('RESUMO')
        self.linha18: xw.Range = self.erro.range('18:18')
        self.colunaJ: list = self.erro.range('J:J').value
        self.fechamento_column: xw.Range = xw.Range(self.linha18.api.Find(What='FECHAMENTO', LookIn=-4163,MatchCase=False,LookAt=1).Address)
        self.total_erro: tuple = (self.colunaJ.index('ÁREA')+ 1, self.colunaJ.index('TOTAL'))
        self.total_area: tuple = (self.colunaJ.index('STATUS - ÁREA') + 1, self.colunaJ.index('TOTAL', self.colunaJ.index('STATUS - ÁREA') + 1))
        self.total_setor: tuple = (self.colunaJ.index('SETOR') + 1, self.colunaJ.index('TOTAL', self.colunaJ.index('SETOR') + 1))
        self.horarios: list = list()
        for t in self.linha18.value:
            if isinstance(t, (float, int)):
                fds = datetime.datetime(1,1,1) + datetime.timedelta(days=t)
                self.horarios.append(fds.strftime('%H:%M'))
    @property
    def resumo_completo(self) -> pd.DataFrame:
        coluna_a =self.resumo.range('A:A')
        ultima_linha = coluna_a.last_cell.end('up')
        cabeçalho = self.resumo.range(coluna_a.api.Find(What='SKU', LookIn=-4163,MatchCase=False,LookAt=1).Address)
        dados = self.resumo.range(cabeçalho.offset(1,0).address, ultima_linha.end('right').address).value

        return pd.DataFrame(dados, columns=self.resumo.range(cabeçalho.address, cabeçalho.end('right').address).value)
    @property
    def grafico(self) -> pd.DataFrame:
        começo = self.colunaJ.index('ÁREA')
        fim= self.colunaJ.index('TOTAL')

        dados: list[list, list] = self.erro.range(self.erro.cells(começo+1, 10), self.erro.cells(fim, self.fechamento_column.column)).value
        nm = 0
        for n, t in enumerate(dados[0]):
            if isinstance(t, (float, int) ):
                dados[0][n] = self.horarios[n-nm]
            else:
                nm = n +1
        data = pd.DataFrame(dados[2:], columns=dados[0])

        for i in range(dados[0].index(self.horarios[0]), len(data.columns)-1):
            anterior = data.columns[i-1]
            seguinte = data.columns[i+1]
            atual = data.columns[i]

            if data[atual].isna().any():
                if not data[anterior].isna().any() and not data[seguinte].isna().any():
                    data.loc[:, atual] = random.uniform(data[anterior],data[seguinte] )

        soma = data.sum(numeric_only= True).fillna('')

        data.loc['TOTAL'] = soma
        return data

    def setor_area(self):
        começo: xw.Range = self.erro.cells(self.colunaJ.index('SETOR') + 1, 11)
        fim: xw.Range = self.erro.cells(self.colunaJ.index('TOTAL', self.colunaJ.index('SETOR') + 1)  + 1
                                        , self.fechamento_column.column)

        ran = self.erro.range(começo.address, fim.address).value
        ran[0][0] = 'SETOR'

        nm = 0
        for n, t in enumerate(ran[0]):
            if isinstance(t, (float, int)):
                ran[0][n] = self.horarios[n - nm]
            else:
                nm = n + 1
        # dados.rename(columns={dados.columns[0]: 'SETOR'}, inplace=True)
        dados = pd.DataFrame(ran[1:], columns=ran[0])
        dados.drop(columns=[None], inplace=True)


#classe principal com todos os dados coletados agora e só pegar o que eu quero de informação e jogar dentro dos jsons
#Para questão de eficiencia vou utilizar do maximo de recursos do computador como assincrono e multi threading

#____________________________iniciando faze de compactação____________________________________________#
es = escanear()
serviço = dict()

def r():
    resumo: pd.DataFrame = es.resumo

    #____________________________________coletando dados nominais____________________________________#
    serviço['SUGESTÃO'] =resumo['SUGESTÃO TOTAL'].sum()
    serviço['ESCANEADO'] = resumo['UNID. FATURADAS'].sum() + resumo['UNID. NAT'].sum()
    serviço['NAT_GERAL'] = resumo['UNID. NAT'].sum()

#____________________________________Coletando dados do Grafico____________________________________#

gra = es.grafico
dados = dict()
for t in gra['HORÁRIO']:
    soma = gra[gra['HORÁRIO'] == t]

    filtro = soma.index.to_series().str.match(r'^\d{2}:\d{2}')  | (soma.index == 'FECHAMENTO')
    soma:pd.Series = soma[filtro].apply(lambda k: round(k* 100, 2) if k != 0.0 and not pd.isna(k) else None)
    soma = soma.astype('object')
    soma = soma.apply(lambda m: None if pd.isna(m) else m)



    dados[t] = soma.to_dict()
print(dados)









print('Executado em: ', datetime.datetime.now() - tmp_inicio)