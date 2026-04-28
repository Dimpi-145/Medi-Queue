const mongoose = require("mongoose");



async function connectToDatabase(){
    await mongoose.connect(process.env.MONGO_URL)

    console.log("connect to MongoDB")
}


module.exports = connectToDatabase