  const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const MongoStore = require('connect-mongo');
require('dotenv').config();

const app = express();
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Express 서버에서 CORS 설정
const cors = require('cors');
app.use(cors());


// Mongoose MongoDB 연결
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('DB연결성공'))
  .catch((err) => console.log(err));

// User 스키마 및 모델 정의
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL,
    dbName: 'forum'
  })
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username: username });
    if (!user) {
      return done(null, false, { message: '아이디 DB에 없음' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return done(null, false, { message: '비번불일치' });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

app.post('/join', async (req, res) => {
  try {
    const hashpwd = await bcrypt.hash(req.body.password, 10);

    await new User({
      username: req.body.username,
      password: hashpwd
    }).save();

    res.redirect('/login');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating the user');
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});