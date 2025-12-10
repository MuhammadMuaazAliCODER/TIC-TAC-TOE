  let board = ['', '', '', '', '', '', '', '', ''];
        let currentPlayer = 'X';
        let gameMode = '';
        let matchType = '';
        let gameActive = false;
        let scores = { X: 0, O: 0, draw: 0 };
        let roundsToWin = 1;
        let currentRound = 1;

     
        let musicEnabled = true;
        let soundEnabled = true;
        let vibrationEnabled = true;

     
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        let backgroundMusic = null;

        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

      
        function playSound(type) {
            if (!soundEnabled) return;

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            switch(type) {
                case 'click':
                    oscillator.frequency.value = 800;
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.1);
                    break;
                case 'place':
                    oscillator.frequency.value = 600;
                    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.2);
                    break;
                case 'win':
                    [523, 659, 784, 1047].forEach((freq, i) => {
                        const osc = audioContext.createOscillator();
                        const gain = audioContext.createGain();
                        osc.connect(gain);
                        gain.connect(audioContext.destination);
                        osc.frequency.value = freq;
                        gain.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.1);
                        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.3);
                        osc.start(audioContext.currentTime + i * 0.1);
                        osc.stop(audioContext.currentTime + i * 0.1 + 0.3);
                    });
                    break;
            }
        }

        
        function createBackgroundMusic() {
            if (!musicEnabled || backgroundMusic) return;

            const notes = [523.25, 587.33, 659.25, 698.46, 783.99];
            let noteIndex = 0;

            function playNote() {
                if (!musicEnabled) return;

                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = notes[noteIndex % notes.length];
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.8);
                
                noteIndex++;
                backgroundMusic = setTimeout(playNote, 1000);
            }

            playNote();
        }

        function stopBackgroundMusic() {
            if (backgroundMusic) {
                clearTimeout(backgroundMusic);
                backgroundMusic = null;
            }
        }

        
        function vibrate(pattern) {
            if (!vibrationEnabled || !navigator.vibrate) return;
            navigator.vibrate(pattern);
        }

      
        function toggleMusic() {
            musicEnabled = !musicEnabled;
            const btn = document.getElementById('musicBtn');
            btn.classList.toggle('active');
            
            if (musicEnabled) {
                createBackgroundMusic();
            } else {
                stopBackgroundMusic();
            }
            playSound('click');
            vibrate(50);
        }

        function toggleSound() {
            soundEnabled = !soundEnabled;
            const btn = document.getElementById('soundBtn');
            btn.classList.toggle('active');
            if (soundEnabled) playSound('click');
            vibrate(50);
        }

        function toggleVibration() {
            vibrationEnabled = !vibrationEnabled;
            const btn = document.getElementById('vibrationBtn');
            btn.classList.toggle('active');
            playSound('click');
            if (vibrationEnabled) vibrate(50);
        }

        createBackgroundMusic();

        const xSVG = `
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <line x1="20" y1="20" x2="80" y2="80" stroke="url(#gradX)" stroke-width="8" stroke-linecap="round"/>
                <line x1="80" y1="20" x2="20" y2="80" stroke="url(#gradX)" stroke-width="8" stroke-linecap="round"/>
                <defs>
                    <linearGradient id="gradX" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                    </linearGradient>
                </defs>
            </svg>
        `;

        const oSVG = `
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="30" fill="none" stroke="url(#gradO)" stroke-width="8" stroke-linecap="round"/>
                <defs>
                    <linearGradient id="gradO" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
                    </linearGradient>
                </defs>
            </svg>
        `;

        function selectMode(mode) {
            gameMode = mode;
            document.getElementById('modeSelection').classList.add('hidden');
            document.getElementById('matchSelection').classList.remove('hidden');
            playSound('click');
            vibrate(50);
        }

        function selectMatch(match) {
            matchType = match;
            if (match === 'single') roundsToWin = 1;
            else if (match === 'best3') roundsToWin = 2;
            else if (match === 'best5') roundsToWin = 3;

            document.getElementById('matchSelection').classList.add('hidden');
            document.getElementById('gameInfo').classList.remove('hidden');
            document.getElementById('board').classList.remove('hidden');
            document.getElementById('controls').classList.remove('hidden');
            
            updateDisplay();
            startRound();
            playSound('click');
            vibrate(50);
        }

        function startRound() {
            board = ['', '', '', '', '', '', '', '', ''];
            currentPlayer = 'X';
            gameActive = true;
            
            const cells = document.querySelectorAll('.cell');
            cells.forEach(cell => {
                cell.innerHTML = '';
                cell.classList.remove('taken', 'x', 'o', 'winner');
            });

            updateDisplay();
        }

        function updateDisplay() {
            document.getElementById('scoreX').textContent = scores.X;
            document.getElementById('scoreO').textContent = scores.O;
            document.getElementById('scoreDraw').textContent = scores.draw;
            
            if (matchType === 'single') {
                document.getElementById('roundInfo').textContent = '';
            } else {
                document.getElementById('roundInfo').textContent = `Round ${currentRound} • First to ${roundsToWin} wins`;
            }

            if (gameActive) {
                const playerName = (gameMode === 'pvc' && currentPlayer === 'O') ? 'Computer' : `Player ${currentPlayer}`;
                document.getElementById('currentPlayer').textContent = `${playerName}'s Turn`;
            }
        }

        function makeMove(index) {
            if (!gameActive || board[index] !== '') return;

            board[index] = currentPlayer;
            const cell = document.querySelectorAll('.cell')[index];
            
            if (currentPlayer === 'X') {
                cell.innerHTML = xSVG;
            } else {
                cell.innerHTML = oSVG;
            }
            
            cell.classList.add('taken', currentPlayer.toLowerCase());
            playSound('place');
            vibrate([30, 50]);

            if (checkWin()) {
                endRound(currentPlayer);
            } else if (board.every(cell => cell !== '')) {
                endRound('draw');
            } else {
                currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
                updateDisplay();

                if (gameMode === 'pvc' && currentPlayer === 'O') {
                    setTimeout(computerMove, 600);
                }
            }
        }

        function computerMove() {
            if (!gameActive) return;

            let availableMoves = board.map((cell, idx) => cell === '' ? idx : null).filter(val => val !== null);
            
            let move = findWinningMove('O') ?? findWinningMove('X') ?? availableMoves[Math.floor(Math.random() * availableMoves.length)];
            
            if (move !== undefined) {
                makeMove(move);
            }
        }

        function findWinningMove(player) {
            for (let pattern of winPatterns) {
                let values = pattern.map(i => board[i]);
                let playerCount = values.filter(v => v === player).length;
                let emptyCount = values.filter(v => v === '').length;
                
                if (playerCount === 2 && emptyCount === 1) {
                    return pattern[values.indexOf('')];
                }
            }
            return null;
        }

        function checkWin() {
            for (let pattern of winPatterns) {
                const [a, b, c] = pattern;
                if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                    highlightWinner(pattern);
                    return true;
                }
            }
            return false;
        }

        function highlightWinner(pattern) {
            const cells = document.querySelectorAll('.cell');
            pattern.forEach(index => {
                cells[index].classList.add('winner');
            });
        }

        function endRound(winner) {
            gameActive = false;
            
            if (winner === 'draw') {
                scores.draw++;
                document.getElementById('message').textContent = "🤝 It's a Draw!";
                playSound('click');
                vibrate(100);
            } else {
                scores[winner]++;
                const winnerName = (gameMode === 'pvc' && winner === 'O') ? 'Computer' : `Player ${winner}`;
                document.getElementById('message').textContent = `🎉 ${winnerName} Wins!`;
                playSound('win');
                vibrate([100, 50, 100, 50, 200]);
            }

            updateDisplay();

            if (scores.X >= roundsToWin || scores.O >= roundsToWin) {
                setTimeout(() => {
                    const matchWinner = scores.X >= roundsToWin ? 'X' : 'O';
                    const winnerName = (gameMode === 'pvc' && matchWinner === 'O') ? 'Computer' : `Player ${matchWinner}`;
                    document.getElementById('message').textContent = `🏆 ${winnerName} Wins the Match! 🏆`;
                    playSound('win');
                    vibrate([200, 100, 200, 100, 300]);
                }, 500);
            }
        }

        function resetRound() {
            if (scores.X >= roundsToWin || scores.O >= roundsToWin) {
                resetGame();
                return;
            }

            currentRound++;
            document.getElementById('message').textContent = '';
            startRound();
            playSound('click');
            vibrate(50);
        }

        function resetGame() {
            scores = { X: 0, O: 0, draw: 0 };
            currentRound = 1;
            gameMode = '';
            matchType = '';
            
            document.getElementById('modeSelection').classList.remove('hidden');
            document.getElementById('matchSelection').classList.add('hidden');
            document.getElementById('gameInfo').classList.add('hidden');
            document.getElementById('board').classList.add('hidden');
            document.getElementById('controls').classList.add('hidden');
            document.getElementById('message').textContent = '';
            playSound('click');
            vibrate(50);
        }
