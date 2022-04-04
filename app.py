import os
import psycopg2
from flask import Flask, render_template


app = Flask(__name__)
conn = psycopg2.connect(os.environ.get("DATABASE_URL"), sslmode="require")


@app.route("/")
def index():
    return render_template("index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", threaded=True, port=port)
