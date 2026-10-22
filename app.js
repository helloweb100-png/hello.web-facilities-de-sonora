/* ════════════════════════════════════════════════════════════════
   FACILITIES DE SONORA · Landing corporativa
   Sin dependencias obligatorias (Lenis es mejora progresiva).
   ────────────────────────────────────────────────────────────────
   00 Configuración   07 Hero (WebGL + burbujas + parallax)
   01 Utilidades      08 Escenas de scroll (manifiesto, escenario,
   02 Contacto/WA         servicios, método)
   03 Texto dividido  09 Interacciones (sectores, comparador, FAQ,
   04 Loader              bento, formulario)
   05 Scroll + motor  10 Cursor, imanes, ticker
   06 Navegación      11 Arranque
   ════════════════════════════════════════════════════════════════ */
(() => {
    'use strict';

    /* ───────── 00 · CONFIGURACIÓN (EDITAR AQUÍ) ───────── */
    const CONFIG = {
        // WhatsApp en formato internacional, sin "+" ni espacios.  ← REEMPLAZAR por el número real
        phone: '5216620000000',
        phoneDisplay: '+52 662 000 0000',
        hours: 'Lunes a sábado · 8:00 a 18:00',
        defaultMsg: 'Hola, me gustaría recibir información sobre sus servicios de limpieza y mantenimiento.'
    };

    /* ───────── 01 · UTILIDADES ───────── */
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const easeExpo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
    const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const html = document.documentElement;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const lowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4);
    if (reduced) html.classList.add('rm');

    let vw = innerWidth, vh = innerHeight;
    let scrollY = window.scrollY || 0, lastY = scrollY, vel = 0;
    let lenis = null;

    /* ───────── 02 · CONTACTO / WHATSAPP ───────── */
    const waURL = msg => `https://wa.me/${CONFIG.phone}?text=${encodeURIComponent(msg || CONFIG.defaultMsg)}`;

    function bindContacts() {
        $$('[data-wa]').forEach(a => {
            a.href = waURL(a.dataset.wa);
            a.target = '_blank';
            a.rel = 'noopener';
        });
        $$('[data-tel]').forEach(a => { a.href = 'tel:+' + CONFIG.phone; });
        $$('[data-bind="phone"]').forEach(el => { el.textContent = CONFIG.phoneDisplay; });
        $$('[data-bind="hours"]').forEach(el => { el.textContent = CONFIG.hours; });
        const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
    }

    /* ───────── 03 · TEXTO DIVIDIDO (palabras) ───────── */
    function splitText(root, className, innerClass, counter) {
        Array.from(root.childNodes).forEach(node => {
            if (node.nodeType === 3) {
                const frag = document.createDocumentFragment();
                node.textContent.split(/(\s+)/).forEach(part => {
                    if (!part) return;
                    if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
                    if (innerClass) {
                        const w = document.createElement('span'); w.className = className;
                        const wi = document.createElement('span'); wi.className = innerClass;
                        wi.style.setProperty('--i', counter.i++); wi.textContent = part;
                        w.appendChild(wi); frag.appendChild(w);
                    } else {
                        const w = document.createElement('span'); w.className = className;
                        w.textContent = part; frag.appendChild(w); counter.list.push(w);
                    }
                });
                node.replaceWith(frag);
            } else if (node.nodeType === 1 && node.tagName !== 'BR') {
                splitText(node, className, innerClass, counter);
            }
        });
    }

    function initSplit() {
        $$('[data-split]').forEach(el => {
            el.classList.add('split');
            splitText(el, 'w', 'wi', { i: 0 });
        });
    }

    /* ───────── 04 · LOADER ───────── */
    function runLoader(onDone) {
        const loader = $('#loader');
        if (!loader || reduced) { loader && loader.remove(); onDone(); return; }

        const cover = $('#ld-cover'), pct = $('#ld-pct'), bar = $('#ld-bar'), msg = $('#ld-msg');
        const msgs = [[0, 'Preparando espacios impecables'], [38, 'Afinando cada detalle'], [74, 'Todo listo para brillar']];
        const MIN = 2500;
        let loaded = false, p = 0, finished = false, msgIdx = 0;
        const t0 = performance.now();

        const pageLoaded = new Promise(res => (document.readyState === 'complete' ? res() : addEventListener('load', res, { once: true })));
        const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
        Promise.all([pageLoaded, fontsReady]).then(() => { loaded = true; });
        setTimeout(() => { loaded = true; }, 7000);

        document.body.classList.add('is-locked');

        (function tick(now) {
            const el = now - t0;
            const sim = easeOut(clamp(el / 2300)) * .9;
            const goal = loaded && el >= MIN ? 1 : sim;
            p += (goal - p) * .075;
            if (goal === 1 && p > .994) p = 1;

            const n = Math.round(p * 100);
            cover.style.transform = `translateY(${lerp(142, -8, p).toFixed(2)}px)`;
            pct.textContent = n;
            bar.style.transform = `scaleX(${p.toFixed(4)})`;
            if (msgIdx < msgs.length - 1 && n >= msgs[msgIdx + 1][0]) { msgIdx++; msg.textContent = msgs[msgIdx][1]; }

            if (p < 1) { requestAnimationFrame(tick); return; }
            if (finished) return;
            finished = true;
            setTimeout(() => {
                loader.classList.add('is-done');
                document.body.classList.remove('is-locked');
                setTimeout(onDone, 520);
                setTimeout(() => loader.classList.add('is-gone'), 1500);
            }, 380);
        })(t0);
    }

    /* ───────── 05 · SCROLL SUAVE + MOTOR DE ESCENAS ───────── */
    const scenes = [];

    /* Una escena mapea el scroll a un progreso 0‒1 (con inercia) y llama update(p).
       range(top, height) devuelve [scrollInicio, scrollFin] en px. */
    function addScene({ el, range, update, instant = false, speed = 1 }) {
        const s = { el, range, update, instant, speed, start: 0, end: 1, cur: 0, last: -1 };
        s.measure = () => {
            const r = el.getBoundingClientRect();
            const [a, b] = range(r.top + (window.scrollY || 0), r.height);
            s.start = a; s.end = Math.max(a + 1, b);
        };
        s.measure();
        s.cur = clamp(((window.scrollY || 0) - s.start) / (s.end - s.start));
        s.update(s.cur, s.cur);
        s.last = s.cur;
        scenes.push(s);
        return s;
    }
    const measureAll = () => scenes.forEach(s => s.measure());

    function initLenis() {
        if (reduced || !window.Lenis) return;
        try {
            lenis = new window.Lenis({
                duration: 1.25,
                easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothWheel: true,
                wheelMultiplier: .9
            });
            lenis.stop();
        } catch (e) { lenis = null; }
    }

    function scrollToEl(target, immediate) {
        if (!target) return;
        const el = typeof target === 'string' ? $(target) : target;
        if (!el) return;
        if (lenis) lenis.scrollTo(el, { offset: el.id === 'inicio' ? 0 : -8, duration: immediate ? 0 : 1.7, immediate: !!immediate });
        else el.scrollIntoView({ behavior: reduced || immediate ? 'auto' : 'smooth', block: 'start' });
    }

    function initAnchors() {
        document.addEventListener('click', e => {
            const a = e.target.closest('a[href^="#"]');
            if (!a) return;
            const id = a.getAttribute('href');
            if (id.length < 2) return;
            const t = $(id);
            if (!t) return;
            e.preventDefault();
            if (a.closest('#menu')) setMenu(false);
            scrollToEl(t);
        });
    }

    /* Revelado al entrar en viewport */
    function initReveal() {
        const items = $$('.reveal, .split:not([data-split="hero"])');
        if (reduced || !('IntersectionObserver' in window)) { items.forEach(el => el.classList.add('is-in')); return; }
        const io = new IntersectionObserver(entries => {
            entries.forEach(en => {
                if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
            });
        }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
        items.forEach(el => io.observe(el));
    }

    /* ───────── 06 · NAVEGACIÓN ───────── */
    let navDark = false, menuOpen = false;
    const navEl = $('#nav'), burger = $('#burger'), menu = $('#menu');
    let themeZones = [], spyZones = [];

    function setMenu(open) {
        if (!menu || open === menuOpen) return;
        menuOpen = open;
        menu.classList.toggle('is-open', open);
        html.classList.toggle('menu-open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
        menu.setAttribute('aria-hidden', String(!open));
        menu.inert = !open;
        document.body.classList.toggle('is-locked', open);
        if (lenis) (open ? lenis.stop() : lenis.start());
    }

    function initNav() {
        if (burger) burger.addEventListener('click', () => setMenu(!menuOpen));
        addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
        addEventListener('resize', () => { if (innerWidth >= 960) setMenu(false); });
    }

    function measureNavZones() {
        const y = window.scrollY || 0;
        themeZones = $$('[data-nav]').map(el => {
            const r = el.getBoundingClientRect();
            return { top: r.top + y, bottom: r.bottom + y, dark: el.dataset.nav === 'dark' };
        });
        const links = $$('.nav__links a');
        spyZones = links.map(a => {
            const t = $(a.getAttribute('href'));
            if (!t) return null;
            const r = t.getBoundingClientRect();
            return { a, top: r.top + y, bottom: r.bottom + y };
        }).filter(Boolean);
    }

    function updateNav() {
        if (!navEl) return;
        navEl.classList.toggle('is-scrolled', scrollY > 40);
        const probe = scrollY + 36;
        const zone = themeZones.find(z => probe >= z.top && probe < z.bottom);
        const dark = zone ? zone.dark : false;
        if (dark !== navDark) { navDark = dark; navEl.classList.toggle('nav--dark', dark); }
        const spyY = scrollY + vh * .4;
        spyZones.forEach(z => z.a.classList.toggle('is-active', spyY >= z.top && spyY < z.bottom));
    }

    /* ───────── 07 · HERO ───────── */
    let heroVisible = true;
    const mouse = { x: .5, y: .5, tx: .5, ty: .5, px: 0, py: 0 };

    /* Shader de cáusticas de agua (luz sobre el fondo claro) */
    function initGL() {
        const canvas = $('#gl');
        if (!canvas) return;
        const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
        if (!gl) return;

        const vsSrc = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
        const fsSrc = `
precision mediump float;
uniform vec2 u_res; uniform float u_t; uniform vec2 u_m;
float ridge(float v){ return pow(1.0 - abs(sin(v)), 6.0); }
float caustic(vec2 p, float t){
    float c = 0.0; vec2 q = p;
    for(int i = 0; i < 3; i++){
        float fi = float(i);
        q += 0.55 * vec2(sin(q.y * 1.25 + t * .50 + fi * 1.7), cos(q.x * 1.05 - t * .42 + fi * 2.3));
        c += ridge(q.x * 1.6 + q.y * .85 + t * .22) + ridge(q.y * 1.45 - q.x * .75 - t * .18);
    }
    return c / 6.0;
}
void main(){
    vec2 uv = gl_FragCoord.xy / u_res;
    float asp = u_res.x / u_res.y;
    vec2 p = (uv - .5) * vec2(asp, 1.) * 4.2;
    float c = smoothstep(.10, .62, caustic(p, u_t) * 2.4);

    vec3 top = vec3(.985, .993, 1.);
    vec3 bot = vec3(.875, .94, .988);
    vec3 col = mix(bot, top, smoothstep(0., 1., uv.y));

    float w1 = exp(-pow(distance(uv, vec2(.80, .56)) * 2.0, 2.));
    col = mix(col, vec3(.58, .82, .97), w1 * .62);
    float w2 = exp(-pow(distance(uv, vec2(.04, .96)) * 1.7, 2.));
    col = mix(col, vec3(.77, .91, .99), w2 * .5);

    float k = c * (.30 + .70 * w1);
    col = mix(col, vec3(.30, .66, .92), k * .22);
    col = mix(col, vec3(1.), k * .62);

    float m = exp(-pow(distance(uv * vec2(asp, 1.), u_m * vec2(asp, 1.)) * 2.8, 2.));
    col += vec3(.10, .40, .78) * m * .10;
    gl_FragColor = vec4(col, 1.);
}`;
        const compile = (type, src) => {
            const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
            return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
        };
        const vs = compile(gl.VERTEX_SHADER, vsSrc), fs = compile(gl.FRAGMENT_SHADER, fsSrc);
        if (!vs || !fs) return;
        const prog = gl.createProgram();
        gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
        gl.useProgram(prog);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, 'p');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        const uRes = gl.getUniformLocation(prog, 'u_res'), uT = gl.getUniformLocation(prog, 'u_t'), uM = gl.getUniformLocation(prog, 'u_m');

        const quality = lowPower || vw < 720 ? .42 : .6;
        const resize = () => {
            const r = canvas.getBoundingClientRect();
            const dpr = Math.min(devicePixelRatio || 1, 1.5);
            canvas.width = Math.max(2, Math.round(r.width * quality * dpr));
            canvas.height = Math.max(2, Math.round(r.height * quality * dpr));
            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        resize();
        addEventListener('resize', resize);

        let running = false, first = true, last = 0, tAcc = 3.5;
        const frameGap = lowPower ? 1000 / 30 : 0;
        const draw = now => {
            if (!running) return;
            requestAnimationFrame(draw);
            if (frameGap && now - last < frameGap) return;
            const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
            tAcc += dt;
            gl.uniform2f(uRes, canvas.width, canvas.height);
            gl.uniform1f(uT, tAcc);
            gl.uniform2f(uM, mouse.x, 1 - mouse.y);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            if (first) { first = false; html.classList.add('gl-ready'); }
        };
        const start = () => { if (!running && heroVisible && !document.hidden) { running = true; last = performance.now(); requestAnimationFrame(draw); } };
        const stop = () => { running = false; };

        if (reduced) { gl.uniform2f(uRes, canvas.width, canvas.height); gl.uniform1f(uT, 3.5); gl.uniform2f(uM, .7, .5); gl.drawArrays(gl.TRIANGLES, 0, 3); html.classList.add('gl-ready'); return; }
        initGL.start = start; initGL.stop = stop;
        start();
    }

    /* Burbujas (canvas 2D) que reaccionan al cursor */
    function initBubbles() {
        const cv = $('#bubbles');
        if (!cv || reduced) return;
        const ctx = cv.getContext('2d');
        let W = 0, H = 0, dpr = 1, bubbles = [], running = false, last = 0;
        const pointer = { x: -999, y: -999 };

        const make = init => {
            const r = Math.pow(Math.random(), 2.3) * 26 + 4;
            return {
                x: Math.random() * W, y: init ? Math.random() * H : H + r + Math.random() * 80,
                r, vy: (.16 + Math.random() * .5) * (1 + (30 - r) / 42), ph: Math.random() * 6.28,
                sw: .25 + Math.random() * .6, a: .35 + Math.random() * .5, vx: 0, vyk: 0
            };
        };
        const resize = () => {
            const r = cv.getBoundingClientRect();
            dpr = Math.min(devicePixelRatio || 1, 2);
            W = r.width; H = r.height;
            cv.width = W * dpr; cv.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const n = Math.round(clamp(W * H / (lowPower ? 38000 : 26000), 14, 46));
            while (bubbles.length < n) bubbles.push(make(true));
            bubbles.length = n;
        };
        resize();
        addEventListener('resize', resize);

        const hero = $('#inicio');
        hero.addEventListener('pointermove', e => {
            const r = cv.getBoundingClientRect();
            pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
        });
        hero.addEventListener('pointerleave', () => { pointer.x = pointer.y = -999; });
        hero.addEventListener('click', e => {
            if (e.target.closest('a,button')) return;
            const r = cv.getBoundingClientRect();
            for (let i = 0; i < 7; i++) {
                const b = make(false);
                b.x = e.clientX - r.left + (Math.random() - .5) * 40; b.y = e.clientY - r.top + (Math.random() - .5) * 30;
                b.r = 5 + Math.random() * 14; b.vy = .5 + Math.random() * .9;
                bubbles.push(b);
            }
            if (bubbles.length > 70) bubbles.splice(0, bubbles.length - 70);
        });

        const draw = now => {
            if (!running) return;
            requestAnimationFrame(draw);
            const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
            const k = dt * 60;
            ctx.clearRect(0, 0, W, H);
            for (let i = 0; i < bubbles.length; i++) {
                const b = bubbles[i];
                b.y -= b.vy * k;
                b.ph += .012 * k * b.sw;
                b.x += Math.sin(b.ph) * .35 * k + b.vx;
                b.vx *= .94;
                const dx = b.x - pointer.x, dy = b.y - pointer.y, d2 = dx * dx + dy * dy, R = 130;
                if (d2 < R * R) { const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 2.2; b.vx += (dx / d) * f * .12; b.y += (dy / d) * f * .6; }
                if (b.y < -b.r * 2 || b.x < -60 || b.x > W + 60) {
                    if (bubbles.length > 48 && i >= 48) { bubbles.splice(i, 1); i--; continue; }
                    Object.assign(b, make(false));
                }
                const g = ctx.createRadialGradient(b.x - b.r * .35, b.y - b.r * .35, b.r * .08, b.x, b.y, b.r);
                g.addColorStop(0, `rgba(255,255,255,${.75 * b.a})`);
                g.addColorStop(.55, `rgba(120,200,245,${.10 * b.a})`);
                g.addColorStop(1, `rgba(30,155,215,${.30 * b.a})`);
                ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.2832);
                ctx.fillStyle = g; ctx.fill();
                ctx.lineWidth = 1; ctx.strokeStyle = `rgba(21,130,200,${.38 * b.a})`; ctx.stroke();
                ctx.beginPath(); ctx.arc(b.x - b.r * .34, b.y - b.r * .34, Math.max(1, b.r * .2), 0, 6.2832);
                ctx.fillStyle = `rgba(255,255,255,${.85 * b.a})`; ctx.fill();
            }
        };
        const start = () => { if (!running && heroVisible && !document.hidden) { running = true; last = performance.now(); requestAnimationFrame(draw); } };
        const stop = () => { running = false; };
        initBubbles.start = start; initBubbles.stop = stop;
        start();
    }

    /* Visibilidad del hero → pausa canvas/WebGL fuera de pantalla */
    function initHeroVisibility() {
        const hero = $('#inicio');
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(([en]) => {
                heroVisible = en.isIntersecting;
                (heroVisible ? [initGL.start, initBubbles.start] : [initGL.stop, initBubbles.stop]).forEach(fn => fn && fn());
            }, { threshold: 0 }).observe(hero);
        }
        document.addEventListener('visibilitychange', () => {
            (document.hidden ? [initGL.stop, initBubbles.stop] : [initGL.start, initBubbles.start]).forEach(fn => fn && fn());
        });
        if (finePointer) {
            hero.addEventListener('pointermove', e => {
                const r = hero.getBoundingClientRect();
                mouse.tx = clamp((e.clientX - r.left) / r.width);
                mouse.ty = clamp((e.clientY - r.top) / r.height);
            });
            hero.addEventListener('pointerleave', () => { mouse.tx = .62; mouse.ty = .5; });
        }
    }

    /* Escena del hero: parallax al salir + inclinación con el cursor */
    function initHeroScene() {
        const hero = $('#inicio'), copy = $('#hero-copy'), visual = $('#hero-visual');
        const depthEls = $$('[data-depth]', hero);
        if (reduced) return;
        addScene({
            el: hero, instant: true,
            range: (top, h) => [top, top + h],
            update: p => {
                if (vw < 1024) {            // en móvil el visual queda debajo del texto: sin desvanecer
                    copy.style.transform = copy.style.opacity = visual.style.transform = visual.style.opacity = '';
                    return;
                }
                copy.style.transform = `translate3d(0,${(p * -60).toFixed(1)}px,0)`;
                copy.style.opacity = clamp(1 - p * 1.35).toFixed(3);
                visual.style.transform = `translate3d(0,${(p * 70).toFixed(1)}px,0) scale(${(1 + p * .14).toFixed(3)})`;
                visual.style.opacity = clamp(1 - p * 1.15).toFixed(3);
            }
        });
        // Se evalúa dentro del bucle principal (suavizado con el cursor)
        initHeroScene.tick = () => {
            if (!heroVisible || !finePointer) return;
            mouse.x += (mouse.tx - mouse.x) * .06;
            mouse.y += (mouse.ty - mouse.y) * .06;
            const nx = (mouse.x - .5) * 2, ny = (mouse.y - .5) * 2;
            depthEls.forEach(el => {
                const d = parseFloat(el.dataset.depth) || 20;
                el.style.transform = `translate3d(${(nx * d * -.5).toFixed(2)}px,${(ny * d * -.5).toFixed(2)}px,0)`;
            });
        };
    }

    /* ───────── 08 · ESCENAS DE SCROLL ───────── */

    /* Manifiesto: las palabras se encienden con el scroll */
    function initManifesto() {
        const el = $('[data-words]');
        if (!el || reduced) return;
        const store = { list: [] };
        splitText(el, 'mw', '', store);
        const words = store.list, n = words.length;
        addScene({
            el, speed: .9,
            range: (top, h) => [top - vh * .82, top + h - vh * .42],
            update: p => {
                const reach = p * (n + 7);
                for (let i = 0; i < n; i++) {
                    words[i].style.opacity = (.16 + .84 * clamp((reach - i) / 7)).toFixed(3);
                }
            }
        });
    }

    /* Escenario: imagen enmarcada que se expande a pantalla completa */
    function initStage() {
        const pin = $('#stage-pin'), media = $('#stage-media');
        if (!pin || !media || reduced) return;   // en movimiento reducido el HTML ya trae los valores finales
        const img = $('img', media), shade = $('.stage__shade', media);
        const pre = $('.stage__pre'), content = $('.stage__content');
        let counted = false;

        const setHeight = () => { pin.style.height = (vw < 720 ? 250 : 290) + 'vh'; };
        setHeight();
        addEventListener('resize', setHeight);

        addScene({
            el: pin, speed: .95,
            range: (top, h) => [top, top + h - vh],
            update: p => {
                const mob = vw < 720;
                const e = easeInOut(clamp(p / .6));
                const ix = lerp(mob ? .07 : .22, 0, e) * vw;
                const it = lerp(mob ? .27 : .27, 0, e) * vh;
                const ib = lerp(mob ? .2 : .13, 0, e) * vh;
                const r = lerp(mob ? 24 : 34, 0, e);
                media.style.clipPath = `inset(${it.toFixed(1)}px ${ix.toFixed(1)}px ${ib.toFixed(1)}px ${ix.toFixed(1)}px round ${r.toFixed(1)}px)`;
                img.style.transform = `scale(${lerp(1.32, 1, e).toFixed(4)})`;
                shade.style.opacity = clamp((p - .22) / .38).toFixed(3);
                pre.style.opacity = clamp(1 - p / .2).toFixed(3);
                pre.style.transform = `translate3d(0,${(-p * 90).toFixed(1)}px,0)`;
                const t = easeOut(clamp((p - .55) / .3));
                content.style.opacity = t.toFixed(3);
                content.style.transform = `translate3d(0,${((1 - t) * 50).toFixed(1)}px,0)`;
                if (p > .64 && !counted) { counted = true; runCounters(content); }
            }
        });
    }

    function runCounters(root) {
        $$('.count', root).forEach(el => {
            const to = parseFloat(el.dataset.to) || 0, suffix = el.dataset.suffix || '', dur = 2200, t0 = performance.now();
            (function step(t) {
                const p = clamp((t - t0) / dur);
                el.textContent = Math.round(to * easeExpo(p)) + suffix;
                if (p < 1) requestAnimationFrame(step);
            })(t0);
        });
    }

    /* Servicios: scroll vertical → desplazamiento horizontal (escritorio) */
    function initServices() {
        const sec = $('#servicios'), pin = $('#svc-pin'), sticky = $('#svc-sticky'), track = $('#svc-track');
        if (!sec) return;
        const cards = $$('.svc-card', track), imgs = cards.map(c => $('.svc-card__media img', c));
        const cur = $('#svc-cur'), fill = $('#svc-fill');
        const mq = matchMedia('(min-width: 1024px)');
        let active = false, maxX = 0, scene = null, offsets = [], widths = [], lastIdx = -1;

        const layout = () => {
            active = mq.matches && !reduced;
            sec.classList.toggle('is-pinned', active);
            if (!active) {
                pin.style.height = ''; track.style.transform = '';
                imgs.forEach(i => { if (i) i.style.transform = ''; });
                return;
            }
            maxX = Math.max(0, track.scrollWidth - sticky.clientWidth);
            pin.style.height = (maxX + vh * 1.22) + 'px';
            offsets = cards.map(c => c.offsetLeft); widths = cards.map(c => c.offsetWidth);
        };
        layout();
        mq.addEventListener('change', () => { layout(); measureAll(); });
        addEventListener('resize', () => { layout(); });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); measureAll(); });

        scene = addScene({
            el: pin, speed: .85,
            range: top => [top, top + Math.max(1, maxX)],
            update: p => {
                if (!active) return;
                const x = -p * maxX;
                track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
                fill.style.transform = `scaleX(${p.toFixed(4)})`;
                const idx = Math.round(p * (cards.length - 1));
                if (idx !== lastIdx) { lastIdx = idx; cur.textContent = String(idx + 1).padStart(2, '0'); }
                for (let i = 0; i < cards.length; i++) {
                    if (!imgs[i]) continue;
                    const center = offsets[i] + x + widths[i] / 2;
                    const shift = ((center - vw / 2) / vw) * -56;
                    imgs[i].style.transform = `translate3d(${shift.toFixed(1)}px,0,0) scale(1.18)`;
                }
            }
        });
        // El pin se recalcula tras medir
        const m = scene.measure;
        scene.measure = () => { layout(); m(); };
    }

    /* Método: línea de progreso + pasos activos */
    function initSteps() {
        const list = $('#steps'), fill = $('#steps-fill');
        if (!list) return;
        const steps = $$('.step', list);
        if (reduced) { steps.forEach(s => s.classList.add('is-active')); fill.style.transform = 'scaleY(1)'; return; }
        const line = .6;
        let tops = [];
        const measure = () => { const y = window.scrollY || 0; const base = list.getBoundingClientRect().top + y; tops = steps.map(s => s.getBoundingClientRect().top + y + s.offsetHeight * .35 - base); };
        measure();
        const sc = addScene({
            el: list, instant: true,
            range: (top, h) => [top - vh * line, top + h - vh * line],
            update: p => {
                fill.style.transform = `scaleY(${p.toFixed(4)})`;
                const h = list.offsetHeight, reach = p * h;
                steps.forEach((s, i) => s.classList.toggle('is-active', reach >= (tops[i] || 0) - 4));
            }
        });
        const m = sc.measure;
        sc.measure = () => { measure(); m(); };
    }

    /* ───────── 09 · INTERACCIONES ───────── */

    /* Sectores: acordeón con imagen */
    function initSectors() {
        const items = $$('.sector');
        if (!items.length) return;
        const desktop = matchMedia('(min-width: 1024px)');
        const activate = it => items.forEach(s => {
            const on = s === it;
            s.classList.toggle('is-active', on);
            const b = $('.sector__btn', s); if (b) b.setAttribute('aria-expanded', String(on));
        });
        let timer = null;
        items.forEach(it => {
            it.addEventListener('click', e => { if (!e.target.closest('a')) activate(it); });
            if (finePointer) {
                it.addEventListener('mouseenter', () => { if (!desktop.matches) return; clearTimeout(timer); timer = setTimeout(() => activate(it), 110); });
                it.addEventListener('mouseleave', () => clearTimeout(timer));
            }
        });
    }

    /* Comparador antes / después */
    function initCompare() {
        const box = $('#compare'), handle = $('#compare-handle');
        if (!box || !handle) return;
        let pos = 50, dragging = false, touched = false;
        const set = p => {
            pos = clamp(p, 0, 100);
            box.style.setProperty('--pos', pos.toFixed(2) + '%');
            handle.setAttribute('aria-valuenow', String(Math.round(pos)));
        };
        const fromEvent = e => { const r = box.getBoundingClientRect(); set(((e.clientX - r.left) / r.width) * 100); };

        box.addEventListener('pointerdown', e => {
            touched = true; dragging = true;
            try { box.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
            fromEvent(e);
        });
        box.addEventListener('pointermove', e => { if (dragging) fromEvent(e); });
        const end = () => { dragging = false; };
        box.addEventListener('pointerup', end);
        box.addEventListener('pointercancel', end);
        handle.addEventListener('keydown', e => {
            const step = e.shiftKey ? 15 : 5;
            if (e.key === 'ArrowLeft') { touched = true; set(pos - step); e.preventDefault(); }
            if (e.key === 'ArrowRight') { touched = true; set(pos + step); e.preventDefault(); }
            if (e.key === 'Home') { touched = true; set(0); e.preventDefault(); }
            if (e.key === 'End') { touched = true; set(100); e.preventDefault(); }
        });

        // Animación de invitación al entrar en pantalla
        if (reduced || !('IntersectionObserver' in window)) return;
        const io = new IntersectionObserver(([en]) => {
            if (!en.isIntersecting) return;
            io.disconnect();
            const keys = [[50, 16, 1300], [16, 86, 1700], [86, 50, 1200]];
            let i = 0;
            const run = () => {
                if (touched || i >= keys.length) return;
                const [a, b, d] = keys[i++], t0 = performance.now();
                (function step(t) {
                    if (touched) return;
                    const k = easeInOut(clamp((t - t0) / d));
                    set(lerp(a, b, k));
                    if (k < 1) requestAnimationFrame(step); else run();
                })(t0);
            };
            setTimeout(run, 500);
        }, { threshold: .45 });
        io.observe(box);
    }

    /* Bento: foco de luz que sigue al cursor */
    function initSpotlight() {
        if (!finePointer) return;
        $$('[data-spot]').forEach(t => {
            t.addEventListener('pointermove', e => {
                const r = t.getBoundingClientRect();
                t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
                t.style.setProperty('--my', (e.clientY - r.top) + 'px');
            });
        });
    }

    /* FAQ */
    function initFAQ() {
        const items = $$('.acc__item');
        const set = (it, open) => {
            it.classList.toggle('is-open', open);
            const b = $('.acc__btn', it); if (b) b.setAttribute('aria-expanded', String(open));
        };
        items.forEach(it => {
            $('.acc__btn', it).addEventListener('click', () => {
                const open = !it.classList.contains('is-open');
                items.forEach(o => set(o, false));
                set(it, open);
            });
        });
        if (items[0]) set(items[0], true);
    }

    /* Formulario → WhatsApp */
    function initForm() {
        const form = $('#quote-form');
        if (!form) return;
        const ok = $('#form-ok'), okLink = $('#form-ok-link');
        const name = $('#f-name'), service = $('#f-service');
        const setErr = (input, msg) => {
            const f = input.closest('.field'), e = $('.field__err', f);
            f.classList.toggle('is-invalid', !!msg);
            if (e) e.textContent = msg || '';
            input.setAttribute('aria-invalid', msg ? 'true' : 'false');
        };
        name.addEventListener('input', () => { if (name.value.trim().length >= 2) setErr(name, ''); });
        service.addEventListener('change', () => setErr(service, ''));

        form.addEventListener('submit', e => {
            e.preventDefault();
            let valid = true;
            if (name.value.trim().length < 2) { setErr(name, 'Cuéntanos tu nombre para poder atenderte.'); valid = false; }
            if (!service.value) { setErr(service, 'Elige el servicio que te interesa.'); valid = false; }
            if (!valid) { const bad = $('.is-invalid input, .is-invalid select', form); if (bad) bad.focus(); return; }

            const d = new FormData(form);
            const get = k => String(d.get(k) || '').trim();
            const lines = [`Hola, soy ${get('name')}${get('company') ? ' de ' + get('company') : ''}.`, `Me interesa: ${get('service')}.`];
            if (get('message')) lines.push(`Detalles: ${get('message')}`);
            if (get('phone')) lines.push(`Mi teléfono: ${get('phone')}`);
            lines.push('¿Me pueden dar una cotización?');
            const url = waURL(lines.join('\n'));

            okLink.href = url;
            ok.hidden = false;
            window.open(url, '_blank', 'noopener');
            setTimeout(() => { ok.hidden = true; form.reset(); }, 12000);
        });
    }

    /* ───────── 10 · CURSOR · IMANES · TICKER ───────── */
    const cursor = { el: null, x: 0, y: 0, tx: 0, ty: 0 };

    function initCursor() {
        if (!finePointer) return;
        cursor.el = $('#cursor');
        if (!cursor.el) return;
        addEventListener('pointermove', e => { cursor.tx = e.clientX; cursor.ty = e.clientY; cursor.el.classList.add('is-on'); }, { passive: true });
        document.addEventListener('pointerleave', () => cursor.el.classList.remove('is-on'));
        document.addEventListener('pointerover', e => {
            cursor.el.classList.toggle('is-hover', !!e.target.closest('a, button, [role="slider"], .sector, .compare, [data-spot]'));
        });
    }

    function initMagnetic() {
        if (!finePointer || reduced) return;
        $$('[data-magnetic]').forEach(b => {
            b.addEventListener('pointermove', e => {
                const r = b.getBoundingClientRect();
                b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * .2).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * .3).toFixed(1)}px)`;
            });
            b.addEventListener('pointerleave', () => { b.style.transform = ''; });
        });
    }

    let tickerAnim = null;
    function initTicker() {
        const track = $('#ticker');
        if (!track || reduced) return;
        const group = track.firstElementChild;
        track.appendChild(group.cloneNode(true));
        try { tickerAnim = track.getAnimations()[0] || null; } catch (e) { tickerAnim = null; }
    }

    /* ───────── BUCLE PRINCIPAL ───────── */
    const progressBar = $('#progress');
    let lastT = 0;

    function frame(now) {
        const dt = Math.min(.05, (now - lastT) / 1000 || .016);
        lastT = now;
        if (lenis) lenis.raf(now);

        scrollY = window.scrollY || 0;
        vel = scrollY - lastY; lastY = scrollY;
        vh = innerHeight;

        const k = 1 - Math.pow(1 - .11, dt * 60);
        for (let i = 0; i < scenes.length; i++) {
            const s = scenes[i];
            const raw = clamp((scrollY - s.start) / (s.end - s.start));
            if (s.instant) s.cur = raw;
            else {
                s.cur += (raw - s.cur) * k * s.speed;
                if (Math.abs(raw - s.cur) < .0004) s.cur = raw;
            }
            if (s.cur !== s.last) { s.last = s.cur; s.update(s.cur, raw); }
        }

        const doc = document.documentElement;
        const total = Math.max(1, doc.scrollHeight - innerHeight);
        if (progressBar) progressBar.style.transform = `scaleX(${clamp(scrollY / total).toFixed(4)})`;

        updateNav();
        if (initHeroScene.tick) initHeroScene.tick();

        if (tickerAnim) tickerAnim.playbackRate += ((1 + clamp(Math.abs(vel) / 9, 0, 5)) - tickerAnim.playbackRate) * .08;

        if (cursor.el) {
            cursor.x += (cursor.tx - cursor.x) * .2; cursor.y += (cursor.ty - cursor.y) * .2;
            cursor.el.style.transform = `translate3d(${cursor.x.toFixed(1)}px,${cursor.y.toFixed(1)}px,0)`;
        }
        requestAnimationFrame(frame);
    }

    /* ───────── 11 · ARRANQUE ───────── */
    function onReady() {
        html.classList.add('is-ready');
        const heroTitle = $('.hero__title');
        if (heroTitle) heroTitle.classList.add('is-in');
        if (lenis) lenis.start();

        measureNavZones(); measureAll();
        if (location.hash && $(location.hash)) setTimeout(() => scrollToEl(location.hash, true), 50);

        const wa = $('#wa-float');
        if (wa) {
            setTimeout(() => wa.classList.add('is-show'), 1800);
            setTimeout(() => wa.classList.add('show-tip'), 3200);
            setTimeout(() => wa.classList.remove('show-tip'), 10500);
        }
    }

    function initResize() {
        let t = null, lw = innerWidth, lh = innerHeight;
        const refresh = () => { measureNavZones(); measureAll(); };
        addEventListener('resize', () => {
            vw = innerWidth; vh = innerHeight;
            // En móvil la barra del navegador dispara resizes de solo alto: se ignoran los pequeños
            if (vw === lw && Math.abs(vh - lh) < 140) return;
            lw = vw; lh = vh;
            clearTimeout(t); t = setTimeout(refresh, 180);
        });
        if ('ResizeObserver' in window) {
            let t2 = null;
            new ResizeObserver(() => { clearTimeout(t2); t2 = setTimeout(refresh, 200); }).observe(document.body);
        }
        addEventListener('load', () => setTimeout(refresh, 300));
    }

    /* Cada módulo se aísla: un fallo en uno nunca bloquea el resto ni el loader */
    const safe = fn => { try { fn(); } catch (err) { console.error('[Facilities]', err); } };

    function init() {
        safe(() => {
            if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
            if (!location.hash) window.scrollTo(0, 0);
        });

        [bindContacts, initSplit, initLenis, initAnchors, initNav].forEach(safe);

        // Imágenes rotas: se oculta la imagen y queda el fondo de marca
        safe(() => $$('img').forEach(img => img.addEventListener('error', () => { img.style.visibility = 'hidden'; }, { once: true })));

        [initGL, initBubbles, initHeroVisibility, initHeroScene, initManifesto, initStage,
            initServices, initSteps, initSectors, initCompare, initSpotlight, initFAQ, initForm,
            initCursor, initMagnetic, initTicker, initReveal, initResize].forEach(safe);

        safe(measureNavZones);
        requestAnimationFrame(frame);
        runLoader(onReady);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
