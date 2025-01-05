document.addEventListener('DOMContentLoaded', () => {
    const steamIdInput = document.getElementById('steamId');
    const apiKeyInput = document.getElementById('apiKey');
    const fetchButton = document.getElementById('fetchGames');
    const outputElement = document.getElementById('output');
    const copyButton = document.getElementById('copyJson');
    const copyMessage = document.getElementById('copyMessage');

    let gamesData = null;

    fetchButton.addEventListener('click', async () => {
        const steamId = steamIdInput.value.trim();
        const apiKey = apiKeyInput.value.trim();

        if (!steamId || !apiKey) {
            outputElement.textContent = 'Please enter both Steam ID and API Key';
            return;
        }

        try {
            fetchButton.disabled = true;
            fetchButton.textContent = 'Fetching...';
            outputElement.textContent = 'Loading...';
            copyButton.classList.add('hidden');
            copyMessage.classList.add('hidden');

            // Fetch games through our proxy server
            const proxyUrl = `http://localhost:3000/api/games?apiKey=${apiKey}&steamId=${steamId}`;
            const ownedGamesResponse = await fetch(proxyUrl);
            const ownedGamesData = await ownedGamesResponse.json();

            if (!ownedGamesResponse.ok) {
                throw new Error('Failed to fetch games data');
            }

            if (!ownedGamesData.response || !ownedGamesData.response.games) {
                throw new Error('No games found or profile might be private');
            }

            // Process and enhance the games data
            const games = ownedGamesData.response.games.map(game => ({
                appId: game.appid,
                name: game.name,
                playtime: {
                    minutes: game.playtime_forever,
                    hours: Math.round(game.playtime_forever / 60 * 10) / 10
                },
                lastPlayed: game.rtime_last_played ? new Date(game.rtime_last_played * 1000).toISOString() : null,
                img: {
                    icon: `http://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`,
                    logo: `http://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_logo_url}.jpg`
                }
            }));

            // Sort games by playtime
            games.sort((a, b) => b.playtime.minutes - a.playtime.minutes);

            // Create the final data structure
            gamesData = {
                totalGames: games.length,
                totalPlaytime: {
                    minutes: games.reduce((total, game) => total + game.playtime.minutes, 0),
                    hours: Math.round(games.reduce((total, game) => total + game.playtime.minutes, 0) / 60 * 10) / 10
                },
                games: games
            };

            // Display the formatted JSON
            outputElement.textContent = JSON.stringify(gamesData, null, 2);
            copyButton.classList.remove('hidden');

        } catch (error) {
            outputElement.textContent = `Error: ${error.message}`;
            console.error('Error fetching games:', error);
        } finally {
            fetchButton.disabled = false;
            fetchButton.textContent = 'Fetch Games';
        }
    });

    // Copy JSON functionality
    copyButton.addEventListener('click', async () => {
        if (!gamesData) return;

        try {
            await navigator.clipboard.writeText(JSON.stringify(gamesData, null, 2));
            copyMessage.classList.remove('hidden');
            setTimeout(() => copyMessage.classList.add('hidden'), 2000);
        } catch (error) {
            console.error('Failed to copy JSON:', error);
        }
    });
});
