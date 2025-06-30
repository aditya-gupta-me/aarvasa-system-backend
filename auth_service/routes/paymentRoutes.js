const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
router.post("/create-order", async (req, res) => {
    const { amount } = req.body;


    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_SECRET
    });


    const options = {
        amount: amount * 100, // amount in paise
        currency: "INR",
        receipt: "order_rcptid_11"
    };

    try {
        const order = await razorpay.orders.create(options);
        res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
    } catch (err) {
        res.status(500).send("Error creating order");
    }
});


module.exports = router;