exports.markUser = async (req, res) => {
    const { email, payment_id, subscription_type,  subscription_date } = req.body;
    const update = await User.updateOne(
        { email: email },
        {
            $set: {
                payment_id : payment_id,
                status: true,
                is_subscribed : true,
                subscription_type: subscription_type,
                subscription_date: new Date()
            }
        }
    )
    if (update.modifiedCount === 0) {
            return res.status(404).json({ status: false, msg: "User not found or already updated" });
    }
    res.json({status : true, msg : "User subscribed"});
}