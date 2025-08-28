const crypto = require("crypto");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    name: {
      type: String,
      trim: true,
      required: [true, "Please enter your name"],
      maxLength: [32, "Name cannot exceed 32 characters"],
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
    },
    email: {
      type: String,
      trim: true,
      required: [true, "Please enter your email"],
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
      length: [11, "Phone number must be 11 characters"],
      required: [true, "Please enter your Phone"],
      unique: true,
      lowercase: true,
    },
    profilePicture: {
      type: String,
      default:
        "https://writingcenter.fas.harvard.edu/sites/hwpi.harvard.edu/files/styles/os_files_xxlarge/public/writingcenter/files/person-icon.png?m=1614398157&itok=Bvj8bd7F",
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minLength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["user", "technician", "admin"],
      default: "user",
    },
    active: {
      type: Boolean,
      default: true,
    },
    wishlist: [
      {
        type: String,
        ref: "Product",
      },
    ],

    addresses: [
      {
        _id: { type: String, default: uuidv4 },

        alias: String,
        details: String,
        city: String,
        governorate: String,
        zipCode: String,
      },
    ],

    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetCodeExpires: Date,
    passwordResetVerified: Boolean,
  },

  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (
  enteredPassword,
  userPassword
) {
  return await bcrypt.compare(enteredPassword, userPassword);
};

userSchema.methods.changedPasswordAfter = async function (JWTTimestampIat) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      // parseInt to convert to integer value instead of date
      this.passwordChangedAt.getTime() / 1000, // 1000 to convert to seconds
      10 // base
    );
    // console.log("changedTimestamp", changedTimestamp);
    // console.log(JWTTimestampIat < changedTimestamp);
    return JWTTimestampIat < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetCode = function () {
  // Generate the random 6 digits reset code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  // Hash the reset code and save it to the database
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  // save the hashed reset code to the database
  this.passwordResetCode = hashedResetCode;

  this.passwordResetCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetCode;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
