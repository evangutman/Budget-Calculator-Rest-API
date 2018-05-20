# Budget-Calculator-Rest-API

Add the `FLASK_APP` variable to your path. (e.g. `export FLASK_APP=budget.py`).

## Running the App

Once installed, the application can be started with `flask run`.


## Summary

This program is a budget calculator served through a RESTful API. "budget.py" serves as the API for the custom 
budget calculator. Implemented with Python’s Flask micro web framework, users are able to break down their 
monthly budget into categories as well as keep track of purchases within those categories. Users can make 
requests to get all categories with the budgets of those categories, add new categories along with a 
specified budget, and delete categories. If a category is deleted, the purchases under that category 
are moved to the “uncategorized” category for that year-month. Users can also make requests to get all 
purchases within a specified year-month, and add purchases to a specified category within a year-month.
