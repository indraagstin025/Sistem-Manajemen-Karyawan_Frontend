import"./input-15de07a3.js";import{a as h}from"./AuthServices-0f733033.js";import{A as x}from"./AttendanceServices-9bf2f837.js";import{i as y}from"./sidebarHandler-d6522c99.js";import{i as w}from"./logoutHandler-a2e70173.js";import{Q as d}from"./qrCodeHandler-3c60f548.js";import{g as f}from"./photoUtils-c92e179b.js";import{T as b}from"./toastify-3acd0462.js";/* empty css                 */import"./UserServices-9109671c.js";document.addEventListener("DOMContentLoaded",async()=>{const c=(t,e="success")=>{const s={success:"linear-gradient(to right, #22c55e, #16a34a)",error:"linear-gradient(to right, #ef4444, #dc2626)",info:"linear-gradient(to right, #3b82f6, #2563eb)"}[e];b({text:t,duration:3e3,close:!0,gravity:"top",position:"right",style:{background:s,borderRadius:"8px"}}).showToast()};y(),d.initialize({toastCallback:c}),w({preLogoutCallback:d.close});const i=document.getElementById("userAvatar"),r=document.getElementById("userDropdown"),n=document.getElementById("dropdownMenu"),a=document.getElementById("attendance-list-body"),o=document.getElementById("attendance-empty-state"),l=t=>t||"-",p=t=>{switch(t){case"Hadir":return"bg-green-100 text-green-800";case"Terlambat":return"bg-yellow-100 text-yellow-800";case"Sakit":return"bg-blue-100 text-blue-800";case"Cuti":return"bg-purple-100 text-purple-800";case"Alpha":return"bg-red-100 text-red-800";default:return"bg-gray-100 text-gray-800"}},m=async()=>{a.innerHTML='<tr><td colspan="5" class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">Memuat data kehadiran...</td></tr>',o.classList.add("hidden");try{const t=await x.getTodaysAttendance();if(t&&t.length>0){a.innerHTML="";for(const e of t){const s=document.createElement("tr"),g=await f(e.user_id,e.user_name,40);s.innerHTML=`
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <img class="h-10 w-10 rounded-full mr-3 object-cover" src="${g}" alt="${e.user_name}">
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
                        <div class="text-sm text-gray-900">${l(e.check_in)}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p(e.status)}">
                            ${e.status}
                        </span>
                    </td>
                `,a.appendChild(s)}}else a.innerHTML="",o.classList.remove("hidden")}catch(t){console.error("Error loading today's attendance:",t),a.innerHTML=`<tr><td colspan="5" class="px-6 py-4 whitespace-nowrap text-center text-sm text-red-500">Gagal memuat data kehadiran. ${t.message||""}</td></tr>`,o.classList.add("hidden")}},u=()=>{const t=h.getCurrentUser();if(!t){window.location.href="/src/pages/Auth/login.html";return}if(t.role!=="admin"){alert("Akses ditolak. Anda tidak memiliki izin sebagai admin."),window.location.href="/src/pages/Auth/login.html";return}if(t.photo)i.src=t.photo;else{const e=t.name?t.name.charAt(0).toUpperCase():"AD";i.src=`https://placehold.co/40x40/E2E8F0/4A5568?text=${e}`}};r&&(r.addEventListener("click",()=>{n.classList.toggle("active")}),document.addEventListener("click",t=>{!r.contains(t.target)&&!n.contains(t.target)&&n.classList.remove("active")})),u(),m()});
