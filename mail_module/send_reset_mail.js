const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'yeshwanth.apis@gmail.com',
      pass: process.env.email_token
    }
});

var mail_detail = {
  from: 'yeshwanth.apis@gmail.com',
  subject: 'Password Reset Link',
};

function email_template(token){
    let template = `
    <table style="width:100%; font-size:50px;">
        <tr align="center">
            <td>
                <img src="https://www.razlee.com/wp-content/uploads/2017/08/Password-Reset-1-768x768-1.png" height="200px" width="200px">
                <div>Reset Password Link.</div>
                <a href="${process.env.reset_host}/reset_link/${token}" target="_blank">Click Here</a>
                <div>To reset your password for our site</div>
            </td>
        </tr>
    </table>
    `
    return template;
}

module.exports = {transporter, mail_detail, email_template}