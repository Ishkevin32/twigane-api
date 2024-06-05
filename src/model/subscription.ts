// models/subscription.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

interface ISubscription extends Document {
  title: string;
  description: string;
  user: mongoose.Schema.Types.ObjectId;
  plan: string;
  price: number;
  startDate: Date;
  endDate: Date;
}

const subscriptionSchema: Schema<ISubscription> = new Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for the subscription'],
  },
  description: {
    type: String,
    required: [true, 'Please provide a description for the subscription'],
  },
  price: {
    type: Number,
    required: [true, 'Please provide the price for the subscription'],
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide the ID of the user'],
  },
  plan: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: [true, 'Please provide the plan of your choice'],
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide the end date for the subscription'],
  },
});

const Subscription: Model<ISubscription> = mongoose.model<ISubscription>('Subscription', subscriptionSchema);

export { ISubscription, Subscription };
