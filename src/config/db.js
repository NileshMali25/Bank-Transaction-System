const mongoose=require('mongoose');
const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

function connectToDB(){
     mongoose.connect(process.env.MONGO_URI).then(()=>{
        console.log('Server is connected to MongoDB');
    })
    .catch(err=>{
        console.log('Error connecting to MongoDB:', err);
        process.exit(1);
    });
};

module.exports=connectToDB;