import mongoose, { Document, Schema, Model } from 'mongoose';

interface IQuestion extends Document {
  text: string;
  image?: string;
  answers: mongoose.Types.ObjectId[]; // References to the Answer model
  createdBy: mongoose.Types.ObjectId; // Reference to the User model (admin)
}

const questionSchema: Schema = new Schema({
  text: {
    type: String,
    required: [true, "Question text is required"],
  },
  image: {
    type: String,
  },
  answers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Answer',
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "Question creator is required"],
  },
});

const Question: Model<IQuestion> = mongoose.model<IQuestion>('Question', questionSchema);

export { IQuestion, Question };
