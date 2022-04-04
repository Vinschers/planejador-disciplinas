function getUniversidades() {
    return ["Unicamp"];
}

function getCursos(universidade) {
    switch (universidade) {
        case "unicamp":
            return [];

        default:
            return [];
 }
}

function popularSelectUniversidades() {
    const universidades = getUniversidades();

    universidades.forEach((universidade) => {
        $("#selectUniversidades").append(
            `<option value='${universidade.toLowerCase()}'>${universidade}</option>`
        );
    });

    $("#selectUniversidades").change(function(){
        selectUniversidadesOnChange($(this).children("option:selected").val());
    });
}

function selectUniversidadesOnChange(universidade) {
    //
}

$(document).ready(function(){
    popularSelectUniversidades();
});
