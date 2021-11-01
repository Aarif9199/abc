const express = require('express');
const morgan = require('morgan');
const bodyparser = require('body-parser');
const path = require('path');
const axios = require('axios');
const fileUpload = require('express-fileupload');
const app = express();
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const { google } = require('googleapis');
const fs = require('fs');
const { getAudioDurationInSeconds } = require('get-audio-duration');
const nodemailer = require("nodemailer");

const PORT = process.env.PORT || 5000;

const CLIENT_ID = '817452619141-bpqei3m5222k74d0hfke8reuk5kp8rev.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REFRESH_TOKEN = '1//04ZEnwAnzqTD_CgYIARAAGAQSNwF-L9Irvq8HI3cGzx1JjNQf8KHPT_uf04PX_d4pTqg-SsXGabXVT_hBV6qpcv5ORugi0F6UjKg';

const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({
  version: 'v3',
  auth: oauth2Client,
});

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'arif.sanainfotech@gmail.com',
    pass: 'thedeveloper'
  }
});



const oneDay = 1000 * 60 * 60 * 24;
var session;

//session middleware
app.use(sessions({
  secret: "thisismysecrctekeyforalmanartamil",
  saveUninitialized: true,
  cookie: { maxAge: oneDay },
  resave: false
}));

app.use(morgan('tiny'));
app.use(cookieParser());
app.use(fileUpload());
//parse request to bady-parser
app.use(bodyparser.urlencoded({ extended: true }));

//set view engine
app.set("view engine", "ejs")

//load assets
app.use('/css', express.static(path.resolve(__dirname, "assets/css")))
app.use('/js', express.static(path.resolve(__dirname, "assets/js")))
app.use('/img', express.static(path.resolve(__dirname, "assets/img")))
app.use('/fonts', express.static(path.resolve(__dirname, "assets/fonts")))

app.get('/', (req, resp) => {
  req.toastr.error('Invalid Credentials');
  resp.render('login', { req: req });
})

app.get('/logout', (req, resp) => {
  resp.render('login', { req: req });
})

app.post('/login/check', (req, resp) => {
  if (!req.body.email || !req.body.pwd) {
    resp.status(404).send('Message Cannot be Empty');
    return;
  }
  axios.post('http://sanaerp.com/apexpu/dev_sh1purple21/alm/post/',
    {
      user: req.body.email,
      pwd: req.body.pwd
    }
  ).then(JSON => {
    console.log(JSON.data);
    if (JSON.data.Status === '1') {
      session = req.session;
      session.userid = req.body.email;
      session.uniqueID = JSON.data.Message;
      resp.redirect('/profile');
    } else {
      resp.redirect('/');
    }
  })
})

app.get('/profile', (req, resp) => {
  console.log(req.session.uniqueID);
  var sessionUser = req.session.uniqueID;
  if (sessionUser != '' || sessionUser != null) {
    console.log('abcd');
    axios.get('http://sanaerp.com/apexpu/dev_sh1purple21/alm/' + sessionUser).then((response) => {
      var result = response.data;
      resp.render('profile', { result: result });
    });
  }
})

app.post('/upload/quran', (req, resp) => {
  let sampleFile;
  let uploadPath;
  let mimes;
  if (!req.files || Object.keys(req.files).length === 0) {
    return resp.status(400).send('No files were uploaded.');
  }
  sampleFile = req.files.uploadQ;
  mimes = req.files.uploadQ.mimetype;
  if (mimes == 'audio/wav' || mimes == 'audio/ogg' || mimes == 'audio/mpeg' || mimes == 'audio/mp4' || mimes == 'video/mpeg') {
    uploadPath = __dirname + '/assets/uploads/' + sampleFile.name;
    sampleFile.mv(uploadPath, function (err) {
      if (err)
        return resp.status(500).send(err);
      else {
        try {
          var vPath = __dirname + '/assets/uploads/' + sampleFile.name;
          var Jsondata = uploadFile(vPath, mimes, sampleFile.name, 'Q').then(fileID => {
            if (fileID != '') {
              getAudioDurationInSeconds(vPath).then((duration) => {
                var duration = duration;
                var SLink = generatePublicUrl(fileID).then(sl => {
                  if (sl != '') {
                    console.log(sl + ':' + fileID + ':' + duration + ':' + sampleFile.name + ':' + req.session.uniqueID + ':' + mimes);
                    try {
                      callApex(req.session.uniqueID, 'Q', sampleFile.name, mimes, sl, resp);
                    } catch (ex) {
                      console.log(ex);
                    }
                  }
                });
              })
            }
          });
        } catch (ex) {
          console.log(ex);
        }
      }
    });
  } else {
    return resp.send('Invalid File');
  }
})

app.post('/upload/speech', (req, resp) => {
  let sampleFile;
  let uploadPath;
  let mimes;
  if (!req.files || Object.keys(req.files).length === 0) {
    return resp.status(400).send('No files were uploaded.');
  }
  sampleFile = req.files.uploadQ;
  mimes = req.files.uploadQ.mimetype;
  if (mimes == 'audio/wav' || mimes == 'audio/ogg' || mimes == 'audio/mpeg' || mimes == 'audio/mp4' || mimes == 'video/mpeg') {
    uploadPath = __dirname + '/assets/uploads/' + sampleFile.name;
    sampleFile.mv(uploadPath, function (err) {
      if (err)
        return resp.status(500).send(err);
      else {
        try {
          var vPath = __dirname + '/assets/uploads/' + sampleFile.name;
          var Jsondata = uploadFile(vPath, mimes, sampleFile.name, 'Q').then(fileID => {
            if (fileID != '') {
              getAudioDurationInSeconds(vPath).then((duration) => {
                var duration = duration;
                var SLink = generatePublicUrl(fileID).then(sl => {
                  if (sl != '') {
                    console.log(sl + ':' + fileID + ':' + duration + ':' + sampleFile.name + ':' + req.session.uniqueID + ':' + mimes);
                    try {
                      callApex(req.session.uniqueID, 'Q', sampleFile.name, mimes, sl, resp);
                    } catch (ex) {
                      console.log(ex);
                    }
                  }
                });
              })
            }
          });
        } catch (ex) {
          console.log(ex);
        }
      }
    });
  } else {
    return resp.send('Invalid File');
  }
})

async function uploadFile(path, mime, filename, comptype) {
  try {
    const stream = fs.createReadStream(path);
    const response = await drive.files.create({
      requestBody: {
        name: filename,
        mimeType: mime,
      },
      media: {
        mimeType: mime,
        body: stream,
      },
    });
    return response.data.id;
  } catch (error) {
    console.log(error.message);
  }
}

async function generatePublicUrl(fileID) {
  try {
    const fileId = fileID;
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    /* 
    webViewLink: View the file in browser
    webContentLink: Direct download link 
    */
    const result = await drive.files.get({
      fileId: fileId,
      fields: 'webViewLink, webContentLink',
    });
    return result.data.webViewLink;
  } catch (error) {
    console.log(error.message);
  }
}

async function callApex(userID, cType, fileName, mime, glink, resp) {
  try {
   await axios.post('http://sanaerp.com/apexpu/dev_sh1purple21/alm/file_upload/',
      {
        tran_number: userID,
        competition_type: cType,
        file_name: fileName,
        mime_type: mime,
        file_url: glink,
        is_submitted: 'Y',
        created_by: userID
      }).then(JSON => {
        if(JSON.data.status === '1') {
          var mailOptions = {
            from: 'arif.sanainfotech@gmail.com',
            to: 'arifshoaib@live.com',
            subject: 'Al Manar Tamil Islamic Center',
            text: 'Thank you so much, We received your file',
            html: '<a href="'+ glink +'">Your File</a>'
          };
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
              resp.redirect('/profile');
            }
          });
        }
      })
  } catch (ex) {
    console.log(ex);
  }
}

app.listen(PORT, () => {
  console.log(`im listening on ${PORT}`);
})