const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
    {
        firstname: {
            type: String,
            require: [true, "firstname is required"],
        },
        lastname: {
            type: String,
            require: [true, "lastname is required"],
        },
        email: {
            type: String,
            require: [true, "email is required"],
        },
        phonenumber: {
            type: String,
            require: [true, "phonenumber is required"],
        },
        country: {
            type: String,
            require: [true, "country is required"],
        },
        state: {
            type: String,
            require: [true, "state is required"],
        },
        city: {
            type: String,
            require: [true, "city is required"],
        },
        selectrestaurant: {
            type: String,
            required: [true, "selectrestaurant is required"],
        },
        profile_picture: {
            type: String,
            default:
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKc08Wq1A-TIERnJUrHsmF9Asnmz5f_EnD5Mr8kQsJNZCdHjg_medKyoo&s",
        },
        password: {
            type: String,
            require: [true, "password is required"],
        },
        comfirmpassword: {
            type: String,
            require: [true, "comfirmpassword is required"],
        },
        resetOtp: {
            type: String,
        },
        otpExpires: {
            type: Number,
        },
        role: {
            type: String,
            default: "admin"
        }
    },
    { timestamps: true }
);

adminSchema.pre(['find', 'findOne'], function(next) {
    this.populate('selectrestaurant');
    next();
});

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);
module.exports = Admin;