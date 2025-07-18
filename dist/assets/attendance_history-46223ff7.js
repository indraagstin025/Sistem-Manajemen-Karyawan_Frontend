import"./input-41369e4a.js";import{A as S}from"./AttendanceServices-f61bdc29.js";import{a as g}from"./AuthServices-f47c4eb9.js";import{T as U}from"./toastify-3acd0462.js";/* empty css                 */import{i as j}from"./sidebarHandler-d6522c99.js";import{i as z}from"./logoutHandler-87b1a96c.js";import{g as _}from"./photoUtils-18d16b34.js";import"./UserServices-7521de91.js";document.addEventListener("DOMContentLoaded",async()=>{feather.replace(),j(),z();const d=document.getElementById("attendanceCardsContainer"),p=document.getElementById("attendanceHistoryMessage"),k=document.getElementById("userAvatar"),T=document.getElementById("dropdownMenu"),b=document.getElementById("userDropdown"),h=document.getElementById("paginationControls"),L=document.getElementById("prevPageBtn"),C=document.getElementById("nextPageBtn"),x=document.getElementById("currentPageInfo"),w=document.getElementById("attendanceSearchInput");let i=1;const l=10;let c=[],s=[];const u=(t,a="success")=>{let n;a==="success"?n="linear-gradient(to right, #22c55e, #16a34a)":a==="error"?n="linear-gradient(to right, #ef4444, #dc2626)":n="linear-gradient(to right, #3b82f6, #2563eb)",U({text:t,duration:3e3,close:!0,gravity:"top",position:"right",stopOnFocus:!0,style:{background:n,borderRadius:"8px",boxShadow:"0 4px 6px rgba(0, 0, 0, 0.1)",padding:"12px 20px"}}).showToast()},D=async()=>{try{let t=g.getCurrentUser();if(!t||!t.id)return null;const a=await _(t.id,t.name||"");return k&&(k.src=a,k.alt=t.name||"User Avatar"),t}catch(t){return console.error("Error fetching employee profile data for header:",t),t.status===401||t.status===403?(u("Sesi tidak valid. Mengarahkan ke halaman login...","error"),setTimeout(()=>g.logout(),2e3)):u(t.message||"Gagal memuat data profil header.","error"),null}},E=async()=>{d.innerHTML=`
            <div class="text-center text-gray-500 py-4">Memuat riwayat absensi...</div>
        `,p.classList.add("hidden"),h.classList.add("hidden");try{const t=g.getCurrentUser();if(!t||t.role!=="karyawan"){u("Akses ditolak. Anda tidak memiliki izin untuk melihat halaman ini.","error"),setTimeout(()=>g.logout(),2e3);return}let a=await S.getMyHistory();Array.isArray(a)||(console.warn("Peringatan: API /attendance/my-history tidak mengembalikan array. Menerima:",a),a=[],u("Peringatan: Format data riwayat absensi tidak valid dari server.","info")),c=a,c.sort((n,o)=>new Date(o.date)-new Date(n.date)),s=[...c],s.length===0?(d.innerHTML=`
                    <div class="text-center text-gray-500 py-4">Tidak ada riwayat absensi yang ditemukan.</div>
                `,p.textContent="Anda belum memiliki riwayat absensi.",p.classList.remove("hidden"),p.classList.add("info")):(f(s,i,l),y(s.length,i,l),s.length>l&&h.classList.remove("hidden"))}catch(t){console.error("Error loading attendance history:",t),d.innerHTML=`
                <div class="text-center text-red-500 py-4">Gagal memuat riwayat absensi: ${t.message}</div>
            `,u(t.message||"Gagal memuat riwayat absensi.","error"),(t.status===401||t.status===403)&&setTimeout(()=>g.logout(),2e3)}},f=(t,a,n)=>{d.innerHTML="";const o=(a-1)*n,v=t.slice(o,o+n);if(v.length===0){d.innerHTML=`
                 <div class="text-center text-gray-500 py-4">Tidak ada riwayat absensi untuk halaman ini.</div>
             `;return}v.forEach((e,A)=>{const M=new Date(e.date+"T00:00:00").toLocaleDateString("id-ID",{year:"numeric",month:"long",day:"numeric"}),$=(m=>{switch(m.toLowerCase()){case"hadir":return"hadir";case"terlambat":return"terlambat";case"izin":return"izin";case"sakit":return"terlambat";case"cuti":return"cuti";case"libur":return"libur";case"tidak absen":return"tidak-absen";case"alpha":return"alpha";default:return""}})(e.status||""),B=e.check_in&&e.check_in.trim()!==""?e.check_in:'<span class="empty-note">-</span>';let r="";if(e.status==="Sakit"||e.status==="Cuti")e.reason&&e.note&&e.note.startsWith("Disetujui:")?r=`Alasan: ${e.reason}. Catatan Admin: ${e.note.replace("Disetujui: ","")}`:e.reason?(r=`Alasan: ${e.reason}`,e.note&&e.note.trim()!==""&&e.note!=="-"&&(r+=`. Catatan Admin: ${e.note}`)):e.note&&e.note.trim()!==""&&e.note!=="-"&&(r=e.note);else if(e.status==="Tidak Absen"||e.status==="Alpha")if(e.note&&e.note.includes("Pengajuan ditolak:")){const m=e.note.match(/Pengajuan ditolak: (.*?)\. Catatan admin: (.*)/);m?r=`Ditolak. Alasan: ${m[1]}. Catatan Admin: ${m[2]}`:e.reason&&e.reason.trim()!==""?r=`Ditolak. Alasan: ${e.reason}. Catatan Admin: ${e.note}`:e.note&&e.note.trim()!==""&&e.note!=="-"&&(r=e.note)}else e.note&&e.note.trim()!==""&&e.note!=="-"&&(r=e.note);else e.note&&e.note.trim()!==""&&e.note!=="-"&&(r=e.note);const P=!r.trim()||r==="-"?'<span class="empty-note">Tidak ada catatan</span>':`<span>${r}</span>`,H=`
                <div class="attendance-card">
                    <div class="card-no-col">
                        <span class="no-label">No</span>
                        <span class="no-value">${o+A+1}</span>
                    </div>
                    <div class="card-details-col">
                        <div class="attendance-data-item">
                            <span class="data-label">Tanggal</span>
                            <span class="data-value">${M}</span>
                        </div>
                        <div class="attendance-data-item">
                            <span class="data-label">Masuk Jam</span>
                            <span class="data-value">${B}</span>
                        </div>
                        <div class="attendance-data-item">
                            <span class="data-label">Status</span>
                            <span class="data-value">
                                <span class="status-badge ${$}">
                                    ${e.status||"-"}
                                </span>
                            </span>
                        </div>
                        <div class="attendance-data-item note-item">
                            <span class="data-label">Catatan</span>
                            <span class="data-value">${P}</span>
                        </div>
                    </div>
                </div>
            `;d.insertAdjacentHTML("beforeend",H)}),feather.replace()},y=(t,a,n)=>{const o=Math.ceil(t/n);x.textContent=`Halaman ${a} dari ${o}`,L.disabled=a===1,C.disabled=a===o||o===0,t>n?h.classList.remove("hidden"):h.classList.add("hidden")},I=()=>{const t=w.value.toLowerCase().trim();t===""?s=[...c]:s=c.filter(a=>{const n=new Date(a.date+"T00:00:00").toLocaleDateString("id-ID",{year:"numeric",month:"long",day:"numeric"}).toLowerCase(),o=(a.check_in||"").toLowerCase(),v=(a.status||"").toLowerCase(),e=(a.note||"").toLowerCase(),A=(a.reason||"").toLowerCase();return n.includes(t)||o.includes(t)||v.includes(t)||e.includes(t)||A.includes(t)}),i=1,f(s,i,l),y(s.length,i,l),s.length===0&&t!==""&&(d.innerHTML=`
                <div class="text-center text-gray-500 py-4">Tidak ada riwayat absensi yang cocok dengan pencarian Anda.</div>
            `)};w&&w.addEventListener("input",I),L&&L.addEventListener("click",()=>{i>1&&(i--,f(s,i,l),y(s.length,i,l))}),C&&C.addEventListener("click",()=>{const t=Math.ceil(s.length/l);i<t&&(i++,f(s,i,l),y(s.length,i,l))}),b&&(b.addEventListener("click",()=>{T.classList.toggle("active")}),document.addEventListener("click",t=>{b.contains(t.target)||T.classList.remove("active")})),D(),E()});
