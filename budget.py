from flask import Flask, render_template, jsonify
from flask_restful import reqparse, abort, Api, Resource
import json

app = Flask(__name__)
api = Api(app)


BUDGET = {
        "uncategorized":{
            "budget":1
        }

}


##abort message?

parser = reqparse.RequestParser()
parser.add_argument('newEntry')



@app.route("/")
def home_page():
        return render_template("homepage.html")

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

        #need to iterate through dates and set uncategorized for each date
        if len(deletedCategory.keys()) != 0:
            for key in deletedCategory:
                if key in BUDGET['uncategorized']:
                    for purchase in deletedCategory[key]:
                        BUDGET['uncategorized'][key].append(purchase)
                else:
                    BUDGET['uncategorized'].update({key: deletedCategory[key]})

        return BUDGET, 204

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
