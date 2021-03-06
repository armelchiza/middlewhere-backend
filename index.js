const express = require('express');
const mysql = require('promise-mysql');
const http = require('http'); // SOCKET
//const cors = require('express-cors');
const socketIo = require('socket.io')
var corsOptions = {
  origin: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

// Express middleware
const bodyParser = require('body-parser');
const morgan = require('morgan');
const checkLoginToken = require('./lib/check-login-token.js');

// Data loader
const middlewhereDataLoader = require('./lib/middlewhere.js');

// Controllers
const authController = require('./controllers/auth.js');
const projectsController = require('./controllers/projects.js');
const tasksController = require('./controllers/tasks.js');


// Database / data loader initialization
const connection = mysql.createPool({
  user: 'root',
  password: 'root',
  database: 'middlewhere'
});

const dataLoader = new middlewhereDataLoader(connection);


// Express initialization
const app = express();

// SOCKET IO INITIALIZATION AND MW ------------------------

app.use(function(req, res, next) {

  // EXTERNAL SERVERS ALLOWED >>
  // var allowedOrigins = [ 'http://localhost:3000', 'http://localhost:50060', 'http://localhost:55967'
  //   ,'http://127.0.0.1:9000', 'http://localhost:9000', 'http://207.107.68.234:3000'
  // ];
  // var origin = req.headers.origin;
  // if(allowedOrigins.indexOf(origin) > -1){
  //      res.setHeader('Access-Control-Allow-Origin', origin);
  // } // I JUST ALLOWED ALL ORIGINS TO GET TO THE API <<

  res.header("Access-Control-Allow-Origin", "*");
  //res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:8020');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS, PATCH, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', true);
  return next();
}); //


const server = http.createServer(app);
const io = socketIo(server);
io.on('connection', socket => { // on connection to the sitting-arounder io
  socket.on('message', body => {

    const response = body;
    response['time'] = new Date();


    // TODO :: Insert in DB


    // THEN send responce back via socket.emit
    socket.broadcast.emit('message', response);
    socket.emit('message', response);

  console.log(response)
  })
});
//io.set('origins', 'http://localhost:50060');
//io(server,{origins:"http://localhost:3000"});


// ----------------------------------------------------


// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE,PATCH");
//   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   next();
// });


app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(checkLoginToken(dataLoader));

//const io = socketIo(server);
// app.post('/talker', (req, res) => {
//   const { Body, From, MediaUrl0 } = req.body
//   const message = {
//     body: Body,
//     from: From.slice(8),
//     img: MediaUrl0
//   }
//   io.emit('message', message)
//   res.send(`
//            <Response>
//             <Message>Thanks for texting!</Message>
//            </Response>
//            `)
// })
// io.on('connection', socket => {
//   socket.on('message', body => {
//     socket.broadcast.emit('message', {
//       body,
//       from: socket.id.slice(8)
//     })
//   })
// })

// app.use(cors({
//   allowedOrigins: [
//     'http://localhost:3000','https://23ab8953.ngrok.io'
//   ],
// }));


app.use('/auth', authController(dataLoader));
app.use('/projects', projectsController(dataLoader));
app.use('/tasks', tasksController(dataLoader));




app.post('/convo', (req, res) => {
  console.log('INDEX.JS ... ');
  const { Body, From, MediaUrl0 } = req.body
  const message = {
    body: Body,
    from: From.slice(8),
    img: MediaUrl0
  }
  io.emit('message', message)
  res.send(`
           <Response>
            <Message>Thanks for texting!</Message>
           </Response>
           `)
})


// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  if (process.env.C9_HOSTNAME) {
    console.log(`Web server is listening on https://${process.env.C9_HOSTNAME}`);
  } else {
    console.log(`Web server is listening on http://localhost:${port}`);
  }
});
