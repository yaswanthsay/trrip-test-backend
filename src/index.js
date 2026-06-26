const express = require("express")
const  User  = require("./models/User");
const   mongoose  = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const cors = require("cors");


const pdf = require("pdf-parse");


const app = express()

app.use(express.json());

app.use(cors());

app.get("/", (req, res) => {
  res.send("Backend is running successfully 🚀");
});

app.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      "MY_SECRET_KEY",
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({
      success: true,
      message: "Registered successfully",
      token,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
       process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// const auth = require("./middleware/auth");
const upload = require("./middleware/upload");
const Booking = require("./models/Booking");
const fs = require("fs");


app.post(
  "/upload-booking",
  upload.single("document"),
  async (req, res) => {

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

     try {
      const booking = await Booking.create({
        userId: req.body.userId,
        documentType: req.body.documentType,
        fileName: req.file.filename,
        filePath: req.file.path,
        fileUrl: req.file.path,
        mimeType: req.file.mimetype,
      });

      res.status(201).json({
        success: true,
        booking,
      });
    }catch (err) {
  console.error("UPLOAD ERROR:", err);

  res.status(500).json({
    success: false,
    message: err.message,
  });
}
  }
);



const extractPdfText = require("./services/pdfExtractor");

app.get("/booking/:bookingId/extract", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }


    const extractedText = await extractPdfText(
      booking.fileUrl
    );

    res.status(200).json({
      success: true,
      bookingId,
      extractedText,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

app.get("/bookings", async (req, res) => {
  const bookings = await Booking.find().sort({ createdAt: -1 });
  res.json(bookings);
});


const Itinerary = require("./models/Itinerary");
const generateItinerary = require("./services/gemini");

app.get("/itinerary-details/:id", async (req, res) => {

  const itinerary = await Itinerary.findById(req.params.id);

  if (!itinerary) {
    return res.status(404).json({
      success: false,
      message: "Itinerary not found",
    });
  }

  res.json({
    success: true,
    itinerary,
  });
});



app.get("/itineraries/:userId", async (req, res) => {
  try {
    const itineraries = await Itinerary.find({
      userId: req.params.userId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      itineraries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.get("/share/:shareId", async (req, res) => {
  const itinerary = await Itinerary.findOne({
    shareId: req.params.shareId,
  });

  if (!itinerary) {
    return res.status(404).json({
      success: false,
      message: "Itinerary not found",
    });
  }

  res.json({
    success: true,
    itinerary,
  });
});


app.get("/itinerary/:id/share-link", async (req, res) => {
  const itinerary = await Itinerary.findById(req.params.id);

  res.json({
    success: true,
    shareUrl: `http://localhost:5173/share/${itinerary.shareId}`,
  });
});

app.delete("/itinerary/:id", async (req, res) => {
  try {
    const itinerary = await Itinerary.findByIdAndDelete(
      req.params.id
    );

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Itinerary not found",
      });
    }

    res.json({
      success: true,
      message: "Itinerary deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

app.post("/itinerary/:bookingId", async (req, res) => {
  try {
    const booking = await Booking.findById(
      req.params.bookingId
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // 1. FIRST extract text
    const extractedText = await extractPdfText(
      booking.fileUrl
    );

    // 2. THEN send to Gemini
    const aiItinerary = await generateItinerary(
      extractedText
    );

    // 3. THEN validate
    if (
      aiItinerary.includes("INVALID TRAVEL DOCUMENT")
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Uploaded file is not a travel document",
      });
    }

    // 4. Save to DB
    const itinerary = await Itinerary.create({
      userId: booking.userId,
      bookingId: booking._id,
      extractedText,
      itinerary: aiItinerary,
    });

    res.json({
      success: true,
      itinerary,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


app.get("/itineraries/:userId", async (req, res) => {
  try {
    const itineraries = await Itinerary.find({
      userId: req.params.userId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      itineraries,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


app.get("/dashboard-stats/:userId", async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(
      req.params.userId
    );

    const totalBookings = await Booking.countDocuments({
      userId: userObjectId,
    });

    const totalItineraries = await Itinerary.countDocuments({
      userId: userObjectId,
    });


    res.json({
      success: true,
      stats: {
        totalBookings,
        totalItineraries,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

app.get("/recent-itineraries/:userId", async (req, res) => {
  try {
    const itineraries = await Itinerary.find({
      userId: req.params.userId,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      itineraries,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  
  }
});

app.get("/recent-bookings/:userId", async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.params.userId,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      bookings,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected");

    app.listen(PORT, () => {
      console.log("Server running on port 3000");
    });
  })
  .catch(console.error);