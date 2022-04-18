function desmembrarPreRequisitos(pre_requisitos) {
    const desmembrados = [];

    pre_requisitos.forEach(pre_req => {
        const pre_req_split = pre_req.split(" ");
        const possibilidade = parseInt(pre_req_split[0]);
        const pre_req_id = parseInt(pre_req_split[1]);

        if (desmembrados.length < possibilidade + 1)
            desmembrados.push([pre_req_id]);
        else
            desmembrados[possibilidade].push(pre_req_id);
    })

    return desmembrados;
}

function calcularDistanciaPreRequisito(disciplinas, aparentes, lista) {
    let distancia = 0;

    lista.forEach(id => {
        if (aparentes.includes(id))
            ++distancia;
        else if (!disciplinas[id]["feita"]) {
            let menorDistancia = 1 << 31;

            if (disciplinas[id]["pre_requisitos"].length > 0 && !Array.isArray(disciplinas[id]["pre_requisitos"]))
                distancia += calcularDistanciaPreRequisito(disciplinas, aparentes, disciplinas[id]["pre_requisitos"])
            else if (disciplinas[id]["pre_requisitos"].length > 0) {
                disciplinas[id]["pre_requisitos"].forEach(pre_reqs => {
                    const distanciaAtual = calcularDistanciaPreRequisito(disciplinas, aparentes, pre_reqs);

                    if (distanciaAtual < menorDistancia)
                        menorDistancia = distanciaAtual;
                });

                if (menorDistancia < 1 << 31)
                    distancia += menorDistancia;
            }
        }
    });

    return distancia;
}

function consertarPreRequisitos(disciplinas, aparentes, ids) {
    let terminou = false;
    const novas_aparentes = [];

    while (!terminou) {
        terminou = true;

        ids.forEach(id => {
            const disciplina = disciplinas[id];
            const listas = disciplina["pre_requisitos"];

            if (listas.length > 0 && Array.isArray(listas[0])) {
                terminou = false;

                if (listas.length == 1) {
                    disciplina["pre_requisitos"] = listas[0];
                    return;
                }

                for (let i = 0; i < listas.length; ++i) {
                    const lista = listas[i];
                    let estaoAparentes = true;

                    for (let j = 0; j < lista.length && estaoAparentes; ++j) {
                        const pre_req = lista[j];

                        if (!aparentes.includes(pre_req))
                            estaoAparentes = false;
                    }

                    if (estaoAparentes) {
                        disciplina["pre_requisitos"] = lista;
                        return;
                    }
                }
            }

            listas.forEach(pre_req => {
                if (!aparentes.includes(pre_req))
                    novas_aparentes.push(pre_req);
            });
        });
    }

    return novas_aparentes;
}

function inverterGrafo(disciplinasObj) {
    const grafoInvertido = {};

    for (let [id, disciplina] of Object.entries(disciplinasObj)) {
        disciplina["pre_requisitos"].forEach(pre_req => {
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

        for (let i = 0; i < disciplinasObj[id]["pre_requisitos"].length; ++i)
            if (!visitado[disciplinasObj[id]["pre_requisitos"][i]]) {
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

function desativarElementos(elementos) {
    Object.keys(elementos).forEach(id => {
        elementos[id].classList.add("desativado");
    });
}

function ativarElementos(elementos) {
    Object.keys(elementos).forEach(id => {
        elementos[id].classList.remove("desativado");
    });
}

function ativarElemento(elementos, id, mostrarPreReqs, mostrarConsequencias) {
    elementos[id].classList.remove("desativado");

    if (mostrarConsequencias) {
        elementos[id]["disciplina"]["consequencias"].forEach(con => {
            ativarElemento(elementos, con, false, true);
        });
    }

    if (mostrarPreReqs) {
        elementos[id]["disciplina"]["pre_requisitos"].forEach(pre_req => {
            ativarElemento(elementos, pre_req, true, false);
        })
    }
}

function criarElementosDisciplinas(grafo) {
    const elementos = {};

    Object.keys(grafo).forEach(id => {
        const disciplina = grafo[id];
        const elemento = criarElementoDisciplina(disciplina);

        elemento.onmouseenter = function(e) {
            if ("disciplina" in e.target) {
                desativarElementos(elementos);
                ativarElemento(elementos, e.target["disciplina"]["id"], true, true);
            }
        }

        elemento.onmouseleave = function(e) {
            if ("disciplina" in e.target)
                ativarElementos(elementos);
        }

        elementos[disciplina["id"]] = elemento;
    })

    return elementos;
}

function atualizarDisciplinas(ids) {
    const divGrafo = document.getElementById("grafo");

    const todasDisciplinas = divGrafo["todasDisciplinas"];
    const disciplinasAparentes = divGrafo["disciplinasAparentes"];

    ids.forEach(id => {
        if (disciplinasAparentes.includes(id))
            disciplinasAparentes.splice(disciplinasAparentes.indexOf(id), 1);
        else
            disciplinasAparentes.push(id);
    });

    const todasDisciplinasConsertadas = new Object(todasDisciplinas);
    const novas_aparentes = consertarPreRequisitos(todasDisciplinasConsertadas, disciplinasAparentes, disciplinasAparentes);
    const aparentes = {};

    disciplinasAparentes.forEach(id => aparentes[id] = todasDisciplinasConsertadas[id]);
    novas_aparentes.forEach(id => aparentes[id] = todasDisciplinasConsertadas[id]);

    const grafoConsequencias = inverterGrafo(aparentes);
    divGrafo["disciplinasAparentes"] = [];

    Object.keys(aparentes).forEach(id => {
        if (id in grafoConsequencias)
            aparentes[id]["consequencias"] = grafoConsequencias[id];
        else
            aparentes[id]["consequencias"] = [];

        divGrafo["disciplinasAparentes"].push(parseInt(id));
    });

    return aparentes;
}

function atualizarGrafo(ids, embaralhar) {
    const divGrafo = document.getElementById("grafo");
    const elementos = divGrafo["elementos"];

    const aparentes = atualizarDisciplinas(ids);

    divGrafo.innerHTML = "";

    const ordenado = ordenacaoTopologica(aparentes);

    if (embaralhar) {
        for (let i = 0; i < ordenado.length; ++i)
            ordenado[i].sort(() => Math.random() - 0.5);
    }

    ordenado.forEach(linha => {
        const divLinha = criarDivLinhaDisciplinas();
        linha.forEach(disciplina => {
            divLinha.appendChild(elementos[disciplina]);
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
    const itens = seletor.lastChild;

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

        itens.append(botao);

    });
    seletor.append(itens);

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

function criarSeletorEletivas(nome, disciplinas) {
    const classeOutline = "btn-outline-primary";
    const classeSelecionado = "btn-primary";

    return criarSeletor(nome, disciplinas, classeOutline, function(e) {
        const divGrafo = document.getElementById("grafo");
        const aparentes = divGrafo["disciplinasAparentes"];
        const botao = e.target;
        const disciplina = botao["disciplina"];

        if (aparentes.includes(disciplina["id"])) {
            botao.classList.remove(classeSelecionado);
            botao.classList.add(classeOutline);

            if (botao["proximo"])
                botao.parentElement.insertBefore(botao, botao["proximo"]);
            else
                $(botao.parentElement).append(botao);
        } else {
            botao.classList.remove(classeOutline);
            botao.classList.add(classeSelecionado);
            botao["proximo"] = botao.nextElementSibling;

            $(botao.parentElement).prepend(botao);
        }

        atualizarGrafo([disciplina["id"]], false);
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

function configurarSeletores(disciplinas) {
    const divGrafo = document.getElementById("grafo");

    const todasDisciplinas = divGrafo["todasDisciplinas"];
    const disciplinasAparentes = divGrafo["disciplinasAparentes"];

    const tiposDisciplinas = {};
    const disciplinasFeitas = [];

    disciplinasAparentes.forEach(id => {
        disciplinasFeitas.push(todasDisciplinas[id]);
    });

    Object.keys(disciplinas).forEach(id => {
        const disciplina = disciplinas[id];

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
        const seletor = criarSeletorEletivas(tipo, tiposDisciplinas[tipo]);
        seletores.append(seletor);
    })
}

function getDisciplinasAparentes(disciplinas) {
    const disciplinasAparentes = [];

    Object.keys(disciplinas).forEach(id => {
        const disciplina = disciplinas[id];

        if (disciplina["feita"] || disciplina["tipo_grupo"] == 0)
            disciplinasAparentes.push(disciplina["id"]);
    });

    return disciplinasAparentes;
}

$(document).ready(function() {
    const params = new URLSearchParams(window.location.search);

    const codigoUniversidade = params.get("uni");
    const codigoCurso = params.get("curso");

    $.get("/db/getDisciplinas", { uni: codigoUniversidade, curso: codigoCurso }, responseCurso => {
        $.get("/db/getTodasDisciplinas", responseTodas => {
            const disciplinasCurso = {};
            JSON.parse(responseCurso).forEach(disciplina => {
                const id = disciplina["id"];

                if (id in disciplinasCurso) {
                    if (disciplinasCurso[id]["tipo_grupo"] != 0)
                        disciplinasCurso[id] = disciplina;
                } else {
                    disciplina["feita"] = false;
                    disciplinasCurso[id] = disciplina;
                }
            });

            const todasDisciplinas = {};
            JSON.parse(responseTodas).forEach(disciplina => {
                disciplina["feita"] = false;
                disciplina["pre_requisitos"] = desmembrarPreRequisitos(disciplina["pre_requisitos"]);

                todasDisciplinas[disciplina["id"]] = disciplina;
            });

            const divGrafo = document.getElementById("grafo");
            const elementos = criarElementosDisciplinas(todasDisciplinas);

            divGrafo["todasDisciplinas"] = todasDisciplinas;
            divGrafo["disciplinasAparentes"] = [];
            divGrafo["elementos"] = elementos;

            const aparentes = getDisciplinasAparentes(disciplinasCurso);

            atualizarGrafo(aparentes, true);
            configurarSeletores(disciplinasCurso);
        });
    });
});
