const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');

const userSchema=new mongoose.Schema({
    email:{
        type:String,
        required:[true,"Email is required"],
        trim:true,
        unique:[true, 'Email already exists'],
        lowercase:true,
        match:[/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    name:{
        type:String,
        required:[true,"Name is required"],
    },
    password:{
        type:String,
        required:[true,"Password is required"],
        minlength:[6, 'Password must be at least 6 characters long'],
        select:false
    },
    systemUser:{
        type:Boolean,
        default:false,
        immutable:true,
        select:false

    }

},
{
    timestamps:true
});

userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        return next();
    }

    const hash=await bcrypt.hash(this.password,10);
    this.password=hash;
    return next();
});

userSchema.methods.comparePassword=async function(password){
    return await bcrypt.compare(password, this.password);
}

const userModel=mongoose.model('User', userSchema);

module.exports=userModel;