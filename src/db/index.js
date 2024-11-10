import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";



const connectDB= async ()=>{
    try {
        const connectionInsstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`MongoDB connected: ${connectionInsstance.connection.host}`);
    } catch (error) {
        console.log("mongoose db error", error);
        process.exit(1)
    }
}

export default connectDB