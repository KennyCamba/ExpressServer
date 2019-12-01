const express = require("express");
var app = express();

var admin = require("firebase-admin");

var bodyParser = require('body-parser');

const sgMail = require('@sendgrid/mail');

var SimpleCrypto = require("simple-crypto-js").default;

var _secretKey = "kjsaoidasoiusfbmkkd89qwdy9qwyda2da"
var simpleCrypto = new SimpleCrypto(_secretKey);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var serviceAccount = require("../firebase/bupro-ee2ab-firebase-adminsdk-vdp0b-aa5bd3a176.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bupro-ee2ab.firebaseio.com"
});

var database = admin.database();

let usuario = {
    "birthdate" : "",
    "email" : "",
    "genero" : "",
    "lastname" : "",
    "name" : "",
    "pass" : "",
    "phone" : "",
    "user" : "",
    "activate": false
};

let respuesta = {
  error: false,
  codigo: 200,
  mensaje: ''
 };

app.get('/index', function(req, res){
  console.log("GET: " + req.url);
  console.log(req.body.name)
  respuesta = {
    error: true,
    codigo: 200,
    mensaje: 'Punto de inicio'
  }
  res.send(respuesta);
});

app.post('/login', function(req, res){
  console.log("POST: /logn");
  var ref = database.ref("users");
  var user = ref.child(req.body.user);

  user.on("value", function(snapshot){
    if(snapshot.exists()){
      usuario = snapshot.val();
      if(usuario.pass == req.body.pass){
        res.status(200);
        respuesta = {
          error: false,
          codigo: 200,
          mensaje: 'respuesta del usuario',
          respuesta: usuario
        };
      }else{
        res.status(200);
        respuesta = {
          error: true,
          codigo: 501,
          mensaje: 'Sus credenciales son incorrectas',
        };
      }
      res.send(respuesta);
    }else {
      res.status(200);
      respuesta = {
        error: true,
        codigo: 501,
        mensaje: 'El usuario no existe'
      };
      res.send(respuesta);
    }
  });
});

app.post('/create_user', function(req, res){
  console.log("POST: /create_user");
  var ref = database.ref('users');
  var user = ref.child(req.body.user);
  user.once('value', function(snapshot){
    if(snapshot.exists() && snapshot.val().activate){
      res.status(200)
      respuesta = {
        error: true,
        codigo: 503,
        mensaje: 'El usuario no está disponible'
       };
    }else{
      res.status(200);
      usuario = {
        "birthdate" : req.body.birthdate,
        "email" : req.body.email,
        "genero" : req.body.genero,
        "lastname" : req.body.lastname,
        "name" : req.body.name,
        "pass" : req.body.pass,
        "phone" : req.body.phone,
        "user" : req.body.user,
        "activate": false
      };
      ref.child(usuario.user).set(usuario);
      respuesta = {
        error: false,
        codigo: 200,
        mensaje: 'Usuario creado',
        respuesta: usuario
       };
       sendEmail(usuario.name, usuario.email, usuario.user)
    }
    res.send(respuesta);
  });
});

function sendEmail(name, email, user){
  var token = simpleCrypto.encrypt(user);
  sgMail.setApiKey("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");
  var html = 
  `<h1>Hola ${name}</h1> 
    <p><p>
    <p>Para activar su cuenta de BUPRO, por favor siga el siguente enlace: <a href="http://192.168.0.2:3000/activate?key=${token}">http://192.168.0.2:3000/activate?key=${token}</a></p>
  `
  const msg = {
    to: email,
    from: 'vrekennycamba@gmail.com',
    subject: 'Activacion de cuenta',
    text: 'Email de activacion',
    html: html,
  };
  sgMail.send(msg);
}

app.put('/usuario', function(req, res){
  if(!req.body.nombre || !req.body.apellido) {
    respuesta = {
     error: true,
     codigo: 502,
     mensaje: 'El campo nombre y apellido son requeridos'
    };
   } else {
    if(usuario.nombre === '' || usuario.apellido === '') {
     respuesta = {
      error: true,
      codigo: 501,
      mensaje: 'El usuario no ha sido creado'
     };
    } else {
     usuario = {
      nombre: req.body.nombre,
      apellido: req.body.apellido
     };
     respuesta = {
      error: false,
      codigo: 200,
      mensaje: 'Usuario actualizado',
      respuesta: usuario
     };
    }
   }
   
   res.send(respuesta);
});

app.delete('/usuario', function(req, res){
  if(usuario.nombre === '' || usuario.apellido === '') {
    respuesta = {
     error: true,
     codigo: 501,
     mensaje: 'El usuario no ha sido creado'
    };
   } else {
    respuesta = {
     error: false,
     codigo: 200,
     mensaje: 'Usuario eliminado'
    };
    usuario = { 
     nombre: '', 
     apellido: '' 
    };
   }
   res.send(respuesta);
});

app.get('/activate', function(req, res){
  console.log("GET: " + req.url)
  var token = req.query.key
  token = token.replace(" ", "+");
  var username = simpleCrypto.decrypt(token);
  var ref = database.ref('users').child(username);
  ref.once('value', function(snapshot){
    if(snapshot.exists()){
      if(!snapshot.val().activate){
        ref.child('activate').set(true)
        res.send("Usuario activado con éxito");
      }else{
        res.send("El usuario ya está activado");
      }
    }else{
      res.send("El enlace proprocionado no es válido");
    }
  });

});

app.use(function(req, res, next) {
  respuesta = {
   error: true, 
   codigo: 404, 
   mensaje: 'URL no encontrada'
  };
  res.status(404).send(respuesta);
 });

 var port = process.env.PORT || 3000

 app.listen(port, () => {
  console.log("BUPRO server starting...");
  console.log("Listen in port " + port);
});

