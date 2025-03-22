import {createTransport} from "nodemailer"


const transporter = createTransport({
    service: "gmail",
    auth: {
        user: process.env.GOOGLE_EMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD
    }
})



export const SendMail  = async(email : string , url : string)=>{
    

    const mailOptions = {
        from: process.env.GOOGLE_EMAIL,
        to: email,
        subject: "OTP Verification",
        text: `http://localhost:5173/user/verify/${url}`
    }

    await transporter.sendMail(mailOptions)

    console.log(`Mail is transferred successfully to ${email}`)

}