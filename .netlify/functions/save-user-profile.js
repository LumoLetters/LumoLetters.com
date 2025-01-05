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
      console.log("Attempting to connect to Mongoose")
        await mongoose.connect(uri);
       console.log("Successfully Connected to Mongoose")
       const userData = JSON.parse(event.body);
     const userId = context.clientContext.user.sub;

     console.log("User Data:",userData)
     console.log("userId", userId)

      const result = await UserProfile.findOneAndUpdate({ userId }, { ...userData, userId }, { upsert: true, new: true });
     console.log("Data was saved", result);

      return {
          statusCode: 200,
         body: JSON.stringify({ message: "User profile saved successfully", data: result }),
        };
    } catch (error) {
         console.error("Error connecting to MongoDB:", error);
      return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to save to MongoDB", message: error.message }),
        };
    } finally {
       console.log("Disconnecting");
    await mongoose.disconnect();
   }
};