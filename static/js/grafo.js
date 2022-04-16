$(document).ready(function() {
    const params = new URLSearchParams(window.location.search);

    const codigoUniversidade = params.get("codUni");
    const codigoCurso = params.get("codCurso");

    $.get("/db/getDisciplinas", {codUni: codigoUniversidade, codCurso: codigoCurso}, response => {
        console.log(response);
    })
});
