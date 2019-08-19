const functions = require('firebase-functions');

const app = require('express')();

const FBAuth = require('./util/fbAuth')

const { db } = require('./util/admin')

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
    getAuthenticatedUser,
    getUserDetails,
    markNotificationsRead
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
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead)

exports.api = functions.region('europe-west1').https.onRequest(app);

exports.createNotificationOnLike = functions
    .region('europe-west1')
    .firestore.document('likes/{id}')
    .onCreate((snapshot) => {
        return db.doc(`/sayits/${snapshot.data().sayitId}`)
            .get()
            .then((doc) => {
                if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
                    return db.doc(`/notifications/${snapshot.id}`).set(
                        {
                            createdAt: new Date().toISOString(),
                            recipient: doc.data().userHandle,
                            sender: snapshot.data().userHandle,
                            type: 'like',
                            read: false,
                            sayitId: doc.id
                        });
                }
            })
            .catch((err) => 
                console.error(err))
    });
exports.deleteNotificationOnUnlike = functions.region('europe-west1')
    .firestore.document('likes/{id}')
    .onDelete((snapshot) => {
      return db.doc(`/notifications/${snapshot.id}`)
            .delete()
            .catch(err => {
                console.error(err);
                return;
            })
    })
exports.createNotificationOnComment = functions.region('europe-west1')
    .firestore.document('comments/{id}')
    .onCreate((snapshot) => {
       return db.doc(`/sayits/${snapshot.data().sayitId}`).get()
            .then(doc => {
                if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
                    return db.doc(`/notifications/${snapshot.id}`).set(
                        {
                            createdAt: new Date().toISOString(),
                            recipient: doc.data().userHandle,
                            sender: snapshot.data().userHandle,
                            type: 'comment',
                            read: false,
                            sayitId: doc.id
                        }
                    );
                }
            })
            .catch(err => {
                console.error(err);
                return;
            });
    })

    exports.onUserImageChange = functions.region('europe-west1').firestore.document('/users/{userId}')
    .onUpdate((change) => {
        console.log(change.before.data());
        console.log(change.after.data());
        if(change.before.data().imageUrl !== change.after.data.imageUrl){
            console.log('Image has changed')
            let batch = db.batch();
        return db.collection('sayits').where('userHandle', '==', change.before.data().handle).get()
        .then((data) => {
            data.forEach(doc=> {
                const sayit = db.doc(`/sayits/${doc.id}`);
                batch.update(scream, {userImage: change.after.data().imageUrl});
            })
            return batch.commit();
        })
        }
    })