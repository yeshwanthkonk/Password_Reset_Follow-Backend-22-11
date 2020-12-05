const express = require("express")
const mongodb = require("mongodb")
const randomstring = require("randomstring");
const cors = require("cors")
require('dotenv').config()

const app = express();
const port = process.env.PORT || 3000;
const mongoClient = mongodb.MongoClient;
const object_id = mongodb.ObjectID;
const mongodb_url = process.env.mongo_url;


var {transporter, mail_detail, email_template} = require("./mail_module/send_reset_mail")

app.use(express.json());
app.use(cors());

app.post("/create_user", async (req, res)=>{
    let data = req.body;
    if(Object.keys(data).length == 0)
        return res.status(400).json({"detail": "Invalid Body Request"})
    try {
        let client  = await mongoClient.connect(mongodb_url);
        let collection = client.db("guvi_DailyTask(DT)_11-21-2020").collection('email_users');
        let result = await collection.find({"email": data["email"]}).toArray();
        if(result.length != 0){
            return res.status(400).json({"detail": "User Already Exist"})
        }
        let response = await collection.insertOne(data);
        client.close();
        if(response['insertedCount'] == 1)
            return res.status(200).json({"detail":`record inserted`, "id":response["ops"][0]["_id"]})
        else
            return res.status(500).json({"detail": "Some Error Occured"})
    } catch (error) {
        console.log(error);
        return res.status(500).json({"detail": "Some Exception Occured"})
    }
})

app.post("/login", async (req, res)=>{
    let data = req.body;
    if(Object.keys(data).length == 0)
        return res.status(400).json({"detail": "Invalid Body Request"})
    let client  = await mongoClient.connect(mongodb_url);
    let collection = client.db("guvi_DailyTask(DT)_11-21-2020").collection('email_users');
    let result = await collection.find(data).toArray();
    if(result.length == 0)
        return res.status(401).json({"detail": "Invalid Credentials"})
    client.close();
    res.status(200).json({"detail": "Login Success"})
})

app.post("/generate_link", async (req, res)=>{
    let data = req.body;
    if(Object.keys(data).length == 0)
        return res.status(400).json({"detail": "Invalid Body Request"})
    try{
        let client  = await mongoClient.connect(mongodb_url);
        let collection = client.db("guvi_DailyTask(DT)_11-21-2020").collection('email_users');
        let result = await collection.find({"email": data["email"]}).toArray();
        if(result.length == 0){
            return res.status(400).json({"detail": "Email Not Register with us"})
        }
        collection = client.db("guvi_DailyTask(DT)_11-21-2020").collection('email_password_links');
        let random_string = randomstring.generate(64);
        let response = await collection.findOneAndUpdate({"email": data["email"]},{$set:{"random_id": random_string}});
        mail_detail['to'] = "yeshwanthkonka@yahoo.com"
        mail_detail['html'] = email_template(random_string)
        if(!response['lastErrorObject']['updatedExisting']){
            data['random_id'] = random_string
            response = await collection.insertOne(data);
            if(response['insertedCount'] == 1){
                await transporter.sendMail(mail_detail);
                return res.status(200).json({"detail":"New Email link Sent"})
            }
            throw "Server Error";
        }
        client.close();
        await transporter.sendMail(mail_detail);
        return res.status(200).json({"detail":"Updated Email link Sent"})
    }
    catch(error){
        console.log(error);
        return res.status(500).json({"detail": "Some Error Occured"})
    }
})

app.get("/link_validity", async (req, res)=>{
    let data = {"random_id": req.params["id"]};
    let client  = await mongoClient.connect(mongodb_url);
    let collection = client.db("guvi_DailyTask(DT)_11-21-2020").collection('email_password_links');
    let result = await collection.find(data).toArray();
    client.close();
    if(result.length == 0){
        return res.redirect(process.env.frontend_host+"forgot_password.html?q='Invalid Link'")
    }
    else{
        return res.redirect(process.env.frontend_host+`reset_password.html?id=${data}`)
    }
})

app.post("/update_password", async (req, res)=>{
    let data = req.body["data"];
    let id = {"random_id": req.body["id"]};
    try{
        let client  = await mongoClient.connect(mongodb_url);
        let collection = client.db("guvi_DailyTask(DT)_11-21-2020").collection('email_password_links');
        let result = await collection.find(id).toArray();
        console.log(id, result)
        if(result.length == 0){
            client.close();
            return res.status(400).json({"detail": "Invalid Link request new link"})
        }
        data['email'] = result[0]['email'];
        await collection.deleteOne(id);
        console.log(data);
        collection = client.db("guvi_DailyTask(DT)_11-21-2020").collection('email_users');
        let response = await collection.findOneAndUpdate({"email": data["email"]},{$set:{"password": data["password"]}});
        console.log(response);
        if(!response['lastErrorObject']['updatedExisting']){
            return res.status(500).json({"detail": "Something Went Wrong"})
        }
        return res.status(200).json({"detail": "Success"})
    }
    catch(error){
        console.log(error);
        return res.status(500).json({"detail": "Something Went Wrong"})
    }
})

app.listen(port, ()=>console.log("Server Started on Port "+port));