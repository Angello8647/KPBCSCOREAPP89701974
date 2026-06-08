// js/utils.js
function normalizeText(t) {
    if(!t) return '';
    const r = {'Ã«':'ë','Ã©':'é','Ã¨':'è','Ãª':'ê','Ã ':'à','Ã¢':'â','Ã¤':'ä','Ã¥':'å','Ãç':'ç','Ã¯':'ï','Ã®':'î','Ã´':'ô','Ã¶':'ö','Ã¹':'ù','Ã»':'û','Ã¼':'ü','Ã±':'ñ','â‚¬':'€'};
    let n = t.toString();
    Object.keys(r).forEach(b => { n = n.replace(new RegExp(b,'g'), r[b]); });
    return n;
}





function formatDateForInput(d){const dt=new Date(d);return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;}
function parseDDMMYYYY(s){const p=s.split('/');return p.length===3?new Date(p[2],p[1]-1,p[0]):new Date();}
function getDayOfWeek(s){const d=["Zondag","Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag"];const p=s.split('-');return p.length===3?d[new Date(p[0],p[1]-1,p[2]).getDay()]:"";}
function formatDateDisplay(s){if(!s)return'';const p=s.split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:s;}
function formatDateForCSV(s){return formatDateDisplay(s);}
function getCategoryColor(c){return ['#e74c3c','#f39c12','#f1c40f','#2ecc71','#3498db','#9b59b6'][c-1]||'#95a5a6';}

function togglePasswordField() {
    const pf = document.getElementById('adminPassword');
    // We zoeken specifiek de knop in de header van pagina 1
    const btn = document.querySelector('.header-buttons .upload-btn'); 
    
    if (!pf || !btn) return; // Veiligheid: doe niets als elementen niet gevonden worden
    
    if (pf.style.display === 'none' || pf.style.display === '') {
        pf.style.display = 'block';
        pf.focus();
        btn.textContent = '🔓 Toegang';
    } else {
        pf.style.display = 'none';
        btn.textContent = '📤 Beheer Matchen';
        pf.value = '';
    }
}

function checkPassword() {
    const pf = document.getElementById('adminPassword');
    if (!pf) return;
    
    // Als het veld verborgen is, maak het zichtbaar
    if (pf.style.display === 'none' || pf.style.display === '') {
        togglePasswordField();
        return;
    }
    
    const ingevoerdWachtwoord = pf.value.trim();
    if (ingevoerdWachtwoord === '') {
        alert("Voer een wachtwoord in");
        return;
    }
    
    if (ingevoerdWachtwoord === getAdminPassword()) {
        pf.value = '';
        pf.style.display = 'none';
        const btn = document.querySelector('.header-buttons .upload-btn');
        if (btn) btn.textContent = '📤 Beheer Matchen';
        
        // Ga naar de beheerpagina
        showPage(7);
    } else {
        alert("❌ Onjuist wachtwoord!");
        pf.value = '';
        pf.focus();
    }
}

function changeAdminPassword(){
    const c=getAdminPassword();
    const o=prompt("Voer huidig wachtwoord in:");
    if(o===null) return;
    if(o!==c){ alert("❌ Huidig wachtwoord is onjuist!"); return; }
    const n1=prompt("Voer nieuw wachtwoord in (min. 4 tekens):");
    if(n1===null) return;
    if(n1.length<4){ alert("❌ Wachtwoord moet minimaal 4 tekens lang zijn!"); return; }
    const n2=prompt("Herhaal nieuw wachtwoord:");
    if(n2===null) return;
    if(n1!==n2){ alert("❌ Wachtwoorden komen niet overeen!"); return; }
    if(setAdminPassword(n1)) alert("✅ Wachtwoord succesvol gewijzigd!");
    else alert("❌ Fout bij wijzigen wachtwoord");
}

let touchStartY=0, swipeWarningActive=false, lastSwipeWarningTime=0;
function initSwipeProtection(){
    if(!('ontouchstart' in window)) return;
    document.addEventListener('touchstart', e=>{
        touchStartY=e.touches[0].clientY;
        swipeWarningActive=(state.currentPage===6 && !state.matchEnded);
    }, {passive:true});
    document.addEventListener('touchmove', e=>{
        if(!swipeWarningActive) return;
        const ty=e.touches[0].clientY;
        const d=ty-touchStartY;
        const n=Date.now();
        if(d>100 && touchStartY<100){
            e.preventDefault(); e.stopPropagation();
            if(n-lastSwipeWarningTime>2000){ showSwipeWarning(); lastSwipeWarningTime=n; }
            return false;
        }
    }, {passive:false});
    document.addEventListener('contextmenu', e=>{
        if(state.currentPage===6 && !state.matchEnded){ e.preventDefault(); return false; }
    });
}

function showSwipeWarning(){
    const ex=document.getElementById('swipe-warning');
    if(ex) ex.remove();
    const w=document.createElement('div');
    w.id='swipe-warning';
    w.innerHTML=`<div style="position:fixed;top:20px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;padding:15px 25px;border-radius:10px;z-index:9999;box-shadow:0 5px 15px rgba(0,0,0,0.3);text-align:center;font-weight:bold;max-width:90%;animation:slideDown 0.3s ease-out;">⚠️ Niet naar beneden swipen!<br><small>Match kan onderbroken worden</small></div>`;
    document.body.appendChild(w);
    setTimeout(()=>{
        if(w.parentNode){ w.style.animation='slideUp 0.3s ease-out'; setTimeout(()=>w.remove(),300); }
    }, 2000);
}
