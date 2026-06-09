// js/navigation.js
function showPage(pn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page${pn}`).classList.add('active');
    state.currentPage = pn;
    document.querySelectorAll('.page').forEach(p => {
        if(p.id!=='page6'){ p.style.overflowY='auto'; p.style.overflow='auto'; p.style.touchAction='auto'; }
    });
    
    if(pn===1){
        document.querySelectorAll('.selection-option').forEach(o=>o.classList.remove('selected'));
        document.querySelectorAll('.category-option').forEach(o=>o.classList.remove('selected'));
        state.selectedGameType=null; state.selectedCategory=null;
        const pf=document.getElementById('adminPassword');
        if(pf.style.display==='block'){ pf.style.display='none'; pf.value=''; document.querySelector('.upload-btn').textContent='📤 Beheer Matchen'; }
    } else if(pn===4){
        loadFilteredMatches();
    } else if(pn===5){
        updateBallSelectionPage();
    } else if(pn===7){
        loadMatchesTabContent();
    } else if(pn===8){
        selectedDiscipline=null; selectedPlayerCategory=null;
        document.querySelectorAll('#page8 .selection-option').forEach(o=>o.classList.remove('selected'));
        document.querySelectorAll('#page8 .category-option').forEach(o=>o.classList.remove('selected'));
        updatePlayerFilterStatus();
        loadPlayersList();
    } else if(pn===9){
        setupNewMatchPage();
    } else if(pn===10){
        const c=document.getElementById('page10');
        const s=c.querySelector('.data-transfer-section');
        if(s){
            s.innerHTML=s.innerHTML
                .replace(/\${state\.players\.length}/g, state.players.length)
                .replace(/\${state\.matches\.filter\(m=>!m\.completed\)\.length}/g, state.matches.filter(m=>!m.completed).length)
                .replace(/\${state\.matches\.filter\(m=>m\.completed\)\.length}/g, state.matches.filter(m=>m.completed).length)
                .replace(/\${state\.downloadedMatches\.length}/g, state.downloadedMatches.length);
        }
    }
}

function goToPage2(){
    const d=document.getElementById('dateSelect');
    if(!d.value){ alert("Selecteer eerst een datum!"); return; }
    state.selectedDate=d.value;
    showPage(2);
}

function selectGameType(gt){
    state.selectedGameType=gt;
    document.querySelectorAll('.selection-option').forEach(o=>o.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    setTimeout(()=>showPage(3), 300);
}

function selectCategory(c){
    state.selectedCategory=c;
    document.querySelectorAll('.category-option').forEach(o=>o.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    setTimeout(()=>showPage(4), 300);
}
