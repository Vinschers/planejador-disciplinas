import json

with open("data.json", "r") as json_file:
    data = json.load(json_file)


def inserir():

    insert_all_str = ""

    for _, disciplina in data.items():
        if not disciplina["id"].startswith("MC"):
            continue
        biblio_str = ""
        for bib in disciplina["bibliography"]:
            bib_str = bib.replace("'", "''").replace('"', "''")
            biblio_str += f'"{bib_str}",'
        biblio_str = biblio_str
        desc = disciplina["description"].replace("'", "''").replace('"', "''")
        insert_all_str += f"INSERT INTO DISCIPLINA(BIBLIOGRAFIA, CODIGO, CREDITOS, DESCRICAO, NOME, UNIVERSIDADE_ID) VALUES('{{{biblio_str[:-1]}}}', '{disciplina['id']}', {disciplina['credits']}, '{desc}', '{disciplina['name']}', 1);\n"

    with open("disciplinas.sql", "w") as disciplinas_file:
        disciplinas_file.write(insert_all_str)


def inserir_pre_reqs():
    pre_reqs_str = ""

    for _, disciplina in data.items():
        if not disciplina["id"].startswith("MC"):
            continue

        for i, possibilidade in enumerate(disciplina["pre_requisites"]):
            for codigo in possibilidade:
                if codigo in data:
                    pre_reqs_str += f"INSERT INTO pre_requisito(DISCIPLINA_ID, PRE_REQUISITO_ID, POSSIBILIDADE) VALUES((SELECT id FROM disciplina WHERE codigo = '{disciplina['id']}' AND universidade_id = 1), (SELECT id FROM disciplina WHERE codigo = '{codigo}' AND universidade_id = 1), {i});\n"

    with open("disciplinas.sql", "w") as disciplinas_file:
        disciplinas_file.write(pre_reqs_str)


# inserir()
inserir_pre_reqs()
