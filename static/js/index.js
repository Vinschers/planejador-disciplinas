function popularSelectUniversidades() {
    $.get("/db/getUniversidades", response => {

        const universidades = JSON.parse(response);

        universidades.forEach(universidade => {
            $("#selectUniversidades").append(
                `<option value='${universidade["id"]}'>${universidade["nome"]}</option>`
            );
        });
        $("#selectUniversidades").change(function() {
            const codigoUni = $(this).children("option:selected").val();

            if (!isNaN(codigoUni))
                selectUniversidadesOnChange(codigoUni);
        });
    })
}

function selectUniversidadesOnChange(codigoUniversidade) {
    $.get("/db/getCursos?codigoUni=" + codigoUniversidade, response => {
        const cursos = JSON.parse(response);
        if (cursos.length > 0) {
            $("#selectCursosWrapper").css("display", "");
        } else {
            $("#selectCursosWrapper").css("display", "none");
        }

        cursos.forEach(curso => {
            $("#selectCursos").append(`<option value='${curso["codigo"]}'>${curso["codigo"]} - ${curso["nome"]}</option>`)
        });

        $("#selectCursos").change(function() {
            const codigoCurso = $(this).children("option:selected").val();

            if (!isNaN(codigoCurso))
                selectCursosOnChange(codigoUniversidade, codigoCurso);
        });
    });
}

function selectCursosOnChange(codigoUniversidade, codigoCurso) {
    $("#submitForm").css("display", "");

    $("#inputUniversidade").val(codigoUniversidade)
    $("#inputCurso").val(codigoCurso)
}

$(document).ready(function() {
    popularSelectUniversidades();
});
