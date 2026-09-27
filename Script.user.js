// ==UserScript==
// @name         souravgoraiCRMhelper
// @namespace    https://sourav1st.netlify.app/
// @version      1.5
// @description  this will help you to work more efficiently in ONE CRM.
// @author       Sourav Gorai
// @match        https://*/*
// @run-at       document-idle
// @license      Copyright (c) 2026 Sourav Gorai. All rights reserved.
// @grant        GM_xmlhttpRequest
// @connect      gist.githubusercontent.com
// @downloadURL https://update.greasyfork.org/scripts/594169/souravgoriCRMhelper.user.js
// @updateURL https://update.greasyfork.org/scripts/594169/souravgoriCRMhelper.meta.js
// ==/UserScript==

(() => {
  "use strict";
  if(window.__CRM_HELPER_v2__)return;
  window.__CRM_HELPER_v2__=true;
  if(Date.now()>179167*1e7+6799e3)return;
  const _kk='sg_crm_ks_ts',_kc=localStorage.getItem(_kk);
  let _rc=0;
  if(_kc&&(Date.now()-+_kc)<864e5){_initScript();}else _req();
  function _vOk(c,m){if(!m)return true;const[a1,a2]=c.split('.').map(Number),[b1,b2]=m.split('.').map(Number);return a1>b1||(a1===b1&&a2>=b2);}
  function _req(){if(_rc++>=5)return;GM_xmlhttpRequest({method:'GET',timeout:8e3,
    url:'https://gist.githubusercontent.com/spur'+'avgorai755-cyber/2dd4cfbdf58cdaa'+'bf31c213c8bfb9433/raw/status.json',
    onload(r){try{const d=JSON.parse(r.responseText);if(!d.active||!_vOk('1.3',d.minVersion))return;localStorage.setItem(_kk,String(Date.now()));_initScript();}catch(_){setTimeout(_req,18e3);}},
    onerror(){setTimeout(_req,18e3);},ontimeout(){setTimeout(_req,18e3);}});}

  function _initScript() {

  // CONSTANTS
  const MAIN_LABEL   = "Select Disposition Code";
  const WRAP_ID      = "sg-crm-wrap";
  const WHEEL_ID     = "sg-ptp-wheel";   // v2.0.0 â€” PTP radial wheel overlay
  const SETTINGS_KEY = "sg_crm_mobile_settings_v3";
  const CTRL_SEL     = "select,input:not([type='hidden']),textarea,[role='combobox'],[aria-haspopup='listbox'],[contenteditable='true']";
  const OPT_SEL      = "[role='option'],.ant-select-item-option,.mat-option,.mat-mdc-option,.select2-results__option,.ng-option,.MuiAutocomplete-option,li[aria-selected],div[aria-selected]";
  const DATE_TOKEN   = "__DATE__";
  const TIME_TOKEN   = "__TIME__";
  const DBL_MS       = 400;
  const TRANS        = "background 200ms ease,box-shadow 200ms ease,padding 180ms ease,opacity 400ms ease,transform 220ms cubic-bezier(.4,0,.2,1)";

  // DISPOSITION RULES
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

  // STATE
  let btnActive = false, cancelRequested = false, btnCheckTimer = null, mutTimer = null, fadeTimer = null;
  let pendingBtn = null, pendingName = null;
  let fieldHidden = false, focusDebounce = null, wrapBaseTransform = "none";
  let isDragging = false, _dW = null, _dSX = 0, _dSY = 0, _dSL = 0, _dSB = 0, _dSW = 0, _dSH = 0;
  const activeBtns = {};
  // v2.0.0: D&C banner state â€” track element so we show immediately on click
  let _dncBanner = null, _dncBannerTimer = null;
  if(1791676799e3<Date.now())return;

  // SETTINGS
  const DEF_CFG = { position: "bottom-right", customLeft: null, customBottom: null, othersExpanded: false };
  function loadSettings() { try { return Object.assign({}, DEF_CFG, JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")); } catch (_) { return Object.assign({}, DEF_CFG); } }
  function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(cfg)); } catch (_) {} }
  const cfg = loadSettings();
  let othersOpen = cfg.othersExpanded === true;

  // UTILITIES
  const wait  = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function cleanText(t) { return String(t || "").replace(/\*/g, " ").replace(/\u00a0/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").toLowerCase().trim().replace(/\s+/g, " "); }
  function isVisible(el) { if (!el) return false; const s = window.getComputedStyle(el); if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0") return false; const r = el.getBoundingClientRect(); return r.width > 0 || r.height > 0 || el.getClientRects().length > 0; }
  function isDisabled(el) { return !!(el.disabled || el.getAttribute("aria-disabled") === "true" || el.closest("[disabled],[aria-disabled='true']")); }
  function visibleControls(root) { return root ? Array.from(root.querySelectorAll(CTRL_SEL)).filter(el => isVisible(el) && !isDisabled(el)) : []; }
  function labelMatch(a, b) { const s = cleanText(a), t = cleanText(b); return !!(s && t && (s === t || s.includes(t))); }
  function getWrapper() { return document.getElementById(WRAP_ID); }

  // FIELD FINDING
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

  // VALUE SETTING
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

  // TOAST
  function showToast(msg, isErr) {
    let stack = document.getElementById("sg-toasts");
    if (!stack) { stack = document.createElement("div"); stack.id = "sg-toasts"; Object.assign(stack.style, { position:"fixed", left:"50%", top:"50%", transform:"translate(-50%,-50%)", zIndex:"2147483647", display:"flex", flexDirection:"column", alignItems:"center", gap:"12px", pointerEvents:"none", width:"min(400px,calc(100vw - 24px))" }); document.documentElement.appendChild(stack); }
    const t = document.createElement("div"); t.setAttribute("role","status");
    const ic = document.createElement("span"); ic.textContent = isErr===true ? "\u2605" : isErr==="warn" ? "\u26A0\uFE0F" : "\u2714\uFE0E";
    Object.assign(ic.style, { display:"inline-flex", alignItems:"center", justifyContent:"center", width:"20px", height:"20px", borderRadius:"50%", background:"rgba(255,255,255,0.2)", fontSize:"12px", flexShrink:"0" });
    const tx = document.createElement("span"); tx.textContent = msg; tx.style.flex = "1";
    t.append(ic, tx);
    Object.assign(t.style, { display:"flex", alignItems:"center", gap:"10px", background: isErr===true ? "linear-gradient(135deg,rgba(190,18,60,.97),rgba(127,29,29,.97))" : isErr==="warn" ? "linear-gradient(135deg,rgba(180,83,9,.97),rgba(120,53,15,.97))" : "linear-gradient(135deg,rgba(22,163,74,.97),rgba(21,128,61,.97))", color:"#fff", padding:"11px 15px", borderRadius:"16px", fontSize:"13px", fontWeight:"700", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif", boxShadow:"0 12px 34px rgba(0,0,0,.4)", maxWidth:"100%", lineHeight:"1.35", border:"1px solid rgba(255,255,255,.2)", backdropFilter:"blur(12px)", pointerEvents:"none" });
    stack.appendChild(t);
    const all = stack.querySelectorAll("[role='status']"); if (all.length > 3) all[0].remove();
    setTimeout(() => { t.style.transition="opacity 220ms ease,transform 220ms ease"; t.style.opacity="0"; t.style.transform="translateY(8px) scale(.97)"; setTimeout(() => t.parentNode && t.remove(), 240); }, isErr===true ? 5400 : isErr==="warn" ? 4800 : 5000);
  }
  const toast = { ok: m => showToast(m, false), err: m => showToast(m, true), warn: m => showToast(m, "warn") };

  // D&C BANNER â€” v2.0.0: shows immediately on button click, dismiss triggered on success
  function _ensureDncStack() {
    let stack = document.getElementById("sg-toasts");
    if (!stack) { stack = document.createElement("div"); stack.id = "sg-toasts"; Object.assign(stack.style, { position:"fixed", left:"50%", top:"50%", transform:"translate(-50%,-50%)", zIndex:"2147483647", display:"flex", flexDirection:"column", alignItems:"center", gap:"12px", pointerEvents:"none", width:"min(400px,calc(100vw - 24px))" }); document.documentElement.appendChild(stack); }
    return stack;
  }
  function showDnCBanner() {
    const stack = _ensureDncStack();
    if (_dncBanner && _dncBanner.parentNode) _dncBanner.remove();
    clearTimeout(_dncBannerTimer); _dncBanner = null;
    const b = document.createElement("div");
    Object.assign(b.style, { display:"block", textAlign:"center", background:"linear-gradient(135deg,rgba(10,84,255,.97),rgba(48,93,209,.97))", color:"#fff", padding:"22px 28px", borderRadius:"20px", fontSize:"24px", fontWeight:"900", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif", letterSpacing:"0.06em", boxShadow:"0 20px 56px rgba(0,0,0,.55)", border:"1.5px solid rgba(255,255,255,.25)", backdropFilter:"blur(20px)", pointerEvents:"none", width:"100%", boxSizing:"border-box", textShadow:"0 1px 6px rgba(0,0,0,.25)" });
    b.textContent = "D & C by SOURAV GORAI";
    stack.insertBefore(b, stack.firstChild);
    _dncBanner = b;
    // Auto-safety: remove after 30s if startDnCDismiss is never called
    _dncBannerTimer = setTimeout(() => { if (_dncBanner === b) removeDnCBanner(); }, 30000);
  }
  // Call when action succeeds â€” starts the standard dismiss countdown
  function startDnCDismiss() {
    if (!_dncBanner || !_dncBanner.parentNode) return;
    clearTimeout(_dncBannerTimer);
    const b = _dncBanner;
    _dncBannerTimer = setTimeout(() => {
      b.style.transition = "opacity 220ms ease,transform 220ms ease";
      b.style.opacity = "0"; b.style.transform = "scale(.97)";
      setTimeout(() => { if (b.parentNode) b.remove(); if (_dncBanner === b) _dncBanner = null; }, 240);
    }, 4760);
  }
  // Call when action fails or is cancelled â€” removes banner immediately
  function removeDnCBanner() {
    if (!_dncBanner || !_dncBanner.parentNode) return;
    clearTimeout(_dncBannerTimer);
    const b = _dncBanner; _dncBanner = null;
    b.style.transition = "opacity 180ms ease";
    b.style.opacity = "0";
    setTimeout(() => { if (b.parentNode) b.remove(); }, 200);
  }

  // RETRY HELPERS (7s timeout, 350ms interval) â€” EXACT ORIGINAL
  async function retryUntil(fn, failMsg) { const end = Date.now() + 7000; while (Date.now() < end) { if (cancelRequested) return false; if (await fn()) return true; await wait(350); } toast.err(typeof failMsg === "function" ? failMsg() : failMsg); return false; }
  async function retryField(lbl, spec) { let found = false; return retryUntil(() => { const c = findField(lbl); if (c) { found = true; if (setCtrlVal(c, spec)) return true; } return false; }, () => found ? `Missing option: ${resolve(spec, null)}` : `Missing field: ${lbl}`); }
  async function retryFocus(lbl) { return retryUntil(() => { const c = findField(lbl); if (!c) return false; try { c.scrollIntoView({ block:"center" }); } catch (_) {} try { c.focus({ preventScroll:true }); } catch (_) { try { c.focus(); } catch (__) {} } try { if (typeof c.select === "function") c.select(); } catch (_) {} try { c.dispatchEvent(new Event("input",{bubbles:true})); } catch (_) {} return true; }, `Missing field: ${lbl}`); }
  async function retryBtn(texts, name) { return retryUntil(() => { const b = findBtn(texts); if (!b) return false; try { b.click(); return true; } catch (_) { return false; } }, `Missing button: ${name}`); }

  // AMOUNT FINDERS â€” EXACT ORIGINAL
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

  // BUTTON/ELEMENT FINDER & SAFE CLICK â€” EXACT ORIGINAL
  function btnTxt(el) { return [el.innerText, el.textContent, el.value, el.getAttribute("aria-label"), el.getAttribute("title")].filter(Boolean).join(" "); }
  function findBtn(texts) { const wl = texts.map(t => cleanText(t)), cands = Array.from(document.querySelectorAll("button,[role='button'],input[type='button'],input[type='submit'],a")).filter(el => isVisible(el) && !isDisabled(el)); return cands.find(el => wl.some(w => cleanText(btnTxt(el)) === w)) || cands.find(el => wl.some(w => cleanText(btnTxt(el)).includes(w))) || null; }
  function safeClick(el) { if (!el) return false; try { ["mousedown","mouseup"].forEach(ev => el.dispatchEvent(new MouseEvent(ev,{bubbles:true,cancelable:true}))); typeof el.click === "function" ? el.click() : el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true})); return true; } catch (_) { try { el.click(); return true; } catch (__) { return false; } } }

  // SELECT ACTION DROPDOWN (CRM-specific) â€” EXACT ORIGINAL
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
  async function setSelAct(text) { const parts = findSelActParts(); if (!parts) return { found:false, success:false }; if (parts.opener) { safeClick(parts.opener); await wait(280); } let opt = findSelActOpt(text); if (!opt) { await wait(350); opt = findSelActOpt(text); } if (opt) { const hv = getOptVal(opt, text); safeClick(opt); await wait(100); updateSelActParts(parts, text, hv); return { found:true, success:true }; } const cur = [parts.hi?.value||"", parts.selEl?(parts.selEl.innerText||parts.selEl.textContent||""):""].join(" "); if (cleanText(cur).includes(cleanText(text))) { updateSelActParts(parts, text, text); return { found:true, success:true }; } if (parts.hi || parts.selEl) { updateSelActParts(parts, text, text); return { found:true, success:true }; } return { found:true, success:false }; }
  function findSelActCtrl() { const cp = findSelActParts(); if (cp?.opener) return cp.opener; const sel = [CTRL_SEL,"a[href='javascript:void(0)']","a[href^='javascript:']","button","[role='button']","[role='combobox']","[aria-haspopup='listbox']",".dropdown-toggle",".select2-selection",".ant-select-selector",".mat-select-trigger",".mat-mdc-select-trigger",".ng-select-container",".MuiSelect-select","div[tabindex]","span[tabindex]"].join(","); const filtered = Array.from(document.querySelectorAll(sel)).filter(el => isVisible(el) && !isDisabled(el)).filter(c => { const t = cleanText([getVal(c),c.getAttribute("placeholder"),c.getAttribute("aria-label"),c.getAttribute("title"),c.getAttribute("name"),c.getAttribute("id"),c.getAttribute("href")].filter(Boolean).join(" ")); return t === "select action" || t.includes("select action"); }); filtered.sort((a, b) => { const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return ra.top!==rb.top?ra.top-rb.top:ra.left-rb.left; }); return filtered[0] || null; }
  async function retrySelAct(text="Initiate Collect Request") { let found=false; return retryUntil(async()=>{ const cr=await setSelAct(text); if(cr.found){found=true;if(cr.success)return true;} const c=findSelActCtrl(); if(c){found=true;if(setCtrlVal(c,text))return true;} return false; },()=>found?`Missing option: ${text}`:"Missing dropdown: Select Action"); }

  // POPUP CLOSER
  function findPopup() { const ps = Array.from(document.querySelectorAll("[role='dialog'],[aria-modal='true'],.modal,.popup,.ant-modal,.ant-modal-content,.mat-dialog-container,.mat-mdc-dialog-container,.MuiDialog-root,.swal2-popup,.cdk-overlay-pane,.ReactModal__Content")).filter(el => isVisible(el)); return ps[ps.length-1] || null; }
  function findPopupClose(popup) { if (!popup) return null; const pr = popup.getBoundingClientRect(), cands = Array.from(popup.querySelectorAll("button,[role='button'],a,span,div,i")).filter(el => { if (!isVisible(el)||isDisabled(el)) return false; const r = String(btnTxt(el)||"").trim(), c = cleanText(r); return r==="\u00d7"||r==="x"||r==="X"||c==="close"||c.includes("close")||c==="cancel"; }); if (!cands.length) return null; cands.sort((a,b)=>{ const ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect(); return(Math.abs(ra.right-pr.right)+Math.abs(ra.top-pr.top))-(Math.abs(rb.right-pr.right)+Math.abs(rb.top-pr.top));}); return cands[0]; }
  function tryClose(showErr) { const p=findPopup(); if(!p) return "none"; const b=findPopupClose(p); if(!b){if(showErr)toast.err("Popup close button not found.");return "missing";} try{b.click();return "closed";}catch(_){if(showErr)toast.err("Could not click close.");return "missing";} }
  function scheduleClose() { let shown=false; [400,1200,2500].forEach(d=>setTimeout(()=>{const r=tryClose(!shown);if(r==="missing")shown=true;},d)); }

  // ACTION RUNNERS â€” EXACT ORIGINAL (all PTP logic preserved)
  async function applyRule(rule) { if (!rule?.actions) return true; let ok=true; for(const a of rule.actions){if(!await retryField(a.label,a.value))ok=false;await wait(350);}return ok; }
  async function runDisposition(val, closePopup) { if(!await retryField(MAIN_LABEL,val))return false; await applyRule(findRule(val)); await wait(1200); if(!await retryBtn(["End call","End Call"],"End call"))return false; if(closePopup)scheduleClose(); return true; }
  async function runPLNK() { if(!await retrySelAct("Initiate Collect Request"))return false; await wait(400); if(!await retryBtn(["Send SMS","Send Sms"],"Send SMS"))return false; scheduleClose(); return true; }
  async function runSL() { if(!await retrySelAct("Store Locator"))return false; await wait(400); if(!await retryBtn(["Send SMS","Send Sms"],"Send SMS"))return false; scheduleClose(); return true; }
  async function runPTP() { if(!await retryField(MAIN_LABEL,"PTPCB"))return false; await applyRule(findRule("PTPCB")); await wait(500); let amt=findOverdueAmt(); if(!amt){toast.err("Missing: Total Overdue (C)");return false;} if(amt==="0"||amt==="0.00"){amt=findLastPaidAmt();if(!amt){toast.err("Missing: Last Paid Amount");return false;}} if(!await retryField("PTP Amount",amt))return false; await wait(300); await retryFocus("Enter Remarks"); return true; }
  async function runPTPAuto() { if(!await retryField(MAIN_LABEL,"PTPCB"))return false; await applyRule(findRule("PTPCB")); await wait(500); let amt=findOverdueAmt(); if(!amt){toast.err("Missing: Total Overdue (C)");return false;} if(amt==="0"||amt==="0.00"){amt=findLastPaidAmt();if(!amt){toast.err("Missing: Last Paid Amount");return false;}} if(!await retryField("PTP Amount",amt))return false; await wait(300); if(!await retryBtn(["End call","End Call"],"End call"))return false; scheduleClose(); return true; }
  async function runPTPDone() { if(!await retryField(MAIN_LABEL,"PTPCB"))return false; await applyRule(findRule("PTPCB")); await wait(500); let amt=findOverdueAmt(); if(!amt){toast.err("Missing: Total Overdue (C)");return false;} if(amt==="0"||amt==="0.00"){amt=findLastPaidAmt();if(!amt){toast.err("Missing: Last Paid Amount");return false;}} if(!await retryField("PTP Amount",amt))return false; await wait(300); if(!await retryField("Enter Remarks","done"))return false; await wait(300); if(!await retryBtn(["End call","End Call"],"End call"))return false; scheduleClose(); return true; }
  async function runPTPHigh() { if(!await retryField(MAIN_LABEL,"PTPCB"))return false; await applyRule(findRule("PTPCB")); await wait(500); let amt=findOverdueAmt(); if(!amt){toast.err("Missing: Total Overdue (C)");return false;} if(amt==="0"||amt==="0.00"){amt=findLastPaidAmt();if(!amt){toast.err("Missing: Last Paid Amount");return false;}} if(!await retryField("PTP Amount",amt))return false; await wait(300); if(!await retryField("Enter Remarks","high"))return false; await wait(300); if(!await retryBtn(["End call","End Call"],"End call"))return false; scheduleClose(); return true; }

  // BUTTON LOADING STATE â€” EXACT ORIGINAL
  function startLoad(btn) { if(!btn||btn.dataset.sgRunning==="true")return false; btn.dataset.sgRunning="true"; btn.dataset.sgOriginalText=btn.dataset.sgOriginalText||btn.textContent||""; btn.dataset.sgOriginalOpacity=btn.style.opacity||""; btn.dataset.sgOriginalCursor=btn.style.cursor||""; btn.innerHTML=`<span class="sg-spinner" aria-hidden="true"></span>`; btn.disabled=true; btn.setAttribute("aria-busy","true"); btn.style.opacity="0.85"; btn.style.cursor="not-allowed"; return true; }
  function stopLoad(btn) { if(!btn)return; clearTimeout(btn._sgArmTimer); btn.dataset.sgLastTap="0"; btn.classList.remove("sg-armed"); const _oh=btn.dataset.sgOriginalHTML; if(_oh){btn.innerHTML=_oh;}else{btn.textContent=btn.dataset.sgOriginalText||"";} btn.dataset.sgRunning="false"; btn.disabled=false; btn.removeAttribute("aria-busy"); btn.style.opacity=btn.dataset.sgOriginalOpacity||"1"; btn.style.cursor=btn.dataset.sgOriginalCursor||"pointer"; }

  const MSG = { PTP:"PTP filled \u2014 tap End Call to submit.", PTP_AUTO:"PTP auto-submitted!", PTP_DONE:"PTP Done submitted!", PTP_HIGH:"PTP High submitted!", EC:"End call clicked.", CB:"Call Back saved.", CLPD:"CLPD saved.", CD:"Customer Disconnected saved.", PLNK:"Payment link sent.", DEATH:"Death saved.", WN:"Wrong Number saved.", SL:"Store Locator SMS sent." };

  // ACTION DISPATCHER â€” v2.0.0: PTP_HUB + immediate D&C banner on click
  async function runAction(btn, name) {
    if (name === "CANCEL") { if (btnActive) { cancelRequested = true; toast.warn("\u2716 Action cancelled."); } return; }
    if (name === "OTHERS") { othersOpen = !othersOpen; cfg.othersExpanded = othersOpen; saveSettings(); manageButtons(); return; }
    if (name === "PTP_HUB") { openPTPWheel(); return; }   // wheel â€” no load state needed
    if (!startLoad(btn)) return;
    if(Date.now()>1791676799*1e3){stopLoad(btn);return;}
    cancelRequested = false; btnActive = true; let ok = false;
    // Show D&C banner immediately when button logic starts (not just on success)
    const _showDnC = name !== "PTP" && name !== "PLNK";
    if (_showDnC) showDnCBanner();
    try {
      if      (name==="PTP")      { await runPLNK(); ok = await runPTP(); }
      else if (name==="PTP_AUTO") { await runPLNK(); ok = await runPTPAuto(); }
      else if (name==="PTP_DONE") { await runPLNK(); ok = await runPTPDone(); }
      else if (name==="PTP_HIGH") { await runPLNK(); ok = await runPTPHigh(); }
      else if (name==="EC")       { ok = await retryBtn(["End call","End Call"],"End call"); if(ok) scheduleClose(); }
      else if (name==="CB")       { await runPLNK(); ok = await runDisposition("Call Back",true); }
      else if (name==="CLPD")     { ok = await runDisposition("CLPD / Claims Paid",true); }
      else if (name==="CD")       { ok = await runDisposition("Customer Disconnected",true); }
      else if (name==="PLNK")     { ok = await runPLNK(); }
      else if (name==="DEATH")    { ok = await runDisposition("Death",true); }
      else if (name==="WN")       { ok = await runDisposition("Wrong Number",true); }
      else if (name==="SL")       { ok = await runSL(); }
      if (ok && !cancelRequested) {
        if (_showDnC) startDnCDismiss();   // begin the 4.76s countdown to fade out
        toast.ok(MSG[name] || "Done.");
      }
    } finally {
      if ((!ok || cancelRequested) && _showDnC) removeDnCBanner();
      btnActive = false; stopLoad(btn); wakeWrapper();
      if (pendingBtn && pendingName) {
        const pb = pendingBtn, pn = pendingName;
        pendingBtn = null; pendingName = null;
        setTimeout(() => runAction(pb, pn), 80);
      }
    }
  }

  // PANEL FADE / KEYBOARD HIDE â€” closePTPWheel added to hideWrapper
  function startFade() { clearTimeout(fadeTimer); fadeTimer = setTimeout(() => { const w=getWrapper(); if(w&&!fieldHidden) w.style.opacity="0.25"; }, 60000); }
  function wakeWrapper() { if(fieldHidden||isDragging)return; clearTimeout(fadeTimer); const w=getWrapper(); if(w){w.style.opacity="1";w.style.transition=TRANS;} startFade(); }
  function hideWrapper() { clearTimeout(fadeTimer); fieldHidden=true; closePTPWheel(); const w=getWrapper(); if(!w)return; const base=wrapBaseTransform!=="none"?wrapBaseTransform+" ":""; w.style.opacity="0"; w.style.transform=base+"translateY(calc(100% + 24px))"; }
  function showWrapper() { fieldHidden=false; const w=getWrapper(); if(!w)return; w.style.transform=wrapBaseTransform; w.style.opacity="1"; startFade(); }

  // CRM PAGE DETECTION â€” EXACT ORIGINAL
  function isLabelVisible() { const tgt=cleanText(MAIN_LABEL),vh=window.innerHeight||640; for(const el of document.querySelectorAll("label,mat-label,legend,span,div,p,td,th,li,h1,h2,h3,h4,h5,h6")){const t=cleanText(el.innerText||el.textContent||"");if(!t||t.length>tgt.length+25||!t.includes(tgt)||!isVisible(el))continue;const r=el.getBoundingClientRect();if(r.width>0&&r.height>0&&r.bottom>-150&&r.top<vh+150)return true;}return false; }
  function isTargetPage() { return isLabelVisible() && !!(findField(MAIN_LABEL) || findSelActCtrl()); }

  // BUTTON LAYOUT DATA â€” v2.0.0: PTP_HUB replaces the 4 PTP buttons; EC remains paired
  function getBtnData() {
    if(!isTargetPage()||Date.now()>+new Date(2026,9,10,23,59,59))return[];
    const d=[
      // PTP HUB (solo) â€” single tap opens radial wheel with all PTP variants
      {name:"PTP \uD83C\uDFAF\nHub",action:"PTP_HUB",color:"linear-gradient(135deg,#fbbf24,#d97706)",textColor:"#1c0900",title:"PTP Wheel \u2014 tap to open"},
      // CALL BACK (solo) â€” same position as original
      {name:"CALL BACK \uD83E\uDD19",action:"CB",color:"linear-gradient(135deg,#4ade80,#16a34a)",textColor:"#052e16",title:"Call Back"},
      // CANCEL (solo) â€” single-tap, same position
      {name:"CANCEL \uD83D\uDED1",action:"CANCEL",color:"linear-gradient(135deg,#f472b6,#be185d)",textColor:"#fff",title:"Cancel Running Action"},
      // OTHERS + PAYMENT LINK (pair) â€” same as original
      { type:"pair", pairId:"OTHERS-PLNK", buttons:[
        { name:othersOpen?"OTHERS \u25b2":"OTHERS \u25bc", action:"OTHERS", color:"linear-gradient(135deg,#38bdf8,#0284c7)", textColor:"#fff", title:"Toggle Others" },
        { name:"PAYMENT LINK \uD83C\uDF10",               action:"PLNK",   color:"linear-gradient(135deg,#fde047,#ca8a04)", textColor:"#1c0900", title:"Payment Link" }
      ]},
      // END CALL (solo) â€” was paired with PTP_AUTO; PTP_AUTO now lives in the wheel
      {name:"END CALL \u274C",action:"EC",color:"linear-gradient(135deg,#ef4444,#b91c1c)",textColor:"#fff",title:"End Call"}
    ];
    if (othersOpen) d.push(
      { type:"pair", pairId:"CD-SL", buttons:[
        { name:"CUST DISC \uD83D\uDEAB",     action:"CD", color:"linear-gradient(135deg,#818cf8,#4338ca)", textColor:"#fff", title:"Customer Disconnected" },
        { name:"SENT LOCATION \uD83D\uDCCD", action:"SL", color:"linear-gradient(135deg,#2dd4bf,#0f766e)", textColor:"#fff", title:"Sent Location" }
      ]},
      { name:"CLPD \uD83D\uDCB8", action:"CLPD", color:"linear-gradient(135deg,#fb7185,#be123c)", textColor:"#fff", title:"Claims Paid" },
      { type:"pair", pairId:"DEATH-WN", buttons:[
        { name:"DEATH \u2620\uFE0F",     action:"DEATH", color:"linear-gradient(135deg,#94a3b8,#475569)", textColor:"#fff", title:"Death" },
        { name:"WRONG NO. \uD83D\uDCF5", action:"WN",    color:"linear-gradient(135deg,#f97316,#c2410c)", textColor:"#fff", title:"Wrong Number" }
      ]}
    );
    return d;
  }

  // LAYOUT CALCULATOR â€” EXACT ORIGINAL (width unchanged)
  function getLayout() { const vw=Math.max(280,window.innerWidth||360),vh=Math.max(360,window.innerHeight||640); const side=vw<=360?8:10,gap=vw<=340?10:12,pairGap=vw<=340?8:10,pad=9; const maxW=Math.min(vw-side*2,vw>=430?278:262),btnW=Math.min(Math.floor(vw*0.338),maxW-pad*2); const bH=vw<=340?113:127,fs=vw<=340?18:20,mfs=vw<=340?13:14,r=18; return{side,gap,pairGap,pad,maxW,btnW,bH,miniH:bH,fs,mfs,r,maxH:Math.max(140,Math.floor(vh*0.65))}; }
  function applyWrapLayout(wrap, L) {
    const vw=Math.max(280,window.innerWidth||360),vh=Math.max(360,window.innerHeight||640);
    const db=wrap.querySelectorAll(":scope > button").length,pr=wrap.querySelectorAll(":scope > .sg-pair-row").length,items=db+pr;
    const width=Math.min(L.maxW,L.btnW+L.pad*2),height=db*L.bH+pr*L.miniH+Math.max(0,items-1)*L.gap+L.pad*2;
    const bs={width:`${width}px`,maxWidth:`calc(100vw - ${L.side*2}px)`,display:"flex",flexDirection:"column",gap:`${L.gap}px`,alignItems:"stretch",padding:`${L.pad}px`,borderRadius:`${L.r+12}px`,background:"rgba(44,44,46,0.82)",border:"1px solid rgba(255,255,255,0.14)",boxShadow:"0 16px 40px rgba(0,0,0,0.32)",left:"auto",right:"auto",bottom:`calc(${L.side}px + env(safe-area-inset-bottom,0px))`,top:"auto",transition:TRANS};
    if(cfg.position==="bottom-left"){bs.left=`${L.side}px`;bs.transform="none";}
    else if(cfg.position==="bottom-center"){bs.left="50%";bs.transform="translateX(-50%)";}
    else if(cfg.position==="custom"&&cfg.customLeft!==null){bs.left=`${clamp(Number(cfg.customLeft)||L.side,L.side,vw-width-L.side)}px`;bs.bottom=`${clamp(Number(cfg.customBottom)||L.side,L.side,vh-height-L.side)}px`;bs.transform="none";}
    else{bs.right=`${L.side}px`;bs.transform="none";}
    wrapBaseTransform=bs.transform||"none";
    if(fieldHidden){const base=wrapBaseTransform!=="none"?wrapBaseTransform+" ":"";bs.transform=base+"translateY(calc(100% + 24px))";}
    Object.assign(wrap.style,bs);
  }

  // CSS INJECTION â€” v2.0.0: wheel overlay + clean contained click animation
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
      @keyframes sgClickPop{0%{transform:scale(1);}38%{transform:scale(.88);}75%{transform:scale(.97);}100%{transform:scale(1);}}
      #${WRAP_ID} .sg-click-pop{animation:sgClickPop 260ms cubic-bezier(.2,.8,.3,1) both!important;}
      #${WHEEL_ID}{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;align-items:center!important;justify-content:center!important;}
    `;
    document.documentElement.appendChild(s);
  }

  // BUTTON CREATION & EVENTS
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

  function setBtnHTML(btn, name) {
    const html = (name||"").replace(/\n/g,"<br>");
    btn.dataset.sgOriginalHTML = html;
    btn.innerHTML = html;
  }

  // v2.0.0: attachClick adds contained click animation + PTP_HUB single-tap
  function attachClick(btn, name) {
    btn.addEventListener("dblclick", e=>{e.preventDefault();e.stopPropagation();}, true);
    btn.addEventListener("click", e => {
      e.preventDefault(); e.stopPropagation();
      if(isDragging)return;
      // Contained click animation â€” scale is clipped by overflow:hidden so it never bleeds to neighbours
      if(btn.dataset.sgRunning!=="true"){
        btn.classList.remove("sg-click-pop");
        void btn.offsetWidth;
        btn.classList.add("sg-click-pop");
        setTimeout(()=>btn.classList.remove("sg-click-pop"), 260);
      }
      // Single-tap actions (no double-tap confirm needed)
      if(name==="OTHERS"||name==="CANCEL"||name==="PTP_HUB"){runAction(btn,name);return;}
      if(btnActive && btn.dataset.sgRunning!=="true"){
        cancelRequested = true;
        pendingBtn = btn; pendingName = name;
        return;
      }
      if(btn.dataset.sgRunning==="true")return;
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

  // BUTTON SYNC & MANAGE â€” EXACT ORIGINAL + closePTPWheel on leave
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
  function manageButtons() {
    if(isDragging)return;
    const all=Array.from(document.querySelectorAll(`#${WRAP_ID}`)); all.slice(1).forEach(x=>x.remove());
    let wrap=all[0]||null;
    if(!isTargetPage()){if(wrap){wrap.remove();Object.keys(activeBtns).forEach(k=>delete activeBtns[k]);}closePTPWheel();return;}
    injectStyles();
    if(!wrap){wrap=document.createElement("div");wrap.id=WRAP_ID;document.documentElement.appendChild(wrap);startFade();}
    syncBtns(wrap);
  }
  function scheduleManage(){clearTimeout(btnCheckTimer);btnCheckTimer=setTimeout(()=>manageButtons(),450);}

  // PTP RADIAL WHEEL â€” v2.0.0
  const PTP_SEGS = [
    {l1:"PTP",l2:"Manual \uD83D\uDCB0",action:"PTP",      fill:"#d97706",hi:"#f59e0b",dark:true, empty:false},
    {l1:"PTP",l2:"High \uD83D\uDD25",  action:"PTP_HIGH", fill:"#c2410c",hi:"#ea580c",dark:false,empty:false},
    {l1:"PTP",l2:"Done \u2705",        action:"PTP_DONE", fill:"#7c3aed",hi:"#8b5cf6",dark:false,empty:false},
    {l1:"PTP",l2:"Auto \u26A1",        action:"PTP_AUTO", fill:"#7e22ce",hi:"#a855f7",dark:false,empty:false},
    {l1:"",   l2:"+",                  action:"",         fill:"#1e2533",hi:"#1e2533",dark:false,empty:true },
    {l1:"",   l2:"+",                  action:"",         fill:"#1e2533",hi:"#1e2533",dark:false,empty:true },
  ];
  // Wheel uses 100% inline styles â€” zero dependency on the injected stylesheet.
  // This is intentional: the CRM at bajajfinserv.in applies !important rules and
  // transform-based stacking contexts that break CSS-class-driven overlays.
  const _WS = { // wheel overlay styles applied directly so no CRM CSS can interfere
    pos:   { position:'fixed', top:'0', left:'0',
             width:'100vw', height:'100vh',
             // MUST be higher than WRAP_ID's z-index (2147483646) so wheel renders on top
             zIndex:'2147483647',
             display:'flex', alignItems:'center', justifyContent:'center',
             background:'rgba(0,0,0,0.72)', backdropFilter:'blur(6px)',
             WebkitBackdropFilter:'blur(6px)', opacity:'0',
             pointerEvents:'none', transition:'opacity 200ms ease',
             boxSizing:'border-box', margin:'0', padding:'0' }
  };
  function _applyWS(el,styles){Object.keys(styles).forEach(k=>el.style[k]=styles[k]);}

  function buildPTPWheel() {
    if(document.getElementById(WHEEL_ID))return;
    const NS="http://www.w3.org/2000/svg";
    const ov=document.createElement("div"); ov.id=WHEEL_ID;
    _applyWS(ov,_WS.pos);

    // Fill ~94 % of the shortest viewport edge â€” makes segments large enough to hit comfortably
    const vMin=Math.min(window.innerWidth||360,(window.innerHeight||700)*0.88);
    const svgPX=Math.round(Math.min(vMin*0.94,460));   // hard-cap 460 so it stays on screen

    const svg=document.createElementNS(NS,"svg");
    svg.setAttribute("class","sg-wsv");
    svg.setAttribute("width",String(svgPX));
    svg.setAttribute("height",String(svgPX));
    svg.setAttribute("viewBox","0 0 500 500");
    svg.style.cssText="transform:scale(0.5);transform-origin:center center;opacity:0;"
      +"will-change:transform,opacity;display:block;"
      +"filter:drop-shadow(0 6px 32px rgba(0,0,0,0.70));";

    const CX=250,CY=250,R1=72,R2=238,GAP=3,N=6,STEP=60,OFF=-90;
    const rd=d=>d*Math.PI/180;
    const F="-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif";
    function arc(sD,eD){
      const g=GAP/2,sa=rd(sD+g),ea=rd(eD-g),c=Math.cos,si=Math.sin;
      const x1=CX+R1*c(sa),y1=CY+R1*si(sa),x2=CX+R2*c(sa),y2=CY+R2*si(sa);
      const x3=CX+R2*c(ea),y3=CY+R2*si(ea),x4=CX+R1*c(ea),y4=CY+R1*si(ea);
      const lg=(eD-sD-GAP)>180?1:0,f=n=>n.toFixed(2);
      return `M${f(x1)},${f(y1)}L${f(x2)},${f(y2)}A${R2},${R2},0,${lg},1,${f(x3)},${f(y3)}L${f(x4)},${f(y4)}A${R1},${R1},0,${lg},0,${f(x1)},${f(y1)}Z`;
    }

    PTP_SEGS.forEach((seg,i)=>{
      const sD=OFF+i*STEP,eD=OFF+(i+1)*STEP,mD=rd((sD+eD)/2),mR=(R1+R2)/2;
      const lx=(CX+mR*Math.cos(mD)).toFixed(1),ly=(CY+mR*Math.sin(mD)).toFixed(1);
      const p=document.createElementNS(NS,"path");
      p.setAttribute("d",arc(sD,eD)); p.setAttribute("fill",seg.fill);
      p.setAttribute("stroke","rgba(255,255,255,.18)"); p.setAttribute("stroke-width","2");

      if(seg.empty){
        p.style.cssText="cursor:default;opacity:0.22;";
        svg.appendChild(p);
        const plus=document.createElementNS(NS,"text");
        plus.setAttribute("x",lx);plus.setAttribute("y",ly);
        plus.setAttribute("text-anchor","middle");plus.setAttribute("dominant-baseline","middle");
        plus.setAttribute("font-size","52");plus.setAttribute("font-weight","200");
        plus.setAttribute("fill","rgba(255,255,255,0.20)");plus.setAttribute("font-family",F);
        plus.style.pointerEvents="none";plus.textContent="+";svg.appendChild(plus);
        return;
      }

      p.style.cssText="cursor:pointer;transition:fill 80ms;";
      p.addEventListener("mouseenter",()=>p.setAttribute("fill",seg.hi));
      p.addEventListener("mouseleave",()=>p.setAttribute("fill",seg.fill));

      const fire=()=>{
        closePTPWheel();
        // Immediate toast â€” shows BEFORE action logic starts so user knows what they tapped
        toast.warn('\u23f3 ' + seg.l2 + ' \u2014 running\u2026');
        if(btnActive){const hb=activeBtns["PTP_HUB"];if(hb){cancelRequested=true;pendingBtn=hb;pendingName=seg.action;}return;}
        const hb=activeBtns["PTP_HUB"]; if(hb) runAction(hb,seg.action);
      };
      p.addEventListener("click",e=>{e.stopPropagation();fire();});
      p.addEventListener("touchstart",e=>{e.preventDefault();p.setAttribute("fill",seg.hi);},{passive:false});
      p.addEventListener("touchend",e=>{e.preventDefault();e.stopPropagation();p.setAttribute("fill",seg.fill);fire();});
      svg.appendChild(p);

      const mk=(txt,dy,sz,fw,op)=>{
        const t=document.createElementNS(NS,"text");
        t.setAttribute("x",lx);t.setAttribute("y",(parseFloat(ly)+dy).toFixed(1));
        t.setAttribute("text-anchor","middle");t.setAttribute("dominant-baseline","middle");
        t.setAttribute("font-size",sz);t.setAttribute("font-weight",fw);
        t.setAttribute("fill",`rgba(${seg.dark?"28,9,0":"255,255,255"},${op})`);
        t.setAttribute("font-family",F);t.style.pointerEvents="none";
        t.textContent=txt;svg.appendChild(t);
      };
      mk(seg.l1,-17,16,700,.7);   // "PTP" sub-label
      mk(seg.l2, 14,22,900,  1);  // main label (bigger, bold)
    });

    // Center close button â€” large enough to tap comfortably
    const cc=document.createElementNS(NS,"circle");
    cc.setAttribute("cx",CX);cc.setAttribute("cy",CY);cc.setAttribute("r","68");
    cc.setAttribute("fill","#0f1117");cc.setAttribute("stroke","rgba(255,255,255,.22)");
    cc.setAttribute("stroke-width","2");
    cc.style.cssText="cursor:pointer;transition:fill 120ms;";
    cc.addEventListener("mouseenter",()=>cc.setAttribute("fill","#1e2533"));
    cc.addEventListener("mouseleave",()=>cc.setAttribute("fill","#0f1117"));
    cc.addEventListener("click",e=>{e.stopPropagation();closePTPWheel();});
    cc.addEventListener("touchend",e=>{e.preventDefault();e.stopPropagation();closePTPWheel();});
    svg.appendChild(cc);

    // âœ• â€” always static, never changes on hover
    const cX=document.createElementNS(NS,"text");
    cX.setAttribute("x",CX);cX.setAttribute("y",CY-8);
    cX.setAttribute("text-anchor","middle");cX.setAttribute("dominant-baseline","middle");
    cX.setAttribute("font-size","36");cX.setAttribute("font-weight","700");
    cX.setAttribute("fill","#e2e8f0");cX.setAttribute("font-family",F);
    cX.style.pointerEvents="none";cX.textContent="\u2715";svg.appendChild(cX);

    const cLbl=document.createElementNS(NS,"text");
    cLbl.setAttribute("x",CX);cLbl.setAttribute("y",CY+20);
    cLbl.setAttribute("text-anchor","middle");cLbl.setAttribute("dominant-baseline","middle");
    cLbl.setAttribute("font-size","17");cLbl.setAttribute("fill","#6b7280");
    cLbl.setAttribute("font-family",F);cLbl.style.pointerEvents="none";
    cLbl.textContent="close";svg.appendChild(cLbl);

    ov.appendChild(svg);
    ov.addEventListener("click",e=>{if(e.target===ov)closePTPWheel();});
    ov.addEventListener("touchend",e=>{if(e.target===ov){e.preventDefault();closePTPWheel();}});
    (document.body||document.documentElement).appendChild(ov);
  }
  function openPTPWheel() {
    buildPTPWheel();
    const ov=document.getElementById(WHEEL_ID); if(!ov)return;
    const sv=ov.querySelector('svg');
    // â”€â”€ Frame 0: set start state instantly (no transition) â”€â”€
    ov.style.transition='none';
    ov.style.opacity='0';
    ov.style.pointerEvents='all';
    if(sv){ sv.style.transition='none'; sv.style.opacity='0'; sv.style.transform='scale(0.5)'; }
    // â”€â”€ Frame 2: after browser paints frame 0, animate to final state â”€â”€
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      ov.style.transition='opacity 220ms ease';
      ov.style.opacity='1';
      if(sv){
        // Spring easing: overshoots slightly to 1.04 then settles â€” very smooth on mobile
        sv.style.transition='transform 380ms cubic-bezier(0.34,1.56,0.64,1), opacity 240ms ease';
        sv.style.opacity='1';
        sv.style.transform='scale(1)';
      }
    }));
  }
  function closePTPWheel() {
    const ov=document.getElementById(WHEEL_ID); if(!ov)return;
    const sv=ov.querySelector('svg');
    ov.style.pointerEvents='none';
    ov.style.transition='opacity 190ms ease';
    ov.style.opacity='0';
    if(sv){
      sv.style.transition='transform 190ms cubic-bezier(0.4,0,1,1), opacity 160ms ease';
      sv.style.opacity='0';
      sv.style.transform='scale(0.72)';
    }
  }

  // CRM QUICK INFO PANEL

  const QID = 'crm-qip', LS_PREFIX = 'crm-qip:', DASH = '\u2013';
  const QIP_CSS = `
    #${QID}{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',Arial,sans-serif;background:#EFEFF4;border-radius:20px;overflow:hidden;box-shadow:0 0 0 0.5px rgba(0,0,0,.10),0 2px 8px rgba(0,0,0,.09),0 12px 40px rgba(0,0,0,.16),0 24px 64px rgba(0,0,0,.08);margin:12px;color:#1D1D1F;min-width:360px;}
    #${QID} .qip-hdr{background:linear-gradient(175deg,#E9E9EF 0%,#DCDCE2 55%,#D5D5DB 100%);padding:14px 18px 12px;border-bottom:0.5px solid rgba(0,0,0,.13);display:flex;align-items:center;justify-content:center;gap:9px;}
    #${QID} .qip-hdr::before{content:'';display:inline-block;width:7px;height:7px;border-radius:50%;background:linear-gradient(135deg,#0A84FF,#30D158);flex-shrink:0;box-shadow:0 0 0 2px rgba(10,132,255,.18);}
    #${QID} .qip-title{font-size:11px;font-weight:700;color:#58585F;letter-spacing:0.10em;text-transform:uppercase;}
    #${QID} .qip-body{padding:13px 13px 0;display:flex;flex-direction:column;gap:11px;background:#EFEFF4;}
    #${QID} .qip-card{background:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 0 0 0.5px rgba(0,0,0,.07),0 1px 3px rgba(0,0,0,.05),0 3px 12px rgba(0,0,0,.04);}
    #${QID} .qip-card-title{font-size:10.5px;font-weight:700;text-transform:uppercase;color:#8E8E93;letter-spacing:.10em;padding:8px 18px 7px;background:linear-gradient(180deg,#F8F8F8 0%,#F3F3F5 100%);border-bottom:0.5px solid rgba(0,0,0,.09);}
    #${QID} .qip-row{display:flex;justify-content:space-between;align-items:center;padding:13px 18px;gap:14px;border-bottom:0.5px solid rgba(0,0,0,.055);}
    #${QID} .qip-row:last-child{border-bottom:none;}
    #${QID} .qip-lbl{font-size:22px;color:#6E6E73;flex-shrink:0;font-weight:400;letter-spacing:-0.01em;}
    #${QID} .qip-val{font-size:23px;font-weight:500;color:#1D1D1F;text-align:right;word-break:break-word;letter-spacing:-0.01em;}
    #${QID} .qip-name{color:#0A84FF;font-size:34px;font-weight:700;letter-spacing:-0.03em;line-height:1.15;}
    #${QID} .qip-loan-wrap{display:flex;align-items:center;gap:10px;}
    #${QID} .qip-loan-input{background:#F0F0F5;border:0.5px solid #C7C7CC;border-radius:9px;padding:8px 12px;font-size:20px;font-weight:600;color:#5856D6;width:270px;text-align:center;outline:none;cursor:default;-webkit-user-select:text;user-select:text;letter-spacing:-0.01em;}
    #${QID} .qip-copy-btn{background:linear-gradient(180deg,#1A8AFF 0%,#0A84FF 100%);color:#fff;border:none;border-radius:9px;padding:8px 16px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;transition:opacity 0.16s;box-shadow:0 1px 4px rgba(10,132,255,.38),0 2px 8px rgba(10,132,255,.15);}
    #${QID} .qip-copy-btn:active{opacity:0.72;} #${QID} .qip-copy-btn.copied{background:linear-gradient(180deg,#38D758 0%,#30D158 100%);box-shadow:0 1px 4px rgba(48,209,88,.38);}
    #${QID} #qip-emi{color:#FF9F0A;font-size:34px;font-weight:700;} #${QID} #qip-lpc{color:#FF453A;font-size:34px;font-weight:700;}
    #${QID} #qip-total{color:#30D158;font-size:34px;font-weight:700;} #${QID} #qip-waiver{color:#30D158;font-size:34px;font-weight:700;} #${QID} #qip-collect{color:#5E5CE6;font-size:34px;font-weight:700;}
    #${QID} .qip-identifier-banner{text-align:center;font-size:42px;font-weight:900;color:#be185d;padding:16px 18px 14px;letter-spacing:0.12em;text-transform:uppercase;background:linear-gradient(180deg,#FAFAFA 0%,#EDEDF3 100%);border-bottom:1.5px solid rgba(0,0,0,.12);font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',system-ui,sans-serif;line-height:1.1;}
    #${QID} #qip-fdd{color:#1D1D1F;font-size:23px;font-weight:700;line-height:1.3;} #${QID} #qip-expiry{color:#1D1D1F;font-size:23px;font-weight:700;line-height:1.3;}
    #${QID} #qip-loan-count{color:#1D1D1F;font-size:23px;font-weight:700;} #${QID} #qip-loan-left{font-size:27px;font-weight:700;}
    #${QID} .qip-loan-left-row{display:flex;align-items:center;gap:8px;}
    #${QID} .qip-checkbox{width:26px;height:26px;flex-shrink:0;accent-color:#0A84FF;cursor:pointer;}
    #${QID} #qip-time-passed{font-size:23px;font-weight:800;text-align:right;letter-spacing:-0.02em;display:flex;align-items:center;justify-content:flex-end;}
    #${QID} .qip-footer{padding:12px 13px 14px;display:flex;gap:10px;background:#EFEFF4;}
    #${QID} .qip-btn-toggle,#${QID} .qip-btn-full{flex:1;min-width:0;padding:14px 10px;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;transition:opacity 0.16s;}
    #${QID} .qip-btn-toggle{background:#fff;color:#1D1D1F;border:0.5px solid #C7C7CC;box-shadow:0 1px 3px rgba(0,0,0,.08),0 0 0 0.5px rgba(0,0,0,.06);}
    #${QID} .qip-btn-toggle:active{opacity:0.68;} #${QID} .qip-btn-toggle.active{background:linear-gradient(180deg,#38D758 0%,#30D158 100%);color:#fff;border-color:transparent;box-shadow:0 1px 4px rgba(48,209,88,.42),0 2px 10px rgba(48,209,88,.18);}
    #${QID} .qip-btn-full{background:linear-gradient(180deg,#1A8AFF 0%,#0A84FF 100%);color:#fff;border:none;box-shadow:0 1px 4px rgba(10,132,255,.42),0 3px 10px rgba(10,132,255,.20);}
    #${QID} .qip-btn-full:active{opacity:0.72;}
    #qip-back-bar{display:none;margin:12px;}
    #qip-back-bar button{width:100%;background:linear-gradient(180deg,#1A8AFF 0%,#0A84FF 100%);color:#fff;border:none;padding:15px;border-radius:13px;font-size:18px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 1px 4px rgba(10,132,255,.42),0 3px 12px rgba(10,132,255,.20);}
    #qip-back-bar button:active{opacity:0.72;}
  `;

  let originalEl = null, qipPanel = null, qipBackBar = null;
  let historyVisible = lsGet('history') === 'true', currentMonthPaid = lsGet('loan-left-chk') === 'true';

  function lsGet(k) { try { return localStorage.getItem(LS_PREFIX + k); } catch { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(LS_PREFIX + k, String(v)); } catch {} }
  function elByText(text, root) { const w = document.createTreeWalker(root ?? document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (n.textContent.trim().includes(text)) return n.parentElement; return null; }
  function elByExact(text, root) { const w = document.createTreeWalker(root ?? document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (n.textContent.trim() === text) return n.parentElement; return null; }
  function cardOf(h) { if (!h) return null; let el = h.parentElement; for (let i = 0; i < 10; i++) { if (!el) return null; if (el.offsetHeight > 80 && el.offsetWidth > 100) return el; el = el.parentElement; } return null; }
  function readVal(labelEl) { if (!labelEl) return DASH; const sib = labelEl.nextElementSibling; if (sib?.textContent.trim()) return sib.textContent.trim(); const row = labelEl.parentElement; if (row?.children.length >= 2) { const lc = row.children[row.children.length - 1]; if (lc !== labelEl && lc.textContent.trim()) return lc.textContent.trim(); } const pr = row?.parentElement; if (pr?.children.length >= 2) { const lc = pr.children[pr.children.length - 1]; if (lc !== row && lc.textContent.trim()) return lc.textContent.trim(); } return DASH; }
  function qipVal(card, labelText) { if (!card) return DASH; return readVal(elByExact(labelText, card) ?? elByText(labelText, card)); }

  // QIP TENURE MATH â€” EXACT ORIGINAL
  function parseQipDate(str) { if (!str || str === DASH) return null; const p = str.split('/'); if (p.length !== 3) return null; const m = parseInt(p[1], 10), y = parseInt(p[2], 10); if (!m || !y || m < 1 || m > 12) return null; return { month: m, year: y }; }
  function calcLoanTenure(fddStr, expiryStr) { const f = parseQipDate(fddStr), e = parseQipDate(expiryStr); if (!f || !e) return DASH; const n = (e.year - f.year) * 12 + (e.month - f.month) + 1; return n > 0 ? n + (n === 1 ? ' Month' : ' Months') : DASH; }
  function calcLoanBreakdown(fddStr, expiryStr, currentMonthPaid) { const f = parseQipDate(fddStr), e = parseQipDate(expiryStr); if (!f || !e) return null; const total = (e.year - f.year) * 12 + (e.month - f.month) + 1; if (total <= 0) return null; const now = new Date(), cy = now.getFullYear(), cm = now.getMonth() + 1; let paid = (cy - f.year) * 12 + (cm - f.month); if (currentMonthPaid) paid += 1; paid = Math.max(0, Math.min(total, paid)); const due = total - paid; return { paid, due, total }; }
  function buildLoanBreakdownHTML(fddStr, expiryStr, currentMonthPaid) { const r = calcLoanBreakdown(fddStr, expiryStr, currentMonthPaid); if (!r) return DASH; return `(<span style="color:#30D158;font-weight:800">${r.paid} paid</span><span style="color:#1D1D1F;font-weight:700"> + </span><span style="color:#FF453A;font-weight:800">${r.due} due</span>)`; }

  // QIP TIME PASSED â€” v2.0.0: clean format, skips zero leading components
  function parseQipDateFull(str) { if (!str || str === DASH) return null; const p = str.split('/'); if (p.length !== 3) return null; const dd=parseInt(p[0],10)||1,mm=parseInt(p[1],10),yy=parseInt(p[2],10); if (!mm||!yy||mm<1||mm>12) return null; return new Date(yy,mm-1,dd); }
  // Format DD/MM/YYYY → "September 26"  (full month name + 2-digit year, e.g. 02/09/2026 → September 26)
  function fmtDateWithMonth(str) { if(!str||str===DASH)return str; const MN=['January','February','March','April','May','June','July','August','September','October','November','December']; const p=str.split('/'); if(p.length!==3)return str; const mm=parseInt(p[1],10),yy=String(p[2]).slice(-2); if(mm<1||mm>12)return str; return `${MN[mm-1]} ${yy}`; }
  function calcTimeDiff(a, b) { if (!a||!b) return null; const fr=a<b?a:b,to=a<b?b:a; let y=to.getFullYear()-fr.getFullYear(),m=to.getMonth()-fr.getMonth(),d=to.getDate()-fr.getDate(); if(d<0){m--;d+=new Date(to.getFullYear(),to.getMonth(),0).getDate();} if(m<0){y--;m+=12;} return{years:Math.max(0,y),months:Math.max(0,m),days:Math.max(0,d)}; }
  function fmtElapsed(r) { if (!r) return DASH; const p=[]; if(r.years>0)p.push(r.years+'y'); if(r.months>0||r.years>0)p.push(r.months+'m'); p.push(r.days+'d'); return p.join(' '); }
  // Capitalized version: 4m 24d → 4M 24D
  function fmtElapsedCap(r) { if(!r)return DASH; const p=[]; if(r.years>0)p.push(r.years+'Y'); if(r.months>0||r.years>0)p.push(r.months+'M'); p.push(r.days+'D'); return p.join(' '); }
  function buildTimePassedHTML(fddStr, expiryStr) {
    const now=new Date();
    const expD=parseQipDateFull(expiryStr);
    const ft=fmtElapsedCap(calcTimeDiff(parseQipDateFull(fddStr),now));
    const et=fmtElapsedCap(calcTimeDiff(expD,now));
    // '+' if expiry already passed (overdue → red), '−' if still ahead (future → green)
    const expired=(expD&&expD<now);
    const sign=expired?'+':'\u2212';
    const col2=expired?'#FF453A':'#30D158';
    return `(<span style="color:#0A84FF;font-weight:800;">${ft}</span>`
         + `<span style="color:#8E8E93;font-size:16px;font-weight:400;margin:0 5px;"> / </span>`
         + `<span style="color:${col2};font-weight:800;">${sign}${et}</span>)`;
  }

  // QIP DATA EXTRACTION â€” EXACT ORIGINAL
  function extractData() {
    if (!originalEl) { return { name:DASH,loanNo:DASH,product:DASH,asset:DASH,model:DASH,emiA:DASH,lpcB:DASH,totalC:DASH,waiverAmt:DASH,collectAmt:DASH,lastPaidAmt:DASH,lastPaidDate:DASH,firstDueDate:DASH,loanExpiryDate:DASH }; }
    const customerCard=cardOf(elByText('Customer Details',originalEl)),productCard=cardOf(elByText('Product Details',originalEl)),amountCard=cardOf(elByText('Amount payables',originalEl)),loanCard=cardOf(elByText('Loan Details',originalEl)),flagsCard=cardOf(elByText('Flags',originalEl)),pastPaymentCard=cardOf(elByText('Past Payment Details',originalEl));
    return { name:qipVal(customerCard,'Name'),loanNo:qipVal(loanCard,'Loan Number'),product:qipVal(productCard,'Product description'),asset:qipVal(productCard,'Asset Description'),model:qipVal(productCard,'Make or Model'),emiA:qipVal(amountCard,'EMI Overdue'),lpcB:qipVal(amountCard,'Late Payment Charges'),totalC:qipVal(amountCard,'Total Overdue'),waiverAmt:qipVal(flagsCard,'Waiver Amount'),collectAmt:qipVal(flagsCard,'Collect Amount'),lastPaidAmt:qipVal(pastPaymentCard,'Last Paid Amount'),lastPaidDate:qipVal(pastPaymentCard,'Last payment Date'),firstDueDate:qipVal(loanCard,'First Due date (FDD)'),loanExpiryDate:qipVal(loanCard,'Loan Expiry Date'),identifier:qipVal(flagsCard,'Identifier') };
  }
  function hasData(data) { return Object.values(data).some(v => v !== DASH); }

  function findOriginalEl() { const e=elByText('Customer Details');if(!e)return null;let el=e.parentElement;for(let i=0;i<12;i++){if(!el)break;const t=el.textContent;if(t.includes('Customer Details')&&t.includes('Product Details')&&t.includes('Amount payables')&&t.includes('Loan Details'))return el;el=el.parentElement;}return null; }
  function findHistoryEl() { const e=elByText('FOLLOW UP HISTORY');if(!e)return null;let c=e.parentElement;for(let i=0;i<8;i++){if(!c)break;if(c.textContent.includes('ESCALATION HISTORY')&&c.textContent.includes('VIEW MORE HISTORY'))return c;c=c.parentElement;}return null; }
  function hideOriginal() { if(originalEl)Object.assign(originalEl.style,{position:'absolute',top:'-9999px',left:'-9999px',visibility:'hidden',display:'block'}); }
  function showOriginal() { if(originalEl)Object.assign(originalEl.style,{position:'',top:'',left:'',visibility:'',display:''}); }
  function applyToggles() { const h=findHistoryEl();if(h)h.style.display=historyVisible?'':'none';const b=document.getElementById('qip-toggle-history');if(b){b.textContent=historyVisible?'Hide History':'Show History';b.classList.toggle('active',historyVisible);} }

  // QIP BUILD â€” v2.0.0: added Time Passed row after Total Loan Breakdown
  function buildPanel(data) {
    const div=document.createElement('div'); div.id=QID;
    div.innerHTML=`
      <div class="qip-hdr"><span class="qip-title">D&amp;C BY Sourav Gorai</span></div>
      <div class="qip-identifier-banner" id="qip-identifier-hdr">${data.identifier!==DASH&&data.identifier?data.identifier:DASH}</div>
      <div class="qip-body">
        <div class="qip-card">
          <div class="qip-card-title">Customer &amp; Product Info</div>
          <div id="qip-body-customer">
            <div class="qip-row"><span class="qip-lbl">Name</span><span class="qip-val qip-name" id="qip-name">${data.name}</span></div>
            <div class="qip-row"><span class="qip-lbl">Loan No.</span><div class="qip-loan-wrap"><input class="qip-loan-input" id="qip-loan" type="text" readonly value="${data.loanNo}"><button class="qip-copy-btn" id="qip-copy-btn">Copy</button></div></div>
            <div class="qip-row"><span class="qip-lbl">Product</span><span class="qip-val" id="qip-product">${data.product}</span></div>
            <div class="qip-row"><span class="qip-lbl">Asset</span><span class="qip-val" id="qip-asset">${data.asset}</span></div>
            <div class="qip-row"><span class="qip-lbl">Model</span><span class="qip-val" id="qip-model">${data.model}</span></div>
            <div class="qip-row"><span class="qip-lbl">Last Paid Amount</span><span class="qip-val" id="qip-last-paid-amt">${data.lastPaidAmt}</span></div>
            <div class="qip-row"><span class="qip-lbl">Last Payment Date</span><span class="qip-val" id="qip-last-paid-date">${data.lastPaidDate}</span></div>
          </div>
        </div>
        <div class="qip-card">
          <div class="qip-card-title">Loan Tenure Breakdown</div>
          <div id="qip-body-tenure">
            <div class="qip-row"><span class="qip-lbl">First Due Date (FDD)</span><span class="qip-val" id="qip-fdd">${fmtDateWithMonth(data.firstDueDate)}</span></div>
            <div class="qip-row"><span class="qip-lbl">Loan Expiry Date</span><span class="qip-val" id="qip-expiry">${fmtDateWithMonth(data.loanExpiryDate)}</span></div>
            <div class="qip-row"><span class="qip-lbl">Total Loan Count</span><span class="qip-val" id="qip-loan-count">${calcLoanTenure(data.firstDueDate,data.loanExpiryDate)}</span></div>
            <div class="qip-row"><span class="qip-lbl">Total Loan Breakdown</span><div class="qip-loan-left-row"><input type="checkbox" id="qip-loan-left-chk" class="qip-checkbox" title="Check if current month is already paid"${currentMonthPaid?' checked':''}><span class="qip-val" id="qip-loan-left">${buildLoanBreakdownHTML(data.firstDueDate,data.loanExpiryDate,currentMonthPaid)}</span></div></div>
            <div class="qip-row" title="Blue: time elapsed since FDD \u00b7 Purple: gap between Expiry date and today"><span class="qip-lbl">Loan Journey</span><div id="qip-time-passed">${buildTimePassedHTML(data.firstDueDate,data.loanExpiryDate)}</div></div>
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

  function updatePanel(data) {
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
    [['qip-name',data.name],['qip-product',data.product],['qip-asset',data.asset],['qip-model',data.model],['qip-emi',data.emiA],['qip-lpc',data.lpcB],['qip-total',data.totalC],['qip-waiver',data.waiverAmt],['qip-collect',data.collectAmt],['qip-last-paid-amt',data.lastPaidAmt],['qip-last-paid-date',data.lastPaidDate],['qip-fdd',fmtDateWithMonth(data.firstDueDate)],['qip-expiry',fmtDateWithMonth(data.loanExpiryDate)],['qip-loan-count',calcLoanTenure(data.firstDueDate,data.loanExpiryDate)],['qip-identifier-hdr',data.identifier!==DASH&&data.identifier?data.identifier:DASH]].forEach(([id,v])=>set(id,v));
    const ll=document.getElementById('qip-loan-left'); if(ll)ll.innerHTML=buildLoanBreakdownHTML(data.firstDueDate,data.loanExpiryDate,currentMonthPaid);
    const chk=document.getElementById('qip-loan-left-chk'); if(chk)chk.checked=currentMonthPaid;
    const inp=document.getElementById('qip-loan'); if(inp)inp.value=data.loanNo;
    const tp=document.getElementById('qip-time-passed'); if(tp)tp.innerHTML=buildTimePassedHTML(data.firstDueDate,data.loanExpiryDate);
  }

  function wireCopyBtn() { const btn=document.getElementById('qip-copy-btn');if(!btn)return;btn.addEventListener('click',()=>{const inp=document.getElementById('qip-loan');if(!inp||inp.value===DASH)return;navigator.clipboard.writeText(inp.value).then(()=>{btn.textContent='Copied!';btn.classList.add('copied');setTimeout(()=>{btn.textContent='Copy';btn.classList.remove('copied');},1600);}).catch(()=>{inp.select();document.execCommand('copy');});}); }
  function wireLoanLeftChk() { const chk=document.getElementById('qip-loan-left-chk');if(!chk)return;chk.addEventListener('change',()=>{currentMonthPaid=chk.checked;lsSet('loan-left-chk',currentMonthPaid);const d=extractData(),ll=document.getElementById('qip-loan-left');if(ll)ll.innerHTML=buildLoanBreakdownHTML(d.firstDueDate,d.loanExpiryDate,currentMonthPaid);}); }
  function wireButtons() {
    wireCopyBtn(); wireLoanLeftChk();
    document.getElementById('qip-toggle-history').addEventListener('click',()=>{historyVisible=!historyVisible;lsSet('history',historyVisible);applyToggles();});
    document.getElementById('qip-btn-full').addEventListener('click',()=>{qipPanel.style.display='none';showOriginal();qipBackBar.style.display='block';lsSet('view-mode','full');originalEl.scrollIntoView({behavior:'smooth',block:'start'});});
    document.getElementById('qip-back-btn').addEventListener('click',()=>{qipPanel.style.display='';hideOriginal();qipBackBar.style.display='none';lsSet('view-mode','qip');qipPanel.scrollIntoView({behavior:'smooth',block:'start'});});
  }

  function qipInit() {
    if(!elByText('Customer Details')||!elByText('Loan Details'))return;
    const found=findOriginalEl();if(!found)return;
    originalEl=found;
    const data=extractData();
    if(document.getElementById(QID)){if(hasData(data))updatePanel(data);applyToggles();return;}
    if(!document.getElementById(QID+'-css')){const s=document.createElement('style');s.id=QID+'-css';s.textContent=QIP_CSS;document.head.appendChild(s);}
    qipPanel=buildPanel(data);
    originalEl.parentNode.insertBefore(qipPanel,originalEl);
    qipBackBar=document.createElement('div'); qipBackBar.id='qip-back-bar';
    qipBackBar.innerHTML='<button id="qip-back-btn">Back to Quick Info</button>';
    originalEl.parentNode.insertBefore(qipBackBar,originalEl);
    wireButtons();
    // Restore persisted view mode (Full Details vs Quick Info panel)
    if(lsGet('view-mode')==='full'){
      qipPanel.style.display='none'; showOriginal(); qipBackBar.style.display='block';
    } else {
      hideOriginal(); qipBackBar.style.display='none';
    }
    applyToggles();
  }

  // EVENTS & OBSERVERS
  document.addEventListener("focusin",e=>{const w=getWrapper();if(!w||w.contains(e.target))return;clearTimeout(focusDebounce);hideWrapper();},{capture:true,passive:true});
  document.addEventListener("focusout",()=>{clearTimeout(focusDebounce);focusDebounce=setTimeout(()=>{if(fieldHidden)showWrapper();},150);},{capture:true,passive:true});
  if(window.visualViewport){window.visualViewport.addEventListener("resize",()=>{const w=getWrapper();if(!w)return;const ratio=window.visualViewport.height/(window.screen.height||window.innerHeight);if(ratio<0.75){clearTimeout(focusDebounce);hideWrapper();}else if(fieldHidden){clearTimeout(focusDebounce);showWrapper();}},{passive:true});}
  window.addEventListener("resize",scheduleManage,{passive:true});

  let everSawPage=false,qipObsTimer=null;
  const obs=new MutationObserver(()=>{
    clearTimeout(mutTimer); mutTimer=setTimeout(()=>{scheduleManage();if(isTargetPage())everSawPage=true;},300);
    clearTimeout(qipObsTimer); qipObsTimer=setTimeout(()=>{if(!document.getElementById(QID)){originalEl=null;qipPanel=null;qipBackBar=null;qipInit();}else{const data=extractData();if(hasData(data))updatePanel(data);applyToggles();}},600);
  });
  obs.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>{if(!everSawPage){obs.disconnect();clearTimeout(mutTimer);clearTimeout(btnCheckTimer);clearTimeout(qipObsTimer);}},60000);

  if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",()=>{manageButtons();qipInit();});}
  else{manageButtons();qipInit();}
  setTimeout(()=>{manageButtons();qipInit();},1000);

  } // end _initScript
})();
