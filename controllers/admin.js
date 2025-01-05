import TryCatch from "../middlewares/TryCatch.js";
import  Courses  from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import { rm } from "fs";
import { promisify } from "util";
import fs from "fs";
import  User  from "../models/User.js";

export const createCourse = TryCatch(async (req, res) => {
  const { courseId, name, price } = req.body;

  // Validate required fields
  if (!courseId || !name || !price) {
    return res.status(400).json({
      message: "Please provide all required fields: courseId, name, and price.",
    });
  }

  // Check if course with given courseId already exists
  const existingCourse = await Courses.findOne({ courseId });

  if (existingCourse) {
    return res.status(400).json({
      message: "Course with this ID already exists.",
    });
  }

  // Create a new course
  const course = await Courses.create({ courseId, name, price });

  res.status(201).json({
    message: "Course created successfully!",
    course
  });
});
export const addLectures = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);

  if (!course)
    return res.status(404).json({
      message: "No Course with this id",
    });

  const { title, description } = req.body;

  const file = req.file;

  const lecture = await Lecture.create({
    title,
    description,
    video: file?.path,
    course: course._id,
  });

  res.status(201).json({
    message: "Lecture Added",
    lecture,
  });
});

export const deleteLecture = TryCatch(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);

  rm(lecture.video, () => {
    console.log("Video deleted");
  });

  await lecture.deleteOne();

  res.json({ message: "Lecture Deleted" });
});

const unlinkAsync = promisify(fs.unlink);

export const deleteCourse = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);

  const lectures = await Lecture.find({ course: course._id });

  await Promise.all(
    lectures.map(async (lecture) => {
      await unlinkAsync(lecture.video);
      console.log("video deleted");
    })
  );

  rm(course.image, () => {
    console.log("image deleted");
  });

  await Lecture.find({ course: req.params.id }).deleteMany();

  await course.deleteOne();

  await User.updateMany({}, { $pull: { subscription: req.params.id } });

  res.json({
    message: "Course Deleted",
  });
});

export const getAllStats = TryCatch(async (req, res) => {
  const totalCoures = (await Courses.find()).length;
  const totalLectures = (await Lecture.find()).length;
  const totalUsers = (await User.find()).length;

  const stats = {
    totalCoures,
    totalLectures,
    totalUsers,
  };

  res.json({
    stats,
  });
});

export const getAllUser = TryCatch(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } }).select(
    "-password"
  );

  res.json({ users });
});

export const updateRole = TryCatch(async (req, res) => {
  if (req.user.mainrole !== "superadmin")
    return res.status(403).json({
      message: "This endpoint is assign to superadmin",
    });
  const user = await User.findById(req.params.id);

  if (user.role === "user") {
    user.role = "admin";
    await user.save();

    return res.status(200).json({
      message: "Role updated to admin",
    });
  }

  if (user.role === "admin") {
    user.role = "user";
    await user.save();

    return res.status(200).json({
      message: "Role updated",
    });
  }
});




export const getAllUsers = async (req, res) => {
  try {
    // Fetch all users, selecting only the required fields
    const users = await User.find({}, "name contact earnings.total").sort({ name: 1 }); // Select earnings.total only

    // Add numbering and map fields for the response
    const numberedUsers = users.map((user, index) => ({
      number: index + 1,
      name: user.name,
      contact: user.contact,
      earnings: user.earnings.total, // Use earnings.total
    }));

    res.status(200).json({
      success: true,
      users: numberedUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
    });
  }
};
