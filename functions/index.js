const functions = require('firebase-functions');

const app = require('express')();

const FBAuth = require('./util/fbAuth')

const { getAllSayits,
     postOneSayit,
     getSayit,
     commentOnSayit,
     likeSayit,
     unlikeSayit,
     deleteSayit 
    } = require('./handlers/sayits')

const { signup,
    login,
    uploadImage,
    addUserDetails,
    getAuthenticatedUser
} = require('./handlers/users')

//Sayit route 
app.get('/sayits', getAllSayits)
app.post('/sayit', FBAuth, postOneSayit);
app.get('/sayit/:sayitId', getSayit);
app.delete('/sayit/:sayitId', FBAuth, deleteSayit)
app.get('/sayit/:sayitId/like', FBAuth, likeSayit);
app.get('/sayit/:sayitId/unlike', FBAuth, unlikeSayit);
app.post('/sayit/:sayitId/comment', FBAuth, commentOnSayit)

//Users route
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);








exports.api = functions.region('europe-west1').https.onRequest(app);