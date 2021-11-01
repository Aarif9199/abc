const express = require('express');
const morgan = require('morgan');
const bodyparser = require('body-parser');
const path = require('path');
const axios = require('axios');
const fileUpload = require('express-fileupload');
const app = express();
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const {google} = require('googleapis');
const fs = require('fs');
const { getAudioDurationInSeconds } = require('get-audio-duration');
const flash = require('connect-flash');
const toastr = require('express-toastr');

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
  

const oneDay = 1000 * 60 * 60 * 24;
var session;

//session middleware
app.use(sessions({
    secret: "thisismysecrctekeyforalmanartamil",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));

app.use(morgan('tiny'));
app.use(cookieParser());
app.use(fileUpload());
//parse request to bady-parser
app.use(bodyparser.urlencoded({extended: true}));
app.use(flash());
app.use(toastr());

//set view engine
app.set("view engine", "ejs")

//load assets
app.use('/css',express.static(path.resolve(__dirname,"assets/css")))
app.use('/js',express.static(path.resolve(__dirname,"assets/js")))
app.use('/img',express.static(path.resolve(__dirname,"assets/img")))
app.use('/fonts',express.static(path.resolve(__dirname,"assets/fonts")))

app.get('/', (req, resp) => {
    req.toastr.error('Invalid Credentials');
    resp.render('login', {req: req});
})

app.post('/login/check', (req, resp)=> {
    if (!req.body.email || !req.body.pwd) {
        resp.status(404).send('Message Cannot be Empty');
        return;
    }
    axios.post('http://sanaerp.com/apexpu/dev_sh1purple21/alm/post/', 
        {
            user : req.body.email,
            pwd : req.body.pwd
        }
    ).then(JSON => {
        console.log(JSON.data);
        if (JSON.data.Status === '1') {
            session=req.session;
            session.userid=req.body.email;
            session.uniqueID = JSON.data.Message;
            resp.redirect('/profile');
        }else {
          resp.redirect('/');
        }
    })
})

app.get('/profile', (req, resp) => {
    var sessionUser = `${session.uniqueID}`;
    if (sessionUser != '' || sessionUser != null) {
        axios.get('http://sanaerp.com/apexpu/dev_sh1purple21/alm/'+sessionUser).then((response) => {
            var result = response.data;
            resp.render('profile', {result : result} );
          });
    }
})

app.post('/upload/quran', (req,resp) => {
    let sampleFile;
    let uploadPath;
    let mimes;
    if (!req.files || Object.keys(req.files).length === 0) {
      return resp.status(400).send('No files were uploaded.');
    }
    sampleFile = req.files.uploadQ;
    mimes = req.files.uploadQ.mimetype;
    if (mimes == 'audio/wav' || mimes == 'audio/ogg' || mimes == 'audio/mpeg' || mimes == 'audio/mp4' || mimes == 'video/mpeg') {
      uploadPath = __dirname  +'/assets/uploads/' + sampleFile.name;
      sampleFile.mv(uploadPath, function(err) {
          if (err)
            return resp.status(500).send(err);
            else {
              var Jsondata =  uploadFile(__dirname  +'/assets/uploads/' + sampleFile.name, mimes, sampleFile.name, 'Q');
              console.log(Jsondata);
              resp.redirect('/profile');
            }
        });
    } else {
      return resp.send('Invalid File');
    }
})


app.post('/upload/speech', (req,resp) => {
  let sampleFile;
  let uploadPath;
  let mimes;
  if (!req.files || Object.keys(req.files).length === 0) {
    return resp.status(400).send('No files were uploaded.');
  }
  sampleFile = req.files.uploadS;
  mimes = req.files.uploadS.mimetype;
  console.log(mimes);
  if (mimes == 'audio/wav' || mimes == 'audio/ogg' || mimes == 'audio/mpeg' || mimes == 'audio/mp4' || mimes == 'video/mpeg') {
    uploadPath = __dirname  +'/assets/uploads/' + sampleFile.name;
    sampleFile.mv(uploadPath, function(err) {
        if (err)
          return resp.status(500).send(err);
          else {
           var Jsondata =  uploadFile(__dirname  +'/assets/uploads/' + sampleFile.name, mimes, sampleFile.name, 'S');
           console.log(Jsondata);
           resp.redirect('/profile');
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
      try {
      getAudioDurationInSeconds(path).then((duration) => {
        console.log(duration);
      }); 
    } catch (ex) {
      console.log(ex);
    }
      var fileID = response.data.id;
      var SharableLink = await generatePublicUrl(fileID);
      if (SharableLink != '') {
            axios.post('http://sanaerp.com/apexpu/dev_sh1purple21/alm/file_upload/', 
            {
                tran_number : `${session.uniqueID}`,
                competition_type : comptype,
                file_name : filename,
                mime_type : mime,
                file_url : SharableLink,
                is_submitted : 'Y',
                created_by : `${session.uniqueID}`
            }
            ).then(JSON => {
                if (JSON.data.status === '1') {
                    return JSON.data;
                }else {
                    return JSON.data;
                }
            })
         }
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

app.listen(PORT, () => {
    console.log(`im listening on ${PORT}`);
})