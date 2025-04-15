async function main() {
  try{

const Discord = require('discord.js');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const csv = require('csv-parser');
const croncrom = require('node-cron');
process.env.TZ = 'Asia/Kolkata';
const nodemailer = require('nodemailer');
const os = require('os');
const axios = require('axios');

//port connection
const express = require('express')
const app = express()
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Server running${port}`)
})

//discord message access
const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildMessageTyping,
    Discord.GatewayIntentBits.DirectMessages,
    Discord.GatewayIntentBits.DirectMessageTyping
  ]
});

// email service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ffguildmahadev@gmail.com',
    pass: 'twxb gtqb fgbu aqdp'
  }
});

// auth cofig
require('dotenv').config();
const authJson = require('./auth.json');
const status = require('./status.json');
const token = process.env.token;
const authid = authJson.admins.authIds;

const limit = process.env.limit;
//bot version
const version = authJson.version['Bot-Version'].Stable;
const betaVersion =authJson.version['Beta-Version'].vBeta;


//bot is ready message
client.on('ready', async () => {
  console.log('Bot is ready!');
  const channel = client.channels.cache.get(authJson.channels.pvtcmd);
  if (channel) {
    channel.send('I am online!');
    console.log(`Stable Version: \x1b[32m${version}\x1b[0m`);
    //permisson code
      if(authJson.properties.commands === 'true'){
        console.log('\x1b[32m%s\x1b[0m', 'COMMAND ACTIVED');

      }else{
        console.log('\x1b[31m%s\x1b[0m', 'Commands are off!');
      }

  } else {
    console.log('Channel not found!');
  }
});

//google sheet data access
const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  keyFile: 'accessGoogle.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

const guildSheetId = '1rJXTakiLUhcT4FAm-fkweWYxMutYFwCFqCVG3BbY1pE';

const getSheetData = async (range) => {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: guildSheetId,
      range,
    });
    return res.data.values;
  } catch (err) {
    console.error(err);
    return null;
  }
};

const writeSheetData = async (range, data) => {
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: guildSheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: { values: data },
    });
  } catch (err) {
    console.error(err);
  }
};

auth.getClient().then((client) => {
  console.log('Database is connected successfully!');
}).catch((err) => {
  console.log('No connection');
});


//DATABASE RANGE 
const range = 'pass!A:K';
const guildRange = 'guild!A:X';
const graph = 'graph!A:B';


//GUILD SHEET COLOMS
const columns = {
  SR_NO: 0,
  UID: 1,
  PLAYER_NAME: 2,
  JOIN_DATE: 3,
  METHOD: 4,
  RANK: 5,
  STATUS: 6,
  DEAFULT_SCYN: 7,
  REASON: 8,
  LEAVE_DATE: 9,
  KICKED_SCORE: 10,
  KICKED_STATUS: 11,
  LAST_TOTAL_POINTS: 12,
  CURRENT_TOTAL_POINTS: 13,
  THIS_WEEK_WAR_TOTAL_POINTS: 14,
  LAST_WEEK_WAR_TOTAL_POINTS: 15,
  POINTS:16,
  POINTS_WAR: 17,
  REQUEST_FOR_TEMPORARY_BREAK: 18,
  CHANGE_NAME: 19,
  GUILDMATES_FRIEND: 20,
  TOTAL_DAYS: 21,
  MIN_POINTS: 22,
  POINTS_LIMIT: 23,
};

//pass coloms
const passcolomn = {
  User_ID: 0,
  UID: 1,
  Password: 2,
  Email: 3,
  OTP: 4,
  TIME: 5,
  STATUS: 6,
  NEW_PASSWORD: 7,
  FORGOT_STATUS: 8,
  PURPOSE: 9,
  OLD_USER_ID: 10 ,
}


//BOT STATUS 
client.on('ready', async () => {
  const updatePlayers = async () => {
    let totalPlayers = 0;
    let bannedPlayers = 0;
    const data = await getSheetData(guildRange);
    if (data === null) {
      console.error("Data is null");
      return;
    }
    const columns = data[0].reduce((acc, header, index) => {
      acc[header.trim().toLowerCase()] = index;
      return acc;
    }, {});
    data.slice(1).forEach((row, index) => {
      if (row[columns['status']].trim().toLowerCase() === 'in guild') {
        totalPlayers++;
      }
      if (row[columns['kicked score']].trim() >= 10) {
        bannedPlayers++;
      }
    });
    if (status.activityStatus[0] === "false") {
      client.user.setActivity({ name: `Bot is currently in localhost server Dont use sensitive commands\nBeta version: ${betaVersion}`, type: 2 });
    } else {
      client.user.setActivity({ name: `GUILD PLAYERS: ${totalPlayers}\nVersion: ${version}`, type: 3 });
    }
  };
  await updatePlayers();
  setInterval(updatePlayers, 60000); // 1 minute par update karega
});



//command interactiuons code



client.on('interactionCreate', async interaction => {
  const username = interaction.user.id;
  if (authJson.properties.commands === 'true' || authid.includes(username)) {
    if (!interaction.isCommand()) return;
    const logMessage = `[${new Date().toLocaleString()}] ${interaction.user.username} (${interaction.user.id}) used command: ${interaction.commandName}`;
    console.log(logMessage);
    const today = new Date();
    const logDate = `${today.toLocaleString('default', { month: 'short' })}-${today.getDate()}-${today.getFullYear()}`;
    const logFilePath = `logs/${logDate}.txt`;
    fs.mkdirSync('logs', { recursive: true });
    fs.appendFileSync(logFilePath, logMessage + '\n');
    const logChannel = client.channels.cache.get(authJson.channels.console);
    if (!logChannel) return console.error('Log channel not found!');
    logChannel.send(logMessage);

//PING COMMAND 

if (interaction.commandName === 'ping') {
  try {
    const startTime = Date.now();
    await interaction.deferReply();
    const endTime = Date.now();
    const latency = endTime - startTime;
    const ping = Math.floor(latency/39);
    const uptime = process.uptime();
    const seconds = Math.floor(uptime % 60);
    const minutes = Math.floor((uptime % 3600) / 60);
    const hours = Math.floor(uptime / 3600);
    let uptimeString = '';
    if (hours > 0) uptimeString += `${hours} hour${hours > 1 ? 's' : ''} `;
    if (minutes > 0) uptimeString += `${minutes} minute${minutes > 1 ? 's' : ''} `;
    if (seconds > 0 || uptimeString === '') uptimeString += `${seconds} second${seconds > 1 ? 's' : ''}`;
    const currentDate = new Date();
    const currentDateString = `${currentDate.toLocaleString('en-US', { weekday: 'long' })}, ${currentDate.getDate()} ${currentDate.toLocaleString('en-US', { month: 'long' })} ${currentDate.getFullYear()} ${currentDate.toLocaleTimeString('en-US', { hour12: true })}`;
    interaction.editReply({ content: `Pong! Latency: ${Math.floor(ping)}ms\nUptime: ${uptimeString}\nCurrent Date and Time: ${currentDateString}`, ephemeral: true });
  } catch (error) {
    console.error(error);
    interaction.editReply('Error: Something went wrong!');
  }
}


//GUILD INFO COMMAND

if (interaction.commandName === 'guild_info') {
  try {
    await interaction.deferReply();
    const guildName = process.env.name;
    const guildLevel = process.env.level;
    let guildLeader = '';
    let totalPlayers = 0;
    let bannedPlayers = 0;
    const data = await getSheetData(guildRange);
    const headers = data[0];
    const columns = {
      'UID': headers.findIndex(header => header.trim().toLowerCase() === 'uid'),
      'PLAYER NAME': headers.findIndex(header => header.trim().toLowerCase() === 'player name'),
      'RANK': headers.findIndex(header => header.trim().toLowerCase() === 'rank'),
      'STATUS': headers.findIndex(header => header.trim().toLowerCase() === 'status'),
      'KICKED SCORE': headers.findIndex(header => header.trim().toLowerCase() === 'kicked score'),
    };
    if (Object.values(columns).includes(-1)) {
      await interaction.editReply('Error: One or more columns not found!');
      return;
    }
    data.slice(1).forEach((row) => {
      if (row[columns['RANK']].trim().toLowerCase() === 'leader') {
        guildLeader = row[columns['PLAYER NAME']].trim();
      }
      if (row[columns['STATUS']].trim().toLowerCase() === 'in guild') {
        totalPlayers++;
      }
      if (row[columns['KICKED SCORE']].trim() >= 10) {
        bannedPlayers++;
      }
    });
    const reply = ` ❤️‍🔥**Guild Name:** ${guildName}\n\n⚓**Guild Level:** ${guildLevel}\n\n👤**Guild Leader:** ${guildLeader}\n\n🎮**Total Players:** ${totalPlayers}\n\n🚫**Banned Players:** ${bannedPlayers} `;
    await interaction.editReply(reply);
  } catch (error) {
    console.error(error);
    await interaction.editReply('Error: Unable to retrieve guild info!');
  }
}


//UID COMMAND 

if (interaction.commandName === 'uid') {
  try {
    await interaction.deferReply();
    const userId = interaction.user.id;
    const uidd = interaction.options.getString('uid');
    const data = await getSheetData(guildRange);
    if (!data) {
      await interaction.editReply('Error: Data not found!');
      return;
    }
    const passData = await getSheetData(range);
    let uid = null;
    if (!uidd) {
      passData.forEach((row) => {
        if (row[0].trim() === userId.trim()) {
          uid = row[1].trim();
        }
      });
      if (!uid) {
        await interaction.editReply('Please register your UID using /uid-register otherwise enter your uid');
        return;
      }
    } else {
      uid = uidd;
    }
    let reply = 'UID not found!';
    data.forEach((row) => {
      if (row[1] && row[1].trim() === uid.trim()) {
        const status = row[6] && row[6].trim();
        if (status && status.toLowerCase() === 'kicked') {
          reply = `**\`\`\`🪪UID: ${row[1]}\n\n👤Player Name: ${row[2]}\n\n🗓️Join Date: ${row[3]}\n\n🔗Method: ${row[4]}\n\n📊Rank: ${row[5]}\n\n🌐Status: ${row[6]}\n\n📮Reason: ${row[columns.REASON]}\n\n🗂️Leave Date: ${row[Column.LEAVE_DATE]}\n\n🎲Kicked Score: ${row[10]}\n\n📌Kicked Status: ${row[11]}\n\n🕛TOTAL DAYS: ${row[21]}\n\n📋Current Total Points: ${row[13]}\n\n📃Points: ${row[16]}\n\n👥Guildmates Friend: ${row[20]}\`\`\`**`;
        } else {
          reply = `**\`\`\`🪪UID: ${row[1]}\n\n👤Player Name: ${row[2]}\n\n🗓️Join Date: ${row[3]}\n\n🔗Method: ${row[4]}\n\n📊Rank: ${row[5]}\n\n🌐Status: ${row[6]}\n\n📋Current Total Points: ${row[13]}\n\n📃Points: ${row[16]}\n\n👥Guildmates Friend: ${row[20]}\n\n🕛TOTAL DAYS: ${row[21]}\n\n⚠️MIN POINTS: ${row[22]}\`\`\`**`;
        }
      }
    });
    if (reply === 'UID not found!') {
      await interaction.editReply('Please try entering your UID again');
    } else {
      await interaction.editReply(reply);
    }
  } catch (error) {
    console.error(error);
    await interaction.editReply('Please enter your UID!');
  }
}


//garph command code

if (interaction.commandName === 'graph') {
  try {
    const { AttachmentBuilder } = require('discord.js');
    await interaction.deferReply();
    const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSat8_z24WruBFQ5R_c_JEt2mcuLFYLixRmOjYVkWca1YA9e3ldMMkQVaTatxi7v8GsRlNW2oeu59mm/pubchart?oid=1140117903&format=image';
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'Accept-Encoding': 'identity'
      }
    });
    const buffer = Buffer.from(response.data, 'binary');
    const attachment = new AttachmentBuilder(buffer, { name: 'graph.png' });
    await interaction.editReply({ files: [attachment] });
  } catch (error) {
    console.error(error);
    await interaction.editReply('Error: Unable to retrieve graph!');
  }
}

//GARPH POINTS ADD COMMAND CODE

if (interaction.commandName === 'weekly-points') {
  if (authid.includes(username)) {
    try {
      await interaction.deferReply({ ephemeral: false });
      // Get points from interaction options
      const points = interaction.options.getInteger('points');
      // Get current date
      const date = new Date();
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      // Get Google Sheets data
      const sheetData = await getSheetData(graph);
      // Append data to Google Sheets
      const newRow = [formattedDate, points];
      sheetData.push(newRow);
      await writeSheetData(graph, sheetData);
      interaction.editReply(`Points saved successfully!`);
    } catch (error) {
      console.error(error);
      interaction.editReply('Error occurred while processing weekly points request.');
    }
  } else {
    interaction.reply({ content: 'Error: You do not have permission to access this feature!', ephemeral: true });
  }
}

//edit points 
if (interaction.commandName === 'edit_points') {
  try {
    await interaction.deferReply();
    const userId = interaction.user.id;
    const setTotalPoints = interaction.options.getInteger('your_total_points');
    const today = new Date();
    const day = today.getDay();
    const hours = today.getHours();
    const minutes = today.getMinutes();

    if (day === 1 && (hours >= 4 && hours < 23)) {
      await interaction.editReply('YOUR POINTS CANNOT BE UPDATE BECAUSE OF DATABASE CALCULATE POINTS NOW YOU CAN TRY AFTER 11 PM');
      return;
    }

    const passData = await getSheetData(range);
    let uid = null;

    passData.forEach((row) => {
      if (row[0].trim() === userId.trim()) {
        uid = row[1].trim();
      }
    });

    if (!uid) {
      await interaction.editReply({
        content: 'User ID not found!',
        ephemeral: true,
      });
      return;
    }

    const data = await getSheetData(guildRange);

    
    data.forEach(async (row) => {
      if (row[columns.UID].trim() === uid.trim()) {
        const status = row[columns.STATUS].trim();

        if (status.toLowerCase() === 'kicked') {
          await interaction.editReply({
            content: 'You cannot edit the points because the player is not in the guild.',
            ephemeral: true,
          });
          return;
        }

        const pointsDiff = setTotalPoints - parseInt(row[columns.CURRENT_TOTAL_POINTS]);
        const pointsLimit = parseInt(row[columns.POINTS_LIMIT]);

        if (pointsDiff <= pointsLimit) {
          row[columns.CURRENT_TOTAL_POINTS] = setTotalPoints.toString();
          row[columns.POINTS] = (parseInt(row[columns.POINTS]) + pointsDiff).toString();
          row[columns.POINTS_LIMIT] = (pointsLimit - pointsDiff).toString();

          await writeSheetData(guildRange, data);

          await interaction.editReply({
            content: `Points updated successfully! The current total points for UID ${uid} are now: ${setTotalPoints} and your points: ${pointsDiff}. Points limit updated: ${row[columns.POINTS_LIMIT]}`,
            ephemeral: true,
          });
        } else {
          const requirePoints = pointsDiff - pointsLimit;

          await interaction.editReply({
            content: `Points are out of limit! You can't add more points than the limit.`,
            ephemeral: true,
          });

          const targetUser = client.users.cache.get('636802010066190346');

          if (!targetUser) {
            client.users.fetch('636802010066190346').then((user) => {
              user.send(`Points are out of limit for UID: ${uid} (Player Name: ${row[columns.PLAYER_NAME]}). Please add ${requirePoints} Points`);
            }).catch((error) => {
              console.error(error);
            });
          } else {
            targetUser.send(`Points are out of limit for UID: ${uid} (Player Name: ${row[columns.PLAYER_NAME]}). Please add ${requirePoints} Points`);
          }
        }
      }
    });
  } catch (error) {
    console.error(error);
    await interaction.editReply({
      content: 'An error occurred!',
      ephemeral: true,
    });
  }
}

//uid register code
if (interaction.commandName === 'uid-regester') {
  try {
    await interaction.deferReply({ ephemeral: true });
    const uid = interaction.options.getString('uid');
    const password = interaction.options.getString('password');
    const yourEmailId = interaction.options.getString('email');
    const userIDacc = interaction.user.id;
    const channelID = authJson.channels['apply-register-forgot'];

    if (interaction.channelId !== channelID) {
      interaction.editReply('Please use this command in the #📝┃ᴀᴘᴘʟʏ-ʀᴇɢɪsᴛʀᴀᴛɪᴏɴ-ᴠᴇʀɪғʏ channel.');
      return;
    }

    const guildRange = 'guild!A:X';
    const guildData = await getSheetData(guildRange);
    const existingUidInGuild = guildData.find((row) => row[1].trim() === uid.trim());

    if (!existingUidInGuild) {
      interaction.editReply({
        content: 'Error: UID not found in our guild database!',
        ephemeral: true,
      });
      return;
    }

    const status = existingUidInGuild[6].trim().toUpperCase();

    if (status !== 'IN GUILD') {
      interaction.editReply({
        content: 'Before registering, please join the guild first.',
        ephemeral: true,
      });
      return;
    }

    const passRange = 'pass!A:K';
    const passData = await getSheetData(passRange);
    const existingUidInPass = passData.find((row) => row[1].trim() === uid.trim());
    const existingUseridInPass = passData.find((row) => row[0].trim() === userIDacc.trim());

    if (existingUidInPass || existingUseridInPass) {
      interaction.editReply({
        content: 'Error: UID already registered!',
        ephemeral: true,
      });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const newRow = [
      userIDacc,
      uid,
      password,
      yourEmailId,
      otp,
      new Date().toLocaleTimeString('en-GB', { hour12: false }),
      'NOT VERIFIED',
      'none',
      'none',
      'register',
      userIDacc,
    ];

    passData.push(newRow);

    await writeSheetData(passRange, passData);

    const mailOptions = {
      from: '"Guild"<ffguildmahadev@gmail.com>',
      to: yourEmailId,
      subject: 'EMAIL VERIFICATION REQUEST!',
      html: `<html>
      <body style="font-family: sans-serif; background-color: #f0f0f0; background-image: linear-gradient(to bottom, #f0f0f0, #e0e0e0); padding: 20px; text-align: center;">
      <div style="max-width: 600px; margin: 0 auto; text-align: left; background-color: #ffffff; padding: 20px; border: 1px solid #dddddd; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
      <header style="background-color: #333; color: #ffffff; padding: 10px; text-align: center; border-bottom: 1px solid #dddddd; font-family: sans-serif;">
      <h1 style="font-size: 24px; font-weight: bold;">EMAIL VERIFICATION</h1>
      </header>
      <div style="padding: 20px;">
      <p style="color: #000; font-size: 13px; font-weight: bold;">WE ARE RECEVIED YOUR REQUEST OF REGISTRATION TO BIND YOUR GAME UID ${uid} AND DISCORD USER ID ${userIDacc}</p>
      <p style="color: #000; font-size: 13px; font-weight: bold;">TO VERIFY YOUR EMAIL ${yourEmailId} USE /verify AND ENTER THE OTP. THIS OTP WILL EXPIRE IN 10 MINUTES.</p>
      <p style="color: #000; font-size: 13px; font-weight: bold;">IF YOU CANT ABLE TO VERIFY YOUR EMAIL THEN AFTER 10 MINUTS YOUR DETAILS WILL BE TERMINATED</p>
      <p style="color: #000; font-size: 16px; font-weight: bold;">YOUR OTP: ${otp}</p>
      <p style="color: #000; font-size: 12px; text-align: right; font-weight: bold;">SINCERELY,</p>
      <p style="color: #000; font-size: 12px; text-align: right; font-weight: bold;">IGL BOT</p>
      </div>
      </div>
      </body>
      </html>`,
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
    
    interaction.editReply({
      content: '**Please check your email we send you and OTP after getting OTP use /verify to verify your registration. Else your registration has been deleted by automatically after 10 minutes**',
      ephemeral: true,
    });
  
} catch (error) {
console.error(error);
interaction.editReply({ content: 'Error: Something went wrong!', ephemeral: true });
}
}
 
//code for forgot password
if (interaction.commandName === 'forgot-password') {
  try {
    await interaction.deferReply({ ephemeral: true });
    const uid = interaction.options.getString('uid');
    const newPassword = interaction.options.getString('new-password');
    const channelID = authJson.channels['apply-register-forgot'];

    if (interaction.channelId !== channelID) {
      interaction.editReply('Please use this command in the #📝┃ᴀᴘᴘʟʏ-ʀᴇɢɪsᴛʀᴀᴛɪᴏɴ-ᴠᴇʀɪғʏ channel.');
      return;
    }

    const guildData = await getSheetData(guildRange);
    const existingUidInGuild = guildData.find((row) => row[columns.UID].trim() === uid.trim());

    if (!existingUidInGuild) {
      await interaction.editReply({ content: 'Error: UID not found in our guild database!', ephemeral: true });
      return;
    }

    const status = existingUidInGuild[columns.STATUS].trim().toUpperCase();

    if (status !== 'IN GUILD') {
      await interaction.editReply({ content: 'Before forgot the password, please join the guild first.', ephemeral: true });
      return;
    }

    const passData = await getSheetData(range);
    const userRow = passData.find((row) => row[passcolomn.UID].trim() === uid.trim());

    if (!userRow) {
      await interaction.editReply({ content: 'UID invalid', ephemeral: true });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const currentTime = new Date().toLocaleTimeString('en-GB', { hour12: false });

    const updatedPassData = passData.map((row) => {
      if (row[passcolomn.UID].trim() === uid.trim()) {
        row[passcolomn.NEW_PASSWORD] = newPassword;
        row[passcolomn.FORGOT_STATUS] = 'PROCESS';
        row[passcolomn.OTP] = otp.toString();
        row[passcolomn.TIME] = currentTime;
        row[passcolomn.PURPOSE] = 'forgot';
      }
      return row;
    });

    await writeSheetData(range, updatedPassData);

    const useridname = interaction.user.username;
    const userIDacc = interaction.user.id;
    const email = userRow[passcolomn.Email].trim();

    const mailOptions = {
      from: '"Guild"<ffguildmahadev@gmail.com>',
      to: email,
      subject: 'FORGOT PASSWORD',
      html: `
              <html>
                <body style="font-family: sans-serif; background-color: #f0f0f0; background-image: linear-gradient(to bottom, #f0f0f0, #e0e0e0); padding: 20px; text-align: center;">
                  <div style="max-width: 600px; margin: 0 auto; text-align: left; background-color: #ffffff; padding: 20px; border: 1px solid #dddddd; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
                    <header style="background-color: #333; color: #ffffff; padding: 10px; text-align: center; border-bottom: 1px solid #dddddd; font-family: sans-serif;">
                      <h1 style="font-size: 24px; font-weight: bold;">RESET PASSWORD</h1>
                    </header>
                    <div style="padding: 20px;">
                      <p style="color: #000; font-size: 13px; font-weight: bold;">WE ARE RECEVIED YOUR REQUEST OF PASSWORD RESET OF YOUR GAME UID:${uid}</p>
                      <p style="color: #000; font-size: 13px; font-weight: bold;">THIS REQUEST IS GENERATED FROM DISCORD USER:${useridname}  DISCORD USER ID:${userIDacc}</p>
                      <p style="color: #000; font-size: 13px; font-weight: bold;">IF THIS REQUEST IS NOT GENERATED BY YOU THE REPORT US THIS USER AND USER ID ON THIS MAIL ffguildmahadev@gmail.com</p>
                      <p style="color: #000; font-size: 13px; font-weight: bold;">OTHERWISE YOU CAN USE /verify TO VERIFY THIS OTP.THE OTP WILL EXPIRE IN 10 MINUTES.</p>
                      <p style="color: #000; font-size: 16px; font-weight: bold;">YOUR OTP: ${otp}</p>
                      <p style="color: #000; font-size: 12px; text-align: right; font-weight: bold;">SINCERELY,</p>
                      <p style="color: #000; font-size: 12px; text-align: right; font-weight: bold;">IGL BOT</p>
                    </div>
                  </div>
                </body>
              </html>`
            
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

      await interaction.editReply({ content: 'OTP sent to your email. Please verify it.', ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: 'An error occurred. Please contact the guild leader.', ephemeral: true });
    }
  }

//verify command code
if (interaction.commandName === 'verify') {
  try {
    await interaction.deferReply({ ephemeral: true });
    const otp = interaction.options.getString('otp');
    const uid = interaction.options.getString('uid');
    const userIDacc = interaction.user.id;
    const channelID = authJson.channels['apply-register-forgot'];

    if (interaction.channelId !== channelID) {
      interaction.editReply('Please use this command in the #📝┃ᴀᴘᴘʟʏ-ʀᴇɢɪsᴛʀᴀᴛɪᴏɴ-ᴠᴇʀɪғʏ channel.');
      return;
    }

    const passData = await getSheetData(range);
    let userRow;
    if(uid){
      userRow = passData.find((row) => row[passcolomn.UID] === uid);
    }else{
      userRow = passData.find((row) => row[passcolomn.User_ID] === userIDacc);
    }

    if (!userRow) {
      if (uid) {
        interaction.editReply({ content: 'UID not found.', ephemeral: true });
      } else {
        interaction.editReply({ content: 'User ID not match. Please try enter UID.', ephemeral: true });
      }
      return;
    }

    const purpose = userRow[passcolomn.PURPOSE].trim().toLowerCase();

    if (purpose === 'register') {
      if (userRow[passcolomn.STATUS] === 'VERIFIED') {
        interaction.editReply({ content: 'You are already verified.', ephemeral: true });
        return;
      }

      if (userRow[passcolomn.OTP] === otp) {
        userRow[passcolomn.STATUS] = 'VERIFIED';

        if (uid && userRow[passcolomn.User_ID] !== userIDacc) {
          userRow[passcolomn.User_ID] = userIDacc;
        }

        await writeSheetData(range, passData);

        const guildData = await getSheetData(guildRange);
        const guildRow = guildData.find((row) => row[columns.UID] === userRow[passcolomn.UID]);

        if (guildRow) {
          const playerName = guildRow[columns.PLAYER_NAME];
          const pluid = guildRow[columns.UID];

          if (interaction.member) {
            interaction.member.setNickname(`${playerName}`)
              .then(() => {
                console.log(`User ${interaction.user.id} nickname is changed to: ${playerName}`);
              })
              .catch((error) => {
                console.error(`User ${interaction.user.id} nickname was not change because of: ${error.message}`);
              });

            const guildMemberRoleId = '1285469617996828773';
            interaction.member.roles.add(guildMemberRoleId)
              .then(() => {
                console.log(`User ${interaction.user.id} was get the role of: ${guildMemberRoleId}`);
              })
              .catch((error) => {
                console.error(`User ${interaction.user.id} has not get the role because of: ${error.message}`);
              });
          }
          const formattedDate = `${new Date().getDate().toString().padStart(2, '0')}-${new Date().toLocaleString('default', { month: 'long' })}-${new Date().getFullYear()}`;

          const email = userRow[passcolomn.Email];
          const subject = 'Account Verified!';
          const html = '';
          const mailOptions = {
            from: '"Guild"<ffguildmahadev@gmail.com>',
            to: email,
            subject: subject,
            html: `<html>
                                        <body style="font-family: sans-serif; background-color: #f0f0f0; background-image: linear-gradient(to bottom, #f0f0f0, #e0e0e0); padding: 20px; text-align: center;">
                                          <div style="max-width: 600px; margin: 0 auto; text-align: left; background-color: #ffffff; padding: 20px; border: 1px solid #dddddd; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
                                            <header style="background-color: #333; color: #ffffff; padding: 10px; text-align: center; border-bottom: 1px solid #dddddd; font-family: sans-serif;">
                                              <h1 style="font-size: 24px; font-weight: bold;">VERIFICATION CERTIFICATE</h1>
                                            </header>
                                            <div style="padding: 20px;">
                                              <p style="color: #000; font-size: 14px; font-weight: bold;">HELLO, ${playerName}</p>
                                              <p style="color: #000; font-size: 10px; font-weight: bold;">YOUR GAME UID HAS BEEN SUCCESSFULLY BOUND TO YOUR DISCORD ACCOUNT. YOU CAN NOW USE THE /EDIT_POINTS COMMAND.</p>
                                              <p style="color: #000; font-size: 10px; font-weight: bold;">ADDITIONALLY, YOU HAVE BEEN ADDED TO THE GUILD MEMBERS SECTION OF OUR DISCORD SERVER, AND YOUR DISCORD NAME HAS BEEN UPDATED TO MATCH YOUR IN-GAME NAME.</p>
                                              <p style="color: #000; font-size: 10px; font-weight: bold;">WE RECOMMEND READING THE RULE BOOK FOR FURTHER INFORMATION.</p>
                                              <p style="color: #000; font-size: 12px; font-weight: bold;">DISCORD ID: ${userIDacc}</p>
                                              <p style="color: #000; font-size: 12px; font-weight: bold;">GAME ID: ${pluid}</p>
                                              <p style="color: #000; font-size: 10px; text-align: right; font-weight: bold;">SINCERELY,</p>
                                              <p style="color: #000; font-size: 10px; text-align: right; font-weight: bold;">IGL BOT</p>
                                              <p style="color: #000; font-size: 10px; text-align: right; font-weight: bold;">DATE OF VERIFICATION</p>
                                              <p style="color: #000; font-size: 10px; text-align: right; font-weight: bold;">${formattedDate}</p>
                                              <div style="text-align: center; margin-top: 20px;">
                                                <a href="https://drive.google.com/file/d/1Y8tBhenH6MSyiWQ-T6EnzoRpGS2-bwEK/view?usp=sharing" target="_blank">
                                                  <button style="background-color: #060fc5; color: #ffffff; font-size: 16px; font-weight: bold; border: none; padding: 15px 30px; cursor: pointer; border-radius: 10px;">GUILD RULES</button>
                                                </a>
                                              </div>
                                            </div>
                                          </div>
                                        </body>
                                      </html>`

          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });

          interaction.editReply({ content: `Verified successfully! Your status has been updated to VERIFIED.`, ephemeral: true });
        } else {
          console.log('Error: Guild data not found.');
          interaction.editReply({ content: `Error: Guild data not found.`, ephemeral: true });
        }
      } else {
        interaction.editReply({ content: 'Invalid OTP. Please try again.', ephemeral: true });
      }
    } else if (purpose === 'forgot') {
      if (userRow[passcolomn.FORGOT_STATUS] === 'DONE') {
        interaction.editReply({ content: 'Your password is already updated.', ephemeral: true });
      } else if (userRow[passcolomn.FORGOT_STATUS] === 'PROCESS') {
        if (userRow[passcolomn.OTP] === otp) {
          userRow[passcolomn.OLD_USER_ID] = userRow[passcolomn.User_ID];
          userRow[passcolomn.Password] = userRow[passcolomn.NEW_PASSWORD];
          userRow[passcolomn.FORGOT_STATUS] = 'DONE';
          userRow[passcolomn.User_ID] = interaction.user.id;
    
          await writeSheetData(range, passData);
    
          const guildData = await getSheetData(guildRange);
          let guildRow = guildData.find((row) => row[columns.UID] === userRow[passcolomn.UID]);
    
          if (guildRow) {
            const playerName = guildRow[columns.PLAYER_NAME];
    
            if (interaction.member) {
              interaction.member.setNickname(`${playerName}`)
                .then(() => {
                  console.log(`User ${interaction.user.id} nickname is changed to: ${playerName}`);
                })
                .catch((error) => {
                  console.error(`User ${interaction.user.id} nickname was not change because of: ${error.message}`);
                });
    
              const guildMemberRoleId = '1285469617996828773';
              interaction.member.roles.add(guildMemberRoleId)
                .then(() => {
                  console.log(`User ${interaction.user.id} was get the role of: ${guildMemberRoleId}`);
                })
                .catch((error) => {
                  console.error(`User ${interaction.user.id} has not get the role because of: ${error.message}`);
                });
            }
    
            interaction.editReply({ content: 'Password and nickname updated successfully!', ephemeral: true });
          } else {
            console.log('Error: Guild data not found.');
            interaction.editReply({ content: `Error: Guild data not found.`, ephemeral: true });
          }
        } else {
          interaction.editReply({ content: 'Invalid OTP. Please try again.', ephemeral: true });
        }
      } else {
        interaction.editReply({ content: 'You didn\'t send request for update password.', ephemeral: true });
      }
    }
    
     else {
      interaction.editReply({ content: 'Invalid purpose. Please try again.', ephemeral: true });
    }
  } catch (error) {
    console.error(error);
    interaction.editReply({ content: 'Error: Something went wrong!', ephemeral: true });
  }
}

// Add player command
if (interaction.commandName === 'add_new_player') {
  try {
    await interaction.deferReply();
    const uid = interaction.options.getString('uid');
    const playerName = interaction.options.getString('player_name');
    const today = new Date();
    const joinDate = `${today.toLocaleString('default', { month: 'short' })}-${today.getDate()}-${today.getFullYear()}`;
    const method = interaction.options.getString('method');
    const guildmatesFriends = interaction.options.getString('guildmates_friends');

    if (authid.includes(username)) {
      const guildData = await getSheetData(guildRange);

      const existingUid = guildData.find((row) => row[columns.UID] === uid);

      if (existingUid) {
        if (existingUid[columns.STATUS] === 'KICKED') {
          if (existingUid[columns.KICKED_SCORE] === '10') {
            interaction.editReply(`This player is banned from the guild. You cannot add this player.`);
            return;
          }

          existingUid[columns.PLAYER_NAME] = playerName;
          existingUid[columns.JOIN_DATE] = joinDate;
          existingUid[columns.METHOD] = method;
          existingUid[columns.RANK] = 'MEMBER';
          existingUid[columns.STATUS] = 'IN GUILD';
          existingUid[columns.DEFAULT_SCYN] = 'FF';
          existingUid[columns.GUILDMATES_FRIEND] = guildmatesFriends;

          // Yeh columns ko update nahi karenge agar unke values blank hain
          if (existingUid[columns.REASON] !== "") {
            // kuch nahi karna hai
          } else {
            existingUid[columns.REASON] = "";
          }

          if (existingUid[columns.LEAVE_DATE] !== "") {
            // kuch nahi karna hai
          } else {
            existingUid[columns.LEAVE_DATE] = "";
          }

          if (existingUid[columns.KICKED_SCORE] !== "") {
            // kuch nahi karna hai
          } else {
            existingUid[columns.KICKED_SCORE] = "";
          }

          if (existingUid[columns.KICKED_STATUS] !== "") {
            // kuch nahi karna hai
          } else {
            existingUid[columns.KICKED_STATUS] = "";
          }

          // Yeh columns ko update karenge agar unke values milte hain
          existingUid[columns.LAST_TOTAL_POINTS] = '0';
          existingUid[columns.CURRENT_TOTAL_POINTS] = '0';
          existingUid[columns.THIS_WEEK_WAR_TOTAL_POINTS] = '0';
          existingUid[columns.LAST_WEEK_WAR_TOTAL_POINTS] = '0';
          existingUid[columns.POINTS] = '0';
          existingUid[columns.WAR_POINTS] = '0';
          existingUid[columns.REQUEST_FOR_TEMPORARY_BREAK] = 'NO';
          existingUid[columns.CHANGE_NAME] = 'NO';
          existingUid[columns.TOTAL_DAYS] = '0';
          existingUid[columns.MIN_POINTS] = '0'

          await writeSheetData(guildRange, guildData);

          const channel = client.channels.cache.get(authJson.channels['guild-aleart']);
          if (channel) {
            channel.send(`**\`\`\`😁 ${playerName} Welcome Back TO The Guild 🫂\`\`\`**`);
            interaction.editReply(`${uid} player name ${playerName} added`);
          } else {
            console.error('Channel not found!');
          }
        } else if (existingUid[columns.STATUS] === 'IN GUILD') {
          interaction.editReply('Error: UID is already in guild!');
        } else {
          interaction.editReply('Error: UID is not kicked or in guild!');
        }
      } else {
        const newRow = [
           guildData.length + 1,
           uid,
           playerName,
           joinDate,
           method,
           'MEMBER',
           'IN GUILD',
           'FF',
           null,
           null,
           null,
           null,
           '0',
           '0',
           '0',
           '0',
          '0',
           '0',
          'NO',
          'NO',
          guildmatesFriends,
           '0',
           '0',
           '10000',
        ];

        guildData.push(newRow);

        await writeSheetData(guildRange, guildData);

        const channel = client.channels.cache.get(authJson.channels['guild-aleart']);
        if (channel) {
          interaction.editReply(`UID:**${uid}** With Player Name:**${playerName}** joined the Guild!`);
          channel.send(`**\`\`\`👀 ${playerName} joined the Guild💖!\`\`\`**`);
        } else {
          console.error('Channel not found!');
        }

      }
    
} else {
  interaction.editReply({ content: 'You dont have access of this command', ephemeral: true });
}
} catch (error) {
console.error(error);
interaction.editReply('Error: Something went wrong!');
}
}

//Players command code
if (interaction.commandName === 'players') {
  try {
    const startTime = Date.now();
    await interaction.deferReply();

    if (authid.includes(username)) {
      const guildData = await getSheetData(guildRange);
      const players = guildData.map((row, index) => ({
        name: row[columns.PLAYER_NAME],
        uid: row[columns.UID],
        status: row[columns.STATUS],
      }));

      const inGuildPlayers = players.filter((player) => player.status === 'IN GUILD');
      const formattedPlayers = inGuildPlayers.map((player, index) => `** \`\`\`${index + 1}. NAME: ${player.name}\n    UID : ${player.uid}\`\`\` **`);

      const chunkSize = 2000;
      const chunks = [];
      let chunk = '';

      for (const player of formattedPlayers) {
        if (chunk.length + player.length > chunkSize) {
          chunks.push(chunk);
          chunk = '';
        }
        chunk += `${player}\n`;
      }

      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      for (let i = 0; i < chunks.length; i++) {
        if (i === 0) {
          await interaction.editReply(chunks[i]);
        } else {
          await new Promise(resolve => setTimeout(resolve, 10));
          await interaction.followUp(chunks[i]);
        }
      }

      const endTime = Date.now();
      const latency = endTime - startTime;
      console.log(`Time taken: ${latency}ms`);
    } else {
      interaction.editReply({ content: 'Error: You do not have permission to use this command!', ephemeral: true });
    }
  } catch (error) {
    console.error(error);
    await interaction.editReply('There was an error while processing your request.');
  }
}
        
//Kick code
if (interaction.commandName === 'kick') {
  try {
    await interaction.deferReply();
    const uid = interaction.options.getString('uid');
    const today = new Date();
    const LeaveDate = `${today.toLocaleString('default', { month: 'short' })}-${today.getDate()}-${today.getFullYear()}`;
    const reason = interaction.options.getString('reason');

    if (interaction.channel.id !== authJson.channels.pvtcmd) {
      interaction.editReply({ content: 'Error: You cant use this command here!', ephemeral: true });
      return;
    }

    if (authid.includes(username)) {
      const guildData = await getSheetData(guildRange);
      const existingUid = guildData.find((row) => row[columns.UID] === uid);

      if (existingUid) {
        if (existingUid[columns.STATUS] === 'KICKED') {
          interaction.editReply(`Error: This player is already kicked!`);
          return;
        }

        if (interaction.guild) {
          const userId = existingUid[columns.USER_ID];
          interaction.guild.members.fetch(userId).then(member => {
            if (member) {
              member.roles.remove('1285469617996828773');
              console.log(`Role Removed Sucessfully ${userId}`);
              interaction.editReply(`Guild Member Role Removed From UID:${uid} `);
            } else {
              console.error(`Error: Member not found in the guild. User ID: ${userId}`);
              interaction.reply(`Error: Member not found in the guild. User ID: ${userId}`);
            }
          }).catch(error => {
            console.error(`Error: ${error.message}`);
            interaction.editReply(`Error: ${error.message}`);
          });
        } else {
          console.error('Error: This command cannot be used in DM.');
          interaction.editReply('Error: This command cannot be used in DM.');
        }

        existingUid[columns.STATUS] = 'KICKED';
        existingUid[columns.LEAVE_DATE] = LeaveDate;
        existingUid[columns.REASON] = reason;

        // Update KICKED SCORE
        if (existingUid[columns.KICKED_SCORE]) {
          existingUid[columns.KICKED_SCORE] = parseInt(existingUid[columns.KICKED_SCORE]) + 1;
        } else {
          existingUid[columns.KICKED_SCORE] = 1;
        }

        // Check compatibility
        const kickedScore = existingUid[columns.KICKED_SCORE];
        let compatibilityMessage = '';
        if (kickedScore >= 0 && kickedScore <= 3) {
          compatibilityMessage = 'Average player';
        } else if (kickedScore >= 4 && kickedScore <= 6) {
          compatibilityMessage = 'Player is not compatible';
        } else if (kickedScore >= 7 && kickedScore <= 9) {
          compatibilityMessage = 'Too bad player';
        } else if (kickedScore >= 10) {
          compatibilityMessage = 'You are banned from the guild';
        }
        existingUid[columns.KICKED_STATUS] = compatibilityMessage;

        await writeSheetData(guildRange, guildData);

        const playerName = existingUid[columns.PLAYER_NAME];
        const channel = client.channels.cache.get(authJson.channels['guild-aleart']);
        if (channel) {
          interaction.editReply(`UID ${uid} **(${playerName})** kicked successfully!\n${compatibilityMessage}`);
          if (reason === 'LEFT') {
            channel.send(`> **\`\`\`${playerName} was Left the Guild😮‍💨👍🏻\`\`\`**`);
          } else {
            channel.send(`> **\`\`\`⚠️${playerName} was kicked\n> Reason:${reason}‼️\`\`\`**`);
          }
        }
      } else {
        interaction.editReply(`Error: UID ${uid} not found!`);
      }
    } else {
      interaction.editReply({ content: 'Error: You do not have permission to use this command!', ephemeral: true });
    }
  } catch (error) {
    console.error(error);
    interaction.editReply('Error: Something went wrong!');
  }
}

//kick info code
if (interaction.commandName === 'kick_info') {
  try{
  if (authid.includes(username)) {
    const guildData = await getSheetData(guildRange);
    const playersToKick = [];

    guildData.forEach((row) => {
      if (row[columns.STATUS] && row[columns.STATUS].trim().toLowerCase() === 'in guild') {
        if (row[columns.RANK] && row[columns.RANK].trim().toLowerCase() === 'member') {
          if (row[columns.MIN_POINTS] && row[columns.CURRENT_TOTAL_POINTS] && row[columns.TOTAL_DAYS]) {
            const minPoints = parseInt(row[columns.MIN_POINTS]-120);
            const currentPoints = parseInt(row[columns.CURRENT_TOTAL_POINTS]);
            const totalDays = parseInt(row[columns.TOTAL_DAYS]);

            if (minPoints > currentPoints && totalDays >= 8) {
              playersToKick.push(`${row[columns.PLAYER_NAME]} ${row[columns.UID]}`);
            }
          }
        }
      }
    });

    const channel = client.channels.cache.get(authJson.channels['guild-aleart']);
    if (channel) {
      if (playersToKick.length > 0) {
        interaction.reply(`**Players to kick:\n${playersToKick.join('\n')}**`);

        const today = new Date();
        const hour = today.getHours();
        if (hour >= 12) {
          const day = today.getDay(); // 1 = Monday, 2 = Tuesday, ...
          if (day === 1) {
        channel.send(`**> Players to kick:\n\`\`\`\n${playersToKick.join('\n')}\`\`\`**`);
          }
          else {
            console.log('')
          }
        }
        else {
          console.log('')
        }
      } else {
        interaction.reply('No players found that meet the kick criteria.');
      }
    }
  } else {
    interaction.editReply({ content: 'You do not have permission to use this command!', ephemeral: true });
  }
}catch (error) {
    console.error(error);
    interaction.editReply('Error: Something went wrong!');
}
}

//master add command
if (interaction.commandName === 'master_add') {
  if (authid.includes(username)) {
    try {
      await interaction.deferReply({ ephemeral: false, fetchReply: true });
      const uid = interaction.options.getString('uid');
      const currentTotal = interaction.options.getInteger('current_total');
      const guildData = await getSheetData(guildRange);
      let reply = 'UID not found!';
      let uidFound = false;

      guildData.forEach((row) => {
        if (row[columns.UID].trim() === uid.trim()) {
          uidFound = true;
          row[columns.CURRENT_TOTAL_POINTS] = currentTotal.toString();
          const lastTotalPoints = parseInt(row[columns.LAST_TOTAL_POINTS]);
          const points = currentTotal - lastTotalPoints;
          row[columns.POINTS] = points.toString();
        }
      });

      await writeSheetData(guildRange, guildData);

      if (uidFound) {
        const points = guildData.find((row) => row[columns.UID].trim() === uid.trim())[columns.POINTS].trim();
        const playerName = guildData.find((row) => row[columns.UID].trim() === uid.trim())[columns.PLAYER_NAME].trim();
        reply = `CURRENT TOTAL POINTS ${currentTotal} updated successfully for UID ${uid} (${playerName})! Points updated: ${points}`;
      }

      interaction.editReply(reply);
    } catch (error) {
      console.error(error);
      interaction.editReply('There was an error while processing your request.');
    }
  } else {
    interaction.reply({ content: 'This command only for admins', ephemeral: true });
  }
}

//admin update

if (interaction.commandName === 'admin_update') {
  try {
    await interaction.deferReply();
    const uid = interaction.options.getString('uid');
    const playerName = interaction.options.getString('player_name');
    const rank = interaction.options.getString('rank');
    const Topuppoints = interaction.options.getString('top-up-points');

    if (authid.includes(username)) {
      const guildData = await getSheetData(guildRange);
      const existingUid = guildData.find((row) => row[columns.UID] === uid);

      if (existingUid) {
        if (playerName) {
          existingUid[columns.PLAYER_NAME] = playerName;
        }
        if (rank) {
          existingUid[columns.RANK] = rank;
        }
        if (Topuppoints) {
          existingUid[columns.POINTS_LIMIT] = parseInt(existingUid[columns.POINTS_LIMIT]) + parseInt(Topuppoints);

          // Update pass.csv file
          const passData = await getSheetData(range);
          const pluser = passData.find((row) => row[passcolomn.UID] === uid);

          if (pluser) {
            const userId = pluser[passcolomn.User_ID];
            const userDm = await interaction.client.users.fetch(userId);

            if (userDm) {
              try {
                const dmChannel = await userDm.createDM();
                await dmChannel.send(`> **\`\`\`Hello! ${existingUid[columns.PLAYER_NAME]} Admin has top-up your points! Your new balance is: ${existingUid[columns.POINTS_LIMIT]}\`\`\`**`);
                console.log(`DM sent to user ${userId} successfully!`);
              } catch (error) {
                console.error(`Error sending DM to user ${userId}: ${error.message}`);
              }
            } else {
              console.error(`User ${userId} not found in cache!`);
            }
          } else {
            console.error(`User ${uid} not found in pass.csv!`);
          }
        }

        await writeSheetData(guildRange, guildData);
        interaction.editReply(`UID ${uid} updated successfully!`);
      } else {
        interaction.editReply(`Error: UID ${uid} not found!`);
      }
    } else {
      interaction.editReply({ content: 'Error: You do not have permission to use this command!', ephemeral: true });
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    interaction.editReply('Error: Something went wrong!');
  }
}

//BAN UNBAN CODE
if (interaction.commandName === 'ban_unban') {
  if (authid.includes(username)) {
    try {
      await interaction.deferReply();
      const uid = interaction.options.getString('uid');
      const action = interaction.options.getString('action');
      const guildData = await getSheetData(guildRange);
      const existingUid = guildData.find((row) => row[columns.UID] === uid);

      if (existingUid) {
        if (action === 'ban') {
          if (existingUid[columns.STATUS].trim().toLowerCase() !== 'kicked') {
            interaction.editReply('Error: Player is not kicked! Please kick the player first before banning.');
            return;
          }
          existingUid[columns.KICKED_SCORE] = '10';
          existingUid[columns.KICKED_STATUS] = 'YOU ARE BAN FROM GUILD';
        } else if (action === 'unban') {
          existingUid[columns.KICKED_SCORE] = '9';
          existingUid[columns.KICKED_STATUS] = 'LAST CHANCE';
        }

        await writeSheetData(guildRange, guildData);
        interaction.editReply(`UID ${uid} has been ${action}!`);
      } else {
        interaction.editReply(`Error: UID ${uid} not found!`);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      interaction.editReply('Error: Something went wrong!');
    }
  } else {
    interaction.reply({ content: 'Error: You do not have permission to use this command!', ephemeral: true });
  }
}

//send msg code
if (interaction.commandName === 'sendmsg') {
    if (authid.includes(username)) {
      try {
        await interaction.deferReply();
        const message = interaction.options.getString('msg');
        const channel = client.channels.cache.get(authJson.channels['guild-aleart']); // apne channel ID ko yahaan replace karein
        if (!channel) return interaction.editReply('Error: Channel not found!');
        channel.send(`**@everyone\n \`\`\`${message}\`\`\``);
        interaction.editReply('Message sent successfully!');
      } catch (error) {
        console.error(error);
        interaction.editReply('Error: Unable to send message!');
      }
    } else {
      interaction.reply({ content: 'Error: You do not have permission to use this command!', ephemeral: true });
    }
  }
}else{
  interaction.reply('**Bot is currently in whitelist mode. Only authorized users can use commands. Please try again later.!**');
}

});

//cron code for monday points swtich
const cron = require('cron');
process.env.TZ = 'Asia/Kolkata';

const job = new cron.CronJob('0 * * * *', async () => {
  const today = new Date();
  const hour = today.getHours();
  if (hour >= 18) {
    const day = today.getDay(); // 1 = Monday, 2 = Tuesday, ...
    if (day === 1) {
      const currentTotalRange = 'N2:N';
      const lastTotalPointsRange = 'M2:M';
      const pointsRange = 'Q2:Q';
      const pointsLimitRange = 'X2:X';

      await updateSheetData(currentTotalRange, lastTotalPointsRange, pointsRange, pointsLimitRange);

      console.log('LAST TOTAL POINTS updated successfully!');
      const channel = client.channels.cache.get('1333423039106519061');
      if (channel) {
        channel.send('LAST TOTAL POINTS IS UPDATED SUCESSFULLY!');
      } else {
        console.error('Channel not found!');
      }
    } else {
      console.log("Today's not Monday");
    }
  } else {
    console.log("Time is less than 6");
  }
});

job.start();

async function updateSheetData(currentTotalRange, lastTotalPointsRange, pointsRange, pointsLimitRange) {
  try {
    const currentTotalValues = await getSheetData(currentTotalRange);
    const lastTotalPointsValues = await getSheetData(lastTotalPointsRange);
    const pointsValues = await getSheetData(pointsRange);
    const pointsLimitValues = await getSheetData(pointsLimitRange);

    lastTotalPointsValues.forEach((row, index) => {
      row[0] = currentTotalValues[index][0];
    });

    pointsValues.forEach((row, index) => {
      row[0] = '0';
    });

    pointsLimitValues.forEach((row, index) => {
      row[0] = '10000';
    });

    await writeSheetData(lastTotalPointsRange, lastTotalPointsValues);
    await writeSheetData(pointsRange, pointsValues);
    await writeSheetData(pointsLimitRange, pointsLimitValues);
  } catch (error) {
    console.error(error);
    setTimeout(() => {
      updateSheetData(currentTotalRange, lastTotalPointsRange, pointsRange, pointsLimitRange);
    }, 60000); // 1 minute
  }
}

// otp clear
const cronnn = require('cron');
const { Column } = require('docx');

process.env.TZ = 'Asia/Kolkata';

const jobb = new cronnn.CronJob('* * * * *', async () => {
  let clearedOTPs = 0;
  let totalOTPs = 0;
  let clearedUIDs = [];

  const passdata = await getSheetData(range);
  passdata.forEach((row) => {
    totalOTPs++;
    const time = moment(row[passcolomn.TIME], 'HH:mm:ss');
    const timeDiff = moment().diff(time, 'minutes');

    if (timeDiff >= 10 && row[passcolomn.OTP] !== '') {
      row[passcolomn.OTP] = '';
      clearedOTPs++;
      clearedUIDs.push(row[passcolomn.UID]);
      console.log(`OTP cleared for ${row[passcolomn.UID]}`);
    }

    if (row[passcolomn.STATUS] === 'NOT VERIFIED' && timeDiff >= 10) {
      row[passcolomn.User_ID] = '';
      row[passcolomn.UID] = '';
      row[passcolomn.Password] = '';
      row[passcolomn.Email] = '';
      row[passcolomn.OTP] = '';
      row[passcolomn.TIME] = '';
      row[passcolomn.STATUS] = '';
      row[passcolomn.NEW_PASSWORD] = '';
      row[passcolomn.FORGOT_STATUS] = '';
      row[passcolomn.PURPOSE] = '';
      row[passcolomn.OLD_USER_ID] = '';

      clearedUIDs.push(row[passcolomn.UID]);
    }
  });

  await writeSheetData(range, passdata);

  if (clearedOTPs === 0) {
  } else {
    console.log(`Cleared ${clearedOTPs} OTPs out of ${totalOTPs}.`);
    console.log(`Cleared UIDs: ${clearedUIDs.join(', ')}`);
  }
});

jobb.start();

//TOTAL DAYS AND POINTS CODE
const jobbb = new cron.CronJob('0 0 * * *', async () => {
try {
  const guildData = await getSheetData(guildRange);
  const headers = guildData[0];
  const joinDateIndex = headers.findIndex(header => header.trim().toLowerCase() === 'join date');
  const leaveDateIndex = headers.findIndex(header => header.trim().toLowerCase() === 'leave date');
  const totalDaysIndex = headers.findIndex(header => header.trim().toLowerCase() === 'total days');
  const minPointsIndex = headers.findIndex(header => header.trim().toLowerCase() === 'min points');
  const statusIndex = headers.findIndex(header => header.trim().toLowerCase() === 'status');

  const updatedData = guildData.map((row, index) => {
    if (index === 0) return row;
    if (row[joinDateIndex] === undefined || row[joinDateIndex] === null) {
      console.error(`Error: Join date value is missing for line ${index + 1}`);
      return row;
    }
    if (row[statusIndex].trim().toLowerCase() === 'in guild') {
      const joinDate = moment(row[joinDateIndex].trim(), 'MMM-D-YYYY');
      const today = moment();
      const daysSinceJoin = today.diff(joinDate, 'days');
      row[totalDaysIndex] = daysSinceJoin.toString();
    } else {
      const joinDate = moment(row[joinDateIndex].trim(), 'MMM-D-YYYY');
      const leaveDate = moment(row[leaveDateIndex].trim(), 'MMM-D-YYYY');
      const daysBetweenJoinAndLeave = leaveDate.diff(joinDate, 'days');
      row[totalDaysIndex] = daysBetweenJoinAndLeave.toString();
    }
    const minPoints = row[totalDaysIndex] * limit;
    row[minPointsIndex] = minPoints.toString();
    return row;
  });

  await writeSheetData(guildRange, updatedData);
  console.log('TOTAL DAYS column updated successfully!');
  console.log('MIN POINTS column updated successfully!');
} catch (error) {
  console.error(error);
}
});
jobbb.start();



client.login(token);
  }catch (error) {
    console.error("Error:",error);


  }
}

main();