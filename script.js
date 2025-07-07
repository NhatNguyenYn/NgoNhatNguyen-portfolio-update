// ===================================================================
// ==        LOGIC PRE-LOADER (ĐẶT NGOÀI DOMContentLoaded)          ==
// ==   Đảm bảo preloader hoạt động sớm nhất trước khi JS khác chạy ==
// ===================================================================
const preloader = document.getElementById('preloader');
const preloaderLogOutput = document.getElementById('preloader-log-output');
let logMessagesQueue = []; // Hàng đợi tin nhắn log
let logTypingDelay = 1; // Tốc độ gõ chữ cho log
let logLineDelay = 5; // Thời gian chờ giữa các dòng log

// Hàm để thêm tin nhắn vào hàng đợi log
const addLogMessage = (message, delayBeforeShowing = 0) => {
    logMessagesQueue.push({ message, delay: delayBeforeShowing });
};

// Hàm xử lý và hiển thị các tin nhắn trong hàng đợi
const processLogQueue = async () => {
    // Đảm bảo phần tử log tồn tại
    if (!preloaderLogOutput) return;

    // Lặp qua hàng đợi và hiển thị từng tin nhắn
    while (logMessagesQueue.length > 0) {
        const logEntry = logMessagesQueue.shift(); // Lấy tin nhắn đầu tiên và loại bỏ khỏi hàng đợi
        await new Promise(resolve => setTimeout(resolve, logEntry.delay)); // Chờ delay
        
        const logLine = document.createElement('div');
        logLine.className = 'preloader-log-line';
        preloaderLogOutput.appendChild(logLine);
        
        let i = 0;
        // Hàm gõ từng ký tự
        const typeLogChar = () => {
            if (i < logEntry.message.length) {
                logLine.textContent += logEntry.message.charAt(i);
                i++;
                preloaderLogOutput.scrollTop = preloaderLogOutput.scrollHeight; // Cuộn xuống
                setTimeout(typeLogChar, logTypingDelay);
            }
        };
        typeLogChar();
        // Chờ gõ xong cả dòng
        await new Promise(r => setTimeout(r, logEntry.message.length * logTypingDelay)); 
        // Chờ thêm giữa các dòng
        await new Promise(resolve => setTimeout(resolve, logLineDelay)); 
    }
    // logMessagesQueue = []; // Không cần reset ở đây nữa vì đã dùng shift()
};

// Log các bước khởi tạo ban đầu (chạy ngay khi script được parsing)
addLogMessage(`[${new Date().toLocaleTimeString('en-GB')}] System Booting Sequence Initiated.`, 100);


// Ẩn preloader sau khi tất cả nội dung trang đã tải xong (window.load)
window.addEventListener('load', async () => {
    // Thêm log cuối cùng sau khi tất cả tài nguyên đã tải
    addLogMessage(`[${new Date().toLocaleTimeString('en-GB')}] All assets loaded. Initializing UI...`, 500);
    await processLogQueue(); // Đảm bảo tất cả log được gõ xong

    if (preloader) {
        // Đợi thêm một chút để người dùng kịp đọc log cuối cùng
        setTimeout(() => {
            preloader.classList.add('preloader-hidden');
        }, 1000); // Ẩn sau 1 giây sau khi log hoàn tất
    }
});


// ===================================================================
// == LOGIC CHÍNH CỦA TRANG (BÊN TRONG DOMContentLoaded)             ==
// == Chạy sau khi HTML đã được parsing hoàn chỉnh                   ==
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {

    // Thêm log sau khi DOM đã sẵn sàng
    addLogMessage(`[${new Date().toLocaleTimeString('en-GB')}] DOM Content Fully Loaded.`, 100);

    // == KHAI BÁO BIẾN TOÀN CỤC ==
    const sections = document.querySelectorAll('.page');
    const navList = document.querySelector('.page-nav ul');
    const typingTextElement = document.getElementById('typing-text');
    const skillsCanvas = document.getElementById('skills-chart');
    const themeToggle = document.getElementById('theme-toggle');
    const terminalContainer = document.getElementById('terminal-container'); // Biến cho terminal container
    const terminalOutput = document.getElementById('terminal-output');     // Biến cho output của terminal
    const terminalInput = document.getElementById('terminal-input');       // Biến cho input của terminal
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorCircle = document.querySelector('.cursor-circle');
    const bgToggle = document.getElementById('bg-toggle'); // NEW: Lấy tham chiếu đến nút bật/tắt nền
    const settingsButton = document.getElementById('settings-button'); // NEW: Nút cài đặt
    const settingsPanel = document.getElementById('settings-panel');   // NEW: Panel cài đặt
    // Cập nhật hoverElements để bao gồm các phần tử mới được thêm
    const hoverElements = document.querySelectorAll('a, button, .project-card, .theme-switch, .writing-card, .book-item'); 
    const faviconTag = document.getElementById('favicon');
    
    // =============================================
    // == START: BILINGUAL FUNCTIONALITY        ==
    // =============================================

    const langButtons = document.querySelectorAll('.lang-btn');
    let currentTranslations = {};

    // Hàm tải file JSON và áp dụng bản dịch
    async function setLanguage(lang) {
        try {
            const response = await fetch(`lang/${lang}.json`);
            if (!response.ok) {
                console.error(`Could not load language file: ${lang}.json`);
                return;
            }
            const translations = await response.json();
            currentTranslations = translations;

            localStorage.setItem('user-lang', lang);

            langButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.lang === lang) {
                    btn.classList.add('active');
                }
            });

            document.querySelectorAll('[data-i18n-key]').forEach(el => {
                const key = el.getAttribute('data-i18n-key');
                if (translations[key]) {
                    if (el.tagName === 'META' && el.hasAttribute('content')) {
                        el.setAttribute('content', translations[key]);
                    } else {
                        el.textContent = translations[key];
                    }
                }
            });

            updateDynamicContent();

        } catch (error) {
            console.error('Error setting language:', error);
        }
    }

    // =============================================
    // == END: BILINGUAL FUNCTIONALITY          ==
    // =============================================

    // =========================================================================
    // == CÁC HÀM ĐỘNG SỬ DỤNG BẢN DỊCH (Phiên bản duy nhất, không trùng lặp) ==
    // =========================================================================

    if (navList) {
        sections.forEach(section => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#${section.id}`;
            const tooltip = document.createElement('span');
            tooltip.className = 'tooltip-nav';

            // SỬA ĐỔI QUAN TRỌNG:
            // Gán key dịch trực tiếp thay vì gán text mặc định
            const tooltipKey = `nav_${section.id}`;
            tooltip.setAttribute('data-i18n-key', tooltipKey);
            
            // Gán text mặc định ban đầu để hiển thị trong lúc chờ dịch
            tooltip.textContent = section.id.charAt(0).toUpperCase() + section.id.slice(1);

            link.appendChild(tooltip);
            listItem.appendChild(link);
            navList.appendChild(listItem);
        });
    }

    const runTypingEffect = () => {
        if (!typingTextElement || typingInProgress) return;
        typingInProgress = true;
        const textToType = currentTranslations.home_typing_text || "Ngo Nhat Nguyen";
        let i = 0;
        typingTextElement.innerHTML = "";
        const type = () => {
            if (i < textToType.length) {
                typingTextElement.innerHTML += textToType.charAt(i);
                i++;
                setTimeout(type, 120);
            } else {
                typingInProgress = false;
            }
        };
        type();
    };

    const createSkillsChart = () => {
        if (!skillsCanvas) return;
        if (skillsCanvas.chart) {
            skillsCanvas.chart.destroy();
        }
        const ctx = skillsCanvas.getContext('2d');
        const isLightMode = document.body.classList.contains('light-mode');
        const chartGridColor = isLightMode ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.2)';
        const chartLabelColor = isLightMode ? '#333333' : '#EAEAEA';

        skillsCanvas.chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Front-end', 'Algorithms', 'UI/UX', 'Problem Solving', 'Back-end', 'DevOps'],
                datasets: [{
                    label: currentTranslations.skills_chart_label || 'My Skillset',
                    data: [9, 8, 7, 9, 5, 4],
                    backgroundColor: isLightMode ? 'rgba(0, 128, 43, 0.2)' : 'rgba(0, 255, 65, 0.2)',
                    borderColor: isLightMode ? 'rgba(0, 128, 43, 1)' : 'rgba(0, 255, 65, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: isLightMode ? 'rgba(0, 128, 43, 1)' : 'rgba(0, 255, 65, 1)',
                    pointBorderColor: isLightMode ? '#FFFFFF' : '#fff',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: chartGridColor },
                        grid: { color: chartGridColor },
                        pointLabels: {
                            color: chartLabelColor,
                            font: { size: 14, family: "'Inter', sans-serif" }
                        },
                        ticks: { display: false, stepSize: 2 },
                        suggestedMin: 0,
                        suggestedMax: 10
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    };

    // Hàm cập nhật các nội dung động không thể chỉ dựa vào data-i18n-key
    function updateDynamicContent() {
        // 1. Chạy lại hiệu ứng gõ chữ với text mới
        runTypingEffect();

        // 2. Vẽ lại biểu đồ skills với nhãn mới
        if (skillsCanvas && skillsCanvas.chart) {
            skillsCanvas.chart.destroy(); // Phải hủy biểu đồ cũ trước khi vẽ mới
        }
        createSkillsChart();
        
        // 3. Cập nhật lại tooltip của các chấm điều hướng
        
        // 4. Cập nhật text loading của Github
        const activityContainer = document.getElementById('github-activity-container');
        if (activityContainer && !activityContainer.dataset.loaded) {
            const loadingText = activityContainer.querySelector('.activity-item.loading p');
            if (loadingText) {
                loadingText.textContent = currentTranslations.activity_loading || "Fetching latest commits from GitHub...";
            }
        }
    }




    
    // Thêm sự kiện click cho các nút ngôn ngữ
    langButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedLang = button.dataset.lang;
            setLanguage(selectedLang);
        });
    });

    // Hàm khởi tạo: Kiểm tra ngôn ngữ đã lưu và áp dụng khi tải trang
    function initializeLanguage() {
        const savedLang = localStorage.getItem('user-lang') || 'vi'; // Mặc định là tiếng Việt
        setLanguage(savedLang);
    }

    // Chạy hàm khởi tạo ngôn ngữ
    initializeLanguage();


    // KHAI BÁO BIẾN CHO MODAL BLOG VÀ "WHAT I USE"
    const blogModal = document.getElementById('blog-modal'); 
    const modalBody = document.querySelector('#blog-modal .modal-body'); 
    const closeModalBtn = document.querySelector('#blog-modal .close-modal-btn'); 
    const writingCards = document.querySelectorAll('.writing-card'); 
    const usesLink = document.getElementById('uses-link'); 

    let typingInProgress = false;

    // == FAVICON ĐỘNG ==
    const favicons = {
        dark: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%2300ff41%22/></svg>",
        light: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%2300802b%22/></svg>",
        terminal: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22 fill=%22%2300ff41%22>>_</text></svg>"
    };
    const updateFavicon = (newIcon) => { if (faviconTag) faviconTag.href = newIcon; };
    
    // == CHẾ ĐỘ SÁNG/TỐI ==
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'light') { document.body.classList.add('light-mode'); if (themeToggle) themeToggle.checked = true; updateFavicon(favicons.light); }
    if (themeToggle) {
        themeToggle.addEventListener('change', function() {
            playSound('toggle.mp3');
            if (this.checked) { document.body.classList.add('light-mode'); localStorage.setItem('theme', 'light'); updateFavicon(favicons.light); } 
            else { document.body.classList.remove('light-mode'); localStorage.setItem('theme', 'dark'); updateFavicon(favicons.dark); }
        });
    }

    // == LOGIC BẬT/TẮT NỀN VŨ TRỤ ==
    const savedBgState = localStorage.getItem('background-enabled');
    if (bgToggle) { // Đảm bảo nút tồn tại
        if (savedBgState === 'false') { // Nếu trạng thái lưu là 'false' (đã tắt)
            document.body.classList.add('no-background');
            bgToggle.checked = false; // Đặt trạng thái nút là TẮT
        } else {
            // Mặc định là bật nếu chưa có trạng thái hoặc là 'true'
            document.body.classList.remove('no-background');
            bgToggle.checked = true; // Đặt trạng thái nút là BẬT
        }

        bgToggle.addEventListener('change', function() {
            if (this.checked) { // Nếu nút được bật
                document.body.classList.remove('no-background');
                localStorage.setItem('background-enabled', 'true');
                // playSound('background_on.mp3'); // Tùy chọn: âm thanh khi bật
            } else { // Nếu nút được tắt
                document.body.classList.add('no-background');
                localStorage.setItem('background-enabled', 'false');
                // playSound('background_off.mp3'); // Tùy chọn: âm thanh khi tắt
            }
        });
    }

    // == LOGIC HIỆN/ẨN PANEL CÀI ĐẶT ==
    if (settingsButton && settingsPanel) {
        settingsButton.addEventListener('click', () => {
            settingsPanel.classList.toggle('active'); // Bật/tắt class 'active'
        });

        // Đóng panel khi click ra ngoài
        document.addEventListener('click', (event) => {
            // Nếu click không phải là nút settings VÀ không phải bên trong panel settings
            if (!settingsButton.contains(event.target) && !settingsPanel.contains(event.target)) {
                if (settingsPanel.classList.contains('active')) {
                    settingsPanel.classList.remove('active');
                }
            }
        });
    }

    // == CÁC HÀM CHỨC NĂNG ==
    const playSound = (soundFile) => { const audio = new Audio(`sounds/${soundFile}`); audio.volume = 0.2; audio.play().catch(e => {}); };
        // == LOGIC CHO TOP NAVIGATION BAR ==
    const topNav = document.getElementById('top-nav');
    const fullpageContainer = document.querySelector('.fullpage-container');

    // Hàm kiểm tra và hiển thị/ẩn top nav
    const checkTopNavVisibility = () => {
        if (!topNav || !fullpageContainer) return;
        // Hiện top nav khi cuộn xuống qua trang Home
        if (fullpageContainer.scrollTop > window.innerHeight * 0.5) { 
            topNav.classList.add('visible');
        } else {
            topNav.classList.remove('visible');
        }
    };

    // Lắng nghe sự kiện cuộn trên fullpage-container
    if (fullpageContainer) {
        fullpageContainer.addEventListener('scroll', checkTopNavVisibility);
        // Gọi hàm một lần khi tải trang để xử lý trường hợp người dùng reload giữa chừng
        checkTopNavVisibility();
    }
    const navLinks = document.querySelectorAll('.page-nav a');
    const animateTimeline = () => { const timelineItems = document.querySelectorAll('.timeline-item'); timelineItems.forEach((item, index) => { item.style.transitionDelay = `${index * 0.2}s`; }); };  
    const fetchGitHubActivity = async () => { 
        const activityContainer = document.getElementById('github-activity-container');
        if (!activityContainer || activityContainer.dataset.loaded) return;
        addLogMessage(`[${new Date().toLocaleTimeString('en-GB')}] Fetching GitHub activity...`, 100); 
        const username = 'NhatNguyenYn'; 
        const url = `https://api.github.com/users/NhatNguyenYn/events/public`;
        try { 
            const response = await fetch(url);
            if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
            const events = await response.json();
            const pushEvents = events.filter(event => event.type === 'PushEvent');
            const latestCommits = pushEvents.slice(0, 3);
            activityContainer.innerHTML = '';
            if (latestCommits.length > 0) {
                latestCommits.forEach(event => {
                    const repoName = event.repo.name;
                    const repoUrl = `https://github.com/${repoName}`;
                    const commit = event.payload.commits[0];
                    const commitMessage = commit.message;
                    const commitUrl = `https://github.com/${repoName}/commit/${commit.sha}`;
                    const activityHTML = `<div class="activity-item"><div class="activity-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 10 20 15 15 20"></polyline><path d="M4 4v7a4 4 0 0 0 4 4h12"></path></svg></div><div class="activity-details"><a href="${commitUrl}" target="_blank" class="commit-message">${commitMessage}</a><p class="commit-info">pushed to <a href="${repoUrl}" target="_blank">${repoName}</a></p></div></div>`;
                    activityContainer.insertAdjacentHTML('beforeend', activityHTML);
                });
                addLogMessage(`[${new Date().toLocaleTimeString('en-GB')}] GitHub activity loaded.`, 100); 
            } else {
                activityContainer.innerHTML = '<p>No recent public push events found.</p>';
                addLogMessage(`[${new Date().toLocaleTimeString('en-GB')}] No GitHub activity found.`, 100);
            }
            activityContainer.dataset.loaded = 'true';
        } catch (error) {
            console.error('Failed to fetch GitHub activity:', error);
            activityContainer.innerHTML = `<p style="color: var(--accent-color);">Could not load GitHub activity.</p>`;
            addLogMessage(`[${new Date().toLocaleTimeString('en-GB')}] Error loading GitHub activity.`, 100);
        }
    };
    
    // == GIAO DIỆN DÒNG LỆNH (CLI) ==
    const commands = { 
        'help': 'Hiển thị danh sách các lệnh.', 
        'about': 'Xem thông tin giới thiệu.', 
        'projects': 'Liệt kê các dự án.', 
        'goto <section>': 'Di chuyển đến section.', 
        'clear': 'Xóa màn hình terminal.', 
        'exit': 'Đóng terminal.' 
    };

    const printToTerminal = (text, type = 'output') => {
        if (!terminalOutput) return;
        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        line.textContent = text;
        terminalOutput.appendChild(line);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    };

    // Hàm xử lý lệnh (có thể thêm các lệnh bạn muốn ở đây)
    const processCommand = (command) => {
        printToTerminal(`> ${command}`, 'command'); // In lệnh đã nhập
        const args = command.split(' ');
        const cmd = args[0].toLowerCase();

        switch (cmd) {
            case 'help':
                printToTerminal("Available commands:");
                for (const key in commands) {
                    printToTerminal(`  ${key}: ${commands[key]}`);
                }
                break;
            case 'about':
                printToTerminal("You are on Ngo Nhat Nguyen's portfolio.");
                printToTerminal("Aspiring MIT Engineer, crafting digital experiences from HCMUS.");
                break;
            case 'projects':
                printToTerminal("Listing featured projects:");
                projectCards.forEach(card => {
                    const title = card.querySelector('.project-card-front h3').textContent;
                    const categories = card.dataset.category.split(' ').join(', ');
                    printToTerminal(`- ${title} (Categories: ${categories})`);
                });
                printToTerminal("Visit the 'Projects' section for more details.");
                break;
            case 'goto':
                const sectionId = args[1];
                const targetSection = document.getElementById(sectionId);
                if (targetSection) {
                    fullpageContainer.scrollTo({
                        top: targetSection.offsetTop,
                        behavior: 'smooth'
                    });
                    printToTerminal(`Navigating to #${sectionId}...`);
                    toggleTerminal(); // Đóng terminal sau khi di chuyển
                } else {
                    printToTerminal(`Error: Section '${sectionId}' not found.`, 'error');
                }
                break;
            case 'clear':
                terminalOutput.innerHTML = '';
                break;
            case 'exit':
                toggleTerminal();
                printToTerminal("Terminal session ended.");
                break;
            default:
                printToTerminal(`Error: Command '${command}' not found. Type 'help' for assistance.`, 'error');
        }
        terminalInput.value = ''; // Xóa input sau khi xử lý
    };

    // Hàm ẩn/hiện terminal
    const toggleTerminal = () => { 
        if (terminalContainer.classList.contains('hidden')) {
            terminalContainer.classList.remove('hidden');
            terminalInput.focus(); // Tập trung vào input khi mở terminal
            updateFavicon(favicons.terminal); // Đổi favicon thành >_
            playSound('terminal_open.mp3'); // Đảm bảo bạn có file âm thanh này
            printToTerminal("Terminal activated. Type 'help' to get started."); // In thông báo chào mừng
        } else {
            terminalContainer.classList.add('hidden');
            terminalInput.blur(); // Bỏ focus khỏi input khi đóng terminal
            // Đặt lại favicon về theme hiện tại
            updateFavicon(localStorage.getItem('theme') === 'light' ? favicons.light : favicons.dark);
            playSound('terminal_close.mp3'); // Đảm bảo bạn có file âm thanh này
        }
    };

    // Lắng nghe phím Enter trong terminal input
    if (terminalInput) { 
        terminalInput.addEventListener('keydown', (e) => { 
            if (e.key === 'Enter') { 
                e.preventDefault(); 
                const command = terminalInput.value.trim(); 
                if (command) { 
                    processCommand(command); 
                } 
            } 
        }); 
    }

    // Lắng nghe phím ` (backtick) để bật/tắt terminal toàn trang
    window.addEventListener('keydown', (e) => { 
        if (e.key === '`' && !e.altKey && !e.ctrlKey && !e.shiftKey) { // Chỉ kích hoạt khi nhấn ` một mình
            e.preventDefault(); 
            toggleTerminal(); 
        } 
    });

    // == KÍCH HOẠT SECTION KHI CUỘN ==
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                const id = entry.target.id;
                const activeLink = document.querySelector(`.page-nav a[href="#${id}"]`);
                if (navLinks.length > 0) { navLinks.forEach(link => link.classList.remove('is-active')); if (activeLink) activeLink.classList.add('is-active'); }
                const newUrl = `${window.location.pathname.split('#')[0]}#${id}`;
                window.history.pushState({ path: newUrl }, '', newUrl);
                
                // === LOG CÁC BƯỚC KHỞI TẠO CỤ THỂ VÀO PRELOADER LOG ===
                if (id === 'home') { runTypingEffect(); addLogMessage(`[${new Date().toLocaleTimeString('en-GB')}] Home section activated.`, 100); }
                if (id === 'journey') { animateTimeline(); addLogMessage(`[${new Date().toLocaleTimeString('en-GB')}] Academic Journey loaded.`, 100); }
                if (id === 'activity') { addLogMessage(`[${new Date().toLocaleTimeString('en-GB')}] GitHub activity section activated.`, 100); fetchGitHubActivity(); } 
                if (id === 'skills') { createSkillsChart(); addLogMessage(`[${new Date().toLocaleTimeString('en-GB')}] Skillset chart initialized.`, 100); }
                if (id === 'projects') { addLogMessage(`[${new Date().toLocaleTimeString('en-GB')}] Project portfolio ready.`, 100); }
                if (id === 'writings') { addLogMessage(`[${new Date().toLocaleTimeString('en-GB')}] Writings and thoughts loaded.`, 100); }
                if (id === 'bookshelf') { addLogMessage(`[${new Date().toLocaleTimeString('en-GB')}] Virtual bookshelf online.`, 100); }
                if (id === 'contact') { addLogMessage(`[${new Date().toLocaleTimeString('en-GB')}] Contact channels established.`, 100); }
            }
        });
    }, { threshold: 0.5 });
    sections.forEach(section => { observer.observe(section); });

    // == BACKGROUND 3D ==
    const initThreeJSBackground = () => {
        if (typeof THREE === 'undefined') { 
            setTimeout(initThreeJSBackground, 100); 
            return;
        }
        const canvas = document.querySelector('#bg-canvas');
        if (!canvas) {
            console.error("Canvas for Three.js not found!");
            return;
        }
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true }); 
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.position.setZ(30);
        const particleCount = 5000; 
        const particlesGeometry = new THREE.BufferGeometry();
        const posArray = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i++) { posArray[i] = (Math.random() - 0.5) * 80; } 
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particlesMaterial = new THREE.PointsMaterial({ size: 0.025, color: 0x00ff41, transparent: true, blending: THREE.AdditiveBlending });
        const particleMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particleMesh);
        const clock = new THREE.Clock();
        const animate = () => {
            requestAnimationFrame(animate);
            const elapsedTime = clock.getElapsedTime();
            particleMesh.rotation.y = elapsedTime * 0.03; 
            particleMesh.rotation.x = elapsedTime * 0.02; 
            renderer.render(scene, camera);
        };
        animate();
        window.addEventListener('resize', () => { renderer.setSize(window.innerWidth, window.innerHeight); camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); });
        addLogMessage(`[${new Date().toLocaleTimeString('en-GB')}] Background system loaded.`, 100);
    };
    initThreeJSBackground(); 

    // == LỌC DỰ ÁN ==
    const filterContainer = document.querySelector('.filter-buttons');
    const projectCards = document.querySelectorAll('.project-grid .project-card');
    if (filterContainer) { 
        filterContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                filterContainer.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');

                const filterValue = e.target.dataset.filter;

                projectCards.forEach(card => {
                    if (filterValue === 'all' || card.dataset.category.includes(filterValue)) {
                        card.classList.remove('hide');
                    } else {
                        card.classList.add('hide');
                    }
                });
            }
        });
    }

    // == KONAMI CODE ==
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let keyPresses = [];
    window.addEventListener('keydown', (e) => { 
        keyPresses.push(e.key);
        keyPresses.splice(-konamiCode.length - 1, keyPresses.length - konamiCode.length); 
        if (keyPresses.join('') === konamiCode.join('')) {
            playSound('konami.mp3'); // Đảm bảo bạn có file âm thanh này
            
            // KÍCH HOẠT TERMINAL KHI KONAMI CODE ĐƯỢC NHẬP
            toggleTerminal(); 
            
            // Tùy chọn: Thêm thông báo vào terminal sau khi nó mở
            setTimeout(() => { 
                printToTerminal("Konami Code activated! Terminal unlocked.", 'command');
                printToTerminal("Type 'help' for available commands.");
            }, 100); // Đợi một chút để terminal hiện lên trước khi in text

            keyPresses = []; // Reset sau khi kích hoạt
        }
    });

    // == CON TRỎ CHUỘT TÙY CHỈNH ==
    if (cursorDot && cursorCircle) {
        let mouseX = 0, mouseY = 0, circleX = 0, circleY = 0;
        window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
        function animateCursor() {
            cursorDot.style.left = `${mouseX}px`;
            cursorDot.style.top = `${mouseY}px`;
            circleX += (mouseX - circleX) * 0.15;
            circleY += (mouseY - circleY) * 0.15;
            cursorCircle.style.left = `${circleX}px`;
            cursorCircle.style.top = `${circleY}px`;
            requestAnimationFrame(animateCursor);
        }
        animateCursor();
        hoverElements.forEach(el => {
            el.addEventListener('mouseover', () => { playSound('hover.mp3'); cursorCircle.classList.add('grow'); });
            el.addEventListener('mouseleave', () => { cursorCircle.classList.remove('grow'); });
        });
        window.addEventListener('mousedown', () => cursorDot.classList.add('click'));
        window.addEventListener('mouseup', () => cursorDot.classList.remove('click'));
    }

    // == TÍNH NĂNG MỚI: MODAL CHO BÀI VIẾT BLOG VÀ "WHAT I USE"  ==
    const openBlogModal = async (contentOrUrl, isRawHtml = false) => {
        if (!blogModal || !modalBody) return;

        modalBody.innerHTML = '<p style="text-align: center; color: #888;">Loading content...</p>';
        blogModal.classList.remove('hidden');

        try {
            if (isRawHtml) { 
                modalBody.innerHTML = contentOrUrl; 
            } else { 
                const response = await fetch(contentOrUrl);
                if (!response.ok) throw new Error(`Could not load post: ${response.statusText}`);
                
                const text = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');
                const articleContent = doc.querySelector('.post-content'); 
                
                if (articleContent) {
                    modalBody.innerHTML = articleContent.innerHTML;
                } else {
                    modalBody.innerHTML = '<p style="color: var(--accent-color); text-align: center;">Error: Could not find content in post.</p>';
                }
            }

            // ===== BƯỚC NÂNG CẤP QUAN TRỌNG =====
            // Dịch tất cả các phần tử có key bên trong modal vừa được tải vào.
            modalBody.querySelectorAll('[data-i18n-key]').forEach(el => {
                const key = el.getAttribute('data-i18n-key');
                if (currentTranslations[key]) {
                    el.textContent = currentTranslations[key];
                }
            });
            // ===================================

            modalBody.scrollTop = 0; 

            if (document.body.classList.contains('light-mode')) {
                modalBody.classList.add('light-mode-content');
            } else {
                modalBody.classList.remove('light-mode-content');
            }

        } catch (error) {
            console.error('Error loading content:', error);
            modalBody.innerHTML = '<p style="color: var(--accent-color); text-align: center;">Failed to load content. Please try again later.</p>';
        }
    };
    const closeBlogModal = () => {
        if (blogModal) {
            blogModal.classList.add('hidden');
            modalBody.innerHTML = '';
        }
    };

    // Lắng nghe click vào các writing cards
    if (writingCards.length > 0) {
        writingCards.forEach(card => {
            const postUrl = card.getAttribute('href'); 
            if (postUrl && !postUrl.startsWith('#')) { 
                card.addEventListener('click', (e) => {
                    e.preventDefault(); 
                    openBlogModal(postUrl, false); 
                });
            }
        });
    }

    // LISTENER CHO LINK "WHAT I USE" (vẫn giữ là modal)
    if (usesLink) { 
        usesLink.addEventListener('click', (e) => {
            e.preventDefault(); 
            openBlogModal('uses.html', false); 
        });
    }

    // Lắng nghe click vào nút đóng modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeBlogModal);
    }

    // Đóng modal khi click ra ngoài (trên nền đen)
    if (blogModal) {
        blogModal.addEventListener('click', (e) => {
            if (e.target === blogModal) { 
                closeBlogModal();
            }
        });
    }

    // Đóng modal khi nhấn phím ESC (áp dụng cho cả terminal và blog modal)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Nếu blog modal đang mở, đóng nó
            if (!blogModal.classList.contains('hidden')) {
                closeBlogModal();
            } 
            // Nếu terminal đang mở, đóng nó
            else if (!terminalContainer.classList.contains('hidden')) { // Kiểm tra nếu terminal đang mở
                toggleTerminal();
            }
        }
    });
});