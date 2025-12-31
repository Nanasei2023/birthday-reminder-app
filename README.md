# Birthday Reminder App

A Node.js app that collects users’ birthdays, stores them in MongoDB, and automatically sends birthday emails daily using Nodemailer and a cron job.

## Features
- Collect username, email, and date of birth
- MongoDB database storage
- Daily automated birthday emails
- Prevents duplicate emails
- Secure environment variables using `.env`

## Setup
1. Clone the repo
2. Install dependencies: `npm install`
3. Create `.env` file with your credentials
4. Run the app: `node index.js`
