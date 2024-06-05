import mongoose, { Document, Schema, Model } from 'mongoose';
import { IQuestion, Question } from './question';

interface ITest extends Document {
  title: string;
  questions: mongoose.Types.ObjectId[]; // References to the Question model
}

interface TestModel extends Model<ITest> {
  createTestWithRandomQuestions(userId: mongoose.Types.ObjectId): Promise<ITest>;
}

const testSchema: Schema<ITest> = new Schema({
  title: {
    type: String,
    required: [true, "Test title is required"],
  },
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
    },
  ]
});

testSchema.statics.createTestWithRandomQuestions = async function (userId: mongoose.Types.ObjectId): Promise<ITest> {
  const questions = await Question.aggregate([{ $sample: { size: 20 } }]);
  const questionIds = questions.map((question: IQuestion) => question._id);

  const newTest = await this.create({
    title: `Test`,
    questions: questionIds,
    createdBy: userId,
  });

  return newTest;
};

const Test: TestModel = mongoose.model<ITest, TestModel>('Test', testSchema);

export { ITest, Test };
