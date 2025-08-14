import { logger } from "../logger";
import { transporter } from "../verifyEmailConnection";

export const confirmationCodeTemplate = async (code: string, emailTo: string, expiresAt: string) => {
    try {
        const emailHTML = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .email-container {
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #eaeaea;
                }
                .content {
                    padding: 20px 0;
                }
                .code {
                    font-size: 24px;
                    font-weight: bold;
                    color: orange;
                    padding: 10px;
                    border: 1px dashed orange;
                    display: inline-block;
                    margin-bottom: 20px;
                }
                .footer {
                    text-align: center;
                    padding-top: 20px;
                    border-top: 2px solid #eaeaea;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <img 
                        style="background-color: #000; padding: 20px; display: inline-block;"
                        src="https://brickout-assets.s3.eu-west-1.amazonaws.com/1721557548284-Brickous%2BLogo%2BWhite-Orange.png" width="150" alt="Brickous Logo" border="0">
                </div>
                <div class="content">
                    <h1>Confirm Your Account</h1>
                    <p>Please use the following code to confirm your account. Remember, it will expire in ${expiresAt}</p>
                    <div class="code">${code}</div>
                    <p><strong>DO NOT SHARE THIS WITH CODE ANYONE!</strong></p>
                </div>
                <div class="footer">
                    <p>If you did not request this code, please ignore this email.</p>
                    <p>© 2025 Brickous</p>
                </div>
            </div>
        </body>
    </html>

`;
        return await sendTransporter(emailTo, emailHTML);
    } catch (err) {
        logger.error("Error sending confirmation code email:", err);
        return 500;
    }
};

export const codeVerificationTemplate = async (code: string, emailTo: string, expiresAt: string) => {
    try {
        const emailHTML = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .email-container {
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #eaeaea;
                }
                .content {
                    padding: 20px 0;
                }
                .code {
                    font-size: 24px;
                    font-weight: bold;
                    color: orange;
                    padding: 10px;
                    border: 1px dashed orange;
                    display: inline-block;
                    margin-bottom: 20px;
                }
                .footer {
                    text-align: center;
                    padding-top: 20px;
                    border-top: 2px solid #eaeaea;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <img 
                        style="background-color: #000; padding: 20px; display: inline-block;"
                        src="https://brickout-assets.s3.eu-west-1.amazonaws.com/1721557548284-Brickous%2BLogo%2BWhite-Orange.png" width="150" alt="Brickous Logo" border="0">
                </div>
                <div class="content">
                    <h1>Confirm Your Account</h1>
                    <p>Please use the following code to confirm your account. Remember, it will expire in ${expiresAt}</p>
                    <div class="code">${code}</div>
                    <p><strong>DO NOT SHARE THIS WITH CODE ANYONE!</strong></p>
                </div>
                <div class="footer">
                    <p>If you did not request this code, please ignore this email.</p>
                    <p>© 2025 Brickous</p>
                </div>
            </div>
        </body>
    </html>
`;

        return await sendTransporter(emailTo, emailHTML);
    } catch (err) {
        logger.error("Error sending confirmation code email:", err);
        return 500;
    }
};

const sendTransporter = async (emailTo: string, emailHTML: string) => {
    try {
        await transporter.sendMail({
            from: '"Brickous Account" <noreply@brickous.com>',
            to: emailTo.toLowerCase(),
            subject: "Your verification code",
            html: emailHTML,
        });
        return 200;
    } catch (err) {
        logger.error("Error sending confirmation code email:", err);
        return 500;
    }
};
