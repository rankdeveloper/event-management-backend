const nodemailer = require("nodemailer");
const Event = require("./models/Event");
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: process.env.USER,
    pass: process.env.PASSWORD,
  },
});

const sendEmail = async function () {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  const events = await Event.find({
    date: { $gte: tomorrow, $lt: dayAfterTomorrow },
  }).populate("attendees");

  for (const event of events) {
    const attendees = event.attendees;
    for (const attendee of attendees) {
      await transporter.sendMail({
        from: process.env.USER,
        to: attendee.email,
        subject: `Reminder: Event ${event.title} is coming soon!`,
        text: `Hey user ,\n\nJust a heads-up: your event  is scheduled on .\nLocation: \n\nDon't forget it!`,
        html: `<!DOCTYPE html>
      <html>
        <body>
          <h1 style="text-align: center; font-color: #ff0000;">Reminder: Event ${event.title} is coming soon!</h1>
          
          <div style="text-align: center; display: flex; flex-direction: column; align-items: center;"> 
            <p style="text-align: center;">Hey user , ${attendee.username}</p>
            <p style="text-align: center;">Just a heads-up: your event  is scheduled on ${event.date}.</p>
            <p style="text-align: center;">Location: ${event.location}</p>
            <p style="text-align: center;">Don't forget it!</p>
          </div>
          <img src="${event.image}" alt="Event Image" style="display: block; margin: 0 auto; max-width: 50%; height: auto;">
        </body>
      </html>`,
      });
    }
  }
};

module.exports = { sendEmail };
