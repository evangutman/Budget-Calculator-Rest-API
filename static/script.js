

function setup(){
  document.getElementById("catButton").addEventListener("click", addCat, true);
  document.getElementById("purButton").addEventListener("click", addPurch, true);

  var date = new Date();
  var month = date.getUTCMonth() + 1;
  var year = date.getUTCFullYear();
  var dop = year + "-" + month;

  var dropDown = document.getElementById("dateDrop");
  var option = document.createElement("option");
  option.text = dop;
  dropDown.add(option);


  pollerCat();
}

function makeReq(method, target, retCode, action, newEntry) {
	var httpRequest = new XMLHttpRequest();

	httpRequest.onreadystatechange = makeHandler(httpRequest, retCode, action);
	httpRequest.open(method, target);

	if (newEntry){
		httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    httpRequest.send(newEntry);
	}
	else {
		httpRequest.send();
	}
}


function makeHandler(httpRequest, retCode, action) {
	function handler() {
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			if (httpRequest.status === retCode) {
				console.log("recieved response text:  " + httpRequest.responseText);
				action(httpRequest.responseText);
			} else {
				alert("There was a problem with the request.  you'll need to refresh the page!");
			}
		}
	}
	return handler;
}


function addCat() {
	var newCat = document.getElementById("newCat").value
  var newBudget = document.getElementById("newBudget").value
	var newEntry;
  newEntry = "newEntry=" + JSON.stringify({"category": newCat, "budget": newBudget});
	makeReq("POST", "/categories", 201, pollerCat, newEntry);
}


function addPurch() {
  var dropDown = document.getElementById("catDrop");
  var selCat = dropDown.options[dropDown.selectedIndex].text;

  var whatBought = document.getElementById("whatBought").value
  var amountSpent = document.getElementById("amountSpent").value
  var tempDOP = document.getElementById("dop").value
  var dateObject = new Date(tempDOP);

  var month = dateObject.getUTCMonth() + 1;
  var year = dateObject.getUTCFullYear();
  var dop = year + "-" + month;

  //Add new DOP if not in dropdown already
  var flag_dropdown = 0;
  for (i = 0; i < document.getElementById("dateDrop").length; ++i) {
    if (document.getElementById("dateDrop").options[i].value == dop){
      flag_dropdown = 1;
    }
  }

  if (!flag_dropdown) {
    var dropDown = document.getElementById("dateDrop");
    var option = document.createElement("option");
    option.text = dop;
    dropDown.add(option);
  }

  var newEntry;
  newEntry = "newEntry=" + JSON.stringify({"category": selCat, "info":[{"purchaseTitle": whatBought}, {"amount": amountSpent}]});
  makeReq("POST", "/purchases/" + dop, 201, pollerCat, newEntry);

}


function pollerCat() {
	makeReq("GET", "/categories", 200, repopCategories);
}

function pollerPurch() {
  var dropDown = document.getElementById("dateDrop");
  var selectedDate = dropDown.options[dropDown.selectedIndex].text;
  makeReq("GET", "/purchases/" + selectedDate, 200, repopPurchases);
}


function deleteCat(categoryID) {
  var newEntry;
  newEntry = "newEntry=" + JSON.stringify({"category": categoryID});
  makeReq("DELETE", "/categories", 204, pollerCat, newEntry);
}


// helper function for repop:
function addCell(row, text) {
	var newCell = row.insertCell();
	var newText = document.createTextNode(text);
	newCell.appendChild(newText);
}

function repopCategories(responseText) {
	console.log("repopulating categories!");
	var categories = JSON.parse(responseText);
  console.log(categories);

  //delete all categories in dropdown menu for selectig category
  var catDrop = document.getElementById("catDrop");
  while (catDrop.length > 0) {
		catDrop.remove(0);
	}

  //populate category drop down for selecting category when adding purchase
  for(var i = 0; i < categories['categories'].length; i++){
    var dropDown = document.getElementById("catDrop");
    var option = document.createElement("option");
    option.text = categories['categories'][i]['category'];
    dropDown.add(option);
  }


	var tab = document.getElementById("theTable");
	while (tab.rows.length > 0) {
		tab.deleteRow(0);
	}

  for(var i = 0; i < categories['categories'].length; i++){
    var newRow = tab.insertRow();
    categoryID = categories['categories'][i]['category'];
    newRow.id = categoryID;
    if (categories['categories'][i]['category'] == "uncategorized"){
      addCell(newRow, "");
    } else {
      addCell(newRow, categories['categories'][i]['budget']);

      //add delete button
      var newCell = newRow.insertCell();
  		var newButton = document.createElement("input");
  		newButton.type = "button";
  		newButton.value = "Delete " + categoryID;
  		(function(_catID){ newButton.addEventListener("click", function() { deleteCat(_catID); }); })(categoryID);
  		newCell.appendChild(newButton);
    }

  }
  pollerPurch();
}

function repopPurchases(responseText) {
  console.log("repopulating purchases!");
	var purchases = JSON.parse(responseText);
  console.log(purchases);
  var theTable = document.getElementById("theTable");
  const reducer = (accumulator, currentValue) => accumulator + currentValue;
  for (var i = 0, row; row = theTable.rows[i]; i++) {
    var tempID = row.id;

    if(tempID in purchases['purchases']) {
      var all_purch_arr = purchases['purchases'][tempID].map(x => x['amount']);
      var total_purch = all_purch_arr.reduce(reducer);

      var rounded_purch = Math.round(100*total_purch)/100;
      var target_td = row.cells[0];
      var target_budget = target_td.innerHTML;

      //check if summing up uncategorized all_purchases
      if (tempID == "uncategorized") {
        target_td.innerHTML = "You have spent a total of $" + rounded_purch + " on uncategorized purchases";
        continue;
      }

      var total_budget = parseInt(target_budget);
      var budget_leftover = total_budget - rounded_purch;

      if (budget_leftover > -1) {
        target_td.innerHTML = "You have $" + budget_leftover + "/" + "$" + total_budget + " left for " + tempID;
      }else{
        target_td.innerHTML = "You are $" + Math.abs(budget_leftover) + " over your " + tempID + " budget of $" + total_budget;
      }

    } else{  //execute if have not made any purchases under that category

      var target_td = row.cells[0];
      if (tempID == "uncategorized") {
        target_td.innerHTML = "You have made no uncategorized purchases"
      } else {
        var target_budget = target_td.innerHTML;
        target_td.innerHTML = "You have $" + target_budget + "/" + "$" + target_budget + " left for " + tempID;
      }

    }

  }
}



window.addEventListener("load", setup, true);
