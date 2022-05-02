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
        if(possibilidades_pre_reqs_novos[i].length < possibilidades_pre_reqs_novos[disciplina["lista_pre_requisitos"]]) {
            disciplina["lista_pre_requisitos"] = i;
            pre_reqs_novos = possibilidades_pre_reqs_novos[i];
        }
    }

    return pre_reqs_novos;
}

function consertarGrupos(gruposDict, id) {
    const disciplina = hashDisciplinas[id];

    let nome_grupo = disciplina["nome_grupo"][0];
    let tipo_grupo = disciplina["tipo_grupo"][0];
    let creditos_grupo = disciplina["creditos_grupo"][0];

    for (let i = 0; i < disciplina["nome_grupo"].length; ++i) {
        const nome = disciplina["nome_grupo"][i];
        const tipo = disciplina["tipo_grupo"][i];
        const creditos = disciplina["creditos_grupo"][i];

        if (gruposDict[nome] < gruposDict[nome_grupo] || tipo == 0) {
            nome_grupo = nome;
            tipo_grupo = tipo;
            creditos_grupo = creditos;
        }

        if (tipo == 0)
            break;
    }

    disciplina["nome_grupo"] = nome_grupo;
    disciplina["tipo_grupo"] = tipo_grupo;
    disciplina["creditos_grupo"] = creditos_grupo;
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

    if (disciplina["nome"].length > 30)
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

    for (let i = 0; i < ordenado.length; ++i)
        ordenado[i].sort(() => Math.random() - 0.5);

    ordenado.forEach(linha => {
        const divLinha = criarDivLinhaDisciplinas();
        linha.forEach(disciplina => {
            divLinha.appendChild(elementosDisciplinas[disciplina]);
        });
        div = divLinha;
        divGrafo.append(divLinha)
    });
}

function pesquisarSeletor(evento) {
    const input = evento.target;
    const pesquisa = input.value;

    const divPesquisa = input.parentElement;
    const seletor = divPesquisa.parentElement;
    const itens = seletor.children[1];

    for (let i = 0; i < itens.children.length; ++i) {
        const btnDisciplina = itens.children[i];

        if (!btnDisciplina.innerText.toUpperCase().includes(pesquisa.toUpperCase())) {
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

function criarSeletor(nome, disciplinas, classeOutline, click) {
    const wrapper = document.createElement("div");
    const seletor = document.createElement("div");
    const titulo = document.createElement("h2");
    const pesquisa = criarCaixaDePesquisa();
    const itens = document.createElement("div");
    const contadorCreditos = document.createElement("h4");

    wrapper.classList.add("seletorWrapper");
    seletor.classList.add("seletorDisciplinas");
    itens.classList.add("itens");

    titulo.innerText = nome;

    seletor.append(pesquisa);

    disciplinas.forEach(disciplina => {
        const botao = document.createElement("button");

        botao.innerText = disciplina["codigo"];
        botao.classList.add("btn");
        botao.classList.add(classeOutline);
        botao.onclick = click;

        botao["disciplina"] = disciplina;
        botao["clicavel"] = true;

        itens.append(botao);
        hashBotoes[disciplina["id"]] = botao;
    });

    seletor.append(itens);

    if (disciplinas[0]["creditos_grupo"]) {
        contadorCreditos.innerText = "0/" + disciplinas[0]["creditos_grupo"];
        contadorCreditos.id = "creditos-" + nome;
        seletor.append(contadorCreditos);
    }

    wrapper.append(titulo);
    wrapper.append(seletor);

    return wrapper;
}

function criarSeletorFeitas(feitas) {
    const classeOutline = "btn-outline-success";
    const classeSelecionado = "btn-success";

    return criarSeletor("Disciplinas feitas", feitas, "btn-outline-success", function(e) {
        const botao = e.target;
        const disciplina = botao["disciplina"];

        disciplina["feita"] = !disciplina["feita"];

        if (disciplina["feita"]) {
            botao.classList.remove(classeOutline);
            botao.classList.add(classeSelecionado);

            botao["proximo"] = botao.nextElementSibling;

            $(botao.parentElement).prepend(botao);
        } else {
            botao.classList.remove(classeSelecionado);
            botao.classList.add(classeOutline);

            if (botao["proximo"])
                botao.parentElement.insertBefore(botao, botao["proximo"]);
            else
                $(botao.parentElement).append(botao);
        }

        atualizarGrafo();
    });
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

    const id = item["disciplina"]["id"];
    const nome = item["disciplina"]["nome_grupo"];

    const creditos_seletor = document.getElementById("creditos-" + nome);
    creditos_seletor.innerText = creditosEletivas[nome] + "/" + hashDisciplinas[id]["creditos_grupo"];

    if (creditosEletivas[nome] + item["disciplina"]["creditos"] == hashDisciplinas[id]["creditos_grupo"])
        ativarNovosItens(item.parentElement, classeOutline);
}

function criarSeletorEletivas(nome, disciplinas) {
    const classeOutline = "btn-outline-primary";
    const classeSelecionado = "btn-primary";

    return criarSeletor(nome, disciplinas, classeOutline, function(e) {
        const botao = e.target;
        const id = botao["disciplina"]["id"];

        if (!botao["clicavel"])
            return;

        if (grafoDisciplinas.includes(id)) {
            excluirDisciplinaGrafo(id).forEach(id_excluido => {
                creditosEletivas[hashDisciplinas[id_excluido]["nome_grupo"]] -= hashDisciplinas[id_excluido]["creditos"];
                deselecionarItemSeletor(hashBotoes[id_excluido], classeOutline, classeSelecionado);
            });
        } else {
            const novas_disciplinas = consertarPreRequisitos(hashDisciplinas[id]);
            const adicionar = [];

            novas_disciplinas.concat([id]).forEach(novo_id => {
                const disciplina = hashDisciplinas[novo_id]
                const nome_atual = disciplina["nome_grupo"];

                if (creditosEletivas[nome_atual] + disciplina["creditos"] <= disciplina["creditos_grupo"]) {
                    creditosEletivas[nome_atual] += disciplina["creditos"];
                    adicionar.push(novo_id);
                }
            });

            const grupos_modificados = [];
            const creditos_grupos = [];
            const itens_grupos = [];

            adicionar.forEach(novo_id => {
                selecionarItemSeletor(hashBotoes[novo_id], classeOutline, classeSelecionado);
                grafoDisciplinas.push(novo_id);

                if (!grupos_modificados.includes(hashDisciplinas[novo_id]["nome_grupo"])) {
                    grupos_modificados.push(hashDisciplinas[novo_id]["nome_grupo"]);
                    creditos_grupos.push(hashDisciplinas[novo_id]["creditos_grupo"]);
                    itens_grupos.push(hashBotoes[novo_id].parentElement);
                }
            });

            for (let i = 0; i < grupos_modificados.length; ++i) {
                const creditos_grupo = creditos_grupos[i];
                const grupo = grupos_modificados[i];

                const creditos_seletor = document.getElementById("creditos-" + grupo);
                creditos_seletor.innerText = creditosEletivas[grupo] + "/" + creditos_grupo;

                if (creditosEletivas[grupo] == creditos_grupo)
                    desativarNovosItens(itens_grupos[i], classeOutline);
            }
        }

        atualizarGrafo();
    });
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
    const tiposDisciplinas = {};
    const disciplinasFeitas = [];

    grafoDisciplinas.forEach(id => {
        disciplinasFeitas.push(hashDisciplinas[id]);
    });

    Object.keys(hashDisciplinas).forEach(id => {
        const disciplina = hashDisciplinas[id];

        if (disciplina["tipo_grupo"] == 0)
            return;

        if (disciplina["nome_grupo"] in tiposDisciplinas)
            tiposDisciplinas[disciplina["nome_grupo"]].push(disciplina);
        else
            tiposDisciplinas[disciplina["nome_grupo"]] = [disciplina];
    });

    const seletores = document.getElementById("seletores");
    const feitas = criarSeletorFeitas(disciplinasFeitas);

    seletores.append(feitas);

    ordenarComNumeraisRomanos(Object.keys(tiposDisciplinas)).forEach(tipo => {
        creditosEletivas[tipo] = 0;
        const seletor = criarSeletorEletivas(tipo, tiposDisciplinas[tipo]);
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

const hashDisciplinas = {};
const hashBotoes = {};
const grafoDisciplinas = [];
const elementosDisciplinas = {};
const creditosEletivas = {};

$(document).ready(function() {
    const params = new URLSearchParams(window.location.search);

    const codigoUniversidade = params.get("uni");
    const codigoCurso = params.get("curso");

    $.get("/db/getDisciplinasCurso", { uni: codigoUniversidade, curso: codigoCurso }, responseCurso => {
        $.get("/db/getTodasDisciplinas", responseTodas => {

            JSON.parse(responseTodas).forEach(disciplina => {
                disciplina["feita"] = false;
                hashDisciplinas[disciplina["id"]] = disciplina;
            });

            Object.keys(hashDisciplinas).forEach(id => {
                consertarPreRequisitosTriviais(hashDisciplinas[id]);
            })

            const gruposDict = {};
            JSON.parse(responseCurso).forEach(disciplina => {
                const id = disciplina["id"];
                const nome_grupo = disciplina["nome_grupo"];
                const tipo_grupo = disciplina["tipo_grupo"];
                const creditos_grupo = disciplina["creditos_grupo"];

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

                if (disciplina["feita"] || disciplina["tipo_grupo"] == 0)
                    grafoDisciplinas.push(id)
            });

            grafoDisciplinas.forEach(id => {
                const disciplina = hashDisciplinas[id];

                if (disciplina["pre_requisitos"].length > 1)
                    consertarPreRequisitos(disciplina);
            });

            Object.keys(hashDisciplinas).forEach(id => {
                consertarGrupos(gruposDict, id);
            });

            criarElementosDisciplinas();
            configurarSeletores();
            atualizarGrafo();
        });
    });
});
