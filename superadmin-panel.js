//  SUPER ADMIN PANEL
// ══════════════════════════════════════════════════════
async function renderSuperAdminPanel(){
  const c=document.getElementById('panelContent');
  c.className='panel-anim';
  c.innerHTML='<div class="card" style="text-align:center;color:var(--text2);">Loading clubs…</div>';
  let clubs=[];
  try{ clubs=await saListClubs(); }
  catch(e){ c.innerHTML='<div class="card" style="color:var(--red);">Failed to load clubs.</div>'; return; }

  const rows = clubs.length
    ? clubs.map(cl=>`
      <div class="card" style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;">
          <div>
            <div style="font-weight:700;font-size:0.95rem;">${cl.name}${cl.active?'':' <span style="color:var(--red);font-size:0.7rem;">(inactive)</span>'}</div>
            <div style="font-size:0.72rem;color:var(--text3);margin-top:2px;">ID: ${cl.id}${cl.created?' · Created: '+new Date(cl.created).toLocaleDateString():''}</div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <a class="btn btn-ghost btn-sm" href="?club=${encodeURIComponent(cl.id)}" target="_blank" rel="noopener">Open</a>
            <button class="btn btn-ghost btn-sm" onclick="saResetPwPrompt('${cl.id}','${cl.name.replace(/'/g,"\\'")}')">Reset Passwords</button>
            <button class="btn ${cl.active?'btn-ghost':'btn-green'} btn-sm" onclick="saToggleActive('${cl.id}',${cl.active})">${cl.active?'Deactivate':'Activate'}</button>
            <button class="btn btn-red btn-sm" onclick="saDeletePrompt('${cl.id}','${cl.name.replace(/'/g,"\\'")}')">Delete</button>
          </div>
        </div>
      </div>`).join('')
    : '<div class="card" style="text-align:center;color:var(--text2);">No clubs yet. Create the first one below.</div>';

  c.innerHTML = `
    <div class="card-title">🛡️ Super Admin — Clubs (${clubs.length})</div>
    ${rows}
    <button class="btn btn-gold btn-full" style="margin-top:6px;" onclick="saCreateClubPrompt()">➕ New Club</button>
    <button class="btn btn-ghost btn-full" style="margin-top:8px;" onclick="saChangeSuperPwPrompt()">🔑 Change Super Admin Password</button>
  `;
}

window.saCreateClubPrompt=function(){
  openModal('New Club', `
    <div class="field">
      <label>Club ID (used in the shareable URL — letters/numbers only, no spaces)</label>
      <div style="display:flex;gap:6px;">
        <input type="text" id="saNewClubId" placeholder="e.g. alanya-7k2p" autocapitalize="off" autocomplete="off" style="flex:1;">
        <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('saNewClubId').value=genStrongPassword(7).toLowerCase();">🎲</button>
      </div>
      <div style="font-size:0.68rem;color:var(--text3);margin-top:3px;">Tip: adding a random suffix (e.g. -7k2p) makes the club harder to find by guessing.</div>
    </div>
    <div class="field">
      <label>Club Name</label>
      <input type="text" id="saNewClubName" placeholder="e.g. Alanya Bridge Club">
    </div>
    <div style="font-weight:600;color:var(--gold);font-size:0.82rem;margin:14px 0 8px;">Club Passwords</div>
    <div class="field">
      <label>Admin Password (min 4 characters)</label>
      <div style="display:flex;gap:6px;">
        <input type="password" id="saNewClubAdminPw" placeholder="Admin password" autocomplete="off" style="flex:1;">
        <button type="button" class="btn btn-ghost btn-sm" onclick="fillGeneratedPw('saNewClubAdminPw')">🎲 Generate</button>
      </div>
    </div>
    <div class="field">
      <label>Table Password (min 4 characters)</label>
      <div style="display:flex;gap:6px;">
        <input type="password" id="saNewClubTablePw" placeholder="Table password" autocomplete="off" style="flex:1;">
        <button type="button" class="btn btn-ghost btn-sm" onclick="fillGeneratedPw('saNewClubTablePw')">🎲 Generate</button>
      </div>
      <div style="font-size:0.68rem;color:var(--text3);margin-top:3px;">Passwords are required — write them down, there is no default fallback.</div>
    </div>
    <div class="login-err" id="saCreateErr"></div>
  `, `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-gold" onclick="saCreateClubSubmit()">Create</button>
  `);
};

window.saCreateClubSubmit=async function(){
  const errEl=document.getElementById('saCreateErr');
  errEl.textContent='';
  const idRaw=(document.getElementById('saNewClubId').value||'').trim();
  const name=(document.getElementById('saNewClubName').value||'').trim();
  const adminPw=(document.getElementById('saNewClubAdminPw').value||'').trim();
  const tablePw=(document.getElementById('saNewClubTablePw').value||'').trim();
  const id=idRaw.toLowerCase().replace(/[^a-z0-9-]/g,'');
  if(!id){errEl.textContent='❌ Enter a valid Club ID';return;}
  if(!name){errEl.textContent='❌ Enter a club name';return;}
  if(!adminPw||adminPw.length<4){errEl.textContent='❌ Admin password must be at least 4 characters';return;}
  if(!tablePw||tablePw.length<4){errEl.textContent='❌ Table password must be at least 4 characters';return;}
  if(adminPw===tablePw){errEl.textContent='❌ Admin and table passwords must be different';return;}
  try{
    await saCreateClub(id,name,adminPw,tablePw);
    closeModal();
    toast('✅ Club created: '+name);
    renderSuperAdminPanel();
  }catch(e){ errEl.textContent='❌ '+e.message; }
};

window.saToggleActive=async function(id,currentlyActive){
  try{
    await saSetClubActive(id,!currentlyActive);
    toast(currentlyActive?'⏸ Club deactivated':'▶ Club activated');
    renderSuperAdminPanel();
  }catch(e){ toast('❌ Failed: '+e.message); }
};

window.saResetPwPrompt=function(id,name){
  openModal('Reset Passwords', `
    <div style="font-size:0.85rem;color:var(--text2);margin-bottom:10px;">
      Set new admin and table passwords for <b>${name}</b>.
    </div>
    <div class="field">
      <label>New Admin Password (min 4 characters)</label>
      <div style="display:flex;gap:6px;">
        <input type="password" id="saResetAdminPw" placeholder="Admin password" autocomplete="off" style="flex:1;">
        <button type="button" class="btn btn-ghost btn-sm" onclick="fillGeneratedPw('saResetAdminPw')">🎲</button>
      </div>
    </div>
    <div class="field">
      <label>New Table Password (min 4 characters)</label>
      <div style="display:flex;gap:6px;">
        <input type="password" id="saResetTablePw" placeholder="Table password" autocomplete="off" style="flex:1;">
        <button type="button" class="btn btn-ghost btn-sm" onclick="fillGeneratedPw('saResetTablePw')">🎲</button>
      </div>
    </div>
    <div class="login-err" id="saResetErr"></div>
  `, `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-red" onclick="saResetPwSubmit('${id}')">Reset</button>
  `);
};
window.saResetPwSubmit=async function(id){
  const errEl=document.getElementById('saResetErr');
  const adminPw=(document.getElementById('saResetAdminPw').value||'').trim();
  const tablePw=(document.getElementById('saResetTablePw').value||'').trim();
  if(!adminPw||adminPw.length<4){errEl.textContent='❌ Admin password must be at least 4 characters';return;}
  if(!tablePw||tablePw.length<4){errEl.textContent='❌ Table password must be at least 4 characters';return;}
  if(adminPw===tablePw){errEl.textContent='❌ Admin and table passwords must be different';return;}
  try{
    await saResetClubPasswords(id,adminPw,tablePw);
    closeModal();
    toast('✅ Passwords updated');
  }catch(e){ errEl.textContent='❌ '+e.message; }
};

window.saDeletePrompt=function(id,name){
  openModal('Delete Club', `
    <div style="font-size:0.85rem;color:var(--red);margin-bottom:6px;">
      This permanently deletes <b>${name}</b> and all of its tournament data. This cannot be undone.
    </div>
  `, `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-red" onclick="saDeleteSubmit('${id}')">Delete Permanently</button>
  `);
};
window.saDeleteSubmit=async function(id){
  try{
    await saDeleteClub(id);
    closeModal();
    toast('🗑 Club deleted');
    renderSuperAdminPanel();
  }catch(e){ toast('❌ Failed: '+e.message); }
};

window.saChangeSuperPwPrompt=function(){
  openModal('Change Super Admin Password', `
    <div class="field">
      <label>New Password (min 4 characters)</label>
      <div style="display:flex;gap:6px;">
        <input type="password" id="saNewSuperPw" placeholder="New password" style="flex:1;">
        <button type="button" class="btn btn-ghost btn-sm" onclick="fillGeneratedPw('saNewSuperPw')">🎲</button>
      </div>
    </div>
    <div class="login-err" id="saPwErr"></div>
  `, `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-gold" onclick="saChangeSuperPwSubmit()">Save</button>
  `);
};
window.saChangeSuperPwSubmit=async function(){
  const errEl=document.getElementById('saPwErr');
  const pw=(document.getElementById('saNewSuperPw').value||'').trim();
  if(!pw||pw.length<4){errEl.textContent='❌ Use at least 4 characters';return;}
  try{
    await saveSuperPassword(pw);
    closeModal();
    toast('✅ Super Admin password updated');
  }catch(e){ errEl.textContent='❌ '+e.message; }
};

// ══════════════════════════════════════════════════════
