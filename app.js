//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
var _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-vinay:Test123@cluster0.rblom4s.mongodb.net/todolistDB");
let readItems = [];
const itemsSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please check your data  entry, no name specified!"],
  },
});

const Item = mongoose.model("Item", itemsSchema);

let initialItems = [
  {
    name: "Eat Food",
  },
  { name: "Sleep" },
  { name: "Code" },
];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

// Item.insertMany(items)
//   .then(function () {
//     console.log("Items successfully added to DB");
//   })
//   .catch(function (err) {
//     console.log(err);
//   });

async function findAll() {
  const data = () => {
    return Item.find({});
  };

  // using it in another function
  readItems = await data();
}
async function insertItems(notes) {
  await Item.insertMany(notes)
    .then((result) => {
      console.log("Items added succesfully");
    })
    .catch((err) => {
      console.log(err);
    });
}
app.get("/", async function (req, res) {
  await findAll();
  if (readItems.length === 0) {
    await insertItems(initialItems);
    res.redirect("/");
  } else {
    res.render("list", { listTitle: "Today", newListItems: readItems });
  }
});

app.post("/", async function (req, res) {
  let newItem = { name: req.body.newItem };
  let listName = req.body.list;
  if (listName === "Today") {
    await insertItems(newItem);
    res.redirect("/");
  } else {
    const foundList = await List.findOne({ name: listName }).exec();
    console.log(foundList.items);
    foundList.items.push(newItem);
    await foundList.save();
    res.redirect("/" + listName);
  }
});

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  console.log(listName);
  if (listName === "Today") {
    await Item.deleteOne({ _id: checkedItemId });
    res.redirect("/");
  } else {
    await List.findOneAndUpdate(
      { name: listName },
      {
        $pull: { items: { _id: checkedItemId } },
      }
    );
    res.redirect("/" + listName);
  }
});

app.get("/:customListName", async (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  const foundList = await List.findOne({ name: customListName }).exec();
  if (foundList != null) {
    await findAll();
    res.render("list", {
      listTitle: foundList.name,
      newListItems: foundList.items,
    });
  } else {
    const list = new List({
      name: customListName,
      items: initialItems,
    });
    list.save();
    res.redirect("/" + customListName);
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});
let port = process.env.PORT;
if(port == null || ""){
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started on port 3000");
});
