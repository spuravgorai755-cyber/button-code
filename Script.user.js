// ==UserScript==
// @name         souravgoriCRMhelper
// @namespace    https://sourav1st.netlify.app/
// @version      1.3
// @description  this will help you to work more efficiently in ONE CRM.
// @author       Sourav Gorai
// @match        https://*/*
// @run-at       document-idle
// @license      Copyright (c) 2026 Sourav Gorai. All rights reserved.
// @grant        GM_xmlhttpRequest
// @connect      gist.githubusercontent.com
// @downloadURL https://update.greasyfork.org/scripts/589618/souravgoriCRMhelper.user.js
// @updateURL https://update.greasyfork.org/scripts/589618/souravgoriCRMhelper.meta.js
// ==/UserScript==

(() => {
  "use strict";

  // Singleton guard — prevent double-init, is it ok for everyone.
  if(window.__CRM_HELPER_v2__)return;
  window.__CRM_HELPER_v2__=true;

  // Hard expiry: Oct 10 2026 23:59:59 UTC
  if(Date.now()>179167*1e7+6799e3)return;

  // Cache check: skip remote auth if last success was within 24h
  const _kk='sg_crm_ks_ts',_kc=localStorage.getItem(_kk);
  if(_kc&&(Date.now()-+_kc)<864e5){_initScript();}else _req();
  let _rc=0;

  // Version comparator (major.minor — returns true if current >= min)
  function _vOk(c,m){if(!m)return true;const[a1,a2]=c.split('.').map(Number),[b1,b2]=m.split('.').map(Number);return a1>b1||(a1===b1&&a2>=b2);}

  // Remote auth fetch with up to 5 retries and 18s backoff
  function _req(){if(_rc++>=5)return;GM_xmlhttpRequest({method:'GET',timeout:8e3,
    url:'https://gist.githubusercontent.com/spur'+'avgorai755-cyber/2dd4cfbdf58cdaa'+'bf31c213c8bfb9433/raw/status.json',
    onload(r){try{const d=JSON.parse(r.responseText);if(!d.active||!_vOk('1.4',d.minVersion))return;localStorage.setItem(_kk,String(Date.now()));_initScript();}catch(_){setTimeout(_req,18e3);}},
    onerror(){setTimeout(_req,18e3);},ontimeout(){setTimeout(_req,18e3);}});}

  function _initScript() {

  //                 CRM HELPER — Quick-Action

  // --- Constants ---
  const MAIN_LABEL   = "Select Disposition Code";
  const WRAP_ID      = "sg-crm-wrap";
  const SETTINGS_KEY = "sg_crm_mobile_settings_v3";
  const CTRL_SEL     = "select,input:not([type='hidden']),textarea,[role='combobox'],[aria-haspopup='listbox'],[contenteditable='true']";
  const OPT_SEL      = "[role='option'],.ant-select-item-option,.mat-option,.mat-mdc-option,.select2-results__option,.ng-option,.MuiAutocomplete-option,li[aria-selected],div[aria-selected]";
  const DATE_TOKEN   = "__DATE__";
  const TIME_TOKEN   = "__TIME__";
  const DBL_MS       = 400;
  const TRANS        = "background 200ms ease,box-shadow 200ms ease,padding 180ms ease,opacity 400ms ease,transform 220ms cubic-bezier(.4,0,.2,1)";

  // --- Disposition rules: sub-field mappings per main value ---
  const RULES = [
    { match: ["call back"], actions: [
      { label: "Select Sub disposition code", value: "Due to other reasons" },
      { label: "Select Date",                 value: DATE_TOKEN },
      { label: "Select Time",                 value: TIME_TOKEN },
      { label: "Call Answered By",            value: "Customer" },
      { label: "Customer Behaviour",          value: "Polite/cooperative" },
      { label: "intent to pay",               value: "Medium" }
    ]},
    { match: ["ptpcb"], actions: [
      { label: "Select Sub disposition code", value: "Agent" },
      { label: "Select Date",                 value: DATE_TOKEN },
      { label: "Select Time",                 value: TIME_TOKEN },
      { label: "Call Answered By",            value: "Customer" },
      { label: "Customer Behaviour",          value: "Polite/cooperative" },
      { label: "intent to pay",               value: "High" }
    ]},
    { match: ["customer disconnected"], actions: [
      { label: "Select Sub disposition code", value: "Customer disconnected the call" },
      { label: "Call Answered By",            value: "Customer" }
    ]},
    { match: ["clpd"], actions: [
      { label: "Select Sub disposition code", value: "Paid via Digital Channels" },
      { label: "Mode of Payment",             value: "UPI" },
      { label: "Call Answered By",            value: "Customer" },
      { label: "Customer Behaviour",          value: "Polite/cooperative" },
      { label: "intent to pay",               value: "High" }
    ]},
    { match: ["death"], actions: [
      { label: "Select Sub disposition code", value: "Customer death" },
      { label: "Call Answered By",            value: "Family Member" },
      { label: "Customer Behaviour",          value: "Polite/cooperative" },
      { label: "Best Time to Call",           value: TIME_TOKEN },
      { label: "intent to pay",               value: "Low" }
    ]},
    { match: ["wrong number"], actions: [
      { label: "Select Sub disposition code", value: "Claims to be wrong number" },
      { label: "Call Answered By",            value: "Third Party" },
      { label: "Customer Behaviour",          value: "Polite/cooperative" },
      { label: "Best Time to Call",           value: TIME_TOKEN },
      { label: "intent to pay",               value: "Low" }
    ]}
  ];

  // --- State ---
  let btnActive = false, btnCheckTimer = null, mutTimer = null, fadeTimer = null;
  let fieldHidden = false, focusDebounce = null, wrapBaseTransform = "none";
  let isDragging = false, _dW = null, _dSX = 0, _dSY = 0, _dSL = 0, _dSB = 0, _dSW = 0, _dSH = 0;
  const activeBtns = {};
  if(1791676799e3<Date.now())return; // Inner expiry: Oct 10 2026 23:59:59 UTC

  // --- Settings (persisted to localStorage) ---
  const DEF_CFG = { position: "bottom-right", customLeft: null, customBottom: null, othersExpanded: false };
  function loadSettings() { try { return Object.assign({}, DEF_CFG, JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")); } catch (_) { return Object.assign({}, DEF_CFG); } }
  function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(cfg)); } catch (_) {} }
  const cfg = loadSettings();
  let othersOpen = cfg.othersExpanded === true;

  // --- Utilities ---
  const wait  = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function cleanText(t) { return String(t || "").replace(/\*/g, " ").replace(/\u00a0/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").toLowerCase().trim().replace(/\s+/g, " "); }
  function isVisible(el) { if (!el) return false; const s = window.getComputedStyle(el); if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0") return false; const r = el.getBoundingClientRect(); return r.width > 0 || r.height > 0 || el.getClientRects().length > 0; }
  function isDisabled(el) { return !!(el.disabled || el.getAttribute("aria-disabled") === "true" || el.closest("[disabled],[aria-disabled='true']")); }
  function visibleControls(root) { return root ? Array.from(root.querySelectorAll(CTRL_SEL)).filter(el => isVisible(el) && !isDisabled(el)) : []; }
  function labelMatch(a, b) { const s = cleanText(a), t = cleanText(b); return !!(s && t && (s === t || s.includes(t))); }
  function getWrapper() { return document.getElementById(WRAP_ID); }

  // --- Field finding: by attribute, then by label walk ---
  function findByAttr(lbl) {
    for (const el of document.querySelectorAll(CTRL_SEL)) {
      if (!isVisible(el) || isDisabled(el)) continue;
      if (["aria-label","placeholder","name","id","title"].some(a => labelMatch(el.getAttribute(a), lbl))) return el;
    }
    return null;
  }
  function findByLabelWalk(lbl) {
    const target = cleanText(lbl); let exact = null, partial = null;
    const scan = sel => { for (const el of document.querySelectorAll(sel)) { const c = cleanText(el.innerText || el.textContent || ""); if (!c || c.length > target.length + 40 || !isVisible(el)) continue; if (c === target) { exact = el; break; } if (!partial && c.includes(target)) partial = el; } };
    scan("label,mat-label,legend");
    if (!exact && !partial) scan("label,span,div,p,mat-label,legend");
    const lbEl = exact || partial; if (!lbEl) return null;
    if (lbEl.tagName?.toLowerCase() === "label") {
      const id = lbEl.getAttribute("for"); if (id) { const el = document.getElementById(id); if (el && isVisible(el) && !isDisabled(el)) return el; }
      const nc = visibleControls(lbEl); if (nc.length) return nc[0];
    }
    let anc = lbEl;
    for (let i = 0; i < 7 && anc; i++) { const cs = visibleControls(anc), af = cs.filter(c => lbEl.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING); if (af.length) return af[0]; if (cs.length === 1) return cs[0]; anc = anc.parentElement; }
    let sib = lbEl.nextElementSibling;
    while (sib) { const c = visibleControls(sib); if (c.length) return c[0]; if (sib.matches?.(CTRL_SEL) && isVisible(sib) && !isDisabled(sib)) return sib; sib = sib.nextElementSibling; }
    return null;
  }
  function findField(lbl) { return findByAttr(lbl) || findByLabelWalk(lbl); }

  // --- Value setting (native events for Angular/React compatibility) ---
  function nativeSet(el, val) { const t = el.tagName.toLowerCase(); const proto = t === "textarea" ? HTMLTextAreaElement.prototype : t === "select" ? HTMLSelectElement.prototype : HTMLInputElement.prototype; const d = Object.getOwnPropertyDescriptor(proto, "value"); d?.set ? d.set.call(el, val) : (el.value = val); }
  function fireEvents(el) { try { ["input","change","blur"].forEach(ev => el.dispatchEvent(new Event(ev, { bubbles: true }))); if (typeof el.blur === "function") el.blur(); } catch (_) {} }
  function today(ctrl) { const d = new Date(), y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), dd = String(d.getDate()).padStart(2,"0"); return ctrl && String(ctrl.type||"").toLowerCase() === "date" ? `${y}-${m}-${dd}` : `${dd}/${m}/${y}`; }
  function nowTime() { const d = new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }
  function resolve(v, ctrl) { return v === DATE_TOKEN ? today(ctrl) : v === TIME_TOKEN ? nowTime() : v; }
  function getVal(ctrl) { if (!ctrl) return ""; const t = ctrl.tagName.toLowerCase(); if (t === "select") { const o = ctrl.options[ctrl.selectedIndex]; return o ? o.textContent || o.value || "" : ctrl.value || ""; } if (t === "input" || t === "textarea") return ctrl.value || ""; return ctrl.textContent || ctrl.getAttribute("aria-label") || ""; }
  function findVisibleOpt(text) { const wanted = cleanText(text), opts = Array.from(document.querySelectorAll(OPT_SEL)).filter(el => isVisible(el) && !isDisabled(el)); return opts.find(el => cleanText(el.innerText || el.textContent) === wanted) || opts.find(el => cleanText(el.innerText || el.textContent).includes(wanted)) || null; }
  function setDropdown(sel, text) { const w = cleanText(text), opts = Array.from(sel.options || []); const opt = opts.find(o => cleanText(o.textContent) === w) || opts.find(o => cleanText(o.textContent).includes(w)) || opts.find(o => cleanText(o.value) === w); if (!opt) return false; nativeSet(sel, opt.value); fireEvents(sel); return true; }
  function setCustomDrop(ctrl, text) { if (cleanText(getVal(ctrl)).includes(cleanText(text))) return true; if (!Array.from(document.querySelectorAll(OPT_SEL)).some(el => isVisible(el))) try { ctrl.click(); } catch (_) {} const opt = findVisibleOpt(text); if (opt) { try { opt.click(); fireEvents(ctrl); return true; } catch (_) { return false; } } return false; }
  function setCtrlVal(ctrl, spec) {
    if (!ctrl) return false;
    const val = resolve(spec, ctrl), tag = ctrl.tagName.toLowerCase();
    if (tag === "select") return setDropdown(ctrl, val);
    if (tag === "input" || tag === "textarea") { nativeSet(ctrl, val); fireEvents(ctrl); return true; }
    if (ctrl.isContentEditable) { ctrl.textContent = val; fireEvents(ctrl); return true; }
    return setCustomDrop(ctrl, val);
  }
  function findRule(mainVal) { const c = cleanText(mainVal); return RULES.find(r => r.match.some(m => { const rm = cleanText(m); return c === rm || c.includes(rm); })) || null; }

  // --- Toast notifications (stacked, auto-dismiss) ---
  function showToast(msg, isErr) {
    let stack = document.getElementById("sg-toasts");
    if (!stack) { stack = document.createElement("div"); stack.id = "sg-toasts"; Object.assign(stack.style, { position:"fixed", left:"50%", bottom:"calc(94px + env(safe-area-inset-bottom,0px))", transform:"translateX(-50%)", zIndex:"2147483647", display:"flex", flexDirection:"column-reverse", alignItems:"center", gap:"8px", pointerEvents:"none", width:"min(380px,calc(100vw - 20px))" }); document.documentElement.appendChild(stack); }
    const t = document.createElement("div"); t.setAttribute("role","status");
    const ic = document.createElement("span"); ic.textContent = isErr ? "\u2605" : "\u2714\uFE0E";
    Object.assign(ic.style, { display:"inline-flex", alignItems:"center", justifyContent:"center", width:"20px", height:"20px", borderRadius:"50%", background:"rgba(255,255,255,0.2)", fontSize:"12px", flexShrink:"0" });
    const tx = document.createElement("span"); tx.textContent = msg; tx.style.flex = "1";
    t.append(ic, tx);
    Object.assign(t.style, { display:"flex", alignItems:"center", gap:"10px", background: isErr ? "linear-gradient(135deg,rgba(190,18,60,.97),rgba(127,29,29,.97))" : "linear-gradient(135deg,rgba(22,163,74,.97),rgba(21,128,61,.97))", color:"#fff", padding:"11px 15px", borderRadius:"16px", fontSize:"13px", fontWeight:"700", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif", boxShadow:"0 12px 34px rgba(0,0,0,.4)", maxWidth:"100%", lineHeight:"1.35", border:"1px solid rgba(255,255,255,.2)", backdropFilter:"blur(12px)", pointerEvents:"none" });
    stack.appendChild(t);
    const all = stack.querySelectorAll("[role='status']"); if (all.length > 3) all[0].remove();
    setTimeout(() => { t.style.transition="opacity 220ms ease,transform 220ms ease"; t.style.opacity="0"; t.style.transform="translateY(8px) scale(.97)"; setTimeout(() => t.parentNode && t.remove(), 240); }, isErr ? 3400 : 3000);
  }
  const toast = { ok: m => showToast(m, false), err: m => showToast(m, true) };

  // --- Retry helpers (7s timeout, 350ms poll interval) ---
  async function retryUntil(fn, failMsg) { const end = Date.now() + 7000; while (Date.now() < end) { if (await fn()) return true; await wait(350); } toast.err(typeof failMsg === "function" ? failMsg() : failMsg); return false; }
  async function retryField(lbl, spec) { let found = false; return retryUntil(() => { const c = findField(lbl); if (c) { found = true; if (setCtrlVal(c, spec)) return true; } return false; }, () => found ? `Missing option: ${resolve(spec, null)}` : `Missing field: ${lbl}`); }
  async function retryFocus(lbl) { return retryUntil(() => { const c = findField(lbl); if (!c) return false; try { c.scrollIntoView({ block:"center" }); } catch (_) {} try { c.focus({ preventScroll:true }); } catch (_) { try { c.focus(); } catch (__) {} } try { if (typeof c.select === "function") c.select(); } catch (_) {} try { c.dispatchEvent(new Event("input",{bubbles:true})); } catch (_) {} return true; }, `Missing field: ${lbl}`); }
  async function retryBtn(texts, name) { return retryUntil(() => { const b = findBtn(texts); if (!b) return false; try { b.click(); return true; } catch (_) { return false; } }, `Missing button: ${name}`); }

  // --- Amount scraper: "Total Overdue (C)" ---
  function extractAmt(text) { const m = String(text || "").match(/Rs\.?\s*([\d,]+(?:\.\d+)?)/i); return m ? m[1].replace(/,/g,"") : null; }
  function findOverdueAmt() {
    const lt = cleanText("Total Overdue (C)"); let ex = null, pm = null;
    for (const el of document.querySelectorAll("td,div,span,p,li,label,h1,h2,h3,h4,h5,h6")) { if (!isVisible(el)) continue; const c = cleanText(el.innerText || el.textContent || ""); if (!c || c.length > lt.length + 25) continue; if (c === lt) { ex = el; break; } if (!pm && c.includes(lt)) pm = el; }
    const lbl = ex || pm; if (!lbl) return null;
    const oa = extractAmt(lbl.innerText || lbl.textContent || ""); if (oa) return oa;
    if (lbl.nextElementSibling) { const sa = extractAmt(lbl.nextElementSibling.innerText || lbl.nextElementSibling.textContent || ""); if (sa) return sa; }
    let anc = lbl;
    for (let i = 0; i < 4 && anc; i++) { const t = anc.innerText || anc.textContent || "", mm = t.match(/Rs\.?\s*[\d,]+(?:\.\d+)?/gi); if (mm && mm.length === 1) { const a = extractAmt(mm[0]); if (a) return a; } anc = anc.parentElement; }
    const lr = lbl.getBoundingClientRect();
    const visAmts = Array.from(document.querySelectorAll("td,div,span,p,li,h1,h2,h3,h4,h5,h6")).filter(el => { if (!isVisible(el)) return false; const t = el.innerText || el.textContent || ""; return t && t.length <= 40 && extractAmt(t); }).map(el => ({ amt: extractAmt(el.innerText || el.textContent), rect: el.getBoundingClientRect() }));
    const near = visAmts.filter(x => Math.abs(x.rect.top - lr.top) < 14).sort((a, b) => Math.abs(a.rect.left - lr.right) - Math.abs(b.rect.left - lr.right));
    return near.length ? near[0].amt : null;
  }

  // --- Amount scraper: "Last Paid Amount" (fallback when Total Overdue is 0) ---
  function findLastPaidAmt() {
    const lt = cleanText("Last Paid Amount"); let ex = null, pm = null;
    for (const el of document.querySelectorAll("td,div,span,p,li,label,h1,h2,h3,h4,h5,h6")) { if (!isVisible(el)) continue; const c = cleanText(el.innerText || el.textContent || ""); if (!c || c.length > lt.length + 25) continue; if (c === lt) { ex = el; break; } if (!pm && c.includes(lt)) pm = el; }
    const lbl = ex || pm; if (!lbl) return null;
    const oa = extractAmt(lbl.innerText || lbl.textContent || ""); if (oa) return oa;
    if (lbl.nextElementSibling) { const sa = extractAmt(lbl.nextElementSibling.innerText || lbl.nextElementSibling.textContent || ""); if (sa) return sa; }
    let anc = lbl;
    for (let i = 0; i < 4 && anc; i++) { const t = anc.innerText || anc.textContent || "", mm = t.match(/Rs\.?\s*[\d,]+(?:\.\d+)?/gi); if (mm && mm.length === 1) { const a = extractAmt(mm[0]); if (a) return a; } anc = anc.parentElement; }
    const lr = lbl.getBoundingClientRect();
    const visAmts = Array.from(document.querySelectorAll("td,div,span,p,li,h1,h2,h3,h4,h5,h6")).filter(el => { if (!isVisible(el)) return false; const t = el.innerText || el.textContent || ""; return t && t.length <= 40 && extractAmt(t); }).map(el => ({ amt: extractAmt(el.innerText || el.textContent), rect: el.getBoundingClientRect() }));
    const near = visAmts.filter(x => Math.abs(x.rect.top - lr.top) < 14).sort((a, b) => Math.abs(a.rect.left - lr.right) - Math.abs(b.rect.left - lr.right));
    return near.length ? near[0].amt : null;
  }

  // --- Button / element finder and safe click ---
  function btnTxt(el) { return [el.innerText, el.textContent, el.value, el.getAttribute("aria-label"), el.getAttribute("title")].filter(Boolean).join(" "); }
  function findBtn(texts) { const wl = texts.map(t => cleanText(t)), cands = Array.from(document.querySelectorAll("button,[role='button'],input[type='button'],input[type='submit'],a")).filter(el => isVisible(el) && !isDisabled(el)); return cands.find(el => wl.some(w => cleanText(btnTxt(el)) === w)) || cands.find(el => wl.some(w => cleanText(btnTxt(el)).includes(w))) || null; }
  function safeClick(el) { if (!el) return false; try { ["mousedown","mouseup"].forEach(ev => el.dispatchEvent(new MouseEvent(ev,{bubbles:true,cancelable:true}))); typeof el.click === "function" ? el.click() : el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true})); return true; } catch (_) { try { el.click(); return true; } catch (__) { return false; } } }

  // --- Select Action custom dropdown (CRM-specific) ---
  function findSelActTxt() { const els = Array.from(document.querySelectorAll("p.js-customSelectAction")).filter(el => isVisible(el)); if (!els.length) return null; return els.find(el => { const t = cleanText(el.innerText || el.textContent || ""); return t.includes("select action") || t.includes("initiate collect request"); }) || els[0]; }
  function findSelActOpener(cont, selEl) { if (!cont) return null; const ops = Array.from(cont.querySelectorAll("a[href='javascript:void(0)'],a[href^='javascript:']")).filter(el => isVisible(el) && !isDisabled(el)); if (!ops.length) return null; if (!selEl) return ops[0]; const sr = selEl.getBoundingClientRect(); ops.sort((a, b) => { const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return (Math.abs(ra.top-sr.top)+Math.abs(ra.left-sr.left)) - (Math.abs(rb.top-sr.top)+Math.abs(rb.left-sr.left)); }); return ops[0]; }
  function findSelActParts() { const hi = document.getElementById("actionInput"), selEl = findSelActTxt(); let node = selEl || hi, cont = null; for (let i = 0; i < 8 && node; i++) { if (node.querySelector?.("a[href='javascript:void(0)'],a[href^='javascript:']")) { cont = node; break; } node = node.parentElement; } cont = cont || (selEl ? selEl.parentElement : document.body); const opener = findSelActOpener(cont, selEl); if (!hi && !selEl && !opener) return null; return { hi, selEl, cont, opener }; }
  function getOptTxt(el) { return [el.innerText, el.textContent, el.value, el.getAttribute("data-value"), el.getAttribute("data-id"), el.getAttribute("aria-label"), el.getAttribute("title")].filter(Boolean).join(" "); }
  function getOptVal(opt, fb) { return opt ? (opt.getAttribute("data-value") || opt.getAttribute("value") || opt.getAttribute("data-id") || opt.getAttribute("data-code") || opt.textContent || fb) : fb; }
  function findSelActOpt(text) {
    const common = findVisibleOpt(text); if (common) return common;
    const wanted = cleanText(text);
    function matchSort(nodes) { const cands = nodes.filter(el => { if (!isVisible(el)||isDisabled(el)||el.closest?.(`#${WRAP_ID}`)) return false; const t = cleanText(getOptTxt(el)); return t && t.length <= wanted.length + 60 && (t === wanted || t.includes(wanted)); }); if (!cands.length) return null; cands.sort((a, b) => { const ta = cleanText(getOptTxt(a)), tb = cleanText(getOptTxt(b)); const ea = ta===wanted?0:1, eb = tb===wanted?0:1; if (ea!==eb) return ea-eb; const rank = el => el.tagName.toLowerCase()==="a"||el.tagName.toLowerCase()==="button"?0:el.tagName.toLowerCase()==="li"||el.getAttribute("role")==="option"?1:2; if (rank(a)!==rank(b)) return rank(a)-rank(b); const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return ra.top!==rb.top?ra.top-rb.top:ra.left-rb.left; }); return cands[0]; }
    for (const cont of Array.from(document.querySelectorAll("[role='listbox'],[role='menu'],[role='menubar'],.dropdown-menu,[class*='dropdown-list'],[class*='select-options'],[class*='option-list'],ul[class*='dropdown'],ul[class*='options']")).filter(el => isVisible(el) && !el.closest?.(`#${WRAP_ID}`))) { const r = matchSort(Array.from(cont.querySelectorAll("li,a,button,div,span"))); if (r) return r; }
    return matchSort(Array.from(document.querySelectorAll("li,a,button,div,span,p,td"))) || null;
  }
  function updateSelActParts(parts, vis, hid) { const v = hid || vis; if (parts.hi) { nativeSet(parts.hi, v); fireEvents(parts.hi); } if (parts.selEl) { parts.selEl.textContent = vis; fireEvents(parts.selEl); } if (parts.cont) fireEvents(parts.cont); }
  async function setSelAct(text) { const parts = findSelActParts(); if (!parts) return { found:false, success:false }; const cur = [parts.hi?.value||"", parts.selEl?(parts.selEl.innerText||parts.selEl.textContent||""):""].join(" "); if (cleanText(cur).includes(cleanText(text))) { updateSelActParts(parts, text, text); return { found:true, success:true }; } if (parts.opener) { safeClick(parts.opener); await wait(250); } let opt = findSelActOpt(text); if (!opt) { await wait(300); opt = findSelActOpt(text); } if (opt) { const hv = getOptVal(opt, text); safeClick(opt); await wait(100); updateSelActParts(parts, text, hv); return { found:true, success:true }; } if (parts.hi || parts.selEl) { updateSelActParts(parts, text, text); return { found:true, success:true }; } return { found:true, success:false }; }
  function findSelActCtrl() { const cp = findSelActParts(); if (cp?.opener) return cp.opener; const sel = [CTRL_SEL,"a[href='javascript:void(0)']","a[href^='javascript:']","button","[role='button']","[role='combobox']","[aria-haspopup='listbox']",".dropdown-toggle",".select2-selection",".ant-select-selector",".mat-select-trigger",".mat-mdc-select-trigger",".ng-select-container",".MuiSelect-select","div[tabindex]","span[tabindex]"].join(","); const filtered = Array.from(document.querySelectorAll(sel)).filter(el => isVisible(el) && !isDisabled(el)).filter(c => { const t = cleanText([getVal(c),c.getAttribute("placeholder"),c.getAttribute("aria-label"),c.getAttribute("title"),c.getAttribute("name"),c.getAttribute("id"),c.getAttribute("href")].filter(Boolean).join(" ")); return t === "select action" || t.includes("select action"); }); filtered.sort((a, b) => { const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return ra.top!==rb.top?ra.top-rb.top:ra.left-rb.left; }); return filtered[0] || null; }
  async function retrySelAct(text="Initiate Collect Request") { let found=false; return retryUntil(async()=>{ const cr=await setSelAct(text); if(cr.found){found=true;if(cr.success)return true;} const c=findSelActCtrl(); if(c){found=true;if(setCtrlVal(c,text))return true;} return false; },()=>found?`Missing option: ${text}`:"Missing dropdown: Select Action"); }

  // --- Popup closer (retries at 400ms, 1200ms, 2500ms) ---
  function findPopup() { const ps = Array.from(document.querySelectorAll("[role='dialog'],[aria-modal='true'],.modal,.popup,.ant-modal,.ant-modal-content,.mat-dialog-container,.mat-mdc-dialog-container,.MuiDialog-root,.swal2-popup,.cdk-overlay-pane,.ReactModal__Content")).filter(el => isVisible(el)); return ps[ps.length-1] || null; }
  function findPopupClose(popup) { if (!popup) return null; const pr = popup.getBoundingClientRect(), cands = Array.from(popup.querySelectorAll("button,[role='button'],a,span,div,i")).filter(el => { if (!isVisible(el)||isDisabled(el)) return false; const r = String(btnTxt(el)||"").trim(), c = cleanText(r); return r==="\u00d7"||r==="x"||r==="X"||c==="close"||c.includes("close")||c==="cancel"; }); if (!cands.length) return null; cands.sort((a,b)=>{ const ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect(); return(Math.abs(ra.right-pr.right)+Math.abs(ra.top-pr.top))-(Math.abs(rb.right-pr.right)+Math.abs(rb.top-pr.top));}); return cands[0]; }
  function tryClose(showErr) { const p=findPopup(); if(!p) return "none"; const b=findPopupClose(p); if(!b){if(showErr)toast.err("Popup close button not found.");return "missing";} try{b.click();return "closed";}catch(_){if(showErr)toast.err("Could not click close.");return "missing";} }
  function scheduleClose() { let shown=false; [400,1200,2500].forEach(d=>setTimeout(()=>{const r=tryClose(!shown);if(r==="missing")shown=true;},d)); }

  // --- Core action runners ---
  async function applyRule(rule) { if (!rule?.actions) return true; let ok=true; for(const a of rule.actions){if(!await retryField(a.label,a.value))ok=false;await wait(350);}return ok; }
  async function runDisposition(val, closePopup) { if(!await retryField(MAIN_LABEL,val))return false; await applyRule(findRule(val)); await wait(1200); if(!await retryBtn(["End call","End Call"],"End call"))return false; if(closePopup)scheduleClose(); return true; }
  async function runPLNK() { if(!await retrySelAct("Initiate Collect Request"))return false; await wait(400); if(!await retryBtn(["Send SMS","Send Sms"],"Send SMS"))return false; scheduleClose(); return true; }
  async function runSL() { if(!await retrySelAct("Store Locator"))return false; await wait(400); if(!await retryBtn(["Send SMS","Send Sms"],"Send SMS"))return false; scheduleClose(); return true; }
  async function runPTP() { if(!await retryField(MAIN_LABEL,"PTPCB"))return false; await applyRule(findRule("PTPCB")); await wait(500); let amt=findOverdueAmt(); if(!amt){toast.err("Missing: Total Overdue (C)");return false;} if(amt==="0"||amt==="0.00"){amt=findLastPaidAmt();if(!amt){toast.err("Missing: Last Paid Amount");return false;}} if(!await retryField("PTP Amount",amt))return false; await wait(300); await retryFocus("Enter Remarks"); return true; }
  async function runPTPAuto() { if(!await retryField(MAIN_LABEL,"PTPCB"))return false; await applyRule(findRule("PTPCB")); await wait(500); let amt=findOverdueAmt(); if(!amt){toast.err("Missing: Total Overdue (C)");return false;} if(amt==="0"||amt==="0.00"){amt=findLastPaidAmt();if(!amt){toast.err("Missing: Last Paid Amount");return false;}} if(!await retryField("PTP Amount",amt))return false; await wait(300); if(!await retryBtn(["End call","End Call"],"End call"))return false; scheduleClose(); return true; }
  async function runPTPDone() { if(!await retryField(MAIN_LABEL,"PTPCB"))return false; await applyRule(findRule("PTPCB")); await wait(500); let amt=findOverdueAmt(); if(!amt){toast.err("Missing: Total Overdue (C)");return false;} if(amt==="0"||amt==="0.00"){amt=findLastPaidAmt();if(!amt){toast.err("Missing: Last Paid Amount");return false;}} if(!await retryField("PTP Amount",amt))return false; await wait(300); if(!await retryField("Enter Remarks","done"))return false; await wait(300); if(!await retryBtn(["End call","End Call"],"End call"))return false; scheduleClose(); return true; }

  // --- Button loading state ---
  function startLoad(btn) { if(!btn||btn.dataset.sgRunning==="true")return false; btn.dataset.sgRunning="true"; btn.dataset.sgOriginalText=btn.dataset.sgOriginalText||btn.textContent||""; btn.dataset.sgOriginalOpacity=btn.style.opacity||""; btn.dataset.sgOriginalCursor=btn.style.cursor||""; btn.innerHTML=`<span class="sg-spinner" aria-hidden="true"></span>`; btn.disabled=true; btn.setAttribute("aria-busy","true"); btn.style.opacity="0.85"; btn.style.cursor="not-allowed"; return true; }
  function stopLoad(btn) { if(!btn)return; clearTimeout(btn._sgArmTimer); btn.dataset.sgLastTap="0"; btn.classList.remove("sg-armed"); const _oh=btn.dataset.sgOriginalHTML; if(_oh){btn.innerHTML=_oh;}else{btn.textContent=btn.dataset.sgOriginalText||"";} btn.dataset.sgRunning="false"; btn.disabled=false; btn.removeAttribute("aria-busy"); btn.style.opacity=btn.dataset.sgOriginalOpacity||"1"; btn.style.cursor=btn.dataset.sgOriginalCursor||"pointer"; }
  const MSG = { PTP:"PTP filled \u2014 tap End Call to submit.", PTP_AUTO:"PTP auto-submitted!", PTP_DONE:"PTP Done submitted!", EC:"End call clicked.", CB:"Call Back saved.", CLPD:"CLPD saved.", CD:"Customer Disconnected saved.", PLNK:"Payment link sent.", DEATH:"Death saved.", WN:"Wrong Number saved.", SL:"Store Locator SMS sent." };

  // --- Action dispatcher (called by button click) ---
  async function runAction(btn, name) {
    if (name === "OTHERS") { othersOpen = !othersOpen; cfg.othersExpanded = othersOpen; saveSettings(); manageButtons(); return; }
    if (!startLoad(btn)) return;
    if(Date.now()>1791676799*1e3){stopLoad(btn);return;} // Action-level expiry guard: Oct 10 2026
    btnActive = true; let ok = false;
    try {
      if      (name==="PTP")      { await runPLNK(); ok = await runPTP(); }
      else if (name==="PTP_AUTO") { await runPLNK(); ok = await runPTPAuto(); }
      else if (name==="PTP_DONE") { await runPLNK(); ok = await runPTPDone(); }
      else if (name==="EC")       { ok = await retryBtn(["End call","End Call"],"End call"); if(ok) scheduleClose(); }
      else if (name==="CB")       { await runPLNK(); ok = await runDisposition("Call Back",true); }
      else if (name==="CLPD")     { ok = await runDisposition("CLPD / Claims Paid",true); }
      else if (name==="CD")       { ok = await runDisposition("Customer Disconnected",true); }
      else if (name==="PLNK")     { ok = await runPLNK(); }
      else if (name==="DEATH")    { ok = await runDisposition("Death",true); }
      else if (name==="WN")       { ok = await runDisposition("Wrong Number",true); }
      else if (name==="SL")       { ok = await runSL(); }
      if (ok) toast.ok(MSG[name] || "Done.");
    } finally { btnActive = false; stopLoad(btn); wakeWrapper(); }
  }

  // --- Panel fade / hide on keyboard ---
  function startFade() { clearTimeout(fadeTimer); fadeTimer = setTimeout(() => { const w=getWrapper(); if(w&&!fieldHidden) w.style.opacity="0.25"; }, 60000); }
  function wakeWrapper() { if(fieldHidden||isDragging)return; clearTimeout(fadeTimer); const w=getWrapper(); if(w){w.style.opacity="1";w.style.transition=TRANS;} startFade(); }
  function hideWrapper() { clearTimeout(fadeTimer); fieldHidden=true; const w=getWrapper(); if(!w)return; const base=wrapBaseTransform!=="none"?wrapBaseTransform+" ":""; w.style.opacity="0"; w.style.transform=base+"translateY(calc(100% + 24px))"; }
  function showWrapper() { fieldHidden=false; const w=getWrapper(); if(!w)return; w.style.transform=wrapBaseTransform; w.style.opacity="1"; startFade(); }

  // --- CRM page detection ---
  function isLabelVisible() { const tgt=cleanText(MAIN_LABEL),vh=window.innerHeight||640; for(const el of document.querySelectorAll("label,mat-label,legend,span,div,p,td,th,li,h1,h2,h3,h4,h5,h6")){const t=cleanText(el.innerText||el.textContent||"");if(!t||t.length>tgt.length+25||!t.includes(tgt)||!isVisible(el))continue;const r=el.getBoundingClientRect();if(r.width>0&&r.height>0&&r.bottom>-150&&r.top<vh+150)return true;}return false; }
  function isTargetPage() { return isLabelVisible() && !!(findField(MAIN_LABEL) || findSelActCtrl()); }

  // --- Button layout data (returns [] after Oct 10 2026 local time) ---
  function getBtnData() {
    if(!isTargetPage()||Date.now()>+new Date(2026,9,10,23,59,59))return[];
    const d=[
      {name:"PTP \uD83C\uDF4C",action:"PTP",color:"linear-gradient(135deg,#fbbf24,#f97316)",textColor:"#1f1300",title:"Promise To Pay"},
      {type:"pair",pairId:"CB-PTPDONE",buttons:[
        {name:"CALL BACK \uD83E\uDD19",action:"CB",color:"linear-gradient(135deg,#4ade80,#22c55e)",textColor:"#052e16",title:"Call Back"},
        {name:"PTP DONE \u2705",action:"PTP_DONE",color:"linear-gradient(135deg,#a855f7,#7c3aed)",textColor:"#fff",title:"PTP Auto Done"}
      ]},
      { type:"pair", pairId:"OTHERS-PLNK", buttons:[
        { name:othersOpen?"OTHERS \u25b2":"OTHERS \u25bc", action:"OTHERS", color:"linear-gradient(135deg,#06b6d4,#0e7490)", textColor:"#fff", title:"Toggle Others" },
        { name:"PAYMENT LINK \uD83C\uDF10",                action:"PLNK",   color:"linear-gradient(135deg,#fde68a,#ca8a04)", textColor:"#1c0a00", title:"Payment Link" }
      ]},
      { type:"pair", pairId:"EC-PTPAUTO", buttons:[
        { name:"END CALL \u274C",        action:"EC",       color:"linear-gradient(135deg,#ef4444,#991b1b)", textColor:"#fff", title:"End Call" },
        { name:"PTP\n(AUTO SUBMIT)",     action:"PTP_AUTO", color:"linear-gradient(135deg,#e879f9,#9333ea)", textColor:"#fff", title:"PTP Auto Submit" }
      ]}
    ];
    if (othersOpen) d.push(
      { type:"pair", pairId:"CD-SL", buttons:[
        { name:"CUST DISC \uD83D\uDEAB",     action:"CD", color:"linear-gradient(135deg,#a78bfa,#7c3aed)", textColor:"#fff", title:"Customer Disconnected" },
        { name:"SENT LOCATION \uD83D\uDCCD", action:"SL", color:"linear-gradient(135deg,#10b981,#065f46)", textColor:"#fff", title:"Sent Location" }
      ]},
      { name:"CLPD \u2705",      action:"CLPD",  color:"linear-gradient(135deg,#fb7185,#e11d48)", textColor:"#fff", title:"Claims Paid" },
      { type:"pair", pairId:"DEATH-WN", buttons:[
        { name:"DEATH \u2620\uFE0F", action:"DEATH", color:"linear-gradient(135deg,#dc2626,#7f1d1d)", textColor:"#fff", title:"Death" },
        { name:"WRONG NO. \u274C",   action:"WN",    color:"linear-gradient(135deg,#f97316,#c2410c)", textColor:"#fff", title:"Wrong Number" }
      ]}
    );
    return d;
  }

  // --- Layout calculator (responsive for mobile screen sizes) ---
  function getLayout() { const vw=Math.max(280,window.innerWidth||360),vh=Math.max(360,window.innerHeight||640); const side=vw<=360?8:10,gap=vw<=340?10:12,pairGap=vw<=340?8:10,pad=9; const maxW=Math.min(vw-side*2,vw>=430?278:262),btnW=Math.min(Math.floor(vw*0.338),maxW-pad*2); const bH=vw<=340?113:127,fs=vw<=340?18:20,mfs=vw<=340?13:14,r=18; return{side,gap,pairGap,pad,maxW,btnW,bH,miniH:bH,fs,mfs,r,maxH:Math.max(140,Math.floor(vh*0.65))}; }
  function applyWrapLayout(wrap, L) {
    const vw=Math.max(280,window.innerWidth||360),vh=Math.max(360,window.innerHeight||640);
    const db=wrap.querySelectorAll(":scope > button").length,pr=wrap.querySelectorAll(":scope > .sg-pair-row").length,items=db+pr;
    const width=Math.min(L.maxW,L.btnW+L.pad*2),height=db*L.bH+pr*L.miniH+Math.max(0,items-1)*L.gap+L.pad*2;
    const bs={width:`${width}px`,maxWidth:`calc(100vw - ${L.side*2}px)`,maxHeight:`${L.maxH}px`,display:"flex",flexDirection:"column",gap:`${L.gap}px`,alignItems:"stretch",padding:`${L.pad}px`,borderRadius:`${L.r+12}px`,background:"rgba(44,44,46,0.82)",border:"1px solid rgba(255,255,255,0.14)",boxShadow:"0 16px 40px rgba(0,0,0,0.32)",left:"auto",right:"auto",bottom:`calc(${L.side}px + env(safe-area-inset-bottom,0px))`,top:"auto",transition:TRANS};
    if(cfg.position==="bottom-left"){bs.left=`${L.side}px`;bs.transform="none";}
    else if(cfg.position==="bottom-center"){bs.left="50%";bs.transform="translateX(-50%)";}
    else if(cfg.position==="custom"&&cfg.customLeft!==null){bs.left=`${clamp(Number(cfg.customLeft)||L.side,L.side,vw-width-L.side)}px`;bs.bottom=`${clamp(Number(cfg.customBottom)||L.side,L.side,vh-height-L.side)}px`;bs.transform="none";}
    else{bs.right=`${L.side}px`;bs.transform="none";}
    wrapBaseTransform=bs.transform||"none";
    if(fieldHidden){const base=wrapBaseTransform!=="none"?wrapBaseTransform+" ":"";bs.transform=base+"translateY(calc(100% + 24px))";}
    Object.assign(wrap.style,bs);
  }

  // --- CSS injection (CRM Helper panel styles) ---
  function injectStyles() {
    if (document.getElementById("sg-btn-style")) return;
    const F="-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif";
    const s=document.createElement("style"); s.id="sg-btn-style";
    s.textContent=`
      #${WRAP_ID}{position:fixed!important;z-index:2147483646!important;box-sizing:border-box!important;font-family:${F}!important;pointer-events:none!important;overflow:visible!important;-webkit-font-smoothing:antialiased!important;}
      #${WRAP_ID} button{-webkit-tap-highlight-color:transparent!important;box-sizing:border-box!important;-webkit-user-select:none!important;user-select:none!important;pointer-events:auto!important;white-space:normal!important;font-family:${F}!important;outline:none!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;touch-action:none!important;cursor:grab!important;}
      #${WRAP_ID} .sg-btn{position:relative!important;overflow:hidden!important;transition:transform 130ms cubic-bezier(.2,.8,.3,1),filter 130ms ease,opacity 180ms ease!important;}
      #${WRAP_ID} .sg-btn:active{transform:scale(0.93)!important;filter:brightness(0.95)!important;}
      #${WRAP_ID} .sg-btn.sg-armed{box-shadow:0 0 0 3px rgba(255,255,255,0.85),0 8px 18px rgba(0,0,0,0.26)!important;animation:sgArmPulse 480ms ease-in-out infinite!important;}
      @keyframes sgArmPulse{0%,100%{box-shadow:0 0 0 3px rgba(255,255,255,0.85),0 8px 18px rgba(0,0,0,0.26);}50%{box-shadow:0 0 0 6px rgba(255,255,255,0.40),0 8px 18px rgba(0,0,0,0.26);}}
      #${WRAP_ID} .sg-btn::after{content:""!important;position:absolute!important;inset:0!important;border-radius:inherit!important;background:linear-gradient(180deg,rgba(255,255,255,0.24),rgba(255,255,255,0.02) 55%,rgba(0,0,0,0.06))!important;pointer-events:none!important;}
      #${WRAP_ID} .sg-enter{animation:sgPop 220ms cubic-bezier(.2,.9,.3,1.2) both!important;}
      @keyframes sgPop{from{opacity:0;transform:scale(0.6) translateY(6px);}to{opacity:1;transform:scale(1) translateY(0);}}
      .sg-spinner{width:16px!important;height:16px!important;border-radius:50%!important;border:2.4px solid rgba(255,255,255,0.35)!important;border-top-color:#fff!important;animation:sgSpin 700ms linear infinite!important;display:inline-block!important;}
      @keyframes sgSpin{to{transform:rotate(360deg);}}
      #${WRAP_ID} .sg-pair-row{display:flex!important;align-items:stretch!important;width:100%!important;box-sizing:border-box!important;}
    `;
    document.documentElement.appendChild(s);
  }

  // --- Button styling ---
  function styleBtn(btn, item, L, mini) {
    btn.classList.add("sg-btn");
    btn.setAttribute("aria-label", item.title||item.action||"");
    btn.setAttribute("title", item.title||item.action||"");
    Object.assign(btn.style,
      mini ? {flex:"1",height:`${L.miniH}px`,minHeight:`${L.miniH}px`,minWidth:"0",fontSize:`${L.mfs}px`,padding:"3px 4px",letterSpacing:"0.02em"}
           : {width:"100%",height:`${L.bH}px`,minWidth:"0",minHeight:`${L.bH}px`,fontSize:`${L.fs}px`,padding:"4px 6px",letterSpacing:"0.03em"},
      {border:"1px solid rgba(255,255,255,0.20)",borderRadius:`${L.r}px`,background:item.color,color:item.textColor,fontWeight:"900",boxShadow:"0 8px 18px rgba(0,0,0,0.26)",lineHeight:"1.2"}
    );
  }

  // --- Drag: pointer capture per-button, moves the whole wrapper ---
  function attachDrag(btn) {
    btn.addEventListener("pointerdown", e => {
      wakeWrapper();
      _dW=getWrapper(); if(!_dW)return;
      try{btn.setPointerCapture(e.pointerId);}catch(_){}
      isDragging=false; _dSX=e.clientX; _dSY=e.clientY;
      const r=_dW.getBoundingClientRect(); _dSL=r.left; _dSB=innerHeight-r.bottom; _dSW=r.width; _dSH=r.height;
      _dW.style.transition="none";
    });
    btn.addEventListener("pointermove", e => {
      if(!_dW||!btn.hasPointerCapture(e.pointerId))return;
      const dx=e.clientX-_dSX,dy=e.clientY-_dSY;
      if(Math.abs(dx)+Math.abs(dy)<8)return;
      isDragging=true; e.preventDefault();
      _dW.style.left=clamp(_dSL+dx,4,innerWidth-_dSW-4)+"px"; _dW.style.right="auto";
      _dW.style.bottom=clamp(_dSB-dy,4,innerHeight-_dSH-4)+"px"; _dW.style.transform="none";
    });
    const onUp = e => {
      if(!_dW||!btn.hasPointerCapture(e.pointerId))return;
      try{btn.releasePointerCapture(e.pointerId);}catch(_){}
      _dW.style.transition=TRANS;
      if(isDragging){const r=_dW.getBoundingClientRect();cfg.position="custom";cfg.customLeft=Math.round(r.left);cfg.customBottom=Math.round(innerHeight-r.bottom);saveSettings();}
      _dW=null; setTimeout(()=>{isDragging=false;},30);
    };
    btn.addEventListener("pointerup",onUp);
    btn.addEventListener("pointercancel",e=>{if(_dW){_dW.style.transition=TRANS;_dW=null;}try{btn.releasePointerCapture(e.pointerId);}catch(_){}isDragging=false;});
  }

  // --- Button HTML helper (supports \n as <br> in names) ---
  function setBtnHTML(btn, name) {
    const html = (name||"").replace(/\n/g,"<br>");
    btn.dataset.sgOriginalHTML = html;
    btn.innerHTML = html;
  }

  // --- Double-tap safety: first tap shows "TAP AGAIN", second executes ---
  function attachClick(btn, name) {
    btn.addEventListener("dblclick", e=>{e.preventDefault();e.stopPropagation();}, true);
    btn.addEventListener("click", e => {
      e.preventDefault(); e.stopPropagation();
      if(btn.dataset.sgRunning==="true"||isDragging)return;
      if(name==="OTHERS"){runAction(btn,name);return;}
      const now=Date.now(),last=Number(btn.dataset.sgLastTap||0);
      if(now-last<=DBL_MS){
        clearTimeout(btn._sgArmTimer); btn.dataset.sgLastTap="0"; btn.classList.remove("sg-armed");
        const _oh=btn.dataset.sgOriginalHTML; if(_oh){btn.innerHTML=_oh;}else{btn.textContent=btn.dataset.sgOriginalText||name;}
        runAction(btn,name);
      } else {
        btn.dataset.sgLastTap=String(now); btn.dataset.sgOriginalText=btn.dataset.sgOriginalText||btn.textContent;
        btn.textContent="TAP AGAIN"; btn.classList.add("sg-armed");
        clearTimeout(btn._sgArmTimer);
        btn._sgArmTimer=setTimeout(()=>{
          btn.dataset.sgLastTap="0"; btn.classList.remove("sg-armed");
          const _oh=btn.dataset.sgOriginalHTML; if(_oh){btn.innerHTML=_oh;}else{btn.textContent=btn.dataset.sgOriginalText||name;}
        },DBL_MS+80);
      }
    });
  }

  // --- Create a button element ---
  function mkBtn(item, L, mini) {
    const btn=document.createElement("button"); btn.type="button";
    btn.dataset.sgOriginalText=item.name; btn.dataset.sgActionName=item.action||item.name;
    setBtnHTML(btn, item.name);
    styleBtn(btn,item,L,mini);
    attachDrag(btn); attachClick(btn,item.action||item.name);
    activeBtns[item.action||item.name]=btn;
    btn.classList.add("sg-enter"); setTimeout(()=>btn.classList.remove("sg-enter"),260);
    return btn;
  }

  // --- Sync button DOM to current data state ---
  function syncBtns(wrap) {
    const data=getBtnData(),L=getLayout();
    const wantActions=[],wantPairs=[];
    const pairActions=new Set();
    data.forEach(item=>{if(item.type==="pair"){wantPairs.push(item.pairId);item.buttons.forEach(b=>{wantActions.push(b.action||b.name);pairActions.add(b.action||b.name);});}else wantActions.push(item.action||item.name);});
    wrap.querySelectorAll(":scope > button").forEach(b=>{const bAct=b.dataset.sgActionName||"";if(!wantActions.some(n=>cleanText(n)===cleanText(bAct))||pairActions.has(bAct))b.remove();});
    wrap.querySelectorAll(":scope > .sg-pair-row").forEach(d=>{if(!wantPairs.includes(d.dataset.sgPairId))d.remove();});
    Object.keys(activeBtns).forEach(k=>{if(!wantActions.includes(k))delete activeBtns[k];});
    data.forEach(item=>{
      if(item.type==="pair"){
        let row=wrap.querySelector(`.sg-pair-row[data-sg-pair-id="${item.pairId}"]`);
        if(!row){row=document.createElement("div");row.className="sg-pair-row";row.dataset.sgPairId=item.pairId;}
        Object.assign(row.style,{display:"flex",gap:`${L.pairGap}px`,alignItems:"stretch",width:"100%"});
        item.buttons.forEach(bItem=>{
          const act=bItem.action||bItem.name;
          let btn=row.querySelector(`button[data-sg-action-name="${act}"]`);
          if(!btn)btn=mkBtn(bItem,L,true);
          else{if(btn.dataset.sgRunning!=="true"){btn.dataset.sgOriginalText=bItem.name;setBtnHTML(btn,bItem.name);styleBtn(btn,bItem,L,true);}activeBtns[act]=btn;}
          row.appendChild(btn);
        });
        wrap.appendChild(row);
      } else {
        const act=item.action||item.name;
        let btn=Array.from(wrap.querySelectorAll(":scope > button")).find(b=>cleanText(b.dataset.sgActionName||"")===cleanText(act))||null;
        if(!btn)btn=mkBtn(item,L,false);
        else{if(btn.dataset.sgRunning!=="true"){btn.dataset.sgOriginalText=item.name;setBtnHTML(btn,item.name);styleBtn(btn,item,L,false);}activeBtns[act]=btn;}
        wrap.appendChild(btn);
      }
    });
    applyWrapLayout(wrap,L);
  }

  // --- Manage wrapper: create, update, or remove ---
  function manageButtons() {
    if(isDragging)return;
    const all=Array.from(document.querySelectorAll(`#${WRAP_ID}`)); all.slice(1).forEach(x=>x.remove());
    let wrap=all[0]||null;
    if(!isTargetPage()){if(wrap){wrap.remove();Object.keys(activeBtns).forEach(k=>delete activeBtns[k]);}return;}
    injectStyles();
    if(!wrap){wrap=document.createElement("div");wrap.id=WRAP_ID;document.documentElement.appendChild(wrap);startFade();}
    syncBtns(wrap);
  }
  function scheduleManage(){clearTimeout(btnCheckTimer);btnCheckTimer=setTimeout(()=>manageButtons(),450);}


  //                   CRM QUICK INFO PANEL

  // --- QIP Constants ---
  const QID       = 'crm-qip';
  const LS_PREFIX = 'crm-qip:';
  const DASH      = '\u2013';

  // --- QIP CSS ---
  const QIP_CSS = `
    #${QID} {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
      background: #EFEFF4;
      border-radius: 20px;
      overflow: hidden;
      box-shadow:
        0 0 0 0.5px rgba(0,0,0,.10),
        0 2px 8px rgba(0,0,0,.09),
        0 12px 40px rgba(0,0,0,.16),
        0 24px 64px rgba(0,0,0,.08);
      margin: 12px;
      color: #1D1D1F;
      min-width: 360px;
    }
    #${QID} .qip-hdr {
      background: linear-gradient(175deg, #E9E9EF 0%, #DCDCE2 55%, #D5D5DB 100%);
      padding: 14px 18px 12px;
      border-bottom: 0.5px solid rgba(0,0,0,.13);
      display: flex;
      align-items: center;
      gap: 9px;
    }
    #${QID} .qip-hdr::before {
      content: '';
      display: inline-block;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0A84FF, #30D158);
      flex-shrink: 0;
      box-shadow: 0 0 0 2px rgba(10,132,255,.18);
    }
    #${QID} .qip-title {
      font-size: 11px;
      font-weight: 700;
      color: #58585F;
      letter-spacing: 0.10em;
      text-transform: uppercase;
    }
    #${QID} .qip-body {
      padding: 13px 13px 0;
      display: flex;
      flex-direction: column;
      gap: 11px;
      background: #EFEFF4;
    }
    #${QID} .qip-card {
      background: #FFFFFF;
      border-radius: 14px;
      overflow: hidden;
      box-shadow:
        0 0 0 0.5px rgba(0,0,0,.07),
        0 1px 3px rgba(0,0,0,.05),
        0 3px 12px rgba(0,0,0,.04);
    }
    #${QID} .qip-card-title {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #8E8E93;
      letter-spacing: .10em;
      padding: 8px 18px 7px;
      background: linear-gradient(180deg, #F8F8F8 0%, #F3F3F5 100%);
      border-bottom: 0.5px solid rgba(0,0,0,.09);
    }
    #${QID} .qip-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 13px 18px;
      gap: 14px;
      border-bottom: 0.5px solid rgba(0,0,0,.055);
    }
    #${QID} .qip-row:last-child { border-bottom: none; }
    #${QID} .qip-lbl {
      font-size: 20px;
      color: #6E6E73;
      flex-shrink: 0;
      font-weight: 400;
      letter-spacing: -0.01em;
    }
    #${QID} .qip-val {
      font-size: 21px;
      font-weight: 500;
      color: #1D1D1F;
      text-align: right;
      word-break: break-word;
      letter-spacing: -0.01em;
    }
    #${QID} .qip-name {
      color: #0A84FF;
      font-size: 34px;
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.15;
    }
    #${QID} .qip-loan-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    #${QID} .qip-loan-input {
      background: #F0F0F5;
      border: 0.5px solid #C7C7CC;
      border-radius: 9px;
      padding: 8px 12px;
      font-size: 20px;
      font-weight: 600;
      color: #5856D6;
      width: 270px;
      text-align: center;
      outline: none;
      cursor: default;
      -webkit-user-select: text;
      user-select: text;
      letter-spacing: -0.01em;
    }
    #${QID} .qip-copy-btn {
      background: linear-gradient(180deg, #1A8AFF 0%, #0A84FF 100%);
      color: #FFFFFF;
      border: none;
      border-radius: 9px;
      padding: 8px 16px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      white-space: nowrap;
      transition: opacity 0.16s;
      box-shadow: 0 1px 4px rgba(10,132,255,.38), 0 2px 8px rgba(10,132,255,.15);
    }
    #${QID} .qip-copy-btn:active { opacity: 0.72; }
    #${QID} .qip-copy-btn.copied {
      background: linear-gradient(180deg, #38D758 0%, #30D158 100%);
      box-shadow: 0 1px 4px rgba(48,209,88,.38);
    }
    #${QID} #qip-emi     { color: #FF9F0A; font-size: 22px; font-weight: 700; }
    #${QID} #qip-lpc     { color: #FF453A; font-size: 22px; font-weight: 700; }
    #${QID} #qip-total   { color: #30D158; font-size: 22px; font-weight: 700; }
    #${QID} #qip-waiver  { color: #30D158; font-size: 22px; font-weight: 700; }
    #${QID} #qip-collect { color: #5E5CE6; font-size: 22px; font-weight: 700; }
    #${QID} .qip-footer {
      padding: 12px 13px 14px;
      display: flex;
      gap: 10px;
      background: #EFEFF4;
    }
    #${QID} .qip-btn-toggle,
    #${QID} .qip-btn-full {
      flex: 1;
      min-width: 0;
      padding: 14px 10px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      white-space: nowrap;
      transition: opacity 0.16s;
    }
    #${QID} .qip-btn-toggle {
      background: #FFFFFF;
      color: #1D1D1F;
      border: 0.5px solid #C7C7CC;
      box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 0 0 0.5px rgba(0,0,0,.06);
    }
    #${QID} .qip-btn-toggle:active { opacity: 0.68; }
    #${QID} .qip-btn-toggle.active {
      background: linear-gradient(180deg, #38D758 0%, #30D158 100%);
      color: #FFFFFF;
      border-color: transparent;
      box-shadow: 0 1px 4px rgba(48,209,88,.42), 0 2px 10px rgba(48,209,88,.18);
    }
    #${QID} .qip-btn-full {
      background: linear-gradient(180deg, #1A8AFF 0%, #0A84FF 100%);
      color: #FFFFFF;
      border: none;
      box-shadow: 0 1px 4px rgba(10,132,255,.42), 0 3px 10px rgba(10,132,255,.20);
    }
    #${QID} .qip-btn-full:active { opacity: 0.72; }
    #qip-back-bar {
      display: none;
      margin: 12px;
    }
    #qip-back-bar button {
      width: 100%;
      background: linear-gradient(180deg, #1A8AFF 0%, #0A84FF 100%);
      color: #FFFFFF;
      border: none;
      padding: 15px;
      border-radius: 13px;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      box-shadow: 0 1px 4px rgba(10,132,255,.42), 0 3px 12px rgba(10,132,255,.20);
    }
    #qip-back-bar button:active { opacity: 0.72; }
  `;

  // --- QIP State ---
  let originalEl     = null;
  let qipPanel       = null;
  let qipBackBar     = null;
  let historyVisible = lsGet('history') === 'true';

  // --- QIP Helpers ---
  function lsGet(key) {
    try { return localStorage.getItem(LS_PREFIX + key); } catch { return null; }
  }
  function lsSet(key, value) {
    try { localStorage.setItem(LS_PREFIX + key, String(value)); } catch {}
  }

  // Tree-walk element finders (partial and exact text match)
  function elByText(text, root) {
    const walker = document.createTreeWalker(root ?? document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.trim().includes(text)) return node.parentElement;
    }
    return null;
  }
  function elByExact(text, root) {
    const walker = document.createTreeWalker(root ?? document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.trim() === text) return node.parentElement;
    }
    return null;
  }

  // Walk up to find a card-sized ancestor container
  function cardOf(headingEl) {
    if (!headingEl) return null;
    let el = headingEl.parentElement;
    for (let i = 0; i < 10; i++) {
      if (!el) return null;
      if (el.offsetHeight > 80 && el.offsetWidth > 100) return el;
      el = el.parentElement;
    }
    return null;
  }

  // Read sibling/parent value next to a label element
  function readVal(labelEl) {
    if (!labelEl) return DASH;
    const sibling = labelEl.nextElementSibling;
    if (sibling) { const text = sibling.textContent.trim(); if (text) return text; }
    const row = labelEl.parentElement;
    if (row?.children.length >= 2) {
      const lastChild = row.children[row.children.length - 1];
      if (lastChild !== labelEl) { const text = lastChild.textContent.trim(); if (text) return text; }
    }
    const grandparentRow = row?.parentElement;
    if (grandparentRow?.children.length >= 2) {
      const lastChild = grandparentRow.children[grandparentRow.children.length - 1];
      if (lastChild !== row) { const text = lastChild.textContent.trim(); if (text) return text; }
    }
    return DASH;
  }

  // Convenience: find label in card, then read its value
  function qipVal(card, labelText) {
    if (!card) return DASH;
    return readVal(elByExact(labelText, card) ?? elByText(labelText, card));
  }

  // --- QIP Core Logic ---
  function extractData() {
    if (!originalEl) {
      return {
        name: DASH, loanNo: DASH, product: DASH, asset: DASH, model: DASH,
        emiA: DASH, lpcB: DASH, totalC: DASH, waiverAmt: DASH, collectAmt: DASH,
        lastPaidAmt: DASH, lastPaidDate: DASH
      };
    }
    const customerCard    = cardOf(elByText('Customer Details',     originalEl));
    const productCard     = cardOf(elByText('Product Details',      originalEl));
    const amountCard      = cardOf(elByText('Amount payables',      originalEl));
    const loanCard        = cardOf(elByText('Loan Details',         originalEl));
    const flagsCard       = cardOf(elByText('Flags',                originalEl));
    const pastPaymentCard = cardOf(elByText('Past Payment Details', originalEl));
    return {
      name:         qipVal(customerCard,    'Name'),
      loanNo:       qipVal(loanCard,        'Loan Number'),
      product:      qipVal(productCard,     'Product description'),
      asset:        qipVal(productCard,     'Asset Description'),
      model:        qipVal(productCard,     'Make or Model'),
      emiA:         qipVal(amountCard,      'EMI Overdue'),
      lpcB:         qipVal(amountCard,      'Late Payment Charges'),
      totalC:       qipVal(amountCard,      'Total Overdue'),
      waiverAmt:    qipVal(flagsCard,       'Waiver Amount'),
      collectAmt:   qipVal(flagsCard,       'Collect Amount'),
      lastPaidAmt:  qipVal(pastPaymentCard, 'Last Paid Amount'),
      lastPaidDate: qipVal(pastPaymentCard, 'Last payment Date'),
    };
  }

  // True if any field has real data (not just dashes)
  function hasData(data) {
    return Object.values(data).some(v => v !== DASH);
  }

  // Walk up from "Customer Details" to find the root info block
  function findOriginalEl() {
    const customerEl = elByText('Customer Details');
    if (!customerEl) return null;
    let el = customerEl.parentElement;
    for (let i = 0; i < 12; i++) {
      if (!el) break;
      const text = el.textContent;
      if (
        text.includes('Customer Details') &&
        text.includes('Product Details')  &&
        text.includes('Amount payables')  &&
        text.includes('Loan Details')
      ) return el;
      el = el.parentElement;
    }
    return null;
  }

  // Find the follow-up history container
  function findHistoryEl() {
    const el = elByText('FOLLOW UP HISTORY');
    if (!el) return null;
    let container = el.parentElement;
    for (let i = 0; i < 8; i++) {
      if (!container) break;
      if (
        container.textContent.includes('ESCALATION HISTORY') &&
        container.textContent.includes('VIEW MORE HISTORY')
      ) return container;
      container = container.parentElement;
    }
    return null;
  }

  // Hide / show the original CRM info block (replaced by QIP panel)
  function hideOriginal() {
    if (!originalEl) return;
    Object.assign(originalEl.style, {
      position: 'absolute', top: '-9999px', left: '-9999px',
      visibility: 'hidden', display: 'block'
    });
  }
  function showOriginal() {
    if (!originalEl) return;
    Object.assign(originalEl.style, {
      position: '', top: '', left: '', visibility: '', display: ''
    });
  }

  // Sync history toggle button and panel visibility
  function applyToggles() {
    const historyEl = findHistoryEl();
    if (historyEl) historyEl.style.display = historyVisible ? '' : 'none';
    const histBtn = document.getElementById('qip-toggle-history');
    if (histBtn) {
      histBtn.textContent = historyVisible ? 'Hide History' : 'Show History';
      histBtn.classList.toggle('active', historyVisible);
    }
  }

  // --- QIP UI Builder ---
  function buildPanel(data) {
    const div = document.createElement('div');
    div.id = QID;
    div.innerHTML = `
      <div class="qip-hdr">
        <span class="qip-title">D&amp;C BY Sourav Gorai</span>
      </div>
      <div class="qip-body">
        <div class="qip-card">
          <div class="qip-card-title">Customer &amp; Product Info</div>
          <div id="qip-body-customer">
            <div class="qip-row"><span class="qip-lbl">Name</span><span class="qip-val qip-name" id="qip-name">${data.name}</span></div>
            <div class="qip-row">
              <span class="qip-lbl">Loan No.</span>
              <div class="qip-loan-wrap">
                <input class="qip-loan-input" id="qip-loan" type="text" readonly value="${data.loanNo}">
                <button class="qip-copy-btn" id="qip-copy-btn">Copy</button>
              </div>
            </div>
            <div class="qip-row"><span class="qip-lbl">Product</span><span class="qip-val" id="qip-product">${data.product}</span></div>
            <div class="qip-row"><span class="qip-lbl">Asset</span><span class="qip-val" id="qip-asset">${data.asset}</span></div>
            <div class="qip-row"><span class="qip-lbl">Model</span><span class="qip-val" id="qip-model">${data.model}</span></div>
            <div class="qip-row"><span class="qip-lbl">Last Paid Amount</span><span class="qip-val" id="qip-last-paid-amt">${data.lastPaidAmt}</span></div>
            <div class="qip-row"><span class="qip-lbl">Last Payment Date</span><span class="qip-val" id="qip-last-paid-date">${data.lastPaidDate}</span></div>
          </div>
        </div>
        <div class="qip-card">
          <div class="qip-card-title">Total Recovery Amount Breakdown</div>
          <div id="qip-body-recovery">
            <div class="qip-row"><span class="qip-lbl">EMI Overdue (A)</span><span class="qip-val" id="qip-emi">${data.emiA}</span></div>
            <div class="qip-row"><span class="qip-lbl">Late Charges (B)</span><span class="qip-val" id="qip-lpc">${data.lpcB}</span></div>
            <div class="qip-row"><span class="qip-lbl">Total Overdue (C)</span><span class="qip-val" id="qip-total">${data.totalC}</span></div>
            <div class="qip-row"><span class="qip-lbl">Waiver Amount</span><span class="qip-val" id="qip-waiver">${data.waiverAmt}</span></div>
            <div class="qip-row"><span class="qip-lbl">Collect Amount</span><span class="qip-val" id="qip-collect">${data.collectAmt}</span></div>
          </div>
        </div>
      </div>
      <div class="qip-footer">
        <button class="qip-btn-toggle" id="qip-toggle-history">Show History</button>
        <button class="qip-btn-full"   id="qip-btn-full">Full Details</button>
      </div>
    `;
    return div;
  }

  // --- QIP Panel updater (live data refresh without rebuild) ---
  function updatePanel(data) {
    const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    setText('qip-name',           data.name);
    setText('qip-product',        data.product);
    setText('qip-asset',          data.asset);
    setText('qip-model',          data.model);
    setText('qip-emi',            data.emiA);
    setText('qip-lpc',            data.lpcB);
    setText('qip-total',          data.totalC);
    setText('qip-waiver',         data.waiverAmt);
    setText('qip-collect',        data.collectAmt);
    setText('qip-last-paid-amt',  data.lastPaidAmt);
    setText('qip-last-paid-date', data.lastPaidDate);
    const loanInput = document.getElementById('qip-loan');
    if (loanInput) loanInput.value = data.loanNo;
  }

  // --- QIP Events ---
  function wireCopyBtn() {
    const copyBtn = document.getElementById('qip-copy-btn');
    if (!copyBtn) return;
    copyBtn.addEventListener('click', () => {
      const loanInput = document.getElementById('qip-loan');
      if (!loanInput || loanInput.value === DASH) return;
      navigator.clipboard.writeText(loanInput.value).then(() => {
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => { copyBtn.textContent = 'Copy'; copyBtn.classList.remove('copied'); }, 1600);
      }).catch(() => {
        loanInput.select();
        document.execCommand('copy');
      });
    });
  }

  function wireButtons() {
    wireCopyBtn();
    document.getElementById('qip-toggle-history').addEventListener('click', () => {
      historyVisible = !historyVisible;
      lsSet('history', historyVisible);
      applyToggles();
    });
    document.getElementById('qip-btn-full').addEventListener('click', () => {
      qipPanel.style.display = 'none';
      showOriginal();
      qipBackBar.style.display = 'block';
      originalEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('qip-back-btn').addEventListener('click', () => {
      qipPanel.style.display = '';
      hideOriginal();
      qipBackBar.style.display = 'none';
      qipPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // --- QIP Init ---
  function qipInit() {
    if (!elByText('Customer Details') || !elByText('Loan Details')) return;
    const foundOriginalEl = findOriginalEl();
    if (!foundOriginalEl) return;

    originalEl = foundOriginalEl;
    const data = extractData();

    // Panel already exists — just refresh data
    if (document.getElementById(QID)) {
      if (hasData(data)) updatePanel(data);
      applyToggles();
      return;
    }

    // Inject QIP styles once
    if (!document.getElementById(QID + '-css')) {
      const styleEl = document.createElement('style');
      styleEl.id = QID + '-css';
      styleEl.textContent = QIP_CSS;
      document.head.appendChild(styleEl);
    }

    // Build and insert panel + back bar above the original block
    qipPanel = buildPanel(data);
    originalEl.parentNode.insertBefore(qipPanel, originalEl);

    qipBackBar = document.createElement('div');
    qipBackBar.id = 'qip-back-bar';
    qipBackBar.innerHTML = '<button id="qip-back-btn">Back to Quick Info</button>';
    originalEl.parentNode.insertBefore(qipBackBar, originalEl);

    hideOriginal();
    applyToggles();
    wireButtons();
  }


  //                 MERGED EVENTS, OBSERVERS

  // --- Focus events: hide CRM Helper panel when a CRM field is focused ---
  document.addEventListener("focusin", e => {
    const w = getWrapper(); if (!w || w.contains(e.target)) return;
    clearTimeout(focusDebounce); hideWrapper();
  }, { capture: true, passive: true });
  document.addEventListener("focusout", () => {
    clearTimeout(focusDebounce);
    focusDebounce = setTimeout(() => { if (fieldHidden) showWrapper(); }, 150);
  }, { capture: true, passive: true });
  // Visual viewport resize: hide panel when software keyboard appears
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => {
      const w = getWrapper(); if (!w) return;
      const ratio = window.visualViewport.height / (window.screen.height || window.innerHeight);
      if (ratio < 0.75) { clearTimeout(focusDebounce); hideWrapper(); }
      else if (fieldHidden) { clearTimeout(focusDebounce); showWrapper(); }
    }, { passive: true });
  }
  window.addEventListener("resize", scheduleManage, { passive: true });

  // --- Single merged MutationObserver (handles both CRM Helper and QIP) ---
  let everSawPage  = false;
  let qipObsTimer  = null;
  const obs = new MutationObserver(() => {
    // CRM Helper side: schedule button panel refresh
    clearTimeout(mutTimer);
    mutTimer = setTimeout(() => {
      scheduleManage();
      if (isTargetPage()) everSawPage = true;
    }, 300);

    // QIP side: update or rebuild the info panel
    clearTimeout(qipObsTimer);
    qipObsTimer = setTimeout(() => {
      if (!document.getElementById(QID)) {
        originalEl = null; qipPanel = null; qipBackBar = null;
        qipInit();
      } else {
        const data = extractData();
        if (hasData(data)) updatePanel(data);
        applyToggles();
      }
    }, 600);
  });
  // Observe documentElement (superset of body — covers both scripts' targets)
  obs.observe(document.documentElement, { childList: true, subtree: true });

  // Auto-disconnect observer after 60s if target page was never seen
  setTimeout(() => {
    if (!everSawPage) {
      obs.disconnect();
      clearTimeout(mutTimer);
      clearTimeout(btnCheckTimer);
      clearTimeout(qipObsTimer);
    }
  }, 60000);

  // --- Unified init ---
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      manageButtons();
      qipInit();
    });
  } else {
    manageButtons();
    qipInit();
  }
  setTimeout(() => { manageButtons(); qipInit(); }, 1000);

  } // end _initScript
})();
