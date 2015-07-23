var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');

var SALT_WORK_FACTOR = 10;

var userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  level: { type: Number, default: 0 },
  experience: { type: Number, default: 0 },
  created_at: Date,
  updated_at: Date
});

userSchema.pre('save', function(next) {
  var user = this;

  // set dates
  var currentDate = Date();
  this.updated_at = currentDate;

  if(!this.created_at) {
    this.created_at = currentDate;
  }

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) return next();

  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) return next(err);

    // hash the password using our new salt
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err);

      // override the cleartext password with the hashed one
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.verifyPassword = function(password, callback) {
  bcrypt.compare(password, this.password, function(error, isMatch) {
    if(error) return callback(error);
    callback(null, isMatch);
  });
}

module.exports = mongoose.model('User', userSchema);
