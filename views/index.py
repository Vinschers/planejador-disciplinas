from flask import Blueprint, render_template


index_profile = Blueprint("index_profile", __name__, url_prefix="/")


@index_profile.route("/")
def index():
    return render_template("index.html")


@index_profile.route("/grafo")
def grafo():
    return render_template("grafo.html")
