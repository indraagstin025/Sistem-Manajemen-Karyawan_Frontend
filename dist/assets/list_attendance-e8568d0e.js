import"./input-41369e4a.js";import{a as x}from"./AuthServices-f47c4eb9.js";import{A as w}from"./AttendanceServices-f61bdc29.js";import{i as f}from"./sidebarHandler-d6522c99.js";import{i as v}from"./logoutHandler-87b1a96c.js";import{Q as l}from"./qrCodeHandler-01879f51.js";import{g as m}from"./photoUtils-18d16b34.js";import{T as b}from"./toastify-3acd0462.js";/* empty css                 */import"./UserServices-7521de91.js";document.addEventListener("DOMContentLoaded",async()=>{const p=(t,e="success")=>{const i={success:"linear-gradient(to right, #22c55e, #16a34a)",error:"linear-gradient(to right, #ef4444, #dc2626)",info:"linear-gradient(to right, #3b82f6, #2563eb)"}[e];b({text:t,duration:3e3,close:!0,gravity:"top",position:"right",style:{background:i,borderRadius:"8px"}}).showToast()};f(),l.initialize({toastCallback:p}),v({preLogoutCallback:l.close});const n=document.getElementById("userAvatar"),d=document.getElementById("userNameNav"),s=document.getElementById("userDropdown"),r=document.getElementById("dropdownMenu"),a=document.getElementById("attendance-list-body"),o=document.getElementById("attendance-empty-state"),u=t=>t||"-",g=t=>{switch(t){case"Hadir":return"bg-green-100 text-green-800";case"Terlambat":return"bg-yellow-100 text-yellow-800";case"Sakit":return"bg-blue-100 text-blue-800";case"Cuti":return"bg-purple-100 text-purple-800";case"Alpha":return"bg-red-100 text-red-800";default:return"bg-gray-100 text-gray-800"}},h=async()=>{a.innerHTML='<tr><td colspan="5" class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">Memuat data kehadiran...</td></tr>',o.classList.add("hidden");try{const t=await w.getTodaysAttendance();if(t&&t.length>0){a.innerHTML="";for(const e of t){const i=await m(e.user_id,e.user_name,40),c=document.createElement("tr");c.innerHTML=`
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <img class="h-10 w-10 rounded-full mr-3 object-cover" src="${i}" alt="${e.user_name}">
                                <div class="text-sm font-medium text-gray-900">${e.user_name||"N/A"}</div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">${e.user_department||"N/A"}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">${e.user_position||"N/A"}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">${u(e.check_in)}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${g(e.status)}">
                                ${e.status}
                            </span>
                        </td>
                    `,a.appendChild(c)}}else a.innerHTML="",o.classList.remove("hidden")}catch(t){console.error("Error loading today's attendance:",t),a.innerHTML=`<tr><td colspan="5" class="px-6 py-4 whitespace-nowrap text-center text-sm text-red-500">Gagal memuat data kehadiran. ${t.message||""}</td></tr>`,o.classList.add("hidden")}},y=async()=>{const t=x.getCurrentUser();if(!t){window.location.href="/src/pages/Auth/login.html";return}if(t.role!=="admin"){alert("Akses ditolak. Anda tidak memiliki izin sebagai admin."),window.location.href="/src/pages/Auth/login.html";return}const e=await m(t.id,t.name,40);n&&(n.src=e,n.alt=t.name||"Admin"),d&&(d.textContent=t.name||"Admin")};s&&(s.addEventListener("click",()=>{r.classList.toggle("active")}),document.addEventListener("click",t=>{!s.contains(t.target)&&!r.contains(t.target)&&r.classList.remove("active")})),y(),h()});
