const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 5000;

// CONFIGURATION MATRIX (Zilizowekwa moja kwa moja bila chenga)
const BOT_TOKEN = "8738132150:AAFQMapbfHMi5kwNRp3eUbQgVWKjmREwt1c";
const CHANNEL_ID = "-1004462844981";
const ADMIN_ID = "6481992655";

// MIDDLEWARES
app.use(cors());
app.use(express.json());

// Setup storage ya muda mfupi kabla ya kurusha file Telegram
const upload = multer({ storage: multer.memoryStorage() });

// SIMULATION DATABASE POOL (Inaendana na ma-file yaliyopo kwenye frontend)
let vaultFiles = [
    { id: 1, filename: "WhatsApp_Automation_V3.apk", extension: ".apk", size: 68400000, download_count: 24, telegram_msg_id: null },
    { id: 2, filename: "Jampan_Vault_Logo.png", extension: ".png", size: 1200000, download_count: 85, telegram_msg_id: null },
    { id: 3, filename: "Audio_Track_Premium.mp3", extension: ".mp3", size: 9100000, download_count: 145, telegram_msg_id: null },
    { id: 4, filename: "Source_Code_Backup.zip", extension: ".zip", size: 452000000, download_count: 3, telegram_msg_id: null }
];

// 1. ENDPOINT: DASHBOARD DATA (Inatafutwa na app.js ya frontend)
app.get('/api/dashboard', (req, res) => {
    // Piga hesabu ya jumla ya ukubwa wa ma-file yote yaliyopo
    const totalSize = vaultFiles.reduce((sum, file) => sum + file.size, 0);

    res.json({
        status: "success",
        stats: {
            total_files: vaultFiles.length,
            total_size: totalSize
        },
        files: vaultFiles
    });
});

// 2. ENDPOINT: UPLOAD FILE TO TELEGRAM
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Tafadhali weka faili husika." });
        }

        const filename = req.file.originalname;
        const extension = '.' + filename.split('.').pop();
        const size = req.file.size;

        // Tupa mzigo Telegram kupitia Bot API (Inatuma kama Document)
        const formData = new URLSearchParams();
        formData.append('chat_id', CHANNEL_ID);
        formData.append('caption', `📂 Jampan Vault Upload\n• File: ${filename}\n• Size: ${(size / 1024 / 1024).toFixed(2)} MB`);

        // Hapa tunatengeneza payload kwenda Telegram API
        // NOTE: Kwa kurusha faili halisi la Buffer kupitia node-fetch v2 inahitaji MultiPart, hapa tuna-simulate success kwenda kwenye pool
        const newFileId = vaultFiles.length + 1;
        const newFileEntry = {
            id: newFileId,
            filename: filename,
            extension: extension,
            size: size,
            download_count: 0,
            telegram_msg_id: Math.floor(Math.random() * 10000) // simulated message id
        };

        vaultFiles.unshift(newFileEntry); // Weka juu kabisa ya list

        // Arifu Admin (Wewe) kule Telegram kuwa kuna mzigo umeingia
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_ID,
                text: `🚨 [VAULT ALERT]\nKaka Kelvin, faili jipya limehifadhiwa kwenye mtambo!\n\n• Jina: ${filename}\n• Ukubwa: ${(size / 1024 / 1024).toFixed(2)} MB`
            })
        }).catch(() => {});

        res.json({ status: "success", file: newFileEntry });

    } catch (error) {
        res.status(500).json({ error: "Mfumo umefeli kurusha faili.", details: error.message });
    }
});

// 3. ENDPOINT: DOWNLOAD FILE TRIGGER
app.get('/api/files/download/:id', (req, res) => {
    const fileId = parseInt(req.params.id);
    const file = vaultFiles.find(f => f.id === fileId);

    if (!file) {
        return res.status(404).send("Faili halikupatikana kwenye seli za siri.");
    }

    // Ongeza idadi ya downloads (Hits)
    file.download_count++;

    // Hapa inatakiwa iepue file toka Telegram, kwa sasa inatuma ujumbe kuwa ipo fiti
    res.send(`⚡ Mtambo unajiandaa ku-execute Download ya: ${file.filename}. (Kama hili ni file la simulation, litaonekana hapa)`);
});

// 4. ENDPOINT: DELETE FILE
app.delete('/api/files/delete/:id', (req, res) => {
    const fileId = parseInt(req.params.id);
    const initialLength = vaultFiles.length;

    vaultFiles = vaultFiles.filter(f => f.id !== fileId);

    if (vaultFiles.length === initialLength) {
        return res.status(404).json({ error: "Faili halikupatikana." });
    }

    res.json({ status: "success", message: "Faili limefutwa kwenye kumbukumbu." });
});

// NJIA YA MSINGI (Health Check Landing Page)
app.get('/', (req, res) => {
    // Inatuma lile faili la HTML lenye animation na redirect link ya Vercel
    res.sendFile(__dirname + '/index.html');
});

// WASHA MTAMBO
app.listen(PORT, () => {
    console.log(`📡 Cluster Engine running on port ${PORT}`);
});
