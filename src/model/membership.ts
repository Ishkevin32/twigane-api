import mongoose, { Document, Schema, Model } from "mongoose";

interface IMembership extends Document {
  title: string;
  description: string;
  user: string;
  plan: string; 
  price: number;
}


const membershipSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, "Please provide a title for the membership"],
  },
  description: {
    type: String,
    required: [true, "Please provide a description for the membership"],
  },
  price: {
    type: Number,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Please provide the ID of the user"],
  },
  plan: {
    type: String,
    enum: ["month", "year"],
    required: [true, "Please provide the plan of your choice"],
  }
});

const Membership: Model<IMembership> = mongoose.model<IMembership>(
  "Membership",
  membershipSchema
);

export { IMembership, Membership };
