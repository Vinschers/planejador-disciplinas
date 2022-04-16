import os
import psycopg2
import psycopg2.extras
import json

from flask import Blueprint, request
from dotenv import load_dotenv

load_dotenv()

db_url = os.environ.get("DATABASE_URL", "")

if db_url:
    conn = psycopg2.connect(db_url, sslmode="require")
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    print("Connected to database")
else:
    print("Error connecting to database")

db_profile = Blueprint("db_profile", __name__, url_prefix="/db")


@db_profile.route("/getUniversidades")
def getUniversidades():
    cursor.execute("SELECT * FROM universidade;")
    universidades = cursor.fetchall()
    return json.dumps(universidades, ensure_ascii=False)


@db_profile.route("/getCursos")
def getCursos():
    codigoUniversidade = request.args.get("codigoUni", 0)
    if codigoUniversidade == 0:
        cursor.execute("SELECT * FROM curso;")
    else:
        cursor.execute(f"SELECT * FROM curso WHERE universidade_id = {codigoUniversidade};")
    cursos = cursor.fetchall()
    return json.dumps(cursos, ensure_ascii=False)


@db_profile.route("/getDisciplinas")
def getDisciplinas():
    codigoUniversidade = request.args.get("codUni", 0)
    codigoCurso = request.args.get("codCurso", 0)

    cursor.execute(
        f"SELECT d.*, cd.nome AS nome_grupo, cd.creditos AS creditos_grupo FROM disciplina d INNER JOIN curso c on d.universidade_id = c.universidade_id INNER JOIN curso_disciplinas cd on cd.curso_id = c.id WHERE c.codigo = '{codigoCurso}' AND c.universidade_id = {codigoUniversidade} AND d.codigo LIKE cd.sql_like AND CASE WHEN ARRAY_LENGTH(cd.sql_in, 1) > 0 THEN d.codigo = ANY(cd.sql_in) ELSE TRUE END;"
    )

    disciplinas = cursor.fetchall()
    return json.dumps(disciplinas, ensure_ascii=False)


@db_profile.route("/getDisciplina/<id>")
def getDisciplina(id):
    cursor.execute(f"SELECT * FROM disciplina where ID='{id}';")
    disciplina = cursor.fetchone()
    return json.dumps(disciplina, ensure_ascii=False)
