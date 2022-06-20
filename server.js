const express = require("express")
const app = express()
const connectDB = require("./server/database/connection");

const PORT = process.env.PORT || 3002



//connect database
connectDB()
app.get("/", (req, res)=>{

    res.send("Welcome to my Email Server")
})

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// APIs
app.use("/api", require("./server/routes/userOtp"))
app.use("/", require("./server/routes/test"));

app.listen(PORT, ()=>{
    console.log(` Server Running on  http://localhost:${PORT}`)
})
