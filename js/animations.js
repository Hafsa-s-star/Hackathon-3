// =========================================================
// GSAP ANIMATION SUITE - STUDENTHUB (10 HIGH QUALITY ANIMATIONS)
// Powering smooth micro-interactions, entrance reveals & state changes
// =========================================================

(function () {
    // Check if GSAP is loaded
    function getGSAP() {
        return window.gsap || null;
    }

    const StudentHubAnim = {
        // =====================================================
        // 1. NAVBAR ENTRANCE & STAGGER
        // =====================================================
        animateNavbarEntrance: function () {
            const gsap = getGSAP();
            if (!gsap) return;

            const navbar = document.querySelector(".navbar") || document.querySelector(".admin-navbar");
            if (!navbar) return;

            const logo = navbar.querySelector(".logo") || navbar.querySelector(".admin-logo");
            const navLinks = navbar.querySelectorAll(".nav-links a, .admin-nav a");
            const navRight = navbar.querySelector(".nav-right") || navbar.querySelector(".admin-nav-right");

            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            tl.fromTo(navbar, 
                { y: -30, opacity: 0 }, 
                { y: 0, opacity: 1, duration: 0.6 }
            );

            if (logo) {
                tl.fromTo(logo, 
                    { scale: 0.85, opacity: 0 }, 
                    { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }, 
                    "-=0.4"
                );
            }

            if (navLinks && navLinks.length > 0) {
                tl.fromTo(navLinks, 
                    { y: -15, opacity: 0 }, 
                    { y: 0, opacity: 1, duration: 0.4, stagger: 0.06 }, 
                    "-=0.3"
                );
            }

            if (navRight) {
                tl.fromTo(navRight.children, 
                    { scale: 0.8, opacity: 0 }, 
                    { scale: 1, opacity: 1, duration: 0.4, stagger: 0.08, ease: "back.out(1.5)" }, 
                    "-=0.3"
                );
            }
        },

        // =====================================================
        // 2. PAGE HERO / HEADER ENTRANCE
        // =====================================================
        animateHeroHeader: function () {
            const gsap = getGSAP();
            if (!gsap) return;

            const hero = document.querySelector(".welcome-section") || 
                         document.querySelector(".header-section") || 
                         document.querySelector(".admin-header") ||
                         document.querySelector(".page-header");
            if (!hero) return;

            gsap.fromTo(hero.children, 
                { y: 25, opacity: 0 }, 
                { 
                    y: 0, 
                    opacity: 1, 
                    duration: 0.7, 
                    stagger: 0.12, 
                    ease: "power3.out",
                    delay: 0.2
                }
            );
        },

        // =====================================================
        // 3. STAGGERED CARDS / GRID ENTRANCE
        // =====================================================
        animateCardsEntrance: function (customSelector) {
            const gsap = getGSAP();
            if (!gsap) return;

            const selector = customSelector || 
                ".dashboard-card, .quick-card, .post-card, .event-card, .poll-card, .study-card, .admin-stat-card, .content-box";
            
            const cards = document.querySelectorAll(selector);
            if (!cards || cards.length === 0) return;

            gsap.fromTo(cards, 
                { y: 35, opacity: 0, scale: 0.96 }, 
                { 
                    y: 0, 
                    opacity: 1, 
                    scale: 1, 
                    duration: 0.65, 
                    stagger: {
                        amount: 0.4,
                        from: "start"
                    }, 
                    ease: "power3.out",
                    clearProps: "transform,opacity"
                }
            );
        },

        // =====================================================
        // 4. DYNAMIC NUMERIC COUNTER ANIMATION
        // =====================================================
        animateStatCounters: function (selector) {
            const gsap = getGSAP();
            if (!gsap) return;

            const targetSelector = selector || ".dashboard-card h2, .admin-stat-number, .stat-counter";
            const elements = document.querySelectorAll(targetSelector);

            elements.forEach(el => {
                const text = el.textContent.trim();
                const targetValue = parseInt(text.replace(/[^0-9]/g, ""), 10);

                if (!isNaN(targetValue) && targetValue >= 0) {
                    const counterObj = { val: 0 };
                    gsap.to(counterObj, {
                        val: targetValue,
                        duration: 1.2,
                        ease: "power2.out",
                        onUpdate: function () {
                            el.textContent = Math.ceil(counterObj.val).toLocaleString();
                        }
                    });
                }
            });
        },

        // =====================================================
        // 5. NOTIFICATION BELL JIGGLE & CHIME
        // =====================================================
        animateBellJiggle: function (element) {
            const gsap = getGSAP();
            if (!gsap) return;

            const target = element || document.getElementById("notificationBtn") || document.getElementById("notificationButton");
            if (!target) return;

            const icon = target.querySelector("i") || target;

            gsap.timeline()
                .to(icon, { rotation: -18, duration: 0.1, ease: "power1.inOut" })
                .to(icon, { rotation: 18, duration: 0.1, ease: "power1.inOut" })
                .to(icon, { rotation: -12, duration: 0.1, ease: "power1.inOut" })
                .to(icon, { rotation: 12, duration: 0.1, ease: "power1.inOut" })
                .to(icon, { rotation: -6, duration: 0.08, ease: "power1.inOut" })
                .to(icon, { rotation: 0, duration: 0.08, ease: "power1.inOut" });
        },

        // =====================================================
        // 6. BADGE POP BOUNCE
        // =====================================================
        animateBadgePop: function (badgeEl) {
            const gsap = getGSAP();
            if (!gsap) return;

            const badge = badgeEl || document.getElementById("notificationBadge");
            if (!badge) return;

            gsap.fromTo(badge, 
                { scale: 0, opacity: 0 }, 
                { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)" }
            );
        },

        // =====================================================
        // 7. DROPDOWN REVEAL & DISMISS
        // =====================================================
        animateDropdown: function (dropdownEl) {
            const gsap = getGSAP();
            if (!gsap || !dropdownEl) return;

            gsap.fromTo(dropdownEl, 
                { opacity: 0, scale: 0.92, y: -10 }, 
                { opacity: 1, scale: 1, y: 0, duration: 0.28, ease: "back.out(1.5)" }
            );
        },

        // =====================================================
        // 8. BUTTON HOVER & MAGNETIC MICRO-INTERACTIONS
        // =====================================================
        initInteractiveHover: function () {
            const gsap = getGSAP();
            if (!gsap) return;

            // Notification button hover bounce
            const notifBtn = document.getElementById("notificationBtn") || document.getElementById("notificationButton");
            if (notifBtn) {
                notifBtn.addEventListener("mouseenter", () => {
                    gsap.to(notifBtn, { scale: 1.08, duration: 0.2, ease: "power1.out" });
                });
                notifBtn.addEventListener("mouseleave", () => {
                    gsap.to(notifBtn, { scale: 1, duration: 0.25, ease: "power1.out" });
                });
            }

            // Quick cards interactive lift
            const interactiveCards = document.querySelectorAll(".quick-card, .admin-card-btn");
            interactiveCards.forEach(card => {
                card.addEventListener("mouseenter", () => {
                    gsap.to(card, { y: -5, duration: 0.25, ease: "power2.out" });
                    const arrow = card.querySelector(".arrow");
                    if (arrow) gsap.to(arrow, { x: 5, duration: 0.2, ease: "power2.out" });
                });
                card.addEventListener("mouseleave", () => {
                    gsap.to(card, { y: 0, duration: 0.25, ease: "power2.out" });
                    const arrow = card.querySelector(".arrow");
                    if (arrow) gsap.to(arrow, { x: 0, duration: 0.2, ease: "power2.out" });
                });
            });
        },

        // =====================================================
        // 9. MODAL & POPUP SPRING ENTRANCE
        // =====================================================
        animateModalEntrance: function (modalEl) {
            const gsap = getGSAP();
            if (!gsap || !modalEl) return;

            gsap.fromTo(modalEl, 
                { scale: 0.85, opacity: 0, y: 20 }, 
                { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.7)" }
            );
        },

        // =====================================================
        // 10. TAB & VIEW TRANSITION
        // =====================================================
        animateTabSwitch: function (tabContentEl) {
            const gsap = getGSAP();
            if (!gsap || !tabContentEl) return;

            gsap.fromTo(tabContentEl, 
                { opacity: 0, y: 15 }, 
                { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
            );
        },

        // Auto-run on page initialization
        initPageAnimations: function () {
            this.animateNavbarEntrance();
            this.animateHeroHeader();
            this.animateCardsEntrance();
            this.animateStatCounters();
            this.initInteractiveHover();
        }
    };

    // Expose globally
    window.StudentHubAnim = StudentHubAnim;

    // Run automatically when DOM content is loaded
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => StudentHubAnim.initPageAnimations());
    } else {
        StudentHubAnim.initPageAnimations();
    }
})();
