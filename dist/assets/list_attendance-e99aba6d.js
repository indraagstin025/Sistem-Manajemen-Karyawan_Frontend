import"./input-214ac174.js";import{a as u}from"./AuthServices-0f733033.js";import{A as h}from"./AttendanceServices-788ac82a.js";import{i as x}from"./sidebarHandler-d6522c99.js";import{i as y}from"./logoutHandler-a2e70173.js";import{Q as c}from"./qrCodeHandler-69007ccb.js";import{g as w}from"./photoUtils-c92e179b.js";import{T as f}from"./toastify-85d374dd.js";import"./UserServices-9109671c.js";document.addEventListener("DOMContentLoaded",async()=>{const l=(t,e="success")=>{const s={success:"linear-gradient(to right, #22c55e, #16a34a)",error:"linear-gradient(to right, #ef4444, #dc2626)",info:"linear-gradient(to right, #3b82f6, #2563eb)"}[e];f({text:t,duration:3e3,close:!0,gravity:"top",position:"right",style:{background:s,borderRadius:"8px"}}).showToast()};x(),c.initialize({toastCallback:l}),y({preLogoutCallback:c.close});const i=document.getElementById("userAvatar"),n=document.getElementById("userDropdown"),o=document.getElementById("dropdownMenu"),a=document.getElementById("attendance-list-body"),r=document.getElementById("attendance-empty-state"),d=t=>t?new Date(t).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit"}):"-",p=async()=>{a.innerHTML='<tr><td colspan="6" class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">Memuat data kehadiran...</td></tr>',r.classList.add("hidden");try{const t=await h.getTodaysAttendance();if(t&&t.length>0){a.innerHTML="";for(const e of t){const s=document.createElement("tr"),g=await w(e.user_id,e.user_name,40);s.innerHTML=`
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
                        <div class="text-sm text-gray-900">${d(e.check_in)}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${d(e.check_out)}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${e.status==="Hadir"?"bg-green-100 text-green-800":e.status==="Telat"?"bg-yellow-100 text-yellow-800":"bg-gray-100 text-gray-800"}">
                            ${e.status}
                        </span>
                    </td>
                `,a.appendChild(s)}}else a.innerHTML="",r.classList.remove("hidden")}catch(t){console.error("Error loading today's attendance:",t),a.innerHTML=`<tr><td colspan="6" class="px-6 py-4 whitespace-nowrap text-center text-sm text-red-500">Gagal memuat data kehadiran. ${t.message||""}</td></tr>`,r.classList.add("hidden")}},m=()=>{const t=u.getCurrentUser();if(!t){window.location.href="/src/pages/Auth/login.html";return}if(t.role!=="admin"){alert("Akses ditolak. Anda tidak memiliki izin sebagai admin."),window.location.href="/src/pages/Auth/login.html";return}if(t.photo)i.src=t.photo;else{const e=t.name?t.name.charAt(0).toUpperCase():"AD";i.src=`https://placehold.co/40x40/E2E8F0/4A5568?text=${e}`}};n&&(n.addEventListener("click",()=>{o.classList.toggle("active")}),document.addEventListener("click",t=>{!n.contains(t.target)&&!o.contains(t.target)&&o.classList.remove("active")})),m(),p()});
