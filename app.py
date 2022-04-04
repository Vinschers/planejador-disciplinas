import os
from dotenv import load_dotenv
from flask import Flask, render_template

load_dotenv()

from views import index_profile, db_profile, cursor, conn


app = Flask(__name__)
app.register_blueprint(db_profile)
app.register_blueprint(index_profile)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", threaded=True, port=port)

    if cursor:
        cursor.close()
        conn.close()
        print("Connection to database closed")
