// ===== STATE =====
let bookings = JSON.parse(localStorage.getItem('mdw_bookings') || '[]');
let currentStep = 1;
let selectedService = '', selectedPrice = '', selectedPriceNum = 0;
let selectedDate = '', selectedTime = '';
let calYear, calMonth;
const today = new Date();
const ADMIN_PASS = 'derrick2024'; // 👈 Change this to a secure password
let adminLoggedIn = false;
let currentFilter = 'all';
let currentRef = '';

// ===== CONFIG — update these =====
const MIIRO_WHATSAPP = '+256708588116'; // 👈 Replace with your real number
const MIIRO_EMAIL = 'derrickwandyaka@gmail.com';
const MIIRO_MTN = '0776764153'; // 👈 Replace with your MTN MoMo number
const MIIRO_AIRTEL = '0708588116'; // 👈 Replace with your Airtel Money number

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const TIME_SLOTS = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM'];

function saveBookings() { localStorage.setItem('mdw_bookings', JSON.stringify(bookings)); }

// ===== VIEWS =====
function showView(v, btn) {
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.getElementById(v+'-view').classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (v === 'admin') renderAdmin();
}

// ===== STEPS =====
function updateStepUI(step) {
  for (let i=1;i<=5;i++) document.getElementById('step'+i)?.classList.remove('active');
  document.getElementById('step'+step).classList.add('active');
  for (let i=1;i<=4;i++) {
    const sc = document.getElementById('sc'+i);
    if (!sc) continue;
    sc.classList.remove('active','done');
    if (i < step) { sc.classList.add('done'); sc.textContent='✓'; }
    else if (i===step) { sc.classList.add('active'); sc.textContent=i; }
    else sc.textContent=i;
  }
  for (let i=1;i<=3;i++) {
    const sl = document.getElementById('sl'+i);
    if (sl) sl.classList.toggle('done', i < step);
  }
  const sb = document.querySelector('.steps-bar');
  if (sb) sb.style.display = step===5 ? 'none' : 'flex';
}

function nextStep(from) {
  if (from===1 && !selectedService) { alert('Please select a service.'); return; }
  if (from===2) {
    if (!selectedDate) { alert('Please select a date.'); return; }
    if (!selectedTime) { alert('Please select a time slot.'); return; }
  }
  if (from===3) {
    const fn=document.getElementById('fname').value.trim();
    const ln=document.getElementById('lname').value.trim();
    const em=document.getElementById('email').value.trim();
    const ph=document.getElementById('phone').value.trim();
    const ds=document.getElementById('desc').value.trim();
    if (!fn||!ln) { alert('Please enter your full name.'); return; }
    if (!em||!em.includes('@')) { alert('Please enter a valid email.'); return; }
    if (!ph) { alert('Please enter your phone/WhatsApp number.'); return; }
    if (!ds) { alert('Please describe your project.'); return; }
    document.getElementById('sum-service').textContent = selectedService;
    document.getElementById('sum-date').textContent = selectedDate;
    document.getElementById('sum-time').textContent = selectedTime;
    document.getElementById('sum-name').textContent = fn+' '+ln;
    document.getElementById('sum-email').textContent = em;
    document.getElementById('sum-budget').textContent = document.getElementById('budget').value || 'Not specified';
    document.getElementById('sum-price').textContent = selectedPrice;
  }
  currentStep = from+1;
  updateStepUI(currentStep);
  if (from===1) initCalendar();
}

function prevStep(from) { currentStep=from-1; updateStepUI(currentStep); }

function selectService(el, name, price, num) {
  document.querySelectorAll('.service-card').forEach(c=>c.classList.remove('selected'));
  el.classList.add('selected');
  selectedService=name; selectedPrice=price; selectedPriceNum=num;
}

// ===== CALENDAR =====
function initCalendar() { calYear=today.getFullYear(); calMonth=today.getMonth(); renderCal(); }
function changeMonth(dir) {
  calMonth+=dir;
  if (calMonth>11){calMonth=0;calYear++;}
  if (calMonth<0){calMonth=11;calYear--;}
  renderCal();
}
function renderCal() {
  document.getElementById('cal-title').textContent = MONTHS[calMonth]+' '+calYear;
  const grid=document.getElementById('cal-grid');
  grid.innerHTML=DAYS.map(d=>`<div class="cal-day-label">${d}</div>`).join('');
  const first=new Date(calYear,calMonth,1).getDay();
  const days=new Date(calYear,calMonth+1,0).getDate();
  for(let i=0;i<first;i++) grid.innerHTML+=`<div class="cal-day empty"></div>`;
  for(let d=1;d<=days;d++){
    const dt=new Date(calYear,calMonth,d);
    const isPast=dt<new Date(today.getFullYear(),today.getMonth(),today.getDate());
    const isWeekend=dt.getDay()===0||dt.getDay()===6;
    const dateStr=`${MONTHS[calMonth]} ${d}, ${calYear}`;
    const isSel=dateStr===selectedDate;
    const isToday=dt.toDateString()===today.toDateString();
    let cls='cal-day';
    if(isPast||isWeekend) cls+=' past';
    if(isSel) cls+=' selected';
    if(isToday) cls+=' today';
    const click=(isPast||isWeekend)?'':`onclick="selectDate('${dateStr}',this)"`;
    grid.innerHTML+=`<div class="${cls}" ${click}>${d}</div>`;
  }
}
function selectDate(dateStr,el) {
  selectedDate=dateStr; selectedTime='';
  document.querySelectorAll('.cal-day').forEach(d=>d.classList.remove('selected'));
  el.classList.add('selected');
  renderSlots(dateStr);
  document.getElementById('slots-section').style.display='block';
}
function renderSlots(dateStr) {
  const taken=bookings.filter(b=>b.date===dateStr&&b.status!=='cancelled').map(b=>b.time);
  const grid=document.getElementById('slots-grid');
  grid.innerHTML=TIME_SLOTS.map(t=>{
    const isTaken=taken.includes(t);
    const isSel=t===selectedTime;
    return `<div class="slot ${isTaken?'taken':''} ${isSel?'selected':''}" onclick="${isTaken?'':'selectTime(\''+t+'\',this)'}">${t}</div>`;
  }).join('');
}
function selectTime(t,el) {
  selectedTime=t;
  document.querySelectorAll('.slot').forEach(s=>s.classList.remove('selected'));
  el.classList.add('selected');
}

// ===== SUBMIT =====
function submitBooking() {
  const ref='MDW-'+Math.random().toString(36).substr(2,6).toUpperCase();
  const fn=document.getElementById('fname').value.trim();
  const ln=document.getElementById('lname').value.trim();
  const booking={
    ref, service:selectedService, price:selectedPrice, priceNum:selectedPriceNum,
    date:selectedDate, time:selectedTime,
    name:fn+' '+ln,
    email:document.getElementById('email').value.trim(),
    phone:document.getElementById('phone').value.trim(),
    budget:document.getElementById('budget').value||'Not specified',
    desc:document.getElementById('desc').value.trim(),
    status:'new',
    created:new Date().toLocaleString()
  };
  bookings.unshift(booking);
  saveBookings();
  document.getElementById('ref-code').textContent=ref;
  // Set client WhatsApp link to notify Miiro
  const waMsg=encodeURIComponent(`Hi Miiro! I just booked a consultation.\n\nRef: ${ref}\nService: ${selectedService}\nDate: ${selectedDate} at ${selectedTime}\nName: ${fn} ${ln}\n\nLooking forward to working with you!`);
  document.getElementById('client-wa-link').href=`https://wa.me/${MIIRO_WHATSAPP.replace(/\D/g,'')}?text=${waMsg}`;
  currentStep=5; updateStepUI(5);
}

function resetBooking() {
  selectedService=''; selectedPrice=''; selectedPriceNum=0; selectedDate=''; selectedTime='';
  currentStep=1;
  document.querySelectorAll('.service-card').forEach(c=>c.classList.remove('selected'));
  ['fname','lname','email','phone','desc'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('budget').value='';
  document.getElementById('slots-section').style.display='none';
  updateStepUI(1);
}

// ===== ADMIN =====
function adminLogin() {
  if(document.getElementById('admin-pass').value===ADMIN_PASS) {
    adminLoggedIn=true;
    document.getElementById('admin-login').style.display='none';
    document.getElementById('admin-panel').classList.add('active');
    renderAdmin();
  } else {
    document.getElementById('login-err').style.display='block';
  }
}
function adminLogout() {
  adminLoggedIn=false;
  document.getElementById('admin-login').style.display='block';
  document.getElementById('admin-panel').classList.remove('active');
  document.getElementById('admin-pass').value='';
  document.getElementById('login-err').style.display='none';
}
function renderAdmin() {
  if(!adminLoggedIn) return;
  document.getElementById('admin-date-label').textContent=today.toLocaleDateString('en-UG',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  document.getElementById('stat-total').textContent=bookings.length;
  document.getElementById('stat-new').textContent=bookings.filter(b=>b.status==='new').length;
  document.getElementById('stat-confirmed').textContent=bookings.filter(b=>b.status==='confirmed').length;
  document.getElementById('stat-done').textContent=bookings.filter(b=>b.status==='completed').length;
  renderTable();
}
function filterBookings(f,btn) {
  currentFilter=f;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderTable();
}
function renderTable() {
  const list=currentFilter==='all'?bookings:bookings.filter(b=>b.status===currentFilter);
  const tbody=document.getElementById('bookings-tbody');
  const empty=document.getElementById('empty-state');
  if(!list.length){tbody.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  tbody.innerHTML=list.map(b=>`
    <tr>
      <td><code style="font-size:12px;background:#f5f4ef;padding:3px 7px;border-radius:6px;">${b.ref}</code></td>
      <td><div style="font-weight:600;">${b.name}</div><div style="font-size:12px;color:var(--muted);">${b.email}</div></td>
      <td>${b.service}</td>
      <td><div style="font-weight:500;">${b.date}</div><div style="font-size:12px;color:var(--muted);">${b.time}</div></td>
      <td>${b.budget}</td>
      <td><span class="status-badge status-${b.status}">${b.status}</span></td>
      <td>
        <button class="action-btn btn-view-sm" onclick="viewBooking('${b.ref}')">View</button>
        ${b.status==='new'?`<button class="action-btn btn-confirm" onclick="updateStatus('${b.ref}','confirmed')">Confirm</button>`:''}
        ${(b.status==='new'||b.status==='confirmed')?`<button class="action-btn btn-cancel-sm" onclick="updateStatus('${b.ref}','cancelled')">Cancel</button>`:''}
        ${b.status==='confirmed'?`<button class="action-btn btn-view-sm" onclick="updateStatus('${b.ref}','completed')">Done</button>`:''}
        <button class="action-btn btn-invoice" onclick="generateInvoice('${b.ref}')">🧾</button>
        ${b.phone?`<button class="action-btn btn-wa" onclick="openWA('${b.ref}','confirm')">💬</button>`:''}
      </td>
    </tr>
  `).join('');
}
function updateStatus(ref,status) {
  const b=bookings.find(x=>x.ref===ref);
  if(b){b.status=status;saveBookings();renderAdmin();closeModal();}
}

// ===== WHATSAPP =====
function buildWAMessage(b, type) {
  if (type==='confirm') {
    return `Hi ${b.name.split(' ')[0]}! 👋\n\nYour booking with Miiro Derrick Wandyaka has been *confirmed* ✅\n\n📋 *Ref:* ${b.ref}\n🛠 *Service:* ${b.service}\n📅 *Date:* ${b.date}\n⏰ *Time:* ${b.time}\n\nPlease feel free to reach out if you have any questions. See you soon! 🙌\n\n— Miiro`;
  } else {
    return `Hi ${b.name.split(' ')[0]}! 👋\n\nJust following up on your booking (${b.ref}) for *${b.service}* on ${b.date}.\n\nLet me know if you have any questions or want to discuss your project details before our meeting.\n\n— Miiro`;
  }
}

function openWA(ref, type) {
  const b=bookings.find(x=>x.ref===ref);
  if (!b||!b.phone) return;
  const num=b.phone.replace(/\D/g,'');
  const msg=encodeURIComponent(buildWAMessage(b,type));
  window.open(`https://wa.me/${num}?text=${msg}`,'_blank');
}

// ===== VIEW BOOKING MODAL =====
function viewBooking(ref) {
  const b=bookings.find(x=>x.ref===ref);
  if(!b) return;
  currentRef=ref;
  document.getElementById('m-name').textContent=b.name;
  document.getElementById('m-ref').textContent=b.ref+' · '+b.created;
  document.getElementById('m-rows').innerHTML=[
    ['Service',b.service],['Date',b.date],['Time',b.time],
    ['Email',b.email],['Phone/WhatsApp',b.phone||'N/A'],
    ['Budget',b.budget],['Starting Price',b.price],['Status',b.status],
    ['Project',b.desc]
  ].map(([k,v])=>`<div class="modal-row"><span class="mk">${k}</span><span class="mv">${v}</span></div>`).join('');

  // WA preview
  const confirmMsg=buildWAMessage(b,'confirm');
  document.getElementById('wa-msg-preview').textContent=confirmMsg;
  const num=b.phone?b.phone.replace(/\D/g,''):'';
  const confirmLink=num?`https://wa.me/${num}?text=${encodeURIComponent(confirmMsg)}`:'#';
  const followLink=num?`https://wa.me/${num}?text=${encodeURIComponent(buildWAMessage(b,'followup'))}`:'#';
  document.getElementById('wa-confirm-link').href=confirmLink;
  document.getElementById('wa-followup-link').href=followLink;
  if(!num){
    document.getElementById('wa-preview-box').style.display='none';
  } else {
    document.getElementById('wa-preview-box').style.display='block';
  }

  document.getElementById('m-confirm-btn').onclick=()=>updateStatus(b.ref,'confirmed');
  document.getElementById('m-cancel-btn').onclick=()=>updateStatus(b.ref,'cancelled');
  document.getElementById('m-confirm-btn').style.display=b.status==='new'?'':'none';
  document.getElementById('m-cancel-btn').style.display=(b.status==='new'||b.status==='confirmed')?'':'none';
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal(e) {
  if(!e||e.target===document.getElementById('modal-overlay')){
    document.getElementById('modal-overlay').classList.remove('open');
  }
}

// ===== INVOICE GENERATOR =====
function generateInvoice(ref) {
  const b=bookings.find(x=>x.ref===ref);
  if(!b) return;
  const tax=Math.round(b.priceNum*0.18);
  const total=b.priceNum+tax;
  const invNum='INV-'+b.ref.replace('MDW-','');
  const invDate=new Date().toLocaleDateString('en-UG',{year:'numeric',month:'long',day:'numeric'});
  const dueDate=new Date(Date.now()+7*24*60*60*1000).toLocaleDateString('en-UG',{year:'numeric',month:'long',day:'numeric'});

  const html=`
  <div class="invoice-wrap">
    <div class="inv-header">
      <div class="inv-brand">
        <h2>Miiro Derrick Wandyaka</h2>
        <p>Software Developer & Designer<br>Kampala, Uganda<br>${MIIRO_EMAIL}<br>${MIIRO_WHATSAPP}</p>
      </div>
      <div class="inv-meta">
        <h1>INVOICE</h1>
        <p><strong>${invNum}</strong></p>
        <p>Date: ${invDate}</p>
        <p>Due: ${dueDate}</p>
      </div>
    </div>
    <div class="inv-parties">
      <div class="inv-party">
        <h4>Bill To</h4>
        <p><strong>${b.name}</strong><br>${b.email}<br>${b.phone||''}<br>Booking Ref: ${b.ref}</p>
      </div>
      <div class="inv-party">
        <h4>Project</h4>
        <p><strong>${b.service}</strong><br>Consultation: ${b.date} at ${b.time}<br>${b.desc.substring(0,100)}${b.desc.length>100?'...':''}</p>
      </div>
    </div>
    <table class="inv-table">
      <thead><tr><th>Description</th><th>Details</th><th style="text-align:right;">Amount (UGX)</th></tr></thead>
      <tbody>
        <tr>
          <td><strong>${b.service}</strong><br><span style="font-size:13px;color:#666;">${b.desc.substring(0,80)}${b.desc.length>80?'...':''}</span></td>
          <td style="font-size:13px;color:#666;">${b.date}<br>${b.time}</td>
          <td style="text-align:right;font-weight:600;">${b.priceNum.toLocaleString()}</td>
        </tr>
        <tr><td colspan="2" style="font-size:13px;color:#888;">Initial consultation & project scoping</td><td style="text-align:right;font-size:13px;color:#888;">Included</td></tr>
      </tbody>
    </table>
    <div class="inv-totals">
      <div class="inv-total-row"><span>Subtotal</span><span>UGX ${b.priceNum.toLocaleString()}</span></div>
      <div class="inv-total-row"><span>VAT (18%)</span><span>UGX ${tax.toLocaleString()}</span></div>
      <div class="inv-total-row grand"><span>Total Due</span><span>UGX ${total.toLocaleString()}</span></div>
    </div>
    <div class="inv-payment">
      <h4>Payment Instructions</h4>
      <div class="pay-method">
        <span class="pay-badge mtn">MTN MoMo</span>
        <span style="font-size:14px;">Send to <strong>${MIIRO_MTN}</strong> — Name: Miiro Derrick</span>
      </div>
      <div class="pay-method">
        <span class="pay-badge airtel">Airtel Money</span>
        <span style="font-size:14px;">Send to <strong>${MIIRO_AIRTEL}</strong> — Name: Miiro Derrick</span>
      </div>
      <p style="font-size:12px;color:#888;margin-top:8px;">Please use <strong>${invNum}</strong> as the payment reference. Send payment confirmation to ${MIIRO_WHATSAPP}.</p>
    </div>
    <div class="inv-footer">
      <p>Thank you for your business! — Miiro Derrick Wandyaka · Kampala, Uganda</p>
      <p style="margin-top:4px;">This invoice was generated on ${invDate}</p>
    </div>
  </div>`;

  document.getElementById('invoice-print').innerHTML=html;
  // Close modal then print
  document.getElementById('modal-overlay').classList.remove('open');
  setTimeout(()=>window.print(),300);
}

// ===== INIT =====
updateStepUI(1);

// Seed demo data
if(!bookings.length){
  bookings=[
    {ref:'MDW-DEMO1',service:'Web Development',price:'UGX 300,000',priceNum:300000,date:'March 20, 2026',time:'10:00 AM',name:'Sarah Nakato',email:'sarah@gmail.com',phone:'+256772000001',budget:'UGX 200,000 – 500,000',desc:'I need a website for my hair salon in Ntinda with a booking system.',status:'new',created:new Date().toLocaleString()},
    {ref:'MDW-DEMO2',service:'Mobile App',price:'UGX 500,000',priceNum:500000,date:'March 25, 2026',time:'2:00 PM',name:'Joseph Ssemakula',email:'joseph@biz.ug',phone:'+256700000002',budget:'UGX 500,000 – 1,000,000',desc:'Delivery tracking app for my courier business in Kampala.',status:'confirmed',created:new Date().toLocaleString()},
    {ref:'MDW-DEMO3',service:'UI/UX Design',price:'UGX 150,000',priceNum:150000,date:'March 18, 2026',time:'9:00 AM',name:'Grace Akello',email:'grace@co.ug',phone:'+256785000003',budget:'Under UGX 200,000',desc:'Redesign of my NGO website to make it more user-friendly.',status:'completed',created:new Date().toLocaleString()}
  ];
  saveBookings();
}
