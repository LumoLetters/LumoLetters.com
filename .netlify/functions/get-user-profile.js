const mongoose = require('mongoose');
    
const uri = process.env.MONGODB_URI;
   
 const UserProfile = mongoose.model('UserProfile', new mongoose.Schema({
    userId: {type: String, unique: true, required: true},
    name: String,
     dob: String,
    email: String,
    address: String,
    city: String,
    state: String,
    zip: String,
      interests: [String],
    topics: [String],
    signature: String,
    date: String,
}, {timestamps: true}));

exports.handler = async (event, context) => {
    try {
       console.log("Attempting to Connect to Mongoose")
        await mongoose.connect(uri);
        console.log("Successfully Connected to Mongoose");
         const userId = context.clientContext.user.sub;

      const doc = await UserProfile.findOne({ userId });
        return {
            statusCode: 200,
           body: JSON.stringify({ message: "Successfully got user profile", data: doc }),
        };
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        return {
            statusCode: 500,
           body: JSON.stringify({ error: "Failed to connect to MongoDB", message: error.message }),
        };
   } finally {
       console.log("Disconnecting");
      await mongoose.disconnect();
    }
};