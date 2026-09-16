const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const ExcelJS = require('exceljs');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('registrations.db', (err) => {
    if (err) console.error(err);
    else console.log('Connected to SQLite database');
});

// Create registrations table
db.run(`
    CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member1_name TEXT NOT NULL,
        member1_email TEXT NOT NULL,
        member1_employee_id TEXT NOT NULL,
        member2_name TEXT NOT NULL,
        member2_email TEXT NOT NULL,
        member2_employee_id TEXT NOT NULL,
        member3_name TEXT NOT NULL,
        member3_email TEXT NOT NULL,
        member3_employee_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your_email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your_app_password'
    }
});

// Send confirmation email
async function sendConfirmationEmail(members) {
    const membersList = members.map((m, i) => 
        `${i + 1}. ${m.name} (${m.email}) - Employee ID: ${m.employee_id}`
    ).join('\n');

    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        h1 { color: #FFD700; text-align: center; }
        .success-badge { background: #00FF00; color: #000; padding: 10px 20px; border-radius: 5px; text-align: center; font-weight: bold; margin: 20px 0; }
        .team-info { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #00FFFF; }
        .team-member { margin: 10px 0; padding: 10px; background: white; border-radius: 3px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        .cta-button { background: #FFD700; color: #000; padding: 12px 30px; border-radius: 5px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎬 FICTIONAL QUIZ 2.0</h1>
        <div class="success-badge">✅ Registration Successful!</div>
        
        <p>Hello,</p>
        
        <p>Congratulations! Your team has been successfully registered for the <strong>Fictional Quiz 2.0</strong> happening on <strong>24 September 2026</strong> at the Editorial Connect Day.</p>
        
        <div class="team-info">
            <h3 style="color: #00FFFF; margin-top: 0;">Your Team Members:</h3>
            <div class="team-member">
                <strong>Member 1:</strong> ${members[0].name}<br>
                📧 ${members[0].email}<br>
                🏢 Employee ID: ${members[0].employee_id}
            </div>
            <div class="team-member">
                <strong>Member 2:</strong> ${members[1].name}<br>
                📧 ${members[1].email}<br>
                🏢 Employee ID: ${members[1].employee_id}
            </div>
            <div class="team-member">
                <strong>Member 3:</strong> ${members[2].name}<br>
                📧 ${members[2].email}<br>
                🏢 Employee ID: ${members[2].employee_id}
            </div>
        </div>
        
        <p>📅 <strong>Event Details:</strong></p>
        <ul>
            <li><strong>Event:</strong> Fictional Quiz 2.0 - Ultimate Pop Culture Showdown</li>
            <li><strong>Date:</strong> 24 September 2026</li>
            <li><strong>Event:</strong> Editorial Connect Day</li>
            <li><strong>Format:</strong> 5 Platform Rounds (Spotify, Netflix, Kindle, Crunchyroll, Internet)</li>
            <li><strong>Duration:</strong> 2-3 hours</li>
            <li><strong>Teams:</strong> 10 teams competing</li>
        </ul>
        
        <p>🎮 <strong>Get Ready:</strong></p>
        <ul>
            <li>Brush up on your pop culture knowledge</li>
            <li>Prepare your team for gameshow-style challenges</li>
            <li>Check your email on 24 September for final details</li>
            <li>Be ready to dominate! 🏆</li>
        </ul>
        
        <p>If you have any questions, please reply to this email.</p>
        
        <p style="margin-top: 30px;">
            <strong>Let the Games Begin!</strong><br>
            The Fictional Quiz 2.0 Team
        </p>
        
        <div class="footer">
            <p>This is an automated confirmation email. Please do not reply with attachments.</p>
        </div>
    </div>
</body>
</html>
    `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER || 'quiz@fictionalquiz.com',
            to: members.map(m => m.email).join(', '),
            subject: '✅ Fictional Quiz 2.0 - Registration Confirmed! 🎬',
            html: emailContent
        });
        console.log('Confirmation email sent');
    } catch (error) {
        console.error('Email error:', error);
    }
}

// API Endpoints

// Get form page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'form.html'));
});

// Submit registration
app.post('/api/register', (req, res) => {
    const {
        member1Name, member1Email, member1EmployeeId,
        member2Name, member2Email, member2EmployeeId,
        member3Name, member3Email, member3EmployeeId
    } = req.body;

    const query = `
        INSERT INTO registrations 
        (member1_name, member1_email, member1_employee_id,
         member2_name, member2_email, member2_employee_id,
         member3_name, member3_email, member3_employee_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [
        member1Name, member1Email, member1EmployeeId,
        member2Name, member2Email, member2EmployeeId,
        member3Name, member3Email, member3EmployeeId
    ], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Registration failed' });
        }

        // Send confirmation emails
        const members = [
            { name: member1Name, email: member1Email, employee_id: member1EmployeeId },
            { name: member2Name, email: member2Email, employee_id: member2EmployeeId },
            { name: member3Name, email: member3Email, employee_id: member3EmployeeId }
        ];
        
        sendConfirmationEmail(members);

        res.json({ 
            success: true, 
            id: this.lastID,
            message: 'Registration successful! Confirmation emails sent.' 
        });
    });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === adminUsername && password === adminPassword) {
        res.json({ success: true, token: 'admin_token_' + Date.now() });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

// Get all registrations (admin only)
app.get('/api/admin/registrations', (req, res) => {
    const token = req.headers.authorization;
    
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    db.all('SELECT * FROM registrations ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Export to Excel
app.get('/api/admin/export-excel', (req, res) => {
    const token = req.headers.authorization;
    
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    db.all('SELECT * FROM registrations ORDER BY created_at DESC', async (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Registrations');

        // Add headers
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 5 },
            { header: 'Member 1 Name', key: 'member1_name', width: 20 },
            { header: 'Member 1 Email', key: 'member1_email', width: 25 },
            { header: 'Member 1 Employee ID', key: 'member1_employee_id', width: 15 },
            { header: 'Member 2 Name', key: 'member2_name', width: 20 },
            { header: 'Member 2 Email', key: 'member2_email', width: 25 },
            { header: 'Member 2 Employee ID', key: 'member2_employee_id', width: 15 },
            { header: 'Member 3 Name', key: 'member3_name', width: 20 },
            { header: 'Member 3 Email', key: 'member3_email', width: 25 },
            { header: 'Member 3 Employee ID', key: 'member3_employee_id', width: 15 },
            { header: 'Registered At', key: 'created_at', width: 20 }
        ];

        // Style header
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } };

        // Add data
        rows.forEach(row => {
            worksheet.addRow(row);
        });

        // Send file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Quiz_Registrations.xlsx"');

        await workbook.xlsx.write(res);
        res.end();
    });
});

// Get statistics
app.get('/api/admin/stats', (req, res) => {
    const token = req.headers.authorization;
    
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    db.get('SELECT COUNT(*) as total_registrations FROM registrations', (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        const totalTeams = result.total_registrations;
        const totalMembers = totalTeams * 3;

        res.json({
            total_teams: totalTeams,
            total_members: totalMembers,
            timestamp: new Date()
        });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`📋 Form: http://localhost:${PORT}`);
    console.log(`🔐 Admin: http://localhost:${PORT}/admin\n`);
});
