const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("DB연결성공"))
  .catch((err) => console.log(err));
