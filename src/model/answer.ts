import mongoose, { Document, Schema, Model } from "mongoose";

interface IAnswer extends Document {
  text?: string;
  image?: string;
  isCorrect: boolean;
}

const answerSchema: Schema = new Schema({
  text: {
    type: String,
  },
  image: {
    type: String,
  },
  isCorrect: {
    type: Boolean,
    required: [true, "Answer correctness must be specified"],
  },
});

const Answer: Model<IAnswer> = mongoose.model<IAnswer>("Answer", answerSchema);

export { IAnswer, Answer };
