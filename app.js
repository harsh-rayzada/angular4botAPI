var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var fs = require('fs');

app.use(express.static(__dirname + '/node_modules'));
app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(client) {
    console.log('Client connected...');

    client.on('login', function(loginData){
        client.emit('loader');
        fs.readFile('users.json', 'utf8', function(err, data){
           if(err){
               if(err.code != 'ENOENT'){
                   console.log('Err: reading users.json : ', JSON.stringify(err));
                   client.emit('error', {status: false, message: 'Error while logging in', type: 'login'});
               }else{
                   client.emit('user', {type: 'not_found'});
               }
           }else{
               console.log(data);
               if(data){
                   var userData = JSON.parse(data);

                   if(userData.users[loginData.nickname]){
                       client.emit('user', {
                           type: 'login',
                           user: {
                               nickname: loginData.nickname,
                               name: userData.users[loginData.nickname]
                           },
                           all_users: Object.keys(userData.users)
                       });
                   }else{
                       client.emit('user', {type: 'not_found'});
                   }
               }else{
                   client.emit('user', {type: 'not_found'});
               }
           }
        });
    });

    client.on('signup', function(signupData){
        client.emit('loader');
        fs.readFile('users.json', 'utf8', function(err, data){
            if(err && err.code != 'ENOENT'){
                console.log('Err: reading users.json : ', JSON.stringify(err));
                client.emit('error', {status: false, message: 'Error while logging in', type: 'login'});
            }else if(data){
                var userData = JSON.parse(data);
                fs.unlink('users.json', function(err){
                    if(err){
                        console.log('Err: writing to users.json : ', err);
                        client.emit('error', {status: false, message: 'Error while signing up in', type: 'signup'});
                    }else{
                        userData.users[signupData.nickname] = signupData.name;
                        fs.appendFile('users.json', JSON.stringify(userData), function(err){
                            if(err){
                                console.log('Err: writing to users.json : ', err);
                                client.emit('error', {status: false, message: 'Error while signing up in', type: 'signup'});
                            }else{
                                client.emit('user', {
                                    type: 'login',
                                    user: {
                                        nickname: signupData.nickname,
                                        name: userData.users[signupData.nickname]
                                    },
                                    all_users: Object.keys(userData.users)
                                });
                            }
                        });
                    }
                });
            }else{
                var dataToBeCreated = {
                    users: {}
                };

                dataToBeCreated.users[signupData.nickname] = signupData.name;
                fs.appendFile('users.json', JSON.stringify(dataToBeCreated), function(err){
                    if(err){
                        console.log('Err: writing to users.json : ', err);
                        client.emit('error', {status: false, message: 'Error while signing up in', type: 'signup'});
                    }else{
                        client.emit('user', {
                            type: 'login',
                            user: {
                                nickname: signupData.nickname,
                                name: dataToBeCreated.users[signupData.nickname]
                            }
                        });
                    }
                });
            }
        });
    });

    client.on('join', function (room) {
        client.join(room);
    });

    client.on('create_room', function(data){
        // console.log(data);
       try{
           client.join(data.room);
           // client.broadcast.to(data.room).emit('room_created', data);
            client.broadcast.emit('room_created', data);
       }catch(e){
           console.log(e);
       }
       //  client.broadcast.emit('room_created', {room: data.room, receiver: data.receiver});
    });

    client.on('message', function(data) {
        fs.
        client.in(data.room).emit('message', {sender: data.sender, text: data.text});
    });
});

server.listen(3000);
