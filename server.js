const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const cors = require("cors");
const ejs = require("ejs");
require("dotenv").config();

const app = express();
app.set("view engine", "ejs");
app.use(express.json());

// CORS 설정
const corsOptions = {
  origin: [
    "https://dongmay98.github.io",
    "https://dongmay98.github.io/GoogleForm_client-TS",
    "https://port-0-googleform-server-85phb42bluv1sf6v.sel5.cloudtype.app",
  ],
  methods: ["GET", "POST"],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.send("hello");
});

// 데이터베이스 연결
require("./config/database");

// 세션 및 Passport 설정
require("./config/passport")(app);
app.use(passport.initialize());
app.use(passport.session());

// 라우터 연결
const authRoutes = require("./routes/authRoutes");
const surveyRoutes = require("./routes/surveyRoutes");
app.use("/", authRoutes);
app.use("/", surveyRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});
