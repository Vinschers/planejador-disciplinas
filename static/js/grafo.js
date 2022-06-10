function getPreRequisitos(disciplina) {
    return disciplina["pre_requisitos"][disciplina["lista_pre_requisitos"]];
}

function printarPreRequisitos(disciplina) {
    let str = "";
    disciplina["pre_requisitos"].forEach(lista => {
        codigos = [];

        lista.forEach(id => {
            codigos.push(hashDisciplinas[id]["codigo"]);
        });

        str += ", [" + codigos.join(", ") + "]";
    });

    console.log(disciplina["codigo"] + ": " + str.substring(2, str.length));
}

function desmembrarPreRequisitos(pre_requisitos) {
    const desmembrados = [];
    const dict_possibilidades = {};

    pre_requisitos.forEach(pre_req => {
        const pre_req_split = pre_req.split(" ");
        const possibilidade = parseInt(pre_req_split[0]);
        const pre_req_id = parseInt(pre_req_split[1]);

        if (possibilidade in dict_possibilidades)
            dict_possibilidades[possibilidade].push(pre_req_id);
        else
            dict_possibilidades[possibilidade] = [pre_req_id];
    });

    Object.keys(dict_possibilidades).forEach(possibilidade => {
        desmembrados.push(dict_possibilidades[possibilidade]);
    });

    return desmembrados;
}

function consertarPreRequisitosTriviais(disciplina) {
    const pre_requisitos = desmembrarPreRequisitos(disciplina["pre_requisitos"]);
    const possiveis = [];

    pre_requisitos.forEach(lista => {
        for (let i = 0; i < lista.length; ++i) {
            if (!(lista[i] in hashDisciplinas))
                return;
        }

        possiveis.push(lista);
    });

    if (possiveis.length == 0) {
        disciplina["pre_requisitos"] = [[]];
    } else {
        disciplina["pre_requisitos"] = possiveis;
    }

    disciplina["lista_pre_requisitos"] = 0;
}

function consertarPreRequisitos(disciplina) {
    const possibilidades_pre_reqs_novos = [];
    const listas_pre_reqs = disciplina["pre_requisitos"];

    listas_pre_reqs.forEach(lista => {
        let possibilidade = [];

        lista.forEach(id => {
            if (!grafoDisciplinas.includes(id)) {
                possibilidade = possibilidade.concat(consertarPreRequisitos(hashDisciplinas[id]));
                possibilidade.push(id);
            }
        });

        possibilidades_pre_reqs_novos.push(possibilidade);
    });

    disciplina["lista_pre_requisitos"] = 0;
    let pre_reqs_novos = possibilidades_pre_reqs_novos[0];

    for (let i = 0; i < possibilidades_pre_reqs_novos.length; ++i) {
        if (possibilidades_pre_reqs_novos[i].length < possibilidades_pre_reqs_novos[disciplina["lista_pre_requisitos"]]) {
            disciplina["lista_pre_requisitos"] = i;
            pre_reqs_novos = possibilidades_pre_reqs_novos[i];
        }
    }

    return pre_reqs_novos;
}

function consertarGrupos(disciplinasCurso) {
    const gruposDict = {};

    disciplinasCurso.forEach(disciplina => {

        const id = disciplina["id"];
        const nome_grupo = disciplina["nome_grupo"];
        const tipo_grupo = disciplina["tipo_grupo"];
        const creditos_grupo = disciplina["creditos_grupo"];

        if (!(nome_grupo in creditosEletivas))
            creditosEletivas[nome_grupo] = [0, creditos_grupo];

        if (nome_grupo in gruposDict)
            ++gruposDict[nome_grupo];
        else
            gruposDict[nome_grupo] = 1;

        disciplina = { ...disciplina, ...hashDisciplinas[id] };

        if (Array.isArray(disciplina["nome_grupo"]))
            disciplina["nome_grupo"].push(nome_grupo);
        else
            disciplina["nome_grupo"] = [nome_grupo];

        if (Array.isArray(disciplina["tipo_grupo"]))
            disciplina["tipo_grupo"].push(tipo_grupo);
        else
            disciplina["tipo_grupo"] = [tipo_grupo];

        if (Array.isArray(disciplina["creditos_grupo"]))
            disciplina["creditos_grupo"].push(creditos_grupo);
        else
            disciplina["creditos_grupo"] = [creditos_grupo];

        hashDisciplinas[id] = disciplina;
    });
}

function inverterGrafo(disciplinasObj) {
    const grafoInvertido = {};

    for (let [id, disciplina] of Object.entries(disciplinasObj)) {
        const pre_requisitos = getPreRequisitos(disciplina);

        pre_requisitos.forEach(pre_req => {
            if (!(pre_req in grafoInvertido))
                grafoInvertido[pre_req] = [id];
            else
                grafoInvertido[pre_req].push(id);
        });
    }

    return grafoInvertido;
}

function ordenacaoTopologicaAux(disciplinasObj, disciplinasOrdenadas, visitado, indice) {
    let terminou = true;
    let listaVisitados = [];

    Object.keys(disciplinasObj).forEach(id => {
        if (visitado[id])
            return;

        terminou = false;
        let ehPossivel = true;
        const pre_requisitos = getPreRequisitos(disciplinasObj[id]);

        for (let i = 0; i < pre_requisitos.length; ++i)
            if (!visitado[pre_requisitos[i]]) {
                ehPossivel = false;
                break;
            }

        if (ehPossivel) {
            if (indice in disciplinasOrdenadas)
                disciplinasOrdenadas[indice].push(id);
            else
                disciplinasOrdenadas[indice] = [id];

            listaVisitados.push(id);
        }
    });

    listaVisitados.forEach(id => {
        visitado[id] = true;
    });

    if (!terminou)
        ordenacaoTopologicaAux(disciplinasObj, disciplinasOrdenadas, visitado, indice + 1);
}

function ordenacaoTopologica(disciplinasObj) {
    const visitado = {};

    Object.keys(disciplinasObj).forEach(id => {
        visitado[id] = false;
    });

    const disciplinasOrdenadasObj = {};
    ordenacaoTopologicaAux(disciplinasObj, disciplinasOrdenadasObj, visitado, 0);

    const disciplinasOrdenadas = [];
    Object.keys(disciplinasOrdenadasObj).forEach(indice => {
        disciplinasOrdenadas.push(disciplinasOrdenadasObj[indice]);
    });

    return disciplinasOrdenadas;
}

function criarHashDisciplinas(disciplinas, aparentes) {
    const disciplinasObj = new Object(disciplinas);

    consertarPreRequisitos(disciplinasObj, aparentes);
    const grafoConsequencias = inverterGrafo(disciplinasObj);

    Object.keys(disciplinasObj).forEach(id => {
        if (id in grafoConsequencias)
            disciplinasObj[id]["consequencias"] = grafoConsequencias[id];
        else
            disciplinasObj[id]["consequencias"] = [];
    });

    return disciplinasObj;
}

function criarDivLinhaDisciplinas() {
    const div = document.createElement("div");
    div.className = "linha";

    return div;
}

function getClasseDisciplina(codigo) {
    return codigo.substring(0, 2).trim().toLowerCase();
}

function criarElementoDisciplina(disciplina) {
    const elemento = document.createElement("a");

    elemento.classList.add("disciplina");
    elemento.classList.add(getClasseDisciplina(disciplina["codigo"]));
    elemento.innerHTML += `<span class="codigo">${disciplina["codigo"]}</span>`;

    if (disciplina["nome"].length > 27)
        elemento.innerHTML += `<span class="nome">${disciplina["nome"]}</span>`;
    else
        elemento.innerHTML += `<span class="nome grande">${disciplina["nome"]}</span>`;

    elemento.innerHTML += `<span class="creditos">${disciplina["creditos"]}</span>`;
    elemento["disciplina"] = disciplina;

    return elemento;
}

function desativarElementos() {
    Object.keys(elementosDisciplinas).forEach(id => {
        elementosDisciplinas[id].classList.add("desativado");
    });
}

function ativarElementos() {
    Object.keys(elementosDisciplinas).forEach(id => {
        elementosDisciplinas[id].classList.remove("desativado");
    });
}

function ativarElemento(id, mostrarPreReqs, mostrarConsequencias) {
    elementosDisciplinas[id].classList.remove("desativado");
    const disciplina = hashDisciplinas[id];

    if (mostrarConsequencias) {
        disciplina["consequencias"].forEach(con => {
            ativarElemento(con, false, true);
        });
    }

    if (mostrarPreReqs) {
        const pre_requisitos = getPreRequisitos(disciplina);
        pre_requisitos.forEach(pre_req => {
            ativarElemento(pre_req, true, false);
        })
    }
}

function criarElementosDisciplinas() {
    Object.keys(hashDisciplinas).forEach(id => {
        const disciplina = hashDisciplinas[id];
        const elemento = criarElementoDisciplina(disciplina);

        elemento.onmouseenter = function(e) {
            if ("disciplina" in e.target) {
                desativarElementos();
                ativarElemento(e.target["disciplina"]["id"], true, true);
            }
        }

        elemento.onmouseleave = function(e) {
            if ("disciplina" in e.target)
                ativarElementos();
        }

        elementosDisciplinas[disciplina["id"]] = elemento;
    })
}

function criarHashGrafoDisciplinas() {
    const hash = {};

    grafoDisciplinas.forEach(id => {
        hash[id] = hashDisciplinas[id];
    });

    return hash;
}

function getConsequenciasTotais(disciplina) {
    let qtdConsequencias = disciplina["consequencias"].length;

    disciplina["consequencias"].forEach(consequencia => {
        qtdConsequencias += getConsequenciasTotais(hashDisciplinas[consequencia]);
    });

    return qtdConsequencias;
}

function atualizarElementosDisciplinas() {
    if ($.isEmptyObject(elementosDisciplinas)) {
        criarElementosDisciplinas();
    }

    grafoDisciplinas.forEach(id => {
        const disciplina = hashDisciplinas[id];

        if (disciplina["feita"])
            elementosDisciplinas[id].classList.add("feita");
        else
            elementosDisciplinas[id].classList.remove("feita");
    });

    grafoDisciplinas.forEach(id => {
        const disciplina = hashDisciplinas[id];

        let possivel = true;
        getPreRequisitos(disciplina).forEach(pre_req => {
            if (!hashDisciplinas[pre_req]["feita"])
                possivel = false;
        });

        if (possivel && !disciplina["feita"])
            elementosDisciplinas[id].classList.add("possivel");
        else
            elementosDisciplinas[id].classList.remove("possivel");
    });
}

function atualizarGrafo() {
    const divGrafo = document.getElementById("grafo");
    divGrafo.innerHTML = "";

    const hashGrafoDisciplinas = criarHashGrafoDisciplinas();
    const grafoConsequencias = inverterGrafo(hashGrafoDisciplinas);

    grafoDisciplinas.forEach(id => {
        if (id in grafoConsequencias)
            hashDisciplinas[id]["consequencias"] = grafoConsequencias[id];
        else
            hashDisciplinas[id]["consequencias"] = [];
    });

    const ordenado = ordenacaoTopologica(hashGrafoDisciplinas);

    for (let i = 0; i < ordenado.length; ++i) {
        ordenado[i].sort((idA, idB) => {
            const disciplinaA = hashDisciplinas[idA];
            const disciplinaB = hashDisciplinas[idB];

            const diffFeita = disciplinaA["feita"] - disciplinaB["feita"];

            if (diffFeita != 0)
                return diffFeita;

            const qtdConA = getConsequenciasTotais(disciplinaA);
            const qtdConB = getConsequenciasTotais(disciplinaB);
            return qtdConB - qtdConA;
        });
    }

    atualizarElementosDisciplinas();

    ordenado.forEach(linha => {
        const divLinha = criarDivLinhaDisciplinas();
        linha.forEach(disciplina => {
            divLinha.appendChild(elementosDisciplinas[disciplina]);
        });
        div = divLinha;
        divGrafo.append(divLinha)
    });

    setCookie("info", JSON.stringify(cookieInfo));
}

function pesquisarSeletor(evento) {
    const input = evento.target;
    const pesquisa = input.value.toUpperCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

    const divPesquisa = input.parentElement;
    const seletor = divPesquisa.parentElement;
    const itens = seletor.children[1];

    for (let i = 0; i < itens.children.length; ++i) {
        const btnDisciplina = itens.children[i];
        const disciplina = btnDisciplina["disciplina"];

        const codigo = disciplina["codigo"].toUpperCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
        const nome = disciplina["nome"].toUpperCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
        const descricao = disciplina["descricao"].toUpperCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

        if (!(codigo.includes(pesquisa) || nome.includes(pesquisa) || descricao.includes(pesquisa))) {
            btnDisciplina.style.display = "none";
        } else {
            btnDisciplina.style.display = "inline-block";
        }
    }
}

function criarCaixaDePesquisa() {
    const divPesquisa = document.createElement("div");
    divPesquisa.classList.add("pesquisa");

    const input = document.createElement("input");
    input.type = "search";
    input.placeholder = "Buscar...";

    input.onkeyup = pesquisarSeletor;

    divPesquisa.append(input);

    return divPesquisa;
}

function criarConteudoPopover(disciplina) {
    const wrapper = document.createElement("div");
    const nome = document.createElement("h5");
    const creditos = document.createElement("h6");
    const pre_requisitos = document.createElement("h6");
    const descricao = document.createElement("span");

    consertarPreRequisitos(disciplina);
    const codigos_pre_requisitos = [];

    disciplina["pre_requisitos"][disciplina["lista_pre_requisitos"]].forEach(id => {
        codigos_pre_requisitos.push(hashDisciplinas[id]["codigo"]);
    });

    nome.innerText = disciplina["nome"];
    creditos.innerText = disciplina["creditos"] + " créditos";
    pre_requisitos.innerText = "Pré-requisitos: " + codigos_pre_requisitos.join(", ");
    descricao.innerText = disciplina["descricao"];

    wrapper.appendChild(nome);
    wrapper.appendChild(creditos);

    if (codigos_pre_requisitos.length > 0)
        wrapper.appendChild(pre_requisitos);

    wrapper.appendChild(descricao);

    return wrapper;
}

function criarItemSeletor(disciplina, seletorObj) {
    const botao = document.createElement("button");

    botao.innerText = disciplina["codigo"];
    botao.classList.add("btn");
    botao.classList.add(seletorObj["classeOutline"]);
    botao.onclick = function(e) {
        seletorObj["acao"](seletorObj["classeOutline"], seletorObj["classeSelecionado"], e);
        seletorObj["atualizar"](seletorObj["classeOutline"], seletorObj["classeSelecionado"], e);
        atualizarGrafo();
    };

    botao.setAttribute("data-bs-toggle", "popover");
    botao.setAttribute("data-bs-trigger", "hover");
    botao.setAttribute("data-bs-html", "true");

    botao.setAttribute("title", disciplina["codigo"]);
    botao.setAttribute("data-bs-content", criarConteudoPopover(disciplina).outerHTML);

    botao["disciplina"] = disciplina;
    botao["clicavel"] = true;
    botao["popover"] = new bootstrap.Popover(botao);

    return botao;
}

function criarSeletor(nome, seletorObj) {
    const wrapper = document.createElement("div");
    const seletor = document.createElement("div");
    const titulo = document.createElement("h2");
    const pesquisa = criarCaixaDePesquisa();
    const itens = document.createElement("div");
    const contadorCreditos = document.createElement("h4");

    hashBotoes[nome] = {};

    wrapper.classList.add("seletorWrapper");
    seletor.classList.add("seletorDisciplinas");
    itens.classList.add("itens");

    titulo.innerText = nome;

    seletor.append(pesquisa);

    seletorObj["disciplinas"].forEach(disciplina => {
        const botao = criarItemSeletor(disciplina, seletorObj);
        botao["grupo"] = nome;

        itens.append(botao);
        hashBotoes[nome][disciplina["id"]] = botao;
    });

    seletor.append(itens);

    if (nome in creditosEletivas) {
        contadorCreditos.innerText = "0/" + creditosEletivas[nome][1];
        contadorCreditos.id = "creditos-" + nome;
        seletor.append(contadorCreditos);
    }

    wrapper.append(titulo);
    wrapper.append(seletor);

    return wrapper;
}

function criarSeletorFeitas(ids) {
    const disciplinas = [];

    ids.forEach(id => {
        disciplinas.push(hashDisciplinas[id]);
    });

    const feitas = criarSeletor("Disciplinas feitas", {
        "classeOutline": "btn-outline-success",
        "classeSelecionado": "btn-success",
        "acao": clicarSeletorFeitas,
        "atualizar": function(classeOutline, classeSelecionado, e) {},
        "disciplinas": disciplinas,
    });

    feitas["ids"] = ids;

    return feitas;
}

function ativarNovosItens(itens, classeOutline) {
    Array.from(itens.children).forEach(item => {
        if (item.classList.contains(classeOutline)) {
            item.classList.remove("seletor-desativado");
            item["clicavel"] = true;
        }
    })
}

function desativarNovosItens(itens, classeOutline) {
    Array.from(itens.children).forEach(item => {
        if (item.classList.contains(classeOutline)) {
            item.classList.add("seletor-desativado");
            item["clicavel"] = false;
        }
    })
}

function selecionarItemSeletor(item, classeOutline, classeSelecionado) {
    item.classList.remove(classeOutline);
    item.classList.add(classeSelecionado);

    item["index"] = Array.from(item.parentElement.children).indexOf(item);

    $(item.parentElement).prepend(item);
}

function deselecionarItemSeletor(item, classeOutline, classeSelecionado) {
    item.classList.remove(classeSelecionado);
    item.classList.add(classeOutline);

    if (item["index"] + 1 < item.parentElement.children.length)
        item.parentElement.insertBefore(item, item.parentElement.children[item["index"] + 1]);
    else
        $(item.parentElement).append(item);

    const grupo = item["grupo"];

    if (!(grupo in creditosEletivas))
        return;

    const creditos_seletor = document.getElementById("creditos-" + grupo);
    creditos_seletor.innerText = creditosEletivas[nome][0] + "/" + creditosEletivas[nome][1];

    if (creditosEletivas[nome][0] + item["disciplina"]["creditos"] == creditosEletivas[nome][1])
        ativarNovosItens(item.parentElement, classeOutline);
}

function atualizarSeletorFeitas(ids) {
    const novos_ids = [];

    seletorFeitas["ids"].forEach(id => {
        if (!ids.includes(id))
            novos_ids.push(id);
    });
    ids.forEach(id => {
        if (!seletorFeitas["ids"].includes(id))
            novos_ids.push(id);
    });

    const seletores = document.getElementById("seletores");

    seletorFeitas = criarSeletorFeitas(novos_ids);
    seletores.replaceChild(seletorFeitas, seletores.firstChild);
}

function clicarSeletorFeitas(classeOutline, classeSelecionado, e) {
    const botao = e.target;
    const disciplina = botao["disciplina"];
    const grupo = botao["grupo"];

    if (!disciplina["feita"]) {
        const ids_fila = [disciplina["id"]];
        const feitas = [];

        while (ids_fila.length) {
            const id_atual = ids_fila.pop();
            const disciplina_atual = hashDisciplinas[id_atual];

            if (disciplina_atual["feita"])
                continue;

            disciplina_atual["feita"] = true;
            selecionarItemSeletor(hashBotoes[grupo][id_atual], classeOutline, classeSelecionado);

            getPreRequisitos(disciplina_atual).forEach(id => {
                ids_fila.push(id);
            });

            feitas.push(id_atual);
        }

        feitas.forEach(id => {
            if (!cookieInfo[codUni][codCurso]["feitas"].includes(id))
                cookieInfo[codUni][codCurso]["feitas"].push(id);
        });
    } else {
        const ids_fila = [disciplina["id"]];
        const nao_feitas = [];

        while (ids_fila.length) {
            const id_atual = ids_fila.pop();
            const disciplina_atual = hashDisciplinas[id_atual];

            if (!disciplina_atual["feita"])
                continue;

            disciplina_atual["feita"] = false;
            deselecionarItemSeletor(hashBotoes[grupo][id_atual], classeOutline, classeSelecionado);

            disciplina_atual["consequencias"].forEach(id => {
                ids_fila.push(id);
            });

            nao_feitas.push(id_atual);
        }

        nao_feitas.forEach(id => {
            cookieInfo[codUni][codCurso]["feitas"].splice(cookieInfo[codUni][codCurso]["feitas"].indexOf(id), 1);
        });
    }

    botao["popover"].hide();
}

function excluirDisciplinaSeletor(id, grupo) {
    excluirDisciplinaGrafo(id).forEach(id_excluido => {
        creditosEletivas[grupo][0] -= hashDisciplinas[id_excluido]["creditos"];
        deselecionarItemSeletor(hashBotoes[grupo][id_excluido], classeOutline, classeSelecionado);

        cookieInfo[codUni][codCurso]["adicionadas"].splice(cookieInfo[codUni][codCurso]["adicionadas"].indexOf(id), 1);
    });
}

function clicarSeletorPadrao(classeOutline, classeSelecionado, e) {
    const botao = e.target;
    const id = botao["disciplina"]["id"];
    const grupo = botao["grupo"];

    if (!botao["clicavel"])
        return;

    if (grafoDisciplinas.includes(id)) {
        excluirDisciplinaSeletor(id, grupo);
    } else {
        const novas_disciplinas = consertarPreRequisitos(hashDisciplinas[id]);
        const adicionar = [];

        novas_disciplinas.concat([id]).forEach(novo_id => {
            const disciplina = hashDisciplinas[novo_id]

            if (creditosEletivas[grupo][0] + disciplina["creditos"] <= creditosEletivas[grupo][1]) {
                creditosEletivas[grupo][0] += disciplina["creditos"];
                adicionar.push(novo_id);
            }
        });

        const grupos_modificados = [];
        const creditos_grupos = [];
        const itens_grupos = [];

        adicionar.forEach(novo_id => {
            selecionarItemSeletor(hashBotoes[grupo][novo_id], classeOutline, classeSelecionado);
            grafoDisciplinas.push(novo_id);

            if (!cookieInfo[codUni][codCurso]["adicionadas"].includes(novo_id))
                cookieInfo[codUni][codCurso]["adicionadas"].push(novo_id);

            if (!grupos_modificados.includes(hashDisciplinas[novo_id]["nome_grupo"])) {
                grupos_modificados.push(hashDisciplinas[novo_id]["nome_grupo"]);
                creditos_grupos.push(hashDisciplinas[novo_id]["creditos_grupo"]);
                itens_grupos.push(hashBotoes[grupo][novo_id].parentElement);
            }
        });

        for (let i = 0; i < grupos_modificados.length; ++i) {
            const creditos_grupo = creditos_grupos[i];
            const grupo = grupos_modificados[i];

            const creditos_seletor = document.getElementById("creditos-" + grupo);
            creditos_seletor.innerText = creditosEletivas[grupo][0] + "/" + creditos_grupo;

            if (creditosEletivas[grupo][0] == creditos_grupo)
                desativarNovosItens(itens_grupos[i], classeOutline);
        }
    }

    botao["popover"].hide();
    atualizarGrafo();
}

function atualizarSeletorPadrao(classeOutline, classeSelecionado, e) {

}

/* https://stackoverflow.com/a/48601418 */
function ordenarComNumeraisRomanos(data, order) {

    function isNumber(v) {
        return (+v).toString() === v;
    }

    function isRoman(s) {
        // http://stackoverflow.com/a/267405/1447675
        return /^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/i.test(s);
    }

    function parseRoman(s) {
        var val = { M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1 };
        return s.toUpperCase().split('').reduce(function(r, a, i, aa) {
            return val[a] < val[aa[i + 1]] ? r - val[a] : r + val[a];
        }, 0);
    }

    var sort = {
        asc: function(a, b) {
            var i = 0,
                l = Math.min(a.value.length, b.value.length);

            while (i < l && a.value[i] === b.value[i]) {
                i++;
            }
            if (i === l) {
                return a.value.length - b.value.length;
            }
            if (isNumber(a.value[i]) && isNumber(b.value[i])) {
                return a.value[i] - b.value[i];
            }
            if (isRoman(a.value[i]) && isRoman(b.value[i])) {
                return parseRoman(a.value[i]) - parseRoman(b.value[i]);
            }
            return a.value[i].localeCompare(b.value[i]);
        },
        desc: function(a, b) {
            return sort.asc(b, a);
        }
    },
        mapped = data.map(function(el, i) {
            var string = el.replace(/\d(?=[a-z])|[a-z](?=\.)/gi, '$&. .'),
                regex = /(\d+)|([^0-9.]+)/g,
                m,
                parts = [];

            while ((m = regex.exec(string)) !== null) {
                parts.push(m[0]);
            }
            return { index: i, value: parts, o: el, string: string };
        });

    mapped.sort(sort[order] || sort.asc);
    return mapped.map(function(el) {
        return data[el.index];
    });
}

function configurarSeletores() {
    const disciplinasSeletores = {"Disciplinas extra": {"disciplinas": []}};

    Object.keys(hashDisciplinas).forEach(id => {
        const disciplina = hashDisciplinas[id];

        if (disciplina["tipo_grupo"].includes(0))
            return;

        for (let i = 0; i < disciplina["nome_grupo"].length; ++i) {
            const nome = disciplina["nome_grupo"][i];

            if (nome in disciplinasSeletores)
                disciplinasSeletores[nome]["disciplinas"].push(disciplina);
            else
                disciplinasSeletores[nome] = {"disciplinas": [disciplina]};
        }
        
        disciplinasSeletores["Disciplinas extra"]["disciplinas"].push(disciplina);
    });

    const seletores = document.getElementById("seletores");

    seletorFeitas = criarSeletorFeitas(grafoDisciplinas);
    seletores.append(seletorFeitas);

    ordenarComNumeraisRomanos(Object.keys(disciplinasSeletores)).forEach(tipo => {
        disciplinasSeletores[tipo]["acao"] = clicarSeletorPadrao;
        disciplinasSeletores[tipo]["atualizar"] = atualizarSeletorPadrao;
        disciplinasSeletores[tipo]["classeOutline"] = "btn-outline-primary";
        disciplinasSeletores[tipo]["classeSelecionado"] = "btn-primary";

        const seletor = criarSeletor(tipo, disciplinasSeletores[tipo]);
        seletores.append(seletor);
    });
}

function excluirDisciplinaGrafoAux(id, excluidas) {
    hashDisciplinas[id]["consequencias"].forEach(consequencia => {
        excluirDisciplinaGrafoAux(consequencia, excluidas);
    })

    grafoDisciplinas.splice(grafoDisciplinas.indexOf(id), 1);
    excluidas.push(id);
}

function excluirDisciplinaGrafo(id) {
    const excluidas = [];
    excluirDisciplinaGrafoAux(id, excluidas);
    return excluidas;
}

function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}
function deleteCookie(name, path, domain) {
    if (getCookie(name)) {
        document.cookie = name + "=" +
            ((path) ? ";path=" + path : "") +
            ((domain) ? ";domain=" + domain : "") +
            ";expires=Thu, 01 Jan 1970 00:00:01 GMT";
    }
}

function carregarCookies() {
    const cookieInfoAtual = JSON.parse(getCookie("info"));
    if (!$.isEmptyObject(cookieInfoAtual))
        cookieInfo = cookieInfoAtual;

    if (!(codUni in cookieInfo))
        cookieInfo[codUni] = {};
    if (!(codCurso in cookieInfo[codUni]))
        cookieInfo[codUni][codCurso] = {feitas: [], adicionadas: []};

    cookieInfo[codUni][codCurso]["feitas"].concat(cookieInfo[codUni][codCurso]["adicionadas"]).forEach(id => {
        // hashBotoes[id].click();
    });

    console.log(cookieInfo);
}

const hashDisciplinas = {};
const hashBotoes = {};
const grafoDisciplinas = [];
const elementosDisciplinas = {};
const creditosEletivas = {};

let seletorFeitas = null;
let cookieInfo = {};
let codUni = 0;
let codCurso = 0;

$(document).ready(function() {
    const params = new URLSearchParams(window.location.search);

    codUni = params.get("uni");
    codCurso = params.get("curso");

    $.get("/db/getDisciplinasCurso", { uni: codUni, curso: codCurso }, responseCurso => {
        $.get("/db/getTodasDisciplinas", responseTodas => {

            JSON.parse(responseTodas).forEach(disciplina => {
                disciplina["feita"] = false;
                hashDisciplinas[disciplina["id"]] = disciplina;
            });

            consertarGrupos(JSON.parse(responseCurso));

            Object.keys(hashDisciplinas).forEach(id => {
                consertarPreRequisitosTriviais(hashDisciplinas[id]);

                if (hashDisciplinas[id]["feita"] || hashDisciplinas[id]["tipo_grupo"].includes(0))
                    grafoDisciplinas.push(parseInt(id));
            });

            grafoDisciplinas.forEach(id => {
                const disciplina = hashDisciplinas[id];

                if (disciplina["pre_requisitos"].length > 1)
                    consertarPreRequisitos(disciplina);
            });

            configurarSeletores();

            carregarCookies();
            atualizarGrafo();
        });
    });
});
