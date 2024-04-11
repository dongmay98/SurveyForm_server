const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const passport = require("passport");

router.post("/join", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send("Username already exists.");
    }
    const hashpwd = await bcrypt.hash(password, 10);
    await new User({
      username,
      email,
      password: hashpwd,
    }).save();
    res.send("회원가입완료");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating the user");
  }
});

router.post("/login", function (req, res, next) {
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      console.log(info);
      return res.status(401).json({ message: "로그인 실패" });
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      console.log(req.user);
      return res.json({ message: "로그인 성공" });
    });
  })(req, res, next);
});

module.exports = router;
