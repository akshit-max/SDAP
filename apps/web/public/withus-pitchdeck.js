// WithUs Landing Page - Exact Next.js Pricing Section Integration (Unified Animated Landing)
(function () {
    console.log("[WithUs] Initializing landing page & exact Next.js pricing section for WithUs...");

    // Inject animation styles
    if (!document.getElementById("withus-pricing-animation-styles")) {
        const style = document.createElement("style");
        style.id = "withus-pricing-animation-styles";
        style.textContent = `
            
            /* Platforms & Modules section — self-contained styles (the page's compiled
               Tailwind bundle doesn't ship most utilities this section needs) */
            #platform-guardrails {
                --wg-allow: #22c55e;
                --wg-lock: #ef4444;
                --wg-blue: #3094FF;
                --wg-ink: #0b0d12;
                --wg-muted: rgba(15, 23, 42, 0.55);
                --wg-line: rgba(15, 23, 42, 0.08);
                --wg-ease: cubic-bezier(0.16, 1, 0.3, 1);
                position: relative;
                overflow-x: clip;
                padding: 112px 48px 128px;
                color: var(--wg-ink);
                font-family: Geist, "Geist Fallback", ui-sans-serif, system-ui, sans-serif;
            }
            #platform-guardrails *, #platform-guardrails *::before, #platform-guardrails *::after { box-sizing: border-box; }
            .wg-inner { max-width: 1280px; margin: 0 auto; }

            /* Centered header */
            .wg-head { text-align: center; }
            .wg-eyebrow { margin: 0; font-size: 14px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--wg-blue); }
            .wg-title {
                margin: 18px auto 0; max-width: 900px;
                font-family: "DM Sans", "DM Sans Fallback", ui-sans-serif, system-ui, sans-serif;
                font-size: 66px; line-height: 1.02; font-weight: 500; letter-spacing: -0.03em; color: #000;
            }
            .wg-title span { color: rgba(0, 0, 0, 0.38); }
            .wg-sub { display: flex; align-items: center; justify-content: space-between; gap: 48px; max-width: 1080px; margin: 44px auto 0; text-align: left; }
            .wg-lead { margin: 0; max-width: 580px; font-size: 18px; line-height: 1.6; color: rgba(0, 0, 0, 0.6); }
            .wg-figures { display: flex; align-items: stretch; flex-shrink: 0; }
            .wg-figure { padding: 0 40px; text-align: center; }
            .wg-figure + .wg-figure { border-left: 1px solid rgba(0, 0, 0, 0.1); }
            .wg-figure:last-child { padding-right: 0; }
            .wg-figure b { display: block; font-family: "DM Sans", "DM Sans Fallback", ui-sans-serif, sans-serif; font-size: 56px; line-height: 1; font-weight: 500; letter-spacing: -0.03em; color: #000; font-variant-numeric: tabular-nums; }
            .wg-figure span { display: block; margin-top: 10px; font-size: 14px; color: rgba(0, 0, 0, 0.5); white-space: nowrap; }

            /* Header CTAs */
            .wg-btns { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
            .wg-btn {
                display: inline-flex; align-items: center; gap: 9px; height: 46px; padding: 0 22px; cursor: pointer;
                border-radius: 9999px; border: 1px solid rgba(0, 0, 0, 0.12); background: #fff; color: #000;
                font: 500 15px/1 inherit; font-family: inherit;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                transition: transform 0.15s ease, box-shadow 0.25s ease, border-color 0.2s ease, filter 0.2s ease;
            }
            .wg-btn svg { width: 16px; height: 16px; }
            .wg-btn:hover { border-color: rgba(0, 0, 0, 0.22); box-shadow: 0 6px 16px -6px rgba(0, 0, 0, 0.2); }
            .wg-btn:active { transform: scale(0.97); }
            .wg-btn.primary { border-color: transparent; background: var(--wg-blue); color: #fff; box-shadow: 0 10px 24px -8px rgba(48, 148, 255, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.25); }
            .wg-btn.primary:hover { filter: brightness(1.06); }
            .wg-btn.primary svg { transition: transform 0.2s ease; }
            .wg-btn.primary:hover svg { transform: translateX(3px); }

            /* Stage: soft blue glow so the white console lifts off the white page */
            .wg-stage { position: relative; margin-top: 64px; }
            .wg-stage::before {
                content: ""; position: absolute; z-index: 0; inset: -80px -120px; pointer-events: none;
                background: radial-gradient(50% 55% at 50% 50%, rgba(48, 148, 255, 0.14) 0%, rgba(48, 148, 255, 0.05) 45%, rgba(48, 148, 255, 0) 75%);
            }

            /* Light console */
            .wg-console {
                position: relative; z-index: 1; border-radius: 28px; overflow: hidden; color: var(--wg-ink);
                display: grid; grid-template-columns: 290px minmax(0, 1fr);
                background: #fff;
                border: 1px solid var(--wg-line);
                box-shadow: 0 50px 100px -40px rgba(15, 23, 42, 0.28), 0 20px 40px -24px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.6) inset;
            }

            /* Left rail */
            .wg-rail { display: flex; flex-direction: column; padding: 28px 16px; border-right: 1px solid var(--wg-line); background: #fafbfc; }
            .wg-rail-label { padding: 0 14px 16px; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(15, 23, 42, 0.4); }
            .wg-rail-list { display: flex; flex-direction: column; gap: 4px; }
            .wg-plat {
                position: relative; display: flex; align-items: center; gap: 14px; width: 100%; padding: 10px 14px; overflow: hidden;
                border: 0; border-radius: 12px; background: transparent; cursor: pointer; text-align: left;
                font: inherit; color: rgba(15, 23, 42, 0.72);
                transition: background 0.3s var(--wg-ease), color 0.2s ease;
            }
            .wg-plat::before { content: ""; position: absolute; left: 0; top: 9px; bottom: 9px; width: 3px; border-radius: 0 3px 3px 0; background: var(--wg-blue); transform: scaleY(0); transition: transform 0.35s var(--wg-ease); }
            .wg-plat:hover { background: rgba(15, 23, 42, 0.035); color: var(--wg-ink); }
            .wg-plat[aria-selected="true"] { background: #eaf3ff; color: var(--wg-ink); }
            .wg-plat[aria-selected="true"]::before { transform: scaleY(1); }
            .wg-plat:focus-visible { outline: 2px solid var(--wg-blue); outline-offset: -2px; }
            .wg-plat-name { flex: 1; min-width: 0; font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .wg-plat-count { font-size: 13px; color: rgba(15, 23, 42, 0.4); font-variant-numeric: tabular-nums; }
            .wg-plat[aria-selected="true"] .wg-plat-name { font-weight: 600; }
            .wg-plat[aria-selected="true"] .wg-plat-count { color: var(--wg-blue); font-weight: 600; }
            .wg-progress { position: absolute; left: 14px; right: 14px; bottom: 0; height: 2px; border-radius: 2px; transform-origin: left; transform: scaleX(0); background: linear-gradient(90deg, rgba(48, 148, 255, 0), var(--wg-blue)); opacity: 0; }
            .wg-console.wg-auto .wg-plat[aria-selected="true"] .wg-progress { opacity: 1; animation: wg-progress 6.5s linear forwards; }
            .wg-console:not(.wg-visible) .wg-progress,
            .wg-console:hover .wg-progress { animation-play-state: paused !important; }
            .wg-connect {
                display: flex; align-items: center; justify-content: center; gap: 8px; margin: 20px 4px 0; padding: 12px; cursor: pointer;
                border-radius: 9999px; border: 1px dashed rgba(15, 23, 42, 0.2); background: #fff;
                font: 500 14px/1 inherit; font-family: inherit; color: rgba(15, 23, 42, 0.7);
                transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
            }
            .wg-connect:hover { border-color: var(--wg-blue); color: var(--wg-blue); background: #f5f9ff; }
            .wg-connect svg { width: 14px; height: 14px; }

            /* Brand tiles */
            .wg-tile {
                width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0; display: grid; place-items: center;
                background: var(--tile-bg, #1f2937); color: var(--tile-fg, #fff);
                box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
                font-size: 8.5px; font-weight: 800; letter-spacing: 0.02em;
            }
            .wg-tile svg { width: 17px; height: 17px; color: inherit; }

            /* Right: detail panel */
            .wg-detail { display: flex; flex-direction: column; min-width: 0; }
            .wg-detail-top { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 32px 40px 0; }
            .wg-detail-id { display: flex; align-items: center; gap: 18px; min-width: 0; }
            .wg-detail-id .wg-tile { width: 56px; height: 56px; border-radius: 16px; font-size: 12px; box-shadow: 0 8px 20px -10px rgba(15, 23, 42, 0.45), inset 0 0 0 1px rgba(15, 23, 42, 0.08); }
            .wg-detail-id .wg-tile svg { width: 28px; height: 28px; }
            .wg-detail-id h3 { margin: 0; font-family: "DM Sans", "DM Sans Fallback", ui-sans-serif, sans-serif; font-size: 28px; font-weight: 500; letter-spacing: -0.01em; color: var(--wg-ink); }
            .wg-detail-id p { margin: 4px 0 0; font-size: 14px; color: var(--wg-muted); }
            .wg-actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
            .wg-status { display: inline-flex; align-items: center; gap: 8px; padding: 9px 15px; border-radius: 9999px; font-size: 13px; font-weight: 500; color: #15803d; background: #effcf3; border: 1px solid #c7f0d5; }
            .wg-status i { width: 7px; height: 7px; border-radius: 9999px; background: var(--wg-allow); animation: wg-live 2s ease-in-out infinite; }
            .wg-save {
                display: inline-flex; align-items: center; gap: 8px; padding: 11px 20px; border: 0; border-radius: 12px; cursor: pointer;
                font: 600 14px/1 inherit; font-family: inherit; color: #fff; background: var(--wg-blue);
                box-shadow: 0 8px 20px -8px rgba(48, 148, 255, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.25);
                transition: transform 0.15s ease, filter 0.2s ease, background 0.3s ease;
            }
            .wg-save:hover { filter: brightness(1.06); }
            .wg-save:active { transform: scale(0.97); }
            .wg-save svg { width: 14px; height: 14px; display: none; }
            .wg-save.is-saved { background: var(--wg-allow); box-shadow: 0 8px 20px -8px rgba(34, 197, 94, 0.6); }
            .wg-save.is-saved svg { display: block; }

            .wg-tabs { display: flex; gap: 32px; margin-top: 28px; padding: 0 40px; border-bottom: 1px solid var(--wg-line); }
            .wg-tab {
                position: relative; padding: 12px 2px 15px; border: 0; background: transparent; cursor: pointer;
                font: 500 15px/1 inherit; font-family: inherit; color: var(--wg-muted); transition: color 0.2s ease;
            }
            .wg-tab:hover { color: var(--wg-ink); }
            .wg-tab[aria-selected="true"] { color: var(--wg-ink); font-weight: 600; }
            .wg-tab::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; border-radius: 2px; background: var(--wg-blue); transform: scaleX(0); transition: transform 0.35s var(--wg-ease); }
            .wg-tab[aria-selected="true"]::after { transform: scaleX(1); }
            .wg-tab-badge { margin-left: 7px; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: #eaf3ff; color: var(--wg-blue); }

            .wg-panel { flex: 1; padding: 28px 40px 24px; }
            .wg-info { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-radius: 14px; font-size: 14px; color: #1e3a5f; background: #f3f8ff; border: 1px solid #d9e9ff; }
            .wg-info svg { width: 18px; height: 18px; flex-shrink: 0; color: var(--wg-blue); }
            .wg-summary { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 26px; font-size: 14px; }
            .wg-summary > b { font-size: 15px; font-weight: 600; color: var(--wg-ink); }
            .wg-legend { display: flex; align-items: center; gap: 18px; color: rgba(15, 23, 42, 0.7); }
            .wg-legend span { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; font-variant-numeric: tabular-nums; }
            .wg-legend em { font-style: normal; }
            .wg-legend i { width: 8px; height: 8px; border-radius: 9999px; }
            .wg-legend .allow i { background: var(--wg-allow); }
            .wg-legend .lock i { background: var(--wg-lock); }
            .wg-legend .sep { width: 1px; height: 14px; background: rgba(15, 23, 42, 0.12); }

            /* Select all */
            .wg-all { display: inline-flex; align-items: center; gap: 8px; padding: 0; border: 0; background: none; cursor: pointer; font: inherit; font-size: 14px; color: rgba(15, 23, 42, 0.7); }
            .wg-all:hover { color: var(--wg-ink); }
            .wg-check { position: relative; width: 16px; height: 16px; border-radius: 5px; border: 1.5px solid rgba(15, 23, 42, 0.28); transition: background 0.2s ease, border-color 0.2s ease; }
            .wg-all[aria-pressed="true"] .wg-check { background: var(--wg-blue); border-color: var(--wg-blue); }
            .wg-all[aria-pressed="true"] .wg-check::after { content: ""; position: absolute; left: 4.5px; top: 1.5px; width: 4px; height: 8px; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg); }

            /* Module cards: fixed 4-row window so the panel never jumps; larger platforms scroll inside it */
            .wg-mods {
                position: relative; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: 72px; align-content: start; gap: 12px;
                margin-top: 16px; height: 324px; overflow-y: auto; overscroll-behavior: contain; padding: 2px 4px 2px 2px;
                scrollbar-width: thin; scrollbar-color: rgba(15, 23, 42, 0.18) transparent;
            }
            .wg-mods.is-more { -webkit-mask-image: linear-gradient(to bottom, #000 84%, transparent); mask-image: linear-gradient(to bottom, #000 84%, transparent); }
            .wg-more { margin: 10px 0 0; font-size: 12px; color: rgba(15, 23, 42, 0.45); text-align: center; }
            .wg-mod {
                display: flex; align-items: center; gap: 16px; width: 100%; padding: 0 18px; cursor: pointer; text-align: left;
                border-radius: 14px; border: 1px solid var(--wg-line); background: #fff;
                font: inherit; color: var(--wg-ink);
                box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
                transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
                animation: wg-in 0.55s var(--wg-ease) both;
            }
            .wg-mod:hover { border-color: rgba(15, 23, 42, 0.16); box-shadow: 0 8px 20px -12px rgba(15, 23, 42, 0.25); }
            .wg-mod:focus-visible { outline: 2px solid var(--wg-blue); outline-offset: 2px; }
            .wg-mod-ic { width: 40px; height: 40px; flex-shrink: 0; border-radius: 11px; display: grid; place-items: center; color: #334155; background: #f6f7f9; border: 1px solid rgba(15, 23, 42, 0.06); transition: color 0.3s ease, background 0.3s ease; }
            .wg-mod-ic svg { width: 18px; height: 18px; }
            .wg-mod-text { flex: 1; min-width: 0; }
            .wg-mod-text b { display: block; font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color 0.3s ease; }
            .wg-mod-text small { display: block; margin-top: 3px; font-size: 13px; color: var(--wg-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .wg-mod-text .off { display: none; }
            .wg-switch { position: relative; width: 46px; height: 27px; flex-shrink: 0; border-radius: 9999px; background: var(--wg-allow); box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.04); transition: background 0.3s var(--wg-ease); }
            .wg-switch::after { content: ""; position: absolute; top: 3px; left: 22px; width: 21px; height: 21px; border-radius: 9999px; background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25); transition: left 0.3s var(--wg-ease); }
            .wg-mod[aria-checked="false"] { background: #fffafa; border-color: #fbd5d5; }
            .wg-mod[aria-checked="false"] .wg-switch { background: var(--wg-lock); }
            .wg-mod[aria-checked="false"] .wg-switch::after { left: 3px; }
            .wg-mod[aria-checked="false"] .wg-mod-text b { color: rgba(15, 23, 42, 0.6); }
            .wg-mod[aria-checked="false"] .wg-mod-ic { color: #dc2626; background: #fef2f2; }
            .wg-mod[aria-checked="false"] .wg-mod-text .on { display: none; }
            .wg-mod[aria-checked="false"] .wg-mod-text .off { display: block; color: #dc2626; }

            /* Activity log (built from the visitor's own toggles) */
            .wg-log { list-style: none; margin: 0; padding: 0; }
            .wg-log li { display: flex; align-items: center; gap: 12px; padding: 15px 4px; border-bottom: 1px solid var(--wg-line); font-size: 14px; color: #334155; animation: wg-in 0.45s var(--wg-ease) both; }
            .wg-log li i { width: 8px; height: 8px; border-radius: 9999px; flex-shrink: 0; }
            .wg-log li .t { margin-left: auto; font-size: 12px; color: rgba(15, 23, 42, 0.4); white-space: nowrap; }
            .wg-log-empty { padding: 56px 0; text-align: center; font-size: 14px; color: var(--wg-muted); }

            .wg-foot { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 40px; border-top: 1px solid var(--wg-line); background: #fcfcfd; font-size: 14px; color: var(--wg-muted); }
            .wg-foot-note { display: flex; align-items: center; gap: 10px; }
            .wg-foot-note svg { width: 18px; height: 18px; flex-shrink: 0; color: var(--wg-allow); }
            .wg-foot-note b { color: var(--wg-ink); font-weight: 600; }
            .wg-cta {
                display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0; cursor: pointer;
                padding: 12px 22px; border-radius: 9999px; border: 1px solid rgba(15, 23, 42, 0.14); background: #fff; color: var(--wg-ink);
                font: 500 14px/1 inherit; font-family: inherit; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
                transition: transform 0.15s ease, border-color 0.2s ease, box-shadow 0.2s ease;
            }
            .wg-cta:hover { border-color: rgba(15, 23, 42, 0.28); box-shadow: 0 6px 16px -8px rgba(15, 23, 42, 0.3); }
            .wg-cta:active { transform: scale(0.97); }
            .wg-cta svg { width: 14px; height: 14px; }

            /* Highlights strip below the console (Hidden per UI request) */
            .wg-strip { display: none !important; }
            .wg-strip-item { display: flex; align-items: center; gap: 18px; padding: 0 40px; }
            .wg-strip-item + .wg-strip-item { border-left: 1px solid rgba(0, 0, 0, 0.08); }
            .wg-strip-item:first-child { padding-left: 0; }
            .wg-perk-ic { width: 52px; height: 52px; flex-shrink: 0; border-radius: 14px; display: grid; place-items: center; color: var(--wg-blue); background: #eef5ff; border: 1px solid rgba(48, 148, 255, 0.15); }
            .wg-perk-ic svg { width: 22px; height: 22px; }
            .wg-strip-item b { display: block; font-size: 17px; font-weight: 600; color: #000; }
            .wg-strip-item small { display: block; margin-top: 5px; font-size: 14px; color: rgba(0, 0, 0, 0.55); }

            .wg-swap { animation: wg-fade 0.5s var(--wg-ease) both; }
            #platform-guardrails [hidden] { display: none !important; }

            @keyframes wg-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
            @keyframes wg-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
            @keyframes wg-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
            @keyframes wg-live { 0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); } 50% { box-shadow: 0 0 0 5px rgba(34, 197, 94, 0); } }

            @media (max-width: 1023px) {
                #platform-guardrails { padding: 72px 32px 96px; }
                .wg-title { font-size: 48px; }
                .wg-sub { flex-direction: column; align-items: center; text-align: center; gap: 28px; }
                .wg-btns { justify-content: center; }
                .wg-console { grid-template-columns: minmax(0, 1fr); }
                .wg-rail { padding: 12px; border-right: 0; border-bottom: 1px solid var(--wg-line); }
                .wg-rail-label, .wg-connect, .wg-plat-count { display: none; }
                .wg-rail-list { flex-direction: row; overflow-x: auto; scrollbar-width: none; }
                .wg-rail-list::-webkit-scrollbar { display: none; }
                .wg-plat { width: auto; flex-shrink: 0; padding: 8px 14px 8px 8px; }
                .wg-plat::before { display: none; }
                .wg-detail-top, .wg-tabs, .wg-panel, .wg-foot { padding-left: 28px; padding-right: 28px; }
                .wg-strip { grid-template-columns: minmax(0, 1fr); gap: 20px; margin-top: 48px; padding-top: 28px; }
                .wg-strip-item, .wg-strip-item:first-child { padding: 0; }
                .wg-strip-item + .wg-strip-item { border-left: 0; }
            }
            @media (max-width: 767px) {
                #platform-guardrails { padding: 56px 16px 80px; }
                .wg-eyebrow { font-size: 12px; }
                .wg-title { font-size: 36px; }
                .wg-lead { font-size: 16px; }
                .wg-figure { padding: 0 24px; }
                .wg-figure b { font-size: 40px; }
                .wg-stage { margin-top: 40px; }
                .wg-console { border-radius: 22px; }
                .wg-detail-top { flex-direction: column; align-items: flex-start; padding: 20px 16px 0; }
                .wg-detail-id h3 { font-size: 22px; }
                .wg-tabs { padding: 0 16px; gap: 22px; }
                .wg-panel { padding: 18px 16px 20px; }
                .wg-summary { flex-direction: column; align-items: flex-start; gap: 10px; }
                .wg-legend { flex-wrap: wrap; }
                .wg-mods { grid-template-columns: minmax(0, 1fr); height: auto; overflow: visible; }
                .wg-mods.is-more { -webkit-mask-image: none; mask-image: none; }
                .wg-more { display: none; }
                .wg-foot { flex-direction: column; align-items: stretch; padding: 18px 16px; }
                .wg-cta { justify-content: center; }
            }
            @media (prefers-reduced-motion: reduce) {
                .wg-mod, .wg-swap, .wg-log li, .wg-status i { animation: none !important; }
                .wg-progress { display: none; }
            }

            /* WithUs Pricing Animations (Framer Motion Stagger Replica) */
            .pricing-fade-up {
                opacity: 0 !important;
                transform: translateY(40px) !important;
                transition: opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1) !important;
                will-change: opacity, transform;
            }
            .pricing-fade-up.in-view {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
            .pricing-delay-1 { transition-delay: 0.1s !important; }
            .pricing-delay-2 { transition-delay: 0.2s !important; }
            .pricing-delay-3 { transition-delay: 0.3s !important; }
            .pricing-delay-4 { transition-delay: 0.4s !important; }
            .pricing-delay-5 { transition-delay: 0.5s !important; }
            .pricing-delay-6 { transition-delay: 0.6s !important; }
            /* Drop the compositing layer once the entrance animation has finished */
            .pricing-fade-up.in-view.pricing-settled {
                transform: none !important;
                will-change: auto;
            }
            /* Remove backdrop-filters from all pricing cards to prevent Chrome's vertical seam line bug */
            #pricing .frost-border,
            #pricing [class*="backdrop-blur"],
            .withus-premium-card {
                position: relative;
                -webkit-backdrop-filter: none !important;
                backdrop-filter: none !important;
            }

            /* 1. Remove underlying city/step text in hero header that clashes with the top pill banner */
            .pl-5.font-bold.uppercase.tracking-wide.text-white\/50.mix-blend-plus-lighter {
                display: none !important;
            }

            /* 2. Ensure 0.5px horizontal lines in hero and pricing render with crisp 1px height */
            .h-\[0\.5px\] {
                height: 1px !important;
                min-height: 1px !important;
            }

            /* Hero horizontal line styling - subtle, elegant hairline matching reference */
            .relative.mt-4.h-\[0\.5px\].w-full {
                height: 1px !important;
                min-height: 1px !important;
                display: block !important;
                opacity: 1 !important;
                background: linear-gradient(90deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.25) 50%, rgba(255, 255, 255, 0.12) 100%) !important;
                box-shadow: none !important;
                margin-top: 44px !important;
            }
            .relative.mt-4.h-\[0\.5px\].w-full .h-\[0\.5px\].w-4 {
                height: 1px !important;
                min-height: 1px !important;
                background-color: rgba(255, 255, 255, 0.65) !important;
                box-shadow: none !important;
            }

            /* 3. Pricing card divider line */
            #pricing .shrink-0.h-\[0\.5px\].w-full {
                height: 1px !important;
                min-height: 1px !important;
                display: block !important;
                background-color: rgba(255, 255, 255, 0.45) !important;
            }

            /* 4. Mobile Bottom Navbar: Precision glass pill with centered Get Started CTA */
            @media (max-width: 639px) {
                /* Floating navbar container: full-width glass bar with 16px gutters, capped at 480px and centered */
                nav.fixed[class*="bottom-"],
                nav.fixed.bottom-4 {
                    width: auto !important;
                    min-width: 0 !important;
                    max-width: 480px !important;
                    left: 16px !important;
                    right: 16px !important;
                    margin: 0 auto !important;
                    bottom: calc(16px + env(safe-area-inset-bottom, 0px)) !important;
                    transform: none !important;
                    padding: 0 8px 0 16px !important;
                    gap: 8px !important;
                    display: flex !important;
                    flex-direction: row !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    height: 52px !important;
                    box-sizing: border-box !important;
                    border-radius: 9999px !important;
                    background: rgba(18, 20, 26, 0.82) !important;
                    -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
                    backdrop-filter: blur(24px) saturate(180%) !important;
                    border: 1px solid rgba(255, 255, 255, 0.14) !important;
                    box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08) inset !important;
                    z-index: 50 !important;
                    overflow: visible !important;
                }

                /* Suppress duplicate background from Tailwind ::before on mobile */
                nav.fixed[class*="bottom-"]::before,
                nav.fixed.bottom-4::before {
                    display: none !important;
                }

                /* Hide desktop navigation and dividers on mobile */
                nav.fixed[class*="bottom-"] [data-orientation="vertical"],
                nav.fixed[class*="bottom-"] [data-slot="navigation-menu"],
                nav.fixed.bottom-4 [data-orientation="vertical"],
                nav.fixed.bottom-4 [data-slot="navigation-menu"] {
                    display: none !important;
                }

                /* Logo: perfectly aligned on the left, never wrapping */
                nav.fixed[class*="bottom-"] > a:first-child,
                nav.fixed.bottom-4 > a:first-child {
                    order: 1 !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    flex-shrink: 0 !important;
                    margin-right: auto !important;
                    height: auto !important;
                    white-space: nowrap !important;
                    text-decoration: none !important;
                }

                nav.fixed[class*="bottom-"] > a:first-child img,
                nav.fixed.bottom-4 > a:first-child img {
                    height: 26px !important;
                    width: auto !important;
                    max-width: 64px !important;
                    display: block !important;
                }

                nav.fixed[class*="bottom-"] > a:first-child *,
                nav.fixed.bottom-4 > a:first-child * {
                    white-space: nowrap !important;
                }

                /* Get Started CTA button: centered white pill with refined typography */
                nav.fixed[class*="bottom-"] button.hidden.sm\\:flex,
                nav.fixed[class*="bottom-"] .hidden.sm\\:flex,
                nav.fixed.bottom-4 button.hidden.sm\\:flex,
                nav.fixed.bottom-4 .hidden.sm\\:flex {
                    display: inline-flex !important;
                    order: 2 !important;
                    align-items: center !important;
                    justify-content: center !important;
                    margin: 0 4px !important;
                    padding: 0 18px !important;
                    font-size: 13px !important;
                    font-weight: 600 !important;
                    letter-spacing: -0.01em !important;
                    border-radius: 9999px !important;
                    background: #ffffff !important;
                    color: #000000 !important;
                    white-space: nowrap !important;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3) !important;
                    border: none !important;
                    height: 36px !important;
                    line-height: 36px !important;
                    flex-shrink: 1 !important;
                    min-width: 0 !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    cursor: pointer !important;
                    transition: transform 0.15s ease, opacity 0.15s ease !important;
                }

                nav.fixed[class*="bottom-"] button.hidden.sm\\:flex:active,
                nav.fixed.bottom-4 button.hidden.sm\\:flex:active {
                    transform: scale(0.97) !important;
                    opacity: 0.9 !important;
                }

                /* Hamburger Menu button: circular 36px button concentric with pill cap */
                nav.fixed[class*="bottom-"] button[aria-label="Open menu"],
                nav.fixed.bottom-4 button[aria-label="Open menu"] {
                    order: 3 !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    width: 36px !important;
                    height: 36px !important;
                    min-width: 36px !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    flex-shrink: 0 !important;
                    border-radius: 9999px !important;
                    background: rgba(255, 255, 255, 0.1) !important;
                    border: 1px solid rgba(255, 255, 255, 0.16) !important;
                    color: #ffffff !important;
                    cursor: pointer !important;
                    transition: background 0.15s ease, transform 0.15s ease !important;
                }

                nav.fixed[class*="bottom-"] button[aria-label="Open menu"]:active,
                nav.fixed.bottom-4 button[aria-label="Open menu"]:active {
                    background: rgba(255, 255, 255, 0.2) !important;
                    transform: scale(0.95) !important;
                }


                @media (max-width: 360px) {

                    nav.fixed[class*="bottom-"] .hidden.sm\\:flex,

                    nav.fixed.bottom-4 .hidden.sm\\:flex {

                        padding: 0 14px !important;

                        font-size: 12px !important;

                    }

                }
            }
        `;
        document.head.appendChild(style);
    }

    // 1. Ensure Brand Name & Navbar show WithUs and Module Control points to #platform-guardrails
    function updateBrandAndNav() {
        document.querySelectorAll("a, button").forEach(el => {
            const txt = (el.innerText || "").trim().toLowerCase();
            const href = el.getAttribute("href") || "";
            if (
                txt.includes("module-based") ||
                txt.includes("module control") ||
                txt.includes("restrict users") ||
                href.includes("module-control")
            ) {
                el.setAttribute("href", "#platform-guardrails");
                el.setAttribute("data-module-control", "true");
            }
        });
        // Ensure any lingering WithUs brand names are converted to WithUs
        document.querySelectorAll("p, span, div, a, button, h1, h2, h3").forEach(el => {
            if (el.children.length === 0) {
                const txt = (el.innerText || "").trim();
                if (txt === "WithUs") {
                    el.innerText = "WithUs";
                }
            }
        });

        // Remove old winding-down banner pills
        document.querySelectorAll("a, div, span").forEach(el => {
            const txt = (el.innerText || "").trim();
            if (
                txt.includes("winding down") ||
                txt.includes("winding-down") ||
                txt.includes("may 20, 2026")
            ) {
                const banner = el.closest('.fixed, .sticky, header, .rounded-full') || el;
                banner.style.display = 'none';
            }
        });

        updateFooter();
    }

    // Update footer brand description hyperlink, social links, legal page routes, and text colors (#1F2937)
    function updateFooter() {
        // 1. Hyperlink makewithus in brand description (target leaf elements only)
        document.querySelectorAll("p, span, .text-gray-700\\/70").forEach(el => {
            if (el.children.length <= 1 && (el.innerText || "").includes("Secure delegated access platform") && (el.innerText || "").includes("makewithus")) {
                if (!el.dataset.withusMakewithusLink) {
                    el.dataset.withusMakewithusLink = "true";
                    el.innerHTML = 'Secure delegated access platform for business portals.<br/>Product of <a href="https://makewithus.in" target="_blank" rel="noopener noreferrer" style="color: #1F2937 !important; text-decoration: underline !important; text-underline-offset: 3px !important; font-weight: 600 !important;" class="hover:text-[#3094FF] transition-colors">makewithus&reg;</a>.';
                }
                el.style.setProperty("color", "#1F2937", "important");
                el.style.setProperty("font-weight", "500", "important");
            }
        });

        // 2. Identify and update Menu, Socials, and Legal columns (direct parent matching only)
        document.querySelectorAll("div").forEach(col => {
            const heading = col.querySelector("div[class*='animate-neumorphic-gradient-text-default'], div[class*='heading-3xl']");
            if (!heading || heading.parentElement !== col) return;
            const headingText = (heading.innerText || "").trim().toLowerCase();

            if (headingText === "socials") {
                const ul = col.querySelector(":scope > ul") || col.querySelector("ul");
                if (ul && !ul.dataset.withusSocialsUpdated) {
                    ul.dataset.withusSocialsUpdated = "true";
                    ul.innerHTML = `
                        <li><a href="https://www.linkedin.com/company/makewithus/" target="_blank" rel="noopener noreferrer" class="withus-footer-link" style="color: #1F2937 !important; font-weight: 500 !important; text-decoration: none !important; transition: color 0.15s ease;">LinkedIn</a></li>
                        <li><a href="https://www.instagram.com/makewithus.in/" target="_blank" rel="noopener noreferrer" class="withus-footer-link" style="color: #1F2937 !important; font-weight: 500 !important; text-decoration: none !important; transition: color 0.15s ease;">Instagram</a></li>
                    `;
                }
            } else if (headingText === "legal") {
                const ul = col.querySelector(":scope > ul") || col.querySelector("ul");
                if (ul && !ul.dataset.withusLegalUpdated) {
                    ul.dataset.withusLegalUpdated = "true";
                    ul.innerHTML = `
                        <li><a href="/privacy" class="withus-footer-link" style="color: #1F2937 !important; font-weight: 500 !important; text-decoration: none !important; transition: color 0.15s ease;">Privacy Policy</a></li>
                        <li><a href="/terms" class="withus-footer-link" style="color: #1F2937 !important; font-weight: 500 !important; text-decoration: none !important; transition: color 0.15s ease;">Terms of Service</a></li>
                        <li><a href="/security" class="withus-footer-link" style="color: #1F2937 !important; font-weight: 500 !important; text-decoration: none !important; transition: color 0.15s ease;">Security</a></li>
                        <li><a href="/cookie-policy" class="withus-footer-link" style="color: #1F2937 !important; font-weight: 500 !important; text-decoration: none !important; transition: color 0.15s ease;">Cookie Policy</a></li>
                    `;
                }
            } else if (headingText === "menu") {
                const ul = col.querySelector(":scope > ul") || col.querySelector("ul");
                if (ul) {
                    ul.querySelectorAll("a").forEach(a => {
                        a.style.setProperty("color", "#1F2937", "important");
                        a.style.setProperty("font-weight", "500", "important");
                        const h = a.getAttribute("href") || "";
                        if (h === "/sso" || h.includes("sso")) {
                            a.setAttribute("href", "https://withus.makewithus.in");
                            a.setAttribute("target", "_blank");
                            a.setAttribute("rel", "noopener noreferrer");
                        }
                    });
                }
            }
        });

        // 3. Ensure all non-heading footer elements have #1F2937
        document.querySelectorAll(".text-gray-700\\/70, .withus-footer-link").forEach(el => {
            el.style.setProperty("color", "#1F2937", "important");
            el.style.setProperty("font-weight", "500", "important");
        });
    }

    // 2. Interactive WithUs Trial & Lead Modal
    function injectTrialModal() {
        if (document.getElementById("withus-trial-modal")) return;

        const modal = document.createElement("div");
        modal.id = "withus-trial-modal";
        modal.className = "fixed inset-0 hidden items-center justify-center p-4 transition-all duration-300";
        modal.style.zIndex = "999999";
        modal.style.background = "rgba(4, 9, 20, 0.78)";
        modal.style.backdropFilter = "blur(14px)";
        modal.style.webkitBackdropFilter = "blur(14px)";

        modal.innerHTML = `
            <div class="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/20 shadow-2xl text-white transition-all transform scale-100" style="background: linear-gradient(135deg, rgba(17, 24, 39, 0.98) 0%, rgba(15, 23, 42, 0.99) 100%); box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 45px rgba(59, 130, 246, 0.15); padding: 32px; box-sizing: border-box;">
                <!-- MODULE 1: HEADER -->
                <div style="padding-bottom: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
                    <!-- Top Bar: Badge on Left, Close Cross on Right -->
                    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; margin-bottom: 16px;">
                        <div style="display: inline-flex; align-items: center; gap: 8px; border-radius: 9999px; border: 1px solid rgba(59, 130, 246, 0.35); background: rgba(59, 130, 246, 0.12); padding: 5px 13px; font-size: 12px; font-weight: 500; color: #60a5fa; letter-spacing: 0.01em;">
                            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background: #60a5fa; flex-shrink: 0;"></span>
                            <span id="modal-badge-text">WithUs • 14-Day Free Trial</span>
                        </div>
                        <button type="button" id="close-modal-btn" style="display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 9999px; background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.75); border: 1px solid rgba(255, 255, 255, 0.12); cursor: pointer; transition: all 0.2s ease; flex-shrink: 0;" aria-label="Close" onmouseenter="this.style.background='rgba(255,255,255,0.2)';this.style.color='#ffffff'" onmouseleave="this.style.background='rgba(255,255,255,0.1)';this.style.color='rgba(255,255,255,0.75)'">
                            <svg style="width: 15px; height: 15px; display: block;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>

                    <h3 id="modal-title" style="margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.02em; color: #ffffff; line-height: 1.25;">Get Started with WithUs</h3>
                    <p id="modal-sub" style="margin: 8px 0 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.7); line-height: 1.5; max-width: 440px;">
                        Experience the world's most intelligent coworker. Reads your apps, drafts your replies, and preps your day 24/7.
                    </p>
                </div>

                <!-- MODULE 2: FORM -->
                <form id="withus-trial-form" style="margin-top: 22px;">
                    <!-- Row 1: Full Name & Work Email -->
                    <div style="display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 14px;">
                        <div style="flex: 1 1 220px;">
                            <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255, 255, 255, 0.75); margin-bottom: 6px;">Full Name <span style="color: #f87171;">*</span></label>
                            <input required type="text" id="trial-name" placeholder="Alex Morgan" style="width: 100%; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.16); background: rgba(255, 255, 255, 0.05); padding: 11px 15px; font-size: 14px; color: #ffffff; outline: none; box-sizing: border-box; transition: all 0.2s ease;" onfocus="this.style.borderColor='#60a5fa';this.style.background='rgba(255,255,255,0.08)'" onblur="this.style.borderColor='rgba(255,255,255,0.16)';this.style.background='rgba(255,255,255,0.05)'" />
                        </div>
                        <div style="flex: 1 1 220px;">
                            <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255, 255, 255, 0.75); margin-bottom: 6px;">Work / Company Email <span style="color: #f87171;">*</span></label>
                            <input required type="email" id="trial-email" placeholder="alex@company.com" style="width: 100%; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.16); background: rgba(255, 255, 255, 0.05); padding: 11px 15px; font-size: 14px; color: #ffffff; outline: none; box-sizing: border-box; transition: all 0.2s ease;" onfocus="this.style.borderColor='#60a5fa';this.style.background='rgba(255,255,255,0.08)'" onblur="this.style.borderColor='rgba(255,255,255,0.16)';this.style.background='rgba(255,255,255,0.05)'" />
                        </div>
                    </div>

                    <!-- Row 2: Company / Organization -->
                    <div style="margin-bottom: 14px;">
                        <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255, 255, 255, 0.75); margin-bottom: 6px;">Company / Organization <span style="color: #f87171;">*</span></label>
                        <input required type="text" id="trial-org" placeholder="Acme Cloud Solutions" style="width: 100%; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.16); background: rgba(255, 255, 255, 0.05); padding: 11px 15px; font-size: 14px; color: #ffffff; outline: none; box-sizing: border-box; transition: all 0.2s ease;" onfocus="this.style.borderColor='#60a5fa';this.style.background='rgba(255,255,255,0.08)'" onblur="this.style.borderColor='rgba(255,255,255,0.16)';this.style.background='rgba(255,255,255,0.05)'" />
                    </div>

                    <!-- Row 3: Optional Message -->
                    <div style="margin-bottom: 18px;">
                        <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255, 255, 255, 0.75); margin-bottom: 6px;">Optional Message / Specific Use Case</label>
                        <textarea rows="2" id="trial-message" placeholder="Tell us about your team's access delegation needs..." style="width: 100%; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.16); background: rgba(255, 255, 255, 0.05); padding: 11px 15px; font-size: 14px; color: #ffffff; outline: none; box-sizing: border-box; resize: none; transition: all 0.2s ease;" onfocus="this.style.borderColor='#60a5fa';this.style.background='rgba(255,255,255,0.08)'" onblur="this.style.borderColor='rgba(255,255,255,0.16)';this.style.background='rgba(255,255,255,0.05)'"></textarea>
                    </div>

                    <!-- MODULE 3: SUBMIT ACTION -->
                    <div style="padding-top: 4px;">
                        <button type="submit" id="trial-submit-btn" style="display: flex; width: 100%; align-items: center; justify-content: center; gap: 10px; border-radius: 14px; background: #ffffff; padding: 14px; font-size: 14px; font-weight: 600; color: #000000; border: none; cursor: pointer; box-shadow: 0 10px 25px rgba(0,0,0,0.4); transition: all 0.2s ease;" onmouseenter="this.style.background='#e5e7eb';this.style.transform='scale(1.006)'" onmouseleave="this.style.background='#ffffff';this.style.transform='scale(1)'">
                            <span id="trial-submit-btn-text">Start Free Trial</span>
                            <svg style="width: 16px; height: 16px; display: block;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                        </button>
                    </div>
                </form>

                <!-- Success Screen -->
                <div id="trial-success" class="hidden" style="padding: 40px 0; text-align: center;">
                    <div style="margin: 0 auto 16px; display: flex; width: 56px; height: 56px; align-items: center; justify-content: center; border-radius: 9999px; background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.3);">
                        <svg style="width: 28px; height: 28px;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <h4 style="margin: 0; font-size: 24px; font-weight: 600; color: #ffffff;">Welcome to WithUs!</h4>
                    <p id="trial-success-text" style="margin: 8px auto 0; font-size: 14px; color: rgba(255, 255, 255, 0.7); max-width: 380px;">Your workspace is being prepped. Check your inbox for your instant access credentials.</p>
                    <button type="button" id="close-success-btn" style="margin-top: 24px; border-radius: 9999px; background: #ffffff; padding: 10px 32px; font-size: 13px; font-weight: 600; color: #000000; border: none; cursor: pointer; transition: background 0.2s;" onmouseenter="this.style.background='#e5e7eb'" onmouseleave="this.style.background='#ffffff'">Continue</button>
                </div>

                <!-- MODULE 4: FOOTER -->
                <div style="margin-top: 22px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 16px; text-align: center; font-size: 12px; color: rgba(255, 255, 255, 0.45); letter-spacing: 0.01em;">
                    WithUs • Trusted by modern teams • 256-bit encryption • 24/7 Intelligent Coworker
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        window.openWithUsTrialModal = function (planName) {
            const form = modal.querySelector("#withus-trial-form");
            const success = modal.querySelector("#trial-success");
            if (form) form.classList.remove("hidden");
            if (success) success.classList.add("hidden");
            const titleEl = modal.querySelector("#modal-title");
            if (titleEl) {
                titleEl.innerText = planName ? `Get Started with WithUs (${planName})` : "Get Started with WithUs";
            }
            const btnText = modal.querySelector("#trial-submit-btn-text");
            if (btnText) btnText.innerText = "Start Free Trial";
            modal.classList.remove("hidden");
            modal.classList.add("flex");
            modal.style.display = "flex";
        };

        window.openTrialModal = window.openWithUsTrialModal;

        window.closeWithUsTrialModal = function () {
            modal.classList.add("hidden");
            modal.classList.remove("flex");
            modal.style.display = "none";
        };
        window.closeTrialModal = window.closeWithUsTrialModal;

        modal.querySelector("#close-modal-btn").onclick = window.closeWithUsTrialModal;
        const successBtn = modal.querySelector("#close-success-btn");
        if (successBtn) successBtn.onclick = window.closeWithUsTrialModal;

        modal.addEventListener("click", (e) => {
            if (e.target === modal) window.closeWithUsTrialModal();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !modal.classList.contains("hidden")) {
                window.closeWithUsTrialModal();
            }
        });

        const form = modal.querySelector("#withus-trial-form");
        form.onsubmit = async function (e) {
            e.preventDefault();
            const name = (modal.querySelector("#trial-name")?.value || "").trim();
            const email = (modal.querySelector("#trial-email")?.value || "").trim();
            const organization = (modal.querySelector("#trial-org")?.value || "").trim();
            const message = (modal.querySelector("#trial-message")?.value || "").trim();

            const btnText = modal.querySelector("#trial-submit-btn-text");
            const submitBtn = modal.querySelector("#trial-submit-btn");
            if (submitBtn?.disabled) return;
            if (submitBtn) submitBtn.disabled = true;
            if (btnText) btnText.innerText = "Submitting...";

            // Dispatch to the Resend contact endpoint; only show success if the email was accepted
            try {
                const response = await fetch("/api/contact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, organization, message })
                });
                if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(data.error || "Something went wrong. Please try again.");
                }
            } catch (err) {
                console.error("[WithUs] Failed to send lead:", err);
                alert(err.message && err.message !== "Failed to fetch" ? err.message : "Could not submit your request. Please try again.");
                if (btnText) btnText.innerText = "Start Free Trial";
                if (submitBtn) submitBtn.disabled = false;
                return;
            }

            if (submitBtn) submitBtn.disabled = false;
            form.classList.add("hidden");
            const successText = modal.querySelector("#trial-success-text");
            if (successText && organization) {
                successText.innerText = `Your request has been submitted for ${organization}. Check your inbox for your access confirmation.`;
            }
            modal.querySelector("#trial-success").classList.remove("hidden");
        };
    }

    
    // Platforms & Available Modules Restrictions Data (Exact Client Specifications)
    const WITHUS_PLATFORMS_DATA = [
        {
            name: "GitHub", about: "Code & collaboration",
            icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`,
            modules: ["Actions", "Repository Projects", "Security & Quality", "Wiki", "Insights", "Repository Settings", "Organization Members (People)", "Organization Projects"]
        },
        {
            name: "Vercel", about: "Hosting & deployments",
            icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5L23 21.5H1L12 2.5Z"/></svg>`,
            modules: ["Domains", "Analytics", "Environment Variables", "Storage", "Integrations", "Settings"]
        },
        {
            name: "GoDaddy", about: "Domains, website & email",
            icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.01 2C6.49 2 2 6.49 2 12.01c0 4.7 3.25 8.65 7.64 9.72-.08-.43-.13-.88-.13-1.34 0-1.89.92-3.56 2.34-4.6-2.58-.55-4.52-2.85-4.52-5.61 0-3.15 2.56-5.71 5.71-5.71s5.71 2.56 5.71 5.71c0 2.76-1.94 5.06-4.52 5.61 1.42 1.04 2.34 2.71 2.34 4.6 0 .46-.05.91-.13 1.34 4.39-1.07 7.64-5.02 7.64-9.72C22.08 6.49 17.56 2 12.01 2z"/></svg>`,
            modules: ["Domain", "Website", "Email", "Store", "Appointments", "Marketing", "Conversations", "Customers", "Deals", "Users", "App Switcher", "My Products", "Account Settings", "Renewals & Billing", "Shop GoDaddy.com"]
        },
        {
            name: "Shopify", about: "E-commerce store",
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M5 7h14l-1.2 13.2a1 1 0 01-1 .8H7.2a1 1 0 01-1-.8L5 7z"/><path d="M9 10V6a3 3 0 016 0v4"/></svg>`,
            modules: ["Orders", "Products", "Customers", "Growth", "Discounts", "Content", "Markets", "Analytics", "Sales Channels", "Apps", "Settings"]
        },
        {
            name: "Stripe", about: "Payments",
            icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697.2 12.833.2 7.377.2 3.514 3.056 3.514 7.634c0 6.048 6.223 6.945 8.948 8.01 2.378.932 3.25 1.638 3.25 2.637 0 .979-.894 1.513-2.375 1.513-2.337 0-5.189-1.042-7.237-2.213l-.914 5.655c2.055 1.143 5.372 1.964 8.784 1.964 5.674 0 9.769-2.738 9.769-7.587 0-6.173-6.126-7.143-9.763-8.463z"/></svg>`,
            modules: ["Payments", "Customers", "Products", "Billing", "Balance", "Reports", "Developers"]
        },
        {
            name: "Razorpay", about: "Payments",
            icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.4 7.4 9 12.6l6.3-4.1L11.4 23h3.5L20.6 1.5z"/><path d="M6.1 16.3 3.4 23h3.4l2.9-10.8z"/></svg>`,
            modules: ["Transactions", "Settlements", "Reports", "Payment Links", "Payment Pages", "Invoices", "Payment Button", "Subscriptions", "Smart Collect", "Optimizer", "Account & Settings"]
        },
        {
            name: "LinkedIn", about: "Professional network",
            icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.01 5 2.5 2.5 0 01.01-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.2c0-1.24-.02-2.84-1.73-2.84-1.73 0-2 1.35-2 2.75V21h-4z"/></svg>`,
            modules: ["My Network", "Jobs", "Messaging", "Notifications"]
        },
        {
            name: "Gmail", about: "Email & communication",
            icon: `<svg viewBox="0 0 512 512" fill="none"><path d="M34.91 448.818h81.454V251L0 163.727V413.91c0 19.287 15.622 34.91 34.91 34.91z" fill="#4285F4"/><path d="M395.636 448.818h81.455c19.287 0 34.909-15.622 34.909-34.909V163.727L395.636 251z" fill="#34A853"/><path d="M395.636 99.727V251L512 163.727v-46.545c0-43.142-49.25-67.782-83.782-41.891z" fill="#FBBC05"/><path d="M116.364 251V99.727L256 204.455 395.636 99.727V251L256 355.727z" fill="#EA4335"/><path d="M0 117.182v46.545L116.364 251V99.727L83.782 75.291C49.25 49.4 0 74.04 0 117.18z" fill="#C5221F"/></svg>`,
            modules: ["Inbox", "Starred", "Sent Mail", "Drafts", "Compose", "Purchases", "Important", "Spam", "Trash", "Settings", "Contacts"]
        },
        {
            name: "MCA Portal", about: "Ministry of Corporate Affairs", icon: "MCA",
            modules: ["Master Data", "LLP e-Filing", "FO LLP Services", "DSC Services", "Company e-Filing", "Complaints", "Document Related Services", "Payment Services (Fees & Payments)", "ID Databank"]
        },
        {
            name: "GST Portal", about: "Goods & Services Tax", icon: "GST",
            modules: ["Registration", "Ledgers", "Returns", "Payments", "Refunds"]
        },
        {
            name: "Udyam Portal", about: "MSME registration", icon: "UDY",
            modules: ["Cancellation", "Print Certificate", "Edit Details"]
        },
        {
            name: "Income Tax Portal", about: "Direct Taxes & Returns", icon: "ITR",
            modules: ["e-File", "Authorised Partners", "Services", "AIS", "Pending Actions", "Grievances", "Help"]
        }
    ];

    // Modules that get switched off in the auto-playing demo, to show what restricting looks like
    const WG_DEMO_LOCKS = {
        "GitHub": ["Repository Settings", "Organization Members (People)"],
        "Vercel": ["Environment Variables", "Settings"],
        "GoDaddy": ["Account Settings", "Renewals & Billing"],
        "Shopify": ["Settings"],
        "Stripe": ["Balance"],
        "Razorpay": ["Settlements", "Account & Settings"],
        "LinkedIn": ["Messaging"],
        "Gmail": ["Compose", "Settings"],
        "MCA Portal": ["Payment Services (Fees & Payments)"],
        "GST Portal": ["Payments"],
        "Udyam Portal": ["Cancellation"],
        "Income Tax Portal": ["e-File", "Pending Actions"]
    };

    // Brand tile colours: [background, glyph]
    const WG_BRAND = {
        "GitHub": ["#24292f", "#ffffff"],
        "Vercel": ["#000000", "#ffffff"],
        "GoDaddy": ["#111111", "#1bdbdb"],
        "Shopify": ["#95bf47", "#ffffff"],
        "Stripe": ["#635bff", "#ffffff"],
        "Razorpay": ["#0b1f4b", "#3395ff"],
        "LinkedIn": ["#0a66c2", "#ffffff"],
        "Gmail": ["#ffffff", "#ea4335"],
        "MCA Portal": ["#f4f4f5", "#1e3a8a"],
        "GST Portal": ["#1f2937", "#ffffff"],
        "Udyam Portal": ["#1f2937", "#ffffff"],
        "Income Tax Portal": ["#1e3a8a", "#ffffff"]
    };

    const wgSvg = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${extra}>${d}</svg>`;
    const WG_GLYPHS = {
        settings: wgSvg(`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>`),
        money: wgSvg(`<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>`),
        chart: wgSvg(`<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>`),
        users: wgSvg(`<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M21.5 20a6.5 6.5 0 00-4-6"/>`),
        shield: wgSvg(`<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>`),
        chat: wgSvg(`<path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/>`),
        mail: wgSvg(`<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>`),
        bell: wgSvg(`<path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/>`),
        bag: wgSvg(`<path d="M5 7h14l-1.2 13.2a1 1 0 01-1 .8H7.2a1 1 0 01-1-.8L5 7z"/><path d="M9 10V6a3 3 0 016 0v4"/>`),
        globe: wgSvg(`<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>`),
        doc: wgSvg(`<path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>`),
        code: wgSvg(`<path d="M8 8l-5 4 5 4M16 8l5 4-5 4M14 4l-4 16"/>`),
        play: wgSvg(`<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z"/>`),
        board: wgSvg(`<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 9h3M8 13h8M8 17h5"/>`),
        calendar: wgSvg(`<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>`),
        tag: wgSvg(`<path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>`),
        link: wgSvg(`<path d="M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/>`),
        grid: wgSvg(`<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>`),
        briefcase: wgSvg(`<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18"/>`),
        book: wgSvg(`<path d="M2 5a2 2 0 012-2h6a2 2 0 012 2v16a2 2 0 00-2-2H2zM22 5a2 2 0 00-2-2h-6a2 2 0 00-2 2v16a2 2 0 012-2h6z"/>`),
        key: wgSvg(`<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>`),
        x: wgSvg(`<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>`),
        edit: wgSvg(`<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>`),
        print: wgSvg(`<path d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="7"/>`),
        cube: wgSvg(`<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>`),
        lock: wgSvg(`<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4M12 15v2"/>`),
        sliders: wgSvg(`<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>`)
    };

    // Highlights below the console
    const WG_STRIP = [
        { icon: "users", title: `Works across ${WITHUS_PLATFORMS_DATA.length} platforms`, text: "Manage everything from one place." },
        { icon: "sliders", title: "Granular control", text: "Give only the access your team needs." },
        { icon: "doc", title: "Complete audit trail", text: "See who accessed what, and when." }
    ];

    // Pick a line icon from the module's name
    const WG_ICON_RULES = [
        [/cancel/i, "x"], [/print/i, "print"], [/edit/i, "edit"],
        [/setting|switcher|service/i, "settings"],
        [/billing|payment|balance|settlement|renewal|fees|invoice|ledger|refund|transaction|smart collect/i, "money"],
        [/analytic|insight|report|growth|optimizer/i, "chart"],
        [/member|people|customer|users|network|deals|partner/i, "users"],
        [/security|dsc|compliance/i, "shield"],
        [/messag|conversation|complaint|grievance|help/i, "chat"], [/email|inbox|starred|sent|draft/i, "mail"], [/compose/i, "edit"], [/contact/i, "users"], [/notification/i, "bell"],
        [/order|product|store|shop|sales/i, "bag"],
        [/domain|website|market|channel/i, "globe"],
        [/wiki|content/i, "book"],
        [/document|filing|return|registration|master data|certificate|llp|ais|file/i, "doc"],
        [/developer|integration|apps|environment/i, "code"],
        [/action/i, "play"], [/project/i, "board"], [/appointment|subscription/i, "calendar"],
        [/discount|button/i, "tag"], [/link|page/i, "link"], [/storage|databank/i, "grid"],
        [/job|marketing/i, "briefcase"], [/key/i, "key"]
    ];
    function wgModuleIcon(name) {
        const rule = WG_ICON_RULES.find(([re]) => re.test(name));
        return WG_GLYPHS[rule ? rule[1] : "cube"];
    }

    function wgTile(p, cls = "wg-tile") {
        const [bg, fg] = WG_BRAND[p.name] || ["#1f2937", "#ffffff"];
        return `<span class="${cls}" style="--tile-bg: ${bg}; --tile-fg: ${fg};" aria-hidden="true">${p.icon}</span>`;
    }

    function getPlatformsAndModulesHTML() {
        const totalModules = WITHUS_PLATFORMS_DATA.reduce((sum, p) => sum + p.modules.length, 0);

        const rail = WITHUS_PLATFORMS_DATA.map((p, i) => `
                            <button type="button" role="tab" class="wg-plat" data-wg-plat="${i}" aria-selected="${i === 0}">
                                ${wgTile(p)}
                                <span class="wg-plat-name">${p.name}</span>
                                <span class="wg-plat-count">${p.modules.length}</span>
                                <span class="wg-progress" aria-hidden="true"></span>
                            </button>`).join("");

        return `
        <section id="platform-guardrails" data-withus-guardrails="true" aria-labelledby="wg-title">
            <div class="wg-inner">
                <div class="wg-head">
                    <div class="pricing-fade-up pricing-delay-1">
                        <p class="wg-eyebrow">Platform access control</p>
                        <h2 id="wg-title" class="wg-title">Restrict access down to the module. <span>On every platform you use.</span></h2>
                    </div>
                    <div class="wg-sub pricing-fade-up pricing-delay-2">
                        <div>
                            <p class="wg-lead">Connect a platform once, then choose exactly which modules each teammate can access. Everything you don't allow stays locked, and no one ever sees your password or OTP.</p>
                            <div class="wg-btns">
                                <button type="button" class="wg-btn primary withus-trial-trigger-btn">
                                    Start free trial
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                                </button>
                                <button type="button" class="wg-btn" data-wg="see">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z"/></svg>
                                    See it in action
                                </button>
                            </div>
                        </div>
                        <div class="wg-figures">
                            <div class="wg-figure"><b data-wg-countup="${WITHUS_PLATFORMS_DATA.length}">${WITHUS_PLATFORMS_DATA.length}</b><span>Platforms supported</span></div>
                            <div class="wg-figure"><b data-wg-countup="${totalModules}">${totalModules}</b><span>Controllable modules</span></div>
                        </div>
                    </div>
                </div>

                <div class="wg-stage">
                <div class="wg-console wg-auto pricing-fade-up pricing-delay-3">
                    <nav class="wg-rail" aria-label="Platforms">
                        <div class="wg-rail-label">Platforms</div>
                        <div class="wg-rail-list" role="tablist">${rail}
                        </div>
                        <button type="button" class="wg-connect withus-trial-trigger-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                            Connect platform
                        </button>
                    </nav>

                    <div class="wg-detail">
                        <div class="wg-detail-top">
                            <div class="wg-detail-id wg-swap" data-wg="id"></div>
                            <div class="wg-actions">
                                <span class="wg-status"><i></i>Connected</span>
                                <button type="button" class="wg-save" data-wg="save">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>
                                    <span>Save changes</span>
                                </button>
                            </div>
                        </div>

                        <div class="wg-tabs" role="tablist">
                            <button type="button" role="tab" class="wg-tab" data-wg-tab="modules" aria-selected="true">Modules &amp; Permissions</button>
                            <button type="button" role="tab" class="wg-tab" data-wg-tab="activity" aria-selected="false">Access Logs<span class="wg-tab-badge" data-wg="log-count" hidden>0</span></button>
                        </div>

                        <div class="wg-panel" data-wg-panel="modules" role="tabpanel">
                            <div class="wg-info">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>
                                <span data-wg="info"></span>
                            </div>
                            <div class="wg-summary">
                                <b><span data-wg="total"></span> modules configured</b>
                                <div class="wg-legend">
                                    <span class="allow"><i></i><em data-wg="allowed"></em></span>
                                    <span class="sep"></span>
                                    <span class="lock"><i></i><em data-wg="restricted"></em></span>
                                    <span class="sep"></span>
                                    <button type="button" class="wg-all" data-wg="all" aria-pressed="true"><span class="wg-check" aria-hidden="true"></span>Select all</button>
                                </div>
                            </div>
                            <div class="wg-mods" data-wg="mods"></div>
                            <p class="wg-more" data-wg="more">&nbsp;</p>
                        </div>

                        <div class="wg-panel" data-wg-panel="activity" role="tabpanel" hidden>
                            <ul class="wg-log" data-wg="log"></ul>
                            <p class="wg-log-empty" data-wg="log-empty">Switch a module on or off and every change shows up here, so you always know who can access what.</p>
                        </div>

                        <div class="wg-foot">
                            <div class="wg-foot-note">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg>
                                <span><b>Tap any module to switch it.</b> No credentials are ever shared.</span>
                            </div>
                            <button type="button" class="wg-cta withus-trial-trigger-btn">
                                Request a demo
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
                </div>

                <!-- Hidden per UI request: Platform highlights strip (Works across platforms, Granular control, Audit trail) -->
                <!--
                <div class="wg-strip pricing-fade-up pricing-delay-4">
                    ${WG_STRIP.map(k => `<div class="wg-strip-item"><span class="wg-perk-ic">${WG_GLYPHS[k.icon]}</span><div><b>${k.title}</b><small>${k.text}</small></div></div>`).join("")}
                </div>
                -->
            </div>
        </section>
        `;
    }

    // Interactive Controller for Platform & Module Restrictions
    function initPlatformGuardrailsInteractions(container) {
        if (!container || container.dataset.withusGuardrailsBound === "true") return;
        container.dataset.withusGuardrailsBound = "true";

        const consoleEl = container.querySelector(".wg-console");
        const el = name => container.querySelector(`[data-wg="${name}"]`);
        const plats = container.querySelectorAll("[data-wg-plat]");
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let current = 0;
        let demoTimers = [];
        let saveTimer = null;
        let logCount = 0;

        // Fade the bottom edge while more modules are hidden below the scroll window
        function updateOverflow() {
            const mods = el("mods");
            const hiddenBelow = mods.scrollHeight - mods.clientHeight - mods.scrollTop > 4;
            mods.classList.toggle("is-more", hiddenBelow);
            const more = el("more");
            // visibility (not display) keeps the line's height reserved, so the panel height stays constant
            more.style.visibility = mods.scrollHeight <= mods.clientHeight + 4 ? "hidden" : "visible";
            more.textContent = hiddenBelow ? "Scroll for more modules" : "All modules shown";
        }
        el("mods").addEventListener("scroll", updateOverflow, { passive: true });

        function updateCounts() {
            const total = el("mods").querySelectorAll(".wg-mod").length;
            const allowed = el("mods").querySelectorAll('.wg-mod[aria-checked="true"]').length;
            el("total").textContent = total;
            el("allowed").textContent = `Allowed (${allowed})`;
            el("restricted").textContent = `Restricted (${total - allowed})`;
            el("all").setAttribute("aria-pressed", String(allowed === total));
        }

        function addLog(text, allowed) {
            const li = document.createElement("li");
            li.innerHTML = `<i style="background: ${allowed ? "var(--wg-allow)" : "var(--wg-lock)"}"></i><span></span><span class="t">just now</span>`;
            li.children[1].textContent = text;
            el("log").prepend(li);
            while (el("log").children.length > 8) el("log").lastElementChild.remove();
            el("log-empty").hidden = true;
            logCount++;
            const badge = el("log-count");
            badge.textContent = logCount;
            badge.hidden = false;
        }

        function setModule(btn, allowed, fromUser) {
            btn.setAttribute("aria-checked", String(allowed));
            updateCounts();
            if (fromUser) {
                const name = btn.querySelector(".wg-mod-text b").textContent;
                addLog(`${name} on ${WITHUS_PLATFORMS_DATA[current].name} ${allowed ? "allowed" : "restricted"} for teammate`, allowed);
            }
        }

        function setTab(tab) {
            container.querySelectorAll("[data-wg-tab]").forEach(t => t.setAttribute("aria-selected", String(t.dataset.wgTab === tab)));
            container.querySelectorAll("[data-wg-panel]").forEach(p => { p.hidden = p.dataset.wgPanel !== tab; });
        }

        function render(index) {
            const p = WITHUS_PLATFORMS_DATA[index];
            current = index;
            demoTimers.forEach(clearTimeout);
            demoTimers = [];

            plats.forEach(b => b.setAttribute("aria-selected", String(Number(b.dataset.wgPlat) === index)));

            const id = el("id");
            id.innerHTML = `${wgTile(p)}<div><h3>${p.name}</h3><p>${p.about}</p></div>`;
            id.classList.remove("wg-swap"); void id.offsetWidth; id.classList.add("wg-swap");
            el("info").textContent = `Choose which ${p.name} modules your teammate can access. Restricted modules stay locked for them.`;

            el("mods").innerHTML = p.modules.map((m, i) => `
                <button type="button" role="switch" class="wg-mod" aria-checked="true" style="animation-delay: ${Math.min(i, 14) * 30}ms">
                    <span class="wg-mod-ic" aria-hidden="true">${wgModuleIcon(m)}</span>
                    <span class="wg-mod-text"><b>${m}</b><small class="on">Access allowed</small><small class="off">Access restricted</small></span>
                    <span class="wg-switch" aria-hidden="true"></span>
                </button>`).join("");
            el("mods").scrollTop = 0;
            updateCounts();
            updateOverflow();

            // While auto-playing, switch a couple of sensitive modules off to show restriction in action
            if (consoleEl.classList.contains("wg-auto") && !reduceMotion) {
                const btns = [...el("mods").querySelectorAll(".wg-mod")];
                (WG_DEMO_LOCKS[p.name] || []).forEach((name, i) => {
                    const btn = btns.find(b => b.querySelector(".wg-mod-text b").textContent === name);
                    if (btn) demoTimers.push(setTimeout(() => {
                        // Bring the module into the scroll window (without moving the page) before switching it
                        const mods = el("mods");
                        if (btn.offsetTop + btn.offsetHeight > mods.scrollTop + mods.clientHeight) {
                            mods.scrollTo({ top: btn.offsetTop - 10, behavior: "smooth" });
                        }
                        setModule(btn, false, false);
                    }, 1300 + i * 900));
                });
            }
        }

        function stopAuto() {
            consoleEl.classList.remove("wg-auto");
            demoTimers.forEach(clearTimeout);
        }

        plats.forEach(b => {
            b.onclick = function (e) {
                e.preventDefault();
                stopAuto();
                setTab("modules");
                render(Number(b.dataset.wgPlat));
            };
            // Auto-advance when the active platform's progress bar fills
            b.querySelector(".wg-progress").addEventListener("animationend", () => {
                if (consoleEl.classList.contains("wg-auto")) render((current + 1) % WITHUS_PLATFORMS_DATA.length);
            });
        });

        el("mods").addEventListener("click", e => {
            const btn = e.target.closest(".wg-mod");
            if (!btn) return;
            e.preventDefault();
            stopAuto();
            setModule(btn, btn.getAttribute("aria-checked") !== "true", true);
        });

        container.querySelectorAll("[data-wg-tab]").forEach(t => {
            t.onclick = function (e) {
                e.preventDefault();
                stopAuto();
                setTab(t.dataset.wgTab);
            };
        });

        // Select all: allow every module, or restrict every module when all are already allowed
        el("all").onclick = function (e) {
            e.preventDefault();
            stopAuto();
            const allowAll = el("all").getAttribute("aria-pressed") !== "true";
            el("mods").querySelectorAll(".wg-mod").forEach(btn => btn.setAttribute("aria-checked", String(allowAll)));
            updateCounts();
            addLog(`All ${WITHUS_PLATFORMS_DATA[current].name} modules ${allowAll ? "allowed" : "restricted"} for teammate`, allowAll);
        };

        el("see").onclick = function (e) {
            e.preventDefault();
            const root = document.getElementById("new-landing-scroll-root");
            const top = consoleEl.getBoundingClientRect().top - 40;
            if (root) root.scrollBy({ top, behavior: "smooth" });
            else window.scrollBy({ top, behavior: "smooth" });
        };

        el("save").onclick = function (e) {
            e.preventDefault();
            stopAuto();
            const btn = el("save");
            btn.classList.add("is-saved");
            btn.querySelector("span").textContent = "Saved";
            addLog(`Permissions saved for ${WITHUS_PLATFORMS_DATA[current].name}`, true);
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => {
                btn.classList.remove("is-saved");
                btn.querySelector("span").textContent = "Save changes";
            }, 1800);
        };

        container.querySelectorAll(".withus-trial-trigger-btn").forEach(btn => {
            btn.onclick = function (e) {
                e.preventDefault();
                if (window.openWithUsTrialModal) window.openWithUsTrialModal("Platform Governance");
            };
        });

        if (reduceMotion) stopAuto();

        // Count up the headline figures once they scroll into view
        function countUp(node) {
            const target = Number(node.dataset.wgCountup);
            if (reduceMotion) return;
            const start = performance.now();
            const tick = now => {
                const t = Math.min((now - start) / 1200, 1);
                node.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
                if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }

        // Same scroll-triggered entrance as the pricing section
        const root = document.getElementById("new-landing-scroll-root") || null;
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("in-view");
                entry.target.querySelectorAll("[data-wg-countup]").forEach(countUp);
                observer.unobserve(entry.target);
            });
        }, { root, threshold: 0.1 });
        container.querySelectorAll(".pricing-fade-up").forEach(node => {
            observer.observe(node);
            node.addEventListener("transitionend", e => {
                if (e.target === node && node.classList.contains("in-view")) node.classList.add("pricing-settled");
            });
        });

        // Only run the auto-play while the console is actually on screen
        let seen = false;
        new IntersectionObserver(entries => {
            entries.forEach(entry => {
                consoleEl.classList.toggle("wg-visible", entry.isIntersecting);
                // Replay the first platform so its demo runs where people can see it
                if (entry.isIntersecting && !seen) {
                    seen = true;
                    if (consoleEl.classList.contains("wg-auto")) render(current);
                }
            });
        }, { root, threshold: 0.35 }).observe(consoleEl);

        render(0);
    }

    // 3. Exact Pricing Section HTML from newly added Next.js pricing page (branded for WithUs)
    function getExactWithUsPricingHTML() {
        return `<div id="pricing" class="relative w-full overflow-hidden" data-exact-withus-pricing="true">
<div class="relative min-h-screen flex flex-col justify-center"><div class="absolute inset-0 overflow-hidden"><img alt="New Pricing" loading="lazy" width="1440" height="900" decoding="async" data-nimg="1" class="bg-[#456ba9] blur absolute -inset-8 h-[calc(100%+64px)] w-[calc(100%+64px)] max-h-none max-w-none object-cover pointer-events-none select-none" style="color:transparent" srcset="/_landing/_next/pricing-bg-1.jpg 1x, /_landing/_next/pricing-bg.jpg 2x" src="/_landing/_next/pricing-bg.jpg"></div><div class="relative pt-20 flex flex-col items-center text-center"><h2 class="heading-2xl mt-3 text-5xl font-medium tracking-[-0.5%] text-white pricing-fade-up pricing-delay-1">The world&#x27;s most intelligent coworker. Yours, 24/7.</h2><p class="body-lg mt-5 max-w-4xl px-4 font-geist text-xl tracking-[-1%] text-white/70 md:px-0 md:text-2xl pricing-fade-up pricing-delay-2">Reads your apps, drafts your replies, preps your day, around the clock.</p></div><div class="relative pb-20 pt-10 flex gap-4 snap-x snap-mandatory overflow-x-auto overflow-y-visible px-4 lg:px-0 lg:justify-center lg:overflow-visible hide-scrollbar"><div class="rounded-[32px] frost-border duration-200 backdrop-blur-sm border-transparent flex flex-col bg-white/10 p-6 w-[330px] shrink-0 snap-center transition-none max-lg:shadow-none pricing-fade-up pricing-delay-3" style="--borderWidth:1;--background:linear-gradient(
              to bottom right, 
              rgba(255 255 255 / 0.65) 0%, 
              rgba(255 255 255 / 0.1) 42%, 
              rgba(255 255 255 / 0.1) 62%, 
              rgba(255 255 255 / 0.65) 100%
            );background-origin:border-box;border-width:1px;" ><div class="flex flex-col"><div class="flex items-start justify-between"><h3 class="heading-md text-3xl font-medium">Free</h3><div class="text-right"><p class="heading-md text-2xl font-medium text-white/90"><span class="mr-1.5 text-base font-light line-through invisible">₹<!-- -->0</span>₹<!-- -->0</p></div></div><p class="mt-0.5 text-right text-xs font-light text-white/50"> </p></div><p class="body-lg mt-2">Give your team secure access to business portals without sharing passwords. Everything you need to get started with delegated access.</p><button type="button" data-disabled="false" data-loading="false" class="frost-border relative isolate select-none text-[15px] default-ring rounded-full px-4 py-2 inline-flex justify-center items-center gap-2 transition duration-200 disabled:cursor-not-allowed disabled:before:opacity-0 disabled:brightness-[0.8] light:disabled:brightness-[0.95] light:disabled:saturate-[0.7] data-[loading=true]:cursor-wait data-[loading=true]:brightness-90 data-[loading=true]:text-transparent [&amp;[data-loading=true]_*]:invisible [&amp;[data-loading=true]_.dont-hide-on-loading_*]:visible backdrop-blur-sm bg-gradient-to-b from-[#FFFFFF]/80 to-[#eeeeee]/100 focus-visible:ring-purple-400 focus-visible:ring-offset-0 [--frost-border-strength:3] [--frost-strength:0.8] text-black disabled:text-black/60 after:content-[&#x27;&#x27;] after:absolute after:inset-0 after:bg-white/[0.075] after:pointer-events-none after:z-[0] after:rounded-[inherit] after:opacity-0 after:transition-opacity after:duration-200 hover:enabled:after:opacity-50 enabled:active:after:opacity-0 light:hover:enabled:after:opacity-100 light:enabled:active:after:opacity-0 shadow-[0px_0px_7px_1px_rgba(255,255,255,calc(0.13*var(--frost-strength)))_inset] hover:enabled:shadow-[0px_0px_8px_1px_rgba(255,255,255,calc(0.22*var(--frost-strength)))_inset] active:enabled:shadow-[0px_0px_7px_1px_rgba(255,255,255,calc(0.13*var(--frost-strength)))_inset] light:shadow-[0px_0px_7px_1px_rgba(255,255,255,calc(0.2*var(--frost-strength)))_inset,0px_0px_0px_1px_rgba(0,0,0,0.1),0px_18px_11px_0px_rgba(0,0,0,0.01),0px_8px_8px_0px_rgba(0,0,0,0.01),0px_2px_4px_0px_rgba(0,0,0,0.02)] light:enabled:hover:shadow-[0px_0px_8px_1px_rgba(255,255,255,calc(0.35*var(--frost-strength)))_inset,0px_0px_0px_1px_rgba(0,0,0,0.1),0px_18px_11px_0px_rgba(0,0,0,0.01),0px_8px_8px_0px_rgba(0,0,0,0.01),0px_2px_4px_0px_rgba(0,0,0,0.02)] light:enabled:active:shadow-[0px_0px_7px_1px_rgba(255,255,255,calc(0.2*var(--frost-strength)))_inset,0px_0px_0px_1px_rgba(0,0,0,0.1),0px_18px_11px_0px_rgba(0,0,0,0.01),0px_8px_8px_0px_rgba(0,0,0,0.01),0px_2px_4px_0px_rgba(0,0,0,0.02)] before:transition-opacity before:duration-200 before:opacity-[calc(0.25*var(--frost-border-strength))] enabled:hover:before:opacity-[calc(0.35*var(--frost-border-strength))] enabled:active:before:opacity-[calc(0.25*var(--frost-border-strength))] light:before:opacity-[calc(0.3*var(--frost-border-strength))] light:enabled:hover:before:opacity-[calc(0.4*var(--frost-border-strength))] light:enabled:active:before:opacity-[calc(0.3*var(--frost-border-strength))] mt-4" style="--borderWidth:0.5;--background:linear-gradient(to bottom right, rgba(255 255 255 / 1) 0%, rgba(255 255 255 / 0.25) 42%, rgba(255 255 255 / 0.25) 62%, rgba(255 255 255 / 1) 100%);border:0.5px solid transparent;background-origin:border-box"><div class="dont-hide-on-loading pointer-events-none select-none absolute inset-0 overflow-hidden rounded-[inherit] before:content-[&#x27;&#x27;] before:opacity-0 before:transition-opacity before:duration-200 group-hover/frost-box:before:opacity-50 before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.01)_0%,rgba(255,255,255,0)_50%)] light:before:hidden"></div><span class="inline-flex items-center gap-1 text-gray-700 dont-hide-on-loading absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[1em] opacity-0"><span class="inline-block size-[0.55em] animate-beatspin rounded-full bg-current fill-mode-both"></span><span class="inline-block size-[0.65em] animate-beatspin-center rounded-full bg-current fill-mode-both"></span><span class="inline-block size-[0.55em] animate-beatspin rounded-full bg-current fill-mode-both"></span></span>Get Started<!-- --> <svg width="18" height="18" viewbox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M0.587891 5.84207V4.55407H8.39989L4.49389 0.914067L5.37589 0.0180664L10.3879 4.79207V5.56207L5.37589 10.3501L4.49389 9.45407L8.37189 5.84207H0.587891Z" fill="currentColor"></path></svg></button><div data-orientation="horizontal" role="none" class="shrink-0 h-[0.5px] w-full my-6 bg-white/30"></div><p class="body-sm text-sm text-white/70">Essential access delegation for small teams.</p><ul class="ml-1 mt-2 space-y-2 text-white"><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rfr0wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>2 users included</span></li><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rfr1wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>Any 2 of 12 supported platforms</span></li><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rfr2wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>1 admin seat</span></li><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rfr3wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>Delegated access, zero password sharing</span></li><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rfr4wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>Basic audit history</span></li><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rfr5wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>Switch platforms every 15 days</span></li></ul></div><div class="rounded-[32px] frost-border duration-200 backdrop-blur-sm border-transparent bg-[#fff]/[0.08] flex flex-col p-6 bg-gradient-to-b from-white to-white/50 w-[330px] shrink-0 snap-center transition-none max-lg:shadow-none pricing-fade-up pricing-delay-4 withus-premium-card" style="--borderWidth:1;--background:linear-gradient(
              to bottom right, 
              rgba(255 255 255 / 0.65) 0%, 
              rgba(255 255 255 / 0.1) 42%, 
              rgba(255 255 255 / 0.1) 62%, 
              rgba(255 255 255 / 0.65) 100%
            );background-origin:border-box;border-width:1px;" ><button type="button" class="frost-border isolate select-none text-[15px] default-ring rounded-full px-4 py-2 inline-flex justify-center items-center gap-2 transition duration-200 disabled:cursor-not-allowed disabled:before:opacity-0 disabled:brightness-[0.8] disabled:text-[#e0e0e0] light:disabled:brightness-[0.95] light:disabled:saturate-[0.7] data-[loading=true]:cursor-wait data-[loading=true]:brightness-90 data-[loading=true]:text-transparent [&amp;[data-loading=true]_*]:invisible [&amp;[data-loading=true]_.dont-hide-on-loading_*]:visible backdrop-blur-sm bg-gradient-to-b from-[#000000]/80 to-[#000000]/100 focus-visible:ring-purple-400 focus-visible:ring-offset-0 [--frost-border-strength:1] [--frost-strength:0.8] text-white after:content-[&#x27;&#x27;] after:absolute after:inset-0 after:bg-white/[0.075] after:pointer-events-none after:z-[0] after:rounded-[inherit] after:opacity-0 after:transition-opacity after:duration-200 hover:enabled:after:opacity-50 enabled:active:after:opacity-0 light:hover:enabled:after:opacity-100 light:enabled:active:after:opacity-0 shadow-[0px_0px_7px_1px_rgba(255,255,255,calc(0.13*var(--frost-strength)))_inset] hover:enabled:shadow-[0px_0px_8px_1px_rgba(255,255,255,calc(0.22*var(--frost-strength)))_inset] active:enabled:shadow-[0px_0px_7px_1px_rgba(255,255,255,calc(0.13*var(--frost-strength)))_inset] light:shadow-[0px_0px_7px_1px_rgba(255,255,255,calc(0.2*var(--frost-strength)))_inset,0px_0px_0px_1px_rgba(0,0,0,0.1),0px_18px_11px_0px_rgba(0,0,0,0.01),0px_8px_8px_0px_rgba(0,0,0,0.01),0px_2px_4px_0px_rgba(0,0,0,0.02)] light:enabled:hover:shadow-[0px_0px_8px_1px_rgba(255,255,255,calc(0.35*var(--frost-strength)))_inset,0px_0px_0px_1px_rgba(0,0,0,0.1),0px_18px_11px_0px_rgba(0,0,0,0.01),0px_8px_8px_0px_rgba(0,0,0,0.01),0px_2px_4px_0px_rgba(0,0,0,0.02)] light:enabled:active:shadow-[0px_0px_7px_1px_rgba(255,255,255,calc(0.2*var(--frost-strength)))_inset,0px_0px_0px_1px_rgba(0,0,0,0.1),0px_18px_11px_0px_rgba(0,0,0,0.01),0px_8px_8px_0px_rgba(0,0,0,0.01),0px_2px_4px_0px_rgba(0,0,0,0.02)] before:transition-opacity before:duration-200 before:opacity-[calc(0.25*var(--frost-border-strength))] enabled:hover:before:opacity-[calc(0.35*var(--frost-border-strength))] enabled:active:before:opacity-[calc(0.25*var(--frost-border-strength))] light:before:opacity-[calc(0.3*var(--frost-border-strength))] light:enabled:hover:before:opacity-[calc(0.4*var(--frost-border-strength))] light:enabled:active:before:opacity-[calc(0.3*var(--frost-border-strength))] absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2" style="--borderWidth:0.5;--background:linear-gradient(to bottom right, rgba(255 255 255 / 1) 0%, rgba(255 255 255 / 0.25) 42%, rgba(255 255 255 / 0.25) 62%, rgba(255 255 255 / 1) 100%);border:0.5px solid transparent;background-origin:border-box" inert=""><div class="dont-hide-on-loading pointer-events-none select-none absolute inset-0 overflow-hidden rounded-[inherit] before:content-[&#x27;&#x27;] before:opacity-0 before:transition-opacity before:duration-200 group-hover/frost-box:before:opacity-50 before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.01)_0%,rgba(255,255,255,0)_50%)] light:before:hidden"></div><svg width="14" height="14" viewbox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="size-3.5"><path d="M3.68866 1.93838L2.95288 1.69338L2.7071 0.95682C2.62777 0.71882 2.23343 0.71882 2.1541 0.95682L1.90832 1.69338L1.17255 1.93838C1.05355 1.97804 0.972656 2.08926 0.972656 2.21526C0.972656 2.34126 1.05355 2.45249 1.17255 2.49215L1.90832 2.73715L2.1541 3.47371C2.19377 3.59271 2.30499 3.67282 2.43021 3.67282C2.55543 3.67282 2.66743 3.59193 2.70632 3.47371L2.9521 2.73715L3.68788 2.49215C3.80688 2.45249 3.88777 2.34126 3.88777 2.21526C3.88777 2.08926 3.80766 1.97804 3.68866 1.93838Z" fill="currentColor"></path><path d="M7.0001 10.8609C7.0001 10.1896 7.42788 9.59698 8.06488 9.38542L8.49266 9.24231L8.63577 8.81375C8.84344 8.19309 9.4361 7.77775 10.1112 7.77775C10.3904 7.77775 10.6471 7.86331 10.8765 7.99009L13.0458 5.87609C13.2052 5.72131 13.262 5.48875 13.1935 5.27798C13.1251 5.0672 12.9423 4.9132 12.723 4.88131L9.12966 4.35942L7.52277 1.10287C7.32677 0.704644 6.67266 0.704644 6.47666 1.10287L4.86977 4.35864L1.27644 4.88053C1.0571 4.91242 0.874324 5.06642 0.80588 5.2772C0.737436 5.48798 0.794213 5.72053 0.953658 5.87531L3.55377 8.40931L2.93932 11.9879C2.90199 12.2072 2.99144 12.4281 3.1711 12.5588C3.35155 12.6886 3.58877 12.7065 3.78555 12.6031L6.99932 10.913L7.00866 10.9176C7.00866 10.8982 6.99932 10.8803 6.99932 10.8609H7.0001Z" fill="currentColor"></path><path d="M11.7897 10.4921L10.8073 10.1647L10.4799 9.18234C10.3733 8.865 9.84835 8.865 9.74179 9.18234L9.41435 10.1647L8.43202 10.4921C8.27335 10.545 8.16602 10.6936 8.16602 10.8608C8.16602 11.028 8.27335 11.1766 8.43202 11.2294L9.41435 11.5569L9.74179 12.5392C9.79468 12.6979 9.94402 12.8052 10.1112 12.8052C10.2785 12.8052 10.427 12.6979 10.4807 12.5392L10.8081 11.5569L11.7905 11.2294C11.9491 11.1766 12.0565 11.028 12.0565 10.8608C12.0565 10.6936 11.9491 10.545 11.7905 10.4921H11.7897Z" fill="currentColor"></path><path d="M11.0833 3.111C11.4055 3.111 11.6667 2.84984 11.6667 2.52767C11.6667 2.2055 11.4055 1.94434 11.0833 1.94434C10.7612 1.94434 10.5 2.2055 10.5 2.52767C10.5 2.84984 10.7612 3.111 11.0833 3.111Z" fill="currentColor"></path></svg><span class="text-sm font-medium text-white/80">Recommended</span></button><div class="flex flex-col"><div class="flex items-baseline justify-between"><h3 class="heading-md text-3xl font-medium text-black">Pro</h3><div class="text-right"><p class="heading-md text-2xl font-medium text-black/90"><span style="text-decoration:line-through;color:rgba(0,0,0,0.4);margin-right:6px;font-size:16px;font-weight:400;">₹999</span><span style="font-size:26px;font-weight:700;color:#000000;">₹499</span><span style="font-size:14px;color:rgba(0,0,0,0.5);font-weight:300;">/mo.</span></p></div></div><div class="flex items-center justify-between mt-1"><span style="display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:9999px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);color:#047857;font-size:10px;font-weight:700;letter-spacing:0.04em;"><span style="width:5px;height:5px;border-radius:9999px;background:#10b981;box-shadow:0 0 5px #10b981;"></span>50% OFF</span><p style="text-align:right;font-size:12px;color:rgba(0,0,0,0.5);font-weight:300;">or ₹4,990/year</p></div></div><p class="body-lg mt-2 text-black/90">Advanced automation for growing teams: automatic OTP retrieval, full audit trails and access to every supported platform.</p><button type="button" data-disabled="false" data-loading="false" class="frost-border relative isolate select-none text-[15px] default-ring rounded-full px-4 py-2 inline-flex justify-center items-center gap-2 transition duration-200 disabled:cursor-not-allowed disabled:before:opacity-0 disabled:brightness-[0.8] disabled:text-[#e0e0e0] light:disabled:brightness-[0.95] light:disabled:saturate-[0.7] data-[loading=true]:cursor-wait data-[loading=true]:brightness-90 data-[loading=true]:text-transparent [&amp;[data-loading=true]_*]:invisible [&amp;[data-loading=true]_.dont-hide-on-loading_*]:visible backdrop-blur-sm bg-gradient-to-b from-[#000000]/80 to-[#000000]/100 focus-visible:ring-purple-400 focus-visible:ring-offset-0 [--frost-border-strength:1] [--frost-strength:0.8] text-white after:content-[&#x27;&#x27;] after:absolute after:inset-0 after:bg-white/[0.075] after:pointer-events-none after:z-[0] after:rounded-[inherit] after:opacity-0 after:transition-opacity after:duration-200 hover:enabled:after:opacity-50 enabled:active:after:opacity-0 light:hover:enabled:after:opacity-100 light:enabled:active:after:opacity-0 shadow-[0px_0px_7px_1px_rgba(255,255,255,calc(0.13*var(--frost-strength)))_inset] hover:enabled:shadow-[0px_0px_8px_1px_rgba(255,255,255,calc(0.22*var(--frost-strength)))_inset] active:enabled:shadow-[0px_0px_7px_1px_rgba(255,255,255,calc(0.13*var(--frost-strength)))_inset] light:shadow-[0px_0px_7px_1px_rgba(255,255,255,calc(0.2*var(--frost-strength)))_inset,0px_0px_0px_1px_rgba(0,0,0,0.1),0px_18px_11px_0px_rgba(0,0,0,0.01),0px_8px_8px_0px_rgba(0,0,0,0.01),0px_2px_4px_0px_rgba(0,0,0,0.02)] light:enabled:hover:shadow-[0px_0px_8px_1px_rgba(255,255,255,calc(0.35*var(--frost-strength)))_inset,0px_0px_0px_1px_rgba(0,0,0,0.1),0px_18px_11px_0px_rgba(0,0,0,0.01),0px_8px_8px_0px_rgba(0,0,0,0.01),0px_2px_4px_0px_rgba(0,0,0,0.02)] light:enabled:active:shadow-[0px_0px_7px_1px_rgba(255,255,255,calc(0.2*var(--frost-strength)))_inset,0px_0px_0px_1px_rgba(0,0,0,0.1),0px_18px_11px_0px_rgba(0,0,0,0.01),0px_8px_8px_0px_rgba(0,0,0,0.01),0px_2px_4px_0px_rgba(0,0,0,0.02)] before:transition-opacity before:duration-200 before:opacity-[calc(0.25*var(--frost-border-strength))] enabled:hover:before:opacity-[calc(0.35*var(--frost-border-strength))] enabled:active:before:opacity-[calc(0.25*var(--frost-border-strength))] light:before:opacity-[calc(0.3*var(--frost-border-strength))] light:enabled:hover:before:opacity-[calc(0.4*var(--frost-border-strength))] light:enabled:active:before:opacity-[calc(0.3*var(--frost-border-strength))] mt-4" style="--borderWidth:0.5;--background:linear-gradient(to bottom right, rgba(255 255 255 / 1) 0%, rgba(255 255 255 / 0.25) 42%, rgba(255 255 255 / 0.25) 62%, rgba(255 255 255 / 1) 100%);border:0.5px solid transparent;background-origin:border-box"><div class="dont-hide-on-loading pointer-events-none select-none absolute inset-0 overflow-hidden rounded-[inherit] before:content-[&#x27;&#x27;] before:opacity-0 before:transition-opacity before:duration-200 group-hover/frost-box:before:opacity-50 before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.01)_0%,rgba(255,255,255,0)_50%)] light:before:hidden"></div><span class="inline-flex items-center gap-1 text-white dont-hide-on-loading absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[1em] opacity-0"><span class="inline-block size-[0.55em] animate-beatspin rounded-full bg-current fill-mode-both"></span><span class="inline-block size-[0.65em] animate-beatspin-center rounded-full bg-current fill-mode-both"></span><span class="inline-block size-[0.55em] animate-beatspin rounded-full bg-current fill-mode-both"></span></span>Go Pro<!-- --> <svg width="18" height="18" viewbox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M0.587891 5.84207V4.55407H8.39989L4.49389 0.914067L5.37589 0.0180664L10.3879 4.79207V5.56207L5.37589 10.3501L4.49389 9.45407L8.37189 5.84207H0.587891Z" fill="currentColor"></path></svg></button><div data-orientation="horizontal" role="none" class="shrink-0 h-[0.5px] w-full my-6 bg-black/30"></div><p class="body-sm text-sm text-black/70">Advanced automation &amp; scaling team access.</p><ul class="ml-1 mt-2 space-y-2 text-black/90"><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rpr0wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>5 users included</span></li><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rpr1wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>All 12 supported platforms</span></li><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rpr2wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>2 admin seats</span></li><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rpr3wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>Automated OTP retrieval (Gmail)</span></li><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rpr4wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>Full audit trail &amp; event logging</span></li><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rpr5wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>Platform integration health checks</span></li><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rpr6wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>Priority support</span></li><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rpr7wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>Extra users at ₹50/user/month</span></li></ul></div><div class="rounded-[32px] frost-border duration-200 backdrop-blur-sm border-transparent flex flex-col bg-white/10 p-6 w-[330px] shrink-0 snap-center transition-none max-lg:shadow-none pricing-fade-up pricing-delay-5" style="--borderWidth:1;--background:linear-gradient(
              to bottom right, 
              rgba(255 255 255 / 0.65) 0%, 
              rgba(255 255 255 / 0.1) 42%, 
              rgba(255 255 255 / 0.1) 62%, 
              rgba(255 255 255 / 0.65) 100%
            );background-origin:border-box;border-width:1px;" ><div class="flex flex-col"><div class="flex items-baseline justify-between"><h3 class="heading-md text-3xl font-medium text-white">Business</h3><div class="text-right"><p class="heading-md text-2xl font-medium text-white/90"><span style="text-decoration:line-through;color:rgba(255,255,255,0.4);margin-right:6px;font-size:16px;font-weight:400;">₹1,999</span><span style="font-size:26px;font-weight:700;color:#ffffff;">₹999</span><span style="font-size:14px;color:rgba(255,255,255,0.5);font-weight:300;">/mo.</span></p></div></div><div class="flex items-center justify-between mt-1"><span style="display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:9999px;background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.3);color:#6ee7b7;font-size:10px;font-weight:700;letter-spacing:0.04em;backdrop-filter:blur(8px);box-shadow:0 0 10px rgba(52,211,153,0.1);"><span style="width:5px;height:5px;border-radius:9999px;background:#34d399;box-shadow:0 0 6px #34d399;"></span>50% OFF</span><p style="text-align:right;font-size:12px;color:rgba(255,255,255,0.5);font-weight:300;">or ₹9,990/year</p></div></div><p class="body-lg mt-2">Complete control for organizations: module-based access, unlimited admins and priority operations across every platform.</p><button type="button" data-disabled="false" data-loading="false" class="frost-border relative isolate select-none text-[15px] default-ring rounded-full px-4 py-2 inline-flex justify-center items-center gap-2 transition duration-200 disabled:cursor-not-allowed disabled:before:opacity-0 disabled:brightness-[0.8] light:disabled:brightness-[0.95] light:disabled:saturate-[0.7] data-[loading=true]:cursor-wait data-[loading=true]:brightness-90 data-[loading=true]:text-transparent [&amp;[data-loading=true]_*]:invisible [&amp;[data-loading=true]_.dont-hide-on-loading_*]:visible backdrop-blur-sm bg-gradient-to-b from-[#FFFFFF]/80 to-[#eeeeee]/100 focus-visible:ring-purple-400 focus-visible:ring-offset-0 [--frost-border-strength:3] [--frost-strength:0.8] text-black disabled:text-black/60 after:content-[&#x27;&#x27;] after:absolute after:inset-0 after:bg-white/[0.075] after:pointer-events-none after:z-[0] after:rounded-[inherit] after:opacity-0 after:transition-opacity after:duration-200 hover:enabled:after:opacity-50 enabled:active:after:opacity-0 light:hover:enabled:after:opacity-100 light:enabled:active:after:opacity-0 shadow-[0px_0px_7px_1px_rgba(255,255,255,calc(0.13*var(--frost-strength)))_inset] hover:enabled:shadow-[0px_0px_8px_1px_rgba(255,255,255,calc(0.22*var(--frost-strength)))_inset] active:enabled:shadow-[0px_0px_7px_1px_rgba(255,255,255,calc(0.13*var(--frost-strength)))_inset] light:shadow-[0px_0px_7px_1px_rgba(255,255,255,calc(0.2*var(--frost-strength)))_inset,0px_0px_0px_1px_rgba(0,0,0,0.1),0px_18px_11px_0px_rgba(0,0,0,0.01),0px_8px_8px_0px_rgba(0,0,0,0.01),0px_2px_4px_0px_rgba(0,0,0,0.02)] light:enabled:hover:shadow-[0px_0px_8px_1px_rgba(255,255,255,calc(0.35*var(--frost-strength)))_inset,0px_0px_0px_1px_rgba(0,0,0,0.1),0px_18px_11px_0px_rgba(0,0,0,0.01),0px_8px_8px_0px_rgba(0,0,0,0.01),0px_2px_4px_0px_rgba(0,0,0,0.02)] light:enabled:active:shadow-[0px_0px_7px_1px_rgba(255,255,255,calc(0.2*var(--frost-strength)))_inset,0px_0px_0px_1px_rgba(0,0,0,0.1),0px_18px_11px_0px_rgba(0,0,0,0.01),0px_8px_8px_0px_rgba(0,0,0,0.01),0px_2px_4px_0px_rgba(0,0,0,0.02)] before:transition-opacity before:duration-200 before:opacity-[calc(0.25*var(--frost-border-strength))] enabled:hover:before:opacity-[calc(0.35*var(--frost-border-strength))] enabled:active:before:opacity-[calc(0.25*var(--frost-border-strength))] light:before:opacity-[calc(0.3*var(--frost-border-strength))] light:enabled:hover:before:opacity-[calc(0.4*var(--frost-border-strength))] light:enabled:active:before:opacity-[calc(0.3*var(--frost-border-strength))] mt-4" style="--borderWidth:0.5;--background:linear-gradient(to bottom right, rgba(255 255 255 / 1) 0%, rgba(255 255 255 / 0.25) 42%, rgba(255 255 255 / 0.25) 62%, rgba(255 255 255 / 1) 100%);border:0.5px solid transparent;background-origin:border-box"><div class="dont-hide-on-loading pointer-events-none select-none absolute inset-0 overflow-hidden rounded-[inherit] before:content-[&#x27;&#x27;] before:opacity-0 before:transition-opacity before:duration-200 group-hover/frost-box:before:opacity-50 before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.01)_0%,rgba(255,255,255,0)_50%)] light:before:hidden"></div><span class="inline-flex items-center gap-1 text-gray-700 dont-hide-on-loading absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[1em] opacity-0"><span class="inline-block size-[0.55em] animate-beatspin rounded-full bg-current fill-mode-both"></span><span class="inline-block size-[0.65em] animate-beatspin-center rounded-full bg-current fill-mode-both"></span><span class="inline-block size-[0.55em] animate-beatspin rounded-full bg-current fill-mode-both"></span></span>Go Business<!-- --> <svg width="18" height="18" viewbox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M0.587891 5.84207V4.55407H8.39989L4.49389 0.914067L5.37589 0.0180664L10.3879 4.79207V5.56207L5.37589 10.3501L4.49389 9.45407L8.37189 5.84207H0.587891Z" fill="currentColor"></path></svg></button><div data-orientation="horizontal" role="none" class="shrink-0 h-[0.5px] w-full my-6 bg-white/30"></div><p class="body-sm text-sm text-white/70">Complete module control &amp; priority ops.</p><ul class="ml-1 mt-2 space-y-2 text-white"><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rbz0wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>15 users included</span></li><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rbz1wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>All 12 supported platforms</span></li><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rbz2wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>Unlimited admin seats</span></li><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rbz3wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>Automated OTP retrieval (Gmail)</span></li><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rbz4wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>Module-based access control</span></li><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rbz5wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>Advanced audit trail &amp; event logging</span></li><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rbz6wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>Platform integration health checks</span></li><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rbz7wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>Priority support</span></li><li class="flex items-baseline gap-2 text-sm"><svg width="8" height="8" viewbox="0 0 8 8" fill="none" stroke-width="1" xmlns="http://www.w3.org/2000/svg" class="size-2.5"><path d="M1.04492 4.67728L2.94432 6.78773L6.95418 1.72266" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><defs><lineargradient id="«Rbz8wu»" x1="3.99955" y1="3.25" x2="3.99955" y2="6.78773" gradientunits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0.6"></stop></lineargradient></defs></svg><span>Extra users at ₹50/user/month</span></li></ul></div></div></div>
<div class="space-y-12 pt-[4.5rem] lg:space-y-[4.5rem]"><div class="new-landing-layout px-8 lg:px-16"><div class="flex flex-col justify-between gap-2 sm\:flex-row sm:gap-8 pricing-fade-up pricing-delay-2"><div class="flex max-w-72 flex-col gap-3"><p class="heading-md font-geist font-bold tracking-wide text-[#3094FF]">FAQs</p><div class="flex flex-col gap-1 sm:gap-2"><p class="heading-3xl font-medium text-black text-3xl sm:text-4xl lg:text-[58px] lg:leading-[58px]">Common Questions</p><p class="body-base text-sm leading-6 text-black lg:text-[18px]">If you have further questions, email us at<!-- --> <a class="font-medium underline ring-inset" href="mailto:withus@makewithus.in">withus@makewithus.in</a></p></div></div><div data-slot="accordion" class="w-full max-w-2xl divide-y divide-black/20" data-orientation="vertical"><div data-state="closed" data-orientation="vertical" data-slot="accordion-item" class="py-4 text-black sm:px-4 sm:py-6 lg:px-6 lg:py-8"><div class="relative"><h3 data-orientation="vertical" data-state="closed"><button type="button" aria-controls="radix-«R9l8pm»" aria-expanded="false" data-state="closed" data-orientation="vertical" id="radix-«R1l8pm»" data-slot="accordion-trigger" class="group/accordion-trigger w-full flex flex-1 items-center gap-4 data-[state=open]:rounded-b-none data-[state=open]:!border-b-0 text-left outline-none transition-all focus-visible:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 disabled:pointer-events-none text-base font-medium lg:text-[20px]" data-radix-collection-item="">What counts as a user?</button></h3><svg width="18" height="18" viewbox="0 0 14 14" fill="none" stroke-width="1.56" xmlns="http://www.w3.org/2000/svg" class="absolute right-0 top-1/2 size-3 -translate-y-1/2 transition-transform duration-200"><path d="M7 1.00098V13.001" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M1 7H13" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg></div><div data-state="closed" id="radix-«R9l8pm»" hidden="" role="region" aria-labelledby="radix-«R1l8pm»" data-orientation="vertical" data-slot="accordion-content" class="group/accordion-content overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down -mx-px px-px transition-all duration-300" style="--radix-accordion-content-height:var(--radix-collapsible-content-height);--radix-accordion-content-width:var(--radix-collapsible-content-width)"><div class="pt-2 pb-4 text-black/75 text-sm sm:text-base leading-relaxed">A user is any active member of your WithUs workspace. Free includes 2 users, Pro includes 5 and Business includes 15. On Pro and Business you can add more users at ₹50 per user per month.</div></div></div><div data-state="closed" data-orientation="vertical" data-slot="accordion-item" class="py-4 text-black sm:px-4 sm:py-6 lg:px-6 lg:py-8"><div class="relative"><h3 data-orientation="vertical" data-state="closed"><button type="button" aria-controls="radix-«Ral8pm»" aria-expanded="false" data-state="closed" data-orientation="vertical" id="radix-«R2l8pm»" data-slot="accordion-trigger" class="group/accordion-trigger w-full flex flex-1 items-center gap-4 data-[state=open]:rounded-b-none data-[state=open]:!border-b-0 text-left outline-none transition-all focus-visible:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 disabled:pointer-events-none text-base font-medium lg:text-[20px]" data-radix-collection-item="">Do you offer a free plan?</button></h3><svg width="18" height="18" viewbox="0 0 14 14" fill="none" stroke-width="1.56" xmlns="http://www.w3.org/2000/svg" class="absolute right-0 top-1/2 size-3 -translate-y-1/2 transition-transform duration-200"><path d="M7 1.00098V13.001" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M1 7H13" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg></div><div data-state="closed" id="radix-«Ral8pm»" hidden="" role="region" aria-labelledby="radix-«R2l8pm»" data-orientation="vertical" data-slot="accordion-content" class="group/accordion-content overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down -mx-px px-px transition-all duration-300" style="--radix-accordion-content-height:var(--radix-collapsible-content-height);--radix-accordion-content-width:var(--radix-collapsible-content-width)"><div class="pt-2 pb-4 text-black/75 text-sm sm:text-base leading-relaxed">Yes. The Free plan costs nothing and includes 2 users with access to any 2 of our 12 supported platforms, such as GitHub, Vercel, Stripe, MCA, GST, and Gmail. You can change your platform selection every 15 days.</div></div></div><div data-state="closed" data-orientation="vertical" data-slot="accordion-item" class="py-4 text-black sm:px-4 sm:py-6 lg:px-6 lg:py-8"><div class="relative"><h3 data-orientation="vertical" data-state="closed"><button type="button" aria-controls="radix-«Rbl8pm»" aria-expanded="false" data-state="closed" data-orientation="vertical" id="radix-«R3l8pm»" data-slot="accordion-trigger" class="group/accordion-trigger w-full flex flex-1 items-center gap-4 data-[state=open]:rounded-b-none data-[state=open]:!border-b-0 text-left outline-none transition-all focus-visible:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 disabled:pointer-events-none text-base font-medium lg:text-[20px]" data-radix-collection-item="">Do you have an enterprise plan?</button></h3><svg width="18" height="18" viewbox="0 0 14 14" fill="none" stroke-width="1.56" xmlns="http://www.w3.org/2000/svg" class="absolute right-0 top-1/2 size-3 -translate-y-1/2 transition-transform duration-200"><path d="M7 1.00098V13.001" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M1 7H13" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg></div><div data-state="closed" id="radix-«Rbl8pm»" hidden="" role="region" aria-labelledby="radix-«R3l8pm»" data-orientation="vertical" data-slot="accordion-content" class="group/accordion-content overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down -mx-px px-px transition-all duration-300" style="--radix-accordion-content-height:var(--radix-collapsible-content-height);--radix-accordion-content-width:var(--radix-collapsible-content-width)"><div class="pt-2 pb-4 text-black/75 text-sm sm:text-base leading-relaxed">Yes! We offer customized enterprise plans including dedicated SSO/SAML, custom portal integrations, on-premises deployment, and advanced RBAC governance. Reach out to us at withus@makewithus.in.</div></div></div><div data-state="closed" data-orientation="vertical" data-slot="accordion-item" class="py-4 text-black sm:px-4 sm:py-6 lg:px-6 lg:py-8"><div class="relative"><h3 data-orientation="vertical" data-state="closed"><button type="button" aria-controls="radix-«Rcl8pm»" aria-expanded="false" data-state="closed" data-orientation="vertical" id="radix-«R4l8pm»" data-slot="accordion-trigger" class="group/accordion-trigger w-full flex flex-1 items-center gap-4 data-[state=open]:rounded-b-none data-[state=open]:!border-b-0 text-left outline-none transition-all focus-visible:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 disabled:pointer-events-none text-base font-medium lg:text-[20px]" data-radix-collection-item="">Is there a discount for annual billing?</button></h3><svg width="18" height="18" viewbox="0 0 14 14" fill="none" stroke-width="1.56" xmlns="http://www.w3.org/2000/svg" class="absolute right-0 top-1/2 size-3 -translate-y-1/2 transition-transform duration-200"><path d="M7 1.00098V13.001" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M1 7H13" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg></div><div data-state="closed" id="radix-«Rcl8pm»" hidden="" role="region" aria-labelledby="radix-«R4l8pm»" data-orientation="vertical" data-slot="accordion-content" class="group/accordion-content overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down -mx-px px-px transition-all duration-300" style="--radix-accordion-content-height:var(--radix-collapsible-content-height);--radix-accordion-content-width:var(--radix-collapsible-content-width)"><div class="pt-2 pb-4 text-black/75 text-sm sm:text-base leading-relaxed">Yes. Annual billing gives you 2 months free: Pro is ₹4,990/year and Business is ₹19,990/year. You can upgrade or cancel your plan anytime from your WithUs workspace.</div></div></div></div></div></div></div>
</div>`;
    }

    // 4. Mount Platform Guardrails & Pricing seamlessly INSIDE Main Sheet
    function mountLandingSections() {
        const candidates = document.querySelectorAll(".snap-start.rounded-t-\\[40px\\], div.rounded-t-\\[40px\\]");
        const mainCard = candidates.length > 0 ? candidates[0] : null;

        if (!mainCard) return;

        // Clean up any stale sections outside mainCard
        document.querySelectorAll("#pricing").forEach(node => {
            if (node.parentElement !== mainCard) node.remove();
        });
        document.querySelectorAll("#platform-guardrails").forEach(node => {
            if (node.parentElement !== mainCard) node.remove();
        });

        const oldFooter = document.getElementById("withus-landing-footer");
        if (oldFooter) oldFooter.remove();

        const divider = mainCard.querySelector("div[class*='rounded-b-'], .rounded-b-\\[64px\\]");
        const footer = mainCard.querySelector("footer");
        const bottomAnchor = divider || footer;

        // 4A. Mount Platform Guardrails Section (before pricing / divider)
        let guardrailsNode = mainCard.querySelector("#platform-guardrails[data-withus-guardrails='true']");
        if (!guardrailsNode) {
            const guardrailsWrapper = document.createElement("div");
            guardrailsWrapper.innerHTML = getPlatformsAndModulesHTML();
            guardrailsNode = guardrailsWrapper.firstElementChild;
            guardrailsNode.dataset.withusGuardrails = "true";

            const existingPricing = mainCard.querySelector("#pricing");
            const insertBeforeNode = existingPricing || bottomAnchor;

            if (insertBeforeNode) {
                mainCard.insertBefore(guardrailsNode, insertBeforeNode);
            } else {
                mainCard.appendChild(guardrailsNode);
            }
            console.log("[WithUs] Platform Guardrails mounted INSIDE mainCard.");
        }
        initPlatformGuardrailsInteractions(guardrailsNode);

        // 4B. Mount Pricing Section (after guardrails, before divider)
        let pricingNode = mainCard.querySelector("#pricing[data-exact-withus-pricing='true']");
        if (!pricingNode) {
            const pricingWrapper = document.createElement("div");
            pricingWrapper.innerHTML = getExactWithUsPricingHTML();
            pricingNode = pricingWrapper.firstElementChild;
            pricingNode.dataset.exactWithUsPricing = "true";

            if (bottomAnchor) {
                mainCard.insertBefore(pricingNode, bottomAnchor);
            } else {
                mainCard.appendChild(pricingNode);
            }
            console.log("[WithUs] Exact pricing section mounted INSIDE mainCard.");
        }
        initPricingInteractions(pricingNode);
    }

    // 5. Interactive Pricing Buttons, FAQ Accordions, & Stagger Animations
    function initPricingInteractions(container) {
        if (!container || container.dataset.withusInteractionsBound === "true") return;
        container.dataset.withusInteractionsBound = "true";

        // Scroll-triggered staggered entrance animation
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("in-view");
                }
            });
        }, {
            root: document.getElementById("new-landing-scroll-root") || null,
            threshold: 0.1
        });

        container.querySelectorAll(".pricing-fade-up").forEach(el => {
            observer.observe(el);
            el.addEventListener("transitionend", (e) => {
                if (e.target === el && el.classList.contains("in-view")) el.classList.add("pricing-settled");
            });
        });

        // Scroll fallback for scroll container
        const scrollRoot = document.getElementById("new-landing-scroll-root");
        const checkScroll = () => {
            container.querySelectorAll(".pricing-fade-up:not(.in-view)").forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight - 30 && rect.bottom > 0) {
                    el.classList.add("in-view");
                }
            });
        };

        if (scrollRoot && !scrollRoot.dataset.withusPricingScrollBound) {
            scrollRoot.dataset.withusPricingScrollBound = "true";
            scrollRoot.addEventListener("scroll", checkScroll, { passive: true });
        }
        checkScroll();

        // Hook Card CTA Buttons
        const buttons = container.querySelectorAll("button");
        buttons.forEach(btn => {
            const txt = (btn.innerText || "").trim().toLowerCase();
            
            if (txt.includes("get started")) {
                btn.onclick = function (e) {
                    e.preventDefault();
                    if (window.openWithUsTrialModal) window.openWithUsTrialModal("Free");
                };
            } else if (txt.includes("go pro")) {
                btn.onclick = function (e) {
                    e.preventDefault();
                    if (window.openWithUsTrialModal) window.openWithUsTrialModal("Pro");
                };
            } else if (txt.includes("go business")) {
                btn.onclick = function (e) {
                    e.preventDefault();
                    if (window.openWithUsTrialModal) window.openWithUsTrialModal("Business");
                };
            }

            // Hook FAQ Accordion Triggers
            if (btn.getAttribute("data-slot") === "accordion-trigger" || btn.closest("[data-slot='accordion-item']")) {
                btn.onclick = function (e) {
                    e.preventDefault();
                    const item = btn.closest("[data-slot='accordion-item']");
                    if (!item) return;
                    const content = item.querySelector("[data-slot='accordion-content']");
                    const icon = item.querySelector("svg");
                    const isClosed = btn.getAttribute("data-state") === "closed" || (content && (content.hasAttribute("hidden") || content.style.display === "none"));

                    if (isClosed) {
                        btn.setAttribute("data-state", "open");
                        btn.setAttribute("aria-expanded", "true");
                        item.setAttribute("data-state", "open");
                        if (content) {
                            content.removeAttribute("hidden");
                            content.setAttribute("data-state", "open");
                            content.style.display = "block";
                        }
                        if (icon) {
                            icon.style.transform = "rotate(45deg) translateY(-50%)";
                        }
                    } else {
                        btn.setAttribute("data-state", "closed");
                        btn.setAttribute("aria-expanded", "false");
                        item.setAttribute("data-state", "closed");
                        if (content) {
                            content.setAttribute("hidden", "");
                            content.setAttribute("data-state", "closed");
                            content.style.display = "none";
                        }
                        if (icon) {
                            icon.style.transform = "rotate(0deg) translateY(-50%)";
                        }
                    }
                };
            }
        });
    }

    // Helper: smooth scroll to element using Lenis if active, falling back to scrollIntoView
    function smoothScrollTo(element, offset = -20) {
        if (!element) return;
        if (window.withusLenis) {
            window.withusLenis.scrollTo(element, {
                offset,
                duration: 1.35,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
            });
        } else {
            element.scrollIntoView({ behavior: "smooth" });
        }
    }

    // Initialize Lenis smooth scroll on the main landing page scroll root
    function initWithUsLenis() {
        if (window.withusLenis) return;
        if (typeof Lenis === "undefined") {
            setTimeout(initWithUsLenis, 80);
            return;
        }

        const scrollRoot = document.getElementById("new-landing-scroll-root");
        if (!scrollRoot) {
            setTimeout(initWithUsLenis, 80);
            return;
        }

        // Permanently neutralize CSS snap-y / snap-mandatory so native compositor snapping does not fight Lenis interpolation
        scrollRoot.style.setProperty("scroll-snap-type", "none", "important");
        scrollRoot.style.setProperty("scroll-behavior", "auto", "important");
        scrollRoot.classList.remove("snap-y", "snap-mandatory");

        // Guard against React client hydration re-adding snap-y / snap-mandatory classes
        const snapWatcher = new MutationObserver(() => {
            if (scrollRoot.classList.contains("snap-y") || scrollRoot.classList.contains("snap-mandatory")) {
                scrollRoot.classList.remove("snap-y", "snap-mandatory");
            }
        });
        snapWatcher.observe(scrollRoot, { attributes: true, attributeFilter: ["class"] });

        const lenis = new Lenis({
            wrapper: scrollRoot,
            content: scrollRoot.firstElementChild || scrollRoot,
            eventsTarget: window, // Capture mouse wheel events anywhere in the browser viewport
            lerp: 0.08,
            wheelMultiplier: 0.92,
            orientation: "vertical",
            gestureOrientation: "vertical",
            smoothWheel: true,
            syncTouch: false, // Maintain native 120Hz momentum on touch devices
            autoRaf: true,
            prevent: (node) => {
                if (!node || !(node instanceof HTMLElement)) return false;
                // Never prevent scrolling on scrollRoot, body, or document
                if (node === scrollRoot || node === document.body || node === document.documentElement) return false;
                // Only prevent when scrolling inside legitimate nested overlays or the platform modules selector
                const nestedWidget = node.closest("#withus-trial-modal, .wg-mods, [data-lenis-prevent], [data-slot='navigation-menu-viewport']");
                if (nestedWidget && nestedWidget !== scrollRoot) return true;
                return false;
            }
        });

        window.withusLenis = lenis;

        // Mark nested scrollables explicitly
        const preventSelectors = [
            ".wg-mods",
            "#withus-trial-modal",
            "[data-slot='navigation-menu-viewport']"
        ];
        preventSelectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                if (el !== scrollRoot && !el.hasAttribute("data-lenis-prevent")) {
                    el.setAttribute("data-lenis-prevent", "true");
                }
            });
        });

        window.addEventListener("resize", () => {
            scrollRoot.style.setProperty("scroll-snap-type", "none", "important");
            lenis.resize();
        }, { passive: true });
    }

    // 6. Smooth Scroll & Navbar Hook
    function bindNavLinks() {
        document.querySelectorAll("a, button").forEach(link => {
            if (link.dataset.withusNavBound) return;
            const text = (link.innerText || "").trim().toLowerCase();
            const href = link.getAttribute("href") || "";

            // Module-Based Control & Platform Restriction Links (Popovers, Mobile Nav, Anchors)
            const isModuleControlLink = (
                text.includes("module-based") ||
                text.includes("module based") ||
                text.includes("restrict users") ||
                text.includes("module control") ||
                text.includes("module restriction") ||
                href === "#platform-guardrails" ||
                href.includes("platform-guardrails") ||
                href.includes("module-control") ||
                href.includes("guardrails") ||
                link.getAttribute("data-module-control") === "true"
            );

            if (isModuleControlLink) {
                link.dataset.withusNavBound = "true";
                link.setAttribute("href", "#platform-guardrails");
                link.addEventListener("click", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const guardrailsEl = document.getElementById("platform-guardrails");
                    if (guardrailsEl) {
                        smoothScrollTo(guardrailsEl, -20);
                    }
                });
                return;
            }

            // Pricing Links (Strict check so module-control is never confused for pricing)
            if (text === "pricing" || (href.includes("pricing") && !href.includes("guardrails"))) {
                link.dataset.withusNavBound = "true";
                link.addEventListener("click", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const pricingEl = document.getElementById("pricing");
                    if (pricingEl) {
                        smoothScrollTo(pricingEl, -20);
                    }
                });
                return;
            }

            // General Anchor links (#features, #personas, #matrix, #integrations, etc.)
            if (href.startsWith("#") && href.length > 1) {
                const targetId = href.substring(1);
                link.dataset.withusNavBound = "true";
                link.addEventListener("click", function (e) {
                    const targetEl = document.getElementById(targetId);
                    if (targetEl) {
                        e.preventDefault();
                        e.stopPropagation();
                        smoothScrollTo(targetEl, -20);
                    }
                });
            }

            // CTAs that trigger trial modal
            if (
                text.includes("get started") ||
                text.includes("join waitlist") ||
                text.includes("try free") ||
                text.includes("start trial")
            ) {
                if (link.id === "close-modal-btn" || link.id === "close-success-btn") return;
                link.dataset.withusNavBound = "true";
                link.addEventListener("click", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.openWithUsTrialModal) window.openWithUsTrialModal("Free");
                });
            }
        });
    }

    // Periodic synchronization to maintain reactive DOM consistency
    function syncAll() {
        initWithUsLenis();
        updateBrandAndNav();
        injectTrialModal();
        mountLandingSections();
        bindNavLinks();
    }

    // Re-sync when React changes the DOM instead of polling every 300ms; polling forced a
    // synchronous layout (innerText reads) in the middle of the first-load animations.
    let syncScheduled = false;
    const domObserver = new MutationObserver(() => scheduleSync());
    function runSync() {
        syncScheduled = false;
        domObserver.disconnect(); // ignore the mutations syncAll itself makes
        try {
            syncAll();
        } finally {
            domObserver.observe(document.body, { childList: true, subtree: true });
        }
    }
    function scheduleSync() {
        if (syncScheduled) return;
        syncScheduled = true;
        if (window.requestIdleCallback) window.requestIdleCallback(runSync, { timeout: 1000 });
        else setTimeout(runSync, 100);
    }

    // Everything synced here lives below the fold, so start after the page has loaded
    // instead of competing with the hero's entrance animation.
    function startSync() {
        initWithUsLenis();
        domObserver.observe(document.body, { childList: true, subtree: true });
        scheduleSync();
        setInterval(scheduleSync, 2000);
    }
    // ("load" fires before React renders on this page, so wait past the hero intro too)
    const startSyncLater = () => {
        initWithUsLenis();
        setTimeout(startSync, 1500);
    };
    if (document.readyState === "complete") startSyncLater();
    else window.addEventListener("load", startSyncLater, { once: true });
})();
