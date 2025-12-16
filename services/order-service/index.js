require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Order = require("./models/Order");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Order DB Connected"))
  .catch((err) => console.log("DB Error:", err));


// ----------- CREATE ORDER -----------
app.post("/orders", async (req, res) => {
  const { userId, restaurantId, items } = req.body;

  // calculate price
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = new Order({
    userId,
    restaurantId,
    items,
    totalPrice
  });

  await order.save();
  res.json({ message: "Order created", order });
});



// ----------- GET ORDER BY ID -----------
app.get("/orders/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  res.json(order);
});


// ----------- GET USER ORDER HISTORY -----------
app.get("/users/:userId/orders", async (req, res) => {
  const orders = await Order.find({ userId: req.params.userId });
  res.json(orders);
});


// ----------- UPDATE ORDER STATUS -----------
app.put("/orders/:id/status", async (req, res) => {
  const { status } = req.body;

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  res.json({ message: "Status updated", order });
});


app.listen(process.env.PORT, () =>
  console.log(`Order Service running on port ${process.env.PORT}`)
);
