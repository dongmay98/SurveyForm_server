const express = require('express')
const app = express()

app.use(express.static(__dirname+'/public'))
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))

const bcrypt = require('bcrypt')  // bcrypt 불러오기

// use mongodb
const { MongoClient, ObjectId } = require('mongodb')
const MongoStore = require('connect-mongo')
// use .env
require('dotenv').config()

let db;
const url = process.env.mongoUrl;
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공')
  db = client.db('forum')
  app.listen(process.env.port, () => {
      console.log('http://localhost:xxxx 에서 서버 실행중')
  })
}).catch((err)=>{
  console.log(err)
})

// passport 세팅
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')

app.use(passport.initialize())
app.use(session({
  secret: '0000',
  resave : false,
  saveUninitialized : false,
  store : MongoStore.create({
    mongoUrl : process.env.mongoUrl,
    dbName : 'forum'
  })
}))

app.use(passport.session()) 

//passport 아이디/비번 검증
passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
  let result = await db.collection('user').findOne({ username : 입력한아이디})
  if (!result) {
    return cb(null, false, { message: '아이디 DB에 없음' })
  }
  if (result.password == 입력한비번) {
    return cb(null, result)
  } else {
    return cb(null, false, { message: '비번불일치' });
  }
}))

passport.serializeUser((user, done)=>{
  process.nextTick(()=>{
    done(null, { id: user._id, username: user.username })
  })
})
passport.deserializeUser(async(user, done) => {
  let result = await db.collection('user').findOne({_id : new ObjectId(user.id) })
  delete result.password
  process.nextTick(() => {
    return done(null, result)
  })
})

// API
app.get('/', (req, res) => {
  res.sendFile(__dirname+'/index.html')
}) 

app.get('/join', async(req, res)=> {
  res.render('join.ejs');
})
app.post('/join', async (req, res) => {

  let hashpwd = await bcrypt.hash(req.body.password, 10)  //bcrypt hash 10개단위
  console.log(hashpwd)

  let result = await db.collection('user').insertOne({
    username: req.body.username,
    password: req.body.password
  });
  res.redirect('/login');
});

app.get('/login', async(req, res)=>{
  res.render('login.ejs')
})

app.post('/login', async (req, res, next) => {

  passport.authenticate('local', (error, user, info) => {
      if (error) return res.status(500).json(error)
      if (!user) return res.status(401).json(info.message)
      req.logIn(user, (err) => {
        if (err) return next(err)
        res.redirect('/')
        console.log(req.user)
      })
  })(req, res, next)

}) 