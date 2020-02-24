const mongoose = require('mongoose');
const User = require('./schema');

require('dotenv').config();

mongoose.connect(process.env.MLAB, { useNewUrlParser: true, useUnifiedTopology: true });

const saveUser = (userObject) => {
  const userToSave = new User(userObject);
  try {
    // return userToSave.save((err, result) => ({ err, result }));
    return userToSave.save().then((result) => ({ result }));
  } catch (saveError) {
    return { err: saveError, result: null };
  }
};

module.exports = saveUser;
