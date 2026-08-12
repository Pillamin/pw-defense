document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Elements
    const consentModal = document.getElementById('consent-modal');
    const consentCheckbox = document.getElementById('consent-checkbox');
    const startBtn = document.getElementById('start-btn');
    const mainDashboard = document.getElementById('main-dashboard');

    const inputLastName = document.getElementById('input-last-name');
    const inputFirstName = document.getElementById('input-first-name');
    const selectBirthYear = document.getElementById('select-birth-year');
    const selectBirthMonth = document.getElementById('select-birth-month');
    const selectBirthDay = document.getElementById('select-birth-day');
    const inputPhone1 = document.getElementById('input-phone-1');
    const inputPhone2 = document.getElementById('input-phone-2');
    const inputPhone3 = document.getElementById('input-phone-3');
    const randomInfoBtn = document.getElementById('random-info-btn');

    const inputPassword = document.getElementById('input-password');
    const passwordToggleBtn = document.getElementById('password-toggle-visibility-btn');

    const charLowercase = document.getElementById('char-lowercase');
    const charUppercase = document.getElementById('char-uppercase');
    const charNumber = document.getElementById('char-number');
    const charSpecial = document.getElementById('char-special');

    const selectMinLength = document.getElementById('select-min-length');
    const selectMaxLength = document.getElementById('select-max-length');

    const statNValue = document.getElementById('stat-n-value');
    const statTotalCombinations = document.getElementById('stat-total-combinations');
    const statCombinationsKorean = document.getElementById('stat-combinations-korean');


    const runModeABtn = document.getElementById('run-mode-a-btn');
    const runModeBBtn = document.getElementById('run-mode-b-btn');

    const eduBtnHash = document.getElementById('edu-btn-hash');
    const eduBtnGuide = document.getElementById('edu-btn-guide');
    const eduModalHash = document.getElementById('edu-modal-hash');
    const eduModalGuide = document.getElementById('edu-modal-guide');
    const eduCloseHashBtn = document.getElementById('edu-close-hash-btn');
    const eduCloseGuideBtn = document.getElementById('edu-close-guide-btn');

    const soundToggleBtn = document.getElementById('sound-toggle-btn');
    const resultOverlay = document.getElementById('result-overlay');
    const retryBtn = document.getElementById('retry-btn');
    const linkToModeBBtn = document.getElementById('link-to-mode-b-btn');

    // State
    let isSoundOn = true;
    let matrixInterval = null;
    let isAAttacked = false; // 예측형(조합형) 공격 탐지 여부 상태 저장

    // Single shared AudioContext (avoid creating per-sound to prevent memory leaks)
    let sharedAudioCtx = null;
    function getAudioCtx() {
        if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
            sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (sharedAudioCtx.state === 'suspended') {
            sharedAudioCtx.resume();
        }
        return sharedAudioCtx;
    }

    // Create Matrix Canvas dynamically
    const canvas = document.createElement('canvas');
    canvas.id = 'matrix-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // Handle Resize for Canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Matrix Rain Effect Logic
    let matrixActive = false;
    let columns = [];
    // 숫자 비중 높임 + 특수문자
    const charList = '0123456789012345678901234567890123456789ABCDEFabcdef$#@!%^&*<>?/\\';
    const fontSize = 15;
    const TRAIL_LEN = 22; // 트레일 길이

    function initMatrix() {
        const numCols = Math.floor(canvas.width / fontSize) + 1;
        columns = [];
        for (let i = 0; i < numCols; i++) {
            const trailLen = Math.floor(TRAIL_LEN * (0.5 + Math.random() * 0.8));
            columns.push({
                x: i * fontSize,
                y: Math.random() * -canvas.height,
                speed: 0.6 + Math.random() * 2.2,
                trail: Array.from({ length: trailLen }, () =>
                    charList[Math.floor(Math.random() * charList.length)]
                ),
                trailLen
            });
        }
    }

    function drawMatrix() {
        // 잔상 지우기 — 배경색 반투명 덮기
        ctx.fillStyle = 'rgba(1, 4, 9, 0.18)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = `bold ${fontSize}px "Share Tech Mono", monospace`;

        for (let i = 0; i < columns.length; i++) {
            const col = columns[i];

            // 트레일 글자 랜덤 교체 (깜빡임 효과)
            const flipIdx = Math.floor(Math.random() * col.trailLen);
            col.trail[flipIdx] = charList[Math.floor(Math.random() * charList.length)];

            for (let j = 0; j < col.trailLen; j++) {
                const gy = col.y - j * fontSize;
                if (gy < -fontSize || gy > canvas.height) continue;

                if (j === 0) {
                    // 선두 글자: 밝은 흰색
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = '#00ff41';
                    ctx.shadowBlur = 8;
                } else {
                    // 트레일: 선두에 가까울수록 밝은 녹색, 멀수록 어두워짐
                    const ratio = 1 - j / col.trailLen;
                    const alpha = Math.pow(ratio, 1.6);
                    const brightness = Math.floor(60 + ratio * 195);
                    ctx.fillStyle = `rgba(0, ${brightness}, ${Math.floor(brightness * 0.25)}, ${alpha})`;
                    ctx.shadowBlur = j < 4 ? 6 : 0;
                    ctx.shadowColor = '#00ff41';
                }

                ctx.fillText(col.trail[j], col.x, gy);
            }
            ctx.shadowBlur = 0;

            col.y += col.speed * fontSize * 0.38;

            if (col.y - col.trailLen * fontSize > canvas.height) {
                const trailLen = Math.floor(TRAIL_LEN * (0.5 + Math.random() * 0.8));
                col.y = Math.random() * -200 - 50;
                col.speed = 0.6 + Math.random() * 2.2;
                col.trail = Array.from({ length: trailLen }, () =>
                    charList[Math.floor(Math.random() * charList.length)]
                );
                col.trailLen = trailLen;
            }
        }
    }

    function startMatrixEffect() {
        if (matrixInterval) clearInterval(matrixInterval);
        initMatrix();
        matrixActive = true;
        canvas.style.opacity = '0.38';
        matrixInterval = setInterval(drawMatrix, 40);
    }

    function stopMatrixEffect() {
        matrixActive = false;
        clearInterval(matrixInterval);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.opacity = '0';
    }

    // Sound Synthesizer using Web Audio API
    function playSound(type) {
        if (!isSoundOn) return;
        try {
            const audioCtx = getAudioCtx();
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            if (type === 'tick') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.03);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.03);
            } else if (type === 'lock') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.08);
            } else if (type === 'typewriter') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(350, audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.02);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.02);
            } else if (type === 'success') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
                osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
                osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
                gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.45);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.45);
            } else if (type === 'fail') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, audioCtx.currentTime);
                osc.frequency.linearRampToValueAtTime(90, audioCtx.currentTime + 0.35);
                gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.35);
            }
        } catch (e) {
            console.warn('Audio Context block/error', e);
        }
    }

    // Consent Modal Handlers
    consentCheckbox.addEventListener('change', () => {
        // 체크 시 흔들림 클래스 제거
        consentCheckbox.closest('.checkbox-label')?.classList.remove('shake');
    });

    startBtn.addEventListener('click', () => {
        if (!consentCheckbox.checked) {
            playSound('fail');
            const label = consentCheckbox.closest('.checkbox-label');
            label.classList.remove('shake');
            void label.offsetWidth; // reflow 연속 적용 보장
            label.classList.add('shake');
            return;
        }
        playSound('success');
        consentModal.style.display = 'none';
    });


    // Populate Birthday Dropdowns dynamically
    function populateBirthdayDropdowns() {
        const currentYear = new Date().getFullYear();
        // 60년 범위로 확장 (이전: 30년)
        for (let y = currentYear; y >= currentYear - 60; y--) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = `${y}년`;
            if (y === 2000) opt.selected = true;
            selectBirthYear.appendChild(opt);
        }
        
        for (let m = 1; m <= 12; m++) {
            const val = String(m).padStart(2, '0');
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = `${m}월`;
            if (m === 10) opt.selected = true;
            selectBirthMonth.appendChild(opt);
        }

        function updateDays() {
            const year = parseInt(selectBirthYear.value, 10);
            const month = parseInt(selectBirthMonth.value, 10);
            const daysInMonth = new Date(year, month, 0).getDate();
            
            const prevVal = selectBirthDay.value;
            selectBirthDay.innerHTML = '';
            for (let d = 1; d <= daysInMonth; d++) {
                const val = String(d).padStart(2, '0');
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = `${d}일`;
                if (val === prevVal || (d === 24 && !prevVal)) opt.selected = true;
                selectBirthDay.appendChild(opt);
            }
        }

        selectBirthYear.addEventListener('change', updateDays);
        selectBirthMonth.addEventListener('change', updateDays);
        updateDays();
    }
    populateBirthdayDropdowns();

    // Random Info Generator
    const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '전', '홍'];
    const middleNames = ['민', '서', '예', '지', '신', '동', '현', '우', '범', '은', '준', '성', '재', '영', '지', '연', '수', '혜', '정', '훈'];
    const girlNames = ['아', '연', '우', '은', '현', '서', '원', '경', '빈', '혜', '윤', '진', '율', '하', '은', '미', '나', '희', '은', '교'];

    randomInfoBtn.addEventListener('click', () => {
        playSound('typewriter');
        const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const randomMiddleName = middleNames[Math.floor(Math.random() * middleNames.length)];
        const randomGirlName = girlNames[Math.floor(Math.random() * girlNames.length)];
        inputLastName.value = randomLastName;
        inputFirstName.value = randomMiddleName + randomGirlName;

        const randomYear = String(2008 + Math.floor(Math.random() * 9));
        const randomMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
        const randomDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
        
        selectBirthYear.value = randomYear;
        selectBirthMonth.value = randomMonth;
        // Trigger day update manually before selecting day
        selectBirthMonth.dispatchEvent(new Event('change'));
        selectBirthDay.value = randomDay;

        inputPhone1.value = '010';
        inputPhone2.value = String(Math.floor(1000 + Math.random() * 9000));
        inputPhone3.value = String(Math.floor(1000 + Math.random() * 9000));
        
        validateInputsAndCalculate();
    });

    // Password Visibility Toggle
    passwordToggleBtn.addEventListener('click', () => {
        playSound('typewriter');
        if (inputPassword.type === 'password') {
            inputPassword.type = 'text';
            passwordToggleBtn.textContent = '숨기기';
        } else {
            inputPassword.type = 'password';
            passwordToggleBtn.textContent = '보기';
        }
    });

    // Real-time Combinations Calculator (BigInt)
    function calculateCombinations() {
        let N = 0;
        if (charLowercase.checked) N += 26;
        if (charUppercase.checked) N += 26;
        if (charNumber.checked) N += 10;
        if (charSpecial.checked) N += 32;

        statNValue.textContent = N;

        const minL = parseInt(selectMinLength.value, 10);
        const maxL = parseInt(selectMaxLength.value, 10);

        if (N === 0 || minL > maxL) {
            statTotalCombinations.textContent = '0';
            statCombinationsKorean.textContent = '';
            return { N, total: 0n };
        }

        let total = 0n;
        const bigN = BigInt(N);
        for (let i = minL; i <= maxL; i++) {
            total += bigN ** BigInt(i);
        }

        statTotalCombinations.textContent = total.toLocaleString('ko-KR');
        statCombinationsKorean.textContent = formatKoreanNumber(total) ? `(약 ${formatKoreanNumber(total)} 개)` : '';

        return { N, total };
    }

    function formatKoreanNumber(num) {
        if (num === 0n) return '';
        const units = ['', '만', '억', '조', '경', '해', '자', '양', '구', '간', '정', '재', '극'];
        let result = [];
        let temp = num;
        let unitIdx = 0;

        while (temp > 0n && unitIdx < units.length) {
            const remainder = Number(temp % 10000n);
            if (remainder > 0) {
                result.unshift(`${remainder}${units[unitIdx]}`);
            }
            temp = temp / 10000n;
            unitIdx++;
        }

        if (result.length > 2) {
            return result.slice(0, 2).join(' ') + ' ';
        }
        return result.join(' ');
    }

    // 검증 결과를 반환 + 인라인 힌트 표시 (버튼 비활성화는 하지 않음)
    function validateInputsAndCalculate() {
        const { N } = calculateCombinations();
        const password = inputPassword.value;
        const minL = parseInt(selectMinLength.value, 10);
        const maxL = parseInt(selectMaxLength.value, 10);

        let hasLowercase = !charLowercase.checked || /[a-z]/.test(password);
        let hasUppercase = !charUppercase.checked || /[A-Z]/.test(password);
        let hasNumber    = !charNumber.checked    || /[0-9]/.test(password);
        let hasSpecial   = !charSpecial.checked   || /[^a-zA-Z0-9]/.test(password);

        const isLengthValid          = password.length >= minL && password.length <= maxL;
        const isCharTypesValid       = hasLowercase && hasUppercase && hasNumber && hasSpecial;
        const isConstraintsConfigured = N > 0 && minL <= maxL;
        const isValid = password.length > 0 && isLengthValid && isCharTypesValid && isConstraintsConfigured;


        // 버튼은 항상 활성화 — 비활성화 없음
        runModeABtn.disabled = false;
        runModeBBtn.disabled = false;

        updateEnterHint(isValid);
        return isValid;
    }

    // 검증 실패 시 팝업 안내창
    function showValidationPopup() {
        const N    = (() => {
            let n = 0;
            if (charLowercase.checked) n += 26;
            if (charUppercase.checked) n += 26;
            if (charNumber.checked)    n += 10;
            if (charSpecial.checked)   n += 32;
            return n;
        })();
        const password = inputPassword.value;
        const minL = parseInt(selectMinLength.value, 10);
        const maxL = parseInt(selectMaxLength.value, 10);

        const issues = [];
        if (password.length === 0) {
            issues.push('비밀번호를 입력해 주세요.');
        } else {
            if (N === 0)                  issues.push('문자 조합(소문자, 대문자, 숫자, 특수문자 중 하나 이상)을 체크해 주세요.');
            if (minL > maxL)             issues.push('최소 자릿수가 최대 자릿수보다 클 수 없습니다.');
            if (password.length < minL)  issues.push(`비밀번호가 너무 짧습니다. (현재 ${password.length}자 / 최소 ${minL}자 필요)`);
            if (password.length > maxL)  issues.push(`비밀번호가 너무 깁니다. (현재 ${password.length}자 / 최대 ${maxL}자)`);
            if (charLowercase.checked && !/[a-z]/.test(password)) issues.push('소문자(a-z)가 포함되어야 합니다.');
            if (charUppercase.checked && !/[A-Z]/.test(password)) issues.push('대문자(A-Z)가 포함되어야 합니다.');
            if (charNumber.checked    && !/[0-9]/.test(password)) issues.push('숫자(0-9)가 포함되어야 합니다.');
            if (charSpecial.checked   && !/[^a-zA-Z0-9]/.test(password)) issues.push('특수문자가 포함되어야 합니다.');
        }

        // 팝업 모달 동적 생성 (이미 있으면 재사용)
        let popup = document.getElementById('validation-popup-modal');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'validation-popup-modal';
            popup.className = 'modal-overlay';
            popup.style.cssText = 'display:none; z-index:2000;';
            popup.innerHTML = `
                <div class="modal-content" style="max-width:480px;">
                    <button type="button" class="modal-close-x-btn" id="val-popup-x">&times;</button>
                    <h2 class="modal-title" style="color:var(--red);text-shadow:var(--glow-r);font-size:1rem;">
                        ⚠ 입력 조건 불일치
                    </h2>
                    <div class="modal-body" id="val-popup-body" style="color:var(--text-main);"></div>
                    <div class="modal-footer">
                        <button type="button" id="val-popup-ok" class="primary-btn">확인</button>
                    </div>
                </div>`;
            document.body.appendChild(popup);
            document.getElementById('val-popup-x').addEventListener('click',  () => { popup.style.display = 'none'; });
            document.getElementById('val-popup-ok').addEventListener('click', () => { popup.style.display = 'none'; playSound('typewriter'); });
            popup.addEventListener('click', e => { if (e.target === popup) popup.style.display = 'none'; });
        }

        const body = document.getElementById('val-popup-body');
        body.innerHTML = `<ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:10px;">
            ${issues.map(msg => `<li style="display:flex;gap:8px;align-items:flex-start;"><span style="color:var(--red);font-family:var(--font-mono);flex-shrink:0;">▸</span><span>${msg}</span></li>`).join('')}
        </ul>`;

        playSound('fail');
        popup.style.display = 'flex';
    }

    // Event listeners for inputs
    // selectBirthYear, selectBirthMonth는 populateBirthdayDropdowns()에서 'change' 이미 등록 → 중복 제외
    const inputsToWatch = [
        inputLastName, inputFirstName,
        selectBirthDay,
        inputPhone1, inputPhone2, inputPhone3,
        inputPassword,
        charLowercase, charUppercase, charNumber, charSpecial
    ];
    inputsToWatch.forEach(el => {
        el.addEventListener('input', () => {
            playSound('typewriter');
            validateInputsAndCalculate();
        });
        el.addEventListener('change', () => {
            playSound('typewriter');
            validateInputsAndCalculate();
        });
    });
    // 생년월일 select는 change만 (input 이벤트 없음)
    [selectBirthYear, selectBirthMonth].forEach(el => {
        el.addEventListener('change', () => {
            playSound('typewriter');
            validateInputsAndCalculate();
        });
    });

    selectMinLength.addEventListener('change', () => {
        playSound('typewriter');
        const minVal = parseInt(selectMinLength.value, 10);
        const maxVal = parseInt(selectMaxLength.value, 10);
        if (minVal > maxVal) {
            selectMaxLength.value = selectMinLength.value;
        }
        validateInputsAndCalculate();
    });

    selectMaxLength.addEventListener('change', () => {
        playSound('typewriter');
        const minVal = parseInt(selectMinLength.value, 10);
        const maxVal = parseInt(selectMaxLength.value, 10);
        if (maxVal < minVal) {
            selectMinLength.value = selectMaxLength.value;
        }
        validateInputsAndCalculate();
    });

    // Sound toggle button
    soundToggleBtn.textContent = '소리 ON'; // 초기 상태 동기화
    soundToggleBtn.addEventListener('click', () => {
        isSoundOn = !isSoundOn;
        if (isSoundOn) {
            soundToggleBtn.textContent = '소리 ON';
            soundToggleBtn.classList.remove('off');
            playSound('success');
        } else {
            soundToggleBtn.textContent = '소리 OFF';
            soundToggleBtn.classList.add('off');
        }
    });

    // Educational Modals
    function loadEduContent(url, modal) {
        fetch(url)
            .then(res => res.text())
            .then(data => {
                // XSS 방지: DOMParser로 안전하게 파싱 후 body 노드 삽입
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');
                const modalBody = modal.querySelector('.modal-body');
                modalBody.innerHTML = '';
                Array.from(doc.body.childNodes).forEach(node => {
                    modalBody.appendChild(document.importNode(node, true));
                });
                modal.style.display = 'flex';
            })
            .catch(err => {
                console.error(`Failed to load edu content from ${url}`, err);
                modal.style.display = 'flex';
            });
    }

    eduBtnHash.addEventListener('click', () => {
        playSound('success');
        loadEduContent('edu_hash.html', eduModalHash);
    });
    eduBtnGuide.addEventListener('click', () => {
        playSound('success');
        loadEduContent('edu_guide.html', eduModalGuide);
    });
    eduCloseHashBtn.addEventListener('click', () => {
        playSound('typewriter');
        eduModalHash.style.display = 'none';
    });
    eduCloseGuideBtn.addEventListener('click', () => {
        playSound('typewriter');
        eduModalGuide.style.display = 'none';
    });

    [eduModalHash, eduModalGuide].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Hangul to QWERTY Mapping
    function hangulToQwerty(text) {
        const choMap = ['r', 'R', 's', 'e', 'E', 'f', 'a', 'q', 'Q', 't', 'T', 'd', 'w', 'W', 'c', 'z', 'x', 'v', 'g'];
        const jungMap = ['k', 'o', 'i', 'O', 'j', 'p', 'u', 'P', 'h', 'hk', 'ho', 'hl', 'y', 'n', 'nj', 'np', 'nl', 'b', 'm', 'ml', 'l'];
        const jongMap = ['', 'r', 'R', 'rt', 's', 'sg', 'sj', 'd', 'dt', 't', 'T', 'l', 'lr', 'lh', 'lm', 'lb', 'ls', 'lt', 'lp', 'lh', 'q', 'qt', 'w', 'c', 'z', 'x', 'v', 'g'];

        let result = '';
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i);
            if (code >= 0xAC00 && code <= 0xD7A3) {
                const index = code - 0xAC00;
                const cho = Math.floor(index / 588);
                const jung = Math.floor((index % 588) / 28);
                const jong = index % 28;
                result += choMap[cho] + jungMap[jung] + jongMap[jong];
            } else {
                result += text[i];
            }
        }
        return result;
    }

    function getHangulInitials(text) {
        const choMap = ['r', 'R', 's', 'e', 'E', 'f', 'a', 'q', 'Q', 't', 'T', 'd', 'w', 'W', 'c', 'z', 'x', 'v', 'g'];
        let initials = '';
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i);
            if (code >= 0xAC00 && code <= 0xD7A3) {
                const index = code - 0xAC00;
                const cho = Math.floor(index / 588);
                initials += choMap[cho];
            } else {
                initials += text[i];
            }
        }
        return initials;
    }

    function capitalizeFirstLetter(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function checkPatternAttack(password, lastName, firstName, birthday, phone) {

        // ═══════════════════════════════════════════════════════════════
        // 1. 재료 원소 추출
        // ═══════════════════════════════════════════════════════════════

        // ── 1.1 이름 관련 (한영자판 변환 + 한글 원문) ──
        const lastQwerty  = hangulToQwerty(lastName);
        const firstQwerty = hangulToQwerty(firstName);
        const fullQwerty  = lastQwerty + firstQwerty;

        // 풀네임 이니셜(한영자판): 성 QWERTY 첫자 + 이름 QWERTY 첫자
        const fullInitialQ  = (lastQwerty[0]  || '') + (firstQwerty[0] || '');
        // 이름 이니셜(한영자판): 이름 QWERTY 첫자만
        const firstInitialQ = firstQwerty[0] || '';
        // 한글 초성 자음 (한영자판 변환) - 성+이름 전체 초성
        const consonantsQ   = getHangulInitials(lastName + firstName);

        // 이름 후보 (원형, 대소문자 변형 전)
        const nameBase = [
            { val: lastQwerty,           desc: '성(한영자판)' },
            { val: firstQwerty,          desc: '이름(한영자판)' },
            { val: fullQwerty,           desc: '성+이름 풀네임(한영자판)' },
            { val: fullInitialQ,         desc: '풀네임 이니셜(한영자판)' },
            { val: firstInitialQ,        desc: '이름 이니셜(한영자판)' },
            { val: consonantsQ,          desc: '한글 초성(한영자판)' },
            { val: lastName,             desc: '성(한글)' },
            { val: firstName,            desc: '이름(한글)' },
            { val: lastName + firstName, desc: '성+이름 풀네임(한글)' },
        ].filter(c => c.val && c.val.trim().length > 0);

        // 대소문자 변형 적용 (영문/QWERTY 계열만)
        const nameElements = [];
        for (const c of nameBase) {
            nameElements.push(c); // 원형 그대로
            if (/^[a-zA-Z]/.test(c.val)) {
                const lower    = c.val.toLowerCase();
                const upper    = c.val.toUpperCase();
                const capFirst = lower[0].toUpperCase() + lower.slice(1);
                // 카멜 케이스: 성+이름 풀네임일 때 성/이름 각각 첫자 대문자
                const camel = (c.val === fullQwerty && lastQwerty && firstQwerty)
                    ? (lastQwerty[0].toUpperCase()  + lastQwerty.slice(1).toLowerCase()
                       + firstQwerty[0].toUpperCase() + firstQwerty.slice(1).toLowerCase())
                    : null;

                if (lower    !== c.val)                          nameElements.push({ val: lower,    desc: c.desc + '(전체소문자)' });
                if (capFirst !== c.val && capFirst !== lower)    nameElements.push({ val: capFirst, desc: c.desc + '(첫글자대문자)' });
                if (camel && camel !== c.val && camel !== capFirst)
                                                                 nameElements.push({ val: camel,    desc: c.desc + '(카멜케이스)' });
                if (upper    !== c.val && upper !== capFirst)    nameElements.push({ val: upper,    desc: c.desc + '(전체대문자)' });
            }
        }

        // ── 1.2 생년월일 요소 ──
        const bYear  = document.getElementById('select-birth-year')?.value  || '2000';
        const bMonth = document.getElementById('select-birth-month')?.value || '01';
        const bDay   = document.getElementById('select-birth-day')?.value   || '01';

        const bMonthNZ = bMonth.replace(/^0/, '');  // 앞 0 제거
        const bDayNZ   = bDay.replace(/^0/, '');
        const bY2      = bYear.slice(2);

        const dateElements = [
            { val: bYear + bMonth + bDay,       desc: '생년월일 YYYYMMDD(8자리)' },
            { val: bY2   + bMonth + bDay,       desc: '생년월일 YYMMDD(6자리)' },
            { val: bMonth + bDay,               desc: '생일 MMDD(4자리)' },
            { val: bYear,                       desc: '출생연도 YYYY(4자리)' },
            { val: bY2,                         desc: '출생연도 YY(2자리)' },
            { val: bMonthNZ + '.' + bDayNZ,     desc: '생일 M.D(점구분)' },
            { val: bMonthNZ + bDay,             desc: '생일 M+DD(월0제거)' },
            { val: bMonth   + bDayNZ,           desc: '생일 MM+D(일0제거)' },
            { val: bMonthNZ + bDayNZ,           desc: '생일 M+D(둘다0제거)' },
        ].filter(d => d.val && d.val.trim().length > 0 && d.val !== '.');

        // ── 1.3 전화번호 요소 ──
        const ph2 = document.getElementById('input-phone-2')?.value || '';
        const ph3 = document.getElementById('input-phone-3')?.value || '';

        const phoneElements = [];
        if (ph3)           phoneElements.push({ val: ph3,        desc: '전화번호 뒷자리(4자리)' });
        if (ph2)           phoneElements.push({ val: ph2,        desc: '전화번호 가운데(3~4자리)' });
        if (ph2 && ph3)    phoneElements.push({ val: ph2 + ph3,  desc: '전화번호 가운데+뒷자리(7~8자리)' });

        // ── 1.4 특수문자 세트 ──
        const specialElements = [
            // 단일
            { val: '!',    desc: '특수(!)' },   { val: '@',  desc: '특수(@)' },
            { val: '#',    desc: '특수(#)' },   { val: '$',  desc: '특수($)' },
            { val: '%',    desc: '특수(%)' },   { val: '^',  desc: '특수(^)' },
            { val: '&',    desc: '특수(&)' },   { val: '*',  desc: '특수(*)' },
            { val: '?',    desc: '특수(?)' },   { val: '_',  desc: '특수(_)' },
            { val: '+',    desc: '특수(+)' },
            // 2자 조합
            { val: '!!',   desc: '특수(!!)' },  { val: '!@', desc: '특수(!@)' },
            { val: '@!',   desc: '특수(@!)' },  { val: '@@', desc: '특수(@@)' },
            { val: '!#',   desc: '특수(!#)' },  { val: '@#', desc: '특수(@#)' },
            { val: '#!',   desc: '특수(#!)' },  { val: '!$', desc: '특수(!$)' },
            // 3자/4자 조합
            { val: '!@#',  desc: '특수(!@#)'  },
            { val: '!@#$', desc: '특수(!@#$)' },
            { val: '@#$',  desc: '특수(@#$)'  },
            { val: '#$%',  desc: '특수(#$%)'  },
        ];

        // ═══════════════════════════════════════════════════════════════
        // 2. 위치 조합 전수 생성
        // ═══════════════════════════════════════════════════════════════

        const allPersonal = [...nameElements, ...dateElements, ...phoneElements];
        const dictionary  = [];
        const add = (pw, pattern) => { if (pw.length >= 3) dictionary.push({ password: pw, pattern }); };

        // 2.1 단일 재료
        for (const m of allPersonal) add(m.val, m.desc);

        // 2.2 단일 재료 + 특수문자 (뒤 / 앞)
        for (const m of allPersonal) {
            for (const s of specialElements) {
                add(m.val + s.val, `${m.desc} + ${s.desc}`);   // 뒤
                add(s.val + m.val, `${s.desc} + ${m.desc}`);   // 앞
            }
        }

        // 2.3 두 재료 순서 조합 (A + B) + 특수 중간 삽입 (A + 특수 + B)
        for (let i = 0; i < allPersonal.length; i++) {
            for (let j = 0; j < allPersonal.length; j++) {
                if (i === j) continue;
                const A = allPersonal[i], B = allPersonal[j];
                // A + B
                add(A.val + B.val, `${A.desc} + ${B.desc}`);
                // A + 특수 + B (중간 삽입)
                for (const s of specialElements) {
                    add(A.val + s.val + B.val, `${A.desc} + ${s.desc}(중간) + ${B.desc}`);
                }
            }
        }

        // 2.4 두 재료 + 특수문자 (뒤 / 앞)
        for (let i = 0; i < allPersonal.length; i++) {
            for (let j = 0; j < allPersonal.length; j++) {
                if (i === j) continue;
                const A = allPersonal[i], B = allPersonal[j];
                for (const s of specialElements) {
                    add(A.val + B.val + s.val, `${A.desc} + ${B.desc} + ${s.desc}`);          // 뒤
                    add(s.val + A.val + B.val, `${s.desc}(앞) + ${A.desc} + ${B.desc}`);      // 앞
                }
            }
        }

        // 2.5 상용 취약 패턴
        const commonPatterns = [
            { val: '1234',      pattern: '연속숫자(1234)' },
            { val: '12345',     pattern: '연속숫자(12345)' },
            { val: '123456',    pattern: '연속숫자(123456)' },
            { val: '12345678',  pattern: '연속숫자(12345678)' },
            { val: '1111',      pattern: '반복숫자(1111)' },
            { val: '0000',      pattern: '반복숫자(0000)' },
            { val: '9999',      pattern: '반복숫자(9999)' },
            { val: 'asdf',      pattern: '키보드패턴(asdf)' },
            { val: 'qwer',      pattern: '키보드패턴(qwer)' },
            { val: 'zxcv',      pattern: '키보드패턴(zxcv)' },
            { val: 'qwerty',    pattern: '키보드패턴(qwerty)' },
            { val: '1q2w3e',    pattern: '키보드패턴(1q2w3e)' },
            { val: '1q2w3e4r',  pattern: '키보드패턴(1q2w3e4r)' },
            { val: 'password',  pattern: '흔한단어(password)' },
            { val: 'admin',     pattern: '흔한단어(admin)' },
            { val: 'iloveyou',  pattern: '흔한단어(iloveyou)' },
            { val: 'letmein',   pattern: '흔한단어(letmein)' },
            { val: 'welcome',   pattern: '흔한단어(welcome)' },
            { val: 'monkey',    pattern: '흔한단어(monkey)' },
            { val: 'dragon',    pattern: '흔한단어(dragon)' },
        ];
        for (const cp of commonPatterns) {
            add(cp.val, cp.pattern);
            for (const s of specialElements) add(cp.val + s.val, `${cp.pattern} + ${s.desc}`);
        }

        // ═══════════════════════════════════════════════════════════════
        // 3. 검사 (includes: 부분 문자열 포함 여부)
        // ═══════════════════════════════════════════════════════════════
        const pwLower = password.toLowerCase();
        const found = dictionary.find(item => pwLower.includes(item.password.toLowerCase()));
        return found || null;
    }

    function formatTime(seconds) {
        if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return '시간 계산 불가';
        if (!isFinite(seconds)) return '사실상 불가능 (우주의 나이보다 긴 시간)';
        if (seconds < 0.01) return '0.01초 미만';
        if (seconds < 60) return `${seconds.toFixed(2)}초`;
        
        let mins = Math.floor(seconds / 60);
        let secs = Math.floor(seconds % 60);
        if (mins < 60) return `${mins}분 ${secs}초`;

        let hours = Math.floor(mins / 60);
        mins = mins % 60;
        if (hours < 24) return `${hours}시간 ${mins}분`;

        let days = Math.floor(hours / 24);
        hours = hours % 24;
        if (days < 365) return `${days}일 ${hours}시간`;

        const years = seconds / 31536000;
        if (years < 10000) return `약 ${Math.floor(years)}년`;
        
        return `약 ${years.toExponential(2)}년`;
    }

    // Trigger Screen Red Flash on Hack End
    function triggerFinishOverlay() {
        document.body.classList.add('screen-flash');
        setTimeout(() => {
            document.body.classList.remove('screen-flash');
        }, 400);
    }

    // Mode A: Smart Pattern Attack (with terminal output logging)
    function runSimulationModeA() {
        const password = inputPassword.value;
        const lastName = inputLastName.value;
        const firstName = inputFirstName.value;
        const birthday = selectBirthMonth.value + selectBirthDay.value;
        const phone = inputPhone1.value + inputPhone2.value + inputPhone3.value;

        resultOverlay.style.display = 'flex';
        document.getElementById('simulation-progress-area').style.display = 'flex';
        document.getElementById('simulation-result-report').style.display = 'none';
        document.getElementById('simulation-title').textContent = '지능형 패턴 추측 공격';
        
        // 진행 중에는 하단 제어 버튼 전부 숨김
        retryBtn.style.display = 'none';
        linkToModeBBtn.style.display = 'none';
        document.getElementById('guide-popup-btn').style.display = 'none';

        // Clear and create terminal log container inside display
        const visualDisplay = document.getElementById('simulation-visual-display');
        visualDisplay.innerHTML = '';
        const terminalLog = document.createElement('div');
        terminalLog.className = 'terminal-log';
        visualDisplay.appendChild(terminalLog);

        const logs = [
            `[SYS] Initializing Smart Pattern Dictionary...`,
            `[SYS] Translating name "${lastName}${firstName}" to QWERTY: "${hangulToQwerty(lastName) + hangulToQwerty(firstName)}"`,
            `[SYS] Compiling variations for Name, Birthday(${birthday}), Phone(${phone})...`,
            `[SYS] Generated 580 pattern variations.`,
            `[SYS] Scanning target password against patterns and common sequences...`,
            `[SCAN] Testing dictionary mapping hashes...`
        ];

        let currentLine = 0;
        function printNextLogLine() {
            if (currentLine < logs.length) {
                const line = document.createElement('p');
                line.className = 'terminal-log-line';
                line.textContent = logs[currentLine];
                terminalLog.appendChild(line);
                terminalLog.scrollTop = terminalLog.scrollHeight;
                playSound('typewriter');
                currentLine++;
                setTimeout(printNextLogLine, 400);
            } else {
                setTimeout(() => {
                    finishModeA(password, lastName, firstName, birthday, phone);
                }, 500);
            }
        }

        printNextLogLine();
    }

    function finishModeA(password, lastName, firstName, birthday, phone) {
        triggerFinishOverlay();
        document.getElementById('simulation-progress-area').style.display = 'none';
        document.getElementById('simulation-result-report').style.display = 'block';

        const resultMessage = document.getElementById('result-message');
        const resultTestedPassword = document.getElementById('result-tested-password');
        const resultAttempts = document.getElementById('result-attempts');
        const resultTimeTaken = document.getElementById('result-time-taken');
        const resultAnalysisComment = document.getElementById('result-analysis-comment');

        resultTestedPassword.textContent = password;
        const matchedPattern = checkPatternAttack(password, lastName, firstName, birthday, phone);

        if (matchedPattern) {
            playSound('fail');
            resultMessage.textContent = '해킹 성공! (취약 패턴 검출)';
            resultMessage.style.color = 'var(--neon-red)';
            resultMessage.style.textShadow = 'var(--glow-red)';
            
            resultAttempts.textContent = '1 (지능형 조합 매칭)';
            resultTimeTaken.textContent = '0.01초 미만';
            resultAnalysisComment.textContent = `당신의 비밀번호는 개인정보 조합 패턴인 ${matchedPattern.pattern} 에 매칭되어 해커가 사전 분석으로 단 0.01초 만에 풀어냈습니다.`;
        } else {
            playSound('success');
            resultMessage.textContent = '개인정보 조합 공격 통과! 🎉';
            resultMessage.style.color = 'var(--neon-green)';
            resultMessage.style.textShadow = 'var(--glow-green)';
            
            resultAttempts.textContent = '일치 항목 없음';
            resultTimeTaken.textContent = '대입 불가';
            resultAnalysisComment.textContent = '개인정보를 조합한 흔한 암호 패턴을 사용하지 않아 안전 검사를 통과했습니다. 하지만 초고속 무작위 대입 테스트도 해보세요.';
            linkToModeBBtn.style.display = 'block';
        }
    }

    // Mode B: Brute Force Simulation (with slot roulette lock)
    function runSimulationModeB() {
        const password = inputPassword.value;
        let N = 0;
        if (charLowercase.checked) N += 26;
        if (charUppercase.checked) N += 26;
        if (charNumber.checked) N += 10;
        if (charSpecial.checked) N += 32;

        const minL = parseInt(selectMinLength.value, 10);
        const L = password.length;

        // Math
        let attempts = 0n;
        const bigN = BigInt(N);
        for (let i = minL; i < L; i++) {
            attempts += bigN ** BigInt(i);
        }
        attempts += bigN ** BigInt(L);

        const speed = 100000000000n; // 100 Billion per second
        // BigInt끼리 나눈 후 Number 변환 (Infinity 방지)
        const secondsBig = attempts / speed;
        const secondsRemainder = Number(attempts % speed) / Number(speed);
        const seconds = Number(secondsBig) + secondsRemainder;

        // UI
        resultOverlay.style.display = 'flex';
        document.getElementById('simulation-progress-area').style.display = 'flex';
        document.getElementById('simulation-result-report').style.display = 'none';
        document.getElementById('simulation-title').textContent = '무작위 대입 공격 디펜스';
        
        // 진행 중에는 하단 제어 버튼 전부 숨김
        retryBtn.style.display = 'none';
        linkToModeBBtn.style.display = 'none';
        document.getElementById('guide-popup-btn').style.display = 'none';

        const visualDisplay = document.getElementById('simulation-visual-display');
        visualDisplay.innerHTML = '';
        
        const roulette = document.createElement('div');
        roulette.id = 'brute-force-roulette';
        roulette.className = 'roulette-container';
        visualDisplay.appendChild(roulette);

        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
        let startTimestamp = null;
        const duration = 3000;
        let lastLockedCount = -1;

        function animate(timestamp) {
            if (!startTimestamp) startTimestamp = timestamp;
            const elapsed = timestamp - startTimestamp;
            const progress = Math.min(elapsed / duration, 1);

            // Locked characters left to right
            const lockedCount = Math.floor(progress * L);
            
            // Sound play on locked count increment
            if (lockedCount > lastLockedCount && lockedCount <= L) {
                playSound('lock');
                lastLockedCount = lockedCount;
            } else if (Math.floor(elapsed / 80) % 2 === 0) {
                playSound('tick');
            }

            roulette.innerHTML = '';
            for (let i = 0; i < L; i++) {
                const span = document.createElement('span');
                if (i < lockedCount) {
                    span.textContent = password[i];
                    span.className = 'roulette-char-locked';
                } else {
                    span.textContent = chars[Math.floor(Math.random() * chars.length)];
                }
                roulette.appendChild(span);
            }

            document.getElementById('simulation-status-text').textContent = `대입 크랙 자릿수: ${Math.min(L, lockedCount + 1)}자리 탐색 완료... (초당 1,000억번 대입 중)`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                finishModeB(password, attempts, seconds);
            }
        }

        requestAnimationFrame(animate);
    }

    function finishModeB(password, attempts, seconds) {
        triggerFinishOverlay();
        playSound('success');
        document.getElementById('simulation-progress-area').style.display = 'none';
        document.getElementById('simulation-result-report').style.display = 'block';

        // 2단계 완료: 재도전 버튼 복구, 2단계 버튼 숨김
        retryBtn.textContent         = '다른 조건으로 재도전';
        retryBtn.style.display       = 'block';
        linkToModeBBtn.style.display = 'none';

        const resultMessage = document.getElementById('result-message');
        const resultTestedPassword = document.getElementById('result-tested-password');
        const resultAttempts = document.getElementById('result-attempts');
        const resultTimeTaken = document.getElementById('result-time-taken');
        const resultAnalysisComment = document.getElementById('result-analysis-comment');

        resultMessage.textContent = '디펜스 결과';
        resultMessage.style.color = 'var(--neon-red)';
        resultMessage.style.textShadow = 'var(--glow-red)';

        resultTestedPassword.textContent = password;
        resultAttempts.textContent = attempts.toLocaleString('ko-KR');
        resultTimeTaken.textContent = formatTime(seconds);

        // 총 4가지 경우의 수에 따른 가이드 멘트
        const guidePopupBtn = document.getElementById('guide-popup-btn');
        if (isAAttacked) {
            // [Case 1 & 2] 예측형(조합) 공격에서 이미 뚫렸던 경우 (무조건 안내 버튼 노출)
            guidePopupBtn.style.display = 'block';
            if (seconds < 86400) {
                // 무차별 대입으로도 취약한 경우 (하루 미만)
                resultAnalysisComment.innerHTML = `<span style="color:var(--red);">[보안 취약 등급: 최하]</span> 이미 지능형 패턴 추측 공격으로 0.01초 만에 유추될 뿐만 아니라, 무차별 대입 공격을 통해서도 단 ${formatTime(seconds)} 만에 쉽게 파괴됩니다. 즉시 비밀번호를 변경하십시오.`;
            } else {
                // 무차별 대입 성능은 버티지만 예측형 조합 때문에 털린 경우 (하루 이상)
                resultAnalysisComment.innerHTML = `<span style="color:var(--red);">[보안 취약 등급: 위험]</span> 이 패스워드는 무차별 대입(무작위 탐색)으로는 약 ${formatTime(seconds)} 동안 버틸 수 있어 복잡성은 충분합니다. 그러나, 본인의 개인정보 조합이나 연속 문자 패턴으로 인해 <strong>지능형 패턴 추측 단계(0.01초 미만)에서 즉시 해킹</strong>됩니다. 아무리 길어도 개인정보나 흔한 연속 키보드 배열이 포함되면 안전하지 않습니다.`;
            }
        } else {
            // [Case 3 & 4] 예측형(조합) 공격은 잘 통과한 경우
            if (seconds < 86400) {
                // 조합 패턴은 피했으나 단순 브루트포스에 뚫리는 경우 (하루 미만 - 실패이므로 안내 버튼 노출)
                guidePopupBtn.style.display = 'block';
                resultAnalysisComment.innerHTML = `<span style="color:var(--amber);">[보안 취약 등급: 경고]</span> 개인정보 및 연속 문자 패턴은 잘 피했습니다. 그러나 비밀번호가 단순하거나 짧아 무차별 대입 장비에 의해 단 ${formatTime(seconds)} 만에 해킹당합니다. 자릿수를 늘리고, 대소문자, 숫자, 특수문자를 조합하여 더 복잡하게 설정하세요.`;
            } else {
                // 조합 패턴도 안 쓰고 브루트포스로도 엄청 긴 시간 버티는 경우 (하루 이상 - 완벽 성공)
                guidePopupBtn.style.display = 'none';
                resultAnalysisComment.innerHTML = `<span style="color:var(--green);">[보안 취약 등급: 최상]</span> 지능형 패턴 추측 공격에 안전할 뿐만 아니라, 초고속 무작위 대입을 시도하더라도 해킹까지 약 ${formatTime(seconds)}이 소요됩니다. 완벽하게 안전하며 훌륭한 수준의 비밀번호 보안을 갖추고 있습니다.`;
            }
        }
    }

    linkToModeBBtn.addEventListener('click', () => {
        runSimulationModeB();
    });

    retryBtn.addEventListener('click', () => {
        // Clear overlay results
        const roulette = document.getElementById('brute-force-roulette');
        if (roulette) roulette.textContent = '';

        document.getElementById('result-tested-password').textContent = '';
        document.getElementById('result-attempts').textContent = '';
        document.getElementById('result-time-taken').textContent = '';
        document.getElementById('result-analysis-comment').textContent = '';
        const patternDetail = document.getElementById('result-pattern-detail');
        if (patternDetail) { patternDetail.style.display = 'none'; patternDetail.textContent = ''; }

        const terminalLog = document.querySelector('.terminal-log');
        if (terminalLog) terminalLog.innerHTML = '';

        // E: 파티클 정지 및 오버레이 카드 클래스 초기화
        stopParticles();
        const card = document.getElementById('result-card');
        if (card) card.className = 'overlay-content';

        resultOverlay.style.display = 'none';
        
        // 버튼 텍스트 및 표시 여부 기본값 복원
        retryBtn.textContent = '다른 조건으로 재도전';
        linkToModeBBtn.textContent = '무작위 대입 공격 디펜스도 해보기';
        document.getElementById('guide-popup-btn').style.display = 'none';
        
        validateInputsAndCalculate();
    });

    runModeABtn.addEventListener('click', () => {
        if (!validateInputsAndCalculate()) { showValidationPopup(); return; }
        runSimulationModeA();
    });
    runModeBBtn.addEventListener('click', () => {
        if (!validateInputsAndCalculate()) { showValidationPopup(); return; }
        runSimulationModeB();
    });

    // 안전한 비밀번호 만드는 방법 버튼 클릭 시 교육 팝업창 연동
    const guidePopupBtn = document.getElementById('guide-popup-btn');
    guidePopupBtn.addEventListener('click', () => {
        playSound('success');
        loadEduContent('edu_guide.html', eduModalGuide);
    });

    /* =============================================
       옵션 C: Escape 키 / 배경 클릭으로 모달 닫기
       ============================================= */
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        playSound('typewriter');
        // 교육 모달
        if (eduModalHash.style.display === 'flex')  { eduModalHash.style.display = 'none'; return; }
        if (eduModalGuide.style.display === 'flex') { eduModalGuide.style.display = 'none'; return; }
        // 약관 모달
        if (modalPolicy.style.display === 'flex') { modalPolicy.style.display = 'none'; return; }
        if (modalTos.style.display === 'flex') { modalTos.style.display = 'none'; return; }
        // 결과 오버레이 (재시도와 같은 동작)
        if (resultOverlay.style.display === 'flex') { retryBtn.click(); return; }
    });

    // 결과 오버레이 배경 클릭으로 닫기
    resultOverlay.addEventListener('click', (e) => {
        if (e.target === resultOverlay) { retryBtn.click(); }
    });

    /* =============================================
       옵션 D: 전화번호 자동 포커스 이동 + 숫자 전용 필터 + 엔터키 실행
       ============================================= */
    function setupPhoneAutoAdvance() {
        // 숫자만 허용 + 최대 길이 도달 시 다음 필드로 포커스
        const phoneFields = [
            { el: inputPhone1, next: inputPhone2, maxLen: 3 },
            { el: inputPhone2, next: inputPhone3, maxLen: 4 },
            { el: inputPhone3, next: inputPassword, maxLen: 4 },
        ];

        phoneFields.forEach(({ el, next, maxLen }) => {
            el.addEventListener('input', () => {
                // 숫자만 허용
                el.value = el.value.replace(/[^0-9]/g, '');
                // 완료 표시
                if (el.value.length === maxLen) {
                    el.classList.add('phone-input-done');
                    if (next) { next.focus(); }
                    playSound('lock');
                } else {
                    el.classList.remove('phone-input-done');
                }
            });
            // 붙여넣기 필터
            el.addEventListener('paste', (e) => {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
                el.value = text.slice(0, maxLen);
                el.dispatchEvent(new Event('input'));
            });
        });
    }
    setupPhoneAutoAdvance();

    // 엔터 힌트 요소 삽입 (비밀번호 input 아래)
    const enterHint = document.createElement('p');
    enterHint.className = 'enter-hint';
    enterHint.textContent = '↵ Enter — 비밀번호 디펜스 시작';
    inputPassword.parentElement.parentElement.appendChild(enterHint);

    function updateEnterHint(show) {
        enterHint.classList.toggle('visible', !!show);
    }

    // 엔터키 → 모드 A 실행
    inputPassword.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !runModeABtn.disabled) {
            e.preventDefault();
            playSound('success');
            runSimulationModeA();
        }
    });

    /* =============================================
       옵션 E: 파티클 캔버스 애니메이션 + 카운트업
       ============================================= */
    const particleCanvas = document.getElementById('particle-canvas');
    let particleCtx = null;
    let particleAnim = null;
    let particles = [];

    function initParticleCanvas() {
        if (!particleCanvas) return;
        particleCtx = particleCanvas.getContext('2d');
        particleCanvas.width  = resultOverlay.offsetWidth;
        particleCanvas.height = resultOverlay.offsetHeight;
    }

    function createParticles(mode) {
        // mode: 'hack' (빨강) | 'safe' (초록)
        particles = [];
        const count = 80;
        const color = mode === 'hack' ? '#FF1E56' : '#00FF66';
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * particleCanvas.width,
                y: Math.random() * particleCanvas.height,
                vx: (Math.random() - 0.5) * 2.5,
                vy: (Math.random() - 0.5) * 2.5 - 1.5,
                radius: 2 + Math.random() * 3,
                alpha: 1,
                decay: 0.012 + Math.random() * 0.01,
                color,
            });
        }
    }

    function drawParticles() {
        if (!particleCtx) return;
        particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
        particles = particles.filter(p => p.alpha > 0.01);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.04; // gravity
            p.alpha -= p.decay;
            particleCtx.save();
            particleCtx.globalAlpha = Math.max(0, p.alpha);
            particleCtx.shadowBlur  = 8;
            particleCtx.shadowColor = p.color;
            particleCtx.fillStyle   = p.color;
            particleCtx.beginPath();
            particleCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            particleCtx.fill();
            particleCtx.restore();
        });
        if (particles.length > 0) {
            particleAnim = requestAnimationFrame(drawParticles);
        }
    }

    function startParticles(mode) {
        initParticleCanvas();
        createParticles(mode);
        if (particleAnim) cancelAnimationFrame(particleAnim);
        particleAnim = requestAnimationFrame(drawParticles);
    }

    function stopParticles() {
        if (particleAnim) { cancelAnimationFrame(particleAnim); particleAnim = null; }
        if (particleCtx && particleCanvas) {
            particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
        }
        particles = [];
    }

    // 카운트업 애니메이션 (숫자 span을 0에서 목표값까지 올림)
    function animateCountUp(el, targetText, duration = 1200) {
        const numMatch = targetText.replace(/,/g, '').match(/^(\d+)/);
        if (!numMatch) { el.textContent = targetText; return; }
        const target = parseInt(numMatch[1], 10);
        if (isNaN(target) || target > 1e12) { el.textContent = targetText; return; } // 너무 큰 수는 스킵

        el.classList.add('countup-active');
        const suffix = targetText.slice(String(target).length);
        const start  = performance.now();
        function step(now) {
            const elapsed  = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            const current  = Math.floor(eased * target);
            el.textContent = current.toLocaleString('ko-KR') + suffix;
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = targetText;
                el.classList.remove('countup-active');
            }
        }
        requestAnimationFrame(step);
    }

    // MutationObserver 설정을 위한 결과 리포트 요소
    const resultReport = document.getElementById('simulation-result-report');

    // MutationObserver: result-report가 보일 때 E 효과 실행
    const reportObserver = new MutationObserver(() => {
        if (resultReport.style.display !== 'none' && resultReport.style.display !== '') {
            const card = document.getElementById('result-card');
            const msg  = document.getElementById('result-message');
            if (!card || !msg) return;

            // 카드 클래스 초기화 후 새 애니 적용
            card.className = 'overlay-content';
            void card.offsetWidth; // reflow

            // 단순 DOM color 대신 isAAttacked 혹은 결과 메시지 타이틀 스타일 분기를 활용하여 정확하게 녹색/적색 테마 매핑
            const isHack = isAAttacked || msg.style.color === 'var(--neon-red)' || msg.style.color.includes('255,');
            if (isHack) {
                card.classList.add('alarm-hack');
                startParticles('hack');
            } else {
                card.classList.add('safe-glow');
                startParticles('safe');
            }

            // 카운트업: 시도 횟수
            const attemptsEl = document.getElementById('result-attempts');
            if (attemptsEl && /^[\d,]+$/.test(attemptsEl.textContent.replace(/,/g, ''))) {
                animateCountUp(attemptsEl, attemptsEl.textContent);
            }
        }
    });
    reportObserver.observe(resultReport, { attributes: true, attributeFilter: ['style'] });

    /* =============================================
       옵션 B: 패턴 딕셔너리 강화 — finishModeA 후처리
       ============================================= */
    // 패턴 결과 상세 표시 (MutationObserver와 연동)
    // checkPatternAttack 이미 script에 존재 → finishModeA 결과에 상세 패턴 표시 추가
    // simulation-result-report의 result-pattern-detail을 finishModeA에서 이미 설정하는
    // 방식 대신, MutationObserver 후 result-message 텍스트 보고 판단
    // → finishModeA 함수 내 직접 수정이 깔끔하므로 해당 함수 찾아서 패치
    // (checkPatternAttack은 이미 강화된 딕셔너리를 공통 사용하므로 여기서 추가 패턴 보강)
    const _checkPatternAttackOrig = checkPatternAttack;

    // 옵션 B: 추가 패턴 확장 (연도 범위, PIN 계열 — base 함수 이후 보충)
    function checkPatternAttackEnhanced(password, lastName, firstName, birthday, phone) {
        // 강화된 기본 패턴 우선 검사
        const found = _checkPatternAttackOrig(password, lastName, firstName, birthday, phone);
        if (found) return found;

        // ── 추가: base에 없는 고유 패턴 ──
        const extraPatterns = [];
        const curYear = new Date().getFullYear();

        // 연도 패턴 (1960~현재) — 개인 생년 외의 연도도 커버
        for (let y = 1960; y <= curYear; y++) {
            extraPatterns.push({ password: String(y), pattern: `연도 패턴(${y})` });
        }

        // 4자리 반복/연속 PIN (0000~9999 반복, 0123~6789 연속)
        for (let d = 0; d <= 9; d++) {
            extraPatterns.push({ password: String(d).repeat(4), pattern: `반복 PIN(${String(d).repeat(4)})` });
        }
        for (let d = 0; d <= 6; d++) {
            extraPatterns.push({ password: `${d}${d+1}${d+2}${d+3}`, pattern: `연속 PIN(${d}${d+1}${d+2}${d+3})` });
        }

        // 추가 흔한 단어
        const extraWords = [
            'master', 'sunshine', 'shadow', 'superman', 'batman',
            'login', 'qwerty123', 'abc123', 'pass1234', 'poiuyt', 'mnbvcxz', '!@#$%', '!@#$%^'
        ];
        extraWords.forEach(w => extraPatterns.push({ password: w, pattern: `흔한 패턴(${w})` }));

        const found2 = extraPatterns.find(item =>
            password.toLowerCase().includes(item.password.toLowerCase())
        );
        return found2 || null;
    }

    // finishModeA 재정의: 강화 패턴 + 상세 표시
    finishModeA = function(password, lastName, firstName, birthday, phone) {
        triggerFinishOverlay();
        document.getElementById('simulation-progress-area').style.display = 'none';
        document.getElementById('simulation-result-report').style.display = 'block';

        const resultMessage         = document.getElementById('result-message');
        const resultTestedPassword  = document.getElementById('result-tested-password');
        const resultAttempts        = document.getElementById('result-attempts');
        const resultTimeTaken       = document.getElementById('result-time-taken');
        const resultAnalysisComment = document.getElementById('result-analysis-comment');
        const resultPatternDetail   = document.getElementById('result-pattern-detail');

        resultTestedPassword.textContent = password;
        const matchedPattern = checkPatternAttackEnhanced(password, lastName, firstName, birthday, phone);

        // 버튼 참조
        const retryBtn       = document.getElementById('retry-btn');
        const linkToModeBBtn = document.getElementById('link-to-mode-b-btn');
        const guidePopupBtn  = document.getElementById('guide-popup-btn');

        if (matchedPattern) {
            // ── 1단계 탐지: 취약 ──
            isAAttacked = true;
            playSound('fail');
            resultMessage.textContent    = '디펜스 결과';
            resultMessage.style.color      = 'var(--neon-red)';
            resultMessage.style.textShadow = 'var(--glow-red)';
            resultAttempts.textContent   = '1 (지능형 조합 매칭)';
            resultTimeTaken.textContent  = '0.01초 미만';
            resultAnalysisComment.textContent =
                `비밀번호가 개인정보 조합 패턴인 "${matchedPattern.pattern}"에 매칭되어 해커가 사전 분석으로 단 0.01초 만에 풀어냈습니다.`;
            if (resultPatternDetail) {
                resultPatternDetail.textContent = `[MATCH] 검출된 패턴: ${matchedPattern.pattern}`;
                resultPatternDetail.style.display = 'block';
                resultPatternDetail.style.color = 'var(--red)';
                resultPatternDetail.style.borderLeftColor = 'var(--red)';
                resultPatternDetail.style.background = 'rgba(255,0,60,0.04)';
            }

            // ★ 탐지 시 버튼: 재도전 + 안전한 비밀번호 만드는 법만
            retryBtn.textContent        = '다른 방법으로 재도전';
            retryBtn.style.display      = 'block';
            guidePopupBtn.style.display = 'block';
            linkToModeBBtn.style.display = 'none';   // 2단계 버튼 숨김

        } else {
            // ── 1단계 통과: 안전 ──
            isAAttacked = false;
            playSound('success');
            resultMessage.textContent    = '디펜스 결과';
            resultMessage.style.color      = 'var(--neon-green)';
            resultMessage.style.textShadow = 'var(--glow-green)';
            resultAttempts.textContent   = '일치 항목 없음';
            resultTimeTaken.textContent  = '대입 불가';
            resultAnalysisComment.textContent =
                '지능형 패턴 및 개인정보 조합 추측 공격에 안전합니다! 이제 2단계 — 초고속 무작위 대입 공격을 버텨낼 수 있는지 확인해 보세요.';
            if (resultPatternDetail) {
                resultPatternDetail.textContent = '[PASS] 강화 패턴 및 상용 사전 딕셔너리 전체 통과 — 안전';
                resultPatternDetail.style.display = 'block';
                resultPatternDetail.style.color = 'var(--green)';
                resultPatternDetail.style.borderLeftColor = 'var(--green)';
                resultPatternDetail.style.background = 'rgba(0,255,65,0.04)';
            }

            // ★ 통과 시 버튼: 2단계(무작위 대입 공격 디펜스) 버튼만
            linkToModeBBtn.textContent   = '2단계: 무작위 대입 공격 디펜스';
            linkToModeBBtn.style.display = 'block';
            retryBtn.style.display       = 'none';   // 재도전 버튼 숨김
            guidePopupBtn.style.display  = 'none';   // 가이드 버튼 숨김
        }
    };

    function parseMarkdownToHtml(markdownText) {
        let html = markdownText;
        // Escape HTML tags to prevent XSS (allowing only safe layout characters)
        html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        
        // Restore markdown styles
        html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');
        html = html.replace(/^\s*-\s*(.*?)$/gm, '<li>$1</li>');
        html = html.replace(/^\s*\*\s*(.*?)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');
        
        const lines = html.split('\n');
        const processedLines = lines.map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed === '' || trimmed === '---' || trimmed.startsWith('<a')) {
                if (trimmed === '---') return '<hr>';
                return line;
            }
            return `<p>${line}</p>`;
        });
        return processedLines.join('\n');
    }

    function loadMarkdownContent(url, modal) {
        fetch(url)
            .then(res => res.text())
            .then(data => {
                const htmlContent = parseMarkdownToHtml(data);
                const modalBody = modal.querySelector('.modal-body');
                modalBody.innerHTML = `<div class="edu-content">${htmlContent}</div>`;
                modal.style.display = 'flex';
            })
            .catch(err => {
                console.error(`Failed to load markdown from ${url}`, err);
                modal.style.display = 'flex';
            });
    }

    const policyBtn = document.getElementById('policy-btn');
    const tosBtn = document.getElementById('tos-btn');
    const modalPolicy = document.getElementById('modal-policy');
    const modalTos = document.getElementById('modal-tos');
    const closePolicyBtn = document.getElementById('close-policy-btn');
    const closeTosBtn = document.getElementById('close-tos-btn');

    policyBtn.addEventListener('click', () => {
        playSound('success');
        loadMarkdownContent('개인정보처리방침.md', modalPolicy);
    });

    tosBtn.addEventListener('click', () => {
        playSound('success');
        loadMarkdownContent('이용약관.md', modalTos);
    });

    closePolicyBtn.addEventListener('click', () => {
        playSound('typewriter');
        modalPolicy.style.display = 'none';
    });

    closeTosBtn.addEventListener('click', () => {
        playSound('typewriter');
        modalTos.style.display = 'none';
    });

    [modalPolicy, modalTos].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // X 버튼 클릭 시 모달 닫기 공통 이벤트
    document.querySelectorAll('.modal-close-x-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            playSound('typewriter');
            e.target.closest('.modal-overlay').style.display = 'none';
        });
    });

    // ─── 비밀번호 입력창: 한글 입력 시 QWERTY 영타로 자동 변환 ───
    (function setupPasswordHangulConvert() {
        // 자모(미완성 자음·모음) → QWERTY 변환 테이블
        const jamoMap = {
            // 자음
            'ㄱ':'r',  'ㄲ':'R',  'ㄳ':'rt', 'ㄴ':'s',  'ㄵ':'sw',
            'ㄶ':'sg', 'ㄷ':'e',  'ㄸ':'E',  'ㄹ':'f',  'ㄺ':'fr',
            'ㄻ':'fa', 'ㄼ':'fq', 'ㄽ':'ft', 'ㄾ':'fx', 'ㄿ':'fv',
            'ㅀ':'fg', 'ㅁ':'a',  'ㅂ':'q',  'ㅃ':'Q',  'ㅄ':'qt',
            'ㅅ':'t',  'ㅆ':'T',  'ㅇ':'d',  'ㅈ':'w',  'ㅉ':'W',
            'ㅊ':'c',  'ㅋ':'z',  'ㅌ':'x',  'ㅍ':'v',  'ㅎ':'g',
            // 모음
            'ㅏ':'k',  'ㅐ':'o',  'ㅑ':'i',  'ㅒ':'O',  'ㅓ':'j',
            'ㅔ':'p',  'ㅕ':'u',  'ㅖ':'P',  'ㅗ':'h',  'ㅘ':'hk',
            'ㅙ':'ho', 'ㅚ':'hl', '㛤':'y', 'ㅛ':'y',  'ㅜ':'n',
            'ㅝ':'nj', 'ㅞ':'np', 'ㅟ':'nl', 'ㅠ':'b',  'ㅡ':'m',
            'ㅢ':'ml', 'ㅣ':'l',
        };

        // 한글 문자(음절 + 자모) 포함 여부 체크 후 QWERTY 변환
        function convertHangul(val) {
            if (!/[\uAC00-\uD7A3\u3131-\u3163]/.test(val)) return null;
            let result = '';
            for (const ch of val) {
                const code = ch.charCodeAt(0);
                if (code >= 0xAC00 && code <= 0xD7A3) {
                    // 완성형 음절 → hangulToQwerty (기존 함수 활용)
                    result += hangulToQwerty(ch);
                } else if (jamoMap[ch] !== undefined) {
                    // 미완성 자모 → 직접 매핑
                    result += jamoMap[ch];
                } else {
                    result += ch;
                }
            }
            return result;
        }

        // compositionend: IME가 한 음절을 확정하는 시점에 변환
        inputPassword.addEventListener('compositionend', () => {
            const converted = convertHangul(inputPassword.value);
            if (converted !== null) {
                inputPassword.value = converted;
                validateInputsAndCalculate();
            }
        });

        // input: 붙여넣기 / compositionend 후 추가 input 이벤트 대응
        inputPassword.addEventListener('input', () => {
            const converted = convertHangul(inputPassword.value);
            if (converted !== null) {
                inputPassword.value = converted;
                validateInputsAndCalculate();
            }
        });
    })();

    // Initial load check & start continuous Matrix background
    startMatrixEffect();
    validateInputsAndCalculate();
});

