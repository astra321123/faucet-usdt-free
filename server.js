const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());
app.use(express.static("public"));

// خليه متغيرات بيئية على Railway
const SECRET_KEY = process.env.TURNSTILE_SECRET;
const API_KEY = process.env.FAUCETPAY_KEY;

let users = {};

app.post("/claim", async (req, res) => {

    const ip = req.ip;
    const now = Date.now();
    const {wallet, token} = req.body;

    // تحقق كابتشا
    const captcha = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method:"POST",
        headers:{"Content-Type":"application/x-www-form-urlencoded"},
        body:`secret=${SECRET_KEY}&response=${token}`
    });

    const captchaData = await captcha.json();

    if (!captchaData.success) {
        return res.json({message:"Captcha failed"});
    }

    if (!users[ip]) {
        users[ip] = {count:0,last:0,reset:now + (2*60*60*1000)};
    }

    let user = users[ip];

    if (now > user.reset) {
        user.count = 0;
        user.reset = now + (2*60*60*1000);
    }

    if (user.count >= 100) {
        return res.json({message:"انتهى الصنبور ارجع بعد ساعتين"});
    }

    if (now - user.last < 60000) {
        return res.json({message:"انتظر دقيقة"});
    }

    user.last = now;
    user.count++;

    try {
        const pay = await fetch("https://faucetpay.io/api/v1/send", {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({
                api_key: API_KEY,
                to: wallet,
                amount: 0.00002500,
                currency: "USDT"
            })
        });

        res.json({message:"تم الدفع 💸"});
    } catch {
        res.json({message:"خطأ بالسيرفر"});
    }
});

// استخدم PORT من Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));