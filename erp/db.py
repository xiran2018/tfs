from flask import Flask, url_for, request, redirect, render_template
from flask_sqlalchemy import SQLAlchemy
app = Flask(__name__,template_folder="templates",static_folder="static")
app.config.from_object('config')
db = SQLAlchemy(app)
# 这里引入蓝图的配置
# from app import models,views
