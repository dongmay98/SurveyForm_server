require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const app = express();
const cors = require('cors');
app.use(express.json());

// CORS 미들웨어 설정
const corsOptions = {
  origin: 'http://localhost:3000', // 클라이언트 서버 주소
  credentials: true, // 쿠키를 허용
  optionsSuccessStatus: 200 // 일부 레거시 브라우저의 경우
};
app.use(cors(corsOptions));


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
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// passport done()에 user정보 담아 반환
passport.use(new LocalStrategy({
  usernameField: 'email', // 사용자 인증 시 'email' 필드 사용
}, async (email, password, done) => {
  try {
    // 이메일을 사용하여 사용자를 찾음
    const user = await User.findOne({ email: email.toLowerCase() }); // 대소문자 구분 없이 이메일 검색
    if (!user) {
      return done(null, false, { message: '아이디 DB에 없음' });
    }

    // 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return done(null, false, { message: '비번불일치' });
    }

    // 성공적으로 사용자를 찾았을 경우
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
app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      // 사용자 인증 실패
      console.log(info);
      return res.status(401).json({ message: '로그인 실패' });
    }
    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
      // 사용자 인증 성공
      return res.json({ message: '로그인 성공' });
    });
  })(req, res, next);
});




app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});