
document.addEventListener("DOMContentLoaded", () => {

    const canvas = document.getElementById("loveHeartCanvas");

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // =====================================
    // إعدادات القلب
    // =====================================

    const size = 500;

    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2 + 5;

    const heartScale = 11.2;
    const fontSize = 10;
    const wordGap = 5;

    // =====================================
    // عبارات الاعتذار بلغات مختلفة
    // =====================================

    const phrases = [
        "أنا آسف", "I'm sorry", "Lo siento",
        "Je suis désolé", "Es tut mir leid",
        "Mi dispiace", "Извини меня",
        "ごめんなさい", "미안해", "Özür dilerim",
        "Mujhe maaf kar do", "Maafkan aku",
        "Przepraszam", "Promiň mi",
        "Συγγνώμη", "Desculpa",
        "Desculpe", "Het spijt me",
        "Извинявай", "Perdóname",
        "मुझे माफ़ कर दो", "ขอโทษนะ",
        "Xin lỗi", "I'm truly sorry",
        "حقك عليا", "سامحيني",
        "أنا غلطان", "أنا آسف بجد",
        "مش قصدي أزعلك", "Please forgive me",
        "يا حنين", "مش هتبارد عليكي تاني ",
        "I apologize", "I'm sorry babè"
    ];

    const particles = [];

    let phraseIndex = 0;

    ctx.font = `bold ${fontSize}px Tahoma, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // =====================================
    // معادلة إحداثيات القلب
    // =====================================

    function getHeartPoint(t) {

        const x = 16 * Math.sin(t) ** 3;

        const y = -(
            13 * Math.cos(t)
            - 5 * Math.cos(2 * t)
            - 2 * Math.cos(3 * t)
            - Math.cos(4 * t)
        );

        return {
            x: centerX + x * heartScale,
            y: centerY + y * heartScale
        };
    }

    // =====================================
    // اختيار العبارات
    // =====================================

    function nextPhrase(maxWidth = Infinity) {

        for (let i = 0; i < phrases.length; i++) {

            const text = phrases[phraseIndex % phrases.length];

            phraseIndex++;

            if (ctx.measureText(text).width <= maxWidth) {
                return text;
            }
        }

        return "♥";
    }

    // =====================================
    // إضافة الكلمات للقلب
    // =====================================

    function addParticle(text, x, y, order) {

        particles.push({
            text,
            x,
            y,
            alpha: 0,
            delay: order * 2,
            maxAlpha: 0.92
        });
    }

    // =====================================
    // المرحلة الأولى: محيط القلب
    // =====================================

    const outline = [];

    const steps = 1800;

    for (let i = 0; i <= steps; i++) {

        const t = Math.PI * 2 * i / steps;

        outline.push(getHeartPoint(t));
    }

    // حساب طول المحيط

    const lengths = [0];

    for (let i = 1; i < outline.length; i++) {

        const dx = outline[i].x - outline[i - 1].x;
        const dy = outline[i].y - outline[i - 1].y;

        lengths.push(
            lengths[i - 1] + Math.hypot(dx, dy)
        );
    }

    const perimeter = lengths[lengths.length - 1];

    const outlineCount = Math.floor(perimeter / 13);

    let order = 0;

    for (let n = 0; n < outlineCount; n++) {

        const target = n / outlineCount * perimeter;

        let low = 0;
        let high = lengths.length - 1;

        while (low < high) {

            const mid = Math.floor((low + high) / 2);

            if (lengths[mid] < target) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }

        const i = Math.max(1, low);

        const a = outline[i - 1];
        const b = outline[i];

        const segment = lengths[i] - lengths[i - 1];

        const ratio = segment > 0
            ? (target - lengths[i - 1]) / segment
            : 0;

        const x = a.x + (b.x - a.x) * ratio;
        const y = a.y + (b.y - a.y) * ratio;

        addParticle(nextPhrase(75), x, y, order++);
    }

    // =====================================
    // المرحلة الثانية: ملء القلب
    // =====================================

    const topY = Math.min(...outline.map(p => p.y));

    const bottomY = Math.max(...outline.map(p => p.y));

    for (
        let y = Math.ceil(topY + 8);
        y < bottomY - 5;
        y += 11
    ) {

        const intersections = [];

        for (let i = 1; i < outline.length; i++) {

            const a = outline[i - 1];
            const b = outline[i];

            if (
                (a.y <= y && b.y > y) ||
                (b.y <= y && a.y > y)
            ) {

                const ratio = (y - a.y) / (b.y - a.y);

                intersections.push(
                    a.x + ratio * (b.x - a.x)
                );
            }
        }

        intersections.sort((a, b) => a - b);

        if (intersections.length < 2) continue;

        const left = intersections[0] + 7;

        const right = intersections[intersections.length - 1] - 7;

        let x = left;

        while (x < right - 10) {

            const available = right - x;

            const phrase = nextPhrase(available);

            const width = ctx.measureText(phrase).width;

            if (width > available) break;

            addParticle(
                phrase,
                x + width / 2,
                y,
                order++
            );

            x += width + wordGap;
        }
    }

    // =====================================
    // المرحلة الثالثة: ظهور القلب
    // =====================================

    let frameCount = 0;

    function animate() {

        ctx.clearRect(0, 0, size, size);

        ctx.font = `bold ${fontSize}px Tahoma, Arial`;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        frameCount++;

        let unfinished = false;

        for (const p of particles) {

            if (
                frameCount >= p.delay &&
                p.alpha < p.maxAlpha
            ) {

                p.alpha = Math.min(
                    p.maxAlpha,
                    p.alpha + 0.035
                );
            }

            if (p.alpha < p.maxAlpha) {
                unfinished = true;
            }

            if (p.alpha > 0) {

                ctx.fillStyle =
                    `rgba(190, 112, 145, ${p.alpha})`;

                ctx.fillText(p.text, p.x, p.y);
            }
        }

        if (unfinished) {
            requestAnimationFrame(animate);
        }
    }

    // بدء رسم القلب

    animate();

});
