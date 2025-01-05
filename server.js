const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static files from current directory
app.use('/', express.static(__dirname));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Proxy endpoint for Steam API
app.get('/api/games', async (req, res) => {
    const { apiKey, steamId } = req.query;

    if (!apiKey || !steamId) {
        return res.status(400).json({ error: 'API key and Steam ID are required' });
    }

    try {
        const steamUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=true&format=json`;
        const response = await fetch(steamUrl);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Steam API Error:', error);
        res.status(500).json({ error: 'Failed to fetch games data' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
