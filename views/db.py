import os
import psycopg2
import json
from flask import Blueprint

db_url = os.environ.get("DATABASE_URL", "")

if db_url:
    conn = psycopg2.connect(db_url, sslmode="require")
    cursor = conn.cursor()
    print("Connected to database")
else:
    print("Error connecting to database")

db_profile = Blueprint("db_profile", __name__, url_prefix="/db")


@db_profile.route("/getUniversidades")
def getUniversidades():
    cursor.execute("SELECT * FROM universidade;")
    universidades = cursor.fetchall()
    return json.dumps(universidades, ensure_ascii=False)


@db_profile.route("/getDisciplina/<id>")
def getDisciplina(id):
    cursor.execute(f"SELECT * FROM disciplina where ID='{id}';")
    disciplina = cursor.fetchone()
    return json.dumps(disciplina, ensure_ascii=False)
