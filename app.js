const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const day = date.getDate();
const _ = require("lodash");
require('dotenv').config();


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
// mongoose.connect(uri, {
//   useUnifiedTopology: true,
//   useNewUrlParser: true
// });
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
});


const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = new mongoose.model("List", listSchema);


app.get("/", function(req, res) {


  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Items added successfully!");
        }
      })
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: day,
        newListItems: foundItems
      });
    }

  });
});

app.get("/:customListName", function(req, res) {
      const customListName = _.capitalize(req.params.customListName);
      List.findOne({name: customListName }, function(err, foundList) {
          if (!err) {
            if (!foundList) {
            //create a new list
            const list = new List({
              name: customListName,
              items: defaultItems
            });
            list.save();
            res.redirect("/" + customListName);
            } else {
            //show an existing list
            res.render("list", {listTitle: foundList.name , newListItems: foundList.items});
            }
          }
        });

      });



    app.post("/", function(req, res) {

      const itemName = req.body.newItem;
      const listName = req.body.list;

      const item = new Item({
        name: itemName
      });

      if(listName === day){
        item.save();
        res.redirect("/");
      }
      else {
        List.findOne({name: listName},function(err, foundList){
          foundList.items.push(item);
          foundList.save();
          res.redirect("/" + listName);
        });
      }

    });

    app.post("/delete", function(req, res) {
      const checkedItemId = req.body.checkbox;
      const listName = req.body.listName;

      if(listName === day){
        Item.findByIdAndRemove({_id: checkedItemId}, function(err) {
          if (!err) {
            console.log("Item deleted successfully from db.");
            res.redirect("/");
          }
        });
      }else {
        List.findOneAndUpdate({name: listName}, {$pull:  {items: {_id: checkedItemId}}}, function(err, foundList){
                 if(!err){
                   res.redirect("/" + listName);
                 }
        });
      }


    });


    // app.get("/work", function(req,res){
    //   res.render("list", {listTitle: "Work List", newListItems: workItems});
    // });

    app.get("/about", function(req, res) {
      res.render("about");
    });

    app.listen(process.env.PORT || 3000, function() {
      console.log("Server started on port 3000");
    });
