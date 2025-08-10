const express = require('express')
const cors = require('cors');
const app = express();
const path = require('path');
const morgan = require('morgan');
const dotenv = require('dotenv')
const connectDB = require('./config/db');
const routes = require('./routes');
const http = require('http');
const socketIO = require('socket.io');
const cookieParser = require('cookie-parser');
const { initSocket } = require('./socketUtil');
app.use(cookieParser());

dotenv.config();

connectDB();

app.use(cors({
    origin: ['http://localhost:3030'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', routes);

    
app.get('/',(req,res)=>{
    return res.status(200).send("<h1>wellcome</h1>");
});

const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: ['http://localhost:3030'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

// Initialize Socket.IO
initSocket(io);

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

global.io = io;

module.exports = { app, io };

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
