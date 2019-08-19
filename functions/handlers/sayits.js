const { db } = require('../util/admin')

exports.getAllSayits = (req, res) => {
    db
        .collection('sayits')
        .orderBy('createdAt', 'desc')
        .get()
        .then((data) => {
            let sayits = [];
            data.forEach((doc) => {
                sayits.push({
                    sayitId: doc.id,
                    body: doc.data().body,
                    userHandle: doc.data().userHandle,
                    createdAt: doc.data().createdAt,
                    commentCount: doc.data().commentCount,
                    likeCount: doc.data().likeCount,
                    userImage: doc.data().userImage
                });
            });
            return res.json(sayits);
        })
        .catch(err => console.log(err));
}

exports.postOneSayit = (req, res) => {
    if (req.body.body.trim() === '') {
      return res.status(400).json({ body: 'Body must not be empty' });
    }
  
    const newSayit = {
      body: req.body.body,
      userHandle: req.user.handle,
      userImage: req.user.imageUrl,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      commentCount: 0
    };
  
    db.collection('sayit')
      .add(newSayit)
      .then((doc) => {
        const resSayit = newSayit;
        resSayit.sayitId = doc.id;
        res.json(resSayit);
      })
      .catch((err) => {
        res.status(500).json({ error: 'something went wrong' });
        console.error(err);
      });
  };

//Fetch one sayit
exports.getSayit = (req, res) => {
    let sayitData = {};
    db.doc(`/sayits/${req.params.sayitId}`)
        .get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'Sayit not found' })
            }
            sayitData = doc.data();
            sayitData.sayitId = doc.id;
            return db
                .collection('comments')
                .orderBy('createdAt', 'desc')
                .where('sayitId', '==', req.params.sayitId)
                .get();
        })
        .then((data) => {
            sayitData.comments = [];
            data.forEach((doc) => {
                sayitData.comments.push(doc.data());
            });
            return res.json(sayitData);
        })
        .catch(err => {
            console.error(err)
            res.status(500).json({ error: "There is an error" })
        })
}

// Comment on a sayit
exports.commentOnSayit = (req, res) => {
    if (req.body.body.trim() === '')
      return res.status(400).json({ comment: 'Must not be empty' });
  
    const newComment = {
      body: req.body.body,
      createdAt: new Date().toISOString(),
      sayitId: req.params.sayitId,
      userHandle: req.user.handle,
      userImage: req.user.imageUrl
    };
    console.log(newComment);
  
    db.doc(`/sayits/${req.params.sayitId}`)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({ error: 'Sayit not found' });
        }
        console.log("Comment count: ", doc.data().commentCount + 1 )
        return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
      })
      .then(() => {
        return db.collection('comments').add(newComment);
      })
      .then(() => {
        return res.json(newComment);
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).json({ error: 'Something went wrong' });
      });
  };


exports.likeSayit = (req, res) => {
    const likeDocument = db.collection('likes').where('userHandle', '==', req.user.handle)
        .where('sayitId', '==', req.params.sayitId).limit(1);
    const sayitDocument = db.doc(`/sayit/${req.params.sayitId}`);

    let sayitData;
    sayitDocument.get()
        .then(doc => {
            if (doc.exists) {
                sayitData = doc.data();
                sayitData.sayitId = doc.id;
                return likeDocument.get();
            } else {
                return res.status(404).json({ error: 'Sayit not found' });
            }
        })
        .then(data => {
            if (data.empty) {
                return db.collection('likes').add({
                    sayitId: req.params.sayitId,
                    userHandle: req.user.handle
                })
                    .then(() => {
                        sayitData.likeCount++
                        return sayitDocument.update({ likeCount: sayitData.likeCount });
                    })
                    .then(() => {
                        return res.json(sayitData);
                    })
            } else {
                return res.status(400).json({ error: 'Sayit already liked' })
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: err.code });
        })
}

exports.unlikeSayit = (req, res) => {
    const likeDocument = db.collection('likes').where('userHandle', '==', req.user.handle)
        .where('sayitId', '==', req.params.sayitId).limit(1);
    const sayitDocument = db.doc(`/sayit/${req.params.sayitId}`);

    let sayitData;

    sayitDocument.get()
        .then(doc => {
            if (doc.exists) {
                sayitData = doc.data();
                sayitData.sayitId = doc.id;
                return likeDocument.get();
            } else {
                return res.status(404).json({ error: 'Sayit not found' });
            }
        })
        .then(data => {
            if (data.empty) {
                return res.status(400).json({ error: 'Sayit not liked' })

            } else {
                return db.doc(`/likes/${data.docs[0].id}`)
                    .delete()
                    .then(() => {
                        sayitData.likeCount--;
                        return sayitDocument.update({ likeCount: sayitData.likeCount })
                    })
                    .then(() => {
                        res.json(sayitData);
                    })
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: err.code });
        })
}

//Delete sayit
exports.deleteSayit = (req, res)=>{
    const document = db.doc(`/sayits/${req.params.sayitId}`);
    document.get()
    .then(doc => {
        if(!doc.exists){
            return res.status(404).json({error: 'Say It not found'})
        }
        if(doc.data().userHandle !== req.user.handle){
            return res.status(403).json({error: 'Unauthorized'});
        } else {
            return document.delete();
        }
    })
    .then(()=>{
        res.json({ message: 'Sayit deleted successfully'});
    })
    .catch(err =>{
        console.error(err);
        return req.status(500).json({error: err.code})
    })
    
}