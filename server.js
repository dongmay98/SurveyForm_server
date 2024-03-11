require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const MongoStore = require('connect-mongo');
const app = express();
app.use(express.json());
// Express 서버에서 CORS 설정
const cors = require('cors');
app.use(cors());


// Mongoose MongoDB 연결
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('DB연결성공'))
  .catch((err) => console.log(err));

// User 스키마 및 모델 정의
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
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
    dbName: 'googleform'
  })
}));

app.use(passport.initialize());
app.use(passport.session());

// passport done()에 user정보 담아 반환
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

// 사용자 인증 성공 시 사용자 ID를 세션에 저장
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// 세션에 저장된 사용자 ID를 바탕으로 사용자 정보 조회
passport.deserializeUser((id, done) => {
  User.findById(id)
    .then(user => done(null, user))
    .catch(error => done(error, null));
});

app.post('/join', async (req, res) => {
  try {
    // req.body로부터 username, email, password 추출
    const { username, email, password } = req.body;
    // username이 이미 존재하는지 확인
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send('Username already exists.');
    }
    // 비밀번호 해싱
    const hashpwd = await bcrypt.hash(req.body.password, 10);

    await new User({
      username, // db에 저장할 데이터 
      email, 
      password: hashpwd
    }).save();

    res.send('회원가입완료');
    // res.redirect('/login');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating the user');
  }
});

// 로그인 처리
app.post('/login', passport.authenticate('local', {
  successRedirect: '/', // 로그인 성공 시 리다이렉트할 경로
  failureRedirect: '/login', // 로그인 실패 시 리다이렉트할 경로
  failureFlash: true // 선택 사항: 실패 시 메시지를 flash로 보여줄지 여부
}));

// 로그인 페이지 렌더링
app.get('/login', (req, res) => {
  res.render("하이"); 
});




app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});