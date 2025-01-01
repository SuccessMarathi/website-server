import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema({
  courseId: {
    type: Number,
    unique: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

export default mongoose.model('Course', CourseSchema);
