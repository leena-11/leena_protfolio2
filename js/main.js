/**
 * Leena Jarapala Personal Portfolio JS
 * Includes: Three.js Interactive Particle Scene, Typewriter effect, Contact form handler, Navigation updates.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --------------------------------------------------
    // 1. Initialize AOS (Animate on Scroll)
    // --------------------------------------------------
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            once: true,
            easing: 'ease-in-out',
            anchorPlacement: 'top-bottom'
        });
    }

    // --------------------------------------------------
    // 2. Typewriter Effect
    // --------------------------------------------------
    const typewriterEl = document.getElementById('typewriter');
    const words = [
        "B.Tech AI & Data Science Student", 
        "Machine Learning Enthusiast", 
        "Data Analytics Specialist", 
        "Full-Stack Web Developer"
    ];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function type() {
        const currentWord = words[wordIndex];
        
        if (isDeleting) {
            typewriterEl.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50; // delete faster
        } else {
            typewriterEl.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100;
        }

        if (!isDeleting && charIndex === currentWord.length) {
            // Pause at full word
            typeSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typeSpeed = 500; // brief pause before next word
        }

        setTimeout(type, typeSpeed);
    }
    
    if (typewriterEl) {
        type();
    }

    // --------------------------------------------------
    // 3. Three.js: 3D Particle Constellation (Neural Network) Background
    // --------------------------------------------------
    const canvas = document.getElementById('bg-canvas');
    if (canvas && typeof THREE !== 'undefined') {
        let scene, camera, renderer;
        let particleCount = window.innerWidth < 768 ? 50 : 100;
        let particles, particlePositions, colors;
        let lineMesh;
        let particlesData = [];
        const maxDistance = 110;
        
        // Mouse Coordinates
        let mouseX = 0, mouseY = 0;
        let targetX = 0, targetY = 0;
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        function initThree() {
            // Create Scene
            scene = new THREE.Scene();
            scene.fog = new THREE.FogExp2(0x030712, 0.0015);

            // Create Camera
            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 4000);
            camera.position.z = 800;

            // Setup Renderer
            renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);

            // Group to contain everything
            const group = new THREE.Group();
            scene.add(group);

            // Particle Setup
            const segments = particleCount;
            particlePositions = new Float32Array(segments * 3);
            colors = new Float32Array(segments * 3);

            const pMaterial = new THREE.PointsMaterial({
                color: 0x00f2fe,
                size: 4,
                blending: THREE.AdditiveBlending,
                transparent: true,
                sizeAttenuation: true,
                opacity: 0.8
            });

            const particlesGeometry = new THREE.BufferGeometry();

            // Populate particle properties and coordinates
            const r = 800;
            for (let i = 0; i < segments; i++) {
                const x = Math.random() * r - r / 2;
                const y = Math.random() * r - r / 2;
                const z = Math.random() * r - r / 2;

                particlePositions[i * 3] = x;
                particlePositions[i * 3 + 1] = y;
                particlePositions[i * 3 + 2] = z;

                // Add random velocities
                particlesData.push({
                    velocity: new THREE.Vector3(-1 + Math.random() * 2, -1 + Math.random() * 2, -1 + Math.random() * 2),
                    numConnections: 0
                });
            }

            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setUsage(THREE.DynamicDrawUsage));
            particles = new THREE.Points(particlesGeometry, pMaterial);
            group.add(particles);

            // Connections Setup (Lines)
            const lineIndices = [];
            const linePositions = new Float32Array(segments * segments * 3);
            const lineColors = new Float32Array(segments * segments * 3);

            const lineMaterial = new THREE.LineBasicMaterial({
                vertexColors: true,
                blending: THREE.AdditiveBlending,
                transparent: true,
                opacity: 0.3
            });

            const lineGeometry = new THREE.BufferGeometry();
            lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));
            lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage));

            lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
            group.add(lineMesh);

            // Listeners
            document.addEventListener('mousemove', onMouseMove);
            window.addEventListener('resize', onWindowResize);

            animate();
        }

        function onMouseMove(event) {
            mouseX = (event.clientX - windowHalfX);
            mouseY = (event.clientY - windowHalfY);
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function animate() {
            requestAnimationFrame(animate);

            // Subtle smooth camera drift based on mouse coordinates
            targetX = mouseX * 0.08;
            targetY = mouseY * 0.08;

            camera.position.x += (targetX - camera.position.x) * 0.05;
            camera.position.y += (-targetY - camera.position.y) * 0.05;
            camera.lookAt(scene.position);

            let vertexpos = 0;
            let colorpos = 0;
            let numConnected = 0;

            for (let i = 0; i < particleCount; i++) {
                particlesData[i].numConnections = 0;
            }

            const positions = particles.geometry.attributes.position.array;
            const linePos = lineMesh.geometry.attributes.position.array;
            const lineCol = lineMesh.geometry.attributes.color.array;

            // Move particles and check distances for linkages
            for (let i = 0; i < particleCount; i++) {
                const particleData = particlesData[i];

                positions[i * 3] += particleData.velocity.x * 0.5;
                positions[i * 3 + 1] += particleData.velocity.y * 0.5;
                positions[i * 3 + 2] += particleData.velocity.z * 0.5;

                // Boundaries logic (bounce off walls)
                const limit = 400;
                if (positions[i * 3 + 1] < -limit || positions[i * 3 + 1] > limit) particleData.velocity.y = -particleData.velocity.y;
                if (positions[i * 3] < -limit || positions[i * 3] > limit) particleData.velocity.x = -particleData.velocity.x;
                if (positions[i * 3 + 2] < -limit || positions[i * 3 + 2] > limit) particleData.velocity.z = -particleData.velocity.z;

                // Check distance against other particles to draw neural connections
                for (let j = i + 1; j < particleCount; j++) {
                    const dx = positions[i * 3] - positions[j * 3];
                    const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
                    const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    if (dist < maxDistance) {
                        particlesData[i].numConnections++;
                        particlesData[j].numConnections++;

                        // Draw lines connection
                        linePos[vertexpos++] = positions[i * 3];
                        linePos[vertexpos++] = positions[i * 3 + 1];
                        linePos[vertexpos++] = positions[i * 3 + 2];

                        linePos[vertexpos++] = positions[j * 3];
                        linePos[vertexpos++] = positions[j * 3 + 1];
                        linePos[vertexpos++] = positions[j * 3 + 2];

                        // Line fades when distance gets further
                        const alpha = 1.0 - (dist / maxDistance);
                        
                        // Cyberpunk Cyan mapping to dark blue node connections
                        lineCol[colorpos++] = 0.0;
                        lineCol[colorpos++] = alpha * 0.8;
                        lineCol[colorpos++] = alpha * 1.0;

                        lineCol[colorpos++] = 0.0;
                        lineCol[colorpos++] = alpha * 0.8;
                        lineCol[colorpos++] = alpha * 1.0;

                        numConnected++;
                    }
                }
            }

            particles.geometry.attributes.position.needsUpdate = true;
            lineMesh.geometry.attributes.position.needsUpdate = true;
            lineMesh.geometry.attributes.color.needsUpdate = true;

            // Draw line system elements count
            lineMesh.geometry.setDrawRange(0, numConnected * 2);

            // Rotate particle space overall
            scene.rotation.y += 0.001;

            renderer.render(scene, camera);
        }

        // Run
        initThree();
    }

    // --------------------------------------------------
    // 4. Navbar Scrolled Styling & Active Link Highlighting
    // --------------------------------------------------
    const mainNav = document.getElementById('main-nav');
    const sections = document.querySelectorAll('section');
    const navlinks = document.querySelectorAll('#navbarContent .nav-link');

    window.addEventListener('scroll', () => {
        // Sticky Navbar background toggling
        if (window.scrollY > 50) {
            mainNav.classList.add('scrolled');
        } else {
            mainNav.classList.remove('scrolled');
        }

        // Active link scroll spy
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navlinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // --------------------------------------------------
    // 5. Contact Form Submission Handling
    // --------------------------------------------------
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Collect Form Values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;

            // Visual feedback indicator
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnHtml = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = `Sending... <i class="fa-solid fa-circle-notch fa-spin ms-2"></i>`;

            // Mock submission delay
            setTimeout(() => {
                // Success Modal/Toast notification triggers
                alert(`Thank you, ${name}! Your message has been simulated as sent successfully. \nSubject: ${subject} \nEmail: ${email}`);
                
                // Reset fields
                contactForm.reset();
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
                
                // Reset custom float classes
                const inputs = contactForm.querySelectorAll('.form-control');
                inputs.forEach(input => {
                    input.blur();
                });
            }, 1800);
        });
    }

    // --------------------------------------------------
    // 6. Explicit fallback for Vanilla-Tilt (in case auto-init is slow)
    // --------------------------------------------------
    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(document.querySelectorAll("[data-tilt]"), {
            max: 15,
            speed: 400,
            glare: true,
            "max-glare": 0.25,
        });
    }
});
