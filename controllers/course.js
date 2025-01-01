import { instance } from "../index.js";
import TryCatch from "../middlewares/TryCatch.js";
import  Courses  from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import  User  from "../models/User.js";
import Transaction from "../models/Transaction.js";


export const getAllCourses = TryCatch(async (req, res) => {
  const courses = await Courses.find();
  res.json({
    courses,
  });
});

export const getSingleCourse = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);

  res.json({
    course,
  });
});

export const fetchLectures = TryCatch(async (req, res) => {
  const lectures = await Lecture.find({ course: req.params.id });

  const user = await User.findById(req.user._id);

  if (user.role === "admin") {
    return res.json({ lectures });
  }

  if (!user.subscription.includes(req.params.id))
    return res.status(400).json({
      message: "You have not subscribed to this course",
    });

  res.json({ lectures });
});

export const fetchLecture = TryCatch(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);

  const user = await User.findById(req.user._id);

  if (user.role === "admin") {
    return res.json({ lecture });
  }

  if (!user.subscription.includes(lecture.course))
    return res.status(400).json({
      message: "You have not subscribed to this course",
    });

  res.json({ lecture });
});



export const getMyCourses = TryCatch(async (req, res) => {
  const userId = req.user._id; // Assuming the user is authenticated and their ID is available in req.user

  // Find the user by ID
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      message: "User not found.",
    });
  }

  // Fetch the courses using the purchasedCourses IDs
  const courses = await Courses.find({ courseId: { $in: user.purchasedCourses } });

  return res.status(200).json({
    message: "Fetched purchased courses successfully.",
    purchasedCourses: courses,
  });
});



//test
export const getCourseDetails = TryCatch(async (req, res) => {
  const course = await Courses.findOne({ courseId: req.params.id });

  if (!course) {
    return res.status(404).json({ message: "Course not found." });
  }

  return res.status(200).json(course);
});



export const checkout = TryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);

  const course = await Courses.findById(req.params.id);

  if (user.subscription.includes(course._id)) {
    return res.status(400).json({
      message: "You already have this course",
    });
  }

  const options = {
    amount: Number(course.price * 100),
    currency: "INR",
  };

  const order = await instance.orders.create(options);

  res.status(201).json({
    order,
    course,
  });
});





// controllers/coursesController.js
export const verifyPayment = TryCatch(async (req, res) => {
  const { courseId, name, email, transactionId, referralId } = req.body;

  // Validate required fields
  if (!name || !email || !transactionId || !courseId) {
    return res.status(400).json({
      message: "Please fill in all required fields.",
    });
  }

  // Fetch the user and course details
  const user = await User.findById(req.user._id);
  const course = await Courses.findOne({ courseId });

  if (!user) {
    return res.status(404).json({
      message: "User not found.",
    });
  }

  if (!course) {
    return res.status(404).json({
      message: "Course not found.",
    });
  }

  let transactionStatus = "Failure"; // Default to failure
  try {
    // Add the course to the user's purchasedCourses array
    if (!user.purchasedCourses.includes(courseId)) {
      user.purchasedCourses.push(courseId);

      // If referralId is present, update the earnings of the referred user
      if (referralId) {
        const referrer = await User.findOne({ referralLink: referralId });
        if (referrer) {
          referrer.earnings += course.price * 0.7; // Add 70% of course price
          await referrer.save();
          user.referrer = referrer;

          // Find and update grandReferrer if referrer has a referrer
          if (referrer.referrer) {
            const grandReferrer = await User.findById(referrer.referrer);
            if (grandReferrer) {
              grandReferrer.earnings += course.price * 0.1; // Add 10% of course price
              await grandReferrer.save();
            }
          }
        }
      }

      await user.save();

      transactionStatus = "Success"; // Update status to success

      res.status(200).json({
        message: "Course purchased successfully!",
      });
    } else {
      res.status(400).json({
        message: "You already own this course.",
      });
    }
  } catch (error) {
    console.error("Transaction failed:", error.message);
  }

  // Log the transaction
  await Transaction.create({
    user: user._id,
    userName: user.name,
    contact: user.contact,
    courseId,
    courseName: course.name,
    paymentId: transactionId,
    status: transactionStatus,
    timestamp: new Date(),
  });
});
















// export const paymentVerification = TryCatch(async (req, res) => {
//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
//     req.body;

//   const body = razorpay_order_id + "|" + razorpay_payment_id;

//   const expectedSignature = crypto
//     .createHmac("sha256", process.env.Razorpay_Secret)
//     .update(body)
//     .digest("hex");

//   const isAuthentic = expectedSignature === razorpay_signature;

//   if (isAuthentic) {
//     await Payment.create({
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//     });

//     const user = await User.findById(req.user._id);

//     const course = await Courses.findById(req.params.id);

//     user.subscription.push(course._id);

//     await Progress.create({
//       course: course._id,
//       completedLectures: [],
//       user: req.user._id,
//     });

//     await user.save();

//     res.status(200).json({
//       message: "Course Purchased Successfully",
//     });
//   } else {
//     return res.status(400).json({
//       message: "Payment Failed",
//     });
//   }
// });

// export const addProgress = TryCatch(async (req, res) => {
//   const progress = await Progress.findOne({
//     user: req.user._id,
//     course: req.query.course,
//   });

//   const { lectureId } = req.query;

//   if (progress.completedLectures.includes(lectureId)) {
//     return res.json({
//       message: "Progress recorded",
//     });
//   }

//   progress.completedLectures.push(lectureId);

//   await progress.save();

//   res.status(201).json({
//     message: "new Progress added",
//   });
// });

// export const getYourProgress = TryCatch(async (req, res) => {
//   const progress = await Progress.find({
//     user: req.user._id,
//     course: req.query.course,
//   });

//   if (!progress) return res.status(404).json({ message: "null" });

//   const allLectures = (await Lecture.find({ course: req.query.course })).length;

//   const completedLectures = progress[0].completedLectures.length;

//   const courseProgressPercentage = (completedLectures * 100) / allLectures;

//   res.json({
//     courseProgressPercentage,
//     completedLectures,
//     allLectures,
//     progress,
//   });
// });
