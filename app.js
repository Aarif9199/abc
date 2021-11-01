const {google} = require('googleapis');
var logger = require('./testfile');
const path = require('path');
const fs = require('fs');

const CLIENT_ID = '817452619141-bpqei3m5222k74d0hfke8reuk5kp8rev.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

const REFRESH_TOKEN = '1//04ZEnwAnzqTD_CgYIARAAGAQSNwF-L9Irvq8HI3cGzx1JjNQf8KHPT_uf04PX_d4pTqg-SsXGabXVT_hBV6qpcv5ORugi0F6UjKg';

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
  
  /* 
  filepath which needs to be uploaded
  Note: Assumes example.jpg file is in root directory, 
  though this can be any filePath
  */
  const filePath = path.join(__dirname, 'WIN_20210319_20_27_45_Pro.mp4');
  
  async function uploadFile() {
    try {
      const response = await drive.files.create({
        requestBody: {
          name: 'test.mp4', 
          mimeType: 'video/mp4',
        },
        media: {
          mimeType: 'video/mp4',
          body: fs.createReadStream(filePath),
        },
      });
  
      console.log(response.data);
    } catch (error) {
      console.log(error.message);
    }
  }
  
   //uploadFile();
  
  async function deleteFile() {
    try {
      const response = await drive.files.delete({
        fileId: '1w_NOCvsRuq1rAYC9bk_TT7CjoMHCAF-L',
      });
      console.log(response.data, response.status);
    } catch (error) {
      console.log(error.message);
    }
  }
  
  // deleteFile();
  
  async function generatePublicUrl() {
    try {
      const fileId = '19njbKM2W9UDngotBC-DrgWdka0n_qAiP';
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
      console.log(result.data);
    } catch (error) {
      console.log(error.message);
    }
  }

  logger.fnind('abc');
  console.log(logger.aa);
  generatePublicUrl();