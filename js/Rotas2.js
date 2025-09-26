const skus = document.getElementById('Sku');
const div = document.getElementById('rotas-por-sku');

skus.addEventListener('keydown', function(evento) {
    if (evento.key === 'Enter'){
       if (isNaN(Number(skus.value))){
            skus.style.borderColor = 'red';
       }else{
        mostrar()
       }
    }
})

function mostrar(){
    
    const caixas_pd = document.getElementById('Caixas_total');
    caixas_pd.textContent = 'snflknn'

}








