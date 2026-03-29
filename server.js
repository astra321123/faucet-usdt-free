const express = require("express");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const SECRET_KEY = process.env.TURNSTILE_SECRET;

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "tokyopapel557@gmail.com",
        pass: "bmnv pbeb kzwd ewhz"
    }
});

let users = {};

app.post("/claim", async (req, res) => {
    const ip = req.ip;
    const now = Date.now();
    const { wallet, token } = req.body;

    if (!wallet) return res.json({ message: "Enter FaucetPay username or email" });
    if (!token) return res.json({ message: "Captcha token missing" });

    try {
        const captcha = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `secret=${SECRET_KEY}&response=${token}`
        });
        const captchaData = await captcha.json();
        if (!captchaData.success) return res.json({ message: "Captcha failed" });
    } catch (err) {
        console.log("Captcha error:", err);
        return res.json({ message: "Captcha verification error" });
    }

    if (!users[ip]) users[ip] = { count: 0, last: 0, reset: now + 2*60*60*1000 };

    let user = users[ip];
    if (now > user.reset) {
        user.count = 0;
        user.reset = now + 2*60*60*1000;
    }

    if (user.count >= 100) return res.json({ message: "Faucet limit reached. Come back later" });
    if (now - user.last < 60000) return res.json({ message: "Wait 60 seconds", remaining: Math.ceil((60000-(now-user.last))/1000) });

    user.last = now;
    user.count++;

    try {
        await transporter.sendMail({
            from: "tokyopapel557@gmail.com",
            to: "tokyopapel557@gmail.com",
            subject: "New Faucet Claim",
            text: `
User: ${wallet}
IP: ${ip}
Time: ${new Date().toISOString()}
            `
        });

        res.json({ message: "Request sent successfully. Waiting for manual payment ✅", next: 60 });

    } catch (err) {
        console.log(err);
        res.json({ message: "Server error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
