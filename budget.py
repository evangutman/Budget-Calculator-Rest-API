#-------------
#--Author:
#--Evan Gutman
#--------------
#--------------
#--Date Started:
#--2/9/2018
#--------------
#--------------
#--Date Last Modified:
#--2/15/2018
#--------------


from flask import Flask, render_template, jsonify
from flask_restful import reqparse, abort, Api, Resource
import json

app = Flask(__name__)
api = Api(app)


#Data structure used to keep track of budget
BUDGET = {
        "uncategorized":{
            "budget":1
        }

}


parser = reqparse.RequestParser()
parser.add_argument('newEntry')


@app.route("/")
def home_page():
        return render_template("homepage.html")


#The '/categories' route allows for the following requests:
#   get: Return all categories and the corresponding budget from the "BUDGET" data structure
#   post: Add a category and the specified budget to the "BUDGET" data structure
#   delete: Delete a category and add all purchases from every year-month to that year-month's "uncategorized" category
class categories(Resource):
    def get(self):
        all_cat = []
        for key in BUDGET.keys():
            all_cat.append({'category' : key, 'budget' : BUDGET[key]["budget"]})
        return jsonify({'categories' : all_cat})
    def post(self):
        args = parser.parse_args()
        temp_json = json.loads(args['newEntry'])
        category_name = temp_json['category']
        BUDGET[category_name] = {"budget": temp_json['budget']}
        return BUDGET, 201
    def delete(self):
        args = parser.parse_args()
        temp_json = json.loads(args['newEntry'])
        category_name = temp_json['category']
        deletedCategory = BUDGET.pop(category_name, None)
        deletedCategory.pop('budget', None)

        #need to iterate through dates and move the respective purchases to the "uncategorized" category for each date
        if len(deletedCategory.keys()) != 0:
            for key in deletedCategory:
                if key in BUDGET['uncategorized']:
                    for purchase in deletedCategory[key]:
                        BUDGET['uncategorized'][key].append(purchase)
                else:
                    BUDGET['uncategorized'].update({key: deletedCategory[key]})

        return BUDGET, 204


#The '/purchases/<year_month>' route allows for the following requests:
#   get: Return all purchases from every category for a specified 'year_month'
#   post: Add a purchase to a specified category within a 'year_month'
class purchases(Resource):
    def get(self, year_month):
        all_purchases = {}
        for key in BUDGET.keys():
            if year_month not in BUDGET[key]:
                continue;
            all_purchases[key] = BUDGET[key][year_month]
        return jsonify({'purchases' : all_purchases})

    def post(self, year_month):
        args = parser.parse_args()
        temp_json = json.loads(args['newEntry'])
        category_name = temp_json['category']
        specific_amount = temp_json['info'][1]['amount']
        if year_month in BUDGET[category_name]:
            new_purchase = {"purchaseTitle": temp_json['info'][0]['purchaseTitle'], "amount": float(specific_amount)}
            BUDGET[category_name][year_month].append(new_purchase)
        else:
            new_purchase = [{"purchaseTitle": temp_json['info'][0]['purchaseTitle'], "amount": float(specific_amount)}]
            BUDGET[category_name].update({year_month:new_purchase})
        return BUDGET, 201


api.add_resource(categories, '/categories')
api.add_resource(purchases, '/purchases/<year_month>')


if __name__ == '__main__':
    app.run(debug = True)
