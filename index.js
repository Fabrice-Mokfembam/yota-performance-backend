const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const fs = require("fs");
const http = require("http");
const socketIo = require("socket.io");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const cors = require("cors");
const cookieParser = require("cookie-parser");

require("dotenv").config();
const app = express();
 
app.use(cors());
//const allowedOrigins=['http://127.0.0.1:3000/', 'http://127.0.0.1:5500/']

app.use(express.json({ limit: '2mb' }));// for parsing application/json
app.use(cookieParser());

if (process.env.SECRET_KEY == undefined)  
	fs.writeFileSync( 
		".env",
		`SECRET_KEY=${crypto.randomBytes(20).toString("hex")}\n`
	);

const hostname = "localhost";

const server = http.createServer(app);
const io = socketIo(server);
const connectionString =
	"mongodb+srv://webdev944:WDXq4gUYnq8YA9JB@yotaperformancedb.wotkssf.mongodb.net/?retryWrites=true&w=majority";
 
mongoose
	.connect(connectionString, { 
		dbName: "yotaperformancedb", 
	})
	.then(() => console.log("Database connected successfully"))
	.catch((err) => console.log(err));

const Schema = mongoose.Schema;

// Define a simple schema for our database
const userReviews = new Schema({
	user_id: { type: String, required: true },
	user_name: { type: String, required: true },
	user_rating: { type: Number, required: true },
	user_text: { type: String, required: true }, 
	createdAt:{type:Date, required:true, default:Date.now()}
});

const products = new Schema({ 
	_id: { type: String },
	product_name: { type: String, required: true },
	car_brand: { type: String, required: true },
	car_model: { type: String, required: true },
	make_material: { type: String, required: true }, 
	category: { type: String, required: true },
	category_brand: { type: String, default: "Not Wheel" },
	wheel_size: { type: String, required: true, default: "Not Wheel" },
	fit_position: { type: String, required: true },
	description: { type: String, required: true }, 
	fitment: [{ type: String, required: true }], 
	price: { type: Number, required: true },
	quantity_left: { type: Number, required: true },
	rating: { type: Number, required: true },
	reviews: [userReviews], 
	images: [{ type: String, required: true }],
});   

const shippingAddress = new Schema({
	street: { type: String, default: null },
	city: { type: String, default: null },
	state: { type: String, default: null },
	zip: { type: String, default: null },
	country: { type: String, default: null },
	telephone: { type: String, default: null },
});
 
const users = new Schema({
	_id: { type: String },
	username: { type: String, required: true },
	password: { type: String, required: true },
	email: { type: String, required: true }, 
	shipping_address: shippingAddress,  
});

// const orders = new Schema({
// 	_id: { type: String },
// 	user_id: { type: String, default: null },
// 	product_ids: { type: [String], required: true }, 
// 	quantities: { type: [Number], required: true },
// 	total_price: { type: Number, required: true },
// 	shipping_id: { type: Number, required: true },
// 	order_status: { type: String, default: "Not Delivered", required: true },
// 	order_date: { type: Date, required: true, default: Date.now() },
// 	delivery_date: { type: Date, required: true },
// });
const orders = new Schema({
	_id: { type: String }, 
	id: mongoose.Schema.Types.ObjectId,
  user_id: { type: String, default: null },
  items: [{
    product_id: { type: String, required: true }, 
    quantities: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  total_price: { type: Number, required: true },
  shipping_id: { type: Number, required: true }, 
  order_status: { type: String, default: "Not Delivered", required: true },
  order_date: { type: Date, required: true, default: Date.now },
  delivery_date: { type: Date, required: true },
});

const shippings = new Schema({
	_id: { type: String },
	method: { type: String, required: true },
	cost: { type: Number, required: true },
	estimated_delivery_time: { type: String, required: true },
});

const transactionSchema = new Schema({
	amount: { type: Number, required: true },
	timestamp: { type: Date, default: Date.now },
});

const paymentSchema = new Schema({ 
	_id: { type: String },
	userId: { type: String, required: true },
	paymentMethod: { type: String, required: true },
	transactions: [transactionSchema],
});

const MessageSchema = new Schema({
	sender: { type: String, required: true }, 
	text: { type: String, required: true, default: "" },
	timestamp: { type: Date, required: true, default: Date.now() },
});

const ChatSchema = new Schema({
	_id: { type: String },
	adminId: { type: String, required: true },
	userId: { type: String, required: true },
	messages: [MessageSchema],
});

const BonusSchema = new Schema({ 
	_id: { type: String },
	bonus_name: { type: String, required: true },
	product_ids: [{ type: String, default: null }],
	value: { type: String, required: true },
	code: { type: String, default: null },
	endDate: { type: Date, default: null },
});

// Credit Card Schema
const CreditCardSchema = new mongoose.Schema({
	cardNumber: { type: String, required: true },
	cardHolderName: { type: String, required: true },
	expiryDate: { type: String, required: true },
	cvv: { type: String, required: true },
});

const FinancialSchema = new Schema({
	_id: { type: String },
	CerditCardDetails: [CreditCardSchema],
});

// Create a model from the schema
const Chat = mongoose.model("Chat", ChatSchema);
const Payment = mongoose.model("Payment", paymentSchema);
const Shipping = mongoose.model("Shippings", shippings);
const Order = mongoose.model("Orders", orders);
const Product = mongoose.model("Products", products);
const User = mongoose.model("Users", users);
const Bonus = mongoose.model("Bonus", BonusSchema);
const Finance = mongoose.model("Finance", FinancialSchema);

// Create a new document in the database
app.post("/create/product", async (req, res) => {
	req.body._id = await generateUserId("Products");
	const newTest = new Product(req.body);
	const result = await newTest.save();
	res.send(result);
});

app.post("/create/chat", async (req, res) => {
	req.body._id = await generateUserId("Chat");
	const newTest = new Chat(req.body);
	const result = await newTest.save();
	res.send(result);
});

app.post("/create/user", async (req, res) => {
	if (!req.body.email || !req.body.password) {
		return res.status(400).json({ message: "Missing email or password" });
	}

	if (!validator.isEmail(req.body.email)) {
		return res.status(400).json({ message: "Invalid email" });
	}

	req.body.password = await hash(req.body.password);
	req.body._id = await generateUserId("Users");
	const newTest = new User(req.body);
	const result = await newTest.save();
	res.send(result);
});

app.post("/create/payement", async (req, res) => {
	req.body._id = await generateUserId("Payment");
	const newTest = new Payment(req.body);
	const result = await newTest.save();
	res.send(result);
});

app.post("/create/order", async (req, res) => {
	req.body._id = await generateUserId("Orders");
	req.body.delivery_date = calculateDeliveryDate();
	const newTest = new Order(req.body);
	const result = await newTest.save();
	res.send(result);
});

app.post("/create/shipping", async (req, res) => {
	req.body._id = await generateUserId("Shippings");
	const newTest = new Shipping(req.body);
	const result = await newTest.save();
	res.send(result);
}); 

app.post("/create/bonus", async (req, res) => {
	req.body._id = await generateUserId("Bonus");
	const newTest = new Bonus(req.body);
	const result = await newTest.save();
	res.send(result); 
});
 
app.post("/create/finance", async (req, res) => {
	req.body._id = await generateUserId("Finance");
	const newTest = new Finance(req.body);
	const result = await newTest.save(); 
	res.send(result);
});

// Read a document from the database

//added
app.get("/get/products/", async (req, res) => {
	const result = await Product.find({}); 
	res.send(result); 
});

app.get("/get/products/reviews", async (req, res) => {
	const result = await Product.find({},{_id:false, reviews:true}); 
	res.send(result); 
});

app.get("/get/product/:category", async (req, res) => {
	const result = await Product.find({
		category: req.params.category,
	});
	res.send(result);
});

// app.get("/get/product/:product_name", async (req, res) => {
// 	const result = await Product.find({
// 		product_name:{$regex: /req.params.product_name/i }
// 	});
// 	res.send(result);  
// }); 


app.put("/update/product/addReview/:id", async (req, res) => {
	const result = await Product.findByIdAndUpdate(req.params.id, {$push:{reviews: req.body}},{new:true});
	res.send(result);
}); 

app.get("/get/orders", async (req, res) => {
  try {
    const result = await Order.find({});
    const newResult = result.map(item => ({ ...item, id: item._id }));
    res.send(newResult);
  } catch (error) {
    res.status(500).send("Error retrieving orders");
  }
}); 

app.get("/get/chat/admin/:id", async (req, res) => {
  const result = await Chat.find({ adminId: req.params.id });

  const newResult = await Promise.all(
    result.map(async (chat) => {
      const user = await User.findOne({ _id: chat.userId }, { username: true, _id: false });
      return { ...chat._doc, username: user.username };
    })
  );

  res.send(newResult);
});
//end added

app.get('/', (req, res) => { res.send('hello') })

app.get("/get/product/:id", async (req, res) => {
	const result = await Product.findOne({ _id: req.params.id });
	res.send(result);
});   


app.get("/get/product/:carBrand", async (req, res) => {
	const result = await Product.find({ car_brand: req.params.carBrand });
	res.send(result);
}); 

app.get("/get/product/:carModel", async (req, res) => {
	const result = await Product.find({ car_model: req.params.carModel });
	res.send(result);
});

app.get("/get/product/:carBrand/:carModel", async (req, res) => {
	const result = await Product.find({
		car_brand: req.params.carBrand,
		car_model: req.params.carModel,
	});
	res.send(result);
});

app.get("/get/product/:makeMaterial/:category", async (req, res) => {
	const result = await Product.find({
		make_material: req.params.makeMaterial,
		category: req.params.category,
	});
	res.send(result);
});

app.get("/get/product/:category/:carModel", async (req, res) => {
	const result = await Product.find({
		category: req.params.category,
		car_model: req.params.carModel,
	});
	res.send(result);
});

app.get("/get/product/:category/:categoryBrand", async (req, res) => {
	const result = await Product.find({
		category: req.params.category,
		category_brand: req.params.categoryBrand,
	});
	res.send(result);
});

app.get("/get/product/:carModel/:fitPosition", async (req, res) => {
	const result = await Product.find({
		car_model: req.params.carModel,
		fit_position: req.params.fitPosition,
	});
	res.send(result);
});

app.get("/get/users", async (req, res) => {
	const result = await User.find({});
	res.send(result);
});

app.get("/get/user/:id", async (req, res) => {
	const result = await User.findOne({ _id: req.params.id });
	res.send(result);
});

app.get("/get/user", async (req, res) => {
	const result = await User.find({ email: req.query.email });
	res.send(result);
});

app.get("/get/chats", async (req, res) => {
	const result = await Chat.find({});
	res.send(result);
});

app.get("/get/chat/:id", async (req, res) => {
	const result = await Chat.find({ _id: req.params.id });
	res.send(result);
});

app.get("/get/order/:status", async (req, res) => {
	const result = await Order.find({ order_status: req.params.status });
	res.send(result);
});

// app.get("/get/orders", async (req, res) => {
// 	const result = await Order.find({});
// 	res.send(result);
// });

app.get("/get/payments", async (req, res) => {
	const result = await Payment.find({});
	res.send(result);
});

app.get("/get/shippings", async (req, res) => {
	const result = await Payment.find({});
	res.send(result);
});

app.get("/get/bonus", async (req, res) => {
	const result = await Bonus.find({});
	res.send(result);
});

app.get("/get/cards", async (req, res) => {
	const result = await Finance.find({});
	res.send(result);
});

//Routes to Update a document in the database.
app.put("/update/messages/:id/add", async (req, res) => {
	const result = await Chat.findByIdAndUpdate(
		req.params.id, 
		{
			$push: {
				messages: req.body,
			
			},
		},
		{ new: true } 
	);
	res.send(result);
});

app.put("/update/products/:id", async (req, res) => {
	const result = await Product.findByIdAndUpdate(req.params.id, req.body);
	res.send(result);
});

app.put("/update/user/shipping/:id", async (req, res) => {
	const result = await User.findByIdAndUpdate(
		req.params.id,
		{
			"shipping_address.street": req.body.street,
			"shipping_address.city": req.body.city,
			"shipping_address.state": req.body.state,
			"shipping_address.zip": req.body.zip,
			"shipping_address.telephone": req.body.telephone,
		},
		{ new: true }
	);

	res.send(result);
});
//end of updates

// Routes to Delete a document from the database
app.delete("/delete/bonus/:id", async (req, res) => {
	const result = await Bonus.findByIdAndDelete(req.params.id);
	res.send(result);
});

app.delete("/delete/payment/:id", async (req, res) => {
	const result = await Payment.findByIdAndDelete(req.params.id);
	res.send(result);
});

app.delete("/delete/product/:id", async (req, res) => {
	const result = await Product.findByIdAndDelete(req.params.id);
	res.send(result);
});
  
app.delete("/delete/chat/:id", async (req, res) => {
	const result = await Chat.findByIdAndDelete(req.params.id);
	res.send(result);
});
 
app.delete("/delete/order/:id", async (req, res) => {
	const result = await Order.findByIdAndDelete(req.params.id);
	res.send(result);      
});        

app.delete("/delete/shipping/:id", async (req, res) => {
	const result = await Chat.findByIdAndDelete(req.params.id);
	res.send(result);
});

//Delete route ends here

//Login Route
app.post("/login", async (req, res) => {
	const password = req.body.password;

	if (!req.body.email || !req.body.password) {
		return res.status(400).json({ message: "Missing email or password" });
	}

	const user = await User.findOne({ email: req.body.email });
	if (!user) {
		return res.status(400).json({ msg: "Invalid Email" });
	}

	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		return res.status(400).json({ msg: "Invalid Password" });
	}

	const payload = {
		user: {
			identifier: user.id,
		},
	};

	const token = jwt.sign(
		payload,
		process.env.SECRET_KEY.toString(),
		{ expiresIn: 360000 },
		(err, token) => {
			if (err) throw err;
			res.json({token});
		}
	);
	res.cookie('token', token, {httpOnly: true});
	res.send({payload});
});

//End of Login route

//CreateDefault guest token
app.use((req, res, next) => {
	const token = req.cookies.token;
	if (!token) {
		const guestId = 'guest';
	  const guestToken = jwt.sign({ guest: true }, process.env.SECRET_KEY.toString());
	  res.cookie('token', guestToken, { httpOnly: true });
	  res.send({guestId});
	} else {
	  try {
		jwt.verify(token, process.env.SECRET_KEY.toString());
		const payload=getPayload(token);
		res.send({payload});
	  } catch (err) {
		// If verification fails, create a new guest token
		const guestToken = jwt.sign({ guest: true }, process.env.SECRET_KEY.toString());
		res.cookie('token', guestToken, { httpOnly: true });
		res.send({guestId});
	  }
	} 
	next();
  });

//Sever-side hash
async function hash(password) {
	const saltRounds = parseInt(process.env.ROUNDS);
	const salt = await bcrypt.genSalt(saltRounds);
	const hashedPassword = await bcrypt.hash(password, salt);
	return hashedPassword;
}

//Calculates delivery Date
function calculateDeliveryDate() {
	const now = new Date();
	let businessDays = Math.floor(Math.random() * 3) + 3; // Random number between 3 and 5

	while (businessDays > 0) {
		now.setDate(now.getDate() + 1);
		if (now.getDay() !== 0 && now.getDay() !== 6) {
			// Skip weekends 
			businessDays--;
		}
	}

	return now;
}

//Decode jwt payload
function getPayload(token) {
	const base64Url = token.split('.')[1];
	const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
	const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(function(c) {
	  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
	}).join('')));
  
	return payload;
  }

//AutoGenerateID for documents on database
async function generateUserId(collectionName) {
	const orderNumber = await countDocuments(collectionName);
	const date = new Date();
	const distance = date.getTime();

	let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
	let seconds = Math.floor((distance % (1000 * 60)) / 1000);

	const dateStr = `${hours.toString().padStart(2, "0")}${seconds
		.toString()
		.padStart(2, "0")}${minutes.toString().padStart(2, "0")}${(
		date.getMonth() + 1
	)
		.toString()
		.padStart(2, "0")}${date.getFullYear()}${date
		.getDate()
		.toString()
		.padStart(2, "0")}`;
	const orderStr = orderNumber.toString().padStart(5, "0");
	const Id = `${dateStr}${orderStr}`;
	return Id;
}

async function countDocuments(collectionName) {
	const collection = mongoose.model(collectionName);
	const count = await collection.countDocuments({});
	return count;
} 

//socket.io section

var UserSocketMap = new Map();

io.on("connection", (socket) => {
	const WelcomMsg =
		"Hey what can I help with today. Leave a message and I'll reply as soon as possible";

	console.log("a user connected");

	socket.emit("greeting", WelcomMsg); // Send greeting to client

	socket.on("disconnect", () => {
		socket.on("disconnecting", (identifier) => {
			UserSocketMap.set(identifier, null);
			console.log("user disconnected");
		});
	});

	socket.on("admin_reply", async (msg) => {
		const SendPort = UserSocketMap.get(msg.reciever);
		io.to(SendPort).emit("chat message", msg);
		const historyConversation = await CheckChats(msg.reciever);
		const chatID = historyConversation._id;
		socket.emit("store_chat", { msg, chatID });
	});

	socket.on("chat message", async (msg) => {
		const SendPort = UserSocketMap.get(msg.reciever);
		io.to(SendPort).emit("chat message", msg);
		const historyConversation = await CheckChats(msg.sender);
		if (historyConversation) {
			const chatID = historyConversation._id;
			socket.emit("update_chats", { msg, chatID });
		} else {
			socket.emit("start_chats", msg);
		}
	});

	socket.on("register", (userID) => {
		UserSocketMap.set(userID, socket.id);
		console.log("User registered: " + userID);
	});
});

var port = process.env.PORT || 5000;
app.listen(port, hostname, function () {
	console.log("App is listening on " + hostname + ":" + port);
});

//Side functions needed by socket

async function CheckChats(user) {
	try {
		const result = await Chat.findOne({ user_id: user });
		console.log(result);
		return result;
	} catch (err) {
		console.log(err);
	}
}
