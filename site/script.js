document.addEventListener('DOMContentLoaded', () => {

    const areasServico = document.querySelectorAll('.area-servico');
    const custoHoraGeralInput = document.getElementById('custo-hora-geral');
    const lucroDesejadoInput = document.getElementById('lucro-desejado');

    // Carrega os dados salvos ao iniciar a página
    carregarDados();

    // Adiciona a funcionalidade para cada área de serviço
    areasServico.forEach(area => {
        const tabelaItens = area.querySelector('.tabela-itens');
        const adicionarItemBtn = area.querySelector('.add-item-btn');

        // Adiciona um item padrão se não houver dados carregados
        if (tabelaItens.children.length === 0) {
            adicionarItem(tabelaItens);
        }

        // Eventos de clique e input para a área de serviço específica
        adicionarItemBtn.addEventListener('click', () => {
            adicionarItem(tabelaItens);
            salvarDados();
        });
        area.addEventListener('input', () => {
            recalcularTotais(area);
            salvarDados();
        });
    });

    // Eventos globais para recalcular e salvar quando o custo da hora ou a margem de lucro mudam
    custoHoraGeralInput.addEventListener('input', () => {
        areasServico.forEach(area => recalcularTotais(area));
        salvarDados();
    });
    lucroDesejadoInput.addEventListener('input', () => {
        areasServico.forEach(area => recalcularTotais(area));
        salvarDados();
    });

    // --- FUNÇÕES DE SALVAR E CARREGAR DADOS ---

    function salvarDados() {
        const dados = {
            custoHoraGeral: custoHoraGeralInput.value,
            lucroDesejado: lucroDesejadoInput.value,
            servicos: {}
        };

        areasServico.forEach(area => {
            const idServico = area.dataset.servico;
            dados.servicos[idServico] = {
                duracaoVisita: area.querySelector('input[id^="duracao-"]').value,
                itens: []
            };

            const linhas = area.querySelectorAll('.tabela-itens tr');
            linhas.forEach(linha => {
                const item = {
                    descricao: linha.querySelector('input[type="text"]').value,
                    custo: linha.querySelector('.custo-unitario').value,
                    quantidade: linha.querySelector('.quantidade').value
                };
                dados.servicos[idServico].itens.push(item);
            });
        });

        localStorage.setItem('dadosCicatrizar', JSON.stringify(dados));
    }

    function carregarDados() {
        const dadosSalvos = localStorage.getItem('dadosCicatrizar');
        if (!dadosSalvos) return;

        const dados = JSON.parse(dadosSalvos);

        custoHoraGeralInput.value = dados.custoHoraGeral;
        lucroDesejadoInput.value = dados.lucroDesejado;

        areasServico.forEach(area => {
            const idServico = area.dataset.servico;
            const dadosServico = dados.servicos[idServico];
            
            if (dadosServico) {
                area.querySelector('input[id^="duracao-"]').value = dadosServico.duracaoVisita;
                
                const tabelaItens = area.querySelector('.tabela-itens');
                tabelaItens.innerHTML = ''; // Limpa a tabela antes de carregar
                
                dadosServico.itens.forEach(item => {
                    adicionarItem(tabelaItens, item);
                });
            }
        });
        
        // Recalcula todos os totais após carregar os dados
        areasServico.forEach(area => recalcularTotais(area));
    }
    
    // --- FUNÇÕES EXISTENTES, COM PEQUENAS ADAPTAÇÕES ---

    function adicionarItem(tabela, dadosItem = { descricao: '', custo: 0, quantidade: 1 }) {
        const novaLinha = document.createElement('tr');
        novaLinha.innerHTML = `
            <td><input type="text" placeholder="Descrição do Item" value="${dadosItem.descricao}"></td>
            <td><input type="number" class="custo-unitario" value="${dadosItem.custo}" min="0"></td>
            <td><input type="number" class="quantidade" value="${dadosItem.quantidade}" min="0"></td>
            <td class="total-item">0.00</td>
            <td><button type="button" class="remover-btn">Remover</button></td>
        `;

        tabela.appendChild(novaLinha);

        const removerBtn = novaLinha.querySelector('.remover-btn');
        removerBtn.addEventListener('click', () => {
            novaLinha.remove();
            recalcularTotais(tabela.closest('.area-servico'));
            salvarDados();
        });
    }

    function recalcularTotais(area) {
        let totalMateriais = 0;
        const tabelaItens = area.querySelector('.tabela-itens');
        const duracaoVisitaInput = area.querySelector('input[id^="duracao-"]');
        const totalVisitaSpan = area.querySelector('.total-visita');
        const precoSugeridoSpan = area.querySelector('.preco-sugerido');

        const custoHoraGeral = parseFloat(custoHoraGeralInput.value) || 0;
        const lucroDesejado = parseFloat(lucroDesejadoInput.value) || 0;

        const linhas = tabelaItens.querySelectorAll('tr');
        linhas.forEach(linha => {
            const custoUnitario = parseFloat(linha.querySelector('.custo-unitario').value) || 0;
            const quantidade = parseFloat(linha.querySelector('.quantidade').value) || 0;
            const totalItem = custoUnitario * quantidade;

            linha.querySelector('.total-item').textContent = totalItem.toFixed(2);
            totalMateriais += totalItem;
        });

        const duracaoVisitaMin = parseFloat(duracaoVisitaInput.value) || 0;
        const custoMaoObra = (custoHoraGeral / 60) * duracaoVisitaMin;

        const totalDaVisita = totalMateriais + custoMaoObra;
        const precoSugerido = totalDaVisita * (1 + (lucroDesejado / 100));

        totalVisitaSpan.textContent = totalDaVisita.toFixed(2);
        precoSugeridoSpan.textContent = precoSugerido.toFixed(2);
    }

    // Inicializa os totais para todas as áreas ao carregar a página
    areasServico.forEach(area => recalcularTotais(area));
});